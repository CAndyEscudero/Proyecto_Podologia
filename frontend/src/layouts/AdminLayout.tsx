import { Outlet } from "react-router-dom";

export function AdminLayout() {
  return (
    <div className="min-h-screen overflow-x-hidden bg-admin-shell">
      <div className="admin-shell-container py-4 lg:py-5 xl:py-6">
        <Outlet />
      </div>
    </div>
  );
}
