import axios from 'axios';

// It should be used by all Pinia stores.

const api = axios.create({
  // The baseURL is set to '/api/' to match the paths in your YAML file.
  // This assumes the frontend is served from the same domain as the backend.
  baseURL: 'http://13.48.136.207/api/',
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
    'Accept': 'application/json',
  },
});

// Request interceptor to add the auth token to every request.
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('auth_token');
    if (token) {
      // IMPORTANT: Changed "Bearer" to "Token" to match your API specification.
      config.headers.Authorization = `Token ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor to handle 401 Unauthorized errors globally.
// This will log the user out if the server invalidates their token.
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      console.error("Authentication Error: Token is invalid or expired.");
      // Clear user data from storage and redirect to the login page.
      localStorage.removeItem('auth_user');
      localStorage.removeItem('auth_token');
      window.location.href = '/login?message=session_expired';
    }
    return Promise.reject(error);
  }
);

export default api;