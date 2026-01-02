(function setYear() {
  const y = document.getElementById('year');
  if (y) y.textContent = new Date().getFullYear();
})();

window.addEventListener('load', () => {
  const text = "Software & ML Engineer";
  const typedTextSpan = document.getElementById("typed-text");
  
  let charIndex = 0;
  let isDeleting = false;
  
  function typeEffect() {
    if (!typedTextSpan) return;
    
    if (!isDeleting && charIndex < text.length) {
      typedTextSpan.textContent += text.charAt(charIndex);
      charIndex++;
      setTimeout(typeEffect, 100);
    } else if (!isDeleting && charIndex === text.length) {
      setTimeout(() => {
        isDeleting = true;
        typeEffect();
      }, 2000);
    } else if (isDeleting && charIndex > 0) {
      typedTextSpan.textContent = text.substring(0, charIndex - 1);
      charIndex--;
      setTimeout(typeEffect, 50);
    } else if (isDeleting && charIndex === 0) {
      isDeleting = false;
      setTimeout(typeEffect, 500);
    }
  }
  
  setTimeout(typeEffect, 500);
});

document.addEventListener('DOMContentLoaded', () => {

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
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
        if (status) status.textContent = 'Please enter a valid email.';
        return;
      }

      const subject = encodeURIComponent(`Portfolio contact from ${name}`);
      const body = encodeURIComponent(
        `Name: ${name}\nEmail: ${email}\n\nMessage:\n${message}\n`
      );
      const href = `mailto:sapoya26@colby.edu?subject=${subject}&body=${body}`;
      window.location.href = href;

      if (status) {
        status.textContent = "Opening your email client…";
        setTimeout(() => { 
          status.textContent = "If your mail app didn't open, email me directly at sapoya26@colby.edu."; 
        }, 2200);
      }

      form.reset();
    });
  }

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

    window.addEventListener('resize', () => {
      if (window.innerWidth > 860) closeMobileNav();
    });
  }

  document.querySelectorAll('a[href^="#"]').forEach(anchor => {
    anchor.addEventListener('click', function (e) {
      const href = this.getAttribute('href');
      if (href !== '#' && href.length > 1) {
        e.preventDefault();
        const target = document.querySelector(href);
        if (target) {
          target.scrollIntoView({
            behavior: 'smooth',
            block: 'start'
          });
          if (window.innerWidth <= 860) {
            closeMobileNav();
          }
        }
      }
    });
  });

  const sections = document.querySelectorAll('main section, .hero, #highlights, #experience');
  const navLinks = document.querySelectorAll('.nav-link');

  window.addEventListener('scroll', () => {
    let current = '';
    sections.forEach(section => {
      const sectionTop = section.offsetTop;
      const sectionHeight = section.clientHeight;
      if (window.pageYOffset >= sectionTop - 100) {
        current = section.getAttribute('id');
      }
    });

    navLinks.forEach(link => {
      link.classList.remove('active');
      if (link.getAttribute('href') === `#${current}`) {
        link.classList.add('active');
      }
    });
  });

  const observerOptions = {
    threshold: 0.1,
    rootMargin: '0px 0px -100px 0px'
  };

  const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.classList.add('visible');
      } else {
        entry.target.classList.remove('visible');
      }
    });
  }, observerOptions);

  document.querySelectorAll('.project-card, .highlight-card, .experience-item, #contact').forEach(el => {
    el.classList.add('fade-in');
    observer.observe(el);
  });

  function initCarousels() {
    document.querySelectorAll('.highlight-carousel').forEach(carousel => {
      const track = carousel.querySelector('.carousel-track');
      const images = track.querySelectorAll('img');
      const prevBtn = carousel.querySelector('.prev');
      const nextBtn = carousel.querySelector('.next');
      const dotsContainer = carousel.querySelector('.carousel-dots');
      
      let currentIndex = 0;
      const totalImages = images.length;
      
      for (let i = 0; i < totalImages; i++) {
        const dot = document.createElement('div');
        dot.classList.add('carousel-dot');
        if (i === 0) dot.classList.add('active');
        dot.addEventListener('click', () => goToSlide(i));
        dotsContainer.appendChild(dot);
      }
      
      const dots = dotsContainer.querySelectorAll('.carousel-dot');
      
      function updateCarousel() {
        track.style.transform = `translateX(-${currentIndex * 100}%)`;
        dots.forEach((dot, index) => {
          dot.classList.toggle('active', index === currentIndex);
        });
      }
      
      function goToSlide(index) {
        currentIndex = index;
        updateCarousel();
      }
      
      function nextSlide() {
        currentIndex = (currentIndex + 1) % totalImages;
        updateCarousel();
      }
      
      function prevSlide() {
        currentIndex = (currentIndex - 1 + totalImages) % totalImages;
        updateCarousel();
      }
      
      nextBtn.addEventListener('click', nextSlide);
      prevBtn.addEventListener('click', prevSlide);
      
      let autoPlay = setInterval(nextSlide, 4000);
      
      carousel.addEventListener('mouseenter', () => clearInterval(autoPlay));
      carousel.addEventListener('mouseleave', () => {
        autoPlay = setInterval(nextSlide, 4000);
      });
    });
  }

  initCarousels();

});