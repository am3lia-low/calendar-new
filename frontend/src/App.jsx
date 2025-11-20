import React, { useState, useEffect } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from './contexts/AuthContext';
import { v4 as uuidv4 } from 'uuid';
import toast, { Toaster } from 'react-hot-toast';
import {
  startOfWeek,
  endOfWeek,
  startOfMonth,
  endOfMonth,
  parseISO,
  format,
  differenceInMinutes
} from 'date-fns';

// API & Services
import api from './services/api';
import { generateRecurringInstances } from './services/recurrence';

// Core Components
import Login from './components/auth/Login';
import WeeklyView from './components/views/WeeklyView';
import MonthlyView from './components/views/MonthlyView';

// UI Modals
import ChecklistModal from './components/ui/ChecklistModal';
import Chatbot from './components/ui/Chatbot';
import EventModal from './components/ui/EventModal';
import ConfirmRecurrenceEditModal from './components/ui/ConfirmRecurrenceEditModal';
import ProfileModal from './components/ui/ProfileModal';
import NotificationBlob from './components/ui/NotificationBlob';
import ChatbotModal from './components/ChatbotModal'; // The primary AI chat component

// --- Protected Route Component ---
const ProtectedRoute = ({ children }) => {
  const { isAuthenticated, loading } = useAuth(); // Using isAuthenticated here
  if (loading) {
    return <div className="flex items-center justify-center h-screen">Loading...</div>;
  }
  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }
  return children;
};

// --- Default Event ---
const defaultEvent = {
  id: null,
  title: '',
  description: '',
  date: format(new Date(), 'yyyy-MM-dd'),
  startTime: '10:00',
  endTime: '11:00',
  color: 'blue',
  location: '',
  recurrenceRule: 'NONE',
};

// --- Main App Layout ---
const AppLayout = () => {
  const { profile, logout } = useAuth();
  
  // View Management State
  const [view, setView] =useState('week');
  const [selectedDate, setSelectedDate] = useState(new Date());

  // Data State (Master List)
  const [allEvents, setAllEvents] = useState([]); // Raw events from DB
  const [displayEvents, setDisplayEvents] = useState([]); // Generated instances for view
  const [loading, setLoading] = useState(true);

  // Modal State
  const [isChecklistOpen, setIsChecklistOpen] = useState(false);
  const [isChatbotOpen, setIsChatbotOpen] = useState(false);
  const [isEventModalOpen, setIsEventModalOpen] = useState(false);
  const [selectedEvent, setSelectedEvent] = useState(null);
  const [isRecurrenceConfirmOpen, setIsRecurrenceConfirmOpen] = useState(false);
  const [pendingEventAction, setPendingEventAction] = useState(null); // { type: 'save'/'delete', data: event }
  const [isProfileModalOpen, setIsProfileModalOpen] = useState(false);

  // Notification State
  const [notifyEvent, setNotifyEvent] = useState(null); // The event to show
  const [notifiedEventIds, setNotifiedEventIds] = useState(new Set()); // Prevents re-notifying

  // --- Data Fetching ---
  useEffect(() => {
    setLoading(true);
    api.getAllEvents()
      .then(response => {
        setAllEvents(response.data);
      })
      .catch(err => {
        console.error("Failed to load events", err);
        toast.error("Could not load events.");
      })
      .finally(() => setLoading(false));
  }, []);

  // --- Event Instance Generation ---
  useEffect(() => {
    let startDate, endDate;
    if (view === 'week') {
      startDate = startOfWeek(selectedDate, { weekStartsOn: 1 });
      endDate = endOfWeek(selectedDate, { weekStartsOn: 1 });
    } else { // month
      startDate = startOfWeek(startOfMonth(selectedDate), { weekStartsOn: 1 });
      endDate = endOfWeek(endOfMonth(selectedDate), { weekStartsOn: 1 });
    }
    
    const instances = generateRecurringInstances(allEvents, startDate, endDate);
    setDisplayEvents(instances);
  }, [allEvents, view, selectedDate]);

  // --- Notification Check Timer ---
  useEffect(() => {
    const interval = setInterval(() => {
      const now = new Date();
      const upcomingEvent = displayEvents.find(event => {
        const eventTime = parseISO(`${event.date}T${event.startTime}`);
        if (eventTime < now) return false;
        
        const minutesUntilEvent = differenceInMinutes(eventTime, now);
        return minutesUntilEvent <= 5 && minutesUntilEvent >= 0;
      });

      if (upcomingEvent) {
        if (!notifiedEventIds.has(upcomingEvent.id)) {
          setNotifyEvent(upcomingEvent);
          setNotifiedEventIds(prev => new Set(prev).add(upcomingEvent.id));
        }
      }
    }, 30000); // Check every 30 seconds

    return () => clearInterval(interval);
  }, [displayEvents, notifiedEventIds]);

  // --- Save Handler ---
  const saveAllEventsToBackend = (updatedMasterList, showToast = true) => {
      setAllEvents(updatedMasterList); // Optimistic UI
      
      api.saveAllEvents(updatedMasterList)
        .then(() => {
          if (showToast) {
            toast.success("Calendar saved!");
          }
        })
        .catch(err => {
          toast.error("Save failed. Please try again.");
        });
    };

  // --- Event Modal & Action Handlers ---
  const handleOpenEventModal = (event) => {
    setSelectedEvent(event);
    setIsEventModalOpen(true);
  };
  
  const handleCloseEventModal = () => {
    setIsEventModalOpen(false);
    setSelectedEvent(null);
  };

  const handleSaveEvent = (formData) => {
    if (formData.isInstance || formData.isException) {
      setPendingEventAction({ type: 'save', data: formData });
      setIsRecurrenceConfirmOpen(true);
    } else {
      saveEvent(formData);
    }
    handleCloseEventModal();
  };

  const handleDeleteEvent = (eventData) => {
    if (eventData.isInstance || eventData.isException) {
      setPendingEventAction({ type: 'delete', data: eventData });
      setIsRecurrenceConfirmOpen(true);
    } else {
      deleteEvent(eventData, 'series');
    }
    handleCloseEventModal();
  };

  const handleRecurrenceConfirm = (editMode) => { // 'instance' or 'series'
    const { type, data } = pendingEventAction;
    if (type === 'save') {
      saveEvent(data, editMode);
    } else if (type === 'delete') {
      deleteEvent(data, editMode);
    }
    setIsRecurrenceConfirmOpen(false);
    setPendingEventAction(null);
  };

  // --- Core Data Logic (CRUD) ---
  const saveEvent = (formData, editMode = 'series') => {
    let updatedMasterList = [...allEvents];
    
    if (editMode === 'instance') {
      const exceptionEvent = {
        ...formData,
        id: uuidv4(),
        recurrenceId: formData.recurrenceId,
        originalDate: formData.originalDate,
        isBaseEvent: false,
        isException: true,
      };
      updatedMasterList.push(exceptionEvent);
      toast.success("Event instance updated!");
      
    } else if (editMode === 'series') {
      if (formData.isInstance || formData.isException) {
        updatedMasterList = updatedMasterList.map(e => 
          e.recurrenceId === formData.recurrenceId && e.isBaseEvent ? { ...formData, id: e.id, isBaseEvent: true, recurrenceId: e.recurrenceId } : e
        );
        toast.success("Event series updated!");
      } else if (formData.id) {
        updatedMasterList = updatedMasterList.map(e => e.id === formData.id ? formData : e);
        toast.success("Event updated!");
      } else {
        const newEvent = { ...formData, id: uuidv4() };
        if (newEvent.recurrenceRule !== 'NONE') {
          newEvent.recurrenceId = `rec-${uuidv4()}`;
          newEvent.isBaseEvent = true;
        }
        updatedMasterList.push(newEvent);
        toast.success("Event created!");
      }
    }
    saveAllEventsToBackend(updatedMasterList);
  };

  const deleteEvent = (eventData, editMode) => {
    let updatedMasterList = [...allEvents];
    
    if (editMode === 'instance') {
      const ghostEvent = {
        id: uuidv4(),
        recurrenceId: eventData.recurrenceId,
        originalDate: eventData.originalDate,
        isDeleted: true,
        isBaseEvent: false,
      };
      updatedMasterList.push(ghostEvent);
      toast.success("Event instance deleted!");
      
    } else if (editMode === 'series') {
      if (eventData.recurrenceId) {
        updatedMasterList = updatedMasterList.filter(e => e.recurrenceId !== eventData.recurrenceId);
      } else {
        updatedMasterList = updatedMasterList.filter(e => e.id !== eventData.id);
      }
      toast.success("Event series deleted!");
    }
    saveAllEventsToBackend(updatedMasterList);
  };

  // --- Checklist Task Handler (FIX 2: Added to handle saving tasks from the modal) ---
  const handleSaveTasks = (updatedTasks) => {
    // This assumes an API method exists for saving non-event specific tasks
    api.saveChecklistTasks(updatedTasks)
      .then(() => toast.success("Checklist tasks saved!"))
      .catch(err => {
        console.error("Failed to save checklist tasks", err);
        toast.error("Failed to save checklist.");
      });
  };

  // --- UI Handlers ---
  const handleDateSelect = (day) => {
    setSelectedDate(day);
    setView('week');
  };

  const handleAddSuggestedEvents = (events) => {
    const newEventsWithIds = events.map(e => ({
      ...e,
      id: uuidv4(),
      recurrenceRule: 'NONE' // AI events are single-instance
    }));
    
    const updatedMasterList = [...allEvents, ...newEventsWithIds];
    // Call the save function, but with the toast disabled
    saveAllEventsToBackend(updatedMasterList, false);

    // We can still switch the view, that's fine
    setView('week');
    if (events.length > 0) setSelectedDate(new Date(events[0].date));
  };
  
  // FIX 1: Isolated handler for the chatbot button to ensure correct setter reference
//   const handleOpenChatbot = () => {
//     setIsChatbotOpen(true);
//   };


  // Simple Avatar component
  const Avatar = ({ src }) => {
    if (src) {
      return <img src={src} alt="Profile" className="w-8 h-8 rounded-full object-cover" />;
    }
    return (
      <div className="w-8 h-8 rounded-full bg-gray-200 flex items-center justify-center text-gray-500">
        {profile.username ? profile.username[0].toUpperCase() : '?'}
      </div>
    );
  };

  return (
    <div className="flex flex-col h-screen">
      <header className="bg-white shadow-md p-4 flex justify-between items-center z-10">
        <h1 className="text-xl font-bold text-water-blue-end">My Calendar</h1>
        
        <div className="flex items-center space-x-4">
            <div className="flex bg-gray-100 p-1 rounded-lg">
                <button
                onClick={() => setView('week')}
                className={`
                    px-6 py-1.5 rounded-md text-sm font-medium transition-all duration-200
                    ${view === 'week' 
                    ? 'bg-white shadow text-gray-800' 
                    : 'text-gray-500 hover:text-gray-700 hover:bg-gray-200'
                    }
                `}
                >
                Week
                </button>
                <button
                onClick={() => setView('month')}
                className={`
                    px-6 py-1.5 rounded-md text-sm font-medium transition-all duration-200
                    ${view === 'month' 
                    ? 'bg-white shadow text-gray-800' 
                    : 'text-gray-500 hover:text-gray-700 hover:bg-gray-200'
                    }
                `}
                >
                Month
                </button>
            </div>
          <button
            onClick={() => setIsChecklistOpen(true)}
            className="px-4 py-2 bg-gradient-to-r from-blue-400 to-blue-600 text-white rounded-lg shadow-md hover:shadow-lg transition-all"
          >
            Checklist
          </button>
          <button
              onClick={() => setIsChatbotOpen(true)}
              className="px-4 py-2 rounded-lg text-white font-semibold transition-colors bg-purple-600 hover:bg-purple-700"
          >
              AI Chat
          </button>
        </div>

        <div className="flex items-center space-x-3">
          <button 
            onClick={() => setIsProfileModalOpen(true)}
            className="flex items-center space-x-2 p-1 rounded-lg hover:bg-gray-100"
          >
            <Avatar src={profile.photoUrl} />
            <span className="font-semibold">{profile.username}</span>
          </button>
          <button onClick={logout} className="text-red-500 hover:underline">Logout</button>
        </div>
      </header>
      
      <main className="flex-1 overflow-auto">
        {loading ? (
          <div className="flex items-center justify-center h-full">
            <p>Loading your calendar...</p>
          </div>
        ) : view === 'week' ? (
          <WeeklyView
            currentDate={selectedDate}
            events={displayEvents}
            onEventClick={handleOpenEventModal}
            onGridClick={(day) => handleOpenEventModal({ ...defaultEvent, date: format(day, 'yyyy-MM-dd') })}
            onDateChange={setSelectedDate}
          />
        ) : (
          <MonthlyView
            currentDate={selectedDate}
            onCurrentDateChange={setSelectedDate}
            events={displayEvents}
            onDateSelect={handleDateSelect}
            onEventClick={handleOpenEventModal}
          />
        )}
      </main>

      {/* --- All Modals --- */}
      {isEventModalOpen && (
        <EventModal
          event={selectedEvent}
          onClose={handleCloseEventModal}
          onSave={handleSaveEvent}
          onDelete={handleDeleteEvent}
        />
      )}
      
      {isRecurrenceConfirmOpen && (
        <ConfirmRecurrenceEditModal
          editType={pendingEventAction.type}
          onConfirm={handleRecurrenceConfirm}
          onCancel={() => setIsRecurrenceConfirmOpen(false)}
        />
      )}

      {isChecklistOpen && (
        <ChecklistModal 
          isOpen={isChecklistOpen}
          weekStartDate={selectedDate}
          onClose={() => setIsChecklistOpen(false)}
          eventsForWeek={displayEvents.filter(e => {
            const weekStart = startOfWeek(selectedDate, { weekStartsOn: 1 });
            const weekEnd = endOfWeek(selectedDate, { weekStartsOn: 1 });
            return parseISO(e.date) >= weekStart && parseISO(e.date) <= weekEnd;
          })}
        />
      )}

      {isChatbotOpen && (
        <Chatbot 
          onClose={() => setIsChatbotOpen(false)}
          onAddSuggestedEvents={handleAddSuggestedEvents}
        />
      )}

    {isChatbotOpen && ( 
        <ChatbotModal 
          onClose={() => setIsChatbotOpen(false)}
          onAddSuggestedEvents={handleAddSuggestedEvents}
        />
      )}

      {isProfileModalOpen && (
        <ProfileModal onClose={() => setIsProfileModalOpen(false)} />
      )}
      
      {notifyEvent && (
        <NotificationBlob 
          event={notifyEvent} 
          onClose={() => setNotifyEvent(null)}
        />
      )}
    </div>
  );
};

// --- App Root ---
function App() {
  return (
    <>
      <Toaster 
        position="top-right"
        toastOptions={{
          className: '',
          style: {
            border: '1px solid #4682b4',
            padding: '16px',
            color: '#333',
          },
        }}
      />
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route 
          path="/" 
          element={
            <ProtectedRoute>
              <AppLayout />
            </ProtectedRoute>
          } 
        />
      </Routes>
    </>
  );
}

export default App;