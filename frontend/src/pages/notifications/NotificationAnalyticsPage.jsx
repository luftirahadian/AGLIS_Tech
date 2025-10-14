// ═══════════════════════════════════════════════════════════════
// 📊 NOTIFICATION ANALYTICS DASHBOARD
// ═══════════════════════════════════════════════════════════════

import React, { useState } from 'react';
import { useQuery } from 'react-query';
import { 
  TrendingUp, Eye, MousePointerClick, CheckCircle2, 
  BarChart3, PieChart, Calendar, Smartphone
} from 'lucide-react';
import {
  LineChart, Line, BarChart, Bar, PieChart as RePieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer
} from 'recharts';
import analyticsService from '../../services/notificationAnalyticsService';

const NotificationAnalyticsPage = () => {
  const [dateRange, setDateRange] = useState('30'); // days
  const [selectedType, setSelectedType] = useState('');
  const [selectedPriority, setSelectedPriority] = useState('');

  // Fetch analytics data
  const { data: overviewData, isLoading: overviewLoading } = useQuery(
    ['notification-analytics-overview', selectedType, selectedPriority],
    () => analyticsService.getOverview({
      type: selectedType || undefined,
      priority: selectedPriority || undefined
    }),
    { refetchOnWindowFocus: false }
  );

  const { data: trendData, isLoading: trendLoading } = useQuery(
    ['notification-analytics-trend', dateRange],
    () => analyticsService.getTrend(parseInt(dateRange)),
    { refetchOnWindowFocus: false }
  );

  const { data: byTypeData } = useQuery(
    ['notification-analytics-by-type'],
    () => analyticsService.getByType(),
    { refetchOnWindowFocus: false }
  );

  const { data: byPriorityData } = useQuery(
    ['notification-analytics-by-priority'],
    () => analyticsService.getByPriority(),
    { refetchOnWindowFocus: false }
  );

  const { data: deviceData } = useQuery(
    ['notification-analytics-devices'],
    () => analyticsService.getDeviceStats(),
    { refetchOnWindowFocus: false }
  );

  const { data: topPerformingData } = useQuery(
    ['notification-analytics-top'],
    () => analyticsService.getTopPerforming(5),
    { refetchOnWindowFocus: false }
  );

  const overview = overviewData?.data || {};
  const trend = trendData?.data || [];
  const byType = byTypeData?.data || [];
  const byPriority = byPriorityData?.data || [];
  const devices = deviceData?.data || [];
  const topPerforming = topPerformingData?.data || [];

  // Chart colors
  const COLORS = ['#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6', '#EC4899'];
  const priorityColors = {
    low: '#9CA3AF',
    normal: '#3B82F6',
    high: '#F59E0B',
    urgent: '#EF4444'
  };

  // Format numbers
  const formatNumber = (num) => {
    if (!num) return '0';
    return new Intl.NumberFormat('id-ID').format(num);
  };

  const formatPercent = (num) => {
    if (!num) return '0%';
    return `${parseFloat(num).toFixed(1)}%`;
  };

  const formatTime = (seconds) => {
    if (!seconds) return '-';
    if (seconds < 60) return `${Math.round(seconds)}s`;
    if (seconds < 3600) return `${Math.round(seconds / 60)}m`;
    return `${(seconds / 3600).toFixed(1)}h`;
  };

  return (
    <div className="p-6">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Notification Analytics</h1>
        <p className="text-gray-600 mt-1">Track engagement and performance metrics</p>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-lg shadow-sm p-4 mb-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Date Range</label>
            <select
              value={dateRange}
              onChange={(e) => setDateRange(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
            >
              <option value="7">Last 7 days</option>
              <option value="14">Last 14 days</option>
              <option value="30">Last 30 days</option>
              <option value="60">Last 60 days</option>
              <option value="90">Last 90 days</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Type</label>
            <select
              value={selectedType}
              onChange={(e) => setSelectedType(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
            >
              <option value="">All Types</option>
              {byType.map(item => (
                <option key={item.type} value={item.type}>{item.type}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Priority</label>
            <select
              value={selectedPriority}
              onChange={(e) => setSelectedPriority(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
            >
              <option value="">All Priorities</option>
              <option value="low">Low</option>
              <option value="normal">Normal</option>
              <option value="high">High</option>
              <option value="urgent">Urgent</option>
            </select>
          </div>
        </div>
      </div>

      {/* Overview Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-6">
        <div className="bg-white rounded-lg shadow-sm p-6">
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-sm font-medium text-gray-600">Total Sent</h3>
            <TrendingUp className="h-5 w-5 text-blue-600" />
          </div>
          <p className="text-3xl font-bold text-gray-900">{formatNumber(overview.total_sent)}</p>
          <p className="text-sm text-gray-500 mt-1">Notifications delivered</p>
        </div>

        <div className="bg-white rounded-lg shadow-sm p-6">
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-sm font-medium text-gray-600">View Rate</h3>
            <Eye className="h-5 w-5 text-green-600" />
          </div>
          <p className="text-3xl font-bold text-gray-900">{formatPercent(overview.view_rate)}</p>
          <p className="text-sm text-gray-500 mt-1">{formatNumber(overview.total_viewed)} viewed</p>
        </div>

        <div className="bg-white rounded-lg shadow-sm p-6">
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-sm font-medium text-gray-600">Read Rate</h3>
            <CheckCircle2 className="h-5 w-5 text-purple-600" />
          </div>
          <p className="text-3xl font-bold text-gray-900">{formatPercent(overview.read_rate)}</p>
          <p className="text-sm text-gray-500 mt-1">{formatNumber(overview.total_read)} read</p>
        </div>

        <div className="bg-white rounded-lg shadow-sm p-6">
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-sm font-medium text-gray-600">Click Rate</h3>
            <MousePointerClick className="h-5 w-5 text-orange-600" />
          </div>
          <p className="text-3xl font-bold text-gray-900">{formatPercent(overview.click_rate)}</p>
          <p className="text-sm text-gray-500 mt-1">{formatNumber(overview.total_clicked)} clicks</p>
        </div>
      </div>

      {/* Timing Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
        <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-lg p-6">
          <h3 className="text-sm font-semibold text-blue-900 mb-2">Avg Time to View</h3>
          <p className="text-2xl font-bold text-blue-700">{formatTime(overview.avg_time_to_view)}</p>
        </div>

        <div className="bg-gradient-to-br from-purple-50 to-purple-100 rounded-lg p-6">
          <h3 className="text-sm font-semibold text-purple-900 mb-2">Avg Time to Read</h3>
          <p className="text-2xl font-bold text-purple-700">{formatTime(overview.avg_time_to_read)}</p>
        </div>

        <div className="bg-gradient-to-br from-orange-50 to-orange-100 rounded-lg p-6">
          <h3 className="text-sm font-semibold text-orange-900 mb-2">Avg Time to Click</h3>
          <p className="text-2xl font-bold text-orange-700">{formatTime(overview.avg_time_to_click)}</p>
        </div>
      </div>

      {/* Charts Row 1 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
        {/* Trend Chart */}
        <div className="bg-white rounded-lg shadow-sm p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-900">Daily Trend</h3>
            <Calendar className="h-5 w-5 text-gray-400" />
          </div>
          {trendLoading ? (
            <div className="h-64 flex items-center justify-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            </div>
          ) : (
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={trend.slice().reverse()}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis 
                  dataKey="date" 
                  tickFormatter={(date) => new Date(date).toLocaleDateString('id-ID', { month: 'short', day: 'numeric' })}
                />
                <YAxis />
                <Tooltip 
                  labelFormatter={(date) => new Date(date).toLocaleDateString('id-ID')}
                />
                <Legend />
                <Line type="monotone" dataKey="total_sent" stroke="#3B82F6" name="Sent" />
                <Line type="monotone" dataKey="total_viewed" stroke="#10B981" name="Viewed" />
                <Line type="monotone" dataKey="total_read" stroke="#8B5CF6" name="Read" />
                <Line type="monotone" dataKey="total_clicked" stroke="#F59E0B" name="Clicked" />
              </LineChart>
            </ResponsiveContainer>
          )}
        </div>

        {/* By Priority Chart */}
        <div className="bg-white rounded-lg shadow-sm p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-900">By Priority</h3>
            <BarChart3 className="h-5 w-5 text-gray-400" />
          </div>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={byPriority}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="priority" />
              <YAxis />
              <Tooltip />
              <Legend />
              <Bar dataKey="total_sent" fill="#3B82F6" name="Sent" />
              <Bar dataKey="total_read" fill="#8B5CF6" name="Read" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Charts Row 2 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
        {/* By Type Distribution */}
        <div className="bg-white rounded-lg shadow-sm p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-900">Distribution by Type</h3>
            <PieChart className="h-5 w-5 text-gray-400" />
          </div>
          <ResponsiveContainer width="100%" height={300}>
            <RePieChart>
              <Pie
                data={byType}
                dataKey="total_sent"
                nameKey="type"
                cx="50%"
                cy="50%"
                outerRadius={100}
                label={(entry) => `${entry.type.split('_')[0]}: ${entry.total_sent}`}
              >
                {byType.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip />
            </RePieChart>
          </ResponsiveContainer>
        </div>

        {/* Device Distribution */}
        <div className="bg-white rounded-lg shadow-sm p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-900">Device Distribution</h3>
            <Smartphone className="h-5 w-5 text-gray-400" />
          </div>
          {devices.length > 0 ? (
            <ResponsiveContainer width="100%" height={300}>
              <RePieChart>
                <Pie
                  data={devices}
                  dataKey="total"
                  nameKey="device_type"
                  cx="50%"
                  cy="50%"
                  outerRadius={100}
                  label={(entry) => `${entry.device_type}: ${entry.total}`}
                >
                  {devices.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
              </RePieChart>
            </ResponsiveContainer>
          ) : (
            <div className="h-64 flex items-center justify-center text-gray-500">
              No device data available
            </div>
          )}
        </div>
      </div>

      {/* Top Performing Table */}
      <div className="bg-white rounded-lg shadow-sm p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Top Performing Notifications</h3>
        {topPerforming.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-200">
                  <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700">Type</th>
                  <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700">Title</th>
                  <th className="text-center py-3 px-4 text-sm font-semibold text-gray-700">Priority</th>
                  <th className="text-right py-3 px-4 text-sm font-semibold text-gray-700">Users</th>
                  <th className="text-right py-3 px-4 text-sm font-semibold text-gray-700">Reads</th>
                  <th className="text-right py-3 px-4 text-sm font-semibold text-gray-700">Clicks</th>
                  <th className="text-right py-3 px-4 text-sm font-semibold text-gray-700">Click Rate</th>
                </tr>
              </thead>
              <tbody>
                {topPerforming.map((notif, index) => (
                  <tr key={notif.id} className="border-b border-gray-100 hover:bg-gray-50">
                    <td className="py-3 px-4">
                      <span className="text-xs font-mono bg-gray-100 text-gray-700 px-2 py-1 rounded">
                        {notif.type}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-sm text-gray-900">{notif.title}</td>
                    <td className="py-3 px-4 text-center">
                      <span className={`text-xs px-2 py-1 rounded-full ${
                        notif.priority === 'urgent' ? 'bg-red-100 text-red-700' :
                        notif.priority === 'high' ? 'bg-orange-100 text-orange-700' :
                        notif.priority === 'normal' ? 'bg-blue-100 text-blue-700' :
                        'bg-gray-100 text-gray-700'
                      }`}>
                        {notif.priority}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-sm text-right text-gray-900">{formatNumber(notif.unique_users)}</td>
                    <td className="py-3 px-4 text-sm text-right text-gray-900">{formatNumber(notif.total_reads)}</td>
                    <td className="py-3 px-4 text-sm text-right text-gray-900">{formatNumber(notif.total_clicks)}</td>
                    <td className="py-3 px-4 text-sm text-right font-semibold text-green-600">{formatPercent(notif.click_rate)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="text-center py-8 text-gray-500">No performance data available</div>
        )}
      </div>
    </div>
  );
};

export default NotificationAnalyticsPage;

