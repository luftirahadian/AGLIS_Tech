import React from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { BarChart3 } from 'lucide-react';

const PerformanceChart = ({ data = [], isLoading = false }) => {
  // Transform data for Recharts
  const chartData = data.map(item => ({
    name: item.technician_name || item.name || 'Unknown',
    completed: parseInt(item.completed_tickets || item.completed || 0),
    avgTime: parseFloat(item.avg_response_time || item.avg_time || 0),
    satisfaction: parseFloat(item.satisfaction_rate || item.satisfaction || 0)
  }));

  if (isLoading) {
    return (
      <div className="bg-white rounded-lg shadow p-6 animate-pulse">
        <div className="h-6 bg-gray-200 rounded w-1/3 mb-4"></div>
        <div className="h-64 bg-gray-100 rounded"></div>
      </div>
    );
  }

  if (!data || data.length === 0) {
    return (
      <div className="bg-white rounded-lg shadow p-6">
        <div className="flex items-center gap-2 mb-4">
          <BarChart3 className="h-5 w-5 text-indigo-600" />
          <h3 className="text-lg font-semibold text-gray-900">Technician Performance</h3>
        </div>
        <div className="h-64 flex items-center justify-center text-gray-500">
          <p>No data available</p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow p-6">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <BarChart3 className="h-5 w-5 text-indigo-600" />
          <h3 className="text-lg font-semibold text-gray-900">Technician Performance</h3>
        </div>
        <div className="text-sm text-gray-500">
          Top {chartData.length} technicians
        </div>
      </div>
      
      <ResponsiveContainer width="100%" height={300}>
        <BarChart data={chartData} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
          <XAxis 
            dataKey="name" 
            stroke="#9ca3af"
            style={{ fontSize: '12px' }}
            angle={-45}
            textAnchor="end"
            height={80}
          />
          <YAxis 
            yAxisId="left"
            stroke="#9ca3af"
            style={{ fontSize: '12px' }}
          />
          <YAxis 
            yAxisId="right"
            orientation="right"
            stroke="#9ca3af"
            style={{ fontSize: '12px' }}
          />
          <Tooltip 
            contentStyle={{ 
              backgroundColor: '#fff', 
              border: '1px solid #e5e7eb',
              borderRadius: '8px',
              padding: '12px'
            }}
          />
          <Legend 
            wrapperStyle={{ fontSize: '14px' }}
          />
          <Bar 
            yAxisId="left"
            dataKey="completed" 
            fill="#3b82f6" 
            name="Completed Tickets"
            radius={[8, 8, 0, 0]}
          />
          <Bar 
            yAxisId="right"
            dataKey="satisfaction" 
            fill="#10b981" 
            name="Satisfaction (%)"
            radius={[8, 8, 0, 0]}
          />
        </BarChart>
      </ResponsiveContainer>

      {/* Legend */}
      <div className="mt-4 grid grid-cols-2 gap-4">
        {chartData.slice(0, 5).map((item, index) => (
          <div key={index} className="flex items-center justify-between text-sm">
            <span className="text-gray-700">{item.name}</span>
            <span className="font-semibold text-blue-600">{item.completed} tickets</span>
          </div>
        ))}
      </div>
    </div>
  );
};

export default PerformanceChart;

