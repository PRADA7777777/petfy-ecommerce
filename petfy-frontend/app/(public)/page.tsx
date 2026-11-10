import Header from "./_components/Header";
import Inicio from "./_components/Inicio";
import Servicios from "./_components/Servicios";
import Nosotros from "./_components/Nosotros";
import Contacto from "./_components/Contacto";
import Resenas from "./_components/Resenas";
import Footer from "./_components/Footer";
import ModalManager from "./_components/ModalManager";
import AuthBanner from "./_components/AuthBanner";
import ModalRecuperar from "./_components/ModalRecuperar";
import { Metadata } from "next";
import { Suspense } from "react";

export default function Home() {
  return (
    <>
      <Header />
      <Suspense fallback={null}>
        <AuthBanner />
      </Suspense>
      <main>
        <Inicio />
        <Servicios />
        <Nosotros />
        <Contacto />
        <Resenas />
      </main>
      <Footer />
      <ModalManager />
    </>
  );
}