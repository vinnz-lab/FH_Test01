import { expect, type Page } from '@playwright/test';
import { LoginPage } from '../pages/login-page';

// Public demo credentials displayed on the Sauce Demo login page; not production secrets.
export const demoUser = 'standard_user';
export const demoPassword = 'secret_sauce';

/** Signs in as the standard user and returns once the inventory is visible. */
export async function signIn(page: Page): Promise<void> {
  const login = new LoginPage(page);
  await login.open();
  await login.login(demoUser, demoPassword);
  await expect(page).toHaveURL(/\/inventory\.html$/);
}

/** Reads the visible product names in display order. */
export async function displayedProductNames(page: Page): Promise<string[]> {
  return page.getByTestId('inventory-item-name').allTextContents();
}

/** Reads the visible product prices, in display order, as numbers in cents. */
export async function displayedProductPrices(page: Page): Promise<number[]> {
  const texts = await page.getByTestId('inventory-item-price').allTextContents();
  return texts.map((t) => Math.round(parseFloat(t.replace('$', '')) * 100));
}
