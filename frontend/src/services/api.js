import axios from "axios";

// API configuration
const API_URL = "http://localhost:8000";

// Create axios instance with default config
const api = axios.create({
  baseURL: API_URL,
  withCredentials: true, // Enable cookies
  headers: {
    "Content-Type": "application/json",
    Accept: "application/json",
  },
  timeout: 10000, // 10 second timeout
});

// Add response interceptor to handle errors
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.code === "ERR_NETWORK") {
      console.error("Network error - Please check if the backend server is running");
      return Promise.reject(
        new Error("Unable to connect to the server. Please check if the server is running.")
      );
    }

    if (error.response?.status === 401) {
      // Redirect to login on unauthorized
      window.location.href = "/login";
    }

    return Promise.reject(error);
  }
);

// Auth service functions
export const login = async (email, password) => {
  try {
    const response = await api.post("/login", { email, password });
    return response.data;
  } catch (error) {
    console.error("Login error details:", {
      message: error.message,
      code: error.code,
      response: error.response?.data,
    });
    throw error;
  }
};

export const register = async (userData) => {
  try {
    const response = await api.post("/register", {
      email: userData.email,
      name: userData.name,
      password: userData.password,
    });
    return response.data;
  } catch (error) {
    console.error("Registration error details:", {
      message: error.message,
      code: error.code,
      response: error.response?.data,
    });
    throw error;
  }
};

export const logout = async () => {
  try {
    await api.post("/logout");
  } catch (error) {
    console.error("Logout error:", error);
    throw error;
  }
};

export const getCurrentUser = async () => {
  try {
    const response = await api.get("/users/me");
    return response.data;
  } catch (error) {
    console.error("Get current user error:", error);
    throw error;
  }
};

// Export the api instance as default
export default api;
