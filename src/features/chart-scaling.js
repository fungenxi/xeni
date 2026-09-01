function parseMoneyFromAria(label) {
  const match = String(label ?? '').match(/S\$\s*([\d,.]+)/i);
  if (!match) return null;
  const value = Number(match[1].replaceAll(',', ''));
  return Number.isFinite(value) ? value : null;
}

function parsePercent(text) {
  const match = String(text ?? '').match(/([\d.]+)\s*%/);
  if (!match) return null;
  const value = Number(match[1]);
  return Number.isFinite(value) ? Math.max(0, Math.min(100, value)) : null;
}

function roundUpToHundred(value) {
  return Math.max(100, Math.ceil(value / 100) * 100);
}

function robustScaleMax(values) {
  const positive = values.filter((value) => Number.isFinite(value) && value > 0).sort((a, b) => a - b);
  if (!positive.length) return 100;

  const maximum = positive[positive.length - 1];
  if (positive.length === 1) return roundUpToHundred(maximum);

  const secondHighest = positive[positive.length - 2];
  if (maximum > secondHighest * 6) {
    return roundUpToHundred(secondHighest);
  }

  if (positive.length >= 4) {
    const percentileIndex = Math.max(0, Math.ceil(positive.length * 0.8) - 1);
    const typicalHigh = positive[percentileIndex];
    if (maximum > typicalHigh * 3) {
      return roundUpToHundred(typicalHigh);
    }
  }

  return roundUpToHundred(maximum);
}

function fixCategoryShareBars() {
  document.querySelectorAll('.analytics-screen .cat-card').forEach((card) => {
    const note = card.querySelector('.cat-card-note');
    const fill = card.querySelector('.cat-card-fill');
    if (!note || !fill) return;

    const share = parsePercent(note.textContent);
    if (share === null) return;

    fill.style.width = `${share}%`;
    fill.dataset.xeniShareScaled = '1';
  });
}

function fixAnalyticsBarChart(chart) {
  const columns = [...chart.querySelectorAll('.bar-chart-col')];
  if (columns.length < 2) return;

  const entries = columns.map((column) => {
    const bar = column.querySelector('.bar-chart-bar');
    const value = parseMoneyFromAria(column.getAttribute('aria-label'));
    const originalHeight = Number.parseFloat(bar?.style.height ?? '0');
    return { column, bar, value, originalHeight };
  }).filter((entry) => entry.bar && entry.value !== null);

  if (entries.length < 2) return;

  const originalMaxHeight = Math.max(...entries.map((entry) => entry.originalHeight), 0);
  const cachedMaxHeight = Number(chart.dataset.xeniChartHeight || 0);
  const maxHeight = Math.max(originalMaxHeight, cachedMaxHeight, 96);
  chart.dataset.xeniChartHeight = String(maxHeight);

  const scaleMax = robustScaleMax(entries.map((entry) => entry.value));
  chart.dataset.xeniScaleMax = String(scaleMax);

  for (const entry of entries) {
    const ratio = Math.min(1, entry.value / scaleMax);
    const height = entry.value <= 0 ? 0 : Math.max(4, Math.round(maxHeight * ratio));
    entry.bar.style.height = `${height}px`;

    const tip = entry.column.querySelector('.bar-tip');
    if (tip) tip.style.bottom = `${height + 24}px`;
  }
}

function fixAnalyticsBars() {
  document.querySelectorAll('.analytics-screen .bar-chart').forEach(fixAnalyticsBarChart);
}

export function mountChartScaling() {
  fixCategoryShareBars();
  fixAnalyticsBars();
}
