// app/components/PantallaCarga.tsx
"use client";

import { useMemo, useSyncExternalStore } from "react";
import Image from "next/image";
import "./PantallaCarga.css";

interface Props {
    mensaje?: string;
}

interface IsoFondo {
    top: number;
    left: number;
    size: number;
    delay: number;
    duration: number;
    rot: number;
    opacity: number;
}

/* Tipo extendido para permitir custom properties CSS */
type CSSWithVars = React.CSSProperties & {
    "--rot-base"?: string;
};

/* Genera los isotipos al azar */
function generarIsos(cantidad = 1): IsoFondo[] {
    return Array.from({ length: cantidad }, () => ({
        top: Math.random() * 88,
        left: Math.random() * 88,
        size: 26 + Math.random() * 48,
        delay: Math.random() * 4,
        duration: 6 + Math.random() * 5,
        rot: Math.random() * 360,
        opacity: 0.07 + Math.random() * 0.08,
    }));
}

/* 👇 Suscripción vacía: no cambia nunca, solo nos sirve para saber si es cliente */
const suscribirNoop = () => () => {};
const getSnapshot = () => true;
const getServerSnapshot = () => false;

export default function PantallaCarga({ mensaje = "Cargando..." }: Props) {
    // 🎯 true en cliente, false en SSR (sin warnings ni mismatch)
    const esCliente = useSyncExternalStore(
        suscribirNoop,
        getSnapshot,
        getServerSnapshot
    );

    // 🎯 Se genera UNA vez (memoizado por esCliente)
    const isos: IsoFondo[] = useMemo(
        () => (esCliente ? generarIsos(16) : []),
        [esCliente]
    );

    return (
        <div className="pantalla-carga">
            {/* Isotipos de fondo al azar */}
            {isos.map((iso, i) => {
                const sizePx = Math.round(iso.size);
                const style: CSSWithVars = {
                    top: `${iso.top}%`,
                    left: `${iso.left}%`,
                    width: `${sizePx}px`,
                    height: `${sizePx}px`,
                    opacity: iso.opacity,
                    animationDelay: `${iso.delay}s`,
                    animationDuration: `${iso.duration}s`,
                    "--rot-base": `${iso.rot}deg`,
                };

                return (
                    <Image
                        key={i}
                        src="/assets/img/Logo-Petfy-renovado.png"
                        alt=""
                        width={sizePx}
                        height={sizePx}
                        className="pc-iso-fondo"
                        style={style}
                        priority={false}
                    />
                );
            })}

            <div className="pc-content">
                {/* Isotipo central con anillo giratorio */}
                <div className="pc-logo">
                    <span className="pc-logo-ring" aria-hidden="true" />
                    <div className="pc-logo-img-wrap">
                        <Image
                            src="/assets/img/Logo-Petfy-renovado.png"
                            alt="Petfy"
                            width={92}
                            height={92}
                            className="pc-logo-icon"
                            priority
                        />
                    </div>
                </div>

                {/* Logo Petfy (texto) */}
                <div className="pc-logo-texto">
                    <Image
                        src="/assets/img/Nombre-Petfy-Naranja.png"
                        alt="Petfy"
                        width={150}
                        height={60}
                        priority
                    />
                </div>

                <p className="pc-mensaje">{mensaje}</p>

                <div className="pc-dots">
                    <span className="pc-dot pc-dot-1" />
                    <span className="pc-dot pc-dot-2" />
                    <span className="pc-dot pc-dot-3" />
                    <span className="pc-dot pc-dot-4" />
                </div>
            </div>
        </div>
    );
}