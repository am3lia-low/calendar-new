import React from 'react';
import {
  format,
  startOfMonth,
  endOfMonth,
  startOfWeek,
  endOfWeek,
  eachDayOfInterval,
  isSameMonth,
  isToday,
  addMonths,
  subMonths
} from 'date-fns';

// Header for the days of the week
const weekDays = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

const MonthlyView = ({ currentDate, onCurrentDateChange, events, onDateSelect, onEventClick }) => {

  // --- Date Grid Calculation ---
  // All calculations are now derived from the `currentDate` prop
  const firstDayOfMonth = startOfMonth(currentDate);
  const lastDayOfMonth = endOfMonth(currentDate);
  const gridStart = startOfWeek(firstDayOfMonth, { weekStartsOn: 1 });
  const gridEnd = endOfWeek(lastDayOfMonth, { weekStartsOn: 1 });
  
  // `days` is the array of all day-objects to render in the grid
  const days = eachDayOfInterval({ start: gridStart, end: gridEnd });

  // --- Event Filtering ---
  // Filters the `events` prop (which is already pre-generated)
  const getEventsForDay = (day) => {
    const dayStr = format(day, 'yyyy-MM-dd');
    return events
      .filter(e => e.date === dayStr)
      .sort((a, b) => a.startTime.localeCompare(b.startTime));
  };

  // --- Navigation ---
  // These functions now call the setter prop from AppLayout
  const goToNextMonth = () => onCurrentDateChange(addMonths(currentDate, 1));
  const goToPrevMonth = () => onCurrentDateChange(subMonths(currentDate, 1));
  const goToToday = () => onCurrentDateChange(new Date());

  return (
    <div className="flex flex-col h-full bg-water-bg-light p-4">
      {/* Header: Navigation */}
      <header className="flex justify-between items-center mb-4 px-2">
        <h2 className="text-2xl font-bold text-water-blue-end">
          {format(currentDate, 'MMMM yyyy')}
        </h2>
        <div className="flex items-center space-x-2">
          <button
            onClick={goToToday}
            className="px-4 py-2 border rounded-lg shadow-sm hover:bg-gray-100"
          >
            Today
          </button>
          <button
            onClick={goToPrevMonth}
            className="p-2 rounded-full hover:bg-gray-200"
          >
            &lt;
          </button>
          <button
            onClick={goToNextMonth}
            className="p-2 rounded-full hover:bg-gray-200"
          >
            &gt;
          </button>
        </div>
      </header>

      {/* Grid: Day Names */}
      <div className="grid grid-cols-7 gap-1">
        {weekDays.map(day => (
          <div key={day} className="text-center font-semibold text-gray-600 p-2">
            {day}
          </div>
        ))}
      </div>

      {/* Grid: Calendar Days */}
      <div className="grid grid-cols-7 grid-rows-6 gap-1 flex-1">
        {days.map(day => {
          const dayEvents = getEventsForDay(day);
          const isCurrentMonth = isSameMonth(day, currentDate);
          const isCurrentToday = isToday(day);

          return (
            <div
              key={day.toString()}
              className={`
                border border-gray-200 rounded-lg p-2 flex flex-col
                ${isCurrentMonth ? 'bg-white' : 'bg-gray-50'}
                cursor-pointer hover:shadow-lg transition-shadow
              `}
              onClick={() => onDateSelect(day)} // Click to go to Weekly View
            >
              {/* Day Number */}
              <span className={`font-medium
                ${isCurrentToday ? 'bg-blue-600 text-white rounded-full w-7 h-7 flex items-center justify-center' : ''}
                ${!isCurrentMonth ? 'text-gray-400' : 'text-gray-900'}
              `}>
                {format(day, 'd')}
              </span>
              
              {/* Compressed Event List */}
              <div className="mt-2 space-y-1 overflow-y-auto max-h-24">
                {dayEvents.map(event => (
                  <div 
                    key={event.id} 
                    className="flex items-center space-x-1 cursor-pointer"
                    title={`${event.title} (${event.startTime})`}
                    onClick={(e) => {
                      e.stopPropagation(); // Prevent onDateSelect from firing
                      onEventClick(event);  // Open the EventModal
                    }}
                  >
                    <div className="w-2 h-2 rounded-full bg-water-blue-mid flex-shrink-0" />
                    <span className="text-xs text-gray-700 truncate hover:underline">
                      {event.title}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default MonthlyView;