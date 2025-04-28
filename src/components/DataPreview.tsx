import React from 'react';

interface DataPreviewProps {
  data: any[];
  columns: string[];
  title?: string;
  maxRows?: number;
  highlightChanges?: {
    originalData: any[];
    changedRows: Set<number>;
    changedCells: Map<string, Set<number>>;
  };
}

const DataPreview: React.FC<DataPreviewProps> = ({ 
  data, 
  columns, 
  title,
  maxRows = 5,
  highlightChanges 
}) => {
  if (!data || data.length === 0 || !columns || columns.length === 0) {
    return (
      <div className="text-center py-4 text-gray-500">
        No data available to preview
      </div>
    );
  }

  const isRowChanged = (rowIndex: number): boolean => {
    return highlightChanges?.changedRows.has(rowIndex) || false;
  };

  const isCellChanged = (rowIndex: number, colIndex: number): boolean => {
    const cellKey = `${rowIndex}-${colIndex}`;
    return highlightChanges?.changedCells.get(columns[colIndex])?.has(rowIndex) || false;
  };

  return (
    <div className="overflow-x-auto">
      {title && (
        <h3 className="text-lg font-medium text-gray-900 mb-4">{title}</h3>
      )}
      <table className="min-w-full divide-y divide-gray-200">
        <thead className="bg-gray-50">
          <tr>
            {columns.map((column, index) => (
              <th
                key={index}
                scope="col"
                className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
              >
                {column}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="bg-white divide-y divide-gray-200">
          {data.slice(0, maxRows).map((row, rowIndex) => (
            <tr 
              key={rowIndex}
              className={isRowChanged(rowIndex) ? 'bg-yellow-50' : ''}
            >
              {columns.map((column, colIndex) => (
                <td
                  key={colIndex}
                  className={`px-6 py-4 whitespace-nowrap text-sm ${
                    isCellChanged(rowIndex, colIndex)
                      ? 'text-indigo-700 bg-indigo-50 font-medium'
                      : 'text-gray-500'
                  }`}
                >
                  {row[colIndex]}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
      {data.length > maxRows && (
        <div className="text-center py-2 text-sm text-gray-500">
          Showing {maxRows} of {data.length} rows
        </div>
      )}
    </div>
  );
};

export default DataPreview;