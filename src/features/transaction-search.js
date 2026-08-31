const TOOLBAR_CLASS = 'xeni-transaction-tools';

function getRowType(row) {
  const amount = row.querySelector('.transaction-list-amount')?.textContent?.trim() ?? '';
  return amount.startsWith('+') ? 'income' : 'expense';
}

function getRowSource(row) {
  const meta = row.querySelector('.transaction-list-meta')?.textContent?.toLowerCase() ?? '';
  return meta.includes('manual') ? 'manual' : 'imported';
}

function applyFilter(list, toolbar) {
  const query = toolbar.querySelector('input')?.value.trim().toLowerCase() ?? '';
  const mode = toolbar.dataset.mode ?? 'all';
  const rows = [...list.children].filter((row) => row.classList.contains('transaction-list-row'));
  let visible = 0;

  for (const row of rows) {
    const text = row.textContent?.toLowerCase() ?? '';
    const type = getRowType(row);
    const source = getRowSource(row);
    const matchesQuery = !query || text.includes(query);
    const matchesMode = mode === 'all' || mode === type || mode === source;
    const show = matchesQuery && matchesMode;
    row.hidden = !show;
    if (show) visible += 1;
  }

  const count = toolbar.querySelector('.xeni-transaction-count');
  if (count) count.textContent = rows.length ? `${visible} of ${rows.length}` : '0';

  let empty = toolbar.parentElement?.querySelector('.xeni-transaction-empty');
  if (!empty && toolbar.parentElement) {
    empty = document.createElement('div');
    empty.className = 'xeni-transaction-empty';
    empty.textContent = 'No transactions match your search or filter.';
    list.insertAdjacentElement('afterend', empty);
  }
  if (empty) empty.hidden = visible > 0 || rows.length === 0;
}

function makeToolbar(list) {
  const toolbar = document.createElement('div');
  toolbar.className = TOOLBAR_CLASS;
  toolbar.dataset.mode = 'all';
  toolbar.innerHTML = `
    <div class="xeni-transaction-search-row">
      <label class="xeni-transaction-search">
        <span aria-hidden="true">⌕</span>
        <input type="search" inputmode="search" autocomplete="off" placeholder="Search merchant, amount or date" aria-label="Search transactions" />
      </label>
      <span class="xeni-transaction-count"></span>
    </div>
    <div class="xeni-transaction-filters" role="group" aria-label="Filter transactions">
      <button type="button" data-filter="all" class="is-active">All</button>
      <button type="button" data-filter="expense">Expenses</button>
      <button type="button" data-filter="income">Income</button>
      <button type="button" data-filter="imported">Imported</button>
      <button type="button" data-filter="manual">Manual</button>
    </div>`;

  toolbar.querySelector('input')?.addEventListener('input', () => applyFilter(list, toolbar));
  toolbar.querySelectorAll('[data-filter]').forEach((button) => {
    button.addEventListener('click', () => {
      toolbar.dataset.mode = button.dataset.filter ?? 'all';
      toolbar.querySelectorAll('[data-filter]').forEach((item) => item.classList.toggle('is-active', item === button));
      applyFilter(list, toolbar);
    });
  });

  toolbar._xeniApply = () => applyFilter(list, toolbar);
  return toolbar;
}

function validTransactionSheet(list) {
  const panel = list.closest('.sheet-panel');
  if (!panel) return false;
  const title = panel.querySelector('.sheet-header-title')?.textContent?.trim() ?? '';
  return ['Transactions', 'Analytics breakdown', 'Imported transactions'].includes(title);
}

export function mountTransactionSearch() {
  document.querySelectorAll('.transaction-list').forEach((list) => {
    if (!validTransactionSheet(list)) return;

    let toolbar = list.previousElementSibling;
    if (!toolbar?.classList.contains(TOOLBAR_CLASS)) {
      toolbar = makeToolbar(list);
      list.insertAdjacentElement('beforebegin', toolbar);
    }

    toolbar._xeniApply?.();
  });
}
