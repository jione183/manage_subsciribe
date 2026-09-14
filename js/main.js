import {
  fillForm,
  renderCategories,
  renderSubscriptions,
  renderSummary,
  resetForm
} from './ui.js';

// localStorage에서 사용할 데이터 이름입니다.
const STORAGE_KEY = 'sub-tracker-subscriptions';
// 페이지를 열 때 저장된 구독을 먼저 읽어 메모리에 올립니다.
let subscriptions = loadSubscriptions();

// 시간대 때문에 날짜가 하루 앞뒤로 바뀌는 것을 막고 오늘 날짜를 반환합니다.
const todayString = () => {
  const today = new Date();
  const offset = today.getTimezoneOffset() * 60000;
  return new Date(today.getTime() - offset).toISOString().slice(0, 10);
};

function loadSubscriptions() {
  try {
    // 저장값이 없으면 빈 배열로 시작합니다.
    const saved = localStorage.getItem(STORAGE_KEY);
    return saved ? JSON.parse(saved) : [];
  } catch (error) {
    // 저장값이 깨졌어도 화면이 멈추지 않도록 빈 목록으로 처리합니다.
    console.warn('저장된 구독 데이터를 읽을 수 없습니다.', error);
    return [];
  }
}

function saveSubscriptions() {
  // 배열을 문자열로 바꾸어 브라우저 저장소에 기록합니다.
  localStorage.setItem(STORAGE_KEY, JSON.stringify(subscriptions));
}

function refresh() {
  // 데이터가 바뀔 때마다 요약, 카드 목록, 카테고리 차트를 모두 다시 그립니다.
  const today = todayString();
  renderSummary(subscriptions, today);
  renderSubscriptions(subscriptions, today, startEdit, removeSubscription);
  renderCategories(subscriptions);
}

function startEdit(id) {
  // 카드의 ID로 원본 데이터를 찾아 수정 폼에 넣습니다.
  const subscription = subscriptions.find(item => item.id === id);
  if (subscription) fillForm(subscription);
}

function removeSubscription(id) {
  // 삭제할 항목을 찾고 사용자가 확인했을 때만 배열에서 제거합니다.
  const subscription = subscriptions.find(item => item.id === id);
  if (!subscription || !window.confirm(`${subscription.name} 구독을 삭제할까요?`)) return;
  subscriptions = subscriptions.filter(item => item.id !== id);
  saveSubscriptions();
  refresh();
}

document.querySelector('#subscriptionForm').addEventListener('submit', event => {
  // 기본 폼 제출(페이지 새로고침)을 막고 JavaScript로 저장합니다.
  event.preventDefault();
  const form = new FormData(event.currentTarget);
  // 수정 ID가 있으면 기존 항목을 덮어쓰고, 없으면 새 ID를 만듭니다.
  const id = form.get('subscriptionId') || crypto.randomUUID();
  const subscription = {
    id,
    name: String(form.get('name')).trim(),
    amount: Number(form.get('amount')),
    cycle: form.get('cycle'),
    nextPaymentDate: form.get('nextPaymentDate'),
    category: String(form.get('category')).trim()
  };

  const existingIndex = subscriptions.findIndex(item => item.id === id);
  // 같은 ID가 없으면 추가하고, 있으면 해당 위치의 데이터를 교체합니다.
  if (existingIndex === -1) subscriptions.push(subscription);
  else subscriptions[existingIndex] = subscription;

  saveSubscriptions();
  resetForm();
  refresh();
});

// 수정 취소 버튼은 입력값과 폼 제목을 원래 상태로 되돌립니다.
document.querySelector('#cancelButton').addEventListener('click', resetForm);

// 새 구독의 기본 결제일을 오늘로 채운 뒤 첫 화면을 그립니다.
document.querySelector('#nextPaymentDate').value = todayString();
refresh();
