import { test, expect } from '@playwright/test';

test('Robust Data Preparation', async ({ page }) => {
  test.setTimeout(300000);

  const login = async () => {
    await page.goto('/login');
    await page.fill('input[type="email"]', 'bruno.t.santos1997@hotmail.com');
    await page.fill('input[type="password"]', 'Bruno@06252422');
    await page.click('button[type="submit"]');
    await page.waitForURL('**/dashboard', { timeout: 60000 });
  };

  await login();

  // 1. Boat
  console.log('Ensuring boat...');
  await page.goto('/dashboard/boats');
  await page.waitForTimeout(5000);
  if (await page.locator('text=Nenhuma lancha cadastrada').isVisible() || (await page.locator('table tr').count() <= 1)) {
    await page.click('button:has-text("Adicionar Lancha")');
    await page.fill('#boat-name', 'Lancha Teste Master');
    await page.fill('#boat-capacity', '15');
    await page.fill('#boat-size', '34');
    await page.click('button:has-text("Salvar Lancha")');
    await page.waitForTimeout(5000);
  }

  // 2. Boarding Location
  console.log('Ensuring location...');
  await page.goto('/dashboard/boarding-locations');
  await page.waitForTimeout(5000);
  if (await page.locator('text=Nenhum local de embarque').isVisible() || (await page.locator('table tr').count() <= 1)) {
    await page.click('button:has-text("Adicionar Local")');
    await page.fill('#name', 'Marina Central');
    await page.click('button:has-text("Salvar Local")');
    await page.waitForTimeout(5000);
  }

  // 3. Tour Type
  console.log('Ensuring tour type...');
  await page.goto('/dashboard/tour-types');
  await page.waitForTimeout(5000);
  if (await page.locator('text=Nenhum tipo de passeio cadastrado').isVisible() || (await page.locator('ul li').count() === 0)) {
    await page.click('button:has-text("Adicionar Tipo")');
    await page.fill('input[placeholder*="Aniversário"]', 'Passeio VIP 6h');
    await page.click('button:has-text("Salvar Tipo")');
    await page.waitForTimeout(5000);
  }

  // 4. Client and Event
  console.log('Creating event...');
  await page.goto('/dashboard/create-event');
  await page.waitForTimeout(10000); // Wait for things to load

  // Skip tutorial
  const skipBtn = page.locator('button[aria-label="Skip"], button:has-text("Pular")');
  if (await skipBtn.isVisible()) await skipBtn.click();

  await page.fill('input[placeholder*="Buscar"]', 'João Teste');
  // Wait a bit for the "new client" option to appear if it's not found
  await page.waitForTimeout(2000);
  const addNewClientBtn = page.locator('button:has-text("Cadastrar Novo Cliente")');
  if (await addNewClientBtn.isVisible()) {
      await addNewClientBtn.click();
      await page.fill('input[placeholder="Telefone (WhatsApp)"]', '+55 (11) 99999-9999');
      await page.click('button:has-text("Salvar Cliente")');
      await page.waitForTimeout(3000);
  }

  await page.locator('input[type="number"]').first().fill('8');

  // Select boat
  const boatSelect = page.locator('select#boat-select');
  await boatSelect.waitFor({ state: 'visible' });
  // Wait for at least 2 options (placeholder + the one we created)
  await expect(boatSelect.locator('option')).not.toHaveCount(0);
  const boatOptionsCount = await boatSelect.locator('option').count();
  console.log(`Boat options found: ${boatOptionsCount}`);
  if (boatOptionsCount > 0) {
      await boatSelect.selectOption({ index: 0 }); // Try first valid option
  }

  // Select location
  const locationSelect = page.locator('select#boarding-location-select');
  await locationSelect.waitFor({ state: 'visible' });
  if (await locationSelect.locator('option').count() > 0) {
      await locationSelect.selectOption({ index: 0 });
  }

  // Select tour type
  const tourTypeSelect = page.locator('select#tour-type-select');
  await tourTypeSelect.waitFor({ state: 'visible' });
  if (await tourTypeSelect.locator('option').count() > 1) {
      await tourTypeSelect.selectOption({ index: 1 });
  }

  console.log('Clicking Agendar...');
  await page.click('button:has-text("Agendar Passeio")');
  await page.waitForTimeout(10000);

  console.log('Done.');
});
