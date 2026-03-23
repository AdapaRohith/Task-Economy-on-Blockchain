// ─── API Configuration ──────────────────────────────────────────────────────
// When running locally with Express backend: leave N8N_WEBHOOK_BASE empty.
// When deployed to GitHub Pages (static): set your n8n webhook base URL.
//
// n8n Cloud example:  https://YOUR-INSTANCE.app.n8n.cloud/webhook
// Self-hosted example: https://your-n8n-domain.com/webhook
// ─────────────────────────────────────────────────────────────────────────────

const N8N_WEBHOOK_BASE = 'https://adaparohith.app.n8n.cloud/webhook'

// Algorand Testnet indexer (public, no auth needed)
const INDEXER_BASE = 'https://testnet-idx.algonode.cloud'
const EXPLORER_BASE = 'https://testnet.algoexplorer.io/tx/'

export const API = {
  analyze: `${N8N_WEBHOOK_BASE}/analyze`,
  pay: `${N8N_WEBHOOK_BASE}/pay`,
  indexerBase: INDEXER_BASE,
  explorerBase: EXPLORER_BASE,
}
