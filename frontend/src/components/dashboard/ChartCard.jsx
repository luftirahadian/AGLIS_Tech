import React, { useState } from 'react';
import { Calendar, RefreshCw } from 'lucide-react';
import {
  LineChart,
  Line,
  AreaChart,
  Area,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer
} from 'recharts';

const ChartCard = ({ 
  title, 
  data, 
  type = 'line',
  height = 300,
  colors = ['#3B82F6', '#10B981', '#F59E0B', '#EF4444'],
  className = '',
  showDateRange = false,
  dateRange = null,
  onDateRangeChange = null,
  onApplyFilter = null,
  isLoading = false
}) => {
  const [tempDateRange, setTempDateRange] = useState(dateRange);
  const [showPresets, setShowPresets] = useState(false);

  // Update tempDateRange when dateRange prop changes
  React.useEffect(() => {
    setTempDateRange(dateRange);
  }, [dateRange]);

  const handlePresetClick = (days) => {
    const end = new Date();
    const start = new Date();
    
    if (days === 0) {
      // Today
      start.setHours(0, 0, 0, 0);
    } else {
      start.setDate(end.getDate() - days);
    }
    
    const newRange = {
      start: start.toISOString().split('T')[0],
      end: end.toISOString().split('T')[0]
    };
    
    setTempDateRange(newRange);
    if (onDateRangeChange) {
      onDateRangeChange(newRange);
    }
    if (onApplyFilter) {
      onApplyFilter(newRange);
    }
    setShowPresets(false);
  };

  const handleApply = () => {
    if (onApplyFilter && tempDateRange) {
      onApplyFilter(tempDateRange);
    }
  };
  const renderChart = () => {
    switch (type) {
      case 'line':
        return (
          <ResponsiveContainer width="100%" height={height}>
            <LineChart data={data}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis 
                dataKey="date" 
                stroke="#6b7280"
                fontSize={12}
                tickFormatter={(value) => {
                  if (value) {
                    const date = new Date(value);
                    return `${date.getDate()}/${date.getMonth() + 1}`;
                  }
                  return value;
                }}
              />
              <YAxis stroke="#6b7280" fontSize={12} />
              <Tooltip 
                contentStyle={{
                  backgroundColor: '#fff',
                  border: '1px solid #e5e7eb',
                  borderRadius: '8px',
                  boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)'
                }}
                labelFormatter={(value) => {
                  if (value) {
                    const date = new Date(value);
                    return date.toLocaleDateString('id-ID');
                  }
                  return value;
                }}
              />
              <Legend 
                verticalAlign="bottom"
                height={24}
                wrapperStyle={{ paddingTop: '8px' }}
              />
              <Line 
                type="monotone" 
                dataKey="created" 
                stroke={colors[0]} 
                strokeWidth={2}
                name="Created"
                dot={{ fill: colors[0], strokeWidth: 2, r: 4 }}
                activeDot={{ r: 6 }}
              />
              <Line 
                type="monotone" 
                dataKey="completed" 
                stroke={colors[1]} 
                strokeWidth={2}
                name="Completed"
                dot={{ fill: colors[1], strokeWidth: 2, r: 4 }}
                activeDot={{ r: 6 }}
              />
              <Line 
                type="monotone" 
                dataKey="critical" 
                stroke={colors[3]} 
                strokeWidth={2}
                name="Critical"
                dot={{ fill: colors[3], strokeWidth: 2, r: 4 }}
                activeDot={{ r: 6 }}
              />
            </LineChart>
          </ResponsiveContainer>
        );

      case 'area':
        return (
          <ResponsiveContainer width="100%" height={height}>
            <AreaChart data={data}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis dataKey="date" stroke="#6b7280" fontSize={12} />
              <YAxis stroke="#6b7280" fontSize={12} />
              <Tooltip />
              <Area 
                type="monotone" 
                dataKey="created" 
                stackId="1"
                stroke={colors[0]} 
                fill={colors[0]}
                fillOpacity={0.6}
              />
            </AreaChart>
          </ResponsiveContainer>
        );

      case 'bar':
        return (
          <ResponsiveContainer width="100%" height={height}>
            <BarChart data={data}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis 
                dataKey="name" 
                stroke="#6b7280" 
                fontSize={12}
                angle={-45}
                textAnchor="end"
                height={80}
              />
              <YAxis stroke="#6b7280" fontSize={12} />
              <Tooltip 
                contentStyle={{
                  backgroundColor: '#fff',
                  border: '1px solid #e5e7eb',
                  borderRadius: '8px',
                  boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)'
                }}
              />
              <Bar 
                dataKey="completedTickets" 
                fill={colors[0]}
                radius={[4, 4, 0, 0]}
                name="Completed Tickets"
              />
            </BarChart>
          </ResponsiveContainer>
        );

      case 'pie':
        // Format service type names for better display
        const formattedData = data.map(item => ({
          ...item,
          displayName: item.type ? 
            item.type.split('_').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ') 
            : item.name
        }));

        return (
          <ResponsiveContainer width="100%" height={height}>
            <PieChart>
              <Pie
                data={formattedData}
                cx="50%"
                cy="45%"
                labelLine={false}
                label={({ percentage }) => `${percentage}%`}
                outerRadius={110}
                fill="#8884d8"
                dataKey="count"
                nameKey="displayName"
              >
                {formattedData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={colors[index % colors.length]} />
                ))}
              </Pie>
              <Tooltip 
                formatter={(value, name) => [value, name]}
                contentStyle={{
                  backgroundColor: '#fff',
                  border: '1px solid #e5e7eb',
                  borderRadius: '8px',
                  boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)'
                }}
              />
              <Legend 
                verticalAlign="bottom" 
                height={28}
                iconType="circle"
                wrapperStyle={{ paddingTop: '10px' }}
              />
            </PieChart>
          </ResponsiveContainer>
        );

      default:
        return <div>Chart type not supported</div>;
    }
  };

  return (
    <div className={`bg-white rounded-xl p-6 border border-gray-200 hover:shadow-lg transition-shadow duration-200 ${className}`}>
      <div className="mb-4">
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-lg font-semibold text-gray-900">{title}</h3>
          {showDateRange && (
            <div className="relative">
              <button
                onClick={() => setShowPresets(!showPresets)}
                className="flex items-center gap-2 px-3 py-1.5 text-sm text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <Calendar className="h-4 w-4" />
                Quick Select
              </button>
              
              {showPresets && (
                <div className="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-lg border border-gray-200 z-10">
                  <div className="py-1">
                    <button
                      onClick={() => handlePresetClick(0)}
                      className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                    >
                      Today
                    </button>
                    <button
                      onClick={() => handlePresetClick(7)}
                      className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                    >
                      Last 7 days
                    </button>
                    <button
                      onClick={() => handlePresetClick(30)}
                      className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                    >
                      Last 30 days
                    </button>
                    <button
                      onClick={() => handlePresetClick(90)}
                      className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                    >
                      Last 90 days
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
        
        {showDateRange && (
          <div className="flex items-center gap-2 flex-wrap">
            <input
              type="date"
              value={tempDateRange?.start || ''}
              onChange={(e) => setTempDateRange({ ...tempDateRange, start: e.target.value })}
              className="text-sm px-3 py-1.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
            <span className="text-gray-500">-</span>
            <input
              type="date"
              value={tempDateRange?.end || ''}
              onChange={(e) => setTempDateRange({ ...tempDateRange, end: e.target.value })}
              className="text-sm px-3 py-1.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
            <button
              onClick={handleApply}
              disabled={isLoading}
              className="btn-primary text-sm px-4 py-1.5 flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isLoading ? (
                <>
                  <RefreshCw className="h-4 w-4 animate-spin" />
                  Loading...
                </>
              ) : (
                'Apply'
              )}
            </button>
          </div>
        )}
      </div>
      
      {isLoading ? (
        <div className="flex items-center justify-center" style={{ height }}>
          <RefreshCw className="h-8 w-8 text-blue-500 animate-spin" />
        </div>
      ) : (
        renderChart()
      )}
    </div>
  );
};

export default ChartCard;
