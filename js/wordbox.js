// One word at a time: the word set large, how often it turns up across the
// archive, and a changing set of pull-quotes and images from the interviews
// it appears in. Arrows step through the words; the index below jumps here;
// the button reshuffles the set.

(function () {
    const box = document.getElementById('wordbox');
    if (!box) return;

    const termEl = box.querySelector('.term');
    const countEl = box.querySelector('.count');
    const quotesEl = box.querySelector('.wordbox-quotes');
    const piecesEl = box.querySelector('.wordbox-pieces');
    const piecesNote = box.querySelector('.wordbox-pieces-note');
    const section = document.getElementById('word-viewer');

    const PER_SET = 7;          // quotes shown at a time
    const MAX_IMAGES = 3;       // images shown at a time
    const MAX_RECS = 2;         // recommendations shown at a time
    const ROW = 8, VGAP = 54;   // masonry units

    let words = {}, order = [], at = 0, spiral = null, strip = null;

    const shuffle = (a) => {
        for (let i = a.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [a[i], a[j]] = [a[j], a[i]];
        }
        return a;
    };

    // ---- masonry: every item claims as many 8px rows as it needs --------
    function layout() {
        if (!quotesEl) return;
        // A figure sized with fit-content measures the image's intrinsic
        // width, but the height cap can render it narrower — so match the
        // figure to what the image actually occupies, and the caption with it.
        quotesEl.querySelectorAll('.pulled-photo').forEach(fig => {
            const im = fig.querySelector('img');
            if (!im || !im.naturalWidth) return;
            fig.style.width = '100%';
            const w = im.getBoundingClientRect().width;
            if (w) fig.style.width = Math.round(w) + 'px';
        });
        spans();
        // An image that can't find room beside the rest drops below everything
        // and sits there alone. Let a two-column image take one column, and if
        // it still hangs off the bottom, leave it out of this set.
        for (let tries = 0; tries < 3 && unhang(); tries++) spans();
    }
    function spans() {
        [...quotesEl.children].forEach(el => { el.style.gridRowEnd = 'auto'; });
        [...quotesEl.children].forEach(el => {
            const h = el.getBoundingClientRect().height;
            if (h) el.style.gridRowEnd = 'span ' + Math.max(1, Math.ceil((h + VGAP) / ROW));
        });
    }
    function unhang() {
        // one column (phones) stacks everything anyway
        if (getComputedStyle(quotesEl).gridTemplateColumns.split(' ').length < 2) return false;
        const kids = [...quotesEl.children].filter(el => el.style.display !== 'none');
        if (kids.length < 2) return false;
        const rects = kids.map(el => el.getBoundingClientRect());
        let low = 0;
        rects.forEach((r, i) => { if (r.bottom > rects[low].bottom) low = i; });
        const fig = kids[low];
        const im = fig.classList.contains('pulled-photo') && fig.querySelector('img');
        if (!im || !im.naturalWidth) return false;
        const rest = Math.max(...rects.filter((_, i) => i !== low).map(r => r.bottom));
        const r = rects[low];
        if (r.bottom - rest <= r.height / 2) return false;
        if (fig.classList.contains('wide')) {
            fig.classList.remove('wide');
        } else {
            fig.style.display = 'none';
        }
        return true;
    }
    window.addEventListener('resize', layout);

    // ---- text from the interviews' markdown ----------------------------
    // Quotes and captions arrive as the interviews wrote them: backslash
    // escapes (Y2K\+15), kramdown attributes ({:target="blank"}), <i> tags.
    // Tidy what reads as code and keep <i>/<em>/*…* as real italics — built
    // with text nodes, never innerHTML.
    const decoder = document.createElement('textarea');
    const decode = (s) => { decoder.innerHTML = s; return decoder.value; };
    function tidy(s) {
        return String(s)
            .replace(/\{:[^}]*\}/g, '')
            .replace(/\[([^\]]*)\]\([^)]*\)/g, '$1')      // [text](url) -> text
            .replace(/\*\*([^*]+)\*\*/g, '$1')            // **bold** -> text
            .replace(/(^|[\s(“"])_([^_\n]+)_(?=[\s).,;:!?”"]|$)/g, '$1*$2*')   // _italic_ -> *italic*
            .replace(/\\(?=\s|$)/g, '')                   // a stray trailing backslash
            .replace(/\\([\\`*_{}\[\]()#+\-.!|])/g, '$1')
            .replace(/\s+/g, ' ')
            .trim();
    }
    function richText(el, s) {
        let italic = false;
        tidy(s).split(/(<\/?(?:i|em)\s*>|\*[^*\s][^*]*\*)/i).forEach(part => {
            if (!part) return;
            if (/^<(i|em)\s*>$/i.test(part)) { italic = true; return; }
            if (/^<\/(i|em)\s*>$/i.test(part)) { italic = false; return; }
            let text = part, it = italic;
            if (/^\*[^*\s][^*]*\*$/.test(part)) { text = part.slice(1, -1); it = true; }
            text = decode(text.replace(/<[^>]*>/g, ''));   // any other tag is dropped
            if (!text) return;
            if (it) {
                const i = document.createElement('i');
                i.textContent = text;
                el.appendChild(i);
            } else {
                el.appendChild(document.createTextNode(text));
            }
        });
    }

    // ---- pieces of the set ---------------------------------------------
    function quoteCard(text, rec) {
        const [slug, title, , pi] = rec;
        const [bg, fg] = spiral.p[pi];
        const who = title.split(/\s+on\s+/)[0];

        const el = document.createElement('div');
        el.className = 'quote-card';
        el.style.setProperty('--hl', bg);
        el.style.setProperty('--hlc', fg);

        const p = document.createElement('p');
        richText(p, text);

        const attrib = document.createElement('span');
        attrib.className = 'attrib';
        attrib.append('– ');
        if (rec[4]) {
            const av = document.createElement('img');
            av.className = 'avatar';
            av.src = rec[4].replace('resize=width:200,height:200,fit:crop',
                                    'resize=width:80,height:80,fit:crop');
            av.alt = '';
            av.loading = 'lazy';
            attrib.appendChild(av);
        }
        const a = document.createElement('a');
        a.className = 'link-to-article';
        a.href = 'https://thecreativeindependent.com/people/' + slug + '/';
        a.textContent = who;
        attrib.appendChild(a);

        el.append(p, attrib);
        return el;
    }

    // One line from an interviewee's "recommends" list that uses the word
    function recCard([text, i]) {
        const rec = spiral && spiral.d[i];
        if (!rec) return null;
        const el = document.createElement('div');
        el.className = 'rec-card';

        const label = document.createElement('span');
        label.className = 'rec-label';
        const a = document.createElement('a');
        a.className = 'link-to-article';
        a.href = 'https://thecreativeindependent.com/people/' + rec[0] + '/';
        a.textContent = rec[1].split(/\s+on\s+/)[0];
        label.append(a, ' recommends');

        const p = document.createElement('p');
        richText(p, text);
        el.append(label, p);
        return el;
    }

    function figure(src, cap, rec, wide) {
        const fig = document.createElement('figure');
        fig.className = 'pulled-photo' + (wide ? ' wide' : '');
        const link = document.createElement('a');
        link.className = 'photo-link';
        link.href = 'https://thecreativeindependent.com/people/' + rec[0] + '/';
        link.setAttribute('aria-label', rec[1]);
        const im = document.createElement('img');
        im.src = src;
        im.alt = '';
        im.loading = 'lazy';
        im.addEventListener('load', layout, { once: true });
        im.addEventListener('error', layout, { once: true });
        link.appendChild(im);
        fig.appendChild(link);
        if (cap) {
            const c = document.createElement('figcaption');
            richText(c, cap);
            fig.appendChild(c);
        }
        return fig;
    }

    // ---- draw one set ---------------------------------------------------
    function drawSet() {
        const data = words[order[at]];
        quotesEl.innerHTML = '';
        if (!data || !data.q.length) {
            const none = document.createElement('p');
            none.className = 'wordbox-none';
            none.textContent = 'No pull-quote in the archive uses this one.';
            quotesEl.appendChild(none);
            return;
        }
        const picked = shuffle(data.q.slice()).slice(0, PER_SET);

        // one cluster of squares — a sample, and a different size each draw
        const want = 40 + Math.floor(Math.random() * 161);   // 40–200
        const sample = shuffle((data.idx || []).slice()).slice(0, want);
        const dropAt = Math.floor(picked.length / 2);

        // a couple of the interviewees' own recommendations that use the
        // word, spaced out among the quotes
        const recs = shuffle((data.r || []).slice()).slice(0, MAX_RECS);
        const recSlots = recs.map((_, k) => Math.floor((k + 1) * picked.length / (recs.length + 1)));
        let nextRec = 0;

        let images = 0;
        picked.forEach((q, n) => {
            const rec = spiral.d[q[1]];
            if (!rec) return;
            quotesEl.appendChild(quoteCard(q[0], rec));
            if (q[2] && images < MAX_IMAGES) {
                quotesEl.appendChild(figure(q[2], q[3] || '', rec, images === 0));
                images++;
            }
            while (nextRec < recs.length && recSlots[nextRec] === n) {
                const card = recCard(recs[nextRec++]);
                if (card) quotesEl.appendChild(card);
            }
            if (spiral && n === dropAt && sample.length) {
                quotesEl.appendChild(pieceCluster(sample));
            }
        });
        layout();
        setTimeout(layout, 400);
        setTimeout(layout, 1200);
    }

    // ---- the squares ----------------------------------------------------
    // One per interview that uses the word, broken into clusters and dropped
    // in among the quotes and images rather than sitting in one slab.
    function pieceCluster(indices) {
        const wrap = document.createElement('div');
        wrap.className = 'piece-cluster';

        const label = document.createElement('span');
        label.className = 'cluster-label';
        label.textContent = 'And also mentioned by…';
        wrap.appendChild(label);

        const grid = document.createElement('div');
        grid.className = 'piece-grid';
        const frag = document.createDocumentFragment();
        indices.forEach(i => {
            const rec = spiral.d[i];
            if (!rec) return;
            const a = document.createElement('a');
            a.className = 'piece';
            a.href = 'https://thecreativeindependent.com/people/' + rec[0] + '/';
            a.style.background = spiral.p[rec[3]][2] || spiral.p[rec[3]][0];
            a.setAttribute('aria-label', rec[1]);
            a.dataset.i = i;
            frag.appendChild(a);
        });
        grid.appendChild(frag);
        wrap.appendChild(grid);
        return wrap;
    }

    // the word is set as large as its column allows
    function fit() {
        // measure against the band the word actually sits in — the head is
        // full-bleed, so #wordbox is far narrower and would shrink everything
        const holder = termEl.parentElement;
        const room = (holder && holder.clientWidth) || box.clientWidth;
        if (!room) return;
        termEl.style.fontSize = '';
        const base = parseFloat(getComputedStyle(termEl).fontSize);
        // scrollWidth is the word's full width even when max-width clips the
        // box; the few px spare cover the pencil filter's wobble
        const w = termEl.scrollWidth;
        const fits = room - 8;
        if (w > fits) termEl.style.fontSize = Math.floor(base * (fits / w)) + 'px';
    }
    window.addEventListener('resize', fit);

    function render(i) {
        if (!order.length || !Number.isFinite(i)) return;
        at = (i + order.length) % order.length;
        const name = order[at];
        const data = words[name];
        if (!data) return;
        termEl.textContent = name;
        fit();
        if (strip) {
            strip.querySelectorAll('.strip-word.on').forEach(b => b.classList.remove('on'));
            const cur = strip.querySelector(`.strip-word[data-word="${name}"]`);
            if (cur) {
                cur.classList.add('on');
                // slide the strip sideways only, so the page itself never jumps
                strip.scrollTo({
                    left: cur.offsetLeft - (strip.clientWidth - cur.offsetWidth) / 2,
                    behavior: 'smooth'
                });
            }
        }
        const people = (data.idx || []).length;
        countEl.textContent = 'Mentioned ' + data.c.toLocaleString() +
            (data.c === 1 ? ' time' : ' times') +
            (people ? ' by ' + people.toLocaleString() +
                      (people === 1 ? ' person' : ' people') : '') + '.';
        drawSet();
    }

    function show(name, jump) {
        const i = order.indexOf(name);
        if (i < 0) return;
        render(i);
        if (jump) section.scrollIntoView({ block: 'start' });
    }

    // ---- hover card over the squares ------------------------------------
    let hoverCard = null, cImg, cTitle, cVoc, cDate, shownAt = -1, imgTimer = 0, imgToken = 0;

    function buildCard() {
        hoverCard = document.createElement('figure');
        hoverCard.className = 'spiral-card';
        hoverCard.innerHTML = '<div class="c-photo"></div><figcaption>' +
            '<span class="c-title"></span><span class="c-voc"></span>' +
            '<span class="c-date"></span></figcaption>';
        section.appendChild(hoverCard);
        cImg = hoverCard.querySelector('.c-photo');
        cTitle = hoverCard.querySelector('.c-title');
        cVoc = hoverCard.querySelector('.c-voc');
        cDate = hoverCard.querySelector('.c-date');
    }

    function showCard(i, ev) {
        if (!hoverCard) buildCard();
        const rec = spiral.d[i];
        if (!rec) return;
        if (i !== shownAt) {
            shownAt = i;
            cTitle.textContent = rec[1];
            cVoc.textContent = rec[5] || '';
            cDate.textContent = new Date(rec[2] + 'T00:00:00').toLocaleDateString('en-US',
                { year: 'numeric', month: 'long', day: 'numeric' });
            const pal = spiral.p[rec[3]];
            hoverCard.style.setProperty('--card-bg', pal[0]);
            hoverCard.style.setProperty('--card-fg', pal[1]);
            // the dotted black edge vanishes on a black card, so it goes white
            hoverCard.classList.toggle('on-black', pal[0].toUpperCase() === '#000000');
            clearTimeout(imgTimer);
            const token = ++imgToken;
            cImg.style.backgroundImage = '';
            if (rec[4]) {
                imgTimer = setTimeout(() => {
                    const pre = new Image();
                    pre.onload = () => {
                        if (token !== imgToken) return;
                        cImg.style.backgroundImage = `url("${rec[4]}")`;
                    };
                    pre.onerror = () => {};
                    pre.src = rec[4];
                }, 40);
            }
        }
        hoverCard.classList.add('on');
        const b = section.getBoundingClientRect();
        const w = hoverCard.offsetWidth, h = hoverCard.offsetHeight;
        let x = ev.clientX - b.left + 18;
        let y = ev.clientY - b.top + 18;
        if (x + w > b.width) x = ev.clientX - b.left - w - 18;
        if (y + h > b.height) y = Math.max(0, ev.clientY - b.top - h - 18);
        hoverCard.style.transform = `translate(${x}px, ${y}px)`;
    }
    function hideCard() {
        if (hoverCard) hoverCard.classList.remove('on');
        shownAt = -1;
    }

    // ---- go --------------------------------------------------------------
    Promise.all([
        fetch('js/words.json').then(r => r.json()),
        fetch('js/spiral-data.json').then(r => r.json()).catch(() => null)
    ]).then(([data, sp]) => {
        words = data;
        spiral = sp;
        const listed = [...document.querySelectorAll('.word-row[data-word]')]
            .map(r => r.dataset.word).filter(w => data[w]);
        order = listed.length ? listed : Object.keys(data);

        // every word, shuffled into a strip above the big one; a click
        // brings that word up
        const head = box.querySelector('.wordbox-head');
        if (head) {
            strip = document.createElement('div');
            strip.className = 'wordbox-strip';
            // each word fills with its own colour on hover, taken from the
            // vivid side of the interview palettes
            const fills = sp ? shuffle([...new Set(sp.p.map(p => p[2] || p[0]))]) : [];
            shuffle(order.slice()).forEach((w, n) => {
                const b = document.createElement('button');
                b.type = 'button';
                b.className = 'strip-word';
                b.textContent = w;
                b.dataset.word = w;
                if (fills.length) b.style.setProperty('--fill', fills[n % fills.length]);
                b.addEventListener('click', () => show(w));
                strip.appendChild(b);
            });
            head.prepend(strip);
            strip.addEventListener('scroll', () => {
                strip.classList.toggle('scrolled', strip.scrollLeft > 2);
            }, { passive: true });
        }
        // a different word each visit, but never open on one of the bleak ones
        const openers = order.filter(w => !['death', 'hate'].includes(w));
        const from = openers.length ? openers : order;
        render(order.indexOf(from[Math.floor(Math.random() * from.length)]));

        box.querySelectorAll('.wordbox-nav[data-step]').forEach(btn => {
            btn.addEventListener('click', () => render(at + Number(btn.dataset.step)));
        });

        const more = document.getElementById('wordbox-more');
        if (more) more.addEventListener('click', drawSet);

        document.querySelectorAll('.word-row[data-word]').forEach(row => {
            const label = row.querySelector('.label');
            if (label) label.addEventListener('click', () => show(row.dataset.word, true));
        });

        // the squares live in the grid now, so listen there
        if (quotesEl) {
            quotesEl.addEventListener('mousemove', ev => {
                const sq = ev.target.closest('.piece');
                if (sq && spiral) showCard(+sq.dataset.i, ev); else hideCard();
            });
            quotesEl.addEventListener('mouseleave', hideCard);
        }

        document.addEventListener('keydown', e => {
            if (e.target.matches('input, textarea')) return;
            const r = section.getBoundingClientRect();
            if (r.bottom < 0 || r.top > window.innerHeight) return;
            if (e.key === 'ArrowLeft') render(at - 1);
            if (e.key === 'ArrowRight') render(at + 1);
        });
    }).catch(() => {});
})();
