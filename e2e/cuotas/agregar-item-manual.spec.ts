import { test, expect } from '@playwright/test';
import { loginAsAdmin } from '../helpers/auth';

test.describe('Agregar Ítem Manual', () => {
  test.beforeEach(async ({ page }) => {
    await loginAsAdmin(page);
  });

  test('debe agregar ítem manual a cuota', async ({ page }) => {
    // 1. Abrir detalle de cuota
    await page.goto('/cuotas');
    await page.click('table tbody tr:first-child');
    await expect(page.locator('h2:has-text("Detalle de Cuota")')).toBeVisible();

    // 2. Contar ítems actuales
    const itemsIniciales = await page.locator('[data-testid="item-row"]').count();

    // 3. Hacer clic en "Agregar Ítem Manual"
    await page.click('button:has-text("Agregar Ítem Manual")');
    await expect(page.locator('h2:has-text("Agregar Ítem Manual")')).toBeVisible();

    // 4. Completar formulario
    await page.selectOption('select[name="tipoItemCodigo"]', 'AJUSTE_MANUAL_DESCUENTO');
    await page.fill('input[name="concepto"]', 'Descuento de prueba E2E');
    await page.fill('input[name="monto"]', '500');
    await page.fill('input[name="cantidad"]', '1');

    // 5. Enviar formulario
    await page.click('button:has-text("Agregar Ítem")');

    // 6. Verificar éxito
    await expect(page.locator('text=/Ítem agregado exitosamente/')).toBeVisible({ timeout: 5000 });

    // 7. Verificar que ítem aparece en desglose
    await page.waitForTimeout(1000);
    const itemsFinales = await page.locator('[data-testid="item-row"]').count();
    expect(itemsFinales).toBe(itemsIniciales + 1);

    // 8. Verificar que monto total cambió
    const nuevoTotal = await page.locator('[data-testid="monto-total"]').textContent();
    expect(nuevoTotal).toContain('-500'); // Descuento debería reducir total
  });

  test('debe validar campos requeridos al agregar ítem', async ({ page }) => {
    await page.goto('/cuotas');
    await page.click('table tbody tr:first-child');
    await page.click('button:has-text("Agregar Ítem Manual")');

    // Intentar enviar sin llenar campos
    await page.click('button:has-text("Agregar Ítem")');

    // Verificar errores
    await expect(page.locator('text=/Tipo de ítem es requerido/')).toBeVisible();
    await expect(page.locator('text=/Concepto es requerido/')).toBeVisible();
    await expect(page.locator('text=/Monto debe ser mayor a 0/')).toBeVisible();
  });
});
