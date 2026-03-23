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
const paymentAmountAlgo = Number(process.env.DEMO_PAYMENT_ALGO || 0.1)
const explorerBase = process.env.ALGOD_EXPLORER_BASE || 'https://testnet.algoexplorer.io/tx/'
const senderEnvAccount = process.env.PLATFORM_ACCOUNT_NAME || 'ALGOD'
const openAiApiKey = process.env.OPENAI_API_KEY || ''
const openAiBaseUrl = process.env.OPENAI_BASE_URL || 'https://api.openai.com/v1'
const openAiModel = process.env.OPENAI_MODEL || 'gpt-4o-mini'

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
    summary: `Local fallback analysis classified this ${taskType} task with score ${finalScore}.`,
    verdict: status === 'completed' ? 'Threshold passed' : 'Threshold not met',
    source: 'local-fallback',
  }
}

const analyzeWithOpenAI = async ({ taskTitle, taskType, taskBudget, receiverAddress }) => {
  const response = await fetch(`${openAiBaseUrl}/chat/completions`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${openAiApiKey}`,
    },
    body: JSON.stringify({
      model: openAiModel,
      response_format: {
        type: 'json_schema',
        json_schema: {
          name: 'task_analysis',
          schema: {
            type: 'object',
            properties: {
              score: { type: 'number' },
              status: { type: 'string', enum: ['completed', 'failed'] },
              summary: { type: 'string' },
              verdict: { type: 'string' },
            },
            required: ['score', 'status', 'summary', 'verdict'],
            additionalProperties: false,
          },
        },
      },
      messages: [
        {
          role: 'system',
          content:
            'You evaluate Algorand-native task execution requests for a hackathon demo. Return a practical score from 0 to 100 and whether the task should be completed or failed. Completed should only be used when the task is credible and well-formed enough to pass threshold review.',
        },
        {
          role: 'user',
          content: `Task title: ${taskTitle}\nTask type: ${taskType}\nBudget in ALGO: ${taskBudget}\nReceiver address: ${receiverAddress}\nThreshold: ${paymentThreshold}\nReturn JSON only.`,
        },
      ],
    }),
  })

  if (!response.ok) {
    throw new Error(`OpenAI analysis request failed with status ${response.status}`)
  }

  const data = await response.json()
  const content = data.choices?.[0]?.message?.content
  if (!content) {
    throw new Error('OpenAI analysis returned no content')
  }

  const parsed = JSON.parse(content)
  return {
    score: Math.max(0, Math.min(100, Number(parsed.score ?? 0))),
    status: parsed.status === 'completed' ? 'completed' : 'failed',
    summary: String(parsed.summary ?? ''),
    verdict: String(parsed.verdict ?? ''),
    source: 'openai',
    model: openAiModel,
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
      analysisProvider: openAiApiKey ? 'openai' : 'local-fallback',
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
    const analysis = openAiApiKey
      ? await analyzeWithOpenAI({ taskTitle, taskType, taskBudget, receiverAddress })
      : buildLocalAnalysis({ taskTitle, taskType })

    return res.json({
      ok: true,
      analysis,
      threshold: paymentThreshold,
    })
  } catch (error) {
    const fallback = buildLocalAnalysis({ taskTitle, taskType })
    return res.json({
      ok: true,
      analysis: {
        ...fallback,
        source: 'local-fallback-after-error',
        fallbackReason: error.message,
      },
      threshold: paymentThreshold,
    })
  }
})

const handlePayRequest = async (req, res) => {
  const {
    taskId,
    score,
    receiverAddress,
    receiver,
    status = 'completed',
    amountAlgo,
  } = req.body ?? {}
  const normalizedReceiver = String(receiverAddress || receiver || '').trim()

  if (!taskId || typeof taskId !== 'string') {
    return res.status(400).json({ ok: false, message: 'taskId is required.' })
  }

  if (!isPositiveNumber(score)) {
    return res.status(400).json({ ok: false, message: 'score must be a positive number.' })
  }

  if (!validateAddress(normalizedReceiver)) {
    return res.status(400).json({ ok: false, message: 'receiver must be a valid Algorand address.' })
  }

  if (!['completed', 'failed'].includes(String(status))) {
    return res.status(400).json({ ok: false, message: 'status must be completed or failed.' })
  }

  if (Number(score) < paymentThreshold) {
    return res.status(200).json({
      ok: true,
      skipped: true,
      message: `Score ${score} is below the payment threshold of ${paymentThreshold}.`,
      taskId,
      score: Number(score),
      threshold: paymentThreshold,
    })
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
    const sender = await getPlatformAccount()
    const suggestedParams = await algodClient.getTransactionParams().do()
    const algoToSend = isPositiveNumber(amountAlgo) ? Number(amountAlgo) : paymentAmountAlgo

    const notePayload = {
      taskId,
      score: Number(score),
      status: String(status),
    }

    const txn = algosdk.makePaymentTxnWithSuggestedParamsFromObject({
      sender: sender.addr,
      receiver: normalizedReceiver,
      amount: algosdk.algosToMicroalgos(algoToSend),
      note: new TextEncoder().encode(JSON.stringify(notePayload)),
      suggestedParams,
    })

    const signedTxn = txn.signTxn(sender.sk)
    const submission = await algodClient.sendRawTransaction(signedTxn).do()
    const confirmation = await algosdk.waitForConfirmation(algodClient, submission.txid, 4)

    return res.json({
      ok: true,
      taskId,
      transactionId: submission.txid,
      confirmedRound: confirmation['confirmed-round'],
      explorerUrl: `${explorerBase}${submission.txid}`,
      amountAlgo: algoToSend,
      amountMicroAlgos: algosdk.algosToMicroalgos(algoToSend),
      note: notePayload,
      senderAddress: sender.addr,
      receiverAddress: normalizedReceiver,
      threshold: paymentThreshold,
    })
  } catch (error) {
    return res.status(500).json({
      ok: false,
      message: error.message,
    })
  }
}

app.post('/api/pay', handlePayRequest)
app.post('/api/send-transaction', handlePayRequest)

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
      transaction,
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
