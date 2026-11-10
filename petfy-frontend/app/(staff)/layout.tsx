"use client";
import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { SidebarPaseador } from "@/components/SidebarPaseador";
import { useAuth } from "@/lib/auth";

export default function PaseadorLayout({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading) {
      if (!user) router.replace("/login");
      else if (user.id_rol !== 3) router.replace("/dashboard"); // Si es admin, lo enviamos a su panel
    }
  }, [user, loading, router]);

  if (loading || !user || user.id_rol !== 3) {
    return <div className="min-h-screen flex items-center justify-center text-gray-500">Cargando…</div>;
  }

  return (
    <div className="flex min-h-screen bg-gray-50">
      <SidebarPaseador />
      <div className="flex-1 flex flex-col min-w-0">
        <header className="h-16 bg-white border-b flex items-center justify-between px-6 shrink-0">
          <h1 className="text-lg font-semibold text-gray-900">Portal del Paseador</h1>
          <div className="text-sm text-gray-500">
            {new Date().toLocaleDateString("es-CO", { weekday: "long", year: "numeric", month: "long", day: "numeric" })}
          </div>
        </header>
        <main className="flex-1 p-6 overflow-x-auto">{children}</main>
      </div>
    </div>
  );
}