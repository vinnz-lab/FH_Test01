import { expect, test } from '@playwright/test';
import { displayedProductNames, displayedProductPrices, signIn } from './support';

test('products can be sorted by name in both directions', async ({ page }) => {
  await signIn(page);

  const defaultOrder = await displayedProductNames(page);
  expect(defaultOrder).toEqual([...defaultOrder].sort((a, b) => a.localeCompare(b)));

  await page.getByTestId('product-sort-container').selectOption('za');
  const descending = await displayedProductNames(page);
  expect(descending).toEqual([...descending].sort((a, b) => b.localeCompare(a)));
  expect(descending).not.toEqual(defaultOrder);
});

test('products can be sorted by price in both directions', async ({ page }) => {
  await signIn(page);

  await page.getByTestId('product-sort-container').selectOption('lohi');
  const ascending = await displayedProductPrices(page);
  expect(ascending).toEqual([...ascending].sort((a, b) => a - b));

  await page.getByTestId('product-sort-container').selectOption('hilo');
  const descending = await displayedProductPrices(page);
  expect(descending).toEqual([...descending].sort((a, b) => b - a));
});
