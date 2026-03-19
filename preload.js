// Inject CSS to handle macOS traffic light area
window.addEventListener('DOMContentLoaded', () => {
  if (navigator.platform.includes('Mac')) {
    const style = document.createElement('style');
    style.textContent = `
      /* Add left padding for macOS traffic lights (hiddenInset titlebar) */
      body {
        padding-left: env(titlebar-area-x, 0px) !important;
      }
      /* Ensure topbar and logo have enough left margin */
      [class*="topbar"], [class*="logo"] {
        padding-left: 72px !important;
      }
    `;
    document.head.appendChild(style);
  }
});
