import React, { createContext, useContext, useState } from 'react';

interface DataContextType {
  data: any[];
  columns: string[];
  setDataAndColumns: (data: any[], columns: string[]) => void;
  clearData: () => void;
}

const DataContext = createContext<DataContextType | undefined>(undefined);

export function DataProvider({ children }: { children: React.ReactNode }) {
  const [data, setData] = useState<any[]>([]);
  const [columns, setColumns] = useState<string[]>([]);

  const setDataAndColumns = (newData: any[], newColumns: string[]) => {
    setData(newData);
    setColumns(newColumns);
  };

  const clearData = () => {
    setData([]);
    setColumns([]);
  };

  return (
    <DataContext.Provider value={{ data, columns, setDataAndColumns, clearData }}>
      {children}
    </DataContext.Provider>
  );
}

export function useData() {
  const context = useContext(DataContext);
  if (context === undefined) {
    throw new Error('useData must be used within a DataProvider');
  }
  return context;
}