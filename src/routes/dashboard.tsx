import { createFileRoute } from "@tanstack/react-router";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import { DashboardLayout } from "@/components/dashboard/DashboardLayout";
import { BoardProvider } from "@/context/BoardContext";
import { LanguageProvider } from "@/context/LanguageContext";

export const Route = createFileRoute("/dashboard")({
  component: DashboardShell,
});

function DashboardShell() {
  return (
    <ProtectedRoute>
      <LanguageProvider>
        <BoardProvider>
          <DashboardLayout />
        </BoardProvider>
      </LanguageProvider>
    </ProtectedRoute>
  );
}
