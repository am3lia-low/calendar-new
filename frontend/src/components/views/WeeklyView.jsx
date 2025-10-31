import React, { useState, useEffect } from 'react';
import { DragDropContext, Droppable, Draggable } from 'react-beautiful-dnd';
import { format, startOfWeek, addDays, getYear, parseISO, isSameYear } from 'date-fns';
import EventWidget from './EventWidget';
import EventModal from '../ui/EventModal';
import api from '../../services/api'; // Our authenticated API
import { useAuth } from '../../contexts/AuthContext';
import toast from 'react-hot-toast';

// A simple time grid for demo purposes
const timeSlots = [
  '08:00', '09:00', '10:00', '11:00', '12:00', '13:00', 
  '14:00', '15:00', '16:00', '17:00'
];

const WeeklyView = () => {
  const { user } = useAuth();
  const [events, setEvents] = useState([]);
  const [selectedEvent, setSelectedEvent] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [loading, setLoading] = useState(true);

  const weekStart = startOfWeek(currentDate, { weekStartsOn: 0 }); // Sunday start

  // Fetch events for the current year
  useEffect(() => {
    const year = getYear(currentDate);
    setLoading(true);
    api.getEvents(year)
      .then(response => {
        setEvents(response.data);
      })
      .catch(err => {
        console.error("Failed to fetch events", err);
        toast.error("Could not load events.");
      })
      .finally(() => setLoading(false));
  }, [getYear(currentDate)]); // Refetch if year changes

  const getEventsForDay = (day) => {
    const dayStr = format(day, 'yyyy-MM-dd');
    return events
      .filter(e => e.date === dayStr)
      .sort((a, b) => a.startTime.localeCompare(b.startTime));
  };

  // --- Event & Modal Handlers ---

  const handleEventClick = (event) => {
    setSelectedEvent(event);
    setIsModalOpen(true);
  };

  const handleGridClick = (day) => {
    // Open modal to create a new event on this day
    setSelectedEvent({
      id: null,
      title: '',
      description: '',
      date: format(day, 'yyyy-MM-dd'),
      startTime: '09:00',
      endTime: '10:00',
      color: 'blue',
      location: '',
    });
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setSelectedEvent(null);
  };

  const saveAllEvents = (updatedEvents, successMsg) => {
    // This assumes all events are for the same year
    // In a complex app, you'd check if the year changed
    const year = getYear(currentDate);
    api.saveEvents(year, updatedEvents)
      .then(() => {
        toast.success(successMsg);
      })
      .catch(err => {
        console.error("Failed to save", err);
        toast.error("Save failed. Reverting changes.");
        // Revert UI on failure
        api.getEvents(year).then(res => setEvents(res.data));
      });
  };

  const handleSaveEvent = (eventToSave) => {
    let updatedEvents;
    let newEvent;
    
    if (eventToSave.id) {
      // Update existing event
      updatedEvents = events.map(e => e.id === eventToSave.id ? eventToSave : e);
    } else {
      // Create new event
      newEvent = { ...eventToSave, id: `evt-${Date.now()}` }; // Simple unique ID
      updatedEvents = [...events, newEvent];
    }
    
    setEvents(updatedEvents);
    handleCloseModal();
    saveAllEvents(updatedEvents, newEvent ? "Event created!" : "Event updated!");
  };

  const handleDeleteEvent = (eventId) => {
    const updatedEvents = events.filter(e => e.id !== eventId);
    setEvents(updatedEvents);
    handleCloseModal();
    saveAllEvents(updatedEvents, "Event deleted!");
  };


  // --- Drag-and-Drop Handler ---

  const onDragEnd = (result) => {
    const { source, destination, draggableId } = result;

    // Dropped outside the list
    if (!destination) return;

    const event = events.find(e => e.id === draggableId);
    if (!event) return;
    
    // Dropped in the same place
    if (source.droppableId === destination.droppableId) {
      // You could add logic here to reorder within a day
      return;
    }
    
    // --- Rescheduling logic ---
    const newDate = destination.droppableId; // We set droppableId to the date string
    const oldDate = event.date;

    // Check if the year has changed
    if (!isSameYear(parseISO(oldDate), parseISO(newDate))) {
      toast.error("Drag-and-drop across different years is not supported.");
      return;
    }

    // Update local state immediately for snappy UI
    const updatedEvents = events.map(e =>
      e.id === draggableId ? { ...e, date: newDate } : e
    );
    setEvents(updatedEvents);

    // Persist changes to the backend
    saveAllEvents(updatedEvents, "Event rescheduled!");
  };

  return (
    <DragDropContext onDragEnd={onDragEnd}>
      <div className="grid grid-cols-8 h-full bg-water-bg-light">
        {/* ... (Time column) ... */}
        <div className="border-r border-gray-200">
          <div className="h-20"></div> {/* Header space */}
          {timeSlots.map(time => (
            <div key={time} className="h-24 text-center text-sm pt-1 text-gray-500">{time}</div>
          ))}
        </div>

        {/* Day columns */}
        {Array.from({ length: 7 }).map((_, i) => {
          const day = addDays(weekStart, i);
          const dayStr = format(day, 'yyyy-MM-dd');
          const dayEvents = getEventsForDay(day);

return (
            <div key={dayStr} className="border-r border-gray-200">
              {/* Day Header */}
              <div className="h-20 text-center p-4 border-b">
                <p className="font-semibold text-gray-600">{format(day, 'EEE')}</p>
                <p className="text-3xl font-light text-gray-800">{format(day, 'd')}</p>
              </div>
              
              <Droppable droppableId={dayStr}>
                {/* ... (rest of the Droppable JSX) ... */}
                {(provided, snapshot) => (
                  <div
                    ref={provided.innerRef}
                    {...provided.droppableProps}
                    className={`h-full p-2 space-y-2 ${snapshot.isDraggingOver ? 'bg-water-bg-dark' : ''}`}
                    style={{ minHeight: 'calc(100vh - 10rem)' }}
                    onClick={() => handleGridClick(day)} // Click empty space
                  >
                    {dayEvents.map((event, index) => (
                      <Draggable key={event.id} draggableId={event.id} index={index}>
                        {(provided, snapshot) => (
                          <div
                            ref={provided.innerRef}
                            {...provided.draggableProps}
                            {...provided.dragHandleProps}
                            // Prevent grid click from firing when clicking event
                            onClick={e => e.stopPropagation()} 
                          >
                            <EventWidget
                              event={event}
                              onClick={() => handleEventClick(event)}
                              isDragging={snapshot.isDragging}
                            />
                          </div>
                        )}
                      </Draggable>
                    ))}
                    {provided.placeholder}
                  </div>
                )}
              </Droppable>
            </div>
          );
        })}
      </div>

      {isModalOpen && (
        <EventModal
          event={selectedEvent}
          onClose={handleCloseModal}
          onSave={handleSaveEvent}
          onDelete={handleDeleteEvent}
        />
      )}
    </DragDropContext>
  );
};

export default WeeklyView;