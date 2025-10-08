import React, { useState, useEffect } from 'react';
import { useQuery, useQueryClient } from 'react-query';
import { 
  BarChart3, 
  Users, 
  Clock, 
  Star, 
  DollarSign, 
  Ticket,
  TrendingUp,
  Activity,
  AlertTriangle,
  CheckCircle
} from 'lucide-react';

import analyticsService from '../services/analyticsService';
import socketService from '../services/socketService';
import KPICard from '../components/dashboard/KPICard';
import ChartCard from '../components/dashboard/ChartCard';
import RecentActivities from '../components/dashboard/RecentActivities';
import LoadingSpinner from '../components/LoadingSpinner';

const AnalyticsDashboard = () => {
  const [timeframe, setTimeframe] = useState(30);
  const queryClient = useQueryClient();

  // Fetch dashboard data
  const { data: overviewData, isLoading: overviewLoading, error: overviewError } = useQuery(
    ['dashboard-overview', timeframe],
    () => analyticsService.getDashboardOverview(timeframe),
    { 
      refetchInterval: 30000, // Refresh every 30 seconds
      staleTime: 25000
    }
  );

  const { data: trendsData, isLoading: trendsLoading } = useQuery(
    ['ticket-trends', timeframe],
    () => analyticsService.getTicketTrends(timeframe),
    { 
      refetchInterval: 60000, // Refresh every minute
      staleTime: 50000
    }
  );

  const { data: distributionData, isLoading: distributionLoading } = useQuery(
    'service-distribution',
    analyticsService.getServiceDistribution,
    { 
      refetchInterval: 60000,
      staleTime: 50000
    }
  );

  const { data: performanceData, isLoading: performanceLoading } = useQuery(
    'technician-performance',
    analyticsService.getTechnicianPerformance,
    { 
      refetchInterval: 60000,
      staleTime: 50000
    }
  );

  const { data: activitiesData, isLoading: activitiesLoading } = useQuery(
    'recent-activities',
    () => analyticsService.getRecentActivities(3),
    { 
      refetchInterval: 15000, // Refresh every 15 seconds for real-time feel
      staleTime: 10000
    }
  );

  // Setup Socket.IO listeners for real-time updates
  useEffect(() => {
    console.log('📊 Setting up dashboard real-time listeners...');
    
    // Listen for dashboard update events
    const handleDashboardUpdate = (data) => {
      console.log('📊 Dashboard update received:', data);
      
      // Invalidate and refetch all dashboard queries
      queryClient.invalidateQueries('dashboard-overview');
      queryClient.invalidateQueries('ticket-trends');
      queryClient.invalidateQueries('service-distribution');
      queryClient.invalidateQueries('technician-performance');
      queryClient.invalidateQueries('recent-activities');
    };

    // Listen for specific ticket events
    const handleNewTicket = (data) => {
      console.log('🎫 New ticket created:', data);
      queryClient.invalidateQueries('dashboard-overview');
      queryClient.invalidateQueries('ticket-trends');
      queryClient.invalidateQueries('service-distribution');
      queryClient.invalidateQueries('recent-activities');
    };

    const handleTicketStatusUpdated = (data) => {
      console.log('🔄 Ticket status updated:', data);
      queryClient.invalidateQueries('dashboard-overview');
      queryClient.invalidateQueries('recent-activities');
    };

    const handleTicketAssigned = (data) => {
      console.log('👤 Ticket assigned:', data);
      queryClient.invalidateQueries('dashboard-overview');
      queryClient.invalidateQueries('technician-performance');
      queryClient.invalidateQueries('recent-activities');
    };

    // Register Socket.IO listeners
    socketService.on('dashboard_update', handleDashboardUpdate);
    socketService.on('new_ticket', handleNewTicket);
    socketService.on('new_ticket_global', handleNewTicket);
    socketService.on('ticket_status_updated', handleTicketStatusUpdated);
    socketService.on('ticket_assigned', handleTicketAssigned);
    socketService.on('ticket_updated', handleTicketAssigned);

    // Cleanup function
    return () => {
      console.log('📊 Cleaning up dashboard listeners...');
      socketService.off('dashboard_update', handleDashboardUpdate);
      socketService.off('new_ticket', handleNewTicket);
      socketService.off('new_ticket_global', handleNewTicket);
      socketService.off('ticket_status_updated', handleTicketStatusUpdated);
      socketService.off('ticket_assigned', handleTicketAssigned);
      socketService.off('ticket_updated', handleTicketAssigned);
    };
  }, [queryClient]);

  if (overviewLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <LoadingSpinner />
      </div>
    );
  }

  if (overviewError) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <AlertTriangle className="h-12 w-12 text-red-500 mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-gray-900 mb-2">Failed to Load Dashboard</h2>
          <p className="text-gray-600">Please try refreshing the page</p>
        </div>
      </div>
    );
  }

  const overview = overviewData?.data || {};

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Analytics Dashboard</h1>
          <p className="text-gray-600">Monitor your ISP operations performance</p>
        </div>
        
        <div className="flex items-center space-x-4">
          <select
            value={timeframe}
            onChange={(e) => setTimeframe(parseInt(e.target.value))}
            className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            <option value={7}>Last 7 days</option>
            <option value={30}>Last 30 days</option>
            <option value={90}>Last 90 days</option>
          </select>
          
          <div className="flex items-center space-x-2 text-sm text-gray-500">
            <Activity className="h-4 w-4" />
            <span>Auto-refresh: 30s</span>
          </div>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-6">
        <KPICard
          title="Total Tickets"
          value={overview.tickets?.total || 0}
          icon={Ticket}
          color="blue"
        />
        
        <KPICard
          title="SLA Compliance"
          value={overview.sla?.complianceRate || 0}
          icon={CheckCircle}
          color="green"
          format="percentage"
          suffix="%"
        />
        
        <KPICard
          title="Avg Resolution"
          value={overview.resolution?.averageHours || 0}
          icon={Clock}
          color="yellow"
          format="decimal"
          suffix="h"
        />
        
        <KPICard
          title="Customer Rating"
          value={overview.satisfaction?.averageRating || 0}
          icon={Star}
          color="purple"
          format="decimal"
          suffix="/5"
        />
        
        <KPICard
          title="Active Technicians"
          value={overview.technicians?.total || 0}
          icon={Users}
          color="indigo"
        />
        
        <KPICard
          title="Monthly Revenue"
          value={overview.revenue?.estimatedMonthly || 0}
          icon={DollarSign}
          color="green"
          format="currency"
        />
      </div>

      {/* Charts Row 1 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <ChartCard
          title="Ticket Trends"
          data={trendsData?.data || []}
          type="line"
          height={350}
          colors={['#3B82F6', '#10B981', '#EF4444']}
        />
        
        <ChartCard
          title="Service Type Distribution"
          data={distributionData?.data || []}
          type="pie"
          height={350}
          colors={['#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6']}
        />
      </div>

      {/* Charts Row 2 */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <ChartCard
            title="Technician Performance"
            data={performanceData?.data || []}
            type="bar"
            height={350}
            colors={['#3B82F6', '#10B981', '#F59E0B']}
          />
        </div>
        
        <RecentActivities activities={activitiesData?.data || []} />
      </div>

      {/* Status Overview */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-white rounded-xl p-6 border border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Today's Tickets</p>
              <p className="text-2xl font-bold text-gray-900">{overview.tickets?.today || 0}</p>
            </div>
            <TrendingUp className="h-8 w-8 text-blue-500" />
          </div>
          <div className="mt-4 space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-gray-600">Open</span>
              <span className="font-medium">{overview.tickets?.byStatus?.open || 0}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-gray-600">In Progress</span>
              <span className="font-medium">{overview.tickets?.byStatus?.in_progress || 0}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-gray-600">Assigned</span>
              <span className="font-medium">{overview.tickets?.byStatus?.assigned || 0}</span>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl p-6 border border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Technician Status</p>
              <p className="text-2xl font-bold text-gray-900">{overview.technicians?.total || 0}</p>
            </div>
            <Users className="h-8 w-8 text-green-500" />
          </div>
          <div className="mt-4 space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-gray-600">Available</span>
              <span className="font-medium text-green-600">{overview.technicians?.available || 0}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-gray-600">Busy</span>
              <span className="font-medium text-yellow-600">{overview.technicians?.busy || 0}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-gray-600">Offline</span>
              <span className="font-medium text-gray-600">{overview.technicians?.offline || 0}</span>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl p-6 border border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">SLA Performance</p>
              <p className="text-2xl font-bold text-gray-900">{overview.sla?.complianceRate || 0}%</p>
            </div>
            <CheckCircle className="h-8 w-8 text-purple-500" />
          </div>
          <div className="mt-4 space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-gray-600">Within SLA</span>
              <span className="font-medium text-green-600">{overview.sla?.withinSLA || 0}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-gray-600">Total Completed</span>
              <span className="font-medium">{overview.sla?.totalCompleted || 0}</span>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl p-6 border border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Revenue Overview</p>
              <p className="text-lg font-bold text-gray-900">
                {new Intl.NumberFormat('id-ID', {
                  style: 'currency',
                  currency: 'IDR',
                  minimumFractionDigits: 0,
                  maximumFractionDigits: 0
                }).format(overview.revenue?.estimatedMonthly || 0)}
              </p>
            </div>
            <DollarSign className="h-8 w-8 text-indigo-500" />
          </div>
          <div className="mt-4 space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-gray-600">Active Customers</span>
              <span className="font-medium">{overview.revenue?.activeCustomers || 0}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-gray-600">Avg per Customer</span>
              <span className="font-medium">
                {overview.revenue?.activeCustomers > 0 ? 
                  new Intl.NumberFormat('id-ID', {
                    style: 'currency',
                    currency: 'IDR',
                    minimumFractionDigits: 0,
                    maximumFractionDigits: 0
                  }).format((overview.revenue?.estimatedMonthly || 0) / overview.revenue.activeCustomers)
                  : 'Rp 0'
                }
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AnalyticsDashboard;
