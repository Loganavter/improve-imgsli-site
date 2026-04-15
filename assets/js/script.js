document.addEventListener('DOMContentLoaded', function() {
    function initAsteroidShadowAnimation() {
        const asteroidRoot = document.querySelector('.hero-asteroid');
        const asteroidImg = asteroidRoot ? asteroidRoot.querySelector('.hero-asteroid-svg') : null;
        const isMobileViewport = window.matchMedia('(max-width: 768px)').matches;

        if (!asteroidRoot || !asteroidImg || isMobileViewport) {
            return;
        }

        const clamp = (value, min, max) => Math.min(max, Math.max(min, value));
        const pickFlightDuration = () => 4 + (Math.random() * 7);

        let currentStartTop = 10 + (Math.random() * 80);
        let currentFlightDurationMs = 8000;
        let flightStartTimestamp = 0;
        let restartFrameId = null;

        const renderFlightPath = () => {
            const centerOffset = (currentStartTop - 50) / 30;
            const base = clamp(centerOffset * 0.02, -0.02, 0.02);
            const pullToCenter = clamp(-centerOffset * 0.18, -0.18, 0.18);
            const mid = clamp(base + (pullToCenter * 0.6), -0.14, 0.14);
            const peak = clamp(base + pullToCenter, -0.2, 0.2);

            asteroidRoot.style.setProperty('--asteroid-base-top', `${currentStartTop.toFixed(2)}%`);
            asteroidRoot.style.setProperty('--asteroid-y-0', `${base.toFixed(2)}vh`);
            asteroidRoot.style.setProperty('--asteroid-y-10', `${base.toFixed(2)}vh`);
            asteroidRoot.style.setProperty('--asteroid-y-24', `${base.toFixed(2)}vh`);
            asteroidRoot.style.setProperty('--asteroid-y-38', `${mid.toFixed(2)}vh`);
            asteroidRoot.style.setProperty('--asteroid-y-50', `${peak.toFixed(2)}vh`);
            asteroidRoot.style.setProperty('--asteroid-y-64', `${mid.toFixed(2)}vh`);
            asteroidRoot.style.setProperty('--asteroid-y-80', `${base.toFixed(2)}vh`);
            asteroidRoot.style.setProperty('--asteroid-y-92', `${base.toFixed(2)}vh`);
            asteroidRoot.style.setProperty('--asteroid-y-100', `${base.toFixed(2)}vh`);
        };

        const restartFlight = () => {
            if (restartFrameId !== null) {
                window.cancelAnimationFrame(restartFrameId);
            }

            currentStartTop = 10 + (Math.random() * 80);
            currentFlightDurationMs = pickFlightDuration() * 1000;
            asteroidRoot.style.animation = 'none';
            asteroidRoot.style.opacity = '0';
            asteroidRoot.style.setProperty('--asteroid-scale-factor', (1.2 + (Math.random() * 0.2)).toFixed(3));
            asteroidRoot.style.setProperty('--asteroid-flight-duration', `${(currentFlightDurationMs / 1000).toFixed(2)}s`);
            renderFlightPath();
            void asteroidRoot.offsetWidth;
            restartFrameId = window.requestAnimationFrame(() => {
                flightStartTimestamp = performance.now();
                asteroidRoot.style.animation = '';
                asteroidRoot.style.opacity = '';
                restartFrameId = null;
            });
        };

        restartFlight();
        asteroidRoot.addEventListener('animationend', (event) => {
            if (event.animationName !== 'heroAsteroidFly') {
                return;
            }
            restartFlight();
        });

        fetch(asteroidImg.getAttribute('src'))
            .then(response => {
                if (!response.ok) {
                    throw new Error(`Failed to load asteroid SVG: ${response.status}`);
                }
                return response.text();
            })
            .then(svgText => {
                const parsed = new DOMParser().parseFromString(svgText, 'image/svg+xml');
                const inlineSvg = parsed.querySelector('svg');

                if (!inlineSvg) {
                    throw new Error('Asteroid SVG has no <svg> root.');
                }

                inlineSvg.classList.add('hero-asteroid-svg', 'hero-asteroid-svg-inline');
                inlineSvg.setAttribute('aria-hidden', 'true');
                asteroidImg.replaceWith(inlineSvg);

                const gradient = inlineSvg.querySelector('#terminator-shadow');
                const baseLight = inlineSvg.querySelector('#asteroid-base-light');
                const stops = gradient ? gradient.querySelectorAll('stop') : [];
                if (!gradient || stops.length < 3 || !baseLight) {
                    throw new Error('Asteroid gradients are missing or incomplete.');
                }

                const animatedGradient = gradient.querySelector('animateTransform');
                if (animatedGradient) {
                    animatedGradient.remove();
                }

                const animatedBaseLight = baseLight.querySelector('animateTransform');
                if (animatedBaseLight) {
                    animatedBaseLight.remove();
                }

                const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

                const applyShadowState = (phase) => {
                    const orbit = phase * Math.PI * 2;
                    const midFlight = Math.sin(phase * Math.PI) ** 2;

                    const yaw = Math.sin(orbit);
                    const pitch = Math.sin(orbit * 2 + 0.6) * 0.45;
                    const roll = Math.cos(orbit + 0.35) * 0.18;

                    const tiltDeg = 24 + yaw * 10 + pitch * 7 + roll * 5;
                    const shiftX = 16 + yaw * 9 + roll * 2;
                    const shiftY = 4 + pitch * 9;
                    const spanX = 28 + pitch * 3;
                    const spanY = 47 + yaw * 3;

                    const edge = 76 + yaw * 11 + pitch * 6;
                    const transparentEdge = Math.max(0, edge - (29 + Math.abs(yaw) * 5));
                    const density = 0.81 + ((pitch + 0.45) / 0.9) * 0.07;
                    const radians = tiltDeg * (Math.PI / 180);
                    const cos = Math.cos(radians);
                    const sin = Math.sin(radians);
                    const centerX = 50 + shiftX;
                    const centerY = 50 + shiftY;

                    gradient.setAttribute('x1', `${(centerX - cos * spanX).toFixed(2)}%`);
                    gradient.setAttribute('y1', `${(centerY - sin * spanY).toFixed(2)}%`);
                    gradient.setAttribute('x2', `${(centerX + cos * spanX).toFixed(2)}%`);
                    gradient.setAttribute('y2', `${(centerY + sin * spanY).toFixed(2)}%`);

                    stops[0].setAttribute('offset', `${transparentEdge.toFixed(2)}%`);
                    stops[1].setAttribute('offset', `${edge.toFixed(2)}%`);
                    stops[1].setAttribute('stop-opacity', (density * 0.95).toFixed(2));
                    stops[2].setAttribute('stop-opacity', density.toFixed(2));

                    const lightCx = 35 + yaw * 2 + (1 - midFlight) * -6 + midFlight * 9;
                    const lightCy = 35 + pitch * 6 + (1 - midFlight) * -4 + midFlight * 8;
                    const lightRadius = 65 - midFlight * 6 + Math.abs(yaw) * 2;
                    baseLight.setAttribute('cx', `${lightCx.toFixed(2)}%`);
                    baseLight.setAttribute('cy', `${lightCy.toFixed(2)}%`);
                    baseLight.setAttribute('r', `${lightRadius.toFixed(2)}%`);
                };

                if (prefersReducedMotion) {
                    applyShadowState(0);
                    return;
                }

                const animateShadow = (timestamp) => {
                    const elapsed = Math.max(0, timestamp - flightStartTimestamp);
                    const phase = currentFlightDurationMs > 0
                        ? Math.min((elapsed % currentFlightDurationMs) / currentFlightDurationMs, 1)
                        : 0;
                    applyShadowState(phase);
                    window.requestAnimationFrame(animateShadow);
                };

                window.requestAnimationFrame(animateShadow);
            })
            .catch(error => {
                console.warn('Asteroid shadow animation disabled:', error);
            });
    }

    initAsteroidShadowAnimation();

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

            langSwitcherContainer.classList.toggle('active');
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

    const heroImage = document.getElementById('animated-hero-image');
    if (heroImage && window.matchMedia('(pointer: fine)').matches) {
        const clamp = (value, min, max) => Math.min(max, Math.max(min, value));

        heroImage.addEventListener('pointermove', (e) => {
            const rect = heroImage.getBoundingClientRect();
            const relX = (e.clientX - rect.left) / rect.width;
            const relY = (e.clientY - rect.top) / rect.height;
            const centeredX = (relX - 0.5) * 2;
            const centeredY = (relY - 0.5) * 2;

            const rotateY = clamp(centeredX * 3.5, -3.5, 3.5);
            const rotateX = clamp(-centeredY * 2.5, -2.5, 2.5);
            const shadowX = clamp(-centeredX * 18, -18, 18);
            const shadowY = clamp(-centeredY * 22, -22, 22);

            heroImage.style.setProperty('--hero-rotate-x', `${rotateX}deg`);
            heroImage.style.setProperty('--hero-rotate-y', `${rotateY}deg`);
            heroImage.style.setProperty('--hero-shine-x', `${(1 - relX) * 100}%`);
            heroImage.style.setProperty('--hero-shine-y', `${(1 - relY) * 100}%`);
            heroImage.style.setProperty('--hero-shadow-x', `${shadowX}px`);
            heroImage.style.setProperty('--hero-shadow-y', `${shadowY}px`);
        });

        heroImage.addEventListener('pointerleave', () => {
            heroImage.style.setProperty('--hero-rotate-x', '0deg');
            heroImage.style.setProperty('--hero-rotate-y', '0deg');
            heroImage.style.setProperty('--hero-shine-x', '50%');
            heroImage.style.setProperty('--hero-shine-y', '50%');
            heroImage.style.setProperty('--hero-shadow-x', '14px');
            heroImage.style.setProperty('--hero-shadow-y', '24px');
        });
    }

    const screenshotCardsForTilt = Array.from(document.querySelectorAll('.screenshots-grid .screenshot-card'));
    if (screenshotCardsForTilt.length && Math.floor(Math.random() * 5) === 0) {
        const randomDeg = () => {
            const sign = Math.random() < 0.5 ? -1 : 1;
            const magnitude = 5 + (Math.random() * 10);
            return sign * magnitude;
        };
        const luckyIndex = Math.floor(Math.random() * screenshotCardsForTilt.length);
        const luckyCard = screenshotCardsForTilt[luckyIndex];
        const rotateX = randomDeg();
        const rotateY = randomDeg();
        const shadowX = (-rotateY * 2.2).toFixed(2);
        const shadowY = (Math.abs(rotateX) * 1.6 + 10).toFixed(2);
        luckyCard.classList.add('screenshot-card-featured');
        luckyCard.style.setProperty('--shot-rotate-x', `${rotateX.toFixed(2)}deg`);
        luckyCard.style.setProperty('--shot-rotate-y', `${rotateY.toFixed(2)}deg`);
        luckyCard.style.setProperty('--shot-shadow-x', `${shadowX}px`);
        luckyCard.style.setProperty('--shot-shadow-y', `${shadowY}px`);
    }

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
    const lightboxCaption = document.getElementById('lightbox-caption');

    const screenshotsData = Array.from(screenshotCards).map(card => {
        const img = card.querySelector('img');
        const figcaption = card.querySelector('figcaption');
        return {
            src: img ? img.src : '',
            captionKey: figcaption ? figcaption.dataset.i18n : ''
        };
    });
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
        currentIndex = (index + screenshotsData.length) % screenshotsData.length;

        const currentScreenshot = screenshotsData[currentIndex];
        lightboxImg.src = currentScreenshot.src;

        if (lightboxCaption && currentScreenshot.captionKey) {

            if (window.siteTranslations && window.currentLang) {

                const translatedCaption = window.siteTranslations[window.currentLang][currentScreenshot.captionKey];
                lightboxCaption.textContent = translatedCaption || currentScreenshot.captionKey;
            } else {

                lightboxCaption.textContent = currentScreenshot.captionKey;
            }
        } else if (lightboxCaption) {
            lightboxCaption.textContent = '';
        }
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
        const numberOfParticles = 60;

        for (let i = 0; i < numberOfParticles; i++) {
            const particle = document.createElement('div');
            particle.classList.add('particle');

            const size = Math.random() * 6 + 2;
            const top = Math.random() * 100;
            const left = Math.random() * 100;
            const duration = (Math.random() * 10 + 5) / 1.5;
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
