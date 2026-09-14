// 금액을 한국식 천 단위 구분과 원 단위로 표시합니다.
const money = value => `${Number(value).toLocaleString('ko-KR')}원`;

// 날짜 입력값을 사람이 읽기 쉬운 월/일 형식으로 바꿉니다.
function formatDate(dateString) {
  const date = new Date(`${dateString}T00:00:00`);
  return new Intl.DateTimeFormat('ko-KR', { month: 'long', day: 'numeric' }).format(date);
}

// 남은 날짜 숫자를 카드에 표시할 문장으로 바꿉니다.
function getDdayLabel(days) {
  if (days === 0) return '오늘 결제';
  if (days < 0) return `${Math.abs(days)}일 지남`;
  return `D-${days}`;
}

export function renderSummary(subscriptions, today) {
  // 계산은 기존 logic.js에 맡기고, 여기서는 결과를 화면에 연결합니다.
  const monthly = window.calculateTotalMonthly(subscriptions);
  const yearly = window.calculateTotalYearly(subscriptions);
  // 오늘부터 7일 안에 결제되는 구독만 이번 주 예정으로 셉니다.
  const upcoming = subscriptions.filter(item => {
    const days = window.calculateDaysUntilPayment(today, item.nextPaymentDate);
    return days >= 0 && days <= 7;
  });

  document.querySelector('#monthlyTotal').textContent = money(monthly);
  document.querySelector('#yearlyTotal').textContent = money(yearly);
  document.querySelector('#upcomingCount').textContent = `${upcoming.length}건`;
  document.querySelector('#subscriptionCount').textContent = `${subscriptions.length}개`;
  document.querySelector('#todayLabel').textContent = new Intl.DateTimeFormat('ko-KR', {
    year: 'numeric', month: 'long', day: 'numeric', weekday: 'long'
  }).format(new Date(`${today}T00:00:00`));
}

export function renderSubscriptions(subscriptions, today, onEdit, onDelete) {
  // 목록 영역을 찾은 뒤, 구독이 없으면 안내 문구를 보여줍니다.
  const list = document.querySelector('#subscriptionList');
  if (subscriptions.length === 0) {
    list.innerHTML = '<div class="empty-state">아직 등록된 구독이 없습니다.<br>오른쪽 폼에서 첫 구독을 추가해보세요.</div>';
    return;
  }

  // 각 데이터를 HTML 카드로 바꾸고 한 문자열로 합쳐 한 번에 그립니다.
  list.innerHTML = subscriptions.map(subscription => {
    const days = window.calculateDaysUntilPayment(today, subscription.nextPaymentDate);
    const monthlyAmount = window.convertToMonthly(subscription);
    const initials = subscription.name.trim().slice(0, 1).toUpperCase();
    const soon = days >= 0 && days <= 7 ? ' dday--soon' : '';
    return `<article class="subscription-card">
      <div class="subscription-icon" aria-hidden="true">${initials}</div>
      <div>
        <p class="subscription-name">${escapeHtml(subscription.name)}</p>
        <p class="subscription-meta">${escapeHtml(subscription.category)} · ${subscription.cycle === 'yearly' ? '매년' : '매월'} · ${formatDate(subscription.nextPaymentDate)}</p>
      </div>
      <strong class="subscription-price">${money(monthlyAmount)}<small>/월</small></strong>
      <span class="dday${soon}">${getDdayLabel(days)}</span>
      <div class="card-actions">
        <button class="icon-button" type="button" data-action="edit" data-id="${subscription.id}" aria-label="${escapeHtml(subscription.name)} 수정">✎</button>
        <button class="icon-button" type="button" data-action="delete" data-id="${subscription.id}" aria-label="${escapeHtml(subscription.name)} 삭제">×</button>
      </div>
    </article>`;
  }).join('');

  // 새로 만든 카드의 수정/삭제 버튼에 전달받은 함수를 연결합니다.
  list.querySelectorAll('[data-action="edit"]').forEach(button => {
    button.addEventListener('click', () => onEdit(button.dataset.id));
  });
  list.querySelectorAll('[data-action="delete"]').forEach(button => {
    button.addEventListener('click', () => onDelete(button.dataset.id));
  });
}

export function renderCategories(subscriptions) {
  // logic.js가 계산한 카테고리별 월 금액을 큰 순서로 정렬합니다.
  const chart = document.querySelector('#categoryChart');
  const totals = window.groupSubscriptionsByCategory(subscriptions);
  const total = Object.values(totals).reduce((sum, value) => sum + value, 0);
  const entries = Object.entries(totals).sort(([, a], [, b]) => b - a);

  if (entries.length === 0) {
    chart.innerHTML = '<p class="category-empty">구독을 추가하면 카테고리별 지출 비중이 표시됩니다.</p>';
    return;
  }
  // 전체 금액 중 각 카테고리가 차지하는 비율을 계산합니다.
  chart.innerHTML = entries.map(([category, amount]) => {
    const percentage = total ? Math.round((amount / total) * 100) : 0;
    return `<div class="category-row">
      <div class="category-label"><span>${escapeHtml(category)}</span><strong>${percentage}% · ${money(amount)}</strong></div>
      <div class="category-track"><div class="category-fill" style="width: ${percentage}%"></div></div>
    </div>`;
  }).join('');
}

export function fillForm(subscription) {
  // 선택한 카드의 값을 폼에 채워 사용자가 수정할 수 있게 합니다.
  document.querySelector('#subscriptionId').value = subscription.id;
  document.querySelector('#name').value = subscription.name;
  document.querySelector('#amount').value = subscription.amount;
  document.querySelector('#cycle').value = subscription.cycle;
  document.querySelector('#nextPaymentDate').value = subscription.nextPaymentDate;
  document.querySelector('#category').value = subscription.category;
  document.querySelector('#formTitle').textContent = '구독 수정';
  document.querySelector('#submitButton').textContent = '수정 저장';
  document.querySelector('#cancelButton').classList.remove('is-hidden');
  document.querySelector('#name').focus();
}

export function resetForm() {
  // 저장이나 취소 후 폼을 새 구독 입력 상태로 되돌립니다.
  document.querySelector('#subscriptionForm').reset();
  document.querySelector('#subscriptionId').value = '';
  document.querySelector('#formTitle').textContent = '새 구독 추가';
  document.querySelector('#submitButton').textContent = '구독 저장';
  document.querySelector('#cancelButton').classList.add('is-hidden');
}

function escapeHtml(value) {
  // 사용자 입력이 HTML로 실행되지 않도록 특수문자를 안전하게 바꿉니다.
  return String(value).replace(/[&<>'"]/g, character => ({
    '&': '&amp;', '<': '&lt;', '>': '&gt;', "'": '&#039;', '"': '&quot;'
  }[character]));
}
