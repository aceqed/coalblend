import { Link } from "react-router-dom";

function DashboardCard({ title, icon, path }) {
  // Define modern color themes based on card function
  const getCardTheme = (title) => {
    const themes = {
      "KPI Dashboard": {
        gradient: "bg-gradient-to-br from-blue-500 to-blue-600",
        hoverGradient: "hover:from-blue-600 hover:to-blue-800",
        iconBg: "bg-white/20",
        shadow: "shadow-blue-400/15",
      },
      "Blend Recommendation": {
        gradient: "bg-gradient-to-br from-emerald-500 to-emerald-600",
        hoverGradient: "hover:from-emerald-600 hover:to-emerald-800",
        iconBg: "bg-white/20",
        shadow: "shadow-emerald-400/15",
      },
      "Simulation Manager": {
        gradient: "bg-gradient-to-br from-purple-500 to-purple-600",
        hoverGradient: "hover:from-purple-600 hover:to-purple-800",
        iconBg: "bg-white/20",
        shadow: "shadow-purple-400/15",
      },
      "Input Screen": {
        gradient: "bg-gradient-to-br from-orange-500 to-orange-600",
        hoverGradient: "hover:from-orange-600 hover:to-orange-800",
        iconBg: "bg-white/20",
        shadow: "shadow-orange-400/25",
      },
      "Vendor Data Upload": {
        gradient: "bg-gradient-to-br from-indigo-500 to-indigo-600",
        hoverGradient: "hover:from-indigo-600 hover:to-indigo-800",
        iconBg: "bg-white/20",
        shadow: "shadow-indigo-400/25",
      },
      Prediction: {
        gradient: "bg-gradient-to-br from-pink-500 to-pink-600",
        hoverGradient: "hover:from-pink-600 hover:to-pink-800",
        iconBg: "bg-white/20",
        shadow: "shadow-pink-400/25",
      },
    };

    return (
      themes[title] || {
        gradient: "bg-gradient-to-br from-gray-500 to-gray-600",
        hoverGradient: "hover:from-gray-600 hover:to-gray-800",
        iconBg: "bg-white/20",
        shadow: "shadow-gray-100/25",
      }
    );
  };

  const theme = getCardTheme(title);

  return (
    <Link
      to={path}
      className={`block ${theme.gradient} ${theme.hoverGradient} rounded-2xl shadow-xl ${theme.shadow} hover:shadow-2xl transition-all duration-300 transform hover:scale-105 hover:-translate-y-2 group`}
    >
      <div className="p-6 text-white">
        <div
          className={`flex items-center justify-center h-16 w-16 rounded-xl ${theme.iconBg} mb-4 group-hover:scale-110 transition-transform duration-300`}
        >
          <div className="text-white">{icon}</div>
        </div>
        <h3 className="text-lg font-bold text-white leading-tight group-hover:text-white/90 transition-colors duration-300">
          {title}
        </h3>
        <div className="mt-2 w-8 h-1 bg-white/30 rounded-full group-hover:w-12 group-hover:bg-white/50 transition-all duration-300"></div>
      </div>
    </Link>
  );
}

export default DashboardCard;
