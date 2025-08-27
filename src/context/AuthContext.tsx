import React, { createContext, useContext, useState, useEffect } from 'react';
import { User, Role } from '../types';
import { supabase } from '../lib/supabase';
import type { User as SupabaseUser } from '@supabase/supabase-js';

interface AuthContextType {
  user: User | null;
  login: (email: string, password: string) => Promise<boolean>;
  signUp: (userData: {
    email: string;
    password: string;
    firstName: string;
    lastName: string;
    department?: string;
    phoneNumber?: string;
  }) => Promise<{ success: boolean; error?: string }>;
  logout: () => void;
  hasRole: (role: string) => boolean;
  hasPermission: (permission: string) => boolean;
  updateUserProfile: (user: User) => Promise<boolean>;
  isLoading: boolean;
  getAllUsers: () => Promise<User[]>;
  refreshUserDatabase: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Helper function to fetch user profile and roles from Supabase
  const fetchAndSetUser = async (supabaseUser: SupabaseUser): Promise<User | null> => {
    try {
      console.log('AuthContext - Fetching user profile for:', supabaseUser.id);
      
      // Fetch user profile from users table
      const { data: userProfile, error: userError } = await supabase
        .from('users')
        .select('*')
        .eq('id', supabaseUser.id)
        .single();

      if (userError) {
        console.error('AuthContext - Error fetching user profile:', userError);
        return null;
      }

      if (!userProfile) {
        console.error('AuthContext - No user profile found for:', supabaseUser.id);
        return null;
      }

      console.log('AuthContext - User profile fetched:', userProfile);

      // Fetch user roles
      const { data: userRoles, error: rolesError } = await supabase
        .from('user_roles')
        .select('*')
        .eq('user_id', supabaseUser.id);

      if (rolesError) {
        console.error('AuthContext - Error fetching user roles:', rolesError);
        // Continue without roles rather than failing completely
      }

      console.log('AuthContext - User roles fetched:', userRoles);

      // Transform roles to match our interface
      const roles: Role[] = (userRoles || []).map(role => ({
        type: role.role_type as 'admin' | 'coordinator' | 'reviewer' | 'lecturer',
        permissions: role.permissions || []
      }));

      // Create user object matching our interface
      const completeUser: User = {
        id: userProfile.id,
        email: userProfile.email,
        first_name: userProfile.first_name,
        last_name: userProfile.last_name,
        roles: roles,
        is_verified: userProfile.is_verified || false,
        created_at: userProfile.created_at,
        department: userProfile.department,
        phone_number: userProfile.phone_number,
        title: userProfile.title,
        bio: userProfile.bio,
        office_location: userProfile.office_location,
        updated_at: userProfile.updated_at
      };

      console.log('AuthContext - Complete user object created:', completeUser);
      setUser(completeUser);
      return completeUser;

    } catch (error) {
      console.error('AuthContext - Error in fetchAndSetUser:', error);
      return null;
    }
  };

  // Initialize auth state and set up listener
  useEffect(() => {
    console.log('AuthContext - Initializing auth state...');
    
    // Get initial session
    const initializeAuth = async () => {
      try {
        const { data: { session }, error } = await supabase.auth.getSession();
        
        if (error) {
          console.error('AuthContext - Error getting session:', error);
          setIsLoading(false);
          return;
        }

        if (session?.user) {
          console.log('AuthContext - Found existing session for user:', session.user.id);
          await fetchAndSetUser(session.user);
        } else {
          console.log('AuthContext - No existing session found');
        }
      } catch (error) {
        console.error('AuthContext - Error initializing auth:', error);
      } finally {
        setIsLoading(false);
      }
    };

    initializeAuth();

    // Set up auth state change listener
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        console.log('AuthContext - Auth state changed:', event, session?.user?.id);
        
        if (event === 'SIGNED_IN' && session?.user) {
          await fetchAndSetUser(session.user);
        } else if (event === 'SIGNED_OUT') {
          setUser(null);
        } else if (event === 'TOKEN_REFRESHED' && session?.user) {
          // Optionally refresh user data on token refresh
          await fetchAndSetUser(session.user);
        }
      }
    );

    // Cleanup subscription on unmount
    return () => {
      subscription.unsubscribe();
    };
  }, []);

  const login = async (email: string, password: string): Promise<boolean> => {
    console.log('AuthContext - Attempting login for:', email);
    setIsLoading(true);
    
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password
      });

      if (error) {
        console.error('AuthContext - Login error:', error.message);
        setIsLoading(false);
        return false;
      }

      if (data.user) {
        console.log('AuthContext - Login successful for user:', data.user.id);
        // fetchAndSetUser will be called by the auth state change listener
        setIsLoading(false);
        return true;
      }

      setIsLoading(false);
      return false;
    } catch (error) {
      console.error('AuthContext - Login exception:', error);
      setIsLoading(false);
      return false;
    }
  };

  const logout = async () => {
    console.log('AuthContext - Logging out user');
    
    try {
      const { error } = await supabase.auth.signOut();
      if (error) {
        console.error('AuthContext - Logout error:', error.message);
      } else {
        console.log('AuthContext - Logout successful');
        // setUser(null) will be called by the auth state change listener
      }
    } catch (error) {
      console.error('AuthContext - Logout exception:', error);
    }
  };

  const hasRole = (role: string): boolean => {
    return user?.roles.some(r => r.type === role) || false;
  };

  const hasPermission = (permission: string): boolean => {
    return user?.roles.some(role => role.permissions.includes(permission)) || false;
  };

  const updateUserProfile = async (updatedUser: User): Promise<boolean> => {
    console.log('AuthContext - Updating user profile:', updatedUser.id);
    
    try {
      // Prepare data for Supabase (snake_case)
      const updateData = {
        first_name: updatedUser.first_name,
        last_name: updatedUser.last_name,
        email: updatedUser.email,
        phone_number: updatedUser.phone_number,
        department: updatedUser.department,
        title: updatedUser.title,
        bio: updatedUser.bio,
        office_location: updatedUser.office_location,
        is_verified: updatedUser.is_verified,
        updated_at: new Date().toISOString()
      };

      const { error } = await supabase
        .from('users')
        .update(updateData)
        .eq('id', updatedUser.id);

      if (error) {
        console.error('AuthContext - Error updating user profile:', error.message);
        return false;
      }

      console.log('AuthContext - User profile updated successfully');
      
      // Re-fetch user data to ensure consistency
      const { data: { user: currentUser } } = await supabase.auth.getUser();
      if (currentUser) {
        await fetchAndSetUser(currentUser);
      }
      
      return true;
    } catch (error) {
      console.error('AuthContext - Exception updating user profile:', error);
      return false;
    }
  };

  const getAllUsers = async (): Promise<User[]> => {
    console.log('AuthContext - Fetching all users');
    
    try {
      // Fetch all users
      const { data: users, error: usersError } = await supabase
        .from('users')
        .select('*')
        .order('created_at', { ascending: false });

      if (usersError) {
        console.error('AuthContext - Error fetching users:', usersError.message);
        return [];
      }

      if (!users) {
        console.log('AuthContext - No users found');
        return [];
      }

      // Fetch all user roles
      const { data: allRoles, error: rolesError } = await supabase
        .from('user_roles')
        .select('*');

      if (rolesError) {
        console.error('AuthContext - Error fetching roles:', rolesError.message);
        // Continue without roles
      }

      // Combine users with their roles
      const usersWithRoles: User[] = users.map(userProfile => {
        const userRoles = (allRoles || []).filter(role => role.user_id === userProfile.id);
        
        const roles: Role[] = userRoles.map(role => ({
          type: role.role_type as 'admin' | 'coordinator' | 'reviewer' | 'lecturer',
          permissions: role.permissions || []
        }));

        return {
          id: userProfile.id,
          email: userProfile.email,
          first_name: userProfile.first_name,
          last_name: userProfile.last_name,
          roles: roles,
          is_verified: userProfile.is_verified || false,
          created_at: userProfile.created_at,
          department: userProfile.department,
          phone_number: userProfile.phone_number,
          title: userProfile.title,
          bio: userProfile.bio,
          office_location: userProfile.office_location,
          updated_at: userProfile.updated_at
        };
      });

      console.log('AuthContext - Fetched users with roles:', usersWithRoles.length);
      return usersWithRoles;
    } catch (error) {
      console.error('AuthContext - Exception fetching all users:', error);
      return [];
    }
  };

  const refreshUserDatabase = async (): Promise<void> => {
    console.log('AuthContext - Refreshing user database');
    // This function can be used to trigger a refresh of user data
    // For now, it's mainly used by components that need to refresh user lists
    await getAllUsers();
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