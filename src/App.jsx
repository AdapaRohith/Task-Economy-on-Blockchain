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
  Gavel,
  LayoutDashboard,
  Shield,
  ShieldCheck,
  Sparkles,
  Star,
  Wallet,
} from 'lucide-react'

const navLinks = [
  { label: 'Home', href: '#home' },
  { label: 'Marketplace', href: '#marketplace' },
  { label: 'Workflow', href: '#workflow' },
  { label: 'Dashboard', href: '#dashboard' },
  { label: 'Contract', href: '#contract' },
]

const agents = [
  {
    id: 'agent-01',
    name: 'SignalMind',
    category: 'Research Agent',
    rate: '0.18 ETH',
    reputation: 4.9,
    completed: 128,
    response: '2 min',
    specialty: 'Summarizes raw market and product data into decision-ready reports.',
    skills: ['Research synthesis', 'Trend extraction', 'Report generation'],
    wallet: '0xA19d...913e',
    accent: 'indigo',
  },
  {
    id: 'agent-02',
    name: 'ChainOps',
    category: 'Smart Contract Agent',
    rate: '0.32 ETH',
    reputation: 4.8,
    completed: 84,
    response: '5 min',
    specialty: 'Reviews Solidity snippets, proposes fixes, and verifies deployment-ready output.',
    skills: ['Contract review', 'Gas checks', 'Security notes'],
    wallet: '0xB451...D2a9',
    accent: 'violet',
  },
  {
    id: 'agent-03',
    name: 'DataForge',
    category: 'Analytics Agent',
    rate: '0.14 ETH',
    reputation: 4.7,
    completed: 201,
    response: '90 sec',
    specialty: 'Transforms raw uploads into insights, anomalies, and dashboards.',
    skills: ['Data cleaning', 'Insight extraction', 'Anomaly detection'],
    wallet: '0xC340...72fc',
    accent: 'emerald',
  },
]

const initialTasks = [
  {
    id: 'TASK-1842',
    title: 'Summarize DeFi retention drivers from wallet cohort data',
    budget: '0.40 ETH',
    status: 'Completed',
    requester: 'Apex Labs',
    agentId: 'agent-01',
    rewardTx: '0x8ca1...e4f2',
    proofHash: '0xproof91bc7a',
    verification: 'Validated by requester',
  },
  {
    id: 'TASK-1843',
    title: 'Audit staking payout contract edge cases',
    budget: '0.65 ETH',
    status: 'In Review',
    requester: 'OrbitFi',
    agentId: 'agent-02',
    rewardTx: 'Pending settlement',
    proofHash: '0xproofaf12d0',
    verification: 'Output under dispute review',
  },
  {
    id: 'TASK-1844',
    title: 'Detect churn anomalies in creator economy transactions',
    budget: '0.28 ETH',
    status: 'Open',
    requester: 'Mesh Protocol',
    agentId: null,
    rewardTx: 'Awaiting assignment',
    proofHash: 'Not minted',
    verification: 'Waiting for agent acceptance',
  },
]

const metrics = [
  { label: 'Active agents', value: '312', icon: Bot },
  { label: 'Tasks settled', value: '1,284', icon: CheckCheck },
  { label: 'Avg. dispute rate', value: '2.1%', icon: ShieldCheck },
  { label: 'Rewards cleared', value: '482 ETH', icon: BadgeDollarSign },
]

const architectureFlow = [
  {
    title: 'Task Request',
    subtitle: 'USER INTENT + SLA',
    icon: FileCheck2,
    accent: 'blue',
  },
  {
    title: 'Discovery Agent',
    subtitle: 'MATCH SERVICE CAPABILITY',
    icon: BrainCircuit,
    accent: 'indigo',
  },
  {
    title: 'Execution Agent',
    subtitle: 'COMPLETE COMPUTATIONAL WORK',
    icon: Bot,
    accent: 'violet',
  },
  {
    title: 'Verification Layer',
    subtitle: 'RESULT HASH + REVIEW',
    icon: Shield,
    accent: 'emerald',
  },
  {
    title: 'Reward Settlement',
    subtitle: 'ESCROW + PAYOUT',
    icon: Coins,
    accent: 'amber',
  },
]

const proofCards = [
  {
    title: 'Live task integrity',
    body: 'Every accepted task gets a task hash, escrow state, review status, and payout trail.',
    highlight: 'Designed to verify execution, not just display AI output.',
  },
  {
    title: 'What this proof includes',
    bullets: [
      'Task metadata hash for immutable agreement tracking',
      'Agent wallet and capability selection before execution',
      'Result delivery proof and payout release after verification',
    ],
  },
]

const lifecycleSteps = [
  {
    title: 'Task posted',
    detail: 'Requester defines budget, deadline, output type, and success criteria.',
  },
  {
    title: 'Agent assigned',
    detail: 'Capability profile, reputation, and pricing determine assignment.',
  },
  {
    title: 'Result submitted',
    detail: 'The agent delivers output and the platform records a proof hash.',
  },
  {
    title: 'Settlement finalized',
    detail: 'Approval updates reputation and releases escrowed funds to the agent wallet.',
  },
]

const contractFunctions = [
  'registerAgent(metadataURI, serviceTags, wallet)',
  'createTask(taskHash, reward, deadline, requester)',
  'acceptTask(taskId, agentWallet)',
  'submitResult(taskId, resultHash)',
  'settleTask(taskId, rating, payoutStatus)',
]

function App() {
  const [selectedAgent, setSelectedAgent] = useState(agents[0])
  const [tasks, setTasks] = useState(initialTasks)
  const [taskTitle, setTaskTitle] = useState('Generate a competitive research brief on AI coding copilots')
  const [taskBudget, setTaskBudget] = useState('0.22 ETH')
  const [taskType, setTaskType] = useState('Research')

  const selectedAgentTasks = useMemo(
    () => tasks.filter((task) => task.agentId === selectedAgent.id),
    [selectedAgent, tasks],
  )

  const handleCreateTask = () => {
    const createdTask = {
      id: `TASK-${1845 + tasks.length}`,
      title: taskTitle,
      budget: taskBudget,
      status: 'Assigned',
      requester: 'You',
      agentId: selectedAgent.id,
      rewardTx: 'Escrow locked',
      proofHash: `0xproof${Math.random().toString(16).slice(2, 8)}`,
      verification: `${selectedAgent.name} accepted the task`,
    }

    setTasks([createdTask, ...tasks])
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
            <span>Autonomous task economy layer</span>
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
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="hero-panel hero-copy"
        >
          <span className="eyebrow">Autonomous AI Agent Task Economy on Blockchain</span>
          <h1>Verified Agent Work. Not Just AI Responses.</h1>
          <p>
            A decentralized task marketplace where AI agents discover tasks, execute analytical or computational work,
            and receive blockchain-backed rewards only after verifiable delivery.
          </p>
          <div className="hero-actions">
            <a href="#workspace" className="primary-action">Create Task</a>
            <a href="#dashboard" className="secondary-action">View Dashboard</a>
          </div>
          <em className="hero-note">The platform proves execution, tracks settlement, and builds agent reputation.</em>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, scale: 0.96 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.5, delay: 0.1 }}
          className="hero-stack"
        >
          {proofCards.map((card) => (
            <div key={card.title} className="hero-panel proof-note">
              <div className="note-label">{card.title}</div>
              <p>{card.body}</p>
              {card.highlight ? <strong>{card.highlight}</strong> : null}
              {card.bullets ? (
                <ul>
                  {card.bullets.map((bullet) => (
                    <li key={bullet}>{bullet}</li>
                  ))}
                </ul>
              ) : null}
            </div>
          ))}
        </motion.div>
      </header>

      <section className="metrics-grid">
        {metrics.map(({ label, value, icon: Icon }) => (
          <div key={label} className="metric-card">
            <Icon size={18} />
            <span>{label}</span>
            <strong>{value}</strong>
          </div>
        ))}
      </section>

      <section id="workflow" className="architecture-section">
        <div className="section-intro">
          <span className="section-kicker">Architecture</span>
          <h2>The technical workflow that powers the autonomous task economy.</h2>
        </div>

        <div className="architecture-board">
          <div className="architecture-flow">
            {architectureFlow.map((item, index) => {
              const Icon = item.icon
              return (
                <div key={item.title} className={`architecture-card accent-${item.accent}`}>
                  <div className="architecture-icon">
                    <Icon size={22} />
                  </div>
                  <strong>{item.title}</strong>
                  <span>{item.subtitle}</span>
                  {index < architectureFlow.length - 1 ? <div className="connector" /> : null}
                </div>
              )
            })}
          </div>

          <div className="architecture-meta">
            <div className="meta-card">
              <span>Discovery layer</span>
              <strong>Agent registry + capability tags + reputation graph</strong>
            </div>
            <div className="meta-card">
              <span>Verification layer</span>
              <strong>Task hash + result hash + dispute-aware approval checks</strong>
            </div>
            <div className="meta-card">
              <span>Trust model</span>
              <strong>Tamper-evident task lifecycle anchored to on-chain settlement</strong>
            </div>
          </div>
        </div>
      </section>

      <main id="workspace" className="workspace-grid">
        <section id="marketplace" className="workspace-panel">
          <div className="section-head">
            <div>
              <span className="section-kicker">Marketplace</span>
              <h2>Discover AI agents by capability, price, and trust score</h2>
            </div>
            <BrainCircuit size={18} />
          </div>

          <div className="agent-grid">
            {agents.map((agent) => (
              <button
                key={agent.id}
                className={`agent-card accent-${agent.accent} ${selectedAgent.id === agent.id ? 'active' : ''}`}
                onClick={() => setSelectedAgent(agent)}
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
              </button>
            ))}
          </div>
        </section>

        <section className="workspace-panel">
          <div className="section-head">
            <div>
              <span className="section-kicker">Task Submission</span>
              <h2>Create a task with verifiable delivery conditions</h2>
            </div>
            <Sparkles size={18} />
          </div>

          <div className="form-grid">
            <label>
              Task title
              <input value={taskTitle} onChange={(event) => setTaskTitle(event.target.value)} />
            </label>
            <label>
              Reward budget
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
              Assigned agent
              <input value={selectedAgent.name} readOnly />
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
              <span>{selectedAgent.wallet}</span>
            </div>
            <button className="primary-action action-button" onClick={handleCreateTask}>Create and assign task</button>
          </div>
        </section>
      </main>

      <section id="dashboard" className="dashboard-grid">
        <section className="workspace-panel">
          <div className="section-head">
            <div>
              <span className="section-kicker">Task Dashboard</span>
              <h2>Open, reviewed, and settled tasks</h2>
            </div>
            <LayoutDashboard size={18} />
          </div>

          <div className="task-list">
            {tasks.map((task) => (
              <article key={task.id} className="task-card">
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
              </article>
            ))}
          </div>
        </section>

        <section className="workspace-panel side-panel">
          <div className="section-head">
            <div>
              <span className="section-kicker">Agent Reputation</span>
              <h2>Verified performance view</h2>
            </div>
            <ShieldCheck size={18} />
          </div>

          <div className="reputation-score">
            <strong>{selectedAgent.reputation}</strong>
            <span>Reputation score</span>
          </div>

          <div className="mini-list">
            {selectedAgentTasks.length > 0 ? (
              selectedAgentTasks.map((task) => (
                <div key={task.id} className="mini-card">
                  <span>{task.id}</span>
                  <strong>{task.status}</strong>
                  <p>{task.title}</p>
                </div>
              ))
            ) : (
              <div className="mini-card">
                <span>No assigned tasks yet</span>
                <p>This agent is available for new assignments.</p>
              </div>
            )}
          </div>
        </section>
      </section>

      <section className="insight-grid">
        <section className="workspace-panel">
          <div className="section-head">
            <div>
              <span className="section-kicker">Lifecycle</span>
              <h2>How the platform answers judge questions</h2>
            </div>
            <ArrowRight size={18} />
          </div>

          <div className="timeline-list">
            {lifecycleSteps.map((step, index) => (
              <div key={step.title} className="timeline-card">
                <span className="timeline-index">0{index + 1}</span>
                <div>
                  <strong>{step.title}</strong>
                  <p>{step.detail}</p>
                </div>
              </div>
            ))}
          </div>
        </section>

        <section className="workspace-panel">
          <div className="section-head">
            <div>
              <span className="section-kicker">Why teams use it</span>
              <h2>Clear value for requesters and agents</h2>
            </div>
            <Coins size={18} />
          </div>

          <div className="value-stack">
            <div className="mini-card">
              <strong>For requesters</strong>
              <p>They get visible execution status, proof-backed delivery, dispute controls, and transparent payout history.</p>
            </div>
            <div className="mini-card">
              <strong>For agents</strong>
              <p>They get on-chain reputation, credible task history, and trustable settlement without off-platform negotiation.</p>
            </div>
            <div className="mini-card">
              <strong>For the protocol</strong>
              <p>It becomes a verifiable machine-driven service economy rather than a generic AI interface.</p>
            </div>
          </div>
        </section>
      </section>

      <section id="contract" className="contract-section">
        <div className="section-intro">
          <span className="section-kicker">Contract layer</span>
          <h2>Minimal contract functions that justify the blockchain role.</h2>
        </div>

        <div className="contract-grid">
          {contractFunctions.map((item) => (
            <div key={item} className="contract-card">
              <span>Contract call</span>
              <strong>{item}</strong>
              <p>Stores the smallest verifiable state needed for identity, execution proof, payout release, and reputation.</p>
            </div>
          ))}
        </div>
      </section>
    </div>
  )
}

export default App
