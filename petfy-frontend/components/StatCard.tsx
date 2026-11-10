import { LucideIcon } from "lucide-react";
import "./StatCard.css"; // Importación de CSS normal

interface StatCardProps {
    title: string;
    value: string | number;
    hint?: string;
    icon: LucideIcon;
    color?: "blue" | "purple" | "brand" | "green" | "indigo" | "red" | "orange";
}

export function StatCard({ title, value, hint, icon: Icon, color = "blue" }: StatCardProps) {
    // Mapeamos el color naranja a "brand" para mantener la consistencia con tu paleta
    const colorClass = color === "orange" ? "brand" : color;

    return (
        <div className="stat-card">
            <div className="stat-card-content">
                <p className="stat-card-title">{title}</p>
                <p className="stat-card-value">{value}</p>
                {hint && <p className="stat-card-hint">{hint}</p>}
            </div>
            <div className={`stat-card-icon stat-card-${colorClass}`}>
                <Icon size={24} />
            </div>
        </div>
    );
}