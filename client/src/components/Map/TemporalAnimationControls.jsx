import { FiPlay, FiPause, FiRotateCcw, FiChevronLeft, FiChevronRight, FiSkipBack, FiSkipForward } from 'react-icons/fi';
import { format } from 'date-fns';

/**
 * Temporal Animation Controls for playing through time-sliced biodiversity data
 */
function TemporalAnimationControls({
  timeSlices = [],
  currentIndex,
  isPlaying,
  onPlay,
  onPause,
  onReset,
  onSeek,
  playbackSpeed = 1,
  onSpeedChange
}) {
  // Format date for display
  const formatDate = (dateString) => {
    try {
      return format(new Date(dateString), 'MMM dd, yyyy');
    } catch {
      return dateString;
    }
  };

  const currentDate = timeSlices[currentIndex]?.date;
  const totalSlices = timeSlices.length;

  // Handle keyboard shortcuts
  const handleKeyDown = (e) => {
    switch (e.key) {
      case ' ':
        e.preventDefault();
        isPlaying ? onPause() : onPlay();
        break;
      case 'ArrowLeft':
        e.preventDefault();
        onSeek(Math.max(0, currentIndex - 1));
        break;
      case 'ArrowRight':
        e.preventDefault();
        onSeek(Math.min(totalSlices - 1, currentIndex + 1));
        break;
      case 'Home':
        e.preventDefault();
        onReset();
        break;
      case 'End':
        e.preventDefault();
        onSeek(totalSlices - 1);
        break;
      default:
        break;
    }
  };

  if (totalSlices === 0) {
    return null;
  }

  return (
    <div 
      className="fixed bottom-0 left-0 right-0 bg-white/95 backdrop-blur-md shadow-lg border-t border-gray-200 z-[1000] p-4"
      onKeyDown={handleKeyDown}
      tabIndex={0}
      role="region"
      aria-label="Temporal animation controls"
    >
      <div className="max-w-7xl mx-auto">
        {/* Current date display */}
        <div className="text-center mb-3">
          <p className="text-sm text-gray-600">Current Time Period</p>
          <p className="text-xl font-bold text-gray-800">
            {currentDate ? formatDate(currentDate) : 'No data'}
          </p>
          <p className="text-xs text-gray-500">
            Slice {currentIndex + 1} of {totalSlices}
          </p>
        </div>

        {/* Timeline slider */}
        <div className="mb-4">
          <input
            type="range"
            min="0"
            max={totalSlices - 1}
            value={currentIndex}
            onChange={(e) => onSeek(parseInt(e.target.value))}
            className="w-full h-2 bg-gradient-to-r from-cyan-200 via-blue-400 to-cyan-200 rounded-lg appearance-none cursor-pointer"
            style={{
              background: `linear-gradient(to right, 
                #06b6d4 0%, 
                #06b6d4 ${(currentIndex / (totalSlices - 1)) * 100}%, 
                #e5e7eb ${(currentIndex / (totalSlices - 1)) * 100}%, 
                #e5e7eb 100%)`
            }}
            aria-label="Timeline scrubber"
          />
        </div>

        {/* Control buttons */}
        <div className="flex items-center justify-center gap-2">
          {/* Skip to start */}
          <button
            onClick={onReset}
            className="p-2 rounded-md hover:bg-gray-100 transition-colors"
            aria-label="Reset to start"
            title="Reset to start (Home)"
          >
            <FiSkipBack size={20} />
          </button>

          {/* Previous */}
          <button
            onClick={() => onSeek(Math.max(0, currentIndex - 1))}
            className="p-2 rounded-md hover:bg-gray-100 transition-colors"
            aria-label="Previous slice"
            title="Previous (←)"
          >
            <FiChevronLeft size={20} />
          </button>

          {/* Play/Pause */}
          <button
            onClick={isPlaying ? onPause : onPlay}
            className="p-3 bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-700 hover:to-blue-700 text-white rounded-full transition-all shadow-md"
            aria-label={isPlaying ? 'Pause' : 'Play'}
            title={isPlaying ? 'Pause (Space)' : 'Play (Space)'}
          >
            {isPlaying ? <FiPause size={24} /> : <FiPlay size={24} className="ml-0.5" />}
          </button>

          {/* Next */}
          <button
            onClick={() => onSeek(Math.min(totalSlices - 1, currentIndex + 1))}
            className="p-2 rounded-md hover:bg-gray-100 transition-colors"
            aria-label="Next slice"
            title="Next (→)"
          >
            <FiChevronRight size={20} />
          </button>

          {/* Skip to end */}
          <button
            onClick={() => onSeek(totalSlices - 1)}
            className="p-2 rounded-md hover:bg-gray-100 transition-colors"
            aria-label="Skip to end"
            title="Skip to end (End)"
          >
            <FiSkipForward size={20} />
          </button>

          {/* Speed control */}
          <div className="ml-4 flex items-center gap-2">
            <label className="text-sm text-gray-600">Speed:</label>
            <select
              value={playbackSpeed}
              onChange={(e) => onSpeedChange(parseFloat(e.target.value))}
              className="px-2 py-1 border border-gray-300 rounded-md text-sm focus:ring-2 focus:ring-cyan-500 focus:border-transparent"
              aria-label="Playback speed"
            >
              <option value="0.5">0.5x</option>
              <option value="1">1x</option>
              <option value="2">2x</option>
              <option value="5">5x</option>
            </select>
          </div>
        </div>

        {/* Keyboard shortcuts hint */}
        <div className="text-center mt-3">
          <p className="text-xs text-gray-500">
            Keyboard: Space (play/pause) • ← → (navigate) • Home/End (skip)
          </p>
        </div>
      </div>
    </div>
  );
}

export default TemporalAnimationControls;
