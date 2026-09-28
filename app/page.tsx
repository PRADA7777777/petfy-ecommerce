import Header from "./components/Header";
import Inicio from "./components/Inicio";
import Servicios from "./components/Servicios";
import Nosotros from "./components/Nosotros";
import Contacto from "./components/Contacto";
import Resenas from "./components/Resenas";
import Footer from "./components/Footer";
import ModalManager from "./components/ModalManager";
import AuthBanner from "./components/AuthBanner";
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
        <Resenas />
        <Nosotros />
        <Contacto />
      </main>
      <Footer />
      <ModalManager />
    </>
  );
}