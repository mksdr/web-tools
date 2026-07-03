// js/theme.js
const themeStorage = {
  get() {
    try {
      const theme = localStorage.getItem('theme');
      if (theme) return theme;
    } catch (e) {}
    
    try {
      if (window.name && ['light', 'dark', 'auto'].includes(window.name)) {
        return window.name;
      }
    } catch (e) {}

    try {
      const match = document.cookie.match(/theme=(light|dark|auto)/);
      if (match) return match[1];
    } catch (e) {}

    return 'auto';
  },

  set(theme) {
    try {
      localStorage.setItem('theme', theme);
    } catch (e) {}

    try {
      window.name = theme;
    } catch (e) {}

    try {
      document.cookie = `theme=${theme};path=/;max-age=31536000`;
    } catch (e) {}
  }
};

const themeManager = {
  init() {
    const savedTheme = themeStorage.get();
    this.applyTheme(savedTheme);
    this.setupListeners();
  },

  applyTheme(theme) {
    const root = document.documentElement;
    const isDarkSystem = window.matchMedia('(prefers-color-scheme: dark)').matches;

    // 1. 클래스 제거 후 재설정
    root.classList.remove('dark', 'light');

    if (theme === 'auto') {
      if (isDarkSystem) {
        root.classList.add('dark');
      } else {
        root.classList.add('light');
      }
    } else if (theme === 'dark') {
      root.classList.add('dark');
    } else {
      root.classList.add('light');
    }

    themeStorage.set(theme);
    this.updateToggleUI(theme);
  },

  setupListeners() {
    // DOMContentLoaded 이후나 스크립트 실행 시 리스너 등록
    // 페이지 전환 등으로 여러 번 호출되거나 동적으로 스위처가 나타나는 경우 대비
    const attach = () => {
      const switcher = document.getElementById('theme-switcher');
      if (switcher && !switcher.dataset.listenerAttached) {
        switcher.addEventListener('click', (e) => {
          const btn = e.target.closest('button[data-theme]');
          if (btn) {
            const theme = btn.getAttribute('data-theme');
            this.applyTheme(theme);
          }
        });
        switcher.dataset.listenerAttached = 'true';
        this.updateToggleUI(themeStorage.get());
      }
    };

    attach();
    // DOM이 이미 로드되었으면 바로 실행, 아니면 DOMContentLoaded 대기
    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', attach);
    }
  },

  updateToggleUI(theme) {
    const switcher = document.getElementById('theme-switcher');
    if (!switcher) return;
    const buttons = switcher.querySelectorAll('button[data-theme]');
    buttons.forEach(btn => {
      if (btn.getAttribute('data-theme') === theme) {
        btn.classList.add('bg-white', 'dark:bg-space-accent', 'text-gray-950', 'dark:text-space-deep', 'shadow-sm');
        btn.classList.remove('text-gray-500', 'dark:text-gray-400');
      } else {
        btn.classList.remove('bg-white', 'dark:bg-space-accent', 'text-gray-950', 'dark:text-space-deep', 'shadow-sm');
        btn.classList.add('text-gray-500', 'dark:text-gray-400');
      }
    });
  }
};

// 시스템 테마 변경 감지 (Auto 모드일 때 실시간 반영)
window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', () => {
  if (themeStorage.get() === 'auto') {
    themeManager.applyTheme('auto');
  }
});

document.addEventListener('DOMContentLoaded', () => themeManager.init());