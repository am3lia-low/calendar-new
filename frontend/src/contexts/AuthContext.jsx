import React, { createContext, useContext, useState, useEffect } from 'react';
import { login as apiLogin, register as apiRegister, getProfile as apiGetProfile } from '../services/api';
import toast from 'react-hot-toast'; 

const AuthContext = createContext(null);
const API_BASE_URL = 'http://localhost:5001'; 

export const useAuth = () => useContext(AuthContext);

export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(null); 
    const [profile, setProfile] = useState(null); 
    const [loading, setLoading] = useState(true); 

    const isAuthenticated = !!user;

    const getFullPhotoUrl = (url) => {
        if (!url) return null;
        return `${API_BASE_URL}${url}`;
    };

    // Reverted: loadUserData is no longer wrapped in useCallback and does not rely on the `isAuthenticated` state
    const loadUserData = async () => {
        const token = localStorage.getItem('access_token');
        
        if (!token) {
            setProfile(null);
            setUser(null);
            setLoading(false);
            return;
        }

        try {
            const profileResponse = await apiGetProfile();
            const userData = profileResponse.data;

            setProfile({
                ...userData,
                photoUrl: getFullPhotoUrl(userData.photo_url || userData.photoUrl)
            });

            // Set user with actual data on successful load
            setUser({ id: userData.id, username: userData.username }); 
            
        } catch (error) {
            console.error("Failed to load user data:", error);
            localStorage.clear();
            setUser(null);
        } finally {
            setLoading(false); 
        }
    };

    // Reverted: The two separate useEffects have been merged into one
    // running only on mount, directly calling loadUserData if a token exists.
    // This configuration often causes issues with stale data or dependency warnings (the error you previously fixed).
    useEffect(() => {
        const token = localStorage.getItem('access_token');
        if (token) {
            // Directly call loadUserData on mount if token is found
            loadUserData();
        } else {
            setLoading(false);
        }
    }, []); 

    const login = async (username, password) => {
        try {
            const response = await apiLogin(username, password);
            const { access_token } = response.data;
            
            localStorage.setItem('access_token', access_token); 
            
            // Reverted: Directly call loadUserData after setting token, instead of using a minimal state to trigger a separate effect
            await loadUserData(); 

            toast.success("Login successful!");
            return true;
        } catch (error) {
            console.error("Login failed", error);
            toast.error("Login failed. Check username/password.");
            return false;
        }
    };

    const register = async (username, password) => {
        try {
            await apiRegister(username, password);
            return await login(username, password);
        } catch (error) {
            console.error("Registration failed", error);
            toast.error("Registration failed. Try a different username.");
            return false;
        }
    };

    const logout = () => {
        localStorage.clear();
        setUser(null);
        setProfile(null);
        toast('Logged out successfully.', { icon: '👋' });
    };

    const refreshProfile = async () => {
        loadUserData(); 
    };

    const value = {
        user,
        profile,
        isAuthenticated,
        loading,
        login,
        register,
        logout,
        refreshProfile,
    };

    return (
        <AuthContext.Provider value={value}>
            {!loading ? children : (
                <div className="flex justify-center items-center h-screen text-xl text-gray-500">
                    Loading Application...
                </div>
            )}
        </AuthContext.Provider>
    );
};