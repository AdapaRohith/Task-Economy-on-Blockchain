import {
  AlertTriangle,
  ArrowRight,
  BadgeDollarSign,
  Blocks,
  BrainCircuit,
  CheckCheck,
  Coins,
  FileCheck2,
  Link2,
  Server,
  Shield,
  ShieldCheck,
  Wallet,
} from 'lucide-react'

export const stackItems = [
  {
    id: 'algosdk',
    name: 'algosdk (JavaScript)',
    category: 'Core SDK',
    detail: 'Constructs, signs, and submits native Algorand payment transactions.',
    accent: 'indigo',
  },
  {
    id: 'algokit',
    name: '@algorandfoundation/algokit-utils',
    category: 'Utility Layer',
    detail: 'Loads accounts from environment and keeps the stack Algorand-native.',
    accent: 'violet',
  },
  {
    id: 'testnet',
    name: 'Algorand Testnet',
    category: 'Execution Network',
    detail: 'Used for payment broadcasting, note metadata, and explorer verification.',
    accent: 'emerald',
  },
]

export const metrics = [
  { label: 'Allowed SDKs', value: '2', icon: Blocks },
  { label: 'Network Target', value: 'Testnet', icon: Coins },
  { label: 'Payment Trigger', value: 'Score >= 75', icon: ShieldCheck },
  { label: 'Proof Output', value: 'Tx ID + Note', icon: BadgeDollarSign },
]

export const strictConstraints = [
  {
    title: 'Use ONLY Algorand ecosystem tools',
    points: ['algosdk (JavaScript)', '@algorandfoundation/algokit-utils', 'Algorand Testnet'],
    icon: AlertTriangle,
  },
  {
    title: 'Do NOT use non-Algorand tooling',
    points: ['No Ethereum', 'No ethers.js', 'No MetaMask', 'No non-Algorand wallet flow'],
    icon: Shield,
  },
  {
    title: 'Implementation style',
    points: ['Keep the build lightweight and hackathon-ready', 'Extend the existing codebase instead of rebuilding it'],
    icon: ArrowRight,
  },
]

export const projectContext = [
  'User submits a task with a receiver address.',
  'AI processes the task and generates a score and result.',
  'If score >= threshold, the backend sends an Algorand payment.',
  'Task proof is stored in the Algorand transaction note.',
  'The UI shows payment status, transaction ID, and explorer link.',
]

export const architectureFlow = [
  {
    title: 'Task Submit',
    subtitle: 'TITLE + RECEIVER + AMOUNT',
    icon: FileCheck2,
    accent: 'blue',
  },
  {
    title: 'AI Score',
    subtitle: 'SCORE + RESULT GENERATED',
    icon: BrainCircuit,
    accent: 'indigo',
  },
  {
    title: 'Threshold Gate',
    subtitle: 'PAY ONLY IF SCORE >= 75',
    icon: Shield,
    accent: 'violet',
  },
  {
    title: 'POST /api/pay',
    subtitle: 'SIGN + BROADCAST PAYMENT',
    icon: Server,
    accent: 'emerald',
  },
  {
    title: 'Explorer Proof',
    subtitle: 'TX ID + NOTE JSON',
    icon: Link2,
    accent: 'amber',
  },
]

export const backendChecklist = [
  'Install and use algosdk, @algorandfoundation/algokit-utils, and dotenv.',
  'Connect to Algorand Testnet with an Algod client.',
  'Load sender account from mnemonic stored in environment variables.',
  'Construct a native Algorand payment transaction.',
  'Encode task metadata into the NOTE field as JSON.',
  'Expose POST /api/pay and return transaction ID on success.',
]

export const frontendChecklist = [
  'Call backend /api/pay after AI scoring completes.',
  'Display payment status as success, skipped, or failure.',
  'Render the returned transaction ID in the UI.',
  'Link directly to Algorand Testnet Explorer for live proof.',
]

export const receiverRules = [
  'Accept pasted Algorand wallet addresses.',
  'Validate Algorand address format before payment execution.',
  'Keep wallet handling Algorand-native and lightweight.',
]

export const proofSchema = [
  '"taskId": "TASK-XXXX"',
  '"score": 85',
  '"status": "completed"',
]

export const expectedFlow = [
  'User submits task.',
  'AI processes and returns score.',
  'If score >= threshold, backend sends Algorand payment.',
  'Metadata is stored on-chain in the NOTE field.',
  'Frontend displays success message, transaction ID, and explorer link.',
]

export const homeHighlights = [
  {
    title: 'Prompt Scope',
    detail: 'Homepage focuses on what the product is solving and the system architecture, instead of stuffing the entire workflow into one scroll.',
    icon: FileCheck2,
  },
  {
    title: 'Separated Task Flow',
    detail: 'Analyze is isolated as its own route so task execution and payment action happen on a dedicated screen.',
    icon: BrainCircuit,
  },
  {
    title: 'Separate Verification',
    detail: 'Proof and verification are moved into their own route so users can inspect on-chain note metadata without digging through the homepage.',
    icon: Wallet,
  },
  {
    title: 'Clear Dashboard',
    detail: 'Dashboard has its own route for transaction history, live response, and payment results just like the Infinova structure.',
    icon: CheckCheck,
  },
]
