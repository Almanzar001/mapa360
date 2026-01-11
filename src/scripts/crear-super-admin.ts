// Script para crear el usuario SuperAdmin inicial
// Ejecutar con: npx tsx src/scripts/crear-super-admin.ts

import { config } from 'dotenv';
import path from 'path';

// Cargar variables de entorno
config({ path: path.join(process.cwd(), '.env.local') });

import { crearUsuario } from '../lib/usuarios';

async function crearSuperAdmin() {
  const superAdmin = {
    email: 'admin@mapa360.com',
    password: 'admin123456', // Cambiar esta contraseña en producción
    nombre: 'Super Administrador',
    rol: 'SuperAdmin' as const,
  };

  console.log('Creando usuario SuperAdmin...');
  
  try {
    const resultado = await crearUsuario(superAdmin);
    
    if (resultado) {
      console.log('✅ Usuario SuperAdmin creado exitosamente!');
      console.log('📧 Email:', superAdmin.email);
      console.log('🔑 Password:', superAdmin.password);
      console.log('⚠️  IMPORTANTE: Cambia la contraseña después del primer login');
    } else {
      console.log('❌ Error al crear el usuario SuperAdmin');
      console.log('   Posiblemente ya existe un usuario con este email');
    }
  } catch (error) {
    console.error('❌ Error:', error);
  }
}

// Ejecutar solo si se llama directamente
if (require.main === module) {
  crearSuperAdmin();
}