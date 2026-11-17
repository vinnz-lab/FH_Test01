import { expect, test } from '@playwright/test';
import { ShopPage } from '../pages/shop-page';
import { signIn } from './support';

const backpack = 'sauce-labs-backpack';

test('a customer can complete checkout with the correct order details', async ({ page }) => {
  await signIn(page);
  const shop = new ShopPage(page);
  await shop.addToCart(backpack);
  await shop.openCart();
  await shop.startCheckout();
  await shop.enterCustomerDetails('Alex', 'Tester', 'M1 1AA');

  await expect(page).toHaveURL(/\/checkout-step-two\.html$/);
  await expect(page.getByTestId('inventory-item-name')).toHaveText('Sauce Labs Backpack');
  await expect(page.getByTestId('subtotal-label')).toHaveText('Item total: $29.99');
  await expect(page.getByTestId('tax-label')).toHaveText('Tax: $2.40');
  await expect(page.getByTestId('total-label')).toHaveText('Total: $32.39');
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
