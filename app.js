(() => {
  const EXAMPLES = [
    { N: 15, a: 2, short: "15 · 2" },
    { N: 15, a: 4, short: "15 · 4" },
    { N: 15, a: 7, short: "15 · 7" },
    { N: 21, a: 2, short: "21 · 2" },
    { N: 33, a: 5, short: "33 · 5" },
  ];

  function gcd(x, y) {
    let a = Math.abs(x);
    let b = Math.abs(y);
    while (b) {
      const t = b;
      b = a % b;
      a = t;
    }
    return a;
  }

  function build(N, a) {
    const seq = [{ c: 0, v: 1 }];
    let v = 1;
    let r = 0;
    for (let c = 1; c <= N * 2; c += 1) {
      v = (v * a) % N;
      seq.push({ c, v });
      if (v === 1) {
        r = c;
        break;
      }
    }
    const half = r / 2;
    const mEntry = seq.find((s) => s.c === half);
    const m = mEntry ? mEntry.v : 0;
    const left = m - 1;
    const right = m + 1;
    const p = gcd(left, N);
    const q = gcd(right, N);
    return { N, a, seq, r, half, m, left, right, p, q };
  }

  function stepsFor(ex) {
    const walk = ex.seq.slice(1).map((cell, i) => {
      const prev = ex.seq[i].v;
      const raw = prev * ex.a;
      const wrapped = raw >= ex.N;
      const formula = wrapped
        ? `${prev} × ${ex.a} = ${raw} → ${raw} − ${ex.N} = ${cell.v}`
        : `${prev} × ${ex.a} = ${cell.v}`;
      const back = cell.v === 1;
      return {
        title: back ? "Loop closes" : `Multiply → ${cell.v}`,
        short: back ? "Close the loop" : `Step ${cell.c}`,
        html: back
          ? `<h2>We landed back on 1</h2>
             <p>After <span class="mono">${ex.r}</span> steps we return to 1 — that length is the <b>period r</b>. Quantum’s job is to find r; the rest is classical.</p>`
          : `<h2>Walk one step around the ring</h2>
             <p class="mono">${formula}</p>
             <p>Multiply by <span class="mono">${ex.a}</span>${wrapped ? `, wrap past ${ex.N}` : ""}, place the new remainder on the ring.</p>`,
        show: cell.c,
        cur: cell.c,
        formula,
        phase: "walk",
      };
    });

    return [
      {
        title: "The idea",
        short: "The idea",
        html: `<h2>Factoring by finding a period</h2>
          <p>N = <span class="mono">${ex.N}</span> stands in for RSA. Build <span class="mono">A[c] = ${ex.a}<sup>c</sup> mod ${ex.N}</span>. When the ring returns to 1, we have the period.</p>`,
        show: 0,
        cur: 0,
        formula: `N = ${ex.N}, a = ${ex.a} · start at A[0] = 1`,
        phase: "intro",
      },
      {
        title: "Start at 1",
        short: "Start at 1",
        html: `<h2>A[0] is always 1</h2>
          <p>Each next node: multiply by <span class="mono">${ex.a}</span>, then remainder mod <span class="mono">${ex.N}</span>. Watch the orbit grow.</p>`,
        show: 0,
        cur: 0,
        formula: `A[0] = ${ex.a}<sup>0</sup> mod ${ex.N} = 1`,
        phase: "intro",
      },
      ...walk,
      {
        title: `Period r = ${ex.r}`,
        short: `Period r = ${ex.r}`,
        html: `<h2>r = ${ex.r}</h2>
          <p>Count steps from the first 1 back to the next 1: <span class="mono">r = ${ex.r}</span>. Even period — we can continue.</p>`,
        show: ex.r,
        period: true,
        formula: `Period r = ${ex.r} · A[0] = A[${ex.r}] = 1`,
        phase: "period",
      },
      {
        title: "Halfway value m",
        short: "Halfway m",
        html: `<h2>Read the halfway node</h2>
          <p>At index <span class="mono">${ex.half}</span>: <span class="mono">m = ${ex.a}<sup>${ex.half}</sup> mod ${ex.N} = ${ex.m}</span>.</p>`,
        show: ex.r,
        period: true,
        half: ex.half,
        cur: ex.half,
        formula: `Halfway A[${ex.half}] = m = ${ex.m}`,
        phase: "half",
      },
      {
        title: "Split m ± 1",
        short: "m ± 1",
        html: `<h2>(m − 1) and (m + 1)</h2>
          <p class="mono">${ex.m} − 1 = ${ex.left} · ${ex.m} + 1 = ${ex.right}</p>
          <p>These share the secret primes with N.</p>`,
        show: ex.r,
        period: true,
        half: ex.half,
        pm: true,
        formula: `m−1 = ${ex.left},  m+1 = ${ex.right}`,
        phase: "split",
      },
      {
        title: "Pull the primes",
        short: "gcd → primes",
        html: `<h2>${ex.N} = ${ex.p} × ${ex.q}</h2>
          <p class="mono">gcd(${ex.left}, ${ex.N}) = ${ex.p} · gcd(${ex.right}, ${ex.N}) = ${ex.q}</p>
          <p>Walk the ring, read r and m, then gcd. Quantum finds r; gcd finishes it.</p>`,
        show: ex.r,
        period: true,
        half: ex.half,
        factors: true,
        formula: `${ex.N} = ${ex.p} × ${ex.q}`,
        phase: "done",
      },
    ];
  }

  const svg = document.getElementById("viz");
  const narration = document.getElementById("narration");
  const formulaEl = document.getElementById("formula");
  const stepTag = document.getElementById("step-tag");
  const progress = document.getElementById("progress");
  const playBtn = document.getElementById("play");
  const speedInput = document.getElementById("speed");
  const speedLabel = document.getElementById("speed-label");
  const examplesEl = document.getElementById("examples");
  const fullBtn = document.getElementById("full-btn");
  const headline = document.getElementById("headline");
  const subhead = document.getElementById("subhead");
  const factN = document.getElementById("fact-n");
  const factA = document.getElementById("fact-a");
  const factR = document.getElementById("fact-r");
  const factPQ = document.getElementById("fact-pq");
  const arrayCells = document.getElementById("array-cells");
  const arrayEq = document.getElementById("array-eq");

  let ex = build(15, 2);
  let steps = stepsFor(ex);
  let i = 0;
  let playing = false;
  let timer = null;

  EXAMPLES.forEach((item, idx) => {
    const b = document.createElement("button");
    b.type = "button";
    b.textContent = item.short;
    if (idx === 0) b.classList.add("on");
    b.addEventListener("click", () => selectExample(item, idx));
    examplesEl.appendChild(b);
  });

  function selectExample(item, idx) {
    stopPlay();
    Array.from(examplesEl.children).forEach((c, k) => c.classList.toggle("on", k === idx));
    ex = build(item.N, item.a);
    steps = stepsFor(ex);
    i = 0;
    prevShow = -1;
    render({ animate: false });
  }

  function ns(name) {
    return document.createElementNS("http://www.w3.org/2000/svg", name);
  }

  let animToken = 0;
  let prevShow = -1;

  function nodeColor(step, cell) {
    if (step.half === cell.c) return "#c45c26";
    if (step.period && (cell.c === 0 || cell.c === ex.r)) return "#0d7c66";
    if (step.cur === cell.c) return "#1f4fd8";
    if (cell.c <= step.show) return "#5f7383";
    return "#c8c2b6";
  }

  function pathLength(el) {
    try {
      return el.getTotalLength();
    } catch (_) {
      return 120;
    }
  }

  function drawPath(path, duration, delay) {
    const len = pathLength(path);
    path.style.strokeDasharray = String(len);
    path.style.strokeDashoffset = String(len);
    path.style.opacity = "1";
    path.getBoundingClientRect();
    path.style.transition = `stroke-dashoffset ${duration}ms cubic-bezier(.22,.8,.28,1) ${delay}ms, opacity 200ms ease ${delay}ms`;
    requestAnimationFrame(() => {
      path.style.strokeDashoffset = "0";
    });
  }

  function animateTraveler(from, to, R, cx, cy, duration, color) {
    const token = animToken;
    const traveler = ns("circle");
    traveler.setAttribute("r", "7");
    traveler.setAttribute("fill", color);
    traveler.setAttribute("class", "traveler");
    traveler.setAttribute("filter", "url(#glow)");
    svg.appendChild(traveler);

    const startAng = Math.atan2(from.y - cy, from.x - cx);
    let endAng = Math.atan2(to.y - cy, to.x - cx);
    if (endAng <= startAng) endAng += Math.PI * 2;
    const t0 = performance.now();

    function frame(now) {
      if (token !== animToken) {
        traveler.remove();
        return;
      }
      const t = Math.min(1, (now - t0) / duration);
      const e = 1 - Math.pow(1 - t, 3);
      const ang = startAng + (endAng - startAng) * e;
      traveler.setAttribute("cx", String(cx + Math.cos(ang) * R));
      traveler.setAttribute("cy", String(cy + Math.sin(ang) * R));
      if (t < 1) requestAnimationFrame(frame);
      else {
        traveler.classList.add("traveler-land");
        setTimeout(() => traveler.remove(), 280);
      }
    }
    requestAnimationFrame(frame);
  }

  function flashCaption() {
    const panel = document.getElementById("narration-panel");
    formulaEl.classList.remove("flash");
    panel.classList.remove("flash");
    void panel.offsetWidth;
    formulaEl.classList.add("flash");
    panel.classList.add("flash");
  }

  function bumpFact(el) {
    el.classList.remove("bump");
    void el.offsetWidth;
    el.classList.add("bump");
  }

  function renderArrayList(step, show, justGrew) {
    const values = [];
    arrayCells.innerHTML = "";

    // Only filled cells + one next empty slot (append preview)
    const nextIdx = Math.min(show + 1, ex.seq.length - 1);
    const slots = ex.seq.filter((cell) => cell.c <= show || cell.c === nextIdx);

    // Dense mode for long periods so nothing overflows
    document.getElementById("array-strip").classList.toggle("array-dense", slots.length >= 8);

    slots.forEach((cell) => {
      const visible = cell.c <= show;
      const el = document.createElement("div");
      el.className = "array-cell";
      if (!visible) el.classList.add("ghost");
      if (visible && step.cur === cell.c) el.classList.add("cur");
      if (visible && step.half === cell.c) el.classList.add("half");
      if (visible && step.period && (cell.c === 0 || cell.c === ex.r)) el.classList.add("period");
      if (justGrew && cell.c === show) el.classList.add("append");

      const idxEl = document.createElement("span");
      idxEl.className = "idx";
      idxEl.textContent = `[${cell.c}]`;
      const valEl = document.createElement("span");
      valEl.className = "val";
      valEl.textContent = visible ? String(cell.v) : "·";
      el.appendChild(idxEl);
      el.appendChild(valEl);

      if (visible && step.half === cell.c) {
        const mark = document.createElement("span");
        mark.className = "mark";
        mark.textContent = "m";
        el.appendChild(mark);
      } else if (visible && step.period && cell.c === ex.r) {
        const mark = document.createElement("span");
        mark.className = "mark";
        mark.textContent = "r";
        el.appendChild(mark);
      }

      arrayCells.appendChild(el);
      if (visible) values.push(cell.v);
    });

    arrayEq.textContent = values.length
      ? `A = [${values.join(", ")}]${step.period ? `  r=${ex.r}` : ""}`
      : "A = []";
  }

  function render(opts = {}) {
    const animate = opts.animate !== false;
    const token = ++animToken;
    const step = steps[i];
    const show = step.show == null ? 0 : step.show;
    const justGrew = animate && show > prevShow && show > 0;
    const W = 640;
    const H = 440;
    const cx = W / 2;
    const cy = H / 2 - 8;
    const R = Math.min(168, 52 + ex.seq.length * 14);
    const n = ex.seq.length;

    svg.setAttribute("viewBox", `0 0 ${W} ${H}`);
    svg.innerHTML = "";

    const defs = ns("defs");
    const filter = ns("filter");
    filter.setAttribute("id", "glow");
    filter.setAttribute("x", "-80%");
    filter.setAttribute("y", "-80%");
    filter.setAttribute("width", "260%");
    filter.setAttribute("height", "260%");
    const blur = ns("feDropShadow");
    blur.setAttribute("dx", "0");
    blur.setAttribute("dy", "0");
    blur.setAttribute("stdDeviation", "5");
    blur.setAttribute("flood-color", "#1f4fd8");
    blur.setAttribute("flood-opacity", "0.5");
    filter.appendChild(blur);
    defs.appendChild(filter);
    svg.appendChild(defs);

    const orbit = ns("circle");
    orbit.setAttribute("cx", String(cx));
    orbit.setAttribute("cy", String(cy));
    orbit.setAttribute("r", String(R));
    orbit.setAttribute("fill", "none");
    orbit.setAttribute("stroke", "#e2dbcf");
    orbit.setAttribute("stroke-width", "2");
    orbit.setAttribute("stroke-dasharray", "5 9");
    orbit.setAttribute("class", "orbit-spin");
    svg.appendChild(orbit);

    const center = ns("g");
    center.setAttribute("class", step.factors ? "hub celebrate" : "hub");
    const hub = ns("circle");
    hub.setAttribute("cx", String(cx));
    hub.setAttribute("cy", String(cy));
    hub.setAttribute("r", "46");
    hub.setAttribute("fill", step.factors ? "#d8efe8" : "#f7f3ea");
    hub.setAttribute("stroke", step.factors ? "#0d7c66" : "#d7d0c4");
    hub.setAttribute("stroke-width", "2");
    center.appendChild(hub);

    const hubRing = ns("circle");
    hubRing.setAttribute("cx", String(cx));
    hubRing.setAttribute("cy", String(cy));
    hubRing.setAttribute("r", "52");
    hubRing.setAttribute("fill", "none");
    hubRing.setAttribute("stroke", step.factors ? "#0d7c66" : "transparent");
    hubRing.setAttribute("stroke-width", "1.5");
    hubRing.setAttribute("class", step.factors ? "hub-ring" : "");
    center.appendChild(hubRing);

    const hubLabel = ns("text");
    hubLabel.setAttribute("x", String(cx));
    hubLabel.setAttribute("y", String(cy - 4));
    hubLabel.setAttribute("text-anchor", "middle");
    hubLabel.setAttribute("font-family", "Fraunces, Georgia, serif");
    hubLabel.setAttribute("font-size", "18");
    hubLabel.setAttribute("font-weight", "600");
    hubLabel.setAttribute("fill", "#14212b");
    hubLabel.textContent = step.factors ? `${ex.p} × ${ex.q}` : `mod ${ex.N}`;
    center.appendChild(hubLabel);

    const hubSub = ns("text");
    hubSub.setAttribute("x", String(cx));
    hubSub.setAttribute("y", String(cy + 16));
    hubSub.setAttribute("text-anchor", "middle");
    hubSub.setAttribute("font-family", "IBM Plex Mono, monospace");
    hubSub.setAttribute("font-size", "11");
    hubSub.setAttribute("fill", "#5a6b78");
    hubSub.textContent = step.factors ? `= ${ex.N}` : `a = ${ex.a}`;
    center.appendChild(hubSub);
    svg.appendChild(center);

    const positions = ex.seq.map((cell, idx) => {
      const a2 = -Math.PI / 2 + (idx / n) * Math.PI * 2;
      return {
        cell,
        x: cx + Math.cos(a2) * R,
        y: cy + Math.sin(a2) * R,
      };
    });

    const edgeDelay = justGrew ? 420 : 0;

    for (let k = 0; k < positions.length - 1; k += 1) {
      if (positions[k + 1].cell.c > show) break;
      const a = positions[k];
      const b = positions[k + 1];
      const isNew = justGrew && positions[k + 1].cell.c === show;
      const isCur = k + 1 === step.cur;
      const path = ns("path");
      const d = `M ${a.x} ${a.y} A ${R} ${R} 0 0 1 ${b.x} ${b.y}`;
      path.setAttribute("d", d);
      path.setAttribute("fill", "none");
      path.setAttribute("stroke", isCur ? "#1f4fd8" : "#0d7c66");
      path.setAttribute("stroke-width", isCur ? "3.5" : "2.5");
      path.setAttribute("stroke-linecap", "round");
      path.setAttribute("opacity", isNew ? "0" : "0.85");
      svg.appendChild(path);

      if (isNew) {
        drawPath(path, 520, 0);
        animateTraveler(a, b, R, cx, cy, 520, "#1f4fd8");
      }

      const ang = Math.atan2(b.y - cy, b.x - cx);
      const tx = cx + Math.cos(ang) * R;
      const ty = cy + Math.sin(ang) * R;
      const tang = ang + Math.PI / 2;
      const arrow = ns("polygon");
      const s = 7;
      arrow.setAttribute(
        "points",
        `${tx},${ty} ${tx - Math.cos(tang) * s - Math.cos(ang) * s},${ty - Math.sin(tang) * s - Math.sin(ang) * s} ${tx + Math.cos(tang) * s - Math.cos(ang) * s},${ty + Math.sin(tang) * s - Math.sin(ang) * s}`
      );
      arrow.setAttribute("fill", isCur ? "#1f4fd8" : "#0d7c66");
      if (isNew) {
        arrow.setAttribute("opacity", "0");
        arrow.style.transition = `opacity 220ms ease ${520}ms`;
        requestAnimationFrame(() => {
          arrow.style.opacity = "1";
        });
      }
      svg.appendChild(arrow);
    }

    if (step.period && show >= ex.r) {
      const a = positions[0];
      const b = positions[positions.length - 1];
      const chord = ns("line");
      chord.setAttribute("x1", String(a.x));
      chord.setAttribute("y1", String(a.y));
      chord.setAttribute("x2", String(b.x));
      chord.setAttribute("y2", String(b.y));
      chord.setAttribute("stroke", "#0d7c66");
      chord.setAttribute("stroke-width", "2");
      chord.setAttribute("stroke-dasharray", "6 5");
      chord.setAttribute("class", "period-chord");
      svg.appendChild(chord);
    }

    positions.forEach(({ cell, x, y }) => {
      const visible = cell.c <= show;
      const isNew = justGrew && cell.c === show;
      const isCur = step.cur === cell.c && visible;
      const outer = ns("g");
      outer.setAttribute("transform", `translate(${x}, ${y})`);

      const g = ns("g");
      if (isNew) g.setAttribute("class", "node-pop");
      else if (isCur) g.setAttribute("class", "node-pulse");

      if (isNew) {
        g.style.opacity = "0";
        g.style.transition = `opacity 200ms ease ${edgeDelay}ms`;
        requestAnimationFrame(() => {
          if (token === animToken) g.style.opacity = "1";
        });
      }

      const r = isCur ? 24 : 20;
      if (isCur) {
        const halo = ns("circle");
        halo.setAttribute("r", String(r + 10));
        halo.setAttribute("fill", "none");
        halo.setAttribute("stroke", "#1f4fd8");
        halo.setAttribute("stroke-width", "2");
        halo.setAttribute("class", "node-halo");
        g.appendChild(halo);
      }

      const circle = ns("circle");
      circle.setAttribute("r", String(r));
      circle.setAttribute("fill", visible ? nodeColor(step, cell) : "#efeae0");
      circle.setAttribute("stroke", visible ? "#fff" : "#d7d0c4");
      circle.setAttribute("stroke-width", isCur ? "4" : "2");
      if (isCur) circle.setAttribute("filter", "url(#glow)");
      g.appendChild(circle);

      if (visible) {
        const val = ns("text");
        val.setAttribute("y", "5");
        val.setAttribute("text-anchor", "middle");
        val.setAttribute("font-family", "IBM Plex Mono, monospace");
        val.setAttribute("font-size", "15");
        val.setAttribute("font-weight", "600");
        val.setAttribute("fill", "#fff");
        val.textContent = String(cell.v);
        g.appendChild(val);

        const idx = ns("text");
        const outward = Math.atan2(y - cy, x - cx);
        idx.setAttribute("x", String(Math.cos(outward) * 34));
        idx.setAttribute("y", String(Math.sin(outward) * 34 + 4));
        idx.setAttribute("text-anchor", "middle");
        idx.setAttribute("font-family", "DM Sans, sans-serif");
        idx.setAttribute("font-size", "11");
        idx.setAttribute("fill", "#5a6b78");
        idx.textContent = `c=${cell.c}`;
        g.appendChild(idx);
      }
      outer.appendChild(g);
      svg.appendChild(outer);
    });

    if (step.half != null) {
      const pos = positions.find((p) => p.cell.c === step.half);
      if (pos) {
        const tag = ns("text");
        tag.setAttribute("x", String(pos.x));
        tag.setAttribute("y", String(pos.y - 36));
        tag.setAttribute("text-anchor", "middle");
        tag.setAttribute("font-family", "DM Sans, sans-serif");
        tag.setAttribute("font-size", "12");
        tag.setAttribute("font-weight", "600");
        tag.setAttribute("fill", "#c45c26");
        tag.setAttribute("class", "callout-pop");
        tag.textContent = step.pm ? `m = ${ex.m}` : "halfway m";
        svg.appendChild(tag);
      }
    }

    if (step.pm || step.factors) {
      const box = ns("g");
      box.setAttribute("class", "banner-slide");
      const bg = ns("rect");
      bg.setAttribute("x", "16");
      bg.setAttribute("y", String(H - 42));
      bg.setAttribute("width", String(W - 32));
      bg.setAttribute("height", "32");
      bg.setAttribute("rx", "10");
      bg.setAttribute("fill", step.factors ? "#d8efe8" : "#f6e3d6");
      box.appendChild(bg);
      const t = ns("text");
      t.setAttribute("x", String(W / 2));
      t.setAttribute("y", String(H - 20));
      t.setAttribute("text-anchor", "middle");
      t.setAttribute("font-family", "IBM Plex Mono, monospace");
      t.setAttribute("font-size", "13");
      t.setAttribute("font-weight", "600");
      t.setAttribute("fill", "#14212b");
      t.textContent = step.factors
        ? `gcd(${ex.left}, ${ex.N}) = ${ex.p}   ·   gcd(${ex.right}, ${ex.N}) = ${ex.q}`
        : `(m − 1) = ${ex.left}     (m + 1) = ${ex.right}`;
      box.appendChild(t);
      svg.appendChild(box);
    }

    renderArrayList(step, show, justGrew);

    flashCaption();
    formulaEl.innerHTML = step.formula;
    narration.innerHTML = step.html;
    stepTag.textContent = `Step ${i + 1} of ${steps.length}`;
    progress.style.width = `${((i + 1) / steps.length) * 100}%`;

    const nextR = step.period || step.phase === "done" ? String(ex.r) : "—";
    const nextPQ = step.factors ? `${ex.p} × ${ex.q}` : "—";
    if (factR.textContent !== nextR) {
      factR.textContent = nextR;
      bumpFact(factR.parentElement);
    }
    if (factPQ.textContent !== nextPQ) {
      factPQ.textContent = nextPQ;
      bumpFact(factPQ.parentElement);
    }
    factN.textContent = String(ex.N);
    factA.textContent = String(ex.a);

    if (step.phase === "intro") {
      headline.textContent = "Factoring by finding a period";
      subhead.textContent = "RSA hides two primes inside N. Shor never guesses them — it builds a repeating list and reads how long the loop is.";
    } else if (step.phase === "walk") {
      headline.textContent = "Grow the orbit, one multiply at a time";
      subhead.textContent = `Each arrow is “× ${ex.a}, then mod ${ex.N}.” The ring is the list A[c].`;
    } else if (step.phase === "period") {
      headline.textContent = "The period is the length of the loop";
      subhead.textContent = "When the path returns to 1, r is known. That is the quantum part of Shor.";
    } else if (step.phase === "half" || step.phase === "split") {
      headline.textContent = "From the halfway value to the primes";
      subhead.textContent = "Read m at r/2, then form m±1 and take gcd with N.";
    } else {
      headline.textContent = "N splits cleanly";
      subhead.textContent = "Period finding did the hard work. Classical gcd finishes the factorisation.";
    }

    prevShow = show;
  }

  function go(n) {
    i = Math.max(0, Math.min(steps.length - 1, n));
    render();
  }

  function next() {
    if (i < steps.length - 1) go(i + 1);
    else stopPlay();
  }

  function prev() {
    go(i - 1);
  }

  function stopPlay() {
    playing = false;
    playBtn.textContent = "Play";
    playBtn.classList.remove("paused");
    if (timer) {
      clearInterval(timer);
      timer = null;
    }
  }

  function togglePlay() {
    if (playing) {
      stopPlay();
      return;
    }
    if (i >= steps.length - 1) go(0);
    playing = true;
    playBtn.textContent = "Pause";
    playBtn.classList.add("paused");
    const ms = 2200 / Number(speedInput.value);
    timer = setInterval(() => {
      if (i >= steps.length - 1) stopPlay();
      else next();
    }, ms);
  }

  document.getElementById("next").addEventListener("click", () => {
    stopPlay();
    next();
  });
  document.getElementById("prev").addEventListener("click", () => {
    stopPlay();
    prev();
  });
  playBtn.addEventListener("click", togglePlay);

  speedInput.addEventListener("input", () => {
    speedLabel.textContent = `${Number(speedInput.value)}×`;
    if (playing) {
      stopPlay();
      togglePlay();
    }
  });

  window.addEventListener("keydown", (e) => {
    if (e.key === " ") {
      e.preventDefault();
      togglePlay();
    } else if (e.key === "ArrowRight" || e.key === "PageDown") {
      e.preventDefault();
      stopPlay();
      next();
    } else if (e.key === "ArrowLeft" || e.key === "PageUp") {
      e.preventDefault();
      stopPlay();
      prev();
    } else if (e.key === "f" || e.key === "F") {
      fullBtn.click();
    }
  });

  fullBtn.addEventListener("click", () => {
    if (!document.fullscreenElement) document.documentElement.requestFullscreen().catch(() => {});
    else document.exitFullscreen().catch(() => {});
  });

  render({ animate: false });
})();
