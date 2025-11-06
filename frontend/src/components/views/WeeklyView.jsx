import React from 'react';
import { DragDropContext, Droppable, Draggable } from 'react-beautiful-dnd';
import { format, startOfWeek, addDays, parseISO, isSameYear } from 'date-fns';
import EventWidget from './EventWidget';
import toast from 'react-hot-toast';

const timeSlots = [ '08:00', '09:00', /* ... */ '17:00' ];

// Accepts events as a prop, no more data fetching
const WeeklyView = ({ currentDate, events, onEventClick, onGridClick, onEventDrop }) => {

  const weekStart = startOfWeek(currentDate, { weekStartsOn: 1 });

  const getEventsForDay = (day) => {
    const dayStr = format(day, 'yyyy-MM-dd');
    return events
      .filter(e => e.date === dayStr)
      .sort((a, b) => a.startTime.localeCompare(b.startTime));
  };

  // DND handler now calls a prop (to be implemented in App.jsx if needed)
  const onDragEnd = (result) => {
    const { destination, draggableId } = result;
    if (!destination) return;
    
    const event = events.find(e => e.id === draggableId || e.id.startsWith(draggableId));
    if (!event) return;

    const newDate = destination.droppableId;
    if (event.date === newDate) return;

    // TODO: This logic needs to be moved to App.jsx
    // For now, it's optimistic UI
    // onEventDrop(event, newDate);
    toast.error("Drag-and-drop for recurring events needs to be handled in AppLayout!");
    // This is complex because it needs to trigger the "This vs Series" modal.
    // For now, we'll skip the DND-save logic for recurring events.
  };

  return (
    <DragDropContext onDragEnd={onDragEnd}>
      <div className="grid grid-cols-8 h-full bg-water-bg-light">
        {/* ... (Time column) ... */}
        {Array.from({ length: 7 }).map((_, i) => {
          const day = addDays(weekStart, i);
          const dayStr = format(day, 'yyyy-MM-dd');
          const dayEvents = getEventsForDay(day);

          return (
            <div key={dayStr} className="border-r border-gray-200">
              <div className="h-20 text-center p-4 border-b">
                <p className="font-semibold">{format(day, 'EEE')}</p>
                <p className="text-3xl">{format(day, 'd')}</p>
              </div>
              
              <Droppable droppableId={dayStr}>
                {(provided) => (
                  <div
                    ref={provided.innerRef}
                    {...provided.droppableProps}
                    className="h-full p-2 space-y-2"
                    style={{ minHeight: 'calc(100vh - 10rem)' }}
                    onClick={() => onGridClick(day)} // Click empty space
                  >
                    {dayEvents.map((event, index) => (
                      <Draggable key={event.id} draggableId={event.id.toString()} index={index}>
                        {(provided, snapshot) => (
                          <div
                            ref={provided.innerRef}
                            {...provided.draggableProps}
                            {...provided.dragHandleProps}
                            onClick={e => {
                              e.stopPropagation();
                              onEventClick(event); // Click event
                            }} 
                          >
                            <EventWidget
                              event={event}
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
    </DragDropContext>
  );
};

export default WeeklyView;