import { ReactNode } from "react";
import styles from "./Badge.module.css";

interface BadgeProps {
  children: ReactNode;
  color?: "red" | "blue" | "green" | "yellow" | "gray" | "orange" | "indigo" | "purple" | "teal";
}

export function Badge({ children, color = "gray" }: BadgeProps) {
  return (
    <span className={`${styles.badge} ${styles[color]}`}>
      {children}
    </span>
  );
}