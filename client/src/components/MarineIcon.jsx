import React from 'react';

const MarineIcon = ({ 
  type = 'fish', 
  size = 24, 
  color = 'currentColor',
  className = '',
  animated = false 
}) => {
  const animationClass = animated ? 'animate-float' : '';
  
  const icons = {
    fish: (
      <svg
        width={size}
        height={size}
        viewBox="0 0 24 24"
        fill={color}
        className={`${className} ${animationClass}`}
        role="img"
        aria-label="Fish icon"
        xmlns="http://www.w3.org/2000/svg"
      >
        <path d="M12,20L15.5,16.5C15.5,16.5 12,15.5 12,12C12,8.5 15.5,7.5 15.5,7.5L12,4L8.5,7.5C8.5,7.5 12,8.5 12,12C12,15.5 8.5,16.5 8.5,16.5L12,20M17,12C17,10.9 17.9,10 19,10C20.1,10 21,10.9 21,12C21,13.1 20.1,14 19,14C17.9,14 17,13.1 17,12Z" />
      </svg>
    ),
    wave: (
      <svg
        width={size}
        height={size}
        viewBox="0 0 24 24"
        fill="none"
        stroke={color}
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        className={`${className} ${animated ? 'animate-wave-icon' : ''}`}
        role="img"
        aria-label="Wave icon"
        xmlns="http://www.w3.org/2000/svg"
      >
        <path d="M2 12c2-2 4-2 6 0s4 2 6 0 4-2 6 0 4 2 6 0" />
        <path d="M2 18c2-2 4-2 6 0s4 2 6 0 4-2 6 0 4 2 6 0" />
      </svg>
    ),
    compass: (
      <svg
        width={size}
        height={size}
        viewBox="0 0 24 24"
        fill="none"
        stroke={color}
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        className={`${className} ${animated ? 'animate-spin-slow' : ''}`}
        role="img"
        aria-label="Compass icon"
        xmlns="http://www.w3.org/2000/svg"
      >
        <circle cx="12" cy="12" r="10" />
        <polygon points="16.24 7.76 14.12 14.12 7.76 16.24 9.88 9.88 16.24 7.76" fill={color} />
      </svg>
    ),
    anchor: (
      <svg
        width={size}
        height={size}
        viewBox="0 0 24 24"
        fill={color}
        className={`${className} ${animationClass}`}
        role="img"
        aria-label="Anchor icon"
        xmlns="http://www.w3.org/2000/svg"
      >
        <path d="M12,2A3,3 0 0,1 15,5A3,3 0 0,1 12,8A3,3 0 0,1 9,5A3,3 0 0,1 12,2M13,7.9A5,5 0 0,0 17,13H19A7,7 0 0,1 12,20A7,7 0 0,1 5,13H7A5,5 0 0,0 11,7.9V22H13V7.9M12,13A1,1 0 0,0 11,14A1,1 0 0,0 12,15A1,1 0 0,0 13,14A1,1 0 0,0 12,13Z" />
      </svg>
    ),
    coral: (
      <svg
        width={size}
        height={size}
        viewBox="0 0 24 24"
        fill={color}
        className={`${className} ${animationClass}`}
        role="img"
        aria-label="Coral icon"
        xmlns="http://www.w3.org/2000/svg"
      >
        <path d="M14.5,2C14.5,2 13.5,4 14.5,6C15.5,8 16,8.5 16,11C16,13.5 15.5,14.5 14.5,17C13.5,19.5 14.5,22 14.5,22H16C16,22 15,19.5 16,17C17,14.5 17.5,13.5 17.5,11C17.5,8.5 17,8 16,6C15,4 16,2 16,2H14.5M8,2C8,2 7,4 8,6C9,8 9.5,8.5 9.5,11C9.5,13.5 9,14.5 8,17C7,19.5 8,22 8,22H9.5C9.5,22 8.5,19.5 9.5,17C10.5,14.5 11,13.5 11,11C11,8.5 10.5,8 9.5,6C8.5,4 9.5,2 9.5,2H8M11.5,6.5C11.5,6.5 10.5,8 11.5,9.5C12.5,11 13,11.5 13,13.5C13,15.5 12.5,16.5 11.5,18.5C10.5,20.5 11.5,22 11.5,22H13C13,22 12,20.5 13,18.5C14,16.5 14.5,15.5 14.5,13.5C14.5,11.5 14,11 13,9.5C12,8 13,6.5 13,6.5H11.5Z" />
      </svg>
    ),
    shell: (
      <svg
        width={size}
        height={size}
        viewBox="0 0 24 24"
        fill={color}
        className={`${className} ${animationClass}`}
        role="img"
        aria-label="Shell icon"
        xmlns="http://www.w3.org/2000/svg"
      >
        <path d="M12,2C11.5,2 11,2.19 10.59,2.59L2.59,10.59C1.8,11.37 1.8,12.63 2.59,13.41L10.59,21.41C11.37,22.2 12.63,22.2 13.41,21.41L21.41,13.41C22.2,12.63 22.2,11.37 21.41,10.59L13.41,2.59C13,2.19 12.5,2 12,2M12,4L20,12L12,20L4,12L12,4M12,6L6,12L12,18L18,12L12,6M12,8.5L15.5,12L12,15.5L8.5,12L12,8.5Z" />
      </svg>
    ),
    submarine: (
      <svg
        width={size}
        height={size}
        viewBox="0 0 24 24"
        fill={color}
        className={`${className} ${animationClass}`}
        role="img"
        aria-label="Submarine icon"
        xmlns="http://www.w3.org/2000/svg"
      >
        <path d="M12,8H14L16,12H20A2,2 0 0,1 22,14V16A2,2 0 0,1 20,18H19C19,19.11 18.11,20 17,20A2,2 0 0,1 15,18H9C9,19.11 8.11,20 7,20A2,2 0 0,1 5,18H4A2,2 0 0,1 2,16V14A2,2 0 0,1 4,12H8L12,8M7,16.5A1.5,1.5 0 0,0 5.5,18A1.5,1.5 0 0,0 7,19.5A1.5,1.5 0 0,0 8.5,18A1.5,1.5 0 0,0 7,16.5M17,16.5A1.5,1.5 0 0,0 15.5,18A1.5,1.5 0 0,0 17,19.5A1.5,1.5 0 0,0 18.5,18A1.5,1.5 0 0,0 17,16.5M12,4L10.5,6H13.5L12,4Z" />
      </svg>
    ),
    whale: (
      <svg
        width={size}
        height={size}
        viewBox="0 0 24 24"
        fill={color}
        className={`${className} ${animationClass}`}
        role="img"
        aria-label="Whale icon"
        xmlns="http://www.w3.org/2000/svg"
      >
        <path d="M12,3C7.58,3 4,6.58 4,11C4,13.5 5.09,15.73 6.84,17.24L5,22H7L8.14,19.14C9.32,19.7 10.62,20 12,20C16.42,20 20,16.42 20,12C20,7.58 16.42,3 12,3M8.5,13A1.5,1.5 0 0,1 7,11.5A1.5,1.5 0 0,1 8.5,10A1.5,1.5 0 0,1 10,11.5A1.5,1.5 0 0,1 8.5,13M15.5,13A1.5,1.5 0 0,1 14,11.5A1.5,1.5 0 0,1 15.5,10A1.5,1.5 0 0,1 17,11.5A1.5,1.5 0 0,1 15.5,13Z" />
      </svg>
    )
  };

  return icons[type] || icons.fish;
};

export default MarineIcon;
