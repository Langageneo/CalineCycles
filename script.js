const fond = document.body;

function createSymbol() {
  const symboles = ['🌸', '💖', '🌺', '⚜️', '✨', '💫', '🌿', '💎', '🌹'];
  const span = document.createElement('span');
  span.textContent = symboles[Math.floor(Math.random() * symboles.length)];
  span.classList.add('symbol');
  span.style.left = Math.random() * 100 + 'vw';
  span.style.animationDuration = 4 + Math.random() * 5 + 's';
  fond.appendChild(span);

  setTimeout(() => span.remove(), 8000);
}

setInterval(createSymbol, 500);
