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
      console.log('AuthContext - fetchAndSetUser called, current isLoading:', isLoading);
      
      console.log('AuthContext - Starting user profile query...');
      // Fetch user profile from users table
      let userProfileData: any = null;
      let userProfileError: any = null;

      try {
        console.log('AuthContext - Executing Supabase query for user ID:', supabaseUser.id);
        const { data, error } = await supabase
          .from('users')
          .select('*')
          .eq('id', supabaseUser.id)
          .single();
        
        console.log('AuthContext - User profile query completed. Data:', data, 'Error:', error);
        
        userProfileData = data;
        userProfileError = error;
      } catch (queryException) {
        console.error('AuthContext - Exception during user profile query:', queryException);
        console.error('AuthContext - Query exception details:', {
          message: queryException instanceof Error ? queryException.message : 'Unknown error',
          stack: queryException instanceof Error ? queryException.stack : 'No stack trace',
          userId: supabaseUser.id
        });
        return null;
      }

      // Handle case where user profile doesn't exist (PGRST116 error)
      if (userProfileError && userProfileError.code === 'PGRST116') {
        console.log('AuthContext - No user profile found, creating new profile for:', supabaseUser.id);
        
        console.log('AuthContext - Attempting to create new user profile...');
        // Create new user profile
        const { data: newProfile, error: createError } = await supabase
          .from('users')
          .insert({
            id: supabaseUser.id,
            email: supabaseUser.email || '',
            first_name: supabaseUser.email?.split('@')[0] || 'User',
            last_name: '',
            is_verified: false,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
          })
          .select()
          .single();

        console.log('AuthContext - User profile creation result. Data:', newProfile, 'Error:', createError);

        if (createError) {
          console.error('AuthContext - Error creating user profile:', createError);
          return null;
        }

        console.log('AuthContext - Attempting to assign default role...');
        // Assign default lecturer role
        const { error: roleError } = await supabase
          .from('user_roles')
          .insert({
            user_id: supabaseUser.id,
            role_type: 'lecturer',
            permissions: ['create_questions', 'view_own_questions'],
            created_at: new Date().toISOString()
          });

        console.log('AuthContext - Role assignment result. Error:', roleError);

        if (roleError) {
          console.error('AuthContext - Error assigning user role:', roleError);
        }

        // Use the newly created profile
        userProfileData = newProfile;
        console.log('AuthContext - New user profile created:', userProfileData);
      } else if (userProfileError) {
        console.error('AuthContext - Error fetching user profile:', userProfileError);
        return null;
      }

      if (!userProfileData) {
        console.error('AuthContext - No user profile found for:', supabaseUser.id);
        return null;
      }

      console.log('AuthContext - User profile fetched:', userProfileData);

      console.log('AuthContext - Starting user roles query...');
      // Fetch user roles
      const { data: userRoles, error: rolesError } = await supabase
        .from('user_roles')
        .select('*')
        .eq('user_id', supabaseUser.id);

      console.log('AuthContext - User roles query completed. Data:', userRoles, 'Error:', rolesError);

      if (rolesError) {
        console.error('AuthContext - Error fetching user roles:', rolesError);
        // Continue without roles rather than failing completely
      }

      console.log('AuthContext - User roles fetched:', userRoles);

      console.log('AuthContext - Transforming roles...');
      // Transform roles to match our interface
      const roles: Role[] = (userRoles || []).map(role => ({
        type: role.role_type as 'admin' | 'coordinator' | 'reviewer' | 'lecturer',
        permissions: role.permissions || []
      }));

      console.log('AuthContext - Creating complete user object...');
      // Create user object matching our interface
      const completeUser: User = {
        id: userProfileData.id,
        email: userProfileData.email,
        first_name: userProfileData.first_name,
        last_name: userProfileData.last_name,
        roles: roles,
        is_verified: userProfileData.is_verified || false,
        created_at: userProfileData.created_at,
        department: userProfileData.department,
        phone_number: userProfileData.phone_number,
        title: userProfileData.title,
        bio: userProfileData.bio,
        office_location: userProfileData.office_location,
        updated_at: userProfileData.updated_at
      };

      console.log('AuthContext - Complete user object created:', completeUser);
      console.log('AuthContext - About to set user in state...');
      setUser(completeUser);
      console.log('AuthContext - User set in state successfully');
      console.log('AuthContext - User set in state, current isLoading:', isLoading);
      return completeUser;

    } catch (error) {
      console.error('AuthContext - Error in fetchAndSetUser:', error);
      console.log('AuthContext - fetchAndSetUser error, current isLoading:', isLoading);
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
        console.log('AuthContext - Auth state change, current isLoading:', isLoading);
        
        if (event === 'SIGNED_IN' && session?.user) {
          setIsLoading(true);
          console.log('AuthContext - isLoading set to true, actual state:', isLoading);
          try {
            await fetchAndSetUser(session.user);
            console.log('AuthContext - fetchAndSetUser completed successfully');
          } catch (error) {
            console.error('AuthContext - Error in fetchAndSetUser during SIGNED_IN:', error);
          } finally {
            setIsLoading(false);
            console.log('AuthContext - isLoading set to false, actual state:', isLoading);
          }
        } else if (event === 'SIGNED_OUT') {
          setUser(null);
          setIsLoading(false);
          console.log('AuthContext - SIGNED_OUT processed, isLoading set to false');
        } else if (event === 'TOKEN_REFRESHED' && session?.user) {
          // Optionally refresh user data on token refresh
          try {
            await fetchAndSetUser(session.user);
          } catch (error) {
            console.error('AuthContext - Error in fetchAndSetUser during TOKEN_REFRESHED:', error);
          }
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
    console.log('AuthContext - Current isLoading state before login:', isLoading);
    
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password
      });

      if (error) {
        console.error('AuthContext - Login error:', error.message);
        console.log('AuthContext - Login failed, current isLoading:', isLoading);
        return false;
      }

      if (data.user) {
        console.log('AuthContext - Login successful for user:', data.user.id);
        console.log('AuthContext - Login successful, current isLoading:', isLoading);
        // fetchAndSetUser will be called by the auth state change listener
        return true;
      }

      return false;
    } catch (error) {
      console.error('AuthContext - Login exception:', error);
      console.log('AuthContext - Login exception, current isLoading:', isLoading);
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

  const signUp = async (userData: {
    email: string;
    password: string;
    firstName: string;
    lastName: string;
    department?: string;
    phoneNumber?: string;
  }): Promise<{ success: boolean; error?: string }> => {
    console.log('AuthContext - Attempting signup for:', userData.email);
    setIsLoading(true);
    
    try {
      // Create user in Supabase Auth
      const { data, error: authError } = await supabase.auth.signUp({
        email: userData.email,
        password: userData.password
      });

      if (authError) {
        console.error('AuthContext - Signup auth error:', authError.message);
        setIsLoading(false);
        return { success: false, error: authError.message };
      }

      if (!data.user) {
        console.error('AuthContext - No user returned from signup');
        setIsLoading(false);
        return { success: false, error: 'Failed to create user account' };
      }

      console.log('AuthContext - User created in auth:', data.user.id);

      // Create user profile in users table
      const { error: profileError } = await supabase
        .from('users')
        .insert({
          id: data.user.id,
          email: userData.email,
          first_name: userData.firstName,
          last_name: userData.lastName,
          department: userData.department || null,
          phone_number: userData.phoneNumber || null,
          is_verified: false,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        });

      if (profileError) {
        console.error('AuthContext - Error creating user profile:', profileError.message);
        setIsLoading(false);
        return { success: false, error: 'Failed to create user profile' };
      }

      console.log('AuthContext - User profile created successfully');

      // Assign default lecturer role
      const { error: roleError } = await supabase
        .from('user_roles')
        .insert({
          user_id: data.user.id,
          role_type: 'lecturer',
          permissions: ['create_questions', 'view_own_questions'],
          created_at: new Date().toISOString()
        });

      if (roleError) {
        console.error('AuthContext - Error assigning user role:', roleError.message);
        // Don't fail signup if role assignment fails
      } else {
        console.log('AuthContext - User role assigned successfully');
      }

      setIsLoading(false);
      return { success: true };

    } catch (error) {
      console.error('AuthContext - Signup exception:', error);
      setIsLoading(false);
      return { success: false, error: 'An unexpected error occurred during signup' };
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
      signUp,
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