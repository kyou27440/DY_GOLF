/* ============================================
   GHANDICAP.JS — 멤버별 핸디 통합 관리 (NX4 핸드 + 글로벌핸디 ➔ 최종핸디)
   규칙:
   1. NX4 핸드 + 글로벌핸디 2개 평균 기준
   2. 평균 ≤ 5: 반올림(Math.round) 적용 / 성적 저하 시 맥스 5까지만 가능 (5 초과 불가)
   3. 평균 > 5: 내림(Math.floor) 적용 / 기존 최종핸디에서 더 올라갈 수 없음 (기존 핸디 유지)
   ============================================ */

const GHandicapPage = {
    configs: {},
    members: [],

    async render() {
        return `
        <!-- 페이지 헤더 & 산출 조건 설명 카드 -->
        <div style="background:linear-gradient(135deg, rgba(30,41,59,0.85), rgba(15,23,42,0.95));border:1px solid rgba(99,102,241,0.3);border-radius:16px;padding:18px 20px;margin-bottom:16px;box-shadow:0 4px 20px rgba(0,0,0,0.25);">
            <!-- 상단 제목 & 일괄 저장 버튼 -->
            <div style="display:flex;justify-content:space-between;align-items:center;flex-wrap:wrap;gap:12px;margin-bottom:14px;border-bottom:1px solid rgba(255,255,255,0.08);padding-bottom:12px;">
                <div style="display:flex;align-items:center;gap:12px;">
                    <div style="width:42px;height:42px;border-radius:12px;background:linear-gradient(135deg,#6366f1,#8b5cf6);display:flex;align-items:center;justify-content:center;font-size:1.4rem;box-shadow:0 4px 12px rgba(99,102,241,0.4);flex-shrink:0;">
                        🏆
                    </div>
                    <div>
                        <div style="font-weight:800;font-size:1.15rem;color:#f8fafc;letter-spacing:-0.01em;">멤버별 핸디 통합 관리</div>
                        <div style="font-size:0.78rem;color:#94a3b8;margin-top:2px;">NX4 핸드 + 글로벌핸디 통합 자동 보정 시스템</div>
                    </div>
                </div>
                <button class="btn btn-primary" id="btn-save-all-ghandicap" style="font-weight:700;padding:8px 18px;font-size:0.88rem;border-radius:10px;white-space:nowrap;box-shadow:0 4px 14px rgba(99,102,241,0.35);">
                    💾 전체 일괄 저장
                </button>
            </div>

            <!-- 📋 최종핸디 산출 조건 & 운영 규정 나열 안내 -->
            <div style="background:rgba(15,23,42,0.65);border:1px solid rgba(99,102,241,0.22);border-radius:12px;padding:12px 16px;">
                <div style="font-size:0.82rem;font-weight:800;color:#a78bfa;margin-bottom:8px;display:flex;align-items:center;gap:6px;">
                    ⚙️ 최종핸디 산출 및 운영 조건
                </div>
                <div style="display:grid;grid-template-columns:repeat(auto-fit, minmax(240px, 1fr));gap:10px;font-size:0.78rem;color:#e2e8f0;">
                    <div style="background:rgba(30,41,59,0.55);padding:9px 12px;border-radius:8px;border-left:3px solid #c084fc;">
                        <strong style="color:#c084fc;">1. 평균 산출:</strong><br>
                        [NX4 핸드] + [글로벌핸디] 2개 항목 평균 산출 (1개 선택 시 해당 핸디 적용)
                    </div>
                    <div style="background:rgba(30,41,59,0.55);padding:9px 12px;border-radius:8px;border-left:3px solid #38bdf8;">
                        <strong style="color:#38bdf8;">2. 핸디 ≤ 5 구간 (반올림 &amp; 맥스5):</strong><br>
                        평균 ≤ 5는 <span style="color:#34d399;font-weight:700;">반올림</span> 반영 / 성적 저하 시 <span style="color:#f59e0b;font-weight:700;">최대 5까지만 가능</span> (5 초과 불가)
                    </div>
                    <div style="background:rgba(30,41,59,0.55);padding:9px 12px;border-radius:8px;border-left:3px solid #34d399;">
                        <strong style="color:#34d399;">3. 핸디 &gt; 5 구간 (내림 &amp; 상승방지):</strong><br>
                        평균 &gt; 5는 <span style="color:#34d399;font-weight:700;">내림</span> 반영 / 평균이 올라가도 <span style="color:#f59e0b;font-weight:700;">기존 최종핸디 유지</span> (예: 10 ➔ 평균 13 돼도 10 유지)
                    </div>
                </div>
            </div>
        </div>

        <!-- 멤버 핸디 관리 테이블 -->
        <div style="background:rgba(15,23,42,0.8);border:1px solid rgba(99,102,241,0.3);border-radius:16px;overflow:hidden;box-shadow:0 8px 32px rgba(0,0,0,0.3);">
            <!-- 테이블 헤더 (3개 항목 일률적 컬럼 폭 및 정렬) -->
            <div style="display:grid;grid-template-columns:minmax(130px, 1.4fr) 1.2fr 1.2fr 1.2fr 80px;
                        padding:12px 18px;align-items:center;
                        background:linear-gradient(90deg, rgba(99,102,241,0.18), rgba(139,92,246,0.12));
                        border-bottom:1px solid rgba(99,102,241,0.3);
                        font-size:0.8rem;font-weight:800;letter-spacing:0.03em;">
                <div style="color:#e2e8f0;">👥 멤버</div>
                <div style="text-align:center;color:#c084fc;">⛳ NX4 핸드</div>
                <div style="text-align:center;color:#38bdf8;">🌐 글로벌핸디</div>
                <div style="text-align:center;color:#34d399;">🏆 최종핸디</div>
                <div style="text-align:center;color:#94a3b8;">관리</div>
            </div>
            <!-- 멤버 행 목록 -->
            <div id="ghandicap-members-container">
                <div class="text-center text-muted" style="padding:40px;">⏳ 핸디 정보 불러오는 중...</div>
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

        let html = '';
        this.members.forEach((m, idx) => {
            const cfg = this.configs[m.id] || {};
            const avatarText = m.nickname
                ? Utils.escapeHtml(m.nickname)
                : (m.name.length >= 3 ? m.name.slice(-2) : m.name);

            const normalHandi = cfg.golfzonHandi !== undefined && cfg.golfzonHandi !== '' && cfg.golfzonHandi !== null ? cfg.golfzonHandi : '';
            const globalHandi = cfg.globalHandi  !== undefined && cfg.globalHandi  !== '' && cfg.globalHandi  !== null ? cfg.globalHandi  : '';
            const useNormal   = cfg.useGolfzon !== undefined ? cfg.useGolfzon : true;
            const useGlobal   = cfg.useGlobal  !== undefined ? cfg.useGlobal  : true;

            const currentHandicap = cfg.finalHandicap !== undefined && cfg.finalHandicap !== null && cfg.finalHandicap !== ''
                ? cfg.finalHandicap
                : (m.ghandicap !== undefined && m.ghandicap !== null && m.ghandicap !== '' ? m.ghandicap : null);

            const rowBg = idx % 2 === 0 ? 'rgba(30,41,59,0.4)' : 'rgba(15,23,42,0.3)';

            html += `
            <div id="ghrow-${m.id}"
                 style="display:grid;grid-template-columns:minmax(130px, 1.4fr) 1.2fr 1.2fr 1.2fr 80px;
                        padding:12px 18px;min-height:68px;align-items:center;
                        background:${rowBg};border-bottom:1px solid rgba(255,255,255,0.05);
                        transition:all 0.15s ease-in-out;"
                 onmouseover="this.style.background='rgba(99,102,241,0.12)'"
                 onmouseout="this.style.background='${rowBg}'">

                <!-- 멤버 프로필 -->
                <div style="display:flex;align-items:center;gap:10px;min-width:0;">
                    <div style="height:34px;min-width:42px;padding:0 10px;font-size:0.8rem;font-weight:800;border-radius:17px;
                                background:linear-gradient(135deg,#6366f1,#8b5cf6);color:#fff;
                                display:inline-flex;align-items:center;justify-content:center;white-space:nowrap;flex-shrink:0;
                                box-shadow:0 2px 8px rgba(99,102,241,0.3);">
                        ${avatarText}
                    </div>
                    <span style="font-weight:700;font-size:0.92rem;color:#f8fafc;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;">
                        ${Utils.escapeHtml(m.name)}
                    </span>
                </div>

                <!-- 1. NX4 핸드 키인 입력 칸 -->
                <div style="display:flex;align-items:center;justify-content:center;gap:6px;">
                    <input type="checkbox" id="chk-normal-${m.id}" ${useNormal ? 'checked' : ''}
                           onchange="GHandicapPage.toggleInput(${m.id}, 'normal')"
                           title="NX4 핸드 포함 여부"
                           style="cursor:pointer;accent-color:#c084fc;width:18px;height:18px;flex-shrink:0;">
                    <input type="number" step="0.01" min="-30" max="50" inputmode="decimal" id="val-normal-${m.id}" value="${normalHandi}"
                           placeholder="키인 입력" ${!useNormal ? 'disabled' : ''}
                           oninput="GHandicapPage.recalc(${m.id})"
                           onfocus="this.style.borderColor='#c084fc';this.style.boxShadow='0 0 10px rgba(192,132,252,0.45)';this.select();"
                           onblur="this.style.borderColor='rgba(192,132,252,0.55)';this.style.boxShadow='none';"
                           style="width:86px;height:36px;text-align:center;padding:0 6px;font-size:0.92rem;
                                  font-weight:800;color:#ffffff;background:rgba(15,23,42,0.9);
                                  border:1.5px solid rgba(192,132,252,0.55);border-radius:9px;box-sizing:border-box;
                                  outline:none;transition:all 0.2s;${!useNormal ? 'opacity:0.35;cursor:not-allowed;' : 'cursor:text;'}">
                </div>

                <!-- 2. 글로벌핸디 키인 입력 칸 -->
                <div style="display:flex;align-items:center;justify-content:center;gap:6px;">
                    <input type="checkbox" id="chk-global-${m.id}" ${useGlobal ? 'checked' : ''}
                           onchange="GHandicapPage.toggleInput(${m.id}, 'global')"
                           title="글로벌핸디 포함 여부"
                           style="cursor:pointer;accent-color:#38bdf8;width:18px;height:18px;flex-shrink:0;">
                    <input type="number" step="0.01" min="-30" max="50" inputmode="decimal" id="val-global-${m.id}" value="${globalHandi}"
                           placeholder="키인 입력" ${!useGlobal ? 'disabled' : ''}
                           oninput="GHandicapPage.recalc(${m.id})"
                           onfocus="this.style.borderColor='#38bdf8';this.style.boxShadow='0 0 10px rgba(56,189,248,0.45)';this.select();"
                           onblur="this.style.borderColor='rgba(56,189,248,0.55)';this.style.boxShadow='none';"
                           style="width:86px;height:36px;text-align:center;padding:0 6px;font-size:0.92rem;
                                  font-weight:800;color:#ffffff;background:rgba(15,23,42,0.9);
                                  border:1.5px solid rgba(56,189,248,0.55);border-radius:9px;box-sizing:border-box;
                                  outline:none;transition:all 0.2s;${!useGlobal ? 'opacity:0.35;cursor:not-allowed;' : 'cursor:text;'}">
                </div>

                <!-- 3. 최종핸디 표시 박스 (3개 항목 폭 86px & 높이 36px 일률적 일치화) -->
                <div style="display:flex;flex-direction:column;align-items:center;justify-content:center;gap:2px;">
                    <div style="width:86px;height:36px;display:flex;align-items:center;justify-content:center;
                                background:rgba(15,23,42,0.9);border:1.5px solid rgba(52,211,153,0.55);
                                border-radius:9px;box-sizing:border-box;">
                        <span id="disp-final-${m.id}" style="font-size:1.1rem;font-weight:800;color:#34d399;">
                            ${currentHandicap !== null ? currentHandicap : '—'}
                        </span>
                    </div>
                    <div id="disp-status-${m.id}" style="font-size:0.65rem;font-weight:700;min-height:14px;white-space:nowrap;"></div>
                </div>

                <!-- 저장 버튼 -->
                <div style="text-align:center;display:flex;align-items:center;justify-content:center;">
                    <button class="btn btn-emerald btn-sm" onclick="GHandicapPage.saveSingle(${m.id})"
                            style="font-size:0.78rem;height:34px;padding:0 14px;white-space:nowrap;font-weight:700;border-radius:8px;box-shadow:0 2px 8px rgba(16,185,129,0.3);">💾 저장</button>
                </div>
            </div>
            `;
        });

        container.innerHTML = html;
        this.members.forEach(m => this.recalc(m.id));
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
     * 1. NX4 핸드 + 글로벌핸디 평균 산출
     * 2. 평균 ≤ 5: 반올림(Math.round)
     *    - 평균 > 5: 내림(Math.floor)
     * 3. 상승 방지 규정:
     *    - 기존 최종핸디 ≤ 5 멤버: 핸디가 상승하더라도 맥스 5까지만 가능 (5 초과 불가)
     *    - 기존 최종핸디 > 5 멤버: 핸디가 기존 최종핸디보다 더 올라갈 수 없음 (기존 핸디 유지)
     */
    computeGHandicap(memberId) {
        const m = this.members.find(item => item.id === memberId);
        if (!m) return null;

        const cfg = this.configs[memberId] || {};
        const currentHandicapVal =
            cfg.finalHandicap !== undefined && cfg.finalHandicap !== '' && cfg.finalHandicap !== null && !isNaN(Number(cfg.finalHandicap))
                ? Number(cfg.finalHandicap)
                : (m.ghandicap !== undefined && m.ghandicap !== '' && m.ghandicap !== null && !isNaN(Number(m.ghandicap))
                    ? Number(m.ghandicap) : null);

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

        // ≤5 반올림, >5 내림
        let computed;
        if (formattedAvg <= 5) {
            computed = Math.round(formattedAvg);
        } else {
            computed = Math.floor(formattedAvg);
        }

        let finalHandicap = computed;
        let status = 'applied'; // 'applied' | 'guarded_max5' | 'guarded_stay'

        if (currentHandicapVal !== null) {
            if (currentHandicapVal <= 5) {
                // 기존 5 이하 멤버: 핸디가 상승하더라도 맥스 5까지만 가능 (더 이상 못 올라감)
                if (computed > 5) {
                    finalHandicap = 5;
                    status = 'guarded_max5';
                }
            } else {
                // 기존 5 이상(>5) 멤버: 현재 최종핸디에서 더 올라갈 수 없음 (기존 핸디 유지)
                if (computed > currentHandicapVal) {
                    finalHandicap = currentHandicapVal;
                    status = 'guarded_stay';
                }
            }
        }

        return { validCount, rawAvg: formattedAvg, computed, finalHandicap, status, normalVal, globalVal, useNormal, useGlobal, currentHandicapVal };
    },

    recalc(memberId) {
        const res = this.computeGHandicap(memberId);
        const dispFinal  = document.getElementById(`disp-final-${memberId}`);
        const dispStatus = document.getElementById(`disp-status-${memberId}`);
        if (!res || !dispFinal) return;

        if (res.status === 'no_input') {
            dispFinal.textContent = res.finalHandicap !== null ? res.finalHandicap : '—';
            dispFinal.style.color = '#64748b';
            if (dispStatus) dispStatus.textContent = '';
            return;
        }

        dispFinal.textContent = res.finalHandicap !== null ? res.finalHandicap : '—';

        if (res.status === 'guarded_max5') {
            dispFinal.style.color = '#f59e0b';
            if (dispStatus) {
                dispStatus.textContent = '🛡️ 맥스 5';
                dispStatus.style.color = '#f59e0b';
            }
        } else if (res.status === 'guarded_stay') {
            dispFinal.style.color = '#f59e0b';
            if (dispStatus) {
                dispStatus.textContent = `🛡️ ${res.currentHandicapVal} 유지`;
                dispStatus.style.color = '#f59e0b';
            }
        } else {
            dispFinal.style.color = '#34d399';
            if (dispStatus) {
                dispStatus.textContent = '✅ 갱신';
                dispStatus.style.color = '#34d399';
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

        const configData = {
            useGolfzon:    useNormal,
            useGlobal:     useGlobal,
            golfzonId:     '',
            globalId:      '',
            golfzonHandi:  normalHandiVal !== '' && !isNaN(Number(normalHandiVal)) ? Number(normalHandiVal) : '',
            globalHandi:   globalHandiVal !== '' && !isNaN(Number(globalHandiVal)) ? Number(globalHandiVal) : '',
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
