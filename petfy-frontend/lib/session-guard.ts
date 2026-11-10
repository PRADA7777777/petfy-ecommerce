// app/lib/session-guard.ts
"use client";

import { AUTH_ERROR_EVENT, AuthErrorDetail, sesion } from "./api";

let yaRedirigiendo = false;

/**
 * Escucha el evento global de sesión y redirige al landing.
 * Devuelve un cleanup para usar en useEffect.
 */
export function instalarSessionGuard(router: { replace: (url: string) => void }) {
    if (typeof window === "undefined") return () => { };

    const handler = (ev: Event) => {
        if (yaRedirigiendo) return;
        yaRedirigiendo = true;

        const detail = (ev as CustomEvent<AuthErrorDetail>).detail;
        const motivo = detail?.motivo || "otro";

        // Log para debugging
        console.warn("[petfy] sesión cerrada:", detail);

        // 1. Cerrar sesión local
        try {
            sesion.cerrar();
        } catch {
            /* noop */
        }

        // 2. Redirigir al landing con un query para mostrar mensaje
        const destino = `/?motivo=${encodeURIComponent(motivo)}`;
        router.replace(destino);

        // 3. Fallback duro: si en 1s el router no cambió, forzamos window.location
        setTimeout(() => {
            if (typeof window !== "undefined") {
                const enLanding =
                    window.location.pathname === "/" ||
                    window.location.pathname === "";
                if (!enLanding) {
                    window.location.href = destino;
                }
            }
            // rearamar el guard por si el usuario vuelve a autenticarse
            setTimeout(() => {
                yaRedirigiendo = false;
            }, 500);
        }, 1000);
    };

    window.addEventListener(AUTH_ERROR_EVENT, handler);
    return () => window.removeEventListener(AUTH_ERROR_EVENT, handler);
}