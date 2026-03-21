import type { ReactNode } from "react";
import { Navigate } from "react-router-dom";
import { getStoredToken } from "../utils/auth";

interface AuthGuardProps {
  children: ReactNode;
}

export function AuthGuard({ children }: AuthGuardProps) {
  const token = getStoredToken();

  if (!token) {
    return <Navigate to="/admin/login" replace />;
  }

  return children;
}
