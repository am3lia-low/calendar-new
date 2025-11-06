import React, { useEffect, useState } from 'react';

const NotificationBlob = ({ event, onClose }) => {
  const [show, setShow] = useState(false);

  // Mount animation: fade and slide in
  useEffect(() => {
    const timer = setTimeout(() => setShow(true), 100); // 100ms delay to ensure transition runs
    return () => clearTimeout(timer);
  }, []);

  const handleClose = () => {
    setShow(false);
    // Wait for the unmount animation to finish before calling onClose
    setTimeout(onClose, 300); 
  };

  return (
    <div 
      className={`
        fixed bottom-5 right-5 z-50 transition-all duration-300
        ${show ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'}
      `}
    >
      <div 
        className="p-6 bg-gradient-to-br from-water-blue-start to-water-blue-end
                   shadow-2xl text-gray-800 animate-blob-wobble relative rounded-3xl"
        // Note: The 'animate-blob-wobble' applies the border-radius morphing
        // and movement defined in tailwind.config.js
      >
        <button 
          onClick={handleClose} 
          className="absolute top-2 right-3 text-lg font-bold text-gray-700 hover:text-gray-900"
        >
          &times;
        </button>
        <p className="font-bold text-lg mb-1">Event Starting Soon!</p>
        <p className="font-semibold text-md">{event.title}</p>
        <p className="text-sm">
          at {event.startTime} {event.location ? `in ${event.location}` : ''}
        </p>
      </div>
    </div>
  );
};

export default NotificationBlob;