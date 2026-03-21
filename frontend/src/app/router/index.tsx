import { createBrowserRouter, type RouteObject } from "react-router-dom";
import { AuthGuard } from "../../shared/hooks/useAuthGuard";
import { AdminLayout } from "../../layouts/AdminLayout";
import { PublicLayout } from "../../layouts/PublicLayout";
import { AdminDashboardPage } from "../../pages/admin/AdminDashboardPage";
import { AdminLoginPage } from "../../pages/admin/AdminLoginPage";
import { BookingPage } from "../../pages/public/BookingPage";
import { HomePage } from "../../pages/public/HomePage";

const routes: RouteObject[] = [
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
];

export const router = createBrowserRouter(routes);
