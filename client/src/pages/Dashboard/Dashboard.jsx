import React from "react";
import { NavLink, Outlet } from "react-router-dom";
import {
  FiTrendingUp,
  FiMap,
  FiBox,
  FiActivity,
  FiCpu,
} from "react-icons/fi";

function Dashboard() {
  return (
    <div className="space-y-6 p-6 bg-gray-50 min-h-screen">
      {/* Page Header */}
      <div className="mb-8">
        <h1 className="text-4xl font-bold bg-gradient-to-r from-cyan-600 via-blue-600 to-teal-600 bg-clip-text text-transparent mb-2">
          Marine Data Dashboard
        </h1>
        <p className="text-gray-600">
          Comprehensive oceanographic insights and analysis
        </p>
      </div>

      {/* Navigation Tabs */}
      <div className="flex flex-wrap gap-1 mb-6">
        <NavLink
          to="/app/dashboard"
          end
          className={({ isActive }) =>
            `flex items-center space-x-1 px-4 py-2 rounded-lg font-semibold transition-all duration-200 ${
              isActive
                ? "bg-gradient-to-r from-cyan-500 to-blue-500 text-white shadow-lg"
                : "bg-gray-100 text-gray-700 hover:bg-gray-200"
            }`
          }
        >
          <FiTrendingUp className="w-5 h-5" />
          <span>Oceanographic Trends</span>
        </NavLink>

        <NavLink
          to="/app/dashboard/analysis"
          className={({ isActive }) =>
            `flex items-center space-x-1 px-4 py-2 rounded-lg font-semibold transition-all duration-200 ${
              isActive
                ? "bg-gradient-to-r from-cyan-500 to-blue-500 text-white shadow-lg"
                : "bg-gray-100 text-gray-700 hover:bg-gray-200"
            }`
          }
        >
          <FiMap className="w-5 h-5" />
          <span>Biodiversity Analysis</span>
        </NavLink>

        <NavLink
          to="/app/dashboard/3d-visualization"
          className={({ isActive }) =>
            `flex items-center space-x-1 px-4 py-2 rounded-lg font-semibold transition-all duration-200 ${
              isActive
                ? "bg-gradient-to-r from-cyan-500 to-blue-500 text-white shadow-lg"
                : "bg-gray-100 text-gray-700 hover:bg-gray-200"
            }`
          }
        >
          <FiBox className="w-5 h-5" />
          <span>3D Ocean Depth</span>
        </NavLink>

        <NavLink
          to="/app/dashboard/ecosystem-health"
          className={({ isActive }) =>
            `flex items-center space-x-1 px-4 py-2 rounded-lg font-semibold transition-all duration-200 ${
              isActive
                ? "bg-gradient-to-r from-cyan-500 to-blue-500 text-white shadow-lg"
                : "bg-gray-100 text-gray-700 hover:bg-gray-200"
            }`
          }
        >
          <FiActivity className="w-5 h-5" />
          <span>Ecosystem Health</span>
        </NavLink>

        <NavLink
          to="/app/dashboard/ai-analytics"
          className={({ isActive }) =>
            `flex items-center space-x-1 px-4 py-2 rounded-lg font-semibold transition-all duration-200 ${
              isActive
                ? "bg-gradient-to-r from-cyan-500 to-blue-500 text-white shadow-lg"
                : "bg-gray-100 text-gray-700 hover:bg-gray-200"
            }`
          }
        >
          <FiCpu className="w-5 h-5" />
          <span>AI Analytics</span>
        </NavLink>
      </div>

      {/* Nested Route Content */}
      <Outlet />
    </div>
  );
}

export default Dashboard;
