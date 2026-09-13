// The archive as the spiral logo.
// 114 logo cells, traced as a path from the inner end outward; each cell is
// subdivided and every block is one interview, in order of publication.
// Block colour is that interview's own palette.

const SPIRAL_PATH = [[13,15],[14,16],[14,17],[13,18],[12,18],[11,18],[10,17],[9,16],[9,15],[9,14],[9,13],[9,12],[10,11],[11,10],[12,9],[13,9],[14,9],[15,9],[16,9],[17,9],[18,10],[19,10],[20,11],[21,12],[21,13],[22,14],[22,15],[22,16],[22,17],[22,18],[22,19],[22,20],[21,21],[21,22],[20,23],[19,24],[18,25],[17,25],[16,26],[15,26],[14,26],[13,27],[12,27],[11,27],[10,26],[9,26],[8,26],[7,25],[6,25],[5,24],[4,23],[3,22],[2,21],[1,20],[1,19],[1,18],[0,17],[0,16],[0,15],[0,14],[0,13],[0,12],[0,11],[1,10],[1,9],[2,8],[2,7],[3,6],[4,5],[5,4],[6,3],[7,2],[8,2],[9,1],[10,1],[11,1],[12,0],[13,0],[14,0],[15,0],[16,0],[17,0],[18,1],[19,1],[20,1],[21,2],[22,2],[23,3],[24,3],[25,4],[26,5],[27,6],[28,7],[28,8],[29,9],[29,10],[30,11],[30,12],[30,13],[31,14],[31,15],[31,16],[31,17],[31,18],[31,19],[31,20],[30,21],[30,22],[30,23],[29,24],[29,25],[28,26],[28,27],[27,28]];
const SPIRAL_K = [4,4,4,5,4,4,4,4,5,4,6,4,4,4,5,4,4,4,4,5,4,4,4,4,5,4,4,4,6,4,5,4,4,4,4,5,4,4,4,4,4,5,4,4,4,4,5,4,6,4,4,4,5,4,4,4,4,5,4,4,4,4,5,4,4,4,6,4,5,4,4,4,4,5,4,4,4,4,4,5,4,4,4,4,5,4,6,4,4,4,5,4,4,4,4,5,4,4,4,4,5,4,4,4,6,4,5,4,4,4,4,5,4,4];   // square blocks: k x k per logo cell
const GRID_W = 32, GRID_H = 29;

(async function () {
    const mount = document.getElementById('spiral-archive');
    if (!mount) return;

    let data;
    try {
        data = await (await fetch('js/spiral-data.json')).json();
    } catch (e) {
        mount.textContent = 'Could not load the archive data.';
        return;
    }
    const palettes = data.p, rows = data.d;

    // Order a cell's blocks along the direction the path is travelling.
    function blocksFor(i) {
        const [cx, cy] = SPIRAL_PATH[i];
        const prev = SPIRAL_PATH[i - 1] || SPIRAL_PATH[i];
        const next = SPIRAL_PATH[i + 1] || SPIRAL_PATH[i];
        const dx = next[0] - prev[0], dy = next[1] - prev[1];
        const k = SPIRAL_K[i];
        const w = 1 / k, h = 1 / k;          // square
        const out = [];
        for (let r = 0; r < k; r++)
            for (let c = 0; c < k; c++)
                out.push({ x: cx + c * w, y: cy + r * h, w, h, r, c });
        const horizontal = Math.abs(dx) >= Math.abs(dy);
        out.sort((a, b) => horizontal
            ? (dx >= 0 ? a.c - b.c : b.c - a.c) || (dy >= 0 ? a.r - b.r : b.r - a.r)
            : (dy >= 0 ? a.r - b.r : b.r - a.r) || (dx >= 0 ? a.c - b.c : b.c - a.c));
        return out;
    }

    const NS = 'http://www.w3.org/2000/svg';
    const svg = document.createElementNS(NS, 'svg');
    // the year marks sit outside the logo, so the box is padded to hold them
    const PAD = 3.6;
    svg.setAttribute('viewBox',
        `${-PAD} ${-PAD} ${GRID_W + PAD * 2} ${GRID_H + PAD * 2}`);
    svg.setAttribute('aria-label', `${rows.length} interviews, oldest at the centre of the spiral`);

    let n = 0;
    const placed = [];
    const frag = document.createDocumentFragment();
    for (let i = 0; i < SPIRAL_PATH.length; i++) {
        for (const b of blocksFor(i)) {
            const rec = rows[n];
            if (!rec) break;
            const slug = rec[0], title = rec[1];
            // [2] is the block colour: the palette's vivid side, so a
            // paper-white background never reads as a blank block
            const bg = palettes[rec[3]][2] || palettes[rec[3]][0];
            const a = document.createElementNS(NS, 'a');
            const href = 'https://thecreativeindependent.com/people/' + slug + '/';
            a.setAttribute('href', href);
            a.setAttributeNS('http://www.w3.org/1999/xlink', 'href', href);
            const rect = document.createElementNS(NS, 'rect');
            // a hairline overlap keeps the blocks from showing seams
            rect.setAttribute('x', b.x); rect.setAttribute('y', b.y);
            rect.setAttribute('width', b.w + 0.004);
            rect.setAttribute('height', b.h + 0.004);
            rect.setAttribute('fill', bg);
            rect.setAttribute('data-i', n);
            placed.push({ x: b.x + b.w / 2, y: b.y + b.h / 2, year: rec[2].slice(0, 4), ci: i });
            a.setAttribute('aria-label', title);
            a.appendChild(rect);
            frag.appendChild(a);
            n++;
        }
    }
    svg.appendChild(frag);

    const outline = document.createElementNS(NS, 'rect');
    outline.setAttribute('class', 'hover-outline');
    outline.setAttribute('visibility', 'hidden');
    outline.setAttribute('pointer-events', 'none');
    svg.appendChild(outline);

    svg.addEventListener('mouseover', (e) => {
        const r = e.target.closest('rect');
        if (!r || r === outline) return;
        outline.setAttribute('x', r.getAttribute('x'));
        outline.setAttribute('y', r.getAttribute('y'));
        outline.setAttribute('width', r.getAttribute('width'));
        outline.setAttribute('height', r.getAttribute('height'));
        outline.setAttribute('visibility', 'visible');
    });
    svg.addEventListener('mouseleave', () => {
        outline.setAttribute('visibility', 'hidden');
    });

    // "TCI launches" — a tick pointing at the very first block, set in the
    // empty eye of the spiral.
    const first = rows[0];
    const mark = document.createElementNS(NS, 'g');
    mark.setAttribute('class', 'spiral-mark');
    mark.setAttribute('pointer-events', 'none');
    const lead = document.createElementNS(NS, 'path');
    lead.setAttribute('d', 'M13.9 13.2 L13.35 14.55');
    lead.setAttribute('fill', 'none');
    mark.appendChild(lead);
    const l1 = document.createElementNS(NS, 'text');
    l1.setAttribute('x', 14.0); l1.setAttribute('y', 12.2);
    l1.textContent = 'TCI launches';
    const l2 = document.createElementNS(NS, 'text');
    l2.setAttribute('x', 14.0); l2.setAttribute('y', 12.85);
    l2.setAttribute('class', 'spiral-mark-date');
    l2.textContent = new Date(first[2] + 'T00:00:00').toLocaleDateString('en-US',
        { year: 'numeric', month: 'long', day: 'numeric' });
    mark.appendChild(l1); mark.appendChild(l2);
    svg.appendChild(mark);


    // ---- year marks -------------------------------------------------
    // The first block of each year, labelled in the gap just outside its
    // coil, in the same hand as the launch mark.
    const filled = new Set(SPIRAL_PATH.map(c => c[0] + ',' + c[1]));
    const isFilled = (x, y) => filled.has(Math.floor(x) + ',' + Math.floor(y));
    const CX = 15.5, CY = 14.5;

    const firstOfYear = new Map();
    placed.forEach((p, i) => {
        if (!firstOfYear.has(p.year)) firstOfYear.set(p.year, p);
    });

    const years = document.createElementNS(NS, 'g');
    years.setAttribute('class', 'year-marks');
    years.setAttribute('pointer-events', 'none');

    [...firstOfYear.entries()].slice(1).forEach(([year, p]) => {
        // Leave the coil sideways, not outward: perpendicular to the local
        // direction of travel the line steps straight into the neighbouring
        // gap, so it never crosses another part of the logo.
        const prev = SPIRAL_PATH[Math.max(0, p.ci - 1)];
        const next = SPIRAL_PATH[Math.min(SPIRAL_PATH.length - 1, p.ci + 1)];
        let tx = next[0] - prev[0], ty = next[1] - prev[1];
        const tl = Math.hypot(tx, ty) || 1; tx /= tl; ty /= tl;
        let nx = -ty, ny = tx;                       // perpendicular
        if ((p.x - CX) * nx + (p.y - CY) * ny < 0) { nx = -nx; ny = -ny; }   // point outward

        // Step out of the coil first: the line starts where the filled
        // cells end, so it never sits on top of a block.
        let t = 0.2;
        while (t < 6 && isFilled(p.x + nx * t, p.y + ny * t)) t += 0.1;
        if (t >= 6) return;
        const t0 = t + 0.12;                 // just clear of the edge

        // Reach as far into the gap as it allows: try a long line first and
        // settle for a shorter one where the coil is tight.
        const reach = (target) => {
            let u = t0, clear = 0;
            while (u < 6 && clear < target) {
                u += 0.12;
                if (isFilled(p.x + nx * u, p.y + ny * u)) return null;
                clear += 0.12;
            }
            return u;
        };
        const tEnd = reach(1.35) || reach(1.0) || reach(0.7);
        if (tEnd === null || tEnd === undefined) return;
        if (tEnd - t0 < 0.3) return;
        const ax = p.x + nx * tEnd, ay = p.y + ny * tEnd;

        const line = document.createElementNS(NS, 'line');
        line.setAttribute('x1', p.x + nx * t0); line.setAttribute('y1', p.y + ny * t0);
        line.setAttribute('x2', ax); line.setAttribute('y2', ay);
        line.setAttribute('data-year', year);
        years.appendChild(line);

        const label = document.createElementNS(NS, 'text');
        const right = nx >= 0;
        label.setAttribute('x', ax + (right ? 0.34 : -0.34));
        label.setAttribute('y', ay + (ny >= 0 ? 0.5 : -0.2));
        label.setAttribute('text-anchor', right ? 'start' : 'end');
        label.textContent = year;
        label.setAttribute('data-year', year);
        years.appendChild(label);
    });
    svg.appendChild(years);

    mount.appendChild(svg);

    // ---- hover card -------------------------------------------------
    const card = document.createElement('figure');
    card.className = 'spiral-card';
    card.innerHTML = '<div class="c-photo"></div><figcaption>' +
        '<span class="c-title"></span>' +
        '<span class="c-voc"></span>' +
        '<span class="c-date"></span></figcaption>';
    mount.appendChild(card);
    const cImg = card.querySelector('.c-photo');
    const cTitle = card.querySelector('.c-title');
    const cVoc = card.querySelector('.c-voc');
    const cDate = card.querySelector('.c-date');

    let shown = -1, imgTimer = 0, imgToken = 0;
    function show(i, ev) {
        if (i !== shown) {
            shown = i;
            const r = rows[i];
            cTitle.textContent = r[1];
            cVoc.textContent = r[5] || '';
            cDate.textContent = new Date(r[2] + 'T00:00:00').toLocaleDateString('en-US',
                { year: 'numeric', month: 'long', day: 'numeric' });
            const pal = palettes[r[3]];
            card.style.setProperty('--card-bg', pal[0]);
            card.style.setProperty('--card-fg', pal[1]);
            // A div, not an <img> — an image element with no source paints a
            // broken-image glyph. The square shows the interview's text colour
            // until the portrait has decoded, and never fails visibly.
            clearTimeout(imgTimer);
            const token = ++imgToken;
            cImg.style.backgroundImage = '';
            if (r[4]) {
                imgTimer = setTimeout(() => {
                    const pre = new Image();
                    pre.onload = () => {
                        if (token !== imgToken) return;   // a later hover won
                        cImg.style.backgroundImage = `url("${r[4]}")`;
                    };
                    pre.onerror = () => {};               // keep the plain square
                    pre.src = r[4];
                }, 40);
            }
        }
        card.classList.add('on');
        place(ev);
    }
    function place(ev) {
        const box = mount.getBoundingClientRect();
        const w = card.offsetWidth, h = card.offsetHeight;
        let x = ev.clientX - box.left + 18;
        let y = ev.clientY - box.top + 18;
        if (x + w > box.width) x = ev.clientX - box.left - w - 18;
        if (y + h > box.height) y = Math.max(0, ev.clientY - box.top - h - 18);
        card.style.transform = `translate(${x}px, ${y}px)`;
    }
    svg.addEventListener('mousemove', ev => {
        const r = ev.target.closest('rect');
        if (r) show(+r.dataset.i, ev); else hide();
    });
    function hide() { card.classList.remove('on'); shown = -1; }
    svg.addEventListener('mouseleave', hide);


    // ---- show years toggle -------------------------------------------
    const btn = document.createElement('button');
    btn.type = 'button';
    btn.className = 'years-toggle';
    mount.classList.add('years-on');
    btn.setAttribute('aria-pressed', 'true');
    btn.innerHTML = '<span class="box" aria-hidden="true"></span><span class="lbl">Hide years</span>';
    btn.addEventListener('click', () => {
        const on = mount.classList.toggle('years-on');
        btn.setAttribute('aria-pressed', String(on));
        btn.querySelector('.lbl').textContent = on ? 'Hide years' : 'Show years';
    });
    mount.appendChild(btn);


    // ---- watch it grow -----------------------------------------------
    // Replays the archive from launch, one day at a time: each interview's
    // block appears on the day it was published, the date ticking in the
    // corner.
    const DAY_MS = 8;                         // ten years in about 30 seconds
    const rects = [...svg.querySelectorAll('rect[data-i]')];
    const dayOf = s => Date.parse(s + 'T00:00:00Z') / 864e5;
    const days = rects.map((r, i) => dayOf(rows[i][2]));
    const yearMarks = [...years.querySelectorAll('[data-year]')];
    const fmt = new Intl.DateTimeFormat('en-US',
        { year: 'numeric', month: 'long', day: 'numeric', timeZone: 'UTC' });

    const clock = document.createElement('div');
    clock.className = 'grow-date';
    clock.setAttribute('aria-hidden', 'true');
    mount.appendChild(clock);

    // the date sits in the empty eye of the spiral, placed against the
    // drawing itself so it stays centred however the section reflows
    const EYE_X = 15.5, EYE_Y = 12.3;
    function placeClock() {
        const s = svg.getBoundingClientRect(), m = mount.getBoundingClientRect();
        const vw = GRID_W + PAD * 2, vh = GRID_H + PAD * 2;
        clock.style.left = (s.left - m.left + s.width * (EYE_X + PAD) / vw) + 'px';
        clock.style.top = (s.top - m.top + s.height * (EYE_Y + PAD) / vh) + 'px';
    }
    window.addEventListener('resize', placeClock);

    const grow = document.createElement('button');
    grow.type = 'button';
    grow.className = 'years-toggle grow-toggle';
    grow.setAttribute('aria-pressed', 'false');
    // a white play arrow while idle, a pause sign while it runs
    const PLAY = '<svg viewBox="0 0 12 14" aria-hidden="true"><path d="M0 0L12 7L0 14Z"/></svg>';
    const STOP = '<svg viewBox="0 0 12 14" aria-hidden="true"><path d="M1 0H4.5V14H1Z M7.5 0H11V14H7.5Z"/></svg>';
    grow.innerHTML = '<span class="icon">' + PLAY + '</span><span class="lbl">Watch the website grow</span>';

    // the two controls stack in the corner, this one above the years toggle
    const controls = document.createElement('div');
    controls.className = 'spiral-controls';
    controls.append(grow, btn);
    mount.appendChild(controls);

    let raf = 0, run = 0;
    function finish() {
        cancelAnimationFrame(raf); raf = 0; run++;
        rects.forEach(r => r.removeAttribute('visibility'));
        yearMarks.forEach(el => el.classList.remove('pending'));
        mount.classList.remove('growing');
        clock.classList.remove('on');
        grow.setAttribute('aria-pressed', 'false');
        grow.querySelector('.icon').innerHTML = PLAY;
        grow.querySelector('.lbl').textContent = 'Watch the website grow';
    }
    function play() {
        const token = ++run;
        hide();
        outline.setAttribute('visibility', 'hidden');
        rects.forEach(r => r.setAttribute('visibility', 'hidden'));
        // each year's mark waits for that year's first block
        yearMarks.forEach(el => el.classList.add('pending'));
        mount.classList.add('growing');
        // a quote that was up is hidden now, so don't leave the page dimmed
        const section = mount.closest('#archive');
        if (section) section.classList.remove('quote-focus');
        placeClock();
        clock.classList.add('on');
        grow.setAttribute('aria-pressed', 'true');
        grow.querySelector('.icon').innerHTML = STOP;
        grow.querySelector('.lbl').textContent = 'Skip to today';

        const start = days[0], end = days[days.length - 1];
        let t0 = null, shownTo = 0, lastDay = -1, lastYear = '';
        const step = (now) => {
            if (token !== run) return;
            if (t0 === null) t0 = now;
            const day = Math.min(end, start + Math.floor((now - t0) / DAY_MS));
            while (shownTo < rects.length && days[shownTo] <= day) {
                const year = rows[shownTo][2].slice(0, 4);
                if (year !== lastYear) {
                    lastYear = year;
                    years.querySelectorAll(`[data-year="${year}"]`)
                        .forEach(el => el.classList.remove('pending'));
                }
                rects[shownTo++].removeAttribute('visibility');
            }
            if (day !== lastDay) { clock.textContent = fmt.format(day * 864e5); lastDay = day; }
            if (day < end) raf = requestAnimationFrame(step);
            else {
                // hold on the last day a moment before handing the spiral back
                raf = 0;
                setTimeout(() => { if (token === run) finish(); }, 2500);
            }
        };
        raf = requestAnimationFrame(step);
    }
    grow.addEventListener('click', () => {
        if (mount.classList.contains('growing')) finish(); else play();
    });

    const cap = document.querySelector('#spiral-archive-caption .count');
    if (cap) cap.textContent = n.toLocaleString();
})();
