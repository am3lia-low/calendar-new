import React, { useState } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { Navigate } from 'react-router-dom'; // Removed useNavigate

const Login = () => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [isRegister, setIsRegister] = useState(false);
  const [error, setError] = useState('');
  // Removed redirecting state
  // Reverted context destructuring to isAuthenticated and loading
  const { login, register, isAuthenticated, loading } = useAuth();

  // Removed const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    // Removed console.log
    setError('');
    
    let success;
    if (isRegister) {
      success = await register(username, password);
    } else {
      success = await login(username, password);
    }

    if (!success) {
      setError(isRegister ? 'Registration failed.' : 'Invalid username or password.');
    }
    // Removed setRedirecting(true) logic, redirection now relies on isAuthenticated updating
  };

  // Handle loading state (important since AuthContext was also reverted)
  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-water-bg-light">
        <p className="text-xl text-water-blue-end animate-pulse">Loading...</p>
      </div>
    );
  }

  // If user is authenticated, redirect to the main app
  // Reverted to check isAuthenticated
  if (isAuthenticated) {
    return <Navigate to="/" replace />;
  }

  return (
    <div className="flex items-center justify-center min-h-screen bg-water-bg-light">
      <form 
        onSubmit={handleSubmit} 
        className="bg-white p-8 rounded-lg shadow-water w-full max-w-sm"
      >
        <h2 className="text-3xl font-bold mb-6 text-center text-water-blue-end">
          {isRegister ? 'Create Account' : 'Welcome Back'}
        </h2>
        
        {error && <p className="text-red-500 text-center mb-4">{error}</p>}
        
        <div className="mb-4">
          <label className="block text-gray-700 mb-2" htmlFor="username">Username</label>
          <input
            type="text"
            id="username"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-water-blue-mid"
            required
          />
        </div>
        <div className="mb-6">
          <label className="block text-gray-700 mb-2" htmlFor="password">Password</label>
          <input
            type="password"
            id="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-water-blue-mid"
            required
          />
        </div>
        
        <button 
          type="submit" 
          className="w-full bg-gradient-to-r from-water-blue-mid to-water-blue-end text-white py-2 rounded-lg font-semibold shadow-lg hover:shadow-xl transition-all"
        >
          {isRegister ? 'Register' : 'Login'}
        </button>
        
        <p className="text-center mt-6 text-sm">
          {isRegister ? 'Already have an account?' : "Don't have an account?"}
          <button 
            type="button" 
            onClick={() => {
              setIsRegister(!isRegister);
              setError('');
            }}
            className="text-water-blue-end font-semibold ml-1 hover:underline"
          >
            {isRegister ? 'Login' : 'Sign Up'}
          </button>
        </p>
      </form>
    </div>
  );
};

export default Login;