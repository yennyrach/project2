import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { User, Role } from '../../types';
import { 
  Search, 
  Filter, 
  Users, 
  UserCheck, 
  UserX, 
  Shield, 
  ChevronLeft,
  ChevronRight,
  CheckSquare,
  Square,
  MoreHorizontal,
  Edit,
  Trash2,
  AlertTriangle,
  Calendar,
  Mail,
  Phone,
  Building,
  ToggleLeft,
  ToggleRight,
  Save,
  X
} from 'lucide-react';

interface UserWithStatus extends User {
  isActive: boolean;
  lastLogin?: string;
  phoneNumber?: string;
}

interface RoleChangeLog {
  userId: string;
  adminId: string;
  adminName: string;
  action: 'add' | 'remove' | 'toggle_account';
  role?: string;
  timestamp: string;
}

export const UserManagement: React.FC = () => {
  const { user, hasRole, getAllUsers, refreshUserDatabase } = useAuth();
  const [users, setUsers] = useState<UserWithStatus[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedDepartment, setSelectedDepartment] = useState('all');
  const [selectedRole, setSelectedRole] = useState('all');
  const [selectedStatus, setSelectedStatus] = useState('all');
  const [currentPage, setCurrentPage] = useState(1);
  const [selectedUsers, setSelectedUsers] = useState<string[]>([]);
  const [showBulkActions, setShowBulkActions] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [sortField, setSortField] = useState<keyof UserWithStatus>('firstName');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc');
  const [roleChangeLogs, setRoleChangeLogs] = useState<RoleChangeLog[]>([]);
  const [showConfirmDialog, setShowConfirmDialog] = useState<{
    show: boolean;
    type: 'disable' | 'enable' | 'remove_roles' | 'bulk_action' | 'verify' | 'bulk_verify';
    userId?: string;
    userCount?: number;
    action?: string;
  }>({ show: false, type: 'disable' });

  const itemsPerPage = 25;

  // Load users from database with proper typing
  const loadUsersFromDatabase = () => {
    console.log('UserManagement: Loading users from database');
    const dbUsers = getAllUsers();
    
    // Convert to UserWithStatus format
    const usersWithStatus: UserWithStatus[] = dbUsers.map(user => ({
      ...user,
      isActive: true, // Default to active
      lastLogin: user.lastLogin || '2024-01-08', // Default last login
      phoneNumber: user.phoneNumber || '', // Ensure phone number exists
    }));
    
    console.log('UserManagement: Loaded users:', usersWithStatus.length);
    setUsers(usersWithStatus);
  };

  if (!user || !hasRole('admin')) {
    return (
      <div className="text-center py-12">
        <AlertTriangle size={48} className="mx-auto text-red-400 mb-4" />
        <h3 className="text-lg font-medium text-gray-900 mb-2">Access Denied</h3>
        <p className="text-gray-600">Only administrators can access user management.</p>
      </div>
    );
  }

  // Mock user data - in real app, this would come from API
  const mockUsers: UserWithStatus[] = [
    {
      id: '1',
      email: 'admin@university.edu',
      firstName: 'Admin',
      lastName: 'User',
      roles: [{ type: 'admin', permissions: ['manage-users', 'verify-accounts', 'system-config'] }],
      isVerified: true,
      createdAt: '2024-01-01',
      isActive: true,
      lastLogin: '2024-01-08',
      phoneNumber: '+1-555-0101',
      department: 'IT Administration'
    },
    {
      id: '2',
      email: 'coordinator@university.edu',
      firstName: 'Jane',
      lastName: 'Coordinator',
      roles: [
        { type: 'lecturer', permissions: ['dashboard-access', 'settings-access'] }
      ],
      isVerified: false,
      createdAt: '2024-01-02',
      department: 'Computer Science',
      isActive: true,
      lastLogin: '2024-01-07',
      phoneNumber: '+1-555-0102'
    },
    {
      id: '3',
      email: 'reviewer@university.edu',
      firstName: 'John',
      lastName: 'Reviewer',
      roles: [
        { type: 'lecturer', permissions: ['dashboard-access', 'settings-access'] }
      ],
      isVerified: false,
      createdAt: '2024-01-03',
      department: 'Mathematics',
      isActive: true,
      lastLogin: '2024-01-06',
      phoneNumber: '+1-555-0103'
    },
    {
      id: '4',
      email: 'lecturer@university.edu',
      firstName: 'Sarah',
      lastName: 'Lecturer',
      roles: [{ type: 'lecturer', permissions: ['dashboard-access', 'settings-access'] }],
      isVerified: false,
      createdAt: '2024-01-04',
      department: 'Physics',
      isActive: true,
      lastLogin: '2024-01-05',
      phoneNumber: '+1-555-0104'
    },
    {
      id: '5',
      email: 'newuser@university.edu',
      firstName: 'New',
      lastName: 'User',
      roles: [{ type: 'lecturer', permissions: ['dashboard-access', 'settings-access'] }],
      isVerified: false,
      createdAt: '2024-01-05',
      department: 'Biology',
      isActive: true,
      lastLogin: '2024-01-08',
      phoneNumber: '+1-555-0105'
    },
    {
      id: '6',
      email: 'pending@university.edu',
      firstName: 'Pending',
      lastName: 'Verification',
      roles: [
        { type: 'lecturer', permissions: ['dashboard-access', 'settings-access'] }
      ],
      isVerified: false,
      createdAt: '2024-01-06',
      department: 'Chemistry',
      isActive: true,
      lastLogin: '2024-01-09',
      phoneNumber: '+1-555-0106'
    }
  ];

  useEffect(() => {
    console.log('UserManagement: Component mounted, loading users from database');
    loadUsersFromDatabase();
    
    // Listen for user database updates
    const handleUserDatabaseUpdate = (event: CustomEvent) => {
      console.log('UserManagement: Received user database update event');
      loadUsersFromDatabase();
    };
    
    const handleUserDatabaseRefresh = () => {
      console.log('UserManagement: Received user database refresh event');
      loadUsersFromDatabase();
    };
    
    // Listen for profile updates from other components
    const handleUserProfileUpdate = () => {
      console.log('UserManagement: Received user profile update event');
      setTimeout(() => loadUsersFromDatabase(), 100); // Small delay to ensure data is saved
    };
    
    window.addEventListener('userDatabaseUpdated', handleUserDatabaseUpdate as EventListener);
    window.addEventListener('userDatabaseRefresh', handleUserDatabaseRefresh);
    window.addEventListener('userProfileUpdated', handleUserProfileUpdate);
    
    return () => {
      window.removeEventListener('userDatabaseUpdated', handleUserDatabaseUpdate as EventListener);
      window.removeEventListener('userDatabaseRefresh', handleUserDatabaseRefresh);
      window.removeEventListener('userProfileUpdated', handleUserProfileUpdate);
    };
  }, []);

  // Filtering and searching logic
  const getFilteredUsers = (): UserWithStatus[] => {
    return users.filter(user => {
      const matchesSearch = 
        `${user.firstName} ${user.lastName}`.toLowerCase().includes(searchTerm.toLowerCase()) ||
        user.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (user.department || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
        (user.phoneNumber || '').toLowerCase().includes(searchTerm.toLowerCase());
      
      const matchesDepartment = selectedDepartment === 'all' || user.department === selectedDepartment;
      const matchesRole = selectedRole === 'all' || user.roles.some(role => role.type === selectedRole);
      const matchesStatus = selectedStatus === 'all' || 
        (selectedStatus === 'active' && user.isActive) ||
        (selectedStatus === 'inactive' && !user.isActive) ||
        (selectedStatus === 'verified' && user.isVerified) ||
        (selectedStatus === 'unverified' && !user.isVerified);

      return matchesSearch && matchesDepartment && matchesRole && matchesStatus;
    });
  };

  // Sorting logic
  const getSortedUsers = (filteredUsers: UserWithStatus[]): UserWithStatus[] => {
    return [...filteredUsers].sort((a, b) => {
      let aValue = a[sortField];
      let bValue = b[sortField];

      // Handle special cases
      if (sortField === 'firstName') {
        aValue = `${a.firstName} ${a.lastName}`;
        bValue = `${b.firstName} ${b.lastName}`;
      }

      if (typeof aValue === 'string' && typeof bValue === 'string') {
        const comparison = aValue.localeCompare(bValue);
        return sortDirection === 'asc' ? comparison : -comparison;
      }

      if (aValue < bValue) return sortDirection === 'asc' ? -1 : 1;
      if (aValue > bValue) return sortDirection === 'asc' ? 1 : -1;
      return 0;
    });
  };

  const filteredUsers = getFilteredUsers();
  const sortedUsers = getSortedUsers(filteredUsers);
  const totalPages = Math.ceil(sortedUsers.length / itemsPerPage);
  const paginatedUsers = sortedUsers.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  const departments = [...new Set(users.map(u => u.department).filter(Boolean))];
  const roleTypes = ['lecturer', 'reviewer', 'coordinator'];

  const handleSort = (field: keyof UserWithStatus) => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('asc');
    }
  };

  const logRoleChange = (userId: string, action: RoleChangeLog['action'], role?: string) => {
    const log: RoleChangeLog = {
      userId,
      adminId: user.id,
      adminName: `${user.firstName} ${user.lastName}`,
      action,
      role,
      timestamp: new Date().toISOString()
    };
    setRoleChangeLogs(prev => [log, ...prev]);
    console.log('Role change logged:', log);
  };

  const handleRoleToggle = async (userId: string, roleType: 'lecturer' | 'reviewer' | 'coordinator') => {
    console.log(`Admin ${user.id} toggling ${roleType} role for user ${userId}`);
    
    try {
      // Find the target user
      const targetUser = users.find(u => u.id === userId);
      if (!targetUser) {
        console.error('Target user not found:', userId);
        return;
      }

      const hasRole = targetUser.roles.some(role => role.type === roleType);
      console.log(`User ${userId} currently has ${roleType} role:`, hasRole);

      // Define comprehensive role permissions
      const rolePermissions = {
        lecturer: ['submit-questions', 'view-questions', 'dashboard-access', 'settings-access'],
        reviewer: ['review-questions', 'approve-questions', 'view-questions', 'dashboard-access', 'settings-access'],
        coordinator: ['create-exams', 'manage-questions', 'view-questions', 'dashboard-access', 'settings-access']
      };

      let newRoles: Role[];
      
      if (hasRole) {
        // Remove the role
        newRoles = targetUser.roles.filter(role => role.type !== roleType);
        console.log(`Removing ${roleType} role from user ${userId}`);
        
        // If removing the only role, set to restricted access
        if (newRoles.length === 0) {
          newRoles = [{ type: 'lecturer', permissions: ['dashboard-access', 'settings-access'] }];
          console.log('User has no roles left, setting to restricted access');
        }
        
        logRoleChange(userId, 'remove', roleType);
      } else {
        // Add the role
        console.log(`Adding ${roleType} role to user ${userId}`);
        
        // Remove any restricted access roles when assigning a real role
        const filteredRoles = targetUser.roles.filter(role => 
          !(role.permissions.includes('dashboard-access') && 
            role.permissions.includes('settings-access') && 
            role.permissions.length === 2)
        );
        
        // Add the new role with full permissions
        newRoles = [...filteredRoles, { 
          type: roleType, 
          permissions: rolePermissions[roleType] 
        }];
        
        logRoleChange(userId, 'add', roleType);
      }

      // Create updated user object
      const updatedUser = {
        ...targetUser,
        roles: newRoles
      };

      console.log('Updated user roles:', updatedUser.roles);

      // Update local state immediately for UI responsiveness
      setUsers(prev => prev.map(u => 
        u.id === userId ? updatedUser : u
      ));

      // Persist to database
      const persistSuccess = await updateUserInDatabase(updatedUser);
      if (!persistSuccess) {
        console.error('Failed to persist role changes to database');
        // Revert local state on database failure
        setUsers(prev => prev.map(u => 
          u.id === userId ? targetUser : u
        ));
        alert('Failed to save role changes. Please try again.');
        return;
      }

      console.log(`Successfully ${hasRole ? 'removed' : 'added'} ${roleType} role for user ${userId}`);
      
      // Update current session if admin is modifying their own roles
      if (userId === user.id) {
        localStorage.setItem('currentUser', JSON.stringify(updatedUser));
        window.dispatchEvent(new Event('userProfileUpdated'));
      }
      
      // Trigger additional events for components that depend on reviewer data
      if (roleType === 'reviewer') {
        console.log('UserManagement: Reviewer role changed, triggering reviewer list refresh...');
        // Dispatch specific event for reviewer list updates
        window.dispatchEvent(new CustomEvent('reviewerListUpdated', {
          detail: { userId, action: hasRole ? 'removed' : 'added' }
        }));
      }

    } catch (error) {
      console.error('Error toggling user role:', error);
      alert('An error occurred while updating user roles. Please try again.');
    }
  };

  // Enhanced database update function with better error handling
  const updateUserInDatabase = async (updatedUser: UserWithStatus): Promise<boolean> => {
    try {
      console.log('Updating user in database:', updatedUser.id);
      
      // Get current database users
      const currentUsers = getAllUsers();
      
      // Update the specific user
      const updatedUsers = currentUsers.map(u => 
        u.id === updatedUser.id ? {
          ...u,
          roles: updatedUser.roles,
          isVerified: updatedUser.isVerified,
          firstName: updatedUser.firstName,
          lastName: updatedUser.lastName,
          email: updatedUser.email,
          phoneNumber: updatedUser.phoneNumber,
          department: updatedUser.department,
          title: updatedUser.title,
          bio: updatedUser.bio,
          officeLocation: updatedUser.officeLocation
        } : u
      );
      
      // Save to database with validation
      const saveSuccess = localStorage.setItem('mockDatabase_users', JSON.stringify(updatedUsers));
      
      // Trigger database update event
      window.dispatchEvent(new CustomEvent('userDatabaseUpdated', { 
        detail: { users: updatedUsers } 
      }));
      
      console.log('User successfully updated in database');
      return true;
      
    } catch (error) {
      console.error('Failed to update user in database:', error);
      return false;
    }
  };

  const verifyUser = (userId: string) => {
    setShowConfirmDialog({
      show: true,
      type: 'verify',
      userId
    });
  };

  const bulkVerify = () => {
    setShowConfirmDialog({
      show: true,
      type: 'bulk_verify',
      userCount: selectedUsers.length,
      action: 'verify'
    });
  };

  const toggleUserStatus = (userId: string) => {
    const targetUser = users.find(u => u.id === userId);
    if (!targetUser) return;

    if (targetUser.isActive) {
      setShowConfirmDialog({
        show: true,
        type: 'disable',
        userId
      });
    } else {
      setUsers(prev => prev.map(u => 
        u.id === userId ? { ...u, isActive: true } : u
      ));
      logRoleChange(userId, 'toggle_account');
    }
  };

  const confirmAction = () => {
    const { type, userId, userCount, action } = showConfirmDialog;
    console.log('confirmAction called:', { type, userId, userCount, action });
    
    if (type === 'disable' && userId) {
      setUsers(prev => prev.map(u => 
        u.id === userId ? { ...u, isActive: false } : u
      ));
      logRoleChange(userId, 'toggle_account');
    } else if (type === 'verify' && userId) {
      console.log('Verifying user:', userId);
      
      // Update user in local state
      setUsers(prev => prev.map(u => {
        if (u.id === userId) {
          console.log('Current user before verification:', u);
          
          // Update roles to remove restricted access and grant proper permissions
          const updatedRoles = u.roles.map(role => {
            console.log('Processing role:', role);
            
            // Check if this is a restricted access role
            if (role.permissions.includes('dashboard-access') && 
                role.permissions.includes('settings-access') && 
                role.permissions.length === 2) {
              
              console.log('Found restricted role, updating permissions...');
              
              // Replace restricted permissions with role-specific permissions
              const rolePermissions = {
                lecturer: ['submit-questions', 'view-questions', 'dashboard-access', 'settings-access'],
                reviewer: ['review-questions', 'approve-questions', 'dashboard-access', 'settings-access'],
                coordinator: ['create-exams', 'manage-questions', 'dashboard-access', 'settings-access'],
                admin: ['manage-users', 'verify-accounts', 'system-config', 'dashboard-access', 'settings-access']
              };
              
              const newPermissions = rolePermissions[role.type as keyof typeof rolePermissions] || role.permissions;
              console.log('New permissions for', role.type, ':', newPermissions);
              
              return {
                ...role,
                permissions: newPermissions
              };
            }
            return role;
          });
          
          const updatedUser = { ...u, isVerified: true, roles: updatedRoles };
          console.log('Updated user after verification:', updatedUser);
          
          // Update the user in the database using AuthContext
          updateUserInDatabase(updatedUser);
          
          // Update current session if verifying self
          const currentUser = JSON.parse(localStorage.getItem('currentUser') || '{}');
          if (currentUser.id === userId) {
            localStorage.setItem('currentUser', JSON.stringify(updatedUser));
            window.dispatchEvent(new Event('userProfileUpdated'));
          }
          
          return updatedUser;
        }
        return u;
      }));
      
      console.log(`User ${userId} verified by admin ${user.id}`);
    } else if (type === 'bulk_action' && action) {
      // Handle bulk actions
      selectedUsers.forEach(userId => {
        if (action === 'activate') {
          setUsers(prev => prev.map(u => {
            if (u.id === userId) {
              // Remove restricted access and grant role-based permissions
              const updatedRoles = u.roles.map(role => {
                if (role.permissions.includes('dashboard-access') && 
                    role.permissions.includes('settings-access') && 
                    role.permissions.length === 2) {
                  // Replace restricted permissions with role-specific permissions
                  const rolePermissions = {
                    lecturer: ['submit-questions', 'view-questions', 'dashboard-access', 'settings-access'],
                    reviewer: ['review-questions', 'approve-questions', 'dashboard-access', 'settings-access'],
                    coordinator: ['create-exams', 'manage-questions', 'dashboard-access', 'settings-access']
                  };
                  return {
                    ...role,
                    permissions: rolePermissions[role.type as keyof typeof rolePermissions] || role.permissions
                  };
                }
                return role;
              });
              
              const updatedUser = {
                ...u,
                isActive: true,
                isVerified: true,
                roles: updatedRoles
              };
              
              // Update in database
              updateUserInDatabase(updatedUser);
              
              return updatedUser;
            }
            return u;
          }));
        } else if (action === 'deactivate') {
          setUsers(prev => prev.map(u => 
            u.id === userId ? { ...u, isActive: false } : u
          ));
        }
        logRoleChange(userId, 'toggle_account');
      });
      setSelectedUsers([]);
    } else if (type === 'bulk_verify' && action === 'verify') {
      selectedUsers.forEach(userId => {
        setUsers(prev => prev.map(u => {
          if (u.id === userId) {
            const updatedRoles = u.roles.map(role => {
              if (role.permissions.includes('dashboard-access') && 
                  role.permissions.includes('settings-access') && 
                  role.permissions.length === 2) {
                const rolePermissions = {
                  lecturer: ['submit-questions', 'view-questions', 'dashboard-access', 'settings-access'],
                  reviewer: ['review-questions', 'approve-questions', 'dashboard-access', 'settings-access'],
                  coordinator: ['create-exams', 'manage-questions', 'dashboard-access', 'settings-access']
                };
                return {
                  ...role,
                  permissions: rolePermissions[role.type as keyof typeof rolePermissions] || role.permissions
                };
              }
              return role;
            });
            
            return {
              ...u,
              isVerified: true,
              roles: updatedRoles
            };
          }
          return u;
        }));
        console.log(`User ${userId} verified by admin ${user.id}`);
      });
      setSelectedUsers([]);
    }
    
    setShowConfirmDialog({ show: false, type: 'disable' });
  };

  const handleUserSelect = (userId: string, selected: boolean) => {
    if (selected) {
      setSelectedUsers(prev => [...prev, userId]);
    } else {
      setSelectedUsers(prev => prev.filter(id => id !== userId));
    }
  };

  const handleSelectAll = (selected: boolean) => {
    if (selected) {
      setSelectedUsers(paginatedUsers.map(u => u.id));
    } else {
      setSelectedUsers([]);
    }
  };

  const bulkActivate = () => {
    setShowConfirmDialog({
      show: true,
      type: 'bulk_action',
      userCount: selectedUsers.length,
      action: 'activate'
    });
  };

  const bulkDeactivate = () => {
    setShowConfirmDialog({
      show: true,
      type: 'bulk_action',
      userCount: selectedUsers.length,
      action: 'deactivate'
    });
  };

  const getRoleColor = (roleType: string) => {
    switch (roleType) {
      case 'lecturer':
        return 'bg-blue-100 text-blue-800';
      case 'reviewer':
        return 'bg-green-100 text-green-800';
      case 'coordinator':
        return 'bg-purple-100 text-purple-800';
      case 'admin':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">User Management</h2>
          <p className="text-gray-600">Manage user accounts, roles, and permissions</p>
        </div>
        
        <div className="flex items-center space-x-3">
          <button
            onClick={() => {
              console.log('UserManagement: Manual refresh triggered');
              refreshUserDatabase();
              loadUsersFromDatabase();
            }}
            className="bg-gray-600 text-white px-4 py-2 rounded-lg hover:bg-gray-700 transition-colors flex items-center space-x-2"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
            <span>Refresh</span>
          </button>
          {selectedUsers.length > 0 && (
            <div className="flex items-center space-x-2">
              <span className="text-sm text-gray-600">{selectedUsers.length} selected</span>
              <button
                onClick={bulkActivate}
                className="bg-green-600 text-white px-3 py-1 rounded text-sm hover:bg-green-700 transition-colors"
              >
                Activate
              </button>
              <button
                onClick={bulkDeactivate}
                className="bg-red-600 text-white px-3 py-1 rounded text-sm hover:bg-red-700 transition-colors"
              >
                Deactivate
              </button>
              <button
                onClick={bulkVerify}
                className="bg-blue-600 text-white px-3 py-1 rounded text-sm hover:bg-blue-700 transition-colors"
              >
                Verify
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Statistics */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white rounded-lg p-4 shadow-sm border border-gray-200">
          <div className="flex items-center space-x-3">
            <div className="bg-blue-100 p-2 rounded-full">
              <Users size={20} className="text-blue-600" />
            </div>
            <div>
              <p className="text-sm text-gray-600">Total Users</p>
              <p className="text-xl font-semibold text-gray-900">{users.length}</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg p-4 shadow-sm border border-gray-200">
          <div className="flex items-center space-x-3">
            <div className="bg-green-100 p-2 rounded-full">
              <UserCheck size={20} className="text-green-600" />
            </div>
            <div>
              <p className="text-sm text-gray-600">Active Users</p>
              <p className="text-xl font-semibold text-gray-900">
                {users.filter(u => u.isActive).length}
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg p-4 shadow-sm border border-gray-200">
          <div className="flex items-center space-x-3">
            <div className="bg-red-100 p-2 rounded-full">
              <UserX size={20} className="text-red-600" />
            </div>
            <div>
              <p className="text-sm text-gray-600">Unverified Users</p>
              <p className="text-xl font-semibold text-gray-900">
                {users.filter(u => !u.isVerified).length}
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg p-4 shadow-sm border border-gray-200">
          <div className="flex items-center space-x-3">
            <div className="bg-purple-100 p-2 rounded-full">
              <Shield size={20} className="text-purple-600" />
            </div>
            <div>
              <p className="text-sm text-gray-600">Verified Users</p>
              <p className="text-xl font-semibold text-gray-900">
                {users.filter(u => u.isVerified).length}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Search and Filters */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
          <div className="md:col-span-2 relative">
            <Search size={20} className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              placeholder="Search users by name, email, department, or phone..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>

          <select
            value={selectedDepartment}
            onChange={(e) => setSelectedDepartment(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          >
            <option value="all">All Departments</option>
            {departments.map(dept => (
              <option key={dept} value={dept}>{dept}</option>
            ))}
          </select>

          <select
            value={selectedRole}
            onChange={(e) => setSelectedRole(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          >
            <option value="all">All Roles</option>
            {roleTypes.map(role => (
              <option key={role} value={role}>
                {role.charAt(0).toUpperCase() + role.slice(1)}
              </option>
            ))}
          </select>

          <select
            value={selectedStatus}
            onChange={(e) => setSelectedStatus(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          >
            <option value="all">All Status</option>
            <option value="active">Active</option>
            <option value="inactive">Inactive</option>
            <option value="verified">Verified</option>
            <option value="unverified">Unverified</option>
          </select>
        </div>

        <div className="mt-4 text-sm text-gray-600">
          Showing {paginatedUsers.length} of {filteredUsers.length} users
        </div>
      </div>

      {/* Users Table */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left">
                  <input
                    type="checkbox"
                    checked={selectedUsers.length === paginatedUsers.length && paginatedUsers.length > 0}
                    onChange={(e) => handleSelectAll(e.target.checked)}
                    className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                  />
                </th>
                <th 
                  className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                  onClick={() => handleSort('firstName')}
                >
                  <div className="flex items-center space-x-1">
                    <span>Full Name</span>
                    {sortField === 'firstName' && (
                      <span>{sortDirection === 'asc' ? '↑' : '↓'}</span>
                    )}
                  </div>
                </th>
                <th 
                  className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                  onClick={() => handleSort('email')}
                >
                  <div className="flex items-center space-x-1">
                    <span>Email</span>
                    {sortField === 'email' && (
                      <span>{sortDirection === 'asc' ? '↑' : '↓'}</span>
                    )}
                  </div>
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Phone
                </th>
                <th 
                  className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                  onClick={() => handleSort('department')}
                >
                  <div className="flex items-center space-x-1">
                    <span>Department</span>
                    {sortField === 'department' && (
                      <span>{sortDirection === 'asc' ? '↑' : '↓'}</span>
                    )}
                  </div>
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Roles
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Verification
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Last Login
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {paginatedUsers.map((user) => (
                <tr key={user.id} className={`hover:bg-gray-50 ${!user.isActive ? 'opacity-60' : ''}`}>
                  <td className="px-6 py-4">
                    <input
                      type="checkbox"
                      checked={selectedUsers.includes(user.id)}
                      onChange={(e) => handleUserSelect(user.id, e.target.checked)}
                      className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                    />
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <div className="w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center text-white text-sm font-medium">
                        {user.firstName.charAt(0)}{user.lastName.charAt(0)}
                      </div>
                      <div className="ml-3">
                        <div className="text-sm font-medium text-gray-900">
                          {user.firstName} {user.lastName}
                        </div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center text-sm text-gray-900">
                      <Mail size={14} className="mr-2 text-gray-400" />
                      {user.email}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center text-sm text-gray-900">
                      <Phone size={14} className="mr-2 text-gray-400" />
                      {user.phoneNumber || 'N/A'}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center text-sm text-gray-900">
                      <Building size={14} className="mr-2 text-gray-400" />
                      {user.department || 'N/A'}
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="space-y-2">
                      {/* Role toggles */}
                      <div className="flex flex-wrap gap-2">
                        {roleTypes.map(roleType => {
                          const hasRole = user.roles.some(role => role.type === roleType);
                          return (
                            <div key={roleType} className="flex items-center space-x-2">
                              <button
                                onClick={() => handleRoleToggle(user.id, roleType as any)}
                                disabled={!user.isActive}
                                className={`flex items-center space-x-1 px-2 py-1 rounded text-xs font-medium transition-all duration-200 ${
                                  hasRole
                                    ? `${getRoleColor(roleType)} border-2 shadow-sm`
                                    : 'bg-gray-100 text-gray-500 border-2 border-gray-300 hover:bg-gray-200 hover:border-gray-400'
                                } ${!user.isActive ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
                              >
                                {hasRole ? (
                                  <ToggleRight size={14} className="text-green-600" />
                                ) : (
                                  <ToggleLeft size={14} className="text-gray-400" />
                                )}
                                <span>{roleType.charAt(0).toUpperCase() + roleType.slice(1)}</span>
                              </button>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <button
                      onClick={() => toggleUserStatus(user.id)}
                      className={`flex items-center space-x-2 px-3 py-1 rounded-full text-xs font-medium transition-colors ${
                        user.isActive
                          ? 'bg-green-100 text-green-800 hover:bg-green-200'
                          : 'bg-red-100 text-red-800 hover:bg-red-200'
                      }`}
                    >
                      {user.isActive ? (
                        <>
                          <UserCheck size={12} />
                          <span>Active</span>
                        </>
                      ) : (
                        <>
                          <UserX size={12} />
                          <span>Inactive</span>
                        </>
                      )}
                    </button>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center space-x-2">
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                        user.isVerified
                          ? 'bg-green-100 text-green-800'
                          : 'bg-orange-100 text-orange-800'
                      }`}>
                        {user.isVerified ? 'Verified' : 'Pending'}
                      </span>
                      {!user.isVerified && (
                        <button
                          onClick={() => verifyUser(user.id)}
                          className="text-blue-600 hover:text-blue-700 text-xs font-medium"
                        >
                          Verify
                        </button>
                      )}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center text-sm text-gray-500">
                      <Calendar size={14} className="mr-2" />
                      {user.lastLogin ? new Date(user.lastLogin).toLocaleDateString() : 'Never'}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center space-x-2">
                      <button className="text-blue-600 hover:text-blue-700 text-sm flex items-center space-x-1">
                        <Edit size={14} />
                        <span>Edit</span>
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="bg-white px-4 py-3 flex items-center justify-between border-t border-gray-200">
            <div className="flex-1 flex justify-between sm:hidden">
              <button
                onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                disabled={currentPage === 1}
                className="relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50"
              >
                Previous
              </button>
              <button
                onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
                disabled={currentPage === totalPages}
                className="ml-3 relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50"
              >
                Next
              </button>
            </div>
            <div className="hidden sm:flex-1 sm:flex sm:items-center sm:justify-between">
              <div>
                <p className="text-sm text-gray-700">
                  Showing <span className="font-medium">{(currentPage - 1) * itemsPerPage + 1}</span> to{' '}
                  <span className="font-medium">
                    {Math.min(currentPage * itemsPerPage, filteredUsers.length)}
                  </span>{' '}
                  of <span className="font-medium">{filteredUsers.length}</span> results
                </p>
              </div>
              <div>
                <nav className="relative z-0 inline-flex rounded-md shadow-sm -space-x-px">
                  <button
                    onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                    disabled={currentPage === 1}
                    className="relative inline-flex items-center px-2 py-2 rounded-l-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50"
                  >
                    <ChevronLeft size={20} />
                  </button>
                  {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                    const page = i + 1;
                    return (
                      <button
                        key={page}
                        onClick={() => setCurrentPage(page)}
                        className={`relative inline-flex items-center px-4 py-2 border text-sm font-medium ${
                          page === currentPage
                            ? 'z-10 bg-blue-50 border-blue-500 text-blue-600'
                            : 'bg-white border-gray-300 text-gray-500 hover:bg-gray-50'
                        }`}
                      >
                        {page}
                      </button>
                    );
                  })}
                  <button
                    onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
                    disabled={currentPage === totalPages}
                    className="relative inline-flex items-center px-2 py-2 rounded-r-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50"
                  >
                    <ChevronRight size={20} />
                  </button>
                </nav>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Confirmation Dialog */}
      {showConfirmDialog.show && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg max-w-md w-full p-6">
            <div className="flex items-center space-x-3 mb-4">
              <AlertTriangle size={24} className="text-orange-600" />
              <h3 className="text-lg font-semibold text-gray-900">Confirm Action</h3>
            </div>
            
            <div className="mb-6">
              {showConfirmDialog.type === 'disable' && (
                <p className="text-gray-700">
                  Are you sure you want to disable this user account? The user will not be able to log in or access any application features.
                </p>
              )}
              {showConfirmDialog.type === 'verify' && (
                <p className="text-gray-700">
                  Are you sure you want to verify this user account? This will grant them access to the full application based on their assigned roles.
                </p>
              )}
              {showConfirmDialog.type === 'bulk_action' && (
                <p className="text-gray-700">
                  Are you sure you want to {showConfirmDialog.action} {showConfirmDialog.userCount} selected user accounts?
                </p>
              )}
              {showConfirmDialog.type === 'bulk_verify' && (
                <p className="text-gray-700">
                  Are you sure you want to verify {showConfirmDialog.userCount} selected user accounts? This will grant them access to the full application based on their assigned roles.
                </p>
              )}
            </div>

            <div className="flex justify-end space-x-3">
              <button
                onClick={() => setShowConfirmDialog({ show: false, type: 'disable' })}
                className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={confirmAction}
                className={`px-4 py-2 text-white rounded-lg transition-colors ${
                  showConfirmDialog.type === 'verify' || showConfirmDialog.type === 'bulk_verify'
                    ? 'bg-blue-600 hover:bg-blue-700'
                    : 'bg-red-600 hover:bg-red-700'
                }`}
              >
                Confirm
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};