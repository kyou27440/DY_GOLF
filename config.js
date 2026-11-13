var APP_VERSION = 'v1.5.2';
var APP_BUILD_TIME = '2026-11-13 14:30 (ICT)'; // 수정 작업 완료 시 자동 갱신

var APP_CHANGELOG = [
    {
        version: 'v1.5.2',
        date: '2026-11-13 14:30',
        items: [
            'Supabase 클라우드 DB 휴면(Paused)/연결불가 감지 서킷 브레이커(2.5초 타임아웃 & 즉시 로컬 전환) 도입',
            '클라우드 DB 일시중지(Paused) 시 상단 원클릭 복구 안내 배너(Supabase Restore 바로가기) 표시',
            '모임 & 골프 관리 탭(게임 기록) 직렬 쿼리를 병렬(Promise.all)로 전환 및 로컬 게임 기반 멤버 임시 복원 지원'
        ]
    },
    {
        version: 'v1.5.1',
        date: '2026-11-13 14:15',
        items: [
            '대시보드 즉시 렌더링 시 불완전한 로컬 멤버 캐시(m.name 누락)로 인한 length 참조 오류 핫픽스',
            '로컬 스토리지 손상 멤버 데이터 자동 정화 및 전 페이지(대시보드/모임/성적/핸디) 안전 배열·문자열 가드 적용'
        ]
    },
    {
        version: 'v1.5.0',
        date: '2026-11-13 12:55',
        items: [
            'PC·모바일 대시보드 및 전체 탭 로딩 속도 대폭 최적화 (0.01초 즉시 캐시 렌더링 + 백그라운드 동기화)',
            'Store 인메모리 캐시(TTL) 및 동시 중복 DB 요청 병합(In-Flight Deduplication) 적용',
            '존재하지 않던 club_calc_history 테이블 404 지연 쿼리 제거 및 getGames 로컬 캐시 절삭 버그 수정',
            '미사용 Chart.js(205KB) 블로킹 스크립트 제거, Supabase Preconnect 및 강제 이중 리로드 제거'
        ]
    },
    {
        version: 'v1.4.9',
        date: '2026-10-16 15:40',
        items: [
            '핸디 구분 표기 개편: 실제 핸디(소수점)와 반영 핸디(정수) 구분 표시',
            '반영 핸디 산출 공식 적용: 5 이하 소수점 반올림, 5 초과 소수점 버림(내림)',
            '테이블 실제 ➔ 반영 핸디 실시간 연동 뱃지 및 카톡 공지 실제 핸디 병기 옵션 추가'
        ]
    },
    {
        version: 'v1.4.8',
        date: '2026-10-16 15:15',
        items: [
            '핸디 관리 개정: NX4 명칭을 NX로 통일 및 평균·최저·최종 열 제거',
            'NX 핸디와 글로벌 핸디 개별 분리 관리 체제 전환',
            'NX순/글로벌순(낮음↑/높음↓) 정렬 옵션 및 헤더 클릭 정렬 지원',
            '카톡 공지용 텍스트 4개 모드(구분 목록, 한줄 병기, NX만, 글로벌만) 원클릭 복사 지원'
        ]
    },
    {
        version: 'v1.4.7',
        date: '2026-10-09 10:55',
        items: [
            '게임 기록 순위 미정/시작 전(?위) 참여자 목록 제작자(김상국) 최우선 맨 앞 정렬',
            '참석자 선택 팝업 및 대시보드 활동 멤버 목록 제작자(김상국) 우선 노출'
        ]
    },
    {
        version: 'v1.4.6',
        date: '2026-09-18 12:28',
        items: [
            '회비 산출 시트 2인 참여 모드 지원 (참여 인원수 2명 선택 및 2인 단계별 비율 프리셋 6종 추가)'
        ]
    },
    {
        version: 'v1.4.5',
        date: '2026-09-08 07:55',
        items: [
            'G-핸디표 NX4·글로벌·평균·최저핸디 소수점 2자리(0.01 단위) 표시 및 입력 지원',
            '음수 핸디 반올림 로직 사사오입(절댓값 0.5 이상 올림) 보정 (예: -0.50 / -0.51 → 최종핸디 -1)',
            '대시보드 HTML 태그 및 인코딩 정상 복구'
        ]
    },
    {
        version: 'v1.4.3',
        date: '2026-09-03 13:15',
        items: [
            '성적 통계 & 순위/성적 탭 비활성 멤버 필터 기능 추가 (활성/전체 토글, 즉시 재렌더링)',
            '비활성 인원 카운트 표시 및 두 페이지 독립 필터 상태 유지'
        ]
    },
    {
        version: 'v1.4.2',
        date: '2026-09-03 12:45',
        items: [
            '순위/성적 탭 멤버별 누적 회비 & 1회당 평균 컬럼 추가, 테이블 폭 680px 확장',
            '회비 산출 시트 이력과 게임별 참여자 순위 날짜 연결 실시간 연산'
        ]
    },
    {
        version: 'v1.4.1',
        date: '2026-08-29 11:55',
        items: [
            '핸디표 정렬 필터(낙음↑/높음↓/이름순) 테이블 내부로 이동하여 항상 노출',
            '좌측 핵디표 움 1.5배 확장(780px), 우측 패널 폭 압축으로 간섭 제거'
        ]
    },
    {
        version: 'v1.4.0',
        date: '2026-08-29 11:48',
        items: [
            '핸디표 정렬 실시간 반영(최종핸디 기준 오름/내림/이름순) 및 수기 입력값 새로고침 후 유지(debounce 자동저장 1.5초)'
        ]
    },
    {
        version: 'v1.3.9',
        date: '2026-08-28 11:55',
        items: [
            '성적통계 페이지(Analytics) 가로 폭 50% 압축(520px) 및 카톡 캡처 최적화 레이아웃 적용',
            '카톡 공지용 성적 랭킹 1초 복사기 및 TOP 3 리더보드 시상대 카드 신설',
            '모임 성적 탭 테이블 가로 폭 최적화'
        ]
    },
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
    }
];

var SUPABASE_URL = 'https://qkkcugjuopjeuiyczjzf.supabase.co';
var SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InFra2N1Z2p1b3BqZXVpeWN6anpmIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODQ2NjE2NjQsImV4cCI6MjEwMDIzNzY2NH0.qPYwvuSBp_SEvi1vG4qoCIpbsBU1eTIYz43q-Df00DY';

// supabase CDN이 전역 var supabase = {...createClient...}로 노출됨
// 절대 var supabase = null 로 덮어쓰면 안됨!
var supabaseClient = null;
window.__SUPABASE_OFFLINE__ = false;
window.__SUPABASE_OFFLINE_TS__ = 0;

function showSupabaseOfflineBanner() {
    if (typeof document === 'undefined') return;
    if (document.getElementById('supabase-offline-banner')) return;
    const header = document.getElementById('page-header');
    const main = document.getElementById('main-content');
    if (!main) return;
    const banner = document.createElement('div');
    banner.id = 'supabase-offline-banner';
    banner.style.cssText = 'margin:12px 16px 0 16px;padding:12px 16px;border-radius:12px;background:linear-gradient(135deg,rgba(244,63,94,0.22),rgba(159,18,57,0.3));border:1.5px solid rgba(244,63,94,0.6);color:#fecdd3;font-size:0.84rem;display:flex;align-items:center;justify-content:space-between;flex-wrap:wrap;gap:10px;box-shadow:0 4px 16px rgba(0,0,0,0.3);z-index:50;';
    banner.innerHTML = `
        <div style="display:flex;align-items:flex-start;gap:10px;flex:1;min-width:240px;">
            <span style="font-size:1.3rem;line-height:1;">🚨</span>
            <div>
                <div style="font-weight:800;color:#fff;font-size:0.9rem;margin-bottom:3px;">
                    클라우드 DB(Supabase)가 휴면(Paused) 상태이거나 연결할 수 없습니다!
                </div>
                <div style="color:#fda4af;font-size:0.78rem;line-height:1.45;">
                    무료 플랜은 7일 이상 미사용 시 자동 일시중지(Paused)되어 멤버·게임 데이터가 보이지 않고 로딩이 지연됩니다.<br>
                    우측 버튼을 눌러 <b>Supabase 대시보드</b>에서 <b>[Restore project]</b>를 클릭하면 1~2분 내 모든 멤버와 기록이 즉시 복구됩니다.
                </div>
            </div>
        </div>
        <div style="display:flex;gap:8px;align-items:center;flex-shrink:0;">
            <a href="https://supabase.com/dashboard/project/qkkcugjuopjeuiyczjzf" target="_blank" rel="noopener"
               style="padding:7px 13px;border-radius:8px;background:#f43f5e;color:#fff;font-weight:800;font-size:0.78rem;text-decoration:none;white-space:nowrap;box-shadow:0 2px 8px rgba(244,63,94,0.4);">
               🔗 Supabase 복구하러 가기
            </a>
            <button onclick="window.__SUPABASE_OFFLINE__=false;if(typeof Store!=='undefined')Store.invalidateCache();location.reload();"
                    style="padding:7px 11px;border-radius:8px;background:rgba(255,255,255,0.12);border:1px solid rgba(255,255,255,0.25);color:#fff;font-weight:700;font-size:0.76rem;cursor:pointer;white-space:nowrap;">
                🔄 재연결
            </button>
        </div>
    `;
    if (header && header.nextSibling) {
        main.insertBefore(banner, header.nextSibling);
    } else {
        main.prepend(banner);
    }
}

(function initSupabaseClient() {
    try {
        if (typeof supabase !== 'undefined' && supabase && supabase.createClient) {
            const customFetch = async (url, options = {}) => {
                // 서킷 브레이커: 이미 DB 오프라인/휴면으로 판정된 경우 0ms 즉시 실패 반환 (무한 로딩 완전 방지)
                if (window.__SUPABASE_OFFLINE__ && (Date.now() - window.__SUPABASE_OFFLINE_TS__ < 60000)) {
                    showSupabaseOfflineBanner();
                    throw new Error('SUPABASE_OFFLINE_CIRCUIT_OPEN');
                }
                const controller = new AbortController();
                const timer = setTimeout(() => controller.abort(), 2500);
                try {
                    const res = await fetch(url, { ...options, signal: controller.signal });
                    clearTimeout(timer);
                    if (res.status >= 502) {
                        window.__SUPABASE_OFFLINE__ = true;
                        window.__SUPABASE_OFFLINE_TS__ = Date.now();
                        setTimeout(showSupabaseOfflineBanner, 50);
                        throw new Error('SUPABASE_BOOTING_HTTP_' + res.status);
                    }
                    window.__SUPABASE_OFFLINE__ = false;
                    const existingBanner = typeof document !== 'undefined' && document.getElementById('supabase-offline-banner');
                    if (existingBanner) existingBanner.remove();
                    return res;
                } catch (err) {
                    clearTimeout(timer);
                    window.__SUPABASE_OFFLINE__ = true;
                    window.__SUPABASE_OFFLINE_TS__ = Date.now();
                    setTimeout(showSupabaseOfflineBanner, 50);
                    throw err;
                }
            };
            supabaseClient = supabase.createClient(SUPABASE_URL, SUPABASE_KEY, {
                auth: { persistSession: false, autoRefreshToken: false },
                global: { fetch: customFetch }
            });
            console.log('✅ Supabase Client initialized (v1.5.2)');
        } else {
            console.warn('⚠️ supabase CDN not loaded yet');
        }
    } catch(e) {
        console.warn('Supabase init warning:', e);
    }
})();
