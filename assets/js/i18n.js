
setTimeout(() => {
    if (!document.body.classList.contains('i18n-loaded')) {
        document.body.classList.add('i18n-loaded');
    }
}, 1000);

document.addEventListener('DOMContentLoaded', () => {
    const SUPPORTED_LANGUAGES = ['en', 'ru', 'zh'];
    const DEFAULT_LANGUAGE = 'en';

    let translations = {};

    async function fetchTranslations() {
        try {
            const response = await fetch('/improve-imgsli-site/assets/js/translations.json');
            if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
            translations = await response.json();
        } catch (error) {
            console.error("Could not load translations:", error);
            throw error;
        }
    }

    function getLanguageFromURL() {
        const lang = window.location.pathname.split('/')[1];
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
            if (translations[lang][key]) {
                element.innerHTML = translations[lang][key];
            }
        });

        document.querySelectorAll('[data-tooltip-i18n]').forEach(element => {
            const key = element.getAttribute('data-tooltip-i18n');
            if (translations[lang][key]) {
                element.setAttribute('data-tooltip', translations[lang][key]);
            }
        });

        document.querySelectorAll('a').forEach(a => {
            try {
                const url = new URL(a.href);
                if (url.hostname === window.location.hostname && url.pathname.endsWith('.html')) {
                    const pathParts = url.pathname.split('/');
                    const page = pathParts.pop();

                    if (!SUPPORTED_LANGUAGES.includes(pathParts[1])) {
                         a.pathname = `/${lang}/${page}`;
                    }
                }
            } catch (e) {  }
        });
    }

    function setLanguage(lang) {
        if (!SUPPORTED_LANGUAGES.includes(lang)) return;

        localStorage.setItem('language', lang);

        const currentPath = window.location.pathname;
        const currentLang = getLanguageFromURL();
        const page = currentPath.split('/').pop() || 'index.html';

        let newPath;
        if (currentLang && currentLang !== lang) {

            newPath = currentPath.replace(`/${currentLang}/`, `/${lang}/`);
        } else if (!currentLang) {

            newPath = `/${lang}/${page}`;
        }

        if (newPath && newPath !== currentPath) {
            window.location.pathname = newPath;
        }
    }

    function initLangSwitcher(currentLang) {
        const switcher = document.querySelector('.lang-switcher');
        if (!switcher) return;

        const currentLangButton = switcher.querySelector('.lang-switcher-current');
        const dropdown = switcher.querySelector('.lang-switcher-dropdown');
        const currentLangLink = dropdown.querySelector(`a[data-lang="${currentLang}"]`);

        const buttonTextSpan = currentLangButton.querySelector('span');

        if (currentLangLink && buttonTextSpan) {
             buttonTextSpan.textContent = currentLangLink.textContent;
        } else if (buttonTextSpan) {

            const titleKey = buttonTextSpan.getAttribute('data-i18n');
            if (translations[currentLang] && translations[currentLang][titleKey]) {
                buttonTextSpan.textContent = translations[currentLang][titleKey];
            }
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
        try {
            await fetchTranslations();
        } catch (error) {
            console.error("Failed to load translations:", error);

            document.body.classList.add('i18n-loaded');
            return;
        }

        const urlLang = getLanguageFromURL();
        const storedLang = getLanguageFromStorage();
        const browserLang = getLanguageFromBrowser();

        const lang = urlLang || storedLang || browserLang || DEFAULT_LANGUAGE;

        if (!urlLang) {
            document.documentElement.lang = lang;
            translatePage(lang);
            initLangSwitcher(lang);
            document.body.classList.add('i18n-loaded');
            return;
        }

        document.documentElement.lang = lang;
        translatePage(lang);
        initLangSwitcher(lang);

        document.body.classList.add('i18n-loaded');
    }

    initialize();
});
