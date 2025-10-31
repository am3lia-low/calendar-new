import React from 'react';

const EventWidget = ({ event, onClick, isDragging }) => {
  // Use event.color or default to a blue gradient
  const gradient = event.color
    ? `bg-gradient-to-br from-${event.color}-300 to-${event.color}-500`
    : 'bg-gradient-to-br from-water-blue-start to-water-blue-mid';

  return (
    <div
      className={`
        p-2 rounded-lg cursor-pointer text-gray-800
        shadow-water transition-all duration-300 ease-out
        hover:shadow-lg hover:scale-[1.03] hover:animate-wobble
        select-none
        ${gradient}
        ${isDragging ? 'animate-wobble shadow-xl scale-105' : ''}
      `}
      onClick={onClick}
      title={event.title}
    >
      <p className="font-bold text-sm truncate">{event.title}</p>
      <p className="text-xs">
        {event.startTime} - {event.endTime}
      </p>
      {event.location && (
        <p className="text-xs italic truncate mt-1">
          {event.location}
        </p>
      )}
    </div>
  );
};

export default EventWidget;