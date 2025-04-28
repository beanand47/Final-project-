import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import {
  BarChart2,
  Home,
  Database,
  LineChart,
  Table,
  Settings,
  LogOut,
  Upload,
  FileSpreadsheet,
  Calculator,
  PieChart,
  Share2,
  Download,
} from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { useData } from '../../contexts/DataContext';

const navigation = [
  { name: 'Dashboard', icon: Home, href: '/' },
  { name: 'Data Sources', icon: Database, href: '/data-sources' },
  { name: 'Analysis', icon: Calculator, href: '/analysis' },
  { name: 'Data Tables', icon: Table, href: '/tables' },
  { section: 'Tools' },
  { name: 'Import Data', icon: Upload, href: '/data-sources' },
  { name: 'Export Data', icon: Download, href: '/data-sources' },
  { name: 'Spreadsheet', icon: FileSpreadsheet, href: '/tables' },
  { name: 'Charts', icon: PieChart, href: '/analysis' },
  { section: 'Sharing' },
  { name: 'Share Analysis', icon: Share2, href: '/analysis' },
  { name: 'Reports', icon: LineChart, href: '/analysis' },
];

export default function Sidebar() {
  const location = useLocation();
  const { signOut } = useAuth();
  const { clearData } = useData();

  const handleSignOut = async () => {
    await signOut();
    clearData();
  };

  return (
    <div className="hidden lg:flex lg:flex-shrink-0">
      <div className="flex flex-col w-64">
        <div className="flex flex-col flex-grow bg-gray-900 pt-5 pb-4 overflow-y-auto">
          <div className="flex items-center flex-shrink-0 px-4">
            <BarChart2 className="h-8 w-8 text-blue-600" />
            <span className="ml-2 text-white text-lg font-semibold">Data Analysis</span>
          </div>
          <nav className="mt-8 flex-1 flex flex-col overflow-y-auto">
            <div className="px-3 space-y-1">
              {navigation.map((item, index) => {
                if ('section' in item) {
                  return (
                    <div key={index} className="pt-4 pb-2">
                      <p className="px-3 text-xs font-semibold text-gray-400 uppercase tracking-wider">
                        {item.section}
                      </p>
                    </div>
                  );
                }

                const Icon = item.icon;
                return (
                  <Link
                    key={item.name}
                    to={item.href}
                    className={`
                      group flex items-center px-3 py-2 text-sm font-medium rounded-md
                      ${location.pathname === item.href
                        ? 'bg-gray-800 text-white'
                        : 'text-gray-300 hover:bg-gray-800 hover:text-white'
                      }
                    `}
                  >
                    <Icon className="mr-3 flex-shrink-0 h-5 w-5" />
                    {item.name}
                  </Link>
                );
              })}
            </div>
            <div className="mt-auto px-3 space-y-1">
              <button
                onClick={handleSignOut}
                className="group flex items-center px-3 py-2 text-sm font-medium rounded-md text-gray-300 hover:bg-gray-800 hover:text-white w-full"
              >
                <LogOut className="mr-3 flex-shrink-0 h-5 w-5" />
                Sign Out
              </button>
            </div>
          </nav>
        </div>
      </div>
    </div>
  );
}