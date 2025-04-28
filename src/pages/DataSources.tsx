import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { FileUpload, DataPreview, DataCleaner } from '../components';
import { Database, FileSpreadsheet, Table2, ArrowRight, CheckCircle } from 'lucide-react';
import { useData } from '../contexts/DataContext';

const sourceTypes = [
  {
    id: 'file',
    name: 'File Upload',
    description: 'Upload CSV, Excel, or JSON files',
    icon: FileSpreadsheet,
  },
  {
    id: 'database',
    name: 'Database Connection',
    description: 'Connect to SQL databases',
    icon: Database,
  },
  {
    id: 'api',
    name: 'API Integration',
    description: 'Connect to external APIs',
    icon: Table2,
  },
];

export default function DataSources() {
  const navigate = useNavigate();
  const { data, columns, setDataAndColumns } = useData();
  const [activeTab, setActiveTab] = useState<'upload' | 'clean'>('upload');
  const [dataCleaningComplete, setDataCleaningComplete] = useState(false);

  const handleDataUpload = (parsedData: any[], headers: string[]) => {
    setDataAndColumns(parsedData, headers);
    setDataCleaningComplete(false);
  };

  const handleDataCleaned = (cleanedData: any[], cleanedColumns: string[]) => {
    setDataAndColumns(cleanedData, cleanedColumns);
    setDataCleaningComplete(true);
  };

  const handleAnalyze = () => {
    navigate('/analysis');
  };

  return (
    <div className="py-6">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 md:px-8">
        <h1 className="text-2xl font-semibold text-gray-900">Data Sources</h1>
        
        <div className="mt-8">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {sourceTypes.map((type) => {
              const Icon = type.icon;
              return (
                <div
                  key={type.id}
                  className="relative rounded-lg border border-gray-300 bg-white px-6 py-5 shadow-sm flex items-center space-x-3 hover:border-gray-400 focus-within:ring-2 focus-within:ring-offset-2 focus-within:ring-indigo-500"
                >
                  <div className="flex-shrink-0">
                    <Icon className="h-6 w-6 text-gray-400" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <a href="#" className="focus:outline-none">
                      <span className="absolute inset-0" aria-hidden="true" />
                      <p className="text-sm font-medium text-gray-900">{type.name}</p>
                      <p className="text-sm text-gray-500 truncate">{type.description}</p>
                    </a>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {data.length > 0 ? (
          <div className="mt-8">
            <div className="border-b border-gray-200">
              <nav className="-mb-px flex space-x-8">
                <button
                  onClick={() => setActiveTab('upload')}
                  className={`${
                    activeTab === 'upload'
                      ? 'border-indigo-500 text-indigo-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  } whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm`}
                >
                  Upload Data
                </button>
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
              </nav>
            </div>

            <div className="mt-6">
              {activeTab === 'upload' ? (
                <>
                  <div className="mb-6">
                    <h2 className="text-lg font-medium text-gray-900 mb-4">Upload Data</h2>
                    <FileUpload onDataUpload={handleDataUpload} />
                  </div>
                  
                  <div className="mt-8">
                    <h2 className="text-lg font-medium text-gray-900 mb-4">Preview</h2>
                    <DataPreview data={data} columns={columns} />
                  </div>
                </>
              ) : (
                <DataCleaner 
                  data={data} 
                  columns={columns} 
                  onDataCleaned={handleDataCleaned} 
                />
              )}
            </div>
            
            <div className="mt-8 flex justify-end">
              {dataCleaningComplete && (
                <div className="flex items-center text-green-600 mr-4">
                  <CheckCircle className="h-5 w-5 mr-1" />
                  <span>Data cleaned and ready for analysis!</span>
                </div>
              )}
              <button
                onClick={handleAnalyze}
                className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
              >
                Analyze Data
                <ArrowRight className="ml-2 h-4 w-4" />
              </button>
            </div>
          </div>
        ) : (
          <div className="mt-8">
            <h2 className="text-lg font-medium text-gray-900">Upload Data</h2>
            <div className="mt-4">
              <FileUpload onDataUpload={handleDataUpload} />
            </div>
          </div>
        )}
      </div>
    </div>
  );
}