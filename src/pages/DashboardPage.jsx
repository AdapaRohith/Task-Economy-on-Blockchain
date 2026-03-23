import { motion } from 'framer-motion'
import { LayoutDashboard, ShieldCheck } from 'lucide-react'

export function DashboardPage({ tasks, workflowState, threshold }) {
  const getQualityFromScore = (value) => {
    if (!Number.isFinite(Number(value))) return 'Not evaluated yet'
    const score = Number(value)

    if (score >= 90) return 'Excellent'
    if (score >= 75) return 'Good'
    if (score >= 60) return 'Fair'
    return 'Needs improvement'
  }

  const getTaskScore = (task) => {
    if (Number.isFinite(Number(task.analysis?.score))) {
      return Number(task.analysis.score)
    }

    try {
      const parsed = JSON.parse(task.proofHash)
      return Number.isFinite(Number(parsed?.score)) ? Number(parsed.score) : null
    } catch {
      return null
    }
  }

  const stats = {
    total: tasks.length,
    completed: tasks.filter((task) => task.status === 'Completed').length,
    pending: tasks.filter((task) => task.status === 'In Review').length,
    open: tasks.filter((task) => task.status === 'Open').length,
  }

  return (
    <div className="page-shell">
      <section className="dashboard-nav-shell">
        <div className="dashboard-nav">
          <div>
            <span className="section-kicker">Dashboard Route</span>
            <h2>Transaction history and live backend response live here, not on the homepage.</h2>
          </div>
          <div className="dashboard-pill">
            <a className="active" href="#task-records">Task Records</a>
            <a href="#live-response">Live Response</a>
          </div>
        </div>
      </section>

      <section className="metrics-grid">
        <div className="metric-card">
          <span>Total records</span>
          <strong>{stats.total}</strong>
        </div>
        <div className="metric-card">
          <span>Completed</span>
          <strong>{stats.completed}</strong>
        </div>
        <div className="metric-card">
          <span>In review</span>
          <strong>{stats.pending}</strong>
        </div>
        <div className="metric-card">
          <span>Threshold</span>
          <strong>{threshold}</strong>
        </div>
      </section>

      <section id="task-records" className="dashboard-grid">
        <motion.section
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: '-60px' }}
          transition={{ duration: 0.45 }}
          className="workspace-panel"
        >
          <div className="section-head">
            <div>
              <span className="section-kicker">Task Records</span>
              <h2>Dashboard route keeps transaction records separated and easy to review.</h2>
            </div>
            <LayoutDashboard size={18} />
          </div>

          <div className="task-list">
            {tasks.map((task) => {
              const taskScore = getTaskScore(task)
              const qualityLabel = getQualityFromScore(taskScore)

              return (
                <motion.article
                  key={task.id}
                  className="task-card"
                  initial={{ opacity: 0, y: 18 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.35 }}
                  whileHover={{ y: -4 }}
                >
                  <div className="task-topline">
                    <span className="task-id">{task.id}</span>
                    <span className={`status-badge status-${task.status.toLowerCase().replace(/\s+/g, '-')}`}>{task.status}</span>
                  </div>
                  <h3>{task.title}</h3>
                  <div className="task-info">
                    <span>Budget: {task.budget}</span>
                    <span>Analysis: {task.analysis?.source || 'N/A'}</span>
                  </div>
                  <div className="task-info">
                    <span>Score: {taskScore ?? '--'}</span>
                    <span>Quality: {qualityLabel}</span>
                  </div>
                  <div className="task-proof">
                    <span>Proof: {task.proofHash}</span>
                    <span>Transaction: {task.rewardTx}</span>
                  </div>
                  <p>{task.verification}</p>
                </motion.article>
              )
            })}
          </div>
        </motion.section>

        <motion.section
          id="live-response"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: '-60px' }}
          transition={{ duration: 0.45, delay: 0.08 }}
          className="workspace-panel side-panel"
        >
          <div className="section-head">
            <div>
              <span className="section-kicker">Live Response</span>
              <h2>The latest payment output is isolated on the dashboard route.</h2>
            </div>
            <ShieldCheck size={18} />
          </div>

          <motion.div
            className="reputation-score result-card"
            initial={{ opacity: 0, scale: 0.97 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
            transition={{ duration: 0.45 }}
          >
            <strong>{workflowState.score ?? '--'}</strong>
            <span>Latest AI score</span>
          </motion.div>

          <div className="mini-list">
            <div className="mini-card">
              <span>Status</span>
              <strong>{workflowState.phase}</strong>
              <p>{workflowState.message}</p>
            </div>
            <div className="mini-card">
              <span>Transaction ID</span>
              <strong className="long-value">{workflowState.txId || 'Not available yet'}</strong>
              {workflowState.explorerUrl ? (
                <p>
                  <a href={workflowState.explorerUrl} target="_blank" rel="noreferrer">
                    Open in Algorand Testnet Explorer
                  </a>
                </p>
              ) : (
                <p>Explorer link is returned only after a successful on-chain payment.</p>
              )}
            </div>
            <div className="mini-card">
              <span>NOTE payload</span>
              <strong className="long-value">{workflowState.note ? JSON.stringify(workflowState.note) : 'Not generated yet'}</strong>
              <p>Stored on-chain for transparent audit trail and tamper-evident verification.</p>
            </div>
          </div>
        </motion.section>
      </section>
    </div>
  )
}
