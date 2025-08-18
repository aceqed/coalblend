import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useSelector, useDispatch } from "react-redux";
import DashboardCard from "../shared/DashboardCard.jsx";
import { Grid, Network, FileUp, Edit, Play, ChevronDown, User, LogOut } from "lucide-react";
import { logout } from "../Redux/authSlice";
import axios from "axios";

function Dashboard() {
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const navigate = useNavigate();
  const dispatch = useDispatch();

  // Get user data from Redux store
  const { user, loader } = useSelector((state) => state.auth);

  // Check authentication and redirect if needed
  if (loader) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  if (!user) {
    navigate("/login");
    return null;
  }

  const handleLogout = async () => {
    try {
      await axios.post("/logout");
      dispatch(logout());
      navigate("/login");
    } catch (error) {
      console.error("Error during logout:", error);
    }
  };

  // Dashboard card data
  const dashboardCards = [
    // {
    //   id: "kpi-dashboard",
    //   title: "KPI Dashboard",
    //   icon: <Grid className="h-8 w-8" />,
    //   path: "/kpi-dashboard",
    // },
    // {
    //   id: "blend-recommendation",
    //   title: "Blend Recommendation",
    //   icon: <Network className="h-8 w-8" />,
    //   path: "/blend-recommendation",
    // },
    {
      id: "simulation-manager",
      title: "Simulation Manager",
      icon: <Play className="h-8 w-8" strokeWidth={1.5} />,
      path: "/simulation-manager",
    },
    // {
    //   id: "input-screen",
    //   title: "Input Screen",
    //   icon: <Edit className="h-8 w-8" />,
    //   path: "/input-screen",
    // },
    {
      id: "vendor-data-upload",
      title: "Vendor Data Upload",
      icon: <FileUp className="h-8 w-8" />,
      path: "/vendor-data-upload",
    },
    {
      id: "prediction",
      title: "Prediction",
      icon: <Play className="h-8 w-8" strokeWidth={1.5} />,
      path: "/prediction",
    },
     {
      id: "Help",
      title: "Help",
      icon: <Play className="h-8 w-8" strokeWidth={1.5} />,
      path: "/Help",
    },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100">
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
          <div className="relative">
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
                    <span className="font-medium text-gray-800 text-sm ">IAM</span>
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

      {/* Main Dashboard Content */}
      <div className="px-3 py-8">
        <div className="max-w-5xl">
          {/* Welcome section - compact */}
        

          {/* Dashboard Cards Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-3 lg:grid-cols-4 gap-5">
            {dashboardCards.map((card) => (
              <DashboardCard key={card.id} title={card.title} icon={card.icon} path={card.path} />
            ))}
          </div>
        </div>
      </div>

      {/* Compact Footer */}
      <div className="bg-white/80 border-t border-gray-200/50 px-2 py-2 mt-6">
        <div className="flex items-center justify-between max-w-7xl mx-auto">
          <div className="flex items-center space-x-3">
            <div className="flex items-center">
              <span className="text-lg font-bold bg-gradient-to-r from-yellow-500 to-orange-500 bg-clip-text text-transparent">
                QED
              </span>
              <span className="text-lg font-bold text-gray-700 ml-1">Analytics</span>
            </div>
            <span className="text-gray-500 text-xs"> 2025 All rights reserved</span>
          </div>
          <div className="flex items-center space-x-3">
            <div className="px-2 py-1 bg-green-100 text-green-700 text-xs font-semibold rounded-full">
              ● Online
            </div>
            <span className="text-gray-500 text-xs font-medium">v2.1.0</span>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Dashboard;
