import React from 'react';
import { format, startOfWeek, addDays, startOfDay } from 'date-fns';

const daysOfWeek = [0, 1, 2, 3, 4, 5, 6]; // 0=Mon, 6=Sun
const hoursOfDay = Array.from({ length: 24 }, (_, i) => i); // [0, 1, ..., 23]

// Helper function to format the hour label (e.g., 09:00, 17:00)
const formatHour = (hour) => {
    return `${String(hour).padStart(2, '0')}:00`;
};

const WeeklyView = ({ currentDate, events, onEventClick, onGridClick }) => {
    const weekStart = startOfWeek(currentDate, { weekStartsOn: 1 });

    const handleCellClick = (day, hour) => {
        const selectedTime = new Date(day.getFullYear(), day.getMonth(), day.getDate(), hour, 0);
        onGridClick(selectedTime);
    };

    // Calculate event position and height for CSS grid layout
    const getEventStyles = (event) => {
        const start = new Date(`${event.date}T${event.startTime}`);
        const end = new Date(`${event.date}T${event.endTime}`);
        
        // Calculate the row (hour) and the span (duration in rows/hours)
        const startHour = start.getHours();
        const startMinute = start.getMinutes();
        const durationMinutes = (end.getTime() - start.getTime()) / 60000;
        
        // Grid properties
        // +2 because the time column is column 1, and the day columns start at 2
        const gridColumn = daysOfWeek.findIndex(i => format(addDays(weekStart, i), 'yyyy-MM-dd') === event.date) + 2;
        
        // Grid row starts at the hour index + 1 (since the first row is the header)
        // We use fractional units for minute precision (e.g., 10:30 starts 0.5 rows down)
        const gridRowStart = startHour + 1 + (startMinute / 60);
        const gridRowEnd = gridRowStart + (durationMinutes / 60);

        return {
            gridColumn: gridColumn,
            gridRowStart: Math.floor(gridRowStart), // Start in the hour's row
            gridRowEnd: Math.ceil(gridRowEnd),     // End in the hour's row
            height: `${(durationMinutes / 60) * 100}%`,
            marginTop: `${(startMinute / 60) * 100}%`,
            zIndex: 10,
        };
    };

    return (
        <div className="flex flex-col h-full overflow-hidden p-4">
            
            {/* 1. This container holds the fixed header rows */}
            <div 
                className="grid gap-px border-l border-r border-t border-gray-300 bg-white sticky top-0 z-20" 
                style={{ 
                    gridTemplateColumns: '80px repeat(7, 1fr)', 
                    gridTemplateRows: 'auto', // Only one header row
                }}
            >
                {/* Header content (time column placeholder + day headers) */}
                <div className="bg-gray-100 p-2 border-r border-gray-300"></div> 
                {daysOfWeek.map(i => {
                    const day = addDays(weekStart, i);
                    return (
                        <div key={i} className="bg-gray-100 p-2 text-center font-semibold border-b border-gray-300">
                            <div className="text-sm text-gray-600">{format(day, 'E')}</div>
                            <div className="text-xl">{format(day, 'd')}</div>
                        </div>
                    );
                })}
            </div>

            {/* 2. This container enables scrolling for the hour cells */}
            <div className="flex-1 min-h-0 overflow-y-auto border-l border-r border-b border-gray-300">
                <div
                    className="grid gap-px bg-white"
                    style={{
                        // 1fr for time column, then 7 equal columns for the days
                        gridTemplateColumns: '80px repeat(7, 1fr)', 
                        gridTemplateRows: `repeat(${hoursOfDay.length}, minmax(50px, auto))`, // 24 hour rows
                        height: '100%',
                    }}
                >
                    {/* --- TIME LABELS AND GRID CELLS --- */}
                    {hoursOfDay.map(hour => (
                        <React.Fragment key={hour}>
                            {/* Time Label Column (Column 1) */}
                            <div className="flex justify-end pr-2 py-1 text-xs text-gray-500 bg-gray-50 border-r border-gray-300 h-full">
                                {formatHour(hour)}
                            </div>

                            {/* Day Columns (Columns 2-8) */}
                            {/* ... (Existing day column map content is here) ... */}
                            {daysOfWeek.map(i => {
                                const day = addDays(weekStart, i);
                                const currentDayStart = startOfDay(day);
                                const cellEvents = events.filter(e => {
                                    const eventDate = format(new Date(`${e.date}T${e.startTime}`), 'yyyy-MM-dd');
                                    const cellDate = format(currentDayStart, 'yyyy-MM-dd');
                                    return eventDate === cellDate && new Date(`${e.date}T${e.startTime}`).getHours() === hour;
                                });

                                return (
                                    <div
                                        key={i}
                                        className="relative border-b border-r border-gray-200 hover:bg-blue-50 cursor-pointer transition-colors"
                                        onClick={() => handleCellClick(day, hour)}
                                    >
                                        {/* Render event instances... (omitted for brevity) */}
                                        {cellEvents.map(event => (
                                            <div
                                                key={event.id}
                                                className={`absolute w-full p-1 rounded-lg text-white text-xs overflow-hidden shadow-md`}
                                                // ... (event styling and logic) ...
                                                style={{
                                                    backgroundColor: event.color === 'blue' ? '#4A90E2' : event.color === 'red' ? '#FF6B6B' : '#7ED321',
                                                    top: `${new Date(`${event.date}T${event.startTime}`).getMinutes() / 60 * 100}%`,
                                                    height: `${(new Date(`${event.date}T${event.endTime}`).getTime() - new Date(`${event.date}T${event.startTime}`).getTime()) / 60000 / 60 * 100}%`,
                                                    zIndex: 20
                                                }}
                                                onClick={(e) => {
                                                    e.stopPropagation(); // Prevents cell click event
                                                    onEventClick(event);
                                                }}
                                            >
                                                <div className="font-bold truncate">{event.title}</div>
                                                <div className="truncate">{format(new Date(`${event.date}T${event.startTime}`), 'h:mm a')}</div>
                                            </div>
                                        ))}
                                    </div>
                                );
                            })}
                        </React.Fragment>
                    ))}
                </div>
            </div>
        </div>
    );
};

export default WeeklyView;