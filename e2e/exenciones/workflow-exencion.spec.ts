import { test, expect } from '@playwright/test';
import { loginAsAdmin } from '../helpers/auth';

test.describe('Workflow de Exención', () => {
  test.beforeEach(async ({ page }) => {
    await loginAsAdmin(page);
  });

  test('debe completar flujo: Solicitar → Aprobar → Vigente', async ({ page }) => {
    // 1. Solicitar exención
    await page.goto('/personas');
    await page.click('table tbody tr:first-child');
    await page.click('button:has-text("Gestionar Exenciones")');
    await page.click('button:has-text("Nueva Exención")');

    // 2. Completar solicitud
    await page.selectOption('select[name="tipoExencion"]', 'PARCIAL');
    await page.selectOption('select[name="motivoExencion"]', 'BECA');
    await page.fill('input[name="porcentaje"]', '50');
    await page.fill('textarea[name="descripcion"]', 'Beca artística por excelencia académica en piano');
    await page.fill('input[name="fechaInicio"]', '2024-01-01');
    await page.fill('input[name="fechaFin"]', '2024-12-31');
    await page.fill('textarea[name="justificacion"]', 'Estudiante con promedio 9.5 y participación destacada en conciertos regionales');

    await page.click('button:has-text("Solicitar Exención")');

    // 3. Verificar estado PENDIENTE_APROBACION
    await expect(page.locator('text=/Estado: PENDIENTE_APROBACION/')).toBeVisible({ timeout: 5000 });

    // 4. Aprobar exención (requiere rol admin)
    await page.click('button:has-text("Aprobar")');
    await page.fill('textarea[name="observaciones"]', 'Aprobado por dirección académica');
    await page.click('button:has-text("Confirmar Aprobación")');

    // 5. Verificar estado APROBADA
    await expect(page.locator('text=/Estado: APROBADA/')).toBeVisible({ timeout: 5000 });

    // 6. Verificar que se aplica en cuotas
    await page.goto('/cuotas');
    await page.click('table tbody tr:first-child');

    // Debería haber un ítem EXENCION_PARCIAL con -50%
    await expect(page.locator('text=/Exención Parcial.*50%/')).toBeVisible();
  });
});
