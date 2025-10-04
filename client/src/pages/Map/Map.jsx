import React from 'react';
import { NavLink, Outlet, useLocation } from 'react-router-dom';
import { FiMap, FiLayers, FiImage } from 'react-icons/fi';

const Map = () => {
  const location = useLocation();
  
  const tabs = [
    {
      name: 'Marine Biodiversity',
      path: '/app/map/section1',
      icon: <FiMap size={18} />,
      description: 'Species occurrence data from OBIS'
    },
    {
      name: 'Environmental Layers',
      path: '/app/map/section2',
      icon: <FiLayers size={18} />,
      description: 'Sea temperature, currents, wind & waves'
    },
    {
      name: 'Species Images',
      path: '/app/map/section3',
      icon: <FiImage size={18} />,
      description: 'Search and view species images'
    }
  ];

  return (
    <div className="h-full flex flex-col bg-gray-50">
      {/* Header with tabs */}
      <div className="bg-white shadow-sm border-b border-gray-200">
        <div className="px-6 py-4">
          <h1 className="text-2xl font-bold text-gray-800 mb-1">Interactive Marine Maps</h1>
          <p className="text-sm text-gray-600">Explore biodiversity and environmental data</p>
        </div>
        
        <div className="flex gap-2 px-6">
          {tabs.map((tab) => (
            <NavLink
              key={tab.path}
              to={tab.path}
              className={({ isActive }) =>
                `flex items-center gap-2 px-4 py-3 border-b-2 transition-colors ${
                  isActive
                    ? 'border-blue-500 text-blue-600 bg-blue-50'
                    : 'border-transparent text-gray-600 hover:text-gray-800 hover:bg-gray-50'
                }`
              }
            >
              {tab.icon}
              <div className="flex flex-col">
                <span className="font-medium text-sm">{tab.name}</span>
                <span className="text-xs opacity-75">{tab.description}</span>
              </div>
            </NavLink>
          ))}
        </div>
      </div>

      {/* Content area for nested routes */}
      <div className="flex-1 overflow-hidden">
        <Outlet />
      </div>
    </div>
  );
};

export default Map;
