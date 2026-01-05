'use client';

import { useEffect, useState } from 'react';
import { adminService, UserData } from '@/services/adminService';
import { Search, Filter } from 'lucide-react';

export default function UsersPage() {
  const [users, setUsers] = useState<UserData[]>([]);
  const [filteredUsers, setFilteredUsers] = useState<UserData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [planFilter, setPlanFilter] = useState('all');

  useEffect(() => {
    loadUsers();
  }, []);

  useEffect(() => {
    filterUsers();
  }, [users, searchQuery, planFilter]);

  async function loadUsers() {
    try {
      const data = await adminService.getAllUsers();
      setUsers(data);
      setFilteredUsers(data);
    } catch (err) {
      setError('Failed to load users');
      console.error(err);
    } finally {
      setLoading(false);
    }
  }

  function filterUsers() {
    let result = [...users];

    // Filter by search query
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      result = result.filter(user => 
        user.email.toLowerCase().includes(query) ||
        (user.firstName && user.firstName.toLowerCase().includes(query)) ||
        (user.lastName && user.lastName.toLowerCase().includes(query)) ||
        (user.displayName && user.displayName.toLowerCase().includes(query))
      );
    }

    // Filter by plan
    if (planFilter !== 'all') {
      result = result.filter(user => (user.plan || 'free') === planFilter);
    }

    setFilteredUsers(result);
  }

  function formatDate(date: any) {
    if (!date) return 'N/A';
    // Handle Firestore Timestamp
    if (date.seconds) {
      return new Date(date.seconds * 1000).toLocaleDateString(undefined, {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });
    }
    // Handle string or Date object
    return new Date(date).toLocaleDateString(undefined, {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  }

  function getPlanColor(plan?: string) {
    const p = plan?.toLowerCase() || 'free';
    switch (p) {
      case 'pro':
      case 'premium':
        return 'bg-green-100 text-green-800 border-green-200';
      case 'basic':
        return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'enterprise':
        return 'bg-purple-100 text-purple-800 border-purple-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  }

  function getRetentionStatus(created: any, last: any) {
    if (!created) return <span className="text-gray-400 text-xs">Unknown</span>;
    // If no separate last active record, treat as same as created (New)
    if (!last) return <span className="px-2 py-1 bg-gray-100 rounded text-xs font-bold text-gray-500">New User</span>;
    
    const createdTime = created.seconds ? created.seconds * 1000 : new Date(created).getTime();
    const lastTime = last.seconds ? last.seconds * 1000 : new Date(last).getTime();
    
    // Difference in hours
    const diffHours = (lastTime - createdTime) / (1000 * 60 * 60);
    
    if (diffHours < 1) return <span className="px-2 py-1 bg-gray-100 rounded text-xs font-bold text-gray-500">New User</span>;
    if (diffHours < 24) return <span className="px-2 py-1 bg-blue-50 rounded text-xs font-bold text-blue-600">Same Day</span>;
    
    const days = Math.floor(diffHours / 24);
    return <span className="px-2 py-1 bg-green-50 rounded text-xs font-bold text-green-700">Returned (+{days}d)</span>;
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-black"></div>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-4xl font-black font-brand mb-2">USERS</h1>
          <p className="text-gray-600 font-medium">Manage and view your user base</p>
        </div>
        <div className="bg-white px-4 py-2 border-2 border-black rounded-lg shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
          <span className="font-bold">{users.length} Total Users</span>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white p-4 border-2 border-black rounded-xl shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] mb-6 flex gap-4">
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
          <input
            type="text"
            placeholder="Search by name or email..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border-2 border-gray-200 rounded-lg focus:border-black focus:ring-0 transition-colors"
          />
        </div>
        <div className="relative w-48">
          <Filter className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
          <select
            value={planFilter}
            onChange={(e) => setPlanFilter(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border-2 border-gray-200 rounded-lg focus:border-black focus:ring-0 transition-colors appearance-none bg-white"
          >
            <option value="all">All Plans</option>
            <option value="free">Free</option>
            <option value="basic">Basic</option>
            <option value="pro">Pro</option>
          </select>
        </div>
      </div>

      {error && (
        <div className="bg-red-50 border-2 border-red-500 text-red-700 p-4 rounded-lg mb-6 font-bold">
          {error}
        </div>
      )}

      <div className="bg-white border-2 border-black rounded-xl overflow-hidden shadow-[8px_8px_0px_0px_rgba(0,0,0,1)]">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 border-b-2 border-black">
              <tr>
                <th className="px-2 py-4 text-left text-sm font-black uppercase tracking-wider w-[200px]">User</th>
                <th className="px-6 py-4 text-left text-sm font-black uppercase tracking-wider">Plan</th>
                <th className="px-6 py-4 text-left text-sm font-black uppercase tracking-wider">Joined</th>
                <th className="px-6 py-4 text-left text-sm font-black uppercase tracking-wider">Engagement</th>
                <th className="px-6 py-4 text-left text-sm font-black uppercase tracking-wider">Last Active</th>
                <th className="px-6 py-4 text-left text-sm font-black uppercase tracking-wider">Email Used</th>
              </tr>
            </thead>
            <tbody className="divide-y-2 divide-gray-100">
              {filteredUsers.map((user) => (
                <tr key={user.uid} className="hover:bg-amber-50 transition-colors">
                  <td className="px-2 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <div className="h-10 w-10 flex-shrink-0">
                        {user.photoURL ? (
                          <img className="h-10 w-10 rounded-full border-2 border-black object-cover" src={user.photoURL} alt="" />
                        ) : (
                          <div className="h-10 w-10 rounded-full border-2 border-black bg-gray-200 flex items-center justify-center font-bold">
                            {(user.firstName?.[0] || user.email?.[0] || '?').toUpperCase()}
                          </div>
                        )}
                      </div>
                      <div className="ml-4">
                        <div className="text-sm font-bold text-gray-900">
                          {user.firstName || user.lastName ? `${user.firstName || ''} ${user.lastName || ''}`.trim() : (user.displayName || 'No Name')}
                        </div>
                        <div className="text-xs text-gray-500 font-mono">{user.uid.substring(0, 8)}...</div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`px-3 py-1 inline-flex text-xs leading-5 font-black uppercase rounded-full border-2 ${getPlanColor(user.plan)}`}>
                      {user.plan || 'Free'}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-bold text-gray-600">
                    {formatDate(user.createdAt)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    {getRetentionStatus(user.createdAt, user.lastActive)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-bold text-gray-600">
                    {formatDate(user.lastActive) === 'N/A' ? formatDate(user.createdAt) : formatDate(user.lastActive)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                    {user.email}
                  </td>
                </tr>
              ))}
              
              {filteredUsers.length === 0 && (
                <tr>
                  <td colSpan={5} className="px-6 py-12 text-center text-gray-500 font-medium">
                    No users found matching your filters.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
