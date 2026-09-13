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


// "TCI Turns 10": one letter at a time fills with a colour from the
// interview palettes, then fades back to its drawn outline.
(function () {
    const h1 = document.querySelector('#masthead h1');
    if (!h1) return;
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;

    // the vivid side of the TCI palettes
    const COLORS = ['#0072CE', '#0F2BD4', '#1B0699', '#31668A', '#315E47', '#42FFFF',
        '#548AEA', '#560C68', '#5D8D42', '#985E2B', '#AA7423', '#B5D536', '#D8AB38',
        '#DD3D00', '#DDDA00', '#EA4062', '#EDDA46', '#EF00BF', '#F18700', '#F8B494',
        '#FDAA63', '#FF8F7B', '#FFAA00'];
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


// The scattered photographs do the same, more slowly: one at a time warms
// from gray into its own colour, holds, and fades back.
(function () {
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    const shown = () => [...document.querySelectorAll('.scatter .im')]
        .filter(im => getComputedStyle(im).display !== 'none');

    let last = null;
    function bloom() {
        const ims = shown().filter(im => im !== last && !im.classList.contains('lit'));
        if (ims.length) {
            const im = ims[Math.floor(Math.random() * ims.length)];
            last = im;
            im.classList.add('lit');
            setTimeout(() => im.classList.remove('lit'), 3000 + 3000 + Math.random() * 2000);
        }
        setTimeout(bloom, 4000 + Math.random() * 4000);
    }
    // wait until the pictures have finished drifting in
    setTimeout(bloom, 8000);
})();
