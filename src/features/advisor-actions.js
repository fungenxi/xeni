const ACTION_CLASS = 'xeni-advisor-review-action';

export function mountAdvisorActions() {
  const advisor = document.querySelector('.advisor-screen');
  if (!advisor) return;

  const note = advisor.querySelector('.advisor-pattern-note');
  const card = note?.closest('.advisor-category-card');
  if (!note || !card || card.querySelector(`.${ACTION_CLASS}`)) return;

  const existingLink = card.querySelector('.home-section-link');
  if (!existingLink) return;

  const button = document.createElement('button');
  button.type = 'button';
  button.className = ACTION_CLASS;
  button.innerHTML = '<span>Review the transactions behind this</span><span aria-hidden="true">→</span>';
  button.addEventListener('click', () => existingLink.click());
  note.insertAdjacentElement('afterend', button);
}
