import { Link, useNavigate } from "react-router-dom";
import { ChevronDown, Home, LogOut, User } from "lucide-react";
import { useState, useRef, useEffect } from "react";
import { useSelector, useDispatch } from "react-redux";
import { logout } from "../Redux/authSlice";
import axios from "axios";

function PageLayout({ title, children }) {
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const dropdownRef = useRef();
  const navigate = useNavigate();
  const dispatch = useDispatch();

  // Get user data from Redux store
  const { user, loader } = useSelector((state) => state.auth);

  // Check authentication and redirect if needed
  useEffect(() => {
    if (!loader && !user) {
      navigate("/login");
    }
  }, [loader, user, navigate]);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsDropdownOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleLogout = async () => {
    try {
      await axios.post("/logout");
      dispatch(logout());
      navigate("/login");
    } catch (error) {
      console.error("Error during logout:", error);
    }
  };

  if (loader) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-yellow-500"></div>
      </div>
    );
  }

  if (!user) {
    return null;
  }

  return (
    <div className="min-h-screen flex flex-col bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100">
      {/* Header bar */}
      <div className="h-2 bg-gradient-to-r from-yellow-500 via-purple-500 to-gray-500"></div>

      {/* Top navigation with QED Analytics branding and user */}
      <div className="bg-white/90 backdrop-blur-sm border-b border-gray-200/50 px-2 py-2">
        <div className="flex items-center justify-between max-w-7xl mx-auto">
          {/* QED Analytics Branding */}
          <div className="flex items-center space-x-3">
            <div className="flex items-center">
              <span className="text-1xl font-bold bg-gradient-to-r from-yellow-500 to-orange-500 bg-clip-text text-transparent">
                QED
              </span>
              <span className="text-1xl font-bold text-gray-800 ml-1">Analytics</span>
            </div>
          </div>

          {/* User dropdown */}
          <div className="relative" ref={dropdownRef}>
            <button
              className="flex items-center space-x-2 px-3 py-1 bg-gray-50 hover:bg-gray-100 rounded-lg border border-gray-200 transition-all duration-200"
              onClick={() => setIsDropdownOpen(!isDropdownOpen)}
            >
              <div className="w-4 h-4 bg-gradient-to-r from-blue-500 to-purple-500 rounded-full flex items-center justify-center text-white font-bold text-sm">
                {user.name.charAt(0).toUpperCase()}
              </div>
              <span className="text-gray-700 font-medium text-sm">{user.name}</span>
              <ChevronDown className="h-4 w-4 text-gray-500" />
            </button>

            {isDropdownOpen && (
              <div className="absolute right-0 mt-2 w-40 bg-white border border-gray-200 rounded-lg shadow-lg z-100 overflow-hidden">
                <div className="px-4 py-3 border-b border-gray-100">
                  <div className="flex items-center space-x-2">
                    <div className="w-8 h-8 bg-gradient-to-r from-green-500 to-teal-500 rounded-full flex items-center justify-center">
                      <User className="w-4 h-4 text-white" />
                    </div>
                    <span className="font-medium text-gray-800 text-sm">IAM</span>
                  </div>
                </div>
                <button
                  onClick={handleLogout}
                  className="w-full px-4 py-3 flex items-center space-x-2 hover:bg-red-50 transition-colors text-gray-800"
                >
                  <div className="w-8 h-8 bg-gradient-to-r from-red-500 to-pink-500 rounded-full flex items-center justify-center">
                    <LogOut className="w-4 h-4 text-white" />
                  </div>
                  <span className="font-medium text-sm">Logout</span>
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Page header with back button */}
      <div className="px-4 py-1 flex items-center">
        <Link to="/" className="mr-4 p-2 hover:bg-gray-400 rounded-full">
          <Home className="h-5 w-5 text-gray-600" />
        </Link>
        <h1 className="text-xl font-medium text-gray-600">{title}</h1>
      </div>

      {/* Page content */}
      <div className="flex-1">
        <div className="bg-white border border-gray-200 rounded-lg p-4 min-h-[calc(100vh-150px)]">
          {children}
        </div>
      </div>

      {/* Footer */}
      <div className="flex justify-between items-center px-2 py-2 text-xs text-gray-500 border-t">
        <div className="flex items-center">
          <span className="font-medium text-yellow-500">QED</span>
          <span className="font-medium text-gray-700 ml-1">Analyticals</span>
          <span className="ml-2"> 2025</span>
        </div>
        <div>v2.1.0</div>
      </div>
    </div>
  );
}

export default PageLayout;
