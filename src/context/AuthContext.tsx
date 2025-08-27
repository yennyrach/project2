import React, { createContext, useContext, useState, useEffect } from 'react';
import { User } from '../types';

interface AuthContextType {
  user: User | null;
  login: (email: string, password: string) => Promise<boolean>;
  logout: () => void;
  hasRole: (role: string) => boolean;
  hasPermission: (permission: string) => boolean;
  updateUserProfile: (user: User) => Promise<boolean>;
  isLoading: boolean;
  getAllUsers: () => User[];
  refreshUserDatabase: () => void;
  title?: string;
  bio?: string;
  officeLocation?: string;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Mock users for demonstration - this will be our "database"
let mockUsers: User[] = [
  {
    id: '1',
    email: 'admin@university.edu',
    firstName: 'Admin',
    lastName: 'User',
    roles: [{ type: 'admin', permissions: ['manage-users', 'verify-accounts', 'system-config'] }],
    isVerified: true,
    createdAt: '2024-01-01',
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
  },
  {
    id: '5',
    email: 'newuser@university.edu',
    firstName: 'New',
    lastName: 'User',
    roles: [{ type: 'lecturer', permissions: ['dashboard-access', 'settings-access'] }],
    isVerified: false,
    createdAt: '2024-01-08',
    department: 'Biology',
  },
  {
    id: '6',
    email: 'pending@university.edu',
    firstName: 'Pending',
    lastName: 'Verification',
    roles: [{ type: 'lecturer', permissions: ['dashboard-access', 'settings-access'] }],
    isVerified: false,
    createdAt: '2024-01-09',
    department: 'Chemistry',
  },
];

// Simulate database operations
const UserDatabase = {
  // Load users from localStorage (simulating database)
  loadUsers: (): User[] => {
    const savedUsers = localStorage.getItem('mockDatabase_users');
    if (savedUsers) {
      try {
        const parsedUsers = JSON.parse(savedUsers);
        // Merge with default users, giving preference to saved data
        const defaultUserIds = mockUsers.map(u => u.id);
        const savedUserIds = parsedUsers.map((u: User) => u.id);
        
        // Keep saved users and add any new default users
        const mergedUsers = [
          ...parsedUsers,
          ...mockUsers.filter(u => !savedUserIds.includes(u.id))
        ];
        
        mockUsers = mergedUsers;
        return mergedUsers;
      } catch (error) {
        console.error('Error loading users from localStorage:', error);
        return mockUsers;
      }
    }
    return mockUsers;
  },

  // Save users to localStorage (simulating database)
  saveUsers: (users: User[]): boolean => {
    try {
      localStorage.setItem('mockDatabase_users', JSON.stringify(users));
      mockUsers = users;
      // Broadcast user database update event
      window.dispatchEvent(new CustomEvent('userDatabaseUpdated', { 
        detail: { users: users } 
      }));
      return true;
    } catch (error) {
      console.error('Error saving users to localStorage:', error);
      return false;
    }
  },

  // Find user by email
  findUserByEmail: (email: string): User | undefined => {
    return mockUsers.find(u => u.email === email);
  },

  // Update user in database
  updateUser: (updatedUser: User): boolean => {
    const userIndex = mockUsers.findIndex(u => u.id === updatedUser.id);
    if (userIndex !== -1) {
      mockUsers[userIndex] = updatedUser;
      console.log('UserDatabase: User updated in database:', updatedUser.id, updatedUser.firstName, updatedUser.lastName);
      return UserDatabase.saveUsers(mockUsers);
    }
    return false;
  },

  // Get all users (for admin interface)
  getAllUsers: (): User[] => {
    console.log('UserDatabase: Loading all users for admin interface');
    return UserDatabase.loadUsers();
  },

  // Find user by ID
  findUserById: (id: string): User | undefined => {
    return mockUsers.find(u => u.id === id);
  }
};

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    // Initialize database
    UserDatabase.loadUsers();
    
    const savedUser = localStorage.getItem('currentUser');
    if (savedUser) {
      try {
        const parsedUser = JSON.parse(savedUser);
        console.log('AuthContext - Loading user from localStorage:', parsedUser);
        
        // Verify user still exists in database and get latest data
        const dbUser = UserDatabase.findUserByEmail(parsedUser.email);
        if (dbUser) {
          console.log('AuthContext - Syncing with database user:', dbUser);
          setUser(dbUser);
          // Update localStorage with latest database data
          localStorage.setItem('currentUser', JSON.stringify(dbUser));
        } else {
          // User no longer exists in database, clear session
          localStorage.removeItem('currentUser');
          setUser(null);
        }
      } catch (error) {
        console.error('Error parsing saved user:', error);
        localStorage.removeItem('currentUser');
        setUser(null);
      }
    }
    
    // Listen for profile updates
    const handleProfileUpdate = () => {
      const updatedUser = localStorage.getItem('currentUser');
      if (updatedUser) {
        const parsedUser = JSON.parse(updatedUser);
        console.log('AuthContext - Profile updated:', parsedUser);
        setUser(parsedUser);
      }
    };
    
    window.addEventListener('userProfileUpdated', handleProfileUpdate);
    
    return () => {
      window.removeEventListener('userProfileUpdated', handleProfileUpdate);
    };
  }, []);

  const updateUserProfile = async (updatedUser: User): Promise<boolean> => {
    console.log('AuthContext - Updating user profile:', updatedUser);
    
    try {
      // Update database first
      const dbUpdateSuccess = UserDatabase.updateUser(updatedUser);
      if (!dbUpdateSuccess) {
        throw new Error('Failed to update user in database');
      }
      
      console.log('AuthContext - Database updated successfully');
      
      // Update local state
      setUser(updatedUser);
      
      // Update localStorage session
      localStorage.setItem('currentUser', JSON.stringify(updatedUser));
      
      console.log('AuthContext - Local state and session updated');
      
      // Trigger profile update event
      window.dispatchEvent(new Event('userProfileUpdated'));
      
      console.log('AuthContext - Profile update completed successfully');
      return true;
    } catch (error) {
      console.error('Profile update failed:', error);
      return false;
    }
  };

  const login = async (email: string, password: string): Promise<boolean> => {
    console.log('AuthContext - Attempting login for:', email);
    
    // Load latest user data from database
    UserDatabase.loadUsers();
    
    // Simple mock authentication - find user in database
    const foundUser = UserDatabase.findUserByEmail(email);
    if (foundUser) {
      console.log('AuthContext - User found in database:', foundUser);
      setUser(foundUser);
      localStorage.setItem('currentUser', JSON.stringify(foundUser));
      console.log('AuthContext - Login successful');
      return true;
    }
    console.log('AuthContext - Login failed: user not found');
    return false;
  };

  const logout = () => {
    console.log('AuthContext - Logging out user');
    setUser(null);
    localStorage.removeItem('currentUser');
  };

  const hasRole = (role: string): boolean => {
    return user?.roles.some(r => r.type === role) || false;
  };

  const hasPermission = (permission: string): boolean => {
    return user?.roles.some(role => role.permissions.includes(permission)) || false;
  };

  const getAllUsers = (): User[] => {
    console.log('AuthContext: getAllUsers called');
    return UserDatabase.getAllUsers();
  };

  const refreshUserDatabase = (): void => {
    console.log('AuthContext: refreshUserDatabase called');
    UserDatabase.loadUsers();
    // Trigger a re-render by dispatching an event
    window.dispatchEvent(new Event('userDatabaseRefresh'));
  };

  return (
    <AuthContext.Provider value={{ 
      user, 
      login, 
      logout, 
      hasRole, 
      hasPermission, 
      updateUserProfile,
      isLoading,
      getAllUsers,
      refreshUserDatabase
    }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};