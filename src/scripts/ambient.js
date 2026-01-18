// Ambient generative background for DynamicPat.github.io
// Warm, slow, subtle — respects prefers-reduced-motion

class AmbientCanvas {
  constructor(canvas) {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d');
    this.particles = [];
    this.running = false;
    this.setupCanvas();
    this.createParticles();
  }

  setupCanvas() {
    this.resize();
    window.addEventListener('resize', () => this.resize());
  }

  resize() {
    this.canvas.width = window.innerWidth;
    this.canvas.height = window.innerHeight;
  }

  createParticles() {
    const count = Math.min(20, Math.floor((this.canvas.width * this.canvas.height) / 30000));
    for (let i = 0; i < count; i++) {
      this.particles.push({
        x: Math.random() * this.canvas.width,
        y: Math.random() * this.canvas.height,
        vx: (Math.random() - 0.5) * 0.3,
        vy: (Math.random() - 0.5) * 0.3,
        size: Math.random() * 80 + 40,
        hue: Math.random() * 60 + 200, // blue-purple range
      });
    }
  }

  draw() {
    const isDark = document.documentElement.dataset.theme === 'dark';
    this.ctx.fillStyle = isDark ? 'rgba(11, 11, 12, 0.05)' : 'rgba(255, 255, 255, 0.05)';
    this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);

    this.particles.forEach((p) => {
      p.x += p.vx;
      p.y += p.vy;
      if (p.x < 0 || p.x > this.canvas.width) p.vx *= -1;
      if (p.y < 0 || p.y > this.canvas.height) p.vy *= -1;

      const gradient = this.ctx.createRadialGradient(p.x, p.y, 0, p.x, p.y, p.size);
      gradient.addColorStop(0, `hsla(${p.hue}, 70%, 60%, 0.15)`);
      gradient.addColorStop(1, `hsla(${p.hue}, 70%, 60%, 0)`);
      this.ctx.fillStyle = gradient;
      this.ctx.fillRect(p.x - p.size, p.y - p.size, p.size * 2, p.size * 2);
    });
  }

  start() {
    if (this.running) return;
    this.running = true;
    const loop = () => {
      if (!this.running) return;
      this.draw();
      requestAnimationFrame(loop);
    };
    loop();
  }

  stop() {
    this.running = false;
    this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
  }
}

// Initialize
const canvas = document.getElementById('ambient-canvas');
const toggle = document.getElementById('ambient-toggle');
const ambient = new AmbientCanvas(canvas);

const prefersReduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
const saved = localStorage.getItem('ambientBg');
const enabled = saved === 'on' || (saved === null && !prefersReduced);

if (enabled) {
  ambient.start();
  toggle.setAttribute('aria-pressed', 'true');
  toggle.textContent = 'Disable ambient';
}

toggle.addEventListener('click', () => {
  const isOn = toggle.getAttribute('aria-pressed') === 'true';
  if (isOn) {
    ambient.stop();
    toggle.setAttribute('aria-pressed', 'false');
    toggle.textContent = 'Enable ambient';
    localStorage.setItem('ambientBg', 'off');
  } else {
    ambient.start();
    toggle.setAttribute('aria-pressed', 'true');
    toggle.textContent = 'Disable ambient';
    localStorage.setItem('ambientBg', 'on');
  }
});
