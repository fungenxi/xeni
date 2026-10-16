import { getAll } from '../data/local-db.js';

const ROW_ID = 'xeni-csv-export-row';
const DIVIDER_ID = 'xeni-csv-export-divider';

function findSettingsDataGroup() {
  const label = [...document.querySelectorAll('.settings-section-label')]
    .find((el) => el.textContent?.trim() === 'Data');
  const group = label?.nextElementSibling;
  return group?.classList.contains('settings-group') ? group : null;
}

// Quote every text cell. Text starting with = + - @ is prefixed with an apostrophe so
// Numbers/Excel never evaluate it as a formula.
function textCell(value) {
  let text = String(value ?? '');
  if (/^[=+\-@\t\r]/.test(text)) text = `'${text}`;
  return `"${text.replace(/"/g, '""')}"`;
}

function humanize(key) {
  return String(key || '').replace(/_/g, ' ').replace(/^\w/, (c) => c.toUpperCase());
}

function amountOf(tx) {
  const cents = Number.isInteger(tx.amountCents) ? tx.amountCents : Math.round(100 * Number(tx.amount || 0));
  return (cents / 100).toFixed(2);
}

export function buildCsv(transactions, categories) {
  const labels = new Map(categories.map((c) => [c.key, c.label]));
  const rows = [...transactions].sort((a, b) => String(b.date).localeCompare(String(a.date)));
  const lines = [['Date', 'Name', 'Amount', 'Category', 'Source'].join(',')];
  for (const tx of rows) {
    const key = tx.incomeCategory || tx.categoryKey;
    lines.push([
      textCell(tx.date),
      textCell(tx.name),
      amountOf(tx), // negative = expense, positive = income, as stored in Xeni
      textCell(labels.get(key) || humanize(key)),
      textCell(tx.source),
    ].join(','));
  }
  // BOM so Numbers/Excel read the file as UTF-8; CRLF line endings per RFC 4180.
  return `﻿${lines.join('\r\n')}\r\n`;
}

async function exportCsv() {
  const [transactions, categories] = await Promise.all([getAll('transactions'), getAll('categories')]);
  const blob = new Blob([buildCsv(transactions, categories)], { type: 'text/csv;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = `xeni-transactions-${new Date().toISOString().slice(0, 10)}.csv`;
  document.body.appendChild(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(url);
}

export function mountCsvExport() {
  if (document.getElementById(ROW_ID)) return;
  const group = findSettingsDataGroup();
  if (!group) return;
  const backupButton = [...group.querySelectorAll('button.list-row')]
    .find((b) => ['Export backup', 'Back up now'].includes(b.querySelector('.list-row-title')?.textContent?.trim()));
  if (!backupButton) return;

  // Clone the backup row so the new row inherits the app's own styling and chevron.
  const row = backupButton.cloneNode(true);
  row.id = ROW_ID;
  delete row.dataset.xeniBackupWired;
  row.querySelector('.list-row-title').textContent = 'Export for Numbers (CSV)';
  row.addEventListener('click', () => { exportCsv().catch((error) => console.error('CSV export failed', error)); });

  const divider = document.createElement('div');
  divider.id = DIVIDER_ID;
  divider.className = 'list-divider xeni-enhancement-divider';
  divider.style.marginLeft = '18px';

  backupButton.insertAdjacentElement('afterend', divider);
  divider.insertAdjacentElement('afterend', row);
}
