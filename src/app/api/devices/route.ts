import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const apiKey = process.env.TAILSCALE_API_KEY;
    
    if (!apiKey) {
      return NextResponse.json(
        { error: 'TAILSCALE_API_KEY not configured' },
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
      return NextResponse.json(
        { error: `Tailscale API error: ${response.status}` },
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
