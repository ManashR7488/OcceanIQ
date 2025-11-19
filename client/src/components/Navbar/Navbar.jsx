import { useState, useEffect } from "react";
import { Link, NavLink, useLocation } from "react-router-dom";
import {
  FiMenu,
  FiGrid,
  FiMap,
  FiChevronRight,
  FiTrendingUp,
  FiActivity,
  FiLayers,
  FiCrosshair,
  FiHeart,
  FiCpu,
  FiDatabase,
  FiFilter,
  FiMapPin,
  FiImage,
  FiBox,
  FiTool,
  FiBarChart2,
} from "react-icons/fi";
import { LuMicroscope } from "react-icons/lu";
import { GiArchiveResearch } from "react-icons/gi";

const NavBar = () => {
  const [collapsed, setCollapsed] = useState(false);
  const [expandedMenus, setExpandedMenus] = useState({});
  const [hoveredParent, setHoveredParent] = useState(null);
  const location = useLocation();

  // Hierarchical navigation configuration
  const navLinks = [
    { 
      name: "Home", 
      path: "/app", 
      icon: <FiGrid size={20} />,
      exact: true
    },
    {
      name: "Dashboard",
      path: "/app/dashboard",
      icon: <FiGrid size={20} />,
      children: [
        { 
          name: "Oceanographic Trends", 
          path: "/app/dashboard", 
          icon: <FiTrendingUp size={16} />,
          exact: true
        },
        { 
          name: "Biodiversity Analysis", 
          path: "/app/dashboard/analysis", 
          icon: <FiActivity size={16} /> 
        },
        { 
          name: "3D Visualization", 
          path: "/app/dashboard/3d-visualization", 
          icon: <FiLayers size={16} /> 
        },
        { 
          name: "Ecosystem Health", 
          path: "/app/dashboard/ecosystem-health", 
          icon: <FiHeart size={16} /> 
        },
        { 
          name: "AI Analytics", 
          path: "/app/dashboard/ai-analytics", 
          icon: <FiCpu size={16} /> 
        },
      ]
    },
    {
      name: "Map",
      path: "/app/map",
      icon: <FiMap size={20} />,
      children: [
        { 
          name: "Marine Biodiversity", 
          path: "/app/map/section1", 
          icon: <FiMapPin size={16} /> 
        },
        { 
          name: "Environmental Layers", 
          path: "/app/map/section2", 
          icon: <FiLayers size={16} /> 
        },
        { 
          name: "Species Images", 
          path: "/app/map/section3", 
          icon: <FiImage size={16} /> 
        },
        { 
          name: "Data Analysis", 
          path: "/app/map/section4", 
          icon: <FiBox size={16} /> 
        },
      ]
    },
    {
      name: "Modules",
      path: "/app/modules",
      icon: <GiArchiveResearch size={20} />,
      children: [
        { 
          name: "Otolith Analysis", 
          path: "/app/modules/otolith-analysis", 
          icon: <LuMicroscope size={16} /> 
        },
        { 
          name: "Taxonomic Management", 
          path: "/app/modules/taxonomic-management", 
          icon: <FiDatabase size={16} /> 
        },
        { 
          name: "eDNA Processing", 
          path: "/app/modules/edna-processing", 
          icon: <FiFilter size={16} /> 
        },
      ]
    },
    {
      name: "Tools",
      path: "/app/tools",
      icon: <FiTool size={20} />,
      children: [
        { 
          name: "Correlation Tool", 
          path: "/app/tools", 
          icon: <FiBarChart2 size={16} />,
          exact: true
        },
        { 
          name: "AI Correlation", 
          path: "/app/tools/ai-correlation", 
          icon: <FiCpu size={16} /> 
        },
      ]
    },
  ];

  // Toggle menu expansion
  const toggleMenu = (path) => {
    setExpandedMenus((prev) => ({
      ...prev,
      [path]: !prev[path],
    }));
  };

  // Check if any child is active
  const hasActiveChild = (item) => {
    if (!item.children) return false;
    return item.children.some(child => location.pathname === child.path);
  };

  // Auto-expand active parent menu on mount and route change
  useEffect(() => {
    navLinks.forEach((item) => {
      if (item.children) {
        const hasActiveChild = item.children.some(
          (child) => location.pathname === child.path
        );
        if (hasActiveChild && !expandedMenus[item.path]) {
          setExpandedMenus((prev) => ({
            ...prev,
            [item.path]: true,
          }));
        }
      }
    });
  }, [location.pathname]);

  // Render navigation item (with or without children)
  const renderNavItem = (item, depth = 0) => {
    const hasChildren = item.children && item.children.length > 0;
    const isExpanded = expandedMenus[item.path];
    const isChildActive = hasActiveChild(item);

    if (hasChildren) {
      // Parent item with children
      return (
        <div 
          key={item.path}
          className="relative"
          onMouseEnter={() => collapsed && setHoveredParent(item.path)}
          onMouseLeave={() => collapsed && setHoveredParent(null)}
        >
          {/* Parent Container */}
          <div
            className={`flex items-center justify-between gap-2 px-4 py-1 mx-2 my-1 rounded-lg transition-all ${
              isChildActive
                ? "bg-gradient-to-r from-indigo-100 to-blue-50 text-blue-600 font-semibold"
                : "text-gray-700 hover:bg-gray-100"
            }`}
          >
            {/* Navigable parent link */}
            <NavLink
              to={item.path}
              className="flex items-center gap-4 flex-1 min-w-0"
              title={collapsed ? item.name : undefined}
            >
              {({ isActive }) => (
                <>
                  <div
                    className={`p-2 rounded-md transition-colors ${
                      isActive || isChildActive ? "bg-white shadow" : "bg-transparent"
                    }`}
                  >
                    {item.icon}
                  </div>
                  {!collapsed && (
                    <span className="flex-1 text-nowrap text-xs truncate">
                      {item.name}
                    </span>
                  )}
                </>
              )}
            </NavLink>
            
            {/* Chevron for expansion (only in expanded mode) */}
            {!collapsed && (
              <div
                onClick={(e) => {
                  e.stopPropagation();
                  toggleMenu(item.path);
                }}
                className="cursor-pointer p-1 hover:bg-white/50 rounded transition-all"
                role="button"
                aria-expanded={isExpanded}
                aria-controls={`submenu-${item.path}`}
              >
                <div
                  className={`transition-transform duration-200 ${
                    isExpanded ? "rotate-90" : "rotate-0"
                  }`}
                >
                  <FiChevronRight size={16} />
                </div>
              </div>
            )}
          </div>

          {/* Children - Dropdown (expanded mode) */}
          {!collapsed && (
            <div
              id={`submenu-${item.path}`}
              className={`overflow-hidden transition-all duration-300 ${
                isExpanded ? "max-h-96 opacity-100" : "max-h-0 opacity-0"
              }`}
            >
              {item.children.map((child) => renderNavItem(child, depth + 1))}
            </div>
          )}

          {/* Children - Hover Submenu (collapsed mode) */}
          {collapsed && hoveredParent === item.path && (
            <div
              className="absolute left-full top-0 ml-2 bg-white shadow-xl rounded-lg border border-gray-200 py-2 min-w-[200px] z-50"
              onMouseEnter={() => setHoveredParent(item.path)}
              onMouseLeave={() => setHoveredParent(null)}
            >
              {/* Parent title in submenu */}
              <div className="px-4 py-2 text-xs font-semibold text-gray-500 border-b border-gray-100">
                {item.name}
              </div>
              {/* Child links */}
              {item.children.map((child) => (
                <NavLink
                  key={child.path}
                  to={child.path}
                  end={child.exact}
                  className={({ isActive }) =>
                    `flex items-center gap-3 px-4 py-2 transition-colors ${
                      isActive
                        ? "bg-gradient-to-r from-indigo-50 to-blue-50 text-blue-600 font-medium"
                        : "text-gray-700 hover:bg-gray-50"
                    }`
                  }
                >
                  <div className="text-gray-400">{child.icon}</div>
                  <span className="text-xs">{child.name}</span>
                </NavLink>
              ))}
            </div>
          )}
        </div>
      );
    } else {
      // Leaf item (no children)
      return (
        <NavLink
          key={item.path}
          to={item.path}
          end={item.exact}
          title={collapsed ? item.name : undefined}
        >
          {({ isActive }) => (
            <div
              className={`flex items-center gap-3 py-1 mx-2 my-1 rounded-lg transition-colors ${
                depth > 0 ? "pl-8" : "px-4"
              } ${
                isActive
                  ? "bg-gradient-to-r from-indigo-100 to-blue-50 text-blue-600 font-semibold"
                  : "text-gray-700 hover:bg-gray-100"
              }`}
            >
              <div
                className={`p-2 rounded-md transition-colors ${
                  isActive ? "bg-white shadow" : "bg-transparent"
                } ${depth > 0 ? "scale-90" : ""}`}
              >
                {item.icon}
              </div>
              {!collapsed && (
                <span className={`flex-1 text-nowrap ${depth > 0 ? "text-xs" : "text-xs"}`}>
                  {item.name}
                </span>
              )}
            </div>
          )}
        </NavLink>
      );
    }
  };

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
      <nav className="flex-1 mt-4 overflow-y-auto">
        {navLinks.map((item) => renderNavItem(item))}
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
