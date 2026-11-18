// https://observablehq.com/@miadavis/untitled/4@213
function _1(md){return(
md`## Cell 1 (OJS) — Load Full Trial Catalog`
)}

function _fullCatalog(FileAttachment){return(
FileAttachment("onestop_trial_catalog_full.csv").csv({typed: true})
)}

function _3(md){return(
md`## Cell 2 (OJS) — Load Full Condition Summary`
)}

function _fullSummary(FileAttachment){return(
FileAttachment("onestop_condition_summary_full.csv").csv({typed: true})
)}

function _5(md){return(
md`## Cell 3 (OJS) — Load Reader Index`
)}

function _fullReaderIndex(FileAttachment){return(
FileAttachment("onestop_reader_index_full.csv").csv({typed: true})
)}

function _7(md){return(
md`## Cell 4 (OJS) — Select a Participant from the Full Dataset`
)}

function _9(md){return(
md`## Cell 5 (OJS) — Load Participant Data from ZIP Files`
)}

function _fullLoadShard(FileAttachment){return(
async (shard) => {
  switch (Number(shard)) {
    case 0: return FileAttachment("onestop_reader_shard_00.zip").zip();
    case 1: return FileAttachment("onestop_reader_shard_01.zip").zip();
    case 2: return FileAttachment("onestop_reader_shard_02.zip").zip();
    case 3: return FileAttachment("onestop_reader_shard_03.zip").zip();
    case 4: return FileAttachment("onestop_reader_shard_04.zip").zip();
    case 5: return FileAttachment("onestop_reader_shard_05.zip").zip();
    case 6: return FileAttachment("onestop_reader_shard_06.zip").zip();
    case 7: return FileAttachment("onestop_reader_shard_07.zip").zip();
    case 8: return FileAttachment("onestop_reader_shard_08.zip").zip();
    case 9: return FileAttachment("onestop_reader_shard_09.zip").zip();
    case 10: return FileAttachment("onestop_reader_shard_10.zip").zip();
    case 11: return FileAttachment("onestop_reader_shard_11.zip").zip();

    default:
      throw new Error(`Unknown ZIP shard: ${shard}`);
  }
}
)}

function _11(md){return(
md`## Cell 6 (OJS) — Load the Selected Participant's Eye-Tracking Data`
)}

async function _fullReaderData(fullReaderIndex,fullReader,fullLoadShard)
{
  const info = fullReaderIndex.find(
    d => d.participant_id === fullReader
  );

  if (!info) {
    throw new Error("Participant not found in the index.");
  }

  const archive = await fullLoadShard(info.shard);

  return await archive.file(info.entry).json();
}


function _13(md){return(
md`## Cell 7 (OJS) — Verify Participant-Level Fixation Data`
)}

function _14(fullReaderData,fullReader)
{
  const trials = fullReaderData.trials;

  return {
    participant: fullReader,
    totalTrials: trials.length,

    trialsWithFixations: trials.filter(
      t => t.fixations.length > 0
    ).length,

    totalFixations: trials.reduce(
      (sum, t) => sum + t.fixations.length, 0
    ),

    totalWordAreas: trials.reduce(
      (sum, t) => sum + t.areas.length, 0
    ),

    firstTrial: trials[0]?.meta.trial_key
  };
}


function _15(md){return(
md`## Cell 8 (OJS) — Select a Reading Trial`
)}

function _fullTrialKey(Inputs,fullReaderData){return(
Inputs.select(
  fullReaderData.trials.map(t => t.meta.trial_key),
  {
    label: "Select Reading Trial",
    format: key => {
      const t = fullReaderData.trials.find(
        d => d.meta.trial_key === key
      );

      const m = t.meta;

      return `Trial ${m.TRIAL_INDEX} | ${m.reading_goal} | ${m.reading_pass} | ${m.difficulty_level}`;
    }
  }
)
)}

function _17(md){return(
md`## Cell 9 (OJS) — Retrieve the Selected Trial`
)}

function _fullTrial(fullReaderData,fullTrialKey){return(
fullReaderData.trials.find(
  t => t.meta.trial_key === fullTrialKey
)
)}

function _19(md){return(
md`## Cell 10 (OJS) — Extract Word Areas and Fixations`
)}

function _fullAreas(fullTrial){return(
fullTrial.areas.filter(d =>
  [
    d.IA_LEFT,
    d.IA_RIGHT,
    d.IA_TOP,
    d.IA_BOTTOM
  ].every(v => Number.isFinite(Number(v)))
)
)}

function _fullFixes(fullTrial){return(
fullTrial.fixations
  .filter(d =>
    Number.isFinite(Number(d.CURRENT_FIX_X)) &&
    Number.isFinite(Number(d.CURRENT_FIX_Y))
  )
  .sort((a, b) =>
    Number(a.CURRENT_FIX_INDEX) -
    Number(b.CURRENT_FIX_INDEX)
  )
)}

function _22(md){return(
md`## Cell 11 (OJS) — Word-Level Fixation Heatmap`
)}

function _fullHeatmap(fullAreas,html,Plot)
{
  const a = fullAreas;

  if (!a.length) {
    return html`<p>No word areas available for this trial.</p>`;
  }

  const xMin = Math.min(...a.map(d => d.IA_LEFT)) - 30;
  const xMax = Math.max(...a.map(d => d.IA_RIGHT)) + 30;
  const yMin = Math.min(...a.map(d => d.IA_TOP)) - 30;
  const yMax = Math.max(...a.map(d => d.IA_BOTTOM)) + 30;

  return Plot.plot({
    width: 1100,
    height: 550,

    x: {
      domain: [xMin, xMax],
      axis: null
    },

    y: {
      domain: [yMin, yMax],
      reverse: true,
      axis: null
    },

    color: {
      scheme: "YlOrRd",
      legend: true,
      label: "Word Dwell Time (ms)"
    },

    marks: [
      // Draw colored rectangles for word interest areas.
      Plot.rect(a, {
        x1: "IA_LEFT",
        x2: "IA_RIGHT",
        y1: "IA_TOP",
        y2: "IA_BOTTOM",
        fill: d => Number(d.IA_DWELL_TIME) || 0,
        stroke: "#dddddd",
        strokeWidth: 0.5,
        title: d =>
          `${d.IA_LABEL}
Dwell Time: ${d.IA_DWELL_TIME} ms
Fixation Count: ${d.IA_FIXATION_COUNT}`
      }),

      // Display original word labels over the heatmap.
      Plot.text(a, {
        x: d => (d.IA_LEFT + d.IA_RIGHT) / 2,
        y: d => (d.IA_TOP + d.IA_BOTTOM) / 2,
        text: "IA_LABEL",
        fontSize: 12,
        fill: "#222222"
      })
    ]
  });
}


function _24(md){return(
md`## Cell 12 (OJS) — Fixation Scanpath with Duration-Sized Circles`
)}

function _fullScanpath(fullAreas,fullFixes,html,Plot)
{
  const a = fullAreas;
  const f = fullFixes;

  if (!a.length || !f.length) {
    return html`<p>No fixation or word data available.</p>`;
  }

  const xMin = Math.min(...a.map(d => d.IA_LEFT)) - 30;
  const xMax = Math.max(...a.map(d => d.IA_RIGHT)) + 30;
  const yMin = Math.min(...a.map(d => d.IA_TOP)) - 30;
  const yMax = Math.max(...a.map(d => d.IA_BOTTOM)) + 30;

  return Plot.plot({
    width: 1100,
    height: 550,

    x: {
      domain: [xMin, xMax],
      axis: null
    },

    y: {
      domain: [yMin, yMax],
      reverse: true,
      axis: null
    },

    r: {
      range: [3, 13]
    },

    marks: [
      // Display words in their original spatial positions.
      Plot.text(a, {
        x: d => (d.IA_LEFT + d.IA_RIGHT) / 2,
        y: d => (d.IA_TOP + d.IA_BOTTOM) / 2,
        text: "IA_LABEL",
        fontSize: 12,
        fill: "#777777"
      }),

      // Connect fixations in chronological order.
      Plot.line(f, {
        x: "CURRENT_FIX_X",
        y: "CURRENT_FIX_Y",
        stroke: "#2563eb",
        strokeWidth: 1.5,
        strokeOpacity: 0.45
      }),

      // Use fixation duration to determine circle size.
      Plot.dot(f, {
        x: "CURRENT_FIX_X",
        y: "CURRENT_FIX_Y",
        r: "CURRENT_FIX_DURATION",
        fill: "#2563eb",
        fillOpacity: 0.55,
        stroke: "white",
        strokeWidth: 0.7,

        title: d =>
          `Fixation: ${d.CURRENT_FIX_INDEX}
Duration: ${d.CURRENT_FIX_DURATION} ms
Word: ${d.CURRENT_FIX_INTEREST_AREA_LABEL}`
      })
    ]
  });
}


function _26(md){return(
md`## Cell 13 (OJS) — Interactive Fixation Replay Controller`
)}

function _fullReplayStep(fullFixes,html,Event,invalidation)
{
  // Replay controls for the selected participant and trial.
  // Playback follows fixation order rather than real elapsed time.

  const n = Math.max(1, fullFixes.length);

  const panel = html`
    <div style="display:flex; align-items:center; gap:15px;
                flex-wrap:wrap; padding:15px;
                border:1px solid #ddd; border-radius:10px;">

      <button type="button">▶ Play</button>

      <label>
        Fixation:
        <input type="range" min="1" max="${n}"
               step="1" value="1"
               style="width:350px; vertical-align:middle;">
      </label>

      <output>1 / ${n}</output>

      <label>
        Playback Speed:
        <select>
          <option value="1">1×</option>
          <option value="2" selected>2×</option>
          <option value="4">4×</option>
        </select>
      </label>
    </div>
  `;

  const button = panel.querySelector("button");
  const slider = panel.querySelector("input");
  const output = panel.querySelector("output");
  const speed = panel.querySelector("select");

  let current = 1;
  let playing = false;
  let timer = null;

  panel.value = current;

  // Update the Observable reactive value.
  function update() {
    slider.value = current;
    output.textContent = `${current} / ${n}`;
    panel.value = current;
    panel.dispatchEvent(
      new Event("input", {bubbles: true})
    );
  }

  function pause() {
    playing = false;
    clearInterval(timer);
    timer = null;
    button.textContent = "▶ Play";
  }

  function play() {
    if (playing) return;

    if (current >= n) {
      current = 1;
      update();
    }

    playing = true;
    button.textContent = "⏸ Pause";

    const interval = 400 / Number(speed.value);

    timer = setInterval(() => {
      if (current >= n) {
        pause();
        return;
      }

      current++;
      update();

      if (current >= n) pause();
    }, interval);
  }

  button.addEventListener("click", () => {
    if (playing) pause();
    else play();
  });

  slider.addEventListener("input", () => {
    current = Number(slider.value);
    update();
    if (playing && current >= n) pause();
  });

  speed.addEventListener("change", () => {
    if (playing) {
      pause();
      play();
    }
  });

  // Stop playback when participant or trial changes.
  invalidation.then(pause);

  return panel;
}


function _28(md){return(
md`## Cell 14 (OJS) — Animated Eye-Movement Scanpath Replay`
)}

function _fullReplayPlot(fullAreas,fullFixes,fullReplayStep,html,Plot)
{
  // Reconstruct the reading process fixation by fixation.
  // The red circle highlights the current fixation.

  const a = fullAreas;

  // Show only fixations up to the current replay step.
  const f = fullFixes.slice(0, fullReplayStep);

  if (!a.length || !f.length) {
    return html`<p>No fixation data available.</p>`;
  }

  // Calculate coordinates from the paragraph layout.
  const xMin = Math.min(...a.map(d => d.IA_LEFT)) - 30;
  const xMax = Math.max(...a.map(d => d.IA_RIGHT)) + 30;
  const yMin = Math.min(...a.map(d => d.IA_TOP)) - 30;
  const yMax = Math.max(...a.map(d => d.IA_BOTTOM)) + 30;

  return Plot.plot({
    width: 1100,
    height: 550,

    x: {
      domain: [xMin, xMax],
      axis: null
    },

    y: {
      domain: [yMin, yMax],
      reverse: true,
      axis: null
    },

    marks: [
      // 1. Display the original reading passage.
      Plot.text(a, {
        x: d => (d.IA_LEFT + d.IA_RIGHT) / 2,
        y: d => (d.IA_TOP + d.IA_BOTTOM) / 2,
        text: "IA_LABEL",
        fontSize: 12,
        fill: "#777777"
      }),

      // 2. Draw the scanpath in chronological order.
      Plot.line(f, {
        x: "CURRENT_FIX_X",
        y: "CURRENT_FIX_Y",
        stroke: "#2563eb",
        strokeWidth: 1.8,
        strokeOpacity: 0.55
      }),

      // 3. Display previous fixations.
      // Circle radius reflects fixation duration.
      Plot.dot(f.slice(0, -1), {
        x: "CURRENT_FIX_X",
        y: "CURRENT_FIX_Y",
        r: d => Math.max(
          3,
          Math.min(12, Math.sqrt(Number(d.CURRENT_FIX_DURATION) || 0) / 2)
        ),
        fill: "#2563eb",
        fillOpacity: 0.4,
        stroke: "white",
        strokeWidth: 0.5
      }),

      // 4. Highlight the current fixation in red.
      Plot.dot(f.slice(-1), {
        x: "CURRENT_FIX_X",
        y: "CURRENT_FIX_Y",
        r: 10,
        fill: "#dc2626",
        fillOpacity: 0.9,
        stroke: "white",
        strokeWidth: 1.5,

        title: d =>
          `Fixation ${d.CURRENT_FIX_INDEX}
Duration: ${d.CURRENT_FIX_DURATION} ms
Word: ${d.CURRENT_FIX_INTEREST_AREA_LABEL || "N/A"}`
      })
    ]
  });
}


function _30(md){return(
md`## Cell 15 (OJS) — Interactive Reading Condition Selector`
)}

function _31(md){return(
md`## Cell 16 (OJS) — Reading Time Comparison Across Conditions`
)}

function _fullReadingTimePlot(fullSummary,fullConditionFilters,Plot)
{
  // Use descriptive summaries from all 360 participants.
  // Filter the data using the controls in Cell 15.

  const data = fullSummary.filter(d =>
    (fullConditionFilters.goal === "All" ||
      d.reading_goal === fullConditionFilters.goal) &&
    (fullConditionFilters.pass === "All" ||
      d.reading_pass === fullConditionFilters.pass) &&
    (fullConditionFilters.difficulty === "All" ||
      d.difficulty_level === fullConditionFilters.difficulty)
  );

  // Select the dependent reading-time measure.
  const metric =
    fullConditionFilters.timeMetric === "Reading Time per Word"
      ? "mean_reading_ms_per_word"
      : "mean_PARAGRAPH_RT_ms";

  const yLabel =
    metric === "mean_reading_ms_per_word"
      ? "Mean Reading Time per Word (ms)"
      : "Mean Paragraph Reading Time (ms)";

  return Plot.plot({
    width: 1050,
    height: 580,

    x: {
      label: "Reading Goal"
    },

    y: {
      label: yLabel,
      grid: true,
      zero: true
    },

    // Create separate panels by difficulty and reading pass.
    fx: {label: "Text Difficulty"},
    fy: {label: "Reading Pass"},

    color: {
      domain: ["Gathering", "Hunting"],
      range: ["#2563eb", "#f97316"],
      legend: true,
      label: "Reading Goal"
    },

    marks: [
      // Each bar represents the mean across trials.
      Plot.barY(data, {
        x: "reading_goal",
        y: metric,
        fx: "difficulty_level",
        fy: "reading_pass",
        fill: "reading_goal",

        title: d =>
          `Goal: ${d.reading_goal}
Pass: ${d.reading_pass}
Difficulty: ${d.difficulty_level}
Mean: ${Number(d[metric]).toFixed(1)} ms
Trials: ${d.n_trials}
Participants: ${d.n_readers}`
      }),

      Plot.ruleY([0])
    ]
  });
}


function _33(md){return(
md`## Cell 17 (OJS) — Reading Comprehension Accuracy Comparison`
)}

function _fullConditionFilters(Inputs){return(
Inputs.form({
  goal: Inputs.select(
    ["All", "Gathering", "Hunting"],
    {label: "Reading Goal", value: "All"}
  ),

  pass: Inputs.select(
    ["All", "First", "Repeated"],
    {label: "Reading Pass", value: "All"}
  ),

  difficulty: Inputs.select(
    ["All", "Adv", "Ele"],
    {label: "Text Difficulty", value: "All"}
  ),

  timeMetric: Inputs.select(
    ["Reading Time per Word", "Paragraph Reading Time"],
    {label: "Reading Time Measure", value: "Reading Time per Word"}
  ),

  matchedDimension: Inputs.select(
    ["Reading Goal", "Reading Pass"],
    {label: "Matched Eye-Tracking Comparison", value: "Reading Goal"}
  )
})
)}

function _fullAccuracyPlot(fullSummary,fullConditionFilters,Plot)
{
  // Compare the percentage of correct comprehension responses.
  // Apply the same experimental condition filters as Cell 16.

  const data = fullSummary.filter(d =>
    (fullConditionFilters.goal === "All" ||
      d.reading_goal === fullConditionFilters.goal) &&
    (fullConditionFilters.pass === "All" ||
      d.reading_pass === fullConditionFilters.pass) &&
    (fullConditionFilters.difficulty === "All" ||
      d.difficulty_level === fullConditionFilters.difficulty)
  );

  return Plot.plot({
    width: 1050,
    height: 580,

    x: {
      label: "Reading Goal"
    },

    y: {
      label: "Comprehension Accuracy (%)",
      domain: [0, 100],
      grid: true
    },

    fx: {label: "Text Difficulty"},
    fy: {label: "Reading Pass"},

    color: {
      domain: ["Gathering", "Hunting"],
      range: ["#2563eb", "#f97316"],
      legend: true,
      label: "Reading Goal"
    },

    marks: [
      // Bar height represents condition-level accuracy.
      Plot.barY(data, {
        x: "reading_goal",
        y: "accuracy_pct",
        fx: "difficulty_level",
        fy: "reading_pass",
        fill: "reading_goal",

        title: d =>
          `Goal: ${d.reading_goal}
Pass: ${d.reading_pass}
Difficulty: ${d.difficulty_level}
Accuracy: ${Number(d.accuracy_pct).toFixed(1)}%
Trials: ${d.n_trials}
Participants: ${d.n_readers}`
      }),

      Plot.ruleY([0])
    ]
  });
}


function _36(md){return(
md`## Cell 18 (OJS) — First vs. Repeated Reading Comparison`
)}

function _fullRepetitionPlot(fullSummary,fullConditionFilters,Plot)
{
  // Compare reading time during first and repeated reading.
  // Reading pass is not filtered because both levels are required.

  const data = fullSummary.filter(d =>
    (fullConditionFilters.goal === "All" ||
      d.reading_goal === fullConditionFilters.goal) &&
    (fullConditionFilters.difficulty === "All" ||
      d.difficulty_level === fullConditionFilters.difficulty)
  );

  const metric =
    fullConditionFilters.timeMetric === "Reading Time per Word"
      ? "mean_reading_ms_per_word"
      : "mean_PARAGRAPH_RT_ms";

  return Plot.plot({
    width: 1050,
    height: 580,

    x: {
      label: "Reading Pass",
      domain: ["First", "Repeated"]
    },

    y: {
      label: fullConditionFilters.timeMetric + " (ms)",
      grid: true,
      zero: true
    },

    fx: {label: "Text Difficulty"},
    fy: {label: "Reading Goal"},

    color: {
      domain: ["First", "Repeated"],
      range: ["#0891b2", "#a855f7"],
      legend: true,
      label: "Reading Pass"
    },

    marks: [
      // Display average reading times across reading passes.
      Plot.barY(data, {
        x: "reading_pass",
        y: metric,
        fx: "difficulty_level",
        fy: "reading_goal",
        fill: "reading_pass",

        title: d =>
          `Reading: ${d.reading_pass}
Goal: ${d.reading_goal}
Difficulty: ${d.difficulty_level}
Mean: ${Number(d[metric]).toFixed(1)} ms
Trials: ${d.n_trials}
Participants: ${d.n_readers}`
      }),

      Plot.ruleY([0])
    ]
  });
}


function _38(md){return(
md`## Cell 19 (OJS) — Advanced vs. Elementary Text Difficulty`
)}

function _fullDifficultyPlot(fullSummary,fullConditionFilters,Plot)
{
  // Compare reading time for Advanced and Elementary texts.
  // Keep both difficulty levels, regardless of the difficulty filter.

  const data = fullSummary.filter(d =>
    (fullConditionFilters.goal === "All" ||
      d.reading_goal === fullConditionFilters.goal) &&
    (fullConditionFilters.pass === "All" ||
      d.reading_pass === fullConditionFilters.pass)
  );

  const metric =
    fullConditionFilters.timeMetric === "Reading Time per Word"
      ? "mean_reading_ms_per_word"
      : "mean_PARAGRAPH_RT_ms";

  return Plot.plot({
    width: 1050,
    height: 580,

    x: {
      label: "Text Difficulty",
      domain: ["Adv", "Ele"]
    },

    y: {
      label: fullConditionFilters.timeMetric + " (ms)",
      grid: true,
      zero: true
    },

    fx: {label: "Reading Goal"},
    fy: {label: "Reading Pass"},

    color: {
      domain: ["Adv", "Ele"],
      range: ["#ef4444", "#22c55e"],
      legend: true,
      label: "Text Difficulty"
    },

    marks: [
      // Compare mean reading times by difficulty level.
      Plot.barY(data, {
        x: "difficulty_level",
        y: metric,
        fx: "reading_goal",
        fy: "reading_pass",
        fill: "difficulty_level",

        title: d =>
          `Difficulty: ${d.difficulty_level}
Goal: ${d.reading_goal}
Pass: ${d.reading_pass}
Mean: ${Number(d[metric]).toFixed(1)} ms
Trials: ${d.n_trials}
Participants: ${d.n_readers}`
      }),

      Plot.ruleY([0])
    ]
  });
}


function _40(md){return(
md`## Cell 20 (OJS) — Matched Paragraph Eye-Tracking Comparison`
)}

function _fullMatchedTrialKey(fullTrial,fullCatalog,fullConditionFilters,fullReader,Inputs)
{
  const m = fullTrial.meta;

  const candidates = fullCatalog.filter(d => {
    const sameText =
      String(d.article_id) === String(m.article_id) &&
      String(d.paragraph_id) === String(m.paragraph_id) &&
      d.difficulty_level === m.difficulty_level;

    const validTrial =
      d.trial_key !== m.trial_key &&
      String(d.has_fixations).toLowerCase() === "true";

    const differentCondition =
      fullConditionFilters.matchedDimension === "Reading Goal"
        ? d.reading_goal !== m.reading_goal &&
          d.reading_pass === m.reading_pass
        : d.reading_pass !== m.reading_pass &&
          d.reading_goal === m.reading_goal;

    return sameText && validTrial && differentCondition;
  });

  // Prefer the same participant if a matching trial exists.
  candidates.sort((a, b) =>
    Number(b.participant_id === fullReader) -
    Number(a.participant_id === fullReader)
  );

  return Inputs.select(
    candidates.length
      ? candidates.map(d => d.trial_key)
      : ["NO_MATCH"],
    {
      label: "Select Matched Participant / Trial",

      format: key => {
        if (key === "NO_MATCH") {
          return "No matching trial available";
        }

        const d = candidates.find(
          x => x.trial_key === key
        );

        return `${d.participant_id} | Trial ${d.TRIAL_INDEX} | ${d.reading_goal} | ${d.reading_pass}`;
      }
    }
  );
}


async function _fullMatchedHeatmap(fullMatchedTrialKey,html,fullCatalog,fullReaderIndex,fullReader,fullReaderData,fullLoadShard,fullTrial,Plot)
{
  // Retrieve the matched trial and compare both passages
  // using the same word-level dwell-time color scale.

  if (fullMatchedTrialKey === "NO_MATCH") {
    return html`<p>No matching trial is available.</p>`;
  }

  const match = fullCatalog.find(
    d => d.trial_key === fullMatchedTrialKey
  );

  if (!match) {
    return html`<p>Matched trial not found.</p>`;
  }

  const readerInfo = fullReaderIndex.find(
    d => d.participant_id === match.participant_id
  );

  if (!readerInfo) {
    return html`<p>Matched participant not found.</p>`;
  }

  // Reuse loaded data when the participant is the same.
  const readerData =
    match.participant_id === fullReader
      ? fullReaderData
      : await (async () => {
          const archive = await fullLoadShard(readerInfo.shard);
          return archive.file(readerInfo.entry).json();
        })();

  const matchedTrial = readerData.trials.find(
    t => t.meta.trial_key === fullMatchedTrialKey
  );

  if (!matchedTrial) {
    return html`<p>Matched trial data unavailable.</p>`;
  }

  // Filter words with valid screen coordinates.
  const valid = d =>
    [d.IA_LEFT, d.IA_RIGHT, d.IA_TOP, d.IA_BOTTOM]
      .every(v => Number.isFinite(Number(v)));

  const areas1 = fullTrial.areas.filter(valid);
  const areas2 = matchedTrial.areas.filter(valid);

  if (!areas1.length || !areas2.length) {
    return html`<p>Missing word-coordinate data.</p>`;
  }

  // Establish a common color scale for fair comparison.
  const values = [...areas1, ...areas2]
    .map(d => Number(d.IA_DWELL_TIME))
    .filter(Number.isFinite)
    .map(v => Math.max(0, v))
    .sort((a, b) => a - b);

  const ceiling = Math.max(
    1,
    values[Math.floor((values.length - 1) * 0.95)] ?? 1
  );

  // Draw an individual word-level dwell-time heatmap.
  function drawHeatmap(areas) {
    const x0 = Math.min(...areas.map(d => Number(d.IA_LEFT))) - 30;
    const x1 = Math.max(...areas.map(d => Number(d.IA_RIGHT))) + 30;
    const y0 = Math.min(...areas.map(d => Number(d.IA_TOP))) - 30;
    const y1 = Math.max(...areas.map(d => Number(d.IA_BOTTOM))) + 30;

    const height = Math.max(
      350,
      Math.min(700, 1050 * (y1 - y0) / (x1 - x0))
    );

    return Plot.plot({
      width: 1050,
      height,

      x: {domain: [x0, x1], axis: null},
      y: {domain: [y0, y1], reverse: true, axis: null},

      color: {
        type: "linear",
        domain: [0, ceiling],
        clamp: true,
        scheme: "YlOrRd",
        legend: true,
        label: "Word Dwell Time (ms)"
      },

      marks: [
        // Use identical color limits for both readers.
        Plot.rect(areas, {
          x1: "IA_LEFT",
          x2: "IA_RIGHT",
          y1: "IA_TOP",
          y2: "IA_BOTTOM",
          fill: d => Math.min(
            ceiling,
            Math.max(0, Number(d.IA_DWELL_TIME) || 0)
          ),
          stroke: "#d1d5db",
          strokeWidth: 0.5,

          title: d =>
            `${d.IA_LABEL}
Dwell: ${d.IA_DWELL_TIME} ms
Fixations: ${d.IA_FIXATION_COUNT}`
        }),

        // Display the original words.
        Plot.text(areas, {
          x: d => (Number(d.IA_LEFT) + Number(d.IA_RIGHT)) / 2,
          y: d => (Number(d.IA_TOP) + Number(d.IA_BOTTOM)) / 2,
          text: "IA_LABEL",
          fontSize: 11,
          fill: "#111827"
        })
      ]
    });
  }

  const m1 = fullTrial.meta;
  const m2 = matchedTrial.meta;

  return html`
    <div style="display:grid;gap:28px;max-width:1100px;">

      <section>
        <h3>Reader A: ${m1.participant_id}</h3>
        <p>
          ${m1.reading_goal} | ${m1.reading_pass} |
          ${m1.difficulty_level}
          — ${m1.n_fixations} fixations
        </p>
        ${drawHeatmap(areas1)}
      </section>

      <section>
        <h3>Reader B: ${m2.participant_id}</h3>
        <p>
          ${m2.reading_goal} | ${m2.reading_pass} |
          ${m2.difficulty_level}
          — ${m2.n_fixations} fixations
        </p>
        ${drawHeatmap(areas2)}
      </section>

      <p style="font-size:13px;color:#64748b;">
        Both heatmaps show the same article, paragraph, and
        text difficulty. Colors use a common scale capped
        at the pooled 95th percentile. Different readers
        may have different eye-movement patterns.
      </p>
    </div>
  `;
}


export default function define(runtime, observer) {
  const main = runtime.module();
  const fileAttachments = new Map([
    ["onestop_reader_shard_09.zip", {url: "https://static.observableusercontent.com/files/7409dad92633c6d87311268f65e7ed11f1e55f71736d42fc0e5b0c9529eca9ef80d4867c4cea2e46e5dfc0af27581ce1306427d118bdfcb3cc376d3b9b65b054", mimeType: "application/zip"}],
    ["onestop_reader_shard_10.zip", {url: "https://static.observableusercontent.com/files/69695102fdde6d17814217d6e4f1282651ef2a4300557377db05fc9c18881c0068253ad500adb8d97f20aa6c19f4592f1822e8e6e6ef1b689bc1d5afd9149608", mimeType: "application/zip"}],
    ["onestop_reader_shard_11.zip", {url: "https://static.observableusercontent.com/files/b28334b2519aaec2bd1260ac82c1abdea26223e1c6530b77c20a98a4ade668964f83f73de9de81d4276288792466e9c973ea92b26cb93a61bedecdecbf45824a", mimeType: "application/zip"}],
    ["onestop_reader_shard_06.zip", {url: "https://static.observableusercontent.com/files/2bec4bc92fde74cfc7abf55d4b0b0ab27093663aa9340a58b20b88c4e06e462be93147f6c1360f30ba926d5d5ead917fb6dc8d74cfdd9d703fe21192200b44ad", mimeType: "application/zip"}],
    ["onestop_reader_shard_07.zip", {url: "https://static.observableusercontent.com/files/febe0a635e127d5e88664b97065ac77140087de2089e76b9a024f11dd7f7550afa3c90a12768a2aba4bdedb783fe68549a6c9fc98a3b7a2007a9beaa0bf28d80", mimeType: "application/zip"}],
    ["onestop_reader_shard_08.zip", {url: "https://static.observableusercontent.com/files/e2ba3af9a19960fe94d37f727785c536b10d7ea11256524f56478d2c034fde9ee9b388abe138f05d53b3dd8758816521be35c230e14cad6b673e5a2272207b8c", mimeType: "application/zip"}],
    ["onestop_reader_shard_04.zip", {url: "https://static.observableusercontent.com/files/792ab972c91dd84ade1b418086a37a062b6eb85db78a096c166f9fee985fc3d45cba937e164f049f259624b83e5ccb80fd7f72088141113a4b0fc07b91582425", mimeType: "application/zip"}],
    ["onestop_reader_shard_00.zip", {url: "https://static.observableusercontent.com/files/64020fb6dd24a519f16c616c1a9e999b908111b93a2c87572f3f6632a716829f066980548a54214fa912f2f541dca6d7e976e7387da5912102982b90d06f56d3", mimeType: "application/zip"}],
    ["onestop_reader_shard_01.zip", {url: "https://static.observableusercontent.com/files/a86570c46d068c95e9828134c6d3db42b1688a00de81234d6a6c476bdf3bdafe9dbf93a86df73294b73a83bce6d36d6e1f3ae3ba373e064d146566257109daa1", mimeType: "application/zip"}],
    ["onestop_reader_shard_02.zip", {url: "https://static.observableusercontent.com/files/6fb08c7de0ff0031a9ec06c3ad31ebf2629ff62ba6f5a71363675d0d6fa014a3206887f946fcfdc0f93c87fa53e30faccaebd54bf35e9b46636884f9332c70de", mimeType: "application/zip"}],
    ["onestop_reader_shard_03.zip", {url: "https://static.observableusercontent.com/files/adab65d6f07eb053b46dec70e516154f759f4779ec2c73925bc581d5d19f6462f5ec03a0e1e2d75ca9de470adb0739e2a149d9edc9a99770ccce4843e9f96ee8", mimeType: "application/zip"}],
    ["onestop_reader_shard_05.zip", {url: "https://static.observableusercontent.com/files/0da15daf748d6cf505fbf3265c016837434941fac2a4ce8708fda97b889ed24d7bb249b15cc49951f6ae21c59063c136d851972369d6d3ddb610ab5f41486d83", mimeType: "application/zip"}],
    ["onestop_reader_index_full.csv", {url: "https://static.observableusercontent.com/files/536e1216b4ac92b4c79cf10e2bfd7f1a065e82a57219b9307afc668c4debab7837abaf4b754121e78584423950c1a98258377217e2daf60fe012da2007f9c6f5", mimeType: "text/csv"}],
    ["onestop_condition_summary_full.csv", {url: "https://static.observableusercontent.com/files/51f3c7e00d83ab0b5fe21d89a8ec685c7e5ea6fe8da0c137422e3377792f32360a7c9f6d6d3b55c6d02b94e8b75e48baad2aef5c5fde7e83574592cf22a44c6c", mimeType: "text/csv"}],
    ["onestop_trial_catalog_full.csv", {url: "https://static.observableusercontent.com/files/6a34929843aeab85af08eb1c5bbe65bf8bf87ee630d98fe1bc238d1a21e19a3e0b5227f3457c2f6f4956a43460c4a11dcf8b0127f7efcdababd1d9febfabc485", mimeType: "text/csv"}]
  ]);
  main.builtin("FileAttachment", runtime.fileAttachments(name => fileAttachments.get(name)));
  main.variable(observer()).define(["md"], _1);
  main.variable(observer("fullCatalog")).define("fullCatalog", ["FileAttachment"], _fullCatalog);
  main.variable(observer()).define(["md"], _3);
  main.variable(observer("fullSummary")).define("fullSummary", ["FileAttachment"], _fullSummary);
  main.variable(observer()).define(["md"], _5);
  main.variable(observer("fullReaderIndex")).define("fullReaderIndex", ["FileAttachment"], _fullReaderIndex);
  main.variable(observer()).define(["md"], _7);
  main.variable(observer()).define(["md"], _9);
  main.variable(observer("fullLoadShard")).define("fullLoadShard", ["FileAttachment"], _fullLoadShard);
  main.variable(observer()).define(["md"], _11);
  main.variable(observer("fullReaderData")).define("fullReaderData", ["fullReaderIndex","fullReader","fullLoadShard"], _fullReaderData);
  main.variable(observer()).define(["md"], _13);
  main.variable(observer()).define(["fullReaderData","fullReader"], _14);
  main.variable(observer()).define(["md"], _15);
  main.variable(observer("viewof fullTrialKey")).define("viewof fullTrialKey", ["Inputs","fullReaderData"], _fullTrialKey);
  main.variable(observer("fullTrialKey")).define("fullTrialKey", ["Generators", "viewof fullTrialKey"], (G, _) => G.input(_));
  main.variable(observer()).define(["md"], _17);
  main.variable(observer("fullTrial")).define("fullTrial", ["fullReaderData","fullTrialKey"], _fullTrial);
  main.variable(observer()).define(["md"], _19);
  main.variable(observer("fullAreas")).define("fullAreas", ["fullTrial"], _fullAreas);
  main.variable(observer("fullFixes")).define("fullFixes", ["fullTrial"], _fullFixes);
  main.variable(observer()).define(["md"], _22);
  main.variable(observer("fullHeatmap")).define("fullHeatmap", ["fullAreas","html","Plot"], _fullHeatmap);
  main.variable(observer()).define(["md"], _24);
  main.variable(observer("fullScanpath")).define("fullScanpath", ["fullAreas","fullFixes","html","Plot"], _fullScanpath);
  main.variable(observer()).define(["md"], _26);
  main.variable(observer("viewof fullReplayStep")).define("viewof fullReplayStep", ["fullFixes","html","Event","invalidation"], _fullReplayStep);
  main.variable(observer("fullReplayStep")).define("fullReplayStep", ["Generators", "viewof fullReplayStep"], (G, _) => G.input(_));
  main.variable(observer()).define(["md"], _28);
  main.variable(observer("fullReplayPlot")).define("fullReplayPlot", ["fullAreas","fullFixes","fullReplayStep","html","Plot"], _fullReplayPlot);
  main.variable(observer()).define(["md"], _30);
  main.variable(observer()).define(["md"], _31);
  main.variable(observer("fullReadingTimePlot")).define("fullReadingTimePlot", ["fullSummary","fullConditionFilters","Plot"], _fullReadingTimePlot);
  main.variable(observer()).define(["md"], _33);
  main.variable(observer("viewof fullConditionFilters")).define("viewof fullConditionFilters", ["Inputs"], _fullConditionFilters);
  main.variable(observer("fullConditionFilters")).define("fullConditionFilters", ["Generators", "viewof fullConditionFilters"], (G, _) => G.input(_));
  main.variable(observer("fullAccuracyPlot")).define("fullAccuracyPlot", ["fullSummary","fullConditionFilters","Plot"], _fullAccuracyPlot);
  main.variable(observer()).define(["md"], _36);
  main.variable(observer("fullRepetitionPlot")).define("fullRepetitionPlot", ["fullSummary","fullConditionFilters","Plot"], _fullRepetitionPlot);
  main.variable(observer()).define(["md"], _38);
  main.variable(observer("fullDifficultyPlot")).define("fullDifficultyPlot", ["fullSummary","fullConditionFilters","Plot"], _fullDifficultyPlot);
  main.variable(observer()).define(["md"], _40);
  main.variable(observer("viewof fullMatchedTrialKey")).define("viewof fullMatchedTrialKey", ["fullTrial","fullCatalog","fullConditionFilters","fullReader","Inputs"], _fullMatchedTrialKey);
  main.variable(observer("fullMatchedTrialKey")).define("fullMatchedTrialKey", ["Generators", "viewof fullMatchedTrialKey"], (G, _) => G.input(_));
  main.variable(observer("fullMatchedHeatmap")).define("fullMatchedHeatmap", ["fullMatchedTrialKey","html","fullCatalog","fullReaderIndex","fullReader","fullReaderData","fullLoadShard","fullTrial","Plot"], _fullMatchedHeatmap);
  return main;
}
