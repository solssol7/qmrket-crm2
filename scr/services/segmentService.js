import { 
  fetchAllUsers, 
  fetchAllOrders, 
  fetchAllCoupons,
  fetchCustomSegments
} from '../api/database.js';
import { 
  enrichUserData, 
  matchCustomSegment
} from '../utils/dataFormatter.js';
import { logger } from '../utils/logger.js';
import { BATCH_SIZES, PREDEFINED_SEGMENTS } from '../config/constants.js';

export const analyzeSegments = async (onProgress) => {
  try {
    logger.info('세그먼트 분석 시작... (11만명 데이터 처리중, 30-60초 소요)');
    
    const [users, orders, coupons, customSegs] = await Promise.all([
      fetchAllUsers(),
      fetchAllOrders(),
      fetchAllCoupons(),
      fetchCustomSegments()
    ]);

    logger.info(`데이터 조회 완료: users ${users.length}명, orders ${orders.length}건`);

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

    const couponMap = {};
    coupons.forEach(c => {
      couponMap[c.user_id] = c.valid_coupon_count || 0;
    });

    const segments = {};
    Object.keys(PREDEFINED_SEGMENTS).forEach(category => {
      PREDEFINED_SEGMENTS[category].forEach(seg => {
        segments[seg.name] = [];
      });
    });

    customSegs.forEach(cs => {
      segments[cs.name] = [];
    });

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
          for (let j = 1; j < sortedOrders.length; j++) {
            const diff = (new Date(sortedOrders[j].order_date) - new Date(sortedOrders[j - 1].order_date)) / (1000 * 60 * 60 * 24);
            totalDays += diff;
          }
          avgCycle = Math.floor(totalDays / (sortedOrders.length - 1));
        }

        const enriched = enrichUserData(user, orderStats, couponMap);

        // 신규 고객
        if (daysSinceSignup <= 30) {
          if (stats.orders.length === 0) {
            segments['신규_미구매'].push({ ...enriched, 세그먼트: '신규_미구매' });
          } else if (stats.orders.length === 1) {
            segments['신규_1회구매'].push({ ...enriched, 세그먼트: '신규_1회구매' });
          } else {
            segments['신규_2회이상'].push({ ...enriched, 세그먼트: '신규_2회이상' });
          }
        }
        
        // 휴면 고객
        if (daysSinceOrder >= 60) {
          if (stats.totalAmount >= 200000) {
            segments['고가치_휴면'].push({ ...enriched, 세그먼트: '고가치_휴면' });
          } else if (stats.totalAmount >= 100000) {
            segments['중가치_휴면'].push({ ...enriched, 세그먼트: '중가치_휴면' });
          } else {
            segments['저가치_휴면'].push({ ...enriched, 세그먼트: '저가치_휴면' });
          }
        }
        
        // 활성 고객
        if (daysSinceOrder < 60) {
          if (recentOrders.length >= 5 && avgOrderAmount >= 50000) {
            segments['VIP'].push({ ...enriched, 세그먼트: 'VIP' });
          } else if (recentOrders.length >= 3) {
            segments['충성고객'].push({ ...enriched, 세그먼트: '충성고객' });
          } else {
            segments['일반활성'].push({ ...enriched, 세그먼트: '일반활성' });
          }

          if (couponCount >= 3 && recentOrders.every(o => !o.coupon_payment || o.coupon_payment === 0)) {
            segments['쿠폰미사용_활성'].push({ ...enriched, 세그먼트: '쿠폰미사용_활성' });
          }
        }

        // RFM
        if (daysSinceOrder <= 30 && stats.orders.length >= 5 && stats.totalAmount >= 500000) {
          segments['RFM_Champions'].push({ ...enriched, 세그먼트: 'RFM_Champions' });
        } else if (daysSinceOrder <= 60 && stats.orders.length >= 3 && stats.totalAmount >= 300000) {
          segments['RFM_LoyalCustomers'].push({ ...enriched, 세그먼트: 'RFM_LoyalCustomers' });
        } else if (daysSinceOrder >= 60 && daysSinceOrder <= 90 && stats.totalAmount >= 200000) {
          segments['RFM_AtRisk'].push({ ...enriched, 세그먼트: 'RFM_AtRisk' });
        } else if (daysSinceOrder > 90 && stats.totalAmount >= 500000) {
          segments['RFM_CantLose'].push({ ...enriched, 세그먼트: 'RFM_CantLose' });
        }

        // 커스텀 세그먼트
        customSegs.forEach(cs => {
          if (matchCustomSegment(user, cs.conditions, stats, daysSinceSignup, daysSinceOrder, avgCycle, couponCount)) {
            segments[cs.name].push({ ...enriched, 세그먼트: cs.name });
          }
        });
      });

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
