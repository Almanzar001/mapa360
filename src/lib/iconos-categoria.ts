import { Categoria, TienePermiso } from '@/types';

export function obtenerIconoPorCategoria(
  categoria: Categoria,
  iconColor: string,
  borderColor: string,
  tienePermiso?: TienePermiso
): string {
  // Sobrescribir colores con naranja brillante si no tiene permiso
  if (tienePermiso === 'No Tiene') {
    iconColor = '#FF8C00'; // Naranja brillante
    borderColor = '#FF6600'; // Naranja más oscuro para el borde
  }

  // Símbolo de prohibición que se agregará si no tiene permiso
  const simboloProhibicion = tienePermiso === 'No Tiene' ? `
    <!-- Símbolo de prohibición -->
    <circle cx="20" cy="20" r="14" fill="none" stroke="white" stroke-width="3"/>
    <line x1="10" y1="10" x2="30" y2="30" stroke="white" stroke-width="3" stroke-linecap="round"/>
  ` : '';

  switch (categoria) {
    case 'Mina':
      return `
        <svg width="40" height="40" viewBox="0 0 40 40" fill="none" xmlns="http://www.w3.org/2000/svg">
          <!-- Círculo de fondo -->
          <circle cx="20" cy="20" r="18" fill="${iconColor}" stroke="${borderColor}" stroke-width="2"/>

          <!-- Icono de mina -->
          <g transform="translate(8, 8)">
            <!-- Torre/estructura principal -->
            <rect x="6" y="8" width="12" height="16" fill="white" stroke="${borderColor}" stroke-width="1"/>
            <rect x="4" y="20" width="16" height="4" fill="white" stroke="${borderColor}" stroke-width="1"/>

            <!-- Detalles de la estructura -->
            <rect x="8" y="10" width="2" height="12" fill="${borderColor}"/>
            <rect x="12" y="10" width="2" height="12" fill="${borderColor}"/>
            <rect x="6" y="12" width="12" height="1" fill="${borderColor}"/>
            <rect x="6" y="16" width="12" height="1" fill="${borderColor}"/>

            <!-- Torre/grúa superior -->
            <rect x="10" y="4" width="4" height="6" fill="white" stroke="${borderColor}" stroke-width="1"/>
            <rect x="8" y="2" width="8" height="2" fill="${borderColor}"/>
            <rect x="11" y="6" width="2" height="2" fill="${borderColor}"/>
          </g>

          ${simboloProhibicion}
        </svg>
      `;

    case 'Hormigonera':
      return `
        <svg width="40" height="40" viewBox="0 0 40 40" fill="none" xmlns="http://www.w3.org/2000/svg">
          <!-- Círculo de fondo -->
          <circle cx="20" cy="20" r="18" fill="${iconColor}" stroke="${borderColor}" stroke-width="2"/>

          <!-- Icono de hormigonera/camión mezclador -->
          <g transform="translate(6, 10)">
            <!-- Cabina del camión -->
            <rect x="2" y="8" width="6" height="8" fill="white" stroke="${borderColor}" stroke-width="1"/>
            <rect x="3" y="9" width="4" height="3" fill="${borderColor}"/>

            <!-- Tambor mezclador -->
            <ellipse cx="18" cy="12" rx="8" ry="6" fill="white" stroke="${borderColor}" stroke-width="1"/>
            <ellipse cx="18" cy="12" rx="6" ry="4" fill="none" stroke="${borderColor}" stroke-width="1"/>
            <line x1="12" y1="12" x2="24" y2="12" stroke="${borderColor}" stroke-width="1"/>
            <line x1="18" y1="6" x2="18" y2="18" stroke="${borderColor}" stroke-width="1"/>

            <!-- Ruedas -->
            <circle cx="5" cy="16" r="2" fill="${borderColor}"/>
            <circle cx="14" cy="16" r="2" fill="${borderColor}"/>
            <circle cx="22" cy="16" r="2" fill="${borderColor}"/>
          </g>

          ${simboloProhibicion}
        </svg>
      `;

    case 'Permiso':
      return `
        <svg width="40" height="40" viewBox="0 0 40 40" fill="none" xmlns="http://www.w3.org/2000/svg">
          <!-- Círculo de fondo -->
          <circle cx="20" cy="20" r="18" fill="${iconColor}" stroke="${borderColor}" stroke-width="2"/>

          <!-- Icono de documento/permiso -->
          <g transform="translate(10, 8)">
            <!-- Documento -->
            <rect x="2" y="2" width="16" height="20" fill="white" stroke="${borderColor}" stroke-width="1"/>
            <rect x="14" y="2" width="4" height="4" fill="${borderColor}"/>
            <polygon points="14,2 18,2 18,6 14,6" fill="white" stroke="${borderColor}" stroke-width="1"/>

            <!-- Líneas de texto -->
            <line x1="4" y1="8" x2="14" y2="8" stroke="${borderColor}" stroke-width="1"/>
            <line x1="4" y1="11" x2="16" y2="11" stroke="${borderColor}" stroke-width="1"/>
            <line x1="4" y1="14" x2="12" y2="14" stroke="${borderColor}" stroke-width="1"/>

            <!-- Sello/checkmark -->
            <circle cx="12" cy="17" r="3" fill="${borderColor}" opacity="0.3"/>
            <path d="M10 17 L11.5 18.5 L14 16" stroke="white" stroke-width="1.5" fill="none"/>
          </g>

          ${simboloProhibicion}
        </svg>
      `;

    default:
      return obtenerIconoPorCategoria('Permiso', iconColor, borderColor, tienePermiso);
  }
}

export function obtenerColorCategoria(
  categoria: Categoria,
  tienePermiso?: TienePermiso
): { icon: string; border: string } {
  // Si no tiene permiso, devolver naranja brillante independientemente de la categoría
  if (tienePermiso === 'No Tiene') {
    return { icon: '#FF8C00', border: '#FF6600' }; // Naranja brillante
  }

  switch (categoria) {
    case 'Mina':
      return { icon: '#8B5A00', border: '#654200' }; // Marrón/dorado para mina
    case 'Hormigonera':
      return { icon: '#6366F1', border: '#4338CA' }; // Azul para hormigonera
    case 'Permiso':
      return { icon: '#06B6D4', border: '#0891B2' }; // Cian para permiso
    default:
      return { icon: '#06B6D4', border: '#0891B2' };
  }
}

export function obtenerNombreCategoria(categoria: Categoria): string {
  switch (categoria) {
    case 'Mina':
      return 'Proyecto Minero';
    case 'Hormigonera':
      return 'Planta Hormigonera';
    case 'Permiso':
      return 'Permiso/Documento';
    default:
      return 'Sin Categoría';
  }
}