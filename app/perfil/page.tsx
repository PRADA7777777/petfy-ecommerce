// app/perfil/page.tsx
"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { sesion, mascotasAPI, citasAPI, Mascota, Usuario } from "../lib/api";
import Topbar from "./components/Topbar";
import Sidebar from "./components/Sidebar";
import VistaInicio from "./components/VistaInicio";
import VistaPaseos from "./components/VistaPaseos";
import VistaMascotas from "./components/VistaMascotas";
import VistaDatos from "./components/VistaDatos";
import VistaFacturacion from "./components/VistaFacturacion";
import VistaProximamente from "./components/VistaProximamente";
import ModalMascota from "./components/ModalMascota";
import AgendamientoWizard from "./components/agendamiento/AgendamientoWizard";
import PantallaCarga from "../components/PantallaCarga";
import { instalarSessionGuard } from "../lib/session-guard";
import "./perfil.css";

export type Vista = "inicio" | "servicios" | "mascotas" | "datos" | "facturacion";
export type Servicio = "paseos" | "guarderia" | "banos" | "veterinaria" | "entrenamiento";

export default function PerfilPage() {
  const router = useRouter();
  const [usuario, setUsuario] = useState<Usuario | null>(null);
  const [listo, setListo] = useState(false);
  const [vistaActiva, setVistaActiva] = useState<Vista>("inicio");
  const [servicioActivo, setServicioActivo] = useState<Servicio>("paseos");
  const [mascotas, setMascotas] = useState<Mascota[]>([]);
  const [mascotaEditar, setMascotaEditar] = useState<Mascota | null>(null);
  const [mascotaParaAgendar, setMascotaParaAgendar] = useState<number | null>(null);

  // Estados de UI
  const [wizardAbierto, setWizardAbierto] = useState(false);
  const [modalMascotaAbierto, setModalMascotaAbierto] = useState(false);
  const [sidebarMovilAbierto, setSidebarMovilAbierto] = useState(false);
  const [cargandoMinimo, setCargandoMinimo] = useState(true);
  const [redirigiendo, setRedirigiendo] = useState(false);
  const [paseosRecargarKey, setPaseosRecargarKey] = useState(0);



  // Cerrar sidebar móvil al agrandar la ventana
  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth > 768 && sidebarMovilAbierto) {
        setSidebarMovilAbierto(false);
      }
    };
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, [sidebarMovilAbierto]);

  // Cargar usuario
  useEffect(() => {
    const timer = setTimeout(() => {
      const u = sesion.obtenerUsuario();
      if (!u) {
        router.replace("/");
        return;
      }
      setUsuario(u);
      setListo(true);
    }, 0);
    return () => clearTimeout(timer);
  }, [router]);

  useEffect(() => {
  const cleanup = instalarSessionGuard(router);
  return cleanup;
}, [router])

  // pantalla de carga 
  useEffect(() => {
    const t = setTimeout(() => setCargandoMinimo(false), 1500);
    return () => clearTimeout(t);
  }, []);

  // Cargar mascotas
  useEffect(() => {
    if (!usuario) return;

    const token = sesion.obtenerToken();
    if (!token) {
      sesion.cerrar();
      router.replace("/");
      return;
    }

    let cancelado = false;
    mascotasAPI
      .listar(token)
      .then((data) => {
        if (!cancelado) setMascotas(Array.isArray(data) ? data : []);
      })
      .catch((e) => {
        if (!cancelado) {
          console.error("Error cargando mascotas:", e);
          setMascotas([]);
        }
      });

    return () => {
      cancelado = true;
    };
  }, [usuario, router]);

  const recargarMascotas = () => {
    const token = sesion.obtenerToken();
    if (!token) return;
    mascotasAPI
      .listar(token)
      .then((data) => setMascotas(Array.isArray(data) ? data : []))
      .catch((e) => {
        console.error("Error cargando mascotas:", e);
        setMascotas([]);
      });
  };

  const handleLogout = () => {
    sesion.cerrar();
    router.replace("/");
  };

  const cambiarVista = (v: Vista) => {
    setVistaActiva(v);
    setSidebarMovilAbierto(false);
  };

  const cambiarServicio = (s: Servicio) => {
    setServicioActivo(s);
    setVistaActiva("servicios");
    setSidebarMovilAbierto(false);
  };

  const abrirNuevaMascota = () => {
    setMascotaEditar(null);
    setModalMascotaAbierto(true);
  };

  const abrirEditarMascota = (m: Mascota) => {
    setMascotaEditar(m);
    setModalMascotaAbierto(true);
  };

  const cerrarModalMascota = () => {
    setModalMascotaAbierto(false);
    setMascotaEditar(null);
  };

  const handleGuardadoMascota = async (mascotaGuardada?: Mascota) => {
    const eraNueva = !mascotaEditar;
    cerrarModalMascota();
    recargarMascotas();

    // Si era nueva y el modal nos devolvió la mascota, verificar paseo de bienvenida
    if (eraNueva && mascotaGuardada) {
      const token = sesion.obtenerToken();
      if (!token) return;

      try {
        const r = await citasAPI.paseoPruebaDisponible(mascotaGuardada.id_mascota, token);
        if (r.disponible) {
          setMascotaParaAgendar(mascotaGuardada.id_mascota);
          setWizardAbierto(true);
        }
      } catch (e) {
        console.error("No se pudo verificar el paseo de bienvenida:", e);
      }
    }
  };

  const actualizarUsuario = (u: Usuario) => {
    setUsuario(u);
    if (typeof window !== "undefined") {
      const raw = localStorage.getItem("petfy_usuario");
      try {
        const prev = raw ? JSON.parse(raw) : {};
        localStorage.setItem("petfy_usuario", JSON.stringify({ ...prev, ...u }));
      } catch {
        localStorage.setItem("petfy_usuario", JSON.stringify(u));
      }
    }
  };

  // ─── Pantalla de carga inicial ─────────────────────────────
  if (!listo || !usuario || cargandoMinimo) {
    return <PantallaCarga mensaje="Cargando tu perfil..." />;
  }

  return (
    <>
      <div className="perfil-page">
        <Topbar
          nombreUsuario={usuario.nombre}
          vistaActiva={vistaActiva}
          servicioActivo={servicioActivo}
          sidebarAbierto={sidebarMovilAbierto}
          onCambiarVista={cambiarVista}
          onCambiarServicio={cambiarServicio}
          onToggleSidebar={() => setSidebarMovilAbierto(!sidebarMovilAbierto)}
          onLogout={handleLogout}
        />

        <Sidebar
          nombreUsuario={usuario.nombre}
          vistaActiva={vistaActiva}
          servicioActivo={servicioActivo}
          onCambiarVista={cambiarVista}
          onCambiarServicio={cambiarServicio}
          onLogout={handleLogout}
          sidebarMovilAbierto={sidebarMovilAbierto}
          onCerrarSidebar={() => setSidebarMovilAbierto(false)}
        />

        <main className="perfil-main">
          <div className="container">
            {vistaActiva === "inicio" && (
              <VistaInicio
                usuario={usuario}
                mascotas={mascotas}
                onCambiarVista={cambiarVista}
                onCambiarServicio={cambiarServicio}
                onAgregarMascota={abrirNuevaMascota}
                onAbrirAgendamiento={() => setWizardAbierto(true)}
              />
            )}

            {vistaActiva === "servicios" && (
              <>
                {servicioActivo === "paseos" ? (
                  <VistaPaseos
                    usuario={usuario}
                    onAgendar={() => setWizardAbierto(true)}
                    recargarKey={paseosRecargarKey}
                  />
                ) : (
                  <VistaProximamente servicio={servicioActivo} />
                )}
              </>
            )}

            {vistaActiva === "mascotas" && (
              <VistaMascotas
                mascotas={mascotas}
                onAgregar={abrirNuevaMascota}
                onEditar={abrirEditarMascota}
                onRecargar={recargarMascotas}
              />
            )}

            {vistaActiva === "datos" && (
              <VistaDatos usuario={usuario} onUsuarioActualizado={actualizarUsuario} />
            )}
            {vistaActiva === "facturacion" && <VistaFacturacion />}
          </div>
        </main>

        <ModalMascota
          key={mascotaEditar?.id_mascota ?? "nueva"}
          isOpen={modalMascotaAbierto}
          onClose={cerrarModalMascota}
          onGuardado={handleGuardadoMascota}
          mascotaEditar={mascotaEditar}
        />
      </div>

      {/* 👇 WIZARD: solo se monta cuando wizardAbierto === true */}
      {wizardAbierto && (
        <AgendamientoWizard
          onClose={() => {
            setWizardAbierto(false);
            setMascotaParaAgendar(null);
          }}
          mascotas={mascotas}
          mascotaPreseleccionada={mascotaParaAgendar}
          onExito={() => {
            setWizardAbierto(false);
            setMascotaParaAgendar(null);
            setPaseosRecargarKey((k) => k + 1);
            setRedirigiendo(true);
            setTimeout(() => window.location.reload(), 1800);
          }}
        />
      )}

      {/* 👇 PANTALLA DE CARGA: se muestra al redirigir/recargar */}
      {redirigiendo && <PantallaCarga mensaje="Confirmando tu pago..." />}
    </>
  );
}