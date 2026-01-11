// Script para verificar variables de entorno en el contenedor
console.log('=== DEBUGGING ENVIRONMENT VARIABLES ===');
console.log('NODE_ENV:', process.env.NODE_ENV);
console.log('NOCODB_BASE_URL:', process.env.NOCODB_BASE_URL ? '✅ CONFIGURADA' : '❌ FALTANTE');
console.log('NOCODB_API_TOKEN:', process.env.NOCODB_API_TOKEN ? '✅ CONFIGURADA' : '❌ FALTANTE');
console.log('NOCODB_USUARIOS_TABLE_ID:', process.env.NOCODB_USUARIOS_TABLE_ID ? '✅ CONFIGURADA' : '❌ FALTANTE');
console.log('JWT_SECRET:', process.env.JWT_SECRET ? '✅ CONFIGURADA' : '❌ FALTANTE');
console.log('NEXT_PUBLIC_APP_URL:', process.env.NEXT_PUBLIC_APP_URL);

if (process.env.NOCODB_BASE_URL) {
  console.log('NOCODB_BASE_URL value:', process.env.NOCODB_BASE_URL);
}

console.log('===========================================');