/* ============================================
   GHANDICAP.JS — 멤버별 G-핸디 통합 관리 및 자동 산출
   ============================================ */

const GHandicapPage = {
    configs: {},
    members: [],

    async render() {
        return `
        <div class="version-banner" style="background: linear-gradient(135deg, rgba(99,102,241,0.18), rgba(139,92,246,0.25)); border: 1px solid rgba(99,102,241,0.35); border-radius: 12px; padding: 14px 18px; margin-bottom: 20px; box-shadow: 0 4px 14px rgba(0,0,0,0.18);">
            <div style="display:flex;justify-content:space-between;align-items:center;flex-wrap:wrap;gap:12px;">
                <div style="display:flex;align-items:center;gap:12px;">
                    <span style="font-size:1.6rem;">⛳</span>
                    <div>
                        <div style="font-weight:700;font-size:1.05rem;color:var(--text-primary);">멤버별 G-핸디(G-Handicap) 통합 관리 &amp; 자동 보정 시트</div>
                        <div style="font-size:0.83rem;color:var(--text-muted);margin-top:2px;">글로벌 골프존 &amp; 골프존 핸디를 반영하여 규칙 기반으로 자동 계산합니다.</div>
                    </div>
                </div>
                <button class="btn btn-primary" id="btn-save-all-ghandicap" style="font-weight:700;">💾 전체 G-핸디 일괄 저장</button>
            </div>
        </div>

        <!-- 외부 사이트 바로가기 & 규칙 안내 카드 -->
        <div style="display:grid;grid-template-columns:1fr 1fr;gap:14px;margin-bottom:20px;" class="form-grid">
            <div style="padding:14px 16px;background:rgba(30,41,59,0.7);border:1px solid rgba(56,189,248,0.3);border-radius:14px;">
                <div style="font-weight:700;color:#38bdf8;margin-bottom:8px;display:flex;align-items:center;gap:6px;font-size:0.95rem;">
                    🔗 골프존 사이트 친구목록 바로가기
                </div>
                <div style="display:flex;flex-direction:column;gap:6px;">
                    <a href="https://www.global.golfzon.com/ranking-golf-follow/757854" target="_blank" rel="noopener noreferrer" class="btn btn-ghost btn-sm" style="justify-content:flex-start;text-align:left;color:#38bdf8;border:1px solid rgba(56,189,248,0.25);">
                        🌐 1. 글로벌 골프존 친구목록 (global.golfzon.com) ➔
                    </a>
                    <a href="https://www.golfzon.com/scorecard/main" target="_blank" rel="noopener noreferrer" class="btn btn-ghost btn-sm" style="justify-content:flex-start;text-align:left;color:#a78bfa;border:1px solid rgba(167,139,250,0.25);">
                        ⛳ 2. 골프존 스코어카드 (golfzon.com) ➔
                    </a>
                </div>
            </div>

            <div style="padding:14px 16px;background:rgba(30,41,59,0.7);border:1px solid rgba(16,185,129,0.3);border-radius:14px;">
                <div style="font-weight:700;color:#34d399;margin-bottom:6px;font-size:0.95rem;">
                    📐 G-핸디 자동 산출 &amp; 보정 규칙
                </div>
                <ul style="font-size:0.8rem;color:var(--text-secondary);margin:0;padding-left:18px;line-height:1.5;">
                    <li><strong>1곳/2곳 선택 적용</strong>: 선택된 사이트 핸디의 평균값 계산</li>
                    <li><strong>5 이하 (≤ 5)</strong>: 반올림 적용 (`Math.round`)</li>
                    <li><strong>5 초과 (&gt; 5)</strong>: 내림 적용 (`Math.floor`)</li>
                    <li><strong>5 초과 시 하향 방지</strong>: 계산값이 기존 핸디보다 높으면(못 쳤을 때) 기존 핸디 유지</li>
                </ul>
            </div>
        </div>

        <!-- 멤버별 G-핸디 관리 시트 목록 -->
        <div id="ghandicap-members-container" style="display:flex;flex-direction:column;gap:16px;">
            <div class="text-center text-muted" style="padding:40px">⏳ 멤버 목록 불러오는 중...</div>
        </div>
        `;
    },

    async afterRender() {
        const [members, configs] = await Promise.all([
            Store.getMembers('active'),
            Store.getGHandicapConfigs()
        ]);

        this.members = members || [];
        this.configs = configs || {};

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
            const avatarText = m.nickname ? Utils.escapeHtml(m.nickname) : (m.name.length >= 3 ? m.name.slice(-2) : m.name);

            const useGlobal = cfg.useGlobal !== undefined ? cfg.useGlobal : true;
            const useGolfzon = cfg.useGolfzon !== undefined ? cfg.useGolfzon : true;
            const globalId = cfg.globalId || '';
            const golfzonId = cfg.golfzonId || '';
            const globalHandi = cfg.globalHandi !== undefined ? cfg.globalHandi : '';
            const golfzonHandi = cfg.golfzonHandi !== undefined ? cfg.golfzonHandi : '';
            const currentHandicap = cfg.finalHandicap !== undefined ? cfg.finalHandicap : (m.ghandicap || '');

            html += `
            <div class="ghandicap-card" id="ghcard-${m.id}" style="padding:16px 18px;background:linear-gradient(135deg, rgba(30,41,59,0.95), rgba(15,23,42,0.98));border:1px solid rgba(99,102,241,0.28);border-radius:16px;box-shadow:0 4px 16px rgba(0,0,0,0.2);box-sizing:border-box;width:100%;">
                
                <!-- 멤버 상단 헤더 -->
                <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:14px;flex-wrap:wrap;gap:10px;border-bottom:1px solid rgba(255,255,255,0.08);padding-bottom:10px;">
                    <div style="display:flex;align-items:center;gap:12px;">
                        <div class="member-avatar" style="height:44px;min-width:52px;padding:0 14px;font-size:0.95rem;font-weight:700;border-radius:22px;background:linear-gradient(135deg,#6366f1,#8b5cf6);color:#ffffff;display:inline-flex;align-items:center;justify-content:center;white-space:nowrap;">${avatarText}</div>
                        <div>
                            <div style="font-weight:700;font-size:1.1rem;color:#f8fafc;">${Utils.escapeHtml(m.name)}</div>
                            <div style="font-size:0.8rem;color:var(--text-muted);margin-top:2px;">소속: ${Utils.escapeHtml(m.company)}</div>
                        </div>
                    </div>
                    
                    <div style="display:flex;align-items:center;gap:10px;">
                        <div style="text-align:right;">
                            <div style="font-size:0.75rem;color:var(--text-muted);">현재 적용 G-핸디</div>
                            <div style="font-size:1.15rem;font-weight:800;color:#38bdf8;" id="disp-final-${m.id}">
                                ${currentHandicap !== '' && currentHandicap !== null ? currentHandicap : '미등록'}
                            </div>
                        </div>
                        <button class="btn btn-emerald btn-sm" onclick="GHandicapPage.saveSingle(${m.id})" style="font-weight:700;">💾 적용/저장</button>
                    </div>
                </div>

                <!-- 적용 대상 사이트 선택 & 아이디/핸디 입력 Grid -->
                <div style="display:grid;grid-template-columns:1fr 1fr;gap:14px;margin-bottom:12px;" class="form-grid">
                    
                    <!-- 🌐 글로벌 골프존 입력 칼럼 -->
                    <div style="padding:12px;background:rgba(15,23,42,0.6);border:1px solid rgba(56,189,248,0.2);border-radius:12px;">
                        <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:8px;">
                            <label style="display:flex;align-items:center;gap:6px;font-weight:700;color:#38bdf8;cursor:pointer;font-size:0.9rem;">
                                <input type="checkbox" id="chk-global-${m.id}" ${useGlobal ? 'checked' : ''} onchange="GHandicapPage.recalc(${m.id})">
                                🌐 글로벌 골프존 적용
                            </label>
                            ${globalId ? `<a href="https://www.global.golfzon.com/ranking-golf-follow/757854" target="_blank" rel="noopener" style="font-size:0.75rem;color:#38bdf8;text-decoration:none;">🔗 조회</a>` : ''}
                        </div>
                        <div style="display:flex;flex-direction:column;gap:8px;">
                            <div>
                                <span style="font-size:0.75rem;color:var(--text-muted);">글로벌 골프존 ID</span>
                                <input type="text" id="id-global-${m.id}" value="${Utils.escapeHtml(globalId)}" placeholder="예: global_id123" style="width:100%;box-sizing:border-box;margin-top:2px;">
                            </div>
                            <div>
                                <span style="font-size:0.75rem;color:var(--text-muted);">조회된 G-핸디</span>
                                <input type="number" step="0.1" id="val-global-${m.id}" value="${globalHandi}" placeholder="예: 3.2" oninput="GHandicapPage.recalc(${m.id})" style="width:100%;box-sizing:border-box;margin-top:2px;font-weight:700;">
                            </div>
                        </div>
                    </div>

                    <!-- ⛳ 골프존 입력 칼럼 -->
                    <div style="padding:12px;background:rgba(15,23,42,0.6);border:1px solid rgba(167,139,250,0.2);border-radius:12px;">
                        <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:8px;">
                            <label style="display:flex;align-items:center;gap:6px;font-weight:700;color:#a78bfa;cursor:pointer;font-size:0.9rem;">
                                <input type="checkbox" id="chk-golfzon-${m.id}" ${useGolfzon ? 'checked' : ''} onchange="GHandicapPage.recalc(${m.id})">
                                ⛳ 골프존 적용
                            </label>
                            ${golfzonId ? `<a href="https://www.golfzon.com/scorecard/main" target="_blank" rel="noopener" style="font-size:0.75rem;color:#a78bfa;text-decoration:none;">🔗 조회</a>` : ''}
                        </div>
                        <div style="display:flex;flex-direction:column;gap:8px;">
                            <div>
                                <span style="font-size:0.75rem;color:var(--text-muted);">골프존 ID</span>
                                <input type="text" id="id-golfzon-${m.id}" value="${Utils.escapeHtml(golfzonId)}" placeholder="예: golfzon_id456" style="width:100%;box-sizing:border-box;margin-top:2px;">
                            </div>
                            <div>
                                <span style="font-size:0.75rem;color:var(--text-muted);">조회된 G-핸디</span>
                                <input type="number" step="0.1" id="val-golfzon-${m.id}" value="${golfzonHandi}" placeholder="예: 4.4" oninput="GHandicapPage.recalc(${m.id})" style="width:100%;box-sizing:border-box;margin-top:2px;font-weight:700;">
                            </div>
                        </div>
                    </div>
                </div>

                <!-- 실시간 산출 & 보정 결과 라이브 프리뷰 바 -->
                <div id="preview-bar-${m.id}" style="padding:10px 14px;background:rgba(15,23,42,0.8);border:1px dashed rgba(255,255,255,0.15);border-radius:10px;font-size:0.85rem;display:flex;justify-content:space-between;align-items:center;flex-wrap:wrap;gap:8px;">
                    <!-- JS로 실시간 계산 결과 업데이트 -->
                </div>
            </div>
            `;
        });

        container.innerHTML = html;

        // 초기 실시간 계산 프리뷰 바 일괄 업데이트
        this.members.forEach(m => this.recalc(m.id));
    },

    /** G-핸디 보정 공식 계산 로직 */
    computeGHandicap(memberId) {
        const m = this.members.find(item => item.id === memberId);
        if (!m) return null;

        const cfg = this.configs[memberId] || {};
        const currentHandicapVal = cfg.finalHandicap !== undefined && cfg.finalHandicap !== '' && !isNaN(Number(cfg.finalHandicap))
            ? Number(cfg.finalHandicap)
            : (m.ghandicap !== undefined && m.ghandicap !== '' && !isNaN(Number(m.ghandicap)) ? Number(m.ghandicap) : null);

        const chkGlobal = document.getElementById(`chk-global-${memberId}`);
        const chkGolfzon = document.getElementById(`chk-golfzon-${memberId}`);
        const valGlobalElem = document.getElementById(`val-global-${memberId}`);
        const valGolfzonElem = document.getElementById(`val-golfzon-${memberId}`);

        const useGlobal = chkGlobal ? chkGlobal.checked : (cfg.useGlobal !== undefined ? cfg.useGlobal : true);
        const useGolfzon = chkGolfzon ? chkGolfzon.checked : (cfg.useGolfzon !== undefined ? cfg.useGolfzon : true);
        
        const globalStr = valGlobalElem ? valGlobalElem.value.trim() : (cfg.globalHandi !== undefined ? String(cfg.globalHandi) : '');
        const golfzonStr = valGolfzonElem ? valGolfzonElem.value.trim() : (cfg.golfzonHandi !== undefined ? String(cfg.golfzonHandi) : '');

        const globalVal = globalStr !== '' && !isNaN(Number(globalStr)) ? Number(globalStr) : null;
        const golfzonVal = golfzonStr !== '' && !isNaN(Number(golfzonStr)) ? Number(golfzonStr) : null;

        let validCount = 0;
        let sum = 0;

        if (useGlobal && globalVal !== null) {
            sum += globalVal;
            validCount++;
        }
        if (useGolfzon && golfzonVal !== null) {
            sum += golfzonVal;
            validCount++;
        }

        if (validCount === 0) {
            return {
                validCount: 0,
                rawAvg: null,
                computed: null,
                finalHandicap: currentHandicapVal,
                status: 'no_input',
                msg: '핸디 미입력 (기존 유지)'
            };
        }

        const rawAvg = sum / validCount;
        const formattedAvg = Math.round(rawAvg * 10) / 10;

        let computed = 0;
        let isRound = false;

        if (formattedAvg <= 5) {
            computed = Math.round(formattedAvg);
            isRound = true;
        } else {
            computed = Math.floor(formattedAvg);
            isRound = false;
        }

        let finalHandicap = computed;
        let status = 'applied';
        let msg = isRound ? `5 이하 ➔ 반올림 적용 (${formattedAvg} ➔ ${computed})` : `5 초과 ➔ 내림 적용 (${formattedAvg} ➔ ${computed})`;

        // 5 초과 시 하향 방지 (Handicap Floor Guard)
        if (formattedAvg > 5 && currentHandicapVal !== null && computed > currentHandicapVal) {
            finalHandicap = currentHandicapVal;
            status = 'guarded';
            msg = `🛡️ 5 초과 하향 방지 (계산 ${computed} > 기존 ${currentHandicapVal} ➔ 기존 핸디 유지)`;
        }

        return {
            validCount,
            rawAvg: formattedAvg,
            computed,
            finalHandicap,
            status,
            msg
        };
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

        const statusBadge = res.status === 'guarded'
            ? `<span style="color:#f59e0b;font-weight:700;">🛡️ 하향 방지 (기존 유지)</span>`
            : `<span style="color:#34d399;font-weight:700;">✅ 신규 핸디 적용</span>`;

        previewBar.innerHTML = `
            <div>
                <span style="color:#f8fafc;font-weight:600;">평균: <strong>${res.rawAvg}</strong></span>
                <span style="color:var(--text-muted);margin:0 6px;">➔</span>
                <span style="font-size:0.82rem;color:var(--text-secondary);">${res.msg}</span>
            </div>
            <div>
                ${statusBadge}
                <span style="margin-left:8px;font-size:0.95rem;font-weight:800;color:#38bdf8;">최종: ${res.finalHandicap}</span>
            </div>
        `;
    },

    async saveSingle(memberId) {
        const m = this.members.find(item => item.id === memberId);
        if (!m) return;

        const res = this.computeGHandicap(memberId);
        const useGlobal = document.getElementById(`chk-global-${memberId}`)?.checked ?? true;
        const useGolfzon = document.getElementById(`chk-golfzon-${memberId}`)?.checked ?? true;
        const globalId = document.getElementById(`id-global-${memberId}`)?.value.trim() || '';
        const golfzonId = document.getElementById(`id-golfzon-${memberId}`)?.value.trim() || '';
        const globalHandiVal = document.getElementById(`val-global-${memberId}`)?.value.trim();
        const golfzonHandiVal = document.getElementById(`val-golfzon-${memberId}`)?.value.trim();

        const configData = {
            useGlobal,
            useGolfzon,
            globalId,
            golfzonId,
            globalHandi: globalHandiVal !== '' && !isNaN(Number(globalHandiVal)) ? Number(globalHandiVal) : '',
            golfzonHandi: golfzonHandiVal !== '' && !isNaN(Number(golfzonHandiVal)) ? Number(golfzonHandiVal) : '',
            finalHandicap: res ? res.finalHandicap : m.ghandicap
        };

        this.configs[memberId] = configData;
        await Store.saveGHandicapConfig(memberId, configData);

        // 멤버 객체에도 ghandicap 업데이트 반영
        await Store.updateMember(memberId, { ghandicap: configData.finalHandicap });

        const dispElem = document.getElementById(`disp-final-${memberId}`);
        if (dispElem) {
            dispElem.textContent = configData.finalHandicap !== null && configData.finalHandicap !== '' ? configData.finalHandicap : '미등록';
        }

        Utils.toast(`[${m.name}] 님의 G-핸디가 ${configData.finalHandicap} (으)로 저장 및 적용되었습니다!`, 'success');
    },

    async saveAll() {
        if (this.members.length === 0) return;

        for (const m of this.members) {
            await this.saveSingle(m.id);
        }

        Utils.toast('모든 멤버의 G-핸디 설정 및 계산 결과가 저장되었습니다!', 'success');
    }
};

Router.register('ghandicap', GHandicapPage);
window.GHandicapPage = GHandicapPage;
