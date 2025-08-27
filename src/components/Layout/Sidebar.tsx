import React from 'react';
import { useAuth } from '../../context/AuthContext';
import {
  Home,
  FileText,
  CheckCircle,
  BookOpen,
  Users,
  Settings,
  BarChart3,
  PlusCircle,
} from 'lucide-react';

interface SidebarProps {
  activeTab: string;
  onTabChange: (tab: string) => void;
}

export const Sidebar: React.FC<SidebarProps> = ({ activeTab, onTabChange }) => {
  const { user, hasRole } = useAuth();

  if (!user) return null;

  // Check if user is unverified (restricted access)
  const isUnverified = !user.isVerified;
  
  // Debug logging
  console.log('Sidebar - User verification status:', {
    userId: user.id,
    isVerified: user.isVerified,
    isUnverified,
    roles: user.roles,
    permissions: user.roles.flatMap(r => r.permissions)
  });
  
  const hasRestrictedAccess = !isUnverified && user.roles.some(role => 
    role.permissions.includes('dashboard-access') && 
    role.permissions.includes('settings-access') && 
    role.permissions.length === 2
  );

  console.log('Sidebar - Access control:', {
    isUnverified,
    hasRestrictedAccess,
    shouldShowRestrictedSidebar: isUnverified || hasRestrictedAccess
  });

  const menuItems = [
    { id: 'dashboard', label: 'Dashboard', icon: Home, roles: ['admin', 'coordinator', 'reviewer', 'lecturer'] },
    { id: 'questions-management', label: 'Questions Management', icon: FileText, roles: ['admin'] },
    { id: 'questions', label: 'Questions', icon: FileText, roles: ['coordinator', 'reviewer', 'lecturer'] },
    { id: 'submit-question', label: 'Submit Question', icon: PlusCircle, roles: ['lecturer'] },
    { id: 'csv-import', label: 'Import/Export CSV', icon: FileText, roles: ['admin', 'coordinator'] },
    { id: 'review', label: 'Review Questions', icon: CheckCircle, roles: ['reviewer'] },
    { id: 'exams', label: 'Exam Books', icon: BookOpen, roles: ['coordinator'] },
    { id: 'user-management', label: 'User Management', icon: Users, roles: ['admin'] },
    { id: 'analytics', label: 'Analytics', icon: BarChart3, roles: ['admin', 'coordinator'] },
    { id: 'settings', label: 'Account Settings', icon: Settings, roles: ['admin', 'coordinator', 'reviewer', 'lecturer'] },
  ];

  // If user is unverified, show only dashboard and settings
  if (isUnverified || hasRestrictedAccess) {
    const restrictedItems = menuItems.filter(item => item.id === 'dashboard' || item.id === 'settings');
    return (
      <aside className="w-64 bg-white border-r border-gray-200 min-h-screen">
        <nav className="p-4 space-y-2">
          {restrictedItems.map((item) => {
            const Icon = item.icon;
            return (
              <button
                key={item.id}
                onClick={() => onTabChange(item.id)}
                className={`w-full text-left px-4 py-3 rounded-lg transition-all duration-200 flex items-center space-x-3 ${
                  activeTab === item.id
                    ? 'bg-blue-50 text-blue-700 border border-blue-200'
                    : 'text-gray-700 hover:bg-gray-50 hover:text-gray-900'
                }`}
              >
                <Icon size={20} />
                <span className="font-medium">{item.label}</span>
              </button>
            );
          })}
          <div className="mt-4 p-3 bg-orange-50 border border-orange-200 rounded-lg">
            <p className="text-xs text-yellow-800">
              <strong>{isUnverified ? 'Account Pending Verification:' : 'Limited Access:'}</strong> {isUnverified ? 'Your account is awaiting admin approval. Contact administrator for verification.' : 'Contact administrator to assign specific roles for full system access.'}
            </p>
          </div>
        </nav>
      </aside>
    );
  }

  const availableItems = menuItems.filter(item =>
    item.roles.some(role => hasRole(role)) || hasRole('admin')
  );

  return (
    <aside className="w-64 bg-white border-r border-gray-200 min-h-screen">
      <nav className="p-4 space-y-2">
        {availableItems.map((item) => {
          const Icon = item.icon;
          return (
            <button
              key={item.id}
              onClick={() => onTabChange(item.id)}
              className={`w-full text-left px-4 py-3 rounded-lg transition-all duration-200 flex items-center space-x-3 ${
                activeTab === item.id
                  ? 'bg-blue-50 text-blue-700 border border-blue-200'
                  : 'text-gray-700 hover:bg-gray-50 hover:text-gray-900'
              }`}
            >
              <Icon size={20} />
              <span className="font-medium">{item.label}</span>
            </button>
          );
        })}
      </nav>
    </aside>
  );
};