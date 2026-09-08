const frame = document.querySelector(".desktop-frame");
const composer = document.querySelector("[data-composer]");
const promptInput = document.querySelector("[data-prompt]");
const sendButton = document.querySelector("[data-send]");
const conversationScroll = document.querySelector("[data-conversation-scroll]");
const connectorTrigger = document.querySelector("[data-connector-trigger]");
const connectorMenu = document.querySelector("[data-connector-menu]");
const modelTrigger = document.querySelector("[data-model-trigger]");
const modelMenu = document.querySelector("[data-model-menu]");
const toast = document.querySelector("[data-toast]");

const sessionData = {
  renewal: {
    project: "customer-intelligence",
    title: "Trace renewal risk",
    branch: "opengraph/renewal-analysis",
    prompt: "Which renewals are at risk, and what evidence supports that?",
    intro: "I’ll trace the renewal entities across the connected account graph, then verify the strongest signals against their original sources.",
    answerLead: "Acme Corp is the clearest renewal risk.",
    answerRest: "Pricing concern appears in both the Q3 call and account signal export, with Priya Raman listed as the active owner. The relationship is supported by three independent sources.",
    query: "renewal risk → account → evidence",
    graphTitle: "Acme renewal risk",
    core: { initials: "AC", label: "Acme Corp", type: "ACCOUNT", score: "3 sources", description: "Enterprise account with a Q4 renewal and three independently supported risk signals." },
    signals: [
      { entity: "risk", label: "Renewal risk", score: "0.94", source: "q3_call.wav", short: "SIGNAL · .94", description: "A direct renewal blocker mentioned in the Q3 account call." },
      { entity: "pricing", label: "Pricing concern", score: "0.89", source: "signals.csv", short: "SIGNAL · .89", description: "Pricing concern is rising and corroborated across two records." },
      { entity: "priya", label: "Owner: Priya R.", graphLabel: "Priya Raman", score: "0.86", source: "account.json", short: "PERSON · .86", description: "Primary strategic account owner associated with the Acme renewal." },
    ],
    sources: [
      { key: "call", type: "WAV", title: "q3_call.wav", meta: "03:18–03:42 · Customer call", excerpt: "Budget approval is the remaining blocker…", score: "0.94", bodyBefore: "We like the product and the team is using it. ", highlight: "Budget approval is the remaining blocker", bodyAfter: ", and finance asked us to revisit the pricing before the renewal date." },
      { key: "signals", type: "CSV", title: "signals.csv", meta: "Row 128 · account_id: acme", excerpt: "pricing_concern = true · trend = rising", score: "0.89", bodyBefore: "The account health export marks ", highlight: "pricing_concern as true", bodyAfter: " and shows the risk trend increasing over the last three reporting periods." },
      { key: "account", type: "JSON", title: "account.json", meta: "owner.primary · synced 8m ago", excerpt: "Priya Raman · Strategic Accounts", score: "0.86", bodyBefore: "The current account record assigns ", highlight: "Priya Raman as primary owner", bodyAfter: " in the Strategic Accounts workspace." },
    ],
  },
  audit: {
    project: "customer-intelligence",
    title: "Weekly account audit",
    branch: "routine/account-health",
    prompt: "Run the weekly account audit and show me the biggest change.",
    intro: "I’ll compare this week’s account graph with the previous snapshot and verify the largest relationship changes.",
    answerLead: "Northstar Health changed most this week.",
    answerRest: "Support escalation is now connected to an expansion opportunity, but the executive sponsor has gone inactive. Two new records and the latest support transcript support the change.",
    query: "weekly snapshot → changed edges → evidence",
    graphTitle: "Northstar weekly change",
    core: { initials: "NH", label: "Northstar", type: "ACCOUNT", score: "4 changes", description: "Healthcare account with a newly connected support escalation and expansion opportunity." },
    signals: [
      { entity: "risk", label: "Sponsor inactive", score: "0.92", source: "activity.csv", short: "SIGNAL · .92", description: "Executive sponsor activity dropped below the account threshold." },
      { entity: "pricing", label: "Expansion signal", score: "0.88", source: "support.wav", short: "SIGNAL · .88", description: "Support transcript mentions an additional regional deployment." },
      { entity: "priya", label: "Owner: Marcus L.", graphLabel: "Marcus Lee", score: "0.84", source: "crm.json", short: "PERSON · .84", description: "Account owner responsible for the current health review." },
    ],
    sources: [
      { key: "call", type: "CSV", title: "activity.csv", meta: "Week 33 · sponsor events", excerpt: "sponsor_activity = inactive", score: "0.92", bodyBefore: "The weekly snapshot shows ", highlight: "executive sponsor activity fell to zero", bodyAfter: " after four weeks of consistent engagement." },
      { key: "signals", type: "WAV", title: "support.wav", meta: "14:02–14:31 · Support call", excerpt: "regional rollout requested", score: "0.88", bodyBefore: "The support lead asked about ", highlight: "adding the western region to deployment", bodyAfter: " once the open escalation is resolved." },
      { key: "account", type: "JSON", title: "crm.json", meta: "owner.primary · synced 4m ago", excerpt: "Marcus Lee · Enterprise Health", score: "0.84", bodyBefore: "The account record lists ", highlight: "Marcus Lee as the current owner", bodyAfter: " for enterprise health accounts." },
    ],
  },
  launch: {
    project: "product-ops",
    title: "Summarize launch blockers",
    branch: "launch/atlas-readiness",
    prompt: "What is blocking the Atlas launch? Trace each blocker to its source.",
    intro: "I’ll traverse the Atlas readiness graph and check each blocker against the latest product, security, and release sources.",
    answerLead: "Atlas has two material launch blockers.",
    answerRest: "The API schema is waiting on a breaking-change decision, and the security review still lacks data-retention evidence. Noah Chen owns the release decision across both paths.",
    query: "Atlas → launch blockers → source owners",
    graphTitle: "Atlas launch readiness",
    core: { initials: "AT", label: "Atlas", type: "RELEASE", score: "4 sources", description: "Product release connected to two unresolved blockers and a single accountable owner." },
    signals: [
      { entity: "risk", label: "API schema", score: "0.96", source: "api-review.md", short: "BLOCKER · .96", description: "Breaking schema decision is required before the public API can freeze." },
      { entity: "pricing", label: "Security review", score: "0.91", source: "sec-review.pdf", short: "BLOCKER · .91", description: "Data-retention evidence remains incomplete in the security review." },
      { entity: "priya", label: "Owner: Noah C.", graphLabel: "Noah Chen", score: "0.87", source: "release.yaml", short: "PERSON · .87", description: "Release owner linked to both active launch blockers." },
    ],
    sources: [
      { key: "call", type: "MD", title: "api-review.md", meta: "Decision 12 · API review", excerpt: "breaking-change decision pending", score: "0.96", bodyBefore: "The API review records a ", highlight: "pending breaking-change decision", bodyAfter: " before the public schema can be frozen." },
      { key: "signals", type: "PDF", title: "sec-review.pdf", meta: "Finding 04 · Security review", excerpt: "retention evidence missing", score: "0.91", bodyBefore: "The security reviewer requested ", highlight: "evidence for the data-retention policy", bodyAfter: " before launch approval can be issued." },
      { key: "account", type: "YML", title: "release.yaml", meta: "owner.release · commit 41c8", excerpt: "Noah Chen · Product Platform", score: "0.87", bodyBefore: "The release manifest assigns ", highlight: "Noah Chen as release owner", bodyAfter: " with approval responsibility for both blocker paths." },
    ],
  },
  owner: {
    project: "customer-intelligence",
    title: "Find the account owner",
    branch: "opengraph/owner-resolution",
    prompt: "Who owns the Acme renewal, and when did they last engage?",
    intro: "I’ll resolve the active owner relationship and follow it to the latest verified engagement event.",
    answerLead: "Priya Raman owns the Acme renewal.",
    answerRest: "Her latest verified engagement was the Q3 customer call eight days ago. The CRM record and call attendee list agree, with no competing owner relationship.",
    query: "Acme → active owner → latest engagement",
    graphTitle: "Acme account ownership",
    core: { initials: "AC", label: "Acme Corp", type: "ACCOUNT", score: "2 sources", description: "Account ownership resolved from CRM state and the most recent customer interaction." },
    signals: [
      { entity: "risk", label: "Last call: 8d", score: "0.93", source: "q3_call.wav", short: "EVENT · .93", description: "Most recent verified engagement with the account." },
      { entity: "pricing", label: "Active owner", score: "0.91", source: "crm.json", short: "RELATION · .91", description: "Current primary-owner relationship in the CRM graph." },
      { entity: "priya", label: "Priya Raman", graphLabel: "Priya Raman", score: "0.97", source: "attendees.csv", short: "PERSON · .97", description: "Strategic account owner present in the latest customer call." },
    ],
    sources: [
      { key: "call", type: "WAV", title: "q3_call.wav", meta: "18 Jul · Customer call", excerpt: "Priya Raman · host", score: "0.93", bodyBefore: "The latest recorded customer interaction occurred eight days ago and lists ", highlight: "Priya Raman as the host", bodyAfter: "." },
      { key: "signals", type: "JSON", title: "crm.json", meta: "owner.primary · current", excerpt: "owner_id = priya_raman", score: "0.91", bodyBefore: "The current CRM relationship resolves ", highlight: "Priya Raman as primary owner", bodyAfter: " with no active competing assignment." },
      { key: "account", type: "CSV", title: "attendees.csv", meta: "Row 08 · Q3 call", excerpt: "priya@opengraph.ai · host", score: "0.97", bodyBefore: "The attendee export verifies ", highlight: "Priya’s participation as host", bodyAfter: " in the latest customer call." },
    ],
  },
  brief: {
    project: "sales-enablement",
    title: "Draft a customer brief",
    branch: "brief/acme-executive",
    prompt: "Draft a concise executive brief for the Acme renewal meeting.",
    intro: "I’ll assemble an executive brief from the highest-confidence account, engagement, and renewal relationships.",
    answerLead: "Acme enters renewal with strong usage but commercial risk.",
    answerRest: "Adoption is healthy across the core team, while pricing approval remains unresolved. Lead with demonstrated value, then give Priya a clear commercial path for finance.",
    query: "Acme → adoption + risk → executive brief",
    graphTitle: "Acme executive context",
    core: { initials: "AC", label: "Acme Corp", type: "ACCOUNT", score: "6 sources", description: "Executive context assembled from product usage, customer calls, and commercial records." },
    signals: [
      { entity: "risk", label: "Strong adoption", score: "0.95", source: "usage.csv", short: "SIGNAL · .95", description: "Weekly active usage is above the enterprise benchmark." },
      { entity: "pricing", label: "Pricing unresolved", score: "0.90", source: "q3_call.wav", short: "RISK · .90", description: "Commercial approval remains the primary renewal blocker." },
      { entity: "priya", label: "Champion: Priya R.", graphLabel: "Priya Raman", score: "0.88", source: "account.json", short: "PERSON · .88", description: "Internal account champion and meeting owner." },
    ],
    sources: [
      { key: "call", type: "CSV", title: "usage.csv", meta: "Week 32 · Product usage", excerpt: "weekly_active = 84%", score: "0.95", bodyBefore: "Product analytics show ", highlight: "84% weekly active usage", bodyAfter: " across Acme’s licensed core team." },
      { key: "signals", type: "WAV", title: "q3_call.wav", meta: "03:18–03:42 · Customer call", excerpt: "pricing approval unresolved", score: "0.90", bodyBefore: "The account call confirms that ", highlight: "pricing approval remains unresolved", bodyAfter: " with finance ahead of the renewal meeting." },
      { key: "account", type: "JSON", title: "account.json", meta: "champion.primary · current", excerpt: "Priya Raman · Strategic Accounts", score: "0.88", bodyBefore: "The account graph identifies ", highlight: "Priya Raman as the active champion", bodyAfter: " and meeting owner." },
    ],
  },
};

let activeSessionKey = "renewal";
let runTimers = [];
let toastTimer = 0;
let audioTimer = 0;
let audioSeconds = 18;

function showToast(message) {
  window.clearTimeout(toastTimer);
  toast.textContent = message;
  toast.hidden = false;
  toastTimer = window.setTimeout(() => {
    toast.hidden = true;
  }, 2300);
}

function closeMenus(except = "") {
  if (except !== "connectors") {
    connectorMenu.hidden = true;
    connectorTrigger.setAttribute("aria-expanded", "false");
  }
  if (except !== "model") {
    modelMenu.hidden = true;
    modelTrigger.setAttribute("aria-expanded", "false");
  }
}

function toggleMenu(name) {
  const isConnectorMenu = name === "connectors";
  const menu = isConnectorMenu ? connectorMenu : modelMenu;
  const trigger = isConnectorMenu ? connectorTrigger : modelTrigger;
  const willOpen = menu.hidden;
  closeMenus(name);
  menu.hidden = !willOpen;
  trigger.setAttribute("aria-expanded", String(willOpen));
}

function resizePrompt() {
  promptInput.style.height = "auto";
  promptInput.style.height = `${Math.min(promptInput.scrollHeight, 112)}px`;
  sendButton.disabled = !promptInput.value.trim();
}

function setAnswerText(data) {
  const answer = document.querySelector("[data-answer-copy]");
  answer.replaceChildren();
  const strong = document.createElement("strong");
  strong.textContent = data.answerLead;
  answer.append(strong, document.createTextNode(` ${data.answerRest}`));
}

function updateSignals(data) {
  const resultButtons = [...document.querySelectorAll("[data-answer-signals] button")];
  const graphEntities = ["risk", "pricing", "priya"];

  data.signals.forEach((signal, index) => {
    const result = resultButtons[index];
    result.dataset.focusEntity = signal.entity;
    result.querySelector("b").textContent = signal.label;
    result.querySelector("strong").textContent = signal.score;
    result.querySelector("small").textContent = signal.source;

    const node = document.querySelector(`[data-entity="${graphEntities[index]}"]`);
    node.querySelector("b").textContent = signal.graphLabel || signal.label.replace(/^Owner:\s*/, "");
    node.querySelector("small").textContent = signal.short;
  });
}

function updateEvidence(data) {
  const evidenceButtons = [...document.querySelectorAll(".evidence-list > button")];
  data.sources.forEach((source, index) => {
    const button = evidenceButtons[index];
    button.dataset.source = source.key;
    const badge = button.querySelector(".file-badge");
    badge.textContent = source.type;
    button.querySelector("b").textContent = source.title;
    button.querySelector("small").textContent = source.meta;
    button.querySelector("em").textContent = source.excerpt;
    button.querySelector(":scope > strong").textContent = source.score;
  });
}

function renderSession(key, { keepPrompt = false } = {}) {
  const data = sessionData[key];
  if (!data) return;
  activeSessionKey = key;

  document.querySelectorAll("[data-session]").forEach((button) => {
    button.classList.toggle("is-active", button.dataset.session === key);
  });

  document.querySelector("[data-project-name]").textContent = data.project;
  document.querySelector("[data-task-title]").textContent = data.title;
  document.querySelector("[data-branch-name]").textContent = data.branch;
  document.querySelector("[data-user-copy]").textContent = data.prompt;
  document.querySelector("[data-assistant-intro]").textContent = data.intro;
  document.querySelector("[data-tool-query]").textContent = data.query;
  document.querySelector("[data-graph-title]").textContent = data.graphTitle;

  const coreNode = document.querySelector('[data-entity="acme"]');
  coreNode.querySelector("span").textContent = data.core.initials;
  coreNode.querySelector("b").textContent = data.core.label;
  coreNode.querySelector("small").textContent = data.core.type;

  setAnswerText(data);
  updateSignals(data);
  updateEvidence(data);
  selectEntity("acme");
  showSource(data.sources[0].key, { switchTab: false });

  if (!keepPrompt) {
    promptInput.value = "";
    resizePrompt();
  }
}

function entityDetails(entity) {
  const data = sessionData[activeSessionKey];
  if (entity === "acme") return data.core;
  if (entity === "source") {
    return {
      type: "EVIDENCE",
      label: `${data.sources.length} cited sources`,
      score: "verified",
      description: "Original records supporting the selected graph relationships and answer.",
    };
  }
  const signal = data.signals.find((item) => item.entity === entity);
  return {
    type: signal?.short.split(" · ")[0] || "ENTITY",
    label: signal?.graphLabel || signal?.label || "Entity",
    score: signal?.score || "—",
    description: signal?.description || "Connected entity in the active context graph.",
  };
}

function selectEntity(entity) {
  const details = entityDetails(entity);
  document.querySelectorAll("[data-entity]").forEach((node) => {
    node.classList.toggle("is-selected", node.dataset.entity === entity);
  });
  document.querySelectorAll("[data-focus-entity]").forEach((button) => {
    button.classList.toggle("is-focused", button.dataset.focusEntity === entity);
  });

  const edges = [...document.querySelectorAll(".graph-edge")];
  const edgeMap = {
    risk: "edge-acme-risk",
    pricing: "edge-acme-pricing",
    priya: "edge-acme-priya",
    source: "edge-acme-source",
  };
  edges.forEach((edge) => {
    edge.classList.toggle("is-active", entity === "acme" || edge.classList.contains(edgeMap[entity]));
  });

  document.querySelector("[data-entity-type]").textContent = details.type;
  document.querySelector("[data-entity-score]").textContent = details.score;
  document.querySelector("[data-entity-title]").textContent = details.label;
  document.querySelector("[data-entity-description]").textContent = details.description;
}

function setPreviewTab(name) {
  document.querySelectorAll("[data-preview-tab]").forEach((button) => {
    const selected = button.dataset.previewTab === name;
    button.setAttribute("aria-selected", String(selected));
  });

  document.querySelectorAll("[data-preview-panel]").forEach((panel) => {
    const selected = panel.dataset.previewPanel === name;
    panel.classList.toggle("is-active", selected);
    panel.hidden = !selected;
    panel.classList.toggle("is-changing", selected);
    if (selected) window.setTimeout(() => panel.classList.remove("is-changing"), 240);
  });
}

function setSourceText(source) {
  const content = document.querySelector("[data-source-content] p");
  content.replaceChildren(
    document.createTextNode(source.bodyBefore),
    Object.assign(document.createElement("mark"), { textContent: source.highlight }),
    document.createTextNode(source.bodyAfter),
  );
}

function showSource(sourceKey, { switchTab = true } = {}) {
  const data = sessionData[activeSessionKey];
  const source = data.sources.find((item) => item.key === sourceKey) || data.sources[0];
  stopAudio();
  document.querySelector("[data-source-title]").textContent = source.title;
  document.querySelector("[data-audio-time]").textContent = "03:18";
  setSourceText(source);
  if (switchTab) setPreviewTab("source");
}

function clearRunTimers() {
  runTimers.forEach((timer) => window.clearTimeout(timer));
  runTimers = [];
}

function inferSessionKey(prompt) {
  const value = prompt.toLowerCase();
  if (value.includes("launch") || value.includes("atlas") || value.includes("blocker")) return "launch";
  if (value.includes("owner") || value.includes("owns") || value.includes("priya")) return "owner";
  if (value.includes("brief") || value.includes("executive")) return "brief";
  if (value.includes("audit") || value.includes("weekly") || value.includes("northstar")) return "audit";
  if (value.includes("renew") || value.includes("risk") || value.includes("acme")) return "renewal";
  return activeSessionKey;
}

function setToolState(tool, state) {
  const labels = { queued: "Queued", running: "Running", complete: "Completed" };
  tool.classList.toggle("is-queued", state === "queued");
  tool.classList.toggle("is-running", state === "running");
  tool.querySelector("[data-tool-state]").textContent = labels[state];
}

function runPrompt(value) {
  const openGraphConnector = document.querySelector('[data-connector="OpenGraph"]');
  if (!openGraphConnector.classList.contains("is-connected")) {
    showToast("Connect OpenGraph before querying the graph.");
    toggleMenu("connectors");
    return;
  }

  const inferredKey = inferSessionKey(value);
  renderSession(inferredKey, { keepPrompt: true });
  const data = sessionData[inferredKey];
  clearRunTimers();
  closeMenus();

  document.querySelector("[data-user-copy]").textContent = value;
  document.querySelector("[data-assistant-intro]").textContent = "I’m mapping that request onto the connected context graph and checking each result against its original evidence.";

  const tools = [...document.querySelectorAll("[data-tool]")];
  const thinking = document.querySelector("[data-thinking]");
  const answer = document.querySelector("[data-answer-block]");
  tools.forEach((tool, index) => setToolState(tool, index === 0 ? "running" : "queued"));
  thinking.hidden = false;
  answer.hidden = true;
  sendButton.disabled = true;
  promptInput.disabled = true;

  conversationScroll.scrollTo({ top: conversationScroll.scrollHeight, behavior: "smooth" });

  runTimers.push(window.setTimeout(() => {
    setToolState(tools[0], "complete");
    setToolState(tools[1], "running");
  }, 620));

  runTimers.push(window.setTimeout(() => {
    setToolState(tools[1], "complete");
  }, 1180));

  runTimers.push(window.setTimeout(() => {
    document.querySelector("[data-assistant-intro]").textContent = data.intro;
    thinking.hidden = true;
    answer.hidden = false;
    answer.classList.add("is-entering");
    requestAnimationFrame(() => requestAnimationFrame(() => answer.classList.remove("is-entering")));
    promptInput.disabled = false;
    promptInput.value = "";
    resizePrompt();
    showToast("Answer grounded in 3 cited sources.");
    conversationScroll.scrollTo({ top: conversationScroll.scrollHeight, behavior: "smooth" });
  }, 1500));
}

function updateConnectorCount() {
  const connected = [...document.querySelectorAll("[data-connector]")].filter((button) => button.classList.contains("is-connected"));
  const countLabel = document.querySelector("[data-connector-count]");
  countLabel.lastChild.textContent = ` ${connected.length} ${connected.length === 1 ? "source" : "sources"}`;

  const openGraphConnected = document.querySelector('[data-connector="OpenGraph"]').classList.contains("is-connected");
  const desktopStatus = document.querySelector(".desktop-connection");
  const status = document.querySelector(".conversation-status > span:last-child");
  desktopStatus.lastChild.textContent = openGraphConnected ? " OpenGraph MCP connected" : " OpenGraph MCP disconnected";
  status.innerHTML = openGraphConnected ? "OpenGraph MCP <b>connected</b>" : "OpenGraph MCP <b>disconnected</b>";
  desktopStatus.classList.toggle("is-disconnected", !openGraphConnected);
}

function chooseModel(button) {
  const model = button.dataset.model;
  document.querySelectorAll("[data-model]").forEach((option) => {
    const selected = option === button;
    option.classList.toggle("is-selected", selected);
    option.setAttribute("aria-checked", String(selected));
  });
  document.querySelector("[data-model-label]").textContent = model;
  document.querySelector("[data-status-model]").textContent = model;
  showToast(`${model} selected.`);
}

function chooseEffort(button) {
  const effort = button.dataset.effort;
  document.querySelectorAll("[data-effort]").forEach((option) => option.classList.toggle("is-selected", option === button));
  document.querySelector("[data-effort-label]").textContent = effort;
  document.querySelector("[data-status-effort]").textContent = `${effort.toLowerCase()} effort`;
  closeMenus();
  showToast(`${effort} reasoning effort selected.`);
}

function stopAudio() {
  window.clearInterval(audioTimer);
  audioTimer = 0;
  audioSeconds = 18;
  const preview = document.querySelector("[data-audio-preview]");
  const button = document.querySelector("[data-audio-toggle]");
  preview.classList.remove("is-playing");
  button.setAttribute("aria-pressed", "false");
  button.querySelector("span").textContent = "▶";
}

function toggleAudio() {
  const preview = document.querySelector("[data-audio-preview]");
  const button = document.querySelector("[data-audio-toggle]");
  const time = document.querySelector("[data-audio-time]");
  const playing = !preview.classList.contains("is-playing");

  if (!playing) {
    window.clearInterval(audioTimer);
    audioTimer = 0;
    preview.classList.remove("is-playing");
    button.setAttribute("aria-pressed", "false");
    button.querySelector("span").textContent = "▶";
    return;
  }

  preview.classList.add("is-playing");
  button.setAttribute("aria-pressed", "true");
  button.querySelector("span").textContent = "Ⅱ";
  audioTimer = window.setInterval(() => {
    audioSeconds += 1;
    time.textContent = `03:${String(audioSeconds).padStart(2, "0")}`;
    if (audioSeconds >= 42) stopAudio();
  }, 650);
}

promptInput.addEventListener("input", resizePrompt);
promptInput.addEventListener("keydown", (event) => {
  if (event.key === "Enter" && !event.shiftKey) {
    event.preventDefault();
    if (promptInput.value.trim()) composer.requestSubmit();
  }
});

composer.addEventListener("submit", (event) => {
  event.preventDefault();
  const value = promptInput.value.trim();
  if (value) runPrompt(value);
});

connectorTrigger.addEventListener("click", () => toggleMenu("connectors"));
modelTrigger.addEventListener("click", () => toggleMenu("model"));
document.querySelector("[data-close-connectors]").addEventListener("click", closeMenus);

document.querySelectorAll("[data-connector]").forEach((button) => {
  button.addEventListener("click", () => {
    const connected = !button.classList.contains("is-connected");
    button.classList.toggle("is-connected", connected);
    button.setAttribute("aria-pressed", String(connected));
    updateConnectorCount();
    showToast(`${button.dataset.connector} ${connected ? "connected" : "disconnected"}.`);
  });
});

document.querySelectorAll("[data-model]").forEach((button) => button.addEventListener("click", () => chooseModel(button)));
document.querySelectorAll("[data-effort]").forEach((button) => button.addEventListener("click", () => chooseEffort(button)));

document.querySelectorAll("[data-session]").forEach((button) => {
  button.addEventListener("click", () => {
    clearRunTimers();
    renderSession(button.dataset.session);
    document.querySelector("[data-thinking]").hidden = true;
    document.querySelector("[data-answer-block]").hidden = false;
    document.querySelectorAll("[data-tool]").forEach((tool) => setToolState(tool, "complete"));
    promptInput.disabled = false;
    showToast(`${sessionData[button.dataset.session].title} loaded.`);
  });
});

document.querySelector("[data-replay]").addEventListener("click", () => runPrompt(sessionData[activeSessionKey].prompt));

document.querySelector("[data-new-session]").addEventListener("click", () => {
  promptInput.value = "";
  resizePrompt();
  promptInput.focus();
  showToast("New local session ready.");
});

document.querySelectorAll("[data-mode]").forEach((button) => {
  button.addEventListener("click", () => {
    document.querySelectorAll("[data-mode]").forEach((option) => option.classList.toggle("is-active", option === button));
    showToast(`${button.dataset.mode === "code" ? "Code" : "Chat"} mode selected.`);
  });
});

document.querySelector("[data-sidebar-toggle]").addEventListener("click", (event) => {
  const collapsed = frame.classList.toggle("sidebar-is-collapsed");
  event.currentTarget.setAttribute("aria-pressed", String(collapsed));
  event.currentTarget.setAttribute("aria-label", collapsed ? "Expand session sidebar" : "Collapse session sidebar");
});

document.querySelectorAll("[data-preview-tab]").forEach((button) => button.addEventListener("click", () => setPreviewTab(button.dataset.previewTab)));
document.querySelectorAll("[data-entity]").forEach((button) => button.addEventListener("click", () => selectEntity(button.dataset.entity)));
document.querySelectorAll("[data-focus-entity]").forEach((button) => {
  button.addEventListener("click", () => {
    selectEntity(button.dataset.focusEntity);
    setPreviewTab("graph");
  });
});

document.querySelectorAll("[data-source]").forEach((button) => button.addEventListener("click", () => showSource(button.dataset.source)));
document.querySelector("[data-open-evidence]").addEventListener("click", () => setPreviewTab("evidence"));
document.querySelector("[data-inspect-evidence]").addEventListener("click", () => setPreviewTab("evidence"));
document.querySelector("[data-center-graph]").addEventListener("click", () => {
  selectEntity("acme");
  showToast("Graph centered on the primary entity.");
});

document.querySelector("[data-refresh-graph]").addEventListener("click", () => {
  const canvas = document.querySelector("[data-graph-canvas]");
  canvas.animate(
    [
      { opacity: 1, transform: "scale(1)" },
      { opacity: 0.45, transform: "scale(.985)" },
      { opacity: 1, transform: "scale(1)" },
    ],
    { duration: 480, easing: "cubic-bezier(.16,1,.3,1)" },
  );
  showToast("Graph refreshed from connected sources.");
});

document.querySelector("[data-audio-toggle]").addEventListener("click", toggleAudio);

document.addEventListener("click", (event) => {
  if (!connectorMenu.hidden && !connectorMenu.contains(event.target) && !connectorTrigger.contains(event.target)) closeMenus();
  if (!modelMenu.hidden && !modelMenu.contains(event.target) && !modelTrigger.contains(event.target)) closeMenus();
});

document.addEventListener("keydown", (event) => {
  if (event.key === "Escape") closeMenus();
  if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === "k") {
    event.preventDefault();
    promptInput.focus();
  }
});

renderSession("renewal");
updateConnectorCount();
resizePrompt();
