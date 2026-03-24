import { useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  BrainCircuit,
  CheckCircle2,
  ChevronDown,
  Loader2,
  Sparkles,
  Wallet,
  XCircle,
  ExternalLink,
  ShieldCheck,
} from 'lucide-react'
import { receiverRules } from '../content'
import { API } from '../config'

export function AnalyzePage({
  selectedStackItemId,
  setSelectedStackItemId,
  taskTitle,
  setTaskTitle,
  taskBudget,
  setTaskBudget,
  taskType,
  setTaskType,
  receiverAddress,
  setReceiverAddress,
  workflowState,
  threshold,
  onRunWorkflow,
  onPayWorkflow,
}) {
  const resultsRef = useRef(null)
  const isScoring = workflowState.phase === 'scoring'
  const isPaying = workflowState.phase === 'paying'
  const isProcessing = isScoring || isPaying
  const hasResults =
    workflowState.phase !== 'idle' && (workflowState.phase !== 'error' || Boolean(workflowState.analysis))
  const isSuccess = workflowState.phase === 'success'
  const isSkipped = workflowState.phase === 'skipped'
  const isError = workflowState.phase === 'error'

  const score = workflowState.score ?? null
  const scorePasses = score !== null && score >= threshold
  const aiSummary = workflowState.analysis?.summary || ''
  const decisionReason = workflowState.analysis?.decisionReason || ''
  const analysisFactors = Array.isArray(workflowState.analysis?.factors)
    ? workflowState.analysis.factors.filter(Boolean)
    : []
  const normalizedSummary = aiSummary.trim().toLowerCase()
  const normalizedReason = decisionReason.trim().toLowerCase()
  const showDecisionReason =
    Boolean(decisionReason) &&
    normalizedReason !== normalizedSummary &&
    !normalizedSummary.includes(normalizedReason)
  const txId = workflowState.txId || ''
  const explorerLink = txId
    ? `${API.explorerBase}${encodeURIComponent(String(txId).trim())}`
    : workflowState.explorerUrl || ''
  const safeBudget = Number.isFinite(Number(taskBudget)) ? Number(taskBudget).toFixed(2) : taskBudget
  const canPreparePayment = scorePasses && !txId

  const getQualityFromScore = (value) => {
    if (value === null) {
      return {
        label: 'Not evaluated yet',
        detail: 'Run AI Score to get a quality assessment for this task.',
      }
    }

    if (value >= 90) {
      return {
        label: 'Excellent',
        detail: 'High confidence task quality with strong execution readiness.',
      }
    }

    if (value >= 75) {
      return {
        label: 'Good',
        detail: 'Task quality is strong enough for the user to consider payment.',
      }
    }

    if (value >= 60) {
      return {
        label: 'Fair',
        detail: 'Task is acceptable but needs improvements to consistently pass threshold.',
      }
    }

    return {
      label: 'Needs improvement',
      detail: 'Task quality is currently too weak and is likely to fail threshold checks.',
    }
  }

  const quality = getQualityFromScore(score)

  const taskUnderstanding = `Task "${taskTitle}" is categorized as ${taskType} with a reward budget of ${safeBudget} ALGO. The workflow evaluates this task for quality and payout eligibility against threshold ${threshold}.`

  const handleRun = async () => {
    await onRunWorkflow()
    setTimeout(() => {
      resultsRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' })
    }, 300)
  }

  const handlePay = async () => {
    await onPayWorkflow()
    setTimeout(() => {
      resultsRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' })
    }, 300)
  }

  const handleVerify = () => {
    if (!explorerLink) return
    window.open(explorerLink, '_blank', 'noreferrer')
  }

  return (
    <div className="page-shell">

      {/* ── SECTION 1: INPUT FORM ── */}
      <motion.section
        initial={{ opacity: 0, y: 18 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="analyze-form-section"
      >
        <div className="analyze-form-header">
          <div className="analyze-form-header-label">
            <Sparkles size={16} />
            <span>Task Submission</span>
          </div>
          <h2>Fill in the task details and run the AI score</h2>
          <p className="analyze-form-subtitle">
            Submit the task details to n8n for scoring first. If the score passes
            <strong> {threshold}</strong>, you can then choose whether to pay by adding
            a receiver address.
          </p>
        </div>

        <div className="analyze-form-body">
          <div className="analyze-input-grid">
            <label className="analyze-label">
              <span>Task Title</span>
              <input
                className="analyze-input"
                value={taskTitle}
                onChange={(e) => setTaskTitle(e.target.value)}
                placeholder="Describe the task…"
                disabled={isProcessing}
              />
            </label>

            <label className="analyze-label">
              <span>Reward Amount (ALGO)</span>
              <input
                className="analyze-input"
                type="number"
                value={taskBudget}
                onChange={(e) => setTaskBudget(e.target.value)}
                placeholder="e.g. 0.10"
                min="0"
                step="0.01"
                disabled={isProcessing}
              />
            </label>

            <label className="analyze-label">
              <span>Task Class</span>
              <select
                className="analyze-input analyze-select"
                value={taskType}
                onChange={(e) => setTaskType(e.target.value)}
                disabled={isProcessing}
              >
                <option>Research</option>
                <option>Code Review</option>
                <option>Analytics</option>
                <option>Payment Verification</option>
              </select>
            </label>

          </div>

          {/* Error state */}
          <AnimatePresence>
            {isError && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                className="analyze-error-row"
              >
                <XCircle size={16} />
                <span>{workflowState.message}</span>
              </motion.div>
            )}
          </AnimatePresence>

          <motion.button
            className={`analyze-run-btn${isProcessing ? ' is-processing' : ''}`}
            onClick={handleRun}
            disabled={isProcessing}
            whileHover={!isProcessing ? { y: -2, scale: 1.01 } : {}}
            whileTap={!isProcessing ? { scale: 0.99 } : {}}
          >
            {isScoring ? (
              <>
                <Loader2 size={18} className="spin-icon" />
                Running AI score…
              </>
            ) : (
              <>
                <BrainCircuit size={18} />
                Run AI Score
              </>
            )}
          </motion.button>

          {canPreparePayment && (
            <div className="result-block">
              <span className="result-block-label">Receiver Algorand Address</span>
              <div className="analyze-input-icon-wrap">
                <Wallet size={15} className="analyze-input-icon" />
                <input
                  className="analyze-input with-icon"
                  value={receiverAddress}
                  onChange={(e) => setReceiverAddress(e.target.value)}
                  placeholder="Paste Algorand Testnet address here…"
                  disabled={isProcessing}
                />
              </div>

              <motion.button
                className={`analyze-run-btn${isPaying ? ' is-processing' : ''}`}
                onClick={handlePay}
                disabled={isProcessing}
                whileHover={!isProcessing ? { y: -2, scale: 1.01 } : {}}
                whileTap={!isProcessing ? { scale: 0.99 } : {}}
              >
                {isPaying ? (
                  <>
                    <Loader2 size={18} className="spin-icon" />
                    Sending payment…
                  </>
                ) : (
                  <>
                    <Wallet size={18} />
                    Pay Through Algorand
                  </>
                )}
              </motion.button>
            </div>
          )}
        </div>
      </motion.section>

      {/* ── SECTION 2: AI RESULTS ── */}
      <div ref={resultsRef}>
        <AnimatePresence>
          {(hasResults || isProcessing) && (
            <motion.section
              key="results"
              initial={{ opacity: 0, y: 24 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 12 }}
              transition={{ duration: 0.44 }}
              className={`analyze-result-card${isProcessing ? ' result-loading' : ''}${isSuccess ? ' result-success' : ''}${isSkipped ? ' result-skipped' : ''}`}
            >
              <div className="result-card-header">
                <div className="analyze-form-header-label">
                  <BrainCircuit size={16} />
                  <span>n8n AI Result</span>
                </div>
                <h3>AI scoring and payment outcome</h3>
              </div>

              {isProcessing ? (
                <div className="result-loading-state">
                  <Loader2 size={32} className="spin-icon spin-large" />
                  <p>Contacting n8n workflow and running AI analysis…</p>
                </div>
              ) : (
                <div className="result-body">
                  {/* Score Badge */}
                  <div className="result-score-row">
                    <div className={`score-badge${scorePasses ? ' pass' : ' fail'}`}>
                      <span className="score-number">{score ?? '--'}</span>
                      <span className="score-label">/ 100</span>
                    </div>
                    <div className="score-meta">
                      <div className={`score-verdict${scorePasses ? ' verdict-pass' : ' verdict-fail'}`}>
                        {scorePasses ? (
                          <><CheckCircle2 size={16} /> Threshold passed — payment is available</>
                        ) : (
                          <><XCircle size={16} /> Below threshold — payment skipped</>
                        )}
                      </div>
                      <p className="score-threshold-note">
                        Threshold: <strong>{threshold}</strong> · Score must be ≥ threshold for Algorand payment.
                      </p>
                    </div>
                  </div>

                  {aiSummary && (
                    <div className={`summary-highlight${scorePasses ? ' summary-highlight-pass' : ' summary-highlight-fail'}`}>
                      <span className="summary-highlight-label">
                        {scorePasses ? 'Payment Recommendation' : 'Do Not Pay Recommendation'}
                      </span>
                      <p className="summary-highlight-text">{aiSummary}</p>
                    </div>
                  )}

                  {/* AI Summary */}
                  {(taskTitle || taskType || taskBudget) && (
                    <div className="result-block">
                      <span className="result-block-label">Task Understanding</span>
                      <p className="result-summary-text">{taskUnderstanding}</p>
                    </div>
                  )}

                  <div className="result-block">
                    <span className="result-block-label">Task Quality</span>
                    <p className="result-summary-text">
                      <strong>{quality.label}</strong> {score !== null ? `(${score}/100).` : ''} {quality.detail}
                    </p>
                  </div>

                  {showDecisionReason && (
                    <div className="result-block">
                      <span className="result-block-label">Decision Reason</span>
                      <p className="result-summary-text">{decisionReason}</p>
                    </div>
                  )}

                  {analysisFactors.length > 0 && (
                    <div className="result-block">
                      <span className="result-block-label">Scoring Factors</span>
                      <p className="result-summary-text">{analysisFactors.join(' ')}</p>
                    </div>
                  )}

                  {/* Status message */}
                  {workflowState.message && (
                    <div className="result-block">
                      <span className="result-block-label">Workflow note</span>
                      <p className="result-summary-text">{workflowState.message}</p>
                    </div>
                  )}

                  {/* Transaction ID */}
                  <div className="result-block">
                    <span className="result-block-label">Transaction ID</span>
                    <div className="result-txid-row">
                      {txId ? (
                        <>
                          <code className="result-txid">{txId}</code>
                          {explorerLink && (
                            <a
                              href={explorerLink}
                              target="_blank"
                              rel="noreferrer"
                              className="txid-explorer-link"
                            >
                              <ExternalLink size={13} />
                              AlgoExplorer
                            </a>
                          )}
                        </>
                      ) : (
                        <span className="result-txid-empty">
                          {isSkipped ? 'No transaction — score below threshold.' : 'Transaction not yet issued.'}
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Verify Button */}
                  <motion.button
                    className={`verify-blockchain-btn${explorerLink ? '' : ' disabled'}`}
                    onClick={handleVerify}
                    disabled={!explorerLink}
                    whileHover={explorerLink ? { y: -2, scale: 1.015 } : {}}
                    whileTap={explorerLink ? { scale: 0.98 } : {}}
                  >
                    <ShieldCheck size={18} />
                    {explorerLink ? 'Verify on Blockchain' : 'Waiting for blockchain proof…'}
                  </motion.button>
                  {explorerLink && (
                    <p className="verify-hint">
                      Opens AlgoExplorer on Algorand Testnet so you can confirm the payment proof on-chain.
                    </p>
                  )}
                </div>
              )}
            </motion.section>
          )}
        </AnimatePresence>
      </div>

      {/* ── SECTION 3: EXECUTION PREVIEW + RECEIVER RULES (BOTTOM) ── */}
      <section className="dashboard-grid analyze-bottom-sections">
        <section className="workspace-panel">
          <div className="section-head">
            <div>
              <span className="section-kicker">Execution Preview</span>
              <h2>Live workflow response data from the last run.</h2>
            </div>
            <BrainCircuit size={18} />
          </div>

          <div className="mini-list">
            <div className="mini-card">
              <span>Latest score</span>
              <strong>{workflowState.score ?? '--'}</strong>
              <p>{workflowState.message || 'Run AI Score to see the result.'}</p>
            </div>
            <div className="mini-card">
              <span>Analysis source</span>
              <strong>{workflowState.analysis?.source || 'Not available yet'}</strong>
              <p>{workflowState.analysis?.verdict || 'Backend analysis verdict appears here after scoring.'}</p>
            </div>
            <div className="mini-card">
              <span>Transaction ID</span>
              <strong className="long-value">{workflowState.txId || 'Not available yet'}</strong>
              <p>{workflowState.explorerUrl || 'Explorer link appears after a successful transaction.'}</p>
            </div>
            <div className="mini-card">
              <span>NOTE payload</span>
              <strong className="long-value">
                {workflowState.note ? JSON.stringify(workflowState.note) : 'Not generated yet'}
              </strong>
              <p>Stored on-chain for transparent audit trail and verification.</p>
            </div>
          </div>
        </section>

        <section className="workspace-panel">
          <div className="section-head">
            <div>
              <span className="section-kicker">Receiver Rules</span>
              <h2>Address handling on the Analyze route.</h2>
            </div>
            <Wallet size={18} />
          </div>

          <div className="value-stack">
            {receiverRules.map((item) => (
              <div key={item} className="mini-card">
                <strong>{item}</strong>
                <p>Receiver handling stays Algorand-native with lightweight validation rules.</p>
              </div>
            ))}
          </div>
        </section>
      </section>

    </div>
  )
}
