// Footer year
(function setYear() {
  const y = document.getElementById('year');
  if (y) y.textContent = new Date().getFullYear();
})();

document.addEventListener('DOMContentLoaded', () => {

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
      const href = `mailto:sapoya26@colby.edu?subject=${subject}&body=${body}`;
      window.location.href = href;

      if (status) {
        status.textContent = "Opening your email client…";
        setTimeout(() => { status.textContent = "If your mail app didn't open, email me directly at sapoya26@colby.edu."; }, 2200);
      }

      form.reset();
    });
  }

  /* Mobile Hamburger Menu */
  const navToggle = document.getElementById('nav-toggle');
  const mobileNav = document.getElementById('mobile-nav');

  const closeMobileNav = () => {
    if (!mobileNav || !navToggle) return;
    mobileNav.classList.add('hidden');
    mobileNav.setAttribute('aria-hidden', 'true');
    navToggle.setAttribute('aria-expanded', 'false');
  };

  const openMobileNav = () => {
    if (!mobileNav || !navToggle) return;
    mobileNav.classList.remove('hidden');
    mobileNav.setAttribute('aria-hidden', 'false');
    navToggle.setAttribute('aria-expanded', 'true');
  };

  if (navToggle && mobileNav) {
    navToggle.addEventListener('click', () => {
      const expanded = navToggle.getAttribute('aria-expanded') === 'true';
      if (expanded) closeMobileNav();
      else openMobileNav();
    });


  // Close if viewport grows to desktop
  window.addEventListener('resize', () => {
    if (window.innerWidth > 860) closeMobileNav();
  });
}
});
