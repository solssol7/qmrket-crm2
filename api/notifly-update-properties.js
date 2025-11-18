// api/notifly-update-properties.js

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
    const { projectId, users } = req.body;

    if (!projectId || !users || users.length === 0) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    console.log(`[PROPERTIES] 속성 업데이트 시작: ${users.length}명`);

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
    console.log('[PROPERTIES] Notifly 인증 완료');

    // 2. 속성 업데이트
    const updateRes = await fetch(
      'https://api.notifly.tech/set-user-properties',
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': token
        },
        body: JSON.stringify({ users })
      }
    );

    if (!updateRes.ok) {
      throw new Error(`HTTP ${updateRes.status}: ${await updateRes.text()}`);
    }

    const result = await updateRes.json();
    console.log(`[PROPERTIES] 속성 업데이트 완료: ${users.length}명`);

    return res.status(200).json({
      success: true,
      message: `${users.length}명의 속성을 업데이트했습니다`,
      data: result
    });
  } catch (error) {
    console.error('[PROPERTIES] 오류:', error.message);
    return res.status(500).json({
      success: false,
      error: error.message
    });
  }
};
