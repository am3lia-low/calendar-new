import React from 'react';
import { format, startOfWeek, endOfWeek, addDays, startOfDay, addWeeks, subWeeks } from 'date-fns'; // <-- Added imports

const daysOfWeek = [0, 1, 2, 3, 4, 5, 6]; // 0=Mon, 6=Sun
const hoursOfDay = Array.from({ length: 24 }, (_, i) => i);

const formatHour = (hour) => {
    return `${String(hour).padStart(2, '0')}:00`;
};

// Add onDateChange prop here 👇
const WeeklyView = ({ currentDate, events, onEventClick, onGridClick, onDateChange }) => { 
    
    // Calculate the start of the current view
    const weekStart = startOfWeek(currentDate, { weekStartsOn: 1 });
    const weekEnd = endOfWeek(currentDate, { weekStartsOn: 1 });

    // --- Navigation Handlers ---
    const handlePrevWeek = () => {
        onDateChange(subWeeks(currentDate, 1));
    };

    const handleNextWeek = () => {
        onDateChange(addWeeks(currentDate, 1));
    };

    const handleCellClick = (day, hour) => {
        const selectedTime = new Date(day.getFullYear(), day.getMonth(), day.getDate(), hour, 0);
        onGridClick(selectedTime);
    };

    return (
        <div className="flex flex-col h-full overflow-hidden p-4">
            
            {/* --- NEW: Navigation Header --- */}
            <div className="flex justify-between items-center mb-4 px-2">
                <button 
                    onClick={handlePrevWeek}
                    className="p-2 rounded-full hover:bg-gray-200 text-gray-600 transition-colors"
                >
                    {/* Left Arrow SVG */}
                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-6 h-6">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5L8.25 12l7.5-7.5" />
                    </svg>
                </button>

                <h2 className="text-lg font-bold text-gray-800">
                    {format(weekStart, 'MMM d')} – {format(weekEnd, 'MMM d, yyyy')}
                </h2>

                <button 
                    onClick={handleNextWeek}
                    className="p-2 rounded-full hover:bg-gray-200 text-gray-600 transition-colors"
                >
                    {/* Right Arrow SVG */}
                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-6 h-6">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 4.5l7.5 7.5-7.5 7.5" />
                    </svg>
                </button>
            </div>
            {/* ----------------------------- */}

            {/* Fixed Header Row (Day Labels) */}
            <div 
                className="grid gap-px border-l border-r border-t border-gray-300 bg-white sticky top-0 z-20" 
                style={{ 
                    gridTemplateColumns: '80px repeat(7, 1fr)', 
                    gridTemplateRows: 'auto', 
                }}
            >
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

            {/* Scrollable Grid Area */}
            <div className="flex-1 min-h-0 overflow-y-auto border-l border-r border-b border-gray-300">
                <div
                    className="grid gap-px bg-white"
                    style={{
                        gridTemplateColumns: '80px repeat(7, 1fr)', 
                        gridTemplateRows: `repeat(${hoursOfDay.length}, minmax(50px, auto))`, 
                        height: '100%',
                    }}
                >
                    {hoursOfDay.map(hour => (
                        <React.Fragment key={hour}>
                            {/* Time Label */}
                            <div className="flex justify-end pr-2 py-1 text-xs text-gray-500 bg-gray-50 border-r border-gray-300 h-full sticky left-0">
                                {formatHour(hour)}
                            </div>

                            {/* Day Columns */}
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
                                        {cellEvents.map(event => (
                                            <div
                                                key={event.id}
                                                className={`absolute w-full p-1 rounded-lg text-white text-xs overflow-hidden shadow-md cursor-pointer hover:brightness-90`}
                                                style={{
                                                    backgroundColor: event.color === 'blue' ? '#4A90E2' : event.color === 'red' ? '#FF6B6B' : '#7ED321',
                                                    top: `${new Date(`${event.date}T${event.startTime}`).getMinutes() / 60 * 100}%`,
                                                    height: `${(new Date(`${event.date}T${event.endTime}`).getTime() - new Date(`${event.date}T${event.startTime}`).getTime()) / 60000 / 60 * 100}%`,
                                                    zIndex: 20
                                                }}
                                                onClick={(e) => {
                                                    e.stopPropagation();
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