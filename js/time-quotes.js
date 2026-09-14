// Quotes about time, drawn from the archive's own pull-quotes. One at a time,
// fading up over the spiral with a line and a circle back to the block it
// came from.

(function () {
    const section = document.getElementById('archive');
    const mount = document.getElementById('spiral-archive');
    if (!section || !mount) return;
    const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    const FADE = 1400;
    const rand = (a, b) => a + Math.random() * (b - a);
    let quotes = [], last = -1, layer = null;
    // one pending timer at a time, so pausing and resuming never doubles up
    let timer = 0, paused = false, dismissCurrent = null;

    // the spiral's data is large, so give a slow connection up to a minute
    function ready(cb, tries = 0) {
        if (mount.querySelector('svg rect')) return cb();
        if (tries > 240) return;
        setTimeout(() => ready(cb, tries + 1), 250);
    }

    function makeLayer() {
        const NS = 'http://www.w3.org/2000/svg';
        layer = document.createElementNS(NS, 'svg');
        layer.setAttribute('id', 'time-quote-layer');
        layer.setAttribute('aria-hidden', 'true');
        section.appendChild(layer);
        return layer;
    }

    function show(q) {
        // blocks are indexed by position in the archive, so find this
        // interview's block by its link
        const link = mount.querySelector(
            `a[href="https://thecreativeindependent.com/people/${q.slug}/"]`);
        const rect = link && link.querySelector('rect');
        if (!rect) return schedule(400);

        const sb = section.getBoundingClientRect();
        const rb = rect.getBoundingClientRect();
        // nobody would see a quote pinned to a block that's scrolled out of
        // view, so wait until the spiral is back on screen
        if (rb.bottom < 0 || rb.top > window.innerHeight) return schedule(1500);
        const mb = mount.getBoundingClientRect();
        const bx = rb.left - sb.left + rb.width / 2;
        const by = rb.top - sb.top + rb.height / 2;
        const cx = mb.left - sb.left + mb.width / 2;
        const cy = mb.top - sb.top + mb.height / 2;

        // the card sits outward from the centre, on whichever side has room
        const box = document.createElement('figure');
        box.className = 'time-quote';
        box.innerHTML = `<q></q><span class="who"><a></a></span>`;
        box.querySelector('q').textContent = q.q;
        const whoWrap = box.querySelector('.who');
        const anchor = whoWrap.querySelector('a');
        whoWrap.insertBefore(document.createTextNode('– '), anchor);
        if (q.img) {                       // portrait sits after the dash
            const av = document.createElement('img');
            av.className = 'avatar';
            av.src = q.img;
            av.alt = '';
            av.loading = 'lazy';
            whoWrap.insertBefore(av, anchor);
        }
        const who = box.querySelector('.who a');
        who.textContent = q.who;
        who.setAttribute('href', 'https://thecreativeindependent.com/people/' + q.slug + '/');
        box.style.setProperty('--q-bg', q.bg);
        box.style.setProperty('--q-fg', q.fg);
        section.appendChild(box);

        const bw = box.offsetWidth, bh = box.offsetHeight;
        const pad = 14, gap = 34;

        // Sit the card on a diagonal from its block, close enough that the
        // line stays short. Clamped to the visible band, but the diagonal is
        // chosen so clamping rarely has to move it.
        const vw = window.innerWidth, vh = window.innerHeight;
        const cap = document.getElementById('spiral-archive-caption');
        const capTop = cap ? cap.getBoundingClientRect().top - sb.top : sb.height;

        const loX = Math.max(pad, -sb.left + pad);
        const hiX = Math.min(sb.width - pad, vw - sb.left - pad);
        // Held to the section, not the viewport: free to ride up over the
        // heading, but never down into the caption or out past the section
        // however far the page has scrolled.
        let loY = pad;
        let hiY = Math.min(sb.height - pad, capTop - 10);
        if (hiY - loY < bh) { const mid = (loY + hiY) / 2; loY = Math.max(pad, mid - bh / 2); hiY = loY + bh; }
        const clampX = v => hiX - bw < loX ? loX : Math.max(loX, Math.min(hiX - bw, v));
        const clampY = v => Math.max(loY, Math.min(hiY - bh, v));

        // four diagonals only, so the leader is never horizontal or vertical
        const reach = 58;
        const diagonals = [[1, 1], [1, -1], [-1, 1], [-1, -1]];
        // prefer the diagonal pointing away from the middle of the spiral
        diagonals.sort((a, b) => {
            const score = d => (d[0] * (bx - cx) + d[1] * (by - cy));
            return score(b) - score(a);
        });

        let best = null;
        for (const [sx, sy] of diagonals) {
            const px = sx > 0 ? bx + reach : bx - reach - bw;
            const py = sy > 0 ? by + reach : by - reach - bh;
            const cl = { x: clampX(px), y: clampY(py) };
            const slip = Math.hypot(cl.x - px, cl.y - py);
            const covers = bx > cl.x - 10 && bx < cl.x + bw + 10 &&
                           by > cl.y - 10 && by < cl.y + bh + 10;
            if (covers) continue;
            if (!best || slip < best.slip) best = { x: cl.x, y: cl.y, slip };
            if (slip < 1) break;
        }
        if (!best) best = { x: clampX(bx - bw / 2), y: clampY(by + reach) };
        const x = best.x, y = best.y;
        box.style.left = Math.round(x) + 'px';
        box.style.top = Math.round(y) + 'px';

        // circle on the block, line from it to the nearest edge of the card
        layer.setAttribute('viewBox', `0 0 ${sb.width} ${sb.height}`);
        layer.setAttribute('width', sb.width);
        layer.setAttribute('height', sb.height);
        layer.innerHTML = '';
        const NS = 'http://www.w3.org/2000/svg';
        const r = 9;
        const tx = Math.max(x, Math.min(x + bw, bx));
        const ty = Math.max(y, Math.min(y + bh, by));
        const dx = tx - bx, dy = ty - by, d = Math.hypot(dx, dy) || 1;
        const line = document.createElementNS(NS, 'line');
        line.setAttribute('x1', bx + (dx / d) * r);
        line.setAttribute('y1', by + (dy / d) * r);
        line.setAttribute('x2', tx); line.setAttribute('y2', ty);
        const circ = document.createElementNS(NS, 'circle');
        circ.setAttribute('cx', bx); circ.setAttribute('cy', by); circ.setAttribute('r', r);
        layer.appendChild(line); layer.appendChild(circ);

        void box.offsetWidth;
        box.classList.add('on');
        layer.classList.add('on');
        // everything else in the section dims back, leaving the quote and
        // its block at full strength
        rect.classList.add('focus');
        section.classList.add('quote-focus');

        // Hovering the card pauses it: the timer is cleared on the way in and
        // only restarts on the way out. A fade already under way is reversed.
        let hideTimer = 0, killTimer = 0, held = false, leaving = false;
        const dismiss = () => {
            if (leaving) return;
            leaving = true;
            clearTimeout(hideTimer);
            box.classList.remove('on');
            layer.classList.remove('on');
            section.classList.remove('quote-focus');
            killTimer = setTimeout(() => {
                rect.classList.remove('focus');
                box.remove(); layer.innerHTML = '';
                if (dismissCurrent === dismiss) dismissCurrent = null;
                schedule(rand(1500, 3500));
            }, FADE);
        };
        dismissCurrent = dismiss;
        const arm = (ms) => {
            clearTimeout(hideTimer);
            hideTimer = setTimeout(() => { if (!held) dismiss(); }, ms);
        };
        // mouseover/mouseout bubble, so this covers the quote and the
        // attribution without firing as the pointer crosses between them
        box.addEventListener('mouseover', () => {
            if (paused) return;               // a paused quote stays gone
            held = true;
            leaving = false;
            clearTimeout(hideTimer);
            clearTimeout(killTimer);          // catch it mid-fade
            box.classList.add('on');
            layer.classList.add('on');
            section.classList.add('quote-focus');
        });
        box.addEventListener('mouseout', (e) => {
            if (e.relatedTarget && box.contains(e.relatedTarget)) return;
            held = false;
            arm(1600);
        });
        arm(FADE + rand(7000, 9500));
    }

    function schedule(ms) {
        clearTimeout(timer);
        timer = setTimeout(next, ms);
    }

    function next() {
        if (!quotes.length || paused) return;
        // hold off while the spiral is replaying its growth, or showing only
        // one kind of piece
        if (mount.classList.contains('growing') ||
            mount.classList.contains('filtering')) return schedule(1000);
        let i = Math.floor(Math.random() * quotes.length);
        if (i === last) i = (i + 1) % quotes.length;
        last = i;
        show(quotes[i]);
    }

    // "Pause quotes", alongside the other spiral controls
    function addToggle() {
        const controls = mount.querySelector('.spiral-controls');
        if (!controls || controls.querySelector('.quotes-toggle')) return;
        // the watercolour spiral marks the button either way and turns when
        // toggled; it is built once so the turn can animate
        const btn = document.createElement('button');
        btn.type = 'button';
        btn.className = 'years-toggle grow-toggle quotes-toggle';
        btn.innerHTML = '<span class="icon"><img src="images/spiral-watercolor-04.png" alt="" aria-hidden="true"></span>' +
            '<span class="lbl"></span>';
        const lbl = btn.querySelector('.lbl');
        const paint = () => {
            btn.setAttribute('aria-pressed', String(paused));
            lbl.textContent = paused ? 'Play quotes' : 'Pause quotes';
        };
        paint();
        btn.addEventListener('click', () => {
            paused = !paused;
            paint();
            if (paused) {
                clearTimeout(timer);
                if (dismissCurrent) dismissCurrent();
            } else {
                schedule(800);
            }
        });
        controls.appendChild(btn);
    }

    // picking one kind of piece in the dropdown clears a quote that is up;
    // next() holds any new one back until the filter is set to All again
    new MutationObserver(() => {
        if (mount.classList.contains('filtering') && dismissCurrent) dismissCurrent();
    }).observe(mount, { attributes: true, attributeFilter: ['class'] });

    fetch('js/time-quotes.json')
        .then(r => r.json())
        .then(data => {
            quotes = data;
            if (reduce) return;
            makeLayer();
            ready(addToggle);
            let started = false;
            new IntersectionObserver(es => es.forEach(e => {
                if (e.isIntersecting && !started) { started = true; ready(() => schedule(2500)); }
            }), { threshold: 0.15 }).observe(section);
        })
        .catch(() => {});
})();
