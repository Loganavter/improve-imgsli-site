

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
            const response = await fetch('/assets/js/translations.json');
            if (!response.ok) {
                throw new Error(`Could not load translations.json`);
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
        return lang || 'en';
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

    }

    function setLanguage(lang) {
        if (!SUPPORTED_LANGUAGES.includes(lang)) return;

        localStorage.setItem('language', lang);

        const currentPath = window.location.pathname;
        const pathParts = currentPath.split('/').filter(p => p !== '');

        const langIndex = pathParts.findIndex(part => SUPPORTED_LANGUAGES.includes(part));
        if (langIndex !== -1) {
            pathParts.splice(langIndex, 1);
        }

        const restOfPath = pathParts.join('/');
        let newPath = `/${lang}`;
        if (restOfPath) {
            newPath += `/${restOfPath}`;
        }

        if (!newPath.endsWith('/') && newPath.split('/').length > 2) {
             newPath += '/';
        }

        if (currentPath !== newPath) {
            window.location.href = newPath;
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
                setLanguage(newLang);
            });
        });
    }

    async function initialize() {
        const currentLang = getLanguageFromURL();

        await fetchTranslations();

        window.siteTranslations = translations;
        window.currentLang = currentLang;

        document.documentElement.lang = currentLang;
        translatePage(currentLang);
        initLangSwitcher(currentLang);

        document.body.classList.add('i18n-loaded');
    }

    initialize();
});

