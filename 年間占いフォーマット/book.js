// The original workbook uses a two-column, three-row monthly record grid per page.
for (const [id, start] of [['months-a', 1], ['months-b', 7]]) {
  const grid = document.getElementById(id);
  for (let month = start; month < start + 6; month++) {
    const card = document.createElement('div');
    card.className = 'month';
    card.innerHTML = `<img src="assets/monthly_waku.svg" alt=""><span>${month}</span>`;
    grid.appendChild(card);
  }
}
