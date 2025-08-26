import React, { useState, useRef, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { 
  User, 
  Mail, 
  Phone, 
  Building, 
  Camera, 
  Save, 
  X, 
  Bell, 
  Shield, 
  MessageSquare, 
  Megaphone,
  Users,
  CheckCircle,
  AlertCircle,
  Upload,
  Trash2,
  Edit3,
  Eye,
  EyeOff
} from 'lucide-react';

interface ProfileData {
  firstName: string;
  lastName: string;
  email: string;
  phoneNumber: string;
  department: string;
  bio: string;
  title: string;
  officeLocation: string;
}

interface NotificationSettings {
  email: {
    security: boolean;
    questionUpdates: boolean;
    reviewAssignments: boolean;
    systemUpdates: boolean;
    marketing: boolean;
  };
  push: {
    security: boolean;
    questionUpdates: boolean;
    reviewAssignments: boolean;
    systemUpdates: boolean;
  };
  inApp: {
    security: boolean;
    questionUpdates: boolean;
    reviewAssignments: boolean;
    systemUpdates: boolean;
    social: boolean;
  };
  frequency: {
    emailDigest: 'immediate' | 'daily' | 'weekly' | 'never';
    pushFrequency: 'immediate' | 'batched' | 'quiet_hours';
  };
}

export const UserSettings: React.FC = () => {
  const { user, updateUserProfile } = useAuth();
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const [activeTab, setActiveTab] = useState<'profile' | 'notifications' | 'security'>('profile');
  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setSaving] = useState(false);
  const [saveStatus, setSaveStatus] = useState<'idle' | 'success' | 'error'>('idle');
  const [profileImage, setProfileImage] = useState<string | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  
  const [profileData, setProfileData] = useState<ProfileData>({
    firstName: user?.firstName || '',
    lastName: user?.lastName || '',
    email: user?.email || '',
    phoneNumber: user?.phoneNumber || '',
    department: user?.department || '',
    bio: user?.bio || '',
    title: user?.title || '',
    officeLocation: user?.officeLocation || ''
  });

  const [originalProfileData, setOriginalProfileData] = useState<ProfileData>(profileData);
  
  const [notifications, setNotifications] = useState<NotificationSettings>({
    email: {
      security: true,
      questionUpdates: true,
      reviewAssignments: true,
      systemUpdates: false,
      marketing: false
    },
    push: {
      security: true,
      questionUpdates: false,
      reviewAssignments: true,
      systemUpdates: false
    },
    inApp: {
      security: true,
      questionUpdates: true,
      reviewAssignments: true,
      systemUpdates: true,
      social: true
    },
    frequency: {
      emailDigest: 'daily',
      pushFrequency: 'immediate'
    }
  });

  const [errors, setErrors] = useState<Partial<ProfileData>>({});

  useEffect(() => {
    // Update profile data when user context changes
    if (user) {
      setProfileData({
        firstName: user.firstName || '',
        lastName: user.lastName || '',
        email: user.email || '',
        phoneNumber: user.phoneNumber || '',
        department: user.department || '',
        bio: user.bio || '',
        title: user.title || '',
        officeLocation: user.officeLocation || ''
      });
      setOriginalProfileData({
        firstName: user.firstName || '',
        lastName: user.lastName || '',
        email: user.email || '',
        phoneNumber: user.phoneNumber || '',
        department: user.department || '',
        bio: user.bio || '',
        title: user.title || '',
        officeLocation: user.officeLocation || ''
      });
    }
  }, [user]);

  if (!user) return null;

  const validateField = (field: keyof ProfileData, value: string): string | null => {
    switch (field) {
      case 'firstName':
      case 'lastName':
        return value.trim().length < 2 ? 'Must be at least 2 characters' : null;
      case 'email':
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return !emailRegex.test(value) ? 'Please enter a valid email address' : null;
      case 'phoneNumber':
        if (value && !/^\+?[\d\s\-\(\)]+$/.test(value)) {
          return 'Please enter a valid phone number';
        }
        return null;
      default:
        return null;
    }
  };

  const handleProfileChange = (field: keyof ProfileData, value: string) => {
    setProfileData(prev => ({ ...prev, [field]: value }));
    
    // Real-time validation
    const error = validateField(field, value);
    setErrors(prev => ({ ...prev, [field]: error || undefined }));
  };

  const handleImageUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Validate file type
    const validTypes = ['image/jpeg', 'image/png', 'image/gif'];
    if (!validTypes.includes(file.type)) {
      alert('Please select a JPEG, PNG, or GIF image');
      return;
    }

    // Validate file size (5MB limit)
    if (file.size > 5 * 1024 * 1024) {
      alert('Image size must be less than 5MB');
      return;
    }

    const reader = new FileReader();
    reader.onload = (e) => {
      const result = e.target?.result as string;
      setImagePreview(result);
    };
    reader.readAsDataURL(file);
  };

  const saveProfileImage = () => {
    if (imagePreview) {
      setProfileImage(imagePreview);
      setImagePreview(null);
      setSaveStatus('success');
      setTimeout(() => setSaveStatus('idle'), 3000);
    }
  };

  const removeProfileImage = () => {
    setProfileImage(null);
    setImagePreview(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const startEditing = () => {
    setOriginalProfileData(profileData);
    setIsEditing(true);
  };

  const cancelEditing = () => {
    setProfileData(originalProfileData);
    setErrors({});
    setIsEditing(false);
  };

  const saveProfile = async () => {
    console.log('saveProfile called with data:', profileData);
    
    // Validate all fields
    const newErrors: Partial<ProfileData> = {};
    Object.keys(profileData).forEach(key => {
      const field = key as keyof ProfileData;
      const error = validateField(field, profileData[field]);
      if (error) newErrors[field] = error;
    });

    if (Object.keys(newErrors).length > 0) {
      console.log('Validation errors found:', newErrors);
      setErrors(newErrors);
      return;
    }

    setSaving(true);
    
    try {
      console.log('Attempting to save profile...');
      
      // Update user context with new profile data
      const updatedUser = {
        ...user,
        firstName: profileData.firstName,
        lastName: profileData.lastName,
        email: profileData.email,
        phoneNumber: profileData.phoneNumber,
        department: profileData.department,
        title: profileData.title,
        bio: profileData.bio,
        officeLocation: profileData.officeLocation
      };
      
      console.log('Updated user object:', updatedUser);
      
      // Use the auth context to update the profile (this will save to database)
      const success = await updateUserProfile(updatedUser);
      
      if (!success) {
        throw new Error('Failed to update profile');
      }
      
      console.log('Profile saved successfully to database');
      
      setOriginalProfileData(profileData);
      setIsEditing(false);
      setSaveStatus('success');
      
      setTimeout(() => setSaveStatus('idle'), 3000);
    } catch (error) {
      console.error('Profile save error:', error);
      setSaveStatus('error');
      setTimeout(() => setSaveStatus('idle'), 3000);
    } finally {
      setSaving(false);
    }
  };

  const updateNotificationSetting = (
    category: keyof NotificationSettings,
    setting: string,
    value: boolean | string
  ) => {
    setNotifications(prev => ({
      ...prev,
      [category]: {
        ...prev[category],
        [setting]: value
      }
    }));
  };

  const NotificationToggle: React.FC<{
    label: string;
    description: string;
    checked: boolean;
    onChange: (checked: boolean) => void;
  }> = ({ label, description, checked, onChange }) => (
    <div className="flex items-center justify-between py-3 border-b border-gray-100 last:border-b-0">
      <div className="flex-1">
        <h4 className="text-sm font-medium text-gray-900">{label}</h4>
        <p className="text-xs text-gray-600 mt-1">{description}</p>
      </div>
      <button
        onClick={() => onChange(!checked)}
        className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
          checked ? 'bg-blue-600' : 'bg-gray-200'
        }`}
      >
        <span
          className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
            checked ? 'translate-x-6' : 'translate-x-1'
          }`}
        />
      </button>
    </div>
  );

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-gray-900">Account Settings</h2>
        <p className="text-gray-600">Manage your profile, notifications, and security preferences</p>
      </div>

      {/* Status Messages */}
      {saveStatus !== 'idle' && (
        <div className={`rounded-lg p-4 flex items-center space-x-3 ${
          saveStatus === 'success' 
            ? 'bg-green-50 border border-green-200' 
            : 'bg-red-50 border border-red-200'
        }`}>
          {saveStatus === 'success' ? (
            <CheckCircle size={20} className="text-green-600" />
          ) : (
            <AlertCircle size={20} className="text-red-600" />
          )}
          <p className={`font-medium ${
            saveStatus === 'success' ? 'text-green-800' : 'text-red-800'
          }`}>
            {saveStatus === 'success' 
              ? 'Settings saved successfully!' 
              : 'Failed to save settings. Please try again.'
            }
          </p>
        </div>
      )}

      {/* Tab Navigation */}
      <div className="border-b border-gray-200">
        <nav className="-mb-px flex space-x-8">
          {[
            { id: 'profile', label: 'Profile', icon: User },
            { id: 'notifications', label: 'Notifications', icon: Bell },
            { id: 'security', label: 'Security', icon: Shield }
          ].map(tab => {
            const Icon = tab.icon;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`flex items-center space-x-2 py-2 px-1 border-b-2 font-medium text-sm ${
                  activeTab === tab.id
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                <Icon size={16} />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </nav>
      </div>

      {/* Profile Tab */}
      {activeTab === 'profile' && (
        <div className="space-y-6">
          {/* Profile Picture Section */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Profile Picture</h3>
            
            <div className="flex items-center space-x-6">
              <div className="relative">
                <div className="w-24 h-24 rounded-full overflow-hidden bg-gray-200 flex items-center justify-center">
                  {imagePreview || profileImage ? (
                    <img 
                      src={imagePreview || profileImage || ''} 
                      alt="Profile" 
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <User size={32} className="text-gray-400" />
                  )}
                </div>
                {(imagePreview || profileImage) && (
                  <button
                    onClick={removeProfileImage}
                    className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1 hover:bg-red-600 transition-colors"
                  >
                    <X size={12} />
                  </button>
                )}
              </div>
              
              <div className="flex-1">
                <div className="flex items-center space-x-3 mb-2">
                  <button
                    onClick={() => fileInputRef.current?.click()}
                    className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors flex items-center space-x-2"
                  >
                    <Upload size={16} />
                    <span>Upload Photo</span>
                  </button>
                  
                  {imagePreview && (
                    <button
                      onClick={saveProfileImage}
                      className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition-colors flex items-center space-x-2"
                    >
                      <Save size={16} />
                      <span>Save</span>
                    </button>
                  )}
                </div>
                
                <p className="text-sm text-gray-600">
                  Upload a JPEG, PNG, or GIF image. Maximum file size: 5MB.
                </p>
                
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/jpeg,image/png,image/gif"
                  onChange={handleImageUpload}
                  className="hidden"
                />
              </div>
            </div>
          </div>

          {/* Profile Details Section */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900">Profile Details</h3>
              {!isEditing ? (
                <button
                  onClick={startEditing}
                  className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors flex items-center space-x-2"
                >
                  <Edit3 size={16} />
                  <span>Edit Profile</span>
                </button>
              ) : (
                <div className="flex items-center space-x-3">
                  <button
                    onClick={cancelEditing}
                    className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={saveProfile}
                    disabled={isSaving}
                    className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition-colors flex items-center space-x-2 disabled:opacity-50"
                  >
                    <Save size={16} />
                    <span>{isSaving ? 'Saving...' : 'Save Changes'}</span>
                  </button>
                </div>
              )}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* First Name */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  First Name *
                </label>
                <div className="relative">
                  <User size={20} className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                  <input
                    type="text"
                    value={profileData.firstName}
                    onChange={(e) => handleProfileChange('firstName', e.target.value)}
                    disabled={!isEditing}
                    className={`w-full pl-10 pr-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors ${
                      !isEditing ? 'bg-gray-50 text-gray-600' : 'bg-white'
                    } ${errors.firstName ? 'border-red-300 bg-red-50' : 'border-gray-300'}`}
                    placeholder="Enter your first name"
                  />
                </div>
                {errors.firstName && (
                  <p className="mt-1 text-sm text-red-600">{errors.firstName}</p>
                )}
              </div>

              {/* Last Name */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Last Name *
                </label>
                <div className="relative">
                  <User size={20} className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                  <input
                    type="text"
                    value={profileData.lastName}
                    onChange={(e) => handleProfileChange('lastName', e.target.value)}
                    disabled={!isEditing}
                    className={`w-full pl-10 pr-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors ${
                      !isEditing ? 'bg-gray-50 text-gray-600' : 'bg-white'
                    } ${errors.lastName ? 'border-red-300 bg-red-50' : 'border-gray-300'}`}
                    placeholder="Enter your last name"
                  />
                </div>
                {errors.lastName && (
                  <p className="mt-1 text-sm text-red-600">{errors.lastName}</p>
                )}
              </div>

              {/* Email */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Email Address *
                </label>
                <div className="relative">
                  <Mail size={20} className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                  <input
                    type="email"
                    value={profileData.email}
                    onChange={(e) => handleProfileChange('email', e.target.value)}
                    disabled={!isEditing}
                    className={`w-full pl-10 pr-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors ${
                      !isEditing ? 'bg-gray-50 text-gray-600' : 'bg-white'
                    } ${errors.email ? 'border-red-300 bg-red-50' : 'border-gray-300'}`}
                    placeholder="Enter your email address"
                  />
                </div>
                {errors.email && (
                  <p className="mt-1 text-sm text-red-600">{errors.email}</p>
                )}
              </div>

              {/* Phone Number */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Phone Number
                </label>
                <div className="relative">
                  <Phone size={20} className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                  <input
                    type="tel"
                    value={profileData.phoneNumber}
                    onChange={(e) => handleProfileChange('phoneNumber', e.target.value)}
                    disabled={!isEditing}
                    className={`w-full pl-10 pr-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors ${
                      !isEditing ? 'bg-gray-50 text-gray-600' : 'bg-white'
                    } ${errors.phoneNumber ? 'border-red-300 bg-red-50' : 'border-gray-300'}`}
                    placeholder="Enter your phone number"
                  />
                </div>
                {errors.phoneNumber && (
                  <p className="mt-1 text-sm text-red-600">{errors.phoneNumber}</p>
                )}
              </div>

              {/* Department */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Department
                </label>
                <div className="relative">
                  <Building size={20} className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                  <input
                    type="text"
                    value={profileData.department}
                    onChange={(e) => handleProfileChange('department', e.target.value)}
                    disabled={!isEditing}
                    className={`w-full pl-10 pr-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors ${
                      !isEditing ? 'bg-gray-50 text-gray-600' : 'bg-white'
                    } border-gray-300`}
                    placeholder="Enter your department"
                  />
                </div>
              </div>

              {/* Title */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Job Title
                </label>
                <input
                  type="text"
                  value={profileData.title}
                  onChange={(e) => handleProfileChange('title', e.target.value)}
                  disabled={!isEditing}
                  className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors ${
                    !isEditing ? 'bg-gray-50 text-gray-600' : 'bg-white'
                  } border-gray-300`}
                  placeholder="Enter your job title"
                />
              </div>
            </div>

            {/* Bio */}
            <div className="mt-6">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Bio
              </label>
              <textarea
                rows={4}
                value={profileData.bio}
                onChange={(e) => handleProfileChange('bio', e.target.value)}
                disabled={!isEditing}
                className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors ${
                  !isEditing ? 'bg-gray-50 text-gray-600' : 'bg-white'
                } border-gray-300`}
                placeholder="Tell us about yourself..."
              />
            </div>

            {/* Office Location */}
            <div className="mt-6">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Office Location
              </label>
              <input
                type="text"
                value={profileData.officeLocation}
                onChange={(e) => handleProfileChange('officeLocation', e.target.value)}
                disabled={!isEditing}
                className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors ${
                  !isEditing ? 'bg-gray-50 text-gray-600' : 'bg-white'
                } border-gray-300`}
                placeholder="Enter your office location"
              />
            </div>
          </div>
        </div>
      )}

      {/* Notifications Tab */}
      {activeTab === 'notifications' && (
        <div className="space-y-6">
          {/* Email Notifications */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <div className="flex items-center space-x-3 mb-4">
              <Mail size={20} className="text-blue-600" />
              <h3 className="text-lg font-semibold text-gray-900">Email Notifications</h3>
            </div>
            
            <div className="space-y-1">
              <NotificationToggle
                label="Security Alerts"
                description="Important security updates and login notifications"
                checked={notifications.email.security}
                onChange={(checked) => updateNotificationSetting('email', 'security', checked)}
              />
              <NotificationToggle
                label="Question Updates"
                description="Notifications about your submitted questions"
                checked={notifications.email.questionUpdates}
                onChange={(checked) => updateNotificationSetting('email', 'questionUpdates', checked)}
              />
              <NotificationToggle
                label="Review Assignments"
                description="When you're assigned to review questions"
                checked={notifications.email.reviewAssignments}
                onChange={(checked) => updateNotificationSetting('email', 'reviewAssignments', checked)}
              />
              <NotificationToggle
                label="System Updates"
                description="Platform updates and maintenance notifications"
                checked={notifications.email.systemUpdates}
                onChange={(checked) => updateNotificationSetting('email', 'systemUpdates', checked)}
              />
              <NotificationToggle
                label="Marketing Communications"
                description="Product updates and educational content"
                checked={notifications.email.marketing}
                onChange={(checked) => updateNotificationSetting('email', 'marketing', checked)}
              />
            </div>

            <div className="mt-6 pt-4 border-t border-gray-200">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Email Digest Frequency
              </label>
              <select
                value={notifications.frequency.emailDigest}
                onChange={(e) => updateNotificationSetting('frequency', 'emailDigest', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="immediate">Immediate</option>
                <option value="daily">Daily Digest</option>
                <option value="weekly">Weekly Digest</option>
                <option value="never">Never</option>
              </select>
            </div>
          </div>

          {/* Push Notifications */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <div className="flex items-center space-x-3 mb-4">
              <Bell size={20} className="text-green-600" />
              <h3 className="text-lg font-semibold text-gray-900">Push Notifications</h3>
            </div>
            
            <div className="space-y-1">
              <NotificationToggle
                label="Security Alerts"
                description="Critical security notifications"
                checked={notifications.push.security}
                onChange={(checked) => updateNotificationSetting('push', 'security', checked)}
              />
              <NotificationToggle
                label="Question Updates"
                description="Updates on your questions"
                checked={notifications.push.questionUpdates}
                onChange={(checked) => updateNotificationSetting('push', 'questionUpdates', checked)}
              />
              <NotificationToggle
                label="Review Assignments"
                description="New review assignments"
                checked={notifications.push.reviewAssignments}
                onChange={(checked) => updateNotificationSetting('push', 'reviewAssignments', checked)}
              />
              <NotificationToggle
                label="System Updates"
                description="Important system notifications"
                checked={notifications.push.systemUpdates}
                onChange={(checked) => updateNotificationSetting('push', 'systemUpdates', checked)}
              />
            </div>

            <div className="mt-6 pt-4 border-t border-gray-200">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Push Notification Timing
              </label>
              <select
                value={notifications.frequency.pushFrequency}
                onChange={(e) => updateNotificationSetting('frequency', 'pushFrequency', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="immediate">Immediate</option>
                <option value="batched">Batched (every 30 minutes)</option>
                <option value="quiet_hours">Respect quiet hours</option>
              </select>
            </div>
          </div>

          {/* In-App Notifications */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <div className="flex items-center space-x-3 mb-4">
              <MessageSquare size={20} className="text-purple-600" />
              <h3 className="text-lg font-semibold text-gray-900">In-App Notifications</h3>
            </div>
            
            <div className="space-y-1">
              <NotificationToggle
                label="Security Alerts"
                description="Security notifications within the app"
                checked={notifications.inApp.security}
                onChange={(checked) => updateNotificationSetting('inApp', 'security', checked)}
              />
              <NotificationToggle
                label="Question Updates"
                description="Question status changes and feedback"
                checked={notifications.inApp.questionUpdates}
                onChange={(checked) => updateNotificationSetting('inApp', 'questionUpdates', checked)}
              />
              <NotificationToggle
                label="Review Assignments"
                description="New questions to review"
                checked={notifications.inApp.reviewAssignments}
                onChange={(checked) => updateNotificationSetting('inApp', 'reviewAssignments', checked)}
              />
              <NotificationToggle
                label="System Updates"
                description="Platform announcements and updates"
                checked={notifications.inApp.systemUpdates}
                onChange={(checked) => updateNotificationSetting('inApp', 'systemUpdates', checked)}
              />
              <NotificationToggle
                label="Social Interactions"
                description="Comments, mentions, and collaboration updates"
                checked={notifications.inApp.social}
                onChange={(checked) => updateNotificationSetting('inApp', 'social', checked)}
              />
            </div>
          </div>
        </div>
      )}

      {/* Security Tab */}
      {activeTab === 'security' && (
        <div className="space-y-6">
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <div className="flex items-center space-x-3 mb-4">
              <Shield size={20} className="text-red-600" />
              <h3 className="text-lg font-semibold text-gray-900">Security Settings</h3>
            </div>
            
            <div className="space-y-6">
              {/* Password Change */}
              <div>
                <h4 className="text-sm font-medium text-gray-900 mb-3">Change Password</h4>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Current Password
                    </label>
                    <input
                      type="password"
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      placeholder="Enter current password"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      New Password
                    </label>
                    <input
                      type="password"
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      placeholder="Enter new password"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Confirm New Password
                    </label>
                    <input
                      type="password"
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      placeholder="Confirm new password"
                    />
                  </div>
                  <button className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors">
                    Update Password
                  </button>
                </div>
              </div>

              {/* Two-Factor Authentication */}
              <div className="pt-6 border-t border-gray-200">
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="text-sm font-medium text-gray-900">Two-Factor Authentication</h4>
                    <p className="text-sm text-gray-600 mt-1">Add an extra layer of security to your account</p>
                  </div>
                  <button className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition-colors">
                    Enable 2FA
                  </button>
                </div>
              </div>

              {/* Active Sessions */}
              <div className="pt-6 border-t border-gray-200">
                <h4 className="text-sm font-medium text-gray-900 mb-3">Active Sessions</h4>
                <div className="space-y-3">
                  <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <div>
                      <p className="text-sm font-medium text-gray-900">Current Session</p>
                      <p className="text-xs text-gray-600">Chrome on Windows • Last active: Now</p>
                    </div>
                    <span className="text-xs text-green-600 font-medium">Active</span>
                  </div>
                  <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <div>
                      <p className="text-sm font-medium text-gray-900">Mobile Session</p>
                      <p className="text-xs text-gray-600">Safari on iPhone • Last active: 2 hours ago</p>
                    </div>
                    <button className="text-xs text-red-600 hover:text-red-700 font-medium">
                      Revoke
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};