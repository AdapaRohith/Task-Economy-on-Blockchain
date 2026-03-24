import { useEffect, useState } from 'react'
import { Navigate, Route, Routes, useLocation } from 'react-router-dom'
import { Navbar } from './components/Navbar'
import { AnalyzePage } from './pages/AnalyzePage'
import { DashboardPage } from './pages/DashboardPage'
import { HomePage } from './pages/HomePage'
import { LandingPage } from './pages/LandingPage'
import { VerifyPage } from './pages/VerifyPage'
import { API } from './config'

const threshold = 75
const storageKey = 'task-economy-on-blockchain-state-v2'
const placeholderReceiverAddress = 'AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAY5HFKQ'
const defaultReceiverAddress = 'YHEIT7IPD0TG6XHO6AHR57RX57REYRUIPKVGOJ54DDMBP2PAV6A5NQJZ4Q'

const initialTasks = []

const isDemoTask = (task) => {
  const id = String(task?.id || '')
  return id === 'TASK-2401' || id === 'TASK-2402'
}

const sanitizeTasks = (tasks) =>
  Array.isArray(tasks) ? tasks.filter((task) => !isDemoTask(task)) : []

const readJsonResponse = async (response, defaultMessage) => {
  const rawText = await response.text()

  if (!rawText || !rawText.trim()) {
    if (!response.ok) {
      throw new Error(`${defaultMessage} (HTTP ${response.status})`)
    }
    return {}
  }

  try {
    return JSON.parse(rawText)
  } catch {
    throw new Error(`Service returned invalid JSON (HTTP ${response.status}).`)
  }
}

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

const sanitizeWorkflowState = (workflowState) => {
  if (!workflowState || typeof workflowState !== 'object') {
    return null
  }

  const staleShouldPayError =
    workflowState.phase === 'error' &&
    String(workflowState.message || '').includes('boolean should_pay field')

  if (staleShouldPayError) {
    return {
      phase: 'idle',
      message: 'Waiting for a task submission and AI score.',
      taskId: '',
      score: null,
      txId: '',
      explorerUrl: '',
      skipped: false,
      note: null,
      analysis: null,
    }
  }

  return workflowState
}

function App() {
  const location = useLocation()
  const isLandingPage = location.pathname === '/'
  const persistedState = loadPersistedState()
  const persistedWorkflowState = sanitizeWorkflowState(persistedState?.workflowState)
  const [selectedStackItemId, setSelectedStackItemId] = useState(persistedState?.selectedStackItemId || 'algosdk')
  const [tasks, setTasks] = useState(sanitizeTasks(persistedState?.tasks) || initialTasks)
  const [taskTitle, setTaskTitle] = useState(persistedState?.taskTitle || 'Trigger Algorand-native payment after AI evaluation')
  const [taskBudget, setTaskBudget] = useState(persistedState?.taskBudget || '0.10')
  const [taskType, setTaskType] = useState(persistedState?.taskType || 'Code Review')
  const [receiverAddress, setReceiverAddress] = useState(persistedState?.receiverAddress || defaultReceiverAddress)
  const [workflowState, setWorkflowState] = useState(
    persistedWorkflowState || {
      phase: 'idle',
      message: 'Waiting for a task submission and AI score.',
      taskId: '',
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
    const taskId = `TASK-${2403 + tasks.length}`
    setWorkflowState({
      phase: 'scoring',
      message: 'Requesting backend AI analysis.',
      taskId,
      score: null,
      txId: '',
      explorerUrl: '',
      skipped: false,
      note: null,
      analysis: null,
    })

    let analysis
    try {
      const analysisResponse = await fetch(API.analyze, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          taskTitle,
          taskType,
          taskBudget: Number(taskBudget),
          receiverAddress: placeholderReceiverAddress,
        }),
      })

      const analysisData = await readJsonResponse(analysisResponse, 'Task analysis request failed.')
      if (!analysisResponse.ok || !analysisData.ok) {
        throw new Error(analysisData.message || `Task analysis request failed (HTTP ${analysisResponse.status}).`)
      }

      analysis = analysisData.analysis
    } catch (error) {
      setWorkflowState({
        phase: 'error',
        message: error.message,
        taskId,
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
    const passedThreshold = score >= threshold

    setWorkflowState({
      phase: passedThreshold ? 'awaiting_payment' : 'skipped',
      message: passedThreshold
        ? 'AI recommends payment. Add a receiver Algorand address if you want to continue.'
        : 'Threshold not met. Review the AI reasoning before deciding whether to refine and resubmit the task.',
      taskId,
      score,
      txId: '',
      explorerUrl: '',
      skipped: !passedThreshold,
      note: notePreview,
      analysis,
    })

    const pendingTask = {
      id: taskId,
      title: taskTitle,
      type: taskType,
      budget: `${taskBudget} ALGO`,
      status: passedThreshold ? 'Awaiting Payment' : 'Open',
      rewardTx: passedThreshold ? 'Awaiting receiver address' : 'No transaction',
      proofHash: JSON.stringify(notePreview),
      verification: passedThreshold
        ? `${analysis.summary} Waiting for the user to confirm payment with a receiver address.`
        : analysis.summary,
      analysis,
    }

    setTasks((current) => [pendingTask, ...current])
  }

  const handlePayWorkflow = async () => {
    if (!receiverAddress.trim()) {
      setWorkflowState((current) => ({
        ...current,
        phase: 'error',
        message: 'Paste a valid Algorand Testnet receiver address before sending payment.',
      }))
      return
    }

    const taskId = workflowState.taskId || `TASK-${2403 + tasks.length}`
    const score = Number(workflowState.score ?? 0)
    const status = workflowState.analysis?.status === 'completed' ? 'completed' : 'failed'
    const notePreview = { taskId, score, status }
    const analysis = workflowState.analysis

    setWorkflowState((current) => ({
      ...current,
      phase: 'paying',
      message: 'Submitting Algorand payment.',
      taskId,
      note: notePreview,
    }))

    try {
      const response = await fetch(API.pay, {
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

      const data = await readJsonResponse(response, 'Algorand payment request failed.')
      if (!response.ok || !data.ok) {
        throw new Error(data.message || `Algorand payment request failed (HTTP ${response.status}).`)
      }

      if (data.skipped) {
        setWorkflowState({
          phase: 'skipped',
          message: data.message,
          taskId,
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
                verification: `${analysis?.summary || ''} ${data.message}`.trim(),
              }
            : task,
          ),
        )
        return
      }

      setWorkflowState({
        phase: 'success',
        message: `Payment confirmed on Algorand Testnet in round ${data.confirmedRound}.`,
        taskId,
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
        taskId,
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
                status: 'Awaiting Payment',
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

      {!isLandingPage ? <Navbar /> : null}

      <main className="app-main">
        <Routes>
          <Route path="/" element={<LandingPage />} />
          <Route path="/home" element={<HomePage threshold={threshold} />} />
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
                onPayWorkflow={handlePayWorkflow}
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
