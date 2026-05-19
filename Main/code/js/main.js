/**
 * GL allpay — 공통 JavaScript
 * 헤더 스크롤, 모바일 메뉴, Intersection Observer 애니메이션
 */

(function () {
  'use strict';

  /* ─── Header Scroll ─── */
  const header = document.getElementById('header');

  if (header) {
    let lastScrollY = 0;

    const handleScroll = () => {
      const currentScrollY = window.scrollY;

      if (currentScrollY > 60) {
        header.classList.add('scrolled');
      } else {
        header.classList.remove('scrolled');
      }

      lastScrollY = currentScrollY;
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    handleScroll(); // 초기 실행
  }


  /* ─── Mobile Menu ─── */
  const hamburger = document.getElementById('hamburger');
  const mobileMenu = document.getElementById('mobileMenu');
  const mobileClose = document.getElementById('mobileClose');

  function openMobileMenu() {
    if (mobileMenu) {
      mobileMenu.classList.add('open');
      document.body.style.overflow = 'hidden';
    }
  }

  window.closeMobileMenu = function () {
    if (mobileMenu) {
      mobileMenu.classList.remove('open');
      document.body.style.overflow = '';
    }
  };

  if (hamburger) {
    hamburger.addEventListener('click', openMobileMenu);
  }
  if (mobileClose) {
    mobileClose.addEventListener('click', window.closeMobileMenu);
  }

  // ESC 키로 메뉴 닫기
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') window.closeMobileMenu();
  });


  /* ─── Intersection Observer (Fade-in Animation) ─── */
  const fadeElements = document.querySelectorAll('.fade-in');

  if (fadeElements.length > 0) {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add('visible');
            observer.unobserve(entry.target);
          }
        });
      },
      {
        threshold: 0.1,
        rootMargin: '0px 0px -40px 0px',
      }
    );

    fadeElements.forEach((el) => observer.observe(el));
  }


  /* ─── Active Nav Link (current page) ─── */
  const currentPath = window.location.pathname.split('/').pop() || 'index.html';
  const navLinks = document.querySelectorAll('.nav-link');

  navLinks.forEach((link) => {
    const href = link.getAttribute('href');
    if (href && href === currentPath) {
      link.classList.add('active');
    } else if (
      (currentPath === '' || currentPath === 'index.html') &&
      (href === 'index.html' || href === '/')
    ) {
      link.classList.add('active');
    }
  });


  /* ─── Smooth anchor scroll ─── */
  document.querySelectorAll('a[href^="#"]').forEach((anchor) => {
    anchor.addEventListener('click', (e) => {
      const target = document.querySelector(anchor.getAttribute('href'));
      if (target) {
        e.preventDefault();
        const offset = 80;
        const top = target.getBoundingClientRect().top + window.scrollY - offset;
        window.scrollTo({ top, behavior: 'smooth' });
      }
    });
  });


  /* ─── Toast Utility ─── */
  window.showToast = function (message, type = 'default') {
    const toast = document.getElementById('toast');
    if (!toast) return;

    toast.textContent = message;
    toast.className = `toast ${type}`;

    requestAnimationFrame(() => {
      toast.classList.add('show');
    });

    setTimeout(() => {
      toast.classList.remove('show');
    }, 3500);
  };

})();
