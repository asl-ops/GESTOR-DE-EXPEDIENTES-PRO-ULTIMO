// FIX: Replaced the triple-slash directive with a direct import to provide proper Node.js types for the `process` global.
import process from 'node:process';
import path from 'path';

import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => {
  // Carga el archivo .env según el 'mode' en el directorio de trabajo actual.
  // El tercer parámetro '' carga todas las variables sin necesidad del prefijo VITE_.
  const env = loadEnv(mode, process.cwd(), '');
  const apiKey = env.API_KEY || env.VITE_API_KEY || env.VITE_GEMINI_API_KEY || env.GEMINI_API_KEY;
  console.log('-----------------------------------------------------');
  console.log('Gestor Expedientes Pro - Configuración de Entorno');
  console.log(`Modo: ${mode}`);
  console.log(`API Key detectada: ${apiKey ? 'SÍ (Termina en ...' + apiKey.slice(-4) + ')' : 'NO - Revisa tu archivo .env'}`);
  console.log('-----------------------------------------------------');
  return {
    base: '/',
    plugins: [react()],
    resolve: {
      alias: {
        '@': path.resolve(__dirname, './src'),
      },
    },
    // Configuración del servidor de desarrollo optimizada para entornos cloud (Stitch/IDX)
    server: {
      host: '0.0.0.0',  // Permite acceso desde fuera de localhost
      port: 5174,       // Cambiado a 5174 para evitar conflicto con Fac-Express
      strictPort: true, // Falla si el puerto está en uso
      open: false,      // Desactivado para evitar errores en entornos remotos
      hmr: {
        overlay: false, // Evita que los errores de HMR bloqueen la pantalla en entornos cloud
      },
    },
    // Expone la API_KEY al código del cliente como process.env.API_KEY
    define: {
      'process.env.API_KEY': JSON.stringify(env.API_KEY || env.VITE_API_KEY || env.VITE_GEMINI_API_KEY || env.GEMINI_API_KEY)
    },
    // OPTIONAL: Optimize dependencies for better performance
    // Se recomienda excluir firebase si experimentas errores de gstatic en entornos cloud
    optimizeDeps: {
      exclude: ['firebase/app', 'firebase/auth', 'firebase/firestore', 'firebase/storage'],
    },
  }
});