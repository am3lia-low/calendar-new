import React, { useState, useEffect } from 'react';
import { format, getWeek, getYear, addWeeks, startOfWeek, endOfWeek } from 'date-fns';
import { v4 as uuidv4 } from 'uuid'; // For unique task IDs
import api from '../../services/api';
import toast from 'react-hot-toast';

const ChecklistModal = ({ weekStartDate, onClose, eventsForWeek }) => {
  const [tasks, setTasks] = useState([]); // Tasks for the current week
  const [newTaskName, setNewTaskName] = useState('');
  const [allYearTasks, setAllYearTasks] = useState({}); // All tasks for the year, keyed by weekString
  const [loading, setLoading] = useState(true);

  const currentYear = getYear(weekStartDate);
  const currentWeekNumber = getWeek(weekStartDate, { weekStartsOn: 1 });
  const weekString = `${currentYear}-W${currentWeekNumber}`; // e.g., "2024-W20"

  useEffect(() => {
    setLoading(true);
    api.getTasks(currentYear)
      .then(response => {
        setAllYearTasks(response.data);
        setTasks(response.data[weekString] || []);
      })
      .catch(err => {
        console.error("Failed to load tasks:", err);
        toast.error("Could not load checklist tasks.");
      })
      .finally(() => setLoading(false));
  }, [weekStartDate, currentYear]);

  // Merge events into tasks
  useEffect(() => {
    const eventTasks = eventsForWeek.map(event => ({
      id: `event-${event.id}`,
      name: `Attend: ${event.title} (${event.startTime})`,
      completed: false, // Assume not completed unless explicitly linked later
      eventId: event.id,
      color: event.color, // For visual cue
    }));

    // Filter out event tasks that are already present or linked to existing tasks
    const existingEventTaskIds = tasks.filter(t => t.eventId).map(t => t.eventId);
    const newEventTasks = eventTasks.filter(et => !existingEventTaskIds.includes(et.eventId));

    setTasks(prevTasks => [...prevTasks, ...newEventTasks]);
  }, [eventsForWeek, weekString]); // Re-run if events change for the week

  const saveTasksToBackend = (updatedTasksForWeek) => {
    const updatedAllYearTasks = { ...allYearTasks, [weekString]: updatedTasksForWeek };
    setAllYearTasks(updatedAllYearTasks);
    api.saveTasks(currentYear, updatedAllYearTasks)
      .then(() => toast.success("Checklist saved!"))
      .catch(err => {
        console.error("Failed to save tasks:", err);
        toast.error("Failed to save checklist.");
      });
  };

  const handleAddTask = (e) => {
    e.preventDefault();
    if (newTaskName.trim() === '') return;

    const newTask = {
      id: uuidv4(),
      name: newTaskName,
      completed: false,
      eventId: null, // Standalone task
    };
    const updatedTasks = [...tasks, newTask];
    setTasks(updatedTasks);
    setNewTaskName('');
    saveTasksToBackend(updatedTasks);
  };

  const handleToggleComplete = (id) => {
    const updatedTasks = tasks.map(task =>
      task.id === id ? { ...task, completed: !task.completed } : task
    );
    setTasks(updatedTasks);
    saveTasksToBackend(updatedTasks);
  };

  const handleDeleteTask = (id) => {
    const updatedTasks = tasks.filter(task => task.id !== id);
    setTasks(updatedTasks);
    saveTasksToBackend(updatedTasks);
  };

  const handleMoveToNextWeek = (id) => {
    const taskToMove = tasks.find(task => task.id === id);
    if (!taskToMove) return;

    // Remove from current week
    const updatedCurrentWeekTasks = tasks.filter(task => task.id !== id);
    setTasks(updatedCurrentWeekTasks);
    
    // Add to next week
    const nextWeekStart = addWeeks(weekStartDate, 1);
    const nextWeekNumber = getWeek(nextWeekStart, { weekStartsOn: 1 });
    const nextWeekYear = getYear(nextWeekStart);
    const nextWeekString = `${nextWeekYear}-W${nextWeekNumber}`;

    const updatedNextWeekTasks = [...(allYearTasks[nextWeekString] || []), { ...taskToMove, completed: false }];
    
    const updatedAllYearTasks = {
      ...allYearTasks,
      [weekString]: updatedCurrentWeekTasks,
      [nextWeekString]: updatedNextWeekTasks
    };

    setAllYearTasks(updatedAllYearTasks); // Update local state
    api.saveTasks(currentYear, updatedAllYearTasks) // Save current year
      .then(() => {
        // If next week is a different year, also save tasks for that year
        if (nextWeekYear !== currentYear) {
            api.saveTasks(nextWeekYear, updatedAllYearTasks); // This is simplified, ideally you'd only send next year's tasks
        }
        toast.success("Task moved to next week!");
      })
      .catch(err => {
        console.error("Failed to move task:", err);
        toast.error("Failed to move task.");
      });
  };

  const getShadeOfBlue = (index) => {
    const shades = ['bg-blue-100', 'bg-blue-200', 'bg-blue-300', 'bg-blue-400'];
    return shades[index % shades.length];
  };

  if (loading) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
        <div className="bg-white p-8 rounded-lg shadow-xl">Loading tasks...</div>
      </div>
    );
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50"
      onClick={onClose}
    >
      <div
        className="bg-white rounded-lg shadow-xl p-6 w-full max-w-md relative"
        onClick={e => e.stopPropagation()}
      >
        <button
          onClick={onClose}
          className="absolute top-3 right-3 text-2xl text-gray-500 hover:text-gray-800"
        >
          &times;
        </button>

        <h2 className="text-2xl font-bold mb-4 text-water-blue-end">
          Weekly Checklist ({format(startOfWeek(weekStartDate, { weekStartsOn: 1 }), 'MMM d')} - {format(endOfWeek(weekStartDate, { weekStartsOn: 1 }), 'MMM d')})
        </h2>

        <form onSubmit={handleAddTask} className="flex mb-4">
          <input
            type="text"
            value={newTaskName}
            onChange={(e) => setNewTaskName(e.target.value)}
            placeholder="Add a new task..."
            className="flex-1 px-3 py-2 border rounded-l-lg focus:outline-none focus:ring-2 focus:ring-water-blue-mid"
          />
          <button
            type="submit"
            className="px-4 py-2 bg-gradient-to-r from-water-blue-mid to-water-blue-end text-white rounded-r-lg shadow-md hover:shadow-lg"
          >
            Add
          </button>
        </form>

        <div className="space-y-2 max-h-80 overflow-y-auto">
          {tasks.length === 0 && <p className="text-gray-500 italic">No tasks for this week.</p>}
          {tasks.map((task, index) => (
            <div
              key={task.id}
              className={`flex items-center p-3 rounded-lg shadow-sm ${getShadeOfBlue(index)}`}
            >
              <input
                type="checkbox"
                checked={task.completed}
                onChange={() => handleToggleComplete(task.id)}
                className="form-checkbox h-5 w-5 text-blue-600 rounded focus:ring-blue-500"
              />
              <span
                className={`ml-3 flex-1 text-gray-800 ${task.completed ? 'line-through text-gray-500' : ''}`}
              >
                {task.name}
              </span>
              <div className="flex items-center space-x-2">
                {!task.completed && (
                  <button
                    onClick={() => handleMoveToNextWeek(task.id)}
                    title="Move to next week"
                    className="text-gray-600 hover:text-blue-700 p-1 rounded-full hover:bg-gray-100"
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 9l3 3m0 0l-3 3m0-3H8m13 0a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>
                  </button>
                )}
                <button
                  onClick={() => handleDeleteTask(task.id)}
                  title="Delete task"
                  className="text-gray-600 hover:text-red-700 p-1 rounded-full hover:bg-gray-100"
                >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"></path></svg>
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default ChecklistModal;