
setTimeout(() => {
    if (!document.body.classList.contains('i18n-loaded')) {
        document.body.classList.add('i18n-loaded');
    }
}, 1000);

// Добавьте эту строку
const REPO_NAME = 'improve-imgsli-site'; 

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

        // Новая, исправленная логика для обновления ссылок
        document.querySelectorAll('a').forEach(a => {
            try {
                const url = new URL(a.href, window.location.href);
                // Обновляем только внутренние ссылки на .html страницы
                if (url.hostname === window.location.hostname && url.pathname.endsWith('.html')) {
                    const pageName = url.pathname.split('/').pop();
                    a.pathname = `/${REPO_NAME}/${lang}/${pageName}`;
                }
            } catch (e) { /* Игнорируем невалидные URL вроде mailto: */ }
        });
    }

    // ЗАМЕНИТЕ СТАРУЮ ФУНКЦИЮ setLanguage НА ЭТУ
    function setLanguage(lang) {
        if (!SUPPORTED_LANGUAGES.includes(lang)) return;

        localStorage.setItem('language', lang);

        const page = window.location.pathname.split('/').pop() || 'index.html';
        
        // Новая логика построения пути
        const newPath = `/${REPO_NAME}/${lang}/${page}`;

        if (newPath !== window.location.pathname) {
            window.location.href = window.location.origin + newPath;
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
