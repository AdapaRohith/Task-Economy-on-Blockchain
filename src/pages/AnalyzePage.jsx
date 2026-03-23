import { useRef } from 'react'
import { motion } from 'framer-motion'
import { BrainCircuit, Server, Sparkles, Wallet } from 'lucide-react'
import { backendChecklist, frontendChecklist, receiverRules, stackItems } from '../content'

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
}) {
  const resultPreviewRef = useRef(null)
  const isProcessing = workflowState.phase === 'scoring'
  const selectedStackItem = stackItems.find((item) => item.id === selectedStackItemId) ?? stackItems[0]
  const aiSummary = workflowState.analysis?.summary || 'Waiting for the n8n response.'
  const aiStatus = workflowState.analysis?.status || 'pending'
  const explorerLink = workflowState.explorerUrl
  const n8nPayload = workflowState.analysis
    ? JSON.stringify(
        {
          score: workflowState.analysis.score,
          status: workflowState.analysis.status,
          verdict: workflowState.analysis.verdict,
          model: workflowState.analysis.model,
        },
        null,
        2,
      )
    : 'n8n data will appear here once you run the AI score.'
  const notePayload = workflowState.note ? JSON.stringify(workflowState.note, null, 2) : 'Notes appear after /api/pay executes.'

  const handleVerifyProof = () => {
    if (!explorerLink || typeof window === 'undefined') return
    window.open(explorerLink, '_blank', 'noreferrer')
  }

  const handleRun = async () => {
    await onRunWorkflow()
    resultPreviewRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' })
  }

  return (
    <div className="page-shell">
      <section className="analysis-nav">
        <div className="analysis-nav-grid">
          <article className="analysis-nav-panel">
            <div className="analysis-nav-head">
              <span className="section-kicker">n8n Inputs</span>
              <h3>Actual values that hit the automation</h3>
            </div>
            <div className="analysis-nav-list">
              <div>
                <span>Task title</span>
                <strong>{taskTitle || 'Awaiting submission'}</strong>
              </div>
              <div>
                <span>Task class</span>
                <strong>{taskType}</strong>
              </div>
              <div>
                <span>Reward amount</span>
                <strong>{taskBudget ? `${taskBudget} ALGO` : 'Awaiting budget'}</strong>
              </div>
              <div>
                <span>Receiver address</span>
                <strong className="long-value">{receiverAddress || 'Paste an Algorand Testnet address'}</strong>
              </div>
              <div>
                <span>Execution stack</span>
                <strong>{selectedStackItem.detail}</strong>
              </div>
            </div>
          </article>

          <article className="analysis-nav-panel">
            <div className="analysis-nav-head">
              <span className="section-kicker">n8n Workflow</span>
              <h3>Execution summary delivered by the automation</h3>
            </div>
            <div className="analysis-nav-list">
              <div>
                <span>Current phase</span>
                <strong>{workflowState.phase}</strong>
              </div>
              <div>
                <span>AI provider</span>
                <strong>{workflowState.analysis?.source ?? 'Local fallback'}</strong>
              </div>
              <div>
                <span>Workflow note</span>
                <strong>{workflowState.message}</strong>
              </div>
              <div>
                <span>n8n verdict</span>
                <strong>{aiStatus}</strong>
              </div>
            </div>
          </article>

          <article className="analysis-nav-panel">
            <div className="analysis-nav-head">
              <span className="section-kicker">n8n Outputs</span>
              <h3>Predicted score, AI summary, and proof</h3>
            </div>
            <div className="analysis-output-grid">
              <div className="analysis-value">
                <span>Predicted score</span>
                <strong>{workflowState.score ?? '--'}</strong>
              </div>
              <div className="analysis-value">
                <span>AI summary</span>
                <strong>{aiSummary}</strong>
              </div>
              <div className="analysis-value">
                <span>Transaction ID</span>
                <strong className="long-value">{workflowState.txId || 'Not issued yet'}</strong>
              </div>
            </div>
            <motion.button
              type="button"
              className="analysis-verify-btn"
              onClick={handleVerifyProof}
              disabled={!explorerLink}
              whileHover={{ y: explorerLink ? -2 : 0, scale: explorerLink ? 1.02 : 1 }}
              whileTap={{ scale: explorerLink ? 0.98 : 1 }}
            >
              {explorerLink ? 'Verify proof on Algorand' : 'Waiting for blockchain proof'}
            </motion.button>
            <p className="analysis-verify-hint">
              A confirmation click opens AlgoExplorer so you can ask the blockchain to confirm the payment proof.
            </p>
          </article>
        </div>
      </section>

      <section className="workspace-grid">
        <motion.section
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: '-60px' }}
          transition={{ duration: 0.45 }}
          className="workspace-panel"
        >
          <div className="section-head">
            <div>
              <span className="section-kicker">Backend Implementation</span>
              <h2>Analyze page is dedicated to execution and payment logic.</h2>
            </div>
            <Server size={18} />
          </div>

          <div className="spec-stack">
            <article className="spec-card">
              <strong>Allowed toolchain</strong>
              <div className="stack-grid">
                {stackItems.map((item) => (
                  <button
                    key={item.id}
                    type="button"
                    className={`stack-card accent-${item.accent} ${selectedStackItem.id === item.id ? 'active' : ''}`}
                    onClick={() => setSelectedStackItemId(item.id)}
                  >
                    <span>{item.category}</span>
                    <strong>{item.name}</strong>
                    <p>{item.detail}</p>
                  </button>
                ))}
              </div>
            </article>

            <article className="spec-card">
              <strong>Backend checklist</strong>
              <ul className="spec-list">
                {backendChecklist.map((item) => (
                  <li key={item}>{item}</li>
                ))}
              </ul>
            </article>
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
              <span className="section-kicker">Analysis Runner</span>
              <h2>Run AI scoring and call the Algorand payment API here.</h2>
            </div>
            <Sparkles size={18} />
          </div>

          <div className="form-grid">
            <label>
              Task title
              <input value={taskTitle} onChange={(event) => setTaskTitle(event.target.value)} />
            </label>
            <label>
              Reward amount in ALGO
              <input value={taskBudget} onChange={(event) => setTaskBudget(event.target.value)} />
            </label>
            <label>
              Task class
              <select value={taskType} onChange={(event) => setTaskType(event.target.value)}>
                <option>Research</option>
                <option>Code Review</option>
                <option>Analytics</option>
                <option>Payment Verification</option>
              </select>
            </label>
            <label>
              Receiver Algorand address
              <input
                value={receiverAddress}
                onChange={(event) => setReceiverAddress(event.target.value)}
                placeholder="Paste Algorand Testnet address"
              />
            </label>
          </div>

          <div className="assignment-card">
            <span className="assignment-label">Frontend updates from prompt</span>
            <ul className="spec-list compact-list">
              {frontendChecklist.map((item) => (
                <li key={item}>{item}</li>
              ))}
            </ul>

            <div className="wallet-row">
              <Wallet size={15} />
              <span>{receiverAddress || 'Receiver input must be a valid Algorand address'}</span>
            </div>
            <div className="workflow-score">
              <span>Threshold rule</span>
              <strong>{threshold}</strong>
              <span>Payment executes only when score is greater than or equal to threshold.</span>
            </div>
            <div className={`run-feedback run-feedback-${workflowState.phase}`}>
              <span className="run-feedback-label">Current state</span>
              <strong>{isProcessing ? 'Running AI score and payment check...' : workflowState.phase}</strong>
              <p>{workflowState.message}</p>
            </div>
            <motion.button
              className={`primary-action action-button ${isProcessing ? 'is-processing' : ''}`}
              onClick={handleRun}
              whileHover={{ y: -2, scale: 1.01 }}
              whileTap={{ scale: 0.99 }}
              disabled={isProcessing}
            >
              {isProcessing ? 'Running AI score...' : 'Run AI score and call /api/pay'}
            </motion.button>
          </div>
        </motion.section>
      </section>

      <section className="analysis-data">
        <div className="analysis-nav-head">
          <span className="section-kicker">n8n response</span>
          <h3>Data emitted by the workflow after “Run AI score”</h3>
        </div>
        <div className="analysis-data-grid">
          <article className="analysis-data-card">
            <span>AI score & verdict</span>
            <strong>{workflowState.score ?? '--'} ({aiStatus})</strong>
            <p>{aiSummary}</p>
          </article>
          <article className="analysis-data-card">
            <span>Analysis payload</span>
            <pre>{n8nPayload}</pre>
          </article>
          <article className="analysis-data-card">
            <span>Transaction proof</span>
            <strong className="long-value">{workflowState.txId || 'Transaction pending'}</strong>
            <p>{workflowState.explorerUrl ? 'AlgoExplorer is ready for verification.' : 'Waiting for /api/pay to broadcast a transaction.'}</p>
            <pre>{notePayload}</pre>
          </article>
        </div>
      </section>

      <section className="dashboard-grid" ref={resultPreviewRef}>
        <section className="workspace-panel">
          <div className="section-head">
            <div>
              <span className="section-kicker">Execution Preview</span>
              <h2>Analyze route keeps immediate workflow response visible.</h2>
            </div>
            <BrainCircuit size={18} />
          </div>

          <div className="mini-list">
            <div className="mini-card">
              <span>Latest score</span>
              <strong>{workflowState.score ?? '--'}</strong>
              <p>{workflowState.message}</p>
            </div>
            <div className="mini-card">
              <span>Analysis source</span>
              <strong>{workflowState.analysis?.source || 'Not available yet'}</strong>
              <p>{workflowState.analysis?.verdict || 'Backend analysis verdict appears here before payment execution.'}</p>
            </div>
            <div className="mini-card">
              <span>Transaction ID</span>
              <strong className="long-value">{workflowState.txId || 'Not available yet'}</strong>
              <p>{workflowState.explorerUrl || 'Explorer link appears after a successful transaction.'}</p>
            </div>
            <div className="mini-card">
              <span>NOTE payload</span>
              <strong className="long-value">{workflowState.note ? JSON.stringify(workflowState.note) : 'Not generated yet'}</strong>
              <p>Stored on-chain for transparent audit trail and verification.</p>
            </div>
          </div>
        </section>

        <section className="workspace-panel">
          <div className="section-head">
            <div>
              <span className="section-kicker">Receiver Rules</span>
              <h2>Address handling is separated clearly on the Analyze route.</h2>
            </div>
            <Wallet size={18} />
          </div>

          <div className="value-stack">
            {receiverRules.map((item) => (
              <div key={item} className="mini-card">
                <strong>{item}</strong>
                <p>Receiver handling stays aligned to the Algorand-only prompt with lightweight validation rules.</p>
              </div>
            ))}
          </div>
        </section>
      </section>
    </div>
  )
}
