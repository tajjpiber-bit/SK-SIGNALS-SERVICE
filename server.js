const express = require('express');
const cors = require('cors');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 8080;

app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

// In-memory logs of signals (limit to 100)
let signalsLog = [];
// Connected clients for real-time events (SSE)
let clients = [];

// Helper to keep logs capped at 100 entries
const addSignalToLog = (signal) => {
  signalsLog.unshift(signal); // Add to beginning
  if (signalsLog.length > 100) {
    signalsLog.pop();
  }
};

// Expose Server-Sent Events (SSE) stream for real-time dashboard updates
app.get('/events', (req, res) => {
  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');
  res.flushHeaders();

  // Send initial history
  res.write(`data: ${JSON.stringify({ type: 'history', data: signalsLog })}\n\n`);

  const clientId = Date.now();
  const newClient = { id: clientId, res };
  clients.push(newClient);

  req.on('close', () => {
    clients = clients.filter(client => client.id !== clientId);
  });
});

// Broadcast a message to all connected browsers
const broadcastSignal = (signal) => {
  clients.forEach(client => {
    client.res.write(`data: ${JSON.stringify({ type: 'signal', data: signal })}\n\n`);
  });
};

// Webhook endpoint to receive alerts from TradingView
app.post('/webhook', (req, res) => {
  try {
    const { symbol, timeframe, direction, score, rules, smt, price, image } = req.body;

    if (!symbol || !direction) {
      return res.status(400).json({ error: 'Missing symbol or direction' });
    }

    const newSignal = {
      id: Date.now() + Math.random().toString(36).substr(2, 5),
      symbol: symbol.toUpperCase(),
      timeframe: timeframe || 'N/A',
      direction: direction.toUpperCase(), // BUY / SELL / NEUTRAL
      score: parseFloat(score) || 0,
      rules: rules || 'N/A',
      smt: smt || 'None',
      price: parseFloat(price) || 0,
      image: image || '',
      timestamp: new Date().toISOString()
    };

    addSignalToLog(newSignal);
    broadcastSignal(newSignal);

    console.log(`[Webhook Received] ${newSignal.symbol} (${newSignal.timeframe}) - ${newSignal.direction} with score ${newSignal.score}/10 at $${newSignal.price}`);
    res.status(200).json({ status: 'success', data: newSignal });
  } catch (err) {
    console.error('Error processing webhook:', err);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

// Start Server
app.listen(PORT, '0.0.0.0', () => {
  console.log(`===================================================`);
  console.log(`🚀 Trading Signal Center running at:`);
  console.log(`   Local URL:   http://localhost:${PORT}`);
  console.log(`   Webhook URL: http://<your-ip-or-ngrok>:${PORT}/webhook`);
  console.log(`===================================================`);
});
