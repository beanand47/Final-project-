import React, { useState } from 'react';
import { FileUpload, DataPreview, Visualization } from '.';
import { Download, FileQuestion, PieChart, FileText } from 'lucide-react';
import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';
import * as XLSX from 'xlsx';

interface AnalysisResult {
  question: string;
  answer: string;
  visualization?: React.ReactNode;
}

export default function DataAnalysis() {
  const [data, setData] = useState<any[]>([]);
  const [columns, setColumns] = useState<string[]>([]);
  const [question, setQuestion] = useState('');
  const [analysisResults, setAnalysisResults] = useState<AnalysisResult[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  const handleDataUpload = (parsedData: any[], headers: string[]) => {
    setData(parsedData);
    setColumns(headers);
    setAnalysisResults([]);
  };

  const analyzeData = (question: string) => {
    setIsLoading(true);
    const lowerQuestion = question.toLowerCase();
    let result: AnalysisResult = { question, answer: '' };

    try {
      // Total calculations
      if (lowerQuestion.includes('total') || lowerQuestion.includes('sum')) {
        const column = columns.find(col => 
          lowerQuestion.includes(col.toLowerCase())
        );
        
        if (column) {
          const sum = data.reduce((acc, row) => {
            const value = parseFloat(row[columns.indexOf(column)]);
            return acc + (isNaN(value) ? 0 : value);
          }, 0);
          
          result.answer = `The total ${column} is ${sum.toLocaleString()}`;
          result.visualization = (
            <Visualization
              data={data}
              columns={columns}
              type="bar"
              xAxis={column}
              yAxis={column}
              aggregation="sum"
            />
          );
        }
      }
      
      // Highest/Top values
      else if (lowerQuestion.includes('highest') || lowerQuestion.includes('top')) {
        const column = columns.find(col => 
          lowerQuestion.includes(col.toLowerCase())
        );
        
        if (column) {
          const sortedData = [...data].sort((a, b) => {
            const valA = parseFloat(a[columns.indexOf(column)]);
            const valB = parseFloat(b[columns.indexOf(column)]);
            return valB - valA;
          });
          
          const limit = lowerQuestion.includes('top 5') ? 5 : 1;
          const topItems = sortedData.slice(0, limit);
          
          result.answer = `Top ${limit} ${column}:\n` + 
            topItems.map((item, i) => 
              `${i + 1}. ${item[columns.indexOf(column)]}`
            ).join('\n');
            
          result.visualization = (
            <Visualization
              data={topItems}
              columns={columns}
              type="pie"
              xAxis={columns[0]}
              yAxis={column}
            />
          );
        }
      }
      
      // Default response for unrecognized questions
      if (!result.answer) {
        result.answer = "I'm not sure how to answer that question. Try asking about totals or highest values in specific columns.";
      }
    } catch (error) {
      result.answer = "Sorry, I couldn't analyze that. Please try a different question.";
    }

    setAnalysisResults(prev => [...prev, result]);
    setIsLoading(false);
  };

  const generateReport = (format: 'pdf' | 'excel') => {
    if (format === 'pdf') {
      const doc = new jsPDF();
      
      doc.setFontSize(20);
      doc.text('Data Analysis Report', 20, 20);
      
      let yPos = 40;
      
      analysisResults.forEach((result, index) => {
        doc.setFontSize(12);
        doc.text(`Q${index + 1}: ${result.question}`, 20, yPos);
        yPos += 10;
        
        doc.setFontSize(10);
        const splitAnswer = doc.splitTextToSize(result.answer, 170);
        doc.text(splitAnswer, 20, yPos);
        yPos += splitAnswer.length * 7 + 10;
      });
      
      if (data.length > 0) {
        autoTable(doc, {
          head: [columns],
          body: data.slice(0, 5).map(row => columns.map(col => row[columns.indexOf(col)])),
          startY: yPos,
          margin: { top: 20 },
        });
      }
      
      doc.save('data-analysis-report.pdf');
    } else {
      const wb = XLSX.utils.book_new();
      
      // Add analysis results
      const analysisSheet = [
        ['Question', 'Answer'],
        ...analysisResults.map(result => [result.question, result.answer])
      ];
      XLSX.utils.book_append_sheet(wb, XLSX.utils.aoa_to_sheet(analysisSheet), 'Analysis');
      
      // Add data preview
      if (data.length > 0) {
        const dataSheet = [
          columns,
          ...data.map(row => columns.map(col => row[columns.indexOf(col)]))
        ];
        XLSX.utils.book_append_sheet(wb, XLSX.utils.aoa_to_sheet(dataSheet), 'Data');
      }
      
      XLSX.writeFile(wb, 'data-analysis-report.xlsx');
    }
  };

  return (
    <div className="space-y-8 p-6">
      {/* Upload Section */}
      <div className="bg-white rounded-lg shadow-lg p-6">
        <h2 className="text-xl font-semibold mb-4">Upload Data</h2>
        <FileUpload onDataUpload={handleDataUpload} />
        
        {data.length > 0 && (
          <div className="mt-4">
            <DataPreview data={data} columns={columns} />
          </div>
        )}
      </div>

      {/* QnA Section */}
      {data.length > 0 && (
        <div className="bg-white rounded-lg shadow-lg p-6">
          <h2 className="text-xl font-semibold mb-4">Ask Questions About Your Data</h2>
          
          <div className="flex gap-2">
            <input
              type="text"
              value={question}
              onChange={(e) => setQuestion(e.target.value)}
              placeholder="e.g., What is the total sales? or Show top 5 customers"
              className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
            <button
              onClick={() => analyzeData(question)}
              disabled={isLoading || !question.trim()}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-blue-300 disabled:cursor-not-allowed flex items-center gap-2"
            >
              <FileQuestion className="h-5 w-5" />
              Analyze
            </button>
          </div>

          {/* Analysis Results */}
          <div className="mt-6 space-y-6">
            {analysisResults.map((result, index) => (
              <div key={index} className="bg-gray-50 rounded-lg p-4">
                <div className="flex items-start gap-3">
                  <PieChart className="h-5 w-5 text-blue-600 mt-1" />
                  <div>
                    <p className="font-medium text-gray-900">{result.question}</p>
                    <p className="mt-1 text-gray-600 whitespace-pre-line">{result.answer}</p>
                  </div>
                </div>
                {result.visualization && (
                  <div className="mt-4 h-64">
                    {result.visualization}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Report Generation */}
      {analysisResults.length > 0 && (
        <div className="bg-white rounded-lg shadow-lg p-6">
          <h2 className="text-xl font-semibold mb-4">Generate Report</h2>
          
          <div className="flex gap-4">
            <button
              onClick={() => generateReport('pdf')}
              className="flex items-center gap-2 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700"
            >
              <FileText className="h-5 w-5" />
              Export as PDF
            </button>
            <button
              onClick={() => generateReport('excel')}
              className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
            >
              <Download className="h-5 w-5" />
              Export as Excel
            </button>
          </div>
        </div>
      )}
    </div>
  );
}