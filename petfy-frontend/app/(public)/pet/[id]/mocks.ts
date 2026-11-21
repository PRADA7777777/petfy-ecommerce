// app/(public)/pet/[id]/mocks.ts
// Datos de prueba — reemplazar por API cuando backend esté listo.

export interface MascotaMock {
  id_mascota: number;
  nom_mascota: string;
  raza?: string;
  edad?: number;
  peso?: number;
  img_masc?: string;
  comportamiento?: string;
  otras_indicaciones?: string;
  nombre_dueno?: string;
  telefono_dueno?: string;
  condicion_medica?: string;
  modo_perdido?: boolean;
}

export const MASCOTAS_MOCK: Record<string, MascotaMock> = {
  "1": {
    id_mascota: 1,
    nom_mascota: "Tobias",
    raza: "Akita",
    edad: 3,
    peso: 25.5,
    img_masc:
      "https://images.unsplash.com/photo-1583337130417-3346a1be7dee?w=800",
    comportamiento: "Juguetón, amigable con niños, no muerde",
    otras_indicaciones:
      "Le encanta correr y jugar con la pelota. Es muy cariñoso cuando agarra confianza. Suele responder a su nombre.",
    nombre_dueno: "Oscar",
    telefono_dueno: "3204829244",
    modo_perdido: true,
  },
  "2": {
    id_mascota: 2,
    nom_mascota: "Max",
    raza: "Bulldog Francés",
    edad: 5,
    peso: 12.0,
    img_masc:
      "https://images.unsplash.com/photo-1583511655857-d19b40a7a54e?w=800",
    comportamiento: "Tranquilo, tímido con extraños, tarda en confiar",
    otras_indicaciones:
      "Es un perro casero. Si te acercas, ofrécele la mano primero para que te huela. Le gusta el pollo.",
    nombre_dueno: "Oscar",
    telefono_dueno: "3204829244",
    condicion_medica: "Alérgico al pollo en croquetas. Solo pollo fresco.",
    modo_perdido: false,
  },
  "3": {
    id_mascota: 3,
    nom_mascota: "Luna",
    raza: "Beagle",
    edad: 2,
    peso: 9.8,
    img_masc:
      "https://images.unsplash.com/photo-1543466835-00a7907e9de1?w=800",
    comportamiento: "Muy activa, le gusta explorar y seguir olores",
    otras_indicaciones:
      "Es una escapista. Si la ves sin correa, NO la persigas: agáchate y llama su nombre con voz alegre.",
    nombre_dueno: "Oscar",
    telefono_dueno: "3204829244",
    modo_perdido: false,
  },
};