import React, { useState } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { updateProfile } from '../../services/api';
import toast from 'react-hot-toast';

// A simple default avatar
const DefaultAvatar = () => (
  <svg className="w-16 h-16 text-gray-400" fill="currentColor" viewBox="0 0 20 20">
    <path fillRule="evenodd" d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z" clipRule="evenodd" />
  </svg>
);

const ProfileModal = ({ onClose }) => {
  const { profile, refreshProfile } = useAuth();
  const [username, setUsername] = useState(profile.username);
  const [selectedFile, setSelectedFile] = useState(null);
  const [preview, setPreview] = useState(profile.photoUrl);
  const [isSaving, setIsSaving] = useState(false);

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setSelectedFile(file);
      // Create a local preview URL
      setPreview(URL.createObjectURL(file));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSaving(true);
    
    const formData = new FormData();
    formData.append('username', username);
    if (selectedFile) {
      formData.append('photo', selectedFile);
    }

    try {
      await updateProfile(formData);
      await refreshProfile(); // Re-fetch profile in context
      toast.success("Profile updated!");
      onClose();
    } catch (err) {
      toast.error("Failed to update profile.");
      console.error(err);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div 
      className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50"
      onClick={onClose}
    >
      <div
        className="bg-white rounded-lg shadow-xl p-6 w-full max-w-md relative"
        onClick={e => e.stopPropagation()}
      >
        <button onClick={onClose} className="absolute top-3 right-3 text-2xl text-gray-500 hover:text-gray-800">&times;</button>
        <h2 className="text-2xl font-bold mb-4 text-water-blue-end">Edit Profile</h2>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="flex flex-col items-center space-y-2">
            {preview ? (
              <img src={preview} alt="Profile" className="w-24 h-24 rounded-full object-cover" />
            ) : (
              <div className="w-24 h-24 rounded-full bg-gray-100 flex items-center justify-center">
                <DefaultAvatar />
              </div>
            )}
            <label className="cursor-pointer text-sm text-blue-600 hover:underline">
              Change Photo
              <input type="file" accept="image/png, image/jpeg" className="hidden" onChange={handleFileChange} />
            </label>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700">Username</label>
            <input
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-water-blue-mid"
              required
            />
          </div>
          
          <div className="flex justify-end pt-4 space-x-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 bg-gray-200 rounded-lg hover:bg-gray-300"
              disabled={isSaving}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 bg-gradient-to-r from-water-blue-mid to-water-blue-end text-white rounded-lg shadow-lg hover:shadow-xl"
              disabled={isSaving}
            >
              {isSaving ? 'Saving...' : 'Save Changes'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default ProfileModal;