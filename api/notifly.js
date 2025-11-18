import { API_ENDPOINTS, NOTIFLY_CONFIG } from '../config/constants.js';

export const getNotiflyToken = async () => {
  try {
    const response = await fetch(API_ENDPOINTS.NOTIFLY_AUTH, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        accessKey: NOTIFLY_CONFIG.ACCESS_KEY,
        secretKey: NOTIFLY_CONFIG.SECRET_KEY
      })
    });

    const result = await response.json();
    if (!result.data) {
      throw new Error('Notifly 인증 실패');
    }
    return result.data;
  } catch (error) {
    throw new Error(`인증 오류: ${error.message}`);
  }
};

export const updateUserProperties = async (propertyName, propertyValue, userIds, token) => {
  const payload = userIds.map(userId => ({
    projectId: NOTIFLY_CONFIG.PROJECT_ID,
    userId: String(userId),
    userProperties: {
      [propertyName]: propertyValue
    }
  }));

  const response = await fetch(API_ENDPOINTS.NOTIFLY_PROPERTIES, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': token
    },
    body: JSON.stringify(payload)
  });

  if (!response.ok) {
    throw new Error(`HTTP ${response.status}: ${await response.text()}`);
  }

  return await response.json();
};

export const sendCampaign = async (campaignId, recipients, token) => {
  const projectId = NOTIFLY_CONFIG.PROJECT_ID;
  const url = `https://api.notifly.tech/projects/${projectId}/campaigns/${campaignId}/send`;

  const response = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': token
    },
    body: JSON.stringify({ recipients })
  });

  if (!response.ok) {
    throw new Error(`HTTP ${response.status}: ${await response.text()}`);
  }

  return await response.json();
};
