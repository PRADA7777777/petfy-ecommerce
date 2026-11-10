// app/(cliente)/layout.tsx
import "./styles/perfil_layout.css";
import "./styles/dashboard.css";
import "./styles/mascotas.css";
import "./styles/datos.css";
import "./styles/modales.css";

export default function PerfilLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}