import React, { useState, useEffect } from 'react';
import { FileText, Table, Loader, AlertCircle, CheckCircle } from 'lucide-react';
import * as XLSX from 'xlsx';
import * as pdfjsLib from 'pdfjs-dist';
import mammoth from 'mammoth';

// Initialize PDF.js worker
pdfjsLib.GlobalWorkerOptions.workerSrc = `//cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjsLib.version}/pdf.worker.min.js`;

interface FileExtractorProps {
  onTablesExtracted: (tables: any[][], fileName: string) => void;
}

export default function FileExtractor({ onTablesExtracted }: FileExtractorProps) {
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [progress, setProgress] = useState(0);
  const [fileName, setFileName] = useState<string>('');

  const detectTableStructure = (textItems: any[]) => {
    // Group text items by their vertical position (y-coordinate)
    const rows = new Map<number, any[]>();
    
    textItems.forEach(item => {
      const y = Math.round(item.transform[5]); // Get y-coordinate and round to handle small differences
      if (!rows.has(y)) {
        rows.set(y, []);
      }
      rows.get(y)?.push({
        text: item.str,
        x: item.transform[4], // x-coordinate
      });
    });

    // Sort rows by y-coordinate (top to bottom)
    const sortedRows = Array.from(rows.entries())
      .sort(([y1], [y2]) => y2 - y1)
      .map(([_, items]) => {
        // Sort items within each row by x-coordinate (left to right)
        return items.sort((a, b) => a.x - b.x).map(item => item.text);
      });

    return sortedRows;
  };

  const extractTablesFromPDF = async (file: ArrayBuffer) => {
    try {
      const pdf = await pdfjsLib.getDocument({ data: file }).promise;
      const numPages = pdf.numPages;
      const tables: any[][] = [];

      for (let pageNum = 1; pageNum <= numPages; pageNum++) {
        setProgress((pageNum / numPages) * 100);
        const page = await pdf.getPage(pageNum);
        const textContent = await page.getTextContent();
        
        // Extract table structure using text positions
        const rows = detectTableStructure(textContent.items);
        
        // Filter out rows that don't look like table data
        const tableRows = rows.filter(row => row.length > 1);
        
        if (tableRows.length > 0) {
          // If we find multiple tables on the page, separate them by empty rows
          const currentTable: string[][] = [];
          let lastRowLength = 0;
          
          tableRows.forEach(row => {
            if (row.length === 0 || (lastRowLength > 0 && Math.abs(row.length - lastRowLength) > 2)) {
              if (currentTable.length > 0) {
                tables.push([...currentTable]);
                currentTable.length = 0;
              }
            } else {
              currentTable.push(row);
              lastRowLength = row.length;
            }
          });
          
          if (currentTable.length > 0) {
            tables.push(currentTable);
          }
        }
      }

      return tables;
    } catch (err) {
      console.error('Error extracting tables from PDF:', err);
      throw new Error('Failed to extract tables from PDF');
    }
  };

  const extractTablesFromExcel = async (file: ArrayBuffer) => {
    try {
      const workbook = XLSX.read(file, { type: 'array' });
      return workbook.SheetNames.map(sheetName => {
        const worksheet = workbook.Sheets[sheetName];
        return XLSX.utils.sheet_to_json(worksheet, { header: 1 });
      }).filter(sheet => sheet.length > 0 && sheet[0].length > 0);
    } catch (err) {
      console.error('Error extracting tables from Excel:', err);
      throw new Error('Failed to extract tables from Excel file');
    }
  };

  const extractTablesFromWord = async (file: ArrayBuffer) => {
    try {
      const result = await mammoth.extractRawText({ arrayBuffer: file });
      const text = result.value;
      
      // Split content into tables based on content structure
      const tables: any[][] = [];
      const lines = text.split('\n');
      let currentTable: any[] = [];
      let potentialTableStart = false;
      
      lines.forEach(line => {
        const cells = line.split(/\t+/).map(cell => cell.trim()).filter(Boolean);
        
        if (cells.length > 1) {
          potentialTableStart = true;
          currentTable.push(cells);
        } else if (potentialTableStart && line.trim() === '') {
          if (currentTable.length > 1) { // At least 2 rows to consider it a table
            tables.push([...currentTable]);
          }
          currentTable = [];
          potentialTableStart = false;
        } else if (potentialTableStart) {
          // Continue current table if we're in a table context
          if (cells.length > 0) {
            currentTable.push(cells);
          }
        }
      });
      
      // Don't forget the last table if it exists
      if (currentTable.length > 1) {
        tables.push(currentTable);
      }
      
      return tables;
    } catch (err) {
      console.error('Error extracting tables from Word:', err);
      throw new Error('Failed to extract tables from Word document');
    }
  };

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setIsProcessing(true);
    setError(null);
    setProgress(0);
    setFileName(file.name);

    try {
      const buffer = await file.arrayBuffer();
      let tables: any[][] = [];

      switch (file.type) {
        case 'application/pdf':
          tables = await extractTablesFromPDF(buffer);
          break;
        case 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet':
        case 'application/vnd.ms-excel':
          tables = await extractTablesFromExcel(buffer);
          break;
        case 'application/vnd.openxmlformats-officedocument.wordprocessingml.document':
        case 'application/msword':
          tables = await extractTablesFromWord(buffer);
          break;
        default:
          throw new Error('Unsupported file type');
      }

      if (tables.length === 0) {
        throw new Error('No tables found in the document');
      }

      onTablesExtracted(tables, file.name);
    } catch (err: any) {
      setError(err.message || 'Failed to extract tables');
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="bg-white p-6 rounded-lg shadow-lg">
      <div className="flex items-center mb-4">
        <FileText className="h-6 w-6 text-indigo-600 mr-2" />
        <h3 className="text-lg font-medium text-gray-900">Table Extractor</h3>
      </div>

      <div className="space-y-4">
        <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center">
          <input
            type="file"
            onChange={handleFileUpload}
            accept=".pdf,.xlsx,.xls,.doc,.docx"
            className="hidden"
            id="file-upload"
            disabled={isProcessing}
          />
          <label
            htmlFor="file-upload"
            className={`cursor-pointer flex flex-col items-center justify-center ${
              isProcessing ? 'opacity-50' : ''
            }`}
          >
            <Table className="h-12 w-12 text-gray-400 mb-3" />
            <span className="text-sm font-medium text-indigo-600">
              {isProcessing ? 'Processing...' : 'Upload document'}
            </span>
            <span className="text-xs text-gray-500 mt-1">
              PDF, Excel, or Word documents
            </span>
          </label>
        </div>

        {isProcessing && (
          <div className="flex items-center justify-center space-x-2">
            <Loader className="h-5 w-5 text-indigo-600 animate-spin" />
            <span className="text-sm text-gray-600">
              Extracting tables from {fileName}... {Math.round(progress)}%
            </span>
          </div>
        )}

        {error && (
          <div className="flex items-center justify-center space-x-2 text-red-600">
            <AlertCircle className="h-5 w-5" />
            <span className="text-sm">{error}</span>
          </div>
        )}

        {!isProcessing && !error && fileName && (
          <div className="flex items-center justify-center space-x-2 text-green-600">
            <CheckCircle className="h-5 w-5" />
            <span className="text-sm">Tables extracted successfully!</span>
          </div>
        )}
      </div>
    </div>
  );
}