import { useState } from 'react';
import { FiSend, FiLock, FiUnlock, FiAlertCircle } from 'react-icons/fi';
import {axiosInstance2} from '../../config/axios.config';
import useAuthStore from '../../store/useAuthStore';
import CodeBlock from './CodeBlock';
import { isValidJson, formatJson } from '../../utils/syntaxHighlighter';

/**
 * Reusable component for testing API endpoints
 * @param {Object} props
 * @param {Object} props.endpoint - Endpoint object from API documentation
 */
const ApiTester = ({ endpoint }) => {
  const { user } = useAuthStore();
  const [paramValues, setParamValues] = useState({});
  const [isLoading, setIsLoading] = useState(false);
  const [response, setResponse] = useState(null);
  const [error, setError] = useState(null);
  const [validationError, setValidationError] = useState(null);

  // Build request URL with path and query parameters
  const buildRequestUrl = () => {
    let url = endpoint.path;

    // Substitute path parameters
    const pathParams = endpoint.parameters?.filter(p => p.location === 'path') || [];
    pathParams.forEach(param => {
      const value = paramValues[param.name] || '';
      url = url.replace(`:${param.name}`, value);
    });

    // Add query parameters
    const queryParams = endpoint.parameters?.filter(p => p.location === 'query') || [];
    const queryString = queryParams
      .filter(param => paramValues[param.name])
      .map(param => `${param.name}=${encodeURIComponent(paramValues[param.name])}`)
      .join('&');

    if (queryString) {
      url += `?${queryString}`;
    }

    return url;
  };

  // Validate inputs
  const validateInputs = () => {
    // Check required parameters
    const requiredParams = endpoint.parameters?.filter(p => p.required) || [];
    for (const param of requiredParams) {
      if (!paramValues[param.name]) {
        return `Required parameter '${param.name}' is missing`;
      }
    }

    // Validate JSON body
    if (endpoint.requestBody && endpoint.requestBody.contentType === 'application/json') {
      const bodyValue = paramValues['__body__'];
      if (bodyValue) {
        if (!isValidJson(bodyValue)) {
          return 'Invalid JSON in request body';
        }
      }
    }

    return null;
  };

  // Handle parameter input change
  const handleParamChange = (paramName, value) => {
    setParamValues(prev => ({ ...prev, [paramName]: value }));
    setValidationError(null);
  };

  // Execute API request
  const handleSendRequest = async () => {
    setError(null);
    setResponse(null);
    setValidationError(null);

    // Validate inputs
    const validationErr = validateInputs();
    if (validationErr) {
      setValidationError(validationErr);
      return;
    }

    setIsLoading(true);
    const startTime = Date.now();

    try {
      const url = buildRequestUrl();
      const method = endpoint.method.toLowerCase();

      let requestConfig = {
        method,
        url
      };

      // Add request body for POST/PUT/PATCH
      if (['post', 'put', 'patch'].includes(method)) {
        if (endpoint.requestBody) {
          if (endpoint.requestBody.contentType === 'application/json') {
            const bodyValue = paramValues['__body__'] || endpoint.requestBody.example;
            requestConfig.data = JSON.parse(bodyValue);
          } else if (endpoint.requestBody.contentType === 'multipart/form-data') {
            // For file uploads, show message
            setValidationError('File upload testing is not supported in this interface. Please use a tool like Postman for file uploads.');
            setIsLoading(false);
            return;
          }
        }
      }

      const res = await axiosInstance2(requestConfig);
      const endTime = Date.now();

      setResponse({
        status: res.status,
        statusText: res.statusText,
        data: res.data,
        headers: res.headers,
        time: endTime - startTime
      });
    } catch (err) {
      const endTime = Date.now();
      setError({
        message: err.response?.data?.message || err.message,
        status: err.response?.status,
        data: err.response?.data,
        time: endTime - startTime
      });
    } finally {
      setIsLoading(false);
    }
  };

  // Get status badge color
  const getStatusColor = (status) => {
    if (status >= 200 && status < 300) return 'bg-green-100 text-green-800';
    if (status >= 300 && status < 400) return 'bg-blue-100 text-blue-800';
    if (status >= 400 && status < 500) return 'bg-yellow-100 text-yellow-800';
    if (status >= 500) return 'bg-red-100 text-red-800';
    return 'bg-gray-100 text-gray-800';
  };

  // Get path parameters
  const pathParams = endpoint.parameters?.filter(p => p.location === 'path') || [];
  const queryParams = endpoint.parameters?.filter(p => p.location === 'query') || [];
  const hasRequestBody = endpoint.requestBody && ['POST', 'PUT', 'PATCH'].includes(endpoint.method);

  return (
    <div className="bg-white border border-gray-200 rounded-lg p-6 space-y-6">
      {/* Header */}
      <div className="border-b pb-4">
        <div className="flex items-center justify-between mb-2">
          <h3 className="text-lg font-semibold text-gray-900">Try It Out</h3>
          {endpoint.requiresAuth && (
            <div className="flex items-center space-x-2">
              {user ? (
                <>
                  <FiUnlock className="text-green-500" size={16} />
                  <span className="text-sm text-green-600">Authenticated</span>
                </>
              ) : (
                <>
                  <FiLock className="text-red-500" size={16} />
                  <span className="text-sm text-red-600">Authentication Required</span>
                </>
              )}
            </div>
          )}
        </div>
        <div className="flex items-center space-x-2">
          <span className={`px-2 py-1 text-xs font-semibold rounded ${
            endpoint.method === 'GET' ? 'bg-blue-100 text-blue-800' :
            endpoint.method === 'POST' ? 'bg-green-100 text-green-800' :
            endpoint.method === 'PUT' ? 'bg-yellow-100 text-yellow-800' :
            'bg-red-100 text-red-800'
          }`}>
            {endpoint.method}
          </span>
          <span className="text-sm font-mono text-gray-700">{buildRequestUrl()}</span>
        </div>
      </div>

      {/* Auth Warning */}
      {endpoint.requiresAuth && !user && (
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 flex items-start space-x-3">
          <FiAlertCircle className="text-yellow-600 mt-0.5" size={20} />
          <div>
            <p className="text-sm font-medium text-yellow-800">Authentication Required</p>
            <p className="text-sm text-yellow-700 mt-1">
              You need to <a href="/app/auth/login" className="underline">log in</a> to test this endpoint.
            </p>
          </div>
        </div>
      )}

      {/* Path Parameters */}
      {pathParams.length > 0 && (
        <div>
          <h4 className="text-sm font-semibold text-gray-700 mb-2">Path Parameters</h4>
          <div className="space-y-2">
            {pathParams.map(param => (
              <div key={param.name}>
                <label className="block text-sm text-gray-700 mb-1">
                  {param.name}
                  {param.required && <span className="text-red-500 ml-1">*</span>}
                </label>
                <input
                  type="text"
                  value={paramValues[param.name] || ''}
                  onChange={(e) => handleParamChange(param.name, e.target.value)}
                  placeholder={param.example}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                />
                <p className="text-xs text-gray-500 mt-1">{param.description}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Query Parameters */}
      {queryParams.length > 0 && (
        <div>
          <h4 className="text-sm font-semibold text-gray-700 mb-2">Query Parameters</h4>
          <div className="space-y-2">
            {queryParams.map(param => (
              <div key={param.name}>
                <label className="block text-sm text-gray-700 mb-1">
                  {param.name}
                  {param.required && <span className="text-red-500 ml-1">*</span>}
                </label>
                <input
                  type="text"
                  value={paramValues[param.name] || ''}
                  onChange={(e) => handleParamChange(param.name, e.target.value)}
                  placeholder={param.example}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                />
                <p className="text-xs text-gray-500 mt-1">{param.description}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Request Body */}
      {hasRequestBody && endpoint.requestBody.contentType === 'application/json' && (
        <div>
          <h4 className="text-sm font-semibold text-gray-700 mb-2">Request Body (JSON)</h4>
          <textarea
            value={paramValues['__body__'] || endpoint.requestBody.example}
            onChange={(e) => handleParamChange('__body__', e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent font-mono text-sm"
            rows={10}
            placeholder={endpoint.requestBody.example}
          />
        </div>
      )}

      {/* Validation Error */}
      {validationError && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-3 text-sm text-red-700">
          {validationError}
        </div>
      )}

      {/* Send Button */}
      <button
        onClick={handleSendRequest}
        disabled={isLoading || (endpoint.requiresAuth && !user)}
        className="w-full flex items-center justify-center space-x-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed text-white rounded-lg font-medium transition-colors"
      >
        <FiSend size={16} />
        <span>{isLoading ? 'Sending...' : 'Send Request'}</span>
      </button>

      {/* Response Display */}
      {response && (
        <div className="border-t pt-4">
          <h4 className="text-sm font-semibold text-gray-700 mb-3">Response</h4>
          
          {/* Status and Time */}
          <div className="flex items-center space-x-4 mb-3">
            <span className={`px-3 py-1 text-sm font-semibold rounded ${getStatusColor(response.status)}`}>
              {response.status} {response.statusText}
            </span>
            <span className="text-sm text-gray-600">
              Time: {response.time}ms
            </span>
          </div>

          {/* Response Body */}
          <div className="mb-3">
            <p className="text-xs text-gray-600 mb-2">Response Body:</p>
            <CodeBlock
              code={formatJson(response.data)}
              language="json"
              showCopy={true}
              maxHeight="400px"
            />
          </div>
        </div>
      )}

      {/* Error Display */}
      {error && (
        <div className="border-t pt-4">
          <h4 className="text-sm font-semibold text-red-700 mb-3">Error</h4>
          
          {/* Status and Time */}
          <div className="flex items-center space-x-4 mb-3">
            {error.status && (
              <span className={`px-3 py-1 text-sm font-semibold rounded ${getStatusColor(error.status)}`}>
                {error.status}
              </span>
            )}
            <span className="text-sm text-gray-600">
              Time: {error.time}ms
            </span>
          </div>

          {/* Error Message */}
          <div className="bg-red-50 border border-red-200 rounded-lg p-3 mb-3">
            <p className="text-sm text-red-700 font-medium">{error.message}</p>
          </div>

          {/* Error Data */}
          {error.data && (
            <div>
              <p className="text-xs text-gray-600 mb-2">Error Details:</p>
              <CodeBlock
                code={formatJson(error.data)}
                language="json"
                showCopy={true}
                maxHeight="300px"
              />
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default ApiTester;
