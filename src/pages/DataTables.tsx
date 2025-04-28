import React from 'react';
import { Table } from 'lucide-react';

export default function DataTables() {
  return (
    <div className="py-6">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 md:px-8">
        <div className="flex items-center">
          <Table className="h-6 w-6 text-gray-400 mr-2" />
          <h1 className="text-2xl font-semibold text-gray-900">Data Tables</h1>
        </div>

        <div className="mt-8">
          <div className="bg-white shadow overflow-hidden sm:rounded-md">
            <div className="px-4 py-5 sm:p-6">
              <div className="text-center text-gray-500">
                <p>No tables available. Upload data or connect to a database to get started.</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}