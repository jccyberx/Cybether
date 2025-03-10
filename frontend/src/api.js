import axios from 'axios';

// Get API URL from environment or use default
// Use window.location.hostname to ensure we're connecting to the same host
const apiUrl = process.env.REACT_APP_API_URL || `http://${window.location.hostname}:5001`;

console.log(`Using API URL: ${apiUrl}`);

const api = axios.create({
  baseURL: apiUrl,
  headers: {
    'Content-Type': 'application/json',
  },
  withCredentials: false, // Change to false to simplify CORS issues
  timeout: 10000, // Add a reasonable timeout
});

// Request interceptor
api.interceptors.request.use(
  (config) => {
    console.log(`Making request to: ${config.url}`);
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    console.error('Request error:', error);
    return Promise.reject(error);
  }
);

// Response interceptor
api.interceptors.response.use(
  (response) => {
    return response;
  },
  async (error) => {
    console.error('Response error:', error.response || error.message);
    
    // If the request failed due to network issues, try to provide a helpful message
    if (!error.response) {
      console.error('Network error - could not connect to the API server');
      // Consider showing a user-friendly error message
      // alert('Cannot connect to the server. Please check if the backend is running.');
    }
    
    const originalRequest = error.config;

    // If the error status is 401 and there is no originalRequest._retry flag,
    // it means the token has expired and we need to refresh it
    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;

      try {
        // Use the same baseURL for the refresh token request
        const refreshUrl = `${api.defaults.baseURL}/api/refresh-token`;
        const refreshToken = localStorage.getItem('refresh_token');
        
        // Only attempt refresh if we have a refresh token
        if (!refreshToken) {
          throw new Error('No refresh token available');
        }
        
        const response = await axios.post(refreshUrl, {}, {
          headers: {
            'Authorization': `Bearer ${refreshToken}`
          }
        });

        const { token } = response.data;
        localStorage.setItem('token', token);
        api.defaults.headers.common['Authorization'] = `Bearer ${token}`;
        originalRequest.headers['Authorization'] = `Bearer ${token}`;

        return api(originalRequest);
      } catch (refreshError) {
        // If refresh token fails, redirect to login
        console.error('Token refresh failed:', refreshError);
        localStorage.removeItem('token');
        localStorage.removeItem('refresh_token');
        localStorage.removeItem('isAdmin');
        localStorage.removeItem('username');
        window.location.href = '/login';
        return Promise.reject(refreshError);
      }
    }

    // If the error status is 422 (invalid token)
    if (error.response?.status === 422) {
      localStorage.removeItem('token');
      localStorage.removeItem('refresh_token');
      localStorage.removeItem('isAdmin');
      localStorage.removeItem('username');
      window.location.href = '/login';
    }

    return Promise.reject(error);
  }
);

export default api;