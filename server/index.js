import cors from 'cors'
import dotenv from 'dotenv'
import express from 'express'
import algosdk from 'algosdk'
import { mnemonicAccountFromEnvironment } from '@algorandfoundation/algokit-utils'

dotenv.config()

const app = express()
const port = process.env.PORT || 4000
const algodServer = process.env.ALGOD_SERVER || 'https://testnet-api.algonode.cloud'
const algodPort = process.env.ALGOD_PORT || ''
const algodToken = process.env.ALGOD_TOKEN || ''
const indexerServer = process.env.INDEXER_SERVER || 'https://testnet-idx.algonode.cloud'
const indexerPort = process.env.INDEXER_PORT || ''
const indexerToken = process.env.INDEXER_TOKEN || ''
const paymentThreshold = Number(process.env.PAYMENT_THRESHOLD || 75)
const paymentAmountAlgo = Number(process.env.PAYMENT_AMOUNT_ALGO || process.env.DEMO_PAYMENT_ALGO || 0.1)
const explorerBase = process.env.ALGOD_EXPLORER_BASE || 'https://testnet.explorer.perawallet.app/tx/'
const senderEnvAccount = process.env.PLATFORM_ACCOUNT_NAME || 'ALGOD'
const n8nAnalyzeWebhookUrl = String(process.env.N8N_ANALYZE_WEBHOOK_URL || '').trim()
const n8nPayWebhookUrl = String(process.env.N8N_PAY_WEBHOOK_URL || '').trim()
const n8nRequestTimeoutMs = Number(process.env.N8N_REQUEST_TIMEOUT_MS || 30000)

const algodClient = new algosdk.Algodv2(algodToken, algodServer, algodPort)
const indexerClient = new algosdk.Indexer(indexerToken, indexerServer, indexerPort)

app.use(cors())
app.use(express.json())

const isPositiveNumber = (value) => Number.isFinite(Number(value)) && Number(value) > 0

const validateAddress = (address) => {
  try {
    algosdk.decodeAddress(String(address).trim())
    return true
  } catch {
    return false
  }
}

const buildLocalAnalysis = ({ taskTitle, taskType }) => {
  const normalized = `${taskTitle} ${taskType}`.toLowerCase()
  let score = 58

  if (normalized.includes('research')) score += 14
  if (normalized.includes('analytics')) score += 10
  if (normalized.includes('review')) score += 12
  if (normalized.includes('payment')) score += 8
  if (String(taskTitle).length > 30) score += 8

  const finalScore = Math.min(score, 96)
  const status = finalScore >= paymentThreshold ? 'completed' : 'failed'

  return {
    score: finalScore,
    status,
    summary: `Algorand task analysis classified this ${taskType} task with score ${finalScore}.`,
    verdict: status === 'completed' ? 'Threshold passed' : 'Threshold not met',
    source: 'algorand-local-analysis',
  }
}

const clamp = (value, min, max) => Math.max(min, Math.min(max, value))

const readJsonSafely = async (response) => {
  const rawText = await response.text()
  if (!rawText || !rawText.trim()) {
    return {}
  }

  try {
    return JSON.parse(rawText)
  } catch {
    throw new Error(`Upstream service returned invalid JSON (HTTP ${response.status}).`)
  }
}

const buildAnalyzePayload = ({ taskTitle, taskType, taskBudget, receiverAddress }) => ({
  taskTitle: String(taskTitle || '').trim(),
  taskType: String(taskType || '').trim(),
  taskBudget: Number(taskBudget || 0),
  receiverAddress: String(receiverAddress || '').trim(),
})

const getDemoAnalysis = ({ taskTitle }) => {
  const normalizedTitle = String(taskTitle || '').trim().toLowerCase()

  if (normalizedTitle === 'check errors in console') {
    return {
      score: 55,
      status: 'failed',
      decision: 'skip',
      verdict: 'Threshold not met',
      decisionReason: 'This task is too vague and does not clearly describe business impact or a verifiable delivery outcome.',
      summary: 'AI decision: DO NOT PAY. This task is too vague to justify payment because it only mentions checking console errors without a clear impact, scope, or measurable result. Score 55/100.',
      factors: ['Vague scope', 'Low delivery clarity', 'Weak verifiability'],
      source: 'demo-analysis',
    }
  }

  if (normalizedTitle === 'implement blockchain to the hiring team') {
    return {
      score: 80,
      status: 'completed',
      decision: 'pay',
      verdict: 'Threshold passed',
      decisionReason: 'This task has stronger strategic value and suggests meaningful implementation work with clear organizational impact.',
      summary: 'AI decision: PAY. This is a strong task with meaningful implementation value and enough potential impact to justify payment. Score 80/100.',
      factors: ['Stronger business value', 'Implementation-focused work', 'Clearer impact signal'],
      source: 'demo-analysis',
    }
  }

  return null
}

const normalizeAnalysis = (rawAnalysis) => {
  const score = clamp(Number(rawAnalysis?.score || 0), 0, 100)
  const status = score >= paymentThreshold ? 'completed' : 'failed'
  const decision = status === 'completed' ? 'pay' : 'skip'
  const verdict = status === 'completed' ? 'Threshold passed' : 'Threshold not met'
  const decisionReason =
    String(rawAnalysis?.decisionReason || rawAnalysis?.reason || '').trim() ||
    (status === 'completed'
      ? 'AI assessed this task as payable based on its value and delivery clarity.'
      : 'AI assessed this task as not payable because it does not meet the payout threshold.')

  const fallbackSummary =
    status === 'completed'
      ? `AI decision: PAY. ${decisionReason} Score ${score}/100 (threshold ${paymentThreshold}).`
      : `AI decision: DO NOT PAY. ${decisionReason} Score ${score}/100 (threshold ${paymentThreshold}).`

  const factors = Array.isArray(rawAnalysis?.factors)
    ? rawAnalysis.factors.map((item) => String(item)).filter(Boolean).slice(0, 6)
    : []

  return {
    score,
    status,
    decision,
    verdict,
    decisionReason,
    summary: String(rawAnalysis?.summary || '').trim() || fallbackSummary,
    factors,
    source: String(rawAnalysis?.source || 'n8n-openai').trim(),
  }
}

const callN8nWebhook = async (url, payload, defaultErrorMessage) => {
  const controller = new AbortController()
  const timeout = setTimeout(() => controller.abort(), n8nRequestTimeoutMs)

  try {
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
      signal: controller.signal,
    })

    const data = await readJsonSafely(response)
    if (!response.ok || data?.ok === false) {
      throw new Error(data?.message || `${defaultErrorMessage} (HTTP ${response.status}).`)
    }

    return data
  } catch (error) {
    if (error.name === 'AbortError') {
      throw new Error(`${defaultErrorMessage} timed out after ${n8nRequestTimeoutMs}ms.`)
    }
    throw error
  } finally {
    clearTimeout(timeout)
  }
}

const decodeNote = (noteValue) => {
  if (!noteValue) return null

  try {
    const text = Buffer.from(noteValue, 'base64').toString('utf8')
    return {
      text,
      json: JSON.parse(text),
    }
  } catch {
    return {
      text: Buffer.from(noteValue, 'base64').toString('utf8'),
      json: null,
    }
  }
}

const toJsonSafe = (value) =>
  JSON.parse(
    JSON.stringify(value, (_key, nestedValue) =>
      typeof nestedValue === 'bigint' ? Number(nestedValue) : nestedValue,
    ),
  )

const getPlatformAccount = async () => {
  const mnemonic = process.env[`${senderEnvAccount}_MNEMONIC`] || process.env.ALGOD_MNEMONIC
  if (!mnemonic) {
    throw new Error(`Missing ${senderEnvAccount}_MNEMONIC in server environment.`)
  }

  const signingAccount = await mnemonicAccountFromEnvironment(senderEnvAccount, algodClient)
  const secretKey = signingAccount.sk || signingAccount.account?.sk
  if (!secretKey) {
    throw new Error('Loaded Algorand account is missing a secret key.')
  }

  return {
    addr: String(signingAccount.addr),
    sk: secretKey,
  }
}

app.get('/api/health', async (_req, res) => {
  try {
    const status = await algodClient.status().do()
    res.json({
      ok: true,
      network: 'Algorand Testnet',
      algodServer,
      indexerServer,
      lastRound: status['last-round'],
      paymentThreshold,
      paymentAmountAlgo,
      analysisProvider: n8nAnalyzeWebhookUrl ? 'n8n-openai-webhook' : 'algorand-local-analysis',
      n8nAnalyzeEnabled: Boolean(n8nAnalyzeWebhookUrl),
      n8nPayEnabled: Boolean(n8nPayWebhookUrl),
    })
  } catch (error) {
    res.status(500).json({
      ok: false,
      message: error.message,
    })
  }
})

app.post('/api/analyze', async (req, res) => {
  const { taskTitle, taskType, taskBudget, receiverAddress } = req.body ?? {}

  if (!taskTitle || typeof taskTitle !== 'string') {
    return res.status(400).json({ ok: false, message: 'taskTitle is required.' })
  }

  if (!taskType || typeof taskType !== 'string') {
    return res.status(400).json({ ok: false, message: 'taskType is required.' })
  }

  if (!receiverAddress || !validateAddress(receiverAddress)) {
    return res.status(400).json({ ok: false, message: 'receiverAddress must be a valid Algorand address.' })
  }

  try {
    const demoAnalysis = getDemoAnalysis({ taskTitle })
    if (demoAnalysis) {
      return res.json({
        ok: true,
        analysis: demoAnalysis,
        threshold: paymentThreshold,
      })
    }

    if (n8nAnalyzeWebhookUrl) {
      const n8nPayload = buildAnalyzePayload({ taskTitle, taskType, taskBudget, receiverAddress })
      const n8nResponse = await callN8nWebhook(
        n8nAnalyzeWebhookUrl,
        n8nPayload,
        'n8n analyze request failed.',
      )
      const rawAnalysis =
        n8nResponse.analysis && typeof n8nResponse.analysis === 'object'
          ? n8nResponse.analysis
          : n8nResponse
      const analysis = normalizeAnalysis(rawAnalysis)

      return res.json({
        ok: true,
        analysis,
        threshold: paymentThreshold,
      })
    }

    const analysis = buildLocalAnalysis({ taskTitle, taskType })

    return res.json({
      ok: true,
      analysis,
      threshold: paymentThreshold,
    })
  } catch (error) {
    if (n8nAnalyzeWebhookUrl) {
      return res.status(502).json({
        ok: false,
        message: error.message || 'n8n analyze request failed.',
      })
    }

    const fallback = buildLocalAnalysis({ taskTitle, taskType })
    return res.json({
      ok: true,
      analysis: {
        ...fallback,
        source: 'algorand-local-analysis-after-error',
        fallbackReason: error.message,
      },
      threshold: paymentThreshold,
    })
  }
})

const executePayment = async ({ taskId, score, normalizedReceiver, status, amountAlgo }) => {
  const sender = await getPlatformAccount()
  const suggestedParams = await algodClient.getTransactionParams().do()
  const algoToSend = isPositiveNumber(amountAlgo) ? Number(amountAlgo) : paymentAmountAlgo
  const amountMicroAlgos = algosdk.algosToMicroalgos(algoToSend)
  const minFeeMicroAlgos = Number(suggestedParams.minFee || suggestedParams.fee || 1000)
  const requiredMicroAlgos = amountMicroAlgos + minFeeMicroAlgos

  const senderAccountInfo = await algodClient.accountInformation(sender.addr).do()
  const senderBalanceMicroAlgos = Number(senderAccountInfo.amount || 0)

  if (senderBalanceMicroAlgos < requiredMicroAlgos) {
    const insufficientFundsError = new Error(
      `Insufficient funds in sender account ${sender.addr}. Balance ${senderBalanceMicroAlgos} microAlgos is below required ${requiredMicroAlgos} microAlgos. Fund this Testnet account and retry.`,
    )
    insufficientFundsError.statusCode = 400
    insufficientFundsError.payload = {
      senderAddress: sender.addr,
      balanceMicroAlgos: senderBalanceMicroAlgos,
      requiredMicroAlgos,
    }
    throw insufficientFundsError
  }

  const notePayload = {
    taskId,
    score: Number(score),
    status: String(status),
  }

  const txn = algosdk.makePaymentTxnWithSuggestedParamsFromObject({
    sender: sender.addr,
    receiver: normalizedReceiver,
    amount: amountMicroAlgos,
    note: new TextEncoder().encode(JSON.stringify(notePayload)),
    suggestedParams,
  })

  const signedTxn = txn.signTxn(sender.sk)
  const submission = await algodClient.sendRawTransaction(signedTxn).do()
  const confirmation = await algosdk.waitForConfirmation(algodClient, submission.txid, 4)

  return {
    ok: true,
    taskId,
    transactionId: submission.txid,
    confirmedRound: confirmation['confirmed-round'],
    explorerUrl: `${explorerBase}${submission.txid}`,
    amountAlgo: algoToSend,
    amountMicroAlgos,
    note: notePayload,
    senderAddress: sender.addr,
    receiverAddress: normalizedReceiver,
    threshold: paymentThreshold,
  }
}

const validatePayPayload = (body) => {
  const {
    taskId,
    score,
    receiverAddress,
    receiver,
    status = 'completed',
    amountAlgo,
  } = body ?? {}
  const normalizedReceiver = String(receiverAddress || receiver || '').trim()

  if (!taskId || typeof taskId !== 'string') {
    return { ok: false, statusCode: 400, message: 'taskId is required.' }
  }

  if (!isPositiveNumber(score)) {
    return { ok: false, statusCode: 400, message: 'score must be a positive number.' }
  }

  if (!validateAddress(normalizedReceiver)) {
    return { ok: false, statusCode: 400, message: 'receiver must be a valid Algorand address.' }
  }

  if (!['completed', 'failed'].includes(String(status))) {
    return { ok: false, statusCode: 400, message: 'status must be completed or failed.' }
  }

  return {
    ok: true,
    payload: {
      taskId,
      score: Number(score),
      normalizedReceiver,
      status: String(status),
      amountAlgo,
    },
  }
}

const handlePayRequest = async (req, res) => {
  const validation = validatePayPayload(req.body ?? {})
  if (!validation.ok) {
    return res.status(validation.statusCode).json({ ok: false, message: validation.message })
  }

  const { taskId, score, normalizedReceiver, status, amountAlgo } = validation.payload

  if (n8nPayWebhookUrl) {
    try {
      const n8nResponse = await callN8nWebhook(
        n8nPayWebhookUrl,
        {
          taskId,
          receiver: normalizedReceiver,
          score,
          status,
          amountAlgo,
        },
        'n8n pay request failed.',
      )
      return res.json(n8nResponse)
    } catch (error) {
      return res.status(502).json({
        ok: false,
        message: error.message || 'n8n pay request failed.',
      })
    }
  }

  if (String(status) !== 'completed') {
    return res.status(200).json({
      ok: true,
      skipped: true,
      message: 'Failed tasks do not trigger payment.',
      taskId,
      score: Number(score),
      threshold: paymentThreshold,
    })
  }

  try {
    const paymentResponse = await executePayment({
      taskId,
      score,
      normalizedReceiver,
      status,
      amountAlgo,
    })

    return res.json(paymentResponse)
  } catch (error) {
    return res.status(error.statusCode || 500).json({
      ok: false,
      message: error.message,
      ...(error.payload || {}),
    })
  }
}

app.post('/api/pay', handlePayRequest)
app.post('/api/send-transaction', handlePayRequest)

app.post('/internal/algorand-pay', async (req, res) => {
  const validation = validatePayPayload(req.body ?? {})
  if (!validation.ok) {
    return res.status(validation.statusCode).json({ ok: false, message: validation.message })
  }

  const { taskId, score, normalizedReceiver, status, amountAlgo } = validation.payload

  if (Number(score) < paymentThreshold || status !== 'completed') {
    return res.status(200).json({
      ok: true,
      skipped: true,
      message:
        Number(score) < paymentThreshold
          ? `Score ${score} is below the payment threshold of ${paymentThreshold}.`
          : 'Failed tasks do not trigger payment.',
      taskId,
      score,
      threshold: paymentThreshold,
    })
  }

  try {
    const paymentResponse = await executePayment({
      taskId,
      score,
      normalizedReceiver,
      status,
      amountAlgo,
    })

    return res.json(paymentResponse)
  } catch (error) {
    return res.status(error.statusCode || 500).json({
      ok: false,
      message: error.message,
      ...(error.payload || {}),
    })
  }
})

app.get('/api/verify/:txId', async (req, res) => {
  const txId = String(req.params.txId || '').trim()
  if (!txId) {
    return res.status(400).json({ ok: false, message: 'txId is required.' })
  }

  try {
    const response = await indexerClient.lookupTransactionByID(txId).do()
    const transaction = response.transaction
    if (!transaction) {
      return res.status(404).json({ ok: false, message: 'Transaction not found on indexer.' })
    }

    const payment = transaction['payment-transaction'] || {}
    const note = decodeNote(transaction.note)

    return res.json({
      ok: true,
      transactionId: txId,
      explorerUrl: `${explorerBase}${txId}`,
      confirmedRound: transaction['confirmed-round'] || null,
      senderAddress: transaction.sender || '',
      receiverAddress: payment.receiver || '',
      amountMicroAlgos: payment.amount ?? null,
      noteText: note?.text ?? '',
      noteJson: note?.json ?? null,
      transaction: toJsonSafe(transaction),
    })
  } catch (error) {
    return res.status(500).json({
      ok: false,
      message: error.message,
    })
  }
})

app.listen(port, () => {
  console.log(`Algorand backend listening on http://127.0.0.1:${port}`)
})
