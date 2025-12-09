import React, { useState } from 'react';
import { FiUser, FiCopy, FiCheck, FiChevronDown, FiChevronUp, FiRefreshCw, FiAlertTriangle } from 'react-icons/fi';
import { BsRobot } from 'react-icons/bs';
import ReactMarkdown from 'react-markdown';

const ChatMessage = ({ message, role, timestamp, sources, isError, errorDetails, onRegenerate }) => {
  const [copied, setCopied] = useState(false);
  const [sourcesExpanded, setSourcesExpanded] = useState(false);
  const [debugExpanded, setDebugExpanded] = useState(false);

  // Defensive checks
  if (!message || typeof message !== 'string') {
    console.error('[ChatMessage] Invalid message prop:', { message, role, timestamp });
    return (
      <div className="flex gap-3 animate-fadeIn">
        <div className="flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center bg-red-100 text-red-600">
          <BsRobot size={16} />
        </div>
        <div className="flex-1 max-w-[80%]">
          <div className="px-4 py-3 rounded-2xl bg-red-50 border border-red-200 text-red-800 shadow-sm">
            <p className="text-sm">⚠️ Error: Invalid message format</p>
          </div>
        </div>
      </div>
    );
  }

  const isUser = role === 'user';

  const handleCopy = () => {
    navigator.clipboard.writeText(message);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const formatTime = (ts) => {
    if (!ts) return '';
    const date = new Date(ts);
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  return (
    <div className={`flex gap-3 ${isUser ? 'flex-row-reverse' : 'flex-row'} animate-fadeIn`}>
      {/* Avatar */}
      <div
        className={`flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center ${
          isUser
            ? 'bg-gradient-to-br from-blue-600 to-teal-600 text-white'
            : isError
            ? 'bg-red-100 text-red-600'
            : 'bg-gray-100 text-gray-700'
        }`}
      >
        {isUser ? <FiUser size={16} /> : <BsRobot size={16} />}
      </div>

      {/* Message Content */}
      <div className={`flex-1 max-w-[80%] ${isUser ? 'items-end' : 'items-start'} flex flex-col`}>
        {/* Message Bubble */}
        <div
          className={`px-4 py-3 rounded-2xl ${
            isUser
              ? 'bg-gradient-to-br from-blue-600 to-teal-600 text-white'
              : isError
              ? 'bg-red-50 border border-red-200 text-red-800'
              : 'bg-white border border-gray-200 text-gray-800'
          } shadow-sm`}
        >
          {isUser ? (
            <p className="text-sm whitespace-pre-wrap">{message}</p>
          ) : isError ? (
            <div className="flex items-start gap-3">
              <FiAlertTriangle size={18} className="text-red-500 flex-shrink-0 mt-0.5" />
              <div className="flex-1">
                <p className="text-sm font-medium text-red-800 mb-1">Error</p>
                <p className="text-sm text-red-700 whitespace-pre-wrap">{message}</p>
              </div>
            </div>
          ) : (
            <div className="prose prose-sm max-w-none">
              <ReactMarkdown
                components={{
                  p: ({ children }) => <p className="mb-2 last:mb-0">{children}</p>,
                  code: ({ inline, children }) =>
                    inline ? (
                      <code className="px-1.5 py-0.5 bg-gray-100 text-gray-800 rounded text-xs font-mono">
                        {children}
                      </code>
                    ) : (
                      <pre className="p-2 bg-gray-100 rounded text-xs overflow-x-auto">
                        <code>{children}</code>
                      </pre>
                    ),
                }}
              >
                {message}
              </ReactMarkdown>
            </div>
          )}
        </div>

        {/* Message Footer */}
        <div className={`flex items-center gap-2 mt-1 px-2 ${isUser ? 'flex-row-reverse' : 'flex-row'}`}>
          {/* Timestamp */}
          <span className="text-xs text-gray-500">{formatTime(timestamp)}</span>

          {/* Actions for AI messages */}
          {!isUser && (
            <>
              {/* Copy Button */}
              <button
                onClick={handleCopy}
                className="p-1 hover:bg-gray-100 rounded transition-colors"
                title="Copy message"
              >
                {copied ? (
                  <FiCheck size={14} className="text-green-600" />
                ) : (
                  <FiCopy size={14} className="text-gray-500" />
                )}
              </button>

              {/* Regenerate Button */}
              {onRegenerate && !isError && (
                <button
                  onClick={onRegenerate}
                  className="p-1 hover:bg-gray-100 rounded transition-colors"
                  title="Regenerate response"
                >
                  <FiRefreshCw size={14} className="text-gray-500" />
                </button>
              )}
            </>
          )}
        </div>

        {/* Debug Panel for Error Details */}
        {errorDetails && isError && (
          <div className="mt-2 w-full">
            <button
              onClick={() => setDebugExpanded(!debugExpanded)}
              className="flex items-center gap-2 text-xs text-gray-600 hover:text-gray-800 font-medium"
            >
              {debugExpanded ? <FiChevronUp size={14} /> : <FiChevronDown size={14} />}
              Debug Details
            </button>

            {debugExpanded && (
              <div className="mt-2 p-3 bg-gray-900 text-gray-100 rounded-lg text-xs font-mono animate-fadeIn overflow-x-auto">
                <pre className="whitespace-pre-wrap">
                  {JSON.stringify(errorDetails, null, 2)}
                </pre>
              </div>
            )}
          </div>
        )}

        {/* Sources (collapsible) */}
        {sources && sources.length > 0 && (
          <div className="mt-2 w-full">
            <button
              onClick={() => setSourcesExpanded(!sourcesExpanded)}
              className="flex items-center gap-2 text-xs text-blue-600 hover:text-blue-700 font-medium"
            >
              {sourcesExpanded ? <FiChevronUp size={14} /> : <FiChevronDown size={14} />}
              {sources.length} source{sources.length !== 1 ? 's' : ''} cited
            </button>

            {sourcesExpanded && (
              <div className="mt-2 space-y-2 animate-fadeIn">
                {sources.map((source, idx) => (
                  <div
                    key={idx}
                    className="p-3 bg-gray-50 border border-gray-200 rounded-lg text-xs"
                  >
                    <p className="text-gray-700 mb-1 line-clamp-2">{source.text}</p>
                    {source.metadata && (
                      <div className="flex flex-wrap gap-2 text-gray-500">
                        {source.metadata.chunk_index !== undefined && (
                          <span>Chunk {source.metadata.chunk_index}</span>
                        )}
                        {source.metadata.filename && (
                          <span>• {source.metadata.filename}</span>
                        )}
                        {source.distance !== undefined && (
                          <span>• Similarity: {(1 - source.distance).toFixed(2)}</span>
                        )}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default ChatMessage;
