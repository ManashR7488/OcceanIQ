import React from "react";
import { NavLink, Outlet } from "react-router-dom";
import { FiBarChart2, FiCpu } from "react-icons/fi";

function Tools() {
  return (
    <div className="space-y-6 p-6 bg-gray-50 min-h-screen">
      {/* Page Header */}
      <div className="mb-8">
        <h1 className="text-4xl font-bold bg-gradient-to-r from-cyan-600 via-blue-600 to-teal-600 bg-clip-text text-transparent mb-2">
          Analysis Tools
        </h1>
        <p className="text-gray-600">
          Advanced correlation and AI-powered analytical tools for marine data
        </p>
      </div>

      {/* Navigation Tabs */}
      <div className="flex flex-wrap gap-1 mb-6">
        <NavLink
          to="/app/tools"
          end
          className={({ isActive }) =>
            `flex items-center space-x-1 px-4 py-2 rounded-lg font-semibold transition-all duration-200 ${
              isActive
                ? "bg-gradient-to-r from-cyan-500 to-blue-500 text-white shadow-lg"
                : "bg-gray-100 text-gray-700 hover:bg-gray-200"
            }`
          }
        >
          <FiBarChart2 className="w-5 h-5" />
          <span>Correlation Tool</span>
        </NavLink>

        <NavLink
          to="/app/tools/ai-correlation"
          className={({ isActive }) =>
            `flex items-center space-x-1 px-4 py-2 rounded-lg font-semibold transition-all duration-200 ${
              isActive
                ? "bg-gradient-to-r from-cyan-500 to-blue-500 text-white shadow-lg"
                : "bg-gray-100 text-gray-700 hover:bg-gray-200"
            }`
          }
        >
          <FiCpu className="w-5 h-5" />
          <span>AI Correlation</span>
        </NavLink>
      </div>

      {/* Nested Route Content */}
      <Outlet />
    </div>
  );
}

export default Tools;
