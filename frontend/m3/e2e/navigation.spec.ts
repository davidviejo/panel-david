import { test, expect } from '@playwright/test';

test('sidebar navigation works', async ({ page }) => {
  await page.goto('/');

  // Navigate to AI Roadmap
  await page.getByRole('link', { name: 'Roadmap IA', exact: false }).click();
  await expect(page).toHaveURL(/.*#\/ai-roadmap/);
  await expect(page.getByRole('heading', { name: 'Roadmap IA Personalizado' })).toBeVisible();

  // Navigate to Client Roadmap
  await page.getByRole('link', { name: 'Roadmap Cliente', exact: false }).click();
  await expect(page).toHaveURL(/.*#\/client-roadmap/);

  // The client roadmap might be empty initially, showing a different header
  const header = page.getByRole('heading', { name: 'Roadmap Cliente' });
  const emptyState = page.getByRole('heading', { name: 'Tu Hoja de Ruta está vacía' });
  await expect(header.or(emptyState)).toBeVisible();

  // Navigate to Settings
  await page.getByRole('link', { name: 'Ajustes', exact: false }).click();
  await expect(page).toHaveURL(/.*#\/settings/);
  // Match the actual header in Settings.tsx
  await expect(page.getByRole('heading', { name: 'Ajustes del Sistema' })).toBeVisible();

  // Navigate back to Dashboard
  await page.getByRole('link', { name: 'Panel de Control', exact: false }).click();
  await expect(page).toHaveURL(/.*#\//);
  await expect(page.getByText('Visión General de Madurez')).toBeVisible();
});
