"use client";

import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { LayoutDashboard, CreditCard, PawPrint, Users, ShieldCheck, UserCheck, X } from "lucide-react";
import styles from "./Sidebar.module.css";

interface SidebarProps {
  onClose: () => void;
}

export function Sidebar({ onClose }: SidebarProps) {
  const pathname = usePathname();

  const menuItems = [
    { name: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
    { name: "Finanzas", href: "/finanzas", icon: CreditCard },
    { name: "Paseos", href: "/servicios/paseos", icon: PawPrint },
    {
      name: "Usuarios",
      icon: Users,
      subItems: [
        { name: "Administradores", href: "/usuarios/administradores", icon: ShieldCheck },
        { name: "Clientes", href: "/usuarios/clientes", icon: UserCheck },
        { name: "Staff", href: "/usuarios/staff", icon: Users },
      ]
    }
  ];

  return (
    <aside className={styles.sidebar}>
      <div className={styles.logoContainer}>
        <Link href="/dashboard" className={styles.logoLink} onClick={onClose}>
          {/* Asegúrate de que este nombre coincida con tu archivo en public/assets/img */}
          <Image 
            src="/assets/img/Logo-Petfy-renovado-2.png" 
            alt="Petfy Isotipo" 
            width={32} 
            height={32} 
            className={styles.logoImage}
          />
          <span className={styles.logoText}>Petfy Admin</span>
        </Link>
        <button className={styles.closeBtn} onClick={onClose}>
          <X size={20} />
        </button>
      </div>

      <nav className={styles.nav}>
        <div>
          <p className={styles.sectionTitle}>General</p>
          <ul className={styles.menuList}>
            {menuItems.filter(item => !item.subItems).map((item) => {
              const isActive = pathname.startsWith(item.href!);
              return (
                <li key={item.name}>
                  <Link href={item.href!} className={`${styles.menuItem} ${isActive ? styles.menuItemActive : ""}`} onClick={onClose}>
                    <item.icon className={`${styles.icon} ${isActive ? styles.iconActive : ""}`} />
                    {item.name}
                  </Link>
                </li>
              );
            })}
          </ul>
        </div>

        {menuItems.filter(item => item.subItems).map((group) => (
          <div key={group.name}>
            <p className={styles.sectionTitle}>{group.name}</p>
            <ul className={styles.menuList}>
              {group.subItems!.map((subItem) => {
                const isActive = pathname.startsWith(subItem.href);
                return (
                  <li key={subItem.name}>
                    <Link href={subItem.href} className={`${styles.menuItem} ${isActive ? styles.menuItemActive : ""}`} onClick={onClose}>
                      <subItem.icon className={`${styles.icon} ${isActive ? styles.iconActive : ""}`} />
                      {subItem.name}
                    </Link>
                  </li>
                );
              })}
            </ul>
          </div>
        ))}
      </nav>
    </aside>
  );
}