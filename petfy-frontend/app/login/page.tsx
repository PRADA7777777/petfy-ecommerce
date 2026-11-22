// El portal del paseador (diseño de Oscar) manda a /login cuando no hay sesión.
// El login de Petfy es el modal de "Mi cuenta" del inicio.
import { redirect } from "next/navigation";

export default function Login() {
  redirect("/");
}
