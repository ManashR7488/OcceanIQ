import { useState } from 'react';
import { FiCopy, FiCheck } from 'react-icons/fi';
import { highlightJson, copyToClipboard } from '../../utils/syntaxHighlighter';

/**
 * Reusable component for displaying syntax-highlighted code blocks
 * @param {Object} props
 * @param {string} props.code - Code to display
 * @param {string} props.language - Language type (default: 'json')
 * @param {boolean} props.showCopy - Show copy button (default: true)
 * @param {string} props.maxHeight - Optional max height with scroll
 */
const CodeBlock = ({ code, language = 'json', showCopy = true, maxHeight }) => {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    const success = await copyToClipboard(code);
    if (success) {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  // Apply syntax highlighting for JSON
  const getHighlightedCode = () => {
    if (language === 'json') {
      return highlightJson(code);
    }
    // For other languages, return plain code (can extend later)
    return code.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
  };

  return (
    <div className="relative">
      {/* Copy Button */}
      {showCopy && (
        <button
          onClick={handleCopy}
          className="absolute top-2 right-2 p-2 bg-gray-800 hover:bg-gray-700 rounded text-gray-300 hover:text-white transition-colors z-10"
          aria-label={copied ? 'Copied!' : 'Copy code'}
          title={copied ? 'Copied!' : 'Copy to clipboard'}
        >
          {copied ? <FiCheck size={16} className="text-green-400" /> : <FiCopy size={16} />}
        </button>
      )}

      {/* Code Display */}
      <pre
        className="bg-gray-900 text-gray-100 p-4 rounded-lg overflow-x-auto font-mono text-sm"
        style={maxHeight ? { maxHeight, overflowY: 'auto' } : {}}
      >
        <code dangerouslySetInnerHTML={{ __html: getHighlightedCode() }} />
      </pre>
    </div>
  );
};

export default CodeBlock;
