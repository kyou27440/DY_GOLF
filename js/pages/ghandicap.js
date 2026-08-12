/* ============================================
   GHANDICAP.JS — 멤버별 G-핸디 통합 관리 (컴팩트 & 고시인성 디자인)
   NX4 핸디 (golfzon.com) + Global 핸디 (global.golfzon.com)
   ============================================ */

const GHandicapPage = {
    configs: {},
    members: [],

    async render() {
        return `
        <!-- 페이지 헤더 & 설명 -->
        <div style="background:linear-gradient(135deg, rgba(30,41,59,0.85), rgba(15,23,42,0.95));border:1px solid rgba(99,102,241,0.3);border-radius:16px;padding:16px 20px;margin-bottom:16px;box-shadow:0 4px 20px rgba(0,0,0,0.25);">
            <div style="display:flex;justify-content:space-between;align-items:center;flex-wrap:wrap;gap:12px;">
                <div style="display:flex;align-items:center;gap:12px;">
                    <div style="width:42px;height:42px;border-radius:12px;background:linear-gradient(135deg,#6366f1,#8b5cf6);display:flex;align-items:center;justify-content:center;font-size:1.4rem;box-shadow:0 4px 12px rgba(99,102,241,0.4);flex-shrink:0;">
                        ⛳
                    </div>
                    <div>
                        <div style="font-weight:800;font-size:1.1rem;color:#f8fafc;letter-spacing:-0.01em;">멤버별 G-핸디 관리</div>
                        <div style="font-size:0.8rem;color:var(--text-muted);margin-top:2px;display:flex;align-items:center;gap:8px;flex-wrap:wrap;">
                            <span style="color:#c084fc;font-weight:700;background:rgba(192,132,252,0.12);padding:2px 8px;border-radius:6px;border:1px solid rgba(192,132,252,0.25);">⛳ NX4 핸디</span>
                            <span style="color:#38bdf8;">+</span>
                            <span style="color:#38bdf8;font-weight:700;background:rgba(56,189,248,0.12);padding:2px 8px;border-radius:6px;border:1px solid rgba(56,189,248,0.25);">🌐 Global 핸디</span>
                            <span style="color:#94a3b8;margin-left:4px;">➔ 평균 핸디 자동 산출 (≤5 반올림 / &gt;5 내림 / 하향방지)</span>
                        </div>
                    </div>
                </div>
                <button class="btn btn-primary" id="btn-save-all-ghandicap" style="font-weight:700;padding:8px 18px;font-size:0.88rem;border-radius:10px;white-space:nowrap;box-shadow:0 4px 14px rgba(99,102,241,0.35);">
                    💾 전체 일괄 저장
                </button>
            </div>
        </div>

        <!-- 멤버 핸디 관리 테이블 -->
        <div style="background:rgba(15,23,42,0.8);border:1px solid rgba(99,102,241,0.3);border-radius:16px;overflow:hidden;box-shadow:0 8px 32px rgba(0,0,0,0.3);">
            <!-- 테이블 헤더 (일률적인 컬럼 폭 및 정렬) -->
            <div style="display:grid;grid-template-columns:minmax(140px, 1.5fr) 1.2fr 1.2fr 100px 90px;
                        padding:12px 18px;align-items:center;
                        background:linear-gradient(90deg, rgba(99,102,241,0.18), rgba(139,92,246,0.12));
                        border-bottom:1px solid rgba(99,102,241,0.3);
                        font-size:0.8rem;font-weight:800;letter-spacing:0.03em;">
                <div style="color:#e2e8f0;">👥 멤버</div>
                <div style="text-align:center;color:#c084fc;">⛳ NX4 핸디</div>
                <div style="text-align:center;color:#38bdf8;">🌐 Global 핸디</div>
                <div style="text-align:center;color:#34d399;">G-핸디</div>
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
                 style="display:grid;grid-template-columns:minmax(140px, 1.5fr) 1.2fr 1.2fr 100px 90px;
                        padding:12px 18px;min-height:64px;align-items:center;
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

                <!-- NX4 핸디 키인 입력 칸 -->
                <div style="display:flex;align-items:center;justify-content:center;gap:8px;">
                    <input type="checkbox" id="chk-normal-${m.id}" ${useNormal ? 'checked' : ''}
                           onchange="GHandicapPage.toggleInput(${m.id}, 'normal')"
                           title="NX4 핸디 포함 여부"
                           style="cursor:pointer;accent-color:#c084fc;width:18px;height:18px;flex-shrink:0;">
                    <div style="position:relative;display:inline-flex;align-items:center;">
                        <input type="number" step="0.01" min="-30" max="50" inputmode="decimal" id="val-normal-${m.id}" value="${normalHandi}"
                               placeholder="키인 입력" ${!useNormal ? 'disabled' : ''}
                               oninput="GHandicapPage.recalc(${m.id})"
                               onfocus="this.style.borderColor='#c084fc';this.style.boxShadow='0 0 10px rgba(192,132,252,0.45)';this.select();"
                               onblur="this.style.borderColor='rgba(192,132,252,0.55)';this.style.boxShadow='none';"
                               style="width:86px;height:36px;text-align:center;padding:0 8px;font-size:0.92rem;
                                      font-weight:800;color:#ffffff;background:rgba(15,23,42,0.9);
                                      border:1.5px solid rgba(192,132,252,0.55);border-radius:9px;box-sizing:border-box;
                                      outline:none;transition:all 0.2s;${!useNormal ? 'opacity:0.35;cursor:not-allowed;' : 'cursor:text;'}">
                    </div>
                </div>

                <!-- Global 핸디 키인 입력 칸 -->
                <div style="display:flex;align-items:center;justify-content:center;gap:8px;">
                    <input type="checkbox" id="chk-global-${m.id}" ${useGlobal ? 'checked' : ''}
                           onchange="GHandicapPage.toggleInput(${m.id}, 'global')"
                           title="Global 핸디 포함 여부"
                           style="cursor:pointer;accent-color:#38bdf8;width:18px;height:18px;flex-shrink:0;">
                    <div style="position:relative;display:inline-flex;align-items:center;">
                        <input type="number" step="0.01" min="-30" max="50" inputmode="decimal" id="val-global-${m.id}" value="${globalHandi}"
                               placeholder="키인 입력" ${!useGlobal ? 'disabled' : ''}
                               oninput="GHandicapPage.recalc(${m.id})"
                               onfocus="this.style.borderColor='#38bdf8';this.style.boxShadow='0 0 10px rgba(56,189,248,0.45)';this.select();"
                               onblur="this.style.borderColor='rgba(56,189,248,0.55)';this.style.boxShadow='none';"
                               style="width:86px;height:36px;text-align:center;padding:0 8px;font-size:0.92rem;
                                      font-weight:800;color:#ffffff;background:rgba(15,23,42,0.9);
                                      border:1.5px solid rgba(56,189,248,0.55);border-radius:9px;box-sizing:border-box;
                                      outline:none;transition:all 0.2s;${!useGlobal ? 'opacity:0.35;cursor:not-allowed;' : 'cursor:text;'}">
                    </div>
                </div>

                <!-- 최종 G-핸디 표시 -->
                <div style="text-align:center;display:flex;flex-direction:column;align-items:center;justify-content:center;">
                    <span id="disp-final-${m.id}"
                          style="font-size:1.2rem;font-weight:800;color:#38bdf8;display:inline-block;line-height:1.2;">
                        ${currentHandicap !== null ? currentHandicap : '—'}
                    </span>
                    <div id="disp-status-${m.id}" style="font-size:0.65rem;font-weight:700;margin-top:2px;min-height:14px;"></div>
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

    /** G-핸디 보정 공식 계산 로직 */
    computeGHandicap(memberId) {
        const m = this.members.find(item => item.id === memberId);
        if (!m) return null;

        const cfg = this.configs[memberId] || {};
        const currentHandicapVal =
            cfg.finalHandicap !== undefined && cfg.finalHandicap !== '' && !isNaN(Number(cfg.finalHandicap))
                ? Number(cfg.finalHandicap)
                : (m.ghandicap !== undefined && m.ghandicap !== '' && !isNaN(Number(m.ghandicap))
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
                     status: 'no_input', normalVal, globalVal, useNormal, useGlobal };
        }

        const rawAvg = sum / validCount;
        const formattedAvg = Math.round(rawAvg * 10) / 10;

        let computed;
        if (formattedAvg <= 5) { computed = Math.round(formattedAvg); }
        else                    { computed = Math.floor(formattedAvg); }

        let finalHandicap = computed;
        let status = 'applied';

        if (formattedAvg > 5 && currentHandicapVal !== null && computed > currentHandicapVal) {
            finalHandicap = currentHandicapVal;
            status = 'guarded';
        }

        return { validCount, rawAvg: formattedAvg, computed, finalHandicap, status, normalVal, globalVal, useNormal, useGlobal };
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
        dispFinal.style.color = res.status === 'guarded' ? '#f59e0b' : '#38bdf8';
        if (dispStatus) {
            dispStatus.textContent = res.status === 'guarded' ? '🛡️유지' : '✅갱신';
            dispStatus.style.color = res.status === 'guarded' ? '#f59e0b' : '#34d399';
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

        Utils.toast(`[${m.name}] G-핸디 ${configData.finalHandicap} 저장 완료!`, 'success');
    },

    async saveAll() {
        if (this.members.length === 0) return;
        Utils.toast('전체 저장 중...', 'info');
        for (const m of this.members) {
            await this.saveSingle(m.id);
        }
        Utils.toast('모든 멤버의 G-핸디가 저장되었습니다!', 'success');
    }
};

Router.register('ghandicap', GHandicapPage);
window.GHandicapPage = GHandicapPage;
