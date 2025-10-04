import React, { useState, useEffect } from 'react';
import { FiEdit, FiSave, FiX, FiUser, FiMail, FiLock } from 'react-icons/fi';
import { toast } from 'react-toastify';
import useAuthStore from '../../store/useAuthStore';
import axiosInstance from '../../config/axios.config';
import OceanWavePattern from '../../components/OceanWavePattern';
import MarineIcon from '../../components/MarineIcon';

const Profile = () => {
  const { user, updateUser } = useAuthStore();
  const [isEditing, setIsEditing] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    email: ''
  });

  useEffect(() => {
    if (user) {
      const firstName = user.personalInfo?.firstName;
      const lastName = user.personalInfo?.lastName;
      const fullName = [firstName, lastName].filter(Boolean).join(' ');
      
      setFormData({
        name: user.name || fullName || '',
        email: user.email || user.authentication?.email || ''
      });
    }
  }, [user]);

  const handleEdit = () => {
    setIsEditing(true);
  };

  const handleCancel = () => {
    setIsEditing(false);
    if (user) {
      const firstName = user.personalInfo?.firstName;
      const lastName = user.personalInfo?.lastName;
      const fullName = [firstName, lastName].filter(Boolean).join(' ');
      
      setFormData({
        name: user.name || fullName || '',
        email: user.email || user.authentication?.email || ''
      });
    }
  };

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Validation
    if (!formData.name || formData.name.trim().length < 2) {
      toast.error('Name must be at least 2 characters long');
      return;
    }
    
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(formData.email)) {
      toast.error('Please enter a valid email address');
      return;
    }
    
    setIsLoading(true);
    
    try {
      const response = await axiosInstance.put('auth/profile', formData);
      
      if (response.data.success) {
        updateUser(response.data.user);
        toast.success('Profile updated successfully!');
        setIsEditing(false);
      }
    } catch (error) {
      const errorMessage = error.response?.data?.message || 'Failed to update profile';
      toast.error(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-gray-500">Loading profile...</div>
      </div>
    );
  }

  const firstName = user?.personalInfo?.firstName;
  const lastName = user?.personalInfo?.lastName;
  const fullName = [firstName, lastName].filter(Boolean).join(' ');

  const displayName = user?.name || fullName || 'User';
  const displayEmail = user?.email || user?.authentication?.email || '';
  const userRole = user?.role || user?.roleInfo?.role || 'User';
  const accountCreated = user?.createdAt ? new Date(user.createdAt).toLocaleDateString() : null;
  const userInitial = displayName.charAt(0).toUpperCase();

  return (
    <div className="min-h-screen bg-gradient-to-br from-cyan-50 via-blue-50 to-teal-50 py-12 px-4 sm:px-6 lg:px-8 relative overflow-hidden">
      {/* Ocean Wave Background */}
      <OceanWavePattern variant="background" opacity={0.1} color="cyan" />
      
      <div className="max-w-3xl mx-auto relative z-10">
        {/* Header */}
        <div className="flex items-center justify-between mb-4">
          <div>
            <h1 className="text-3xl font-bold bg-gradient-to-r from-cyan-600 via-blue-600 to-teal-600 bg-clip-text text-transparent">
              Profile
            </h1>
            <p className="text-sm text-gray-600 mt-1">OcceanIQ Marine Researcher Profile</p>
          </div>
          {!isEditing ? (
            <button
              onClick={handleEdit}
              className="flex items-center gap-2 px-4 py-2 bg-cyan-600 text-white rounded-lg hover:bg-cyan-700 transition duration-200"
            >
              <FiEdit className="w-4 h-4" />
              Edit Profile
            </button>
          ) : (
            <button
              onClick={handleCancel}
              className="flex items-center gap-2 px-4 py-2 bg-gray-500 text-white rounded-lg hover:bg-gray-600 transition duration-200"
            >
              <FiX className="w-4 h-4" />
              Cancel
            </button>
          )}
        </div>

        {/* Profile Card */}
        <div className="bg-white rounded-2xl shadow-xl overflow-hidden mb-6">
          {/* Avatar Section */}
          <div className="bg-gradient-to-r from-cyan-600 via-blue-600 to-teal-600 h-32 relative">
            <div className="absolute inset-0">
              <OceanWavePattern variant="top" opacity={0.2} color="blue" />
            </div>
          </div>
          <div className="relative px-8 pb-8">
            <div className="absolute -top-16 left-8">
              <div className="w-32 h-32 rounded-full bg-white border-4 border-white shadow-lg flex items-center justify-center">
                <div className="w-full h-full rounded-full bg-gradient-to-r from-cyan-500 via-blue-500 to-teal-500 flex items-center justify-center">
                  {user?.avatar ? (
                    <img
                      src={user.avatar}
                      alt={displayName}
                      className="w-full h-full rounded-full object-cover"
                    />
                  ) : (
                    <span className="text-4xl font-bold text-white">{userInitial}</span>
                  )}
                </div>
              </div>
            </div>

            <div className="pt-20">
              {!isEditing ? (
                /* View Mode */
                <div className="space-y-6">
                  {/* Name */}
                  <div>
                    <label className="block text-sm font-medium text-gray-500 mb-1">
                      Full Name
                    </label>
                    <div className="flex items-center gap-3">
                      <FiUser className="w-5 h-5 text-gray-400" />
                      <p className="text-lg text-gray-900">{displayName}</p>
                    </div>
                  </div>

                  {/* Email */}
                  <div>
                    <label className="block text-sm font-medium text-gray-500 mb-1">
                      Email Address
                    </label>
                    <div className="flex items-center gap-3">
                      <FiMail className="w-5 h-5 text-gray-400" />
                      <p className="text-lg text-gray-900">{displayEmail}</p>
                    </div>
                  </div>

                  {/* Role */}
                  <div>
                    <label className="block text-sm font-medium text-gray-500 mb-1">
                      Role
                    </label>
                    <div className="flex items-center gap-3">
                      <span className="px-3 py-1 bg-cyan-100 text-cyan-800 rounded-full text-sm font-medium flex items-center gap-2">
                        <MarineIcon type="compass" size={16} color="#0891B2" />
                        {userRole}
                      </span>
                    </div>
                  </div>

                  {/* Account Created */}
                  {accountCreated && (
                    <div>
                      <label className="block text-sm font-medium text-gray-500 mb-1">
                        Member Since
                      </label>
                      <p className="text-lg text-gray-900">{accountCreated}</p>
                    </div>
                  )}
                </div>
              ) : (
                /* Edit Mode */
                <form onSubmit={handleSubmit} className="space-y-6">
                  {/* Name Input */}
                  <div>
                    <label
                      htmlFor="name"
                      className="block text-sm font-medium text-gray-700 mb-2"
                    >
                      Full Name
                    </label>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <FiUser className="h-5 w-5 text-gray-400" />
                      </div>
                      <input
                        id="name"
                        name="name"
                        type="text"
                        required
                        value={formData.name}
                        onChange={handleChange}
                        className="block w-full pl-10 pr-3 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-cyan-500 focus:border-transparent transition duration-200 outline-none"
                        placeholder="Enter your full name"
                      />
                    </div>
                  </div>

                  {/* Email Input */}
                  <div>
                    <label
                      htmlFor="email"
                      className="block text-sm font-medium text-gray-700 mb-2"
                    >
                      Email Address
                    </label>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <FiMail className="h-5 w-5 text-gray-400" />
                      </div>
                      <input
                        id="email"
                        name="email"
                        type="email"
                        required
                        value={formData.email}
                        onChange={handleChange}
                        className="block w-full pl-10 pr-3 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-cyan-500 focus:border-transparent transition duration-200 outline-none"
                        placeholder="Enter your email"
                      />
                    </div>
                  </div>

                  {/* Action Buttons */}
                  <div className="flex gap-3 pt-4">
                    <button
                      type="submit"
                      disabled={isLoading}
                      className="flex items-center justify-center gap-2 flex-1 px-4 py-3 bg-gradient-to-r from-cyan-600 via-blue-600 to-teal-600 text-white rounded-lg hover:from-cyan-700 hover:via-blue-700 hover:to-teal-700 transition duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {isLoading ? (
                        <>
                          <svg
                            className="animate-spin h-5 w-5 text-white"
                            xmlns="http://www.w3.org/2000/svg"
                            fill="none"
                            viewBox="0 0 24 24"
                          >
                            <circle
                              className="opacity-25"
                              cx="12"
                              cy="12"
                              r="10"
                              stroke="currentColor"
                              strokeWidth="4"
                            />
                            <path
                              className="opacity-75"
                              fill="currentColor"
                              d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                            />
                          </svg>
                          Saving...
                        </>
                      ) : (
                        <>
                          <FiSave className="w-4 h-4" />
                          Save Changes
                        </>
                      )}
                    </button>
                    <button
                      type="button"
                      onClick={handleCancel}
                      className="px-4 py-3 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition duration-200"
                    >
                      Cancel
                    </button>
                  </div>
                </form>
              )}
            </div>
          </div>
        </div>

        {/* Security Section */}
        <div className="bg-white rounded-2xl shadow-xl p-8 relative overflow-hidden">
          <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-cyan-500 via-blue-500 to-teal-500"></div>
          <h2 className="text-xl font-bold bg-gradient-to-r from-cyan-600 via-blue-600 to-teal-600 bg-clip-text text-transparent mb-2 flex items-center gap-2">
            <FiLock className="w-5 h-5 text-cyan-600" />
            Security & Data Protection
          </h2>
          <p className="text-gray-600 mb-4">
            Keep your marine research account secure with a strong password
          </p>
          <button
            type="button"
            className="px-4 py-2 bg-gradient-to-r from-cyan-100 to-blue-100 text-cyan-700 rounded-lg hover:from-cyan-200 hover:to-blue-200 transition duration-200 font-medium"
          >
            Change Password
          </button>
        </div>
      </div>
    </div>
  );
};

export default Profile;
