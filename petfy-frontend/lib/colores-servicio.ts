export const SERVICIO_COLORES: Record<string, { bg: string; border: string; text: string; label: string }> = {
  paseos:       { bg: "#FFE4D6", border: "#E0633F", text: "#7C2D12", label: "Paseos" },
  banos:        { bg: "#DBEAFE", border: "#2563EB", text: "#1E3A8A", label: "Baños" },
  guarderia:    { bg: "#F3E8FF", border: "#7C3AED", text: "#4C1D95", label: "Guardería" },
  entrenamiento:{ bg: "#DCFCE7", border: "#16A34A", text: "#14532D", label: "Entrenamiento" },
  veterinario:  { bg: "#FEE2E2", border: "#DC2626", text: "#7F1D1D", label: "Veterinario" },
};

export const colorServicio = (id?: string) =>
  SERVICIO_COLORES[id ?? "paseos"] ?? SERVICIO_COLORES.paseos;