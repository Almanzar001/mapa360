// Utilidades para manejar cálculos de vigencia

export interface InfoVigencia {
  diasTranscurridos: number;     // Días desde la emisión
  diasRestantes: number;         // Días que faltan para vencer (puede ser negativo)
  diasVencido: number;          // Días vencidos (0 si no está vencido)
  porcentajeTranscurrido: number; // Porcentaje del período transcurrido
  estaVencido: boolean;         // Si ya venció
  estaProximoAVencer: boolean;  // Si vence en los próximos 30 días
}

/**
 * Calcula información completa de vigencia basada en fecha de emisión y días de vigencia
 */
export function calcularInfoVigencia(fechaEmision: string, vigenciaDias: number): InfoVigencia {
  const hoy = new Date();
  const fechaEmisionDate = new Date(fechaEmision);
  const fechaVencimiento = new Date(fechaEmisionDate);
  fechaVencimiento.setDate(fechaVencimiento.getDate() + vigenciaDias);

  // Calcular días transcurridos desde la emisión
  const diasTranscurridos = Math.floor((hoy.getTime() - fechaEmisionDate.getTime()) / (1000 * 60 * 60 * 24));

  // Calcular días restantes (puede ser negativo si ya venció)
  const diasRestantes = Math.ceil((fechaVencimiento.getTime() - hoy.getTime()) / (1000 * 60 * 60 * 24));

  // Calcular días vencidos (solo si está vencido)
  const diasVencido = diasRestantes < 0 ? Math.abs(diasRestantes) : 0;

  // Calcular porcentaje transcurrido
  const porcentajeTranscurrido = Math.min(100, Math.max(0, (diasTranscurridos / vigenciaDias) * 100));

  // Estado de vigencia
  const estaVencido = diasRestantes < 0;
  const estaProximoAVencer = !estaVencido && diasRestantes <= 30;

  return {
    diasTranscurridos: Math.max(0, diasTranscurridos),
    diasRestantes: Math.max(0, diasRestantes),
    diasVencido,
    porcentajeTranscurrido,
    estaVencido,
    estaProximoAVencer
  };
}

/**
 * Formatea la información de vigencia en texto legible
 */
export function formatearVigencia(info: InfoVigencia): {
  texto: string;
  color: string;
  icono: string;
} {
  if (info.estaVencido) {
    const texto = info.diasVencido === 1 
      ? `Vencido hace 1 día`
      : `Vencido hace ${info.diasVencido} días`;
    return {
      texto,
      color: 'text-red-600',
      icono: '⚠️'
    };
  }

  if (info.estaProximoAVencer) {
    const texto = info.diasRestantes === 1 
      ? `Vence mañana`
      : `Vence en ${info.diasRestantes} días`;
    return {
      texto,
      color: 'text-orange-600',
      icono: '⏰'
    };
  }

  const texto = info.diasRestantes === 1 
    ? `Válido por 1 día más`
    : `Válido por ${info.diasRestantes} días`;
  return {
    texto,
    color: 'text-green-600',
    icono: '✅'
  };
}

/**
 * Calcula la fecha de vencimiento
 */
export function calcularFechaVencimiento(fechaEmision: string, vigenciaDias: number): Date {
  const fechaEmisionDate = new Date(fechaEmision);
  const fechaVencimiento = new Date(fechaEmisionDate);
  fechaVencimiento.setDate(fechaVencimiento.getDate() + vigenciaDias);
  return fechaVencimiento;
}

/**
 * Formatea una fecha en formato legible
 */
export function formatearFecha(fecha: Date): string {
  return fecha.toLocaleDateString('es-ES', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });
}

/**
 * Obtiene el color de fondo para el progreso de vigencia
 */
export function obtenerColorProgreso(info: InfoVigencia): string {
  if (info.estaVencido) return 'bg-red-500';
  if (info.estaProximoAVencer) return 'bg-orange-500';
  return 'bg-green-500';
}