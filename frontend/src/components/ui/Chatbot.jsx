import React, { useState } from 'react';
import api from '../../services/api';
import toast from 'react-hot-toast';
import { v4 as uuidv4 } from 'uuid'; // For generating new event IDs

const Chatbot = ({ onClose, onAddSuggestedEvents }) => {
  const [message, setMessage] = useState('');
  const [imagePreview, setImagePreview] = useState(null);
  const [suggestedEvents, setSuggestedEvents] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isImageParsing, setIsImageParsing] = useState(false);

  // Handles pasting an image directly into the textarea
  const handlePaste = (e) => {
    const items = e.clipboardData.items;
    for (const item of items) {
      if (item.type.indexOf('image') !== -1) {
        e.preventDefault(); // Prevent default text paste
        const blob = item.getAsFile();
        const reader = new FileReader();

        reader.onload = (event) => {
          const base64Image = event.target.result;
          setImagePreview(base64Image); // Show image preview
          parseImage(base64Image); // Send to backend for parsing
        };
        reader.readAsDataURL(blob);
      }
    }
  };

  // Handles manual image upload via file input (optional, for completeness)
  const handleImageUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        const base64Image = event.target.result;
        setImagePreview(base64Image);
        parseImage(base64Image);
      };
      reader.readAsDataURL(file);
    }
  };

  const parseImage = async (base64Image) => {
    setIsLoading(true);
    setIsImageParsing(true);
    setSuggestedEvents([]); // Clear previous suggestions
    try {
      // The `message` state can be used as an additional prompt for the AI
      const response = await api.parseImage(base64Image, message || "Extract calendar event details from this image.");
      if (response.data.suggested_events && response.data.suggested_events.length > 0) {
        setSuggestedEvents(response.data.suggested_events);
        toast.success("Image parsed! Review suggested events.");
      } else if (response.data.error) {
        toast.error(`AI Error: ${response.data.error}`);
      } else {
        toast("No events found in the image.", { icon: '🤔' });
      }
    } catch (err) {
      console.error("Parsing failed", err);
      toast.error("Failed to parse image with AI.");
    }
    setIsLoading(false);
    setIsImageParsing(false);
  };

  const handleAddSuggestion = (suggestedEvent) => {
    // Generate a new unique ID for the event
    const newEvent = { ...suggestedEvent, id: uuidv4() };
    onAddSuggestedEvents([newEvent]); // Pass up to AppLayout to add
    toast.success(`'${newEvent.title}' added to calendar preview.`);
    // Remove the added event from suggestions
    setSuggestedEvents(prev => prev.filter(e => e !== suggestedEvent));
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50"
      onClick={onClose}
    >
      <div
        className="bg-white rounded-lg shadow-xl p-6 w-full max-w-lg relative"
        onClick={e => e.stopPropagation()}
      >
        <button
          onClick={onClose}
          className="absolute top-3 right-3 text-2xl text-gray-500 hover:text-gray-800"
        >
          &times;
        </button>

        <h2 className="text-2xl font-bold mb-4 text-water-blue-end">
          AI Chatbot (Gemini 2.5)
        </h2>

        {imagePreview && (
          <div className="mb-4">
            <p className="text-sm text-gray-600 mb-2">Image Preview:</p>
            <img src={imagePreview} alt="Pasted calendar screenshot" className="max-w-full h-auto rounded-lg border object-contain max-h-48" />
            <button 
              onClick={() => setImagePreview(null)}
              className="text-sm text-red-500 hover:underline mt-2"
            >
              Clear Image
            </button>
          </div>
        )}

        <textarea
          className="w-full p-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-water-blue-mid resize-y"
          rows="4"
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          onPaste={handlePaste}
          placeholder="Paste a calendar screenshot (PNG, JPG) or type a command to schedule events..."
          disabled={isImageParsing}
        />
        
        <div className="flex justify-between items-center mt-3">
          <label className="bg-gray-200 hover:bg-gray-300 px-4 py-2 rounded-lg cursor-pointer text-sm">
            Upload Image
            <input type="file" accept="image/*" className="hidden" onChange={handleImageUpload} />
          </label>
          <button
            onClick={() => parseImage(imagePreview)} // Re-parse if needed
            className="px-4 py-2 bg-water-blue-mid text-white rounded-lg shadow-md hover:bg-water-blue-end transition-all text-sm"
            disabled={isLoading || !imagePreview}
          >
            {isLoading ? 'Analyzing...' : 'Analyze Image'}
          </button>
        </div>


        {suggestedEvents.length > 0 && (
          <div className="mt-6 border-t pt-4">
            <p className="font-semibold text-water-blue-end mb-3">
              AI Suggestions: Review & Add
            </p>
            <div className="space-y-2">
              {suggestedEvents.map((event, i) => (
                <div key={i} className="p-3 bg-blue-50 rounded-lg flex justify-between items-center shadow-sm">
                  <div>
                    <p className="font-bold text-gray-800">{event.title}</p>
                    <p className="text-sm text-gray-600">
                      {event.date} {event.startTime} - {event.endTime}
                      {event.location && ` @ ${event.location}`}
                    </p>
                    {event.description && <p className="text-xs text-gray-500 italic mt-1">{event.description}</p>}
                  </div>
                  <button
                    onClick={() => handleAddSuggestion(event)}
                    className="ml-4 bg-green-500 text-white px-3 py-1 rounded-lg text-sm hover:bg-green-600"
                  >
                    Add
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Chatbot;