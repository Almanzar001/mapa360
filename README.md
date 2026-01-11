# Mapa 360° - Sistema de Gestión de Ubicaciones

Aplicación web progresiva (PWA) para gestionar ubicaciones con vista 360° y sistema de roles basado en autenticación.

## 🚀 Características

- ✅ **Autenticación JWT** con roles (SuperAdmin, Admin, Editor, Viewer)
- ✅ **Gestión de usuarios** (solo SuperAdmin)
- ✅ **Dashboard interactivo** con mapas Google Maps
- ✅ **PWA instalable** en dispositivos móviles y desktop
- ✅ **Responsive design** con Tailwind CSS
- ✅ **Backend con NocoDB** para gestión de datos
- ✅ **Sistema de roles y permisos**
- ✅ **Modo offline básico** con Service Worker

## 🛠️ Tecnologías

- **Frontend**: Next.js 16.1.1, React 19, TypeScript
- **Styling**: Tailwind CSS, Lucide React Icons
- **Authentication**: JWT con cookies HttpOnly
- **Backend**: NocoDB API v2
- **Maps**: Google Maps API
- **PWA**: Service Worker, Web App Manifest

## 📋 Requisitos Previos

- Node.js 18+ 
- Cuenta de NocoDB con API Token
- Google Maps API Key
- Base de datos configurada en NocoDB

## ⚙️ Configuración

1. **Clonar el repositorio**
   ```bash
   git clone <repository-url>
   cd mapa-360-app
   ```

2. **Instalar dependencias**
   ```bash
   npm install
   ```

3. **Configurar variables de entorno**
   ```bash
   cp .env.example .env.local
   ```
   
   Edita `.env.local` con tus valores:
   ```env
   NEXT_PUBLIC_GOOGLE_MAPS_API_KEY=tu_google_maps_api_key
   NOCODB_BASE_URL=https://tu-nocodb-instance.com
   NOCODB_API_TOKEN=tu_api_token
   NOCODB_TABLE_ID=tu_table_id_ubicaciones
   NOCODB_USUARIOS_TABLE_ID=tu_table_id_usuarios
   JWT_SECRET=tu-clave-secreta-jwt-super-segura
   NEXT_PUBLIC_APP_URL=http://localhost:3000
   ```

4. **Configurar base de datos en NocoDB**
   
   Crear tabla `Usuarios` con campos:
   ```
   - Id (Auto Number)
   - Email (Text, Unique)
   - Password (Text)
   - Nombre (Text)
   - Rol (Select: SuperAdmin, Admin, Editor, Viewer)
   - Estado (Select: Activo, Inactivo)
   - FechaCreacion (Date)
   - UltimoAcceso (Date)
   ```

5. **Ejecutar en desarrollo**
   ```bash
   npm run dev
   ```

## 🚀 Deployment en Dokploy

### Prerequisitos
- Servidor con Docker instalado
- Dokploy instalado y configurado
- Dominio apuntando al servidor

### Pasos para deployment

1. **Preparar variables de entorno en Dokploy:**
   ```env
   NODE_ENV=production
   NEXT_PUBLIC_GOOGLE_MAPS_API_KEY=tu_api_key_produccion
   NOCODB_BASE_URL=https://tu-nocodb-produccion.com
   NOCODB_API_TOKEN=tu_token_produccion
   NOCODB_TABLE_ID=tabla_ubicaciones_prod
   NOCODB_USUARIOS_TABLE_ID=tabla_usuarios_prod
   JWT_SECRET=clave-super-segura-produccion-cambiar
   NEXT_PUBLIC_APP_URL=https://tu-dominio.com
   ```

2. **Configurar Dockerfile** (ya incluido):
   ```dockerfile
   FROM node:18-alpine
   WORKDIR /app
   COPY package*.json ./
   RUN npm install
   COPY . .
   RUN npm run build
   EXPOSE 3000
   CMD ["npm", "start"]
   ```

3. **En Dokploy:**
   - Crear nuevo proyecto
   - Conectar repositorio GitHub
   - Configurar variables de entorno
   - Configurar dominio y SSL
   - Deployar

4. **Configuración post-deployment:**
   - Crear usuario SuperAdmin inicial en NocoDB
   - Verificar que el JWT_SECRET sea único y seguro
   - Configurar CORS en NocoDB si es necesario

## 📱 Funcionalidades por Rol

### SuperAdmin
- ✅ Gestión completa de usuarios
- ✅ Acceso total a dashboard
- ✅ Gestión de ubicaciones
- ✅ Configuración del sistema

### Admin
- ✅ Acceso al dashboard
- ✅ Gestión de ubicaciones
- ❌ No puede gestionar usuarios

### Editor
- ✅ Acceso al dashboard
- ✅ Editar ubicaciones existentes
- ❌ No puede crear/eliminar ubicaciones

### Viewer
- ✅ Solo visualización del dashboard
- ❌ No puede editar contenido

## 🔧 Scripts Disponibles

```bash
npm run dev          # Desarrollo
npm run build        # Build producción
npm run start        # Iniciar producción
npm run lint         # Linting
npm run type-check   # Verificar tipos TypeScript
```

## 📱 PWA - Instalación

La aplicación se puede instalar como PWA en:

- **Chrome/Edge**: Botón "Instalar" en barra de direcciones
- **Safari iOS**: Compartir → "Añadir a pantalla de inicio"
- **Firefox**: Menú → "Instalar"

## 🛡️ Seguridad

- ✅ JWT con expiración de 24 horas
- ✅ Cookies HttpOnly y Secure (en producción)
- ✅ Validación de roles en API endpoints
- ✅ Middleware de autenticación
- ✅ Variables de entorno para datos sensibles

## 🔄 API Endpoints

```
GET  /api/auth/me        # Obtener usuario actual
POST /api/auth/login     # Iniciar sesión
POST /api/auth/logout    # Cerrar sesión
POST /api/auth/register  # Registro (solo SuperAdmin)
GET  /api/usuarios       # Lista usuarios (solo SuperAdmin)
```

## 🎨 Personalización

Para personalizar el diseño:
- Modifica `src/app/globals.css` para estilos globales
- Actualiza `public/manifest.json` para configuración PWA
- Reemplaza iconos en `public/icons/` con tus diseños

## 🐛 Troubleshooting

### Problemas comunes:

1. **Error 403 en APIs:**
   - Verificar que JWT_SECRET esté configurado
   - Confirmar que cookies se envíen correctamente

2. **Maps no cargan:**
   - Verificar GOOGLE_MAPS_API_KEY
   - Confirmar que la API esté habilitada en Google Console

3. **PWA no se instala:**
   - Verificar que manifest.json sea accesible
   - Confirmar que Service Worker se registre correctamente

## 📞 Soporte

Para reportar bugs o solicitar características, crear un issue en el repositorio.

## 📄 Licencia

MIT License