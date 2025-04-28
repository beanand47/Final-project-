import React, { useState, useMemo } from 'react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell,
  ScatterChart,
  Scatter,
  ZAxis,
  AreaChart,
  Area,
} from 'recharts';
import { BarChart2, LineChart as LineChartIcon, PieChart as PieChartIcon, ScatterChart as ScatterChartIcon, TrendingUp } from 'lucide-react';

interface VisualizationProps {
  data: any[];
  columns: string[];
}

// Enhanced color palette
const COLORS = [
  '#4F46E5', // Indigo
  '#06B6D4', // Cyan
  '#10B981', // Emerald
  '#F59E0B', // Amber
  '#EF4444', // Red
  '#8B5CF6', // Purple
  '#EC4899', // Pink
  '#14B8A6', // Teal
  '#F97316', // Orange
  '#6366F1', // Indigo
  '#84CC16', // Lime
  '#9333EA', // Purple
];

const Visualization: React.FC<VisualizationProps> = ({ data, columns }) => {
  const [chartType, setChartType] = useState<'bar' | 'line' | 'pie' | 'scatter' | 'area'>('bar');
  const [xAxis, setXAxis] = useState(columns[0] || '');
  const [yAxis, setYAxis] = useState(columns.length > 1 ? columns[1] : columns[0] || '');
  const [zAxis, setZAxis] = useState(columns.length > 2 ? columns[2] : '');
  const [aggregation, setAggregation] = useState<'none' | 'sum' | 'average' | 'count'>('none');
  const [colorScheme, setColorScheme] = useState<'default' | 'blue' | 'green' | 'rainbow'>('rainbow');
  const [showGrid, setShowGrid] = useState(true);
  const [currentStep, setCurrentStep] = useState(1);

  const chartData = useMemo(() => {
    if (!data || data.length === 0 || !columns || columns.length === 0) {
      return [];
    }
    
    if (chartType === 'pie' || aggregation !== 'none') {
      const aggregatedData: Record<string, any> = {};
      
      data.forEach((row) => {
        const key = row[columns.indexOf(xAxis)];
        const value = parseFloat(row[columns.indexOf(yAxis)]) || 0;
        
        if (!aggregatedData[key]) {
          aggregatedData[key] = {
            [xAxis]: key,
            values: [],
            count: 0,
          };
        }
        
        aggregatedData[key].values.push(value);
        aggregatedData[key].count += 1;
      });
      
      return Object.values(aggregatedData).map((item: any) => {
        let aggregatedValue;
        
        if (aggregation === 'sum' || chartType === 'pie') {
          aggregatedValue = item.values.reduce((sum: number, val: number) => sum + val, 0);
        } else if (aggregation === 'average') {
          aggregatedValue = item.values.reduce((sum: number, val: number) => sum + val, 0) / item.values.length;
        } else if (aggregation === 'count') {
          aggregatedValue = item.count;
        } else {
          aggregatedValue = item.values[0];
        }
        
        return {
          [xAxis]: item[xAxis],
          [yAxis]: aggregatedValue,
        };
      });
    }
    
    return data.map((row) => {
      const result: Record<string, any> = {
        [xAxis]: row[columns.indexOf(xAxis)],
        [yAxis]: parseFloat(row[columns.indexOf(yAxis)]) || 0,
      };
      
      if (chartType === 'scatter' && zAxis) {
        result[zAxis] = parseFloat(row[columns.indexOf(zAxis)]) || 0;
      }
      
      return result;
    });
  }, [data, columns, xAxis, yAxis, zAxis, chartType, aggregation]);

  const getChartColors = () => {
    switch (colorScheme) {
      case 'blue':
        return ['#dbeafe', '#bfdbfe', '#93c5fd', '#60a5fa', '#3b82f6', '#2563eb', '#1d4ed8'];
      case 'green':
        return ['#d1fae5', '#a7f3d0', '#6ee7b7', '#34d399', '#10b981', '#059669', '#047857'];
      case 'rainbow':
        return COLORS;
      default:
        return ['#4f46e5'];
    }
  };

  return (
    <div className="space-y-6">
      {/* Chart Type Selection */}
      <div className="bg-gray-50 rounded-lg p-4">
        <h3 className="text-sm font-medium text-gray-700 mb-3">Chart Type</h3>
        <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
          <button
            onClick={() => setChartType('bar')}
            className={`flex flex-col items-center justify-center p-3 rounded-lg border ${
              chartType === 'bar' ? 'bg-indigo-50 border-indigo-500 shadow-sm' : 'border-gray-200 hover:bg-gray-50'
            }`}
          >
            <BarChart2 className={`h-6 w-6 ${chartType === 'bar' ? 'text-indigo-600' : 'text-gray-400'}`} />
            <span className={`mt-2 text-sm ${chartType === 'bar' ? 'text-indigo-600 font-medium' : 'text-gray-500'}`}>
              Bar
            </span>
          </button>
          <button
            onClick={() => setChartType('line')}
            className={`flex flex-col items-center justify-center p-3 rounded-lg border ${
              chartType === 'line' ? 'bg-indigo-50 border-indigo-500 shadow-sm' : 'border-gray-200 hover:bg-gray-50'
            }`}
          >
            <LineChartIcon className={`h-6 w-6 ${chartType === 'line' ? 'text-indigo-600' : 'text-gray-400'}`} />
            <span className={`mt-2 text-sm ${chartType === 'line' ? 'text-indigo-600 font-medium' : 'text-gray-500'}`}>
              Line
            </span>
          </button>
          <button
            onClick={() => setChartType('pie')}
            className={`flex flex-col items-center justify-center p-3 rounded-lg border ${
              chartType === 'pie' ? 'bg-indigo-50 border-indigo-500 shadow-sm' : 'border-gray-200 hover:bg-gray-50'
            }`}
          >
            <PieChartIcon className={`h-6 w-6 ${chartType === 'pie' ? 'text-indigo-600' : 'text-gray-400'}`} />
            <span className={`mt-2 text-sm ${chartType === 'pie' ? 'text-indigo-600 font-medium' : 'text-gray-500'}`}>
              Pie
            </span>
          </button>
          <button
            onClick={() => setChartType('scatter')}
            className={`flex flex-col items-center justify-center p-3 rounded-lg border ${
              chartType === 'scatter' ? 'bg-indigo-50 border-indigo-500 shadow-sm' : 'border-gray-200 hover:bg-gray-50'
            }`}
          >
            <ScatterChartIcon className={`h-6 w-6 ${chartType === 'scatter' ? 'text-indigo-600' : 'text-gray-400'}`} />
            <span className={`mt-2 text-sm ${chartType === 'scatter' ? 'text-indigo-600 font-medium' : 'text-gray-500'}`}>
              Scatter
            </span>
          </button>
          <button
            onClick={() => setChartType('area')}
            className={`flex flex-col items-center justify-center p-3 rounded-lg border ${
              chartType === 'area' ? 'bg-indigo-50 border-indigo-500 shadow-sm' : 'border-gray-200 hover:bg-gray-50'
            }`}
          >
            <TrendingUp className={`h-6 w-6 ${chartType === 'area' ? 'text-indigo-600' : 'text-gray-400'}`} />
            <span className={`mt-2 text-sm ${chartType === 'area' ? 'text-indigo-600 font-medium' : 'text-gray-500'}`}>
              Area
            </span>
          </button>
        </div>
      </div>

      {/* Data Selection */}
      <div className="bg-gray-50 rounded-lg p-4">
        <h3 className="text-sm font-medium text-gray-700 mb-3">Data Selection</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">X-Axis</label>
            <select
              value={xAxis}
              onChange={(e) => setXAxis(e.target.value)}
              className="w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
            >
              {columns.map((column) => (
                <option key={column} value={column}>
                  {column}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Y-Axis</label>
            <select
              value={yAxis}
              onChange={(e) => setYAxis(e.target.value)}
              className="w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
            >
              {columns.map((column) => (
                <option key={column} value={column}>
                  {column}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Chart Display */}
      <div className="bg-white rounded-lg border border-gray-200 p-4">
        <div className="h-[400px]">
          <ResponsiveContainer width="100%" height="100%">
            {chartType === 'bar' && (
              <BarChart data={chartData}>
                {showGrid && <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />}
                <XAxis
                  dataKey={xAxis}
                  tick={{ fill: '#6B7280' }}
                  axisLine={{ stroke: '#E5E7EB' }}
                />
                <YAxis
                  tick={{ fill: '#6B7280' }}
                  axisLine={{ stroke: '#E5E7EB' }}
                />
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#FFFFFF',
                    border: '1px solid #E5E7EB',
                    borderRadius: '0.375rem',
                  }}
                />
                <Legend />
                <Bar dataKey={yAxis} fill={COLORS[0]} radius={[4, 4, 0, 0]} />
              </BarChart>
            )}
            {chartType === 'line' && (
              <LineChart data={chartData}>
                {showGrid && <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />}
                <XAxis
                  dataKey={xAxis}
                  tick={{ fill: '#6B7280' }}
                  axisLine={{ stroke: '#E5E7EB' }}
                />
                <YAxis
                  tick={{ fill: '#6B7280' }}
                  axisLine={{ stroke: '#E5E7EB' }}
                />
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#FFFFFF',
                    border: '1px solid #E5E7EB',
                    borderRadius: '0.375rem',
                  }}
                />
                <Legend />
                <Line type="monotone" dataKey={yAxis} stroke={COLORS[0]} strokeWidth={2} dot={{ r: 4 }} />
              </LineChart>
            )}
            {chartType === 'pie' && (
              <PieChart>
                <Pie
                  data={chartData}
                  dataKey={yAxis}
                  nameKey={xAxis}
                  cx="50%"
                  cy="50%"
                  outerRadius={150}
                  label
                >
                  {chartData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#FFFFFF',
                    border: '1px solid #E5E7EB',
                    borderRadius: '0.375rem',
                  }}
                />
                <Legend />
              </PieChart>
            )}
            {chartType === 'scatter' && (
              <ScatterChart>
                {showGrid && <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />}
                <XAxis
                  dataKey={xAxis}
                  type="number"
                  name={xAxis}
                  tick={{ fill: '#6B7280' }}
                  axisLine={{ stroke: '#E5E7EB' }}
                />
                <YAxis
                  dataKey={yAxis}
                  type="number"
                  name={yAxis}
                  tick={{ fill: '#6B7280' }}
                  axisLine={{ stroke: '#E5E7EB' }}
                />
                {zAxis && <ZAxis dataKey={zAxis} range={[50, 500]} name={zAxis} />}
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#FFFFFF',
                    border: '1px solid #E5E7EB',
                    borderRadius: '0.375rem',
                  }}
                  cursor={{ strokeDasharray: '3 3' }}
                />
                <Legend />
                <Scatter name={`${xAxis} vs ${yAxis}`} data={chartData} fill={COLORS[0]} />
              </ScatterChart>
            )}
            {chartType === 'area' && (
              <AreaChart data={chartData}>
                {showGrid && <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />}
                <XAxis
                  dataKey={xAxis}
                  tick={{ fill: '#6B7280' }}
                  axisLine={{ stroke: '#E5E7EB' }}
                />
                <YAxis
                  tick={{ fill: '#6B7280' }}
                  axisLine={{ stroke: '#E5E7EB' }}
                />
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#FFFFFF',
                    border: '1px solid #E5E7EB',
                    borderRadius: '0.375rem',
                  }}
                />
                <Legend />
                <Area
                  type="monotone"
                  dataKey={yAxis}
                  stroke={COLORS[0]}
                  fill={COLORS[0]}
                  fillOpacity={0.3}
                />
              </AreaChart>
            )}
          </ResponsiveContainer>
        </div>
      </div>

      {/* Chart Controls */}
      <div className="flex items-center justify-between bg-gray-50 rounded-lg p-4">
        <div className="flex items-center space-x-4">
          <label className="flex items-center">
            <input
              type="checkbox"
              checked={showGrid}
              onChange={(e) => setShowGrid(e.target.checked)}
              className="rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
            />
            <span className="ml-2 text-sm text-gray-700">Show Grid</span>
          </label>
        </div>
        <div>
          <select
            value={colorScheme}
            onChange={(e) => setColorScheme(e.target.value as any)}
            className="rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
          >
            <option value="default">Default Colors</option>
            <option value="blue">Blue Theme</option>
            <option value="green">Green Theme</option>
            <option value="rainbow">Rainbow</option>
          </select>
        </div>
      </div>
    </div>
  );
};

export default Visualization;