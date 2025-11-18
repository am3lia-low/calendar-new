import React, { useState } from 'react';
import toast from 'react-hot-toast';

// Helper function to convert File object to Base64 string
const fileToBase64 = (file) => {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.readAsDataURL(file);
        reader.onload = () => resolve(reader.result.split(',')[1]); // Only send the base64 part
        reader.onerror = (error) => reject(error);
    });
};

const ChatbotModal = ({ 
    isOpen, 
    onClose, 
    onScheduleEventFromText, 
    onAnalyzeImage, 
}) => {
    // Return null immediately if the modal should be closed
    if (!isOpen) return null;

    const [prompt, setPrompt] = useState('');
    const [selectedFile, setSelectedFile] = useState(null);
    const [isLoading, setIsLoading] = useState(false);

    const handleFileChange = (event) => {
        setSelectedFile(event.target.files[0]);
    };

    const handleAction = async () => {
        if (!prompt.trim() && !selectedFile) {
            toast.error('Please enter a prompt or upload an image.');
            return;
        }

        setIsLoading(true);

        try {
            if (selectedFile) {
                // ACTION 1: Image Analysis
                const base64Image = await fileToBase64(selectedFile);
                await onAnalyzeImage(base64Image, prompt);
                toast.success('Image analysis requested!');
            } else if (prompt.trim()) {
                // ACTION 2: Text Scheduling (The new feature)
                await onScheduleEventFromText(prompt);
                toast.success('Event scheduling requested!');
            }
            
            // Clear state and close modal upon success
            setPrompt('');
            setSelectedFile(null);
            onClose();
        } catch (error) {
            console.error('Chatbot action failed:', error);
            toast.error('Failed to process request. Check server logs.');
        } finally {
            setIsLoading(false);
        }
    };
    
    // Logic for dynamic button text and style
    const isTextMode = prompt.trim() && !selectedFile;
    const actionText = selectedFile 
        ? 'Analyze Image' 
        : (isTextMode ? 'Schedule Event' : 'Analyze Image');
    
    return (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-xl shadow-2xl w-full max-w-lg p-6">
                
                {/* Header */}
                <div className="flex justify-between items-center border-b pb-3 mb-4">
                    <h2 className="text-xl font-bold text-indigo-800">AI Chatbot (Gemini 2.5)</h2>
                    <button onClick={onClose} className="text-gray-400 hover:text-gray-600">&times;</button>
                </div>

                {/* Text Area */}
                <textarea
                    value={prompt}
                    onChange={(e) => setPrompt(e.target.value)}
                    rows="4"
                    className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 transition duration-150"
                    placeholder="E.g., schedule an event for today 6pm and call it 'book sort'"
                />

                {/* Buttons */}
                <div className="flex justify-between items-center mt-4">
                    
                    {/* File Picker Wrapper */}
                    <label 
                        htmlFor="image-upload" 
                        className={`px-4 py-2 rounded-lg font-semibold transition-colors cursor-pointer ${
                            selectedFile ? 'bg-indigo-100 text-indigo-700' : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                        }`}
                    >
                        {selectedFile ? `File: ${selectedFile.name}` : 'Upload Image'}
                    </label>
                    <input 
                        type="file" 
                        id="image-upload" 
                        accept="image/*" 
                        onChange={handleFileChange} 
                        className="hidden" 
                    />

                    {/* Action Button (Dynamic) */}
                    <button
                        onClick={handleAction}
                        disabled={isLoading || (!prompt.trim() && !selectedFile)}
                        className={`px-4 py-2 rounded-lg text-white font-semibold transition-colors ${
                            isLoading 
                                ? 'bg-gray-400 cursor-not-allowed'
                                : (isTextMode || selectedFile) 
                                    ? 'bg-indigo-600 hover:bg-indigo-700'
                                    : 'bg-gray-400 cursor-not-allowed'
                        }`}
                    >
                        {isLoading ? 'Processing...' : actionText}
                    </button>
                </div>
                
            </div>
        </div>
    );
};

export default ChatbotModal;