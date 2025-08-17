import { BrowserRouter as Router, Routes, Route, Navigate, Outlet } from "react-router-dom";
import { Suspense, lazy, useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import axios from "axios";
import ProtectedRoute from "./shared/ProtectedRoute.jsx"; // Rename to ProtectRoute if needed
import { userExits, userNotExits } from "./Redux/authSlice"; // update this path as needed

// Configure axios defaults
axios.defaults.baseURL = "http://34.123.69.231:8000"; // Update with your backend URL // here update with local->backend
axios.defaults.withCredentials = true; // Important for cookies

import Login from "./pages/Login.jsx";
import Signup from "./pages/Signup.jsx";
import Dashboard from "./components/Dashboard.jsx";

// Lazy-loaded pages
const KpiDashboard = lazy(() => import("./pages/KpiDashboard.jsx"));
const BlendRecommendation = lazy(() => import("./pages/BlendRecommendation.jsx"));
const SimulationManager = lazy(() => import("./pages/SimulationManager.jsx"));
const InputScreen = lazy(() => import("./pages/InputScreen.jsx"));
const VendorDataUpload = lazy(() => import("./pages/VendorDataUpload.jsx"));
const Prediction = lazy(() => import("./pages/Prediction.jsx"));

const App = () => {
  const dispatch = useDispatch();
  const { user, loader } = useSelector((state) => state.auth);

  useEffect(() => {
    const checkAuth = async () => {
      try {
        const { data } = await axios.get("/users/me");
        console.log(data);
        dispatch(userExits(data));
      } catch (error) {
        dispatch(userNotExits());
      }
    };
    checkAuth();
  }, [dispatch]);

  if (loader) return <div>Loading...</div>;

  return (
    <Router>
      <Suspense fallback={<div>Loading...</div>}>
        <Routes>
          {/* Protected routes grouped */}
          <Route
            element={
              <ProtectedRoute user={user}>
                <Outlet />
              </ProtectedRoute>
            }
          >
            <Route path="/" element={<Dashboard />} />
            <Route path="/kpi-dashboard" element={<KpiDashboard />} />
            <Route path="/blend-recommendation" element={<BlendRecommendation />} />
            <Route path="/simulation-manager" element={<SimulationManager />} />
            <Route path="/input-screen" element={<InputScreen />} />
            <Route path="/vendor-data-upload" element={<VendorDataUpload />} />
            <Route path="/prediction" element={<Prediction />} />
          </Route>

          {/* Public routes for unauthenticated users */}
          <Route
            path="/login"
            element={
              <ProtectedRoute user={!user} redirect="/">
                <Login />
              </ProtectedRoute>
            }
          />
          <Route
            path="/signup"
            element={
              <ProtectedRoute user={!user} redirect="/">
                <Signup />
              </ProtectedRoute>
            }
          />

          {/* Catch-all */}
          <Route path="*" element={<Navigate to={user ? "/" : "/login"} />} />
        </Routes>
      </Suspense>
    </Router>
  );
};

export default App;
