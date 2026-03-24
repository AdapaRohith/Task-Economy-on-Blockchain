// API configuration
// Local development uses the bundled Express backend through Vite's /api proxy.
// Production can override either endpoint with VITE_ANALYZE_URL / VITE_PAY_URL.

const API_BASE = String(import.meta.env.VITE_API_BASE || '/api').trim() || '/api'
const ANALYZE_URL = String(import.meta.env.VITE_ANALYZE_URL || '').trim()
const PAY_URL = String(import.meta.env.VITE_PAY_URL || '').trim()

const INDEXER_BASE = 'https://testnet-idx.algonode.cloud'
const EXPLORER_BASE =
  String(import.meta.env.VITE_ALGO_EXPLORER_BASE || '').trim() ||
  'https://testnet.explorer.perawallet.app/tx/'

export const API = {
  analyze: ANALYZE_URL || `${API_BASE}/analyze`,
  pay: PAY_URL || `${API_BASE}/pay`,
  indexerBase: INDEXER_BASE,
  explorerBase: EXPLORER_BASE,
}
