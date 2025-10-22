const fond = document.body;

function createSymbol() {
  const symboles = ['🌸','💖','🌺','⚜️','✨','💫','🌿','💎','🌹'];
  const span = document.createElement('span');
  span.textContent = symboles[Math.floor(Math.random() * symboles.length)];
  span.classList.add('symbol');

  // flottement autour du logo et partie supérieure
  span.style.left = 20 + Math.random() * 60 + 'vw';
  span.style.top = 10 + Math.random() * 40 + 'vh';
  span.style.fontSize = 14 + Math.random() * 26 + 'px';
  span.style.animationDuration = 4 + Math.random() * 4 + 's';

  fond.appendChild(span);
  setTimeout(() => span.remove(), 8000);
}

setInterval(createSymbol, 200); // plus dynamique pour effet immersif
