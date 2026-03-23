import { motion } from 'framer-motion'
import { Link } from 'react-router-dom'
import { architectureFlow, homeHighlights, metrics, projectContext, strictConstraints } from '../content'

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

export function HomePage({ threshold }) {
  return (
    <div className="page-shell">
      <header className="hero">
        <motion.div variants={stagger} initial="hidden" animate="show" className="hero-panel hero-copy">
          <motion.span variants={fadeUp} className="eyebrow">
            Algorand-native task economy
          </motion.span>
          <motion.h1 variants={fadeUp}>
            <span className="hero-gradient-text">Architecture first.</span>{' '}
            <span className="hero-outline-text">Workflow separated cleanly.</span>
          </motion.h1>
          <motion.p variants={fadeUp}>
            This homepage now focuses on the product, the problem, and the system architecture. Task execution,
            dashboard inspection, and proof verification each live on their own route like the Infinova structure.
          </motion.p>
          <motion.div variants={fadeUp} className="hero-actions">
            <Link to="/analyze" className="primary-action">Open Analyze</Link>
            <Link to="/verify" className="secondary-action">Open Verify</Link>
          </motion.div>
          <motion.em variants={fadeUp} className="hero-note">
            Threshold logic remains the same: payment only executes when score is greater than or equal to {threshold}.
          </motion.em>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, scale: 0.96 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.5, delay: 0.1 }}
          className="hero-stack"
        >
          {homeHighlights.slice(0, 2).map((item, index) => {
            const Icon = item.icon
            return (
              <motion.div
                key={item.title}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.35 + index * 0.15 }}
                className="hero-panel proof-note"
              >
                <div className="note-label"><Icon size={14} /> {item.title}</div>
                <p>{item.detail}</p>
              </motion.div>
            )
          })}
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

      <section className="spec-grid">
        <section className="workspace-panel">
          <div className="section-head">
            <div>
              <span className="section-kicker">Strict Constraints</span>
              <h2>Homepage contains only the product matter and architecture context.</h2>
            </div>
          </div>

          <div className="spec-stack">
            {strictConstraints.map((group) => {
              const Icon = group.icon
              return (
                <article key={group.title} className="spec-card">
                  <strong className="spec-title"><Icon size={16} /> {group.title}</strong>
                  <ul className="spec-list">
                    {group.points.map((point) => (
                      <li key={point}>{point}</li>
                    ))}
                  </ul>
                </article>
              )
            })}
          </div>
        </section>

        <section className="workspace-panel">
          <div className="section-head">
            <div>
              <span className="section-kicker">Homepage Scope</span>
              <h2>Clear overview instead of stuffing every workflow into one page.</h2>
            </div>
          </div>

          <div className="timeline-list">
            {projectContext.map((item, index) => (
              <div key={item} className="timeline-card">
                <span className="timeline-index">0{index + 1}</span>
                <div>
                  <strong>{item}</strong>
                </div>
              </div>
            ))}
          </div>
        </section>
      </section>

      <section className="architecture-section">
        <div className="section-intro">
          <span className="section-kicker">System Architecture</span>
          <h2>The homepage keeps the architecture visible, while execution lives elsewhere.</h2>
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
                    <div className="connector">
                      <motion.div
                        className="connector-core"
                        animate={{ opacity: [0.3, 1, 0.3], scaleX: [0.92, 1, 0.92] }}
                        transition={{ duration: 1.8, repeat: Infinity, delay: index * 0.2 }}
                      />
                      <motion.div
                        className="connector-dot"
                        animate={{ x: [-6, 16, -6], opacity: [0, 1, 0] }}
                        transition={{ duration: 1.6, repeat: Infinity, delay: index * 0.2, ease: 'linear' }}
                      />
                    </div>
                  ) : null}
                </motion.div>
              )
            })}
          </div>
        </div>
      </section>
    </div>
  )
}
