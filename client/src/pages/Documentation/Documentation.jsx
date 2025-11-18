import { useState, useMemo } from 'react';
import { FiSearch, FiMenu, FiX, FiBook, FiExternalLink } from 'react-icons/fi';
import { API_DOCUMENTATION } from '../../data/apiDocumentation';
import ApiTester from '../../components/Documentation/ApiTester';
import CodeBlock from '../../components/Documentation/CodeBlock';
import ParameterTable from '../../components/Documentation/ParameterTable';

const Documentation = () => {
  const [selectedCategory, setSelectedCategory] = useState(API_DOCUMENTATION[0]);
  const [selectedEndpoint, setSelectedEndpoint] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [expandedCategories, setExpandedCategories] = useState(
    API_DOCUMENTATION.reduce((acc, cat) => ({ ...acc, [cat.id]: true }), {})
  );

  // Filter endpoints by search query
  const filteredCategories = useMemo(() => {
    if (!searchQuery.trim()) return API_DOCUMENTATION;

    const query = searchQuery.toLowerCase();
    return API_DOCUMENTATION.map(category => ({
      ...category,
      endpoints: category.endpoints.filter(
        endpoint =>
          endpoint.name.toLowerCase().includes(query) ||
          endpoint.path.toLowerCase().includes(query) ||
          endpoint.description.toLowerCase().includes(query)
      )
    })).filter(category => category.endpoints.length > 0);
  }, [searchQuery]);

  // Toggle category expansion
  const toggleCategory = (categoryId) => {
    setExpandedCategories(prev => ({
      ...prev,
      [categoryId]: !prev[categoryId]
    }));
  };

  // Select endpoint
  const handleEndpointSelect = (category, endpoint) => {
    setSelectedCategory(category);
    setSelectedEndpoint(endpoint);
    setSidebarCollapsed(true); // Collapse sidebar on mobile after selection
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // Get method badge color
  const getMethodColor = (method) => {
    const colors = {
      GET: 'bg-blue-100 text-blue-800',
      POST: 'bg-green-100 text-green-800',
      PUT: 'bg-yellow-100 text-yellow-800',
      DELETE: 'bg-red-100 text-red-800',
      PATCH: 'bg-purple-100 text-purple-800'
    };
    return colors[method] || 'bg-gray-100 text-gray-800';
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-blue-50 to-cyan-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 sticky top-0 z-30 shadow-sm">
        <div className="max-w-screen-2xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center space-x-3">
              <button
                onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
                className="lg:hidden p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded"
              >
                {sidebarCollapsed ? <FiMenu size={20} /> : <FiX size={20} />}
              </button>
              <FiBook className="text-blue-600" size={24} />
              <h1 className="text-xl font-bold text-gray-900">API Documentation</h1>
            </div>
            <div className="text-sm text-gray-600">
              {filteredCategories.reduce((acc, cat) => acc + cat.endpoints.length, 0)} endpoints
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-screen-2xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <div className="flex gap-6">
          {/* Left Sidebar */}
          <aside
            className={`${
              sidebarCollapsed ? 'hidden' : 'block'
            } lg:block w-full lg:w-80 flex-shrink-0`}
          >
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 sticky top-24 max-h-[calc(100vh-7rem)] overflow-hidden flex flex-col">
              {/* Search */}
              <div className="p-4 border-b">
                <div className="relative">
                  <FiSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                  <input
                    type="text"
                    placeholder="Search endpoints..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                  />
                </div>
              </div>

              {/* Category List */}
              <div className="overflow-y-auto flex-1">
                {filteredCategories.map(category => {
                  const Icon = category.icon;
                  const isExpanded = expandedCategories[category.id];
                  
                  return (
                    <div key={category.id} className="border-b last:border-b-0">
                      {/* Category Header */}
                      <button
                        onClick={() => toggleCategory(category.id)}
                        className="w-full flex items-center justify-between p-4 hover:bg-gray-50 transition-colors"
                      >
                        <div className="flex items-center space-x-3">
                          <Icon className="text-blue-600" size={18} />
                          <div className="text-left">
                            <h3 className="text-sm font-semibold text-gray-900">{category.name}</h3>
                            <p className="text-xs text-gray-500">{category.endpoints.length} endpoints</p>
                          </div>
                        </div>
                        <span className="text-gray-400">
                          {isExpanded ? '−' : '+'}
                        </span>
                      </button>

                      {/* Endpoints List */}
                      {isExpanded && (
                        <div className="bg-gray-50">
                          {category.endpoints.map(endpoint => (
                            <button
                              key={endpoint.id}
                              onClick={() => handleEndpointSelect(category, endpoint)}
                              className={`w-full flex items-center space-x-2 px-4 py-2 hover:bg-gray-100 transition-colors text-left border-t ${
                                selectedEndpoint?.id === endpoint.id ? 'bg-blue-50 border-l-4 border-l-blue-600' : ''
                              }`}
                            >
                              <span className={`px-2 py-0.5 text-xs font-semibold rounded ${getMethodColor(endpoint.method)}`}>
                                {endpoint.method}
                              </span>
                              <span className="text-sm text-gray-700 truncate flex-1">{endpoint.name}</span>
                            </button>
                          ))}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          </aside>

          {/* Main Content Area */}
          <main className="flex-1 min-w-0">
            {!selectedEndpoint ? (
              // Welcome Screen
              <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-8">
                <div className="max-w-3xl mx-auto text-center">
                  <FiBook className="mx-auto text-blue-600 mb-4" size={48} />
                  <h2 className="text-3xl font-bold text-gray-900 mb-4">
                    Welcome to OcceanIQ API Documentation
                  </h2>
                  <p className="text-lg text-gray-600 mb-8">
                    Comprehensive documentation for the OcceanIQ marine data platform API.
                    Explore {API_DOCUMENTATION.reduce((acc, cat) => acc + cat.endpoints.length, 0)} endpoints
                    across {API_DOCUMENTATION.length} categories.
                  </p>

                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-6 text-left mb-8">
                    <h3 className="text-lg font-semibold text-blue-900 mb-3">Quick Start</h3>
                    <ol className="space-y-2 text-sm text-blue-800">
                      <li className="flex items-start">
                        <span className="font-bold mr-2">1.</span>
                        <span>Select an API category from the sidebar</span>
                      </li>
                      <li className="flex items-start">
                        <span className="font-bold mr-2">2.</span>
                        <span>Choose an endpoint to view its documentation</span>
                      </li>
                      <li className="flex items-start">
                        <span className="font-bold mr-2">3.</span>
                        <span>Use the "Try It Out" panel to test the endpoint with live data</span>
                      </li>
                      <li className="flex items-start">
                        <span className="font-bold mr-2">4.</span>
                        <span>Copy response examples or code snippets for your application</span>
                      </li>
                    </ol>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-left">
                    {API_DOCUMENTATION.slice(0, 3).map(category => {
                      const Icon = category.icon;
                      return (
                        <div
                          key={category.id}
                          onClick={() => {
                            setSelectedCategory(category);
                            setExpandedCategories(prev => ({ ...prev, [category.id]: true }));
                          }}
                          className="bg-gradient-to-br from-blue-50 to-cyan-50 border border-blue-200 rounded-lg p-4 hover:shadow-md transition-shadow cursor-pointer"
                        >
                          <Icon className="text-blue-600 mb-2" size={24} />
                          <h4 className="font-semibold text-gray-900 mb-1">{category.name}</h4>
                          <p className="text-sm text-gray-600">{category.description}</p>
                          <p className="text-xs text-blue-600 mt-2">{category.endpoints.length} endpoints →</p>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>
            ) : (
              // Endpoint Documentation
              <div className="space-y-6">
                {/* Endpoint Header */}
                <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex items-center space-x-3">
                      <span className={`px-3 py-1 text-sm font-bold rounded ${getMethodColor(selectedEndpoint.method)}`}>
                        {selectedEndpoint.method}
                      </span>
                      <code className="text-lg font-mono text-gray-800">{selectedEndpoint.path}</code>
                    </div>
                    {selectedEndpoint.requiresAuth && (
                      <span className="flex items-center space-x-1 px-3 py-1 bg-yellow-100 text-yellow-800 text-sm font-medium rounded">
                        <FiExternalLink size={14} />
                        <span>Auth Required</span>
                      </span>
                    )}
                  </div>
                  <h2 className="text-2xl font-bold text-gray-900 mb-2">{selectedEndpoint.name}</h2>
                  <p className="text-gray-700">{selectedEndpoint.description}</p>
                </div>

                {/* Parameters */}
                {selectedEndpoint.parameters && selectedEndpoint.parameters.length > 0 && (
                  <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                    <h3 className="text-lg font-semibold text-gray-900 mb-4">Parameters</h3>
                    
                    {/* Group parameters by location */}
                    {['path', 'query', 'header'].map(location => {
                      const params = selectedEndpoint.parameters.filter(p => p.location === location);
                      if (params.length === 0) return null;
                      
                      return (
                        <div key={location} className="mb-4 last:mb-0">
                          <ParameterTable
                            parameters={params}
                            title={`${location.charAt(0).toUpperCase() + location.slice(1)} Parameters`}
                          />
                        </div>
                      );
                    })}
                  </div>
                )}

                {/* Request Body */}
                {selectedEndpoint.requestBody && (
                  <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                    <h3 className="text-lg font-semibold text-gray-900 mb-4">Request Body</h3>
                    <p className="text-sm text-gray-600 mb-3">
                      Content-Type: <code className="bg-gray-100 px-2 py-1 rounded text-xs">{selectedEndpoint.requestBody.contentType}</code>
                    </p>
                    
                    {/* Schema Table */}
                    {selectedEndpoint.requestBody.schema && (
                      <div className="mb-4">
                        <h4 className="text-sm font-semibold text-gray-700 mb-2">Schema</h4>
                        <ParameterTable
                          parameters={Object.entries(selectedEndpoint.requestBody.schema).map(([key, value]) => ({
                            name: key,
                            type: value.type,
                            required: value.required,
                            location: 'body',
                            description: value.description,
                            example: ''
                          }))}
                        />
                      </div>
                    )}
                    
                    {/* Example */}
                    {selectedEndpoint.requestBody.example && (
                      <div>
                        <h4 className="text-sm font-semibold text-gray-700 mb-2">Example</h4>
                        <CodeBlock code={selectedEndpoint.requestBody.example} language="json" />
                      </div>
                    )}
                  </div>
                )}

                {/* Responses */}
                {selectedEndpoint.responses && (
                  <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                    <h3 className="text-lg font-semibold text-gray-900 mb-4">Responses</h3>
                    <div className="space-y-4">
                      {Object.entries(selectedEndpoint.responses).map(([status, response]) => (
                        <div key={status} className="border border-gray-200 rounded-lg p-4">
                          <div className="flex items-center space-x-3 mb-2">
                            <span className={`px-3 py-1 text-sm font-semibold rounded ${
                              status.startsWith('2') ? 'bg-green-100 text-green-800' :
                              status.startsWith('4') ? 'bg-yellow-100 text-yellow-800' :
                              status.startsWith('5') ? 'bg-red-100 text-red-800' :
                              'bg-gray-100 text-gray-800'
                            }`}>
                              {status}
                            </span>
                            <span className="text-sm text-gray-700">{response.description}</span>
                          </div>
                          <CodeBlock code={response.example} language="json" />
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Notes */}
                {selectedEndpoint.notes && selectedEndpoint.notes.length > 0 && (
                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
                    <h3 className="text-lg font-semibold text-blue-900 mb-3">Notes</h3>
                    <ul className="space-y-2">
                      {selectedEndpoint.notes.map((note, index) => (
                        <li key={index} className="flex items-start text-sm text-blue-800">
                          <span className="mr-2">•</span>
                          <span>{note}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                {/* Try It Panel */}
                <div className="lg:sticky lg:top-24">
                  <ApiTester endpoint={selectedEndpoint} />
                </div>
              </div>
            )}
          </main>
        </div>
      </div>
    </div>
  );
};

export default Documentation;
