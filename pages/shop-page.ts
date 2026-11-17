import { type Page } from '@playwright/test';

/** Shared shopping actions; assertions stay in the tests so their intent is visible. */
export class ShopPage {
  constructor(private readonly page: Page) {}

  async addToCart(testId: string): Promise<void> {
    await this.page.getByTestId(`add-to-cart-${testId}`).click();
  }

  async removeFromCart(testId: string): Promise<void> {
    await this.page.getByTestId(`remove-${testId}`).click();
  }

  async openCart(): Promise<void> {
    await this.page.getByTestId('shopping-cart-link').click();
    // Wait for the cart page content so callers never race the navigation.
    await this.page.getByTestId('cart-contents-container').waitFor();
  }

  async backToInventory(): Promise<void> {
    await this.page.getByRole('button', { name: 'Continue Shopping' }).click();
  }

  /** Selects a sort option by its value: az, za, lohi or hilo. */
  async sortBy(option: 'az' | 'za' | 'lohi' | 'hilo'): Promise<void> {
    await this.page.getByTestId('product-sort-container').selectOption(option);
  }

  async startCheckout(): Promise<void> {
    await this.page.getByRole('button', { name: 'Checkout' }).click();
  }

  async enterCustomerDetails(firstName: string, lastName: string, postalCode: string): Promise<void> {
    await this.page.getByPlaceholder('First Name').fill(firstName);
    await this.page.getByPlaceholder('Last Name').fill(lastName);
    await this.page.getByPlaceholder('Zip/Postal Code').fill(postalCode);
    await this.page.getByRole('button', { name: 'Continue' }).click();
  }

  async submitCustomerDetails(): Promise<void> {
    await this.page.getByRole('button', { name: 'Continue' }).click();
  }
}
