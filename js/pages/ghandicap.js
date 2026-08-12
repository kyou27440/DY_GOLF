/* ============================================
   GHANDICAP.JS — 멤버별 G-핸디 통합 관리 및 자동 산출
   Golfzon Normal (golfzon.com) + Golfzon Global (global.golfzon.com)
   ============================================ */

const GHandicapPage = {
    configs: {},
    members: [],

    async render() {
        return `
        <!-- 페이지 헤더 배너 -->
        <div style="background: linear-gradient(135deg, rgba(99,102,241,0.18), rgba(139,92,246,0.25)); border: 1px solid rgba(99,102,241,0.35); border-radius: 14px; padding: 16px 20px; margin-bottom: 20px; box-shadow: 0 4px 18px rgba(0,0,0,0.22);">
            <div style="display:flex;justify-content:space-between;align-items:center;flex-wrap:wrap;gap:12px;">
                <div style="display:flex;align-items:center;gap:12px;">
                    <span style="font-size:1.8rem;">⛳</span>
                    <div>
                        <div style="font-weight:700;font-size:1.08rem;color:var(--text-primary);">멤버별 G-핸디 통합 관리 &amp; 자동 보정 시트</div>
                        <div style="font-size:0.82rem;color:var(--text-muted);margin-top:3px;">
                            <span style="color:#a78bfa;font-weight:600;">⛳ Golfzon Normal</span>
                            <span style="color:var(--text-muted);margin:0 5px;">&amp;</span>
                            <span style="color:#38bdf8;font-weight:600;">🌐 Golfzon Global</span>
                            <span style="color:var(--text-muted);margin-left:6px;">— 두 사이트 핸디 평균으로 실제 핸디 자동 산출</span>
                        </div>
                    </div>
                </div>
                <button class="btn btn-primary" id="btn-save-all-ghandicap" style="font-weight:700;">💾 전체 일괄 저장</button>
            </div>
        </div>

        <!-- 상단 안내 카드 (2열) -->
        <div style="display:grid;grid-template-columns:1fr 1fr;gap:14px;margin-bottom:22px;" class="form-grid">

            <!-- 사이트 바로가기 -->
            <div style="padding:14px 16px;background:rgba(30,41,59,0.75);border:1px solid rgba(99,102,241,0.3);border-radius:14px;">
                <div style="font-weight:700;color:#c4b5fd;margin-bottom:10px;font-size:0.92rem;">🔗 핸디 조회 바로가기</div>
                <div style="display:flex;flex-direction:column;gap:7px;">
                    <a href="https://www.golfzon.com/scorecard/main" target="_blank" rel="noopener noreferrer"
                       style="display:flex;align-items:center;gap:8px;padding:8px 12px;background:rgba(167,139,250,0.12);border:1px solid rgba(167,139,250,0.3);border-radius:9px;text-decoration:none;color:#a78bfa;font-size:0.87rem;font-weight:600;">
                        ⛳ Golfzon Normal (golfzon.com) →
                    </a>
                    <a href="https://www.global.golfzon.com/ranking-golf-follow/757854" target="_blank" rel="noopener noreferrer"
                       style="display:flex;align-items:center;gap:8px;padding:8px 12px;background:rgba(56,189,248,0.10);border:1px solid rgba(56,189,248,0.28);border-radius:9px;text-decoration:none;color:#38bdf8;font-size:0.87rem;font-weight:600;">
                        🌐 Golfzon Global (global.golfzon.com) →
                    </a>
                </div>
            </div>

            <!-- 산출 규칙 -->
            <div style="padding:14px 16px;background:rgba(30,41,59,0.75);border:1px solid rgba(16,185,129,0.3);border-radius:14px;">
                <div style="font-weight:700;color:#34d399;margin-bottom:8px;font-size:0.92rem;">📐 G-핸디 자동 산출 규칙</div>
                <ul style="font-size:0.8rem;color:var(--text-secondary);margin:0;padding-left:16px;line-height:1.75;">
                    <li><strong>실제 핸디</strong> = Normal + Global 평균값</li>
                    <li><strong>≤ 5</strong>: 반올림 적용 (Math.round)</li>
                    <li><strong>&gt; 5</strong>: 내림 적용 (Math.floor)</li>
                    <li><strong>하향 방지</strong>: 계산값 &gt; 기존 핸디 → 기존 핸디 유지</li>
                </ul>
            </div>
        </div>

        <!-- 멤버별 핸디 카드 목록 -->
        <div id="ghandicap-members-container" style="display:flex;flex-direction:column;gap:16px;">
            <div class="text-center text-muted" style="padding:40px;">⏳ 멤버 목록 불러오는 중...</div>
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
        this.members.forEach(m => {
            const cfg = this.configs[m.id] || {};
            const avatarText = m.nickname
                ? Utils.escapeHtml(m.nickname)
                : (m.name.length >= 3 ? m.name.slice(-2) : m.name);

            // ⛳ Golfzon Normal (golfzon.com) — 기존 golfzon 필드 사용
            const useNormal   = cfg.useGolfzon  !== undefined ? cfg.useGolfzon  : true;
            const normalId    = cfg.golfzonId   || '';
            const normalHandi = cfg.golfzonHandi !== undefined ? cfg.golfzonHandi : '';

            // 🌐 Golfzon Global (global.golfzon.com) — 기존 global 필드 사용
            const useGlobal   = cfg.useGlobal   !== undefined ? cfg.useGlobal   : true;
            const globalId    = cfg.globalId    || '';
            const globalHandi = cfg.globalHandi !== undefined ? cfg.globalHandi : '';

            const currentHandicap = cfg.finalHandicap !== undefined
                ? cfg.finalHandicap
                : (m.ghandicap || '');

            html += `
            <div class="ghandicap-card" id="ghcard-${m.id}"
                 style="padding:18px 20px;background:linear-gradient(135deg, rgba(30,41,59,0.97), rgba(15,23,42,0.99));
                        border:1px solid rgba(99,102,241,0.28);border-radius:16px;
                        box-shadow:0 4px 18px rgba(0,0,0,0.22);box-sizing:border-box;width:100%;">

                <!-- 멤버 헤더 -->
                <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:14px;flex-wrap:wrap;gap:10px;border-bottom:1px solid rgba(255,255,255,0.08);padding-bottom:12px;">
                    <div style="display:flex;align-items:center;gap:12px;">
                        <div style="height:44px;min-width:54px;padding:0 14px;font-size:0.95rem;font-weight:700;border-radius:22px;
                                    background:linear-gradient(135deg,#6366f1,#8b5cf6);color:#fff;
                                    display:inline-flex;align-items:center;justify-content:center;white-space:nowrap;">
                            ${avatarText}
                        </div>
                        <div>
                            <div style="font-weight:700;font-size:1.08rem;color:#f8fafc;">${Utils.escapeHtml(m.name)}</div>
                            <div style="font-size:0.78rem;color:var(--text-muted);margin-top:2px;">소속: ${Utils.escapeHtml(m.company || '-')}</div>
                        </div>
                    </div>

                    <div style="display:flex;align-items:center;gap:10px;">
                        <div style="text-align:right;">
                            <div style="font-size:0.72rem;color:var(--text-muted);letter-spacing:0.02em;">현재 적용 G-핸디</div>
                            <div style="font-size:1.25rem;font-weight:800;color:#38bdf8;line-height:1.2;" id="disp-final-${m.id}">
                                ${currentHandicap !== '' && currentHandicap !== null ? currentHandicap : '미등록'}
                            </div>
                        </div>
                        <button class="btn btn-emerald btn-sm" onclick="GHandicapPage.saveSingle(${m.id})" style="font-weight:700;white-space:nowrap;">💾 적용/저장</button>
                    </div>
                </div>

                <!-- 2열 핸디 입력 그리드 -->
                <div style="display:grid;grid-template-columns:1fr 1fr;gap:12px;margin-bottom:12px;" class="form-grid">

                    <!-- ⛳ Golfzon Normal -->
                    <div style="padding:13px;background:rgba(167,139,250,0.07);border:1px solid rgba(167,139,250,0.28);border-radius:12px;">
                        <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:10px;">
                            <label style="display:flex;align-items:center;gap:7px;font-weight:700;color:#a78bfa;cursor:pointer;font-size:0.88rem;">
                                <input type="checkbox" id="chk-normal-${m.id}" ${useNormal ? 'checked' : ''} onchange="GHandicapPage.recalc(${m.id})">
                                ⛳ Golfzon Normal
                            </label>
                            <a href="https://www.golfzon.com/scorecard/main" target="_blank" rel="noopener"
                               style="font-size:0.72rem;color:#a78bfa;text-decoration:none;opacity:0.8;">🔗 조회</a>
                        </div>
                        <div style="display:flex;flex-direction:column;gap:8px;">
                            <div>
                                <span style="font-size:0.73rem;color:var(--text-muted);">골프존 ID</span>
                                <input type="text" id="id-normal-${m.id}" value="${Utils.escapeHtml(normalId)}"
                                       placeholder="예: golfzon_id"
                                       style="width:100%;box-sizing:border-box;margin-top:3px;">
                            </div>
                            <div>
                                <span style="font-size:0.73rem;color:var(--text-muted);">핸디캡 수치</span>
                                <input type="number" step="0.1" id="val-normal-${m.id}" value="${normalHandi}"
                                       placeholder="예: 5.2"
                                       oninput="GHandicapPage.recalc(${m.id})"
                                       style="width:100%;box-sizing:border-box;margin-top:3px;font-weight:700;color:#a78bfa;">
                            </div>
                        </div>
                    </div>

                    <!-- 🌐 Golfzon Global -->
                    <div style="padding:13px;background:rgba(56,189,248,0.07);border:1px solid rgba(56,189,248,0.25);border-radius:12px;">
                        <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:10px;">
                            <label style="display:flex;align-items:center;gap:7px;font-weight:700;color:#38bdf8;cursor:pointer;font-size:0.88rem;">
                                <input type="checkbox" id="chk-global-${m.id}" ${useGlobal ? 'checked' : ''} onchange="GHandicapPage.recalc(${m.id})">
                                🌐 Golfzon Global
                            </label>
                            <a href="https://www.global.golfzon.com/ranking-golf-follow/757854" target="_blank" rel="noopener"
                               style="font-size:0.72rem;color:#38bdf8;text-decoration:none;opacity:0.8;">🔗 조회</a>
                        </div>
                        <div style="display:flex;flex-direction:column;gap:8px;">
                            <div>
                                <span style="font-size:0.73rem;color:var(--text-muted);">글로벌 골프존 ID</span>
                                <input type="text" id="id-global-${m.id}" value="${Utils.escapeHtml(globalId)}"
                                       placeholder="예: global_id"
                                       style="width:100%;box-sizing:border-box;margin-top:3px;">
                            </div>
                            <div>
                                <span style="font-size:0.73rem;color:var(--text-muted);">핸디캡 수치</span>
                                <input type="number" step="0.1" id="val-global-${m.id}" value="${globalHandi}"
                                       placeholder="예: 3.8"
                                       oninput="GHandicapPage.recalc(${m.id})"
                                       style="width:100%;box-sizing:border-box;margin-top:3px;font-weight:700;color:#38bdf8;">
                            </div>
                        </div>
                    </div>
                </div>

                <!-- 실시간 계산 결과 프리뷰 바 -->
                <div id="preview-bar-${m.id}"
                     style="padding:10px 14px;background:rgba(15,23,42,0.85);border:1px dashed rgba(255,255,255,0.13);
                            border-radius:10px;font-size:0.84rem;display:flex;justify-content:space-between;
                            align-items:center;flex-wrap:wrap;gap:8px;">
                    <!-- JS 실시간 업데이트 -->
                </div>
            </div>
            `;
        });

        container.innerHTML = html;
        // 초기 계산 프리뷰 일괄 업데이트
        this.members.forEach(m => this.recalc(m.id));
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

        // ⛳ Golfzon Normal (chk-normal / val-normal)
        const chkNormal   = document.getElementById(`chk-normal-${memberId}`);
        const valNormalEl = document.getElementById(`val-normal-${memberId}`);
        const useNormal   = chkNormal ? chkNormal.checked : (cfg.useGolfzon !== undefined ? cfg.useGolfzon : true);
        const normalStr   = valNormalEl ? valNormalEl.value.trim() : (cfg.golfzonHandi !== undefined ? String(cfg.golfzonHandi) : '');
        const normalVal   = normalStr !== '' && !isNaN(Number(normalStr)) ? Number(normalStr) : null;

        // 🌐 Golfzon Global (chk-global / val-global)
        const chkGlobal   = document.getElementById(`chk-global-${memberId}`);
        const valGlobalEl = document.getElementById(`val-global-${memberId}`);
        const useGlobal   = chkGlobal ? chkGlobal.checked : (cfg.useGlobal !== undefined ? cfg.useGlobal : true);
        const globalStr   = valGlobalEl ? valGlobalEl.value.trim() : (cfg.globalHandi !== undefined ? String(cfg.globalHandi) : '');
        const globalVal   = globalStr !== '' && !isNaN(Number(globalStr)) ? Number(globalStr) : null;

        let validCount = 0;
        let sum = 0;
        if (useNormal && normalVal !== null) { sum += normalVal; validCount++; }
        if (useGlobal && globalVal !== null)  { sum += globalVal;  validCount++; }

        if (validCount === 0) {
            return {
                validCount: 0, rawAvg: null, computed: null,
                finalHandicap: currentHandicapVal,
                status: 'no_input', msg: '핸디 미입력 (기존 유지)',
                normalVal, globalVal, useNormal, useGlobal
            };
        }

        const rawAvg = sum / validCount;
        const formattedAvg = Math.round(rawAvg * 10) / 10;

        let computed, isRound;
        if (formattedAvg <= 5) {
            computed = Math.round(formattedAvg); isRound = true;
        } else {
            computed = Math.floor(formattedAvg); isRound = false;
        }

        let finalHandicap = computed;
        let status = 'applied';
        let msg = isRound
            ? `5 이하 → 반올림 (${formattedAvg} → ${computed})`
            : `5 초과 → 내림 (${formattedAvg} → ${computed})`;

        // 5 초과 하향 방지
        if (formattedAvg > 5 && currentHandicapVal !== null && computed > currentHandicapVal) {
            finalHandicap = currentHandicapVal;
            status = 'guarded';
            msg = `🛡️ 하향 방지 (계산 ${computed} > 기존 ${currentHandicapVal} → 기존 유지)`;
        }

        return { validCount, rawAvg: formattedAvg, computed, finalHandicap, status, msg, normalVal, globalVal, useNormal, useGlobal };
    },

    recalc(memberId) {
        const res = this.computeGHandicap(memberId);
        const previewBar = document.getElementById(`preview-bar-${memberId}`);
        if (!previewBar || !res) return;

        if (res.status === 'no_input') {
            previewBar.innerHTML = `
                <span style="color:var(--text-muted);">💡 핸디 입력 대기 중</span>
                <span style="color:var(--text-muted);font-size:0.8rem;">적용 핸디: <strong>${res.finalHandicap !== null ? res.finalHandicap : '미등록'}</strong></span>
            `;
            return;
        }

        // Normal / Global 배지
        const normalBadge = res.useNormal && res.normalVal !== null
            ? `<span style="color:#a78bfa;font-size:0.8rem;">⛳ Normal: <b>${res.normalVal}</b></span>`
            : `<span style="color:rgba(255,255,255,0.25);font-size:0.8rem;">⛳ Normal: —</span>`;
        const globalBadge = res.useGlobal && res.globalVal !== null
            ? `<span style="color:#38bdf8;font-size:0.8rem;">🌐 Global: <b>${res.globalVal}</b></span>`
            : `<span style="color:rgba(255,255,255,0.25);font-size:0.8rem;">🌐 Global: —</span>`;

        const statusBadge = res.status === 'guarded'
            ? `<span style="color:#f59e0b;font-weight:700;">🛡️ 하향 방지 (기존 유지)</span>`
            : `<span style="color:#34d399;font-weight:700;">✅ 신규 핸디 적용</span>`;

        previewBar.innerHTML = `
            <div style="display:flex;align-items:center;gap:10px;flex-wrap:wrap;">
                ${normalBadge}
                ${globalBadge}
                <span style="color:var(--text-muted);font-size:0.78rem;">→ 평균 <b style="color:#f8fafc;">${res.rawAvg}</b></span>
                <span style="font-size:0.78rem;color:var(--text-secondary);">${res.msg}</span>
            </div>
            <div style="display:flex;align-items:center;gap:8px;flex-shrink:0;">
                ${statusBadge}
                <span style="font-size:1.0rem;font-weight:800;color:#38bdf8;">최종: ${res.finalHandicap}</span>
            </div>
        `;
    },

    async saveSingle(memberId) {
        const m = this.members.find(item => item.id === memberId);
        if (!m) return;

        const res          = this.computeGHandicap(memberId);
        const useNormal    = document.getElementById(`chk-normal-${memberId}`)?.checked ?? true;
        const useGlobal    = document.getElementById(`chk-global-${memberId}`)?.checked ?? true;
        const normalId     = document.getElementById(`id-normal-${memberId}`)?.value.trim() || '';
        const globalId     = document.getElementById(`id-global-${memberId}`)?.value.trim() || '';
        const normalHandiVal = document.getElementById(`val-normal-${memberId}`)?.value.trim() || '';
        const globalHandiVal = document.getElementById(`val-global-${memberId}`)?.value.trim() || '';

        const configData = {
            useGolfzon:   useNormal,   // Normal = golfzon 필드
            useGlobal:    useGlobal,
            golfzonId:    normalId,
            globalId:     globalId,
            golfzonHandi: normalHandiVal !== '' && !isNaN(Number(normalHandiVal)) ? Number(normalHandiVal) : '',
            globalHandi:  globalHandiVal !== '' && !isNaN(Number(globalHandiVal)) ? Number(globalHandiVal) : '',
            finalHandicap: res ? res.finalHandicap : m.ghandicap
        };

        this.configs[memberId] = configData;
        await Store.saveGHandicapConfig(memberId, configData);
        await Store.updateMember(memberId, { ghandicap: configData.finalHandicap });

        const dispElem = document.getElementById(`disp-final-${memberId}`);
        if (dispElem) {
            dispElem.textContent = configData.finalHandicap !== null && configData.finalHandicap !== ''
                ? configData.finalHandicap : '미등록';
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
