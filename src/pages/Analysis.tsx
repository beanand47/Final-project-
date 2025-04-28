import React, { useState } from 'react';
import { FileUpload, DataPreview, Visualization, QueryInput } from '../components';
import DataStats from '../components/stats/DataStats';
import { useData } from '../contexts/DataContext';
import { useNavigate } from 'react-router-dom';
import { Upload, BarChart2, FileText, MessageSquare, FileSpreadsheet } from 'lucide-react';

interface AnalysisResults {
  [key: string]: {
    column: string;
    values: number;
    mean?: number;
    median?: number;
    sum?: number;
    max?: number;
    min?: number;
    standardDeviation?: number;
    range?: number;
  };
}

const tabs = [
  { id: 'upload', name: 'Data Upload', icon: Upload },
  { id: 'analysis', name: 'Analysis & Insights', icon: BarChart2 },
  { id: 'qna', name: 'Ask Questions', icon: MessageSquare },
  { id: 'reports', name: 'Reports', icon: FileSpreadsheet },
];

export default function Analysis() {
  const navigate = useNavigate();
  const { data, columns, setDataAndColumns } = useData();
  const [selectedColumn, setSelectedColumn] = useState<string>(columns[0] || '');
  const [queryResults, setQueryResults] = useState<AnalysisResults | null>(null);
  const [activeTab, setActiveTab] = useState('upload');

  const handleDataUpload = (parsedData: any[], headers: string[]) => {
    setDataAndColumns(parsedData, headers);
    if (headers.length > 0) {
      setSelectedColumn(headers[0]);
    }
    setQueryResults(null);
    setActiveTab('analysis');
  };

  const handleQueryResults = (results: AnalysisResults) => {
    setQueryResults(results);
  };

  if (data.length === 0) {
    return (
      <div className="py-6">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 md:px-8">
          <div className="text-center py-12">
            <div className="mx-auto h-12 w-12 text-gray-400 mb-4">
              <Upload />
            </div>
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">No Data Available</h2>
            <p className="text-gray-600 mb-8">Upload data or import from a data source to start your analysis</p>
            <div className="space-x-4">
              <button
                onClick={() => navigate('/data-sources')}
                className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
              >
                Go to Data Sources
              </button>
              <FileUpload onDataUpload={handleDataUpload} />
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Navigation Tabs */}
      <div className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex space-x-8">
            {tabs.map((tab) => {
              const Icon = tab.icon;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`${
                    activeTab === tab.id
                      ? 'border-indigo-500 text-indigo-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  } flex items-center px-1 pt-4 pb-4 border-b-2 text-sm font-medium`}
                >
                  <Icon className="h-5 w-5 mr-2" />
                  {tab.name}
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* Content Area */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Upload Section */}
        {activeTab === 'upload' && (
          <div className="space-y-6">
            <div className="bg-white rounded-xl shadow-sm p-6">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">Upload Your Data</h2>
              <FileUpload onDataUpload={handleDataUpload} />
            </div>
            
            {data.length > 0 && (
              <div className="bg-white rounded-xl shadow-sm p-6">
                <h2 className="text-xl font-semibold text-gray-900 mb-4">Data Preview</h2>
                <DataPreview data={data} columns={columns} />
              </div>
            )}
          </div>
        )}

        {/* Analysis Section */}
        {activeTab === 'analysis' && (
          <div className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Column Analysis */}
              <div className="bg-white rounded-xl shadow-sm p-6">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-xl font-semibold text-gray-900">Column Analysis</h2>
                  <select
                    value={selectedColumn}
                    onChange={(e) => setSelectedColumn(e.target.value)}
                    className="mt-1 block w-64 pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm rounded-md"
                  >
                    {columns.map((column) => (
                      <option key={column} value={column}>
                        {column}
                      </option>
                    ))}
                  </select>
                </div>
                <DataStats
                  data={data}
                  column={selectedColumn}
                  columnIndex={columns.indexOf(selectedColumn)}
                />
              </div>

              {/* Visualization */}
              <div className="bg-white rounded-xl shadow-sm p-6">
                <h2 className="text-xl font-semibold text-gray-900 mb-4">Data Visualization</h2>
                <Visualization data={data} columns={columns} />
              </div>
            </div>
          </div>
        )}

        {/* QnA Section */}
        {activeTab === 'qna' && (
          <div className="space-y-6">
            <div className="bg-white rounded-xl shadow-sm p-6">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">Ask Questions About Your Data</h2>
              <QueryInput 
                data={data} 
                columns={columns} 
                onResultsUpdate={handleQueryResults}
              />
            </div>

            {queryResults && (
              <div className="bg-white rounded-xl shadow-sm p-6">
                <h2 className="text-xl font-semibold text-gray-900 mb-4">Analysis Results</h2>
                <div className="grid grid-cols-1 gap-6">
                  {Object.entries(queryResults).map(([column, results]) => (
                    <div key={column} className="bg-gray-50 rounded-lg p-6">
                      <h3 className="text-lg font-medium text-gray-900 mb-4">{column} Analysis</h3>
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                        {Object.entries(results).map(([key, value]) => {
                          if (key === 'column' || key === 'values') return null;
                          return (
                            <div key={key} className="bg-white rounded-lg p-4 shadow-sm">
                              <dt className="text-sm font-medium text-gray-500 capitalize">
                                {key.replace(/([A-Z])/g, ' $1').trim()}
                              </dt>
                              <dd className="mt-1 text-2xl font-semibold text-gray-900">
                                {typeof value === 'number' ? value.toFixed(2) : value}
                              </dd>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* Reports Section */}
        {activeTab === 'reports' && (
          <div className="bg-white rounded-xl shadow-sm p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">Generate Reports</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="bg-gray-50 rounded-lg p-6">
                <FileText className="h-8 w-8 text-indigo-600 mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">PDF Report</h3>
                <p className="text-gray-500 mb-4">Export your analysis results and visualizations in a formatted PDF document.</p>
                <button
                  onClick={() => {/* Add PDF generation logic */}}
                  className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700"
                >
                  Generate PDF
                </button>
              </div>
              
              <div className="bg-gray-50 rounded-lg p-6">
                <FileSpreadsheet className="h-8 w-8 text-green-600 mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">Excel Report</h3>
                <p className="text-gray-500 mb-4">Export your data and analysis results in a detailed Excel spreadsheet.</p>
                <button
                  onClick={() => {/* Add Excel generation logic */}}
                  className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-green-600 hover:bg-green-700"
                >
                  Generate Excel
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}