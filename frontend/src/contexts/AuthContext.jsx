import React, { createContext, useContext, useState, useEffect } from 'react';
import { login as apiLogin, register as apiRegister } from '../services/api';
import { jwtDecode } from 'jwt-decode'; // Use 'jwt-decode' library

const AuthContext = createContext(null);

export const useAuth = () => useContext(AuthContext);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null); // Stores { token, userId, username }
  const [loading, setLoading] = useState(true);

  // On initial app load, check if a token is already in localStorage
  useEffect(() => {
    try {
      const token = localStorage.getItem('token');
      if (token) {
        const decoded = jwtDecode(token);
        // Optional: Check if token is expired
        if (decoded.exp * 1000 > Date.now()) {
          const userId = decoded.sub; // 'sub' is the identity in the token
          const username = localStorage.getItem('username');
          setUser({ token, userId, username });
        } else {
          // Token expired
          localStorage.clear();
        }
      }
    } catch (error) {
      console.error("Invalid token", error);
      localStorage.clear();
    }
    setLoading(false);
  }, []);

  const login = async (username, password) => {
    try {
      const response = await apiLogin(username, password);
      const { access_token, userId, username: loggedInUsername } = response.data;
      
      localStorage.setItem('token', access_token);
      localStorage.setItem('username', loggedInUsername);
      
      setUser({ token: access_token, userId, username: loggedInUsername });
      return true;
    } catch (error) {
      console.error("Login failed", error);
      return false;
    }
  };

  const register = async (username, password) => {
    try {
      await apiRegister(username, password);
      // Automatically log in after successful registration
      return await login(username, password);
    } catch (error) {
      console.error("Registration failed", error);
      return false;
    }
  };

  const logout = () => {
    localStorage.clear();
    setUser(null);
  };

  const value = {
    user,
    isLoggedIn: !!user,
    loading,
    login,
    register,
    logout,
  };

  return (
    <AuthContext.Provider value={value}>
      {!loading && children}
    </AuthContext.Provider>
  );
};