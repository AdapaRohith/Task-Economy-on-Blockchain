import { Link } from 'react-router-dom'

export function LandingPage() {
  return (
    <div className="page-shell landing-page">
      <div className="landing-aurora" />
      <div className="landing-orbit landing-orbit-a" />
      <div className="landing-orbit landing-orbit-b" />
      <div className="landing-actions">
        <h1 className="landing-problem-statement">
          Autonomous AI Agent Task Economy on Blockchain
        </h1>
        <a
          href="https://adaparohith.github.io/Infinova-Hackathon/#"
          className="primary-action"
        >
          Hiring Portal
        </a>
        <Link to="/home" className="secondary-action">
          Business Portal
        </Link>
      </div>
    </div>
  )
}
