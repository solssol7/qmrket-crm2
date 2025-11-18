// 기본 세그먼트 정의 - 완벽한 버전
export const PREDEFINED_SEGMENTS = {
  휴면: [
    { 
      name: '고가치_휴면', 
      conditions: '미주문 60일+ & 누적구매 20만원+',
      description: '재활성화 최우선 타겟'
    },
    { 
      name: '중가치_휴면', 
      conditions: '미주문 60일+ & 누적구매 10만원+',
      description: '중가치 재활성화'
    },
    { 
      name: '저가치_휴면', 
      conditions: '미주문 60일+ & 기타',
      description: '저비용 재활성화 캠페인'
    }
  ],
  
  활성: [
    { 
      name: 'VIP', 
      conditions: '최근 3개월 주문 5회+ & 평균 주문금액 5만원+',
      description: 'VIP 전용 혜택 제공'
    },
    { 
      name: '충성고객', 
      conditions: '최근 3개월 주문 3회+',
      description: '꾸준한 구매 유지'
    },
    { 
      name: '일반활성', 
      conditions: '최근 60일 내 주문',
      description: '기본 프로모션 타겟'
    },
    { 
      name: '쿠폰미사용_활성', 
      conditions: '보유쿠폰 3개+ & 최근 주문에 미사용',
      description: '쿠폰 소진 유도'
    }
  ],
  
  신규: [
    { 
      name: '신규_미구매', 
      conditions: '가입 30일 이내 & 주문 0회',
      description: '첫 구매 전환 최우선'
    },
    { 
      name: '신규_1회구매', 
      conditions: '가입 30일 이내 & 주문 1회',
      description: '재구매 유도'
    },
    { 
      name: '신규_2회이상', 
      conditions: '가입 30일 이내 & 주문 2회+',
      description: '우수 신규 고객'
    }
  ],
  
  RFM: [
    { 
      name: 'RFM_Champions', 
      conditions: '최근구매(30일내) & 구매빈도(5회+) & 구매금액(50만원+)',
      description: '최고 우수 고객'
    },
    { 
      name: 'RFM_LoyalCustomers', 
      conditions: '최근구매(60일내) & 구매빈도(3회+) & 구매금액(30만원+)',
      description: '충성 고객'
    },
    { 
      name: 'RFM_AtRisk', 
      conditions: '최근구매(60-90일) & 과거활성(구매금액20만원+)',
      description: '이탈 위험 고객'
    },
    { 
      name: 'RFM_CantLose', 
      conditions: '최근구매(90일+) & 과거우수(구매금액50만원+)',
      description: '잃어선 안될 고객'
    }
  ]
};

export const SUPABASE_CONFIG = {
  URL: 'https://htcxkbijmiptoubmkhkm.supabase.co',
  KEY: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imh0Y3hrYmlqbWlwdG91Ym1raGttIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjM0MjA2OTcsImV4cCI6MjA3ODk5NjY5N30.JGTUpL5spuYEvXdI3u3f3qbo6n2ztGSVwHrZijB4i8'
};

export const NOTIFLY_CONFIG = {
  PROJECT_ID: 'f2e198e2448959908fe4f8e540f4057f',
  ACCESS_KEY: '52c258da1c175ef4b6df1831ab2e1b1b',
  SECRET_KEY: 'b7GU4b$TM_V*'
};

export const API_ENDPOINTS = {
  CAMPAIGN_SEND: '/api/notifly-send-campaign',
  UPDATE_PROPERTIES: '/api/notifly-update-properties'
};

export const BATCH_SIZES = {
  CAMPAIGN: 1000,
  PROPERTIES: 500,
  ANALYSIS: 10000
};

// 커스텀 세그먼트 필드 템플릿
export const CUSTOM_SEGMENT_TEMPLATE = {
  name: '',
  conditions: {
    signupDaysMin: '',
    signupDaysMax: '',
    totalAmountMin: '',
    totalAmountMax: '',
    orderCountMin: '',
    orderCountMax: '',
    grade: '',
    avgCycleMin: '',
    avgCycleMax: '',
    daysSinceOrderMin: '',
    daysSinceOrderMax: '',
    couponCountMin: '',
    couponCountMax: '',
    martEnabled: true
  }
};
