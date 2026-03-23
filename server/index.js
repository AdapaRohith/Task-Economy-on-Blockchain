import cors from 'cors'
import dotenv from 'dotenv'
import express from 'express'
import algosdk from 'algosdk'

dotenv.config()

const app = express()
const port = process.env.PORT || 4000
const algodServer = process.env.ALGOD_SERVER || 'https://testnet-api.algonode.cloud'
const algodPort = process.env.ALGOD_PORT || ''
const algodToken = process.env.ALGOD_TOKEN || ''
const paymentThreshold = Number(process.env.PAYMENT_THRESHOLD || 75)
const paymentAmountAlgo = Number(process.env.DEMO_PAYMENT_ALGO || 0.1)
const explorerBase = process.env.ALGOD_EXPLORER_BASE || 'https://testnet.algoexplorer.io/tx/'

const algodClient = new algosdk.Algodv2(algodToken, algodServer, algodPort)

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

const getPlatformAccount = () => {
  const mnemonic = process.env.ALGOD_MNEMONIC
  if (!mnemonic) {
    throw new Error('Missing ALGOD_MNEMONIC in server environment.')
  }

  return algosdk.mnemonicToSecretKey(mnemonic)
}

app.get('/api/health', async (_req, res) => {
  try {
    const status = await algodClient.status().do()
    res.json({
      ok: true,
      network: 'Algorand Testnet',
      algodServer,
      lastRound: status['last-round'],
      paymentThreshold,
      paymentAmountAlgo,
    })
  } catch (error) {
    res.status(500).json({
      ok: false,
      message: error.message,
    })
  }
})

app.post('/api/send-transaction', async (req, res) => {
  const { taskId, score, receiverAddress, status = 'completed', amountAlgo } = req.body ?? {}

  if (!taskId || typeof taskId !== 'string') {
    return res.status(400).json({ ok: false, message: 'taskId is required.' })
  }

  if (!isPositiveNumber(score)) {
    return res.status(400).json({ ok: false, message: 'score must be a positive number.' })
  }

  if (!validateAddress(receiverAddress)) {
    return res.status(400).json({ ok: false, message: 'receiverAddress must be a valid Algorand address.' })
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
    const sender = getPlatformAccount()
    const suggestedParams = await algodClient.getTransactionParams().do()
    const algoToSend = isPositiveNumber(amountAlgo) ? Number(amountAlgo) : paymentAmountAlgo

    const notePayload = {
      taskId,
      score: Number(score),
      status: String(status),
      timestamp: new Date().toISOString(),
    }

    const txn = algosdk.makePaymentTxnWithSuggestedParamsFromObject({
      sender: sender.addr,
      receiver: String(receiverAddress).trim(),
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
      note: notePayload,
      senderAddress: sender.addr,
      receiverAddress: String(receiverAddress).trim(),
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
