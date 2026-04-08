import { exec } from 'child_process';
import { promisify } from 'util';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const execAsync = promisify(exec);

/**
 * Global Setup para Tests E2E
 *
 * Este archivo se ejecuta UNA vez antes de todos los tests de Playwright.
 * Su función principal es poblar la base de datos con datos de prueba.
 *
 * ## Qué hace:
 *
 * 1. Ejecuta el seed de prueba del backend (prisma/seed-test-cuotas.ts)
 * 2. Crea 52 socios distribuidos en 5 categorías
 * 3. Crea 4 actividades de prueba (Guitarra, Piano, Violín, Canto)
 * 4. Asigna participaciones de socios en actividades
 * 5. Prepara todos los catálogos necesarios
 *
 * ## Datos creados:
 *
 * - 25 socios ACTIVO
 * - 15 socios ESTUDIANTE
 * - 7 socios FAMILIAR
 * - 3 socios JUBILADO
 * - 2 socios GENERAL
 *
 * ## Prerequisitos:
 *
 * - El backend debe estar en ../SIGESDA-BACKEND
 * - El backend debe tener node_modules instalados
 * - El script npm "db:seed:test" debe existir en backend/package.json
 * - La base de datos debe estar corriendo (MySQL/PostgreSQL)
 *
 * ## Troubleshooting:
 *
 * Si el seed falla:
 * 1. Verificar que el backend esté en la ruta correcta
 * 2. Verificar que la DB esté corriendo (docker compose up -d)
 * 3. Ejecutar manualmente: cd ../SIGESDA-BACKEND && npm run db:seed:test
 * 4. Verificar logs de error en la consola
 *
 * @see /SIGESDA-BACKEND/prisma/seed-test-cuotas.ts
 */
export default async function globalSetup() {
  console.log('\n╔══════════════════════════════════════════════════════════════╗');
  console.log('║  🌱 GLOBAL SETUP: Preparando datos para tests E2E           ║');
  console.log('╚══════════════════════════════════════════════════════════════╝\n');

  const backendPath = path.resolve(__dirname, '../../SIGESDA-BACKEND');

  try {
    console.log('📍 Ruta del backend:', backendPath);
    console.log('🗄️  Ejecutando seed de prueba...\n');

    // Ejecutar seed de prueba del backend
    const { stdout, stderr } = await execAsync('npm run db:seed:test', {
      cwd: backendPath,
      env: process.env,
    });

    // Mostrar output del seed
    if (stdout) {
      console.log(stdout);
    }

    if (stderr && !stderr.includes('DeprecationWarning')) {
      console.warn('⚠️  Advertencias:', stderr);
    }

    console.log('\n✅ Seed completado exitosamente');
    console.log('📊 Base de datos poblada con datos de prueba');
    console.log('🚀 Iniciando tests E2E...\n');

  } catch (error: any) {
    console.error('\n❌ ERROR: Falló el seed de datos de prueba\n');
    console.error('Detalles del error:', error.message);

    if (error.stdout) {
      console.error('\nStdout:', error.stdout);
    }

    if (error.stderr) {
      console.error('\nStderr:', error.stderr);
    }

    console.error('\n📋 PASOS PARA SOLUCIONAR:');
    console.error('1. Verificar que el backend está en:', backendPath);
    console.error('2. Verificar que la base de datos está corriendo');
    console.error('3. Ejecutar manualmente: cd ../SIGESDA-BACKEND && npm run db:seed:test');
    console.error('4. Verificar que el script "db:seed:test" existe en backend/package.json\n');

    // No lanzar error - permitir que los tests corran aunque el seed falle
    // Los tests individuales fallarán con mensajes descriptivos
    console.warn('⚠️  Continuando con los tests (pueden fallar por falta de datos)...\n');
  }
}
