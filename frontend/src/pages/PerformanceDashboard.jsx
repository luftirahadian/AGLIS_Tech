// ═══════════════════════════════════════════════════════════════
// 🚀 PERFORMANCE MONITORING DASHBOARD
// ═══════════════════════════════════════════════════════════════

import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from 'react-query';
import { 
  Zap, Database, HardDrive, Clock, TrendingUp, 
  RefreshCw, Trash2, Activity, Server 
} from 'lucide-react';
import toast from 'react-hot-toast';
import api from '../services/api';

const PerformanceDashboard = () => {
  const queryClient = useQueryClient();
  const [autoRefresh, setAutoRefresh] = useState(false);

  // Fetch query stats
  const { data: queryStatsData, isLoading: queryLoading } = useQuery(
    'performance-query-stats',
    async () => {
      const response = await api.get('/performance/query-stats');
      return response.data;
    },
    {
      refetchInterval: autoRefresh ? 5000 : false,
      refetchOnWindowFocus: false
    }
  );

  // Fetch cache stats
  const { data: cacheStatsData, isLoading: cacheLoading } = useQuery(
    'performance-cache-stats',
    async () => {
      const response = await api.get('/performance/cache-stats');
      return response.data;
    },
    {
      refetchInterval: autoRefresh ? 5000 : false,
      refetchOnWindowFocus: false
    }
  );

  const queryStats = queryStatsData?.data || [];
  const cacheStats = cacheStatsData?.data || {};

  // Clear cache mutation
  const clearCacheMutation = useMutation(
    async () => {
      const response = await api.post('/performance/cache-clear');
      return response.data;
    },
    {
      onSuccess: () => {
        queryClient.invalidateQueries('performance-cache-stats');
        toast.success('Cache cleared successfully');
      },
      onError: (error) => {
        toast.error(error.response?.data?.message || 'Failed to clear cache');
      }
    }
  );

  // Reset query stats mutation
  const resetStatsMutation = useMutation(
    async () => {
      const response = await api.post('/performance/reset-stats');
      return response.data;
    },
    {
      onSuccess: () => {
        queryClient.invalidateQueries('performance-query-stats');
        toast.success('Query stats reset successfully');
      },
      onError: (error) => {
        toast.error(error.response?.data?.message || 'Failed to reset stats');
      }
    }
  );

  // Calculate query stats
  const slowQueries = queryStats.filter(q => q.duration_ms > 500);
  const avgQueryTime = queryStats.length > 0
    ? queryStats.reduce((sum, q) => sum + q.duration_ms, 0) / queryStats.length
    : 0;

  const formatDuration = (ms) => {
    if (ms < 1000) return `${Math.round(ms)}ms`;
    return `${(ms / 1000).toFixed(2)}s`;
  };

  return (
    <div className="p-6">
      {/* Header */}
      <div className="mb-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Performance Monitoring</h1>
            <p className="text-gray-600 mt-1">Monitor system performance and optimize</p>
          </div>
          <div className="flex items-center space-x-3">
            <label className="flex items-center space-x-2 cursor-pointer">
              <input
                type="checkbox"
                checked={autoRefresh}
                onChange={(e) => setAutoRefresh(e.target.checked)}
                className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
              />
              <span className="text-sm text-gray-700">Auto Refresh (5s)</span>
            </label>
            <button
              onClick={() => {
                queryClient.invalidateQueries('performance-query-stats');
                queryClient.invalidateQueries('performance-cache-stats');
              }}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center space-x-2"
            >
              <RefreshCw className="h-4 w-4" />
              <span>Refresh</span>
            </button>
          </div>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-6">
        <div className="bg-white rounded-lg shadow-sm p-6">
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-sm font-medium text-gray-600">Total Queries</h3>
            <Database className="h-5 w-5 text-blue-600" />
          </div>
          <p className="text-3xl font-bold text-gray-900">{queryStats.length}</p>
          <p className="text-sm text-gray-500 mt-1">Tracked queries</p>
        </div>

        <div className="bg-white rounded-lg shadow-sm p-6">
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-sm font-medium text-gray-600">Avg Query Time</h3>
            <Clock className="h-5 w-5 text-green-600" />
          </div>
          <p className="text-3xl font-bold text-gray-900">{formatDuration(avgQueryTime)}</p>
          <p className="text-sm text-gray-500 mt-1">Average duration</p>
        </div>

        <div className="bg-white rounded-lg shadow-sm p-6">
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-sm font-medium text-gray-600">Slow Queries</h3>
            <TrendingUp className="h-5 w-5 text-orange-600" />
          </div>
          <p className="text-3xl font-bold text-gray-900">{slowQueries.length}</p>
          <p className="text-sm text-gray-500 mt-1">> 500ms</p>
        </div>

        <div className="bg-white rounded-lg shadow-sm p-6">
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-sm font-medium text-gray-600">Cache Status</h3>
            <HardDrive className="h-5 w-5 text-purple-600" />
          </div>
          <p className="text-3xl font-bold text-gray-900">
            {cacheStats.enabled ? 'Active' : 'Inactive'}
          </p>
          <p className="text-sm text-gray-500 mt-1">
            {cacheStats.total_keys || 0} cached keys
          </p>
        </div>
      </div>

      {/* Cache Management */}
      <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-gray-900">Cache Management</h3>
          <button
            onClick={() => clearCacheMutation.mutate()}
            disabled={clearCacheMutation.isLoading}
            className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50 flex items-center space-x-2"
          >
            <Trash2 className="h-4 w-4" />
            <span>{clearCacheMutation.isLoading ? 'Clearing...' : 'Clear All Cache'}</span>
          </button>
        </div>

        {cacheStats.enabled ? (
          <div className="space-y-4">
            <div className="grid grid-cols-3 gap-4">
              <div className="p-4 bg-blue-50 rounded-lg">
                <p className="text-sm font-medium text-blue-900">Cache Keys</p>
                <p className="text-2xl font-bold text-blue-700">{cacheStats.total_keys || 0}</p>
              </div>
              <div className="p-4 bg-green-50 rounded-lg">
                <p className="text-sm font-medium text-green-900">Status</p>
                <p className="text-2xl font-bold text-green-700">Online</p>
              </div>
              <div className="p-4 bg-purple-50 rounded-lg">
                <p className="text-sm font-medium text-purple-900">Backend</p>
                <p className="text-2xl font-bold text-purple-700">Redis</p>
              </div>
            </div>
            <p className="text-sm text-gray-600">
              💡 Cached endpoints: /api/packages, /api/pricelist, /api/equipment, /api/odp, /api/service-types, /api/service-categories
            </p>
          </div>
        ) : (
          <div className="text-center py-8 text-gray-500">
            <Server className="h-12 w-12 mx-auto mb-3 text-gray-400" />
            <p>Redis cache is not enabled or not connected</p>
          </div>
        )}
      </div>

      {/* Query Performance Table */}
      <div className="bg-white rounded-lg shadow-sm p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-gray-900">Recent Queries</h3>
          <button
            onClick={() => resetStatsMutation.mutate()}
            disabled={resetStatsMutation.isLoading}
            className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 disabled:opacity-50 flex items-center space-x-2"
          >
            <Trash2 className="h-4 w-4" />
            <span>{resetStatsMutation.isLoading ? 'Resetting...' : 'Reset Stats'}</span>
          </button>
        </div>

        {queryLoading ? (
          <div className="text-center py-8">
            <Activity className="h-8 w-8 animate-spin text-blue-600 mx-auto mb-2" />
            <p className="text-gray-600">Loading query stats...</p>
          </div>
        ) : queryStats.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            <Database className="h-12 w-12 mx-auto mb-3 text-gray-400" />
            <p>No query statistics available</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-200">
                  <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700">Time</th>
                  <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700">Query</th>
                  <th className="text-center py-3 px-4 text-sm font-semibold text-gray-700">Duration</th>
                  <th className="text-center py-3 px-4 text-sm font-semibold text-gray-700">Rows</th>
                  <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700">Route</th>
                  <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700">User</th>
                </tr>
              </thead>
              <tbody>
                {queryStats.slice(0, 20).map((stat, index) => (
                  <tr key={index} className={`border-b border-gray-100 ${
                    stat.duration_ms > 500 ? 'bg-red-50' : 
                    stat.duration_ms > 200 ? 'bg-yellow-50' : 
                    'hover:bg-gray-50'
                  }`}>
                    <td className="py-3 px-4 text-xs text-gray-600">
                      {new Date(stat.timestamp).toLocaleTimeString()}
                    </td>
                    <td className="py-3 px-4 text-xs font-mono text-gray-900 max-w-md truncate">
                      {stat.query.substring(0, 100)}...
                    </td>
                    <td className="py-3 px-4 text-center">
                      <span className={`text-sm font-semibold ${
                        stat.duration_ms > 500 ? 'text-red-600' :
                        stat.duration_ms > 200 ? 'text-orange-600' :
                        'text-green-600'
                      }`}>
                        {formatDuration(stat.duration_ms)}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-sm text-center text-gray-900">
                      {stat.rows || '-'}
                    </td>
                    <td className="py-3 px-4 text-xs text-gray-600">{stat.route}</td>
                    <td className="py-3 px-4 text-xs text-gray-600">{stat.user}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};

export default PerformanceDashboard;

