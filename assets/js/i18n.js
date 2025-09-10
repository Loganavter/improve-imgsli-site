setTimeout(() => {
    if (!document.body.classList.contains('i18n-loaded')) {
        document.body.classList.add('i18n-loaded');
    }
}, 1500);

document.addEventListener('DOMContentLoaded', () => {

    const SUPPORTED_LANGUAGES = ['en', 'ru', 'zh'];
    let translations = {};

    async function fetchTranslations() {
        try {

            const potentialPaths = [
                '../assets/js/translations.json',
                '../../assets/js/translations.json'
            ];

            let response;
            for (const path of potentialPaths) {
                try {
                    response = await fetch(path);
                    if (response.ok) break;
                } catch (e) {  }
            }

            if (!response || !response.ok) {
                throw new Error(`Could not load translations.json from any known path.`);
            }

            translations = await response.json();
        } catch (error) {
            console.error("Could not load translations:", error);
            document.body.classList.add('i18n-loaded');
        }
    }

    function getLanguageFromURL() {
        const pathParts = window.location.pathname.split('/').filter(p => p !== '');

        const lang = pathParts.find(part => SUPPORTED_LANGUAGES.includes(part));
        return lang || null;
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
                    const currentLangInPath = SUPPORTED_LANGUAGES.find(l => url.pathname.includes(`/${l}/`));

                    if (currentLangInPath && currentLangInPath !== lang) {
                         a.href = a.href.replace(`/${currentLangInPath}/`, `/${lang}/`);
                    }
                }
            } catch (e) {  }
        });
    }

    function setLanguage(lang) {
        if (!SUPPORTED_LANGUAGES.includes(lang)) return;

        localStorage.setItem('language', lang);

        const currentLang = getLanguageFromURL();
        if (currentLang) {

            const newPath = window.location.pathname.replace(`/${currentLang}/`, `/${lang}/`);
            window.location.href = newPath;
        } else {

            window.location.href = `../${lang}/`;
        }
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

        const currentLang = urlLang || 'en';

        try {
            await fetchTranslations();
        } catch (error) {
            document.body.classList.add('i18n-loaded');
            return;
        }

        window.siteTranslations = translations;
        window.currentLang = currentLang;

        document.documentElement.lang = currentLang;
        translatePage(currentLang);
        initLangSwitcher(currentLang);

        document.body.classList.add('i18n-loaded');
    }

    initialize();
});
