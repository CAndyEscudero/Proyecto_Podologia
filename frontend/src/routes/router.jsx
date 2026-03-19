import { createBrowserRouter } from "react-router-dom";
import { AuthGuard } from "../hooks/useAuthGuard";
import { AdminLayout } from "../layouts/AdminLayout";
import { PublicLayout } from "../layouts/PublicLayout";
import { AdminDashboardPage } from "../pages/admin/AdminDashboardPage";
import { AdminLoginPage } from "../pages/admin/AdminLoginPage";
import { BookingPage } from "../pages/public/BookingPage";
import { HomePage } from "../pages/public/HomePage";

export const router = createBrowserRouter([
  {
    element: <PublicLayout />,
    children: [
      { path: "/", element: <HomePage /> },
      { path: "/reservas", element: <BookingPage /> },
    ],
  },
  {
    path: "/admin/login",
    element: <AdminLoginPage />,
  },
  {
    path: "/admin",
    element: (
      <AuthGuard>
        <AdminLayout />
      </AuthGuard>
    ),
    children: [{ path: "dashboard", element: <AdminDashboardPage /> }],
  },
]);
