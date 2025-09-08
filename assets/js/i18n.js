// --- НАЧАЛО ФАЙЛА assets/js/i18n.js ---

// Немедленно показываем контент, если что-то пойдёт не так
setTimeout(() => {
    if (!document.body.classList.contains('i18n-loaded')) {
        document.body.classList.add('i18n-loaded');
    }
}, 1500);

document.addEventListener('DOMContentLoaded', () => {
    // --- КЛЮЧЕВЫЕ НАСТРОЙКИ ---
    const SUPPORTED_LANGUAGES = ['en', 'ru', 'zh'];
    const DEFAULT_LANGUAGE = 'en';

    // Этот скрипт теперь не зависит от имени репозитория
    let translations = {};

    // 1. ИСПРАВЛЕНО: Загружаем переводы по правильному относительному пути
    async function fetchTranslations() {
        try {
            // Путь ../ поднимается из /ru/ в корень, где лежат assets
            const response = await fetch(`../assets/js/translations.json`); 
            if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
            translations = await response.json();
        } catch (error) {
            console.error("Could not load translations:", error);
            throw error;
        }
    }

    // 2. Определяем язык из URL
    function getLanguageFromURL() {
        // Мы ожидаем структуру типа /en/index.html
        const pathParts = window.location.pathname.split('/');
        // Язык будет предпоследним элементом, если путь не корневой
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

    // 3. Обновляем все ссылки на странице
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
        
        // Обновляем все внутренние ссылки
        document.querySelectorAll('a').forEach(a => {
            try {
                const url = new URL(a.href, window.location.href);
                if (url.hostname === window.location.hostname && url.pathname.endsWith('.html')) {
                    const pageName = url.pathname.split('/').pop();
                    // Строим новый путь относительно корня
                    const newPath = `/${lang}/${pageName}`;

                    // Для локального сервера и GH Pages путь должен быть относительным от корня
                    // Находим корень нашего сайта (может быть / или /repo-name/)
                    const basePath = window.location.pathname.substring(0, window.location.pathname.indexOf('/', 1));
                    a.href = `${basePath}${newPath}`;
                }
            } catch (e) { /* Игнорируем невалидные URL */ }
        });
    }

    // 4. Переключаем язык
    function setLanguage(lang) {
        if (!SUPPORTED_LANGUAGES.includes(lang)) return;

        localStorage.setItem('language', lang);
        
        const currentPageName = window.location.pathname.split('/').pop() || 'index.html';
        
        // Переходим на /<lang>/<page>.html
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

    // 5. Главная логика инициализации
    async function initialize() {
        const urlLang = getLanguageFromURL();

        if (urlLang) {
            // Мы уже на языковой странице
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
            // Мы на корневой странице, нужно перенаправить
            const storedLang = getLanguageFromStorage();
            const browserLang = getLanguageFromBrowser();
            const langToRedirect = storedLang || browserLang || DEFAULT_LANGUAGE;
            
            // Перенаправляем на /<lang>/index.html
            window.location.href = `./${langToRedirect}/index.html`;
            return;
        }
        
        document.body.classList.add('i18n-loaded');
    }

    initialize();
});
// --- КОНЕЦ ФАЙЛА assets/js/i18n.js ---