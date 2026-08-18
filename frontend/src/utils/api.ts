import axios from 'axios';

const API_BASE_URL = `http://${window.location.hostname}:3001/api/v1`;

export const apiClient = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
    // In production, add JWT token from auth context
    // 'Authorization': `Bearer ${token}`
  },
});

// Mock JWT token for development
apiClient.interceptors.request.use((config) => {
  // Add mock JWT token if needed
  const mockToken = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxIiwibmFtZSI6IkFkbWluIFVzZXIifQ.mock';
  if (!config.headers.Authorization) {
    config.headers.Authorization = `Bearer ${mockToken}`;
  }
  return config;
});

apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    console.error('API Error:', error.response?.status, error.response?.data);
    return Promise.reject(error);
  },
);

export default apiClient;
