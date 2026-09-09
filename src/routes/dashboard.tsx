import { createFileRoute } from "@tanstack/react-router";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import { DashboardLayout } from "@/components/dashboard/DashboardLayout";
import { BoardProvider } from "@/context/BoardContext";

export const Route = createFileRoute("/dashboard")({
  component: DashboardShell,
});

function DashboardShell() {
  return (
    <ProtectedRoute>
      <BoardProvider>
        <DashboardLayout />
      </BoardProvider>
    </ProtectedRoute>
  );
}
