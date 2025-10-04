import { Game } from './Game.js';

const canvas = document.getElementById('game');
const game = new Game(canvas);

// Load config before playing (G3). If fetch fails (file://), defaults are used.
game.initConfig();

// Theme toggle (stores preference)
const themeBtn = document.getElementById('btnTheme');
const root = document.documentElement;

const saved = localStorage.getItem('fh_theme');
if (saved) root.setAttribute('data-theme', saved);

if (themeBtn){
  const applyLabel = () => {
    themeBtn.textContent = (root.getAttribute('data-theme') === 'dark') ? '🌙 Theme' : '🌞 Theme';
  };
  themeBtn.addEventListener('click', () => {
    const next = root.getAttribute('data-theme') === 'dark' ? 'light' : 'dark';
    root.setAttribute('data-theme', next);
    localStorage.setItem('fh_theme', next);
    applyLabel();
  });
  applyLabel();
}
