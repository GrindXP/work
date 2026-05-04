import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const apiKey = process.env.TAILSCALE_API_KEY;
    
    // Debug: Check if env var exists (without exposing the key)
    const keyExists = !!apiKey;
    const keyLength = apiKey?.length || 0;
    const keyPrefix = apiKey ? apiKey.substring(0, 10) + '...' : 'none';
    
    console.log(`[API] TAILSCALE_API_KEY exists: ${keyExists}, length: ${keyLength}, prefix: ${keyPrefix}`);
    
    if (!apiKey) {
      return NextResponse.json(
        { 
          error: 'TAILSCALE_API_KEY not configured',
          debug: { keyExists, keyLength }
        },
        { status: 500 }
      );
    }

    const response = await fetch('https://api.tailscale.com/api/v2/tailnet/-/devices', {
      headers: {
        'Authorization': `Bearer ${apiKey}`,
      },
      cache: 'no-store',
    });

    if (!response.ok) {
      const errorText = await response.text().catch(() => 'No error details');
      console.log(`[API] Tailscale API error: ${response.status}`, errorText);
      
      // Provide helpful error messages
      let errorMessage = `Tailscale API error: ${response.status}`;
      if (response.status === 401) {
        errorMessage = 'Invalid Tailscale API key (401). Generate a new key at https://login.tailscale.com/admin/settings/keys';
      } else if (response.status === 403) {
        errorMessage = 'API key lacks permissions (403). Ensure key has "Read" access to devices.';
      }
      
      return NextResponse.json(
        { 
          error: errorMessage,
          status: response.status,
          keyConfigured: keyExists,
          keyPrefix: keyPrefix
        },
        { status: response.status }
      );
    }

    const data = await response.json();
    
    // Extract active devices with their IPs
    const devices = data.devices?.map((device: any) => ({
      name: device.name,
      hostname: device.hostname,
      addresses: device.addresses,
      os: device.os,
      online: device.online,
      lastSeen: device.lastSeen,
    })) || [];

    // Filter only online devices and extract IPs
    const activeDevices = devices
      .filter((d: any) => d.online)
      .map((d: any) => ({
        name: d.name,
        hostname: d.hostname,
        ips: d.addresses.filter((ip: string) => ip.startsWith('100.')),
        os: d.os,
      }));

    return NextResponse.json({
      total: devices.length,
      active: activeDevices.length,
      devices: activeDevices,
    });
  } catch (error) {
    console.error('Error fetching devices:', error);
    return NextResponse.json(
      { error: 'Failed to fetch devices' },
      { status: 500 }
    );
  }
}
