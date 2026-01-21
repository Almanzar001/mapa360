import { Categoria, TienePermiso } from '@/types';

export function obtenerIconoPorCategoria(
  categoria: Categoria,
  iconColor: string,
  borderColor: string,
  tienePermiso?: TienePermiso
): string {
  // Sobrescribir colores con negro si no tiene permiso
  if (tienePermiso === 'No Tiene') {
    iconColor = '#000000'; // Negro
    borderColor = '#333333'; // Gris oscuro para el borde
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

          <!-- Icono de retropala/excavadora -->
          <g transform="translate(6, 10)">
            <!-- Cabina central -->
            <rect x="10" y="8" width="8" height="6" fill="white" stroke="${borderColor}" stroke-width="1" rx="1"/>
            <rect x="11" y="9" width="6" height="2" fill="${borderColor}" opacity="0.3"/>

            <!-- Pala delantera -->
            <path d="M 4 14 L 10 12 L 10 14 L 4 16 Z" fill="white" stroke="${borderColor}" stroke-width="1"/>
            <line x1="4" y1="15" x2="10" y2="13" stroke="${borderColor}" stroke-width="0.5"/>

            <!-- Brazo excavador trasero -->
            <path d="M 18 10 L 22 4 L 24 5 L 20 11 Z" fill="white" stroke="${borderColor}" stroke-width="1"/>
            <circle cx="22" cy="4" r="1.5" fill="${borderColor}"/>

            <!-- Cuchara excavadora -->
            <path d="M 22 4 L 26 2 L 27 3 L 24 5 Z" fill="white" stroke="${borderColor}" stroke-width="1"/>

            <!-- Ruedas -->
            <circle cx="8" cy="14" r="2" fill="${borderColor}"/>
            <circle cx="8" cy="14" r="1" fill="white"/>
            <circle cx="15" cy="14" r="2" fill="${borderColor}"/>
            <circle cx="15" cy="14" r="1" fill="white"/>

            <!-- Base/chasis -->
            <rect x="7" y="12" width="10" height="2" fill="white" stroke="${borderColor}" stroke-width="0.5"/>
          </g>

          ${simboloProhibicion}
        </svg>
      `;

    case 'Hormigonera':
      return `
        <svg width="40" height="40" viewBox="0 0 40 40" fill="none" xmlns="http://www.w3.org/2000/svg">
          <!-- Círculo de fondo -->
          <circle cx="20" cy="20" r="18" fill="${iconColor}" stroke="${borderColor}" stroke-width="2"/>

          <!-- Icono de camión mezclador -->
          <g transform="translate(5, 11)">
            <!-- Cabina del camión -->
            <path d="M 2 10 L 2 6 L 7 6 L 8 10 Z" fill="white" stroke="${borderColor}" stroke-width="1"/>
            <rect x="3" y="7" width="3" height="2" fill="${borderColor}" opacity="0.4"/>

            <!-- Detalles cabina -->
            <rect x="2" y="8" width="6" height="1" fill="${borderColor}" opacity="0.2"/>

            <!-- Tambor mezclador grande -->
            <ellipse cx="18" cy="9" rx="9" ry="7" fill="white" stroke="${borderColor}" stroke-width="1.2"/>

            <!-- Franjas del tambor -->
            <path d="M 11 9 Q 14 6, 18 6 Q 22 6, 25 9" stroke="${borderColor}" stroke-width="1" fill="none"/>
            <path d="M 11 9 Q 14 12, 18 12 Q 22 12, 25 9" stroke="${borderColor}" stroke-width="1" fill="none"/>
            <ellipse cx="18" cy="9" rx="6" ry="4.5" fill="none" stroke="${borderColor}" stroke-width="0.8" opacity="0.5"/>

            <!-- Boca del tambor -->
            <ellipse cx="26" cy="9" rx="1.5" ry="2" fill="${borderColor}" opacity="0.3"/>

            <!-- Chasis/base -->
            <rect x="8" y="10" width="18" height="1.5" fill="white" stroke="${borderColor}" stroke-width="0.8"/>

            <!-- Ruedas delanteras -->
            <circle cx="5" cy="12" r="1.8" fill="${borderColor}"/>
            <circle cx="5" cy="12" r="1" fill="white"/>

            <!-- Ruedas traseras (dobles) -->
            <circle cx="14" cy="12" r="1.8" fill="${borderColor}"/>
            <circle cx="14" cy="12" r="1" fill="white"/>
            <circle cx="22" cy="12" r="1.8" fill="${borderColor}"/>
            <circle cx="22" cy="12" r="1" fill="white"/>
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
  // Si no tiene permiso, devolver negro independientemente de la categoría
  if (tienePermiso === 'No Tiene') {
    return { icon: '#000000', border: '#333333' }; // Negro
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