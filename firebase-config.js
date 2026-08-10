// Firebase web configuration is public by design.
// Security comes from Firebase Authentication and authorized-domain rules.
export const firebaseConfig = {
  apiKey: "AIzaSyDfw1miJ05BbXyQVDR8QSFMDSjnkRqIlkM",
  authDomain: "robindahood-trading-dashboard.firebaseapp.com",
  projectId: "robindahood-trading-dashboard",
  storageBucket: "robindahood-trading-dashboard.firebasestorage.app",
  messagingSenderId: "951077250993",
  appId: "1:951077250993:web:0d473d4c019261486cff90",
  measurementId: "G-2ZHZJSW859"
};

// Only these signed-in emails may access the dashboard.
export const allowedEmails = [
  "bilalsmirza123@gmail.com"
];

// Transparent research/audit interface injected into the static dashboard.
// It records only sources and explanations actually supplied to the page.
const RESEARCH_KEY = "robindahoodResearchAuditV1";
const esc = value => String(value ?? "").replace(/[&<>\"']/g, c => ({"&":"&amp;","<":"&lt;",">":"&gt;","\"":"&quot;","'":"&#39;"}[c]));
const loadResearch = () => {
  try { return JSON.parse(localStorage.getItem(RESEARCH_KEY) || "[]"); }
  catch { return []; }
};
const saveResearch = data => localStorage.setItem(RESEARCH_KEY, JSON.stringify(data));

function installResearchStream() {
  const tabs = document.querySelector(".tabs");
  const main = document.querySelector("main.wrap");
  if (!tabs || !main || document.getElementById("researchView")) return;

  const style = document.createElement("style");
  style.textContent = `
    .research-grid{display:grid;grid-template-columns:2fr 1fr;gap:15px}
    .research-feed{display:grid;gap:11px;max-height:720px;overflow:auto}
    .research-event{background:#0d1529;border:1px solid #263353;border-radius:12px;padding:12px}
    .research-event a{color:#8ab4ff;word-break:break-all}
    .research-tag{display:inline-block;padding:4px 7px;border:1px solid #263353;border-radius:999px;font-size:12px;color:#9ba9c7;margin:5px 5px 5px 0}
    .research-forms{display:grid;grid-template-columns:1fr 1fr;gap:10px}
    .research-forms textarea{min-height:82px;resize:vertical}
    .audit-note{padding:10px;border-left:3px solid #ffd166;background:#ffd16612;border-radius:8px;margin-bottom:12px}
    @media(max-width:1000px){.research-grid{grid-template-columns:1fr}}
    @media(max-width:650px){.research-forms{grid-template-columns:1fr}}
  `;
  document.head.appendChild(style);

  const tab = document.createElement("button");
  tab.className = "tab";
  tab.dataset.view = "researchView";
  tab.textContent = "Research Stream";
  tabs.appendChild(tab);

  const section = document.createElement("section");
  section.id = "researchView";
  section.className = "view";
  section.innerHTML = `
    <div class="grid metrics">
      <div class="card metric"><small>Sources Logged</small><b id="auditSourceCount">0</b></div>
      <div class="card metric"><small>High Confidence</small><b id="auditHighConfidence">0</b></div>
      <div class="card metric"><small>Trade-Relevant</small><b id="auditTradeRelevant">0</b></div>
      <div class="card metric"><small>Last Source</small><b id="auditLastSource" style="font-size:16px">—</b></div>
    </div>
    <div class="research-grid">
      <section class="card">
        <div class="row between">
          <h2 style="margin:0">Everything the Agent Read</h2>
          <div class="row"><button id="auditExport">Export Audit</button><button id="auditClear" class="danger">Clear</button></div>
        </div>
        <div class="audit-note" style="margin-top:12px">This is an auditable source-and-decision record. It shows URLs, extracted facts, confidence, and decision impact. It does not display private hidden chain-of-thought.</div>
        <div id="auditFeed" class="research-feed"></div>
        <div id="auditEmpty" class="empty">No verified sources have been logged.</div>
      </section>
      <aside class="card">
        <h2 style="margin-top:0">Log a Source</h2>
        <p class="muted">A future secure backend can write to this feed automatically. Until then, only sources actually entered here are shown.</p>
        <label>Source title<input id="auditTitle" placeholder="Company earnings release"></label>
        <label>Link<input id="auditUrl" type="url" placeholder="https://..."></label>
        <div class="research-forms">
          <label>Publisher<input id="auditPublisher" placeholder="SEC, company, Reuters"></label>
          <label>Ticker<input id="auditTicker" placeholder="NVDA"></label>
          <label>Confidence<select id="auditConfidence"><option>High</option><option selected>Medium</option><option>Low</option></select></label>
          <label>Decision impact<select id="auditImpact"><option>Supports Buy</option><option>Supports Hold</option><option>Supports Trim</option><option>Supports Sell</option><option selected>No Trade</option></select></label>
        </div>
        <label>Facts extracted<textarea id="auditFacts" placeholder="One factual claim per line"></textarea></label>
        <label>Analysis summary<textarea id="auditAnalysis" placeholder="What matters, opposing evidence, risks, and what changed"></textarea></label>
        <button id="auditAdd" class="primary" style="margin-top:12px">Add Verified Source</button>
      </aside>
    </div>`;
  main.appendChild(section);

  tab.addEventListener("click", () => {
    document.querySelectorAll(".tab").forEach(x => x.classList.toggle("active", x === tab));
    document.querySelectorAll(".view").forEach(x => x.classList.toggle("active", x === section));
    renderResearch();
  });

  document.getElementById("auditAdd").addEventListener("click", () => {
    const title = document.getElementById("auditTitle").value.trim();
    const url = document.getElementById("auditUrl").value.trim();
    if (!title || !url) return alert("A source title and link are required.");
    try { new URL(url); } catch { return alert("Enter a valid link beginning with https:// or http://"); }
    const item = {
      id: "SRC-" + Date.now(),
      timestamp: new Date().toISOString(),
      displayTime: new Date().toLocaleString(),
      title,
      url,
      publisher: document.getElementById("auditPublisher").value.trim(),
      ticker: document.getElementById("auditTicker").value.trim().toUpperCase(),
      confidence: document.getElementById("auditConfidence").value,
      impact: document.getElementById("auditImpact").value,
      facts: document.getElementById("auditFacts").value.split("\n").map(x => x.trim()).filter(Boolean),
      analysis: document.getElementById("auditAnalysis").value.trim()
    };
    const data = loadResearch();
    data.unshift(item);
    saveResearch(data.slice(0, 500));
    ["auditTitle","auditUrl","auditPublisher","auditTicker","auditFacts","auditAnalysis"].forEach(id => document.getElementById(id).value = "");
    if (typeof window.log === "function") window.log("research", "Source logged", `${item.title}: ${item.impact}.`, item.confidence === "Low" ? "warning" : "info");
    renderResearch();
  });

  document.getElementById("auditClear").addEventListener("click", () => {
    if (confirm("Clear the entire research audit?")) { saveResearch([]); renderResearch(); }
  });

  document.getElementById("auditExport").addEventListener("click", () => {
    const payload = { exportedAt: new Date().toISOString(), sources: loadResearch() };
    const blob = new Blob([JSON.stringify(payload, null, 2)], {type:"application/json"});
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = "robindahood-research-audit.json";
    a.click();
    URL.revokeObjectURL(a.href);
  });

  renderResearch();
}

function renderResearch() {
  const feed = document.getElementById("auditFeed");
  if (!feed) return;
  const data = loadResearch();
  document.getElementById("auditSourceCount").textContent = data.length;
  document.getElementById("auditHighConfidence").textContent = data.filter(x => x.confidence === "High").length;
  document.getElementById("auditTradeRelevant").textContent = data.filter(x => x.impact !== "No Trade").length;
  document.getElementById("auditLastSource").textContent = data[0]?.displayTime || "—";
  feed.innerHTML = data.map(x => `
    <article class="research-event" id="${esc(x.id)}">
      <div class="row between"><b style="font-size:16px">${esc(x.title)}</b><span class="muted">${esc(x.displayTime)}</span></div>
      <div><span class="research-tag">${esc(x.publisher || "Publisher unspecified")}</span>${x.ticker ? `<span class="research-tag">${esc(x.ticker)}</span>` : ""}<span class="research-tag">${esc(x.confidence)} confidence</span><span class="research-tag">${esc(x.impact)}</span></div>
      <a href="${esc(x.url)}" target="_blank" rel="noopener noreferrer">${esc(x.url)}</a>
      <h4>Facts extracted</h4>${x.facts?.length ? `<ul>${x.facts.map(f => `<li>${esc(f)}</li>`).join("")}</ul>` : `<div class="muted">No factual claims recorded.</div>`}
      <h4>Agent analysis summary</h4><div>${esc(x.analysis || "No analysis summary recorded.")}</div>
    </article>`).join("");
  document.getElementById("auditEmpty").style.display = data.length ? "none" : "block";
}

if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", installResearchStream);
else installResearchStream();

// Paper-order synchronization bridge.
// ChatGPT can queue paper orders in paper-orders.json through the connected GitHub repo.
// The signed-in dashboard applies each order once to the same localStorage portfolio state used by index.html.
const PAPER_STATE_KEY = "robindahoodMeaningfulV2";
const PAPER_APPLIED_KEY = "robindahoodAppliedPaperOrdersV1";
let paperSyncInFlight = false;

const loadPaperState = () => {
  try { return JSON.parse(localStorage.getItem(PAPER_STATE_KEY) || "null"); }
  catch { return null; }
};
const loadAppliedPaperOrders = () => {
  try { return new Set(JSON.parse(localStorage.getItem(PAPER_APPLIED_KEY) || "[]")); }
  catch { return new Set(); }
};
const saveAppliedPaperOrders = set => localStorage.setItem(PAPER_APPLIED_KEY, JSON.stringify([...set].slice(-500)));
const paperMoney = n => new Intl.NumberFormat("en-US", {style:"currency",currency:"USD"}).format(Number(n)||0);
const normalizePaperUrl = value => String(value || "").trim().replace(/\/+$/, "");

function paperCashFromState(state) {
  const openCost = (state.paper || []).reduce((sum, p) => sum + (Number(p.qty)||0) * (Number(p.cost)||0), 0);
  return Math.max(0, (Number(state.paperStart)||0) - openCost + (Number(state.paperRealized)||0));
}

async function getPaperFillPrice(state, order) {
  const base = normalizePaperUrl(state.marketDataUrl);
  if (base) {
    try {
      const response = await fetch(`${base}/quotes?symbols=${encodeURIComponent(order.ticker)}`, {cache:"no-store"});
      const data = await response.json();
      const quote = Array.isArray(data.quotes) ? data.quotes.find(q => q.symbol === order.ticker) : null;
      const marketPrice = Number(quote?.askPrice || quote?.midpoint || quote?.bidPrice);
      if (response.ok && Number.isFinite(marketPrice) && marketPrice > 0) {
        const bps = Number(order.slippageBps ?? 5);
        return Number((marketPrice * (1 + bps / 10000)).toFixed(4));
      }
    } catch {}
  }
  const fallback = Number(order.fallbackPrice);
  return Number.isFinite(fallback) && fallback > 0 ? fallback : null;
}

function appendPaperEvent(state, type, title, reason, data={}) {
  state.events = Array.isArray(state.events) ? state.events : [];
  state.events.unshift({time:new Date().toLocaleString(),ts:Date.now(),type,title,reason,...data});
  state.events = state.events.slice(0,250);
}

async function applyPaperOrder(state, order) {
  const side = String(order.side || "").toUpperCase();
  const ticker = String(order.ticker || "").trim().toUpperCase();
  if (!ticker || !["BUY","ADD","SELL","TRIM"].includes(side)) throw new Error("Invalid paper order");

  state.paper = Array.isArray(state.paper) ? state.paper : [];
  state.closedTrades = Array.isArray(state.closedTrades) ? state.closedTrades : [];
  state.paperRealized = Number(state.paperRealized)||0;
  state.paperEngine = state.paperEngine || {enabled:false,startedAt:null,tradesToday:0,lastTradeDate:null};

  if (side === "BUY" || side === "ADD") {
    const fillPrice = await getPaperFillPrice(state, {...order,ticker});
    if (!fillPrice) throw new Error(`No valid fill price for ${ticker}`);
    const availableCash = paperCashFromState(state);
    const requestedDollars = order.useRemainingCash ? availableCash : Number(order.dollars);
    const dollars = Math.min(availableCash, Number(requestedDollars));
    if (!Number.isFinite(dollars) || dollars < 0.01) return false;
    const qty = Number((dollars / fillPrice).toFixed(6));
    if (!(qty > 0)) return false;
    const actualCost = qty * fillPrice;
    const existing = state.paper.find(p => String(p.ticker).toUpperCase() === ticker);
    if (existing) {
      const oldQty = Number(existing.qty)||0;
      const oldCost = Number(existing.cost)||0;
      const newQty = oldQty + qty;
      existing.cost = ((oldQty * oldCost) + actualCost) / newQty;
      existing.qty = newQty;
      existing.price = fillPrice;
      existing.marketTimestamp = new Date().toISOString();
      existing.marketSource = "Queued paper order";
    } else {
      state.paper.push({
        ticker, qty, cost:fillPrice, price:fillPrice,
        openedAt:new Date().toISOString(), thesis:order.reason || "Queued paper trade",
        play:order.reason || "Queued paper trade", catalyst:"", risk:"",
        exitPlan:"Review using portfolio risk rules.", status:"HOLD",
        marketSource:"Queued paper order", marketTimestamp:new Date().toISOString()
      });
    }
    state.paperEngine.tradesToday = (Number(state.paperEngine.tradesToday)||0) + 1;
    appendPaperEvent(state,"fill",`Paper ${side} filled: ${ticker}`,
      `${order.reason || "Queued paper trade"} Filled ${qty} share(s) at ${paperMoney(fillPrice)} for ${paperMoney(actualCost)}.`,
      {ticker,side,qty,price:fillPrice,orderId:order.id});
    return true;
  }

  const posIndex = state.paper.findIndex(p => String(p.ticker).toUpperCase() === ticker);
  if (posIndex < 0) throw new Error(`No open ${ticker} paper position`);
  const pos = state.paper[posIndex];
  const heldQty = Number(pos.qty)||0;
  const requestedQty = side === "SELL" && order.all ? heldQty : Number(order.qty);
  const qty = Math.min(heldQty, requestedQty);
  if (!(qty > 0)) throw new Error(`Invalid sell quantity for ${ticker}`);
  const fillPrice = await getPaperFillPrice(state, {...order,ticker}) || Number(pos.price)||Number(pos.cost);
  const realized = (fillPrice - Number(pos.cost)) * qty;
  state.paperRealized += realized;
  const remaining = heldQty - qty;
  state.closedTrades.unshift({...pos,qty,closedAt:new Date().toISOString(),exitPrice:fillPrice,realizedPnL:realized,saleReason:order.reason || `Queued paper ${side}.`});
  if (remaining <= 0.0000005) state.paper.splice(posIndex,1);
  else { pos.qty = remaining; pos.price = fillPrice; }
  state.paperEngine.tradesToday = (Number(state.paperEngine.tradesToday)||0) + 1;
  appendPaperEvent(state,"exit",`Paper ${side} filled: ${ticker}`,
    `${order.reason || `Queued paper ${side}.`} Sold ${qty} share(s) at ${paperMoney(fillPrice)}. Realized result: ${paperMoney(realized)}.`,
    {ticker,side,qty,price:fillPrice,orderId:order.id});
  return true;
}

async function syncPaperOrders() {
  if (paperSyncInFlight) return;
  const state = loadPaperState();
  if (!state) return;
  paperSyncInFlight = true;
  try {
    const response = await fetch(`./paper-orders.json?ts=${Date.now()}`, {cache:"no-store"});
    if (!response.ok) return;
    const queue = await response.json();
    const orders = Array.isArray(queue.orders) ? queue.orders : [];
    const applied = loadAppliedPaperOrders();
    let changed = false;
    for (const order of orders) {
      if (!order?.id || applied.has(order.id)) continue;
      try {
        const didApply = await applyPaperOrder(state, order);
        if (didApply) changed = true;
        applied.add(order.id);
      } catch (error) {
        console.error("Paper order sync failed", order?.id, error);
      }
    }
    if (changed) {
      localStorage.setItem(PAPER_STATE_KEY, JSON.stringify(state));
      saveAppliedPaperOrders(applied);
      location.reload();
    } else {
      saveAppliedPaperOrders(applied);
    }
  } finally {
    paperSyncInFlight = false;
  }
}

setTimeout(syncPaperOrders, 1500);
setInterval(syncPaperOrders, 15000);
