"use client";
import { useEffect, useState } from "react";
import { Menu } from "lucide-react";
import { useRouter } from "next/navigation";
import { SidebarPaseador } from "@/components/SidebarPaseador";
import { useAuth } from "@/lib/auth";
import "./tailwind.css";

export default function PaseadorLayout({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth();
  const router = useRouter();
  // En celular la barra lateral se esconde y se abre con el botón ☰ del encabezado
  const [menuAbierto, setMenuAbierto] = useState(false);

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
      <SidebarPaseador abierto={menuAbierto} onCerrar={() => setMenuAbierto(false)} />
      <div className="flex-1 flex flex-col min-w-0">
        <header className="h-16 bg-white border-b flex items-center justify-between px-4 md:px-6 shrink-0">
          <div className="flex items-center gap-2">
            <button onClick={() => setMenuAbierto(true)} aria-label="Abrir menú"
              className="md:hidden p-2 -ml-2 rounded-lg text-gray-700 hover:bg-gray-100">
              <Menu className="w-6 h-6" />
            </button>
            <h1 className="text-lg font-semibold text-gray-900">Portal del Paseador</h1>
          </div>
          <div className="hidden sm:block text-sm text-gray-500">
            {new Date().toLocaleDateString("es-CO", { weekday: "long", year: "numeric", month: "long", day: "numeric" })}
          </div>
        </header>
        <main className="flex-1 p-4 md:p-6 overflow-x-auto">{children}</main>
      </div>
    </div>
  );
}