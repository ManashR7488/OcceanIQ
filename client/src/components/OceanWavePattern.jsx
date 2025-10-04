import React from 'react';

const OceanWavePattern = ({ 
  variant = 'background', 
  opacity = 0.1, 
  color = 'cyan',
  className = '' 
}) => {
  const colorMap = {
    cyan: {
      primary: '#06B6D4',
      secondary: '#0891B2',
      tertiary: '#0E7490'
    },
    blue: {
      primary: '#3B82F6',
      secondary: '#2563EB',
      tertiary: '#1E40AF'
    },
    teal: {
      primary: '#14B8A6',
      secondary: '#0D9488',
      tertiary: '#0F766E'
    }
  };

  const colors = colorMap[color] || colorMap.cyan;

  const variants = {
    top: (
      <svg
        className={`absolute top-0 left-0 w-full ${className}`}
        style={{ opacity }}
        viewBox="0 0 1200 120"
        preserveAspectRatio="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        <defs>
          <linearGradient id={`topGrad-${color}`} x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" style={{ stopColor: colors.primary, stopOpacity: 1 }} />
            <stop offset="100%" style={{ stopColor: colors.secondary, stopOpacity: 0.3 }} />
          </linearGradient>
        </defs>
        <path
          fill={`url(#topGrad-${color})`}
          d="M0,0 C150,80 350,0 600,50 C850,100 1050,20 1200,60 L1200,0 L0,0 Z"
        />
        <path
          fill={colors.secondary}
          fillOpacity="0.5"
          d="M0,20 C200,80 400,20 600,60 C800,100 1000,40 1200,70 L1200,0 L0,0 Z"
        />
      </svg>
    ),
    bottom: (
      <svg
        className={`absolute bottom-0 left-0 w-full ${className}`}
        style={{ opacity }}
        viewBox="0 0 1200 120"
        preserveAspectRatio="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        <defs>
          <linearGradient id={`bottomGrad-${color}`} x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" style={{ stopColor: colors.tertiary, stopOpacity: 0.3 }} />
            <stop offset="100%" style={{ stopColor: colors.primary, stopOpacity: 1 }} />
          </linearGradient>
        </defs>
        <path
          fill={`url(#bottomGrad-${color})`}
          d="M0,120 C150,40 350,120 600,70 C850,20 1050,100 1200,60 L1200,120 L0,120 Z"
        />
        <path
          fill={colors.secondary}
          fillOpacity="0.5"
          d="M0,100 C200,40 400,100 600,60 C800,20 1000,80 1200,50 L1200,120 L0,120 Z"
        />
      </svg>
    ),
    background: (
      <svg
        className={`absolute inset-0 w-full h-full ${className}`}
        style={{ opacity }}
        viewBox="0 0 1200 800"
        preserveAspectRatio="xMidYMid slice"
        xmlns="http://www.w3.org/2000/svg"
      >
        <defs>
          <linearGradient id={`bgGrad-${color}`} x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" style={{ stopColor: colors.primary, stopOpacity: 0.1 }} />
            <stop offset="50%" style={{ stopColor: colors.secondary, stopOpacity: 0.05 }} />
            <stop offset="100%" style={{ stopColor: colors.tertiary, stopOpacity: 0.1 }} />
          </linearGradient>
        </defs>
        <path
          fill={`url(#bgGrad-${color})`}
          d="M0,200 Q300,100 600,200 T1200,200 L1200,0 L0,0 Z"
        />
        <path
          fill={colors.secondary}
          fillOpacity="0.05"
          d="M0,400 Q300,300 600,400 T1200,400 L1200,200 L0,200 Z"
        />
        <path
          fill={colors.tertiary}
          fillOpacity="0.03"
          d="M0,600 Q300,500 600,600 T1200,600 L1200,400 L0,400 Z"
        />
      </svg>
    ),
    animated: (
      <svg
        className={`absolute inset-0 w-full h-full ${className}`}
        style={{ opacity }}
        viewBox="0 0 1200 800"
        preserveAspectRatio="xMidYMid slice"
        xmlns="http://www.w3.org/2000/svg"
      >
        <defs>
          <linearGradient id={`animGrad-${color}`} x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" style={{ stopColor: colors.primary, stopOpacity: 0.2 }} />
            <stop offset="100%" style={{ stopColor: colors.secondary, stopOpacity: 0.05 }} />
          </linearGradient>
        </defs>
        <g className="animate-wave-slow">
          <path
            fill={`url(#animGrad-${color})`}
            d="M0,300 Q300,200 600,300 T1200,300 L1200,800 L0,800 Z"
          />
        </g>
        <g className="animate-wave-medium">
          <path
            fill={colors.secondary}
            fillOpacity="0.1"
            d="M0,450 Q300,350 600,450 T1200,450 L1200,800 L0,800 Z"
          />
        </g>
        <g className="animate-wave-fast">
          <path
            fill={colors.tertiary}
            fillOpacity="0.05"
            d="M0,600 Q300,500 600,600 T1200,600 L1200,800 L0,800 Z"
          />
        </g>
      </svg>
    )
  };

  return (
    <div className="pointer-events-none">
      {variants[variant] || variants.background}
    </div>
  );
};

export default OceanWavePattern;
