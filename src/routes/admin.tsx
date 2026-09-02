import { createFileRoute } from "@tanstack/react-router";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import { AdminPage } from "@/pages/AdminPage";

export const Route = createFileRoute("/admin")({
  head: () => ({
    meta: [
      { title: "Admin Panel — NSAGPT" },
      { name: "description", content: "Manage NSAGPT reviews, users and exam boards." },
      { property: "og:title", content: "Admin Panel — NSAGPT" },
      { property: "og:description", content: "Administrator tools for the NSAGPT platform." },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: AdminRoute,
});

function AdminRoute() {
  return (
    <ProtectedRoute>
      <div className="min-h-screen bg-slate-50 dark:bg-slate-950 p-4 sm:p-8">
        <AdminPage />
      </div>
    </ProtectedRoute>
  );
}
