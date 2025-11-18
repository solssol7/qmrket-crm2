import { sendCampaign } from '../api/notifly.js';
import { logger } from '../utils/logger.js';
import { BATCH_SIZES } from '../config/constants.js';

/**
 * 캠페인 배치 발송
 */
export const sendCampaignBatch = async (campaignId, users) => {
  if (!campaignId) {
    throw new Error('캠페인 ID가 필요합니다');
  }
  
  if (!users || users.length === 0) {
    throw new Error('발송 대상 사용자가 없습니다');
  }

  let totalSent = 0;

  for (let i = 0; i < users.length; i += BATCH_SIZES.CAMPAIGN) {
    const batch = users.slice(i, i + BATCH_SIZES.CAMPAIGN);
    const batchNum = Math.floor(i / BATCH_SIZES.CAMPAIGN) + 1;
    const totalBatches = Math.ceil(users.length / BATCH_SIZES.CAMPAIGN);

    try {
      logger.info(`배치 ${batchNum}/${totalBatches} 발송 중... (${batch.length}명)`);
      
      const formattedBatch = batch.map(user => ({
        type: 'user-id',
        userId: String(user.user_id),
        eventParams: {
          닉네임: user.nickname || '고객',
          보유쿠폰: user.보유쿠폰 || 0
        }
      }));

      await sendCampaign(campaignId, formattedBatch);
      
      totalSent += batch.length;
      logger.success(`배치 ${batchNum} 발송 완료 ✓`);

      // Rate limit 방지
      if (i + BATCH_SIZES.CAMPAIGN < users.length) {
        await new Promise(resolve => setTimeout(resolve, 1000));
      }
    } catch (error) {
      logger.error(`배치 ${batchNum} 오류: ${error.message}`);
      throw error;
    }
  }

  return { totalSent, totalUsers: users.length };
};

/**
 * 테스트 캠페인 발송
 */
export const sendTestCampaign = async (campaignId, testUserIds) => {
  if (!testUserIds || testUserIds.length === 0) {
    throw new Error('테스트 사용자 ID가 필요합니다');
  }

  try {
    const testUsers = testUserIds.split(',').map(id => ({
      type: 'user-id',
      userId: String(id.trim()),
      eventParams: { 테스트: true }
    }));

    await sendCampaign(campaignId, testUsers);
    logger.success(`테스트 발송 완료: ${testUsers.length}명`);
    return true;
  } catch (error) {
    logger.error(`테스트 발송 오류: ${error.message}`);
    throw error;
  }
};
