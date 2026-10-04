/* My Brief · siagentsignal.com
   Every node is built with createElement/textContent: no innerHTML, so the page runs under
   require-trusted-types-for 'script'. Data comes from #si-data (written at build time). */
(function () {
"use strict";

/* ---------- helpers ---------- */
var $ = function (s, r) { return (r || document).querySelector(s); };
var $$ = function (s, r) { return Array.prototype.slice.call((r || document).querySelectorAll(s)); };
var NS = "http://www.w3.org/2000/svg";
var REDUCED = window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
var store = {
  get: function (k) { try { return window.localStorage.getItem(k); } catch (e) { return null; } },
  set: function (k, v) { try { window.localStorage.setItem(k, v); } catch (e) { /* private mode: fine */ } }
};
function h(tag, attrs, kids) {
  var el = document.createElement(tag);
  if (attrs) Object.keys(attrs).forEach(function (k) {
    var v = attrs[k];
    if (v == null || v === false) return;
    if (k === "class") el.className = v;
    else if (k.slice(0, 2) === "on") el.addEventListener(k.slice(2), v);
    else el.setAttribute(k, v === true ? "" : String(v));
  });
  (kids || []).forEach(function (c) {
    if (c == null || c === false) return;
    el.appendChild(typeof c === "string" || typeof c === "number" ? document.createTextNode(String(c)) : c);
  });
  return el;
}
function clear(el) { while (el.firstChild) el.removeChild(el.firstChild); return el; }
function icon(id) {
  var s = document.createElementNS(NS, "svg"), u = document.createElementNS(NS, "use");
  s.setAttribute("aria-hidden", "true"); u.setAttribute("href", "#" + id); s.appendChild(u); return s;
}
function sum(a) { return a.reduce(function (x, y) { return x + y; }, 0); }
function fmt(n) { return Number(n).toLocaleString("en-US"); }
/* Rounded, true magnitudes: never more than the real number (same rounding as the build). */
function approx(n) {
  if (n < 10) return String(n);
  var sig = n < 1000 ? 1 : 2, p = Math.pow(10, String(Math.floor(n)).length - sig), f = Math.floor(n / p) * p;
  return (f < n ? "over " : "") + fmt(f);
}
function plus(n) {
  if (n < 10) return String(n);
  if (n >= 1000) return Math.floor(n / 1000) + "k+";
  var p = n < 100 ? 10 : 100;
  return Math.floor(n / p) * p + "+";
}
function cap(s) { return s.charAt(0).toUpperCase() + s.slice(1); }
function articleWords(n) {
  return n >= 1e6 ? "a million+ articles" : n >= 5e5 ? "over half a million articles" : "hundreds of thousands of articles";
}
function articleShort(n) { return n >= 1e6 ? "A million+" : n >= 5e5 ? "Half a million+" : plus(n); }
function utc(iso) { var d = new Date(iso); return isNaN(d) ? "" : d.toISOString().slice(0, 10) + " " + d.toISOString().slice(11, 16) + " UTC"; }
function scrollOpts(left) { return { left: left, behavior: REDUCED ? "auto" : "smooth" }; }
function today() { var d = new Date(); return d.getFullYear() + "-" + ("0" + (d.getMonth() + 1)).slice(-2) + "-" + ("0" + d.getDate()).slice(-2); }

/* ---------- data ---------- */
var D = null;
try { D = JSON.parse($("#si-data").textContent); if (!D || !D.cats || !D.story) D = null; } catch (e) { D = null; }
var NAMES = {"agentic-ai":"Agentic AI","enterprise-ai":"Enterprise AI","policy":"Policy","funding":"Funding","frontier-research":"Frontier Research","security":"Security","china-ai":"Frontier China AI","creative-ai":"Creative AI","consumer-ai":"Consumer AI","open-source-ai":"Open-Source AI","benchmarks":"Benchmarks","ai-safety":"AI Safety","silicon":"Silicon","cloud-ai":"Cloud AI","robotics":"Robotics","openai":"OpenAI","claude":"Claude","gemini":"Gemini","amazon-ai":"Amazon AI","apple-ai":"Apple AI","meta-ai":"Meta AI","microsoft-ai":"Microsoft AI"};
var STAMP = { fact: "Fact", wide: "Widely reported", unconf: "Unconfirmed", denied: "Denied" };
function week7(slug) { return D && D.cats[slug] ? sum(D.cats[slug].t) : 0; }
var K = {};
if (D) {
  var hrs = D.hourly.map(function (p) { return p[1]; });
  var last24 = sum(hrs.slice(-24)), last72 = sum(hrs);
  var avg = Math.round(last72 / hrs.length);
  K = {
    articlesWords: articleWords(D.articles), articlesShort: articleShort(D.articles),
    rumorsShort: plus(D.rumors.count), rumorsWords: approx(D.rumors.count),
    rumorsTime: utc(D.rumors.generated_at), genTime: utc(D.generated_at),
    last24: approx(last24), last72: approx(last72), avg: fmt(avg < 100 ? avg : Math.round(avg / 10) * 10)
  };
  $$("[data-k]").forEach(function (el) { var v = K[el.getAttribute("data-k")]; if (v) el.textContent = v; });
  var age = (Date.now() - new Date(D.generated_at).getTime()) / 60000, f = $("#fresh1");
  if (age <= 90) { f.className = "fresh ok"; f.textContent = "Last updated " + K.genTime; }
  else { f.className = "fresh stale"; f.textContent = "Snapshot · stale since " + K.genTime; }
}
function stampEl(s) {
  var el = h("span", { class: "stamp " + s.s }, [STAMP[s.s] || ""]);
  if (s.s !== "fact" && s.n) { el.appendChild(document.createTextNode(" ")); el.appendChild(h("small", {}, ["· " + s.n + " outlet" + (s.n === 1 ? "" : "s")])); }
  return el;
}
function srcEl(s, tag) {
  if (!s || !/^https:\/\//.test(s.url || "")) return null;
  return h(tag || "p", { class: "src" }, ["Source: ", h("a", { href: s.url, target: "_blank", rel: "noopener" }, [s.out, h("span", { class: "sr" }, [" (opens in a new tab)"])])]);
}

/* ---------- ticker ---------- */
(function () {
  if (!D) return;
  var items = [[cap(K.last24), " articles read in the last day"], [cap(articleWords(D.articles).replace(" articles", "")), " articles so far"], ["22", " categories, thousands of sources"]];
  ["agentic-ai", "policy", "funding", "frontier-research", "security", "china-ai", "openai", "claude", "gemini"].forEach(function (s) {
    items.push([NAMES[s] + " ", approx(week7(s)), " this week"]);
  });
  items.push(["Rumors desk ", approx(D.rumors.count), " tracked this week, every one labelled"]);
  items.push(["Snapshot ", K.genTime, ""]);
  var tr = clear($("#tkTrack"));
  // two copies for the seamless loop; the second is hidden from screen readers and from reduced-motion users
  [false, true].forEach(function (dup) {
    items.forEach(function (it) {
      var kids = it.length === 2 ? [h("b", {}, [it[0]]), it[1]] : [it[0], h("b", {}, [it[1]]), it[2]];
      tr.appendChild(h("span", { class: dup ? "tk-dup" : null, "aria-hidden": dup ? "true" : null }, kids));
    });
  });
  var btn = $("#tkBtn"), tk = $("#ticker");
  btn.addEventListener("click", function () { var p = tk.classList.toggle("paused"); btn.setAttribute("aria-pressed", p ? "true" : "false"); btn.textContent = p ? "Play" : "Pause"; });
  if (REDUCED) $("#tkView").setAttribute("tabindex", "0");
})();

/* ---------- the 60-second brief: instant play ---------- */
var au = $("#opener"), plays = $$(".js-play"), trackFillEl = $("#trackFill"), track = $("#track"), tl = $("#plTime"), note = $("#plNote");
var listenedThisLoad = false, audioBroken = false, wantPlay = false;
var NO_AUDIO = "This audio isn't available right now. The written brief is right below.";
function t(s) { if (!isFinite(s)) return "0:00"; s = Math.max(0, Math.floor(s)); return Math.floor(s / 60) + ":" + ("0" + s % 60).slice(-2); }
function syncPlay() {
  var on = !au.paused;
  plays.forEach(function (b) { b.classList.toggle("is-playing", on); b.setAttribute("aria-label", on ? "Pause the 60-second brief" : "Play the 60-second brief"); });
  $$(".js-play-label").forEach(function (l) { l.textContent = on ? "Pause" : (au.duration ? "Listen · " + t(au.duration) : "Listen"); });
}
function warm() { if (au.preload !== "auto") au.preload = "auto"; }
plays.forEach(function (b) {
  ["pointerenter", "focus", "touchstart"].forEach(function (ev) { b.addEventListener(ev, warm, { passive: true, once: true }); });
  b.addEventListener("click", function () {
    if (au.paused) {
      wantPlay = true;
      if (audioBroken) { note.textContent = NO_AUDIO; return; }
      note.textContent = "";
      var p = au.play();
      if (p && p.catch) p.catch(function () { note.textContent = "Audio could not start here. The written brief is right below."; });
    } else au.pause();
  });
});
au.addEventListener("play", syncPlay); au.addEventListener("pause", syncPlay);
au.addEventListener("ended", function () { syncPlay(); earnListen(); note.textContent = "That was your 60 seconds. Tap your role below to see your Monday."; });
au.addEventListener("loadedmetadata", function () { tl.textContent = "0:00 / " + t(au.duration); syncPlay(); });
au.addEventListener("timeupdate", function () {
  var d = au.duration || 0, p = d ? au.currentTime / d * 100 : 0;
  trackFillEl.style.width = p + "%";
  tl.textContent = t(au.currentTime) + (d ? " / " + t(d) : "");
  track.setAttribute("aria-valuenow", String(Math.round(p)));
  track.setAttribute("aria-valuetext", Math.round(au.currentTime) + " seconds");
  if (au.currentTime >= 30) earnListen();
});
au.addEventListener("error", function () { audioBroken = true; if (wantPlay) note.textContent = NO_AUDIO; });   // quiet until someone asks to listen
function seekTo(frac) { if (au.duration) au.currentTime = Math.max(0, Math.min(1, frac)) * au.duration; }
track.addEventListener("click", function (e) { var r = track.getBoundingClientRect(); seekTo((e.clientX - r.left) / r.width); });
track.addEventListener("keydown", function (e) {
  if (!au.duration) return;
  var k = e.key, c = au.currentTime;
  if (k === "ArrowRight" || k === "ArrowUp") au.currentTime = Math.min(au.duration, c + 5);
  else if (k === "ArrowLeft" || k === "ArrowDown") au.currentTime = Math.max(0, c - 5);
  else if (k === "Home") au.currentTime = 0;
  else if (k === "End") au.currentTime = au.duration;
  else return;
  e.preventDefault();
});
if ("mediaSession" in navigator && window.MediaMetadata) {
  try { navigator.mediaSession.metadata = new window.MediaMetadata({ title: "Your 60-second brief", artist: "My Brief", album: "siagentsignal.com", artwork: [{ src: "img/mark-a.png", sizes: "72x61", type: "image/png" }] }); } catch (e) { /* optional */ }
}

/* ---------- sliders: snap scroll + buttons + arrow keys ---------- */
function slider(box, onChange) {
  var cur = 0, raf = 0;
  function items() { return Array.prototype.slice.call(box.children).filter(function (c) { return c.nodeType === 1 && c.tagName !== "NOSCRIPT"; }); }
  function index() {
    var it = items(); if (!it.length) return 0;
    var base = it[0].offsetLeft, best = 0, d = Infinity;
    it.forEach(function (c, i) { var x = Math.abs(c.offsetLeft - base - box.scrollLeft); if (x < d) { d = x; best = i; } });
    if (box.scrollLeft + box.clientWidth >= box.scrollWidth - 2) best = it.length - 1;
    return best;
  }
  function go(i) {
    var it = items(); if (!it.length) return;
    i = Math.max(0, Math.min(it.length - 1, i));
    box.scrollTo(scrollOpts(it[i].offsetLeft - it[0].offsetLeft));
    if (i !== cur) { cur = i; if (onChange) onChange(cur, it.length); }
  }
  box.addEventListener("scroll", function () {
    if (raf) return;
    raf = window.requestAnimationFrame(function () { raf = 0; var i = index(); if (i !== cur) { cur = i; if (onChange) onChange(cur, items().length); } });
  }, { passive: true });
  box.addEventListener("keydown", function (e) {
    if (e.target !== box) return;
    if (e.key === "ArrowRight") { go(index() + 1); e.preventDefault(); }
    if (e.key === "ArrowLeft") { go(index() - 1); e.preventDefault(); }
  });
  return { go: go, index: index, reset: function () { cur = 0; box.scrollTo({ left: 0 }); if (onChange) onChange(0, items().length); }, count: function () { return items().length; } };
}

/* ---------- on air: stations ---------- */
var stDeck = $("#stDeck"), stTabs = $$(".st-tab"), ORDER_ST = ["si", "claude", "openai", "gemini"];
var stSlider = slider(stDeck, function (i) { stTabs.forEach(function (b, j) { b.setAttribute("aria-pressed", j === i ? "true" : "false"); }); });
stTabs.forEach(function (b, i) { b.addEventListener("click", function () { stSlider.go(i); stTabs.forEach(function (x, j) { x.setAttribute("aria-pressed", j === i ? "true" : "false"); }); }); });
$$(".st-jump").forEach(function (a) {
  a.addEventListener("click", function () { var i = ORDER_ST.indexOf(a.getAttribute("data-st")); if (i > -1) window.setTimeout(function () { stSlider.go(i); }, REDUCED ? 0 : 350); });
});

/* ---------- rumor bars ---------- */
(function () {
  if (!D) return;
  var list = D.rumors.by_vendor.slice(0, 9), top = list.length ? list[0][1] : 1, ul = $("#rumorBars");
  list.forEach(function (r) {
    var bar = h("span", { class: "b" }); bar.style.width = (r[1] / top * 100).toFixed(1) + "%";
    ul.appendChild(h("li", {}, [h("span", {}, [r[0]]), bar, h("em", { class: "tnum" }, [plus(r[1])])]));
  });
})();

/* ---------- roles: the "your Monday" demo ---------- */
var ROLES = {
 manager: { label: "Team manager", who: "a team manager", lanes: ["agentic-ai", "enterprise-ai", "policy"], cards: [
  ["dots", "Delegation just changed shape. Pick two recurring team chores an agent could prep before you arrive, and one it should never touch."],
  ["jobs", "Map your team's work as tasks, not titles. The repetitive ones are where automation lands first, and where training pays off."],
  ["skills", "Your status update, meeting summary and weekly report are three Skills waiting to be written."]],
  tr: { h: "Save your most-typed prompt as a standing instruction", steps: ["Open your AI tool's settings or a project.", "Paste the instruction you type most, with the format you want back.", "Use it tomorrow. Refine it once."], min: 5 } },
 marketing: { label: "Marketing lead", who: "a marketing lead", lanes: ["creative-ai", "consumer-ai", "agentic-ai"], cards: [
  ["publishers", "If search sends you traffic, watch this one, but don't re-plan around it yet. It moves to Fact or Denied the moment Google says so."],
  ["dots", "An agent that watches for a competitor launch or a product mention, then alerts you, is now a product, not a project."],
  ["skills", "Your weekly campaign report can become one slash command. Write the Skill once, in the exact format your boss reads."]],
  tr: { h: "Save your brand voice as a standing instruction", steps: ["Paste three lines of copy you're proud of.", "Ask your AI tool to describe the voice in five rules.", "Save those rules as a standing instruction."], min: 5 } },
 founder: { label: "Founder or CEO", who: "a founder", lanes: ["funding", "frontier-research", "agentic-ai"], cards: [
  ["sol", "Re-run your unit economics this week. The model bill you budgeted last quarter may already be too high."],
  ["oai30", "Capital is pooling at the very top. Price your own round on your traction, not on their headlines."],
  ["ipo_risk", "Plain-language AI risk disclosure is becoming normal investor talk. Have your own one-paragraph version ready."]],
  tr: { h: "Re-price one AI workflow on a cheaper model", steps: ["Pick the workflow with the biggest monthly bill.", "Run ten real inputs on a cheaper model.", "Compare outputs side by side before you switch."], min: 20 } },
 engineering: { label: "Engineering lead", who: "an engineering lead", lanes: ["agentic-ai", "open-source-ai", "benchmarks"], cards: [
  ["ultrafast", "Agent loops that felt too slow may now work in real time. Benchmark on your own workload before switching."],
  ["codexscan", "Run the new scan on one repo and compare it with your current checks before you trust it."],
  ["dots", "Set repo permissions and review rules for always-on agents before someone on the team switches one on."]],
  tr: { h: "Write your team's standing coding instructions once", steps: ["List your style, test and review rules.", "Save them where your coding agent reads them.", "Ask it to explain one rule back to you."], min: 15 } },
 security: { label: "Security lead", who: "a security lead", lanes: ["security", "ai-safety", "policy"], cards: [
  ["argon", "Frontier models are reaching defenders first. Ask your vendors which model runs their detection, and what changes when it upgrades."],
  ["hack", "Add autonomous agent traffic to your threat model and your rate limits now."],
  ["ftc", "Regulators are looking at agent safety. Write down who approves an agent's access before someone asks you."]],
  tr: { h: "Map what a background agent could reach", steps: ["List the tokens and service accounts your AI tools hold.", "Mark which systems each one can read or write.", "Remove one permission nobody needs."], min: 15 } },
 finance: { label: "Finance and investing", who: "a finance lead", lanes: ["funding", "silicon", "china-ai"], cards: [
  ["ipo_risk", "Read risk sections as closely as revenue lines. News, not investment advice."],
  ["rtx", "Export policy moves chip demand. Track the confirmation, not the first headline."],
  ["tencent", "Compute is being rented at very large scale. Watch who carries the lease risk."]],
  tr: { h: "Sort your watch list into fact and rumor", steps: ["Pick three AI items you follow.", "Label each Fact, Widely reported or Unconfirmed.", "Note what would confirm each one."], min: 10 } },
 policy: { label: "Policy and legal", who: "a policy lead", lanes: ["policy", "ai-safety", "china-ai"], cards: [
  ["eo", "A terminology change, not a capability claim. Check where your filings, policies and contracts define \"AI\"."],
  ["ftc", "Wait for an FTC statement before you brief leadership on it as fact."],
  ["rtx", "If confirmed, export-control guidance may shift again. Note which obligations hang on chip classes."]],
  tr: { h: "Find where your policies define \"AI\"", steps: ["Search your policy set for the word \"AI\".", "List each definition you find.", "Flag any that may need an \"SI\" line."], min: 15 } },
 product: { label: "Product manager", who: "a product manager", lanes: ["consumer-ai", "agentic-ai", "enterprise-ai"], cards: [
  ["dots", "Users will start to expect products that act first. Find one proactive moment in yours."],
  ["skills", "Reusable routines are becoming a default pattern. Where would a slash command save your users a step?"],
  ["ultrafast", "Re-test the agent flows you shelved for being too slow."]],
  tr: { h: "Write one proactive user story", steps: ["Pick your most common user task.", "Write what your product should do before the user asks.", "Share it at stand-up."], min: 10 } }
};
var ORDER = ["manager", "marketing", "founder", "engineering", "security", "finance", "policy", "product"];
var role = store.get("mb_role"); if (!ROLES[role]) role = "manager";
var deck = $("#deck"), rolesEl = $("#roles");
ORDER.forEach(function (k) {
  var inp = h("input", { type: "radio", name: "role", value: k });
  inp.checked = k === role;
  inp.addEventListener("change", function () { setRole(k, true); });
  rolesEl.appendChild(h("label", { class: "chip-radio" }, [inp, h("span", {}, [ROLES[k].label])]));
});
function cardEl(entry, i, R) {
  var s = D && D.story[entry[0]];
  if (!s) return null;   // fail closed: a story missing from the data never renders
  return h("article", { class: "card", "aria-label": "Story " + (i + 1) + " of 3" }, [
    h("div", { class: "c-top" }, [h("span", { class: "cat", "data-c": s.c }, [NAMES[s.c] || s.c]), stampEl(s)]),
    h("h3", {}, [s.h]),
    h("p", { class: "c-you" }, [h("b", {}, ["For " + R.who + ": "]), entry[1]]),
    srcEl(s)
  ]);
}
function tryEl(R) {
  var done = store.get("mb_tried_" + today()) === role;
  var btn = h("button", { type: "button", class: "js-tried", "aria-pressed": done ? "true" : "false" }, [done ? "Tried it" : "I tried it"]);
  var txt = h("span", {}, [done ? "Logged on this device." : "Tap only when you have."]);
  btn.addEventListener("click", function () {
    var on = btn.getAttribute("aria-pressed") !== "true", days = triedDays(), d = today();
    btn.setAttribute("aria-pressed", on ? "true" : "false"); btn.textContent = on ? "Tried it" : "I tried it";
    txt.textContent = on ? "Logged on this device." : "Tap only when you have.";
    if (on) { store.set("mb_tried_" + d, role); if (days.indexOf(d) < 0) days.push(d); }
    else { store.set("mb_tried_" + d, ""); days = days.filter(function (x) { return x !== d; }); }
    store.set("mb_days", JSON.stringify(days)); renderWeek(); renderLevels();
  });
  return h("article", { class: "card try", "aria-label": "One thing to try today" }, [
    h("div", { class: "c-top" }, [h("span", { class: "cat" }, ["Try this today"]), h("span", { class: "small" }, [R.tr.min + " min"])]),
    h("h3", {}, [R.tr.h]),
    h("ol", {}, R.tr.steps.map(function (x) { return h("li", {}, [x]); })),
    h("div", { class: "tried" }, [btn, txt])
  ]);
}
var SEG = [["Open", ""], ["Story 1", ""], ["Your angle", "role"], ["Story 2", ""], ["Your angle", "role"], ["Story 3", ""], ["Your angle", "role"], ["Try today", "role"], ["Close", ""]];
var SEG_ON = { 0: [1, 2], 1: [3, 4], 2: [5, 6], 3: [7] };
function renderChain(i) {
  var ch = clear($("#chain")), on = SEG_ON[i] || [];
  SEG.forEach(function (s, j) { ch.appendChild(h("li", { class: (s[1] + (on.indexOf(j) > -1 ? " on" : "")).trim() || null }, [s[0]])); });
  var li = ch.querySelector("li.on"); ch.scrollLeft = li && i > 0 ? Math.max(0, li.offsetLeft - ch.offsetLeft - 14) : 0;
}
function onCard(i, n) {
  $("#cardCount").textContent = (i + 1) + " / " + n;
  $("#prevCard").disabled = i === 0; $("#nextCard").disabled = i >= n - 1;
  renderChain(i);
}
var deckSlider = slider(deck, onCard);
$("#prevCard").addEventListener("click", function () { deckSlider.go(deckSlider.index() - 1); });
$("#nextCard").addEventListener("click", function () { deckSlider.go(deckSlider.index() + 1); });
function setRole(k, user) {
  role = k; var R = ROLES[k];
  if (user) store.set("mb_role", k);
  $("#appTitle").textContent = "Your Monday, " + R.label.toLowerCase();
  clear(deck);
  R.cards.forEach(function (c, i) { var el = cardEl(c, i, R); if (el) deck.appendChild(el); });
  deck.appendChild(tryEl(R));
  deckSlider.reset();
  renderStats(); renderRecap();
  $$(".js-role-select").forEach(function (s) { s.value = k; });
  var r = $('input[name="role"][value="' + k + '"]'); if (r) r.checked = true;
}

/* share: one tap, and the shared text always carries its sources */
$("#shareBrief").addEventListener("click", function () {
  var R = ROLES[role], lines = ["My Monday brief, for " + R.who + ":"], msg = $("#shareMsg");
  R.cards.forEach(function (c, i) {
    var s = D && D.story[c[0]]; if (!s) return;
    lines.push((i + 1) + ". " + s.h + " [" + STAMP[s.s] + (s.n ? ", " + s.n + " outlets" : "") + "] Source: " + s.out + " " + s.url);
  });
  lines.push("Try today: " + R.tr.h + ".");
  lines.push("Get yours free: https://siagentsignal.com/");
  var text = lines.join("\n");
  if (navigator.share) {
    navigator.share({ title: "My Monday brief", text: text }).then(function () { msg.textContent = "Shared."; }).catch(function () { /* closed the sheet */ });
  } else if (navigator.clipboard && navigator.clipboard.writeText) {
    navigator.clipboard.writeText(text).then(function () { msg.textContent = "Copied, with sources. Paste it anywhere."; }, function () { msg.textContent = "Couldn't copy here. Select the cards to share them."; });
  } else msg.textContent = "Sharing isn't available in this browser.";
});

/* ---------- stats beside cards ---------- */
function renderStats() {
  if (!D) return;
  var R = ROLES[role], lc = clear($("#laneCards"));
  $("#statsRole").textContent = R.who;
  R.lanes.forEach(function (s) {
    var c = D.cats[s]; if (!c) return;
    var mx = Math.max.apply(null, c.t), busiest = D.trend_days[c.t.indexOf(mx)];
    var spark = h("div", { class: "spark", role: "img", "aria-label": (NAMES[s] || s) + ": daily articles over the last 7 days, busiest on " + busiest });
    c.t.forEach(function (v, j) { var b = h("i", { class: j === c.t.length - 1 ? "part" : null }); b.style.height = Math.max(4, v / mx * 100) + "%"; spark.appendChild(b); });
    lc.appendChild(h("div", { class: "lane" }, [
      h("span", { class: "cat", "data-c": s }, [NAMES[s] || s]),
      h("div", { class: "n tnum" }, [cap(approx(sum(c.t))), h("small", {}, ["articles this week"])]),
      spark,
      h("div", { class: "lfoot" }, [cap(approx(c.a)) + " all time · busiest day " + busiest])
    ]));
  });
  var list = Object.keys(D.cats).map(function (s) { return [s, sum(D.cats[s].t)]; }).sort(function (a, b) { return b[1] - a[1]; }).slice(0, 10);
  var top = list[0][1], rk = clear($("#rank"));
  list.forEach(function (r) {
    var mine = R.lanes.indexOf(r[0]) > -1, bar = h("i"); bar.style.width = (r[1] / top * 100).toFixed(1) + "%";
    rk.appendChild(h("li", { class: mine ? "mine" : null }, [h("span", { class: "nm" }, [NAMES[r[0]] || r[0]]), h("span", { class: "bar" }, [bar]), h("em", { class: "tnum" }, [plus(r[1])])]));
  });
}
function renderHours() {
  if (!D) return;
  var hr = D.hourly, mx = Math.max.apply(null, hr.map(function (p) { return p[1]; })), box = clear($("#hours"));
  hr.forEach(function (p, i) { var b = h("i", { class: i >= hr.length - 24 ? "last24" : null }); b.style.height = (p[1] / mx * 100).toFixed(1) + "%"; box.appendChild(b); });
  var M = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
  function lab(s) { var d = new Date(s + ":00Z"); return M[d.getUTCMonth()] + " " + d.getUTCDate() + ", " + ("0" + d.getUTCHours()).slice(-2) + ":00"; }
  $("#hStart").textContent = lab(hr[0][0]); $("#hEnd").textContent = lab(hr[hr.length - 1][0]);
}
function renderRecap() {
  if (!D) return;
  var R = ROLES[role], p = clear($("#recap"));
  p.appendChild(document.createTextNode("In the last 72 hours alone we read "));
  p.appendChild(h("b", {}, [K.last72])); p.appendChild(document.createTextNode(" articles. Your three lanes moved: "));
  R.lanes.forEach(function (s, i) { if (i) p.appendChild(document.createTextNode(", ")); p.appendChild(h("b", {}, [(NAMES[s] || s) + " " + approx(week7(s))])); });
  p.appendChild(document.createTextNode(". Your brief kept fifteen stories, three a day, and one thing to try each morning."));
}

/* ---------- streak: opt-in, a free freeze day, pauses never resets ---------- */
function triedDays() { try { var d = JSON.parse(store.get("mb_days") || "[]"); return Array.isArray(d) ? d : []; } catch (e) { return []; } }
var streakOn = $("#streakOn");
streakOn.checked = store.get("mb_streak") === "1";
streakOn.addEventListener("change", function () { store.set("mb_streak", streakOn.checked ? "1" : "0"); renderWeek(); });
function renderWeek() {
  var w = clear($("#week")), now = new Date(), dow = (now.getDay() + 6) % 7, mon = new Date(now), names = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
  mon.setDate(now.getDate() - dow);
  var days = triedDays(), frozen = -1, tried = 0;
  for (var i = 0; i < 7; i++) {
    var d = new Date(mon); d.setDate(mon.getDate() + i);
    var key = d.getFullYear() + "-" + ("0" + (d.getMonth() + 1)).slice(-2) + "-" + ("0" + d.getDate()).slice(-2);
    var done = days.indexOf(key) > -1, cls = [];
    if (i > 4) cls.push("rest");
    if (done && i < 5) tried++;
    if (done) cls.push("done");
    else if (i < 5 && i < dow && frozen < 0 && streakOn.checked) { frozen = i; cls.push("frozen"); }
    if (i === dow) cls.push("today");
    w.appendChild(h("li", { class: cls.join(" ") || null }, [h("b", {}, [names[i]]), i > 4 ? "rest" : done ? "tried" : i === frozen ? "freeze" : String(d.getDate())]));
  }
  w.classList.toggle("off", !streakOn.checked);
  $("#streakTxt").textContent = streakOn.checked
    ? "Streak: " + tried + " weekday" + (tried === 1 ? "" : "s") + " tried this week. Freeze day: " + (frozen > -1 ? "used on " + names[frozen] + "." : "still free.") + " It waits for you; it never resets."
    : "Turn it on, then tap \"I tried it\" on your try-today card.";
}

/* ---------- your alien levels up ---------- */
var LEVELS = [
  [0, "Listener", "Your alien, your colour, your name badge"],
  [3, "Tuned in", "Glowing antenna tips (new art coming)"],
  [10, "Regular", "A chest badge (new art coming)"],
  [25, "Insider", "A cape (new art coming)"],
  [50, "Signal", "A second colourway"]
];
var ALIEN_IMG = { blue: "img/alien-blue.png", purple: "img/alien-purple.png" };
function alienPrefs() { try { var a = JSON.parse(store.get("mb_alien") || "{}"); return { colour: ALIEN_IMG[a.colour] ? a.colour : "blue", name: typeof a.name === "string" ? a.name.slice(0, 24) : "" }; } catch (e) { return { colour: "blue", name: "" }; } }
function xp() { var l = parseInt(store.get("mb_listens") || "0", 10); return (isFinite(l) ? l : 0) + 2 * triedDays().length; }
function levelOf(p) { var L = 0; LEVELS.forEach(function (x, i) { if (p >= x[0]) L = i; }); return L; }
function earnListen() {
  if (listenedThisLoad) return;
  listenedThisLoad = true;
  var l = parseInt(store.get("mb_listens") || "0", 10); store.set("mb_listens", String((isFinite(l) ? l : 0) + 1));
  renderLevels();
}
function renderLevels() {
  var p = xp(), L = levelOf(p), a = alienPrefs(), steps = clear($("#lvlSteps"));
  $("#lvlImg").setAttribute("src", ALIEN_IMG[a.colour]);
  $("#lvlImg").setAttribute("alt", "Your alien: a flat, pastel " + a.colour + " alien with two antennas");
  $("#lvlName").textContent = a.name || "You";
  $("#lvlTitle").textContent = "Level " + (L + 1) + " · " + LEVELS[L][1];
  LEVELS.forEach(function (x, i) {
    steps.appendChild(h("li", { class: i <= L ? "got" : i === L + 1 ? "next" : null }, [h("i", {}, [String(i + 1)]), h("span", {}, [h("b", {}, [x[1] + ": "]), x[2]]), h("em", {}, [x[0] + " pts"])]));
  });
  var nx = LEVELS[L + 1], pct = nx ? (p - LEVELS[L][0]) / (nx[0] - LEVELS[L][0]) * 100 : 100;
  $("#xpFill").style.width = Math.max(4, Math.min(100, pct)) + "%";
  $("#xpTxt").textContent = p + " point" + (p === 1 ? "" : "s") + ". " + (nx ? (nx[0] - p) + " more to level " + (L + 2) + ": " + nx[2].replace(/ \(new art coming\)/, "") + "." : "Top level. Thank you for listening.") + (p === 0 ? " Press play to earn your first." : "");
}

/* ---------- sign-up: email first, optional profile, then the welcome gift ---------- */
var API = "https://acp9reat3l.execute-api.us-east-1.amazonaws.com/signal/request-link";
var SITE = "siagentsignal.com";
var LANDING_RE = /^\/[A-Za-z0-9._~!$&'()*+,;=:@%\/-]{0,199}$/;   // same shape the API accepts
var EMAIL_RE = /^[^\s@]+@[^\s@.]+(\.[^\s@.]+)*\.[A-Za-z]{2,}$/;
function payload(email, hp, profile) {
  // The request-link schema is strict: only email, hp, site, landing_path, tz, query, profile are sent.
  var b = { email: email, hp: hp || "", site: SITE };
  if (LANDING_RE.test(location.pathname)) b.landing_path = location.pathname;
  try { var tz = Intl.DateTimeFormat().resolvedOptions().timeZone; if (tz && tz.length <= 40) b.tz = tz; } catch (e) { /* no zone: the API falls back */ }
  var q = location.search;
  if (q && q.length <= 2048 && /[?&](utm_[a-z]+|ref)=/i.test(q)) b.query = q;   // campaign attribution only
  if (profile) b.profile = profile;
  return b;
}
function post(body) {
  var ctl = window.AbortController ? new AbortController() : null, timer = ctl ? window.setTimeout(function () { ctl.abort(); }, 15000) : 0;
  return fetch(API, { method: "POST", mode: "cors", credentials: "omit", cache: "no-store", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body), signal: ctl ? ctl.signal : undefined })
    .then(function (r) { return r.json().catch(function () { return {}; }).then(function (j) { window.clearTimeout(timer); return { status: r.status, code: j && j.error }; }); },
          function () { window.clearTimeout(timer); return { status: 0, code: "network" }; });
}
function errText(res) {
  var s = res.status, c = res.code;
  if (s === 400 && c === "invalid_email") return "That email address doesn't look right. Check it for a typo?";
  if (s === 400 && c === "invalid_profile") return "We couldn't save that. Letters, spaces, hyphens and apostrophes work best in a name.";
  if (s === 400) return "Something in the form didn't go through. Please try again.";
  if (s === 415) return "Your browser sent the form in a format we can't read. Refresh the page and try again.";
  if (s === 429) return "Lots of sign-ups from your network just now. Wait a minute, then try again.";
  if (s === 403) return "Sign-up only works on our own site. Open siagentsignal.com and try again.";
  if (s >= 500) return "Our sign-up desk hit a snag. Please try again in a moment.";
  return "We couldn't reach the sign-up desk. Check your connection and try again.";
}
function validEmail(v) { return v.length <= 254 && EMAIL_RE.test(v); }

$$(".js-join").forEach(function (form, n) {
  var em = form.querySelector('input[type="email"]'), hp = form.querySelector('input[name="website"]'), err = $(".js-err", form);
  var btn = form.querySelector('button[type="submit"]'), flow = $(".js-flow", form.parentNode), busy = false;
  em.addEventListener("blur", function () {   // inline validation on blur, never only on submit
    var v = em.value.trim();
    if (v && !validEmail(v)) { err.textContent = "That email address doesn't look right yet."; em.setAttribute("aria-invalid", "true"); }
    else { err.textContent = ""; em.removeAttribute("aria-invalid"); }
  });
  em.addEventListener("input", function () { if (em.getAttribute("aria-invalid") && validEmail(em.value.trim())) { err.textContent = ""; em.removeAttribute("aria-invalid"); } });
  form.addEventListener("submit", function (e) {
    e.preventDefault();
    if (busy) return;
    var v = em.value.trim();
    if (!validEmail(v)) { err.textContent = "Please enter your email address, like name@example.com."; em.setAttribute("aria-invalid", "true"); em.focus(); return; }
    busy = true; btn.disabled = true; var label = btn.textContent; btn.textContent = "Sending…"; err.textContent = "";
    post(payload(v, hp ? hp.value : "")).then(function (res) {
      busy = false; btn.disabled = false; btn.textContent = label;
      if (res.status === 200) { form.hidden = true; stepProfile(flow, v, n); return; }
      err.textContent = errText(res);
      if (res.code === "invalid_email") { em.setAttribute("aria-invalid", "true"); em.focus(); }
    });
  });
});

function stepProfile(flow, email, n) {
  flow.hidden = false; clear(flow);
  var head = h("h3", { tabindex: "-1" }, ["You're in. Make it yours?"]);
  var name = h("input", { id: "nm" + n, name: "name", type: "text", autocomplete: "given-name", maxlength: "40" });
  var sel = h("select", { id: "rl" + n, class: "js-role-select", name: "role" }, [h("option", { value: "" }, ["Choose from the list"])].concat(ORDER.map(function (k) { return h("option", { value: k }, [ROLES[k].label]); })));
  if (store.get("mb_role")) sel.value = role;
  var cad = ["daily", "weekly"].map(function (c) {
    return h("label", { class: "chk" }, [h("input", { type: "radio", name: "cadence" + n, value: c }), h("span", {}, [c === "daily" ? "Every weekday" : "Weekly recap"])]);
  });
  var perr = h("p", { class: "err", role: "alert" });
  var save = h("button", { class: "btn sm", type: "submit" }, ["Save and pick my gift"]);
  var skip = h("button", { class: "notnow", type: "button" }, ["Not now"]);
  var f = h("form", { novalidate: true }, [
    h("div", { class: "f-grid" }, [
      h("div", {}, [h("label", { for: "nm" + n }, ["First name"]), name]),
      h("div", {}, [h("label", { for: "rl" + n }, ["Your role"]), sel]),
      h("fieldset", { class: "seg-pick f-full" }, [h("legend", { class: "f-l" }, ["How often"])].concat(cad))
    ]),
    perr,
    h("div", { class: "f-actions" }, [save, skip])
  ]);
  flow.appendChild(h("p", { class: "ok-line", role: "status" }, [h("span", {}, ["Check your inbox: we sent a link to confirm ", h("b", {}, [email]), ". Tap it to start your free brief."])]));
  flow.appendChild(head);
  flow.appendChild(h("p", { class: "s" }, ["All optional. Skip anything."]));
  flow.appendChild(f);
  head.focus();
  function next(saved) {
    var nm = name.value.trim();
    if (nm) { var a = alienPrefs(); a.name = nm.slice(0, 24); store.set("mb_alien", JSON.stringify(a)); renderLevels(); }
    if (sel.value && ROLES[sel.value]) setRole(sel.value, true);
    stepGift(flow, n, saved);
  }
  skip.addEventListener("click", function () { next(false); });
  f.addEventListener("submit", function (e) {
    e.preventDefault();
    var prof = {}, nm = name.value.trim(), c = f.querySelector('input[name="cadence' + n + '"]:checked');
    if (nm) prof.name = nm;
    if (sel.value && ROLES[sel.value]) prof.role = ROLES[sel.value].label;
    if (c) prof.cadence = c.value;
    if (!Object.keys(prof).length) { next(false); return; }
    if (/[<>]/.test(nm)) { perr.textContent = "Please leave out < and > in your name."; return; }
    save.disabled = true; perr.textContent = "";
    post(payload(email, "", prof)).then(function (res) {
      save.disabled = false;
      if (res.status === 200) next(true);
      else perr.textContent = errText(res);
    });
  });
}

var GIFTS = [
  { id: "alien", t: "Your own alien", now: true, img: "img/alien-blue.png", d: "Your colour, your name on a badge. A profile picture that levels up." },
  { id: "wall", t: "Alien-crew wallpaper pack", now: true, img: "img/alien-purple-lying.png", d: "Phone and desktop sizes." },
  { id: "song", t: "Your theme song", now: false, ic: "i-note", d: "An original track with your name in it. Yours once, to keep." },
  { id: "audio", t: "A 3-minute audio brief", now: false, ic: "i-wave", d: "On a topic you pick, in our broadcast voice." },
  { id: "chapter", t: "A free book chapter", now: false, ic: "i-book", d: "Your pick from the 21-book library." }
];
function stepGift(flow, n, saved) {
  clear(flow);
  var head = h("h3", { tabindex: "-1" }, ["Pick your welcome gift."]);
  var out = h("div", { class: "gift-out", "aria-live": "polite" });
  var row = h("div", { class: "snap gift-row", role: "radiogroup", "aria-label": "Welcome gifts", tabindex: "-1" });
  GIFTS.forEach(function (g) {
    var inp = h("input", { type: "radio", name: "gift" + n, value: g.id });
    inp.addEventListener("change", function () { store.set("mb_gift", g.id); renderGift(out, g, n); });
    var art = h("span", { class: "art" }, [g.img ? h("img", { src: g.img, alt: "", height: "70" }) : icon(g.ic)]);
    row.appendChild(h("label", { class: "gcard" }, [inp, h("span", { class: "gc" }, [art, h("b", {}, [g.t]), h("span", { class: "when " + (g.now ? "now" : "made") }, [g.now ? "Instant" : "Made for you"]), h("span", { class: "d" }, [g.d])])]));
  });
  if (saved) flow.appendChild(h("p", { class: "ok-line", role: "status" }, [h("span", {}, ["Saved. We sent you a fresh confirm link, so tap the newest email."])]));
  flow.appendChild(head);
  flow.appendChild(h("p", { class: "s" }, ["One now, on us. Every extra newsletter you join later unlocks another, like stickers."]));
  flow.appendChild(row);
  flow.appendChild(out);
  flow.appendChild(h("p", { class: "unlocks" }, ["At 1,000 members, a bonus drop for everyone. At 10,000, a bigger one. No random prizes: every drop goes to every member."]));
  flow.appendChild(h("div", { class: "f-actions" }, [h("a", { class: "btn sm", href: "#demo" }, ["Open my Monday"]), h("a", { class: "notnow", href: "#prices" }, ["See Pro, $7.99 founding"])]));
  head.focus();
}

/* the instant gifts are made right here, on this device */
var imgCache = {};
function loadImg(src) {
  if (!imgCache[src]) imgCache[src] = new Promise(function (ok, no) { var i = new Image(); i.onload = function () { ok(i); }; i.onerror = no; i.src = src; });
  return imgCache[src];
}
function fontsReady() { return document.fonts && document.fonts.ready ? document.fonts.ready.catch(function () {}) : Promise.resolve(); }
function rr(ctx, x, y, w, hh, r) { ctx.beginPath(); ctx.moveTo(x + r, y); ctx.arcTo(x + w, y, x + w, y + hh, r); ctx.arcTo(x + w, y + hh, x, y + hh, r); ctx.arcTo(x, y + hh, x, y, r); ctx.arcTo(x, y, x + w, y, r); ctx.closePath(); }
function fitText(ctx, s, max) { if (ctx.measureText(s).width <= max) return s; while (s.length > 1 && ctx.measureText(s + "…").width > max) s = s.slice(0, -1); return s + "…"; }
function drawAlien(a) {
  return Promise.all([loadImg(ALIEN_IMG[a.colour]), fontsReady()]).then(function (r) {
    var img = r[0], c = document.createElement("canvas"); c.width = 720; c.height = 560;
    var x = c.getContext("2d"); x.imageSmoothingQuality = "high";
    x.fillStyle = "#e3eefd"; x.fillRect(0, 0, c.width, c.height);
    var hh = 460, w = img.width * hh / img.height; x.drawImage(img, 48, (c.height - hh) / 2, w, hh);
    var bx = 48 + w + 34, bw = c.width - bx - 40;
    rr(x, bx, 200, bw, 150, 22); x.fillStyle = "#ffffff"; x.fill(); x.lineWidth = 5; x.strokeStyle = "#1a5fd0"; x.stroke();
    x.fillStyle = "#10141c"; x.font = "800 40px Figtree, system-ui, sans-serif"; x.textBaseline = "alphabetic";
    x.fillText(fitText(x, a.name || "You", bw - 48), bx + 24, 268);
    x.fillStyle = "#0f4aa8"; x.font = "700 24px Figtree, system-ui, sans-serif";
    x.fillText(fitText(x, "Level " + (levelOf(xp()) + 1) + " · " + LEVELS[levelOf(xp())][1], bw - 48), bx + 24, 314);
    return c;
  });
}
function drawWall(kind) {
  var src = ["img/alien-blue.png", "img/alien-purple.png", "img/alien-white.png", "img/alien-purple-lying.png"];
  return Promise.all(src.map(loadImg)).then(function (im) {
    var c = document.createElement("canvas"), phone = kind === "phone";
    c.width = phone ? 1080 : 1920; c.height = phone ? 1920 : 1080;
    var x = c.getContext("2d"); x.imageSmoothingQuality = "high";
    x.fillStyle = "#e3eefd"; x.fillRect(0, 0, c.width, c.height);
    x.fillStyle = "#f3f7fd"; x.fillRect(0, phone ? 1180 : 640, c.width, c.height);
    var s = 1.5;
    function put(i, cx, by) { var w = im[i].width * s, hh = im[i].height * s; x.drawImage(im[i], cx - w / 2, by - hh, w, hh); }
    if (phone) { put(0, 250, 1500); put(1, 540, 1470); put(2, 830, 1500); put(3, 540, 1840); }
    else { put(0, 1140, 960); put(1, 1400, 930); put(2, 1660, 960); put(3, 520, 1000); }
    return c;
  });
}
function saveCanvas(c, file, status) {
  try {
    c.toBlob(function (b) {
      if (!b) { status.textContent = "Couldn't make the file here. Long-press or right-click the picture to save it."; return; }
      var url = URL.createObjectURL(b), a = h("a", { href: url, download: file });
      document.body.appendChild(a); a.click(); a.remove();
      window.setTimeout(function () { URL.revokeObjectURL(url); }, 5000);
      status.textContent = "Saved: " + file + ".";
    }, "image/png");
  } catch (e) { status.textContent = "Your browser blocked the download here. Long-press or right-click the picture to save it."; }
}
function preview(c, maxH, alt) {
  var i = h("img", { alt: alt });
  try { i.src = c.toDataURL("image/png"); } catch (e) { return null; }
  i.style.height = maxH + "px"; return i;
}
function renderGift(out, g, n) {
  clear(out);
  if (g.id === "alien") {
    var a = alienPrefs(), status = h("p", { class: "small", role: "status" });
    var img = h("img", { src: ALIEN_IMG[a.colour], alt: "", width: "169", height: "273" });
    var bName = h("b", {}, [a.name || "You"]);
    var nameIn = h("input", { type: "text", id: "an" + n, maxlength: "24", autocomplete: "given-name", value: a.name });
    function upd() { a.name = nameIn.value.trim().slice(0, 24); bName.textContent = a.name || "You"; img.setAttribute("src", ALIEN_IMG[a.colour]); store.set("mb_alien", JSON.stringify(a)); renderLevels(); }
    nameIn.addEventListener("input", upd);
    var colours = h("div", { class: "seg-pick", role: "radiogroup", "aria-label": "Colour" }, ["blue", "purple"].map(function (col) {
      var r = h("input", { type: "radio", name: "acol" + n, value: col }); r.checked = a.colour === col;
      r.addEventListener("change", function () { a.colour = col; upd(); });
      return h("label", { class: "chk" }, [r, h("span", {}, [cap(col)])]);
    }));
    var dl = h("button", { class: "btn sm", type: "button" }, ["Download my alien"]);
    dl.addEventListener("click", function () { drawAlien(a).then(function (c) { saveCanvas(c, "my-alien.png", status); }, function () { status.textContent = "Couldn't draw your alien. Try again?"; }); });
    out.appendChild(h("h4", {}, ["Your alien, ready now."]));
    out.appendChild(h("p", {}, ["Pick a colour and the name for its badge, then save it as your profile picture. It levels up as you listen."]));
    out.appendChild(h("div", { class: "me" }, [
      h("div", { class: "me-fig" }, [img, h("span", { class: "badge" }, [bName, h("span", {}, ["Founding member"])])]),
      h("div", { class: "me-ctl" }, [colours, h("div", {}, [h("label", { class: "f-l", for: "an" + n }, ["Name on the badge"]), nameIn]), dl, status])
    ]));
  } else if (g.id === "wall") {
    var st = h("p", { class: "small", role: "status" }), prev = h("div", { class: "wall-prev" });
    var bp = h("button", { class: "btn sm", type: "button" }, ["Phone wallpaper"]), bd = h("button", { class: "btn sm line", type: "button" }, ["Desktop wallpaper"]);
    bp.addEventListener("click", function () { drawWall("phone").then(function (c) { saveCanvas(c, "alien-crew-phone.png", st); }); });
    bd.addEventListener("click", function () { drawWall("desktop").then(function (c) { saveCanvas(c, "alien-crew-desktop.png", st); }); });
    out.appendChild(h("h4", {}, ["The alien-crew wallpaper pack, ready now."]));
    out.appendChild(h("p", {}, ["Two sizes, made on your device. Tap one to save it."]));
    out.appendChild(prev);
    out.appendChild(h("div", { class: "f-actions" }, [bp, bd]));
    out.appendChild(st);
    Promise.all([drawWall("phone"), drawWall("desktop")]).then(function (cs) {
      var p1 = preview(cs[0], 150, "Phone wallpaper preview: the alien crew on soft blue"), p2 = preview(cs[1], 84, "Desktop wallpaper preview: the alien crew on soft blue");
      if (p1) prev.appendChild(p1); if (p2) prev.appendChild(p2);
    }, function () { /* previews are optional */ });
  } else {
    out.appendChild(h("h4", {}, [g.t + ": made for you, so not instant."]));
    out.appendChild(h("p", {}, ["During the Founders' Preview we make these by hand. Your pick is saved on this device, and every member hears by email when made-to-order gifts open."]));
    out.appendChild(h("p", {}, ["Want something right now as well? Your own alien and the wallpaper pack are instant."]));
  }
}

/* ---------- à la carte: honest maths ---------- */
var lanesIn = $("#lanes");
function alc() {
  var n = +lanesIn.value, p = n <= 3 ? 9.99 : Math.min(24.99, 9.99 + 2.99 * (n - 3)), o = clear($("#alcOut"));
  $("#lanesN").textContent = n;
  o.appendChild(h("b", {}, ["$" + p.toFixed(2)]));
  var t1 = "/mo for " + n + " lane" + (n === 1 ? "" : "s") + (n < 3 ? " (the 3-lane price)" : "") + (n > 3 && p >= 24.99 ? ", capped" : "") + ". ";
  var t2 = n < 4 ? "" : p > 14.99 ? "MAX founding, $14.99/mo for every lane plus audio and deep dives, costs less." : "MAX founding is $14.99/mo for every lane, plus audio and deep dives.";
  o.appendChild(document.createTextNode(t1 + t2));
}
lanesIn.addEventListener("input", alc); alc();

/* ---------- checkout preview: one screen, four lines, fixed order (no mascot here) ---------- */
var INSIDER = "Reservation holders are insiders: first access to new features, products and prices, sneak peeks by email, and notes from the build room.";
var TIERS = {
  pro: { n: "Pro", get: ["Your role brief every weekday", "The full hourly radio-style brief", "Three lanes full text, full rumor and fact detail"], list: "$9.99/mo", found: "$7.99/mo", yr: "$99/yr at launch, $79/yr founding", save: "Nothing renews or converts on its own. At launch we email you a link: opt in and your deposit counts toward your first payment, or do nothing and it is refunded in full.", dep: "$9.99" },
  max: { n: "MAX", get: ["Everything in Pro, every lane full text", "Morning and evening deep dives (learning, no news)", "All 24 white papers and the member forum"], list: "$19.99/mo", found: "$14.99/mo", yr: "$199/yr at launch, $149/yr founding", save: "Nothing renews or converts on its own. At launch we email you a link: opt in and your deposit counts toward your first payment, or do nothing and it is refunded in full.", dep: "$29" },
  ultra: { n: "Ultra", get: ["Everything in MAX", "The 21-book library and training by job title", "The full Defense Playbook and the insider circle"], list: "$99.99/mo", found: "$69.99/mo", yr: "$999/yr at launch, $699/yr founding", save: "Nothing renews or converts on its own. At launch we email you a link: opt in and your deposit counts toward your first payment, or do nothing and it is refunded in full.", dep: "$99" }
};
var dlg = $("#checkout"), lastBtn = null;
function openDlg() { if (dlg.showModal) dlg.showModal(); else dlg.setAttribute("open", ""); }
function closeDlg() { if (dlg.close) dlg.close(); else dlg.removeAttribute("open"); }
function coFill(T) {
  var g = clear($("#coGet")); T.get.forEach(function (x) { g.appendChild(h("li", {}, [x])); });
  $("#coStatus").textContent = "";
}
$$(".js-reserve").forEach(function (b) {
  b.addEventListener("click", function () {
    var T = TIERS[b.getAttribute("data-tier")]; lastBtn = b; coFill(T);
    $("#co-h").textContent = "Reserve " + T.n;
    var pr = clear($("#coPrice"));
    pr.appendChild(document.createTextNode("Launch price " + T.list + " · founding ")); pr.appendChild(h("b", {}, [T.found]));
    pr.appendChild(document.createTextNode(", yours if you opt in at launch, kept while you stay subscribed")); pr.appendChild(h("br")); pr.appendChild(h("span", { class: "small" }, [T.yr]));
    $("#coSave").textContent = T.save;
    $("#coPay").textContent = "Reserve for " + T.dep;
    $("#coRefund").textContent = "4. Refundable in full until you opt in at launch. This " + T.dep + " deposit holds your place at the founding price; it is not a subscription. The price shown is the price you pay at checkout.";
    $("#coInsider").textContent = INSIDER; $("#coInsider").hidden = false;
    openDlg();
  });
});
$(".js-buy").addEventListener("click", function () {
  lastBtn = this; coFill({ get: ["100-page PDF", "The full audio version", "Delivered right away"] });
  $("#co-h").textContent = "Buy the AI-Era Defense Playbook";
  clear($("#coPrice")).appendChild(h("b", {}, ["$49"])); $("#coPrice").appendChild(document.createTextNode(", one-time purchase, all-in"));
  $("#coSave").textContent = "The download link works for 30 days, up to 10 downloads.";
  $("#coPay").textContent = "Buy for $49";
  $("#coRefund").textContent = "4. A digital download: we email the link after payment, usually within minutes. If it fails or is not as described, write within 14 days for a fix or a full refund.";
  $("#coInsider").hidden = true;
  openDlg();
});
$("#coPay").addEventListener("click", function () { /* pay-wired */ var u = lastBtn && lastBtn.getAttribute("data-pay-url"); if (!u) { $("#coStatus").textContent = "Checkout is not open yet. Please try again shortly."; return; } $("#coStatus").textContent = "Opening secure checkout..."; window.location.assign(u); });
$("#coClose").addEventListener("click", closeDlg);
dlg.addEventListener("close", function () { if (lastBtn) lastBtn.focus(); });

/* ---------- boot ---------- */
setRole(role, false); renderHours(); renderWeek(); renderLevels();
})();
