import React, { useState, useEffect } from 'react';
import { format } from 'date-fns';

const defaultEvent = {
  id: null,
  title: '',
  description: '',
  date: format(new Date(), 'yyyy-MM-dd'),
  startTime: '10:00',
  endTime: '11:00',
  color: 'blue',
  location: '',
};

const EventModal = ({ event, onClose, onSave, onDelete }) => {
  const [formData, setFormData] = useState(event ? event : defaultEvent);

  useEffect(() => {
    // If the event prop changes (e.g., clicking a new event), reset the form
    setFormData(event ? event : { ...defaultEvent, date: event?.date || defaultEvent.date });
  }, [event]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    onSave(formData);
  };

  return (
    // Backdrop
    <div 
      className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50"
      onClick={onClose}
    >
      {/* Modal Content */}
      <div
        className="bg-white rounded-lg shadow-xl p-6 w-full max-w-lg relative"
        onClick={e => e.stopPropagation()} // Prevent closing modal on content click
      >
        <button 
          onClick={onClose} 
          className="absolute top-3 right-3 text-2xl text-gray-500 hover:text-gray-800"
        >
          &times;
        </button>
        
        <h2 className="text-2xl font-bold mb-4 text-water-blue-end">
          {event?.id ? 'Edit Event' : 'Create New Event'}
        </h2>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <input
            type="text"
            name="title"
            value={formData.title}
            onChange={handleChange}
            placeholder="Event Title"
            className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-water-blue-mid"
            required
          />
          <textarea
            name="description"
            value={formData.description}
            onChange={handleChange}
            placeholder="Description"
            rows="3"
            className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-water-blue-mid"
          />
          <div className="grid grid-cols-2 gap-4">
            <input
              type="date"
              name="date"
              value={formData.date}
              onChange={handleChange}
              className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-water-blue-mid"
              required
            />
            <input
              type="text"
              name="location"
              value={formData.location}
              onChange={handleChange}
              placeholder="Location"
              className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-water-blue-mid"
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <input
              type="time"
              name="startTime"
              value={formData.startTime}
              onChange={handleChange}
              className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-water-blue-mid"
              required
            />
            <input
              type="time"
              name="endTime"
              value={formData.endTime}
              onChange={handleChange}
              className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-water-blue-mid"
              required
            />
          </div>
          
          {/* Action Buttons */}
          <div className="flex justify-between items-center pt-4">
            <div>
              {event?.id && (
                <button
                  type="button"
                  onClick={() => onDelete(event.id)}
                  className="text-red-600 hover:underline"
                >
                  Delete Event
                </button>
              )}
            </div>
            <div className="space-x-2">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 bg-gray-200 rounded-lg hover:bg-gray-300"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-4 py-2 bg-gradient-to-r from-water-blue-mid to-water-blue-end text-white rounded-lg shadow-lg hover:shadow-xl"
              >
                Save Changes
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};

export default EventModal;