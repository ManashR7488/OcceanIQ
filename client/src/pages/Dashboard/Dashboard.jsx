import React, { createContext, useState, useContext } from "react";
import { NavLink, Outlet } from "react-router-dom";
import {
  FiTrendingUp,
  FiMap,
  FiBox,
  FiActivity,
  FiCpu,
  FiCalendar,
  FiChevronDown,
} from "react-icons/fi";

// Create context for time period
const TimePeriodContext = createContext();

// Custom hook to use the time period context
export const useTimePeriod = () => {
  const context = useContext(TimePeriodContext);
  if (!context) {
    throw new Error("useTimePeriod must be used within TimePeriodProvider");
  }
  return context;
};

// Time period options
const TIME_PERIODS = [
  { label: "Last 7 Days", value: 7, unit: "days" },
  { label: "Last 30 Days", value: 30, unit: "days" },
  { label: "Last 90 Days", value: 90, unit: "days" },
  { label: "Last 6 Months", value: 6, unit: "months" },
  { label: "Last Year", value: 1, unit: "year" },
  { label: "All Time", value: null, unit: null },
];

function Dashboard() {
  const [timePeriod, setTimePeriod] = useState(TIME_PERIODS[1]); // Default: Last 30 Days
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);

  const handleTimePeriodChange = (period) => {
    setTimePeriod(period);
    setIsDropdownOpen(false);
  };

  return (
    <TimePeriodContext.Provider value={{ timePeriod, setTimePeriod }}>
      <div className="space-y-6 p-6 bg-gray-50 min-h-screen">
        {/* Page Header */}
        <div className="mb-8 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-4xl font-bold bg-gradient-to-r from-cyan-600 via-blue-600 to-teal-600 bg-clip-text text-transparent mb-2">
              Marine Data Dashboard
            </h1>
            <p className="text-gray-600">
              Comprehensive oceanographic insights and analysis
            </p>
          </div>

          {/* Time Period Selector */}
          <div className="relative">
            <button
              onClick={() => setIsDropdownOpen(!isDropdownOpen)}
              className="flex items-center space-x-2 px-4 py-2.5 bg-gradient-to-r from-cyan-500 to-blue-500 text-white rounded-lg font-semibold shadow-lg hover:shadow-xl transition-all duration-200 hover:from-cyan-600 hover:to-blue-600"
            >
              <FiCalendar className="w-5 h-5" />
              <span>{timePeriod.label}</span>
              <FiChevronDown
                className={`w-4 h-4 transition-transform duration-200 ${
                  isDropdownOpen ? "rotate-180" : ""
                }`}
              />
            </button>

            {/* Dropdown Menu */}
            {isDropdownOpen && (
              <div className="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-xl border border-gray-200 py-2 z-50">
                {TIME_PERIODS.map((period, index) => (
                  <button
                    key={index}
                    onClick={() => handleTimePeriodChange(period)}
                    className={`w-full text-left px-4 py-2.5 hover:bg-gradient-to-r hover:from-cyan-50 hover:to-blue-50 transition-colors duration-150 ${
                      timePeriod.value === period.value &&
                      timePeriod.unit === period.unit
                        ? "bg-gradient-to-r from-cyan-50 to-blue-50 text-cyan-700 font-semibold"
                        : "text-gray-700"
                    }`}
                  >
                    {period.label}
                  </button>
                ))}
              </div>
            )}

            {/* Overlay to close dropdown when clicking outside */}
            {isDropdownOpen && (
              <div
                className="fixed inset-0 z-40"
                onClick={() => setIsDropdownOpen(false)}
              />
            )}
          </div>
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
    </TimePeriodContext.Provider>
  );
}

export default Dashboard;
