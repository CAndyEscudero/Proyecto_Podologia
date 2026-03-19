import { Navigate } from "react-router-dom";
import { getStoredToken } from "../utils/auth";

export function AuthGuard({ children }) {
  const token = getStoredToken();

  if (!token) {
    return <Navigate to="/admin/login" replace />;
  }

  return children;
}
