

setTimeout(() => {
    if (!document.body.classList.contains('i18n-loaded')) {
        document.body.classList.add('i18n-loaded');
    }
}, 1500);

document.addEventListener('DOMContentLoaded', () => {

    const SUPPORTED_LANGUAGES = ['en', 'ru', 'zh'];
    const DEFAULT_LANGUAGE = 'en';

    let translations = {};

    async function fetchTranslations() {
        try {

            const response = await fetch(`../assets/js/translations.json`);
            if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
            translations = await response.json();
        } catch (error) {
            console.error("Could not load translations:", error);
            throw error;
        }
    }

    function getLanguageFromURL() {

        const pathParts = window.location.pathname.split('/');

        const lang = pathParts.length > 2 ? pathParts[pathParts.length - 2] : null;
        return SUPPORTED_LANGUAGES.includes(lang) ? lang : null;
    }

    function getLanguageFromStorage() {
        return localStorage.getItem('language');
    }

    function getLanguageFromBrowser() {
        const lang = navigator.language.split('-')[0];
        return SUPPORTED_LANGUAGES.includes(lang) ? lang : null;
    }

    function translatePage(lang) {
        if (!translations[lang]) {
            console.warn(`No translations found for language: ${lang}`);
            return;
        }

        document.querySelectorAll('[data-i18n]').forEach(element => {
            const key = element.getAttribute('data-i18n');
            if (translations[lang] && translations[lang][key]) {
                element.innerHTML = translations[lang][key];
            }
        });

        document.querySelectorAll('[data-tooltip-i18n]').forEach(element => {
            const key = element.getAttribute('data-tooltip-i18n');
             if (translations[lang] && translations[lang][key]) {
                element.setAttribute('data-tooltip', translations[lang][key]);
            }
        });

        document.querySelectorAll('a').forEach(a => {
            try {
                const url = new URL(a.href, window.location.href);
                if (url.hostname === window.location.hostname && url.pathname.endsWith('.html')) {
                    const pageName = url.pathname.split('/').pop();

                    const newPath = `/${lang}/${pageName}`;

                    const basePath = window.location.pathname.substring(0, window.location.pathname.indexOf('/', 1));
                    a.href = `${basePath}${newPath}`;
                }
            } catch (e) {  }
        });
    }

    function setLanguage(lang) {
        if (!SUPPORTED_LANGUAGES.includes(lang)) return;

        localStorage.setItem('language', lang);

        const currentPageName = window.location.pathname.split('/').pop() || 'index.html';

        window.location.href = `../${lang}/${currentPageName}`;
    }

    function initLangSwitcher(currentLang) {
        const switcher = document.querySelector('.lang-switcher');
        if (!switcher) return;

        const currentLangButton = switcher.querySelector('.lang-switcher-current span');
        const dropdown = switcher.querySelector('.lang-switcher-dropdown');
        const currentLangLink = dropdown.querySelector(`a[data-lang="${currentLang}"]`);

        if (currentLangLink && currentLangButton) {
             currentLangButton.textContent = currentLangLink.textContent;
        }

        dropdown.querySelectorAll('a').forEach(a => {
            a.addEventListener('click', (e) => {
                e.preventDefault();
                const newLang = a.getAttribute('data-lang');
                if (newLang !== currentLang) {
                    setLanguage(newLang);
                }
            });
        });
    }

    async function initialize() {
        const urlLang = getLanguageFromURL();

        if (urlLang) {

            try {
                await fetchTranslations();
            } catch (error) {
                document.body.classList.add('i18n-loaded');
                return;
            }
            document.documentElement.lang = urlLang;
            translatePage(urlLang);
            initLangSwitcher(urlLang);
        } else {

            const storedLang = getLanguageFromStorage();
            const browserLang = getLanguageFromBrowser();
            const langToRedirect = storedLang || browserLang || DEFAULT_LANGUAGE;

            window.location.href = `./${langToRedirect}/index.html`;
            return;
        }

        document.body.classList.add('i18n-loaded');
    }

    initialize();
});
