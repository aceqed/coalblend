import { Navigate, Outlet } from "react-router-dom";

const ProtectedRoute = ({ user, redirect = "/login", children }) => {
  if (!user) return <Navigate to={redirect} replace />;
  return children || <Outlet />;
};

export default ProtectedRoute;
