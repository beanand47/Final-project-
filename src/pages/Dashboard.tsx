import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { BarChart2, FileSpreadsheet, RectangleVertical as CleaningServices, LineChart, FileText, Search, Upload, Trash2, ArrowRightCircle, Filter, TrendingUp, Users, Clock } from 'lucide-react';
import FileExtractor from '../components/FileExtractor';
import { useData } from '../contexts/DataContext';

// Function to format numbers with K, M suffixes
const formatNumber = (num) => {
  if (num >= 1000000) {
    return (num / 1000000).toFixed(1) + 'M';
  }
  if (num >= 1000) {
    return (num / 1000).toFixed(1) + 'K';
  }
  return num.toString();
};

// Function to generate random growth percentages
const getRandomGrowth = () => {
  return (Math.random() * 30 - 5).toFixed(1);
};

const workflows = [
  {
    id: 'visualization',
    name: 'Quick Visualization',
    description: 'Visually explore your data with interactive charts',
    icon: BarChart2,
    runs: 44545,
    growth: getRandomGrowth(),
    href: '/analysis',
    steps: [
      'Upload your data file',
      'Select columns to visualize',
      'Choose chart type and customize',
      'Analyze patterns and insights'
    ]
  },
  {
    id: 'cleaner',
    name: 'Data Cleaner',
    description: 'Methodically clean and prepare your data',
    icon: CleaningServices,
    runs: 11670,
    growth: getRandomGrowth(),
    href: '/data-sources',
    steps: [
      'Import raw data from any source',
      'Identify and handle missing values',
      'Remove duplicates and outliers',
      'Standardize formats and normalize values',
      'Export clean data for analysis'
    ],
    tools: [
      { name: 'Missing Value Handler', icon: Filter },
      { name: 'Duplicate Remover', icon: Trash2 },
      { name: 'Format Standardizer', icon: FileSpreadsheet }
    ]
  },
  {
    id: 'extract',
    name: 'Extract Tables',
    description: 'Extract tables from PDF, Excel, and Word documents',
    icon: FileText,
    runs: 4676,
    growth: getRandomGrowth(),
    href: '/data-sources',
    steps: [
      'Upload your document (PDF, Excel, Word)',
      'Automatic table detection and extraction',
      'Preview and validate extracted tables',
      'Export to desired format for analysis'
    ],
    tools: [
      { name: 'PDF Table Extractor', icon: FileText },
      { name: 'Excel Parser', icon: FileSpreadsheet },
      { name: 'Word Document Parser', icon: FileText }
    ]
  },
  {
    id: 'timeseries',
    name: 'Time Series Analysis',
    description: 'Forecast time series data for predictions',
    icon: LineChart,
    runs: 8094,
    growth: getRandomGrowth(),
    href: '/analysis'
  }
];

export default function Dashboard() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { setDataAndColumns } = useData();
  const [expandedWorkflow, setExpandedWorkflow] = useState<string | null>(null);
  const [animatedRuns, setAnimatedRuns] = useState(workflows.map(w => ({ id: w.id, value: 0 })));
  const [showExtractor, setShowExtractor] = useState(false);
  
  // Animate run counts on load
  useEffect(() => {
    const interval = setInterval(() => {
      setAnimatedRuns(prev => {
        const newValues = [...prev];
        let allComplete = true;
        
        for (let i = 0; i < newValues.length; i++) {
          const workflow = workflows.find(w => w.id === newValues[i].id);
          if (!workflow) continue;
          
          const target = workflow.runs;
          const current = newValues[i].value;
          
          if (current < target) {
            allComplete = false;
            // Increment by approximately 10% of the target each time
            const increment = Math.max(1, Math.floor(target * 0.1));
            newValues[i].value = Math.min(current + increment, target);
          }
        }
        
        if (allComplete) {
          clearInterval(interval);
        }
        
        return newValues;
      });
    }, 100);
    
    return () => clearInterval(interval);
  }, []);

  const toggleWorkflow = (id: string) => {
    if (expandedWorkflow === id) {
      setExpandedWorkflow(null);
    } else {
      setExpandedWorkflow(id);
      if (id === 'extract') {
        setShowExtractor(true);
      } else {
        setShowExtractor(false);
      }
    }
  };

  const handleStartWorkflow = (href: string) => {
    navigate(href);
  };
  
  const handleTablesExtracted = (tables: any[][], fileName: string) => {
    // Use the first table as the data source
    if (tables.length > 0) {
      const headers = tables[0][0];
      const data = tables[0].slice(1);
      setDataAndColumns(data, headers);
      navigate('/data-sources');
    }
  };
  
  // Get run count for a workflow
  const getRunCount = (id: string) => {
    const animated = animatedRuns.find(item => item.id === id);
    return animated ? animated.value : 0;
  };

  return (
    <div className="min-h-screen bg-gray-900 text-white p-8">
      <div className="max-w-7xl mx-auto">
        <h1 className="text-3xl font-bold mb-8">What do you want to analyze today?</h1>

        <div className="relative mb-12">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <Upload className="h-5 w-5 text-gray-400" />
          </div>
          <input
            type="text"
            className="block w-full pl-10 pr-3 py-4 bg-gray-800 border border-gray-700 rounded-lg text-gray-300 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            placeholder="Add a file or start a conversation now and add files later..."
          />
          <div className="absolute inset-y-0 right-0 flex items-center pr-3">
            <button 
              onClick={() => navigate('/data-sources')}
              className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md transition-colors"
            >
              Upload
            </button>
          </div>
        </div>

        {showExtractor && (
          <div className="mb-8">
            <FileExtractor onTablesExtracted={handleTablesExtracted} />
          </div>
        )}

        <div className="flex items-center space-x-4 mb-8">
          <div className="flex items-center space-x-2 bg-gray-800 px-3 py-1.5 rounded-md">
            <span className="text-sm text-gray-300">Default</span>
          </div>
          <div className="flex items-center space-x-2 bg-gray-800 px-3 py-1.5 rounded-md">
            <span className="text-sm text-gray-300">Tools</span>
          </div>
          <div className="flex items-center space-x-2 bg-gray-800 px-3 py-1.5 rounded-md">
            <span className="text-sm text-gray-300">Advanced Reasoning</span>
          </div>
          <div className="flex-grow"></div>
          <button className="flex items-center space-x-2 bg-gray-800 px-3 py-1.5 rounded-md">
            <span className="text-sm text-gray-300">Saved Prompts</span>
          </button>
        </div>

        <h2 className="text-xl font-semibold mb-6">Or start from ready workflows</h2>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {workflows.map((workflow) => {
            const Icon = workflow.icon;
            const isExpanded = expandedWorkflow === workflow.id;
            const runCount = getRunCount(workflow.id);
            const growth = parseFloat(workflow.growth);
            
            return (
              <div
                key={workflow.id}
                className={`block p-6 bg-gray-800 rounded-lg transition-all duration-300 ${
                  isExpanded ? 'col-span-1 md:col-span-2 lg:col-span-3 transform scale-102' : ''
                }`}
              >
                <div className="flex justify-between items-start">
                  <div className="flex items-start space-x-4">
                    <div className="flex items-center justify-center w-12 h-12 bg-blue-600 rounded-full">
                      <Icon className="h-6 w-6 text-white" />
                    </div>
                    <div>
                      <h3 className="text-lg font-semibold">{workflow.name}</h3>
                      <p className="text-gray-400 text-sm">{workflow.description}</p>
                    </div>
                  </div>
                  
                  {(workflow.steps || workflow.tools) && (
                    <button 
                      onClick={() => toggleWorkflow(workflow.id)}
                      className="text-gray-400 hover:text-white transition-colors"
                    >
                      {isExpanded ? 'Less' : 'More'}
                    </button>
                  )}
                </div>
                
                {isExpanded && workflow.steps && (
                  <div className="mt-6 border-t border-gray-700 pt-4">
                    <h4 className="text-sm font-medium text-gray-300 mb-3">Workflow Steps</h4>
                    <ol className="space-y-2">
                      {workflow.steps.map((step, index) => (
                        <li key={index} className="flex items-start">
                          <span className="flex items-center justify-center w-5 h-5 rounded-full bg-blue-600 text-xs mr-2 mt-0.5">
                            {index + 1}
                          </span>
                          <span className="text-sm text-gray-300">{step}</span>
                        </li>
                      ))}
                    </ol>
                    
                    {workflow.tools && (
                      <div className="mt-4">
                        <h4 className="text-sm font-medium text-gray-300 mb-3">Available Tools</h4>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                          {workflow.tools.map((tool, index) => {
                            const ToolIcon = tool.icon;
                            return (
                              <div key={index} className="flex items-center space-x-2 bg-gray-750 p-2 rounded">
                                <ToolIcon className="h-4 w-4 text-blue-400" />
                                <span className="text-sm text-gray-300">{tool.name}</span>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    )}
                    
                    <div className="mt-4 flex justify-end">
                      <button
                        onClick={() => handleStartWorkflow(workflow.href)}
                        className="flex items-center space-x-1 bg-blue-600 hover:bg-blue-700 text-white px-3 py-1.5 rounded text-sm transition-colors"
                      >
                        <span>Start Workflow</span>
                        <ArrowRightCircle className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                )}
                
                <div className={`flex items-center justify-between text-sm ${isExpanded ? 'mt-4' : 'mt-4'}`}>
                  <div className="flex items-center space-x-4">
                    <div className="flex items-center space-x-1">
                      <Clock className="h-4 w-4 text-gray-500" />
                      <span className="text-gray-500">{formatNumber(runCount)} runs</span>
                    </div>
                    
                    <div className="flex items-center space-x-1">
                      <Users className="h-4 w-4 text-gray-500" />
                      <span className="text-gray-500">{Math.floor(runCount / 10)} users</span>
                    </div>
                  </div>
                  
                  <div className={`flex items-center space-x-1 ${growth >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                    <TrendingUp className={`h-4 w-4 ${growth >= 0 ? '' : 'transform rotate-180'}`} />
                    <span>{growth}%</span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}