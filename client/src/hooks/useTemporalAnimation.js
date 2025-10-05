import { useState, useEffect, useRef } from 'react';

/**
 * Custom hook for managing temporal animation state
 * Handles playback controls, time slicing, and animation for biodiversity data
 * 
 * @param {Array} timeSlices - Array of time slice objects: [{ date, data }]
 * @param {number} playbackSpeed - Speed multiplier (default 1x)
 * @returns {Object} Animation state and control functions
 */
function useTemporalAnimation(timeSlices = [], playbackSpeed = 1) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const intervalRef = useRef(null);

  // Calculate current slice
  const currentSlice = timeSlices[currentIndex] || null;

  // Calculate progress percentage
  const progress = timeSlices.length > 0 
    ? (currentIndex / (timeSlices.length - 1)) * 100 
    : 0;

  // Play function - start animation
  const play = () => {
    setIsPlaying(true);
  };

  // Pause function - stop animation
  const pause = () => {
    setIsPlaying(false);
  };

  // Reset function - go to first slice
  const reset = () => {
    setCurrentIndex(0);
    setIsPlaying(false);
  };

  // Go to specific index
  const goToIndex = (index) => {
    if (index >= 0 && index < timeSlices.length) {
      setCurrentIndex(index);
    }
  };

  // Next slice
  const next = () => {
    setCurrentIndex((prev) => {
      if (prev >= timeSlices.length - 1) {
        return 0; // Loop back to start
      }
      return prev + 1;
    });
  };

  // Previous slice
  const previous = () => {
    setCurrentIndex((prev) => {
      if (prev <= 0) {
        return timeSlices.length - 1; // Loop to end
      }
      return prev - 1;
    });
  };

  // Auto-play effect
  useEffect(() => {
    if (isPlaying && timeSlices.length > 0) {
      // Calculate interval based on playback speed
      const intervalMs = 1000 / playbackSpeed;

      intervalRef.current = setInterval(() => {
        setCurrentIndex((prev) => {
          // Auto-loop when reaching the end
          if (prev >= timeSlices.length - 1) {
            return 0;
          }
          return prev + 1;
        });
      }, intervalMs);
    }

    // Cleanup interval
    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    };
  }, [isPlaying, playbackSpeed, timeSlices.length]);

  // Reset index if timeSlices change
  useEffect(() => {
    if (currentIndex >= timeSlices.length) {
      setCurrentIndex(0);
    }
  }, [timeSlices.length, currentIndex]);

  return {
    currentIndex,
    currentSlice,
    isPlaying,
    progress,
    play,
    pause,
    reset,
    goToIndex,
    next,
    previous,
    totalSlices: timeSlices.length
  };
}

export default useTemporalAnimation;
