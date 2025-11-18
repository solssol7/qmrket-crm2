// Notifly 유저 속성 업데이트
const NOTIFLY_CONFIG = {
  BASE_URL: 'https://api.notifly.tech',
  ACCESS_KEY: process.env.NOTIFLY_ACCESS_KEY,
  SECRET_KEY: process.env.NOTIFLY_SECRET_KEY
};

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { projectId, users } = req.body;

    // 1. Notifly 인증
    const authResponse = await fetch(`${NOTIFLY_CONFIG.BASE_URL}/authenticate`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        accessKey: NOTIFLY_CONFIG.ACCESS_KEY,
        secretKey: NOTIFLY_CONFIG.SECRET_KEY
      })
    });

    const authResult = await authResponse.json();
    if (!authResult.data) {
      throw new Error('Notifly 인증 실패');
    }

    const token = authResult.data;

    // 2. 유저 속성 업데이트 (1000명씩 배치)
    const batchSize = 1000;
    let totalUpdated = 0;

    for (let i = 0; i < users.length; i += batchSize) {
      const batch = users.slice(i, i + batchSize);
      
      const payload = batch.map(user => ({
        projectId: projectId,
        userId: user.userId,
        userProperties: user.properties
      }));

      const response = await fetch(`${NOTIFLY_CONFIG.BASE_URL}/set-user-properties`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': token
        },
        body: JSON.stringify(payload)
      });

      const result = await response.json();
      if (result.data) {
        totalUpdated += result.data;
      }

      // API 제한 방지 (초당 50-100건)
      if (i + batchSize < users.length) {
        await new Promise(resolve => setTimeout(resolve, 1000));
      }
    }

    res.status(200).json({ success: true, updated: totalUpdated });
  } catch (error) {
    console.error('Update properties error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
}
