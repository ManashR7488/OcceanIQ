import React, { useState, useEffect } from 'react';
import Scanner  from 'react-qr-barcode-scanner';
import { FiCamera, FiX, FiCheck, FiAlertCircle } from 'react-icons/fi';

const BarcodeScanner = ({ onScan, onClose, formats = ['qr_code', 'code_128', 'ean_13'] }) => {
  const [scanning, setScanning] = useState(true);
  const [error, setError] = useState(null);
  const [scannedData, setScannedData] = useState(null);
  const [cameraPermission, setCameraPermission] = useState('prompt');
  const [showSuccess, setShowSuccess] = useState(false);

  useEffect(() => {
    // Check camera permission on mount
    if (navigator.permissions && navigator.permissions.query) {
      navigator.permissions.query({ name: 'camera' }).then((result) => {
        setCameraPermission(result.state);
        
        result.addEventListener('change', () => {
          setCameraPermission(result.state);
        });
      });
    }

    // Cleanup function
    return () => {
      setScanning(false);
    };
  }, []);

  const handleScan = (err, result) => {
    if (err) {
      // Only set error if it's a permission issue
      if (err.name === 'NotAllowedError') {
        setError('Camera permission denied. Please allow camera access to scan barcodes.');
        setScanning(false);
      }
      return;
    }

    if (result && result.text) {
      const data = result.text;
      
      // Validate that the scanned data looks like a DNA sequence or sequence identifier
      const isValidSequence = /^[ATCGN\s\n>]+$/i.test(data) || data.length > 10;
      
      if (isValidSequence) {
        setScannedData(data);
        setShowSuccess(true);
        setScanning(false);
        
        // Show success animation for 1 second then call onScan
        setTimeout(() => {
          onScan(data);
        }, 1000);
      } else {
        setError('Invalid barcode data. Please scan a barcode containing DNA sequence information.');
        setTimeout(() => setError(null), 3000);
      }
    }
  };

  const handleError = (err) => {
    console.error('Scanner error:', err);
    if (err.name === 'NotAllowedError') {
      setError('Camera permission denied. Please allow camera access in your browser settings.');
    } else if (err.name === 'NotFoundError') {
      setError('No camera found on this device.');
    } else {
      setError('Failed to access camera. Please try again.');
    }
    setScanning(false);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-90">
      {/* Close Button */}
      <button
        onClick={onClose}
        className="absolute top-4 right-4 z-50 p-2 bg-white rounded-full shadow-lg hover:bg-gray-100 transition-colors"
        aria-label="Close scanner"
      >
        <FiX className="w-6 h-6 text-gray-800" />
      </button>

      <div className="relative w-full max-w-2xl mx-4">
        {/* Instructions */}
        <div className="absolute top-0 left-0 right-0 z-40 bg-gradient-to-b from-black to-transparent p-4">
          <div className="flex items-center gap-2 text-white">
            <FiCamera className="w-5 h-5" />
            <p className="text-sm font-medium">
              Position barcode/QR code within the frame
            </p>
          </div>
        </div>

        {/* Scanner Container */}
        <div className="relative bg-gray-900 rounded-lg overflow-hidden shadow-2xl">
          {scanning && !error && (
            <>
              <Scanner
                onUpdate={handleScan}
                onError={handleError}
                constraints={{
                  video: {
                    facingMode: 'environment',
                    width: { ideal: 1280 },
                    height: { ideal: 720 },
                  },
                }}
                formats={formats}
                components={{
                  audio: false,
                  torch: true,
                }}
                className="w-full h-auto"
              />

              {/* Scanning Frame Overlay */}
              <div className="absolute inset-0 pointer-events-none">
                <div className="absolute inset-0 border-4 border-transparent">
                  {/* Corner indicators */}
                  <div className="absolute top-10 left-10 w-16 h-16 border-t-4 border-l-4 border-blue-500"></div>
                  <div className="absolute top-10 right-10 w-16 h-16 border-t-4 border-r-4 border-blue-500"></div>
                  <div className="absolute bottom-10 left-10 w-16 h-16 border-b-4 border-l-4 border-blue-500"></div>
                  <div className="absolute bottom-10 right-10 w-16 h-16 border-b-4 border-r-4 border-blue-500"></div>
                </div>

                {/* Scanning line animation */}
                <div className="absolute left-10 right-10 top-10 h-1 bg-blue-500 opacity-75 animate-scan"></div>
              </div>
            </>
          )}

          {/* Success State */}
          {showSuccess && scannedData && (
            <div className="flex flex-col items-center justify-center h-96 bg-green-900 bg-opacity-80">
              <div className="bg-white rounded-full p-6 mb-4 animate-bounce">
                <FiCheck className="w-16 h-16 text-green-600" />
              </div>
              <p className="text-white text-xl font-semibold mb-2">Scan Successful!</p>
              <p className="text-green-200 text-sm font-mono px-4 text-center break-all">
                {scannedData.substring(0, 100)}...
              </p>
            </div>
          )}

          {/* Error State */}
          {error && (
            <div className="flex flex-col items-center justify-center h-96 bg-red-900 bg-opacity-80 p-8">
              <FiAlertCircle className="w-16 h-16 text-red-300 mb-4" />
              <p className="text-white text-lg font-medium text-center mb-4">{error}</p>
              {cameraPermission === 'denied' && (
                <div className="bg-red-800 rounded-lg p-4 text-sm text-red-100">
                  <p className="font-semibold mb-2">To enable camera access:</p>
                  <ol className="list-decimal list-inside space-y-1">
                    <li>Click the camera icon in your browser's address bar</li>
                    <li>Select "Always allow" for camera access</li>
                    <li>Reload the page and try again</li>
                  </ol>
                </div>
              )}
              <button
                onClick={onClose}
                className="mt-6 px-6 py-2 bg-white text-red-900 rounded-lg font-medium hover:bg-gray-100 transition-colors"
              >
                Close Scanner
              </button>
            </div>
          )}

          {/* No Camera State */}
          {!scanning && !error && !showSuccess && (
            <div className="flex flex-col items-center justify-center h-96 bg-gray-800 p-8">
              <FiCamera className="w-16 h-16 text-gray-400 mb-4" />
              <p className="text-white text-lg font-medium text-center">
                Scanner stopped
              </p>
            </div>
          )}
        </div>

        {/* Status Messages */}
        <div className="absolute bottom-0 left-0 right-0 z-40 bg-gradient-to-t from-black to-transparent p-4">
          <p className="text-white text-xs text-center opacity-75">
            Supports QR codes, Code128, EAN-13, and FASTA sequences
          </p>
        </div>
      </div>

      {/* Custom animation for scanning line */}
      <style jsx>{`
        @keyframes scan {
          0% {
            top: 10%;
          }
          50% {
            top: 90%;
          }
          100% {
            top: 10%;
          }
        }
        .animate-scan {
          animation: scan 2s linear infinite;
        }
      `}</style>
    </div>
  );
};

export default BarcodeScanner;
