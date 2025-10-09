import React, { useState } from 'react'
import { useQuery } from 'react-query'
import {
  TrendingUp, Users, CheckCircle, XCircle, Clock, BarChart3,
  PieChart, MapPin, Package, TrendingDown, ArrowUpRight, ArrowDownRight
} from 'lucide-react'
import {
  BarChart, Bar, LineChart, Line, PieChart as RechartsPie, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer
} from 'recharts'
import api from '../../services/api'

// KPI Card
const KPICard = ({ icon: Icon, title, value, subtitle, trend, color = 'blue' }) => {
  const colors = {
    blue: 'bg-blue-500 text-blue-600 bg-blue-50',
    green: 'bg-green-500 text-green-600 bg-green-50',
    yellow: 'bg-yellow-500 text-yellow-600 bg-yellow-50',
    red: 'bg-red-500 text-red-600 bg-red-50',
    purple: 'bg-purple-500 text-purple-600 bg-purple-50',
    indigo: 'bg-indigo-500 text-indigo-600 bg-indigo-50'
  }

  const [iconBg, textColor, cardBg] = (colors[color] || colors.blue).split(' ')

  return (
    <div className={`${cardBg} rounded-xl p-6 border border-gray-200 hover:shadow-lg transition-shadow`}>
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <p className="text-sm font-medium text-gray-600 mb-1">{title}</p>
          <p className="text-3xl font-bold text-gray-900 mb-2">{value}</p>
          {subtitle && <p className="text-sm text-gray-600">{subtitle}</p>}
          {trend && (
            <div className={`flex items-center mt-2 text-sm ${trend > 0 ? 'text-green-600' : 'text-red-600'}`}>
              {trend > 0 ? <ArrowUpRight className="h-4 w-4 mr-1" /> : <ArrowDownRight className="h-4 w-4 mr-1" />}
              <span>{Math.abs(trend)}% vs last period</span>
            </div>
          )}
        </div>
        <div className={`${iconBg} p-3 rounded-lg`}>
          <Icon className="h-6 w-6 text-white" />
        </div>
      </div>
    </div>
  )
}

const RegistrationAnalyticsPage = () => {
  const [timeframe, setTimeframe] = useState(30)

  // Fetch analytics overview
  const { data: overviewData } = useQuery(
    ['registration-analytics-overview', timeframe],
    () => api.get(`/registration-analytics/overview?timeframe=${timeframe}`),
    { select: (response) => response.data }
  )

  // Fetch trends
  const { data: trendsData } = useQuery(
    ['registration-trends', timeframe],
    () => api.get(`/registration-analytics/trends?days=${timeframe}`),
    { select: (response) => response.data }
  )

  // Fetch package popularity
  const { data: packagesData } = useQuery(
    'registration-package-popularity',
    () => api.get('/registration-analytics/package-popularity'),
    { select: (response) => response.data }
  )

  // Fetch funnel data
  const { data: funnelData } = useQuery(
    'registration-funnel',
    () => api.get('/registration-analytics/funnel'),
    { select: (response) => response.data }
  )

  const funnel = overviewData?.funnel || {}
  const timeMetrics = overviewData?.time_metrics || {}

  // Prepare funnel chart data
  const funnelChartData = funnelData?.map(item => ({
    stage: item.stage,
    count: parseInt(item.count),
    percentage: parseFloat(item.percentage) || 0
  })) || []

  // Prepare pie chart data for status distribution
  const statusPieData = [
    { name: 'Pending', value: parseInt(funnel.pending) || 0, color: '#EAB308' },
    { name: 'Verified', value: parseInt(funnel.verified) || 0, color: '#3B82F6' },
    { name: 'Survey Scheduled', value: parseInt(funnel.survey_scheduled) || 0, color: '#6366F1' },
    { name: 'Survey Done', value: parseInt(funnel.survey_completed) || 0, color: '#8B5CF6' },
    { name: 'Approved', value: parseInt(funnel.approved) || 0, color: '#10B981' },
    { name: 'Rejected', value: parseInt(funnel.rejected) || 0, color: '#EF4444' }
  ].filter(item => item.value > 0)

  return (
    <div className="min-h-screen bg-gray-100 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-gray-900">Registration Analytics</h1>
          <p className="text-gray-600 mt-1">Analisis pendaftaran customer baru</p>
        </div>

        {/* Timeframe Selector */}
        <div className="bg-white rounded-lg shadow-md p-4 mb-6">
          <div className="flex items-center space-x-4">
            <span className="text-sm font-medium text-gray-700">Periode:</span>
            {[7, 30, 60, 90].map((days) => (
              <button
                key={days}
                onClick={() => setTimeframe(days)}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                  timeframe === days
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                {days} Hari
              </button>
            ))}
          </div>
        </div>

        {/* KPI Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-6">
          <KPICard
            icon={Users}
            title="Total Registrations"
            value={funnel.total_registrations || 0}
            color="blue"
          />
          <KPICard
            icon={CheckCircle}
            title="Approved"
            value={funnel.approved || 0}
            subtitle={`${funnel.approval_rate || 0}% approval rate`}
            color="green"
          />
          <KPICard
            icon={TrendingUp}
            title="Conversion Rate"
            value={`${funnel.conversion_rate || 0}%`}
            subtitle={`${funnel.converted_to_customer || 0} customers`}
            color="purple"
          />
          <KPICard
            icon={Clock}
            title="Avg Approval Time"
            value={`${timeMetrics.avg_approval_time_hours || 0}h`}
            subtitle="From registration"
            color="indigo"
          />
        </div>

        {/* Charts Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
          {/* Status Distribution Pie Chart */}
          <div className="bg-white rounded-xl shadow-md p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Status Distribution</h3>
            <ResponsiveContainer width="100%" height={300}>
              <RechartsPie>
                <Pie
                  data={statusPieData}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({name, percent}) => `${name}: ${(percent * 100).toFixed(0)}%`}
                  outerRadius={100}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {statusPieData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip />
              </RechartsPie>
            </ResponsiveContainer>
          </div>

          {/* Conversion Funnel */}
          <div className="bg-white rounded-xl shadow-md p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Conversion Funnel</h3>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={funnelChartData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="stage" angle={-45} textAnchor="end" height={100} />
                <YAxis />
                <Tooltip />
                <Bar dataKey="count" fill="#3B82F6" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Registration Trends */}
        <div className="bg-white rounded-xl shadow-md p-6 mb-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Registration Trends</h3>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={trendsData || []}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis 
                dataKey="date" 
                tickFormatter={(date) => new Date(date).toLocaleDateString('id-ID', { day: '2-digit', month: 'short' })}
              />
              <YAxis />
              <Tooltip 
                labelFormatter={(date) => new Date(date).toLocaleDateString('id-ID')}
              />
              <Legend />
              <Line type="monotone" dataKey="total" stroke="#3B82F6" strokeWidth={2} name="Total" />
              <Line type="monotone" dataKey="approved" stroke="#10B981" strokeWidth={2} name="Approved" />
              <Line type="monotone" dataKey="rejected" stroke="#EF4444" strokeWidth={2} name="Rejected" />
            </LineChart>
          </ResponsiveContainer>
        </div>

        {/* Package Popularity Table */}
        <div className="bg-white rounded-xl shadow-md overflow-hidden">
          <div className="px-6 py-4 border-b">
            <h3 className="text-lg font-semibold text-gray-900">Package Popularity</h3>
          </div>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Package</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Speed</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Price</th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Registrations</th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Approved</th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Rate</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {packagesData?.map((pkg, index) => (
                  <tr key={index} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900">{pkg.package_name}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">{pkg.bandwidth_down} Mbps</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">Rp {pkg.monthly_price?.toLocaleString('id-ID')}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right">
                      <div className="text-sm font-semibold text-blue-600">{pkg.registration_count || 0}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right">
                      <div className="text-sm font-semibold text-green-600">{pkg.approved_count || 0}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right">
                      <div className="text-sm font-semibold text-gray-900">{pkg.approval_rate || 0}%</div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  )
}

export default RegistrationAnalyticsPage

