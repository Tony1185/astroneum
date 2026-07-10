'use client'

import { useState, useEffect, useCallback } from 'react'
import { AlertManager } from '@tony01/astroneum'
import AlertDialog from '../_components/alerts/AlertDialog'
import '../_components/alerts/alert-dialog.css'

interface AlertItem {
  id: string
  symbol: string
  condition: string
  price: number
  status: string
  frequency: string
  triggeredAt?: string
  createdAt: string
  messageTemplate?: string
  soundEnabled: boolean
  notificationEnabled: boolean
  webhookUrl?: string
  webhookStatus?: string
  webhookHttpStatus?: number
  webhookStatusAt?: string
}

function WebhookStatusBadge({ status, httpStatus, at }: { status?: string; httpStatus?: number; at?: string }) {
  if (!status) {
    return (
      <span
        title="Webhook"
        style={{
          padding: '2px 8px', borderRadius: 4, fontSize: 12, fontWeight: 600,
          color: '#787B86', background: 'rgba(120,123,134,0.10)', border: '1px solid rgba(120,123,134,0.35)',
          whiteSpace: 'nowrap',
        }}
      >
        Webhook
      </span>
    )
  }
  const tone = status === 'delivered'
    ? { color: '#26A69A', bg: 'rgba(38,166,154,0.12)', border: 'rgba(38,166,154,0.40)' }
    : status === 'failed'
      ? { color: '#EF5350', bg: 'rgba(239,83,80,0.12)', border: 'rgba(239,83,80,0.40)' }
      : { color: '#F89D3E', bg: 'rgba(249,157,62,0.12)', border: 'rgba(249,157,62,0.40)' }
  const label = status === 'delivered' ? 'Delivered' : status === 'failed' ? 'Failed' : 'Sending'
  const titleText = `Webhook ${label.toLowerCase()}${typeof httpStatus === 'number' ? ` Â· HTTP ${httpStatus}` : ''}${at ? ` Â· ${new Date(at).toLocaleString()}` : ''}`
  return (
    <span
      title={titleText}
      style={{
        padding: '2px 8px', borderRadius: 4, fontSize: 12, fontWeight: 600,
        color: tone.color, background: tone.bg, border: `1px solid ${tone.border}`,
        fontFeatureSettings: "'tnum' 1", whiteSpace: 'nowrap',
      }}
    >
      Webhook {label}{typeof httpStatus === 'number' ? ` Â· ${httpStatus}` : ''}
    </span>
  )
}

export default function AlertsPage() {
  const [alerts, setAlerts] = useState<AlertItem[]>([])
  const [showDialog, setShowDialog] = useState(false)

  const refresh = useCallback(() => {
    const mgr = AlertManager.getInstance()
    setAlerts([...mgr.getAll()] as AlertItem[])
  }, [])

  useEffect(() => { refresh() }, [refresh])

  const active = alerts.filter(a => a.status === 'active')
  const history = alerts.filter(a => a.status !== 'active')

  const handleDelete = (id: string) => {
    AlertManager.getInstance().delete(id)
    refresh()
  }

  const handleReactivate = (id: string) => {
    AlertManager.getInstance().reactivate(id)
    refresh()
  }

  return (
    <div style={{
      minHeight: '100vh', background: '#0d0e12', color: '#d1d4dc',
      fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
      padding: '24px 20px',
    }}>
      <div style={{ maxWidth: 720, margin: '0 auto' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 24 }}>
          <div>
            <h1 style={{ fontSize: 24, fontWeight: 700, marginBottom: 4 }}>Alert Manager</h1>
            <p style={{ fontSize: 13, color: '#8a8f9c' }}>
              {active.length} active Â· {history.length} in history
            </p>
          </div>
          <button
            onClick={() => setShowDialog(true)}
            style={{
              padding: '8px 20px', border: 'none', borderRadius: 6,
              background: '#2962ff', color: '#fff', fontSize: 14, fontWeight: 600, cursor: 'pointer',
            }}
          >
            Create alert
          </button>
        </div>

        {active.length > 0 && (
          <>
            <h2 style={{ fontSize: 13, fontWeight: 700, color: '#8a8f9c', marginBottom: 12 }}>
              Active ({active.length})
            </h2>
            <div style={{ marginBottom: 32 }}>
              {active.map(a => (
                <div key={a.id} style={{
                  display: 'flex', alignItems: 'center', gap: 12, padding: '12px 16px',
                  background: '#16181d', border: '1px solid #2a2e39', borderRadius: 8, marginBottom: 8,
                }}>
                  <span style={{
                    padding: '2px 8px', borderRadius: 4, fontSize: 12, fontWeight: 600,
                    background: '#1a3a24', color: '#3fb950', border: '1px solid #3fb950',
                  }}>{a.condition}</span>
                  <span style={{ fontWeight: 600 }}>{a.symbol}</span>
                  <span style={{ color: '#8a8f9c', fontFeatureSettings: "'tnum' 1" }}>{a.price}</span>
                  {a.messageTemplate && <span style={{ color: '#8a8f9c', fontSize: 13 }}>{a.messageTemplate}</span>}
                  {a.webhookUrl && (
                    <WebhookStatusBadge status={a.webhookStatus} httpStatus={a.webhookHttpStatus} at={a.webhookStatusAt} />
                  )}
                  <span style={{ flex: 1 }} />
                  {a.soundEnabled && <span style={{ fontSize: 16 }} title="Sound">ðŸ”Š</span>}
                  {a.notificationEnabled && <span style={{ fontSize: 16 }} title="App notification">ðŸ“±</span>}
                  <button onClick={() => handleDelete(a.id)} style={{
                    border: 'none', background: 'transparent', color: '#8a8f9c', cursor: 'pointer', fontSize: 18,
                  }}>Ã—</button>
                </div>
              ))}
            </div>
          </>
        )}

        {history.length > 0 && (
          <>
            <h2 style={{ fontSize: 13, fontWeight: 700, color: '#8a8f9c', marginBottom: 12 }}>
              History ({history.length})
            </h2>
            <div>
              {history.map(a => (
                <div key={a.id} style={{
                  display: 'flex', alignItems: 'center', gap: 12, padding: '12px 16px',
                  background: '#16181d', border: '1px solid #2a2e39', borderRadius: 8, marginBottom: 8, opacity: 0.7,
                }}>
                  <span style={{
                    padding: '2px 8px', borderRadius: 4, fontSize: 12, fontWeight: 600,
                    background: a.status === 'triggered' ? '#3d2e00' : '#2a2e39',
                    color: a.status === 'triggered' ? '#d29922' : '#8a8f9c',
                    border: '1px solid', borderColor: a.status === 'triggered' ? '#d29922' : '#2a2e39',
                  }}>{a.status}</span>
                  <span style={{ fontWeight: 600 }}>{a.symbol}</span>
                  <span style={{ color: '#8a8f9c', fontFeatureSettings: "'tnum' 1" }}>{a.condition} {a.price}</span>
                  {a.webhookUrl && (
                    <WebhookStatusBadge status={a.webhookStatus} httpStatus={a.webhookHttpStatus} at={a.webhookStatusAt} />
                  )}
                  {a.triggeredAt && <span style={{ color: '#8a8f9c', fontSize: 12 }}>{new Date(a.triggeredAt).toLocaleString()}</span>}
                  <span style={{ flex: 1 }} />
                  <button onClick={() => handleReactivate(a.id)} style={{
                    border: 'none', background: 'transparent', color: '#2962ff', cursor: 'pointer', fontSize: 14,
                  }}>â†º Reactivate</button>
                  <button onClick={() => handleDelete(a.id)} style={{
                    border: 'none', background: 'transparent', color: '#8a8f9c', cursor: 'pointer', fontSize: 18,
                  }}>Ã—</button>
                </div>
              ))}
            </div>
          </>
        )}

        {alerts.length === 0 && (
          <div style={{
            padding: '48px 16px', textAlign: 'center', color: '#8a8f9c',
            background: '#16181d', border: '1px solid #2a2e39', borderRadius: 8,
          }}>
            <p style={{ fontSize: 16, marginBottom: 8 }}>No alerts yet</p>
            <p style={{ fontSize: 13 }}>Click "Create alert" to set up your first price alert.</p>
          </div>
        )}
      </div>

      {showDialog && (
        <AlertDialog
          symbol="BTCUSDT"
          symbolLogo="https://s3-symbol-logo.tradingview.com/crypto/XTVCBTC.svg"
          currentPrice={undefined}
          onClose={() => setShowDialog(false)}
          onCreated={() => refresh()}
        />
      )}
    </div>
  )
}
