/**
 * ProtectedRoute — redirects unauthenticated users to login.
 */
import { useAuthStore } from "../store/useAuthStore";
import type { ReactNode } from "react";

interface ProtectedRouteProps {
  children: ReactNode;
  onRedirectToLogin: () => void;
}

export default function ProtectedRoute({
  children,
  onRedirectToLogin,
}: ProtectedRouteProps) {
  const { isAuthenticated } = useAuthStore();

  if (!isAuthenticated) {
    // Trigger redirect on next render
    onRedirectToLogin();
    return null;
  }

  return <>{children}</>;
}
