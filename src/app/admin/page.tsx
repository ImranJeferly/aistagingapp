'use client';

import React from 'react';

export default function AdminDashboard() {
  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <h1 className="text-4xl font-black font-brand">Dashboard Overview</h1>
        <div className="flex gap-4">
            <span className="bg-[#A3E635] px-4 py-2 border-2 border-black font-bold shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
                Status: Online
            </span>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white p-6 border-2 border-black shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] hover:translate-x-[2px] hover:translate-y-[2px] hover:shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] transition-all">
          <h3 className="text-lg font-bold text-gray-500 mb-2">Total Users</h3>
          <p className="text-4xl font-black">1,234</p>
          <div className="mt-4 text-green-600 font-bold text-sm bg-green-100 inline-block px-2 py-1 rounded border border-green-600">
            +12% from last month
          </div>
        </div>

        <div className="bg-white p-6 border-2 border-black shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] hover:translate-x-[2px] hover:translate-y-[2px] hover:shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] transition-all">
          <h3 className="text-lg font-bold text-gray-500 mb-2">Active Staging Jobs</h3>
          <p className="text-4xl font-black">56</p>
          <div className="mt-4 text-blue-600 font-bold text-sm bg-blue-100 inline-block px-2 py-1 rounded border border-blue-600">
            Processing now
          </div>
        </div>

        <div className="bg-white p-6 border-2 border-black shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] hover:translate-x-[2px] hover:translate-y-[2px] hover:shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] transition-all">
          <h3 className="text-lg font-bold text-gray-500 mb-2">Server Load</h3>
          <p className="text-4xl font-black">23%</p>
          <div className="mt-4 text-green-600 font-bold text-sm bg-green-100 inline-block px-2 py-1 rounded border border-green-600">
            Healthy
          </div>
        </div>
      </div>

      {/* Recent Activity Section Placeholder */}
      <div className="bg-white p-8 border-2 border-black shadow-[8px_8px_0px_0px_rgba(0,0,0,1)]">
        <h2 className="text-2xl font-black mb-6">System Health & Logs</h2>
        <div className="h-64 bg-gray-100 border-2 border-black border-dashed flex items-center justify-center">
            <p className="text-gray-500 font-bold text-xl">Activity Charts & Logs Configuration Pending...</p>
        </div>
      </div>
    </div>
  );
}
