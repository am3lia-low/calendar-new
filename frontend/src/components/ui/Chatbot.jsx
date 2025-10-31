import React, { useState } from 'react';
import api from '../../services/api';

const Chatbot = ({ onAddEvents }) => {
  const [message, setMessage] = useState('');
  const [suggestions, setSuggestions] = useState([]);
  const [isLoading, setIsLoading] = useState(false);

  const handlePaste = (e) => {
    const items = e.clipboardData.items;
    for (const item of items) {
      if (item.type.indexOf('image') !== -1) {
        e.preventDefault();
        const blob = item.getAsFile();
        const reader = new FileReader();

        reader.onload = (event) => {
          const base64Image = event.target.result;
          parseImage(base64Image);
        };
        reader.readAsDataURL(blob);
      }
    }
  };

  const parseImage = async (base64Image) => {
    setIsLoading(true);
    setSuggestions([]);
    try {
      const response = await api.parseImage(base64Image, message);
      if (response.data.suggested_events) {
        setSuggestions(response.data.suggested_events);
      }
    } catch (err) {
      console.error("Parsing failed", err);
    }
    setIsLoading(false);
  };

  const handleAddSuggestion = (event) => {
    // This function would be passed up to the main calendar
    // to add the event to the state (without saving yet)
    onAddEvents([event]); 
    setSuggestions(suggestions.filter(s => s.title !== event.title));
  };

  return (
    <div className="bg-white p-4 shadow-lg rounded-lg max-w-md">
      <h3 className="font-bold text-lg mb-2">Gemini 2.5 Scheduler</h3>
      {isLoading && <p>Analyzing image...</p>}
      
      {suggestions.length > 0 && (
        <div className="mb-4 space-y-2">
          <p className="font-semibold">Verification:</p>
          {suggestions.map((event, i) => (
            <div key={i} className="p-2 bg-gray-100 rounded flex justify-between items-center">
              <div>
                <p className="font-bold">{event.title}</p>
                <p className="text-sm">{event.date} @ {event.startTime}</p>
              </div>
              <button 
                onClick={() => handleAddSuggestion(event)}
                className="bg-blue-500 text-white px-2 py-1 rounded text-sm"
              >
                Add
              </button>
            </div>
          ))}
        </div>
      )}

      <textarea
        className="w-full p-2 border rounded"
        rows="4"
        value={message}
        onChange={(e) => setMessage(e.target.value)}
        onPaste={handlePaste}
        placeholder="Paste a calendar screenshot or type a command..."
      />
    </div>
  );
};

export default Chatbot;