// api/notifly-send-campaign.js

export default async (req, res) => {
  // CORS 설정
  res.setHeader('Access-Control-Allow-Credentials', 'true');
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,PATCH,DELETE,POST,PUT');
  res.setHeader('Access-Control-Allow-Headers', 'X-CSRF-Token,X-Requested-With,Accept,Accept-Version,Content-Length,Content-MD5,Content-Type,Date,X-Api-Version,Authorization');

  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { projectId, campaignId, users } = req.body;

    if (!projectId || !campaignId || !users) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    console.log(`[CAMPAIGN] 캠페인 발송 시작: ${campaignId} (${users.length}명)`);

    // 1. Notifly 인증
    const authRes = await fetch('https://api.notifly.tech/authenticate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        accessKey: process.env.NOTIFLY_ACCESS_KEY,
        secretKey: process.env.NOTIFLY_SECRET_KEY
      })
    });

    const authData = await authRes.json();
    if (!authData.data) {
      throw new Error('Notifly 인증 실패');
    }

    const token = authData.data;
    console.log('[CAMPAIGN] Notifly 인증 완료');

    // 2. 캠페인 발송
    const sendRes = await fetch(
      `https://api.notifly.tech/projects/${projectId}/campaigns/${campaignId}/send`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': token
        },
        body: JSON.stringify({ recipients: users })
      }
    );

    if (!sendRes.ok) {
      throw new Error(`HTTP ${sendRes.status}: ${await sendRes.text()}`);
    }

    const result = await sendRes.json();
    console.log(`[CAMPAIGN] 캠페인 발송 완료: ${users.length}명`);

    return res.status(200).json({
      success: true,
      message: `${users.length}명에게 캠페인을 발송했습니다`,
      data: result
    });
  } catch (error) {
    console.error('[CAMPAIGN] 오류:', error.message);
    return res.status(500).json({
      success: false,
      error: error.message
    });
  }
};
