"use client";

import { useState } from "react";
import { useModal } from "../_context/ModalContext";
import ModalOferta from "./ModalOferta";
import ModalLogin from "./ModalLogin";
import ModalRegistro from "./ModalRegistro";
import ModalVerificacion from "./ModalVerificacion";
import ModalRecuperar from "./ModalRecuperar";

export default function ModalManager() {
    const { modal, closeModal, openLogin, openRegistro } = useModal();

    const [verificacion, setVerificacion] = useState<{ correo: string; nombre: string } | null>(null);

    const [isRecuperarOpen, setIsRecuperarOpen] = useState(false);

    return (
        <>
            <ModalOferta
                isOpen={modal === "oferta"}
                onClose={() => {
                    closeModal();
                    localStorage.setItem("ofertaVista", "true");
                }}
                onReclamar={() => {
                    closeModal();
                    openRegistro();
                }}
            />

            <ModalLogin
                isOpen={modal === "login"}
                onClose={closeModal}
                onRegistroClick={() => {
                    closeModal();
                    openRegistro();
                }}

                onRecuperarClick={() => {
                    closeModal();
                    setIsRecuperarOpen(true);
                }}
            />

            <ModalRegistro
                isOpen={modal === "registro"}
                onClose={closeModal}
                onLoginClick={() => {
                    closeModal();
                    openLogin();
                }}
                onVerificacionClick={(correo, nombre) => {
                    closeModal();
                    setVerificacion({ correo, nombre });
                }}
            />

            {verificacion && (
                <ModalVerificacion
                    isOpen={true}
                    correo={verificacion.correo}
                    nombre={verificacion.nombre}
                    onClose={() => setVerificacion(null)}
                    onVerificado={() => {
                        setVerificacion(null);
                        openLogin();
                    }}
                />
            )}

            {/* 🔥 NUEVO: Renderizamos el modal de recuperación */}
            <ModalRecuperar
                isOpen={isRecuperarOpen}
                onClose={() => setIsRecuperarOpen(false)}
                onLoginClick={() => {
                    setIsRecuperarOpen(false);
                    openLogin();
                }}
            />
        </>
    );
}