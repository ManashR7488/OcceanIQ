import React, { useState } from "react";
import { Link, NavLink } from "react-router-dom";
import {
  FiMenu,
  FiGrid,
  FiMap,
  FiUsers,
  FiFileText,
  FiSettings,
  FiMapPin,
  FiHeart,
  FiClipboard,
  FiUser,
  FiShield,
  FiActivity,
  FiMessageSquare,
  FiDroplet,
  FiEye,
  FiMessageCircle,
} from "react-icons/fi";
import useAuthStore from "../../store/useAuthStore";

const NavBar = () => {
  const [collapsed, setCollapsed] = useState(false);
  const { user } = useAuthStore();

  // Role-based navigation configuration
  // const navigationConfig = {
  //   admin: [
  //     { name: "Dashboard", path: "/app", icon: <FiGrid size={20} /> },
  //     { name: "District Management", path: "/app/districts", icon: <FiMap size={20} /> },
  //     { name: "User Management", path: "/app/users", icon: <FiUsers size={20} /> },
  //     { name: "Reports", path: "/app/reports", icon: <FiFileText size={20} /> },
  //     { name: "Settings", path: "/app/settings", icon: <FiSettings size={20} /> },
  //   ],
  //   health_official: [
  //     { name: "Dashboard", path: "/app", icon: <FiGrid size={20} /> },
  //     { name: "Block Management", path: "/app/blocks", icon: <FiMapPin size={20} /> },
  //     { name: "Health Programs", path: "/app/health-programs", icon: <FiHeart size={20} /> },
  //     { name: "Staff Management", path: "/app/staff", icon: <FiUsers size={20} /> },
  //     { name: "Reports", path: "/app/reports", icon: <FiFileText size={20} /> },
  //     { name: "Settings", path: "/app/settings", icon: <FiSettings size={20} /> },
  //   ],
  //   asha_worker: [
  //     { name: "Dashboard", path: "/app", icon: <FiGrid size={20} /> },
  //     { name: "Village Reports", path: "/app/village-reports", icon: <FiClipboard size={20} /> },
  //     { name: "Patient Records", path: "/app/patients", icon: <FiUser size={20} /> },
  //     { name: "Vaccination Tracking", path: "/app/vaccinations", icon: <FiShield size={20} /> },
  //     { name: "Health Surveys", path: "/app/surveys", icon: <FiActivity size={20} /> },
  //     { name: "Profile", path: "/app/profile", icon: <FiUser size={20} /> },
  //   ],
  //   volunteer: [
  //     { name: "Dashboard", path: "/app", icon: <FiGrid size={20} /> },
  //     { name: "Community Reports", path: "/app/community-reports", icon: <FiMessageSquare size={20} /> },
  //     { name: "Water Testing", path: "/app/water-tests", icon: <FiDroplet size={20} /> },
  //     { name: "Health Observations", path: "/app/observations", icon: <FiEye size={20} /> },
  //     { name: "Profile", path: "/app/profile", icon: <FiUser size={20} /> },
  //   ],
  //   user: [
  //     { name: "Dashboard", path: "/app", icon: <FiGrid size={20} /> },
  //     { name: "Family Management", path: "/app/family", icon: <FiUsers size={20} /> },
  //     { name: "Health Records", path: "/app/health-records", icon: <FiFileText size={20} /> },
  //     { name: "Health Queries", path: "/app/health-queries", icon: <FiMessageCircle size={20} /> },
  //     { name: "Profile", path: "/app/profile", icon: <FiUser size={20} /> },
  //   ],
  // };

  // Get navigation links based on user role
  // const getNavLinks = () => {
  //   const userRole = user?.roleInfo?.role;
  //   return navigationConfig[userRole] || navigationConfig.user || [];
  // };

  const navLinks = [
    { name: "Home", path: "/app", icon: <FiGrid size={20} /> },
    { name: "Map", path: "/app/map", icon: <FiMap size={20} /> },
  ];

  return (
    <div
      className={`h-screen relative z-[100] flex flex-col bg-white shadow-lg transition-width duration-300 ${
        collapsed ? "w-16" : "w-52"
      }`}
    >
      {/* Brand & Toggle */}
      <div className="flex items-center justify-between p-4 bg-gradient-to-r from-blue-500 to-indigo-500 text-white">
        {!collapsed && (
          <Link
            to="/app"
            className="text-xl font-extrabold tracking-wide flex justify-center items-center gap-1"
          >
            {/* <div className="w-8 h-8">
              <img src="/images/favIcon.png" alt="" className="object-cover h-full w-full" />
            </div> */}
            <h1>OcceanIQ</h1>
          </Link>
        )}
        <button
          onClick={() => setCollapsed((c) => !c)}
          className="p-1 cursor-pointer hover:bg-opacity-20 rounded-full transition-transform"
          style={{ transform: collapsed ? "rotate(180deg)" : "rotate(0)" }}
          title={collapsed ? "Expand" : "Collapse"}
        >
          <FiMenu size={20} />
        </button>
      </div>

      {/* Navigation */}
      <nav className="flex-1 mt-4">
        {navLinks.map(({ name, path, icon }) => (
          <NavLink key={path} to={path} title={collapsed ? name : undefined}>
            {({ isActive }) => (
              <div
                className={`flex items-center justify-start gap-4 px-4 py-1 mx-2 my-1 rounded-lg transition-colors ${
                  isActive
                    ? "bg-gradient-to-r from-indigo-100 to-blue-50 text-blue-600 font-semibold"
                    : "text-gray-700 hover:bg-gray-100"
                }`}
              >
                <div
                  className={`p-2 rounded-md transition-colors ${
                    isActive ? "bg-white shadow" : "bg-transparent"
                  }`}
                >
                  {icon}
                </div>
                {!collapsed && (
                  <span className="flex-1 text-nowrap text-xs">{name}</span>
                )}
              </div>
            )}
          </NavLink>
        ))}
      </nav>

      {/* Footer */}
      {/* <div className="p-4 mt-auto">
        <button
          className="w-full flex items-center justify-center gap-3 px-4 py-2 text-gray-600 hover:text-red-500 hover:bg-gray-100 rounded-lg transition"
          title="Logout"
          onClick={logout}
        >
          <FiLogOut size={16} />
          {!collapsed && <span>Logout</span>}
        </button>
        {!collapsed && (
          <div className="mt-4 text-xs text-gray-400 text-center">v1.0.0</div>
        )}
      </div> */}
    </div>
  );
};

export default NavBar;
