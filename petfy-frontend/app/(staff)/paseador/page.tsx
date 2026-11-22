// Después del login el paseador llega a /paseador (AuthContext); su inicio es el dashboard.
import { redirect } from "next/navigation";

export default function PaseadorInicio() {
  redirect("/paseador/dashboard");
}
