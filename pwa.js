/* Arthik View PWA installation and service-worker registration. */
(() => {
  const scriptUrl = document.currentScript
    ? new URL(document.currentScript.src, window.location.href)
    : new URL("./pwa.js", window.location.href);
  const workerUrl = new URL("sw.js", scriptUrl);
  const workerScope = new URL("./", workerUrl).pathname;

  if ("serviceWorker" in navigator) {
    window.addEventListener("load", () => {
      navigator.serviceWorker.register(workerUrl.href, { scope: workerScope })
        .catch(error => console.error("Arthik View service worker registration failed:", error));
    });
  }

  const installButton = document.getElementById("installAppBtn");
  if (!installButton) return;

  let installPrompt = null;
  const isStandalone = () =>
    window.matchMedia("(display-mode: standalone)").matches || window.navigator.standalone === true;

  if (isStandalone()) {
    installButton.hidden = true;
    return;
  }

  window.addEventListener("beforeinstallprompt", event => {
    event.preventDefault();
    installPrompt = event;
    installButton.hidden = false;
    installButton.textContent = "INSTALL APP";
  });

  installButton.addEventListener("click", async () => {
    if (!installPrompt) {
      const isAppleMobile = /iphone|ipad|ipod/i.test(navigator.userAgent);
      alert(isAppleMobile
        ? "To install Arthik View: open this page in Safari, tap Share, then choose Add to Home Screen."
        : "If your browser supports installation, open its menu and choose Install app or Add to Home screen. If that option is missing, the site may still be finishing its first deployment.");
      return;
    }
    installPrompt.prompt();
    await installPrompt.userChoice;
    installPrompt = null;
    installButton.hidden = true;
  });

  window.addEventListener("appinstalled", () => {
    installPrompt = null;
    installButton.hidden = true;
  });
})();