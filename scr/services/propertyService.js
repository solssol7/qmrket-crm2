import { updateUserProperties, getNotiflyToken } from '../api/notifly.js';
import { logger } from '../utils/logger.js';
import { BATCH_SIZES } from '../config/constants.js';

export const updateUserPropertiesBatch = async (propertyName, propertyValue, userIds) => {
  if (!propertyName || !propertyValue) {
    throw new Error('속성 이름과 값이 필요합니다');
  }

  if (!userIds || userIds.length === 0) {
    throw new Error('사용자 ID가 필요합니다');
  }

  const token = await getNotiflyToken();
  logger.info('Notifly 인증 완료');

  let totalUpdated = 0;

  for (let i = 0; i < userIds.length; i += BATCH_SIZES.PROPERTIES) {
    const batch = userIds.slice(i, i + BATCH_SIZES.PROPERTIES);
    const batchNum = Math.floor(i / BATCH_SIZES.PROPERTIES) + 1;
    const totalBatches = Math.ceil(userIds.length / BATCH_SIZES.PROPERTIES);

    try {
      logger.info(`배치 ${batchNum}/${totalBatches} 업데이트 중... (${batch.length}명)`);
      
      await updateUserProperties(propertyName, propertyValue, batch, token);
      
      totalUpdated += batch.length;
      logger.success(`배치 ${batchNum} 업데이트 완료 ✓`);

      if (i + BATCH_SIZES.PROPERTIES < userIds.length) {
        await new Promise(resolve => setTimeout(resolve, 500));
      }
    } catch (error) {
      logger.error(`배치 ${batchNum} 오류: ${error.message}`);
      throw error;
    }
  }

  return { totalUpdated, totalUsers: userIds.length };
};
