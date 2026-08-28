/* ============================================
   GHANDICAP.JS — 멤버별 핸디 통합 관리 (NX4 핸드 + 글로벌핸디 ➔ 최종핸디)
   규칙:
   1. NX4 핸드 + 글로벌핸디 2개 평균 기준
   ─── 1) 평균 ≤ 5 구간 ───
   2. 반올림(Math.round) 적용  예) 3.3→3, 4.6→5
   ─── 2) 평균 6~15 구간 (5 < 평균 ≤ 15) ───
   3. 내림(Math.floor) 적용  예) 6.3→6, 9.1→9, 13.4→13, 14.1→14
   ─── 3) 평균 > 15 구간 ───
   4. 내림(Math.floor) 적용 & 상승 불가 (최저핸디 유지)
   5. 최저핸디 기준: val-base(최저핸디) 인풋 우선, 없으면 cfg.baseHandicap
   ============================================ */

const GHandicapPage = {
    configs: {},
    members: [],
    sortMode: 'handicap_asc',  // 'handicap_asc' | 'handicap_desc' | 'name'

    async render() {
        return `
        <!-- 페이지 헤더 -->
        <div style="background:linear-gradient(135deg,rgba(30,41,59,0.85),rgba(15,23,42,0.95));border:1px solid rgba(99,102,241,0.3);border-radius:14px;padding:10px 14px;margin-bottom:12px;box-shadow:0 4px 20px rgba(0,0,0,0.25);">
            <div style="display:flex;justify-content:space-between;align-items:center;flex-wrap:wrap;gap:8px;">
                <div style="display:flex;align-items:center;gap:10px;">
                    <div style="width:32px;height:32px;border-radius:10px;background:linear-gradient(135deg,#6366f1,#8b5cf6);display:flex;align-items:center;justify-content:center;font-size:1.1rem;flex-shrink:0;">🏆</div>
                    <div>
                        <div style="font-weight:800;font-size:0.95rem;color:#f8fafc;">멤버별 핸디 통합 관리</div>
                        <div style="display:flex;flex-wrap:wrap;gap:5px;margin-top:3px;">
                            <span style="font-size:0.67rem;padding:1px 7px;border-radius:20px;background:rgba(192,132,252,0.15);border:1px solid rgba(192,132,252,0.35);color:#c084fc;font-weight:700;">평균산출</span>
                            <span style="font-size:0.67rem;padding:1px 7px;border-radius:20px;background:rgba(56,189,248,0.12);border:1px solid rgba(56,189,248,0.3);color:#38bdf8;font-weight:700;">≤5 반올림</span>
                            <span style="font-size:0.67rem;padding:1px 7px;border-radius:20px;background:rgba(245,158,11,0.12);border:1px solid rgba(245,158,11,0.3);color:#f59e0b;font-weight:700;">6~15 내림</span>
                            <span style="font-size:0.67rem;padding:1px 7px;border-radius:20px;background:rgba(52,211,153,0.1);border:1px solid rgba(52,211,153,0.3);color:#34d399;font-weight:700;">&gt;15 최저유지</span>
                        </div>
                    </div>
                </div>
                <div style="display:flex;align-items:center;gap:6px;flex-wrap:wrap;">
                    <span style="font-size:0.7rem;color:#64748b;font-weight:600;">정렬:</span>
                    <button id="sort-handicap-asc" onclick="GHandicapPage.setSort('handicap_asc')"
                            style="font-size:0.7rem;padding:3px 8px;border-radius:16px;border:1px solid rgba(52,211,153,0.5);background:rgba(52,211,153,0.15);color:#34d399;font-weight:700;cursor:pointer;">🏆 낮음↑</button>
                    <button id="sort-handicap-desc" onclick="GHandicapPage.setSort('handicap_desc')"
                            style="font-size:0.7rem;padding:3px 8px;border-radius:16px;border:1px solid rgba(99,102,241,0.35);background:rgba(99,102,241,0.1);color:#a78bfa;font-weight:700;cursor:pointer;">🏆 높음↓</button>
                    <button id="sort-name" onclick="GHandicapPage.setSort('name')"
                            style="font-size:0.7rem;padding:3px 8px;border-radius:16px;border:1px solid rgba(148,163,184,0.3);background:rgba(148,163,184,0.08);color:#94a3b8;font-weight:700;cursor:pointer;">👤 이름순</button>
                    <button class="btn btn-primary" id="btn-save-all-ghandicap" style="font-weight:700;padding:5px 14px;font-size:0.8rem;border-radius:8px;white-space:nowrap;">💾 전체 저장</button>
                </div>
            </div>
        </div>

        <!-- 메인 2단 레이아웃 (좌: 컴팩트 핸디 테이블 / 우: 통계 & 카톡공지 & 규정 패널) -->
        <div style="display:grid;grid-template-columns:minmax(320px, 520px) minmax(300px, 1fr);gap:14px;align-items:start;">
            
            <!-- [좌측] 카톡 캡처 최적화 컴팩트 테이블 카드 -->
            <div id="ghandicap-capture-card" style="background:rgba(15,23,42,0.85);border:1px solid rgba(99,102,241,0.3);border-radius:14px;overflow:hidden;box-shadow:0 6px 24px rgba(0,0,0,0.28);width:100%;max-width:520px;">
                <!-- 캡처 상단 타이틀 바 -->
                <div style="padding:6px 12px;background:rgba(30,41,59,0.7);border-bottom:1px solid rgba(255,255,255,0.08);display:flex;justify-content:space-between;align-items:center;">
                    <div style="font-size:0.75rem;font-weight:800;color:#cbd5e1;display:flex;align-items:center;gap:6px;">
                        <span>⛳ DY GOLF 핸디표</span>
                        <span id="ghandicap-current-date" style="font-size:0.65rem;color:#64748b;font-weight:600;"></span>
                    </div>
                    <span style="font-size:0.65rem;color:#38bdf8;font-weight:700;background:rgba(56,189,248,0.12);padding:1px 6px;border-radius:4px;">📱 캡처 최적화</span>
                </div>

                <!-- 테이블 헤더 -->
                <div style="display:grid;grid-template-columns:minmax(72px,1fr) 66px 66px 44px 46px 48px 30px;
                            padding:6px 8px;align-items:center;
                            background:linear-gradient(90deg,rgba(99,102,241,0.22),rgba(139,92,246,0.15));
                            border-bottom:1px solid rgba(99,102,241,0.3);
                            font-size:0.68rem;font-weight:800;letter-spacing:0.01em;">
                    <div style="color:#e2e8f0;">👥 멤버</div>
                    <div style="text-align:center;color:#c084fc;">⛳ NX4</div>
                    <div style="text-align:center;color:#38bdf8;">🌐 글로벌</div>
                    <div style="text-align:center;color:#a78bfa;">📊 평균</div>
                    <div style="text-align:center;color:#f59e0b;">🔒 최저</div>
                    <div style="text-align:center;color:#34d399;">🏆 최종</div>
                    <div style="text-align:center;color:#94a3b8;">저장</div>
                </div>
                <!-- 멤버 행 목록 -->
                <div id="ghandicap-members-container">
                    <div class="text-center text-muted" style="padding:24px;">⏳ 핸디 정보 불러오는 중...</div>
                </div>
            </div>

            <!-- [우측] 모임 핸디 요약 & 카톡 공유 & 규정 가이드 패널 -->
            <div style="display:flex;flex-direction:column;gap:12px;">
                
                <!-- 1. 카톡 공지용 텍스트 원클릭 복사 카드 -->
                <div style="background:linear-gradient(135deg,rgba(30,41,59,0.7),rgba(15,23,42,0.85));border:1px solid rgba(56,189,248,0.3);border-radius:14px;padding:14px;box-shadow:0 4px 18px rgba(0,0,0,0.2);">
                    <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:10px;">
                        <div style="font-weight:800;font-size:0.85rem;color:#38bdf8;display:flex;align-items:center;gap:6px;">
                            <span>📋 카톡 공지용 텍스트</span>
                            <span style="font-size:0.68rem;color:#94a3b8;font-weight:normal;">(원클릭 복사)</span>
                        </div>
                        <button onclick="GHandicapPage.copyKakaoText()" class="btn btn-sm"
                                style="font-size:0.72rem;padding:4px 12px;border-radius:7px;background:linear-gradient(135deg,#f59e0b,#d97706);color:#fff;font-weight:800;border:none;box-shadow:0 2px 8px rgba(245,158,11,0.3);cursor:pointer;">
                            💬 카톡 텍스트 복사
                        </button>
                    </div>
                    <textarea id="ghandicap-kakao-preview" readonly
                              style="width:100%;height:100px;background:rgba(15,23,42,0.9);border:1px solid rgba(255,255,255,0.1);border-radius:8px;color:#e2e8f0;font-size:0.75rem;font-family:monospace;padding:8px;resize:none;outline:none;box-sizing:border-box;line-height:1.4;"></textarea>
                </div>

                <!-- 2. 클럽 핸디 요약 통계 카드 -->
                <div style="background:rgba(15,23,42,0.75);border:1px solid rgba(139,92,246,0.3);border-radius:14px;padding:14px;box-shadow:0 4px 18px rgba(0,0,0,0.2);">
                    <div style="font-weight:800;font-size:0.85rem;color:#c084fc;margin-bottom:10px;display:flex;align-items:center;gap:6px;">
                        <span>📊 클럽 핸디 통계 및 분포</span>
                    </div>
                    <div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(110px,1fr));gap:8px;margin-bottom:10px;">
                        <div style="background:rgba(30,41,59,0.6);border:1px solid rgba(255,255,255,0.06);border-radius:8px;padding:8px 10px;text-align:center;">
                            <div style="font-size:0.68rem;color:#94a3b8;font-weight:600;">등록 멤버</div>
                            <div id="stat-total-count" style="font-size:1.05rem;font-weight:800;color:#f8fafc;margin-top:2px;">-</div>
                        </div>
                        <div style="background:rgba(30,41,59,0.6);border:1px solid rgba(255,255,255,0.06);border-radius:8px;padding:8px 10px;text-align:center;">
                            <div style="font-size:0.68rem;color:#94a3b8;font-weight:600;">클럽 평균 핸디</div>
                            <div id="stat-avg-handicap" style="font-size:1.05rem;font-weight:800;color:#38bdf8;margin-top:2px;">-</div>
                        </div>
                        <div style="background:rgba(30,41,59,0.6);border:1px solid rgba(255,255,255,0.06);border-radius:8px;padding:8px 10px;text-align:center;">
                            <div style="font-size:0.68rem;color:#94a3b8;font-weight:600;">👑 최저 핸디</div>
                            <div id="stat-min-handicap" style="font-size:1.05rem;font-weight:800;color:#34d399;margin-top:2px;">-</div>
                        </div>
                    </div>
                    <!-- 등급별 분포 바 -->
                    <div style="background:rgba(30,41,59,0.4);border:1px solid rgba(255,255,255,0.05);border-radius:8px;padding:8px 10px;">
                        <div style="font-size:0.68rem;color:#94a3b8;font-weight:700;margin-bottom:6px;">핸디 등급 분포</div>
                        <div style="display:flex;justify-content:space-between;font-size:0.72rem;font-weight:700;">
                            <span style="color:#34d399;">싱글 (≤9): <b id="stat-single-count">0명</b></span>
                            <span style="color:#38bdf8;">미드 (10~15): <b id="stat-mid-count">0명</b></span>
                            <span style="color:#f59e0b;">하이 (≥16): <b id="stat-high-count">0명</b></span>
                        </div>
                    </div>
                </div>

                <!-- 3. 핸디 산출 규정 안내 가이드 카드 -->
                <div style="background:rgba(15,23,42,0.7);border:1px solid rgba(255,255,255,0.08);border-radius:14px;padding:12px 14px;">
                    <div style="font-weight:800;font-size:0.8rem;color:#94a3b8;margin-bottom:8px;display:flex;align-items:center;gap:6px;">
                        <span>📜 핸디 산출 규정 (2026 개정)</span>
                    </div>
                    <ul style="margin:0;padding-left:16px;font-size:0.72rem;color:#cbd5e1;line-height:1.5;">
                        <li><b>기본 산출</b>: 선택된 NX4 핸디와 글로벌 핸디의 2개 평균 기준</li>
                        <li><b style="color:#38bdf8;">평균 5 이하</b>: <b>반올림(Math.round)</b> 적용 (예: 3.3→3, 4.6→5)</li>
                        <li><b style="color:#f59e0b;">평균 6~15</b>: <b>내림(Math.floor)</b> 적용 (예: 6.3→6, 9.1→9, 13.4→13)</li>
                        <li><b style="color:#c084fc;">평균 15 초과</b>: <b>내림 & 상승 불가 (최저핸디 하한 유지)</b></li>
                        <li><b style="color:#34d399;">최저핸디 갱신</b>: 평균이 최저핸디보다 낮아지면(개선 시) 최종핸디 자동 하향</li>
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

    renderMemberList() {
        const container = document.getElementById('ghandicap-members-container');
        if (!container) return;

        if (this.members.length === 0) {
            container.innerHTML = `<div class="empty-state" style="padding:30px 15px;"><div class="empty-icon">👥</div><p class="empty-text">등록된 활동 멤버가 없습니다</p></div>`;
            return;
        }

        // ── 정렬 ──
        const getHandicapVal = (m) => {
            const cfg = this.configs[m.id] || {};
            const v = cfg.finalHandicap !== undefined && cfg.finalHandicap !== null && cfg.finalHandicap !== ''
                ? cfg.finalHandicap
                : (m.ghandicap !== undefined && m.ghandicap !== null && m.ghandicap !== '' ? m.ghandicap : null);
            return v !== null ? Number(v) : Infinity;
        };
        const sorted = [...this.members].sort((a, b) => {
            if (this.sortMode === 'handicap_asc') return getHandicapVal(a) - getHandicapVal(b);
            if (this.sortMode === 'handicap_desc') return getHandicapVal(b) - getHandicapVal(a);
            return a.name.localeCompare(b.name, 'ko');
        });

        // ── 정렬 버튼 활성 스타일 ──
        this._updateSortButtons();

        let html = '';
        sorted.forEach((m, idx) => {
            const cfg = this.configs[m.id] || {};
            // 아바타 텍스트: 2글자로 컴팩트하게 통일
            const avatarText = m.name.length >= 2 ? m.name.slice(-2) : m.name;

            const normalHandi = cfg.golfzonHandi !== undefined && cfg.golfzonHandi !== '' && cfg.golfzonHandi !== null ? cfg.golfzonHandi : '';
            const globalHandi = cfg.globalHandi !== undefined && cfg.globalHandi !== '' && cfg.globalHandi !== null ? cfg.globalHandi : '';
            const baseHandi = cfg.baseHandicap !== undefined && cfg.baseHandicap !== '' && cfg.baseHandicap !== null ? cfg.baseHandicap : '';
            const useNormal = cfg.useGolfzon !== undefined ? cfg.useGolfzon : true;
            const useGlobal = cfg.useGlobal !== undefined ? cfg.useGlobal : true;

            const currentHandicap = cfg.finalHandicap !== undefined && cfg.finalHandicap !== null && cfg.finalHandicap !== ''
                ? cfg.finalHandicap
                : (m.ghandicap !== undefined && m.ghandicap !== null && m.ghandicap !== '' ? m.ghandicap : null);

            const rowBg = idx % 2 === 0 ? 'rgba(30,41,59,0.45)' : 'rgba(15,23,42,0.35)';

            html += `
            <div id="ghrow-${m.id}"
                 style="display:grid;grid-template-columns:minmax(72px,1fr) 66px 66px 44px 46px 48px 30px;
                        padding:4px 8px;min-height:38px;align-items:center;
                        background:${rowBg};border-bottom:1px solid rgba(255,255,255,0.04);
                        transition:background 0.12s;"
                 onmouseover="this.style.background='rgba(99,102,241,0.1)'"
                 onmouseout="this.style.background='${rowBg}'">

                <!-- 멤버 프로필 (컴팩트: 2글자 아바타 + 이름) -->
                <div style="display:flex;align-items:center;gap:5px;min-width:0;" title="${Utils.escapeHtml(m.nickname ? `${m.name} (${m.nickname})` : m.name)}">
                    <div style="height:20px;width:20px;font-size:0.58rem;font-weight:800;border-radius:6px;
                                background:linear-gradient(135deg,#6366f1,#8b5cf6);color:#fff;
                                display:inline-flex;align-items:center;justify-content:center;white-space:nowrap;flex-shrink:0;">
                        ${avatarText}
                    </div>
                    <span style="font-weight:700;font-size:0.8rem;color:#f8fafc;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;">
                        ${Utils.escapeHtml(m.name)}
                    </span>
                </div>

                <!-- 1. NX4 핸드 -->
                <div style="display:flex;align-items:center;justify-content:center;gap:3px;">
                    <input type="checkbox" id="chk-normal-${m.id}" ${useNormal ? 'checked' : ''}
                           onchange="GHandicapPage.toggleInput(${m.id}, 'normal')"
                           title="NX4 핸드 포함"
                           style="cursor:pointer;accent-color:#c084fc;width:12px;height:12px;flex-shrink:0;margin:0;">
                    <input type="number" step="0.01" min="-30" max="50" inputmode="decimal" id="val-normal-${m.id}" value="${normalHandi}"
                           placeholder="-" ${!useNormal ? 'disabled' : ''}
                           oninput="GHandicapPage.recalc(${m.id})"
                           style="width:46px;height:25px;text-align:center;padding:0;font-size:0.82rem;
                                  font-weight:800;color:#fff;background:rgba(15,23,42,0.9);
                                  border:1px solid rgba(192,132,252,0.45);border-radius:5px;box-sizing:border-box;
                                  outline:none;-moz-appearance:textfield;${!useNormal ? 'opacity:0.3;cursor:not-allowed;' : 'cursor:text;'}">
                </div>

                <!-- 2. 글로벌핸디 -->
                <div style="display:flex;align-items:center;justify-content:center;gap:3px;">
                    <input type="checkbox" id="chk-global-${m.id}" ${useGlobal ? 'checked' : ''}
                           onchange="GHandicapPage.toggleInput(${m.id}, 'global')"
                           title="글로벌핸디 포함"
                           style="cursor:pointer;accent-color:#38bdf8;width:12px;height:12px;flex-shrink:0;margin:0;">
                    <input type="number" step="0.01" min="-30" max="50" inputmode="decimal" id="val-global-${m.id}" value="${globalHandi}"
                           placeholder="-" ${!useGlobal ? 'disabled' : ''}
                           oninput="GHandicapPage.recalc(${m.id})"
                           style="width:46px;height:25px;text-align:center;padding:0;font-size:0.82rem;
                                  font-weight:800;color:#fff;background:rgba(15,23,42,0.9);
                                  border:1px solid rgba(56,189,248,0.45);border-radius:5px;box-sizing:border-box;
                                  outline:none;-moz-appearance:textfield;${!useGlobal ? 'opacity:0.3;cursor:not-allowed;' : 'cursor:text;'}">
                </div>

                <!-- 3. 평균 표시 -->
                <div style="display:flex;align-items:center;justify-content:center;">
                    <div id="disp-avg-${m.id}"
                         style="width:40px;height:25px;display:flex;align-items:center;justify-content:center;
                                background:rgba(15,23,42,0.7);border:1px solid rgba(167,139,250,0.3);
                                border-radius:5px;font-size:0.8rem;font-weight:800;color:#a78bfa;">—</div>
                </div>

                <!-- 4. 최저핸디 입력 -->
                <div style="display:flex;align-items:center;justify-content:center;">
                    <input type="number" step="1" min="0" max="50" inputmode="numeric" id="val-base-${m.id}" value="${baseHandi}"
                           placeholder="-"
                           oninput="GHandicapPage.recalc(${m.id})"
                           title="최저핸디 (하한 기준값)"
                           style="width:40px;height:25px;text-align:center;padding:0;font-size:0.82rem;
                                  font-weight:800;color:#f59e0b;background:rgba(15,23,42,0.9);
                                  border:1px solid rgba(245,158,11,0.45);border-radius:5px;box-sizing:border-box;
                                  outline:none;-moz-appearance:textfield;cursor:text;">
                </div>

                <!-- 5. 최종핸디 표시 -->
                <div style="display:flex;flex-direction:column;align-items:center;justify-content:center;">
                    <div style="width:44px;height:25px;display:flex;align-items:center;justify-content:center;
                                background:rgba(15,23,42,0.9);border:1px solid rgba(52,211,153,0.5);
                                border-radius:5px;box-sizing:border-box;">
                        <span id="disp-final-${m.id}" style="font-size:0.88rem;font-weight:800;color:#34d399;">
                            ${currentHandicap !== null ? currentHandicap : '—'}
                        </span>
                    </div>
                    <div id="disp-info-${m.id}" style="font-size:0.52rem;font-weight:700;line-height:1;margin-top:1px;white-space:nowrap;color:#64748b;"></div>
                </div>

                <!-- 저장 버튼 -->
                <div style="text-align:center;display:flex;align-items:center;justify-content:center;">
                    <button class="btn btn-emerald btn-sm" onclick="GHandicapPage.saveSingle(${m.id})"
                            style="font-size:0.65rem;height:22px;padding:0 5px;white-space:nowrap;font-weight:700;border-radius:5px;">💾</button>
                </div>
            </div>
            `;
        });

        container.innerHTML = html;
        sorted.forEach(m => this.recalc(m.id, false));
        this.updateSidePanel();
    },

    /** 정렬 모드 변경 */
    setSort(mode) {
        this.sortMode = mode;
        this.renderMemberList();
    },

    /** 정렬 버튼 활성 스타일 업데이트 */
    _updateSortButtons() {
        const styles = {
            'handicap_asc': { id: 'sort-handicap-asc', active: 'rgba(52,211,153,0.35)', border: 'rgba(52,211,153,0.8)', color: '#34d399' },
            'handicap_desc': { id: 'sort-handicap-desc', active: 'rgba(99,102,241,0.3)', border: 'rgba(139,92,246,0.8)', color: '#c084fc' },
            'name': { id: 'sort-name', active: 'rgba(148,163,184,0.25)', border: 'rgba(148,163,184,0.7)', color: '#e2e8f0' }
        };
        Object.entries(styles).forEach(([mode, s]) => {
            const btn = document.getElementById(s.id);
            if (!btn) return;
            if (mode === this.sortMode) {
                btn.style.background = s.active;
                btn.style.borderColor = s.border;
                btn.style.color = s.color;
                btn.style.boxShadow = `0 0 8px ${s.active}`;
            } else {
                btn.style.background = '';
                btn.style.boxShadow = '';
            }
        });
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
        this.recalc(memberId);
    },

    /** G-핸디 (최종핸디) 보정 및 산출 공식 로직
     * ─── 1) 평균 ≤ 5 구간 ───
     * 1. Math.round(평균) 반올림 적용  예) 3.3→3, 4.6→5
     * ─── 2) 평균 6~15 구간 (5 < 평균 ≤ 15) ───
     * 2. Math.floor(평균) 내림 적용  예) 6.3→6, 9.1→9, 13.4→13, 14.1→14
     * ─── 3) 평균 > 15 구간 ───
     * 3. Math.floor(평균) 내림 적용 & 상승 불가 (최저핸디 하한 유지)
     * 최저핸디 기준: val-base(최저핸디) 인풋 우선, 없으면 cfg.baseHandicap
     */
    computeGHandicap(memberId) {
        const m = this.members.find(item => item.id === memberId);
        if (!m) return null;

        const cfg = this.configs[memberId] || {};

        // ── 최저핸디 (하한 기준값): val-base 인풋 우선, 없으면 cfg.baseHandicap ──
        let currentHandicapVal = null;
        const baseEl = document.getElementById(`val-base-${memberId}`);
        const baseStr = baseEl ? baseEl.value.trim() : (cfg.baseHandicap !== undefined && cfg.baseHandicap !== null ? String(cfg.baseHandicap) : '');
        if (baseStr !== '' && !isNaN(Number(baseStr))) {
            currentHandicapVal = Number(baseStr);
        }

        const chkNormal = document.getElementById(`chk-normal-${memberId}`);
        const valNormalEl = document.getElementById(`val-normal-${memberId}`);
        const useNormal = chkNormal ? chkNormal.checked : (cfg.useGolfzon !== undefined ? cfg.useGolfzon : true);
        const normalStr = valNormalEl ? valNormalEl.value.trim() : (cfg.golfzonHandi !== undefined && cfg.golfzonHandi !== null ? String(cfg.golfzonHandi) : '');
        const normalVal = normalStr !== '' && !isNaN(Number(normalStr)) ? Number(normalStr) : null;

        const chkGlobal = document.getElementById(`chk-global-${memberId}`);
        const valGlobalEl = document.getElementById(`val-global-${memberId}`);
        const useGlobal = chkGlobal ? chkGlobal.checked : (cfg.useGlobal !== undefined ? cfg.useGlobal : true);
        const globalStr = valGlobalEl ? valGlobalEl.value.trim() : (cfg.globalHandi !== undefined && cfg.globalHandi !== null ? String(cfg.globalHandi) : '');
        const globalVal = globalStr !== '' && !isNaN(Number(globalStr)) ? Number(globalStr) : null;

        let validCount = 0, sum = 0;
        if (useNormal && normalVal !== null) { sum += normalVal; validCount++; }
        if (useGlobal && globalVal !== null) { sum += globalVal; validCount++; }

        if (validCount === 0) {
            return {
                validCount: 0, rawAvg: null, computed: null, finalHandicap: currentHandicapVal,
                status: 'no_input', normalVal, globalVal, useNormal, useGlobal, currentHandicapVal
            };
        }

        const rawAvg = sum / validCount;
        const formattedAvg = Math.round(rawAvg * 10) / 10;

        let computed;
        let finalHandicap;
        let status = 'applied'; // 'applied' | 'guarded_stay'

        if (formattedAvg <= 5) {
            // ─ 1) 평균 ≤ 5: 반올림(Math.round) ─
            computed = Math.round(formattedAvg);
            finalHandicap = computed;
        } else if (formattedAvg <= 15) {
            // ─ 2) 평균 6~15 (5 < formattedAvg <= 15): 내림(Math.floor) ─
            computed = Math.floor(formattedAvg);
            finalHandicap = computed;
        } else {
            // ─ 3) 평균 > 15: 내림(Math.floor) & 상승 불가 (최저핸디 유지) ─
            computed = Math.floor(formattedAvg);
            finalHandicap = computed;
            if (currentHandicapVal !== null && computed >= currentHandicapVal) {
                // 상승하거나 같으면 최저핸디 유지
                finalHandicap = currentHandicapVal;
                status = 'guarded_stay';
            }
        }

        return { validCount, rawAvg: formattedAvg, computed, finalHandicap, status, normalVal, globalVal, useNormal, useGlobal, currentHandicapVal };
    },

    recalc(memberId, updatePanel = true) {
        const res = this.computeGHandicap(memberId);
        const dispFinal = document.getElementById(`disp-final-${memberId}`);
        const dispAvg = document.getElementById(`disp-avg-${memberId}`);
        const dispInfo = document.getElementById(`disp-info-${memberId}`);
        if (!res || !dispFinal) return;

        // ── 평균 열 업데이트 ──
        if (dispAvg) {
            if (res.rawAvg !== null) {
                dispAvg.textContent = res.rawAvg;
                dispAvg.style.color = '#a78bfa';
            } else {
                dispAvg.textContent = '—';
                dispAvg.style.color = '#475569';
            }
        }

        if (res.status === 'no_input') {
            dispFinal.textContent = res.finalHandicap !== null ? res.finalHandicap : '—';
            dispFinal.style.color = '#64748b';
            if (dispInfo) dispInfo.textContent = '';
            if (updatePanel) this.updateSidePanel();
            return;
        }

        dispFinal.textContent = res.finalHandicap !== null ? res.finalHandicap : '—';

        if (res.status === 'guarded_max15') {
            dispFinal.style.color = '#f59e0b';
            if (dispInfo) { dispInfo.textContent = '🛡️ 맥스15'; dispInfo.style.color = '#f59e0b'; }
        } else if (res.status === 'guarded_stay') {
            dispFinal.style.color = '#f59e0b';
            if (dispInfo) { dispInfo.textContent = '🛡️ 유지'; dispInfo.style.color = '#f59e0b'; }
        } else {
            dispFinal.style.color = '#34d399';
            if (dispInfo) {
                const arrow = res.currentHandicapVal !== null ? `${res.currentHandicapVal}→${res.finalHandicap}` : '✅갱신';
                dispInfo.textContent = arrow;
                dispInfo.style.color = '#34d399';
            }
        }

        if (updatePanel) {
            this.updateSidePanel();
        }
    },

    /** 우측 통계 및 카톡 공유 텍스트 실시간 갱신 */
    updateSidePanel() {
        if (!this.members || this.members.length === 0) return;

        let totalHandi = 0;
        let validHandiCount = 0;
        let minHandi = Infinity;
        let minHandiMember = '-';

        let singleCount = 0; // <= 9
        let midCount = 0;    // 10 ~ 15
        let highCount = 0;   // >= 16

        const lines = [];
        const now = new Date();
        const dateStr = `${now.getFullYear()}.${String(now.getMonth()+1).padStart(2,'0')}.${String(now.getDate()).padStart(2,'0')}`;

        lines.push(`⛳ [DY GOLF] 멤버별 핸디표`);
        lines.push(`📅 기준일: ${dateStr}`);
        lines.push(`━━━━━━━━━━━━━━━━`);

        // 현재 정렬 순서대로 목록 생성
        const getFinalVal = (m) => {
            const dispElem = document.getElementById(`disp-final-${m.id}`);
            if (dispElem && dispElem.textContent.trim() !== '—') {
                const num = Number(dispElem.textContent.trim());
                if (!isNaN(num)) return num;
            }
            const cfg = this.configs[m.id] || {};
            const v = cfg.finalHandicap !== undefined && cfg.finalHandicap !== null && cfg.finalHandicap !== ''
                ? cfg.finalHandicap
                : (m.ghandicap !== undefined && m.ghandicap !== null && m.ghandicap !== '' ? m.ghandicap : null);
            return v !== null ? Number(v) : null;
        };

        const sorted = [...this.members].sort((a, b) => {
            const vA = getFinalVal(a) ?? 999;
            const vB = getFinalVal(b) ?? 999;
            if (this.sortMode === 'handicap_asc') return vA - vB;
            if (this.sortMode === 'handicap_desc') return vB - vA;
            return a.name.localeCompare(b.name, 'ko');
        });

        sorted.forEach((m, idx) => {
            const hVal = getFinalVal(m);
            const rank = idx + 1;
            const rankEmoji = rank === 1 ? '🥇' : (rank === 2 ? '🥈' : (rank === 3 ? '🥉' : '▪️'));

            if (hVal !== null) {
                totalHandi += hVal;
                validHandiCount++;

                if (hVal < minHandi) {
                    minHandi = hVal;
                    minHandiMember = m.name;
                }

                if (hVal <= 9) singleCount++;
                else if (hVal <= 15) midCount++;
                else highCount++;

                lines.push(`${rankEmoji} ${m.name} : ${hVal}`);
            } else {
                lines.push(`${rankEmoji} ${m.name} : 미정`);
            }
        });

        const avgHandi = validHandiCount > 0 ? (totalHandi / validHandiCount).toFixed(1) : '-';

        lines.push(`━━━━━━━━━━━━━━━━`);
        lines.push(`📊 인원: ${this.members.length}명 / 평균: ${avgHandi}`);

        // DOM 통계 업데이트
        const elTotal = document.getElementById('stat-total-count');
        const elAvg = document.getElementById('stat-avg-handicap');
        const elMin = document.getElementById('stat-min-handicap');
        const elSingle = document.getElementById('stat-single-count');
        const elMid = document.getElementById('stat-mid-count');
        const elHigh = document.getElementById('stat-high-count');
        const elPreview = document.getElementById('ghandicap-kakao-preview');

        if (elTotal) elTotal.textContent = `${this.members.length}명`;
        if (elAvg) elAvg.textContent = `${avgHandi}`;
        if (elMin) elMin.textContent = minHandi !== Infinity ? `${minHandiMember} (${minHandi})` : '-';
        if (elSingle) elSingle.textContent = `${singleCount}명`;
        if (elMid) elMid.textContent = `${midCount}명`;
        if (elHigh) elHigh.textContent = `${highCount}명`;

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
                // fallback
                elPreview.select();
                document.execCommand('copy');
                Utils.toast('📋 카톡 공지용 텍스트가 복사되었습니다!', 'success');
            });
    },

    async saveSingle(memberId) {
        const m = this.members.find(item => item.id === memberId);
        if (!m) return;

        const res = this.computeGHandicap(memberId);
        const useNormal = document.getElementById(`chk-normal-${memberId}`)?.checked ?? true;
        const useGlobal = document.getElementById(`chk-global-${memberId}`)?.checked ?? true;
        const normalHandiVal = document.getElementById(`val-normal-${memberId}`)?.value.trim() || '';
        const globalHandiVal = document.getElementById(`val-global-${memberId}`)?.value.trim() || '';
        const baseHandiVal = document.getElementById(`val-base-${memberId}`)?.value.trim() || '';

        const configData = {
            useGolfzon: useNormal,
            useGlobal: useGlobal,
            golfzonId: '',
            globalId: '',
            golfzonHandi: normalHandiVal !== '' && !isNaN(Number(normalHandiVal)) ? Number(normalHandiVal) : '',
            globalHandi: globalHandiVal !== '' && !isNaN(Number(globalHandiVal)) ? Number(globalHandiVal) : '',
            baseHandicap: baseHandiVal !== '' && !isNaN(Number(baseHandiVal)) ? Number(baseHandiVal) : '',
            finalHandicap: res ? res.finalHandicap : m.ghandicap
        };

        this.configs[memberId] = configData;
        await Store.saveGHandicapConfig(memberId, configData);
        await Store.updateMember(memberId, { ghandicap: configData.finalHandicap });

        const dispElem = document.getElementById(`disp-final-${memberId}`);
        if (dispElem) {
            dispElem.textContent = configData.finalHandicap !== null && configData.finalHandicap !== ''
                ? configData.finalHandicap : '—';
        }

        // 저장 완료 행 하이라이트
        const row = document.getElementById(`ghrow-${memberId}`);
        if (row) {
            row.style.background = 'rgba(16,185,129,0.18)';
            setTimeout(() => { row.style.background = ''; }, 1200);
        }

        this.updateSidePanel();
        Utils.toast(`[${m.name}] 최종핸디 ${configData.finalHandicap} 저장 완료!`, 'success');
    },

    async saveAll() {
        if (this.members.length === 0) return;
        Utils.toast('전체 저장 중...', 'info');
        for (const m of this.members) {
            await this.saveSingle(m.id);
        }
        this.updateSidePanel();
        Utils.toast('모든 멤버의 최종핸디가 저장되었습니다!', 'success');
    }
};

Router.register('ghandicap', GHandicapPage);
window.GHandicapPage = GHandicapPage;
