import { NavLink } from 'react-router-dom'
import { motion } from 'framer-motion'
import { ShieldCheck } from 'lucide-react'

const links = [
  { to: '/home', label: 'Home' },
  { to: '/analyze', label: 'Analyze' },
  { to: '/dashboard', label: 'Dashboard' },
  { to: '/verify', label: 'Verify' },
]

export function Navbar() {
  return (
    <header className="top-nav">
      <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} className="brand">
        <span className="brand-icon">
          <ShieldCheck size={18} />
        </span>
        <div>
          <strong>Task Economy on Blockchain</strong>
          <span>Algorand-native payment and verification</span>
        </div>
      </motion.div>

      <nav className="nav-pill">
        {links.map((link) => (
          <NavLink
            key={link.to}
            to={link.to}
            className={({ isActive }) => (isActive ? 'active' : '')}
          >
            {link.label}
          </NavLink>
        ))}
      </nav>

      <NavLink to="/dashboard" className="nav-cta">
        Open Dashboard
      </NavLink>
    </header>
  )
}
