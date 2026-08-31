import { formatDateTime, getMeta, getTransactionCount } from '../data/local-db.js';

const ROW_ID = 'xeni-last-backup-row';
const NOTE_ID = 'xeni-backup-note';
let refreshing = false;

function findSettingsDataGroup() {
  const labels = [...document.querySelectorAll('.settings-section-label')];
  const dataLabel = labels.find((label) => label.textContent?.trim() === 'Data');
  if (!dataLabel) return null;
  const group = dataLabel.nextElementSibling;
  return group?.classList.contains('settings-group') ? group : null;
}

function backupAgeDays(value) {
  if (!value) return null;
  const time = new Date(value).getTime();
  if (!Number.isFinite(time)) return null;
  return Math.max(0, Math.floor((Date.now() - time) / 86400000));
}

function ensureBackupRow(group) {
  let row = document.getElementById(ROW_ID);
  if (row) return row;

  const storageRow = [...group.querySelectorAll('.list-row')]
    .find((candidate) => candidate.querySelector('.list-row-title')?.textContent?.trim() === 'Storage');
  if (!storageRow) return null;

  const divider = document.createElement('div');
  divider.className = 'list-divider xeni-enhancement-divider';
  divider.style.marginLeft = '18px';

  row = document.createElement('div');
  row.id = ROW_ID;
  row.className = 'list-row';
  row.innerHTML = `
    <div class="list-row-title" style="flex:1">Last backup</div>
    <span class="settings-row-meta" id="xeni-last-backup-value">Checking…</span>`;

  storageRow.insertAdjacentElement('afterend', divider);
  divider.insertAdjacentElement('afterend', row);
  return row;
}

function ensureBackupNote(group) {
  let note = document.getElementById(NOTE_ID);
  if (note) return note;
  note = document.createElement('div');
  note.id = NOTE_ID;
  note.className = 'xeni-backup-note';
  group.insertAdjacentElement('afterend', note);
  return note;
}

function wireExportButton(group) {
  const exportButton = [...group.querySelectorAll('button.list-row')]
    .find((button) => ['Export backup', 'Back up now'].includes(button.querySelector('.list-row-title')?.textContent?.trim()));
  if (!exportButton || exportButton.dataset.xeniBackupWired === '1') return;
  exportButton.dataset.xeniBackupWired = '1';

  const title = exportButton.querySelector('.list-row-title');
  if (title) title.textContent = 'Back up now';

  exportButton.addEventListener('click', () => {
    setTimeout(() => refreshDataSafety(), 450);
  });
}

export async function refreshDataSafety() {
  if (refreshing) return;
  const group = findSettingsDataGroup();
  if (!group) return;

  refreshing = true;
  try {
    const row = ensureBackupRow(group);
    const note = ensureBackupNote(group);
    wireExportButton(group);
    if (!row || !note) return;

    const [lastBackupAt, transactionCount, persistent] = await Promise.all([
      getMeta('lastBackupAt').catch(() => undefined),
      getTransactionCount().catch(() => 0),
      navigator.storage?.persisted?.().catch?.(() => false) ?? Promise.resolve(false),
    ]);

    const value = row.querySelector('#xeni-last-backup-value');
    if (value) value.textContent = lastBackupAt ? formatDateTime(lastBackupAt) : 'Never';

    const age = backupAgeDays(lastBackupAt);
    let message = '';
    let tone = 'neutral';

    if (transactionCount > 0 && !lastBackupAt) {
      message = 'Backup recommended · your Xeni data lives on this device. Save a JSON backup before major changes or device moves.';
      tone = 'attention';
    } else if (transactionCount > 0 && age !== null && age >= 30) {
      message = `Backup recommended · your last backup was ${age} days ago.`;
      tone = 'attention';
    } else if (lastBackupAt) {
      message = persistent
        ? 'Your data is stored locally with persistent storage requested. Keep an occasional backup for device loss or browser resets.'
        : 'Your data is stored locally. Keep an occasional backup because browsers can still clear site data.';
      tone = 'ok';
    } else {
      message = 'Your data is stored locally on this device. Backups become useful once you start adding transactions.';
    }

    note.dataset.tone = tone;
    note.textContent = message;
  } finally {
    refreshing = false;
  }
}

export function mountDataSafety() {
  const group = findSettingsDataGroup();
  if (!group) return;
  wireExportButton(group);
  if (document.getElementById(ROW_ID)) return;
  ensureBackupRow(group);
  ensureBackupNote(group);
  refreshDataSafety();
}
