import { chromium } from '@playwright/test';
import fs from 'fs';
import path from 'path';

(async () => {
  console.log('Starting verification script...');
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({ viewport: { width: 1280, height: 800 } });
  const page = await context.newPage();

  try {
    console.log('Navigating to app...');
    // 1. Navigate
    await page.goto('http://localhost:5173/#/module/1');
    await page.waitForTimeout(2000);

    // 2. Add to roadmap
    const taskName = 'Verificar Indexación (robots.txt & sitemap)';
    const taskCard = page.locator('div').filter({ hasText: taskName }).last();
    if (await taskCard.isVisible()) {
      await taskCard.click();
      await page.waitForTimeout(500);

      const addBtn = page.getByTitle('Añadir al Roadmap Cliente');
      if (await addBtn.isVisible()) {
        await addBtn.click();
        await page.waitForTimeout(1000);
        console.log('Added task to roadmap');
      } else {
        console.log('Task might already be in roadmap or button not visible');
      }
    } else {
      console.error('Task card not found');
    }

    // 3. Go to Kanban
    console.log('Navigating to Kanban...');
    await page.goto('http://localhost:5173/#/kanban');
    await page.waitForTimeout(2000);

    // 4. Add Column
    console.log('Adding column...');
    await page.getByRole('button', { name: 'Nueva Columna' }).click();
    await page.getByPlaceholder('Nombre de la columna').fill('Visual Verify');
    await page.locator('.animate-in button.bg-blue-600').click();
    await page.waitForTimeout(1000);

    // 5. Screenshot
    const screenshotPath = path.resolve('verification/verification_kanban.png');
    await page.screenshot({ path: screenshotPath, fullPage: true });
    console.log(`Screenshot saved to ${screenshotPath}`);
  } catch (error) {
    console.error('Error during verification:', error);
  } finally {
    await browser.close();
    console.log('Browser closed');
    process.exit(0);
  }
})();
