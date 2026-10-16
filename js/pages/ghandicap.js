/* ============================================
   GHANDICAP.JS — 멤버별 핸디 관리 (NX & 글로벌 개별 운영)
   규칙:
   1. NX 핸디와 글로벌 핸디를 각각 독립적으로 구분하여 운영
   2. 평균, 최저, 최종 핸디 불필요 (개별 핸디 체제)
   3. NX 핸디순 / 글로벌 핸디순 (낮음↑, 높음↓) 및 이름순 정렬 지원
   4. 카톡 공지용 텍스트 (구분 목록 / 한줄 병기 / NX 전용 / 글로벌 전용) 원클릭 복사 지원
   ============================================ */

const GHandicapPage = {
    configs: {},
    members: [],
    sortMode: 'nx_asc',  // 'nx_asc' | 'nx_desc' | 'global_asc' | 'global_desc' | 'name'
    kakaoMode: 'split',  // 'split' (구분 목록) | 'inline' (한줄 병기) | 'nx' (NX 전용) | 'global' (글로벌 전용)
    _autoSaveTimers: {},  // memberId → debounce timer

    async render() {
        return `
        <!-- 페이지 헤더 -->
        <div style="background:linear-gradient(135deg,rgba(30,41,59,0.85),rgba(15,23,42,0.95));border:1px solid rgba(99,102,241,0.3);border-radius:14px;padding:10px 14px;margin-bottom:12px;box-shadow:0 4px 20px rgba(0,0,0,0.25);">
            <div style="display:flex;align-items:center;justify-content:space-between;gap:10px;flex-wrap:wrap;">
                <div style="display:flex;align-items:center;gap:10px;">
                    <div style="width:34px;height:34px;border-radius:10px;background:linear-gradient(135deg,#6366f1,#8b5cf6);display:flex;align-items:center;justify-content:center;font-size:1.15rem;flex-shrink:0;box-shadow:0 2px 8px rgba(99,102,241,0.4);">⛳</div>
                    <div>
                        <div style="font-weight:800;font-size:0.98rem;color:#f8fafc;letter-spacing:-0.02em;">멤버별 핸디 관리</div>
                        <div style="display:flex;flex-wrap:wrap;gap:5px;margin-top:3px;">
                            <span style="font-size:0.67rem;padding:2px 8px;border-radius:20px;background:rgba(192,132,252,0.15);border:1px solid rgba(192,132,252,0.35);color:#c084fc;font-weight:700;">⛳ NX 핸디</span>
                            <span style="font-size:0.67rem;padding:2px 8px;border-radius:20px;background:rgba(56,189,248,0.12);border:1px solid rgba(56,189,248,0.3);color:#38bdf8;font-weight:700;">🌐 글로벌 핸디</span>
                            <span style="font-size:0.67rem;padding:2px 8px;border-radius:20px;background:rgba(52,211,153,0.12);border:1px solid rgba(52,211,153,0.3);color:#34d399;font-weight:700;">✨ 개별 구분 운영</span>
                        </div>
                    </div>
                </div>
            </div>
        </div>

        <!-- 메인 2단 레이아웃 (좌: 핸디 테이블 / 우: 카톡공지 & 통계 & 가이드 패널) -->
        <div style="display:grid;grid-template-columns:minmax(380px,680px) minmax(280px,360px);gap:14px;align-items:start;">
            
            <!-- [좌측] 캡처 최적화 컴팩트 테이블 카드 -->
            <div id="ghandicap-capture-card" style="background:rgba(15,23,42,0.85);border:1px solid rgba(99,102,241,0.3);border-radius:14px;overflow:hidden;box-shadow:0 6px 24px rgba(0,0,0,0.28);width:100%;">
                <!-- 캡처 타이틀 바 -->
                <div style="padding:8px 12px 6px 12px;background:rgba(30,41,59,0.7);border-bottom:1px solid rgba(255,255,255,0.08);">
                    <div style="display:flex;justify-content:space-between;align-items:center;">
                        <div style="font-size:0.78rem;font-weight:800;color:#cbd5e1;display:flex;align-items:center;gap:6px;">
                            <span>⛳ DY GOLF 핸디표</span>
                            <span id="ghandicap-current-date" style="font-size:0.68rem;color:#64748b;font-weight:600;"></span>
                        </div>
                        <span style="font-size:0.65rem;color:#38bdf8;font-weight:700;background:rgba(56,189,248,0.12);padding:2px 7px;border-radius:4px;">📱 캡처 최적화</span>
                    </div>

                    <!-- 정렬 필터 바 (2행) -->
                    <div style="display:flex;align-items:center;gap:4px;margin-top:6px;padding-top:6px;border-top:1px solid rgba(255,255,255,0.05);flex-wrap:wrap;">
                        <span style="font-size:0.68rem;color:#94a3b8;font-weight:700;white-space:nowrap;margin-right:2px;">🔀 정렬:</span>
                        <button id="sort-nx-asc" onclick="GHandicapPage.setSort('nx_asc')"
                                style="font-size:0.68rem;padding:2px 8px;border-radius:10px;border:1px solid rgba(192,132,252,0.35);background:rgba(192,132,252,0.1);color:#c084fc;font-weight:700;cursor:pointer;white-space:nowrap;transition:all 0.15s;">⛳ NX 낮음↑</button>
                        <button id="sort-nx-desc" onclick="GHandicapPage.setSort('nx_desc')"
                                style="font-size:0.68rem;padding:2px 8px;border-radius:10px;border:1px solid rgba(192,132,252,0.35);background:rgba(192,132,252,0.1);color:#c084fc;font-weight:700;cursor:pointer;white-space:nowrap;transition:all 0.15s;">⛳ NX 높음↓</button>
                        <button id="sort-global-asc" onclick="GHandicapPage.setSort('global_asc')"
                                style="font-size:0.68rem;padding:2px 8px;border-radius:10px;border:1px solid rgba(56,189,248,0.35);background:rgba(56,189,248,0.1);color:#38bdf8;font-weight:700;cursor:pointer;white-space:nowrap;transition:all 0.15s;">🌐 글로벌 낮음↑</button>
                        <button id="sort-global-desc" onclick="GHandicapPage.setSort('global_desc')"
                                style="font-size:0.68rem;padding:2px 8px;border-radius:10px;border:1px solid rgba(56,189,248,0.35);background:rgba(56,189,248,0.1);color:#38bdf8;font-weight:700;cursor:pointer;white-space:nowrap;transition:all 0.15s;">🌐 글로벌 높음↓</button>
                        <button id="sort-name" onclick="GHandicapPage.setSort('name')"
                                style="font-size:0.68rem;padding:2px 8px;border-radius:10px;border:1px solid rgba(148,163,184,0.3);background:rgba(148,163,184,0.08);color:#94a3b8;font-weight:700;cursor:pointer;white-space:nowrap;transition:all 0.15s;">👤 이름순</button>
                        <div style="flex:1;"></div>
                        <button class="btn btn-primary" id="btn-save-all-ghandicap" style="font-weight:700;padding:3px 10px;font-size:0.72rem;border-radius:7px;white-space:nowrap;">💾 전체 저장</button>
                    </div>
                </div>

                <!-- 테이블 헤더 -->
                <div style="display:grid;grid-template-columns:minmax(80px,1fr) 115px 115px 45px;
                            padding:8px 10px;align-items:center;
                            background:linear-gradient(90deg,rgba(99,102,241,0.22),rgba(139,92,246,0.15));
                            border-bottom:1px solid rgba(99,102,241,0.3);
                            font-size:0.72rem;font-weight:800;letter-spacing:0.01em;">
                    <div onclick="GHandicapPage.setSort('name')" style="color:#e2e8f0;padding-left:4px;cursor:pointer;user-select:none;" title="클릭 시 이름순 정렬">
                        👥 멤버 <span style="font-size:0.6rem;opacity:0.6;">↕</span>
                    </div>
                    <div onclick="GHandicapPage.toggleSortColumn('nx')" style="text-align:center;color:#c084fc;cursor:pointer;user-select:none;" title="클릭 시 NX 핸디 정렬 전환">
                        ⛳ NX <span id="hdr-arrow-nx" style="font-size:0.6rem;">↕</span>
                    </div>
                    <div onclick="GHandicapPage.toggleSortColumn('global')" style="text-align:center;color:#38bdf8;cursor:pointer;user-select:none;" title="클릭 시 글로벌 핸디 정렬 전환">
                        🌐 글로벌 <span id="hdr-arrow-global" style="font-size:0.6rem;">↕</span>
                    </div>
                    <div style="text-align:center;color:#94a3b8;">저장</div>
                </div>

                <!-- 멤버 행 목록 -->
                <div id="ghandicap-members-container">
                    <div class="text-center text-muted" style="padding:24px;">⏳ 핸디 정보 불러오는 중...</div>
                </div>
            </div>

            <!-- [우측] 카톡 공유 & 통계 & 운영 안내 패널 -->
            <div style="display:flex;flex-direction:column;gap:12px;">
                
                <!-- 1. 카톡 공지용 텍스트 원클릭 복사 카드 -->
                <div style="background:linear-gradient(135deg,rgba(30,41,59,0.7),rgba(15,23,42,0.85));border:1px solid rgba(56,189,248,0.3);border-radius:14px;padding:12px;box-shadow:0 4px 18px rgba(0,0,0,0.2);">
                    <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:8px;">
                        <div style="font-weight:800;font-size:0.84rem;color:#38bdf8;display:flex;align-items:center;gap:6px;">
                            <span>📋 카톡 공지용 텍스트</span>
                            <span style="font-size:0.65rem;color:#94a3b8;font-weight:normal;">(원클릭 복사)</span>
                        </div>
                        <button onclick="GHandicapPage.copyKakaoText()" class="btn btn-sm"
                                style="font-size:0.72rem;padding:4px 12px;border-radius:7px;background:linear-gradient(135deg,#f59e0b,#d97706);color:#fff;font-weight:800;border:none;box-shadow:0 2px 8px rgba(245,158,11,0.3);cursor:pointer;">
                            💬 카톡 복사
                        </button>
                    </div>

                    <!-- 카톡 모드 탭 4종 -->
                    <div style="display:flex;gap:4px;margin-bottom:8px;background:rgba(15,23,42,0.65);padding:3px;border-radius:8px;border:1px solid rgba(255,255,255,0.06);">
                        <button id="ktab-split" onclick="GHandicapPage.setKakaoMode('split')"
                                style="flex:1;font-size:0.67rem;padding:4px 2px;border-radius:6px;border:none;background:rgba(56,189,248,0.25);color:#38bdf8;font-weight:800;cursor:pointer;transition:all 0.15s;">📑 구분 목록</button>
                        <button id="ktab-inline" onclick="GHandicapPage.setKakaoMode('inline')"
                                style="flex:1;font-size:0.67rem;padding:4px 2px;border-radius:6px;border:none;background:transparent;color:#94a3b8;font-weight:700;cursor:pointer;transition:all 0.15s;">📝 한줄 병기</button>
                        <button id="ktab-nx" onclick="GHandicapPage.setKakaoMode('nx')"
                                style="flex:1;font-size:0.67rem;padding:4px 2px;border-radius:6px;border:none;background:transparent;color:#94a3b8;font-weight:700;cursor:pointer;transition:all 0.15s;">⛳ NX만</button>
                        <button id="ktab-global" onclick="GHandicapPage.setKakaoMode('global')"
                                style="flex:1;font-size:0.67rem;padding:4px 2px;border-radius:6px;border:none;background:transparent;color:#94a3b8;font-weight:700;cursor:pointer;transition:all 0.15s;">🌐 글로벌만</button>
                    </div>

                    <textarea id="ghandicap-kakao-preview" readonly
                              style="width:100%;height:140px;background:rgba(15,23,42,0.9);border:1px solid rgba(255,255,255,0.1);border-radius:8px;color:#e2e8f0;font-size:0.75rem;font-family:monospace;padding:8px;resize:none;outline:none;box-sizing:border-box;line-height:1.45;"></textarea>
                </div>

                <!-- 2. 클럽 핸디 요약 통계 카드 -->
                <div style="background:rgba(15,23,42,0.75);border:1px solid rgba(139,92,246,0.3);border-radius:14px;padding:12px;box-shadow:0 4px 18px rgba(0,0,0,0.2);">
                    <div style="font-weight:800;font-size:0.83rem;color:#c084fc;margin-bottom:8px;display:flex;align-items:center;gap:6px;">
                        <span>📊 클럽 핸디 통계</span>
                    </div>
                    <div style="display:grid;grid-template-columns:1fr 1fr;gap:8px;margin-bottom:8px;">
                        <!-- NX 통계 -->
                        <div style="background:rgba(30,41,59,0.55);border:1px solid rgba(192,132,252,0.25);border-radius:8px;padding:8px 10px;">
                            <div style="font-size:0.68rem;color:#c084fc;font-weight:800;margin-bottom:4px;">⛳ NX 핸디</div>
                            <div style="font-size:0.7rem;color:#94a3b8;display:flex;justify-content:space-between;">
                                <span>평균:</span> <b id="stat-nx-avg" style="color:#f8fafc;">-</b>
                            </div>
                            <div style="font-size:0.7rem;color:#94a3b8;display:flex;justify-content:space-between;margin-top:2px;">
                                <span>최저:</span> <b id="stat-nx-min" style="color:#34d399;">-</b>
                            </div>
                        </div>
                        <!-- 글로벌 통계 -->
                        <div style="background:rgba(30,41,59,0.55);border:1px solid rgba(56,189,248,0.25);border-radius:8px;padding:8px 10px;">
                            <div style="font-size:0.68rem;color:#38bdf8;font-weight:800;margin-bottom:4px;">🌐 글로벌 핸디</div>
                            <div style="font-size:0.7rem;color:#94a3b8;display:flex;justify-content:space-between;">
                                <span>평균:</span> <b id="stat-global-avg" style="color:#f8fafc;">-</b>
                            </div>
                            <div style="font-size:0.7rem;color:#94a3b8;display:flex;justify-content:space-between;margin-top:2px;">
                                <span>최저:</span> <b id="stat-global-min" style="color:#34d399;">-</b>
                            </div>
                        </div>
                    </div>
                    <!-- 멤버수 & 등급 분포 -->
                    <div style="background:rgba(30,41,59,0.4);border:1px solid rgba(255,255,255,0.05);border-radius:8px;padding:8px 10px;font-size:0.7rem;">
                        <div style="display:flex;justify-content:space-between;color:#cbd5e1;font-weight:700;margin-bottom:4px;">
                            <span>등록 멤버</span>
                            <span id="stat-total-count" style="color:#38bdf8;">0명</span>
                        </div>
                        <div style="border-top:1px solid rgba(255,255,255,0.06);padding-top:4px;display:flex;justify-content:space-between;color:#94a3b8;font-size:0.67rem;">
                            <span>싱글(≤9) <b id="stat-single-count" style="color:#34d399;">-</b></span>
                            <span>미드(10~15) <b id="stat-mid-count" style="color:#38bdf8;">-</b></span>
                            <span>하이(≥16) <b id="stat-high-count" style="color:#f59e0b;">-</b></span>
                        </div>
                    </div>
                </div>

                <!-- 3. 핸디 개별 운영 안내 카드 -->
                <div style="background:rgba(15,23,42,0.7);border:1px solid rgba(255,255,255,0.08);border-radius:14px;padding:12px 14px;">
                    <div style="font-weight:800;font-size:0.8rem;color:#94a3b8;margin-bottom:8px;display:flex;align-items:center;gap:6px;">
                        <span>💡 핸디 개별 운영 안내</span>
                    </div>
                    <ul style="margin:0;padding-left:16px;font-size:0.72rem;color:#cbd5e1;line-height:1.55;">
                        <li><b style="color:#c084fc;">⛳ NX</b> 및 <b style="color:#38bdf8;">🌐 글로벌</b> 핸디를 각각 독립적으로 관리합니다.</li>
                        <li>기존의 복잡한 평균·최저·최종 산출 공식을 배제하고 실제 핸디를 직접 반영합니다.</li>
                        <li>상단 정렬 버튼(또는 헤더 클릭)으로 종목별 순위를 즉시 비교할 수 있습니다.</li>
                        <li>우측 카톡 탭에서 <b>구분 목록 / 한줄 병기 / 개별</b> 형식을 선택하여 공유하세요.</li>
                    </ul>
                </div>

            </div>
        </div>
        `;
    },

    async afterRender() {
        try {
            const [members, configs] = await Promise.all([
                Store.getMembers('active'),
                Store.getGHandicapConfigs()
            ]);
            this.members = members || [];
            this.configs = configs || {};
        } catch (e) {
            console.error('GHandicapPage afterRender error:', e);
            this.members = [];
            this.configs = {};
        }

        // 오늘 날짜 표시
        const dateEl = document.getElementById('ghandicap-current-date');
        if (dateEl) {
            const now = new Date();
            dateEl.textContent = `${now.getFullYear()}.${String(now.getMonth()+1).padStart(2,'0')}.${String(now.getDate()).padStart(2,'0')}`;
        }

        this.renderMemberList();

        const btnSaveAll = document.getElementById('btn-save-all-ghandicap');
        if (btnSaveAll) {
            btnSaveAll.addEventListener('click', () => this.saveAll());
        }
    },

    /** 멤버별 핸디 수치 가져오기 (DOM 인풋 우선, 없으면 configs) */
    getMemberHandi(m, type) {
        const cfg = this.configs[m.id] || {};
        if (type === 'nx') {
            const valEl = document.getElementById(`val-normal-${m.id}`);
            const str = valEl ? valEl.value.trim() : (cfg.golfzonHandi !== undefined && cfg.golfzonHandi !== null ? String(cfg.golfzonHandi) : '');
            if (str !== '' && !isNaN(Number(str))) return Number(str);
            if (m.nxHandicap !== undefined && m.nxHandicap !== null && m.nxHandicap !== '') return Number(m.nxHandicap);
            return null;
        } else if (type === 'global') {
            const valEl = document.getElementById(`val-global-${m.id}`);
            const str = valEl ? valEl.value.trim() : (cfg.globalHandi !== undefined && cfg.globalHandi !== null ? String(cfg.globalHandi) : '');
            if (str !== '' && !isNaN(Number(str))) return Number(str);
            if (m.globalHandicap !== undefined && m.globalHandicap !== null && m.globalHandicap !== '') return Number(m.globalHandicap);
            return null;
        }
        return null;
    },

    renderMemberList() {
        const container = document.getElementById('ghandicap-members-container');
        if (!container) return;

        if (this.members.length === 0) {
            container.innerHTML = `<div class="empty-state" style="padding:30px 15px;"><div class="empty-icon">👥</div><p class="empty-text">등록된 활동 멤버가 없습니다</p></div>`;
            return;
        }

        // ── 정렬 로직: NX순, 글로벌순, 이름순 ──
        const sorted = [...this.members].sort((a, b) => {
            if (this.sortMode === 'nx_asc') {
                const vA = this.getMemberHandi(a, 'nx');
                const vB = this.getMemberHandi(b, 'nx');
                if (vA === null && vB === null) return a.name.localeCompare(b.name, 'ko');
                if (vA === null) return 1;
                if (vB === null) return -1;
                if (vA !== vB) return vA - vB;
                return a.name.localeCompare(b.name, 'ko');
            }
            if (this.sortMode === 'nx_desc') {
                const vA = this.getMemberHandi(a, 'nx');
                const vB = this.getMemberHandi(b, 'nx');
                if (vA === null && vB === null) return a.name.localeCompare(b.name, 'ko');
                if (vA === null) return 1;
                if (vB === null) return -1;
                if (vA !== vB) return vB - vA;
                return a.name.localeCompare(b.name, 'ko');
            }
            if (this.sortMode === 'global_asc') {
                const vA = this.getMemberHandi(a, 'global');
                const vB = this.getMemberHandi(b, 'global');
                if (vA === null && vB === null) return a.name.localeCompare(b.name, 'ko');
                if (vA === null) return 1;
                if (vB === null) return -1;
                if (vA !== vB) return vA - vB;
                return a.name.localeCompare(b.name, 'ko');
            }
            if (this.sortMode === 'global_desc') {
                const vA = this.getMemberHandi(a, 'global');
                const vB = this.getMemberHandi(b, 'global');
                if (vA === null && vB === null) return a.name.localeCompare(b.name, 'ko');
                if (vA === null) return 1;
                if (vB === null) return -1;
                if (vA !== vB) return vB - vA;
                return a.name.localeCompare(b.name, 'ko');
            }
            return a.name.localeCompare(b.name, 'ko');
        });

        // 정렬 버튼 및 헤더 화살표 활성 스타일
        this._updateSortButtons();

        let html = '';
        sorted.forEach((m, idx) => {
            const cfg = this.configs[m.id] || {};
            const avatarText = m.name.length >= 2 ? m.name.slice(-2) : m.name;

            const normalHandi = cfg.golfzonHandi !== undefined && cfg.golfzonHandi !== '' && cfg.golfzonHandi !== null
                ? Number(cfg.golfzonHandi).toFixed(2)
                : (m.nxHandicap !== undefined && m.nxHandicap !== null && m.nxHandicap !== '' ? Number(m.nxHandicap).toFixed(2) : '');

            const globalHandi = cfg.globalHandi !== undefined && cfg.globalHandi !== '' && cfg.globalHandi !== null
                ? Number(cfg.globalHandi).toFixed(2)
                : (m.globalHandicap !== undefined && m.globalHandicap !== null && m.globalHandicap !== '' ? Number(m.globalHandicap).toFixed(2) : '');

            const useNormal = cfg.useGolfzon !== undefined ? cfg.useGolfzon : true;
            const useGlobal = cfg.useGlobal !== undefined ? cfg.useGlobal : true;

            const rowBg = idx % 2 === 0 ? 'rgba(30,41,59,0.45)' : 'rgba(15,23,42,0.35)';

            html += `
            <div id="ghrow-${m.id}"
                 style="display:grid;grid-template-columns:minmax(80px,1fr) 115px 115px 45px;
                        padding:5px 10px;min-height:42px;align-items:center;
                        background:${rowBg};border-bottom:1px solid rgba(255,255,255,0.04);
                        transition:background 0.15s;"
                 onmouseover="this.style.background='rgba(99,102,241,0.1)'"
                 onmouseout="this.style.background='${rowBg}'">

                <!-- 멤버 프로필 -->
                <div style="display:flex;align-items:center;gap:6px;min-width:0;padding-left:4px;" title="${Utils.escapeHtml(m.nickname ? `${m.name} (${m.nickname})` : m.name)}">
                    <div style="height:22px;width:22px;font-size:0.62rem;font-weight:800;border-radius:6px;
                                background:linear-gradient(135deg,#6366f1,#8b5cf6);color:#fff;
                                display:inline-flex;align-items:center;justify-content:center;white-space:nowrap;flex-shrink:0;">
                        ${avatarText}
                    </div>
                    <span style="font-weight:700;font-size:0.83rem;color:#f8fafc;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;">
                        ${Utils.escapeHtml(m.name)}
                    </span>
                </div>

                <!-- 1. NX 핸디 입력 -->
                <div style="display:flex;align-items:center;justify-content:center;gap:4px;">
                    <input type="checkbox" id="chk-normal-${m.id}" ${useNormal ? 'checked' : ''}
                           onchange="GHandicapPage.toggleInput(${m.id}, 'normal')"
                           title="NX 핸디 포함 여부"
                           style="cursor:pointer;accent-color:#c084fc;width:13px;height:13px;flex-shrink:0;margin:0;">
                    <input type="number" step="0.01" min="-30" max="50" inputmode="decimal" id="val-normal-${m.id}" value="${normalHandi}"
                           placeholder="-" ${!useNormal ? 'disabled' : ''}
                           oninput="GHandicapPage.onHandiInput(${m.id})"
                           style="width:62px;height:28px;text-align:center;padding:0;font-size:0.85rem;
                                  font-weight:800;color:#f8fafc;background:rgba(15,23,42,0.9);
                                  border:1px solid rgba(192,132,252,0.45);border-radius:6px;box-sizing:border-box;
                                  outline:none;-moz-appearance:textfield;${!useNormal ? 'opacity:0.3;cursor:not-allowed;' : 'cursor:text;'}">
                </div>

                <!-- 2. 글로벌 핸디 입력 -->
                <div style="display:flex;align-items:center;justify-content:center;gap:4px;">
                    <input type="checkbox" id="chk-global-${m.id}" ${useGlobal ? 'checked' : ''}
                           onchange="GHandicapPage.toggleInput(${m.id}, 'global')"
                           title="글로벌 핸디 포함 여부"
                           style="cursor:pointer;accent-color:#38bdf8;width:13px;height:13px;flex-shrink:0;margin:0;">
                    <input type="number" step="0.01" min="-30" max="50" inputmode="decimal" id="val-global-${m.id}" value="${globalHandi}"
                           placeholder="-" ${!useGlobal ? 'disabled' : ''}
                           oninput="GHandicapPage.onHandiInput(${m.id})"
                           style="width:62px;height:28px;text-align:center;padding:0;font-size:0.85rem;
                                  font-weight:800;color:#f8fafc;background:rgba(15,23,42,0.9);
                                  border:1px solid rgba(56,189,248,0.45);border-radius:6px;box-sizing:border-box;
                                  outline:none;-moz-appearance:textfield;${!useGlobal ? 'opacity:0.3;cursor:not-allowed;' : 'cursor:text;'}">
                </div>

                <!-- 저장 버튼 -->
                <div style="text-align:center;display:flex;align-items:center;justify-content:center;">
                    <button class="btn btn-emerald btn-sm" onclick="GHandicapPage.saveSingle(${m.id})"
                            title="이 멤버 핸디 저장"
                            style="font-size:0.7rem;height:24px;padding:0 6px;white-space:nowrap;font-weight:700;border-radius:6px;">💾</button>
                </div>
            </div>
            `;
        });

        container.innerHTML = html;
        this.updateSidePanel();
    },

    /** 정렬 모드 변경 */
    setSort(mode) {
        this.sortMode = mode;
        this.renderMemberList();
    },

    /** 테이블 헤더 클릭 시 컬럼 정렬 토글 */
    toggleSortColumn(col) {
        if (col === 'nx') {
            this.sortMode = (this.sortMode === 'nx_asc') ? 'nx_desc' : 'nx_asc';
        } else if (col === 'global') {
            this.sortMode = (this.sortMode === 'global_asc') ? 'global_desc' : 'global_asc';
        }
        this.renderMemberList();
    },

    /** 정렬 버튼 및 헤더 표시 업데이트 */
    _updateSortButtons() {
        const btnIds = ['sort-nx-asc', 'sort-nx-desc', 'sort-global-asc', 'sort-global-desc', 'sort-name'];
        btnIds.forEach(id => {
            const btn = document.getElementById(id);
            if (btn) {
                btn.style.boxShadow = '';
                btn.style.background = '';
                btn.style.borderColor = '';
            }
        });

        const activeMap = {
            'nx_asc': { id: 'sort-nx-asc', bg: 'rgba(192,132,252,0.3)', border: '#c084fc', color: '#f3e8ff' },
            'nx_desc': { id: 'sort-nx-desc', bg: 'rgba(192,132,252,0.3)', border: '#c084fc', color: '#f3e8ff' },
            'global_asc': { id: 'sort-global-asc', bg: 'rgba(56,189,248,0.3)', border: '#38bdf8', color: '#e0f2fe' },
            'global_desc': { id: 'sort-global-desc', bg: 'rgba(56,189,248,0.3)', border: '#38bdf8', color: '#e0f2fe' },
            'name': { id: 'sort-name', bg: 'rgba(148,163,184,0.3)', border: '#cbd5e1', color: '#f8fafc' },
        };

        const cur = activeMap[this.sortMode];
        if (cur) {
            const btn = document.getElementById(cur.id);
            if (btn) {
                btn.style.background = cur.bg;
                btn.style.borderColor = cur.border;
                btn.style.color = cur.color;
                btn.style.boxShadow = `0 0 10px ${cur.bg}`;
            }
        }

        // 헤더 화살표 업데이트
        const arrNx = document.getElementById('hdr-arrow-nx');
        const arrGl = document.getElementById('hdr-arrow-global');
        if (arrNx) {
            arrNx.textContent = this.sortMode === 'nx_asc' ? '▲' : (this.sortMode === 'nx_desc' ? '▼' : '↕');
            arrNx.style.color = (this.sortMode.startsWith('nx')) ? '#c084fc' : 'rgba(192,132,252,0.5)';
        }
        if (arrGl) {
            arrGl.textContent = this.sortMode === 'global_asc' ? '▲' : (this.sortMode === 'global_desc' ? '▼' : '↕');
            arrGl.style.color = (this.sortMode.startsWith('global')) ? '#38bdf8' : 'rgba(56,189,248,0.5)';
        }
    },

    /** 체크박스 변경 시 입력란 활성화/비활성화 제어 */
    toggleInput(memberId, type) {
        const chk = document.getElementById(`chk-${type}-${memberId}`);
        const input = document.getElementById(`val-${type}-${memberId}`);
        if (chk && input) {
            input.disabled = !chk.checked;
            input.style.opacity = chk.checked ? '1' : '0.35';
            input.style.cursor = chk.checked ? 'text' : 'not-allowed';
        }
        this.onHandiInput(memberId);
    },

    /** 핸디 입력 시 DOM 동기화 및 자동저장, 사이드패널 갱신 */
    onHandiInput(memberId) {
        this._syncConfigFromDom(memberId);
        this._scheduleAutoSave(memberId);
        this.updateSidePanel();
    },

    /** DOM 입력값을 configs에 즉시 임시 반영 */
    _syncConfigFromDom(memberId) {
        const useNormal = document.getElementById(`chk-normal-${memberId}`)?.checked ?? true;
        const useGlobal = document.getElementById(`chk-global-${memberId}`)?.checked ?? true;
        const normalVal = document.getElementById(`val-normal-${memberId}`)?.value.trim() || '';
        const globalVal = document.getElementById(`val-global-${memberId}`)?.value.trim() || '';

        if (!this.configs[memberId]) this.configs[memberId] = {};
        Object.assign(this.configs[memberId], {
            useGolfzon:   useNormal,
            useGlobal:    useGlobal,
            golfzonHandi: normalVal !== '' && !isNaN(Number(normalVal)) ? Number(normalVal) : '',
            globalHandi:  globalVal !== '' && !isNaN(Number(globalVal)) ? Number(globalVal) : '',
            nxHandicap:   normalVal !== '' && !isNaN(Number(normalVal)) ? Number(normalVal) : '',
            finalHandicap: ''
        });
    },

    /** debounce 자동저장 (1.5초 후 localStorage에 저장) */
    _scheduleAutoSave(memberId) {
        if (this._autoSaveTimers[memberId]) clearTimeout(this._autoSaveTimers[memberId]);
        this._autoSaveTimers[memberId] = setTimeout(async () => {
            const cfg = this.configs[memberId];
            if (!cfg) return;
            try {
                const all = Store._getLocalGHandicapConfigs ? Store._getLocalGHandicapConfigs() : {};
                all[memberId] = { ...all[memberId], ...cfg, updated_at: new Date().toISOString() };
                localStorage.setItem('club_ghandicap_configs_v1', JSON.stringify(all));
            } catch(e) {}
            delete this._autoSaveTimers[memberId];
        }, 1500);
    },

    /** 카톡 공지 모드 변경 */
    setKakaoMode(mode) {
        this.kakaoMode = mode;
        ['split', 'inline', 'nx', 'global'].forEach(m => {
            const tab = document.getElementById(`ktab-${m}`);
            if (!tab) return;
            if (m === mode) {
                tab.style.background = 'rgba(56,189,248,0.25)';
                tab.style.color = '#38bdf8';
                tab.style.fontWeight = '800';
                tab.style.boxShadow = '0 0 8px rgba(56,189,248,0.2)';
            } else {
                tab.style.background = 'transparent';
                tab.style.color = '#94a3b8';
                tab.style.fontWeight = '700';
                tab.style.boxShadow = '';
            }
        });
        this.updateSidePanel();
    },

    /** 우측 통계 및 카톡 공유 텍스트 실시간 갱신 */
    updateSidePanel() {
        if (!this.members || this.members.length === 0) return;

        let totalNx = 0, validNxCount = 0, minNx = Infinity, minNxMember = '-';
        let totalGlobal = 0, validGlobalCount = 0, minGlobal = Infinity, minGlobalMember = '-';

        let singleCount = 0; // <= 9
        let midCount = 0;    // 10 ~ 15
        let highCount = 0;   // >= 16

        this.members.forEach(m => {
            const nx = this.getMemberHandi(m, 'nx');
            const gl = this.getMemberHandi(m, 'global');

            if (nx !== null) {
                totalNx += nx;
                validNxCount++;
                if (nx < minNx) { minNx = nx; minNxMember = m.name; }
                if (nx <= 9) singleCount++;
                else if (nx <= 15) midCount++;
                else highCount++;
            }
            if (gl !== null) {
                totalGlobal += gl;
                validGlobalCount++;
                if (gl < minGlobal) { minGlobal = gl; minGlobalMember = m.name; }
            }
        });

        const avgNx = validNxCount > 0 ? (totalNx / validNxCount).toFixed(2) : '-';
        const avgGlobal = validGlobalCount > 0 ? (totalGlobal / validGlobalCount).toFixed(2) : '-';

        // DOM 통계 업데이트
        const elTotal = document.getElementById('stat-total-count');
        const elNxAvg = document.getElementById('stat-nx-avg');
        const elNxMin = document.getElementById('stat-nx-min');
        const elGlAvg = document.getElementById('stat-global-avg');
        const elGlMin = document.getElementById('stat-global-min');
        const elSingle = document.getElementById('stat-single-count');
        const elMid = document.getElementById('stat-mid-count');
        const elHigh = document.getElementById('stat-high-count');
        const elPreview = document.getElementById('ghandicap-kakao-preview');

        if (elTotal) elTotal.textContent = `${this.members.length}명`;
        if (elNxAvg) elNxAvg.textContent = avgNx;
        if (elNxMin) elNxMin.textContent = minNx !== Infinity ? `${minNx.toFixed(2)} (${minNxMember})` : '-';
        if (elGlAvg) elGlAvg.textContent = avgGlobal;
        if (elGlMin) elGlMin.textContent = minGlobal !== Infinity ? `${minGlobal.toFixed(2)} (${minGlobalMember})` : '-';
        if (elSingle) elSingle.textContent = `${singleCount}명`;
        if (elMid) elMid.textContent = `${midCount}명`;
        if (elHigh) elHigh.textContent = `${highCount}명`;

        // 카톡 공지 텍스트 생성
        const now = new Date();
        const dateStr = `${now.getFullYear()}.${String(now.getMonth()+1).padStart(2,'0')}.${String(now.getDate()).padStart(2,'0')}`;

        const formatVal = (v) => {
            if (v === null || v === undefined) return '-';
            return Number(v).toFixed(2);
        };

        const lines = [];

        if (this.kakaoMode === 'split') {
            // ── 1. 2단 구분 목록형 (NX 섹션 + 글로벌 섹션) ──
            lines.push(`⛳ [DY GOLF] 멤버별 핸디표`);
            lines.push(`📅 기준일: ${dateStr}`);
            lines.push(`━━━━━━━━━━━━━━━━`);

            // NX 랭킹순
            const nxSorted = [...this.members].filter(m => this.getMemberHandi(m, 'nx') !== null)
                .sort((a,b) => this.getMemberHandi(a,'nx') - this.getMemberHandi(b,'nx'));
            const nxNoVal = [...this.members].filter(m => this.getMemberHandi(m, 'nx') === null);

            lines.push(`[ ⛳ NX 핸디 ]`);
            nxSorted.forEach((m, idx) => {
                const rank = idx === 0 ? '🥇' : (idx === 1 ? '🥈' : (idx === 2 ? '🥉' : '▪️'));
                lines.push(`${rank} ${m.name} : ${formatVal(this.getMemberHandi(m, 'nx'))}`);
            });
            nxNoVal.forEach(m => lines.push(`▪️ ${m.name} : 미정`));

            lines.push(``);
            lines.push(`[ 🌐 글로벌 핸디 ]`);
            const glSorted = [...this.members].filter(m => this.getMemberHandi(m, 'global') !== null)
                .sort((a,b) => this.getMemberHandi(a,'global') - this.getMemberHandi(b,'global'));
            const glNoVal = [...this.members].filter(m => this.getMemberHandi(m, 'global') === null);

            glSorted.forEach((m, idx) => {
                const rank = idx === 0 ? '🥇' : (idx === 1 ? '🥈' : (idx === 2 ? '🥉' : '▪️'));
                lines.push(`${rank} ${m.name} : ${formatVal(this.getMemberHandi(m, 'global'))}`);
            });
            glNoVal.forEach(m => lines.push(`▪️ ${m.name} : 미정`));

            lines.push(`━━━━━━━━━━━━━━━━`);
            lines.push(`📊 등록 멤버: ${this.members.length}명`);
            if (avgNx !== '-') lines.push(`⛳ NX 평균: ${avgNx} | 🌐 글로벌 평균: ${avgGlobal}`);

        } else if (this.kakaoMode === 'inline') {
            // ── 2. 한줄 병기형 (이름 : NX 0.00 / 글로벌 0.00) ──
            lines.push(`⛳ [DY GOLF] 멤버별 핸디표`);
            lines.push(`📅 기준일: ${dateStr}`);
            lines.push(`━━━━━━━━━━━━━━━━`);

            // 현재 정렬 기준에 맞춰 출력
            const currentSorted = [...this.members].sort((a, b) => {
                if (this.sortMode === 'nx_asc') {
                    const vA = this.getMemberHandi(a, 'nx'), vB = this.getMemberHandi(b, 'nx');
                    if (vA === null) return 1; if (vB === null) return -1;
                    return vA - vB;
                }
                if (this.sortMode === 'nx_desc') {
                    const vA = this.getMemberHandi(a, 'nx'), vB = this.getMemberHandi(b, 'nx');
                    if (vA === null) return 1; if (vB === null) return -1;
                    return vB - vA;
                }
                if (this.sortMode === 'global_asc') {
                    const vA = this.getMemberHandi(a, 'global'), vB = this.getMemberHandi(b, 'global');
                    if (vA === null) return 1; if (vB === null) return -1;
                    return vA - vB;
                }
                if (this.sortMode === 'global_desc') {
                    const vA = this.getMemberHandi(a, 'global'), vB = this.getMemberHandi(b, 'global');
                    if (vA === null) return 1; if (vB === null) return -1;
                    return vB - vA;
                }
                return a.name.localeCompare(b.name, 'ko');
            });

            currentSorted.forEach((m, idx) => {
                const rank = idx === 0 ? '🥇' : (idx === 1 ? '🥈' : (idx === 2 ? '🥉' : '▪️'));
                const nxVal = formatVal(this.getMemberHandi(m, 'nx'));
                const glVal = formatVal(this.getMemberHandi(m, 'global'));
                lines.push(`${rank} ${m.name} : NX ${nxVal} | 글로벌 ${glVal}`);
            });

            lines.push(`━━━━━━━━━━━━━━━━`);
            lines.push(`📊 등록 멤버: ${this.members.length}명`);
            if (avgNx !== '-') lines.push(`⛳ NX 평균: ${avgNx} | 🌐 글로벌 평균: ${avgGlobal}`);

        } else if (this.kakaoMode === 'nx') {
            // ── 3. NX 전용 ──
            lines.push(`⛳ [DY GOLF] NX 핸디표`);
            lines.push(`📅 기준일: ${dateStr}`);
            lines.push(`━━━━━━━━━━━━━━━━`);
            const nxSorted = [...this.members].filter(m => this.getMemberHandi(m, 'nx') !== null)
                .sort((a,b) => this.getMemberHandi(a,'nx') - this.getMemberHandi(b,'nx'));
            const nxNoVal = [...this.members].filter(m => this.getMemberHandi(m, 'nx') === null);

            nxSorted.forEach((m, idx) => {
                const rank = idx === 0 ? '🥇' : (idx === 1 ? '🥈' : (idx === 2 ? '🥉' : '▪️'));
                lines.push(`${rank} ${m.name} : ${formatVal(this.getMemberHandi(m, 'nx'))}`);
            });
            nxNoVal.forEach(m => lines.push(`▪️ ${m.name} : 미정`));
            lines.push(`━━━━━━━━━━━━━━━━`);
            lines.push(`📊 인원: ${this.members.length}명 | ⛳ NX 평균: ${avgNx}`);

        } else if (this.kakaoMode === 'global') {
            // ── 4. 글로벌 전용 ──
            lines.push(`🌐 [DY GOLF] 글로벌 핸디표`);
            lines.push(`📅 기준일: ${dateStr}`);
            lines.push(`━━━━━━━━━━━━━━━━`);
            const glSorted = [...this.members].filter(m => this.getMemberHandi(m, 'global') !== null)
                .sort((a,b) => this.getMemberHandi(a,'global') - this.getMemberHandi(b,'global'));
            const glNoVal = [...this.members].filter(m => this.getMemberHandi(m, 'global') === null);

            glSorted.forEach((m, idx) => {
                const rank = idx === 0 ? '🥇' : (idx === 1 ? '🥈' : (idx === 2 ? '🥉' : '▪️'));
                lines.push(`${rank} ${m.name} : ${formatVal(this.getMemberHandi(m, 'global'))}`);
            });
            glNoVal.forEach(m => lines.push(`▪️ ${m.name} : 미정`));
            lines.push(`━━━━━━━━━━━━━━━━`);
            lines.push(`📊 인원: ${this.members.length}명 | 🌐 글로벌 평균: ${avgGlobal}`);
        }

        if (elPreview) {
            elPreview.value = lines.join('\n');
        }
    },

    /** 카톡 공지용 텍스트 클립보드 복사 */
    copyKakaoText() {
        const elPreview = document.getElementById('ghandicap-kakao-preview');
        if (!elPreview || !elPreview.value) {
            Utils.toast('복사할 핸디 정보가 없습니다.', 'warning');
            return;
        }
        navigator.clipboard.writeText(elPreview.value)
            .then(() => {
                Utils.toast('📋 카톡 공지용 텍스트가 복사되었습니다!', 'success');
            })
            .catch(() => {
                elPreview.select();
                document.execCommand('copy');
                Utils.toast('📋 카톡 공지용 텍스트가 복사되었습니다!', 'success');
            });
    },

    /** 단일 멤버 핸디 저장 */
    async saveSingle(memberId) {
        const m = this.members.find(item => item.id === memberId);
        if (!m) return;

        const useNormal = document.getElementById(`chk-normal-${memberId}`)?.checked ?? true;
        const useGlobal = document.getElementById(`chk-global-${memberId}`)?.checked ?? true;
        const normalHandiVal = document.getElementById(`val-normal-${memberId}`)?.value.trim() || '';
        const globalHandiVal = document.getElementById(`val-global-${memberId}`)?.value.trim() || '';

        const configData = {
            useGolfzon: useNormal,
            useGlobal: useGlobal,
            golfzonId: '',
            globalId: '',
            golfzonHandi: normalHandiVal !== '' && !isNaN(Number(normalHandiVal)) ? Number(normalHandiVal) : '',
            globalHandi: globalHandiVal !== '' && !isNaN(Number(globalHandiVal)) ? Number(globalHandiVal) : '',
            nxHandicap: normalHandiVal !== '' && !isNaN(Number(normalHandiVal)) ? Number(normalHandiVal) : '',
            baseHandicap: '',
            finalHandicap: ''
        };

        this.configs[memberId] = configData;
        await Store.saveGHandicapConfig(memberId, configData);

        // 멤버 정보에도 최신 핸디 반영 (호환성을 위해 ghandicap에도 주 핸디 세팅)
        const primaryHandi = configData.golfzonHandi !== '' ? configData.golfzonHandi : configData.globalHandi;
        await Store.updateMember(memberId, {
            ghandicap: primaryHandi,
            nxHandicap: configData.golfzonHandi,
            globalHandicap: configData.globalHandi
        });

        // 저장 완료 행 하이라이트
        const row = document.getElementById(`ghrow-${memberId}`);
        if (row) {
            row.style.background = 'rgba(16,185,129,0.2)';
            setTimeout(() => { row.style.background = ''; }, 1000);
        }

        this.updateSidePanel();
        const nxMsg = configData.golfzonHandi !== '' ? `NX ${configData.golfzonHandi}` : 'NX -';
        const glMsg = configData.globalHandi !== '' ? `글로벌 ${configData.globalHandi}` : '글로벌 -';
        Utils.toast(`[${m.name}] 핸디(${nxMsg}, ${glMsg}) 저장 완료!`, 'success');
    },

    /** 전체 멤버 일괄 저장 */
    async saveAll() {
        if (this.members.length === 0) return;
        Utils.toast('전체 저장 중...', 'info');
        for (const m of this.members) {
            await this.saveSingle(m.id);
        }
        this.updateSidePanel();
        Utils.toast('모든 멤버의 NX 및 글로벌 핸디가 저장되었습니다!', 'success');
    }
};

Router.register('ghandicap', GHandicapPage);
window.GHandicapPage = GHandicapPage;
