import { sendCampaign, getNotiflyToken } from '../api/notifly.js';
import { logger } from '../utils/logger.js';
import { BATCH_SIZES, NOTIFLY_CONFIG } from '../config/constants.js';

export const sendCampaignBatch = async (campaignId, users) => {
  if (!campaignId) throw new Error('캠페인 ID가 필요합니다');
  if (!users || users.length === 0) throw new Error('발송 대상 사용자가 없습니다');

  const token = await getNotiflyToken();
  logger.info('Notifly 인증 완료');

  let totalSent = 0;

  for (let i = 0; i < users.length; i += BATCH_SIZES.CAMPAIGN) {
    const batch = users.slice(i, i + BATCH_SIZES.CAMPAIGN);
    const batchNum = Math.floor(i / BATCH_SIZES.CAMPAIGN) + 1;
    const totalBatches = Math.ceil(users.length / BATCH_SIZES.CAMPAIGN);

    try {
      logger.info(`배치 ${batchNum}/${totalBatches} 발송 중... (${batch.length}명)`);
      
      const recipients = batch.map(user => ({
        type: 'user-id',
        userId: String(user.user_id),
        eventParams: {
          닉네임: user.nickname || '고객',
          보유쿠폰: user.보유쿠폰,
          미주문일수: user.미주문일수,
          평균구매주기: user.평균구매주기
        }
      }));

      await sendCampaign(campaignId, recipients, token);
      
      totalSent += batch.length;
      logger.success(`배치 ${batchNum} 발송 완료 ✓`);

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

export const sendTestCampaign = async (campaignId, testUserIds, allUsers) => {
  if (!testUserIds || testUserIds.length === 0) {
    throw new Error('테스트 사용자 ID가 필요합니다');
  }

  const userIdArray = testUserIds.split(',').map(id => parseInt(id.trim())).filter(id => !isNaN(id));
  
  if (userIdArray.length === 0) {
    throw new Error('유효한 User ID를 입력해주세요');
  }

  const testUsers = allUsers.filter(u => userIdArray.includes(u.user_id));
  
  if (testUsers.length === 0) {
    throw new Error(`해당 User ID를 찾을 수 없습니다: ${userIdArray.join(', ')}`);
  }

  try {
    const token = await getNotiflyToken();
    logger.info('Notifly 인증 완료');

    const recipients = testUsers.map(user => ({
      type: 'user-id',
      userId: String(user.user_id),
      eventParams: {
        닉네임: user.nickname || '고객',
        테스트: true
      }
    }));

    await sendCampaign(campaignId, recipients, token);
    logger.success(`✓ 테스트 발송 완료 (${testUsers.length}명)`);
    return testUsers;
  } catch (error) {
    logger.error(`테스트 발송 실패: ${error.message}`);
    throw error;
  }
};
