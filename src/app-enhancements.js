import { mountAdvisorActions } from './features/advisor-actions.js';
import { mountCategoryPolicy } from './features/category-policy.js';
import { mountCategoryRules } from './features/category-rules.js';
import { mountChartScaling } from './features/chart-scaling.js';
import { mountCsvExport } from './features/csv-export.js';
import { mountDataSafety } from './features/data-safety.js';

function enhance() {
  mountDataSafety();
  mountCsvExport();
  mountCategoryRules();
  mountCategoryPolicy();
  mountChartScaling();
  mountAdvisorActions();
}

window.addEventListener('load', enhance);
window.setInterval(enhance, 1200);
enhance();
