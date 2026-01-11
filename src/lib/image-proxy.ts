/**
 * Convierte URLs de imágenes de NocoDB a URLs proxy para resolver problemas de CORS
 */
export function createProxyImageUrl(originalUrl: string, appUrl?: string): string {
  if (!originalUrl) return '';
  
  // Si ya es una URL proxy, devolverla tal como está
  if (originalUrl.includes('/api/proxy-image')) {
    return originalUrl;
  }
  
  // En desarrollo, devolver URL original
  if (process.env.NODE_ENV !== 'production') {
    return originalUrl;
  }
  
  // Si no es una URL de NocoDB, devolverla tal como está
  const nocodb_base_url = process.env.NOCODB_BASE_URL || '';
  if (!nocodb_base_url || !originalUrl.startsWith(nocodb_base_url)) {
    return originalUrl;
  }
  
  // Crear URL proxy usando la app URL proporcionada o la del entorno
  const baseUrl = appUrl || process.env.NEXT_PUBLIC_APP_URL || '';
  if (!baseUrl) {
    return originalUrl; // Fallback a URL original si no hay app URL configurada
  }
  
  return `${baseUrl}/api/proxy-image?url=${encodeURIComponent(originalUrl)}`;
}

/**
 * Procesa un array de URLs de imágenes convirtiéndolas a URLs proxy
 */
export function createProxyImageUrls(urls: string[]): string[] {
  return urls.map(url => createProxyImageUrl(url)).filter(Boolean);
}

/**
 * Verifica si una URL necesita proxy (es de NocoDB y estamos en producción)
 */
export function needsProxy(url: string): boolean {
  if (!url) return false;
  
  const nocodb_base_url = process.env.NOCODB_BASE_URL || '';
  const isProduction = process.env.NODE_ENV === 'production';
  
  return isProduction && nocodb_base_url && url.startsWith(nocodb_base_url);
}