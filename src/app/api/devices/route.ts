import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    // Get and trim API key to handle any whitespace
    const rawKey = process.env.TAILSCALE_API_KEY || '';
    const apiKey = rawKey.trim();
    
    // Debug: Check env vars (without exposing sensitive data)
    const allEnvVars = Object.keys(process.env).filter(k => k.includes('TAILSCALE') || k.includes('API'));
    console.log('[API] Available env vars:', allEnvVars);
    
    // Debug: Check if env var exists
    const keyExists = !!apiKey;
    const keyLength = apiKey.length;
    const keyPrefix = apiKey ? apiKey.substring(0, 15) + '...' : 'none';
    const keyFormat = apiKey.startsWith('tskey-api-') ? 'api-key' : 
                      apiKey.startsWith('tskey-') ? 'auth-key' : 'unknown';
    
    console.log(`[API] Key exists: ${keyExists}, length: ${keyLength}, format: ${keyFormat}, prefix: ${keyPrefix}`);
    
    if (!apiKey) {
      return NextResponse.json(
        { 
          error: 'TAILSCALE_API_KEY not configured',
          hint: 'Add TAILSCALE_API_KEY to Vercel Environment Variables',
          envVarsFound: allEnvVars,
          rawKeyLength: rawKey.length
        },
        { status: 500 }
      );
    }

    const response = await fetch('https://api.tailscale.com/api/v2/tailnet/-/devices', {
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      cache: 'no-store',
    });

    if (!response.ok) {
      const errorText = await response.text().catch(() => 'No error details');
      console.log(`[API] Tailscale API error: ${response.status}`, errorText);
      
      // For 401, the key is reaching Tailscale but being rejected
      // This could be: wrong key type, expired key, or key doesn't have device:read scope
      return NextResponse.json(
        { 
          error: `Tailscale API returned ${response.status}`,
          detail: errorText,
          keyInfo: {
            configured: keyExists,
            format: keyFormat,
            length: keyLength,
            prefix: keyPrefix,
          },
          hint: response.status === 401 
            ? 'Key is reaching Tailscale but rejected. Try: 1) Generate NEW key, 2) Ensure key type is "API access token" not auth key, 3) Verify key has "Devices: Read" scope' 
            : 'Check API permissions'
        },
        { status: response.status }
      );
    }

    const data = await response.json();
    
    // Extract all devices with their IPs (not just online ones)
    const allDevices = data.devices || [];
    
    // Map all devices with Tailscale IPs (100.x.x.x)
    const devicesWithIPs = allDevices
      .map((d: any) => ({
        name: d.name,
        hostname: d.hostname,
        ips: (d.addresses || []).filter((ip: string) => ip.startsWith('100.')),
        os: d.os,
        online: d.online,
        lastSeen: d.lastSeen,
      }))
      .filter((d: any) => d.ips.length > 0); // Only devices with Tailscale IPs

    return NextResponse.json({
      total: allDevices.length,
      withTailscaleIPs: devicesWithIPs.length,
      onlineCount: devicesWithIPs.filter((d: any) => d.online).length,
      devices: devicesWithIPs,
    });
  } catch (error) {
    console.error('Error fetching devices:', error);
    return NextResponse.json(
      { error: 'Failed to fetch devices' },
      { status: 500 }
    );
  }
}
