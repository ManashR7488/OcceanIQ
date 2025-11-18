/**
 * Reusable component for displaying API parameter tables
 * @param {Object} props
 * @param {Array} props.parameters - Array of parameter objects
 * @param {string} props.title - Table title
 */
const ParameterTable = ({ parameters, title }) => {
  if (!parameters || parameters.length === 0) {
    return (
      <div className="text-sm text-gray-500 italic">
        No parameters required
      </div>
    );
  }

  // Get type badge color
  const getTypeBadgeColor = (type) => {
    const colors = {
      string: 'bg-blue-100 text-blue-800',
      number: 'bg-green-100 text-green-800',
      boolean: 'bg-purple-100 text-purple-800',
      object: 'bg-orange-100 text-orange-800',
      array: 'bg-teal-100 text-teal-800',
      file: 'bg-pink-100 text-pink-800'
    };
    return colors[type] || 'bg-gray-100 text-gray-800';
  };

  return (
    <div className="overflow-x-auto">
      {title && (
        <h4 className="text-sm font-semibold text-gray-700 mb-2">{title}</h4>
      )}
      <table className="min-w-full border border-gray-200 rounded-lg overflow-hidden">
        <thead className="bg-gray-50">
          <tr>
            <th className="px-4 py-2 text-left text-xs font-semibold text-gray-700 border-b">Name</th>
            <th className="px-4 py-2 text-left text-xs font-semibold text-gray-700 border-b">Type</th>
            <th className="px-4 py-2 text-left text-xs font-semibold text-gray-700 border-b">Required</th>
            <th className="px-4 py-2 text-left text-xs font-semibold text-gray-700 border-b">Description</th>
            <th className="px-4 py-2 text-left text-xs font-semibold text-gray-700 border-b">Example</th>
          </tr>
        </thead>
        <tbody>
          {parameters.map((param, index) => (
            <tr key={index} className={index % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
              <td className="px-4 py-2 text-sm font-mono text-gray-900 border-b">
                {param.name}
              </td>
              <td className="px-4 py-2 text-sm border-b">
                <span className={`inline-block px-2 py-1 text-xs font-medium rounded ${getTypeBadgeColor(param.type)}`}>
                  {param.type}
                </span>
              </td>
              <td className="px-4 py-2 text-sm border-b">
                {param.required ? (
                  <span className="inline-block px-2 py-1 text-xs font-medium rounded bg-green-100 text-green-800">
                    Required
                  </span>
                ) : (
                  <span className="inline-block px-2 py-1 text-xs font-medium rounded bg-gray-100 text-gray-600">
                    Optional
                  </span>
                )}
              </td>
              <td className="px-4 py-2 text-sm text-gray-700 border-b">
                {param.description}
              </td>
              <td className="px-4 py-2 text-sm font-mono text-gray-600 border-b">
                {param.example}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default ParameterTable;
