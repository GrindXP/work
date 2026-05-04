'use client';

import { useState, useEffect } from 'react';

interface Device {
  name: string;
  hostname: string;
  ips: string[];
  os: string;
}

interface DevicesResponse {
  total: number;
  active: number;
  devices: Device[];
  error?: string;
}

export default function Home() {
  const [devices, setDevices] = useState<DevicesResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchDevices = async () => {
    setLoading(true);
    setError(null);
    
    try {
      // Call local API route (uses TAILSCALE_API_KEY server-side)
      const response = await fetch('/api/devices', {
        cache: 'no-store',
      });

      const data = await response.json();

      if (!response.ok) {
        setError(data.error || 'Failed to fetch devices');
        setDevices(null);
        setLoading(false);
        return;
      }

      setDevices(data);
    } catch (err) {
      setError('Network error');
      setDevices(null);
    } finally {
      setLoading(false);
    }
  };

  // Auto-fetch on load
  useEffect(() => {
    fetchDevices();
  }, []);

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <main className="max-w-4xl mx-auto p-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
            Tailscale Devices
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            View currently active Tailscale devices and their IPs
          </p>
        </div>

        <div className="mb-6 flex gap-4">
          <button
            onClick={fetchDevices}
            disabled={loading}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {loading ? 'Loading...' : 'Refresh Devices'}
          </button>
          
          <a
            href="/api/devices"
            target="_blank"
            className="px-4 py-2 bg-gray-200 text-gray-800 rounded-lg hover:bg-gray-300 transition-colors flex items-center"
          >
            API JSON
          </a>
        </div>

        {error && (
          <div className="p-4 mb-6 bg-red-100 border border-red-300 text-red-800 rounded-lg">
            <strong>Error:</strong> {error}
          </div>
        )}

        {devices && (
          <div className="mb-4 text-sm text-gray-600 dark:text-gray-400">
            <span className="font-medium">{devices.active}</span> active devices out of{' '}
            <span className="font-medium">{devices.total}</span> total
          </div>
        )}

        {devices?.devices && devices.devices.length > 0 ? (
          <div className="grid gap-4">
            {devices.devices.map((device, index) => (
              <div
                key={index}
                className="p-6 bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700"
              >
                <div className="flex items-start justify-between">
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                      {device.hostname}
                    </h3>
                    <p className="text-sm text-gray-500 dark:text-gray-400">{device.name}</p>
                  </div>
                  <span className="px-2 py-1 text-xs font-medium bg-green-100 text-green-800 rounded-full">
                    Online
                  </span>
                </div>

                <div className="mt-4 space-y-2">
                  <div className="text-sm">
                    <span className="font-medium text-gray-700 dark:text-gray-300">OS:</span>{' '}
                    <span className="text-gray-600 dark:text-gray-400">{device.os}</span>
                  </div>

                  <div className="text-sm">
                    <span className="font-medium text-gray-700 dark:text-gray-300">Tailscale IPs:</span>
                    <div className="mt-1 flex flex-wrap gap-2">
                      {device.ips.map((ip, ipIndex) => (
                        <code
                          key={ipIndex}
                          className="px-2 py-1 bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-200 rounded font-mono text-sm"
                        >
                          {ip}
                        </code>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          !loading && !error && (
            <div className="p-8 text-center text-gray-500 dark:text-gray-400 bg-white dark:bg-gray-800 rounded-lg border border-dashed border-gray-300 dark:border-gray-700">
              No active devices found
            </div>
          )
        )}
      </main>
    </div>
  );
}
