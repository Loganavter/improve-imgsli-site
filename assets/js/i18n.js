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
    
    // Автоматически определяем, запущен ли сайт на GitHub Pages
    const IS_GITHUB_PAGES = window.location.hostname.includes('github.io');
    const REPO_NAME = 'improve-imgsli-site'; // <-- Убедитесь, что это имя вашего репозитория
    
    // Создаем правильный базовый путь. На GitHub Pages это будет /<имя-репозитория>, локально - пустая строка.
    const BASE_PATH = IS_GITHUB_PAGES ? `/${REPO_NAME}` : '';

    let translations = {};

    // 1. ИСПРАВЛЕНО: Загружаем переводы, используя правильный базовый путь
    async function fetchTranslations() {
        try {
            const response = await fetch(`${BASE_PATH}/assets/js/translations.json`);
            if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
            translations = await response.json();
        } catch (error) {
            console.error("Could not load translations:", error);
            throw error;
        }
    }

    // 2. ИСПРАВЛЕНО: Определяем язык из URL, учитывая структуру GitHub Pages
    function getLanguageFromURL() {
        const pathParts = window.location.pathname.split('/');
        // Если на GitHub Pages, язык - 3-й сегмент (индекс 2): ["", "repo-name", "ru", ...]
        // Если локально, язык - 2-й сегмент (индекс 1): ["", "ru", ...]
        const langIndex = IS_GITHUB_PAGES ? 2 : 1;
        const lang = pathParts[langIndex];
        return SUPPORTED_LANGUAGES.includes(lang) ? lang : null;
    }

    function getLanguageFromStorage() {
        return localStorage.getItem('language');
    }

    function getLanguageFromBrowser() {
        const lang = navigator.language.split('-')[0];
        return SUPPORTED_LANGUAGES.includes(lang) ? lang : null;
    }

    // 3. ИСПРАВЛЕНО: Обновляем все ссылки на странице, используя правильный базовый путь
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
        
        // Обновляем все внутренние ссылки, чтобы они вели на правильные адреса
        document.querySelectorAll('a').forEach(a => {
            try {
                const url = new URL(a.href, window.location.href);
                if (url.hostname === window.location.hostname && url.pathname.endsWith('.html')) {
                    const pageName = url.pathname.split('/').pop();
                    // Собираем правильный путь: /repo-name/ru/page.html
                    a.pathname = `${BASE_PATH}/${lang}/${pageName}`;
                }
            } catch (e) { /* Игнорируем невалидные URL */ }
        });
    }

    // 4. ИСПРАВЛЕНО: Переключаем язык, создавая полный и правильный URL для перехода
    function setLanguage(lang) {
        if (!SUPPORTED_LANGUAGES.includes(lang)) return;

        localStorage.setItem('language', lang);
        
        const page = window.location.pathname.split('/').pop() || 'index.html';
        
        // Строим полный новый путь для редиректа
        const newPath = `${BASE_PATH}/${lang}/${page}`;

        // Используем window.location.href для полного перехода, чтобы избежать путаницы с относительными путями
        window.location.href = window.location.origin + newPath;
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

    // 5. ИСПРАВЛЕНО: Главная логика инициализации
    async function initialize() {
        try {
            await fetchTranslations();
        } catch (error) {
            document.body.classList.add('i18n-loaded'); // Показываем контент даже при ошибке
            return;
        }

        const urlLang = getLanguageFromURL();

        if (urlLang) {
            // Если мы уже на странице с языком (e.g., /improve-imgsli-site/ru/index.html),
            // то просто переводим ее и инициализируем переключатель.
            document.documentElement.lang = urlLang;
            translatePage(urlLang);
            initLangSwitcher(urlLang);
        } else {
            // Если мы на корневой странице (e.g., /improve-imgsli-site/),
            // нужно определить язык и ПЕРЕНАПРАВИТЬ пользователя на нужную языковую версию.
            const storedLang = getLanguageFromStorage();
            const browserLang = getLanguageFromBrowser();
            const langToRedirect = storedLang || browserLang || DEFAULT_LANGUAGE;
            
            // Вызываем функцию, которая построит правильный URL и выполнит редирект.
            // Ничего больше на этой "пустой" странице делать не нужно.
            setLanguage(langToRedirect);
            return; // Прерываем выполнение, так как сейчас произойдет переход на другую страницу
        }
        
        // Показываем тело документа после того, как все переводы применены
        document.body.classList.add('i18n-loaded');
    }

    initialize();
});

// --- КОНЕЦ ФАЙЛА assets/js/i18n.js ---