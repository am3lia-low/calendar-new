// frontend/src/components/ui/Chatbot.jsx
import React, { useState, useEffect, useRef } from 'react';
import api from '../../services/api';

const Chatbot = ({ onClose, onAddSuggestedEvents }) => {
  const [inputMessage, setInputMessage] = useState('');
  // conversation: [{sender: 'user'|'ai', text: 'message'}]
  const [conversation, setConversation] = useState([]); 
  const [imagePreview, setImagePreview] = useState(null);
  const [base64Image, setBase64Image] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  
  const messagesEndRef = useRef(null);

  // Scrolls to the bottom of the message list whenever the conversation updates
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };
  useEffect(scrollToBottom, [conversation]);

  // --- Utility Functions ---
  const addMessage = (sender, text) => {
    setConversation(prev => [...prev, { sender, text }]);
  };

  const handleClearImage = () => {
    setImagePreview(null);
    setBase64Image(null);
  };
  
  // --- Image Handling (Keep existing logic) ---
  const handlePaste = (e) => {
    const items = e.clipboardData.items;
    for (const item of items) {
      if (item.type.indexOf('image') !== -1) {
        e.preventDefault();
        const blob = item.getAsFile();
        processFile(blob);
      }
    }
  };

  const handleImageUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      processFile(file);
    }
  };

  const processFile = (file) => {
    const reader = new FileReader();
    reader.onload = (event) => {
      const b64 = event.target.result;
      setImagePreview(b64);
      setBase64Image(b64);
    };
    reader.readAsDataURL(file);
  };
  
  // --- Submission Handler ---
  const handleSubmit = async () => {
    const prompt = inputMessage.trim();
    if (!prompt && !base64Image) return;

    // --- Create the new history FIRST ---
    // This includes all past messages AND the new one from the user
    const newHistory = [...conversation, { sender: 'user', text: prompt || "[Image Uploaded]" }];

    // --- Update the UI *optimistically* ---
    // Add the user's message to the chat window immediately
    addMessage('user', prompt || "[Image Uploaded]");
    setInputMessage('');
    setIsLoading(true);

    // --- Image Analysis Path (Stays mostly the same) ---
    if (base64Image) {
      try {
        // We don't send history for image parsing, it's a one-shot deal
        const response = await api.parseImage(base64Image, prompt || "Extract event details from this image.");
        handleClearImage();
        
        if (response.data.suggested_events && response.data.suggested_events.length > 0) {
          onAddSuggestedEvents(response.data.suggested_events);
          addMessage('ai', "Image parsed! I've added the suggested events to your calendar for review.");
        } else {
          addMessage('ai', "Sorry, I couldn't find any clear events in that image.");
        }
      } catch (err) {
        addMessage('ai', "Oops! I had trouble analyzing that image. Please try again.");
      }
    } 
    
    // --- Text Scheduling Path (This is the main change) ---
    else if (prompt) {
      try {
        // Call the agentic endpoint *with the full history*
        const response = await api.scheduleEventFromText(newHistory);
        
        if (response.data.status === 'success') {
          const event = response.data.newEvent;
          const successMessage = `alright! i've scheduled an event called "${event.title}" ${event.location ? `at ${event.location}` : ''} from ${event.startTime} to ${event.endTime}. catch you then!`;
          
          onAddSuggestedEvents([event]); 
          addMessage('ai', successMessage);
          
        } else if (response.data.status === 'question') {
          // The AI has a clarifying question. Add it to the chat.
          addMessage('ai', response.data.message);
        }
        
      } catch (err) {
        console.error("AI scheduling failed:", err);
        addMessage('ai', "Sorry, something went wrong on my end. Could you try that again?");
      }
    }
    
    setIsLoading(false);
  };
  
  // --- Dynamic Button Logic (adapted for combined input) ---
  const hasTextOrImage = inputMessage.trim() || base64Image;
  const isImageMode = !!base64Image;
  
  let buttonText = isImageMode ? 'Analyze Image' : 'Send';

  // If text is present, and no image, show Send
  if (!isImageMode && inputMessage.trim()) {
      buttonText = 'Send';
  }


  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50"
      onClick={onClose}
    >
      <div
        className="bg-white rounded-lg shadow-xl p-6 w-full max-w-xl flex flex-col relative"
        style={{ height: '70vh' }} // Set a fixed height for the chat window
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex justify-between items-center border-b pb-3 mb-4">
          <h2 className="text-2xl font-bold text-indigo-800">
            AI Chatbot (Gemini 2.5)
          </h2>
          <button
            onClick={onClose}
            className="text-2xl text-gray-500 hover:text-gray-800"
          >
            &times;
          </button>
        </div>

        {/* Conversation History Area */}
        <div className="flex-1 overflow-y-auto mb-4 space-y-3 p-2 bg-gray-50 rounded-lg">
          {conversation.map((msg, index) => (
            <div key={index} className={`flex ${msg.sender === 'user' ? 'justify-end' : 'justify-start'}`}>
              <div
                className={`max-w-xs md:max-w-md px-4 py-2 rounded-xl text-white shadow 
                  ${msg.sender === 'user' ? 'bg-indigo-600 rounded-br-none' : 'bg-gray-700 rounded-tl-none text-white'}
                `}
              >
                {msg.text}
              </div>
            </div>
          ))}
          <div ref={messagesEndRef} /> {/* Scroll anchor */}
        </div>

        {/* Image Preview & Clear Button */}
        {imagePreview && (
          <div className="flex items-center justify-between mb-3 p-2 border-t border-gray-200">
            <div className="flex items-center">
              <span className="text-sm font-medium text-gray-600 mr-2">Image attached:</span>
              <img src={imagePreview} alt="Preview" className="h-8 w-8 object-cover rounded" />
            </div>
            <button 
              onClick={handleClearImage}
              className="text-xs text-red-500 hover:text-red-700 font-semibold"
            >
              Remove
            </button>
          </div>
        )}

        {/* Input and Action Area */}
        <div className="flex space-x-2 border-t pt-3">
          
          {/* Input Field */}
          <input
            type="text"
            className="flex-1 p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
            value={inputMessage}
            onChange={(e) => setInputMessage(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                handleSubmit();
              }
            }}
            onPaste={handlePaste}
            placeholder="Type your command or paste a screenshot..."
            disabled={isLoading}
          />

          {/* Upload Button */}
          <label 
              htmlFor="image-upload" 
              className={`px-3 py-3 rounded-lg font-semibold text-sm transition-colors cursor-pointer 
                  ${isLoading ? 'bg-gray-300 text-gray-500' : 'bg-gray-200 text-gray-700 hover:bg-gray-300'}
              `}
          >
              🖼️
          </label>
          <input 
              type="file" 
              id="image-upload" 
              accept="image/*" 
              onChange={handleImageUpload} 
              className="hidden" 
              disabled={isLoading}
          />


          {/* Action Button */}
          <button
            onClick={handleSubmit}
            className={`px-4 py-3 rounded-lg text-white font-semibold transition-colors text-sm 
              ${!hasTextOrImage || isLoading ? 'bg-gray-400 cursor-not-allowed' : 'bg-indigo-600 hover:bg-indigo-700'}
            `}
            disabled={!hasTextOrImage || isLoading}
          >
            {isLoading ? '...' : buttonText}
          </button>
        </div>
        
      </div>
    </div>
  );
};

export default Chatbot;