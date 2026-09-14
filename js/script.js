// The Creative Independent — Ten Years

// Long name lists collapse. Done in JS so that with JS off the full
// list is simply there.

document.querySelectorAll('ul.names').forEach(list => {
    const items = list.children.length;
    if (items <= 10) return;

    list.classList.add('collapsed');

    const button = document.createElement('button');
    button.className = 'more';
    button.type = 'button';
    button.setAttribute('aria-expanded', 'false');
    button.textContent = `Show all ${items} →`;

    button.addEventListener('click', () => {
        const collapsed = list.classList.toggle('collapsed');
        button.setAttribute('aria-expanded', String(!collapsed));
        button.textContent = collapsed ? `Show all ${items} →` : 'Show fewer ↑';
    });

    list.after(button);
});


// The header imagery drifts in at its own pace — each picture gets its own
// delay and duration, so they never arrive together.
document.querySelectorAll('.scatter').forEach(group => {
    const ims = [...group.querySelectorAll('.im')];
    // spread them across the band without letting two land on top of each other
    const lanes = ims.map((_, i) => i);
    for (let i = lanes.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [lanes[i], lanes[j]] = [lanes[j], lanes[i]];
    }
    ims.forEach((im, i) => {
        im.style.setProperty('--fade-delay', (Math.random() * 3.5).toFixed(2) + 's');
        im.style.setProperty('--fade-dur', (3 + Math.random() * 4).toFixed(2) + 's');

        const laneWidth = 100 / ims.length;
        const left = lanes[i] * laneWidth + Math.random() * (laneWidth * 0.5);
        im.style.left = left.toFixed(1) + '%';
        im.style.right = 'auto';
        im.style.top = (Math.random() * 55 - 8).toFixed(1) + '%';
        im.style.bottom = 'auto';
    });
});


// The header keeps three or four photos up at a time, drawn at random from
// the pile. Every few seconds one fades out and another fades in somewhere
// free, so the band slowly turns over without ever filling up.
(function () {
    const band = document.querySelector('.header-scatter');
    if (!band) return;

    const PHOTOS = ['6116-everlasting-place', 'ac-perlucidus', 'anohniartimage2-2',
        'anohniartimage2', 'art-by-anohni', 'art-by-claire-hentschker',
        'art-is-the-best-videogame-2', 'avery-draut-in-shirt-by-carlos-sanchez-words-laurel-schwulst',
        'catarina-branco-portuguese-interview', 'cloud-897444-1280', 'clouds-2', 'clouds',
        'concert-stils-batch-2-001-copy', 'francisco-cordero-oceguera-2016-published-on-tci-in-2017',
        'hudson-billboard-february-2016-2', 'ian-mackaye-in-conversation-poster-august-2016',
        'img-1727', 'introducing-myself-by-ursula-k-le-guin', 'jetty-viewer',
        'jun-chou-in-shirt-by-carlos-sanchez-words-laurel-schwulst',
        'like-cattle-towards-glow-screening-flyer-20o16-2', 'material-4', 'material-5', 'material-6',
        'min-guhong-for-tci-2-2019', 'park-zoom', 'rock-formations',
        'ryuichi-sakamoto-concert-stils-batch-2-001-copy', 'screenshot-2026-09-12-at-11-41-17-am',
        'shirt-by-carlos-sanchez-words-laurel-schwulst', 'solar-snail-2', 'solar-snail',
        'tci-in-japan-2017-2-2', 'tci-in-japan-2017-2', 'tci-in-japan-november-2017-2',
        'tci-in-mexico-city-february-2017-2', 'tci-post-2025-2', 'tci-post-october-2024',
        'tci-snail-3', 'tci-snail-4', 'tci-snail', 'tci-snails', 'tci-x-are-na-book-launch-october-2018',
        'tci-year-1-flyer-taeyoon-choi', 'the-creative-blur'];
    const LANES = 4;            // one photo per lane, so they never pile up
    const still = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    // a shuffled deck, so every photo comes round before any repeats
    let deck = [];
    const draw = () => {
        if (!deck.length) {
            deck = PHOTOS.slice();
            for (let i = deck.length - 1; i > 0; i--) {
                const j = Math.floor(Math.random() * (i + 1));
                [deck[i], deck[j]] = [deck[j], deck[i]];
            }
        }
        return deck.pop();
    };
    const width = () => {
        const w = window.innerWidth;
        const [min, max] = w <= 535 ? [95, 140] : w <= 900 ? [130, 190] : [180, 300];
        return Math.round(min + Math.random() * (max - min));
    };

    const up = [];              // {el, lane}, oldest first
    function add(delay) {
        const taken = up.map(p => p.lane);
        const free = [...Array(LANES).keys()].filter(l => !taken.includes(l));
        if (!free.length) return;
        const lane = free[Math.floor(Math.random() * free.length)];

        const im = new Image();
        im.className = 'im';
        im.alt = '';
        const laneWidth = 100 / LANES;
        im.style.left = (lane * laneWidth + Math.random() * laneWidth * 0.4).toFixed(1) + '%';
        im.style.top = (Math.random() * 55 - 8).toFixed(1) + '%';
        im.style.width = width() + 'px';
        im.style.setProperty('--fade-delay', (delay || 0).toFixed(2) + 's');
        im.style.setProperty('--fade-dur', (3 + Math.random() * 2).toFixed(2) + 's');
        const slot = { el: im, lane };
        up.push(slot);
        // only step onto the page once loaded, so the fade shows the picture
        im.onload = () => band.append(im);
        im.onerror = () => up.splice(up.indexOf(slot), 1);
        im.src = 'images/imagery/header/' + draw() + '.jpg';
    }
    function remove() {
        const slot = up.shift();
        if (!slot) return;
        slot.el.classList.add('out');
        setTimeout(() => slot.el.remove(), 3200);
    }

    const start = 3 + Math.round(Math.random());
    for (let i = 0; i < start; i++) add(Math.random() * 2.5);
    if (still) return;

    // swap one photo every so often; the count wanders between three and four
    function turn() {
        if (up.length >= 4 || Math.random() < 0.5) remove();
        if (up.length < 4) add(0.4);
        setTimeout(turn, 4500 + Math.random() * 3500);
    }
    setTimeout(turn, 7000);
})();


// The vivid side of the TCI palettes, shared by the title and the logo.
const PALETTE = ['#0072CE', '#0F2BD4', '#1B0699', '#31668A', '#315E47', '#42FFFF',
    '#548AEA', '#560C68', '#5D8D42', '#985E2B', '#AA7423', '#B5D536', '#D8AB38',
    '#DD3D00', '#DDDA00', '#EA4062', '#EDDA46', '#EF00BF', '#F18700', '#F8B494',
    '#FDAA63', '#FF8F7B', '#FFAA00'];


// The pixel spiral in the corner: now and then one of its pixels turns a
// colour from the palettes, holds, and fades back to black.
(function () {
    const logo = document.getElementById('top-spiral');
    if (!logo) return;
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;

    // the drawing's own grid: every shape in it is made of 20.6-unit squares
    const VB_W = 659.8, VB_H = 598, CELL = 20.6;

    fetch('images/logo-spiral.svg').then(r => r.text()).then(text => {
        const svg = new DOMParser().parseFromString(text, 'image/svg+xml');
        const polys = [...svg.querySelectorAll('polygon')].map(p =>
            p.getAttribute('points').trim().split(/\s+/).map(pt => pt.split(',').map(Number)));
        const rects = [...svg.querySelectorAll('rect')].map(r =>
            ['x', 'y', 'width', 'height'].map(a => Number(r.getAttribute(a))));

        const inside = (x, y, pts) => {
            let hit = false;
            for (let i = 0, j = pts.length - 1; i < pts.length; j = i++) {
                const [xi, yi] = pts[i], [xj, yj] = pts[j];
                if ((yi > y) !== (yj > y) && x < (xj - xi) * (y - yi) / (yj - yi) + xi) hit = !hit;
            }
            return hit;
        };

        // which cells of the grid are inked
        const cells = [];
        for (let row = 0; row * CELL < VB_H; row++) {
            for (let col = 0; col * CELL < VB_W; col++) {
                const x = (col + 0.5) * CELL, y = (row + 0.5) * CELL;
                if (rects.some(([rx, ry, w, h]) => x > rx && x < rx + w && y > ry && y < ry + h) ||
                    polys.some(pts => inside(x, y, pts))) cells.push([col, row]);
            }
        }
        if (!cells.length) return;

        // a new pixel every half second to a second, each holding a few
        // seconds, so around six of them are coloured at any moment
        const lit = new Set();
        let lastColor = null;
        function light() {
            setTimeout(light, 500 + Math.random() * 500);
            if (lit.size >= cells.length) return;
            let i = Math.floor(Math.random() * cells.length);
            while (lit.has(i)) i = (i + 1) % cells.length;
            lit.add(i);
            const [col, row] = cells[i];
            let color = PALETTE[Math.floor(Math.random() * PALETTE.length)];
            if (color === lastColor) color = PALETTE[(PALETTE.indexOf(color) + 1) % PALETTE.length];
            lastColor = color;

            const px = document.createElement('span');
            px.className = 'logo-pixel';
            px.setAttribute('aria-hidden', 'true');
            // a hair oversized, so no black edge shows round the colour
            px.style.left = `calc(${(col * CELL / VB_W * 100).toFixed(3)}% - 0.25px)`;
            px.style.top = `calc(${(row * CELL / VB_H * 100).toFixed(3)}% - 0.25px)`;
            px.style.width = `calc(${(CELL / VB_W * 100).toFixed(3)}% + 0.5px)`;
            px.style.height = `calc(${(CELL / VB_H * 100).toFixed(3)}% + 0.5px)`;
            px.style.background = color;
            logo.append(px);

            void px.offsetWidth;
            px.classList.add('on');
            const hold = 3000 + Math.random() * 3000;
            setTimeout(() => px.classList.remove('on'), hold);
            setTimeout(() => { px.remove(); lit.delete(i); }, hold + 2200);
        }
        setTimeout(light, 600);
    }).catch(() => {});
})();


// "TCI Turns 10": one letter at a time fills with a colour from the
// interview palettes, then fades back to its drawn outline.
(function () {
    const h1 = document.querySelector('#masthead h1');
    if (!h1) return;
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;

    const COLORS = PALETTE;
    const pick = (a) => a[Math.floor(Math.random() * a.length)];

    // the heading still reads as one phrase; the letters are only for show
    h1.setAttribute('aria-label', h1.textContent.replace(/\s+/g, ' ').trim());
    const letters = [];
    (function split(node) {
        [...node.childNodes].forEach(n => {
            if (n.nodeType === Node.ELEMENT_NODE) return split(n);
            if (n.nodeType !== Node.TEXT_NODE) return;
            const frag = document.createDocumentFragment();
            [...n.textContent].forEach(ch => {
                if (/\s/.test(ch)) { frag.append(ch); return; }
                const s = document.createElement('span');
                s.className = 'letter';
                s.setAttribute('aria-hidden', 'true');
                s.textContent = ch;
                letters.push(s);
                frag.append(s);
            });
            n.replaceWith(frag);
        });
    })(h1);
    if (!letters.length) return;

    let last = null;
    function light() {
        let s = pick(letters);
        if (s === last || s.classList.contains('lit')) s = pick(letters);
        last = s;
        s.style.setProperty('--fill', pick(COLORS));
        s.classList.add('lit');
        setTimeout(() => s.classList.remove('lit'), 1500 + 2500 + Math.random() * 1500);
        setTimeout(light, 1500 + Math.random() * 2000);
    }
    setTimeout(light, 900);
})();
