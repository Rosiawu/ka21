"use client";

import { useEffect } from 'react';

function scrollToCurrentHash() {
  if (typeof window === 'undefined') return;

  const targetId = decodeURIComponent(window.location.hash.replace(/^#/, '').trim());
  if (!targetId) return;

  const target = document.getElementById(targetId);
  if (!target) return;

  target.scrollIntoView({ behavior: 'smooth', block: 'start' });
  target.classList.add('ring-2', 'ring-indigo-300', 'dark:ring-indigo-500');
  window.setTimeout(() => {
    target.classList.remove('ring-2', 'ring-indigo-300', 'dark:ring-indigo-500');
  }, 2200);
}

export default function DevLogHashNavigator() {
  useEffect(() => {
    const timer = window.setTimeout(scrollToCurrentHash, 120);
    window.addEventListener('hashchange', scrollToCurrentHash);

    return () => {
      window.clearTimeout(timer);
      window.removeEventListener('hashchange', scrollToCurrentHash);
    };
  }, []);

  return null;
}
