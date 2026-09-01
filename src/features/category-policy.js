import { getRecord, putRecord } from '../data/local-db.js';

let capMigrationStarted = false;

async function removeStoredOthersCap() {
  if (capMigrationStarted) return;
  capMigrationStarted = true;

  try {
    const category = await getRecord('categories', 'other_expense');
    if (!category || category.cap === 0) return;
    await putRecord('categories', { ...category, cap: 0 });
  } catch (error) {
    console.warn('Xeni could not remove the stored Others cap.', error);
  }
}

function cleanOthersBudgetEditor() {
  document.querySelectorAll('.sheet-panel').forEach((panel) => {
    const title = panel.querySelector('.sheet-header-title')?.textContent?.trim();
    if (title !== 'Category caps') return;

    const select = panel.querySelector('select');
    const row = panel.querySelector('.budget-row');
    if (!select || !row) return;

    const isOthers = select.value === 'other_expense';
    row.querySelectorAll('.stepper-btn, .budget-row-cap, .budget-row-track').forEach((element) => {
      element.style.display = isOthers ? 'none' : '';
    });

    const note = row.querySelector('.budget-row-note');
    if (note) {
      if (!note.dataset.xeniOriginalText || !isOthers) {
        note.dataset.xeniOriginalText = note.textContent ?? '';
      }
      if (isOthers) {
        const spent = (note.textContent ?? '').match(/S\$[\d,.]+/)?.[0] ?? 'S$0.00';
        note.textContent = `${spent} spent so far · no cap`;
      } else if (note.dataset.xeniOriginalText) {
        note.textContent = note.dataset.xeniOriginalText;
      }
    }

    const saveButton = panel.querySelector('.sheet-primary-btn');
    if (saveButton) saveButton.textContent = isOthers ? 'Done' : 'Save cap';
  });
}

function removeOthersPercentAndCapLinks() {
  document.querySelectorAll('.analytics-screen .cat-card').forEach((card) => {
    const name = card.querySelector('.cat-card-name')?.textContent?.trim();
    if (name !== 'Others') return;

    const note = card.querySelector('.cat-card-note');
    if (note) note.style.visibility = 'hidden';

    const capButton = card.querySelector('button.cat-card-cap-hit');
    if (capButton) {
      capButton.disabled = true;
      capButton.style.pointerEvents = 'none';
    }
  });

  document.querySelectorAll('.analytics-screen .ring-row').forEach((row) => {
    const name = row.querySelector('.ring-row-name')?.textContent?.trim();
    if (name !== 'Others') return;

    const percent = row.querySelector('.ring-row-pct');
    if (percent) percent.style.visibility = 'hidden';

    const capButton = row.querySelector('button.ring-row-category-hit');
    if (capButton) {
      capButton.disabled = true;
      capButton.style.pointerEvents = 'none';
    }
  });
}

function adjustAllocatedCapSummary() {
  const value = document.querySelector('.settings-budget-cap-value');
  if (!value || value.dataset.xeniOthersExcluded === '1') return;

  const match = (value.textContent ?? '').match(/S\$([\d,.]+)\s+allocated/i);
  if (!match) return;

  getRecord('categories', 'other_expense').then((category) => {
    const othersCap = Number.isFinite(category?.cap) ? category.cap : 100;
    const total = Number(match[1].replaceAll(',', ''));
    if (!Number.isFinite(total) || othersCap <= 0) return;
    const adjusted = Math.max(0, total - othersCap);
    value.textContent = `S$${adjusted.toLocaleString('en-SG', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} allocated`;
    value.dataset.xeniOthersExcluded = '1';
  }).catch(() => {});
}

export function mountCategoryPolicy() {
  removeStoredOthersCap();
  cleanOthersBudgetEditor();
  removeOthersPercentAndCapLinks();
  adjustAllocatedCapSummary();
}
