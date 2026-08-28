var APP_VERSION = 'v1.3.8';
var APP_BUILD_TIME = '2026-08-28 11:48 (ICT)'; // 수정 작업 완료 시 자동 갱신

var APP_CHANGELOG = [
    {
        version: 'v1.3.8',
        date: '2026-08-28 11:48',
        items: [
            '핸디표 정보 표현 영역(NX4, 글로벌, 평균, 최저, 최종) 가로 폭 48px 균등 통일',
            '대시보드 totalCountDisplay 변수 복구 및 페이지 안정화'
        ]
    },
    {
        version: 'v1.3.7',
        date: '2026-08-28 11:45',
        items: [
            '핸디 산출 공식 조건 세분화: 평균 ≤ 5 반올림(Math.round), 평균 6~15 내림(Math.floor), 평균 > 15 내림 & 최저핸디 유지',
            '핸디 관리 상단 배지 및 산출 규정 안내 카드 문구 업데이트 (≤5 반올림, 6~15 내림, >15 최저유지)'
        ]
    },
    {
        version: 'v1.3.6',
        date: '2026-08-28 11:40',
        items: [
            '핸디 관리 최저핸디 명칭 수정 및 핸디표 가로 폭 50% 압축 (카톡 캡처 최적화)',
            '카톡 공지 텍스트 1초 복사기 및 클럽 통계/분포 패널 추가',
            '소수점 핸디 입력창 확장(잘림 방지) 및 멤버 컬럼 컴팩트화',
            '게임 기록 입력 팝업 전면 개편 (원터치 참여자 칩 토글, 상시/최근 퀵 선택, 1등~N등 원클릭 순위 배정)'
        ]
    },
    {
        version: 'v1.3.5',
        date: '2026-08-27 08:00',
        items: [
            '회비 산출 시트 등수별 지불금 연동',
            '참여자 기록 및 순위 관리 최적화'
        ]
    }
];

var SUPABASE_URL = 'https://qkkcugjuopjeuiyczjzf.supabase.co';
var SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InFra2N1Z2p1b3BqZXVpeWN6anpmIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODQ2NjE2NjQsImV4cCI6MjEwMDIzNzY2NH0.qPYwvuSBp_SEvi1vG4qoCIpbsBU1eTIYz43q-Df00DY';

// supabase CDN이 전역 var supabase = {...createClient...}로 노출됨
// 절대 var supabase = null 로 덮어쓰면 안됨!
var supabaseClient = null;
(function initSupabaseClient() {
    try {
        if (typeof supabase !== 'undefined' && supabase && supabase.createClient) {
            supabaseClient = supabase.createClient(SUPABASE_URL, SUPABASE_KEY);
            console.log('✅ Supabase Client initialized (v1.3.8)');
        } else {
            console.warn('⚠️ supabase CDN not loaded yet');
        }
    } catch(e) {
        console.warn('Supabase init warning:', e);
    }
})();
