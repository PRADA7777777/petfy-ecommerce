"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Home, Map, Wallet, LogOut, Calendar } from "lucide-react";
import { cn } from "@/lib/utils";
import { useAuth } from "@/lib/auth";

const items = [
  { href: "/paseador/dashboard", label: "Mi Ruta", icon: Home },
  { href: "/paseador/agenda", label: "Mi Agenda", icon: Calendar },
  { href: "/paseador/ganancias", label: "Mis Ganancias", icon: Wallet },
];

// En celular (menos de md) la barra va escondida y se abre encima del contenido con el botón ☰ del layout
export function SidebarPaseador({ abierto = false, onCerrar }: { abierto?: boolean; onCerrar?: () => void }) {
  const path = usePathname();
  const { logout, user } = useAuth();

  return (
    <>
    {abierto && <div onClick={onCerrar} className="fixed inset-0 bg-black/40 z-30 md:hidden" />}
    <aside className={cn("w-64 bg-white border-r flex flex-col shrink-0 h-dvh",
      "fixed inset-y-0 left-0 z-40 transition-transform md:sticky md:top-0 md:translate-x-0",
      abierto ? "translate-x-0" : "-translate-x-full")}>
      <div className="h-16 flex items-center gap-2 px-5 border-b">
        <span className="text-2xl">🐾</span>
        <div>
          <div className="font-bold text-gray-900 leading-none">Petfy</div>
          <div className="text-xs text-gray-500">App Paseador</div>
        </div>
      </div>

      <nav className="flex-1 p-3 space-y-1 overflow-y-auto">
        {items.map(({ href, label, icon: Icon }) => (
          <Link key={href} href={href} onClick={onCerrar}
            className={cn("flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors",
              path.startsWith(href) ? "bg-orange-50 text-orange-700" : "text-gray-600 hover:bg-gray-100 hover:text-gray-900")}>
            <Icon className="w-4 h-4" /> {label}
          </Link>
        ))}
      </nav>

      <div className="p-4 border-t bg-gray-50">
        <div className="flex items-center gap-3 mb-3">
          <div className="w-10 h-10 rounded-full bg-orange-100 text-orange-700 flex items-center justify-center font-bold">
            {user?.nombre?.[0]}
          </div>
          <div className="min-w-0">
            <p className="text-sm font-semibold text-gray-900 truncate">{user?.nombre} {user?.apellido}</p>
            <p className="text-xs text-gray-500 truncate">{user?.correo}</p>
          </div>
        </div>
        <button onClick={logout} className="flex items-center justify-center gap-2 w-full px-3 py-2 text-sm text-red-600 bg-red-50 hover:bg-red-100 rounded-lg transition-colors font-medium">
          <LogOut className="w-4 h-4" /> Cerrar sesión
        </button>
      </div>
    </aside>
    </>
  );
}