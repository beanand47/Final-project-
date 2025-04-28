import React, { useState } from 'react';
import { Search, ArrowRight } from 'lucide-react';
import { mean, median, std, min, max } from 'jstat';

interface QueryInputProps {
  data: any[];
  columns: string[];
  onResultsUpdate: (results: any) => void;
}

const QueryInput: React.FC<QueryInputProps> = ({ data, columns, onResultsUpdate }) => {
  const [query, setQuery] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const processQuery = (query: string) => {
    const tokens = query.toLowerCase().split(/\s+/);
    
    // Identify statistical operations
    const operations = {
      average: tokens.some(t => ['average', 'mean', 'avg'].includes(t)),
      median: tokens.some(t => ['median', 'middle'].includes(t)),
      sum: tokens.some(t => ['sum', 'total'].includes(t)),
      max: tokens.some(t => ['maximum', 'max', 'highest'].includes(t)),
      min: tokens.some(t => ['minimum', 'min', 'lowest'].includes(t)),
      count: tokens.some(t => ['count', 'how many'].includes(t)),
      distribution: tokens.some(t => ['distribution', 'spread', 'range'].includes(t))
    };

    // Identify target columns
    const targetColumns = columns.filter(col => 
      tokens.includes(col.toLowerCase()) ||
      tokens.includes(col.toLowerCase().replace(/[^a-z0-9]/g, ''))
    );

    return { operations, targetColumns };
  };

  const calculateResults = (operations: any, targetColumns: string[]) => {
    if (targetColumns.length === 0) {
      throw new Error('Could not identify which column to analyze. Please specify a column name.');
    }

    const results: any = {};
    
    targetColumns.forEach(column => {
      const columnIndex = columns.indexOf(column);
      const values = data
        .map(row => parseFloat(row[columnIndex]))
        .filter(val => !isNaN(val));

      if (values.length === 0) {
        throw new Error(`No numeric values found in column "${column}"`);
      }

      const stats: any = {
        column,
        values: values.length
      };

      if (operations.average) {
        stats.mean = mean(values);
      }
      if (operations.median) {
        stats.median = median(values);
      }
      if (operations.sum) {
        stats.sum = values.reduce((a, b) => a + b, 0);
      }
      if (operations.max) {
        stats.max = max(values);
      }
      if (operations.min) {
        stats.min = min(values);
      }
      if (operations.distribution) {
        stats.standardDeviation = std(values);
        stats.range = max(values) - min(values);
      }

      results[column] = stats;
    });

    return results;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const { operations, targetColumns } = processQuery(query);
      const results = calculateResults(operations, targetColumns);
      onResultsUpdate(results);
    } catch (err: any) {
      setError(err.message || 'Failed to process query');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-4">
      <form onSubmit={handleSubmit} className="max-w-3xl">
        <div className="relative">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <Search className="h-5 w-5 text-gray-400" />
          </div>
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="block w-full pl-10 pr-12 py-3 border border-gray-300 rounded-lg leading-5 bg-white placeholder-gray-500 focus:outline-none focus:placeholder-gray-400 focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
            placeholder="Ask questions about your data (e.g., 'What is the average sales by month?')"
          />
          <div className="absolute inset-y-0 right-0 flex py-1.5 pr-1.5">
            <button
              type="submit"
              disabled={loading || !query.trim()}
              className={`inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white ${
                loading || !query.trim()
                  ? 'bg-gray-400 cursor-not-allowed'
                  : 'bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500'
              }`}
            >
              {loading ? (
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white" />
              ) : (
                <ArrowRight className="h-4 w-4" />
              )}
            </button>
          </div>
        </div>
      </form>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-md text-sm">
          {error}
        </div>
      )}

      <div className="text-sm text-gray-500">
        <p>Try asking questions like:</p>
        <ul className="list-disc list-inside mt-1 space-y-1">
          <li>"What is the average value of [column]?"</li>
          <li>"Show me the distribution of [column]"</li>
          <li>"What is the minimum and maximum [column]?"</li>
          <li>"Calculate the total sum of [column]"</li>
        </ul>
      </div>
    </div>
  );
};

export default QueryInput;