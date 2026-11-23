/* Arthik View PWA installation and OneSignal web-push setup. */
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

  // Load and initialize OneSignal on every publication page. The existing PWA
  // worker is reused so both offline support and web push share one registration.
  window.OneSignalDeferred = window.OneSignalDeferred || [];
  const oneSignalScript = document.createElement("script");
  oneSignalScript.src = "https://cdn.onesignal.com/sdks/web/v16/OneSignalSDK.page.js";
  oneSignalScript.defer = true;
  oneSignalScript.onload = () => {
    window.OneSignalDeferred.push(async function (OneSignal) {
      try {
        await OneSignal.init({
          appId: "29838496-43f1-400d-90b9-02b0db364120",
          safari_web_id: "web.onesignal.auto.34e4584e-b851-4129-9188-f0d7c790d3df",
          serviceWorkerPath: workerUrl.pathname,
          serviceWorkerParam: { scope: workerScope },
          notifyButton: { enable: false }
        });
      } catch (error) {
        console.error("Arthik View notification setup failed:", error);
      }
    });
  };
  document.head.appendChild(oneSignalScript);

  const notificationButton = document.getElementById("enableNotificationsBtn");
  if (notificationButton) {
    notificationButton.addEventListener("click", () => {
      window.OneSignalDeferred.push(async function (OneSignal) {
        try {
          await OneSignal.Slidedown.promptPush();
        } catch (error) {
          console.error("Arthik View notification permission request failed:", error);
          alert("Notifications could not be enabled in this browser. Please check your browser notification settings and try again.");
        }
      });
    });
  }

  const installButton = document.getElementById("installAppBtn");
  if (!installButton) return;

  let installPrompt = null;
  const isStandalone = () =>
    window.matchMedia("(display-mode: standalone)").matches || window.navigator.standalone === true;

  if (isStandalone()) {
    installButton.hidden = true;
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
        : "If your browser supports installation, open its menu and choose Install app or Add to home screen. If that option is missing, the site may still be finishing its first deployment.");
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
