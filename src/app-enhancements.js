import { mountAdvisorActions } from './features/advisor-actions.js';
import { mountCategoryRules } from './features/category-rules.js';
import { mountDataSafety } from './features/data-safety.js';
import { mountTransactionSearch } from './features/transaction-search.js';

function enhance() {
  mountDataSafety();
  mountCategoryRules();
  mountTransactionSearch();
  mountAdvisorActions();
}

window.addEventListener('load', enhance);
window.setInterval(enhance, 1200);
enhance();
