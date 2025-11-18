import { 
  fetchAllUsers, 
  fetchAllOrders, 
  fetchAllCoupons,
  fetchCustomSegments
} from '../api/index.js';
import { 
  enrichUserData, 
  classifySegments,
  matchCustomSegment,
  parseAgree
} from '../utils/dataFormatter.js';
import { logger } from '../utils/logger.js';
import { BATCH_SIZES, PREDEFINED_SEGMENTS } from '../config/constants.js';

/**
 * 전체 세그먼트 분석 (모든 기능 포함)
 */
export const analyzeSegments = async (onProgress) => {
  try {
    logger.info('세그먼트 분석 시작... (11만명 데이터 처리중, 30-60초 소요)');
    
    // 1. 데이터 로드
    const [users, orders, coupons, customSegs] = await Promise.all([
      fetchAllUsers(),
      fetchAllOrders(),
      fetchAllCoupons(),
      fetchCustomSegments()
    ]);

    logger.info(`데이터 조회 완료: users ${users.length}명, orders ${orders.length}건`);

    // 2. 주문 통계 생성
    const orderStats = {};
    orders.forEach(order => {
      const uid = order.user_id;
      if (!orderStats[uid]) {
        orderStats[uid] = { orders: [], totalAmount: 0, lastOrderDate: null };
      }
      orderStats[uid].orders.push(order);
      orderStats[uid].totalAmount += (order.real_payment || 0) + (order.qmoney_payment || 0);
      
      const orderDate = new Date(order.order_date);
      if (!orderStats[uid].lastOrderDate || orderDate > orderStats[uid].lastOrderDate) {
        orderStats[uid].lastOrderDate = orderDate;
      }
    });

    // 3. 쿠폰 맵 생성
    const couponMap = {};
    coupons.forEach(c => {
      couponMap[c.user_id] = c.valid_coupon_count || 0;
    });

    // 4. 기본 세그먼트 초기화
    const segments = {};
    Object.keys(PREDEFINED_SEGMENTS).forEach(category => {
      PREDEFINED_SEGMENTS[category].forEach(seg => {
        segments[seg.name] = [];
      });
    });

    // 5. 커스텀 세그먼트 초기화
    customSegs.forEach(cs => {
      segments[cs.name] = [];
    });

    // 6. 사용자 분석 및 분류
    const now = new Date();
    for (let i = 0; i < users.length; i += BATCH_SIZES.ANALYSIS) {
      const batch = users.slice(i, i + BATCH_SIZES.ANALYSIS);
      
      batch.forEach(user => {
        const uid = user.user_id;
        const stats = orderStats[uid] || { orders: [], totalAmount: 0, lastOrderDate: null };
        const couponCount = couponMap[uid] || 0;
        const signupDate = new Date(user.signup_date);
        const daysSinceSignup = (now - signupDate) / (1000 * 60 * 60 * 24);
        const daysSinceOrder = stats.lastOrderDate 
          ? (now - stats.lastOrderDate) / (1000 * 60 * 60 * 24)
          : 999;

        // 최근 3개월 주문 필터링
        const threeMonthsAgo = new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000);
        const recentOrders = stats.orders.filter(o => new Date(o.order_date) >= threeMonthsAgo);
        const recentAmount = recentOrders.reduce((sum, o) => sum + (o.real_payment || 0) + (o.qmoney_payment || 0), 0);
        const avgOrderAmount = recentOrders.length > 0 ? recentAmount / recentOrders.length : 0;

        // 평균 주기 계산
        let avgCycle = 0;
        if (stats.orders.length >= 2) {
          const sortedOrders = [...stats.orders].sort((a, b) => 
            new Date(a.order_date) - new Date(b.order_date)
          );
          let totalDays = 0;
          for (let j = 1; j < sortedOrders.length; j++) {
            const diff = (new Date(sortedOrders[j].order_date) - new Date(sortedOrders[j - 1].order_date)) / (1000 * 60 * 60 * 24);
            totalDays += diff;
          }
          avgCycle = Math.floor(totalDays / (sortedOrders.length - 1));
        }

        // 데이터 보강
        const enriched = enrichUserData(user, orderStats, couponMap);

        // 기본 세그먼트 분류
        const segmentNames = classifySegments(
          enriched,
          stats,
          daysSinceOrder,
          daysSinceSignup,
          recentOrders,
          avgOrderAmount,
          couponCount
        );

        segmentNames.forEach(name => {
          if (segments[name]) {
            segments[name].push({ ...enriched, 세그먼트: name });
          }
        });

        // 커스텀 세그먼트 매칭
        customSegs.forEach(cs => {
          if (matchCustomSegment(user, cs.conditions, stats, daysSinceSignup, daysSinceOrder, avgCycle, couponCount)) {
            segments[cs.name].push({ ...enriched, 세그먼트: cs.name });
          }
        });
      });

      // 진행률 콜백
      if (onProgress) {
        const progress = Math.floor(((i + batch.length) / users.length) * 100);
        onProgress(progress);
      }
    }

    logger.success('✓ 세그먼트 분석 완료!');
    return { segments, customSegs };
  } catch (error) {
    logger.error(`분석 실패: ${error.message}`);
    throw error;
  }
};
