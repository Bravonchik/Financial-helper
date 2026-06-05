// ──────────────────────────────────────────────
// Анимация смены страниц
// ──────────────────────────────────────────────
document.addEventListener('DOMContentLoaded', function () {
    document.querySelectorAll('a.nav-link:not(.active)').forEach(link => {
        const href = link.getAttribute('href');
        if (!href || href.startsWith('#')) return;
        link.addEventListener('click', function (e) {
            e.preventDefault();
            document.body.classList.add('page-exit');
            setTimeout(() => { window.location.href = href; }, 220);
        });
    });
});
