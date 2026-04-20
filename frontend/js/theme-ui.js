/**
 * Tema claro / oscuro (persistencia en localStorage, atributo data-theme en <html>).
 */
(function () {
    const UI_THEME_KEY = 'ui_theme';

    function applyThemeFromStorage() {
        try {
            const t = localStorage.getItem(UI_THEME_KEY);
            document.documentElement.setAttribute('data-theme', t === 'dark' ? 'dark' : 'light');
        } catch (_) {
            document.documentElement.setAttribute('data-theme', 'light');
        }
    }

    function getTheme() {
        return localStorage.getItem(UI_THEME_KEY) === 'dark' ? 'dark' : 'light';
    }

    function setTheme(mode) {
        const v = mode === 'dark' ? 'dark' : 'light';
        try {
            localStorage.setItem(UI_THEME_KEY, v);
        } catch (_) {}
        document.documentElement.setAttribute('data-theme', v);
    }

    function bindThemeRadios(root) {
        const el = root && root.querySelector ? root : document;
        const current = getTheme();
        el.querySelectorAll('input[name="ui-theme"]').forEach((r) => {
            r.checked = r.value === current;
            r.addEventListener('change', () => {
                if (r.checked) setTheme(r.value);
            });
        });
    }

    window.UITheme = {
        UI_THEME_KEY,
        applyThemeFromStorage,
        getTheme,
        setTheme,
        bindThemeRadios
    };
})();
