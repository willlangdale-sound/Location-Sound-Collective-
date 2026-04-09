// ============================================
// GLOBAL STATE
// ============================================

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
menuButtons.forEach(function(btn) {
  btn.addEventListener('click', toggleMenu);
});

// Close menu when clicking menu items
menuItems.forEach(function(item) {
  item.addEventListener('click', function() {
    if (nav) {
      nav.classList.add('hidden');
      localStorage.setItem('menu', 'closed');
    }
  });
});

// ============================================
// THEME - ALWAYS DARK MODE
// ============================================
function initTheme() {
  // Always force dark mode
  document.documentElement.classList.add('dark');
  localStorage.setItem('theme', 'dark');
}

// ============================================
// CAROUSEL FUNCTIONALITY (Project carousels - scroll based)
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
    
    dots.forEach(function(dot, index) {
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
  dots.forEach(function(dot, index) {
    dot.addEventListener('click', function() {
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
  
  carousels.forEach(function(container) {
    const carouselId = container.dataset.carouselId;
    const track = container.querySelector('[data-carousel-track="' + carouselId + '"]');
    const dots = container.querySelectorAll('[data-carousel-dot="' + carouselId + '"]');
    const slides = track ? track.querySelectorAll('.home-carousel-slide') : [];
    
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
      
      dots.forEach(function(dot, index) {
        if (index === currentSlide) {
          dot.classList.add('bg-accent', 'scale-125');
          dot.classList.remove('bg-secondary');
        } else {
          dot.classList.remove('bg-accent', 'scale-125');
          dot.classList.add('bg-secondary');
        }
      });
    }
    
    function scrollToSlide(index, behavior) {
      behavior = behavior || 'smooth';
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
      
      if (autoSlideTimer) return;
      
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
      
      if (interactionTimeout) {
        clearTimeout(interactionTimeout);
      }
      
      interactionTimeout = setTimeout(function() {
        isUserInteracting = false;
        startAutoSlide();
      }, 5000);
    }
    
    // Dot click handlers
    dots.forEach(function(dot, index) {
      dot.addEventListener('click', function() {
        handleUserInteraction();
        currentSlide = index;
        scrollToSlide(index);
      });
    });
    
    // Track user interaction events
    track.addEventListener('scroll', updateActiveDot);
    track.addEventListener('touchstart', handleUserInteraction, { passive: true });
    track.addEventListener('mousedown', handleUserInteraction);
    
    // Handle visibility change
    document.addEventListener('visibilitychange', function() {
      if (document.hidden) {
        stopAutoSlide();
      } else if (!isUserInteracting) {
        startAutoSlide();
      }
    });
    
    // Handle window resize
    let resizeTimeout;
    window.addEventListener('resize', function() {
      clearTimeout(resizeTimeout);
      resizeTimeout = setTimeout(function() {
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
    
    if (autoSlideEnabled && window.innerWidth < 768) {
      setTimeout(startAutoSlide, 1000);
    }
  });
}

// ============================================
// TV AUTO-SLIDE CAROUSEL (Fade transition)
// Works on both mobile and desktop
// Now supports MULTIPLE carousels on the same page
// ============================================
function initTvCarousel() {
  // Find all TV carousels by class instead of single ID
  const carouselWrappers = document.querySelectorAll('.tv-auto-carousel');
  
  if (!carouselWrappers.length) return;
  
  // Initialize each carousel independently
  carouselWrappers.forEach(function(wrapper) {
    initSingleTvCarousel(wrapper);
  });
}

function initSingleTvCarousel(wrapper) {
  const slides = wrapper.querySelectorAll('.tv-carousel-slide');
  const dots = wrapper.querySelectorAll('.tv-carousel-dot');
  const prevBtn = wrapper.querySelector('.tv-carousel-prev');
  const nextBtn = wrapper.querySelector('.tv-carousel-next');
  
  if (!slides.length) return;
  
  let currentSlide = 0;
  const slideCount = slides.length;
  let autoSlideTimer = null;
  let isUserInteracting = false;
  let interactionTimeout = null;
  const slideInterval = 4000;
  
  function showSlide(index) {
    if (index >= slideCount) index = 0;
    if (index < 0) index = slideCount - 1;
    
    currentSlide = index;
    
    slides.forEach(function(slide, i) {
      if (i === currentSlide) {
        slide.classList.add('opacity-100');
        slide.classList.remove('opacity-0');
      } else {
        slide.classList.remove('opacity-100');
        slide.classList.add('opacity-0');
      }
    });
    
    dots.forEach(function(dot, i) {
      if (i === currentSlide) {
        dot.classList.add('bg-accent', 'scale-125');
        dot.classList.remove('bg-secondary');
      } else {
        dot.classList.remove('bg-accent', 'scale-125');
        dot.classList.add('bg-secondary');
      }
    });
  }
  
  function nextSlide() {
    if (isUserInteracting) return;
    showSlide(currentSlide + 1);
  }
  
  function prevSlide() {
    showSlide(currentSlide - 1);
  }
  
  function startAutoSlide() {
    if (autoSlideTimer) return;
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
    
    if (interactionTimeout) {
      clearTimeout(interactionTimeout);
    }
    
    interactionTimeout = setTimeout(function() {
      isUserInteracting = false;
      startAutoSlide();
    }, 6000);
  }
  
  // Dot click handlers
  dots.forEach(function(dot, index) {
    dot.addEventListener('click', function() {
      handleUserInteraction();
      showSlide(index);
    });
  });
  
  // Arrow button handlers
  if (prevBtn) {
    prevBtn.addEventListener('click', function() {
      handleUserInteraction();
      prevSlide();
    });
  }
  
  if (nextBtn) {
    nextBtn.addEventListener('click', function() {
      handleUserInteraction();
      showSlide(currentSlide + 1);
    });
  }
  
  // Pause on hover (desktop)
  wrapper.addEventListener('mouseenter', function() {
    stopAutoSlide();
  });
  
  wrapper.addEventListener('mouseleave', function() {
    if (!isUserInteracting) {
      startAutoSlide();
    }
  });
  
  // Touch swipe support
  let touchStartX = 0;
  let touchEndX = 0;
  
  wrapper.addEventListener('touchstart', function(e) {
    touchStartX = e.changedTouches[0].screenX;
  }, { passive: true });
  
  wrapper.addEventListener('touchend', function(e) {
    touchEndX = e.changedTouches[0].screenX;
    const diff = touchStartX - touchEndX;
    
    if (Math.abs(diff) > 50) {
      handleUserInteraction();
      if (diff > 0) {
        showSlide(currentSlide + 1);
      } else {
        prevSlide();
      }
    }
  }, { passive: true });
  
  // Handle visibility change
  document.addEventListener('visibilitychange', function() {
    if (document.hidden) {
      stopAutoSlide();
    } else if (!isUserInteracting) {
      startAutoSlide();
    }
  });
  
  // Initialize
  showSlide(0);
  setTimeout(startAutoSlide, 2000);
}

// ============================================
// CV AUTO-SLIDE CAROUSEL (Scroll-based)
// Horizontal scroll with auto-advance
// ============================================
function initCvCarousel() {
  const wrapper = document.getElementById('cv-auto-carousel');
  if (!wrapper) return;
  
  const track = wrapper.querySelector('.cv-carousel-track');
  const slides = wrapper.querySelectorAll('.cv-carousel-slide');
  const dots = wrapper.querySelectorAll('.cv-carousel-dot');
  const counter = wrapper.querySelector('.cv-carousel-current');
  
  if (!track || !slides.length) return;
  
  let currentSlide = 0;
  const slideCount = parseInt(wrapper.dataset.slideCount) || slides.length;
  let autoSlideTimer = null;
  let isUserInteracting = false;
  let interactionTimeout = null;
  const slideInterval = 5000; // 5 seconds between slides
  
  function getSlideWidth() {
    const firstSlide = slides[0];
    const style = window.getComputedStyle(track);
    const gap = parseInt(style.gap) || 0;
    return firstSlide.offsetWidth + gap;
  }
  
  function scrollToSlide(index) {
    const slideWidth = getSlideWidth();
    track.scrollTo({
      left: slideWidth * index,
      behavior: 'smooth'
    });
  }
  
  function updateUI() {
    // Update dots
    dots.forEach(function(dot, i) {
      if (i === currentSlide) {
        dot.classList.add('bg-accent', 'scale-125');
        dot.classList.remove('bg-secondary');
      } else {
        dot.classList.remove('bg-accent', 'scale-125');
        dot.classList.add('bg-secondary');
      }
    });
    
    // Update counter
    if (counter) {
      counter.textContent = currentSlide + 1;
    }
  }
  
  function updateFromScroll() {
    const scrollLeft = track.scrollLeft;
    const slideWidth = getSlideWidth();
    currentSlide = Math.round(scrollLeft / slideWidth);
    
    // Clamp to valid range
    if (currentSlide >= slideCount) currentSlide = slideCount - 1;
    if (currentSlide < 0) currentSlide = 0;
    
    updateUI();
  }
  
  function nextSlide() {
    if (isUserInteracting) return;
    
    currentSlide++;
    
    // Loop back to start
    if (currentSlide >= slideCount) {
      currentSlide = 0;
    }
    
    scrollToSlide(currentSlide);
    updateUI();
  }
  
  function startAutoSlide() {
    if (autoSlideTimer) return;
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
    
    if (interactionTimeout) {
      clearTimeout(interactionTimeout);
    }
    
    // Resume auto-slide after 8 seconds of no interaction
    interactionTimeout = setTimeout(function() {
      isUserInteracting = false;
      startAutoSlide();
    }, 8000);
  }
  
  // Dot click handlers
  dots.forEach(function(dot, index) {
    dot.addEventListener('click', function() {
      handleUserInteraction();
      currentSlide = index;
      scrollToSlide(index);
      updateUI();
    });
  });
  
  // Track scroll events
  track.addEventListener('scroll', updateFromScroll);
  
  // Track user interaction
  track.addEventListener('touchstart', handleUserInteraction, { passive: true });
  track.addEventListener('mousedown', handleUserInteraction);
  
  // Pause on hover (desktop)
  wrapper.addEventListener('mouseenter', function() {
    stopAutoSlide();
  });
  
  wrapper.addEventListener('mouseleave', function() {
    if (!isUserInteracting) {
      startAutoSlide();
    }
  });
  
  // Handle visibility change
  document.addEventListener('visibilitychange', function() {
    if (document.hidden) {
      stopAutoSlide();
    } else if (!isUserInteracting) {
      startAutoSlide();
    }
  });
  
  // Handle window resize
  let resizeTimeout;
  window.addEventListener('resize', function() {
    clearTimeout(resizeTimeout);
    resizeTimeout = setTimeout(function() {
      updateFromScroll();
    }, 250);
  });
  
  // Initialize
  updateUI();
  
  // Start auto-slide after a short delay
  setTimeout(startAutoSlide, 2000);
}

// ============================================
// DICE 3D INTERACTION
// ============================================
function initDice() {
  const scene = document.getElementById('dice-scene');
  const cube = document.getElementById('dice-cube');
  
  if (!scene || !cube) return;

  const DRAG_SENSITIVITY = 0.5;
  const SPIN_VELOCITY_X = 30;
  const SPIN_VELOCITY_Y = 20;
  const MOMENTUM_THRESHOLD = 0.5;

  let isDragging = false;
  let startX = 0;
  let startY = 0;
  let rotationX = -15;
  let rotationY = -15;

  let velocityX = 0;
  let velocityY = 0;
  let lastX = 0;
  let lastY = 0;
  let lastTime = 0;
  let animationId = null;
  
  let autoRotate = true;
  let autoRotateId = null;

  function updateCube() {
    cube.style.transform = 'rotateX(' + rotationX + 'deg) rotateY(' + rotationY + 'deg)';
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
    
    velocityX = (Math.random() - 0.5) * SPIN_VELOCITY_X;
    velocityY = (Math.random() - 0.5) * SPIN_VELOCITY_Y;
    
    applyMomentum();
  }

  function getPointerPosition(e) {
    if (e.touches && e.touches.length > 0) {
      return { x: e.touches[0].clientX, y: e.touches[0].clientY };
    }
    return { x: e.clientX, y: e.clientY };
  }

  function onPointerDown(e) {
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
    
    if (e.cancelable) {
      e.preventDefault();
    }
    
    const pos = getPointerPosition(e);
    const now = Date.now();
    const dt = now - lastTime;
    
    if (dt > 0) {
      const deltaX = pos.x - lastX;
      const deltaY = pos.y - lastY;
      
      velocityX = deltaX * DRAG_SENSITIVITY;
      velocityY = deltaY * DRAG_SENSITIVITY;

      rotationY += deltaX * DRAG_SENSITIVITY;
      rotationX -= deltaY * DRAG_SENSITIVITY;
      
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
    
    const pos = getPointerPosition(e);
    const totalMoveX = Math.abs(pos.x - startX);
    const totalMoveY = Math.abs(pos.y - startY);
    const totalMove = totalMoveX + totalMoveY;
    
    if (totalMove < 10) {
      spinDice();
      return;
    }
    
    if (Math.abs(velocityX) > MOMENTUM_THRESHOLD || Math.abs(velocityY) > MOMENTUM_THRESHOLD) {
      applyMomentum();
    } else {
      setTimeout(startAutoRotate, 2000);
    }
  }

  scene.addEventListener('mousedown', onPointerDown);
  document.addEventListener('mousemove', onPointerMove);
  document.addEventListener('mouseup', onPointerUp);

  scene.addEventListener('touchstart', onPointerDown, { passive: true });
  document.addEventListener('touchmove', onPointerMove, { passive: false });
  document.addEventListener('touchend', onPointerUp);

  scene.addEventListener('contextmenu', function(e) { e.preventDefault(); });

  updateCube();
  startAutoRotate();
}

// ============================================
// INITIALIZE ON PAGE LOAD
// ============================================
document.addEventListener('DOMContentLoaded', function() {
  initTheme();
  initCarousel();
  initHomeCarousels();
  initTvCarousel();
  initCvCarousel();
  initDice();
});