const SYMBOLS = [
  'XAUUSD', 'BTCUSDT', 'NAS100', 'USDJPY', 'GBPJPY',
  'EURUSD', 'GBPUSD', 'AUDUSD', 'USDCAD', 'NZDUSD',
  'US30', 'XAGUSD'
];

// Active state of symbols in memory
const symbolStates = {};
SYMBOLS.forEach(sym => {
  symbolStates[sym] = {
    symbol: sym,
    timeframe: '-',
    direction: 'NEUTRAL',
    score: 0,
    rules: '-',
    smt: 'None',
    price: 0,
    timestamp: null
  };
});

// UI Elements
const pairsContainer = document.getElementById('pairs-container');
const logsBody = document.getElementById('logs-body');
const connectionStatus = document.getElementById('connection-status');
const filterStrongCheckbox = document.getElementById('filter-strong');
const btnSound = document.getElementById('btn-sound');
const btnSimulate = document.getElementById('btn-simulate');
const btnClearLogs = document.getElementById('btn-clear-logs');
// Alert state
let soundEnabled = true;
const alertSound = document.getElementById('alert-sound');
const strongAlertSound = document.getElementById('strong-alert-sound');

// Initialize Symbol Cards
function initCards() {
  pairsContainer.innerHTML = '';
  SYMBOLS.forEach(sym => {
    const card = document.createElement('div');
    card.className = 'glass-panel pair-card';
    card.id = `card-${sym}`;
    card.innerHTML = `
      <div class="pair-card-header">
        <span class="pair-name">${sym}</span>
        <span class="signal-status neutral" id="status-${sym}">NEUTRAL</span>
      </div>
      <div class="pair-card-body">
        <div class="confluence-box">
          <span class="confluence-score" id="score-${sym}">0/10</span>
          <span class="confluence-label">CONFLUENCE</span>
        </div>
        <span class="tf-badge" id="tf-${sym}">-</span>
      </div>
      <div class="pair-card-footer">
        <div class="info-row">
          <span class="info-label">Price:</span>
          <span id="price-${sym}">$0.00</span>
        </div>
        <div class="info-row">
          <span class="info-label">Active Rules:</span>
          <span class="rules-list" id="rules-${sym}">-</span>
        </div>
        <div class="info-row">
          <span class="info-label">SMT Check:</span>
          <span class="smt-badge pending" id="smt-${sym}">None</span>
        </div>
      </div>
    `;
    pairsContainer.appendChild(card);
  });
}

// Request Browser Notifications Permission
if ('Notification' in window && Notification.permission === 'default') {
  Notification.requestPermission();
}

// Update Card visually
function updateCard(signal) {
  const { symbol, timeframe, direction, score, rules, smt, price } = signal;
  const isStrong = score >= 7;

  // If filter is checked and signal is not strong, do not update card to maintain active signals only
  if (filterStrongCheckbox.checked && !isStrong && direction !== 'NEUTRAL') {
    return;
  }

  const card = document.getElementById(`card-${symbol}`);
  const statusEl = document.getElementById(`status-${symbol}`);
  const scoreEl = document.getElementById(`score-${symbol}`);
  const tfEl = document.getElementById(`tf-${symbol}`);
  const priceEl = document.getElementById(`price-${symbol}`);
  const rulesEl = document.getElementById(`rules-${symbol}`);
  const smtEl = document.getElementById(`smt-${symbol}`);

  if (!card) return;

  // Update memory state
  symbolStates[symbol] = signal;

  // Apply colors and texts
  statusEl.textContent = direction;
  statusEl.className = `signal-status ${direction.toLowerCase()}`;

  scoreEl.textContent = `${score}/10`;
  if (isStrong) {
    scoreEl.classList.add('strong');
  } else {
    scoreEl.classList.remove('strong');
  }

  tfEl.textContent = timeframe;
  priceEl.textContent = symbol.includes('JPY') ? `¥${price.toFixed(2)}` : `$${price.toFixed(2)}`;
  rulesEl.textContent = rules;

  // SMT Check formatting
  smtEl.textContent = smt;
  if (smt.includes('Valid')) {
    smtEl.className = 'smt-badge valid';
  } else if (smt.includes('Pending')) {
    smtEl.className = 'smt-badge pending';
  } else {
    smtEl.className = 'smt-badge';
  }

  // Animation pulses
  card.classList.remove('card-new-buy', 'card-new-sell');
  // Trigger reflow to restart animation
  void card.offsetWidth;

  if (direction === 'BUY') {
    card.classList.add('card-new-buy');
  } else if (direction === 'SELL') {
    card.classList.add('card-new-sell');
  }
}

// Play notification sound
function playSound(signal) {
  if (!soundEnabled) return;

  const isGoldSMT = signal.symbol === 'XAUUSD' && signal.smt.includes('Valid');
  const isExtreme = signal.score >= 9;

  if (isGoldSMT || isExtreme) {
    strongAlertSound.currentTime = 0;
    strongAlertSound.play().catch(e => console.log('Audio playback error:', e));
  } else {
    alertSound.currentTime = 0;
    alertSound.play().catch(e => console.log('Audio playback error:', e));
  }
}

// Add row to Log Table
function addLogToTable(signal) {
  const isStrong = signal.score >= 7;

  // Filter check
  if (filterStrongCheckbox.checked && !isStrong) {
    return;
  }

  // Remove placeholder
  const placeholder = logsBody.querySelector('.placeholder-row');
  if (placeholder) {
    placeholder.remove();
  }

  const timeStr = new Date(signal.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });
  const row = document.createElement('tr');
  const scoreClass = isStrong ? 'strong' : '';
  const dirClass = signal.direction === 'BUY' ? 'td-buy' : (signal.direction === 'SELL' ? 'td-sell' : 'td-neutral');

  const priceText = signal.symbol.includes('JPY') ? `¥${signal.price.toFixed(2)}` : `$${signal.price.toFixed(2)}`;

  const imageBtn = (signal.image && signal.image.startsWith('http')) 
    ? `<td><button class="btn-view-chart" onclick="showChartModal('${signal.id}')">📸 View</button></td>` 
    : `<td>-</td>`;

  row.innerHTML = `
    <td>${timeStr}</td>
    <td><strong>${signal.symbol}</strong></td>
    <td><span class="tf-badge">${signal.timeframe}</span></td>
    <td>${priceText}</td>
    <td class="${scoreClass}"><strong>${signal.score}/10</strong></td>
    <td class="${dirClass}">${signal.direction}</td>
    <td><code class="rules-list">${signal.rules}</code></td>
    <td><span class="smt-badge ${signal.smt.includes('Valid') ? 'valid' : 'pending'}">${signal.smt}</span></td>
    ${imageBtn}
  `;

  logsBody.insertBefore(row, logsBody.firstChild);

  // Cap table rows to 50
  if (logsBody.children.length > 50) {
    logsBody.lastChild.remove();
  }
}

// Push system notification to user
function pushDesktopNotification(signal) {
  if (Notification.permission === 'granted') {
    const title = `${signal.direction === 'BUY' ? '🔥' : '🚨'} Confluence Signal: ${signal.symbol} (${signal.timeframe})`;
    const options = {
      body: `Price: ${signal.price} | Score: ${signal.score}/10\nRules: ${signal.rules}\nSMT: ${signal.smt}`,
      icon: '/favicon.ico'
    };
    new Notification(title, options);
  }
}

// Connect to Server SSE Stream
function connectSSE() {
  const eventSource = new EventSource('/events');

  eventSource.onopen = () => {
    connectionStatus.className = 'status-indicator connected';
    console.log('Real-time feed connected.');
  };

  eventSource.onerror = (err) => {
    connectionStatus.className = 'status-indicator disconnected';
    console.error('Real-time feed disconnected. Reconnecting...', err);
  };

  eventSource.onmessage = (event) => {
    const message = JSON.parse(event.data);

    if (message.type === 'history') {
      // Clear logs first
      logsBody.innerHTML = '';
      if (message.data.length === 0) {
        logsBody.innerHTML = `<tr class="placeholder-row"><td colspan="9">No history yet. Waiting for signals...</td></tr>`;
      } else {
        // Render in chronological order (oldest first so prepending aligns latest on top)
        const sorted = [...message.data].reverse();
        sorted.forEach(signal => {
          signalsMap[signal.id] = signal;
          updateCard(signal);
          addLogToTable(signal);
        });
      }
    } else if (message.type === 'signal') {
      const signal = message.data;
      signalsMap[signal.id] = signal;
      updateCard(signal);
      addLogToTable(signal);
      
      // Notify only on signals matching threshold filter
      if (signal.score >= (filterStrongCheckbox.checked ? 7 : 1)) {
        playSound(signal);
        pushDesktopNotification(signal);
      }
    }
  };
}

// State maps
const signalsMap = {};

// Symbol Average Daily Range values (ADR in price points)
const SYMBOL_ADR = {
  'XAUUSD': 25.0,
  'BTCUSDT': 2000.0,
  'NAS100': 220.0,
  'USDJPY': 1.20,
  'GBPJPY': 1.60,
  'EURUSD': 0.0080,
  'GBPUSD': 0.0100,
  'AUDUSD': 0.0070,
  'USDCAD': 0.0075,
  'NZDUSD': 0.0065,
  'US30': 350.0,
  'XAGUSD': 0.60
};

// Strategy descriptions and metadata
const STRATEGY_DETAILS = {
  'S1': {
    name: 'BBMA Reentry Complete',
    desc: 'Bollinger Bands + Moving Average trend alignment. Price retraces to touch the 5/10 EMA high/low boundaries inside the outer Bollinger Band, indicating a high-probability continuation reentry point.',
    diagramClass: 'bbma-diag'
  },
  'S2': {
    name: 'Candle Range Theory (CRT)',
    desc: 'Mother candle high/low range sweeps. Price breaks the initial candle range and closes back inside, indicating a fakeout/reversal.',
    diagramClass: 'generic-diag'
  },
  'S3': {
    name: 'CISD (Change in State of Delivery)',
    desc: 'Order flow delivery reversal. The closing of a candle violates the previous opposing candle, shifting delivery state from buy to sell or vice-versa.',
    diagramClass: 'generic-diag'
  },
  'S4': {
    name: 'Previous Candle Liquidity Sweep',
    desc: 'The current candle sweeps the high or low wick of the previous candle to collect stops before reversing in the intended direction.',
    diagramClass: 'generic-diag'
  },
  'S5': {
    name: 'ICT Wave Reversal (iFVG / OB)',
    desc: 'Fair Value Gap inversion. Price closes past a key Fair Value Gap or respects a newly created Order Block, shifting localized momentum.',
    diagramClass: 'fvg-diag'
  },
  'S6': {
    name: '3-Candle Swing wick Sweep',
    desc: 'Swing High or Swing Low manipulation. A candle sweeps the high/low of a valid 3-candle swing point before reversing.',
    diagramClass: 'generic-diag'
  },
  'S7': {
    name: 'CBDR Range Consolidation',
    desc: 'Asian session consolidation boundaries. Checks if liquidity is swept outside the Central Bank Dealers Range boundaries.',
    diagramClass: 'generic-diag'
  },
  'S8': {
    name: 'Flips / SZO (Support Zone Obstruction)',
    desc: 'Support becomes Resistance flip (or vice-versa). Marks key zone retests where structural pivot flips occur.',
    diagramClass: 'generic-diag'
  },
  'S9': {
    name: 'Order Block Mitigation',
    desc: 'Institutional buy/sell zone retest. Price returns to mitigate (test) a valid Order Block where heavy buy/sell orders were filled.',
    diagramClass: 'ob-diag'
  },
  'S10': {
    name: 'Premium / Discount Zone Retest',
    desc: 'Fibonacci Equilibrium check. Ensures BUY signals are triggered in the Discount Zone (below 0.5 Fib) and SELL signals in the Premium Zone.',
    diagramClass: 'generic-diag'
  }
};

// Modal elements
const imageModal = document.getElementById('image-modal');
const modalImg = document.getElementById('modal-img');
const closeModal = document.querySelector('.close-modal');

const chartContent = document.getElementById('chart-content');
const pnlContent = document.getElementById('pnl-content');
const btnTabChart = document.getElementById('btn-tab-chart');
const btnTabPnl = document.getElementById('btn-tab-pnl');

const analysisTitle = document.getElementById('analysis-title');
const analysisTimeframe = document.getElementById('analysis-timeframe');
const analysisPrice = document.getElementById('analysis-price');
const analysisScore = document.getElementById('analysis-score');
const analysisSmt = document.getElementById('analysis-smt');
const analysisRulesCards = document.getElementById('analysis-rules-cards');

// Tab switching inside modal
window.switchLeftTab = function(tabName) {
  if (tabName === 'chart') {
    chartContent.style.display = 'flex';
    pnlContent.style.display = 'none';
    btnTabChart.classList.add('active');
    btnTabPnl.classList.remove('active');
  } else {
    chartContent.style.display = 'none';
    pnlContent.style.display = 'flex';
    btnTabChart.classList.remove('active');
    btnTabPnl.classList.add('active');
  }
};

// Show details and PnL in modal
window.showChartModal = function(signalId) {
  const signal = signalsMap[signalId];
  if (!signal) return;

  // Set default view to chart tab
  switchLeftTab('chart');

  // Fill text details
  analysisTitle.textContent = `${signal.symbol} ${signal.direction}`;
  analysisTitle.className = signal.direction === 'BUY' ? 'analysis-header-info buy-title' : 'analysis-header-info sell-title';
  analysisTimeframe.textContent = signal.timeframe;
  analysisPrice.textContent = signal.symbol.includes('JPY') ? `¥${signal.price.toFixed(2)}` : `$${signal.price.toFixed(2)}`;
  analysisScore.textContent = `${signal.score}/10`;
  
  if (signal.score >= 7) {
    analysisScore.className = 'stat-val strong';
  } else {
    analysisScore.className = 'stat-val';
  }
  
  analysisSmt.textContent = signal.smt;

  // Set Image
  modalImg.src = signal.image || 'https://images.unsplash.com/photo-1611974789855-9c2a0a7236a3?w=800';

  // Calculate SL/TP levels based on ADR and 1:2 / 1:3 reward-risk ratios
  const baseADR = SYMBOL_ADR[signal.symbol] || (signal.symbol.includes('JPY') ? 1.20 : 0.0100);
  let tfMultiplier = 0.15; // default 15m
  if (signal.timeframe === '5m') tfMultiplier = 0.10;
  else if (signal.timeframe === '15m') tfMultiplier = 0.15;
  else if (signal.timeframe === '30m') tfMultiplier = 0.20;
  else if (signal.timeframe === '1h') tfMultiplier = 0.25;
  else if (signal.timeframe === '4h') tfMultiplier = 0.40;
  else if (signal.timeframe === '1D') tfMultiplier = 0.60;

  const adrOffset = baseADR * tfMultiplier;
  const isBuy = signal.direction === 'BUY';

  const entry = signal.price;
  const sl = isBuy ? (entry - adrOffset) : (entry + adrOffset);
  const tp1 = isBuy ? (entry + adrOffset * 2) : (entry - adrOffset * 2);
  const tp2 = isBuy ? (entry + adrOffset * 3) : (entry - adrOffset * 3);

  const formatVal = (val) => signal.symbol.includes('JPY') ? `¥${val.toFixed(2)}` : `$${val.toFixed(2)}`;

  // Render PnL Widget
  pnlContent.innerHTML = `
    <div class="pnl-widget-container">
      <div class="pnl-header">${signal.symbol} - ${signal.direction} (ADR Stop Setup)</div>
      <div class="pnl-bars">
        <!-- Target Profit Zone (Green) -->
        <div class="pnl-zone target" style="flex: 3;">
          <div class="pnl-label-row tp2">
            <span>TP2 (1:3 RR)</span>
            <span>${formatVal(tp2)}</span>
          </div>
          <div class="pnl-label-row tp1">
            <span>TP1 (1:2 RR)</span>
            <span>${formatVal(tp1)}</span>
          </div>
        </div>
        
        <!-- Entry Price Line -->
        <div class="pnl-entry-bar" style="top: 75%;"></div>
        <div class="pnl-entry-label" style="top: 75%;">${formatVal(entry)}</div>
        
        <!-- Stop Loss Zone (Red) -->
        <div class="pnl-zone stop" style="flex: 1;">
          <div class="pnl-label-row sl" style="margin-top: auto;">
            <span>SL (ADR Stop)</span>
            <span>${formatVal(sl)}</span>
          </div>
        </div>
      </div>
    </div>
  `;

  // Render Triggered Strategy explanation cards
  analysisRulesCards.innerHTML = '';
  if (signal.rules && signal.rules !== '-') {
    const activeRules = signal.rules.split(',').map(r => r.trim());
    activeRules.forEach(ruleKey => {
      const details = STRATEGY_DETAILS[ruleKey];
      if (details) {
        const card = document.createElement('div');
        card.className = 'rule-explain-card';
        card.innerHTML = `
          <div class="rule-card-header">
            <span class="rule-card-title">${ruleKey}: ${details.name}</span>
            <span class="badge-premium" style="color: #60a5fa; border-color: rgba(96, 165, 250, 0.3); font-size: 8px;">ACTIVE</span>
          </div>
          <div class="rule-card-desc">${details.desc}</div>
          <div class="diag-container ${details.diagramClass}">
            ${details.diagramClass === 'generic-diag' ? '' : `
              <div class="fvg-block"></div>
              <div class="ob-block"></div>
              <div class="ma-line"></div>
              <div class="bb-band upper"></div>
              <div class="bb-band lower"></div>
              <div class="diag-candle c1"></div>
              <div class="diag-candle c2"></div>
              <div class="diag-candle c3"></div>
            `}
          </div>
        `;
        analysisRulesCards.appendChild(card);
      }
    });
  } else {
    analysisRulesCards.innerHTML = '<div style="color: var(--text-secondary); font-size: 13px;">No specific strategy rules triggered.</div>';
  }

  imageModal.classList.add('active');
};

// Close modal handlers
closeModal.addEventListener('click', () => {
  imageModal.classList.remove('active');
});

imageModal.addEventListener('click', (e) => {
  if (e.target === imageModal) {
    imageModal.classList.remove('active');
  }
});

// Sound button toggle
btnSound.addEventListener('click', () => {
  soundEnabled = !soundEnabled;
  if (soundEnabled) {
    btnSound.innerHTML = '<span class="icon">🔊</span> Sound On';
    btnSound.className = 'btn-secondary';
  } else {
    btnSound.innerHTML = '<span class="icon">🔇</span> Mute';
    btnSound.className = 'btn-secondary muted';
  }
});

// Simulate webhook helper
btnSimulate.addEventListener('click', async () => {
  const randomSymbol = SYMBOLS[Math.floor(Math.random() * (SYMBOLS.length - 1))]; // Exclude Silver
  const timeframes = ['5m', '15m', '30m', '1h', '4h', '1D'];
  const directions = ['BUY', 'SELL'];
  const rulesList = ['S1', 'S2', 'S3', 'S4', 'S5', 'S6', 'S7', 'S8', 'S9', 'S10'];

  const score = Math.floor(Math.random() * 5) + 6; // Confluence between 6 and 10
  const count = score;
  
  // Pick random subset of rules
  const shuffled = rulesList.sort(() => 0.5 - Math.random());
  const selectedRules = shuffled.slice(0, count).join(',');

  const direction = directions[Math.floor(Math.random() * directions.length)];
  const timeframe = randomSymbol === 'XAUUSD' ? '5m' : timeframes[Math.floor(Math.random() * (timeframes.length - 1) + 1)]; // Gold on 5m, others 15m+

  let smt = 'None';
  if (randomSymbol === 'XAUUSD') {
    smt = Math.random() > 0.4 ? '⚡ Valid SMT' : '⚠️ Pending SMT';
  }

  let price = 0;
  if (randomSymbol === 'XAUUSD') price = 2300 + Math.random() * 80;
  else if (randomSymbol === 'BTCUSDT') price = 57000 + Math.random() * 3000;
  else if (randomSymbol === 'NAS100') price = 18000 + Math.random() * 400;
  else if (randomSymbol.includes('JPY')) price = 150 + Math.random() * 10;
  else price = 1 + Math.random() * 0.5;

  // Real chart screenshots from Unsplash to look very premium
  const chartImages = [
    'https://images.unsplash.com/photo-1611974789855-9c2a0a7236a3?w=800',
    'https://images.unsplash.com/photo-1590283603385-17ffb3a7f29f?w=800',
    'https://images.unsplash.com/photo-1642390091310-1fe98e722513?w=800',
    'https://images.unsplash.com/photo-1624996379697-f01d168b1a52?w=800'
  ];
  const mockImage = chartImages[Math.floor(Math.random() * chartImages.length)];

  const mockPayload = {
    symbol: randomSymbol,
    timeframe: timeframe,
    direction: direction,
    score: score,
    rules: selectedRules,
    smt: smt,
    price: price,
    image: mockImage
  };

  try {
    await fetch('/webhook', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(mockPayload)
    });
  } catch (err) {
    console.error('Failed to send simulated signal:', err);
  }
});

// Clear Logs click
btnClearLogs.addEventListener('click', () => {
  logsBody.innerHTML = `<tr class="placeholder-row"><td colspan="9">Logs cleared. Waiting for new signals...</td></tr>`;
});

// Run Init
initCards();
connectSSE();
