import React, { useState, useRef, useEffect } from "react";
import {
  FiBell,
  FiUser,
  FiSettings,
  FiLogOut,
  FiChevronDown,
  FiHelpCircle,
  FiEdit,
  FiBook,
} from "react-icons/fi";
import { RiRobot3Fill } from "react-icons/ri";
import { Link, useNavigate } from "react-router-dom";
import useAuthStore from "../../store/useAuthStore";
import useAiStore from "../../store/useAiStore";

const Header = () => {
  const { openChatBot } = useAiStore();
  const [showNotifications, setShowNotifications] = useState(false);
  const [showProfileMenu, setShowProfileMenu] = useState(false);
  const [notifications, setNotifications] = useState([]);

  const { user, logout, isLoading } = useAuthStore();
  const navigate = useNavigate();
  const notificationRef = useRef(null);
  const profileRef = useRef(null);

  // Mock notifications data
  const mockNotifications = [
    {
      id: 1,
      title: "New Health Alert",
      message: "Water contamination detected in Village Borjhar",
      time: "2 minutes ago",
      type: "alert",
      isRead: false,
    },
    {
      id: 2,
      title: "Report Submitted",
      message: "Health report from ASHA worker approved",
      time: "10 minutes ago",
      type: "info",
      isRead: false,
    },
    {
      id: 3,
      title: "Water Quality Update",
      message: "pH levels normalized in Sector 12",
      time: "1 hour ago",
      type: "success",
      isRead: true,
    },
  ];

  //   useEffect(() => {
  //     setNotifications(mockNotifications);
  //   }, []);

  // Close dropdowns when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (
        notificationRef.current &&
        !notificationRef.current.contains(event.target)
      ) {
        setShowNotifications(false);
      }
      if (profileRef.current && !profileRef.current.contains(event.target)) {
        setShowProfileMenu(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  const unreadCount = notifications.filter((n) => !n.isRead).length;

  const getNotificationTypeColor = (type) => {
    switch (type) {
      case "alert":
        return "text-red-600 bg-red-50";
      case "info":
        return "text-blue-600 bg-blue-50";
      case "success":
        return "text-green-600 bg-green-50";
      default:
        return "text-gray-600 bg-gray-50";
    }
  };

  const handleLogout = async () => {
    const result = await logout();
    if (result.success) {
      // Logout successful, user will be redirected by the auth store
      navigate("/app/auth/login");
    }
    setShowProfileMenu(false);
  };

  return (
    <div className="sticky top-0 w-full h-16 bg-white shadow-md flex items-center justify-between px-4 sm:px-6 z-[99]">
      {/* Left side - Title/Breadcrumb */}
      <div className="flex items-center">
        <h1 className="text-lg sm:text-xl font-semibold text-gray-800 truncate flex">
          <span className="hidden sm:inline">🌊</span>
          <span className="sm:hidden md:block">OcceanIQ</span>
        </h1>
      </div>

      {/* Right side - Notifications & Profile */}
      <div className="flex items-center space-x-2 sm:space-x-4">

        {/* AI Assistant button */}
        <button 
          onClick={openChatBot} 
          className="cursor-pointer px-3 py-2 bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-700 hover:to-blue-700 text-white rounded-md flex justify-center items-center gap-2 transition-all hover:scale-105 active:scale-95 shadow-lg"
        >
          <RiRobot3Fill size={20} className="animate-pulse"/>
          <span className="text-sm font-medium pointer-events-none select-none hidden sm:inline">AI Assistant</span>
        </button>

        {/* documentation link */}
        <div>
          <Link to="/app/documentation" className=" cursor-pointer px-3 py-1 bg-green-100 rounded-md flex justify-center items-center gap-2 border-2 border-green-800 outline-2 outline-green-400 hover:-translate-y-[1px] active:translate-y-[1px] shadow-2xl">
            <FiBook size={20} className=""/>
            <h1 className="text-sm pointer-events-none select-none"> Documentation </h1>
          </Link>
        </div>

        {/* Notifications */}
        <div className="relative" ref={notificationRef}>
          <button
            onClick={() => setShowNotifications(!showNotifications)}
            className="relative p-2 text-gray-600 hover:text-blue-600 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <FiBell size={18} className="sm:w-5 sm:h-5" />
            {unreadCount > 0 && (
              <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full h-4 w-4 sm:h-5 sm:w-5 flex items-center justify-center text-[10px] sm:text-xs">
                {unreadCount > 9 ? "9+" : unreadCount}
              </span>
            )}
          </button>

          {/* Notifications Dropdown */}
          {showNotifications && (
            <div className="absolute -right-12 sm:right-0 top-full mt-2 w-screen sm:w-96 max-w-xs sm:max-w-none bg-white rounded-lg shadow-lg border border-gray-200 z-50 max-h-80 sm:max-h-96 overflow-y-auto">
              <div className="p-3 sm:p-4 border-b border-gray-200">
                <h3 className="font-semibold text-gray-800 text-sm sm:text-base">
                  Notifications
                </h3>
                {unreadCount > 0 && (
                  <p className="text-xs sm:text-sm text-gray-600">
                    {unreadCount} unread notifications
                  </p>
                )}
              </div>

              <div className="divide-y divide-gray-100">
                {notifications.length === 0 ? (
                  <div className="p-3 sm:p-4 text-center text-gray-500 text-sm">
                    No notifications
                  </div>
                ) : (
                  notifications.map((notification) => (
                    <div
                      key={notification.id}
                      className={`p-3 sm:p-4 hover:bg-gray-50 cursor-pointer ${
                        !notification.isRead ? "bg-blue-50" : ""
                      }`}
                    >
                      <div className="flex items-start space-x-2 sm:space-x-3">
                        <div
                          className={`w-2 h-2 rounded-full mt-1.5 sm:mt-2 flex-shrink-0 ${getNotificationTypeColor(
                            notification.type
                          )}`}
                        ></div>
                        <div className="flex-1 min-w-0">
                          <h4
                            className={`text-xs sm:text-sm font-medium ${
                              !notification.isRead
                                ? "text-gray-900"
                                : "text-gray-700"
                            }`}
                          >
                            {notification.title}
                          </h4>
                          <p className="text-xs sm:text-sm text-gray-600 mt-1 break-words">
                            {notification.message}
                          </p>
                          <p className="text-xs text-gray-400 mt-1">
                            {notification.time}
                          </p>
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>

              <div className="p-3 sm:p-4 border-t border-gray-200">
                <button className="text-xs sm:text-sm text-blue-600 hover:text-blue-700 font-medium">
                  View all notifications
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Profile Menu */}
        <div className="relative" ref={profileRef}>
          <button
            onClick={() => setShowProfileMenu(!showProfileMenu)}
            className="flex items-center space-x-1 sm:space-x-2 p-1.5 sm:p-2 text-gray-600 hover:text-blue-600 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <div className="w-7 h-7 sm:w-8 sm:h-8 bg-blue-500 rounded-full flex items-center justify-center text-white text-sm sm:text-base">
              {user?.personalInfo?.firstName ? (
                user.personalInfo.firstName.charAt(0).toUpperCase()
              ) : (
                <FiUser size={14} className="sm:w-4 sm:h-4" />
              )}
            </div>
            <span className="text-xs sm:text-sm font-medium hidden sm:block">
              {user?.personalInfo?.firstName || "User"}
            </span>
            <FiChevronDown
              size={14}
              className={`sm:w-4 sm:h-4 transition-transform ${
                showProfileMenu ? "rotate-180" : ""
              } hidden xs:block`}
            />
          </button>

          {/* Profile Dropdown */}
          {showProfileMenu && (
            <div className="absolute right-0 top-full mt-2 w-56 sm:w-64 bg-white rounded-lg shadow-lg border border-gray-200 z-50">
              {/* User Info */}
              <div className="p-3 sm:p-4 border-b border-gray-200">
                <div className="flex items-center space-x-2 sm:space-x-3">
                  <div className="w-8 h-8 sm:w-10 sm:h-10 bg-blue-500 rounded-full flex items-center justify-center text-white flex-shrink-0">
                    {user?.personalInfo?.firstName ? (
                      user.personalInfo.firstName.charAt(0).toUpperCase()
                    ) : (
                      <FiUser size={16} className="sm:w-[18px] sm:h-[18px]" />
                    )}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="font-medium text-gray-900 text-sm sm:text-base truncate">
                      {user?.personalInfo
                        ? `${user.personalInfo.firstName} ${user.personalInfo.lastName}`
                        : "Guest User"}
                    </p>
                    <p className="text-xs sm:text-sm text-gray-600 truncate">
                      {user?.roleInfo?.role || "User"}
                    </p>
                    <p className="text-xs text-gray-500 truncate">
                      {user?.authentication?.email || "No email"}
                    </p>
                  </div>
                </div>
              </div>

              {/* Menu Items */}
              <div className="py-2">
                <Link
                  to="/app/profile"
                  className="flex items-center space-x-2 sm:space-x-3 px-3 sm:px-4 py-2 text-xs sm:text-sm text-gray-700 hover:bg-gray-100"
                  onClick={() => setShowProfileMenu(false)}
                >
                  <FiUser size={14} className="sm:w-4 sm:h-4" />
                  <span>Profile</span>
                </Link>

                <Link
                  to="/app/documentation"
                  className="flex items-center space-x-2 sm:space-x-3 px-3 sm:px-4 py-2 text-xs sm:text-sm text-gray-700 hover:bg-gray-100"
                  onClick={() => setShowProfileMenu(false)}
                >
                  <FiBook size={14} className="sm:w-4 sm:h-4" />
                  <span>API Documentation</span>
                </Link>

                <Link
                  to="/app/settings"
                  className="flex items-center space-x-2 sm:space-x-3 px-3 sm:px-4 py-2 text-xs sm:text-sm text-gray-700 hover:bg-gray-100"
                  onClick={() => setShowProfileMenu(false)}
                >
                  <FiSettings size={14} className="sm:w-4 sm:h-4" />
                  <span>Settings</span>
                </Link>

                <Link
                  to="/app/help"
                  className="flex items-center space-x-2 sm:space-x-3 px-3 sm:px-4 py-2 text-xs sm:text-sm text-gray-700 hover:bg-gray-100"
                  onClick={() => setShowProfileMenu(false)}
                >
                  <FiHelpCircle size={14} className="sm:w-4 sm:h-4" />
                  <span>Help & Support</span>
                </Link>
              </div>

              {/* Logout */}
              <div className="border-t border-gray-200 py-2">
                <button
                  onClick={handleLogout}
                  className="flex items-center space-x-2 sm:space-x-3 w-full px-3 sm:px-4 py-2 text-xs sm:text-sm text-red-600 hover:bg-red-50"
                >
                  <div className="flex items-center space-x-2 sm:space-x-3 w-full px-3 sm:px-4 py-2 text-xs sm:text-sm text-red-600 hover:bg-red-50">
                    <FiLogOut size={14} className="sm:w-4 sm:h-4" />
                    <span>Sign Out</span>
                  </div>
                  <div>
                    {isLoading && (
                      <svg
                        className="animate-spin h-4 w-4 text-red-600 ml-2"
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
                        ></circle>
                        <path
                          className="opacity-75"
                          fill="currentColor"
                          d="M4 12a8 8 0 018-8v8H4z"
                        ></path>
                      </svg>
                    )}
                  </div>
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Header;
