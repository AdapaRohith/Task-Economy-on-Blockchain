// ─── API Configuration ──────────────────────────────────────────────────────
// Local development (localhost): uses Express backend via /api (Vite proxy).
// Deployed static app: requires VITE_N8N_WEBHOOK_BASE.
//
// Optional env var:
//   VITE_N8N_WEBHOOK_BASE=https://YOUR-INSTANCE.app.n8n.cloud/webhook
//   VITE_USE_N8N_ON_LOCALHOST=true
// ─────────────────────────────────────────────────────────────────────────────

const configuredWebhookBase = String(import.meta.env.VITE_N8N_WEBHOOK_BASE || '').trim()
const isLocalhost =
  typeof window !== 'undefined' && ['localhost', '127.0.0.1'].includes(window.location.hostname)
const useN8nOnLocalhost = String(import.meta.env.VITE_USE_N8N_ON_LOCALHOST || 'false').toLowerCase() === 'true'

const API_BASE = isLocalhost
  ? (useN8nOnLocalhost && configuredWebhookBase ? configuredWebhookBase : '/api')
  : configuredWebhookBase

// Algorand Testnet indexer (public, no auth needed)
const INDEXER_BASE = 'https://testnet-idx.algonode.cloud'
const EXPLORER_BASE = 'https://testnet.algoexplorer.io/tx/'

export const API = {
  analyze: `${API_BASE}/analyze`,
  pay: `${API_BASE}/pay`,
  indexerBase: INDEXER_BASE,
  explorerBase: EXPLORER_BASE,
}

if (!configuredWebhookBase && (!isLocalhost || useN8nOnLocalhost)) {
  console.warn('VITE_N8N_WEBHOOK_BASE is not set. Analyze/Pay endpoints will not be available in deployed mode.')
}
