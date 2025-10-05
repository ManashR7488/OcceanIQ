import React from 'react';
import { FiAlertTriangle, FiAlertCircle, FiInfo, FiX } from 'react-icons/fi';

/**
 * Reusable Alert Card Component
 * Displays ecosystem alerts with severity-based styling
 */
function AlertCard({ alert, onDismiss }) {
  // Determine styling based on severity
  const getSeverityStyles = () => {
    switch (alert.severity) {
      case 'critical':
        return {
          container: 'bg-red-50 border-red-500',
          icon: 'text-red-600',
          badge: 'bg-red-100 text-red-800',
          IconComponent: FiAlertTriangle
        };
      case 'warning':
        return {
          container: 'bg-yellow-50 border-yellow-500',
          icon: 'text-yellow-600',
          badge: 'bg-yellow-100 text-yellow-800',
          IconComponent: FiAlertCircle
        };
      case 'info':
      default:
        return {
          container: 'bg-blue-50 border-blue-500',
          icon: 'text-blue-600',
          badge: 'bg-blue-100 text-blue-800',
          IconComponent: FiInfo
        };
    }
  };

  const styles = getSeverityStyles();
  const { IconComponent } = styles;

  // Format timestamp to relative time
  const formatTimestamp = (timestamp) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffMs = now - date;
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins} minute${diffMins > 1 ? 's' : ''} ago`;
    if (diffHours < 24) return `${diffHours} hour${diffHours > 1 ? 's' : ''} ago`;
    return `${diffDays} day${diffDays > 1 ? 's' : ''} ago`;
  };

  return (
    <div
      className={`relative border-l-4 rounded-lg shadow-sm p-4 transition-all duration-200 hover:shadow-md ${styles.container}`}
      role="alert"
      aria-live="polite"
    >
      <div className="flex items-start">
        {/* Icon */}
        <div className={`flex-shrink-0 ${styles.icon}`}>
          <IconComponent className="w-5 h-5" aria-hidden="true" />
        </div>

        {/* Content */}
        <div className="ml-3 flex-1">
          {/* Type Badge */}
          <span className={`inline-block px-2 py-1 text-xs font-semibold rounded-full ${styles.badge}`}>
            {alert.type}
          </span>

          {/* Message */}
          <p className="mt-2 text-sm text-gray-700">{alert.message}</p>

          {/* Timestamp */}
          <p className="mt-1 text-xs text-gray-500">
            {formatTimestamp(alert.timestamp)}
          </p>
        </div>

        {/* Dismiss Button */}
        {onDismiss && (
          <button
            onClick={() => onDismiss(alert)}
            className="flex-shrink-0 ml-3 text-gray-400 hover:text-gray-600 transition-colors"
            aria-label="Dismiss alert"
          >
            <FiX className="w-4 h-4" />
          </button>
        )}
      </div>
    </div>
  );
}

export default AlertCard;
