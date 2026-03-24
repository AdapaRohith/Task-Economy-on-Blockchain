import { useState } from 'react'
import { motion } from 'framer-motion'
import { Link2, Search, Wallet } from 'lucide-react'
import { expectedFlow, proofSchema, receiverRules } from '../content'
import { API } from '../config'

const readJsonResponse = async (response, defaultMessage) => {
  const rawText = await response.text()

  if (!rawText || !rawText.trim()) {
    if (!response.ok) {
      throw new Error(`${defaultMessage} (HTTP ${response.status})`)
    }
    return {}
  }

  try {
    return JSON.parse(rawText)
  } catch {
    throw new Error(`Service returned invalid JSON (HTTP ${response.status}).`)
  }
}

export function VerifyPage({ workflowState, threshold }) {
  const [txId, setTxId] = useState(workflowState.txId || '')
  const [verificationState, setVerificationState] = useState({
    phase: 'idle',
    message: 'Enter a transaction ID to fetch proof directly from Algorand Testnet.',
    data: null,
  })

  const handleVerify = async () => {
    if (!txId.trim()) {
      setVerificationState({
        phase: 'error',
        message: 'Transaction ID is required for on-chain verification.',
        data: null,
      })
      return
    }

    setVerificationState({
      phase: 'loading',
      message: 'Fetching transaction details from Algorand indexer.',
      data: null,
    })

    try {
      const response = await fetch(
        `${API.indexerBase}/v2/transactions/${encodeURIComponent(txId.trim())}`
      )
      const raw = await readJsonResponse(response, 'Transaction lookup failed.')
      if (!response.ok || !raw.transaction) {
        throw new Error(raw.message || `Transaction not found on indexer (HTTP ${response.status}).`)
      }

      const tx = raw.transaction
      const payment = tx['payment-transaction'] || {}

      let noteText = ''
      let noteJson = null
      if (tx.note) {
        try {
          noteText = atob(tx.note)
          noteJson = JSON.parse(noteText)
        } catch {
          // note is not JSON, keep raw text
        }
      }

      const data = {
        ok: true,
        transactionId: txId.trim(),
        explorerUrl: `${API.explorerBase}${txId.trim()}`,
        confirmedRound: tx['confirmed-round'] || null,
        senderAddress: tx.sender || '',
        receiverAddress: payment.receiver || '',
        amountMicroAlgos: payment.amount ?? null,
        noteText,
        noteJson,
      }

      setVerificationState({
        phase: 'success',
        message: 'On-chain transaction proof loaded successfully.',
        data,
      })
    } catch (error) {
      setVerificationState({
        phase: 'error',
        message: error.message,
        data: null,
      })
    }
  }


  return (
    <div className="page-shell">
      <section className="spec-grid">
        <motion.section
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: '-60px' }}
          transition={{ duration: 0.45 }}
          className="workspace-panel"
        >
          <div className="section-head">
            <div>
              <span className="section-kicker">Verification Route</span>
              <h2>Fetch and decode real proof by transaction ID from Algorand Testnet.</h2>
            </div>
            <Link2 size={18} />
          </div>

          <div className="form-grid">
            <label>
              Transaction ID
              <input
                value={txId}
                onChange={(event) => setTxId(event.target.value)}
                placeholder="Paste Algorand Testnet transaction ID"
              />
            </label>
          </div>

          <div className={`run-feedback run-feedback-${verificationState.phase}`}>
            <span className="run-feedback-label">Verification state</span>
            <strong>{verificationState.phase}</strong>
            <p>{verificationState.message}</p>
          </div>

          <button
            type="button"
            className={`primary-action action-button ${verificationState.phase === 'loading' ? 'is-processing' : ''}`}
            onClick={handleVerify}
            disabled={verificationState.phase === 'loading'}
          >
            {verificationState.phase === 'loading' ? 'Verifying transaction...' : 'Verify Proof by Tx ID'}
          </button>

          <div className="proof-schema-card">
            <pre>{`{\n  ${proofSchema.join(',\n  ')}\n}`}</pre>
          </div>

          <div className="mini-list">
            <div className="mini-card">
              <span>Latest local note</span>
              <strong className="long-value">{workflowState.note ? JSON.stringify(workflowState.note) : 'Not generated yet'}</strong>
              <p>This is the latest app state. Use tx-id lookup above for independent on-chain verification.</p>
            </div>
            <div className="mini-card">
              <span>Threshold</span>
              <strong>{threshold}</strong>
              <p>Only successful tasks above threshold reach on-chain payment execution.</p>
            </div>
          </div>
        </motion.section>

        <motion.section
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: '-60px' }}
          transition={{ duration: 0.45, delay: 0.08 }}
          className="workspace-panel"
        >
          <div className="section-head">
            <div>
              <span className="section-kicker">Verified Result</span>
              <h2>Decoded transaction note and proof metadata.</h2>
            </div>
            <Search size={18} />
          </div>

          <div className="mini-list">
            <div className="mini-card">
              <span>Explorer URL</span>
              <strong className="long-value">
                {verificationState.data?.transactionId || 'No verified transaction yet'}
              </strong>
              <p>{verificationState.data?.explorerUrl || 'Explorer link appears after a successful tx-id lookup.'}</p>
            </div>
            <div className="mini-card">
              <span>Decoded note JSON</span>
              <strong className="long-value">
                {verificationState.data?.noteJson ? JSON.stringify(verificationState.data.noteJson) : 'No decoded note yet'}
              </strong>
              <p>{verificationState.data?.noteText || 'Decoded note text will appear here.'}</p>
            </div>
            <div className="mini-card">
              <span>Transaction details</span>
              <strong className="long-value">
                {verificationState.data?.receiverAddress || 'No receiver loaded yet'}
              </strong>
              <p>
                {verificationState.data
                  ? `Sender ${verificationState.data.senderAddress} paid ${verificationState.data.amountMicroAlgos} microAlgos.`
                  : 'Sender, receiver, amount, and round will appear after verification.'}
              </p>
            </div>
          </div>

          <div className="timeline-list">
            {expectedFlow.map((item, index) => (
              <div key={item} className="timeline-card">
                <span className="timeline-index">0{index + 1}</span>
                <div>
                  <strong>{item}</strong>
                </div>
              </div>
            ))}
          </div>

          <div className="value-stack verify-rules">
            {receiverRules.map((item) => (
              <div key={item} className="mini-card">
                <strong>{item}</strong>
                <p>Verification stays aligned to Algorand-native receiver and proof handling.</p>
              </div>
            ))}
          </div>
        </motion.section>
      </section>
    </div>
  )
}
