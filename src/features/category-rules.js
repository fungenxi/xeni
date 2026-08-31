import { getAll, putRecord } from '../data/local-db.js';

const SECTION_ID = 'xeni-smart-category-section';
let expanded = false;
let loading = false;

function findAnchor() {
  const labels = [...document.querySelectorAll('.settings-section-label')];
  return labels.find((label) => label.textContent?.trim() === 'Data') ?? null;
}

function flattenRules(categories) {
  const rules = [];
  for (const category of categories) {
    if (!Array.isArray(category.learnedPatterns)) continue;
    for (const pattern of category.learnedPatterns) {
      if (typeof pattern !== 'string' || !pattern.trim()) continue;
      rules.push({
        categoryKey: category.key,
        categoryName: category.name,
        kind: category.kind,
        pattern: pattern.trim(),
      });
    }
  }
  return rules.sort((a, b) => a.categoryName.localeCompare(b.categoryName) || a.pattern.localeCompare(b.pattern));
}

async function deleteRule(rule) {
  const categories = await getAll('categories');
  const category = categories.find((item) => item.key === rule.categoryKey);
  if (!category || !Array.isArray(category.learnedPatterns)) return;

  const next = category.learnedPatterns.filter((pattern) => pattern !== rule.pattern);
  await putRecord('categories', { ...category, learnedPatterns: next });
  window.location.reload();
}

function renderRules(group, rules) {
  group.innerHTML = '';

  const summary = document.createElement('button');
  summary.type = 'button';
  summary.className = 'list-row';
  summary.innerHTML = `
    <div class="list-row-title" style="flex:1">Learned merchant rules</div>
    <span class="settings-row-meta">${rules.length} ${expanded ? '⌃' : '⌄'}</span>`;
  summary.addEventListener('click', () => {
    expanded = !expanded;
    renderRules(group, rules);
  });
  group.appendChild(summary);

  if (!expanded) return;

  const divider = document.createElement('div');
  divider.className = 'list-divider';
  divider.style.marginLeft = '18px';
  group.appendChild(divider);

  if (!rules.length) {
    const empty = document.createElement('div');
    empty.className = 'xeni-rule-empty';
    empty.textContent = 'No learned rules yet. Correct an imported transaction and Xeni will remember that merchant next time.';
    group.appendChild(empty);
    return;
  }

  const intro = document.createElement('div');
  intro.className = 'xeni-rule-intro';
  intro.textContent = 'These are rules Xeni learned from your corrections. Built-in categorisation rules are not shown here.';
  group.appendChild(intro);

  rules.forEach((rule, index) => {
    const row = document.createElement('div');
    row.className = 'xeni-rule-row';
    row.innerHTML = `
      <div class="xeni-rule-copy">
        <strong>${escapeHtml(rule.pattern)}</strong>
        <span>→ ${escapeHtml(rule.categoryName)}</span>
      </div>
      <button type="button" class="xeni-rule-delete" aria-label="Forget ${escapeHtml(rule.pattern)}">Forget</button>`;

    row.querySelector('.xeni-rule-delete')?.addEventListener('click', async () => {
      if (!window.confirm(`Forget the rule “${rule.pattern} → ${rule.categoryName}”?`)) return;
      try {
        await deleteRule(rule);
      } catch (error) {
        console.warn('Could not delete Xeni learned rule.', error);
      }
    });

    group.appendChild(row);
    if (index < rules.length - 1) {
      const line = document.createElement('div');
      line.className = 'list-divider';
      line.style.marginLeft = '18px';
      group.appendChild(line);
    }
  });
}

function escapeHtml(value) {
  return String(value)
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#039;');
}

export async function mountCategoryRules() {
  if (loading) return;
  const anchor = findAnchor();
  if (!anchor) return;

  let section = document.getElementById(SECTION_ID);
  if (!section) {
    section = document.createElement('div');
    section.id = SECTION_ID;
    section.innerHTML = `
      <div class="settings-section-label">Smart categories</div>
      <div class="settings-group" id="xeni-smart-category-group"></div>`;
    anchor.parentNode.insertBefore(section, anchor);
  }

  const group = section.querySelector('#xeni-smart-category-group');
  if (!group) return;

  loading = true;
  try {
    const categories = await getAll('categories');
    renderRules(group, flattenRules(categories));
  } catch (error) {
    console.warn('Could not load learned category rules.', error);
    group.innerHTML = '<div class="xeni-rule-empty">Learned rules are unavailable right now.</div>';
  } finally {
    loading = false;
  }
}
