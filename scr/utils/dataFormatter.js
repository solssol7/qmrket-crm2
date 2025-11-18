export const parseAgree = (value) => {
  if (value === 'true' || value === true) return true;
  if (value === 'false' || value === false) return false;
  return false;
};

export const enrichUserData = (user, orderStats, couponMap) => {
  const uid = user.user_id;
  const stats = orderStats[uid] || { orders: [], totalAmount: 0, lastOrderDate: null };
  const signupDate = new Date(user.signup_date);
  const now = new Date();
  const daysSinceSignup = (now - signupDate) / (1000 * 60 * 60 * 24);
  const daysSinceOrder = stats.lastOrderDate 
    ? (now - stats.lastOrderDate) / (1000 * 60 * 60 * 24)
    : 999;

  const threeMonthsAgo = new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000);
  const recentOrders = stats.orders.filter(o => new Date(o.order_date) >= threeMonthsAgo);
  const recentAmount = recentOrders.reduce((sum, o) => sum + (o.real_payment || 0) + (o.qmoney_payment || 0), 0);
  const avgOrderAmount = recentOrders.length > 0 ? recentAmount / recentOrders.length : 0;

  let avgCycle = 0;
  if (stats.orders.length >= 2) {
    const sortedOrders = [...stats.orders].sort((a, b) => 
      new Date(a.order_date) - new Date(b.order_date)
    );
    let totalDays = 0;
    for (let i = 1; i < sortedOrders.length; i++) {
      const diff = (new Date(sortedOrders[i].order_date) - new Date(sortedOrders[i - 1].order_date)) / (1000 * 60 * 60 * 24);
      totalDays += diff;
    }
    avgCycle = Math.floor(totalDays / (sortedOrders.length - 1));
  }

  return {
    ...user,
    총주문횟수: stats.orders.length,
    누적구매액: stats.totalAmount,
    최근주문일: stats.lastOrderDate ? stats.lastOrderDate.toISOString().split('T')[0] : 'N/A',
    미주문일수: Math.floor(daysSinceOrder),
    가입일수: Math.floor(daysSinceSignup),
    최근3개월주문: recentOrders.length,
    최근3개월구매액: recentAmount,
    평균주문금액: Math.floor(avgOrderAmount),
    평균구매주기: avgCycle,
    보유쿠폰: couponMap[uid] || 0,
    푸시가능: parseAgree(user.agree_app_push),
    SMS가능: parseAgree(user.agree_sms),
    알림톡가능: parseAgree(user.agree_alim_talk)
  };
};

export const matchCustomSegment = (user, conditions, stats, daysSinceSignup, daysSinceOrder, avgCycle, couponCount) => {
  let match = true;

  if (conditions.martEnabled && !user.mart_is_enabled) match = false;
  if (conditions.signupDaysMin && daysSinceSignup < parseInt(conditions.signupDaysMin)) match = false;
  if (conditions.signupDaysMax && daysSinceSignup > parseInt(conditions.signupDaysMax)) match = false;
  if (conditions.totalAmountMin && stats.totalAmount < parseInt(conditions.totalAmountMin)) match = false;
  if (conditions.totalAmountMax && stats.totalAmount > parseInt(conditions.totalAmountMax)) match = false;
  if (conditions.orderCountMin && stats.orders.length < parseInt(conditions.orderCountMin)) match = false;
  if (conditions.orderCountMax && stats.orders.length > parseInt(conditions.orderCountMax)) match = false;
  if (conditions.grade && user.grade_name !== conditions.grade) match = false;
  if (conditions.avgCycleMin && avgCycle < parseInt(conditions.avgCycleMin)) match = false;
  if (conditions.avgCycleMax && avgCycle > parseInt(conditions.avgCycleMax)) match = false;
  if (conditions.daysSinceOrderMin && daysSinceOrder < parseInt(conditions.daysSinceOrderMin)) match = false;
  if (conditions.daysSinceOrderMax && daysSinceOrder > parseInt(conditions.daysSinceOrderMax)) match = false;
  if (conditions.couponCountMin && couponCount < parseInt(conditions.couponCountMin)) match = false;
  if (conditions.couponCountMax && couponCount > parseInt(conditions.couponCountMax)) match = false;

  return match;
};
