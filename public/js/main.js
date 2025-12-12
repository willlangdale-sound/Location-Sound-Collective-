(() => {
  // <stdin>
  var crtActive = false;
  var crtToggleButton;
  var crtToggleIcon;
  var crtToggleTvIcon;
  var nav = document.querySelector("#nav");
  var menuButtons = document.querySelectorAll(".menu-toggle");
  var menuItems = document.querySelectorAll(".menu-item");
  if (nav) {
    if (localStorage.getItem("menu") === "open") {
      nav.classList.remove("hidden");
    } else {
      nav.classList.add("hidden");
    }
  }
  function toggleMenu() {
    if (!nav) return;
    const isHidden = nav.classList.contains("hidden");
    if (isHidden) {
      nav.classList.remove("hidden");
      localStorage.setItem("menu", "open");
    } else {
      nav.classList.add("hidden");
      localStorage.setItem("menu", "closed");
    }
  }
  menuButtons.forEach((btn) => {
    btn.addEventListener("click", toggleMenu);
  });
  menuItems.forEach((item) => {
    item.addEventListener("click", () => {
      if (nav) {
        nav.classList.add("hidden");
        localStorage.setItem("menu", "closed");
      }
    });
  });
  function initTheme() {
    const toggle = document.getElementById("theme-toggle");
    if (!toggle) return;
    const htmlEl = document.documentElement;
    const applyTheme = (isDark) => {
      htmlEl.classList.toggle("dark", isDark);
      localStorage.setItem("theme", isDark ? "dark" : "light");
    };
    const savedTheme = localStorage.getItem("theme");
    if (savedTheme) {
      applyTheme(savedTheme === "dark");
    } else if (window.matchMedia("(prefers-color-scheme: dark)").matches) {
      applyTheme(true);
    }
    toggle.addEventListener("click", () => {
      const isCurrentlyDark = htmlEl.classList.contains("dark");
      applyTheme(!isCurrentlyDark);
    });
  }
  function initCrt() {
    crtToggleButton = document.getElementById("crt-toggle");
    if (!crtToggleButton) return;
    crtToggleIcon = crtToggleButton.querySelector(".crt-icon-toggle");
    crtToggleTvIcon = crtToggleButton.querySelector(".crt-icon-tv");
    const savedCrtState = localStorage.getItem("crtMode");
    if (savedCrtState === null) {
      crtActive = true;
    } else {
      crtActive = savedCrtState === "true";
    }
    applyCrtState(crtActive);
    crtToggleButton.addEventListener("click", () => {
      applyCrtState(!crtActive);
    });
  }
  function applyCrtState(active) {
    crtActive = active;
    const crtOverlay = document.querySelector(".crt");
    if (crtOverlay) {
      if (active) {
        crtOverlay.classList.add("active");
      } else {
        crtOverlay.classList.remove("active");
      }
    }
    localStorage.setItem("crtMode", active);
    updateCrtToggleUi();
  }
  function updateCrtToggleUi() {
    if (!crtToggleIcon || !crtToggleTvIcon) return;
    if (crtActive) {
      crtToggleIcon.textContent = "toggle_off";
      crtToggleTvIcon.style.opacity = "1";
      crtToggleButton?.setAttribute("aria-pressed", "true");
    } else {
      crtToggleIcon.textContent = "toggle_on";
      crtToggleTvIcon.style.opacity = "0.6";
      crtToggleButton?.setAttribute("aria-pressed", "false");
    }
  }
  function initCarousel() {
    const track = document.querySelector(".carousel-track");
    const dots = document.querySelectorAll(".carousel-dot");
    const slides = document.querySelectorAll(".carousel-slide");
    if (!track || !dots.length || !slides.length) return;
    function getSlideWidth() {
      const firstSlide = slides[0];
      const style = window.getComputedStyle(track);
      const gap = parseInt(style.gap) || 0;
      return firstSlide.offsetWidth + gap;
    }
    function updateActiveDot() {
      const scrollLeft = track.scrollLeft;
      const slideWidth = getSlideWidth();
      const currentSlide = Math.round(scrollLeft / slideWidth);
      dots.forEach((dot, index) => {
        if (index === currentSlide) {
          dot.classList.add("bg-accent", "scale-125");
          dot.classList.remove("bg-secondary");
        } else {
          dot.classList.remove("bg-accent", "scale-125");
          dot.classList.add("bg-secondary");
        }
      });
    }
    dots.forEach((dot, index) => {
      dot.addEventListener("click", () => {
        const slideWidth = getSlideWidth();
        track.scrollTo({
          left: slideWidth * index,
          behavior: "smooth"
        });
      });
    });
    track.addEventListener("scroll", updateActiveDot);
    updateActiveDot();
    window.addEventListener("resize", updateActiveDot);
  }
  function initHomeCarousels() {
    const carousels = document.querySelectorAll(".home-carousel-container");
    carousels.forEach((container) => {
      const carouselId = container.dataset.carouselId;
      const track = container.querySelector(`[data-carousel-track="${carouselId}"]`);
      const dots = container.querySelectorAll(`[data-carousel-dot="${carouselId}"]`);
      const slides = track?.querySelectorAll(".home-carousel-slide");
      if (!track || !slides.length) return;
      const autoSlideEnabled = container.dataset.autoSlide === "true";
      const slideInterval = parseInt(container.dataset.slideInterval) || 3e3;
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
        if (currentSlide >= slideCount) {
          currentSlide = 0;
        } else if (currentSlide < 0) {
          currentSlide = slideCount - 1;
        }
        dots.forEach((dot, index) => {
          if (index === currentSlide) {
            dot.classList.add("bg-accent", "scale-125");
            dot.classList.remove("bg-secondary");
          } else {
            dot.classList.remove("bg-accent", "scale-125");
            dot.classList.add("bg-secondary");
          }
        });
      }
      function scrollToSlide(index, behavior = "smooth") {
        const slideWidth = getSlideWidth();
        track.scrollTo({
          left: slideWidth * index,
          behavior
        });
      }
      function nextSlide() {
        if (isUserInteracting) return;
        currentSlide++;
        if (currentSlide >= slideCount) {
          currentSlide = 0;
          scrollToSlide(0);
        } else {
          scrollToSlide(currentSlide);
        }
      }
      function startAutoSlide() {
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
        interactionTimeout = setTimeout(() => {
          isUserInteracting = false;
          startAutoSlide();
        }, 5e3);
      }
      dots.forEach((dot, index) => {
        dot.addEventListener("click", () => {
          handleUserInteraction();
          currentSlide = index;
          scrollToSlide(index);
        });
      });
      track.addEventListener("scroll", updateActiveDot);
      track.addEventListener("touchstart", handleUserInteraction, { passive: true });
      track.addEventListener("mousedown", handleUserInteraction);
      document.addEventListener("visibilitychange", () => {
        if (document.hidden) {
          stopAutoSlide();
        } else if (!isUserInteracting) {
          startAutoSlide();
        }
      });
      let resizeTimeout;
      window.addEventListener("resize", () => {
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
      updateActiveDot();
      if (autoSlideEnabled && window.innerWidth < 768) {
        setTimeout(startAutoSlide, 1e3);
      }
    });
  }
  function initDice() {
    const scene = document.getElementById("dice-scene");
    const cube = document.getElementById("dice-cube");
    if (!scene || !cube) return;
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
        setTimeout(startAutoRotate, 2e3);
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
      if (e.target.closest(".dice-link")) return;
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
      scene.style.cursor = "grabbing";
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
      scene.style.cursor = "grab";
      const pos = getPointerPosition(e);
      const totalMoveX = Math.abs(pos.x - startX);
      const totalMoveY = Math.abs(pos.y - startY);
      const totalMove = totalMoveX + totalMoveY;
      if (totalMove < 10) {
        spinDice();
        return;
      }
      if (Math.abs(velocityX) > 0.5 || Math.abs(velocityY) > 0.5) {
        applyMomentum();
      } else {
        setTimeout(startAutoRotate, 2e3);
      }
    }
    scene.addEventListener("mousedown", onPointerDown);
    document.addEventListener("mousemove", onPointerMove);
    document.addEventListener("mouseup", onPointerUp);
    scene.addEventListener("touchstart", onPointerDown, { passive: true });
    document.addEventListener("touchmove", onPointerMove, { passive: false });
    document.addEventListener("touchend", onPointerUp);
    scene.addEventListener("contextmenu", (e) => e.preventDefault());
    updateCube();
    startAutoRotate();
  }
  document.addEventListener("DOMContentLoaded", () => {
    initTheme();
    initCrt();
    initCarousel();
    initHomeCarousels();
    initDice();
  });
})();
