import React, { useState } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from './contexts/AuthContext';
import Login from './components/auth/Login';
import WeeklyView from './components/views/WeeklyView';
import MonthlyView from './components/views/MonthlyView'; // Import MonthlyView
import { Toaster } from 'react-hot-toast';

const ProtectedRoute = ({ children }) => {
  const { isLoggedIn, loading } = useAuth();
  if (loading) return <div>Loading...</div>;
  if (!isLoggedIn) return <Navigate to="/login" replace />;
  return children;
};

// Main layout now manages the view state
const AppLayout = () => {
  const { user, logout } = useAuth();
  const [view, setView] = useState('week'); // 'week' or 'month'
  const [selectedDate, setSelectedDate] = useState(new Date());

  // This handler allows MonthlyView to switch to WeeklyView on a specific date
  const handleDateSelect = (day) => {
    setSelectedDate(day);
    setView('week');
  };

  return (
    <div className="flex flex-col h-screen">
      <header className="bg-white shadow-md p-4 flex justify-between items-center z-10">
        <h1 className="text-xl font-bold text-water-blue-end">My Calendar</h1>
        
        {/* View Toggle */}
        <div className="flex space-x-1 bg-gray-200 p-1 rounded-lg">
          <button
            onClick={() => setView('week')}
            className={`px-4 py-1 rounded-md ${view === 'week' ? 'bg-white shadow' : 'text-gray-600'}`}
          >
            Week
          </button>
          <button
            onClick={() => setView('month')}
            className={`px-4 py-1 rounded-md ${view === 'month' ? 'bg-white shadow' : 'text-gray-600'}`}
          >
            Month
          </button>
        </div>

        <div>
          <span>Welcome, {user.username}!</span>
          <button onClick={logout} className="ml-4 text-red-500 hover:underline">Logout</button>
        </div>
      </header>
      
      <main className="flex-1 overflow-auto">
        {/* Conditional Rendering */}
        {view === 'week' ? (
          <WeeklyView currentDate={selectedDate} />
        ) : (
          <MonthlyView onDateSelect={handleDateSelect} />
        )}
      </main>
    </div>
  );
};

function App() {
  return (
    <>
      <Toaster position="top-right" toastOptions={{ /* ... */ }} />
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