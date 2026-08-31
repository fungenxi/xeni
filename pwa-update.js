(() => {
  const VERSION = '1.0.1';
  const UPDATE_ROW_ID = 'xeni-app-update-row';
  let reloading = false;
  let checking = false;

  const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

  function setStatus(message) {
    const status = document.querySelector('#xeni-app-update-status');
    if (status) status.textContent = message;
  }

  async function checkForUpdates({ quiet = false } = {}) {
    if (checking || !('serviceWorker' in navigator)) return;
    checking = true;
    if (!quiet) setStatus('Checking…');

    try {
      const registration = await navigator.serviceWorker.getRegistration('./');
      if (!registration) {
        setStatus('Updates will be available after reopening Xeni once.');
        return;
      }

      let foundUpdate = Boolean(registration.waiting);
      registration.addEventListener('updatefound', () => {
        foundUpdate = true;
      }, { once: true });

      await registration.update();
      await sleep(700);

      if (registration.waiting) {
        foundUpdate = true;
        registration.waiting.postMessage({ type: 'SKIP_WAITING' });
      }

      if (!quiet) {
        setStatus(foundUpdate ? 'Update found · applying…' : 'Xeni is up to date');
      }
    } catch (error) {
      console.warn('Xeni update check failed.', error);
      if (!quiet) setStatus('Could not check for updates');
    } finally {
      checking = false;
    }
  }

  function mountUpdateRow() {
    if (document.getElementById(UPDATE_ROW_ID)) return;
    const footer = document.querySelector('.settings-footer-note');
    if (!footer) return;

    const sectionLabel = document.createElement('div');
    sectionLabel.className = 'settings-section-label';
    sectionLabel.id = 'xeni-app-update-label';
    sectionLabel.textContent = 'App';

    const group = document.createElement('div');
    group.className = 'settings-group';
    group.id = UPDATE_ROW_ID;
    group.innerHTML = `
      <button class="list-row" type="button" id="xeni-check-update-btn">
        <div class="list-row-title" style="flex:1">Check for updates</div>
        <span class="settings-row-meta">v${VERSION} ↻</span>
      </button>
      <div class="list-divider" style="margin-left:18px"></div>
      <div class="list-row" style="cursor:default">
        <div class="list-row-title" style="flex:1">Update status</div>
        <span class="settings-row-meta" id="xeni-app-update-status">Automatic on launch</span>
      </div>`;

    footer.parentNode.insertBefore(sectionLabel, footer);
    footer.parentNode.insertBefore(group, footer);
    group.querySelector('#xeni-check-update-btn')?.addEventListener('click', () => checkForUpdates());
  }

  if ('serviceWorker' in navigator) {
    navigator.serviceWorker.addEventListener('controllerchange', () => {
      if (reloading) return;
      reloading = true;
      window.location.reload();
    });

    window.addEventListener('load', () => {
      setTimeout(() => checkForUpdates({ quiet: true }), 1200);
    });
  }

  const observer = new MutationObserver(mountUpdateRow);
  observer.observe(document.documentElement, { childList: true, subtree: true });
  mountUpdateRow();
})();
