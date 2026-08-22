/* ============================================
   GHANDICAP.JS — 멤버별 핸디 통합 관리 (NX4 핸드 + 글로벌핸디 ➔ 최종핸디)
   규칙:
   1. NX4 핸드 + 글로벌핸디 2개 평균 기준
   ─── 평균 ≤ 5 구간 ───
   2. 반올림(Math.round) 적용  예) 3.3→3, 4.6→5
   3. 상승 가능 (맥스 5, 5 초과 불가)
   ─── 평균 > 5 구간 ───
   4. 내림(Math.floor) 적용  예) 6.5→6, 6.8→6
   5. 상승 불가 — 기존 최종핸디에서 더 올라갈 수 없음 (내림만 반영)
   6. 기존 최종핸디 기준: cfg.finalHandicap 우선, 없으면 m.ghandicap
   ============================================ */

const GHandicapPage = {
    configs: {},
    members: [],
    sortMode: 'handicap_asc',  // 'handicap_asc' | 'handicap_desc' | 'name'

    async render() {
        return `
        <!-- 페이지 헤더 -->
        <div style="background:linear-gradient(135deg,rgba(30,41,59,0.85),rgba(15,23,42,0.95));border:1px solid rgba(99,102,241,0.3);border-radius:14px;padding:12px 16px;margin-bottom:12px;box-shadow:0 4px 20px rgba(0,0,0,0.25);">
            <div style="display:flex;justify-content:space-between;align-items:center;flex-wrap:wrap;gap:10px;">
                <div style="display:flex;align-items:center;gap:10px;">
                    <div style="width:34px;height:34px;border-radius:10px;background:linear-gradient(135deg,#6366f1,#8b5cf6);display:flex;align-items:center;justify-content:center;font-size:1.15rem;flex-shrink:0;">🏆</div>
                    <div>
                        <div style="font-weight:800;font-size:1rem;color:#f8fafc;">멤버별 핸디 통합 관리</div>
                        <div style="display:flex;flex-wrap:wrap;gap:6px;margin-top:4px;">
                            <span style="font-size:0.7rem;padding:2px 8px;border-radius:20px;background:rgba(192,132,252,0.15);border:1px solid rgba(192,132,252,0.35);color:#c084fc;font-weight:700;">평균산출</span>
                            <span style="font-size:0.7rem;padding:2px 8px;border-radius:20px;background:rgba(56,189,248,0.12);border:1px solid rgba(56,189,248,0.3);color:#38bdf8;font-weight:700;">≤5 반올림·상승</span>
                            <span style="font-size:0.7rem;padding:2px 8px;border-radius:20px;background:rgba(52,211,153,0.1);border:1px solid rgba(52,211,153,0.3);color:#34d399;font-weight:700;">&gt;5 내림·기존유지</span>
                        </div>
                    </div>
                </div>
                <div style="display:flex;align-items:center;gap:6px;flex-wrap:wrap;">
                    <span style="font-size:0.7rem;color:#64748b;font-weight:600;">정렬:</span>
                    <button id="sort-handicap-asc" onclick="GHandicapPage.setSort('handicap_asc')"
                            style="font-size:0.7rem;padding:3px 10px;border-radius:20px;border:1px solid rgba(52,211,153,0.5);background:rgba(52,211,153,0.15);color:#34d399;font-weight:700;cursor:pointer;transition:all 0.15s;">🏆 낮음↑</button>
                    <button id="sort-handicap-desc" onclick="GHandicapPage.setSort('handicap_desc')"
                            style="font-size:0.7rem;padding:3px 10px;border-radius:20px;border:1px solid rgba(99,102,241,0.35);background:rgba(99,102,241,0.1);color:#a78bfa;font-weight:700;cursor:pointer;transition:all 0.15s;">🏆 높음↓</button>
                    <button id="sort-name" onclick="GHandicapPage.setSort('name')"
                            style="font-size:0.7rem;padding:3px 10px;border-radius:20px;border:1px solid rgba(148,163,184,0.3);background:rgba(148,163,184,0.08);color:#94a3b8;font-weight:700;cursor:pointer;transition:all 0.15s;">👤 이름순</button>
                    <button class="btn btn-primary" id="btn-save-all-ghandicap" style="font-weight:700;padding:6px 16px;font-size:0.82rem;border-radius:9px;white-space:nowrap;">💾 전체 저장</button>
                </div>
            </div>
        </div>

        <!-- 멤버 핸디 관리 테이블 -->
        <div style="background:rgba(15,23,42,0.8);border:1px solid rgba(99,102,241,0.3);border-radius:14px;overflow:hidden;box-shadow:0 6px 24px rgba(0,0,0,0.28);">
            <!-- 테이블 헤더 -->
            <div style="display:grid;grid-template-columns:minmax(120px,1.4fr) 1fr 1fr 0.8fr 1fr 1fr 64px;
                        padding:8px 14px;align-items:center;
                        background:linear-gradient(90deg,rgba(99,102,241,0.18),rgba(139,92,246,0.12));
                        border-bottom:1px solid rgba(99,102,241,0.3);
                        font-size:0.73rem;font-weight:800;letter-spacing:0.03em;">
                <div style="color:#e2e8f0;">👥 멤버</div>
                <div style="text-align:center;color:#c084fc;">⛳ NX4</div>
                <div style="text-align:center;color:#38bdf8;">🌐 글로벌</div>
                <div style="text-align:center;color:#a78bfa;">📊 평균</div>
                <div style="text-align:center;color:#f59e0b;">🔒 기준핸드</div>
                <div style="text-align:center;color:#34d399;">🏆 최종핸디</div>
                <div style="text-align:center;color:#94a3b8;">저장</div>
            </div>
            <!-- 멤버 행 목록 -->
            <div id="ghandicap-members-container">
                <div class="text-center text-muted" style="padding:30px;">⏳ 핸디 정보 불러오는 중...</div>
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
        } catch(e) {
            console.error('GHandicapPage afterRender error:', e);
            this.members = [];
            this.configs = {};
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
            container.innerHTML = `<div class="empty-state" style="padding:40px 20px;"><div class="empty-icon">👥</div><p class="empty-text">등록된 활동 멤버가 없습니다</p></div>`;
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
            if (this.sortMode === 'handicap_asc')  return getHandicapVal(a) - getHandicapVal(b);
            if (this.sortMode === 'handicap_desc') return getHandicapVal(b) - getHandicapVal(a);
            return a.name.localeCompare(b.name, 'ko');
        });

        // ── 정렬 버튼 활성 스타일 ──
        this._updateSortButtons();

        let html = '';
        sorted.forEach((m, idx) => {
            const cfg = this.configs[m.id] || {};
            const avatarText = m.nickname
                ? Utils.escapeHtml(m.nickname)
                : (m.name.length >= 3 ? m.name.slice(-2) : m.name);

            const normalHandi = cfg.golfzonHandi !== undefined && cfg.golfzonHandi !== '' && cfg.golfzonHandi !== null ? cfg.golfzonHandi : '';
            const globalHandi = cfg.globalHandi  !== undefined && cfg.globalHandi  !== '' && cfg.globalHandi  !== null ? cfg.globalHandi  : '';
            const baseHandi   = cfg.baseHandicap  !== undefined && cfg.baseHandicap  !== '' && cfg.baseHandicap  !== null ? cfg.baseHandicap  : '';
            const useNormal   = cfg.useGolfzon !== undefined ? cfg.useGolfzon : true;
            const useGlobal   = cfg.useGlobal  !== undefined ? cfg.useGlobal  : true;

            const currentHandicap = cfg.finalHandicap !== undefined && cfg.finalHandicap !== null && cfg.finalHandicap !== ''
                ? cfg.finalHandicap
                : (m.ghandicap !== undefined && m.ghandicap !== null && m.ghandicap !== '' ? m.ghandicap : null);

            const rowBg = idx % 2 === 0 ? 'rgba(30,41,59,0.4)' : 'rgba(15,23,42,0.3)';

            html += `
            <div id="ghrow-${m.id}"
                 style="display:grid;grid-template-columns:minmax(120px,1.4fr) 1fr 1fr 0.8fr 1fr 1fr 64px;
                        padding:5px 14px;min-height:44px;align-items:center;
                        background:${rowBg};border-bottom:1px solid rgba(255,255,255,0.05);
                        transition:background 0.12s;"
                 onmouseover="this.style.background='rgba(99,102,241,0.1)'"
                 onmouseout="this.style.background='${rowBg}'">

                <!-- 멤버 프로필 -->
                <div style="display:flex;align-items:center;gap:8px;min-width:0;">
                    <div style="height:28px;min-width:36px;padding:0 8px;font-size:0.72rem;font-weight:800;border-radius:14px;
                                background:linear-gradient(135deg,#6366f1,#8b5cf6);color:#fff;
                                display:inline-flex;align-items:center;justify-content:center;white-space:nowrap;flex-shrink:0;">
                        ${avatarText}
                    </div>
                    <span style="font-weight:700;font-size:0.85rem;color:#f8fafc;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;">
                        ${Utils.escapeHtml(m.name)}
                    </span>
                </div>

                <!-- 1. NX4 핸드 -->
                <div style="display:flex;align-items:center;justify-content:center;gap:4px;">
                    <input type="checkbox" id="chk-normal-${m.id}" ${useNormal ? 'checked' : ''}
                           onchange="GHandicapPage.toggleInput(${m.id}, 'normal')"
                           title="NX4 핸드 포함 여부"
                           style="cursor:pointer;accent-color:#c084fc;width:14px;height:14px;flex-shrink:0;">
                    <input type="number" step="0.01" min="-30" max="50" inputmode="decimal" id="val-normal-${m.id}" value="${normalHandi}"
                           placeholder="-" ${!useNormal ? 'disabled' : ''}
                           oninput="GHandicapPage.recalc(${m.id})"
                           onfocus="this.style.borderColor='#c084fc';this.style.boxShadow='0 0 8px rgba(192,132,252,0.4)';this.select();"
                           onblur="this.style.borderColor='rgba(192,132,252,0.5)';this.style.boxShadow='none';"
                           style="width:72px;height:28px;text-align:center;padding:0 4px;font-size:0.85rem;
                                  font-weight:800;color:#fff;background:rgba(15,23,42,0.9);
                                  border:1.5px solid rgba(192,132,252,0.5);border-radius:7px;box-sizing:border-box;
                                  outline:none;transition:all 0.18s;${!useNormal ? 'opacity:0.35;cursor:not-allowed;' : 'cursor:text;'}">
                </div>

                <!-- 2. 글로벌핸디 -->
                <div style="display:flex;align-items:center;justify-content:center;gap:4px;">
                    <input type="checkbox" id="chk-global-${m.id}" ${useGlobal ? 'checked' : ''}
                           onchange="GHandicapPage.toggleInput(${m.id}, 'global')"
                           title="글로벌핸디 포함 여부"
                           style="cursor:pointer;accent-color:#38bdf8;width:14px;height:14px;flex-shrink:0;">
                    <input type="number" step="0.01" min="-30" max="50" inputmode="decimal" id="val-global-${m.id}" value="${globalHandi}"
                           placeholder="-" ${!useGlobal ? 'disabled' : ''}
                           oninput="GHandicapPage.recalc(${m.id})"
                           onfocus="this.style.borderColor='#38bdf8';this.style.boxShadow='0 0 8px rgba(56,189,248,0.4)';this.select();"
                           onblur="this.style.borderColor='rgba(56,189,248,0.5)';this.style.boxShadow='none';"
                           style="width:72px;height:28px;text-align:center;padding:0 4px;font-size:0.85rem;
                                  font-weight:800;color:#fff;background:rgba(15,23,42,0.9);
                                  border:1.5px solid rgba(56,189,248,0.5);border-radius:7px;box-sizing:border-box;
                                  outline:none;transition:all 0.18s;${!useGlobal ? 'opacity:0.35;cursor:not-allowed;' : 'cursor:text;'}">
                </div>

                <!-- 3. 평균 표시 -->
                <div style="display:flex;align-items:center;justify-content:center;">
                    <div id="disp-avg-${m.id}"
                         style="width:64px;height:28px;display:flex;align-items:center;justify-content:center;
                                background:rgba(15,23,42,0.7);border:1.5px solid rgba(167,139,250,0.35);
                                border-radius:7px;font-size:0.82rem;font-weight:800;color:#a78bfa;
                                letter-spacing:-0.02em;">—</div>
                </div>

                <!-- 4. 기준핸드 입력 -->
                <div style="display:flex;align-items:center;justify-content:center;">
                    <input type="number" step="1" min="0" max="50" inputmode="numeric" id="val-base-${m.id}" value="${baseHandi}"
                           placeholder="-"
                           oninput="GHandicapPage.recalc(${m.id})"
                           onfocus="this.style.borderColor='#f59e0b';this.style.boxShadow='0 0 8px rgba(245,158,11,0.4)';this.select();"
                           onblur="this.style.borderColor='rgba(245,158,11,0.4)';this.style.boxShadow='none';"
                           title="기준핸드 (하한 기준값)"
                           style="width:64px;height:28px;text-align:center;padding:0 4px;font-size:0.85rem;
                                  font-weight:800;color:#f59e0b;background:rgba(15,23,42,0.9);
                                  border:1.5px solid rgba(245,158,11,0.4);border-radius:7px;box-sizing:border-box;
                                  outline:none;transition:all 0.18s;cursor:text;">
                </div>

                <!-- 5. 최종핸디 표시 -->
                <div style="display:flex;flex-direction:column;align-items:center;justify-content:center;gap:1px;">
                    <div style="width:64px;height:28px;display:flex;align-items:center;justify-content:center;
                                background:rgba(15,23,42,0.9);border:1.5px solid rgba(52,211,153,0.5);
                                border-radius:7px;box-sizing:border-box;">
                        <span id="disp-final-${m.id}" style="font-size:1rem;font-weight:800;color:#34d399;">
                            ${currentHandicap !== null ? currentHandicap : '—'}
                        </span>
                    </div>
                    <div id="disp-info-${m.id}" style="font-size:0.58rem;font-weight:600;min-height:11px;white-space:nowrap;color:#64748b;"></div>
                </div>

                <!-- 저장 버튼 -->
                <div style="text-align:center;display:flex;align-items:center;justify-content:center;">
                    <button class="btn btn-emerald btn-sm" onclick="GHandicapPage.saveSingle(${m.id})"
                            style="font-size:0.7rem;height:26px;padding:0 10px;white-space:nowrap;font-weight:700;border-radius:6px;">💾</button>
                </div>
            </div>
            `;
        });

        container.innerHTML = html;
        sorted.forEach(m => this.recalc(m.id));
    },

    /** 정렬 모드 변경 */
    setSort(mode) {
        this.sortMode = mode;
        this.renderMemberList();
    },

    /** 정렬 버튼 활성 스타일 업데이트 */
    _updateSortButtons() {
        const styles = {
            'handicap_asc':  { id: 'sort-handicap-asc',  active: 'rgba(52,211,153,0.35)',  border: 'rgba(52,211,153,0.8)',  color: '#34d399' },
            'handicap_desc': { id: 'sort-handicap-desc', active: 'rgba(99,102,241,0.3)',   border: 'rgba(139,92,246,0.8)',  color: '#c084fc' },
            'name':          { id: 'sort-name',          active: 'rgba(148,163,184,0.25)', border: 'rgba(148,163,184,0.7)', color: '#e2e8f0' }
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
     * ─── 평균 ≤ 5 구간 ───
     * 1. Math.round(평균) 적용  예) 3.3→3, 4.6→5
     * 2. 상승 가능 (맥스 5, 5 초과 불가)
     * ─── 평균 > 5 구간 ───
     * 3. Math.floor(평균) 적용  예) 6.5→6, 6.8→6
     * 4. 상승 불가 — computed ≥ 기존핸디면 기존핸디 유지 (내림만 반영)
     * 기존 최종핸디 기준: cfg.finalHandicap 우선, 없으면 m.ghandicap
     */
    computeGHandicap(memberId) {
        const m = this.members.find(item => item.id === memberId);
        if (!m) return null;

        const cfg = this.configs[memberId] || {};

        // ── 기존핸디 (하한 기준값): val-base 인풋 우선, 없으면 cfg.baseHandicap ──
        let currentHandicapVal = null;
        const baseEl = document.getElementById(`val-base-${memberId}`);
        const baseStr = baseEl ? baseEl.value.trim() : (cfg.baseHandicap !== undefined && cfg.baseHandicap !== null ? String(cfg.baseHandicap) : '');
        if (baseStr !== '' && !isNaN(Number(baseStr))) {
            currentHandicapVal = Number(baseStr);
        }

        const chkNormal   = document.getElementById(`chk-normal-${memberId}`);
        const valNormalEl = document.getElementById(`val-normal-${memberId}`);
        const useNormal   = chkNormal ? chkNormal.checked : (cfg.useGolfzon !== undefined ? cfg.useGolfzon : true);
        const normalStr   = valNormalEl ? valNormalEl.value.trim() : (cfg.golfzonHandi !== undefined && cfg.golfzonHandi !== null ? String(cfg.golfzonHandi) : '');
        const normalVal   = normalStr !== '' && !isNaN(Number(normalStr)) ? Number(normalStr) : null;

        const chkGlobal   = document.getElementById(`chk-global-${memberId}`);
        const valGlobalEl = document.getElementById(`val-global-${memberId}`);
        const useGlobal   = chkGlobal ? chkGlobal.checked : (cfg.useGlobal !== undefined ? cfg.useGlobal : true);
        const globalStr   = valGlobalEl ? valGlobalEl.value.trim() : (cfg.globalHandi !== undefined && cfg.globalHandi !== null ? String(cfg.globalHandi) : '');
        const globalVal   = globalStr !== '' && !isNaN(Number(globalStr)) ? Number(globalStr) : null;

        let validCount = 0, sum = 0;
        if (useNormal && normalVal !== null) { sum += normalVal; validCount++; }
        if (useGlobal && globalVal !== null)  { sum += globalVal;  validCount++; }

        if (validCount === 0) {
            return { validCount: 0, rawAvg: null, computed: null, finalHandicap: currentHandicapVal,
                     status: 'no_input', normalVal, globalVal, useNormal, useGlobal, currentHandicapVal };
        }

        const rawAvg = sum / validCount;
        const formattedAvg = Math.round(rawAvg * 10) / 10;

        let computed;
        let finalHandicap;
        let status = 'applied'; // 'applied' | 'guarded_max5' | 'guarded_stay'

        if (formattedAvg <= 5) {
            // ─ 평균 ≤ 5: 반올림, 상승 가능, 맥스 5 ─
            computed = Math.round(formattedAvg);
            if (computed > 5) computed = 5;
            finalHandicap = computed;
            if (computed === 5 && currentHandicapVal !== null && currentHandicapVal < computed) {
                // 맥스 5에 걸린 경우
                status = 'guarded_max5';
            }
        } else {
            // ─ 평균 > 5: 내림, 상승 불가 (기존 핸디 유지) ─
            computed = Math.floor(formattedAvg);
            finalHandicap = computed;
            if (currentHandicapVal !== null && computed >= currentHandicapVal) {
                // 상승하거나 같으면 기존 핸디 유지
                finalHandicap = currentHandicapVal;
                status = 'guarded_stay';
            }
        }

        return { validCount, rawAvg: formattedAvg, computed, finalHandicap, status, normalVal, globalVal, useNormal, useGlobal, currentHandicapVal };
    },

    recalc(memberId) {
        const res = this.computeGHandicap(memberId);
        const dispFinal = document.getElementById(`disp-final-${memberId}`);
        const dispAvg   = document.getElementById(`disp-avg-${memberId}`);
        const dispInfo  = document.getElementById(`disp-info-${memberId}`);
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
            return;
        }

        dispFinal.textContent = res.finalHandicap !== null ? res.finalHandicap : '—';

        if (res.status === 'guarded_max5') {
            dispFinal.style.color = '#f59e0b';
            if (dispInfo) { dispInfo.textContent = '🛡️ 맥스5'; dispInfo.style.color = '#f59e0b'; }
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
    },

    async saveSingle(memberId) {
        const m = this.members.find(item => item.id === memberId);
        if (!m) return;

        const res            = this.computeGHandicap(memberId);
        const useNormal      = document.getElementById(`chk-normal-${memberId}`)?.checked ?? true;
        const useGlobal      = document.getElementById(`chk-global-${memberId}`)?.checked ?? true;
        const normalHandiVal = document.getElementById(`val-normal-${memberId}`)?.value.trim() || '';
        const globalHandiVal = document.getElementById(`val-global-${memberId}`)?.value.trim() || '';
        const baseHandiVal   = document.getElementById(`val-base-${memberId}`)?.value.trim() || '';

        const configData = {
            useGolfzon:    useNormal,
            useGlobal:     useGlobal,
            golfzonId:     '',
            globalId:      '',
            golfzonHandi:  normalHandiVal !== '' && !isNaN(Number(normalHandiVal)) ? Number(normalHandiVal) : '',
            globalHandi:   globalHandiVal !== '' && !isNaN(Number(globalHandiVal)) ? Number(globalHandiVal) : '',
            baseHandicap:  baseHandiVal   !== '' && !isNaN(Number(baseHandiVal))   ? Number(baseHandiVal)   : '',
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

        Utils.toast(`[${m.name}] 최종핸디 ${configData.finalHandicap} 저장 완료!`, 'success');
    },

    async saveAll() {
        if (this.members.length === 0) return;
        Utils.toast('전체 저장 중...', 'info');
        for (const m of this.members) {
            await this.saveSingle(m.id);
        }
        Utils.toast('모든 멤버의 최종핸디가 저장되었습니다!', 'success');
    }
};

Router.register('ghandicap', GHandicapPage);
window.GHandicapPage = GHandicapPage;
