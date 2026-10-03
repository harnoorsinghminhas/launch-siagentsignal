/* SI hourly bulletin: one fetch of the public hourly JSON, many small renderers.
   Source: https://media.theagentsignal.com/ironman/audio/si-preview/hourly/latest.json (CORS *).
   Every node is built with createElement/textContent: no innerHTML, so it runs under
   require-trusted-types-for 'script'. Story links must be https; the audio must come from the media host.
   Markup hooks are data-hr="..." attributes (live, warm, updated, count, dur, audio, stories, ticker, tidbit,
   station, stmeta). If the fetch fails, the page shows its calm "warming up" state instead. */
(function () {
"use strict";

var JSON_URL = "https://media.theagentsignal.com/ironman/audio/si-preview/hourly/latest.json";
var MEDIA = "https://media.theagentsignal.com/";
var REFRESH_MS = 5 * 60 * 1000;
var RETRY_MS = [20000, 60000];
var LABELS = { "CONFIRMED": ["conf", "Confirmed"], "REPORTED": ["rep", "Reported"], "STILL OPEN": ["open", "Still open"] };
var STATIONS = {
  claude: /\b(claude|anthropic)\b/i,
  openai: /\b(openai|chatgpt|gpt-?\d[\w.]*|codex|sora)\b/i,
  gemini: /\b(gemini|google|deepmind)\b/i
};
var state = { data: null, fails: 0, timer: 0, tick: 0 };

function $$(s, r) { return Array.prototype.slice.call((r || document).querySelectorAll(s)); }
function h(tag, attrs, kids) {
  var el = document.createElement(tag);
  if (attrs) Object.keys(attrs).forEach(function (k) {
    var v = attrs[k];
    if (v == null || v === false) return;
    el.setAttribute(k, v === true ? "" : String(v));
  });
  (kids || []).forEach(function (c) {
    if (c == null || c === false) return;
    el.appendChild(typeof c === "string" ? document.createTextNode(c) : c);
  });
  return el;
}
function clear(el) { while (el.firstChild) el.removeChild(el.firstChild); return el; }
function str(v, max) { return typeof v === "string" ? v.replace(/\s+/g, " ").trim().slice(0, max || 300) : ""; }
function httpsUrl(u) { u = str(u, 2000); return /^https:\/\/[^\s"'<>]+$/.test(u) ? u : ""; }
function mmss(s) { s = Math.max(0, Math.round(s)); return Math.floor(s / 60) + ":" + ("0" + (s % 60)).slice(-2); }

/* ---------- validate: no label, no line (a story without a known label is dropped) ---------- */
function item(o, titleKey) {
  if (!o || typeof o !== "object") return null;
  var lab = LABELS[str(o.label, 20).toUpperCase()];
  var title = str(o[titleKey], 240), outlet = str(o.outlet_name || o.outlet, 60);
  if (!lab || !title || !outlet) return null;
  return { lab: lab, title: title, outlet: outlet, url: httpsUrl(o.url), sum: str(o.summary_1line, 240) };
}
function normalize(raw) {
  if (!raw || typeof raw !== "object" || !Array.isArray(raw.stories)) return null;
  var gen = new Date(str(raw.generated_at, 40));
  if (isNaN(gen.getTime())) return null;
  var stories = raw.stories.map(function (o) { return item(o, "title"); }).filter(Boolean).slice(0, 5);
  var ticker = (Array.isArray(raw.ticker) ? raw.ticker : []).map(function (o) { return item(o, "headline"); }).filter(Boolean).slice(0, 12);
  if (!stories.length) return null;
  var audio = httpsUrl(raw.audio_url);
  if (raw.audio_status !== "ok" || audio.indexOf(MEDIA) !== 0 || !/\.mp3$/.test(audio)) audio = "";
  var secs = +raw.audio_seconds;
  return {
    generated: gen, stories: stories, ticker: ticker,
    tidbit: str(raw.tidbit, 280),
    count: str(raw.articles_24h_label, 40),
    audio: audio ? audio + "?v=" + Math.floor(gen.getTime() / 1000) : "",
    secs: secs > 0 && secs < 3600 ? secs : 0
  };
}

/* ---------- small pieces ---------- */
function ago(d) {
  var m = Math.max(0, Math.round((Date.now() - d.getTime()) / 60000));
  if (m < 1) return "just now";
  if (m === 1) return "1 min ago";
  if (m < 180) return m + " min ago";
  var hr = Math.round(m / 60);
  return hr < 48 ? hr + " hours ago" : Math.round(hr / 24) + " days ago";
}
function stamp(lab) { return h("span", { "class": "hr-stamp hr-" + lab[0] }, [lab[1]]); }
function srcLine(it) {
  var who = it.url ? h("a", { href: it.url, target: "_blank", rel: "noopener" }, [it.outlet, h("span", { "class": "hr-sr" }, [" (opens in a new tab)"])]) : it.outlet;
  return h("p", { "class": "hr-src" }, ["Source: ", who]);
}
function storyLi(it) {
  return h("li", { "class": "hr-story" }, [
    h("div", { "class": "hr-top" }, [stamp(it.lab)]),
    h("p", { "class": "hr-h" }, [it.title]),
    it.sum ? h("p", { "class": "hr-sum" }, [it.sum]) : null,
    srcLine(it)
  ]);
}
function pool(d) {
  var seen = {}, out = [];
  d.stories.concat(d.ticker).forEach(function (it) { var k = it.url || it.title; if (!seen[k]) { seen[k] = 1; out.push(it); } });
  return out;
}

/* ---------- renderers ---------- */
function renderStories(ul, d) {
  clear(ul);
  d.stories.forEach(function (it) { ul.appendChild(storyLi(it)); });
}
function renderStation(ul, d) {
  var k = ul.getAttribute("data-st"), list;
  clear(ul);
  if (STATIONS[k]) list = pool(d).filter(function (it) { return STATIONS[k].test(it.title); }).slice(0, 5);
  else list = d.stories;
  if (!list.length) { ul.appendChild(h("li", { "class": "hr-empty" }, ["Nothing on this station in this hour's headlines. Station-only audio and a longer feed are planned."])); return; }
  list.forEach(function (it) { ul.appendChild(storyLi(it)); });
  $$('[data-hr="stmeta"][data-st="' + k + '"]').forEach(function (p) {
    p.textContent = k === "si" || !STATIONS[k] ? (d.count ? d.count.charAt(0).toUpperCase() + d.count.slice(1) + " articles read in the last 24 hours" : "This hour's labelled stories") : list.length + (list.length === 1 ? " headline" : " headlines") + " this hour, filtered from the live bulletin";
  });
}
function renderTicker(box, d) {
  clear(box);
  var items = d.ticker.length ? d.ticker : d.stories;
  var track = h("div", { "class": "hr-tk-track" });
  [false, true].forEach(function (dup) {
    items.forEach(function (it) {
      track.appendChild(h("span", { "class": "hr-tk-i" + (dup ? " hr-tk-dup" : ""), "aria-hidden": dup ? "true" : null }, [
        stamp(it.lab), " " + it.title, h("span", { "class": "hr-tk-o" }, [" · " + it.outlet])
      ]));
    });
  });
  var view = h("div", { "class": "hr-tk-view", role: "region", "aria-label": "Headlines this hour, scrolling", tabindex: "0" }, [track]);
  var btn = h("button", { type: "button", "class": "hr-tk-btn", "aria-pressed": "false" }, ["Pause"]);
  btn.addEventListener("click", function () {
    var p = box.classList.toggle("hr-paused");
    btn.setAttribute("aria-pressed", p ? "true" : "false");
    btn.textContent = p ? "Play" : "Pause";
  });
  box.appendChild(view); box.appendChild(btn);
}
function renderAudio(au, d) {
  if (!d.audio) { au.removeAttribute("src"); return; }
  if (au.getAttribute("src") === d.audio) return;
  if (!au.paused && au.currentTime > 0) return;   // never swap the file under someone who is listening
  au.setAttribute("src", d.audio);
  try { au.load(); } catch (e) { /* older browsers: the new src loads on play */ }
}
function setText(sel, text) { $$(sel).forEach(function (el) { el.textContent = text; }); }

function refreshAgo() {
  var d = state.data; if (!d) return;
  var stale = Date.now() - d.generated.getTime() > 3 * 3600 * 1000;
  $$('[data-hr="updated"]').forEach(function (el) {
    el.textContent = "Updated " + ago(d.generated) + (stale ? ". A fresh one is on its way." : "");
    el.classList.toggle("hr-stale", stale);
    if (el.tagName === "TIME") el.setAttribute("datetime", d.generated.toISOString());
  });
}
function apply(d) {
  state.data = d;
  $$('[data-hr="stories"]').forEach(function (el) { renderStories(el, d); });
  $$('[data-hr="station"]').forEach(function (el) { renderStation(el, d); });
  $$('[data-hr="ticker"]').forEach(function (el) { renderTicker(el, d); });
  $$('[data-hr="audio"]').forEach(function (el) { renderAudio(el, d); });
  $$('[data-hr="audio-wrap"]').forEach(function (el) { el.hidden = !d.audio; });
  setText('[data-hr="dur"]', d.secs ? mmss(d.secs) : "");
  setText('[data-hr="count"]', d.count);
  setText('[data-hr="tidbit"]', d.tidbit);
  $$('[data-hr="tidbit"]').forEach(function (el) { el.hidden = !d.tidbit; });
  $$('[data-hr="warm"]').forEach(function (el) { el.hidden = true; });
  $$('[data-hr="live"]').forEach(function (el) { el.hidden = false; });
  refreshAgo();
  if (!state.tick) state.tick = window.setInterval(refreshAgo, 30000);
  document.dispatchEvent(new CustomEvent("si-hourly", { detail: d }));
}
function showWarm() {
  if (state.data) return;   // keep showing the last good bulletin; its "updated" line keeps counting
  $$('[data-hr="live"]').forEach(function (el) { el.hidden = true; });
  $$('[data-hr="warm"]').forEach(function (el) { el.hidden = false; });
  document.dispatchEvent(new CustomEvent("si-hourly-warm"));
}

/* ---------- fetch + schedule ---------- */
function schedule(ms) { window.clearTimeout(state.timer); state.timer = window.setTimeout(load, ms); }
function load() {
  var ctl = window.AbortController ? new AbortController() : null;
  var t = ctl ? window.setTimeout(function () { ctl.abort(); }, 12000) : 0;
  // A plain GET on purpose: no cache option and no custom headers, because the media host answers a CORS preflight with 403.
  // The file is served with Cache-Control: no-cache, so the browser revalidates it every time anyway.
  fetch(JSON_URL, { mode: "cors", credentials: "omit", signal: ctl ? ctl.signal : undefined })
    .then(function (r) { if (!r.ok) throw new Error("http " + r.status); return r.json(); })
    .then(function (raw) {
      window.clearTimeout(t);
      var d = normalize(raw);
      if (!d) throw new Error("shape");
      state.fails = 0; apply(d); schedule(REFRESH_MS);
    })
    .catch(function () {
      window.clearTimeout(t);
      showWarm();
      schedule(state.fails < RETRY_MS.length ? RETRY_MS[state.fails] : REFRESH_MS);
      state.fails++;
    });
}
document.addEventListener("visibilitychange", function () {
  if (document.visibilityState === "visible") { refreshAgo(); if (state.data && Date.now() - state.data.generated.getTime() > 65 * 60 * 1000) load(); }
});
window.SIHourly = { get data() { return state.data; }, reload: load };
if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", load); else load();
})();
