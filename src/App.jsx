import { useEffect, useState } from 'react'
import { Navigate, Route, Routes } from 'react-router-dom'
import { Navbar } from './components/Navbar'
import { AnalyzePage } from './pages/AnalyzePage'
import { DashboardPage } from './pages/DashboardPage'
import { HomePage } from './pages/HomePage'
import { VerifyPage } from './pages/VerifyPage'

const threshold = 75
const storageKey = 'task-economy-on-blockchain-state'

const initialTasks = [
  {
    id: 'TASK-2401',
    title: 'Execute AI task payout after score threshold passes',
    budget: '0.10 ALGO',
    status: 'Completed',
    rewardTx: 'NB4F...UF6Q',
    proofHash: '{"taskId":"TASK-2401","score":91,"status":"completed"}',
    verification: 'Payment executed on Algorand Testnet and proof is available in the explorer.',
  },
  {
    id: 'TASK-2402',
    title: 'Reject payout when score is below threshold',
    budget: '0.10 ALGO',
    status: 'Open',
    rewardTx: 'No transaction',
    proofHash: '{"taskId":"TASK-2402","score":62,"status":"failed"}',
    verification: 'Threshold rule prevented blockchain payment.',
  },
]

const loadPersistedState = () => {
  if (typeof window === 'undefined') {
    return null
  }

  try {
    const raw = window.localStorage.getItem(storageKey)
    return raw ? JSON.parse(raw) : null
  } catch {
    return null
  }
}

function App() {
  const persistedState = loadPersistedState()
  const [selectedStackItemId, setSelectedStackItemId] = useState(persistedState?.selectedStackItemId || 'algosdk')
  const [tasks, setTasks] = useState(persistedState?.tasks || initialTasks)
  const [taskTitle, setTaskTitle] = useState(persistedState?.taskTitle || 'Trigger Algorand-native payment after AI evaluation')
  const [taskBudget, setTaskBudget] = useState(persistedState?.taskBudget || '0.10')
  const [taskType, setTaskType] = useState(persistedState?.taskType || 'Code Review')
  const [receiverAddress, setReceiverAddress] = useState(persistedState?.receiverAddress || '')
  const [workflowState, setWorkflowState] = useState(
    persistedState?.workflowState || {
      phase: 'idle',
      message: 'Waiting for a task submission and AI score.',
      score: null,
      txId: '',
      explorerUrl: '',
      skipped: false,
      note: null,
      analysis: null,
    },
  )

  useEffect(() => {
    if (typeof window === 'undefined') {
      return
    }

    window.localStorage.setItem(
      storageKey,
      JSON.stringify({
        selectedStackItemId,
        tasks,
        taskTitle,
        taskBudget,
        taskType,
        receiverAddress,
        workflowState,
      }),
    )
  }, [receiverAddress, selectedStackItemId, taskBudget, taskTitle, taskType, tasks, workflowState])

  const handleRunWorkflow = async () => {
    if (!receiverAddress.trim()) {
      setWorkflowState({
        phase: 'error',
        message: 'Paste a valid Algorand Testnet receiver address before running the payment flow.',
        score: null,
        txId: '',
        explorerUrl: '',
        skipped: false,
        note: null,
        analysis: null,
      })
      return
    }

    const taskId = `TASK-${2403 + tasks.length}`
    setWorkflowState({
      phase: 'scoring',
      message: 'Requesting backend AI analysis before payment execution.',
      score: null,
      txId: '',
      explorerUrl: '',
      skipped: false,
      note: null,
      analysis: null,
    })

    let analysis
    try {
      const analysisResponse = await fetch('/api/analyze', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          taskTitle,
          taskType,
          taskBudget: Number(taskBudget),
          receiverAddress: receiverAddress.trim(),
        }),
      })

      const analysisData = await analysisResponse.json()
      if (!analysisResponse.ok || !analysisData.ok) {
        throw new Error(analysisData.message || 'Task analysis request failed.')
      }

      analysis = analysisData.analysis
    } catch (error) {
      setWorkflowState({
        phase: 'error',
        message: error.message,
        score: null,
        txId: '',
        explorerUrl: '',
        skipped: false,
        note: null,
        analysis: null,
      })
      return
    }

    const score = Number(analysis.score ?? 0)
    const status = analysis.status === 'completed' ? 'completed' : 'failed'
    const notePreview = { taskId, score, status }

    setWorkflowState({
      phase: 'scoring',
      message: `${analysis.summary} Evaluating threshold gate before payment execution.`,
      score,
      txId: '',
      explorerUrl: '',
      skipped: false,
      note: notePreview,
      analysis,
    })

    const pendingTask = {
      id: taskId,
      title: taskTitle,
      type: taskType,
      budget: `${taskBudget} ALGO`,
      status: 'In Review',
      rewardTx: 'Awaiting /api/pay response',
      proofHash: JSON.stringify(notePreview),
      verification: analysis.summary,
      analysis,
    }

    setTasks((current) => [pendingTask, ...current])

    try {
      const response = await fetch('/api/pay', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          taskId,
          receiver: receiverAddress.trim(),
          score,
          status,
          amountAlgo: Number(taskBudget),
        }),
      })

      const data = await response.json()
      if (!response.ok || !data.ok) {
        throw new Error(data.message || 'Algorand payment request failed.')
      }

      if (data.skipped) {
        setWorkflowState({
          phase: 'skipped',
          message: data.message,
          score,
          txId: '',
          explorerUrl: '',
          skipped: true,
          note: notePreview,
          analysis,
        })

        setTasks((current) =>
          current.map((task) =>
            task.id === taskId
              ? {
                  ...task,
                  status: 'Open',
                  rewardTx: 'No transaction',
                  verification: data.message,
                }
              : task,
          ),
        )
        return
      }

      setWorkflowState({
        phase: 'success',
        message: `Payment confirmed on Algorand Testnet in round ${data.confirmedRound}.`,
        score,
        txId: data.transactionId,
        explorerUrl: data.explorerUrl,
        skipped: false,
        note: data.note,
        analysis,
      })

      setTasks((current) =>
        current.map((task) =>
          task.id === taskId
            ? {
                ...task,
                status: 'Completed',
                rewardTx: data.transactionId,
                proofHash: JSON.stringify(data.note),
                verification: `Payment sent to ${data.receiverAddress}. Transaction proof is live on AlgoExplorer.`,
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
        note: notePreview,
        analysis,
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
      <div className="hero-orbit hero-orbit-a" />
      <div className="hero-orbit hero-orbit-b" />

      <Navbar />

      <main className="app-main">
        <Routes>
          <Route path="/" element={<HomePage threshold={threshold} />} />
          <Route
            path="/analyze"
            element={
              <AnalyzePage
                selectedStackItemId={selectedStackItemId}
                setSelectedStackItemId={setSelectedStackItemId}
                taskTitle={taskTitle}
                setTaskTitle={setTaskTitle}
                taskBudget={taskBudget}
                setTaskBudget={setTaskBudget}
                taskType={taskType}
                setTaskType={setTaskType}
                receiverAddress={receiverAddress}
                setReceiverAddress={setReceiverAddress}
                workflowState={workflowState}
                threshold={threshold}
                onRunWorkflow={handleRunWorkflow}
              />
            }
          />
          <Route
            path="/dashboard"
            element={<DashboardPage tasks={tasks} workflowState={workflowState} threshold={threshold} />}
          />
          <Route path="/verify" element={<VerifyPage workflowState={workflowState} threshold={threshold} />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </main>
    </div>
  )
}

export default App
