// Cookie helpers only — auth is handled by InsForge

export function obtenerTokenDeCookies(request: Request): string | null {
  const cookieHeader = request.headers.get('cookie');
  if (!cookieHeader) return null;
  const cookies = cookieHeader.split(';').reduce((acc, c) => {
    const [k, v] = c.trim().split('=');
    acc[k] = v;
    return acc;
  }, {} as Record<string, string>);
  return cookies.token || null;
}

export function crearCookieDeAutenticacion(token: string): string {
  return `token=${token}; HttpOnly; Path=/; Max-Age=${24 * 60 * 60}; SameSite=Strict${
    process.env.NODE_ENV === 'production' ? '; Secure' : ''
  }`;
}

export function crearCookieDeLogout(): string {
  return `token=; HttpOnly; Path=/; Max-Age=0; SameSite=Strict`;
}
