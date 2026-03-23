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

  const handleRun = async () => {
    await onRunWorkflow()
    resultPreviewRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' })
  }

  return (
    <div className="page-shell">
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
