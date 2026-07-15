import { expect, test } from '@playwright/test'

const viewports = [
  { name: 'desktop-wide', width: 1920, height: 945 },
  { name: 'desktop', width: 1440, height: 900 },
  { name: 'desktop-floor', width: 1024, height: 768 },
]

for (const viewport of viewports) {
  test(`workspace chrome ${viewport.name}`, async ({ page }) => {
    await page.setViewportSize(viewport)
    await page.goto('', { waitUntil: 'networkidle' })
    await expect(page.locator('.astroneum-workspace')).toBeVisible()
    await expect(page.locator('.astroneum-workspace-toolbar')).toHaveScreenshot(`${viewport.name}-toolbar.png`)
    await expect(page.locator('.astroneum-workspace-sidebar')).toHaveScreenshot(`${viewport.name}-sidebar.png`, {
      mask: [page.locator('.astroneum-widget')],
    })
  })
}

test('Escape closes only the top workspace layer', async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 })
  await page.goto('', { waitUntil: 'networkidle' })
  const trigger = page.getByRole('button', { name: 'Quick Search' })
  await trigger.click()
  await expect(page.getByRole('dialog', { name: 'Command palette' })).toBeVisible()
  await page.keyboard.press('Escape')
  await expect(page.getByRole('dialog', { name: 'Command palette' })).toBeHidden()
  await expect(trigger).toBeFocused()
})

test('toolbar dialogs register with the workspace layer manager', async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 })
  await page.goto('', { waitUntil: 'networkidle' })

  const symbolTrigger = page.locator('.term-toolbar-control').first()
  await symbolTrigger.click()
  await expect(page.locator('.astroneum-symbol-search-modal')).toBeVisible()
  await expect(page.locator('.astroneum-modal')).toHaveCSS('position', 'fixed')
  await page.keyboard.press('Escape')
  await expect(page.locator('.astroneum-symbol-search-modal')).toBeHidden()

  const alertTrigger = page.getByRole('button', { name: 'Create alert' })
  await alertTrigger.click()
  await expect(page.locator('.astroneum-alert-modal')).toBeVisible()
  await page.keyboard.press('Escape')
  await expect(page.locator('.astroneum-alert-modal')).toBeHidden()
})

test('Save/Load exposes an inline workspace persistence workflow', async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 })
  await page.goto('', { waitUntil: 'networkidle' })
  await page.getByTitle('Save / Load chart layout').click()
  await expect(page.getByRole('textbox', { name: 'Layout name' })).toBeVisible()
  await expect(page.getByRole('button', { name: 'Undo' })).toBeDisabled()
  await expect(page.getByRole('button', { name: 'Redo' })).toBeDisabled()
})
