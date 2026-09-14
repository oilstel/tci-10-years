// The library countdown: days, hours, minutes and seconds until TCI turns
// twenty, and the snail set down on the year line where today falls.
(function () {
    const box = document.getElementById('library-countdown');
    if (!box) return;

    const START = new Date('2026-09-26T00:00:00-04:00');   // ten years in
    const END = new Date('2036-09-26T00:00:00-04:00');     // twenty

    const clock = box.querySelector('.countdown-clock');
    const snail = box.querySelector('.timeline-snail');
    const unit = (n, word) => `${n.toLocaleString('en-US')} ${word}${n === 1 ? '' : 's'}`;

    function tick() {
        const now = Date.now();
        const left = Math.max(0, END - now);
        const s = Math.floor(left / 1000);
        clock.textContent = `${unit(Math.floor(s / 86400), 'day')}, ` +
            `${unit(Math.floor(s % 86400 / 3600), 'hour')}, ` +
            `${unit(Math.floor(s % 3600 / 60), 'minute')}, and ` +
            `${unit(s % 60, 'second')}`;

        const t = Math.min(1, Math.max(0, (now - START) / (END - START)));
        snail.style.setProperty('--t', t.toFixed(6));
    }
    tick();
    setInterval(tick, 1000);
})();
