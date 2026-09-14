// 구독 데이터 예시

// const testData = [
//  {name:"넷플릭스",  amount:13500, cycle:"monthly",
//   nextPaymentDate:"2026-08-16", category:"영상"},
//  {name:"스포티파이",amount:10900, cycle:"monthly",
//   nextPaymentDate:"2026-08-20", category:"음악"},
//  {name:"헬스장",    amount:45000, cycle:"monthly",
//   nextPaymentDate:"2026-09-01", category:"운동"},
//  {name:"클라우드",  amount:120000,cycle:"yearly",
//   nextPaymentDate:"2027-02-01", category:"생산성"}
// ];

// 구독 1건을 받아 월 기준 금액으로 환산해 반환한다.
// cycle이 "yearly"이면 amount를 12로 나누고, 원 단위로 반올림한다.//
function convertToMonthly(subscription) {
  if (subscription.cycle === "yearly") {
    return Math.round(subscription.amount / 12);
  } else {
    return subscription.amount;
  }
}

// 구독 목록 배열을 받아 월 지출 합계를 반환한다.
function calculateTotalMonthly(subscriptions) {
  let total = 0;
  for (let subscription of subscriptions) {
    total += convertToMonthly(subscription);
  }
  return total;
}
// 구독 목록 배열을 받아 연간 지출 합계를 반환한다.
function calculateTotalYearly(subscriptions) {
  let total = 0;        
  for (let subscription of subscriptions) {
    total += subscription.cycle === "yearly"
      ? subscription.amount
      : subscription.amount * 12;
  }
  return total;
}

//오늘 날짜와 결제 예정일을 받아 남은 일수를반환한다.
//두 값 모두 "YYYY-MM-DD" 형식의 문자열이다.
// 시각은 무시하고 날짜만 비교, 오늘이면 0, 지난 날짜면 양수, 미래 날짜면 음수를 반환한다.
function calculateDaysUntilPayment(today, nextPaymentDate) {
  const todayDate = new Date(today);
  const paymentDate = new Date(nextPaymentDate);
  const timeDiff = paymentDate - todayDate;
  const daysDiff = Math.ceil(timeDiff / (1000 * 60 * 60 * 24));
  return daysDiff;
}   

//결제일이 N일 이내로 임박한 항목만 반환한다.
function filterSubscriptionsByDays(subscriptions, today, days) {
  return subscriptions.filter(subscription => {
    const daysUntilPayment = calculateDaysUntilPayment(today, subscription.nextPaymentDate);
    return daysUntilPayment <= days;
  });
}

// 카테고리 별로 묶어 {카테고리: 월합계}를 반환한다.
// 예: {영상: 13500, 음악: 10900, 운동: 45000, 생산성: 120000}
function groupSubscriptionsByCategory(subscriptions) {
  const categoryTotals = {};
  for (let subscription of subscriptions) {
    const category = subscription.category;
    categoryTotals[category] = (categoryTotals[category] || 0)
      + convertToMonthly(subscription);
  }
  return categoryTotals;
}

// 카드 별로 묶어 {카드사: 월합계}를 반환한다.
function groupSubscriptionsByPaymentMethod(subscriptions) {
  const paymentMethodTotals = {};

  for (let subscription of subscriptions) {
    const paymentMethod = subscription.paymentMethod;
    paymentMethodTotals[paymentMethod] = (paymentMethodTotals[paymentMethod] || 0)
      + convertToMonthly(subscription);
  }
  return paymentMethodTotals;
}