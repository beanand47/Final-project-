import React, { useMemo } from 'react';
import { mean, median, min, max } from 'jstat';

interface DataStatsProps {
  data: any[];
  column: string;
  columnIndex: number;
}

export default function DataStats({ data, column, columnIndex }: DataStatsProps) {
  const stats = useMemo(() => {
    try {
      // Filter out non-numeric and invalid values
      const values = data
        .map(row => {
          const val = row[columnIndex];
          const num = typeof val === 'string' ? parseFloat(val) : val;
          return isNaN(num) ? null : num;
        })
        .filter((val): val is number => val !== null);

      // If no valid numeric values, return null
      if (values.length === 0) {
        return null;
      }

      // Calculate standard deviation manually since jstat.std is not working
      const meanValue = mean(values);
      const squareDiffs = values.map(value => Math.pow(value - meanValue, 2));
      const avgSquareDiff = mean(squareDiffs);
      const stdDev = Math.sqrt(avgSquareDiff);

      return {
        mean: meanValue,
        median: median(values),
        stdDev: stdDev,
        min: min(values),
        max: max(values),
        count: values.length
      };
    } catch (error) {
      console.error('Error calculating statistics:', error);
      return null;
    }
  }, [data, columnIndex]);

  // If no stats available, show a message
  if (!stats) {
    return (
      <div className="bg-gray-800 overflow-hidden shadow rounded-lg">
        <div className="px-4 py-5 sm:p-6">
          <h3 className="text-lg leading-6 font-medium text-white">{column} Statistics</h3>
          <p className="mt-2 text-sm text-gray-400">
            No valid numeric data available for analysis
          </p>
        </div>
      </div>
    );
  }

  const formatNumber = (value: number | undefined) => {
    if (value === undefined || value === null || isNaN(value)) {
      return 'N/A';
    }
    try {
      return value.toFixed(2);
    } catch {
      return 'N/A';
    }
  };

  return (
    <div className="bg-gray-800 overflow-hidden shadow rounded-lg">
      <div className="px-4 py-5 sm:p-6">
        <h3 className="text-lg leading-6 font-medium text-white">{column} Statistics</h3>
        <dl className="mt-5 grid grid-cols-2 gap-5">
          <div className="px-4 py-5 bg-gray-750 shadow rounded-lg overflow-hidden sm:p-6">
            <dt className="text-sm font-medium text-gray-300 truncate">Mean</dt>
            <dd className="mt-1 text-3xl font-semibold text-white">
              {formatNumber(stats.mean)}
            </dd>
          </div>
          <div className="px-4 py-5 bg-gray-750 shadow rounded-lg overflow-hidden sm:p-6">
            <dt className="text-sm font-medium text-gray-300 truncate">Median</dt>
            <dd className="mt-1 text-3xl font-semibold text-white">
              {formatNumber(stats.median)}
            </dd>
          </div>
          <div className="px-4 py-5 bg-gray-750 shadow rounded-lg overflow-hidden sm:p-6">
            <dt className="text-sm font-medium text-gray-300 truncate">Standard Deviation</dt>
            <dd className="mt-1 text-3xl font-semibold text-white">
              {formatNumber(stats.stdDev)}
            </dd>
          </div>
          <div className="px-4 py-5 bg-gray-750 shadow rounded-lg overflow-hidden sm:p-6">
            <dt className="text-sm font-medium text-gray-300 truncate">Range</dt>
            <dd className="mt-1 text-3xl font-semibold text-white">
              {formatNumber(stats.min)} - {formatNumber(stats.max)}
            </dd>
          </div>
        </dl>
      </div>
    </div>
  );
}