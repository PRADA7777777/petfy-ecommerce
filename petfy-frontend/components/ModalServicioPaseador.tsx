"use client";
import { useState, useRef, useEffect } from "react";
import { api } from "@/lib/api";
import { X, MapPin, CheckCircle2, Camera, Key, Play, ChevronLeft } from "lucide-react";
import { toast } from "sonner";
// Fotos de inicio y entrega: se envían a mano al dueño por WhatsApp (sin costo, no pasan por Petfy)
import { MessageCircle } from "lucide-react";
import { compartirFotoConDueno } from "@/lib/paseoPaseador";

const CLASE_BOTON_WHATSAPP = "w-full h-14 bg-green-600 hover:bg-green-700 text-white font-bold text-lg rounded-xl flex items-center justify-center gap-2";
const CLASE_BOTON_SECUNDARIO = "w-full h-12 border-2 border-gray-200 text-gray-700 font-bold rounded-xl hover:bg-gray-50";

export function ModalServicioPaseador({ cita, onClose, onSuccess }: { cita: any; onClose: () => void; onSuccess: () => void }) {
  // El paso inicial depende del estado actual de la cita
  // 2 = Asignado (Llegada), 6 = Llegó (Pedir Código), 7 = En curso (Finalizar)
  const [paso, setPaso] = useState<number>(cita.id_estado === 7 ? 7 : cita.id_estado === 6 ? 6 : 2);
  
  const [codigo, setCodigo] = useState("");
  const [loading, setLoading] = useState(false);
  
  // Estados para la finalización
  const [fotoEntrega, setFotoEntrega] = useState<string | null>(null);
  const [todoBien, setTodoBien] = useState<boolean>(true);
  const [novedad, setNovedad] = useState("");
  const fileRef = useRef<HTMLInputElement>(null);

  // Paso 8 (foto de inicio) y paso 9 (paseo finalizado): se envían al dueño por WhatsApp
  const [fotoInicio, setFotoInicio] = useState<string | null>(null);
  const fotoInicioRef = useRef<HTMLInputElement>(null);

  // GPS Simulado si el modal se abre ya en curso
  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (paso === 7) {
      interval = setInterval(() => {
        const lat = 4.6097 + (Math.random() - 0.5) * 0.001;
        const lng = -74.0817 + (Math.random() - 0.5) * 0.001;
        api.enviarPuntoGPS(cita.id_cita, lat, lng).catch(() => {});
      }, 10000);
    }
    return () => clearInterval(interval);
  }, [paso, cita.id_cita]);

  const handleFoto = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onloadend = () => setFotoEntrega(reader.result as string);
    reader.readAsDataURL(file);
  };

  const handleFotoInicio = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onloadend = () => setFotoInicio(reader.result as string);
    reader.readAsDataURL(file);
  };

  const enviarAlDueno = async (foto: string, momento: "inicio" | "entrega") => {
    try {
      await compartirFotoConDueno(cita, foto, momento);
    } catch (e: any) {
      toast.error(e.message || "No se pudo abrir WhatsApp");
    }
  };

  const handleMarcarLlegada = async () => {
    setLoading(true);
    try {
      await api.marcarLlegada(cita.id_cita);
      toast.success("Llegada registrada. Pide el código al dueño.");
      setPaso(6); // Avanza al paso de código
    } catch {
      toast.error("Error al registrar llegada");
    } finally {
      setLoading(false);
    }
  };

  const handleIniciarPaseo = async () => {
    if (codigo.length < 4) return toast.error("Ingresa el código de 4 dígitos");
    setLoading(true);
    try {
      await api.iniciarPaseo(cita.id_cita, codigo);
      toast.success("¡Paseo iniciado! GPS activo.");
      
      // Paso de la foto de inicio; el modal se cierra con "Continuar"
      setPaso(8);
      
    } catch (e: any) {
      toast.error(e.message || "Código incorrecto");
    } finally {
      setLoading(false);
    }
  };

  const handleFinalizarPaseo = async () => {
    if (!fotoEntrega) return toast.error("Debes tomar una foto de cierre");
    setLoading(true);
    try {
      await api.finalizarPaseo(cita.id_cita, { 
        foto: fotoEntrega, 
        novedad: todoBien ? undefined : novedad 
      });
      toast.success("¡Paseo finalizado!");
      
      // Paso final: enviar la foto de entrega al dueño; el modal se cierra con "Cerrar"
      setPaso(9);
      
    } catch {
      toast.error("Error al finalizar el paseo");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4 backdrop-blur-sm">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden flex flex-col max-h-[95vh]">
        
        {/* Header */}
        <div className="bg-orange-600 px-5 py-4 text-white flex items-center justify-between shrink-0">
          <div>
            <h2 className="text-lg font-bold">Paseo de {cita.mascota?.nom_mascota}</h2>
            <p className="text-orange-200 text-xs">{cita.hora?.slice(0, 5)} · {cita.zona}</p>
          </div>
          <button onClick={paso >= 8 ? onSuccess : onClose} className="p-1 hover:bg-white/20 rounded-lg transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Contenido Dinámico */}
        <div className="p-6 overflow-y-auto">
          
          {/* PASO 2: Llegada */}
          {paso === 2 && (
            <div className="text-center space-y-6">
              <div className="w-20 h-20 bg-orange-100 text-orange-600 rounded-full flex items-center justify-center mx-auto">
                <MapPin className="w-10 h-10" />
              </div>
              <div>
                <h3 className="text-xl font-bold text-gray-900">Dirígete al domicilio</h3>
                <p className="text-sm text-gray-500 mt-1">{cita.direccion}</p>
              </div>
              <button onClick={handleMarcarLlegada} disabled={loading}
                className="w-full h-14 bg-orange-600 hover:bg-orange-700 text-white font-bold text-lg rounded-xl disabled:opacity-50 transition-colors">
                {loading ? "Registrando..." : "📍 Llegué a la casa"}
              </button>
            </div>
          )}

          {/* PASO 6: Pedir Código */}
          {paso === 6 && (
            <div className="space-y-6">
              <div className="text-center">
                <div className="w-16 h-16 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center mx-auto mb-3">
                  <Key className="w-8 h-8" />
                </div>
                <h3 className="text-xl font-bold text-gray-900">Ingresa el código</h3>
                <p className="text-sm text-gray-500 mt-1">Pídele el código de 4 dígitos al dueño.</p>
              </div>

              <input 
                type="text" 
                maxLength={4}
                value={codigo}
                onChange={(e) => setCodigo(e.target.value.replace(/\D/g, ''))}
                placeholder="0000"
                className="w-full text-center text-4xl font-mono tracking-[1em] py-4 border-2 border-gray-200 rounded-xl focus:border-blue-500 focus:outline-none" 
              />

              <button onClick={handleIniciarPaseo} disabled={loading || codigo.length < 4}
                className="w-full h-14 bg-blue-600 hover:bg-blue-700 text-white font-bold text-lg rounded-xl disabled:opacity-50 flex items-center justify-center gap-2">
                {loading ? "Verificando..." : <><Play className="w-5 h-5" /> Iniciar Paseo</>}
              </button>
              
              <button onClick={() => setPaso(2)} className="w-full text-sm text-gray-500 flex items-center justify-center gap-1">
                <ChevronLeft className="w-4 h-4" /> Volver
              </button>
            </div>
          )}

          {/* PASO 7: Finalizar */}
          {paso === 7 && (
            <div className="space-y-6">
              <div className="bg-green-50 border border-green-200 rounded-xl p-4 text-center">
                <div className="flex items-center justify-center gap-2 text-green-700 font-bold mb-1">
                  <CheckCircle2 className="w-5 h-5" /> Paseo en curso
                </div>
                <p className="text-xs text-green-600">El GPS está transmitiendo en segundo plano.</p>
              </div>

              <div className="space-y-3">
                <div>
                  <span className="text-sm font-medium text-gray-700">Foto de entrega *</span>
                  <button onClick={() => fileRef.current?.click()}
                    className="w-full mt-1 border-2 border-dashed rounded-xl p-4 flex flex-col items-center hover:bg-gray-50 transition-colors">
                    {fotoEntrega ? (
                      <img src={fotoEntrega} alt="Foto" className="w-24 h-24 object-cover rounded-lg" />
                    ) : (
                      <>
                        <Camera className="w-8 h-8 text-gray-400 mb-1" />
                        <span className="text-sm text-gray-600">Tomar foto al entregar</span>
                      </>
                    )}
                  </button>
                  <input type="file" accept="image/*" capture="environment" ref={fileRef} className="hidden" onChange={handleFoto} />
                </div>

                <div className="bg-gray-50 p-3 rounded-xl">
                  <span className="text-sm font-medium text-gray-700 block mb-2">¿Todo estuvo bien?</span>
                  <div className="flex gap-2">
                    <button onClick={() => setTodoBien(true)} 
                      className={`flex-1 py-2 rounded-lg text-sm font-bold border-2 transition-colors ${todoBien ? 'bg-green-100 border-green-500 text-green-700' : 'border-transparent text-gray-500'}`}>
                      Sí, todo bien
                    </button>
                    <button onClick={() => setTodoBien(false)} 
                      className={`flex-1 py-2 rounded-lg text-sm font-bold border-2 transition-colors ${!todoBien ? 'bg-red-100 border-red-500 text-red-700' : 'border-transparent text-gray-500'}`}>
                      Hubo novedad
                    </button>
                  </div>
                </div>

                {!todoBien && (
                  <textarea 
                    value={novedad} 
                    onChange={(e) => setNovedad(e.target.value)}
                    placeholder="Describe brevemente qué pasó..."
                    className="w-full px-3 py-2 border rounded-xl text-sm h-20 focus:border-red-400 focus:outline-none" 
                  />
                )}
              </div>

              <button onClick={handleFinalizarPaseo} disabled={loading || !fotoEntrega}
                className="w-full h-14 bg-orange-600 hover:bg-orange-700 text-white font-bold text-lg rounded-xl disabled:opacity-50">
                {loading ? "Guardando..." : "🏁 Finalizar paseo"}
              </button>
            </div>
          )}

          {/* PASO 8: Foto de inicio, enviada a mano al dueño por WhatsApp */}
          {paso === 8 && (
            <div className="space-y-6">
              <div className="bg-green-50 border border-green-200 rounded-xl p-4 text-center">
                <div className="flex items-center justify-center gap-2 text-green-700 font-bold mb-1">
                  <CheckCircle2 className="w-5 h-5" /> Paseo en curso
                </div>
                <p className="text-xs text-green-600">Tómale una foto a {cita.mascota?.nom_mascota} al salir y envíasela al dueño.</p>
              </div>

              <div>
                <span className="text-sm font-medium text-gray-700">Foto de inicio</span>
                <button onClick={() => fotoInicioRef.current?.click()}
                  className="w-full mt-1 border-2 border-dashed rounded-xl p-4 flex flex-col items-center hover:bg-gray-50 transition-colors">
                  {fotoInicio ? (
                    <img src={fotoInicio} alt="Foto de inicio" className="w-24 h-24 object-cover rounded-lg" />
                  ) : (
                    <>
                      <Camera className="w-8 h-8 text-gray-400 mb-1" />
                      <span className="text-sm text-gray-600">Tomar foto al salir</span>
                    </>
                  )}
                </button>
                <input type="file" accept="image/*" capture="environment" ref={fotoInicioRef} className="hidden" onChange={handleFotoInicio} />
              </div>

              {fotoInicio && (
                <button onClick={() => enviarAlDueno(fotoInicio, "inicio")} className={CLASE_BOTON_WHATSAPP}>
                  <MessageCircle className="w-5 h-5" /> Enviar al dueño por WhatsApp
                </button>
              )}
              <button onClick={onSuccess} className={CLASE_BOTON_SECUNDARIO}>Continuar</button>
            </div>
          )}

          {/* PASO 9: Paseo finalizado, enviar la foto de entrega al dueño por WhatsApp */}
          {paso === 9 && fotoEntrega && (
            <div className="space-y-6">
              <div className="bg-green-50 border border-green-200 rounded-xl p-4 text-center">
                <div className="flex items-center justify-center gap-2 text-green-700 font-bold mb-1">
                  <CheckCircle2 className="w-5 h-5" /> Paseo finalizado
                </div>
                <p className="text-xs text-green-600">Envíale al dueño la foto de entrega.</p>
              </div>
              <img src={fotoEntrega} alt="Foto de entrega" className="w-24 h-24 object-cover rounded-lg mx-auto" />
              <button onClick={() => enviarAlDueno(fotoEntrega, "entrega")} className={CLASE_BOTON_WHATSAPP}>
                <MessageCircle className="w-5 h-5" /> Enviar foto al dueño por WhatsApp
              </button>
              <button onClick={onSuccess} className={CLASE_BOTON_SECUNDARIO}>Cerrar</button>
            </div>
          )}

        </div>
      </div>
    </div>
  );
}