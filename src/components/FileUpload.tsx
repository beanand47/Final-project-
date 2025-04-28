import React, { useCallback, useState } from 'react';
import { Upload, FileType, AlertCircle, CheckCircle } from 'lucide-react';
import Papa from 'papaparse';
import * as XLSX from 'xlsx';

interface FileUploadProps {
  onDataUpload: (data: any[], headers: string[]) => void;
  className?: string;
}

const FileUpload: React.FC<FileUploadProps> = ({ onDataUpload, className }) => {
  const [isDragging, setIsDragging] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [isUploading, setIsUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const handleDragOver = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(false);
  }, []);

  const handleDrop = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(false);
    
    const files = e.dataTransfer.files;
    if (files.length > 0) {
      processFile(files[0]);
    }
  }, []);

  const processFile = useCallback((file: File) => {
    setIsUploading(true);
    setUploadProgress(0);
    setError(null);
    setSuccess(false);

    const fileExtension = file.name.split('.').pop()?.toLowerCase();
    const validExtensions = ['csv', 'xlsx', 'xls'];

    if (!validExtensions.includes(fileExtension || '')) {
      setError(`Invalid file type. Please upload a CSV or Excel file.`);
      setIsUploading(false);
      return;
    }

    if (file.size > 10 * 1024 * 1024) { // 10MB limit
      setError(`File size exceeds 10MB limit.`);
      setIsUploading(false);
      return;
    }

    // Simulate progress
    const progressInterval = setInterval(() => {
      setUploadProgress(prev => {
        if (prev >= 90) {
          clearInterval(progressInterval);
          return prev;
        }
        return prev + 10;
      });
    }, 100);

    if (fileExtension === 'csv') {
      Papa.parse(file, {
        complete: (results) => {
          clearInterval(progressInterval);
          setUploadProgress(100);
          
          if (results.errors && results.errors.length > 0) {
            setError(`Error parsing CSV: ${results.errors[0].message}`);
            setIsUploading(false);
            return;
          }
          
          const headers = results.data[0] as string[];
          const data = results.data.slice(1) as any[];
          
          setTimeout(() => {
            onDataUpload(data, headers);
            setIsUploading(false);
            setSuccess(true);
          }, 500);
        },
        header: false,
        skipEmptyLines: true,
        error: (error) => {
          clearInterval(progressInterval);
          setError(`Error parsing CSV: ${error.message}`);
          setIsUploading(false);
        }
      });
    } else if (['xlsx', 'xls'].includes(fileExtension || '')) {
      const reader = new FileReader();
      reader.onload = (e) => {
        try {
          clearInterval(progressInterval);
          setUploadProgress(100);
          
          const data = e.target?.result;
          const workbook = XLSX.read(data, { type: 'binary' });
          const sheetName = workbook.SheetNames[0];
          const worksheet = workbook.Sheets[sheetName];
          const jsonData = XLSX.utils.sheet_to_json(worksheet, { header: 1 });
          
          if (jsonData.length === 0) {
            setError('The Excel file appears to be empty.');
            setIsUploading(false);
            return;
          }
          
          const headers = jsonData[0] as string[];
          const rows = jsonData.slice(1) as any[];
          
          setTimeout(() => {
            onDataUpload(rows, headers);
            setIsUploading(false);
            setSuccess(true);
          }, 500);
        } catch (error: any) {
          console.error('Error processing Excel file:', error);
          setError(`Error processing Excel file: ${error.message || 'Unknown error'}`);
          setIsUploading(false);
        }
      };
      reader.onerror = () => {
        clearInterval(progressInterval);
        setError('Error reading the file. Please try again.');
        setIsUploading(false);
      };
      reader.readAsBinaryString(file);
    }
  }, [onDataUpload]);

  const handleFileUpload = useCallback((event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      processFile(file);
    }
  }, [processFile]);

  return (
    <div className={className}>
      <div
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        className={`relative cursor-pointer bg-white rounded-lg border-2 ${
          isDragging ? 'border-indigo-500 bg-indigo-50' : 'border-dashed border-gray-300'
        } p-12 text-center hover:border-gray-400 focus:outline-none transition-all duration-200`}
      >
        <input
          id="file-upload"
          name="file-upload"
          type="file"
          className="sr-only"
          accept=".csv,.xlsx,.xls"
          onChange={handleFileUpload}
          disabled={isUploading}
        />
        
        {isUploading ? (
          <div className="space-y-4">
            <div className="flex justify-center">
              <svg className="animate-spin h-10 w-10 text-indigo-500" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
            </div>
            <div>
              <p className="text-sm font-medium text-gray-700">Processing file...</p>
              <div className="w-full bg-gray-200 rounded-full h-2.5 mt-2">
                <div 
                  className="bg-indigo-600 h-2.5 rounded-full transition-all duration-300" 
                  style={{ width: `${uploadProgress}%` }}
                ></div>
              </div>
            </div>
          </div>
        ) : success ? (
          <div className="space-y-3">
            <div className="flex justify-center">
              <CheckCircle className="h-12 w-12 text-green-500" />
            </div>
            <div className="text-green-600">
              <p className="font-medium">Upload Successful!</p>
              <p className="mt-1 text-sm">Your file has been processed.</p>
            </div>
          </div>
        ) : (
          <div className="space-y-3">
            <div className="flex justify-center">
              {error ? (
                <AlertCircle className="h-12 w-12 text-red-500" />
              ) : (
                <Upload className="h-12 w-12 text-gray-400" />
              )}
            </div>
            
            {error ? (
              <div className="text-red-500 text-sm">
                <p className="font-medium">{error}</p>
                <p className="mt-1">Please try again with a different file.</p>
              </div>
            ) : (
              <>
                <div className="flex text-sm text-gray-600 justify-center">
                  <label htmlFor="file-upload" className="relative cursor-pointer rounded-md font-medium text-indigo-600 hover:text-indigo-500 focus-within:outline-none focus-within:ring-2 focus-within:ring-offset-2 focus-within:ring-indigo-500">
                    <span>Upload a file</span>
                  </label>
                  <p className="pl-1">or drag and drop</p>
                </div>
                <p className="text-xs text-gray-500">CSV, Excel files up to 10MB</p>
                <div className="flex justify-center space-x-2 text-xs text-gray-400">
                  <FileType className="h-4 w-4" />
                  <span>.csv, .xlsx, .xls</span>
                </div>
              </>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default FileUpload;