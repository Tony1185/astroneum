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

test('chart layouts restore indicator settings', async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 })
  await page.goto('', { waitUntil: 'networkidle' })
  await page.waitForFunction(() => Boolean((window as unknown as { __astroneum?: unknown }).__astroneum))

  const restored = await page.evaluate(() => {
    const chart = (window as unknown as { __astroneum: {
      createIndicator: (indicator: { name: string; calcParams: number[] }, isStack?: boolean, paneOptions?: { id: string }) => string | null
      getIndicators: () => Array<{ name: string; calcParams: number[]; visible: boolean }>
      removeIndicator: () => boolean
      serializeState: () => unknown
      loadState: (state: unknown) => void
    } }).__astroneum
    chart.createIndicator({ name: 'BOLL', calcParams: [34, 3] }, true, { id: 'candle_pane' })
    const saved = chart.serializeState()
    chart.removeIndicator()
    chart.loadState(saved)
    return chart.getIndicators().map(({ name, calcParams, visible }) => ({ name, calcParams, visible }))
  })

  expect(restored).toContainEqual({ name: 'BOLL', calcParams: [34, 3], visible: true })
})

test('active layouts autosave and restore on reload', async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 })
  await page.goto('', { waitUntil: 'networkidle' })
  await page.waitForFunction(() => Boolean((window as unknown as { __astroneum?: unknown }).__astroneum))
  await page.getByTitle('Save / Load chart layout').click()
  await page.getByRole('textbox', { name: 'Layout name' }).fill('Persistent layout')
  await page.getByRole('menuitem', { name: 'Save' }).click()
  await expect(page.locator('.term-saveload-name')).toHaveText('Persistent layout')
  await page.evaluate(() => {
    const chart = (window as unknown as { __astroneum: {
      createIndicator: (indicator: { name: string; calcParams: number[] }, isStack?: boolean, paneOptions?: { id: string }) => string | null
    } }).__astroneum
    chart.createIndicator({ name: 'BOLL', calcParams: [34, 3] }, true, { id: 'candle_pane' })
  })
  await page.waitForFunction(() => {
    const templates = JSON.parse(localStorage.getItem('astroneum-chart-templates') ?? '[]') as Array<{
      name: string
      state: { mainIndicators: Array<{ name: string; calcParams?: number[] }> }
    }>
    return templates.some(template => template.name === 'Persistent layout' && template.state.mainIndicators.some(indicator => indicator.name === 'BOLL' && indicator.calcParams?.join(',') === '34,3'))
  })

  await page.reload({ waitUntil: 'networkidle' })
  await page.waitForFunction(() => {
    const chart = (window as unknown as { __astroneum?: {
      getIndicators: () => Array<{ name: string; calcParams: number[] }>
    } }).__astroneum
    return chart?.getIndicators().some(indicator => indicator.name === 'BOLL' && indicator.calcParams.join(',') === '34,3')
  })
  await expect(page.locator('.term-saveload-name')).toHaveText('Persistent layout')
})

test('layout manager duplicates, renames, timestamps, and confirms deletion', async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 })
  await page.goto('', { waitUntil: 'networkidle' })
  await page.getByTitle('Save / Load chart layout').click()
  await page.getByRole('textbox', { name: 'Layout name' }).fill('Layout alpha')
  await page.getByRole('menuitem', { name: 'Save' }).click()
  await expect(page.locator('.term-menu time')).toHaveText('Just now')
  await expect(page.locator('.term-menu')).toHaveScreenshot('layout-manager.png')

  await page.getByRole('button', { name: 'Duplicate Layout alpha' }).click()
  await expect(page.getByRole('menuitem', { name: /Layout alpha copy/ })).toBeVisible()
  await page.getByRole('button', { name: 'Rename Layout alpha copy' }).click()
  await page.getByRole('textbox', { name: 'Rename Layout alpha copy' }).fill('Desk layout')
  await page.getByRole('button', { name: 'Rename', exact: true }).click()
  await expect(page.getByRole('menuitem', { name: /Desk layout/ })).toBeVisible()

  await page.getByRole('button', { name: 'Delete Desk layout' }).click()
  const confirm = page.getByRole('dialog', { name: 'Delete layout' })
  await expect(confirm).toBeVisible()
  await confirm.getByRole('button', { name: 'Delete layout' }).click()
  await expect(page.getByRole('menuitem', { name: /Desk layout/ })).toHaveCount(0)
})

test('workspace chrome restores sidebar, dock, chart type, and grid selection', async ({ page }) => {
  const pageErrors: string[] = []
  page.on('pageerror', error => { pageErrors.push(error.stack ?? error.message) })
  await page.setViewportSize({ width: 1440, height: 900 })
  await page.goto('', { waitUntil: 'networkidle' })
  await page.getByRole('button', { name: 'Chart type' }).click()
  await page.getByRole('button', { name: 'Area' }).click()
  await expect(page.getByRole('button', { name: 'Chart type' })).toHaveAttribute('title', 'Chart type: Area')

  await page.getByRole('button', { name: 'Chart layout' }).click()
  await page.getByRole('button', { name: '2 columns' }).click()
  expect(pageErrors).toEqual([])
  await expect(page.locator('.astroneum-multi-cell')).toHaveCount(2)
  await page.getByRole('button', { name: 'Hide panel' }).click()
  await page.getByRole('button', { name: 'Minimize panel' }).click()
  await page.waitForFunction(() => {
    const shell = JSON.parse(localStorage.getItem('astroneum-demo-workspace-shell') ?? '{}') as { sidebarOpen?: boolean; dockOpen?: boolean }
    const preferences = JSON.parse(localStorage.getItem('astroneum-demo-workspace-preferences') ?? '{}') as { chartType?: string; layoutCount?: number }
    return shell.sidebarOpen === false && shell.dockOpen === false && preferences.chartType === 'area' && preferences.layoutCount === 2
  })

  await page.reload({ waitUntil: 'domcontentloaded' })
  await expect(page.locator('.astroneum-workspace')).toHaveAttribute('data-sidebar', 'closed')
  await expect(page.locator('.astroneum-workspace')).toHaveAttribute('data-dock', 'closed')
  await expect(page.getByRole('button', { name: 'Chart type' })).toHaveAttribute('title', 'Chart type: Area')
  await expect(page.locator('.astroneum-multi-cell')).toHaveCount(2)
})

test('multi-chart persists independent pane state', async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 })
  await page.goto('', { waitUntil: 'networkidle' })
  await page.getByRole('button', { name: 'Chart layout' }).click()
  await page.getByRole('button', { name: '2 columns' }).click()
  const cells = page.locator('.astroneum-multi-cell')
  await expect(cells).toHaveCount(2)
  await cells.first().getByLabel('Period: 5m').click()
  await page.waitForFunction(() => {
    const layout = JSON.parse(localStorage.getItem('astroneum-demo-multi-layout') ?? '{}') as {
      states?: Array<{ period?: { text?: string } }>
    }
    return layout.states?.[0]?.period?.text === '5m' && layout.states?.[1]?.period?.text === '1m'
  })

  await page.reload({ waitUntil: 'domcontentloaded' })
  const restoredCells = page.locator('.astroneum-multi-cell')
  await expect(restoredCells).toHaveCount(2)
  await expect(restoredCells.first().getByLabel('Period: 5m')).toHaveAttribute('aria-pressed', 'true')
  await expect(restoredCells.nth(1).getByLabel('Period: 1m')).toHaveAttribute('aria-pressed', 'true')
})

test('drawings persist through save and load round-trip', async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 })
  await page.goto('', { waitUntil: 'networkidle' })
  await page.waitForFunction(() => Boolean((window as unknown as { __astroneum?: unknown }).__astroneum))

  const result = await page.evaluate(() => {
    const chart = (window as unknown as { __astroneum: {
      createOverlay: (overlay: { name: string; points?: Array<{ value?: number }> }) => string | null
      removeOverlay: (filter?: { name?: string }) => boolean
      serializeState: () => unknown
      loadState: (state: unknown) => void
    } }).__astroneum
    chart.createOverlay({ name: 'horizontalStraightLine', points: [{ value: 100000 }] })
    const saved = chart.serializeState() as { overlays?: Array<{ name: string }> }
    const hasOverlay = saved.overlays?.some(o => o.name === 'horizontalStraightLine') ?? false
    chart.removeOverlay()
    chart.loadState(saved)
    const restored = chart.serializeState() as { overlays?: Array<{ name: string }> }
    return {
      hasOverlay,
      restoredCount: restored.overlays?.length ?? 0,
      restoredNames: restored.overlays?.map(o => o.name) ?? [],
    }
  })

  expect(result.hasOverlay).toBe(true)
  expect(result.restoredCount).toBeGreaterThan(0)
  expect(result.restoredNames).toContain('horizontalStraightLine')
})
