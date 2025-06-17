"use client";

import { useState } from 'react';

export default function TestPage() {
  const [result, setResult] = useState<string>('');
  const [loading, setLoading] = useState(false);

  const testUpgrade = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/simulate-webhook', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' }
      });
      
      const data = await response.json();
      setResult(JSON.stringify(data, null, 2));
    } catch (error) {
      setResult('Error: ' + (error instanceof Error ? error.message : 'Unknown error'));
    }
    setLoading(false);
  };

  const testUserLookup = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/test-upgrade', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: 'imranjeferly@gmail.com',
          plan: 'basic'
        })
      });
      
      const data = await response.json();
      setResult(JSON.stringify(data, null, 2));
    } catch (error) {
      setResult('Error: ' + (error instanceof Error ? error.message : 'Unknown error'));
    }
    setLoading(false);
  };

  return (
    <div className="min-h-screen bg-gray-100 p-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold mb-8">Webhook Test Page</h1>
        
        <div className="space-y-4 mb-8">
          <button
            onClick={testUserLookup}
            disabled={loading}
            className="bg-blue-500 text-white px-6 py-3 rounded-lg hover:bg-blue-600 disabled:opacity-50"
          >
            {loading ? 'Testing...' : 'Test User Lookup & Plan Upgrade'}
          </button>
          
          <button
            onClick={testUpgrade}
            disabled={loading}
            className="bg-green-500 text-white px-6 py-3 rounded-lg hover:bg-green-600 disabled:opacity-50 ml-4"
          >
            {loading ? 'Testing...' : 'Test Simulate Webhook'}
          </button>
        </div>

        <div className="bg-white p-6 rounded-lg shadow">
          <h2 className="text-xl font-semibold mb-4">Test Result:</h2>
          <pre className="bg-gray-100 p-4 rounded text-sm overflow-auto">
            {result || 'Click a button to test...'}
          </pre>
        </div>

        <div className="mt-8 bg-yellow-100 p-4 rounded-lg">
          <h3 className="font-semibold">Instructions:</h3>
          <ol className="list-decimal list-inside mt-2 space-y-1">
            <li><strong>Test User Lookup:</strong> This will try to find your user by email and upgrade to basic plan</li>
            <li><strong>Test Simulate Webhook:</strong> This simulates the exact webhook event from your payment</li>
            <li>Check the result to see if user lookup is working</li>
            <li>If it works here, the issue is in the webhook processing</li>
          </ol>
        </div>
      </div>
    </div>
  );
}
