import React from 'react';
import CountUp from 'react-countup';

const KPICard = ({ 
  title, 
  value, 
  previousValue, 
  icon: Icon, 
  color = 'blue',
  format = 'number',
  suffix = '',
  prefix = ''
}) => {
  const getColorClasses = (color) => {
    const colors = {
      blue: 'bg-blue-500 text-blue-600 bg-blue-50',
      green: 'bg-green-500 text-green-600 bg-green-50',
      yellow: 'bg-yellow-500 text-yellow-600 bg-yellow-50',
      red: 'bg-red-500 text-red-600 bg-red-50',
      purple: 'bg-purple-500 text-purple-600 bg-purple-50',
      indigo: 'bg-indigo-500 text-indigo-600 bg-indigo-50'
    };
    return colors[color] || colors.blue;
  };

  const colorClasses = getColorClasses(color).split(' ');
  const iconBg = colorClasses[0];
  const textColor = colorClasses[1];
  const cardBg = colorClasses[2];

  const calculateChange = () => {
    if (!previousValue || previousValue === 0) return null;
    const change = ((value - previousValue) / previousValue) * 100;
    return change;
  };

  const change = calculateChange();

  const formatValue = (val) => {
    if (format === 'currency') {
      // Use compact notation for large numbers
      if (val >= 1000000) {
        return new Intl.NumberFormat('id-ID', {
          style: 'currency',
          currency: 'IDR',
          minimumFractionDigits: 0,
          maximumFractionDigits: 1,
          notation: 'compact',
          compactDisplay: 'short'
        }).format(val);
      }
      return new Intl.NumberFormat('id-ID', {
        style: 'currency',
        currency: 'IDR',
        minimumFractionDigits: 0,
        maximumFractionDigits: 0
      }).format(val);
    }
    if (format === 'percentage') {
      return `${val.toFixed(1)}%`;
    }
    if (format === 'decimal') {
      return val.toFixed(1);
    }
    return val.toLocaleString();
  };

  return (
    <div className={`${cardBg} rounded-xl p-6 border border-gray-200 hover:shadow-lg transition-shadow duration-200`}>
      <div className="flex items-center justify-between gap-4">
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium text-gray-600 mb-1">{title}</p>
          <div className="flex items-baseline">
            <span className="text-2xl font-bold text-gray-900">
              {prefix}
              {format === 'number' ? (
                <CountUp
                  end={value}
                  duration={1.5}
                  separator=","
                  preserveValue
                />
              ) : (
                formatValue(value)
              )}
              {suffix}
            </span>
          </div>
          
          {change !== null && (
            <div className="flex items-center mt-2">
              <span className={`text-xs font-medium ${
                change >= 0 ? 'text-green-600' : 'text-red-600'
              }`}>
                {change >= 0 ? '↗' : '↘'} {Math.abs(change).toFixed(1)}%
              </span>
              <span className="text-xs text-gray-500 ml-1">vs last period</span>
            </div>
          )}
        </div>
        
        <div className={`${iconBg} p-3 rounded-lg flex-shrink-0`}>
          <Icon className="h-6 w-6 text-white" />
        </div>
      </div>
    </div>
  );
};

export default KPICard;
