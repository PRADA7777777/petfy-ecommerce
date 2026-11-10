// app/(cliente)/perfil/page.tsx
"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { mascotasAPI, citasAPI, Mascota, Usuario } from "@/lib/api";
import { useAuth } from "@/context/AuthContext"; 
import PantallaCarga from "@/app/(public)/_components/PantallaCarga";
import Topbar from "../_components/Topbar";
import Sidebar from "../_components/Sidebar";
import VistaInicio from "../_components/VistaInicio";
import VistaPaseos from "../_components/paseos/VistaPaseos";
import VistaMascotas from "../_components/VistaMascotas";
import VistaDatos from "../_components/VistaDatos";
import VistaFacturacion from "../_components/VistaFacturacion";
import VistaProximamente from "../_components/VistaProximamente";
import ModalMascota from "../_components/ModalMascota";
import AgendamientoWizard from "../_components/agendamiento/AgendamientoWizard";

export type Vista = "inicio" | "servicios" | "mascotas" | "datos" | "facturacion";
export type Servicio = "paseos" | "guarderia" | "banos" | "veterinaria" | "entrenamiento";

export default function PerfilPage() {
  const router = useRouter();
  // IMPORTANTE: Extraemos también la función logout del contexto
  const { user: usuario, token, loading, logout } = useAuth(); 
  
  const [vistaActiva, setVistaActiva] = useState<Vista>("inicio");
  const [servicioActivo, setServicioActivo] = useState<Servicio>("paseos");
  const [mascotas, setMascotas] = useState<Mascota[]>([]);
  const [mascotaEditar, setMascotaEditar] = useState<Mascota | null>(null);
  const [mascotaParaAgendar, setMascotaParaAgendar] = useState<number | null>(null);

  const [wizardAbierto, setWizardAbierto] = useState(false);
  const [modalMascotaAbierto, setModalMascotaAbierto] = useState(false);
  const [sidebarMovilAbierto, setSidebarMovilAbierto] = useState(false);
  const [cargandoMinimo, setCargandoMinimo] = useState(true);
  const [redirigiendo, setRedirigiendo] = useState(false);
  const [paseosRecargarKey, setPaseosRecargarKey] = useState(0);

  // Guardia de seguridad: Si no hay usuario, lo mandamos al inicio
  useEffect(() => {
    if (!loading && !usuario) {
      router.replace("/");
    }
  }, [usuario, loading, router]);

  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth > 768 && sidebarMovilAbierto) {
        setSidebarMovilAbierto(false);
      }
    };
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, [sidebarMovilAbierto]);

  useEffect(() => {
    const t = setTimeout(() => setCargandoMinimo(false), 1500);
    return () => clearTimeout(t);
  }, []);

  useEffect(() => {
    if (!usuario || !token) return;

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

    return () => { cancelado = true; };
  }, [usuario, token]);

  const recargarMascotas = () => {
    if (!token) return;
    mascotasAPI
      .listar(token)
      .then((data) => setMascotas(Array.isArray(data) ? data : []))
      .catch((e) => {
        console.error("Error cargando mascotas:", e);
        setMascotas([]);
      });
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

    if (eraNueva && mascotaGuardada && token) {
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
    console.log("Usuario actualizado", u);
  };

  // Pantalla de carga inicial (ESTO PROTEGE EL RESTO DEL CÓDIGO)
  if (loading || !usuario || cargandoMinimo) {
    return <PantallaCarga mensaje="Cargando tu perfil..." />;
  }

  return (
    <>
      <div className="perfil-page">
        
        {/* Usamos usuario!.nombre para decirle a TypeScript que confíe */}
        <Topbar
          nombreUsuario={usuario!.nombre} 
          vistaActiva={vistaActiva}
          servicioActivo={servicioActivo}
          sidebarAbierto={sidebarMovilAbierto}
          onCambiarVista={cambiarVista}
          onCambiarServicio={cambiarServicio}
          onToggleSidebar={() => setSidebarMovilAbierto(!sidebarMovilAbierto)}
          onLogout={logout} // <-- Ahora sí, usamos el logout real
        />

        <Sidebar
          nombreUsuario={usuario!.nombre}
          vistaActiva={vistaActiva}
          servicioActivo={servicioActivo}
          onCambiarVista={cambiarVista}
          onCambiarServicio={cambiarServicio}
          onLogout={logout} // <-- Logout real
          sidebarMovilAbierto={sidebarMovilAbierto}
          onCerrarSidebar={() => setSidebarMovilAbierto(false)}
        />

        <main className="perfil-main">
          <div className="container">
            {vistaActiva === "inicio" && (
              <VistaInicio
                usuario={usuario!} // <-- El ! soluciona el error rojo
                mascotas={mascotas}
                onCambiarVista={cambiarVista}
                onCambiarServicio={cambiarServicio}
              />
            )}

            {vistaActiva === "servicios" && (
              <>
                {servicioActivo === "paseos" ? (
                  <VistaPaseos
                    usuario={usuario!} // <-- El ! soluciona el error rojo
                    mascotas={mascotas}
                    onAgendar={() => setWizardAbierto(true)}
                    recargarKey={paseosRecargarKey}
                    onCambiarVista={cambiarVista}
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
              <VistaDatos usuario={usuario!} onUsuarioActualizado={actualizarUsuario} />
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

      {wizardAbierto && (
        <AgendamientoWizard
          usuario={usuario!} // <-- El ! soluciona el error rojo
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

      {redirigiendo && <PantallaCarga mensaje="Confirmando tu pago..." />}
    </>
  );
}