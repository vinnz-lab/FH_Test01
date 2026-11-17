import { expect, test } from '@playwright/test';
import { ShopPage } from '../pages/shop-page';
import { signIn } from './support';

const backpack = 'sauce-labs-backpack';
const bikeLight = 'sauce-labs-bike-light';

test('a product can be added to and removed from the cart', async ({ page }) => {
  await signIn(page);
  const shop = new ShopPage(page);

  await shop.addToCart(backpack);
  await expect(page.getByTestId('shopping-cart-badge')).toHaveText('1');

  await shop.openCart();
  await expect(page).toHaveURL(/\/cart\.html$/);
  await expect(page.getByTestId('inventory-item-name')).toHaveText('Sauce Labs Backpack');
  await expect(page.getByTestId('inventory-item-price')).toHaveText('$29.99');
  await expect(page.getByTestId('item-quantity')).toHaveText('1');

  await shop.removeFromCart(backpack);
  await expect(page.getByTestId('inventory-item')).toHaveCount(0);
  await expect(page.getByTestId('shopping-cart-badge')).toHaveCount(0);
});

test('several products are tracked together and can be removed from the inventory', async ({ page }) => {
  await signIn(page);
  const shop = new ShopPage(page);

  await shop.addToCart(backpack);
  await shop.addToCart(bikeLight);
  await expect(page.getByTestId('shopping-cart-badge')).toHaveText('2');

  await shop.openCart();
  await expect(page.getByTestId('inventory-item-name')).toHaveText([
    'Sauce Labs Backpack',
    'Sauce Labs Bike Light',
  ]);
  await expect(page.getByTestId('inventory-item-price')).toHaveText(['$29.99', '$9.99']);

  await shop.backToInventory();
  await shop.removeFromCart(bikeLight);
  await expect(page.getByTestId('shopping-cart-badge')).toHaveText('1');

  await shop.openCart();
  await expect(page.getByTestId('inventory-item-name')).toHaveText('Sauce Labs Backpack');
});
