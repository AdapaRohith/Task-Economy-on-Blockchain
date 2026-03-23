import { useMemo, useState } from 'react'
import { motion } from 'framer-motion'
import {
  ArrowRight,
  BadgeDollarSign,
  Bot,
  BrainCircuit,
  Briefcase,
  CheckCheck,
  Clock3,
  Coins,
  FileCheck2,
  LayoutDashboard,
  Link2,
  Server,
  Shield,
  ShieldCheck,
  Sparkles,
  Star,
  Wallet,
} from 'lucide-react'

const stagger = {
  hidden: {},
  show: {
    transition: { staggerChildren: 0.1 },
  },
}

const fadeUp = {
  hidden: { opacity: 0, y: 24 },
  show: { opacity: 1, y: 0, transition: { duration: 0.5, ease: 'easeOut' } },
}

const fadeIn = {
  hidden: { opacity: 0 },
  show: { opacity: 1, transition: { duration: 0.6 } },
}

const navLinks = [
  { label: 'Home', href: '#home' },
  { label: 'Marketplace', href: '#marketplace' },
  { label: 'Workflow', href: '#workflow' },
  { label: 'Dashboard', href: '#dashboard' },
  { label: 'Backend', href: '#backend' },
]

const agents = [
  {
    id: 'agent-01',
    name: 'SignalMind',
    category: 'Research Agent',
    rate: '0.18 ALGO',
    reputation: 4.9,
    completed: 128,
    response: '2 min',
    specialty: 'Summarizes raw market and product data into decision-ready reports.',
    skills: ['Research synthesis', 'Trend extraction', 'Report generation'],
    wallet: 'Provide funded Testnet address at runtime',
    accent: 'indigo',
  },
  {
    id: 'agent-02',
    name: 'ChainOps',
    category: 'Review Agent',
    rate: '0.32 ALGO',
    reputation: 4.8,
    completed: 84,
    response: '5 min',
    specialty: 'Reviews smart-contract and backend logic, then returns a structured risk note.',
    skills: ['Logic review', 'Risk notes', 'Output verification'],
    wallet: 'Provide funded Testnet address at runtime',
    accent: 'violet',
  },
  {
    id: 'agent-03',
    name: 'DataForge',
    category: 'Analytics Agent',
    rate: '0.14 ALGO',
    reputation: 4.7,
    completed: 201,
    response: '90 sec',
    specialty: 'Turns uploaded data into insights, anomalies, and structured summaries.',
    skills: ['Data cleaning', 'Insight extraction', 'Anomaly detection'],
    wallet: 'Provide funded Testnet address at runtime',
    accent: 'emerald',
  },
]

const initialTasks = [
  {
    id: 'TASK-1842',
    title: 'Summarize retention drivers from wallet cohort data',
    budget: '0.40 ALGO',
    status: 'Completed',
    requester: 'Apex Labs',
    agentId: 'agent-01',
    rewardTx: 'NB4F...UF6Q',
    proofHash: 'note: score=91,status=completed',
    verification: 'Algorand payment settled after score threshold passed.',
  },
  {
    id: 'TASK-1843',
    title: 'Review payout edge cases in backend settlement logic',
    budget: '0.65 ALGO',
    status: 'In Review',
    requester: 'OrbitFi',
    agentId: 'agent-02',
    rewardTx: 'Pending settlement',
    proofHash: 'Awaiting evaluation result',
    verification: 'Score not finalized yet.',
  },
]

const metrics = [
  { label: 'Active agents', value: '312', icon: Bot },
  { label: 'Tasks settled', value: '1,284', icon: CheckCheck },
  { label: 'Avg. dispute rate', value: '2.1%', icon: ShieldCheck },
  { label: 'Rewards cleared', value: '482 ALGO', icon: BadgeDollarSign },
]

const architectureFlow = [
  {
    title: 'Task Request',
    subtitle: 'USER INPUT + RECEIVER ADDRESS',
    icon: FileCheck2,
    accent: 'blue',
  },
  {
    title: 'AI Evaluation',
    subtitle: 'SCORE + STATUS DECISION',
    icon: BrainCircuit,
    accent: 'indigo',
  },
  {
    title: 'Node Backend',
    subtitle: 'VALIDATE + SIGN WITH ALGOSDK',
    icon: Server,
    accent: 'violet',
  },
  {
    title: 'Algorand Testnet',
    subtitle: 'PAYMENT + NOTE METADATA',
    icon: Coins,
    accent: 'emerald',
  },
  {
    title: 'Explorer Proof',
    subtitle: 'TX ID + LIVE VERIFICATION',
    icon: Link2,
    accent: 'amber',
  },
]

const lifecycleSteps = [
  {
    title: 'User submits task',
    detail: 'Frontend captures task title, receiver address, selected agent, and reward amount in ALGO.',
  },
  {
    title: 'AI score is computed',
    detail: 'The task receives a score and completion status before any blockchain action occurs.',
  },
  {
    title: 'Backend signs Algorand transaction',
    detail: 'Node.js validates input, creates a Testnet payment, and embeds task metadata in the note field.',
  },
  {
    title: 'UI shows proof',
    detail: 'Transaction ID, status, and AlgoExplorer link appear in the dashboard for verification.',
  },
]

const backendItems = [
  'GET /api/health',
  'POST /api/send-transaction',
  'Algod client on Algorand Testnet',
  'Mnemonic stored in backend environment only',
  'Task metadata encoded into note field',
]

const threshold = 75

const scoreTask = (title, type) => {
  const normalized = `${title} ${type}`.toLowerCase()
  let score = 58

  if (normalized.includes('research')) score += 14
  if (normalized.includes('analytics')) score += 10
  if (normalized.includes('review')) score += 12
  if (title.length > 30) score += 8

  return Math.min(score, 96)
}

function App() {
  const [selectedAgent, setSelectedAgent] = useState(agents[0])
  const [tasks, setTasks] = useState(initialTasks)
  const [taskTitle, setTaskTitle] = useState('Generate a competitive research brief on AI coding copilots')
  const [taskBudget, setTaskBudget] = useState('0.22')
  const [taskType, setTaskType] = useState('Research')
  const [receiverAddress, setReceiverAddress] = useState('')
  const [workflowState, setWorkflowState] = useState({
    phase: 'idle',
    message: 'The Algorand payment flow is ready.',
    score: null,
    txId: '',
    explorerUrl: '',
    skipped: false,
  })

  const selectedAgentTasks = useMemo(
    () => tasks.filter((task) => task.agentId === selectedAgent.id),
    [selectedAgent, tasks],
  )

  const handleSelectAgent = (agent) => {
    setSelectedAgent(agent)
  }

  const handleRunWorkflow = async () => {
    if (!receiverAddress.trim()) {
      setWorkflowState({
        phase: 'error',
        message: 'Paste a valid Algorand Testnet receiver address before running the workflow.',
        score: null,
        txId: '',
        explorerUrl: '',
        skipped: false,
      })
      return
    }

    const taskId = `TASK-${1845 + tasks.length}`
    const score = scoreTask(taskTitle, taskType)

    setWorkflowState({
      phase: 'scoring',
      message: `AI evaluation completed with score ${score}. Preparing Algorand payment check.`,
      score,
      txId: '',
      explorerUrl: '',
      skipped: false,
    })

    const pendingTask = {
      id: taskId,
      title: taskTitle,
      budget: `${taskBudget} ALGO`,
      status: 'In Review',
      requester: 'You',
      agentId: selectedAgent.id,
      rewardTx: 'Awaiting backend response',
      proofHash: `note: score=${score},status=${score >= threshold ? 'completed' : 'failed'}`,
      verification: 'Local AI evaluation complete. Waiting for Algorand backend.',
    }

    setTasks((current) => [pendingTask, ...current])

    try {
      const response = await fetch('/api/send-transaction', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          taskId,
          score,
          receiverAddress,
          status: score >= threshold ? 'completed' : 'failed',
          amountAlgo: Number(taskBudget),
        }),
      })

      const data = await response.json()
      if (!response.ok || !data.ok) {
        throw new Error(data.message || 'Algorand transaction failed.')
      }

      if (data.skipped) {
        setWorkflowState({
          phase: 'skipped',
          message: data.message,
          score,
          txId: '',
          explorerUrl: '',
          skipped: true,
        })

        setTasks((current) =>
          current.map((task) =>
            task.id === taskId
              ? {
                  ...task,
                  status: 'Open',
                  rewardTx: 'Payment not triggered',
                  verification: data.message,
                }
              : task,
          ),
        )
        return
      }

      setWorkflowState({
        phase: 'success',
        message: `Algorand Testnet transaction confirmed in round ${data.confirmedRound}.`,
        score,
        txId: data.transactionId,
        explorerUrl: data.explorerUrl,
        skipped: false,
      })

      setTasks((current) =>
        current.map((task) =>
          task.id === taskId
            ? {
                ...task,
                status: 'Completed',
                rewardTx: data.transactionId,
                verification: `Payment sent to ${data.receiverAddress}. Explorer proof available.`,
              }
            : task,
        ),
      )
    } catch (error) {
      setWorkflowState({
        phase: 'error',
        message: error.message,
        score,
        txId: '',
        explorerUrl: '',
        skipped: false,
      })

      setTasks((current) =>
        current.map((task) =>
          task.id === taskId
            ? {
                ...task,
                status: 'Open',
                rewardTx: 'Failed',
                verification: error.message,
              }
            : task,
        ),
      )
    }
  }

  return (
    <div className="app-shell">
      <div className="background-glow glow-a" />
      <div className="background-glow glow-b" />

      <nav className="top-nav">
        <a href="#home" className="brand">
          <span className="brand-icon">
            <Shield size={18} />
          </span>
          <div>
            <strong>Proof-of-Agents</strong>
            <span>Algorand-only task economy</span>
          </div>
        </a>

        <div className="nav-pill">
          {navLinks.map((link, index) => (
            <a key={link.label} href={link.href} className={index === 0 ? 'active' : ''}>
              {link.label}
            </a>
          ))}
        </div>
      </nav>

      <header id="home" className="hero">
        <motion.div
          variants={stagger}
          initial="hidden"
          animate="show"
          className="hero-panel hero-copy"
        >
          <motion.span variants={fadeUp} className="eyebrow">Algorand Testnet • Node.js Backend • React Frontend</motion.span>
          <motion.h1 variants={fadeUp}>Verified Agent Work. Paid on Algorand.</motion.h1>
          <motion.p variants={fadeUp}>
            This demo uses Algorand Testnet only. After an AI task is evaluated, the Node.js backend creates a payment
            transaction with `algosdk`, embeds task metadata in the note field, and returns the transaction ID to the UI.
          </motion.p>
          <motion.div variants={fadeUp} className="hero-actions">
            <a href="#workspace" className="primary-action">Run Workflow</a>
            <a href="#dashboard" className="secondary-action">View Dashboard</a>
          </motion.div>
          <motion.em variants={fadeUp} className="hero-note">Payment triggers only when score is at least {threshold} and task status is completed.</motion.em>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, scale: 0.96 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.5, delay: 0.1 }}
          className="hero-stack"
        >
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            className="hero-panel proof-note"
          >
            <div className="note-label">Live verification status</div>
            <p>{workflowState.message}</p>
            <strong>
              {workflowState.phase === 'success'
                ? 'Algorand transaction confirmed.'
                : workflowState.phase === 'error'
                  ? 'Backend returned an execution error.'
                  : workflowState.phase === 'skipped'
                    ? 'Threshold logic prevented payment.'
                    : 'Waiting for workflow execution.'}
            </strong>
          </motion.div>
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.55 }}
            className="hero-panel proof-note"
          >
            <div className="note-label">What the note field stores</div>
            <ul>
              <li>Task ID</li>
              <li>AI evaluation score</li>
              <li>Task status: completed or failed</li>
            </ul>
          </motion.div>
        </motion.div>
      </header>

      <motion.section
        variants={stagger}
        initial="hidden"
        whileInView="show"
        viewport={{ once: true, margin: '-60px' }}
        className="metrics-grid"
      >
        {metrics.map(({ label, value, icon: Icon }) => (
          <motion.div key={label} variants={fadeUp} whileHover={{ y: -4, scale: 1.02 }} className="metric-card">
            <Icon size={18} />
            <span>{label}</span>
            <strong>{value}</strong>
          </motion.div>
        ))}
      </motion.section>

      <motion.section
        id="workflow"
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, margin: '-60px' }}
        transition={{ duration: 0.5 }}
        className="architecture-section"
      >
        <div className="section-intro">
          <span className="section-kicker">Architecture</span>
          <h2>The end-to-end Algorand payment workflow for this hackathon demo.</h2>
        </div>

        <div className="architecture-board">
          <div className="architecture-flow">
            {architectureFlow.map((item, index) => {
              const Icon = item.icon
              return (
                <motion.div
                  key={item.title}
                  initial={{ opacity: 0, y: 10 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: index * 0.1 }}
                  whileHover={{ y: -6, scale: 1.03 }}
                  className={`architecture-card accent-${item.accent}`}
                >
                  <div className="architecture-icon">
                    <Icon size={22} />
                  </div>
                  <strong>{item.title}</strong>
                  <span>{item.subtitle}</span>
                  {index < architectureFlow.length - 1 ? (
                    <motion.div
                      className="connector"
                      animate={{ opacity: [0.3, 1, 0.3], scaleX: [0.92, 1, 0.92] }}
                      transition={{ duration: 1.8, repeat: Infinity, delay: index * 0.2 }}
                    />
                  ) : null}
                  <motion.div
                    className="architecture-pulse"
                    animate={{ opacity: [0, 0.35, 0], scale: [1, 1.05, 1] }}
                    transition={{ duration: 2.2, repeat: Infinity, delay: index * 0.35 }}
                  />
                </motion.div>
              )
            })}
          </div>

          <div className="architecture-meta">
            <div className="meta-card">
              <span>Blockchain connection</span>
              <strong>Algorand Testnet via Algonode or another public Algod endpoint</strong>
            </div>
            <div className="meta-card">
              <span>Backend security</span>
              <strong>Mnemonic stays in Node.js environment variables, never in the React app</strong>
            </div>
            <div className="meta-card">
              <span>Expected proof</span>
              <strong>Transaction ID + explorer link + note metadata visible after settlement</strong>
            </div>
          </div>
        </div>
      </motion.section>

      <main id="workspace" className="workspace-grid">
        <motion.section
          id="marketplace"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: '-60px' }}
          transition={{ duration: 0.45 }}
          className="workspace-panel"
        >
          <div className="section-head">
            <div>
              <span className="section-kicker">Marketplace</span>
              <h2>Select the AI agent that will receive the Algorand reward</h2>
            </div>
            <BrainCircuit size={18} />
          </div>

          <div className="agent-grid">
            {agents.map((agent) => (
              <motion.button
                key={agent.id}
                className={`agent-card accent-${agent.accent} ${selectedAgent.id === agent.id ? 'active' : ''}`}
                onClick={() => handleSelectAgent(agent)}
                whileHover={{ y: -6, scale: 1.015 }}
                whileTap={{ scale: 0.99 }}
              >
                <div className="agent-header">
                  <div>
                    <strong>{agent.name}</strong>
                    <span>{agent.category}</span>
                  </div>
                  <span className="pill">{agent.rate}</span>
                </div>
                <p>{agent.specialty}</p>
                <div className="agent-meta">
                  <span><Star size={14} /> {agent.reputation}</span>
                  <span><Briefcase size={14} /> {agent.completed} tasks</span>
                  <span><Clock3 size={14} /> {agent.response}</span>
                </div>
              </motion.button>
            ))}
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
              <span className="section-kicker">Task Submission</span>
              <h2>Create a task and trigger the Algorand payment check</h2>
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
                <option>Content Generation</option>
              </select>
            </label>
            <label>
              Receiver Algorand address
              <input value={receiverAddress} onChange={(event) => setReceiverAddress(event.target.value)} />
            </label>
          </div>

          <div className="assignment-card">
            <span className="assignment-label">Selected execution agent</span>
            <h3>{selectedAgent.name}</h3>
            <p>{selectedAgent.specialty}</p>
            <div className="skill-row">
              {selectedAgent.skills.map((skill) => (
                <span key={skill} className="tag">{skill}</span>
              ))}
            </div>
            <div className="wallet-row">
              <Wallet size={15} />
              <span>{receiverAddress || 'Paste a valid Algorand Testnet address'}</span>
            </div>
            <div className="workflow-score">
              <span>Threshold</span>
              <strong>{threshold}</strong>
              <span>Payment only if AI score meets threshold.</span>
            </div>
            <motion.button
              className="primary-action action-button"
              onClick={handleRunWorkflow}
              whileHover={{ y: -2, scale: 1.01 }}
              whileTap={{ scale: 0.99 }}
            >
              Run AI evaluation and Algorand payment
            </motion.button>
          </div>
        </motion.section>
      </main>

      <section id="dashboard" className="dashboard-grid">
        <motion.section
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: '-60px' }}
          transition={{ duration: 0.45 }}
          className="workspace-panel"
        >
          <div className="section-head">
            <div>
              <span className="section-kicker">Task Dashboard</span>
              <h2>Task status, payment result, and proof trail</h2>
            </div>
            <LayoutDashboard size={18} />
          </div>

          <div className="task-list">
            {tasks.map((task) => (
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
                  <span>Requester: {task.requester}</span>
                  <span>Budget: {task.budget}</span>
                </div>
                <div className="task-proof">
                  <span>Proof: {task.proofHash}</span>
                  <span>Payout: {task.rewardTx}</span>
                </div>
                <p>{task.verification}</p>
              </motion.article>
            ))}
          </div>
        </motion.section>

        <motion.section
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: '-60px' }}
          transition={{ duration: 0.45, delay: 0.08 }}
          className="workspace-panel side-panel"
        >
          <div className="section-head">
            <div>
              <span className="section-kicker">Workflow Result</span>
              <h2>Latest Algorand backend response</h2>
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
            <motion.div className="mini-card" whileHover={{ y: -3 }} transition={{ duration: 0.2 }}>
              <span>Status</span>
              <strong>{workflowState.phase}</strong>
              <p>{workflowState.message}</p>
            </motion.div>
            <motion.div className="mini-card" whileHover={{ y: -3 }} transition={{ duration: 0.2 }}>
              <span>Transaction ID</span>
              <strong className="long-value">{workflowState.txId || 'Not available yet'}</strong>
              {workflowState.explorerUrl ? (
                <p>
                  <a href={workflowState.explorerUrl} target="_blank" rel="noreferrer">
                    Open in AlgoExplorer
                  </a>
                </p>
              ) : (
                <p>Explorer link appears after a confirmed Algorand transaction.</p>
              )}
            </motion.div>
            <motion.div className="mini-card" whileHover={{ y: -3 }} transition={{ duration: 0.2 }}>
              <span>Selected agent</span>
              <strong>{selectedAgent.name}</strong>
              <p>{selectedAgentTasks.length} tracked tasks currently linked to this agent.</p>
            </motion.div>
          </div>
        </motion.section>
      </section>

      <motion.section
        variants={stagger}
        initial="hidden"
        whileInView="show"
        viewport={{ once: true, margin: '-60px' }}
        className="insight-grid"
      >
        <motion.section variants={fadeUp} className="workspace-panel">
          <div className="section-head">
            <div>
              <span className="section-kicker">Lifecycle</span>
              <h2>How the demo answers the required scope</h2>
            </div>
            <ArrowRight size={18} />
          </div>

          <div className="timeline-list">
            {lifecycleSteps.map((step, index) => (
              <motion.div key={step.title} className="timeline-card" whileHover={{ y: -3 }}>
                <span className="timeline-index">0{index + 1}</span>
                <div>
                  <strong>{step.title}</strong>
                  <p>{step.detail}</p>
                </div>
              </motion.div>
            ))}
          </div>
        </motion.section>

        <motion.section id="backend" variants={fadeUp} className="workspace-panel">
          <div className="section-head">
            <div>
              <span className="section-kicker">Backend API</span>
              <h2>Algorand-only Node.js integration surface</h2>
            </div>
            <Server size={18} />
          </div>

          <div className="value-stack">
            {backendItems.map((item) => (
              <motion.div key={item} className="mini-card" whileHover={{ y: -3 }}>
                <strong>{item}</strong>
                <p>Aligned to the allowed stack: Node.js backend, React frontend, Algorand Testnet only.</p>
              </motion.div>
            ))}
          </div>
        </motion.section>
      </motion.section>
    </div>
  )
}

export default App
