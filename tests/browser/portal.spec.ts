import { test, expect } from '@playwright/test';
test('staff routes, viewing invitation and persistent audit', async ({ page }) => {
  const errors: string[] = [];
  page.on('pageerror', (e) => errors.push(e.message));
  await page.goto('/login');
  await page.getByRole('button', { name: /Administrator Alex/ }).click();
  await expect(page.getByRole('heading', { name: 'Good morning, Alex' })).toBeVisible();
  await page.screenshot({ path: '/tmp/portal-dashboard.png', fullPage: true });
  for (const route of [
    '/properties',
    '/listings',
    '/viewings',
    '/applications',
    '/applications/pipeline',
    '/applicants',
    '/visits',
    '/inspections',
    '/documents',
    '/notifications',
    '/emails',
    '/audit',
    '/users',
    '/demo/settings',
    '/demo/integrations',
  ]) {
    await page.goto(route);
    await expect(page.locator('main h1')).toBeVisible();
    await expect(page.getByText("We couldn't open the workspace")).toHaveCount(0);
  }
  await page.goto('/viewings/VIEW-5067');
  await page.getByRole('button', { name: 'Complete & invite' }).click();
  await page.getByRole('dialog').getByRole('button', { name: 'Confirm', exact: true }).click();
  await expect(
    page.getByRole('heading', { name: 'Application invitation generated' }),
  ).toBeVisible();
  await page.getByRole('link', { name: 'Open applicant experience' }).click();
  await expect(page.getByRole('heading', { name: 'Your application', exact: true })).toBeVisible();
  await page.getByLabel('Full name', { exact: true }).fill('Isla Campbell Demo');
  await page.reload();
  await expect(page.getByLabel('Full name', { exact: true })).toHaveValue('Isla Campbell Demo');
  await page.goto('/audit');
  await expect(
    page.locator('strong').filter({ hasText: 'Application invitation generated' }),
  ).toBeVisible();
  expect(errors).toEqual([]);
});
test('mobile field visit and complete inspection', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto('/login');
  await page.getByRole('button', { name: /Field Officer Emma/ }).click();
  await expect(page.getByRole('heading', { name: 'My day', exact: true })).toBeVisible();
  await page.screenshot({ path: '/tmp/portal-mobile.png', fullPage: true });
  expect(
    await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth),
  ).toBeTruthy();
  await page.goto('/field/visits/VIS-6002');
  await page.getByRole('button', { name: 'Start visit', exact: true }).click();
  await page.getByRole('link', { name: 'Open inspection' }).click();
  await expect(page.getByRole('radio', { name: 'Good', exact: true })).toHaveCount(14);
  for (const radio of await page.getByRole('radio', { name: 'Good', exact: true }).all())
    await radio.check();
  await page.getByRole('button', { name: 'Review & submit inspection' }).click();
  await page.getByRole('button', { name: 'Submit inspection', exact: true }).click();
  await expect(page.getByRole('heading', { name: 'Inspection report', exact: true })).toBeVisible();
  await page.reload();
  await expect(page.getByRole('heading', { name: 'Inspection report', exact: true })).toBeVisible();
});
test('applicant access boundaries and responsive screens', async ({ page }) => {
  await page.goto('/login');
  await page.getByRole('button', { name: /Applicant Isla/ }).click();
  await page.goto('/apply/APP-3042');
  await expect(page.getByRole('heading', { name: 'Access denied' })).toBeVisible();
  await page.goto('/applications');
  await expect(page.getByRole('heading', { name: 'Access denied' })).toBeVisible();
  for (const width of [1440, 1024, 768, 390]) {
    await page.setViewportSize({ width, height: 900 });
    await page.goto('/apply/APP-3041');
    await expect(
      page.getByRole('heading', { name: 'Your application', exact: true }),
    ).toBeVisible();
    expect(
      await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth),
    ).toBeTruthy();
  }
});
test('applicant submission through landlord decision in the UI', async ({ page }) => {
  await page.goto('/login');
  await page.getByRole('button', { name: /Administrator Alex/ }).click();
  await page.goto('/apply/APP-3041');
  await page.getByLabel('Full name', { exact: true }).fill('Isla Campbell');
  await page.getByLabel('Email address', { exact: true }).fill('isla@example.test');
  await page.getByLabel('Phone number', { exact: true }).fill('07700900000');
  await page.getByLabel('Date of birth', { exact: true }).fill('1994-05-12');
  await page.getByRole('button', { name: 'Save & continue' }).click();
  await page.getByLabel('Current address & postcode').fill('18 Example Road EH1 1AA');
  await page.getByLabel('Previous address').fill('Not applicable');
  await page.getByRole('button', { name: 'Save & continue' }).click();
  await page.getByLabel('Employment status').fill('Employed');
  await page.getByLabel('Employer / income source').fill('Example Studio');
  await page.getByLabel('Job title / circumstances').fill('Designer');
  await page.getByLabel('Annual gross income').fill('45000');
  await page.getByRole('button', { name: 'Save & continue' }).click();
  await page.getByLabel('Household members & pets').fill('One adult, no pets');
  await page.getByLabel('Rental history', { exact: true }).fill('Three years');
  await page.getByLabel('Reference contact details').fill('ref@example.test');
  await page.getByRole('button', { name: 'Save & continue' }).click();
  await expect(page.locator('input[type=file]')).toHaveCount(4);
  for (const input of await page.locator('input[type=file]').all())
    await input.setInputFiles({
      name: 'demo-evidence.pdf',
      mimeType: 'application/pdf',
      buffer: Buffer.from('%PDF-1.4 demo metadata'),
    });
  await page.getByRole('button', { name: 'Review application' }).click();
  await page.getByRole('checkbox').check();
  await page.getByRole('button', { name: 'Submit application', exact: true }).click();
  await expect(page.getByRole('heading', { name: 'Your application journey' })).toBeVisible();
  await page.goto('/applications/APP-3041?tab=Documents');
  await expect(page.getByRole('button', { name: 'Accept document', exact: true })).toHaveCount(4);
  for (const button of await page
    .getByRole('button', { name: 'Accept document', exact: true })
    .all())
    await button.click();
  await page.getByRole('tab', { name: 'Verification', exact: true }).click();
  await page.getByLabel('Simulate identity result').selectOption('Verified');
  await page.getByRole('tab', { name: 'Credit Check', exact: true }).click();
  await page.getByLabel('Simulate credit result').selectOption('Passed');
  await page.getByRole('tab', { name: 'FCDO Check', exact: true }).click();
  await page.getByLabel('Simulate fcdo result').selectOption('Clear');
  await page.getByRole('tab', { name: 'Overview', exact: true }).click();
  for (const action of ['Move to review', 'Approve internally', 'Send to landlord']) {
    await page.getByRole('button', { name: action, exact: true }).click();
    await page
      .getByLabel('Reason / recommendation')
      .fill('Reviewed and recommended for this fictional demonstration');
    await page.getByRole('button', { name: 'Confirm action' }).click();
  }
  await page.getByRole('button', { name: 'Landlord approval pack', exact: true }).click();
  await page.getByRole('button', { name: 'Record approval', exact: true }).click();
  await page.getByLabel('Reason / recommendation').fill('Landlord approved the application');
  await page.getByRole('button', { name: 'Confirm action' }).click();
  await expect(page.locator('.page-heading .badge')).toHaveText('Approved');
  await page.goto('/properties/PROP-1001');
  await expect(page.locator('.page-heading .badge')).toHaveText('Let Agreed');
});
