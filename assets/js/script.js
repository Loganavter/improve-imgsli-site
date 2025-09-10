document.addEventListener('DOMContentLoaded', function() {

    const navToggle = document.querySelector('.nav-toggle');
    const navLinks = document.querySelector('.nav-links');
    const overlay = document.querySelector('.overlay');
    const langSwitcher = document.querySelector('.lang-switcher');

    const closeMenu = () => {
        navToggle.classList.remove('active');
        navLinks.classList.remove('active');
        overlay.classList.remove('active');
        document.body.classList.remove('menu-open');
        if (langSwitcher) langSwitcher.classList.remove('active');
    };

    const openMenu = () => {
        navToggle.classList.add('active');
        navLinks.classList.add('active');
        overlay.classList.add('active');
        document.body.classList.add('menu-open');
    };

    if (navToggle && navLinks && overlay) {
        navToggle.addEventListener('click', (e) => {
            e.stopPropagation();
            if (navLinks.classList.contains('active')) {
                closeMenu();
            } else {
                openMenu();
            }
        });

        overlay.addEventListener('click', closeMenu);

        document.querySelectorAll('.nav-links a').forEach(link => {
            link.addEventListener('click', closeMenu);
        });
    }

    const langSwitcherButton = document.querySelector('.lang-switcher-current');
    const langSwitcherContainer = document.querySelector('.lang-switcher');

    if (langSwitcherButton && langSwitcherContainer) {

        langSwitcherButton.addEventListener('click', (e) => {
            e.stopPropagation();
            const isMenuOpenInMobile = navLinks.classList.contains('active');

            if (isMenuOpenInMobile) {
                 langSwitcherContainer.classList.toggle('active');
            } else {
                 langSwitcherContainer.classList.toggle('active');
            }
        });

        document.addEventListener('click', (e) => {
            if (!langSwitcherContainer.contains(e.target)) {
                langSwitcherContainer.classList.remove('active');
            }
        });
    }

    const header = document.querySelector('header');
    if (header) {
        window.addEventListener('scroll', () => {
            if (window.scrollY > 50) {
                header.style.background = 'rgba(10, 10, 10, 0.98)';
                header.style.boxShadow = '0 5px 20px rgba(0,0,0,0.3)';
            } else {
                header.style.background = 'rgba(10, 10, 10, 0.95)';
                header.style.boxShadow = 'none';
            }
        });
    }

    const activeLinks = document.querySelectorAll('.nav-links > li > a');
    const currentPath = window.location.pathname;

    activeLinks.forEach(link => {

        const linkPath = new URL(link.href).pathname;

        if (currentPath === linkPath || (currentPath.endsWith('/') && currentPath.slice(0, -1) === linkPath)) {
            link.classList.add('active');
        } else {
            link.classList.remove('active');
        }
    });

    document.querySelectorAll('a[href^="#"]').forEach(anchor => {
        anchor.addEventListener('click', function (e) {
            e.preventDefault();
            const target = document.querySelector(this.getAttribute('href'));
            if (target) {
                target.scrollIntoView({
                    behavior: 'smooth',
                    block: 'start'
                });
            }
        });
    });

    const copyButtons = document.querySelectorAll('.copy-btn');
    const clipboardIcon = `<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path></svg>`;
    const checkIcon = `<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"></polyline></svg>`;

    copyButtons.forEach(btn => {
        btn.addEventListener('click', () => {
            const codeBlock = btn.parentElement;
            const code = codeBlock.querySelector('code');
            const textToCopy = code.innerText;

            navigator.clipboard.writeText(textToCopy).then(() => {
                btn.innerHTML = checkIcon;
                btn.classList.add('copied');

                setTimeout(() => {
                    btn.innerHTML = clipboardIcon;
                    btn.classList.remove('copied');
                }, 800);
            }).catch(err => {
                console.error('Failed to copy text: ', err);
            });
        });
    });

    const tooltipElement = document.createElement('div');
    tooltipElement.id = 'global-tooltip';
    document.body.appendChild(tooltipElement);

    const tooltips = document.querySelectorAll('[data-tooltip]');
    const TOOLTIP_MARGIN = 10;
    const TOOLTIP_OFFSET = 8;

    tooltips.forEach(el => {

        el.addEventListener('mouseenter', () => {
            const tooltipText = el.getAttribute('data-tooltip');
            if (!tooltipText) return;

            tooltipElement.classList.remove('show-below');

            tooltipElement.textContent = tooltipText;
            tooltipElement.classList.add('visible');

            const elRect = el.getBoundingClientRect();
            const tipRect = tooltipElement.getBoundingClientRect();

            let top = elRect.top - tipRect.height - TOOLTIP_OFFSET;
            let left = elRect.left + (elRect.width / 2) - (tipRect.width / 2);

            if (top < TOOLTIP_MARGIN) {

                top = elRect.bottom + TOOLTIP_OFFSET;
                tooltipElement.classList.add('show-below');
            }

            if (left < TOOLTIP_MARGIN) {
                left = TOOLTIP_MARGIN;
            }
            if (left + tipRect.width > window.innerWidth - TOOLTIP_MARGIN) {
                left = window.innerWidth - tipRect.width - TOOLTIP_MARGIN;
            }

            tooltipElement.style.top = `${top}px`;
            tooltipElement.style.left = `${left}px`;
        });

        el.addEventListener('mouseleave', () => {
            tooltipElement.classList.remove('visible');

            tooltipElement.classList.remove('show-below');
        });
    });

    const lightbox = document.getElementById('lightbox');
    const lightboxImg = document.getElementById('lightbox-img');
    const screenshotCards = document.querySelectorAll('.screenshot-card');
    const closeBtn = document.querySelector('.lightbox-close');
    const prevBtn = document.querySelector('.lightbox-prev');
    const nextBtn = document.querySelector('.lightbox-next');

    const screenshotSources = Array.from(screenshotCards).map(card => card.querySelector('img').src);
    let currentIndex = 0;

    let isZoomed = false;
    let isPanning = false;
    let didPan = false;
    const PAN_THRESHOLD = 5;
    let currentScale = 1;
    let startX, startY, initialTranslateX, initialTranslateY;

    function resetZoomAndPanState() {
        isZoomed = false;
        isPanning = false;
        didPan = false;
        currentScale = 1;
        lightboxImg.classList.remove('zoomed', 'panning');
        lightboxImg.style.transform = '';
    }

    function showImage(index) {
        resetZoomAndPanState();
        currentIndex = (index + screenshotSources.length) % screenshotSources.length;
        lightboxImg.src = screenshotSources[currentIndex];
    }

    function showNextImage() { showImage(currentIndex + 1); }
    function showPrevImage() { showImage(currentIndex - 1); }

    function openLightbox(index) {
        showImage(index);
        lightbox.classList.add('visible');
        document.body.style.overflow = 'hidden';
    }

    function closeLightbox() {
        lightbox.classList.remove('visible');
        document.body.style.overflow = '';
    }

    function toggleZoom(e) {
        e.stopPropagation();

        if (didPan) {
            return;
        }
        if (isZoomed) {
            resetZoomAndPanState();
        } else {
            isZoomed = true;
            lightboxImg.classList.add('zoomed');
            currentScale = Math.min(2.5, lightboxImg.naturalWidth / lightboxImg.width);
            lightboxImg.style.transform = `scale(${currentScale})`;
        }
    }

    function startPan(e) {
        if (!isZoomed) return;
        e.preventDefault();
        e.stopPropagation();

        isPanning = true;
        didPan = false;
        lightboxImg.classList.add('panning');

        startX = e.clientX;
        startY = e.clientY;

        const currentTransform = new DOMMatrix(getComputedStyle(lightboxImg).transform);
        initialTranslateX = currentTransform.e;
        initialTranslateY = currentTransform.f;
    }

    function doPan(e) {
        if (!isPanning) return;
        e.preventDefault();

        const dx = e.clientX - startX;
        const dy = e.clientY - startY;

        if (!didPan && Math.sqrt(dx * dx + dy * dy) > PAN_THRESHOLD) {
            didPan = true;
        }

        const newTranslateX = initialTranslateX + dx;
        const newTranslateY = initialTranslateY + dy;

        lightboxImg.style.transform = `scale(${currentScale}) translate(${newTranslateX / currentScale}px, ${newTranslateY / currentScale}px)`;
    }

    function endPan(e) {
        if (!isPanning) return;
        e.stopPropagation();
        isPanning = false;
        lightboxImg.classList.remove('panning');
    }

    screenshotCards.forEach((card, index) => {
        const img = card.querySelector('img');
        if (img) {
            img.addEventListener('click', () => openLightbox(index));
        }
    });
    closeBtn.addEventListener('click', closeLightbox);
    nextBtn.addEventListener('click', (e) => { e.stopPropagation(); showNextImage(); });
    prevBtn.addEventListener('click', (e) => { e.stopPropagation(); showPrevImage(); });
    lightbox.addEventListener('click', (e) => { if (e.target === lightbox) closeLightbox(); });

    lightboxImg.addEventListener('click', toggleZoom);
    lightboxImg.addEventListener('mousedown', startPan);
    window.addEventListener('mousemove', doPan);
    window.addEventListener('mouseup', endPan);

    document.addEventListener('keydown', (e) => {
        if (lightbox.classList.contains('visible')) {
            if (e.key === 'ArrowRight') showNextImage();
            if (e.key === 'ArrowLeft') showPrevImage();
            if (e.key === 'Escape') closeLightbox();
        }
    });

    const heroSection = document.querySelector('.hero');

    if (heroSection) {
        const numberOfParticles = 40;

        for (let i = 0; i < numberOfParticles; i++) {
            const particle = document.createElement('div');
            particle.classList.add('particle');

            const size = Math.random() * 6 + 2;
            const top = Math.random() * 100;
            const left = Math.random() * 100;
            const duration = Math.random() * 10 + 5;
            const delay = Math.random() * 5;

            particle.style.cssText = `
                width: ${size}px;
                height: ${size}px;
                top: ${top}%;
                left: ${left}%;
                animation-duration: ${duration}s;
                animation-delay: ${delay}s;
            `;

            heroSection.appendChild(particle);
        }
    }

});
