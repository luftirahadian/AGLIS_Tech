// ═══════════════════════════════════════════════════════════════
// 📊 ADVANCED ANALYTICS DASHBOARD
// Real-time charts dengan Socket.IO integration
// ═══════════════════════════════════════════════════════════════

import React, { useState, useEffect } from 'react';
import { useQuery, useQueryClient } from 'react-query';
import {
  LineChart, Line, BarChart, Bar, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
  Area, AreaChart
} from 'recharts';
import {
  TrendingUp, TrendingDown, Activity, DollarSign,
  Users, Clock, CheckCircle, AlertTriangle,
  RefreshCw, Calendar, Award, Target
} from 'lucide-react';
import socketService from '../../services/socketService';
import analyticsService from '../../services/analyticsService';

const AnalyticsDashboard = () => {
  const queryClient = useQueryClient();
  const [dateRange, setDateRange] = useState('7days');
  const [autoRefresh, setAutoRefresh] = useState(true);

  // Fetch analytics data
  const { data: ticketTrend, isLoading: loadingTrend } = useQuery(
    ['analytics-ticket-trend', dateRange],
    () => analyticsService.getTicketTrend(dateRange),
    {
      refetchInterval: autoRefresh ? 30000 : false
    }
  );

  const { data: statusDistribution, isLoading: loadingStatus } = useQuery(
    'analytics-status-distribution',
    () => analyticsService.getStatusDistribution(),
    {
      refetchInterval: autoRefresh ? 30000 : false
    }
  );

  const { data: techPerformance, isLoading: loadingPerf } = useQuery(
    'analytics-tech-performance',
    () => analyticsService.getTechnicianPerformance(),
    {
      refetchInterval: autoRefresh ? 30000 : false
    }
  );

  const { data: revenueTrend, isLoading: loadingRevenue } = useQuery(
    'analytics-revenue-trend',
    () => analyticsService.getRevenueTrend(),
    {
      refetchInterval: autoRefresh ? 60000 : false
    }
  );

  const { data: kpiData, isLoading: loadingKPI } = useQuery(
    'analytics-kpi',
    () => analyticsService.getKPIMetrics(),
    {
      refetchInterval: autoRefresh ? 30000 : false
    }
  );

  // Real-time updates via Socket.IO
  useEffect(() => {
    const handleTicketUpdate = () => {
      console.log('📊 [Analytics] Ticket updated, refreshing charts...');
      queryClient.invalidateQueries(['analytics-ticket-trend']);
      queryClient.invalidateQueries('analytics-status-distribution');
      queryClient.invalidateQueries('analytics-kpi');
    };

    const handlePaymentReceived = () => {
      console.log('📊 [Analytics] Payment received, refreshing revenue...');
      queryClient.invalidateQueries('analytics-revenue-trend');
      queryClient.invalidateQueries('analytics-kpi');
    };

    // Register listeners
    socketService.on('ticket_created', handleTicketUpdate);
    socketService.on('ticket_updated', handleTicketUpdate);
    socketService.on('ticket_completed', handleTicketUpdate);
    socketService.on('payment_received', handlePaymentReceived);

    console.log('📊 [Analytics] Socket.IO listeners registered');

    return () => {
      socketService.off('ticket_created', handleTicketUpdate);
      socketService.off('ticket_updated', handleTicketUpdate);
      socketService.off('ticket_completed', handleTicketUpdate);
      socketService.off('payment_received', handlePaymentReceived);
    };
  }, [queryClient]);

  // Chart colors
  const COLORS = {
    primary: '#3B82F6',
    success: '#10B981',
    warning: '#F59E0B',
    danger: '#EF4444',
    purple: '#8B5CF6',
    teal: '#14B8A6'
  };

  const PIE_COLORS = ['#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6', '#14B8A6'];

  // KPI Card Component
  const KPICard = ({ icon: Icon, label, value, change, trend, color = 'blue' }) => {
    const colors = {
      blue: 'from-blue-500 to-blue-600',
      green: 'from-green-500 to-green-600',
      yellow: 'from-yellow-500 to-yellow-600',
      red: 'from-red-500 to-red-600',
      purple: 'from-purple-500 to-purple-600'
    };

    return (
      <div className="bg-white rounded-lg shadow-sm p-6 hover:shadow-md transition-shadow">
        <div className="flex items-center justify-between mb-4">
          <div className={`p-3 rounded-lg bg-gradient-to-r ${colors[color]}`}>
            <Icon className="h-6 w-6 text-white" />
          </div>
          {trend && (
            <div className={`flex items-center text-sm font-medium ${
              trend === 'up' ? 'text-green-600' : 'text-red-600'
            }`}>
              {trend === 'up' ? <TrendingUp className="h-4 w-4 mr-1" /> : <TrendingDown className="h-4 w-4 mr-1" />}
              {change}
            </div>
          )}
        </div>
        <div>
          <p className="text-2xl font-bold text-gray-900">{value}</p>
          <p className="text-sm text-gray-600 mt-1">{label}</p>
        </div>
      </div>
    );
  };

  const kpis = kpiData?.data || {};

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">📊 Analytics Dashboard</h1>
          <p className="text-gray-600 mt-1">Real-time performance metrics & insights</p>
        </div>
        
        <div className="flex items-center space-x-3">
          {/* Auto Refresh Toggle */}
          <label className="flex items-center space-x-2 cursor-pointer">
            <input
              type="checkbox"
              checked={autoRefresh}
              onChange={(e) => setAutoRefresh(e.target.checked)}
              className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
            />
            <span className="text-sm text-gray-700">Auto-refresh</span>
            <RefreshCw className={`h-4 w-4 ${autoRefresh ? 'text-green-500 animate-spin-slow' : 'text-gray-400'}`} />
          </label>

          {/* Date Range */}
          <select
            value={dateRange}
            onChange={(e) => setDateRange(e.target.value)}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          >
            <option value="today">Hari Ini</option>
            <option value="7days">7 Hari</option>
            <option value="30days">30 Hari</option>
            <option value="90days">90 Hari</option>
            <option value="year">Tahun Ini</option>
          </select>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <KPICard
          icon={Activity}
          label="Total Tickets"
          value={kpis.total_tickets || 0}
          change={`+${kpis.ticket_growth || 0}%`}
          trend="up"
          color="blue"
        />
        <KPICard
          icon={CheckCircle}
          label="Completion Rate"
          value={`${kpis.completion_rate || 0}%`}
          change={`+${kpis.completion_growth || 0}%`}
          trend={kpis.completion_growth > 0 ? 'up' : 'down'}
          color="green"
        />
        <KPICard
          icon={Clock}
          label="Avg Response Time"
          value={`${kpis.avg_response_time || 0}h`}
          change={`-${kpis.response_improvement || 0}%`}
          trend="up"
          color="purple"
        />
        <KPICard
          icon={DollarSign}
          label="Revenue (This Month)"
          value={`Rp ${((kpis.monthly_revenue || 0) / 1000000).toFixed(1)}M`}
          change={`+${kpis.revenue_growth || 0}%`}
          trend="up"
          color="yellow"
        />
      </div>

      {/* Charts Row 1 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Ticket Trend Chart */}
        <div className="bg-white rounded-lg shadow-sm p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
            <TrendingUp className="h-5 w-5 mr-2 text-blue-600" />
            Ticket Trend
          </h3>
          {loadingTrend ? (
            <div className="h-64 flex items-center justify-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            </div>
          ) : (
            <ResponsiveContainer width="100%" height={300}>
              <AreaChart data={ticketTrend?.data || []}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="date" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Area type="monotone" dataKey="tickets" stroke={COLORS.primary} fill={COLORS.primary} fillOpacity={0.3} name="Tickets" />
                <Area type="monotone" dataKey="completed" stroke={COLORS.success} fill={COLORS.success} fillOpacity={0.3} name="Completed" />
              </AreaChart>
            </ResponsiveContainer>
          )}
        </div>

        {/* Status Distribution */}
        <div className="bg-white rounded-lg shadow-sm p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
            <Target className="h-5 w-5 mr-2 text-purple-600" />
            Status Distribution
          </h3>
          {loadingStatus ? (
            <div className="h-64 flex items-center justify-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600"></div>
            </div>
          ) : (
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={statusDistribution?.data || []}
                  dataKey="count"
                  nameKey="status"
                  cx="50%"
                  cy="50%"
                  outerRadius={100}
                  label={(entry) => `${entry.status}: ${entry.count}`}
                >
                  {(statusDistribution?.data || []).map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={PIE_COLORS[index % PIE_COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          )}
        </div>
      </div>

      {/* Charts Row 2 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Technician Performance */}
        <div className="bg-white rounded-lg shadow-sm p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
            <Award className="h-5 w-5 mr-2 text-yellow-600" />
            Technician Performance
          </h3>
          {loadingPerf ? (
            <div className="h-64 flex items-center justify-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-yellow-600"></div>
            </div>
          ) : (
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={techPerformance?.data || []}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Bar dataKey="completed" fill={COLORS.success} name="Completed" />
                <Bar dataKey="pending" fill={COLORS.warning} name="Pending" />
              </BarChart>
            </ResponsiveContainer>
          )}
        </div>

        {/* Revenue Trend */}
        <div className="bg-white rounded-lg shadow-sm p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
            <DollarSign className="h-5 w-5 mr-2 text-green-600" />
            Revenue Trend
          </h3>
          {loadingRevenue ? (
            <div className="h-64 flex items-center justify-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-600"></div>
            </div>
          ) : (
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={revenueTrend?.data || []}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="month" />
                <YAxis />
                <Tooltip formatter={(value) => `Rp ${(value / 1000000).toFixed(2)}M`} />
                <Legend />
                <Line type="monotone" dataKey="revenue" stroke={COLORS.success} strokeWidth={2} name="Revenue" />
                <Line type="monotone" dataKey="target" stroke={COLORS.warning} strokeWidth={2} strokeDasharray="5 5" name="Target" />
              </LineChart>
            </ResponsiveContainer>
          )}
        </div>
      </div>

      {/* Real-time Indicator */}
      <div className="flex items-center justify-center text-sm text-gray-500">
        <div className={`w-2 h-2 rounded-full mr-2 ${autoRefresh ? 'bg-green-500 animate-pulse' : 'bg-gray-400'}`}></div>
        {autoRefresh ? 'Live updates active' : 'Auto-refresh disabled'}
      </div>
    </div>
  );
};

export default AnalyticsDashboard;

