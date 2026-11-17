import { expect, test } from '@playwright/test';
import { displayedProductNames, displayedProductPrices, signIn } from './support';

test('products can be sorted by name in both directions', async ({ page }) => {
  await signIn(page);

  await expect.poll(async () => (await displayedProductNames(page)).length).toBeGreaterThan(1);
  const defaultOrder = await displayedProductNames(page);
  expect(new Set(defaultOrder).size).toBeGreaterThan(1);
  expect(defaultOrder).toEqual([...defaultOrder].sort((a, b) => a.localeCompare(b)));

  await page.getByTestId('product-sort-container').selectOption('za');
  // Locator assertions retry until the expected order is rendered.
  await expect(page.getByTestId('inventory-item-name')).toHaveText(
    [...defaultOrder].sort((a, b) => b.localeCompare(a)),
  );
});

test('products can be sorted by price in both directions', async ({ page }) => {
  await signIn(page);

  await expect.poll(async () => (await displayedProductPrices(page)).length).toBeGreaterThan(1);
  const originalPrices = await displayedProductPrices(page);
  expect(new Set(originalPrices).size).toBeGreaterThan(1);

  await page.getByTestId('product-sort-container').selectOption('lohi');
  await expect.poll(() => displayedProductPrices(page)).toEqual(
    [...originalPrices].sort((a, b) => a - b),
  );

  await page.getByTestId('product-sort-container').selectOption('hilo');
  await expect.poll(() => displayedProductPrices(page)).toEqual(
    [...originalPrices].sort((a, b) => b - a),
  );
});
