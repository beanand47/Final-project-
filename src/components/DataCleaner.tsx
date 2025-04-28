import React, { useState, useEffect, useMemo } from 'react';
import { Trash2, Filter, AlertCircle, Check, X, Table, Edit2, Save, RefreshCw, ArrowLeft, ArrowRight } from 'lucide-react';
import { QueryInput, DataPreview } from '.';
import jstat from 'jstat';

interface DataCleanerProps {
  data: any[];
  columns: string[];
  onDataCleaned: (cleanedData: any[], cleanedColumns: string[]) => void;
}

interface ColumnStats {
  missingCount: number;
  uniqueValues: number;
  dataType: string;
  mean?: number;
  median?: number;
  stdDev?: number;
}

interface CleaningStats {
  totalRows: number;
  missingValues: number;
  duplicateRows: number;
  outliers: number;
}

const DataCleaner: React.FC<DataCleanerProps> = ({ data, columns, onDataCleaned }) => {
  const [originalData] = useState<any[]>([...data]);
  const [editableData, setEditableData] = useState<any[]>([]);
  const [editableColumns, setEditableColumns] = useState<string[]>([]);
  const [selectedColumns, setSelectedColumns] = useState<string[]>([]);
  const [cleaningOptions, setCleaningOptions] = useState({
    removeDuplicates: true,
    handleMissingValues: 'remove',
    customValue: '',
    removeOutliers: false,
    standardizeCase: false,
    trimWhitespace: true
  });
  const [isCleaning, setIsCleaning] = useState(false);
  const [cleaningComplete, setCleaningComplete] = useState(false);
  const [activeTab, setActiveTab] = useState<'clean' | 'preview' | 'qna'>('clean');
  const [editingCell, setEditingCell] = useState<{ row: number; col: number } | null>(null);
  const [editValue, setEditValue] = useState('');
  const [columnEditing, setColumnEditing] = useState<string | null>(null);
  const [newColumnName, setNewColumnName] = useState('');
  const [showComparison, setShowComparison] = useState(false);

  useEffect(() => {
    setEditableData([...data]);
    setEditableColumns([...columns]);
    setSelectedColumns([]);
    setCleaningComplete(false);
  }, [data, columns]);

  const columnStats = useMemo(() => {
    const stats: Record<string, ColumnStats> = {};
    
    editableColumns.forEach((column, colIndex) => {
      const values = editableData.map(row => row[colIndex]);
      const numericValues = values.map(v => parseFloat(v)).filter(v => !isNaN(v));
      const uniqueValues = new Set(values).size;
      const missingCount = values.filter(v => v === null || v === undefined || v === '').length;
      
      let dataType = 'text';
      if (numericValues.length === values.length) {
        dataType = 'number';
      } else if (values.every(v => !isNaN(Date.parse(v)))) {
        dataType = 'date';
      }

      stats[column] = {
        missingCount,
        uniqueValues,
        dataType,
        ...(dataType === 'number' && {
          mean: jstat.mean(numericValues),
          median: jstat.median(numericValues),
          stdDev: jstat.stdev(numericValues)
        })
      };
    });

    return stats;
  }, [editableData, editableColumns]);

  const cleaningStats = useMemo(() => {
    const stats: CleaningStats = {
      totalRows: editableData.length,
      missingValues: 0,
      duplicateRows: 0,
      outliers: 0
    };

    editableColumns.forEach((col, colIndex) => {
      stats.missingValues += editableData.filter(
        row => row[colIndex] === null || row[colIndex] === undefined || row[colIndex] === ''
      ).length;
    });

    const stringifiedRows = editableData.map(row => JSON.stringify(row));
    stats.duplicateRows = stringifiedRows.length - new Set(stringifiedRows).size;

    editableColumns.forEach((col, colIndex) => {
      if (columnStats[col].dataType === 'number') {
        const values = editableData.map(row => parseFloat(row[colIndex])).filter(v => !isNaN(v));
        const mean = columnStats[col].mean!;
        const stdDev = columnStats[col].stdDev!;
        stats.outliers += values.filter(v => Math.abs(v - mean) > 3 * stdDev).length;
      }
    });

    return stats;
  }, [editableData, editableColumns, columnStats]);

  const changes = useMemo(() => {
    const changedRows = new Set<number>();
    const changedCells = new Map<string, Set<number>>();

    editableData.forEach((row, rowIndex) => {
      columns.forEach((column, colIndex) => {
        const originalValue = originalData[rowIndex]?.[colIndex];
        const newValue = row[colIndex];

        if (originalValue !== newValue) {
          changedRows.add(rowIndex);
          
          if (!changedCells.has(column)) {
            changedCells.set(column, new Set());
          }
          changedCells.get(column)?.add(rowIndex);
        }
      });
    });

    return {
      originalData,
      changedRows,
      changedCells
    };
  }, [originalData, editableData, columns]);

  const handleColumnRename = (oldName: string) => {
    if (!newColumnName.trim()) return;
    
    const index = editableColumns.indexOf(oldName);
    const updatedColumns = [...editableColumns];
    updatedColumns[index] = newColumnName;
    setEditableColumns(updatedColumns);
    setColumnEditing(null);
    setNewColumnName('');
  };

  const handleCellEdit = (rowIndex: number, colIndex: number) => {
    setEditingCell({ row: rowIndex, col: colIndex });
    setEditValue(editableData[rowIndex][colIndex]?.toString() || '');
  };

  const saveCellEdit = () => {
    if (!editingCell) return;
    
    const newData = [...editableData];
    newData[editingCell.row][editingCell.col] = editValue;
    setEditableData(newData);
    setEditingCell(null);
    setEditValue('');
  };

  const cleanData = () => {
    setIsCleaning(true);
    let cleanedData = [...editableData];
    
    if (cleaningOptions.removeDuplicates) {
      const seen = new Set();
      cleanedData = cleanedData.filter(row => {
        const key = JSON.stringify(row);
        if (seen.has(key)) return false;
        seen.add(key);
        return true;
      });
    }

    if (cleaningOptions.handleMissingValues !== 'keep') {
      const columnsToClean = selectedColumns.length > 0 ? selectedColumns : editableColumns;
      
      cleanedData = cleanedData.map(row => {
        const newRow = [...row];
        columnsToClean.forEach(col => {
          const colIndex = editableColumns.indexOf(col);
          const value = newRow[colIndex];
          
          if (value === null || value === undefined || value === '') {
            if (cleaningOptions.handleMissingValues === 'remove') {
              return null;
            } else if (cleaningOptions.handleMissingValues === 'mean') {
              newRow[colIndex] = columnStats[col].mean || 0;
            } else if (cleaningOptions.handleMissingValues === 'median') {
              newRow[colIndex] = columnStats[col].median || 0;
            } else if (cleaningOptions.handleMissingValues === 'zero') {
              newRow[colIndex] = 0;
            } else if (cleaningOptions.handleMissingValues === 'custom') {
              newRow[colIndex] = cleaningOptions.customValue;
            }
          }
        });
        return newRow;
      }).filter(row => row !== null);
    }

    if (cleaningOptions.removeOutliers) {
      const columnsToCheck = selectedColumns.length > 0 ? selectedColumns : editableColumns;
      
      cleanedData = cleanedData.filter(row => {
        return !columnsToCheck.some(col => {
          const colIndex = editableColumns.indexOf(col);
          if (columnStats[col].dataType !== 'number') return false;
          
          const value = parseFloat(row[colIndex]);
          if (isNaN(value)) return false;
          
          const mean = columnStats[col].mean!;
          const stdDev = columnStats[col].stdDev!;
          return Math.abs(value - mean) > 3 * stdDev;
        });
      });
    }

    if (cleaningOptions.standardizeCase) {
      const columnsToStandardize = selectedColumns.length > 0 ? selectedColumns : editableColumns;
      
      cleanedData = cleanedData.map(row => {
        const newRow = [...row];
        columnsToStandardize.forEach(col => {
          const colIndex = editableColumns.indexOf(col);
          if (typeof newRow[colIndex] === 'string') {
            newRow[colIndex] = newRow[colIndex].toLowerCase();
          }
        });
        return newRow;
      });
    }

    if (cleaningOptions.trimWhitespace) {
      const columnsToTrim = selectedColumns.length > 0 ? selectedColumns : editableColumns;
      
      cleanedData = cleanedData.map(row => {
        const newRow = [...row];
        columnsToTrim.forEach(col => {
          const colIndex = editableColumns.indexOf(col);
          if (typeof newRow[colIndex] === 'string') {
            newRow[colIndex] = newRow[colIndex].trim();
          }
        });
        return newRow;
      });
    }

    setTimeout(() => {
      setEditableData(cleanedData);
      onDataCleaned(cleanedData, editableColumns);
      setIsCleaning(false);
      setCleaningComplete(true);
    }, 1000);
  };

  const handleQueryResponse = (response: any) => {
    // Handle QnA responses here
  };

  return (
    <div className="space-y-6">
      <div className="border-b border-gray-200">
        <nav className="-mb-px flex space-x-8">
          <button
            onClick={() => setActiveTab('clean')}
            className={`${
              activeTab === 'clean'
                ? 'border-indigo-500 text-indigo-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            } whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm`}
          >
            Clean Data
          </button>
          <button
            onClick={() => setActiveTab('preview')}
            className={`${
              activeTab === 'preview'
                ? 'border-indigo-500 text-indigo-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            } whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm`}
          >
            Preview
          </button>
          <button
            onClick={() => setActiveTab('qna')}
            className={`${
              activeTab === 'qna'
                ? 'border-indigo-500 text-indigo-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            } whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm`}
          >
            Ask Questions
          </button>
        </nav>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white rounded-lg shadow p-4">
          <div className="flex items-center">
            <Table className="h-5 w-5 text-gray-400" />
            <span className="ml-2 text-sm font-medium text-gray-500">Total Rows</span>
          </div>
          <p className="mt-2 text-2xl font-semibold text-gray-900">{cleaningStats.totalRows}</p>
        </div>
        
        <div className="bg-white rounded-lg shadow p-4">
          <div className="flex items-center">
            <AlertCircle className="h-5 w-5 text-yellow-400" />
            <span className="ml-2 text-sm font-medium text-gray-500">Missing Values</span>
          </div>
          <p className="mt-2 text-2xl font-semibold text-gray-900">{cleaningStats.missingValues}</p>
        </div>
        
        <div className="bg-white rounded-lg shadow p-4">
          <div className="flex items-center">
            <Trash2 className="h-5 w-5 text-red-400" />
            <span className="ml-2 text-sm font-medium text-gray-500">Duplicate Rows</span>
          </div>
          <p className="mt-2 text-2xl font-semibold text-gray-900">{cleaningStats.duplicateRows}</p>
        </div>
        
        <div className="bg-white rounded-lg shadow p-4">
          <div className="flex items-center">
            <Filter className="h-5 w-5 text-blue-400" />
            <span className="ml-2 text-sm font-medium text-gray-500">Potential Outliers</span>
          </div>
          <p className="mt-2 text-2xl font-semibold text-gray-900">{cleaningStats.outliers}</p>
        </div>
      </div>

      {activeTab === 'clean' && (
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-lg font-medium text-gray-900 mb-4">Cleaning Options</h3>
          
          <div className="mb-6">
            <h4 className="text-sm font-medium text-gray-700 mb-2">Select Columns to Clean</h4>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
              {editableColumns.map((column) => (
                <div key={column} className="flex items-center">
                  <input
                    type="checkbox"
                    id={`col-${column}`}
                    checked={selectedColumns.includes(column)}
                    onChange={(e) => {
                      setSelectedColumns(prev =>
                        e.target.checked
                          ? [...prev, column]
                          : prev.filter(col => col !== column)
                      );
                    }}
                    className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
                  />
                  <label htmlFor={`col-${column}`} className="ml-2 text-sm text-gray-700">
                    {column}
                  </label>
                </div>
              ))}
            </div>
          </div>

          <div className="space-y-4">
            <div className="flex items-center">
              <input
                type="checkbox"
                id="remove-duplicates"
                checked={cleaningOptions.removeDuplicates}
                onChange={(e) => setCleaningOptions(prev => ({ ...prev, removeDuplicates: e.target.checked }))}
                className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
              />
              <label htmlFor="remove-duplicates" className="ml-2 text-sm text-gray-700">
                Remove duplicate rows
              </label>
            </div>

            <div>
              <label className="block text-sm text-gray-700 mb-1">
                Handle missing values
              </label>
              <select
                value={cleaningOptions.handleMissingValues}
                onChange={(e) => setCleaningOptions(prev => ({ ...prev, handleMissingValues: e.target.value }))}
                className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm rounded-md"
              >
                <option value="keep">Keep missing values</option>
                <option value="remove">Remove rows with missing values</option>
                <option value="mean">Replace with column mean (numeric)</option>
                <option value="median">Replace with column median (numeric)</option>
                <option value="zero">Replace with zero (numeric)</option>
                <option value="custom">Replace with custom value</option>
              </select>
              
              {cleaningOptions.handleMissingValues === 'custom' && (
                <input
                  type="text"
                  value={cleaningOptions.customValue}
                  onChange={(e) => setCleaningOptions(prev => ({ ...prev, customValue: e.target.value }))}
                  placeholder="Enter custom value"
                  className="mt-2 block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm rounded-md"
                />
              )}
            </div>

            <div className="flex items-center">
              <input
                type="checkbox"
                id="remove-outliers"
                checked={cleaningOptions.removeOutliers}
                onChange={(e) => setCleaningOptions(prev => ({ ...prev, removeOutliers: e.target.checked }))}
                className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
              />
              <label htmlFor="remove-outliers" className="ml-2 text-sm text-gray-700">
                Remove statistical outliers (±3 standard deviations)
              </label>
            </div>

            <div className="flex items-center">
              <input
                type="checkbox"
                id="standardize-case"
                checked={cleaningOptions.standardizeCase}
                onChange={(e) => setCleaningOptions(prev => ({ ...prev, standardizeCase: e.target.checked }))}
                className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
              />
              <label htmlFor="standardize-case" className="ml-2 text-sm text-gray-700">
                Standardize text to lowercase
              </label>
            </div>

            <div className="flex items-center">
              <input
                type="checkbox"
                id="trim-whitespace"
                checked={cleaningOptions.trimWhitespace}
                onChange={(e) => setCleaningOptions(prev => ({ ...prev, trimWhitespace: e.target.checked }))}
                className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
              />
              <label htmlFor="trim-whitespace" className="ml-2 text-sm text-gray-700">
                Trim whitespace from text fields
              </label>
            </div>
          </div>

          <div className="mt-6 flex justify-end">
            <button
              onClick={cleanData}
              disabled={isCleaning}
              className={`inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white ${
                isCleaning
                  ? 'bg-indigo-400 cursor-not-allowed'
                  : 'bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500'
              }`}
            >
              {isCleaning ? (
                <>
                  <RefreshCw className="animate-spin -ml-1 mr-2 h-4 w-4" />
                  Cleaning...
                </>
              ) : (
                <>
                  <Filter className="mr-2 h-4 w-4" />
                  Clean Data
                </>
              )}
            </button>
          </div>
        </div>
      )}

      {activeTab === 'preview' && (
        <div className="space-y-6">
          <div className="flex justify-between items-center">
            <h3 className="text-lg font-medium text-gray-900">Data Preview</h3>
            <button
              onClick={() => setShowComparison(!showComparison)}
              className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
            >
              {showComparison ? (
                <>
                  <ArrowLeft className="h-4 w-4 mr-2" />
                  Show Single View
                </>
              ) : (
                <>
                  <ArrowRight className="h-4 w-4 mr-2" />
                  Compare Changes
                </>
              )}
            </button>
          </div>

          {showComparison ? (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <div className="bg-white rounded-lg shadow overflow-hidden">
                <DataPreview
                  data={originalData}
                  columns={columns}
                  title="Original Data"
                  maxRows={10}
                />
              </div>
              <div className="bg-white rounded-lg shadow overflow-hidden">
                <DataPreview
                  data={editableData}
                  columns={editableColumns}
                  title="Cleaned Data"
                  maxRows={10}
                  highlightChanges={changes}
                />
              </div>
            </div>
          ) : (
            <div className="bg-white rounded-lg shadow overflow-hidden">
              <DataPreview
                data={editableData}
                columns={editableColumns}
                maxRows={10}
                highlightChanges={changes}
              />
            </div>
          )}

          {editableData.length > 10 && (
            <div className="text-center text-sm text-gray-500">
              Showing 10 of {editableData.length} rows
            </div>
          )}
        </div>
      )}

      {activeTab === 'qna' && (
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-lg font-medium text-gray-900 mb-4">Ask Questions About Your Data</h3>
          <QueryInput
            data={editableData}
            columns={editableColumns}
            onResultsUpdate={handleQueryResponse}
          />
        </div>
      )}

      {cleaningComplete && (
        <div className="fixed bottom-4 right-4 bg-green-50 border border-green-200 rounded-lg p-4 shadow-lg">
          <div className="flex items-center">
            <Check className="h-5 w-5 text-green-400" />
            <span className="ml-2 text-sm font-medium text-green-800">
              Data cleaned successfully!
            </span>
            <button
              onClick={() => setCleaningComplete(false)}
              className="ml-4 text-green-600 hover:text-green-700"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default DataCleaner;