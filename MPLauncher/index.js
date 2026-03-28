/* ================================================================
   MINECRAFT PYTHON LAUNCHER — index.js
   Modules:
     1. Canvas Background (animated network graph)
     2. Navbar (scroll effect + hamburger)
     3. Launcher Mockup (3D tilt on mouse move)
     4. Stats Counter (animated number roll-up)
     5. Scroll Reveal (IntersectionObserver)
     6. Button Ripple (click feedback)
================================================================ */

'use strict';

/* ── 1. Canvas Background ──────────────────────────────────────
   Renders a network of nodes connected by lines, all moving
   slowly. Mouse position nudges the nearest nodes gently.
────────────────────────────────────────────────────────────── */
(function initCanvas() {
  const canvas = document.getElementById('bg-canvas');
  if (!canvas) return;
  const ctx = canvas.getContext('2d');

  // Mouse tracking (starts off-screen so it doesn't affect initial render)
  const mouse = { x: -9999, y: -9999 };

  // Track mouse position for the subtle repulsion effect
  window.addEventListener('mousemove', (e) => {
    mouse.x = e.clientX;
    mouse.y = e.clientY;
  });

  // Node configuration
  const NODE_COUNT = 72;
  const CONNECTION_DIST = 160;    // max px distance to draw a line
  const MOUSE_RADIUS   = 130;     // px — nodes inside this are slightly pushed
  const MOUSE_FORCE    = 0.018;   // strength of the push

  let nodes = [];
  let W = 0, H = 0;

  // Resize canvas to fill the viewport
  function resize() {
    W = canvas.width  = window.innerWidth;
    H = canvas.height = window.innerHeight;
  }

  // Build a fresh set of nodes
  function buildNodes() {
    nodes = Array.from({ length: NODE_COUNT }, () => ({
      x:  Math.random() * W,
      y:  Math.random() * H,
      vx: (Math.random() - 0.5) * 0.4,
      vy: (Math.random() - 0.5) * 0.4,
      r:  Math.random() * 1.5 + 0.8,
    }));
  }

  // Draw one animation frame
  function draw() {
    ctx.clearRect(0, 0, W, H);

    // Update positions and apply soft mouse repulsion
    for (const n of nodes) {
      // Mouse repulsion
      const dx = n.x - mouse.x;
      const dy = n.y - mouse.y;
      const dist = Math.hypot(dx, dy);
      if (dist < MOUSE_RADIUS) {
        n.vx += (dx / dist) * MOUSE_FORCE;
        n.vy += (dy / dist) * MOUSE_FORCE;
      }

      // Velocity damping keeps things from accelerating forever
      n.vx *= 0.995;
      n.vy *= 0.995;

      // Move
      n.x += n.vx;
      n.y += n.vy;

      // Bounce off edges
      if (n.x < 0 || n.x > W) n.vx *= -1;
      if (n.y < 0 || n.y > H) n.vy *= -1;
      n.x = Math.max(0, Math.min(W, n.x));
      n.y = Math.max(0, Math.min(H, n.y));
    }

    // Draw connecting lines between nearby nodes
    for (let i = 0; i < nodes.length; i++) {
      for (let j = i + 1; j < nodes.length; j++) {
        const a = nodes[i], b = nodes[j];
        const d = Math.hypot(a.x - b.x, a.y - b.y);
        if (d < CONNECTION_DIST) {
          // Fade out as distance increases
          const alpha = (1 - d / CONNECTION_DIST) * 0.35;
          ctx.beginPath();
          ctx.strokeStyle = `rgba(0, 180, 255, ${alpha})`;
          ctx.lineWidth = 0.7;
          ctx.moveTo(a.x, a.y);
          ctx.lineTo(b.x, b.y);
          ctx.stroke();
        }
      }
    }

    // Draw nodes as small glowing dots
    for (const n of nodes) {
      ctx.beginPath();
      ctx.arc(n.x, n.y, n.r, 0, Math.PI * 2);
      ctx.fillStyle = 'rgba(0, 180, 255, 0.55)';
      ctx.fill();
    }

    requestAnimationFrame(draw);
  }

  // Init
  resize();
  buildNodes();
  draw();

  // Rebuild on resize (debounced)
  let resizeTimer;
  window.addEventListener('resize', () => {
    clearTimeout(resizeTimer);
    resizeTimer = setTimeout(() => {
      resize();
      buildNodes();
    }, 200);
  });
})();


/* ── 2. Navbar ─────────────────────────────────────────────────
   Adds a .scrolled class after the user scrolls past 20px
   and handles the mobile hamburger toggle.
────────────────────────────────────────────────────────────── */
(function initNavbar() {
  const navbar    = document.getElementById('navbar');
  const hamburger = document.getElementById('hamburger');
  const navLinks  = document.getElementById('nav-links');
  if (!navbar) return;

  // Scroll effect
  window.addEventListener('scroll', () => {
    navbar.classList.toggle('scrolled', window.scrollY > 20);
  }, { passive: true });

  // Hamburger toggle
  if (hamburger && navLinks) {
    hamburger.addEventListener('click', () => {
      const isOpen = navLinks.classList.toggle('open');
      hamburger.classList.toggle('open', isOpen);
      hamburger.setAttribute('aria-expanded', isOpen);
    });

    // Close menu when a link is clicked
    navLinks.querySelectorAll('.nav-link').forEach(link => {
      link.addEventListener('click', () => {
        navLinks.classList.remove('open');
        hamburger.classList.remove('open');
        hamburger.setAttribute('aria-expanded', 'false');
      });
    });
  }
})();


/* ── 3. Launcher Mockup — 3D Tilt ─────────────────────────────
   Listens to mouse movement and tilts the mockup window toward
   the cursor, creating a subtle parallax / 3D effect.
   On mobile (no pointer), the float animation handles motion.
────────────────────────────────────────────────────────────── */
(function initMockupTilt() {
  const mockup = document.getElementById('launcher-mockup');
  if (!mockup) return;

  // Only enable on pointer devices
  if (!window.matchMedia('(pointer: fine)').matches) return;

  const MAX_TILT = 14;   // max degrees of rotation
  const SPEED    = 0.1;  // lerp speed (0–1)

  let targetX = 0, targetY = 0;
  let currentX = 0, currentY = 0;
  let animating = false;

  function lerp(a, b, t) { return a + (b - a) * t; }

  function tick() {
    currentX = lerp(currentX, targetX, SPEED);
    currentY = lerp(currentY, targetY, SPEED);

    mockup.style.transform =
      `rotateX(${currentX}deg) rotateY(${currentY}deg) translateY(0)`;

    // Keep animating until values settle
    if (Math.abs(currentX - targetX) > 0.01 || Math.abs(currentY - targetY) > 0.01) {
      requestAnimationFrame(tick);
    } else {
      animating = false;
    }
  }

  document.addEventListener('mousemove', (e) => {
    const rect = mockup.getBoundingClientRect();
    const cx   = rect.left + rect.width  / 2;
    const cy   = rect.top  + rect.height / 2;

    // Normalise: -1 to +1 relative to mockup center
    const normX = (e.clientX - cx) / (window.innerWidth  / 2);
    const normY = (e.clientY - cy) / (window.innerHeight / 2);

    // rotateX tilts up/down (inverted), rotateY tilts left/right
    targetY = normX * MAX_TILT;
    targetX = -normY * MAX_TILT * 0.6;

    // Subtle brightness lift when cursor is close
    const dist = Math.hypot(e.clientX - cx, e.clientY - cy);
    const proximity = Math.max(0, 1 - dist / 400);
    mockup.style.filter = `brightness(${1 + proximity * 0.15})`;

    if (!animating) { animating = true; requestAnimationFrame(tick); }
  });

  // Reset on mouse leave
  document.addEventListener('mouseleave', () => {
    targetX = 0;
    targetY = 0;
    mockup.style.filter = 'brightness(1)';
    if (!animating) { animating = true; requestAnimationFrame(tick); }
  });
})();


/* ── 4. Stats Counter ─────────────────────────────────────────
   When the stats row enters the viewport, animates each number
   from 0 up to its [data-target] value.
────────────────────────────────────────────────────────────── */
(function initStatsCounter() {
  const statNumbers = document.querySelectorAll('.stat-number[data-target]');
  if (!statNumbers.length) return;

  let triggered = false;

  // Format large numbers with k suffix for readability
  function format(val) {
    if (val >= 1000) return (val / 1000).toFixed(val % 1000 === 0 ? 0 : 1) + 'k';
    return Math.round(val).toString();
  }

  function animateCounter(el, target, duration) {
    const start = performance.now();
    function step(now) {
      const progress = Math.min((now - start) / duration, 1);
      // Ease-out cubic
      const eased = 1 - Math.pow(1 - progress, 3);
      el.textContent = format(eased * target);
      if (progress < 1) requestAnimationFrame(step);
      else el.textContent = format(target);
    }
    requestAnimationFrame(step);
  }

  const observer = new IntersectionObserver((entries) => {
    if (triggered) return;
    if (entries.some(e => e.isIntersecting)) {
      triggered = true;
      statNumbers.forEach((el, i) => {
        const target = parseInt(el.dataset.target, 10);
        // Stagger each counter slightly
        setTimeout(() => animateCounter(el, target, 1600), i * 150);
      });
      observer.disconnect();
    }
  }, { threshold: 0.5 });

  // Observe the first stat number's parent section
  observer.observe(statNumbers[0].closest('.hero-stats') || statNumbers[0]);
})();


/* ── 5. Scroll Reveal ─────────────────────────────────────────
   Uses IntersectionObserver to add .visible to elements that
   have the .reveal class (and feature cards with .feature-card).
   CSS handles the fade-in + translate animation.
────────────────────────────────────────────────────────────── */
(function initScrollReveal() {
  // Include both .reveal elements and .feature-card elements
  const targets = document.querySelectorAll('.reveal, .feature-card');
  if (!targets.length) return;

  const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        const el    = entry.target;
        const delay = parseInt(el.dataset.delay || '0', 10);

        // Apply CSS transition-delay for staggered card reveals
        if (delay) el.style.transitionDelay = delay + 'ms';

        el.classList.add('visible');
        observer.unobserve(el); // Only animate once
      }
    });
  }, {
    threshold: 0.12,
    rootMargin: '0px 0px -40px 0px',
  });

  targets.forEach(el => observer.observe(el));
})();


/* ── 6. Button Ripple Effect ──────────────────────────────────
   On click, injects a ripple element that expands and fades out
   from the click point, giving tactile feedback.
────────────────────────────────────────────────────────────── */
(function initRipple() {
  document.querySelectorAll('.btn').forEach(btn => {
    btn.addEventListener('click', function (e) {
      // Remove any existing ripple first
      const old = this.querySelector('.btn-ripple');
      if (old) old.remove();

      const rect   = this.getBoundingClientRect();
      const size   = Math.max(rect.width, rect.height) * 2;
      const x      = e.clientX - rect.left - size / 2;
      const y      = e.clientY - rect.top  - size / 2;

      const ripple = document.createElement('span');
      ripple.className = 'btn-ripple';

      // Inline styles for the ripple circle
      Object.assign(ripple.style, {
        position:      'absolute',
        width:         size + 'px',
        height:        size + 'px',
        left:          x + 'px',
        top:           y + 'px',
        borderRadius:  '50%',
        background:    'rgba(255,255,255,0.15)',
        transform:     'scale(0)',
        animation:     'rippleAnim 0.5s ease-out forwards',
        pointerEvents: 'none',
        zIndex:        10,
      });

      this.appendChild(ripple);
      ripple.addEventListener('animationend', () => ripple.remove());
    });
  });

  // Inject the ripple keyframe into the document
  const style = document.createElement('style');
  style.textContent = `
    @keyframes rippleAnim {
      to { transform: scale(1); opacity: 0; }
    }
  `;
  document.head.appendChild(style);
})();
