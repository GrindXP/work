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

// Get API key from environment or prompt
const getApiKey = () => {
  if (typeof window !== 'undefined') {
    // Try to get from localStorage first
    const stored = localStorage.getItem('TAILSCALE_API_KEY');
    if (stored) return stored;
  }
  // Otherwise use env (will be empty in browser without build-time env var)
  return process.env.NEXT_PUBLIC_TAILSCALE_API_KEY || '';
};

export default function Home() {
  const [devices, setDevices] = useState<DevicesResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [apiKey, setApiKey] = useState('');

  useEffect(() => {
    setApiKey(getApiKey());
  }, []);

  const saveApiKey = (key: string) => {
    setApiKey(key);
    localStorage.setItem('TAILSCALE_API_KEY', key);
  };

  const fetchDevices = async () => {
    setLoading(true);
    setError(null);
    
    const key = apiKey || getApiKey();
    if (!key) {
      setError('Please enter your Tailscale API key');
      setLoading(false);
      return;
    }

    try {
      const response = await fetch('https://api.tailscale.com/api/v2/tailnet/-/devices', {
        headers: {
          'Authorization': `Bearer ${key}`,
        },
      });

      if (!response.ok) {
        if (response.status === 401) {
          setError('Invalid API key. Please check your Tailscale API key.');
        } else {
          setError(`Tailscale API error: ${response.status}`);
        }
        setDevices(null);
        setLoading(false);
        return;
      }

      const data = await response.json();
      
      // Extract active devices with their IPs
      const allDevices = data.devices?.map((device: any) => ({
        name: device.name,
        hostname: device.hostname,
        addresses: device.addresses,
        os: device.os,
        online: device.online,
      })) || [];

      // Filter only online devices and extract Tailscale IPs
      const activeDevices = allDevices
        .filter((d: any) => d.online)
        .map((d: any) => ({
          name: d.name,
          hostname: d.hostname,
          ips: d.addresses.filter((ip: string) => ip.startsWith('100.')),
          os: d.os,
        }));

      setDevices({
        total: allDevices.length,
        active: activeDevices.length,
        devices: activeDevices,
      });
    } catch (err) {
      setError('Network error');
      setDevices(null);
    } finally {
      setLoading(false);
    }
  };

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

        {/* API Key Input */}
        <div className="mb-6 p-4 bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700">
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Tailscale API Key
          </label>
          <div className="flex gap-2">
            <input
              type="password"
              value={apiKey}
              onChange={(e) => saveApiKey(e.target.value)}
              placeholder="tskey-api-xxxxxxxx"
              className="flex-1 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
            />
          </div>
          <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
            Get your API key from{' '}
            <a 
              href="https://login.tailscale.com/admin/settings/keys" 
              target="_blank" 
              rel="noopener noreferrer"
              className="text-blue-600 hover:underline"
            >
              Tailscale Admin Console
            </a>
            . Key is stored locally in your browser.
          </p>
        </div>

        <div className="mb-6 flex gap-4">
          <button
            onClick={fetchDevices}
            disabled={loading}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {loading ? 'Loading...' : 'Fetch Devices'}
          </button>
          
          <button
            onClick={() => {
              const headers = apiKey ? { 'Authorization': `Bearer ${apiKey}` } : undefined;
              fetch('https://api.tailscale.com/api/v2/tailnet/-/devices', { headers })
                .then(r => r.json())
                .then(d => console.log('Raw API response:', d));
            }}
            className="px-4 py-2 bg-gray-200 text-gray-800 rounded-lg hover:bg-gray-300 transition-colors"
          >
            Test API (Console)
          </button>
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
