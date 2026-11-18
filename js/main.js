// Eye-Tracking Reading Explorer
// ------------------------------------------------------------------
// Runs Mia Davis's published Observable notebook (@miadavis/untitled/4)
// with the official Observable Runtime and places each cell's output
// into the website layout. The notebook's cell code is not modified:
// data loading, processing, and every chart come from the notebook.

import {Runtime, Inspector} from "./vendor/observablehq-runtime-5.9.9.js";

// ---- Notebook source ----------------------------------------------------
// Pinned to the published version so the site stays reproducible.
// To follow the latest published version instead, drop "@" + VERSION.
const NOTEBOOK = "@miadavis/untitled/4";
const VERSION = 213;
const REMOTE_MODULE = `https://api.observablehq.com/${NOTEBOOK}@${VERSION}.js?v=4`;
// Archived copy of the same compiled module (fallback if the API is unreachable).
// Its file attachments still point at Observable's file CDN.
const LOCAL_MODULE = new URL(`../notebook/miadavis-untitled-4@${VERSION}.js`, import.meta.url).href;

// ---- Helpers ------------------------------------------------------------
const $ = (sel, root = document) => root.querySelector(sel);
const fmtInt = new Intl.NumberFormat("en-US");
const DIFFICULTY = {Adv: "Advanced", Ele: "Elementary"};

function setText(root, key, value) {
  const el = root.querySelector(`[data-k="${key}"]`);
  if (el) el.textContent = value ?? "–";
}

// Slots in index.html are keyed by notebook cell name: <div data-cell="fullHeatmap">.
const slots = new Map(
  [...document.querySelectorAll("[data-cell]")].map(el => [el.dataset.cell, el])
);

// Observer that renders a cell into its slot with Observable's Inspector,
// adding loading / error states for the website.
function slotObserver(name, el) {
  const inspector = new Inspector(el);
  return {
    pending() {
      el.classList.add("is-loading");
      inspector.pending();
    },
    fulfilled(value, n) {
      el.classList.remove("is-loading", "has-error");
      inspector.fulfilled(value, n);
    },
    rejected(error, n) {
      el.classList.remove("is-loading");
      el.classList.add("has-error");
      inspector.rejected(error, n);
      console.error(`Cell "${name}" failed:`, error);
    }
  };
}

// ---- Page-level status ---------------------------------------------------
const loadStatus = $("#load-status");
const pendingData = new Set(["fullCatalog", "fullSummary", "fullReaderIndex"]);
const dataErrors = [];

function updateLoadStatus() {
  if (dataErrors.length) {
    loadStatus.className = "load-status is-error";
    loadStatus.textContent = `Some notebook data could not be loaded: ${dataErrors.join("; ")}`;
  } else if (pendingData.size) {
    loadStatus.className = "load-status";
    loadStatus.textContent = "Loading notebook data from Observable…";
  } else {
    loadStatus.className = "load-status is-ready";
    loadStatus.textContent = `Notebook version ${VERSION} loaded. All data is served from Observable.`;
  }
}

function dataObserver(name, onValue) {
  return {
    pending() {},
    fulfilled(value) {
      pendingData.delete(name);
      onValue?.(value);
      updateLoadStatus();
    },
    rejected(error) {
      pendingData.delete(name);
      dataErrors.push(`${name} (${error?.message ?? error})`);
      updateLoadStatus();
      console.error(`Cell "${name}" failed:`, error);
    }
  };
}

const glance = key => $(`[data-stat="${key}"]`);

// Observers for named cells that have no visual slot but feed page text.
const extraObservers = {
  fullCatalog: () => dataObserver("fullCatalog", v => (glance("trials").textContent = fmtInt.format(v.length))),
  fullSummary: () => dataObserver("fullSummary", v => (glance("conditions").textContent = fmtInt.format(v.length))),
  fullReaderIndex: () => dataObserver("fullReaderIndex", v => (glance("participants").textContent = fmtInt.format(v.length))),

  fullReaderData: () => {
    const line = $('[data-status="fullReaderData"]');
    const stats = $("#reader-stats");
    return {
      pending() {
        line.className = "status-line is-loading";
        line.textContent = "Loading the selected participant's eye-tracking data…";
        stats.classList.add("is-stale");
      },
      fulfilled(v) {
        line.className = "status-line";
        line.textContent = "";
        stats.classList.remove("is-stale");
      },
      rejected(e) {
        line.className = "status-line is-error";
        line.textContent = `Participant data could not be loaded: ${e?.message ?? e}`;
      }
    };
  },

  fullTrial: () => {
    const meta = $("#trial-meta");
    return {
      pending() { meta.classList.add("is-stale"); },
      fulfilled(t) {
        meta.classList.remove("is-stale");
        const m = t?.meta;
        if (!m) return;
        setText(meta, "article", `${m.article_title} (article ${m.article_id})`);
        setText(meta, "paragraph_id", m.paragraph_id);
        setText(meta, "condition", m.condition);
        setText(meta, "difficulty_level", DIFFICULTY[m.difficulty_level] ?? m.difficulty_level);
        setText(meta, "n_words", fmtInt.format(m.n_words));
        setText(meta, "n_fixations", fmtInt.format(m.n_fixations));
        setText(meta, "PARAGRAPH_RT", Number.isFinite(+m.PARAGRAPH_RT) ? `${(m.PARAGRAPH_RT / 1000).toFixed(1)} s` : "–");
        setText(meta, "is_correct", m.is_correct === true || m.is_correct === "true" ? "Correct" : "Incorrect");
      },
      rejected() { meta.classList.remove("is-stale"); }
    };
  },

  fullConditionFilters: () => ({
    pending() {},
    fulfilled(v) { $("#matched-dimension").textContent = v?.matchedDimension ?? "–"; },
    rejected() {}
  })
};

// Anonymous cells: the markdown headings and Cell 7, which returns
// a participant summary object. Only the summary is shown on the page.
function anonymousObserver() {
  const stats = $("#reader-stats");
  return {
    pending() {},
    fulfilled(v) {
      if (v && typeof v === "object" && "totalTrials" in v && "totalFixations" in v) {
        for (const [k, val] of Object.entries(v)) {
          setText(stats, k, typeof val === "number" ? fmtInt.format(val) : val);
        }
      }
    },
    rejected() {}
  };
}

function observerFor(name) {
  if (name == null) return anonymousObserver();
  if (slots.has(name)) return slotObserver(name, slots.get(name));
  if (extraObservers[name]) return extraObservers[name]();
  return undefined; // computed on demand by the cells that depend on it
}

// ---- Boot -------------------------------------------------------------
async function loadNotebook() {
  try {
    const mod = await import(REMOTE_MODULE);
    return {define: mod.default, source: "Observable API (live)", url: REMOTE_MODULE};
  } catch (error) {
    console.warn("Observable API unavailable, using archived module copy.", error);
    const mod = await import(LOCAL_MODULE);
    return {define: mod.default, source: "archived copy bundled with this site", url: LOCAL_MODULE};
  }
}

async function main() {
  updateLoadStatus();

  let notebook;
  try {
    notebook = await loadNotebook();
  } catch (error) {
    loadStatus.className = "load-status is-error";
    loadStatus.textContent = "The Observable notebook could not be loaded. Check your connection and reload the page.";
    console.error(error);
    return;
  }

  const src = $("#nb-source");
  src.textContent = `Module source: ${notebook.source}. `;
  const a = Object.assign(document.createElement("a"), {href: notebook.url, textContent: "View compiled module", target: "_blank", rel: "noopener"});
  src.append(a);

  const runtime = new Runtime();
  const definedNames = new Set();
  const main = runtime.module(notebook.define, name => {
    if (name) definedNames.add(name);
    return observerFor(name);
  });

  // Cell 4 ("Select a Participant from the Full Dataset") is empty in the
  // published notebook, so `fullReader` is never defined there. Supply that
  // one cell, in the notebook's own style (Inputs.select over the reader
  // index), unless a future notebook version defines it.
  if (!definedNames.has("fullReader")) {
    main.variable(observerFor("viewof fullReader")).define(
      "viewof fullReader",
      ["Inputs", "fullReaderIndex"],
      (Inputs, fullReaderIndex) => {
        const byId = new Map(fullReaderIndex.map(d => [d.participant_id, d]));
        const ids = [...byId.keys()].sort((a, b) => a.localeCompare(b, "en", {numeric: true}));
        return Inputs.select(ids, {
          label: "Select Participant",
          format: id => {
            const d = byId.get(id);
            return `${id} | ${d.n_trials} trials | ${fmtInt.format(d.n_fixations)} fixations`;
          }
        });
      }
    );
    main.variable(observerFor("fullReader")).define(
      "fullReader",
      ["Generators", "viewof fullReader"],
      (Generators, input) => Generators.input(input)
    );
  }
}

main();
