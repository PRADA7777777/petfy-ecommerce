"use client";

import { useEffect } from "react";
import { useSearchParams, useRouter } from "next/navigation";

export default function AuthBanner() {
    const params = useSearchParams();
    const router = useRouter();
    const motivo = params.get("motivo");

    // Limpia ?motivo de la URL después de 5s sin recargar la página
    useEffect(() => {
        if (!motivo) return;
        const t = setTimeout(() => {
            const url =
                window.location.pathname + window.location.hash;
            router.replace(url, { scroll: false });
        }, 5000);
        return () => clearTimeout(t);
    }, [motivo, router]);

    if (!motivo) return null;

    const mensajes: Record<string, string> = {
        "usuario-no-encontrado": "Tu cuenta ya no existe. Regístrate de nuevo.",
        "token-invalido": "Tu sesión expiró. Inicia sesión otra vez.",
        "red-caida": "Se perdió la conexión con el servidor. Intenta de nuevo.",
    };

    return (
        <div className="auth-banner">
            ⚠️ {mensajes[motivo] ?? "Debes iniciar sesión para continuar."}
        </div>
    );
}