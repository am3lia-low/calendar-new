import React, { useState, useEffect } from 'react';
import api from '../../services/api'; // <--- FIXED IMPORT PATH
import toast from 'react-hot-toast';
import { v4 as uuidv4 } from 'uuid';

const ChecklistModal = ({ isOpen, onClose }) => {
    const [tasks, setTasks] = useState([]);
    const [newTask, setNewTask] = useState('');
    // Removed unused isLoading state to fix ESLint warning

    // Load tasks when modal opens
    useEffect(() => {
        if (isOpen) {
            loadTasks();
        }
    }, [isOpen]);

    const loadTasks = async () => {
        try {
            const response = await api.loadTasks();
            setTasks(response.data);
        } catch (error) {
            console.error("Failed to load tasks", error);
        }
    };

    const handleAddTask = async (e) => {
        e.preventDefault();
        if (!newTask.trim()) return;

        const taskData = {
            id: uuidv4(),
            title: newTask,
            completed: false
        };

        // Optimistic UI Update
        setTasks([...tasks, taskData]);
        setNewTask('');

        try {
            await api.saveTask(taskData);
        } catch (error) {
            toast.error("Failed to save task.");
            setTasks(tasks); // Revert on failure
        }
    };

    const handleToggleTask = async (task) => {
        const updatedTask = { ...task, completed: !task.completed };
        setTasks(tasks.map(t => t.id === task.id ? updatedTask : t));

        try {
            await api.updateTask(task.id, updatedTask); 
        } catch (error) {
            console.error("Toggle error:", error);
            toast.error("Failed to update task.");
            setTasks(tasks);
        }
    };

    const handleDeleteTask = async (taskId) => {
        setTasks(tasks.filter(t => t.id !== taskId));

        try {
            await api.deleteTask(taskId);
        } catch (error) {
            toast.error("Failed to delete task.");
            setTasks(tasks);
        }
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-xl shadow-2xl w-full max-w-md p-6 h-3/4 flex flex-col">
                
                <div className="flex justify-between items-center mb-4 border-b pb-2">
                    <h2 className="text-xl font-bold text-gray-800">My Checklist</h2>
                    <button onClick={onClose} className="text-gray-500 hover:text-gray-700 text-2xl">&times;</button>
                </div>

                {/* Task List Area */}
                <div className="flex-1 overflow-y-auto space-y-2 pr-2">
                    {tasks.length === 0 && (
                        <p className="text-gray-400 text-center italic mt-10">No tasks yet. Add one below!</p>
                    )}
                    
                    {tasks.map(task => (
                        <div key={task.id} className="flex items-center justify-between bg-gray-50 p-3 rounded-lg group hover:shadow-sm transition-shadow">
                            <div className="flex items-center space-x-3 overflow-hidden">
                                <input 
                                    type="checkbox" 
                                    checked={task.completed} 
                                    onChange={() => handleToggleTask(task)} 
                                    className="w-5 h-5 text-blue-600 rounded focus:ring-blue-500 cursor-pointer"
                                />
                                <span className={`truncate text-gray-700 ${task.completed ? 'line-through text-gray-400' : ''}`}>
                                    {task.title}
                                </span>
                            </div>
                            <button 
                                onClick={() => handleDeleteTask(task.id)}
                                className="text-red-400 hover:text-red-600 opacity-0 group-hover:opacity-100 transition-opacity"
                            >
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                                    <path fillRule="evenodd" d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v6a1 1 0 102 0V8a1 1 0 00-1-1z" clipRule="evenodd" />
                                </svg>
                            </button>
                        </div>
                    ))}
                </div>

                {/* Input Area */}
                <form onSubmit={handleAddTask} className="mt-4 pt-4 border-t">
                    <div className="flex space-x-2">
                        <input 
                            type="text" 
                            value={newTask}
                            onChange={(e) => setNewTask(e.target.value)}
                            placeholder="Add a new task..."
                            className="flex-1 border border-gray-300 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                        <button 
                            type="submit" 
                            disabled={!newTask.trim()}
                            className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed font-semibold transition-colors"
                        >
                            Add
                        </button>
                    </div>
                </form>

            </div>
        </div>
    );
};

export default ChecklistModal;