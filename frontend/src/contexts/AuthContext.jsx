import React, { createContext, useContext, useState, useEffect } from 'react';
import { login as apiLogin, register as apiRegister, getProfile as apiGetProfile } from '../services/api';
import { jwtDecode } from 'jwt-decode';

const AuthContext = createContext(null);
const API_BASE_URL = 'http://localhost:5001'; // For image URLs

export const useAuth = () => useContext(AuthContext);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null); // Stores { token, userId }
  const [profile, setProfile] = useState(null); // Stores { username, photoUrl }
  const [loading, setLoading] = useState(true);

  // Helper to construct full image URLs
  const getFullPhotoUrl = (url) => {
    if (!url) return null; // Return null for default
    return `${API_BASE_URL}${url}`;
  };

  const loadUserData = async (token) => {
    try {
      const decoded = jwtDecode(token);
      const userId = decoded.sub;
      localStorage.setItem('token', token);
      
      // Now, fetch the profile
      const profileResponse = await apiGetProfile();
      setProfile({
        ...profileResponse.data,
        photoUrl: getFullPhotoUrl(profileResponse.data.photoUrl)
      });
      setUser({ token, userId });
      return true;
    } catch (error) {
      console.error("Failed to load user data", error);
      localStorage.clear();
      setUser(null);
      setProfile(null);
      return false;
    }
  };

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (token) {
      loadUserData(token).finally(() => setLoading(false));
    } else {
      setLoading(false);
    }
  }, []);

  const login = async (username, password) => {
    try {
      const response = await apiLogin(username, password);
      const { access_token } = response.data;
      return await loadUserData(access_token);
    } catch (error) {
      console.error("Login failed", error);
      return false;
    }
  };

  const register = async (username, password) => {
    try {
      await apiRegister(username, password);
      return await login(username, password);
    } catch (error) {
      console.error("Registration failed", error);
      return false;
    }
  };

  const logout = () => {
    localStorage.clear();
    setUser(null);
    setProfile(null);
  };
  
  // New function to be called from the ProfileModal
  const refreshProfile = async () => {
    try {
      const profileResponse = await apiGetProfile();
      setProfile({
        ...profileResponse.data,
        photoUrl: getFullPhotoUrl(profileResponse.data.photoUrl)
      });
    } catch (error) {
      console.error("Failed to refresh profile", error);
    }
  };

  const value = {
    user,
    profile,
    isLoggedIn: !!user,
    loading,
    login,
    register,
    logout,
    refreshProfile, // Expose this
  };

  return (
    <AuthContext.Provider value={value}>
      {!loading && children}
    </AuthContext.Provider>
  );
};