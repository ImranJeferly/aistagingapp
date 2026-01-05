'use client';

import { useEffect, useState } from 'react';
import { db } from '@/lib/firebase';
import { collection, query, getDocs, orderBy, limit } from 'firebase/firestore';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line } from 'recharts';

interface PageStat {
  date: string;
  path: string;
  views: number;
}

export default function Dashboard() {
  const [stats, setStats] = useState<PageStat[]>([]);
  const [loading, setLoading] = useState(true);
  const [totalTraffic, setTotalTraffic] = useState(0);

  useEffect(() => {
    loadStats();
  }, []);

  async function loadStats() {
    try {
      // Get stats for the last 30 days
      const statsRef = collection(db, 'page_stats');
      const q = query(statsRef, orderBy('date', 'desc'), limit(300));
      const snapshot = await getDocs(q);
      
      const rawData = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as any[];

      // Aggregate specifically for Total Traffic counter
      let total = 0;
      rawData.forEach(d => total += (d.views || 0));
      setTotalTraffic(total);

      setStats(rawData.reverse()); // Show oldest to newest
    } catch (error) {
      console.error('Error loading stats:', error);
    } finally {
      setLoading(false);
    }
  }

  // Process data for charts
  const pagesData = stats.reduce((acc: any, curr) => {
    if (!acc[curr.path]) {
      acc[curr.path] = 0;
    }
    acc[curr.path] += curr.views;
    return acc;
  }, {});

  const barChartData = Object.keys(pagesData)
    .map(path => ({ name: path, views: pagesData[path] }))
    .sort((a, b) => b.views - a.views)
    .slice(0, 10); // Top 10 pages

  // Process data for Timeline (Daily Total)
  const timelineData = stats.reduce((acc: any, curr) => {
    if (!acc[curr.date]) {
      acc[curr.date] = 0;
    }
    acc[curr.date] += curr.views;
    return acc;
  }, {});

  const lineChartData = Object.keys(timelineData)
    .sort()
    .map(date => ({ date, views: timelineData[date] }));

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[50vh]">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-black"></div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Header Stats */}
      <h1 className="text-4xl font-black font-brand">DASHBOARD</h1>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-black text-white p-6 rounded-xl shadow-[4px_4px_0px_0px_rgba(0,0,0,0.5)]">
          <h3 className="text-gray-400 font-bold mb-2 uppercase text-xs tracking-wider">Total Traffic</h3>
          <p className="text-4xl font-black font-mono">{totalTraffic.toLocaleString()}</p>
        </div>
        <div className="bg-white border-2 border-black p-6 rounded-xl shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
          <h3 className="text-gray-500 font-bold mb-2 uppercase text-xs tracking-wider">Top Page</h3>
          <p className="text-2xl font-black truncate">{barChartData[0]?.name || 'N/A'}</p>
          <p className="text-sm font-bold text-gray-400">{barChartData[0]?.views || 0} views</p>
        </div>
        <div className="bg-white border-2 border-black p-6 rounded-xl shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
          <h3 className="text-gray-500 font-bold mb-2 uppercase text-xs tracking-wider">Active Pages</h3>
          <p className="text-4xl font-black">{Object.keys(pagesData).length}</p>
        </div>
      </div>

      {/* Traffic Over Time */}
      <div className="bg-white p-6 border-2 border-black rounded-xl shadow-[8px_8px_0px_0px_rgba(0,0,0,1)]">
        <h2 className="text-xl font-bold mb-6">Traffic Over Time</h2>
        <div className="h-[300px] w-full">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={lineChartData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#eee" />
              <XAxis dataKey="date" stroke="#888" fontSize={12} tickLine={false} axisLine={false} />
              <YAxis stroke="#888" fontSize={12} tickLine={false} axisLine={false} />
              <Tooltip 
                contentStyle={{ borderRadius: '8px', border: '2px solid black', boxShadow: '4px 4px 0px 0px rgba(0,0,0,1)' }}
                itemStyle={{ fontWeight: 'bold' }}
              />
              <Line 
                type="monotone" 
                dataKey="views" 
                stroke="#000" 
                strokeWidth={3} 
                dot={{ r: 4, fill: '#000', strokeWidth: 2, stroke: '#fff' }} 
                activeDot={{ r: 6, fill: '#000' }}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Top Pages Bar Chart */}
      <div className="bg-white p-6 border-2 border-black rounded-xl shadow-[8px_8px_0px_0px_rgba(0,0,0,1)]">
        <h2 className="text-xl font-bold mb-6">Top Pages by Unique Views (30 Days)</h2>
        <div className="h-[300px] w-full">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={barChartData} layout="vertical" margin={{ top: 5, right: 30, left: 40, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#eee" />
              <XAxis type="number" hide />
              <YAxis type="category" dataKey="name" width={150} stroke="#000" fontSize={12} tickLine={false} />
              <Tooltip 
                cursor={{ fill: '#f3f4f6' }}
                contentStyle={{ borderRadius: '8px', border: '2px solid black', boxShadow: '4px 4px 0px 0px rgba(0,0,0,1)' }}
              />
              <Bar dataKey="views" fill="#000" radius={[0, 4, 4, 0]} barSize={20} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
}
