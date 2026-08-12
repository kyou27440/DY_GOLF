/* ============================================
   GHANDICAP.JS — 멤버별 G-핸디 통합 관리 (컴팩트 테이블)
   Golfzon Normal (golfzon.com) + Golfzon Global (global.golfzon.com)
   ============================================ */

const GHandicapPage = {
    configs: {},
    members: [],

    async render() {
        return `
        <!-- 페이지 헤더 (컴팩트) -->
        <div style="display:flex;justify-content:space-between;align-items:center;flex-wrap:wrap;gap:10px;margin-bottom:14px;">
            <div style="display:flex;align-items:center;gap:10px;">
                <span style="font-size:1.4rem;">⛳</span>
                <div>
                    <div style="font-weight:700;font-size:0.97rem;color:var(--text-primary);">멤버별 G-핸디 관리</div>
                    <div style="font-size:0.76rem;color:var(--text-muted);margin-top:1px;">
                        <a href="https://www.golfzon.com/scorecard/main" target="_blank" rel="noopener"
                           style="color:#a78bfa;text-decoration:none;font-weight:600;">⛳ Normal</a>
                        &nbsp;+&nbsp;
                        <a href="https://www.global.golfzon.com/ranking-golf-follow/757854" target="_blank" rel="noopener"
                           style="color:#38bdf8;text-decoration:none;font-weight:600;">🌐 Global</a>
                        <span style="color:var(--text-muted);margin-left:6px;">평균 → 실제 핸디 자동 산출 (≤5 반올림 / &gt;5 내림 / 하향방지)</span>
                    </div>
                </div>
            </div>
            <button class="btn btn-primary btn-sm" id="btn-save-all-ghandicap" style="font-weight:700;white-space:nowrap;">💾 전체 저장</button>
        </div>

        <!-- 멤버 테이블 -->
        <div style="background:rgba(15,23,42,0.7);border:1px solid rgba(99,102,241,0.25);border-radius:14px;overflow:hidden;">
            <!-- 테이블 헤더 -->
            <div style="display:grid;grid-template-columns:minmax(120px,1.6fr) 1.1fr 1.1fr 90px 80px;
                        padding:8px 14px;
                        background:rgba(99,102,241,0.14);border-bottom:1px solid rgba(99,102,241,0.25);
                        font-size:0.74rem;font-weight:700;color:var(--text-muted);letter-spacing:0.04em;">
                <div>멤버</div>
                <div style="text-align:center;color:#a78bfa;">⛳ Normal 핸디</div>
                <div style="text-align:center;color:#38bdf8;">🌐 Global 핸디</div>
                <div style="text-align:center;color:#34d399;">G-핸디</div>
                <div style="text-align:center;"></div>
            </div>
            <!-- 멤버 행 목록 -->
            <div id="ghandicap-members-container">
                <div class="text-center text-muted" style="padding:30px;">⏳ 불러오는 중...</div>
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
            container.innerHTML = `<div class="empty-state"><div class="empty-icon">👥</div><p class="empty-text">등록된 활동 멤버가 없습니다</p></div>`;
            return;
        }

        let html = '';
        this.members.forEach((m, idx) => {
            const cfg = this.configs[m.id] || {};
            const avatarText = m.nickname
                ? Utils.escapeHtml(m.nickname)
                : (m.name.length >= 3 ? m.name.slice(-2) : m.name);

            const normalHandi = cfg.golfzonHandi !== undefined && cfg.golfzonHandi !== '' ? cfg.golfzonHandi : '';
            const globalHandi = cfg.globalHandi  !== undefined && cfg.globalHandi  !== '' ? cfg.globalHandi  : '';
            const useNormal   = cfg.useGolfzon !== undefined ? cfg.useGolfzon : true;
            const useGlobal   = cfg.useGlobal  !== undefined ? cfg.useGlobal  : true;

            const currentHandicap = cfg.finalHandicap !== undefined && cfg.finalHandicap !== null && cfg.finalHandicap !== ''
                ? cfg.finalHandicap
                : (m.ghandicap !== undefined && m.ghandicap !== null && m.ghandicap !== '' ? m.ghandicap : null);

            const rowBg = idx % 2 === 0 ? 'rgba(30,41,59,0.35)' : 'rgba(15,23,42,0.2)';

            html += `
            <div id="ghrow-${m.id}"
                 style="display:grid;grid-template-columns:minmax(120px,1.6fr) 1.1fr 1.1fr 90px 80px;
                        padding:8px 14px;align-items:center;
                        background:${rowBg};border-bottom:1px solid rgba(255,255,255,0.04);
                        transition:background 0.15s;"
                 onmouseover="this.style.background='rgba(99,102,241,0.09)'"
                 onmouseout="this.style.background='${rowBg}'">

                <!-- 멤버명 -->
                <div style="display:flex;align-items:center;gap:8px;min-width:0;">
                    <div style="height:30px;min-width:38px;padding:0 8px;font-size:0.76rem;font-weight:700;border-radius:15px;
                                background:linear-gradient(135deg,#6366f1,#8b5cf6);color:#fff;
                                display:inline-flex;align-items:center;justify-content:center;white-space:nowrap;flex-shrink:0;">
                        ${avatarText}
                    </div>
                    <span style="font-weight:600;font-size:0.88rem;color:#f8fafc;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;">
                        ${Utils.escapeHtml(m.name)}
                    </span>
                </div>

                <!-- Normal 핸디 키인 입력 칸 -->
                <div style="display:flex;align-items:center;justify-content:center;gap:6px;padding:0 6px;">
                    <input type="checkbox" id="chk-normal-${m.id}" ${useNormal ? 'checked' : ''}
                           onchange="GHandicapPage.toggleInput(${m.id}, 'normal')"
                           title="Normal 핸디 포함 여부"
                           style="cursor:pointer;accent-color:#a78bfa;flex-shrink:0;width:16px;height:16px;">
                    <input type="number" step="0.1" inputmode="decimal" id="val-normal-${m.id}" value="${normalHandi}"
                           placeholder="0.0" min="0" max="36" ${!useNormal ? 'disabled' : ''}
                           oninput="GHandicapPage.recalc(${m.id})"
                           onfocus="this.style.borderColor='#a78bfa';this.style.boxShadow='0 0 8px rgba(167,139,250,0.4)';this.select();"
                           onblur="this.style.borderColor='rgba(167,139,250,0.5)';this.style.boxShadow='none';"
                           style="width:76px;text-align:center;padding:5px 6px;font-size:0.9rem;
                                  font-weight:700;color:#f3e8ff;background:rgba(15,23,42,0.85);
                                  border:1.5px solid rgba(167,139,250,0.5);border-radius:8px;box-sizing:border-box;
                                  outline:none;transition:all 0.2s;${!useNormal ? 'opacity:0.4;cursor:not-allowed;' : 'cursor:text;'}">
                </div>

                <!-- Global 핸디 키인 입력 칸 -->
                <div style="display:flex;align-items:center;justify-content:center;gap:6px;padding:0 6px;">
                    <input type="checkbox" id="chk-global-${m.id}" ${useGlobal ? 'checked' : ''}
                           onchange="GHandicapPage.toggleInput(${m.id}, 'global')"
                           title="Global 핸디 포함 여부"
                           style="cursor:pointer;accent-color:#38bdf8;flex-shrink:0;width:16px;height:16px;">
                    <input type="number" step="0.1" inputmode="decimal" id="val-global-${m.id}" value="${globalHandi}"
                           placeholder="0.0" min="0" max="36" ${!useGlobal ? 'disabled' : ''}
                           oninput="GHandicapPage.recalc(${m.id})"
                           onfocus="this.style.borderColor='#38bdf8';this.style.boxShadow='0 0 8px rgba(56,189,248,0.4)';this.select();"
                           onblur="this.style.borderColor='rgba(56,189,248,0.5)';this.style.boxShadow='none';"
                           style="width:76px;text-align:center;padding:5px 6px;font-size:0.9rem;
                                  font-weight:700;color:#e0f2fe;background:rgba(15,23,42,0.85);
                                  border:1.5px solid rgba(56,189,248,0.5);border-radius:8px;box-sizing:border-box;
                                  outline:none;transition:all 0.2s;${!useGlobal ? 'opacity:0.4;cursor:not-allowed;' : 'cursor:text;'}">
                </div>

                <!-- 최종 G-핸디 표시 -->
                <div style="text-align:center;">
                    <span id="disp-final-${m.id}"
                          style="font-size:1.15rem;font-weight:800;color:#38bdf8;display:inline-block;min-width:32px;">
                        ${currentHandicap !== null ? currentHandicap : '—'}
                    </span>
                    <div id="disp-status-${m.id}" style="font-size:0.62rem;color:var(--text-muted);margin-top:1px;"></div>
                </div>

                <!-- 저장 버튼 -->
                <div style="text-align:center;">
                    <button class="btn btn-emerald btn-sm" onclick="GHandicapPage.saveSingle(${m.id})"
                            style="font-size:0.74rem;padding:5px 12px;white-space:nowrap;font-weight:700;">💾 저장</button>
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
            input.style.opacity = chk.checked ? '1' : '0.4';
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
        const normalStr   = valNormalEl ? valNormalEl.value.trim() : (cfg.golfzonHandi !== undefined ? String(cfg.golfzonHandi) : '');
        const normalVal   = normalStr !== '' && !isNaN(Number(normalStr)) ? Number(normalStr) : null;

        const chkGlobal   = document.getElementById(`chk-global-${memberId}`);
        const valGlobalEl = document.getElementById(`val-global-${memberId}`);
        const useGlobal   = chkGlobal ? chkGlobal.checked : (cfg.useGlobal !== undefined ? cfg.useGlobal : true);
        const globalStr   = valGlobalEl ? valGlobalEl.value.trim() : (cfg.globalHandi !== undefined ? String(cfg.globalHandi) : '');
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

        let computed, isRound;
        if (formattedAvg <= 5) { computed = Math.round(formattedAvg); isRound = true; }
        else                    { computed = Math.floor(formattedAvg); isRound = false; }

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
            row.style.background = 'rgba(16,185,129,0.12)';
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
