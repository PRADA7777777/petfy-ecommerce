"use client";

import {createContext, useContext, useState, ReactNode} from "react";

type ModalType = "oferta" | "login" | "registro" | null;

interface ModalContextProps {

    modal: ModalType;
    openModal: (type:ModalType) => void;
    closeModal: () => void;
    openOferta: () => void;
    openLogin: () => void;
    openRegistro: () => void;

}

const ModalContext = createContext<ModalContextProps | undefined>(undefined);

export function  ModalProvider ({ children }: { children: ReactNode}) {

    const [modal, setModal] = useState<ModalType>(null);

    const openModal = (type: ModalType) => setModal(type);
    const closeModal = () => setModal(null);
    const openOferta = () => setModal("oferta");
    const openLogin = () => setModal("login");
    const openRegistro = () => setModal("registro");

    return (

        <ModalContext.Provider value={{ modal, openModal, closeModal, openOferta, openLogin, openRegistro}}>
            {children}
            </ModalContext.Provider>
    );
}

export function useModal() {

    const context = useContext(ModalContext);
    if(!context) throw new Error ("useModal must be used within a ModalProvider");
    return context;
}