import { test, expect } from '@playwright/test';

test.describe('Smoke Tests', () => {
  test('should load login page', async ({ page }) => {
    await page.goto('/login');
    await expect(page.locator('h1')).toContainText('Sign in');
  });

  test('should load register page', async ({ page }) => {
    await page.goto('/register');
    await expect(page.locator('h1')).toContainText('Create account');
  });

  test('should redirect to login when not authenticated', async ({ page }) => {
    await page.goto('/dashboard');
    await expect(page).toHaveURL('/login');
  });

  test('should be able to register a new user', async ({ page }) => {
    await page.goto('/register');
    
    await page.fill('input[name="name"]', 'Test User');
    await page.fill('input[name="email"]', `test-${Date.now()}@example.com`);
    await page.fill('input[name="password"]', 'password123');
    
    await page.click('button[type="submit"]');
    
    // Should redirect to organizations page
    await expect(page).toHaveURL('/organizations');
  });
});