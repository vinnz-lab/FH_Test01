import { expect, test } from '@playwright/test';
import { ShopPage } from '../pages/shop-page';
import { signIn } from './support';

const backpack = 'sauce-labs-backpack';
const bikeLight = 'sauce-labs-bike-light';

/** Parse displayed USD amounts exactly, without floating-point rounding. */
function cents(text: string): number {
  const match = text.match(/\$(\d+)\.(\d{2})\b/);
  if (!match) throw new Error(`Expected a dollar amount with two decimal places: ${text}`);
  return Number(match[1]) * 100 + Number(match[2]);
}

test('@core a customer can complete checkout with correct order arithmetic', async ({ page }) => {
  await signIn(page);
  const shop = new ShopPage(page);
  await shop.addToCart(backpack);
  await shop.addToCart(bikeLight);
  await shop.openCart();
  await expect(page.getByTestId('inventory-item-name')).toHaveText([
    'Sauce Labs Backpack', 'Sauce Labs Bike Light',
  ]);
  await expect(page.getByTestId('item-quantity')).toHaveText(['1', '1']);
  const cartPrices = await page.getByTestId('inventory-item-price').allTextContents();
  expect(cartPrices).toHaveLength(2);
  const expectedSubtotal = cartPrices.map(cents).reduce((sum, price) => sum + price, 0);

  await shop.startCheckout();
  await shop.enterCustomerDetails('Alex', 'Tester', 'M1 1AA');
  await expect(page).toHaveURL(/\/checkout-step-two\.html$/);
  await expect(page.getByTestId('inventory-item-name')).toHaveText([
    'Sauce Labs Backpack', 'Sauce Labs Bike Light',
  ]);
  await expect(page.getByTestId('inventory-item-price')).toHaveText(cartPrices);
  await expect(page.getByTestId('item-quantity')).toHaveText(['1', '1']);
  const subtotal = cents(await page.getByTestId('subtotal-label').innerText());
  const tax = cents(await page.getByTestId('tax-label').innerText());
  const total = cents(await page.getByTestId('total-label').innerText());
  expect(subtotal).toBe(expectedSubtotal);
  expect(tax).toBeGreaterThanOrEqual(0);
  expect(total).toBe(subtotal + tax);

  await page.getByRole('button', { name: 'Finish' }).click();
  await expect(page).toHaveURL(/\/checkout-complete\.html$/);
  await expect(page.getByTestId('complete-header')).toHaveText('Thank you for your order!');
  await expect(page.getByTestId('shopping-cart-badge')).toHaveCount(0);
});

test('checkout requires each customer field in turn and keeps entries while correcting', async ({ page }) => {
  await signIn(page);
  const shop = new ShopPage(page);
  await shop.addToCart(backpack);
  await shop.openCart();
  await shop.startCheckout();

  await shop.submitCustomerDetails();
  await expect(page.getByTestId('error')).toHaveText(/First Name is required/);

  await page.getByPlaceholder('First Name').fill('Alex');
  await shop.submitCustomerDetails();
  await expect(page.getByTestId('error')).toHaveText(/Last Name is required/);

  await page.getByPlaceholder('Last Name').fill('Tester');
  await shop.submitCustomerDetails();
  await expect(page.getByTestId('error')).toHaveText(/Postal Code is required/);

  await page.getByPlaceholder('Zip/Postal Code').fill('M1 1AA');
  await shop.submitCustomerDetails();
  await expect(page).toHaveURL(/\/checkout-step-two\.html$/);
});
