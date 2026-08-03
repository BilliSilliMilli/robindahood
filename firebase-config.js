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
