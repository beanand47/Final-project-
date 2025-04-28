import React from 'react';
import { useAuth } from '../contexts/AuthContext';
import { Settings as SettingsIcon, User, Bell, Shield, Database } from 'lucide-react';

const settingsSections = [
  {
    id: 'profile',
    name: 'Profile Settings',
    icon: User,
    description: 'Update your profile information and preferences',
  },
  {
    id: 'notifications',
    name: 'Notifications',
    icon: Bell,
    description: 'Configure how you receive notifications',
  },
  {
    id: 'security',
    name: 'Security',
    icon: Shield,
    description: 'Manage your security settings and authentication methods',
  },
  {
    id: 'data',
    name: 'Data Management',
    icon: Database,
    description: 'Configure data storage and processing preferences',
  },
];

export default function Settings() {
  const { user } = useAuth();

  return (
    <div className="py-6">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 md:px-8">
        <div className="flex items-center">
          <SettingsIcon className="h-6 w-6 text-gray-400 mr-2" />
          <h1 className="text-2xl font-semibold text-gray-900">Settings</h1>
        </div>

        <div className="mt-8">
          <div className="bg-white shadow overflow-hidden sm:rounded-lg">
            <div className="px-4 py-5 sm:p-6">
              <div className="mb-6">
                <h3 className="text-lg font-medium text-gray-900">Account Information</h3>
                <p className="mt-1 text-sm text-gray-500">Email: {user?.email}</p>
              </div>

              <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
                {settingsSections.map((section) => {
                  const Icon = section.icon;
                  return (
                    <div
                      key={section.id}
                      className="relative rounded-lg border border-gray-300 bg-white px-6 py-5 shadow-sm flex items-center space-x-3 hover:border-gray-400 focus-within:ring-2 focus-within:ring-offset-2 focus-within:ring-indigo-500"
                    >
                      <div className="flex-shrink-0">
                        <Icon className="h-6 w-6 text-gray-400" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <a href="#" className="focus:outline-none">
                          <span className="absolute inset-0" aria-hidden="true" />
                          <p className="text-sm font-medium text-gray-900">{section.name}</p>
                          <p className="text-sm text-gray-500 truncate">{section.description}</p>
                        </a>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}