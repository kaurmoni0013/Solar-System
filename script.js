/**
 * Animated Space Starfield — ported from the portfolio site's Backdrop.
 * 320+ twinkling & floating stars, 4-point glowing starbursts, dynamic shooting stars.
 * Rendered on a fixed full-screen canvas behind the solar system.
 */
(function () {
  var canvas = document.getElementById('starfield');
  if (!canvas) return;
  var ctx = canvas.getContext('2d');
  if (!ctx) return;

  var animationFrameId;
  var width = window.innerWidth;
  var height = window.innerHeight;

  var handleResize = function () {
    var dpr = window.devicePixelRatio || 1;
    width = window.innerWidth;
    height = window.innerHeight;
    canvas.width = width * dpr;
    canvas.height = height * dpr;
    canvas.style.width = width + 'px';
    canvas.style.height = height + 'px';
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  };

  handleResize();
  window.addEventListener('resize', handleResize);

  var numStars = 320;
  var stars = [];

  var starColors = [
    '#ffffff',
    '#f0e6ff',
    '#c77af0',
    '#d99afa',
    '#78c7b5',
    '#ffd700',
  ];

  for (var i = 0; i < numStars; i++) {
    var isBright = Math.random() < 0.12;
    stars.push({
      x: Math.random() * width,
      y: Math.random() * height,
      radius: isBright ? Math.random() * 1.8 + 1.5 : Math.random() * 1.2 + 0.6,
      color: starColors[Math.floor(Math.random() * starColors.length)],
      alpha: Math.random() * 0.7 + 0.3,
      twinkleSpeed: (Math.random() * 0.025 + 0.008) * (Math.random() < 0.5 ? 1 : -1),
      vx: (Math.random() - 0.5) * 0.2,
      vy: (Math.random() - 0.5) * 0.2,
      isBright: isBright
    });
  }

  var shootingStar = null;

  var spawnShootingStar = function () {
    shootingStar = {
      x: Math.random() * width * 0.8,
      y: Math.random() * height * 0.4,
      length: Math.random() * 80 + 60,
      speed: Math.random() * 8 + 6,
      angle: Math.PI / 4 + (Math.random() - 0.5) * 0.2,
      alpha: 1,
      active: true
    };
  };

  var nextSpawnTime = Date.now() + Math.random() * 4000 + 2000;

  var draw4PointStar = function (x, y, r, color, alpha) {
    ctx.save();
    ctx.globalAlpha = alpha;
    ctx.fillStyle = color;
    ctx.shadowColor = color;
    ctx.shadowBlur = 10;

    ctx.beginPath();
    for (var k = 0; k < 4; k++) {
      ctx.lineTo(Math.cos((k * Math.PI) / 2) * r + x, Math.sin((k * Math.PI) / 2) * r + y);
      ctx.lineTo(
        Math.cos((k * Math.PI) / 2 + Math.PI / 4) * (r * 0.3) + x,
        Math.sin((k * Math.PI) / 2 + Math.PI / 4) * (r * 0.3) + y
      );
    }
    ctx.closePath();
    ctx.fill();
    ctx.restore();
  };

  var render = function () {
    ctx.clearRect(0, 0, width, height);

    for (var s = 0; s < stars.length; s++) {
      var star = stars[s];

      star.x += star.vx;
      star.y += star.vy;

      if (star.x < 0) star.x = width;
      if (star.x > width) star.x = 0;
      if (star.y < 0) star.y = height;
      if (star.y > height) star.y = 0;

      star.alpha += star.twinkleSpeed;
      if (star.alpha > 0.98 || star.alpha < 0.2) {
        star.twinkleSpeed = -star.twinkleSpeed;
      }

      var currentAlpha = Math.max(0.15, Math.min(1, star.alpha));

      if (star.isBright && currentAlpha > 0.6) {
        draw4PointStar(star.x, star.y, star.radius * 3.5, star.color, currentAlpha);
      } else {
        ctx.save();
        ctx.globalAlpha = currentAlpha;
        ctx.fillStyle = star.color;
        ctx.shadowColor = star.color;
        ctx.shadowBlur = star.radius * 3;
        ctx.beginPath();
        ctx.arc(star.x, star.y, star.radius, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
      }
    }

    if (Date.now() > nextSpawnTime && (!shootingStar || !shootingStar.active)) {
      spawnShootingStar();
      nextSpawnTime = Date.now() + Math.random() * 5000 + 4000;
    }

    if (shootingStar && shootingStar.active) {
      var endX = shootingStar.x - Math.cos(shootingStar.angle) * shootingStar.length;
      var endY = shootingStar.y - Math.sin(shootingStar.angle) * shootingStar.length;

      var grad = ctx.createLinearGradient(shootingStar.x, shootingStar.y, endX, endY);
      grad.addColorStop(0, 'rgba(255, 255, 255, ' + shootingStar.alpha + ')');
      grad.addColorStop(0.3, 'rgba(199, 122, 240, ' + (shootingStar.alpha * 0.7) + ')');
      grad.addColorStop(1, 'rgba(199, 122, 240, 0)');

      ctx.save();
      ctx.strokeStyle = grad;
      ctx.lineWidth = 2;
      ctx.lineCap = 'round';
      ctx.beginPath();
      ctx.moveTo(shootingStar.x, shootingStar.y);
      ctx.lineTo(endX, endY);
      ctx.stroke();
      ctx.restore();

      shootingStar.x += Math.cos(shootingStar.angle) * shootingStar.speed;
      shootingStar.y += Math.sin(shootingStar.angle) * shootingStar.speed;
      shootingStar.alpha -= 0.015;

      if (shootingStar.alpha <= 0 || shootingStar.x > width || shootingStar.y > height) {
        shootingStar.active = false;
      }
    }

    animationFrameId = requestAnimationFrame(render);
  };

  render();

  // Pause motion while inspecting a planet or the sun; resume only when the
  // pointer moves well away (beyond the tooltip area)
  var inspectX = 0;
  var inspectY = 0;
  var INSPECT_RADIUS = 160;
  var TARGETS = '.planet, .sun';
  var targets = document.querySelectorAll(TARGETS);

  var anchorInspect = function (el) {
    var b = el.getBoundingClientRect();
    inspectX = b.left + b.width / 2;
    inspectY = b.top + b.height / 2;
    document.body.classList.add('paused');
  };

  for (var k = 0; k < targets.length; k++) {
    targets[k].addEventListener('pointerdown', function () {
      anchorInspect(this);
    });
  }

  document.addEventListener('pointermove', function (e) {
    if (!document.body.classList.contains('paused')) return;
    var dx = e.clientX - inspectX;
    var dy = e.clientY - inspectY;
    if (dx * dx + dy * dy > INSPECT_RADIUS * INSPECT_RADIUS) {
      document.body.classList.remove('paused');
    }
  });

  document.addEventListener('pointerdown', function (e) {
    if (e.target.closest && !e.target.closest(TARGETS)) {
      document.body.classList.remove('paused');
    }
  });

  window.addEventListener('beforeunload', function () {
    window.removeEventListener('resize', handleResize);
    cancelAnimationFrame(animationFrameId);
  });
})();