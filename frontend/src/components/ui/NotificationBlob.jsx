import React, { useEffect, useState } from 'react';

const NotificationBlob = ({ event, onClose }) => {
  const [show, setShow] = useState(false);

  useEffect(() => {
    // Mount animation
    const timer = setTimeout(() => setShow(true), 100);
    return () => clearTimeout(timer);
  }, []);

  const handleClose = () => {
    setShow(false);
    setTimeout(onClose, 300); // Wait for unmount animation
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
                   shadow-2xl text-gray-800 animate-blob-wobble"
      >
        <button onClick={handleClose} className="absolute top-2 right-2 text-lg">&times;</button>
        <p className="font-bold text-lg">Event Starting Soon!</p>
        <p>{event.title}</p>
        <p>at {event.startTime} in {event.location || '...'}</p>
      </div>
    </div>
  );
};

// Example high-level component to manage notifications
export const NotificationManager = ({ events }) => {
  const [notifyEvent, setNotifyEvent] = useState(null);

  useEffect(() => {
    const interval = setInterval(() => {
      const now = new Date();
      const fiveMinsFromNow = new Date(now.getTime() + 5 * 60000);

      for (const event of events) {
        const eventTime = new Date(`${event.date}T${event.startTime}`);
        if (eventTime > now && eventTime <= fiveMinsFromNow) {
          // Check if already notified
          if (notifyEvent?.id !== event.id) {
            setNotifyEvent(event);
          }
          break; // Only show one
        }
      }
    }, 60000); // Check every minute

    return () => clearInterval(interval);
  }, [events, notifyEvent]);

  if (!notifyEvent) return null;

  return (
    <NotificationBlob 
      event={notifyEvent} 
      onClose={() => setNotifyEvent(null)} 
    />
  );
};