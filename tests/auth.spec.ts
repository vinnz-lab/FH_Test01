import { expect, test } from '@playwright/test';
import { LoginPage } from '../pages/login-page';
import { demoPassword, demoUser } from './support';

test('@core a standard user can log in and see the product inventory', async ({ page }) => {
  const login = new LoginPage(page);
  await login.open();
  await login.login(demoUser, demoPassword);

  await expect(page).toHaveURL(/\/inventory\.html$/);
  await expect(page.getByTestId('title')).toHaveText('Products');
  await expect(page.getByTestId('inventory-item')).not.toHaveCount(0);
  await expect(page.getByTestId('shopping-cart-link')).toBeVisible();
});

test('the slow demo user can log in when given a bounded wait', async ({ page }, testInfo) => {
  // This user deliberately loads slowly. Wait for a real result, never a fixed sleep.
  test.setTimeout(45_000);
  const login = new LoginPage(page);
  await login.open();
  const started = Date.now();
  await login.login('performance_glitch_user', demoPassword);
  await expect(page).toHaveURL(/\/inventory\.html$/, { timeout: 15_000 });
  await expect(page.getByTestId('title')).toHaveText('Products', { timeout: 15_000 });
  await testInfo.attach('slow-login-elapsed-ms', {
    body: String(Date.now() - started),
    contentType: 'text/plain',
  });
});

test('incorrect credentials are rejected without opening the inventory', async ({ page }) => {
  const login = new LoginPage(page);
  await login.open();
  await login.login(demoUser, 'incorrect_password');

  await expect(page.getByTestId('error')).toHaveText(
    'Epic sadface: Username and password do not match any user in this service',
  );
  await expect(page).not.toHaveURL(/\/inventory\.html$/);
  await expect(page.getByRole('button', { name: 'Login' })).toBeVisible();
});

test('a locked-out account is refused with a clear error', async ({ page }) => {
  const login = new LoginPage(page);
  await login.open();
  await login.login('locked_out_user', demoPassword);

  await expect(page.getByTestId('error')).toHaveText(
    'Epic sadface: Sorry, this user has been locked out.',
  );
  await expect(page).toHaveURL(/\/$/);
});

test('missing login fields are rejected before any session is created', async ({ page }) => {
  const login = new LoginPage(page);
  await login.open();

  await login.login('', '');
  await expect(page.getByTestId('error')).toHaveText('Epic sadface: Username is required');

  await login.login(demoUser, '');
  await expect(page.getByTestId('error')).toHaveText('Epic sadface: Password is required');
});

test('logging out ends the session and protects direct inventory access', async ({ page }) => {
  const login = new LoginPage(page);
  await login.open();
  await login.login(demoUser, demoPassword);
  await expect(page).toHaveURL(/\/inventory\.html$/);

  await login.logout();
  await expect(page).toHaveURL(/\/$/);

  await page.goto('/inventory.html');
  await expect(page.getByTestId('error')).toHaveText(
    "Epic sadface: You can only access '/inventory.html' when you are logged in.",
  );
  await expect(page.getByRole('button', { name: 'Login' })).toBeVisible();
});
