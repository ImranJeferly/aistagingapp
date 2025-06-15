"use client";

import { useAuth } from '../../contexts/AuthContext';
import AuthGuard from '../../components/AuthGuard';

function DashboardContent() {
  const { user, userData, logout } = useAuth();

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-4xl mx-auto px-4">
        <div className="bg-white rounded-2xl shadow-xl p-8">
          <div className="flex justify-between items-start mb-8">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 mb-2">Dashboard</h1>
              <p className="text-gray-600">Welcome to your AI Staging dashboard</p>
            </div>
            <button
              onClick={logout}
              className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
            >
              Logout
            </button>
          </div>

          {/* User Info */}
          <div className="grid md:grid-cols-2 gap-6 mb-8">
            <div className="bg-gray-50 rounded-xl p-6">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">Profile Information</h2>
              <div className="space-y-3">
                <div>
                  <span className="text-sm font-medium text-gray-500">Name:</span>
                  <p className="text-gray-900">
                    {userData?.firstName && userData?.lastName 
                      ? `${userData.firstName} ${userData.lastName}`
                      : user?.displayName || 'Not provided'
                    }
                  </p>
                </div>
                <div>
                  <span className="text-sm font-medium text-gray-500">Email:</span>
                  <p className="text-gray-900">{user?.email}</p>
                </div>
                <div>
                  <span className="text-sm font-medium text-gray-500">User ID:</span>
                  <p className="text-gray-900 font-mono text-sm">{user?.uid}</p>
                </div>
                <div>
                  <span className="text-sm font-medium text-gray-500">Account Created:</span>
                  <p className="text-gray-900">
                    {userData?.createdAt ? new Date(userData.createdAt.seconds * 1000).toLocaleDateString() : 'N/A'}
                  </p>
                </div>
              </div>
            </div>

            <div className="bg-blue-50 rounded-xl p-6">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">Usage Stats</h2>
              <div className="space-y-3">
                <div>
                  <span className="text-sm font-medium text-gray-500">Images Staged Today:</span>
                  <p className="text-2xl font-bold text-blue-600">0 / 3</p>
                </div>
                <div>
                  <span className="text-sm font-medium text-gray-500">Total Images Staged:</span>
                  <p className="text-xl font-semibold text-gray-900">0</p>
                </div>
                <div>
                  <span className="text-sm font-medium text-gray-500">Account Type:</span>
                  <p className="text-green-600 font-medium">Free Beta</p>
                </div>
              </div>
            </div>
          </div>

          {/* Quick Actions */}
          <div className="border-t border-gray-200 pt-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">Quick Actions</h2>
            <div className="grid md:grid-cols-3 gap-4">
              <button className="p-4 bg-purple-100 text-purple-800 rounded-xl hover:bg-purple-200 transition-colors">
                <div className="text-2xl mb-2">🏠</div>
                <div className="font-medium">Stage New Image</div>
              </button>
              <button className="p-4 bg-green-100 text-green-800 rounded-xl hover:bg-green-200 transition-colors">
                <div className="text-2xl mb-2">📊</div>
                <div className="font-medium">View Gallery</div>
              </button>
              <button className="p-4 bg-blue-100 text-blue-800 rounded-xl hover:bg-blue-200 transition-colors">
                <div className="text-2xl mb-2">⚙️</div>
                <div className="font-medium">Settings</div>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function DashboardPage() {
  return (
    <AuthGuard>
      <DashboardContent />
    </AuthGuard>
  );
}
