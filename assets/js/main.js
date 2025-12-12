// ============================================
// GLOBAL STATE
// ============================================
let crtActive = false;
let crtToggleButton;
let crtToggleIcon;
let crtToggleTvIcon;

// ============================================
// MENU TOGGLE
// ============================================
const nav = document.querySelector('#nav');
const menuButtons = document.querySelectorAll('.menu-toggle');
const menuItems = document.querySelectorAll('.menu-item');

// Restore menu state on page load
if (nav) {
  if (localStorage.getItem('menu') === 'open') {
    nav.classList.remove('hidden');
  } else {
    nav.classList.add('hidden');
  }
}

// Toggle menu function
function toggleMenu() {
  if (!nav) return;
  
  const isHidden = nav.classList.contains('hidden');
  
  if (isHidden) {
    nav.classList.remove('hidden');
    localStorage.setItem('menu', 'open');
  } else {
    nav.classList.add('hidden');
    localStorage.setItem('menu', 'closed');
  }
}

// Add click handlers to all menu toggle buttons
menuButtons.forEach(btn => {
  btn.addEventListener('click', toggleMenu);
});

// Close menu when clicking menu items
menuItems.forEach(item => {
  item.addEventListener('click', () => {
    if (nav) {
      nav.classList.add('hidden');
      localStorage.setItem('menu', 'closed');
    }
  });
});

// ============================================
// THEME TOGGLE (Light/Dark)
// ============================================
function initTheme() {
  const toggle = document.getElementById('theme-toggle');
  if (!toggle) return;

  const htmlEl = document.documentElement;

  // Apply theme helper
  const applyTheme = (isDark) => {
    htmlEl.classList.toggle('dark', isDark);
    localStorage.setItem('theme', isDark ? 'dark' : 'light');
  };

  // Load saved theme or use system preference
  const savedTheme = localStorage.getItem('theme');
  if (savedTheme) {
    applyTheme(savedTheme === 'dark');
  } else if (window.matchMedia('(prefers-color-scheme: dark)').matches) {
    applyTheme(true);
  }

  // Toggle on click
  toggle.addEventListener('click', () => {
    const isCurrentlyDark = htmlEl.classList.contains('dark');
    applyTheme(!isCurrentlyDark);
  });
}

// ============================================
// CRT EFFECT TOGGLE
// ============================================
function initCrt() {
  crtToggleButton = document.getElementById('crt-toggle');
  if (!crtToggleButton) return;

  crtToggleIcon = crtToggleButton.querySelector('.crt-icon-toggle');
  crtToggleTvIcon = crtToggleButton.querySelector('.crt-icon-tv');

  // Load saved CRT preference - DEFAULT TO TRUE on first visit
  const savedCrtState = localStorage.getItem('crtMode');
  if (savedCrtState === null) {
    // First visit - default to ON
    crtActive = true;
  } else {
    crtActive = savedCrtState === 'true';
  }

  // Apply initial state
  applyCrtState(crtActive);

  // Toggle on click
  crtToggleButton.addEventListener('click', () => {
    applyCrtState(!crtActive);
  });
}

function applyCrtState(active) {
  crtActive = active;
  const crtOverlay = document.querySelector('.crt');
  
  if (crtOverlay) {
    if (active) {
      crtOverlay.classList.add('active');
    } else {
      crtOverlay.classList.remove('active');
    }
  }
  
  // Save preference
  localStorage.setItem('crtMode', active);
  
  // Update UI
  updateCrtToggleUi();
}

function updateCrtToggleUi() {
  if (!crtToggleIcon || !crtToggleTvIcon) return;
  
  if (crtActive) {
    // CRT is ON
    crtToggleIcon.textContent = 'toggle_off';
    crtToggleTvIcon.style.opacity = '1';
    crtToggleButton?.setAttribute('aria-pressed', 'true');
  } else {
    // CRT is OFF
    crtToggleIcon.textContent = 'toggle_on';
    crtToggleTvIcon.style.opacity = '0.6';
    crtToggleButton?.setAttribute('aria-pressed', 'false');
  }
}

// ============================================
// CAROUSEL FUNCTIONALITY (Project/CV carousels)
// ============================================
function initCarousel() {
  const track = document.querySelector('.carousel-track');
  const dots = document.querySelectorAll('.carousel-dot');
  const slides = document.querySelectorAll('.carousel-slide');
  
  if (!track || !dots.length || !slides.length) return;
  
  // Calculate slide width including gap
  function getSlideWidth() {
    const firstSlide = slides[0];
    const style = window.getComputedStyle(track);
    const gap = parseInt(style.gap) || 0;
    return firstSlide.offsetWidth + gap;
  }
  
  // Update active dot based on scroll position
  function updateActiveDot() {
    const scrollLeft = track.scrollLeft;
    const slideWidth = getSlideWidth();
    const currentSlide = Math.round(scrollLeft / slideWidth);
    
    dots.forEach((dot, index) => {
      if (index === currentSlide) {
        dot.classList.add('bg-accent', 'scale-125');
        dot.classList.remove('bg-secondary');
      } else {
        dot.classList.remove('bg-accent', 'scale-125');
        dot.classList.add('bg-secondary');
      }
    });
  }
  
  // Scroll to specific slide
  dots.forEach((dot, index) => {
    dot.addEventListener('click', () => {
      const slideWidth = getSlideWidth();
      track.scrollTo({
        left: slideWidth * index,
        behavior: 'smooth'
      });
    });
  });
  
  // Update dots on scroll
  track.addEventListener('scroll', updateActiveDot);
  
  // Initialize
  updateActiveDot();
  
  // Update on window resize
  window.addEventListener('resize', updateActiveDot);
}

// ============================================
// HOME CAROUSEL (Reusable for homepage sections)
// With mobile auto-slide and infinite loop
// ============================================
function initHomeCarousels() {
  const carousels = document.querySelectorAll('.home-carousel-container');
  
  carousels.forEach(container => {
    const carouselId = container.dataset.carouselId;
    const track = container.querySelector(`[data-carousel-track="${carouselId}"]`);
    const dots = container.querySelectorAll(`[data-carousel-dot="${carouselId}"]`);
    const slides = track?.querySelectorAll('.home-carousel-slide');
    
    if (!track || !slides.length) return;
    
    // Auto-slide configuration
    const autoSlideEnabled = container.dataset.autoSlide === 'true';
    const slideInterval = parseInt(container.dataset.slideInterval) || 3000;
    const slideCount = parseInt(container.dataset.slideCount) || slides.length;
    
    let currentSlide = 0;
    let autoSlideTimer = null;
    let isUserInteracting = false;
    let interactionTimeout = null;
    
    function getSlideWidth() {
      const firstSlide = slides[0];
      const style = window.getComputedStyle(track);
      const gap = parseInt(style.gap) || 0;
      return firstSlide.offsetWidth + gap;
    }
    
    function updateActiveDot() {
      const scrollLeft = track.scrollLeft;
      const slideWidth = getSlideWidth();
      currentSlide = Math.round(scrollLeft / slideWidth);
      
      // Handle infinite loop - wrap around
      if (currentSlide >= slideCount) {
        currentSlide = 0;
      } else if (currentSlide < 0) {
        currentSlide = slideCount - 1;
      }
      
      dots.forEach((dot, index) => {
        if (index === currentSlide) {
          dot.classList.add('bg-accent', 'scale-125');
          dot.classList.remove('bg-secondary');
        } else {
          dot.classList.remove('bg-accent', 'scale-125');
          dot.classList.add('bg-secondary');
        }
      });
    }
    
    function scrollToSlide(index, behavior = 'smooth') {
      const slideWidth = getSlideWidth();
      track.scrollTo({
        left: slideWidth * index,
        behavior: behavior
      });
    }
    
    function nextSlide() {
      if (isUserInteracting) return;
      
      currentSlide++;
      
      // Infinite loop - when reaching the end, jump back to start
      if (currentSlide >= slideCount) {
        currentSlide = 0;
        // Smooth scroll to first slide for infinite effect
        scrollToSlide(0);
      } else {
        scrollToSlide(currentSlide);
      }
    }
    
    function startAutoSlide() {
      // Only auto-slide on mobile (< 768px)
      if (!autoSlideEnabled || window.innerWidth >= 768) {
        stopAutoSlide();
        return;
      }
      
      if (autoSlideTimer) return; // Already running
      
      autoSlideTimer = setInterval(nextSlide, slideInterval);
    }
    
    function stopAutoSlide() {
      if (autoSlideTimer) {
        clearInterval(autoSlideTimer);
        autoSlideTimer = null;
      }
    }
    
    function handleUserInteraction() {
      isUserInteracting = true;
      stopAutoSlide();
      
      // Clear any existing timeout
      if (interactionTimeout) {
        clearTimeout(interactionTimeout);
      }
      
      // Resume auto-slide after 5 seconds of no interaction
      interactionTimeout = setTimeout(() => {
        isUserInteracting = false;
        startAutoSlide();
      }, 5000);
    }
    
    // Dot click handlers
    dots.forEach((dot, index) => {
      dot.addEventListener('click', () => {
        handleUserInteraction();
        currentSlide = index;
        scrollToSlide(index);
      });
    });
    
    // Track user interaction events
    track.addEventListener('scroll', updateActiveDot);
    track.addEventListener('touchstart', handleUserInteraction, { passive: true });
    track.addEventListener('mousedown', handleUserInteraction);
    
    // Handle visibility change (pause when tab not visible)
    document.addEventListener('visibilitychange', () => {
      if (document.hidden) {
        stopAutoSlide();
      } else if (!isUserInteracting) {
        startAutoSlide();
      }
    });
    
    // Handle window resize (enable/disable based on screen size)
    let resizeTimeout;
    window.addEventListener('resize', () => {
      clearTimeout(resizeTimeout);
      resizeTimeout = setTimeout(() => {
        updateActiveDot();
        if (window.innerWidth >= 768) {
          stopAutoSlide();
        } else if (!isUserInteracting) {
          startAutoSlide();
        }
      }, 250);
    });
    
    // Initialize
    updateActiveDot();
    
    // Start auto-slide on mobile
    if (autoSlideEnabled && window.innerWidth < 768) {
      // Small delay before starting auto-slide
      setTimeout(startAutoSlide, 1000);
    }
  });
}

// ============================================
// DICE 3D INTERACTION
// ============================================
function initDice() {
  const scene = document.getElementById('dice-scene');
  const cube = document.getElementById('dice-cube');
  
  if (!scene || !cube) return;

  let isDragging = false;
  let startX = 0;
  let startY = 0;
  let rotationX = -15;
  let rotationY = -15;
  
  // Momentum variables
  let velocityX = 0;
  let velocityY = 0;
  let lastX = 0;
  let lastY = 0;
  let lastTime = 0;
  let animationId = null;
  
  // Auto-rotate variables
  let autoRotate = true;
  let autoRotateId = null;

  function updateCube() {
    cube.style.transform = `rotateX(${rotationX}deg) rotateY(${rotationY}deg)`;
  }

  function startAutoRotate() {
    if (autoRotateId) return;
    autoRotate = true;
    
    function rotate() {
      if (!autoRotate) return;
      rotationY += 0.3;
      rotationX += 0.1;
      updateCube();
      autoRotateId = requestAnimationFrame(rotate);
    }
    rotate();
  }

  function stopAutoRotate() {
    autoRotate = false;
    if (autoRotateId) {
      cancelAnimationFrame(autoRotateId);
      autoRotateId = null;
    }
  }

  function applyMomentum() {
    if (isDragging) return;
    
    velocityX *= 0.95;
    velocityY *= 0.95;
    
    rotationY += velocityX;
    rotationX -= velocityY;
    
    updateCube();
    
    if (Math.abs(velocityX) > 0.1 || Math.abs(velocityY) > 0.1) {
      animationId = requestAnimationFrame(applyMomentum);
    } else {
      setTimeout(startAutoRotate, 2000);
    }
  }
  
  function spinDice() {
    stopAutoRotate();
    if (animationId) {
      cancelAnimationFrame(animationId);
    }
    
    velocityX = (Math.random() - 0.5) * 30;
    velocityY = (Math.random() - 0.5) * 20;
    
    applyMomentum();
  }

  function getPointerPosition(e) {
    if (e.touches && e.touches.length > 0) {
      return { x: e.touches[0].clientX, y: e.touches[0].clientY };
    }
    return { x: e.clientX, y: e.clientY };
  }

  function onPointerDown(e) {
    // Always allow name links to work
    if (e.target.closest('.dice-link')) return;
    
    const pos = getPointerPosition(e);
    
    isDragging = true;
    startX = pos.x;
    startY = pos.y;
    lastX = pos.x;
    lastY = pos.y;
    lastTime = Date.now();
    velocityX = 0;
    velocityY = 0;
    
    stopAutoRotate();
    if (animationId) {
      cancelAnimationFrame(animationId);
      animationId = null;
    }
    
    scene.style.cursor = 'grabbing';
  }

  function onPointerMove(e) {
    if (!isDragging) return;
    
    // Prevent page scrolling while dragging the dice
    if (e.cancelable) {
      e.preventDefault();
    }
    
    const pos = getPointerPosition(e);
    const now = Date.now();
    const dt = now - lastTime;
    
    if (dt > 0) {
      const deltaX = pos.x - lastX;
      const deltaY = pos.y - lastY;
      
      // Track velocity for momentum
      velocityX = deltaX * 0.5;
      velocityY = deltaY * 0.5;
      
      rotationY += deltaX * 0.5;
      rotationX -= deltaY * 0.5;
      
      updateCube();
    }
    
    lastX = pos.x;
    lastY = pos.y;
    lastTime = now;
  }

  function onPointerUp(e) {
    if (!isDragging) return;
    
    isDragging = false;
    scene.style.cursor = 'grab';
    
    // Calculate total movement
    const pos = getPointerPosition(e);
    const totalMoveX = Math.abs(pos.x - startX);
    const totalMoveY = Math.abs(pos.y - startY);
    const totalMove = totalMoveX + totalMoveY;
    
    // If barely moved, treat as click and spin
    if (totalMove < 10) {
      spinDice();
      return;
    }
    
    // Otherwise apply momentum from drag
    if (Math.abs(velocityX) > 0.5 || Math.abs(velocityY) > 0.5) {
      applyMomentum();
    } else {
      setTimeout(startAutoRotate, 2000);
    }
  }

  // Mouse events
  scene.addEventListener('mousedown', onPointerDown);
  document.addEventListener('mousemove', onPointerMove);
  document.addEventListener('mouseup', onPointerUp);

  // Touch events - use { passive: false } to allow preventDefault()
  scene.addEventListener('touchstart', onPointerDown, { passive: true });
  document.addEventListener('touchmove', onPointerMove, { passive: false });
  document.addEventListener('touchend', onPointerUp);

  // Prevent context menu
  scene.addEventListener('contextmenu', (e) => e.preventDefault());

  // Initialize
  updateCube();
  startAutoRotate();
}

// ============================================
// INITIALIZE ON PAGE LOAD
// ============================================
document.addEventListener('DOMContentLoaded', () => {
  initTheme();
  initCrt();
  initCarousel();
  initHomeCarousels();
  initDice();
});