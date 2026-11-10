"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Sidebar } from "./_components/Sidebar"; 
import { Topbar } from "@/components/Topbar"; 
import { useAuth } from "@/context/AuthContext";
import styles from "./layout.module.css"; 

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const { user, loading, logout } = useAuth();
  const router = useRouter();
  const [sidebarAbierto, setSidebarAbierto] = useState(false);

  useEffect(() => {
    if (!loading && (!user || user.id_rol !== 1)) {
      router.replace("/");
    }
  }, [user, loading, router]);

  if (loading || !user || user.id_rol !== 1) {
    return <div className={styles.loading}>Cargando panel...</div>;
  }

  return (
    <div className={styles.adminContainer}>
      {sidebarAbierto && (
        <div className={styles.overlay} onClick={() => setSidebarAbierto(false)} />
      )}
      
      <div className={`${styles.sidebarWrapper} ${sidebarAbierto ? styles.sidebarOpen : ""}`}>
        <Sidebar onClose={() => setSidebarAbierto(false)} />
      </div>

      <div className={styles.mainContent}>
        <Topbar 
          onMenuClick={() => setSidebarAbierto(!sidebarAbierto)} 
          onLogout={logout} 
        />
        <main className={styles.pageContent}>
          {children}
        </main>
      </div>
    </div>
  );
}