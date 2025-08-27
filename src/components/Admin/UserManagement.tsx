import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { User } from '../../types';

export const UserManagement: React.FC = () => {
  const { user, getAllUsers, updateUserRolesInDb } = useAuth();
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedUsers, setSelectedUsers] = useState<Set<string>>(new Set());
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);
  const [confirmAction, setConfirmAction] = useState<{
    type: 'verify' | 'bulk-verify';
    userId?: string;
    userIds?: string[];
  } | null>(null);

  useEffect(() => {
    loadUsersFromDatabase();
  }, []);

  const loadUsersFromDatabase = async () => {
    try {
      setLoading(true);
      const dbUsers = await getAllUsers();
      setUsers(dbUsers);
    } catch (error) {
      console.error('Failed to load users:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleRoleToggle = async (userId: string, role: string) => {
    const targetUser = users.find(u => u.id === userId);
    if (!targetUser) return;

    try {
      let newRoles = [...targetUser.roles];
      let markVerified = false;

      if (role === 'restricted-lecturer') {
        // Toggle restricted access
        if (newRoles.includes('restricted-lecturer')) {
          newRoles = newRoles.filter(r => r !== 'restricted-lecturer');
          if (newRoles.length === 0) {
            newRoles = ['lecturer'];
          }
        } else {
          newRoles = ['restricted-lecturer'];
        }
      } else {
        // Toggle other roles
        if (newRoles.includes(role)) {
          newRoles = newRoles.filter(r => r !== role);
          if (newRoles.length === 0) {
            newRoles = ['restricted-lecturer'];
          }
        } else {
          newRoles = newRoles.filter(r => r !== 'restricted-lecturer');
          newRoles.push(role);
          markVerified = true;
        }
      }

      // Update local state immediately for UI responsiveness
      setUsers(currentUsers => 
        currentUsers.map(u => 
          u.id === userId 
            ? { ...u, roles: newRoles, is_verified: markVerified || u.is_verified }
            : u
        )
      );

      // Persist to database
      await updateUserRolesInDb(userId, newRoles, markVerified);

    } catch (error) {
      console.error('Failed to persist role changes to database:', error);
      // Reload users to revert UI changes
      loadUsersFromDatabase();
    }
  };

  const handleVerifyUser = (userId: string) => {
    setConfirmAction({ type: 'verify', userId });
    setShowConfirmDialog(true);
  };

  const handleBulkVerify = () => {
    if (selectedUsers.size === 0) return;
    setConfirmAction({ type: 'bulk-verify', userIds: Array.from(selectedUsers) });
    setShowConfirmDialog(true);
  };

  const executeConfirmAction = async () => {
    if (!confirmAction) return;

    try {
      if (confirmAction.type === 'verify' && confirmAction.userId) {
        const targetUser = users.find(u => u.id === confirmAction.userId);
        if (targetUser) {
          await updateUserRolesInDb(confirmAction.userId, targetUser.roles, true);
          setUsers(currentUsers =>
            currentUsers.map(u =>
              u.id === confirmAction.userId ? { ...u, is_verified: true } : u
            )
          );
        }
      } else if (confirmAction.type === 'bulk-verify' && confirmAction.userIds) {
        for (const userId of confirmAction.userIds) {
          const targetUser = users.find(u => u.id === userId);
          if (targetUser) {
            await updateUserRolesInDb(userId, targetUser.roles, true);
          }
        }
        setUsers(currentUsers =>
          currentUsers.map(u =>
            confirmAction.userIds!.includes(u.id) ? { ...u, is_verified: true } : u
          )
        );
        setSelectedUsers(new Set());
      }
    } catch (error) {
      console.error('Failed to verify users:', error);
      loadUsersFromDatabase();
    }

    setShowConfirmDialog(false);
    setConfirmAction(null);
  };

  const handleSelectUser = (userId: string) => {
    const newSelected = new Set(selectedUsers);
    if (newSelected.has(userId)) {
      newSelected.delete(userId);
    } else {
      newSelected.add(userId);
    }
    setSelectedUsers(newSelected);
  };

  const handleSelectAll = () => {
    const unverifiedUsers = users.filter(u => !u.is_verified);
    if (selectedUsers.size === unverifiedUsers.length) {
      setSelectedUsers(new Set());
    } else {
      setSelectedUsers(new Set(unverifiedUsers.map(u => u.id)));
    }
  };

  if (loading) {
    return (
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-8">
        <div className="flex items-center justify-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          <span className="ml-3 text-gray-600">Loading users...</span>
        </div>
      </div>
    );
  }

  const unverifiedUsers = users.filter(u => !u.is_verified);
  const verifiedUsers = users.filter(u => u.is_verified);

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-lg shadow-sm border border-gray-200">
        <div className="p-6 border-b border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-xl font-bold text-gray-900">User Management</h2>
              <p className="text-gray-600 mt-1">
                Manage user roles and verification status
              </p>
            </div>
            {unverifiedUsers.length > 0 && (
              <div className="flex items-center space-x-3">
                <button
                  onClick={handleSelectAll}
                  className="px-3 py-2 text-sm font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-md transition-colors"
                >
                  {selectedUsers.size === unverifiedUsers.length ? 'Deselect All' : 'Select All'}
                </button>
                {selectedUsers.size > 0 && (
                  <button
                    onClick={handleBulkVerify}
                    className="px-4 py-2 bg-green-600 text-white text-sm font-medium rounded-md hover:bg-green-700 transition-colors"
                  >
                    Verify Selected ({selectedUsers.size})
                  </button>
                )}
              </div>
            )}
          </div>
        </div>

        <div className="p-6">
          {unverifiedUsers.length > 0 && (
            <div className="mb-8">
              <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                <span className="w-3 h-3 bg-yellow-400 rounded-full mr-2"></span>
                Pending Verification ({unverifiedUsers.length})
              </h3>
              <div className="space-y-4">
                {unverifiedUsers.map(user => (
                  <UserCard
                    key={user.id}
                    user={user}
                    isSelected={selectedUsers.has(user.id)}
                    onSelect={handleSelectUser}
                    onRoleToggle={handleRoleToggle}
                    onVerify={handleVerifyUser}
                    showVerifyButton={true}
                  />
                ))}
              </div>
            </div>
          )}

          {verifiedUsers.length > 0 && (
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                <span className="w-3 h-3 bg-green-400 rounded-full mr-2"></span>
                Verified Users ({verifiedUsers.length})
              </h3>
              <div className="space-y-4">
                {verifiedUsers.map(user => (
                  <UserCard
                    key={user.id}
                    user={user}
                    isSelected={false}
                    onSelect={() => {}}
                    onRoleToggle={handleRoleToggle}
                    onVerify={() => {}}
                    showVerifyButton={false}
                  />
                ))}
              </div>
            </div>
          )}

          {users.length === 0 && (
            <div className="text-center py-8">
              <p className="text-gray-500">No users found.</p>
            </div>
          )}
        </div>
      </div>

      {/* Confirmation Dialog */}
      {showConfirmDialog && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg max-w-md w-full p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">
              Confirm Action
            </h3>
            <p className="text-gray-600 mb-6">
              {confirmAction?.type === 'verify'
                ? 'Are you sure you want to verify this user?'
                : `Are you sure you want to verify ${confirmAction?.userIds?.length} selected users?`}
            </p>
            <div className="flex justify-end space-x-3">
              <button
                onClick={() => {
                  setShowConfirmDialog(false);
                  setConfirmAction(null);
                }}
                className="px-4 py-2 text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-md transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={executeConfirmAction}
                className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 transition-colors"
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

interface UserCardProps {
  user: User;
  isSelected: boolean;
  onSelect: (userId: string) => void;
  onRoleToggle: (userId: string, role: string) => void;
  onVerify: (userId: string) => void;
  showVerifyButton: boolean;
}

const UserCard: React.FC<UserCardProps> = ({
  user,
  isSelected,
  onSelect,
  onRoleToggle,
  onVerify,
  showVerifyButton
}) => {
  const roles = [
    { key: 'admin', label: 'Admin', color: 'bg-red-100 text-red-800' },
    { key: 'coordinator', label: 'Coordinator', color: 'bg-purple-100 text-purple-800' },
    { key: 'reviewer', label: 'Reviewer', color: 'bg-blue-100 text-blue-800' },
    { key: 'lecturer', label: 'Lecturer', color: 'bg-green-100 text-green-800' },
    { key: 'restricted-lecturer', label: 'Restricted Access', color: 'bg-gray-100 text-gray-800' }
  ];

  return (
    <div className="border border-gray-200 rounded-lg p-4 hover:shadow-sm transition-shadow">
      <div className="flex items-start justify-between">
        <div className="flex items-start space-x-3">
          {showVerifyButton && (
            <input
              type="checkbox"
              checked={isSelected}
              onChange={() => onSelect(user.id)}
              className="mt-1 h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
            />
          )}
          <div className="flex-1">
            <div className="flex items-center space-x-2 mb-2">
              <h4 className="font-medium text-gray-900">
                {user.full_name || 'Unknown User'}
              </h4>
              {!user.is_verified && (
                <span className="px-2 py-1 text-xs font-medium bg-yellow-100 text-yellow-800 rounded-full">
                  Pending
                </span>
              )}
            </div>
            <p className="text-sm text-gray-600 mb-2">{user.email}</p>
            {user.office_location && (
              <p className="text-sm text-gray-500 mb-3">Office: {user.office_location}</p>
            )}
            
            <div className="flex flex-wrap gap-2 mb-3">
              {roles.map(role => (
                <button
                  key={role.key}
                  onClick={() => onRoleToggle(user.id, role.key)}
                  className={`px-3 py-1 text-xs font-medium rounded-full transition-colors ${
                    user.roles.includes(role.key)
                      ? role.color
                      : 'bg-gray-50 text-gray-500 hover:bg-gray-100'
                  }`}
                >
                  {role.label}
                </button>
              ))}
            </div>
          </div>
        </div>
        
        {showVerifyButton && (
          <button
            onClick={() => onVerify(user.id)}
            className="px-3 py-1 bg-green-600 text-white text-sm font-medium rounded-md hover:bg-green-700 transition-colors"
          >
            Verify
          </button>
        )}
      </div>
    </div>
  );
};