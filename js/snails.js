// Snails, from thecreativeindependent.com/snails/ — one at a time, fading up
// somewhere around the spiral, playing for a few seconds, fading out again.

const SNAIL_VIDEOS = [
    'https://s3.amazonaws.com/tci-assets/home-videos/crop/close-baby-snail-walk_CROP.m4v',
    'https://s3.amazonaws.com/tci-assets/home-videos/crop/leaf-snail-2016_CROP.m4v',
    'https://s3.amazonaws.com/tci-assets/home-videos/crop/red-leaf-snail-2016_CROP.m4v',
    'https://s3.amazonaws.com/tci-assets/home-videos/crop/salad-and-garden-snail-2017_CROP.m4v',
    'https://s3.amazonaws.com/tci-assets/home-videos/crop/snail-slugs-along-patio-floor-2017_CROP.m4v',
    'https://s3.amazonaws.com/tci-assets/home-videos/crop/snail-walking-on-timber-2017_CROP_2.m4v',
    'https://s3.amazonaws.com/tci-assets/home-videos/crop/tci-snail-december-2017_CROP_2.m4v',
    'https://s3.amazonaws.com/tci-assets/home-videos/crop/tci-snail-september-2017_CROP.m4v',
    'https://tci-assets.s3.amazonaws.com/home-videos/crop/tci-snail-2018-04-13_CROP.m4v',
    'https://tci-assets.s3.amazonaws.com/home-videos/crop/tci-snail-october-2018_CROP.m4v'
];

(function () {
    const section = document.getElementById('archive');
    const spiral = document.getElementById('spiral-archive');
    if (!section || !spiral) return;
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;

    const FADE = 2000;               // matches the CSS transition
    const rand = (a, b) => a + Math.random() * (b - a);
    let last = -1;

    // Somewhere around the spiral: an angle out past its edge, kept on screen.
    function placement(size) {
        const s = spiral.getBoundingClientRect();
        const a = section.getBoundingClientRect();
        const cx = s.left - a.left + s.width / 2;
        const cy = s.top - a.top + s.height / 2;
        const angle = rand(0, Math.PI * 2);
        const radius = Math.min(s.width, s.height) * rand(0.42, 0.72);
        let x = cx + Math.cos(angle) * radius - size / 2;
        let y = cy + Math.sin(angle) * radius * 0.92 - size / 2;
        const pad = 8;
        x = Math.max(pad, Math.min(a.width - size - pad, x));
        y = Math.max(pad, Math.min(a.height - size - pad, y));
        return { x, y };
    }

    function next() {
        let i = Math.floor(Math.random() * SNAIL_VIDEOS.length);
        if (i === last) i = (i + 1) % SNAIL_VIDEOS.length;   // no immediate repeat
        last = i;

        const size = rand(130, 210);
        const { x, y } = placement(size);

        const v = document.createElement('video');
        v.className = 'snail';
        v.src = SNAIL_VIDEOS[i];
        v.muted = true;
        v.defaultMuted = true;
        v.loop = true;
        v.playsInline = true;
        v.setAttribute('muted', '');
        v.setAttribute('playsinline', '');
        v.setAttribute('aria-hidden', 'true');
        v.style.width = size + 'px';
        v.style.left = Math.round(x) + 'px';
        v.style.top = Math.round(y) + 'px';
        section.appendChild(v);

        const hold = rand(4000, 7000);
        let done = false;
        const finish = () => {
            if (done) return;
            done = true;
            v.classList.remove('on');
            setTimeout(() => {
                v.pause();
                v.removeAttribute('src');
                v.load();
                v.remove();
                setTimeout(next, rand(16000, 34000));
            }, FADE);
        };

        let started = false;
        const start = () => {
            if (started || done) return;
            started = true;
            const p = v.play();
            if (p && p.catch) p.catch(() => {});
            void v.offsetWidth;          // force layout so the fade actually runs
            v.classList.add('on');
            setTimeout(finish, FADE + hold);
        };
        // whichever arrives first — some browsers are stingy with canplay
        v.addEventListener('loadeddata', start, { once: true });
        v.addEventListener('canplay', start, { once: true });
        v.addEventListener('playing', start, { once: true });
        v.addEventListener('error', finish, { once: true });
        setTimeout(start, 2500);        // last resort: show it anyway
        setTimeout(() => { if (!started) finish(); }, 12000);
    }

    // only run the snails while the section is actually on screen
    let running = false;
    new IntersectionObserver((entries) => {
        entries.forEach(e => {
            if (e.isIntersecting && !running) { running = true; setTimeout(next, rand(4000, 9000)); }
        });
    }, { threshold: 0.15 }).observe(section);
})();


// And a drawn snail, now and then, crawls along the dotted leaders of the
// word index: one row, one way, slowly, then gone.
(function () {
    const list = document.querySelector('#words .word-list');
    if (!list) return;
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;

    const SRC_RIGHT = 'images/email-snail-note.png';        // faces right
    const SRC_LEFT = 'images/email-snail-note-flip.png';    // faces left
    [SRC_RIGHT, SRC_LEFT].forEach(src => { new Image().src = src; });

    // the drawing's own proportions; smaller on phones, where rows are short
    const size = () => {
        const w = window.innerWidth <= 535 ? 70 : 110;
        return { W: w, H: w * 136 / 242 };
    };
    // how far down the drawing its foot line runs, and how far a dot's
    // middle sits above the text baseline — the foot rests on the dots
    const FOOT = 0.77, DOT_MID = 2;
    const SPEED = 22;                 // px per second — it is a snail
    const FADE = 1000;
    const rand = (a, b) => a + Math.random() * (b - a);

    // the dots' text baseline, measured rather than guessed
    function baseline(dots) {
        const probe = document.createElement('span');
        probe.style.cssText = 'display:inline-block;width:0;height:0;vertical-align:baseline';
        dots.appendChild(probe);
        const y = probe.getBoundingClientRect().top;
        probe.remove();
        return y;
    }

    function crawl() {
        const { W, H } = size();
        // only rows whose run of dots is long enough to crawl along
        const rows = [...list.querySelectorAll('.word-row')].filter(r => {
            const d = r.querySelector('.dots');
            return d && d.getBoundingClientRect().width > W * 1.6;
        });
        if (!rows.length) return schedule();

        const row = rows[Math.floor(Math.random() * rows.length)];
        const dots = row.querySelector('.dots');
        const rb = row.getBoundingClientRect(), db = dots.getBoundingClientRect();
        const rightward = Math.random() < 0.5;
        const from = rightward ? db.left - rb.left : db.right - rb.left - W;
        const to = rightward ? db.right - rb.left - W : db.left - rb.left;

        const img = document.createElement('img');
        img.className = 'index-snail';
        img.src = rightward ? SRC_RIGHT : SRC_LEFT;
        img.alt = '';
        img.setAttribute('aria-hidden', 'true');
        img.style.width = W + 'px';
        img.style.top = Math.round(baseline(dots) - DOT_MID - rb.top - H * FOOT) + 'px';
        img.style.transform = `translateX(${from}px)`;
        row.appendChild(img);

        const ms = Math.abs(to - from) / SPEED * 1000;
        void img.offsetWidth;             // lay it out first so the moves animate
        img.style.transition = `opacity ${FADE}ms ease, transform ${ms}ms linear`;
        img.classList.add('on');
        img.style.transform = `translateX(${to}px)`;
        setTimeout(() => img.classList.remove('on'), Math.max(0, ms - FADE));
        setTimeout(() => { img.remove(); schedule(); }, ms + 200);
    }

    // occasionally, and only while the index is on screen
    let visible = false, timer = 0;
    function schedule(ms = rand(20000, 45000)) {
        clearTimeout(timer);
        timer = setTimeout(() => visible ? crawl() : schedule(rand(3000, 8000)), ms);
    }
    new IntersectionObserver(es => es.forEach(e => { visible = e.isIntersecting; }),
        { threshold: 0.2 }).observe(list);
    schedule(rand(5000, 10000));
})();
