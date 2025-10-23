// Footer year
(function setYear() {
  const y = document.getElementById('year');
  if (y) y.textContent = new Date().getFullYear();
})();

document.addEventListener('DOMContentLoaded', () => {
  const modal = document.getElementById('path-modal');
  const traditionalPath = document.getElementById('traditional-path');
  const adventurePath = document.getElementById('adventure-path');
  const traditionalView = document.getElementById('traditional-view');
  const gameView = document.getElementById('game-view');
  const exitGameBtn = document.getElementById('exit-game');
  const switchers = document.querySelectorAll('.switch-to-game');

  const hideModal = () => { if (modal) modal.style.display = 'none'; };

  const showPortfolio = () => {
    hideModal();
    gameView.classList.add('hidden');
    traditionalView.classList.remove('hidden');
    if (window.stopGame) window.stopGame();
    if (window.stopAudioScene) window.stopAudioScene();
  };

  const showGame = async () => {
    hideModal();
    traditionalView.classList.add('hidden');
    gameView.classList.remove('hidden');

    if (!window.THREE) {
      alert('Three.js did not load. Check your network and script tag URL.');
      return;
    }
    if (typeof window.initGame === 'function') window.initGame();
    if (typeof window.startAudioScene === 'function') window.startAudioScene();
  };

  // Modal choices
  if (traditionalPath) traditionalPath.addEventListener('click', showPortfolio);
  if (adventurePath)  adventurePath.addEventListener('click',  showGame);

  // In-page triggers (hero + nav button)
  switchers.forEach((btn) => btn.addEventListener('click', showGame));

  // Exit from game
  if (exitGameBtn) exitGameBtn.addEventListener('click', showPortfolio);

  // Contact form handler
  const form = document.getElementById('contact-form');
  const status = document.getElementById('form-status');

  if (form) {
    form.addEventListener('submit', (e) => {
      e.preventDefault();

      const name = (document.getElementById('cf-name')?.value || '').trim();
      const email = (document.getElementById('cf-email')?.value || '').trim();
      const message = (document.getElementById('cf-message')?.value || '').trim();

      if (!name || !email || !message) {
        if (status) status.textContent = 'Please fill in all fields.';
        return;
      }
      // Email check
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
        if (status) status.textContent = 'Please enter a valid email.';
        return;
      }

      // Build a mailto link
      const subject = encodeURIComponent(`Portfolio contact from ${name}`);
      const body = encodeURIComponent(
        `Name: ${name}\nEmail: ${email}\n\nMessage:\n${message}\n`
      );
      const href = `mailto:samuel@example.com?subject=${subject}&body=${body}`;
      window.location.href = href;

      if (status) {
        status.textContent = "Opening your email client…";
        setTimeout(() => { status.textContent = "If your mail app didn't open, email me directly at samuel@example.com."; }, 2200);
      }

      form.reset();
    });
  }
});
