/* ============================================
   CLUB.JS — 회사 모임 관리 페이지
   ============================================ */

const ClubPage = {
    currentTab: 'games',

    async render() {
        const tab = this.currentTab || 'games';
        return `
        <div class="tabs">
            <button class="tab-btn ${tab === 'games' ? 'active' : ''}" data-tab="games">🎮 게임 기록</button>
            <button class="tab-btn ${tab === 'members' ? 'active' : ''}" data-tab="members">👥 멤버 관리</button>
            <button class="tab-btn ${tab === 'ranking' ? 'active' : ''}" data-tab="ranking">🏆 순위/성적</button>
            <button class="tab-btn ${tab === 'calculator' ? 'active' : ''}" data-tab="calculator">🧮 회비 산출 시트</button>
        </div>
        <div id="club-tab-content"></div>`;
    },

    async afterRender() {
        document.querySelectorAll('.tab-btn').forEach(btn => {
            btn.classList.toggle('active', btn.dataset.tab === this.currentTab);
            btn.addEventListener('click', () => {
                document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
                btn.classList.add('active');
                this.currentTab = btn.dataset.tab;
                this.renderTab();
            });
        });
        await this.renderTab();
    },

    async switchTab(tabName) {
        this.currentTab = tabName;
        document.querySelectorAll('.tab-btn').forEach(b => {
            b.classList.toggle('active', b.dataset.tab === tabName);
        });
        document.querySelectorAll('.bottom-nav-item').forEach(b => {
            if (b.dataset.page === 'club') {
                b.classList.toggle('active', b.dataset.tab === tabName);
            }
        });
        await this.renderTab();
    },

    async renderTab() {
        const container = document.getElementById('club-tab-content');
        if (!container) return;
        container.innerHTML = '<div class="text-center text-muted" style="padding:40px">⏳ 로딩 중...</div>';
        try {
            if (!this.currentTab || !['games', 'members', 'ranking', 'calculator'].includes(this.currentTab)) {
                this.currentTab = 'games';
            }
            switch (this.currentTab) {
                case 'games': await this.renderGames(container); break;
                case 'members': await this.renderMembers(container); break;
                case 'ranking': await this.renderRanking(container); break;
                case 'calculator': await this.renderCalculator(container); break;
                default: await this.renderGames(container); break;
            }
        } catch (err) {
            console.error('renderTab error:', err);
            container.innerHTML = `<div class="empty-state"><div class="empty-icon">⚠️</div><p class="empty-text">페이지 탭 로딩 중 문제가 발생했습니다.</p><p class="text-muted" style="font-size:0.85rem;">${Utils.escapeHtml(err.message || String(err))}</p></div>`;
        }
    },

    gamesMap: {},

    // ─── 게임 기록 탭 ───
    async renderGames(container) {
        const games = await Store.getGames({ limit: 50 });
        const calcHistories = await Store.getCalcHistoryList();
        const calcMap = {};
        (calcHistories || []).forEach(c => {
            if (c && c.calc_date) {
                const dateKey = String(c.calc_date).slice(0, 10);
                calcMap[dateKey] = c;
            }
        });

        // 비활성 멤버 포함 전체 멤버 이름 맵 (이전 기록 표시 보장)
        let allMembersMap = {};
        try {
            const allMembers = await Store.getMembers(); // status 필터 없음 → 전체
            (allMembers || []).forEach(m => { if (m && m.id) allMembersMap[m.id] = m.name; });
        } catch (e) { }

        this.gamesMap = {};
        games.forEach(g => this.gamesMap[g.id] = g);

        container.innerHTML = `
            <div class="section-header">
                <span class="section-title">게임 기록</span>
                <div style="display:flex;gap:8px;">
                    <button class="btn btn-ghost btn-sm" id="btn-sync-games" style="color:#38bdf8;border:1px solid rgba(56,189,248,0.3);" title="PC 로컬 기록을 클라우드 DB로 동기화">🔄 동기화</button>
                    <button class="btn btn-primary btn-sm" id="btn-add-game">+ 게임 추가</button>
                </div>
            </div>
            ${games.length === 0 ? '<div class="empty-state"><div class="empty-icon">⛳</div><p class="empty-text">아직 게임 기록이 없습니다</p></div>' : `
            <div style="display:flex;flex-direction:column;gap:6px;">
                ${games.map(g => {
            const gDateKey = String(g.game_date || '').slice(0, 10);
            const calc = calcMap[gDateKey];
            const parts = (g.club_game_participants || []).sort((a, b) => (a.ranking || 99) - (b.ranking || 99));
            const hasUnranked = parts.some(p => !p.ranking);

            // 참여자 인라인 배지 — 비활성 멤버도 allMembersMap으로 이름 보정
            const rankEmojis = ['🥇', '🥈', '🥉'];
            const partBadges = parts.map(p => {
                // club_members.name 우선, 없으면 전체멤버맵에서 보정
                const name = (p.club_members?.name) || allMembersMap[p.member_id] || '?';
                const r = p.ranking;
                const colors = ['#f59e0b', '#94a3b8', '#c084fc'];
                const rc = r >= 1 && r <= 3 ? colors[r - 1] : '#64748b';
                const emoji = r >= 1 && r <= 3 ? rankEmojis[r - 1] : '';
                const rankTxt = r ? `${emoji}${r}위` : '?위';
                let feeHint = '';
                if (calc && r && calc.rank_amounts && calc.rank_amounts[r - 1] !== undefined) {
                    feeHint = `<span style="color:#10b981;font-size:0.7rem;">(${Utils.formatVND(calc.rank_amounts[r - 1])})</span>`;
                }
                return `<span style="display:inline-flex;align-items:center;gap:3px;padding:2px 8px;border-radius:20px;background:rgba(255,255,255,0.06);border:1px solid rgba(255,255,255,0.09);font-size:0.79rem;white-space:nowrap;">
                            <span style="color:${rc};font-weight:700;font-size:0.74rem;">${rankTxt}</span>
                            <span style="color:#e2e8f0;font-weight:600;">${Utils.escapeHtml(name)}</span>${feeHint}
                        </span>`;
            }).join('');

            return `
                    <div style="padding:9px 13px;background:linear-gradient(135deg, rgba(30,41,59,0.92), rgba(15,23,42,0.97));border:1px solid rgba(99,102,241,0.2);border-radius:11px;box-sizing:border-box;width:100%;">
                        <!-- 1줄: 날짜/장소/비용/버튼 -->
                        <div style="display:flex;align-items:center;justify-content:space-between;gap:8px;flex-wrap:wrap;">
                            <div style="display:flex;align-items:center;gap:8px;flex-wrap:wrap;min-width:0;flex:1;">
                                <span style="font-weight:700;font-size:0.87rem;color:#f8fafc;white-space:nowrap;">📅 ${Utils.formatDateKR(g.game_date)}</span>
                                <span style="font-size:0.8rem;color:#38bdf8;white-space:nowrap;">📍 ${Utils.escapeHtml(g.location)}</span>
                                <span style="font-size:0.78rem;color:#94a3b8;white-space:nowrap;">💰 ${calc ? Utils.formatVND(calc.total_cost) : Utils.formatVND(g.total_cost)}</span>
                                ${calc ? `<span style="font-size:0.7rem;color:#34d399;background:rgba(16,185,129,0.11);border:1px solid rgba(16,185,129,0.28);padding:1px 5px;border-radius:4px;white-space:nowrap;">📊연동</span>` : ''}
                                ${g.memo ? `<span style="font-size:0.75rem;color:var(--text-muted);white-space:nowrap;overflow:hidden;text-overflow:ellipsis;max-width:100px;">${Utils.escapeHtml(g.memo)}</span>` : ''}
                            </div>
                            <div style="display:flex;gap:5px;flex-shrink:0;">
                                <button class="btn ${hasUnranked ? 'btn-emerald' : 'btn-ghost'} btn-sm" onclick="ClubPage.openGameModal(${g.id})" style="font-size:0.76rem;padding:3px 9px;">
                                    ${hasUnranked ? '🏆 순위' : '✏️ 수정'}
                                </button>
                                <button class="btn btn-danger btn-sm" onclick="ClubPage.deleteGame(${g.id})" style="font-size:0.76rem;padding:3px 7px;" title="삭제">🗑️</button>
                            </div>
                        </div>
                        <!-- 2줄: 참여자 배지 -->
                        ${parts.length > 0 ? `
                        <div style="display:flex;flex-wrap:wrap;gap:4px;margin-top:6px;padding-top:6px;border-top:1px solid rgba(255,255,255,0.055);">
                            ${partBadges}
                        </div>` : ''}
                    </div>
                    `;
        }).join('')}
            </div>
            `}`;

        const btnAddGame = document.getElementById('btn-add-game');
        if (btnAddGame) {
            btnAddGame.addEventListener('click', () => this.openGameModal());
        }

        const btnSyncGames = document.getElementById('btn-sync-games');
        if (btnSyncGames) {
            btnSyncGames.addEventListener('click', async () => {
                Utils.toast('⏳ 클라우드 DB 동기화 진행 중...', 'info');
                const res = await Store.syncAllLocalDataToSupabase();
                if (res.syncedGamesCount > 0 || res.syncedMembersCount > 0) {
                    Utils.toast(`✅ 클라우드 DB 동기화 완료! (${res.syncedGamesCount}건 게임 동기화됨)`, 'success');
                } else {
                    Utils.toast('✅ 이미 클라우드 DB와 모든 데이터가 동기화되어 있습니다!', 'success');
                }
                await this.renderGames(container);
            });
        }
    },

    async openGameModal(gameId = null) {
        const editGame = (gameId && this.gamesMap) ? this.gamesMap[gameId] : null;

        // 활성 멤버 + 전체 비활성 멤버 모두 포함
        const activeMembers = await Store.getMembers('active');
        const allMembers = await Store.getMembers(); // status 무관 전체
        const games = await Store.getGames();
        const activeMemberIds = new Set((activeMembers || []).map(m => m.id));

        // 가장 최근 게임 참여자 ID 목록
        let recentParticipantIds = new Set();
        if (games && games.length > 0) {
            const sortedGames = [...games].sort((a, b) => new Date(b.game_date) - new Date(a.game_date));
            const lastGame = sortedGames[0];
            if (lastGame && lastGame.club_game_participants) {
                lastGame.club_game_participants.forEach(p => recentParticipantIds.add(p.member_id));
            }
        }

        // 비활성 멤버 추출
        const inactiveMembers = (allMembers || []).filter(m => m && m.id && !activeMemberIds.has(m.id));

        let inactiveParticipants = [];
        let otherInactiveMembers = [];
        if (editGame && editGame.club_game_participants) {
            const allMembersMap = {};
            (allMembers || []).forEach(m => { if (m && m.id) allMembersMap[m.id] = m; });
            const participantIds = new Set(editGame.club_game_participants.map(p => p.member_id));

            editGame.club_game_participants.forEach(p => {
                if (!activeMemberIds.has(p.member_id)) {
                    const m = allMembersMap[p.member_id];
                    if (m) inactiveParticipants.push(m);
                }
            });
            otherInactiveMembers = inactiveMembers.filter(m => !participantIds.has(m.id));
        } else {
            otherInactiveMembers = inactiveMembers;
        }

        // 활성 멤버 + 비활성 참여자 + 나머지 비활성 멤버
        const members = [...activeMembers, ...inactiveParticipants, ...otherInactiveMembers];

        // 기존 참여자 맵 생성 (member_id -> ranking)
        const selectedMap = {}; // member_id -> ranking (or null)
        if (editGame && editGame.club_game_participants) {
            editGame.club_game_participants.forEach(p => {
                selectedMap[p.member_id] = p.ranking !== undefined && p.ranking !== null ? p.ranking : null;
            });
        }

        const defaultDate = editGame && editGame.game_date ? Utils.formatDate(editGame.game_date) : Utils.today();

        Modal.open(editGame ? '🏆 게임 기록 & 순위 수정' : '⛳ 게임 기록 입력 (참여자 등록)', `
            <!-- 기본 정보 그리드 -->
            <div class="form-grid" style="display:grid;grid-template-columns:repeat(auto-fit,minmax(140px,1fr));gap:10px;">
                <div class="form-group" style="margin-bottom:6px;">
                    <label style="font-size:0.78rem;font-weight:700;">게임 날짜</label>
                    <input type="date" id="game-date" value="${defaultDate}" style="height:34px;font-size:0.85rem;">
                </div>
                <div class="form-group" style="margin-bottom:6px;">
                    <label style="font-size:0.78rem;font-weight:700;">장소</label>
                    <input type="text" id="game-location" value="${editGame ? Utils.escapeHtml(editGame.location) : '스크린골프장'}" style="height:34px;font-size:0.85rem;">
                </div>
                <div class="form-group" style="margin-bottom:6px;">
                    <label style="font-size:0.78rem;font-weight:700;">총 비용 (VND)</label>
                    <input type="text" id="game-cost" value="${editGame ? Utils.formatVND(editGame.total_cost).replace('₫', '').trim() : ''}" placeholder="예: 800000" inputmode="numeric" style="height:34px;font-size:0.85rem;">
                </div>
            </div>

            <div id="game-modal-calc-info"></div>

            <!-- 참여자 선택 섹션 -->
            <div style="margin-top:12px;background:rgba(15,23,42,0.6);border:1px solid rgba(99,102,241,0.25);border-radius:12px;padding:12px;">
                <div style="display:flex;justify-content:space-between;align-items:center;flex-wrap:wrap;gap:6px;margin-bottom:10px;">
                    <div style="font-weight:800;font-size:0.88rem;color:#f8fafc;display:flex;align-items:center;gap:6px;">
                        <span>👥 참석자 선택</span>
                        <span id="part-count-badge" style="font-size:0.72rem;padding:2px 8px;border-radius:12px;background:rgba(52,211,153,0.18);border:1px solid rgba(52,211,153,0.4);color:#34d399;font-weight:700;">0명 선택</span>
                    </div>
                    <!-- 퀵 프리셋 버튼 바 -->
                    <div style="display:flex;gap:4px;flex-wrap:wrap;">
                        <button type="button" id="btn-quick-regular" class="btn btn-ghost btn-sm" style="font-size:0.7rem;padding:3px 8px;border-radius:6px;border:1px solid rgba(192,132,252,0.4);color:#c084fc;background:rgba(192,132,252,0.08);">⚡ 상시 전체</button>
                        <button type="button" id="btn-quick-recent" class="btn btn-ghost btn-sm" style="font-size:0.7rem;padding:3px 8px;border-radius:6px;border:1px solid rgba(56,189,248,0.4);color:#38bdf8;background:rgba(56,189,248,0.08);">🔄 최근 게임</button>
                        <button type="button" id="btn-quick-all" class="btn btn-ghost btn-sm" style="font-size:0.7rem;padding:3px 6px;border-radius:6px;border:1px solid rgba(255,255,255,0.15);color:#cbd5e1;">전체</button>
                        <button type="button" id="btn-quick-clear" class="btn btn-ghost btn-sm" style="font-size:0.7rem;padding:3px 6px;border-radius:6px;border:1px solid rgba(255,255,255,0.15);color:#94a3b8;">해제</button>
                    </div>
                </div>

                <!-- 멤버 칩 그리드 -->
                <div id="game-members-chips-grid" style="display:grid;grid-template-columns:repeat(auto-fill,minmax(125px,1fr));gap:6px;max-height:190px;overflow-y:auto;padding-right:2px;">
                    <!-- JS로 동적 렌더링 -->
                </div>
            </div>

            <!-- 순위 지정 섹션 (선택된 멤버만 노출) -->
            <div style="margin-top:12px;background:rgba(15,23,42,0.6);border:1px solid rgba(52,211,153,0.25);border-radius:12px;padding:12px;">
                <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:8px;">
                    <div style="font-weight:800;font-size:0.85rem;color:#34d399;display:flex;align-items:center;gap:6px;">
                        <span>🏆 순위 지정 (원클릭)</span>
                        <span style="font-size:0.7rem;color:#94a3b8;font-weight:normal;">💡 게임 전이면 비워두셔도 됩니다</span>
                    </div>
                    <button type="button" id="btn-clear-all-ranks" class="btn btn-ghost btn-sm" style="font-size:0.68rem;padding:2px 6px;color:#94a3b8;">순위 초기화</button>
                </div>
                <div id="game-ranking-container" style="display:flex;flex-direction:column;gap:6px;max-height:220px;overflow-y:auto;">
                    <!-- JS로 동적 렌더링 -->
                </div>
            </div>

            <!-- 메모 입력 -->
            <div class="form-group" style="margin-top:10px;margin-bottom:0;">
                <input type="text" id="game-memo" value="${editGame ? Utils.escapeHtml(editGame.memo || '') : ''}" placeholder="메모 (선택사항, 예: 니어리스트 남대호)" style="height:34px;font-size:0.82rem;">
            </div>
        `, `
            <button class="btn btn-ghost" onclick="Modal.close()">취소</button>
            <button class="btn btn-primary" id="btn-save-game" style="font-weight:800;padding:6px 18px;">${editGame ? '💾 수정 완료' : '💾 게임 저장'}</button>
        `);

        // ── 렌더링 및 인터랙션 로직 ──
        const renderChipsAndRanks = () => {
            const chipsGrid = document.getElementById('game-members-chips-grid');
            const rankContainer = document.getElementById('game-ranking-container');
            const countBadge = document.getElementById('part-count-badge');
            if (!chipsGrid || !rankContainer) return;

            const selectedMemberIds = Object.keys(selectedMap).map(Number);
            if (countBadge) {
                const teams = Math.floor(selectedMemberIds.length / 4);
                const remainder = selectedMemberIds.length % 4;
                let teamStr = '';
                if (selectedMemberIds.length >= 4) {
                    teamStr = ` (${teams}팀${remainder > 0 ? ` +${remainder}명` : ''})`;
                }
                countBadge.textContent = `${selectedMemberIds.length}명 선택${teamStr}`;
                countBadge.style.color = selectedMemberIds.length > 0 ? '#34d399' : '#94a3b8';
            }

            // 1. 칩 렌더링
            chipsGrid.innerHTML = members.map(m => {
                const isSelected = selectedMap[m.id] !== undefined;
                const handiText = m.ghandicap !== undefined && m.ghandicap !== null && m.ghandicap !== '' ? ` (${m.ghandicap})` : '';
                const isInactive = m.status !== 'active';
                const avatarText = m.nickname ? Utils.escapeHtml(m.nickname) : (m.name.length >= 3 ? m.name.slice(-2) : m.name);

                const activeStyle = isSelected
                    ? 'background:linear-gradient(135deg,rgba(16,185,129,0.25),rgba(5,150,105,0.35));border:1.5px solid #10b981;box-shadow:0 0 10px rgba(16,185,129,0.25);'
                    : 'background:rgba(30,41,59,0.4);border:1px solid rgba(255,255,255,0.08);opacity:0.85;';

                return `
                    <div class="part-chip-btn" data-mid="${m.id}"
                         style="display:flex;align-items:center;gap:6px;padding:5px 8px;border-radius:8px;cursor:pointer;user-select:none;transition:all 0.15s;${activeStyle}${isInactive ? 'opacity:0.6;' : ''}">
                        <div style="width:22px;height:22px;border-radius:6px;background:${isSelected ? 'linear-gradient(135deg,#10b981,#059669)' : 'linear-gradient(135deg,#6366f1,#8b5cf6)'};color:#fff;font-size:0.62rem;font-weight:800;display:flex;align-items:center;justify-content:center;flex-shrink:0;">
                            ${isSelected ? '✓' : avatarText}
                        </div>
                        <div style="min-width:0;flex:1;">
                            <div style="font-size:0.78rem;font-weight:700;color:${isSelected ? '#34d399' : '#e2e8f0'};white-space:nowrap;overflow:hidden;text-overflow:ellipsis;">
                                ${Utils.escapeHtml(m.name)}<span style="font-size:0.7rem;color:#a78bfa;font-weight:600;">${handiText}</span>
                            </div>
                            <div style="font-size:0.62rem;color:${m.member_type === 'regular' ? '#c084fc' : '#38bdf8'};font-weight:600;">
                                ${m.member_type === 'regular' ? '상시' : '출장'}${isInactive ? '·비활성' : ''}
                            </div>
                        </div>
                    </div>
                `;
            }).join('');

            // 칩 클릭 이벤트 바인딩
            chipsGrid.querySelectorAll('.part-chip-btn').forEach(btn => {
                btn.addEventListener('click', () => {
                    const mid = Number(btn.dataset.mid);
                    if (selectedMap[mid] !== undefined) {
                        delete selectedMap[mid];
                    } else {
                        selectedMap[mid] = null;
                    }
                    renderChipsAndRanks();
                });
            });

            // 2. 순위 입력 섹션 렌더링
            if (selectedMemberIds.length === 0) {
                rankContainer.innerHTML = `
                    <div style="text-align:center;padding:16px;color:#64748b;font-size:0.78rem;">
                        👆 위에서 참석 멤버를 선택하면 순위를 지정할 수 있습니다.
                    </div>
                `;
                return;
            }

            const totalSelected = selectedMemberIds.length;
            const maxRank = Math.min(totalSelected, 12);

            rankContainer.innerHTML = selectedMemberIds.map((mid, idx) => {
                const m = members.find(item => item.id === mid);
                if (!m) return '';
                const currentRank = selectedMap[mid];
                const rankText = currentRank ? `${currentRank}등` : '미정';
                const avatarText = m.nickname ? Utils.escapeHtml(m.nickname) : (m.name.length >= 3 ? m.name.slice(-2) : m.name);

                let rankBadgeBg = 'background:rgba(30,41,59,0.6);color:#94a3b8;border:1px solid rgba(255,255,255,0.1);';
                if (currentRank === 1) rankBadgeBg = 'background:linear-gradient(135deg,#f59e0b,#d97706);color:#fff;border:1px solid #f59e0b;';
                else if (currentRank === 2) rankBadgeBg = 'background:linear-gradient(135deg,#94a3b8,#64748b);color:#fff;border:1px solid #94a3b8;';
                else if (currentRank === 3) rankBadgeBg = 'background:linear-gradient(135deg,#b45309,#78350f);color:#fff;border:1px solid #b45309;';
                else if (currentRank) rankBadgeBg = 'background:rgba(52,211,153,0.2);color:#34d399;border:1px solid rgba(52,211,153,0.5);';

                // 1등부터 N등까지의 원클릭 버튼 생성
                const rankButtons = [];
                for (let r = 1; r <= maxRank; r++) {
                    const isRankActive = currentRank === r;
                    const rEmoji = r === 1 ? '🥇' : (r === 2 ? '🥈' : (r === 3 ? '🥉' : `${r}`));
                    const rStyle = isRankActive
                        ? 'background:#10b981;color:#fff;font-weight:800;border:1px solid #10b981;box-shadow:0 0 6px rgba(16,185,129,0.5);'
                        : 'background:rgba(30,41,59,0.7);color:#cbd5e1;border:1px solid rgba(255,255,255,0.1);';

                    rankButtons.push(`
                        <button type="button" class="btn-assign-rank" data-mid="${mid}" data-rank="${r}"
                                style="font-size:0.68rem;padding:2px 6px;border-radius:4px;cursor:pointer;${rStyle}line-height:1.2;">
                            ${rEmoji}
                        </button>
                    `);
                }

                return `
                    <div style="display:flex;align-items:center;justify-content:space-between;gap:8px;padding:6px 10px;background:rgba(30,41,59,0.45);border:1px solid rgba(255,255,255,0.05);border-radius:8px;flex-wrap:wrap;">
                        <!-- 멤버 이름 & 현재 등수 -->
                        <div style="display:flex;align-items:center;gap:6px;min-width:110px;">
                            <div style="width:26px;height:20px;border-radius:4px;font-size:0.68rem;font-weight:800;display:flex;align-items:center;justify-content:center;${rankBadgeBg}">
                                ${currentRank ? `${currentRank}` : '—'}
                            </div>
                            <span style="font-weight:700;font-size:0.8rem;color:#f8fafc;">${Utils.escapeHtml(m.name)}</span>
                            <span style="font-size:0.7rem;color:#a78bfa;">${m.ghandicap !== undefined && m.ghandicap !== null && m.ghandicap !== '' ? `(${m.ghandicap})` : ''}</span>
                        </div>

                        <!-- 등수 선택 원클릭 버튼 세트 -->
                        <div style="display:flex;align-items:center;gap:3px;flex-wrap:wrap;">
                            ${rankButtons.join('')}
                            <button type="button" class="btn-assign-rank" data-mid="${mid}" data-rank="clear"
                                    title="순위 취소"
                                    style="font-size:0.65rem;padding:2px 5px;border-radius:4px;background:rgba(239,68,68,0.15);color:#f87171;border:1px solid rgba(239,68,68,0.3);cursor:pointer;line-height:1.2;">
                                ✕
                            </button>
                        </div>
                    </div>
                `;
            }).join('');

            // 순위 버튼 클릭 이벤트 바인딩
            rankContainer.querySelectorAll('.btn-assign-rank').forEach(btn => {
                btn.addEventListener('click', () => {
                    const mid = Number(btn.dataset.mid);
                    const rankVal = btn.dataset.rank;
                    if (rankVal === 'clear') {
                        selectedMap[mid] = null;
                    } else {
                        const targetRank = Number(rankVal);
                        // 이미 다른 멤버가 해당 등수면 스왑하거나 그 멤버는 미정으로 변경
                        Object.keys(selectedMap).forEach(otherMid => {
                            if (Number(otherMid) !== mid && selectedMap[otherMid] === targetRank) {
                                selectedMap[otherMid] = null;
                            }
                        });
                        selectedMap[mid] = targetRank;
                    }
                    renderChipsAndRanks();
                });
            });
        };

        // ── 퀵 버튼 이벤트 연결 ──
        document.getElementById('btn-quick-regular').addEventListener('click', () => {
            members.forEach(m => {
                if (m.status === 'active' && m.member_type === 'regular') {
                    if (selectedMap[m.id] === undefined) selectedMap[m.id] = null;
                }
            });
            renderChipsAndRanks();
        });

        document.getElementById('btn-quick-recent').addEventListener('click', () => {
            if (recentParticipantIds.size === 0) {
                Utils.toast('이전 게임 기록이 없습니다', 'info');
                return;
            }
            // 기존 선택 초기화 후 최근 참여자만 선택
            Object.keys(selectedMap).forEach(k => delete selectedMap[k]);
            members.forEach(m => {
                if (recentParticipantIds.has(m.id)) {
                    selectedMap[m.id] = null;
                }
            });
            renderChipsAndRanks();
        });

        document.getElementById('btn-quick-all').addEventListener('click', () => {
            members.forEach(m => {
                if (m.status === 'active') {
                    if (selectedMap[m.id] === undefined) selectedMap[m.id] = null;
                }
            });
            renderChipsAndRanks();
        });

        document.getElementById('btn-quick-clear').addEventListener('click', () => {
            Object.keys(selectedMap).forEach(k => delete selectedMap[k]);
            renderChipsAndRanks();
        });

        document.getElementById('btn-clear-all-ranks').addEventListener('click', () => {
            Object.keys(selectedMap).forEach(mid => { selectedMap[mid] = null; });
            renderChipsAndRanks();
        });

        // 초기 렌더링
        renderChipsAndRanks();

        const checkAndRenderCalcNotice = async () => {
            const dateVal = document.getElementById('game-date').value;
            const calcInfoElem = document.getElementById('game-modal-calc-info');
            const costInput = document.getElementById('game-cost');
            if (!dateVal || !calcInfoElem) return;

            const calc = await Store.getCalcHistoryByDate(dateVal);
            if (calc) {
                if (costInput && (!costInput.value || costInput.dataset.autoPopulated === 'true' || !editGame)) {
                    costInput.value = Utils.formatVND(calc.total_cost).replace('₫', '').trim();
                    costInput.dataset.autoPopulated = 'true';
                }
                const rankSummary = (calc.rank_amounts || []).map((amt, idx) => `[${idx + 1}등: ${Utils.formatVND(amt)}]`).join('  ');
                calcInfoElem.innerHTML = `
                    <div style="padding:8px 12px;background:rgba(16,185,129,0.12);border:1px solid rgba(16,185,129,0.35);border-radius:8px;margin-top:8px;">
                        <div style="font-weight:700;font-size:0.8rem;color:#10b981;display:flex;align-items:center;gap:6px;">
                            📊 [${calc.calc_date}] 회비 산출 시트 연동됨 (총 비용: ${Utils.formatVND(calc.total_cost)})
                        </div>
                        <div style="font-size:0.75rem;color:var(--text-primary);margin-top:3px;">
                            💡 <strong>등수별 회비:</strong> ${rankSummary}
                        </div>
                    </div>
                `;
            } else {
                if (costInput && costInput.dataset.autoPopulated === 'true') {
                    costInput.value = '';
                    costInput.dataset.autoPopulated = 'false';
                }
                calcInfoElem.innerHTML = `
                    <div style="padding:6px 10px;background:rgba(245,158,11,0.1);border:1px solid rgba(245,158,11,0.3);border-radius:8px;margin-top:8px;font-size:0.75rem;color:#f59e0b;">
                        ⚠️ 해당 날짜(${dateVal})의 회비 산출 시트가 없습니다. (직접 비용 입력 가능)
                    </div>
                `;
            }
        };

        checkAndRenderCalcNotice();
        document.getElementById('game-date').addEventListener('change', checkAndRenderCalcNotice);

        // ── 저장 버튼 클릭 ──
        document.getElementById('btn-save-game').addEventListener('click', async () => {
            const gameDate = document.getElementById('game-date').value;
            const calc = await Store.getCalcHistoryByDate(gameDate);
            const inputCost = Utils.parseAmount(document.getElementById('game-cost').value);

            const game = {
                game_date: gameDate,
                location: document.getElementById('game-location').value.trim() || '스크린골프장',
                total_cost: inputCost > 0 ? inputCost : (calc ? calc.total_cost : 0),
                memo: document.getElementById('game-memo').value.trim()
            };
            if (!game.game_date) { Utils.toast('날짜를 입력해주세요', 'error'); return; }

            const selectedMemberIds = Object.keys(selectedMap).map(Number);
            if (selectedMemberIds.length === 0) {
                Utils.toast('참여자를 1명 이상 선택해주세요', 'warning');
                return;
            }

            const participants = selectedMemberIds.map(mid => ({
                member_id: mid,
                ranking: selectedMap[mid] !== undefined && selectedMap[mid] !== null ? Number(selectedMap[mid]) : null
            }));

            if (editGame) {
                await Store.updateGame(editGame.id, game, participants);
            } else {
                await Store.addGame(game, participants);
            }

            Utils.toast(editGame ? '게임 기록 및 순위가 수정되었습니다!' : '게임 기록이 저장되었습니다!', 'success');
            Modal.close();
            await this.renderTab();
        });
    },

    async deleteGame(id) {
        const ok = await Modal.confirm('게임 삭제', '이 게임 기록을 삭제하시겠습니까?');
        if (ok) {
            await Store.deleteGame(id);
            Utils.toast('삭제되었습니다', 'success');
            this.renderTab();
        }
    },

    membersMap: {},

    // ─── 멤버 관리 탭 ───
    async renderMembers(container) {
        const members = await Store.getMembers();
        this.membersMap = {};
        members.forEach(m => this.membersMap[m.id] = m);

        container.innerHTML = `
            <div class="section-header">
                <span class="section-title">모임 멤버</span>
                <button class="btn btn-primary" id="btn-add-member">+ 멤버 추가</button>
            </div>
            <div class="club-members-grid" style="display:grid;grid-template-columns:repeat(auto-fill, minmax(240px, 1fr));gap:16px;">
                ${members.map(m => {
            const avatarText = m.nickname ? Utils.escapeHtml(m.nickname) : (m.name.length >= 3 ? m.name.slice(-2) : m.name);
            const typeBadge = m.member_type === 'regular'
                ? `<span style="background:rgba(16,185,129,0.18);color:#34d399;border:1px solid rgba(16,185,129,0.35);font-size:0.82rem;font-weight:700;padding:2px 8px;border-radius:6px;white-space:nowrap;">상시</span>`
                : `<span style="background:rgba(139,92,246,0.18);color:#c084fc;border:1px solid rgba(139,92,246,0.35);font-size:0.82rem;font-weight:700;padding:2px 8px;border-radius:6px;white-space:nowrap;">출장</span>`;
            const statusBadge = m.status === 'active'
                ? `<span style="background:rgba(56,189,248,0.15);color:#38bdf8;border:1px solid rgba(56,189,248,0.3);font-size:0.78rem;padding:2px 6px;border-radius:6px;white-space:nowrap;">활동중</span>`
                : (m.status === 'inactive' ? `<span style="background:rgba(148,163,184,0.15);color:#94a3b8;font-size:0.78rem;padding:2px 6px;border-radius:6px;white-space:nowrap;">비활동</span>` : `<span style="background:rgba(244,63,94,0.15);color:#f43f5e;font-size:0.78rem;padding:2px 6px;border-radius:6px;white-space:nowrap;">퇴사</span>`);

            return `
                    <div class="member-card" style="padding:16px;background:linear-gradient(135deg, rgba(30,41,59,0.9), rgba(15,23,42,0.95));border:1px solid rgba(99,102,241,0.28);border-radius:16px;box-shadow:0 4px 16px rgba(0,0,0,0.2);">
                        <div style="display:flex;align-items:center;gap:12px;margin-bottom:10px;">
                            <div class="member-avatar" style="height:44px;min-width:52px;padding:0 14px;font-size:0.95rem;font-weight:700;border-radius:22px;background:linear-gradient(135deg,#6366f1,#8b5cf6);box-shadow:0 4px 12px rgba(99,102,241,0.35);color:#ffffff;display:inline-flex;align-items:center;justify-content:center;white-space:nowrap;">${avatarText}</div>
                            <div style="overflow:hidden;flex:1;">
                                <div style="font-weight:700;font-size:1.08rem;color:#f8fafc;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;">${Utils.escapeHtml(m.name)}</div>
                                <div style="display:flex;align-items:center;gap:6px;margin-top:4px;white-space:nowrap;">
                                    ${typeBadge}
                                    ${statusBadge}
                                </div>
                            </div>
                        </div>
                        <div style="font-size:0.88rem;color:#cbd5e1;font-weight:500;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;padding:6px 10px;background:rgba(15,23,42,0.6);border-radius:8px;border:1px solid rgba(255,255,255,0.05);margin-bottom:12px;">
                            소속: <strong>${Utils.escapeHtml(m.company)}</strong> • 합류: ${Utils.formatDate(m.join_date)}
                        </div>
                        <div style="display:flex;gap:4px;justify-content:center;flex-wrap:wrap;">
                            <button class="btn btn-ghost btn-sm" onclick="ClubPage.openMemberModal(${m.id})">✏️ 아이디/수정</button>
                            ${m.status === 'active' ? `<button class="btn btn-ghost btn-sm" onclick="ClubPage.updateMemberStatus(${m.id},'inactive')">비활동</button>` : ''}
                            ${m.status === 'inactive' ? `<button class="btn btn-success btn-sm" onclick="ClubPage.updateMemberStatus(${m.id},'active')">복귀</button>` : ''}
                            ${m.status !== 'departed' ? `<button class="btn btn-danger btn-sm" onclick="ClubPage.updateMemberStatus(${m.id},'departed')">퇴사</button>` : ''}
                        </div>
                    </div>
                `}).join('') || '<div class="empty-state" style="grid-column:1/-1"><div class="empty-icon">👥</div><p class="empty-text">멤버가 없습니다</p></div>'}
            </div>`;

        const btnAddMember = document.getElementById('btn-add-member');
        if (btnAddMember) {
            btnAddMember.addEventListener('click', () => this.openMemberModal());
        }
    },

    async openMemberModal(memberId = null) {
        const editMember = memberId ? this.membersMap[memberId] : null;

        Modal.open(editMember ? '👥 멤버 정보 & 아이디 수정' : '👥 멤버 추가', `
            <div class="form-grid">
                <div class="form-group">
                    <label>이름 (풀네임)</label>
                    <input type="text" id="mem-name" value="${editMember ? Utils.escapeHtml(editMember.name) : ''}" placeholder="예: 김상국">
                </div>
                <div class="form-group">
                    <label>아이디 / 닉네임 <span style="font-size:0.78rem;color:#38bdf8;">(아바타 동그라미에 표시)</span></label>
                    <input type="text" id="mem-nickname" value="${editMember ? Utils.escapeHtml(editMember.nickname || '') : ''}" placeholder="예: 상국, SK (미입력시 '상국'으로 자동 표시)">
                </div>
                <div class="form-group">
                    <label>소속</label>
                    <input type="text" id="mem-company" value="${editMember ? Utils.escapeHtml(editMember.company) : '현지'}" placeholder="현지/본사">
                </div>
                <div class="form-group">
                    <label>유형</label>
                    <select id="mem-type">
                        <option value="regular" ${editMember && editMember.member_type === 'regular' ? 'selected' : ''}>상시 멤버</option>
                        <option value="temporary" ${editMember && editMember.member_type === 'temporary' ? 'selected' : ''}>단기 출장자</option>
                    </select>
                </div>
                <div class="form-group">
                    <label>합류일</label>
                    <input type="date" id="mem-join" value="${editMember ? editMember.join_date : Utils.today()}">
                </div>
            </div>
            <div class="form-group mt-md">
                <label>메모</label>
                <input type="text" id="mem-memo" value="${editMember ? Utils.escapeHtml(editMember.memo || '') : ''}" placeholder="메모 (선택)">
            </div>
            <button class="btn btn-ghost" onclick="Modal.close()">취소</button>
            <button class="btn btn-primary" id="btn-save-mem">${editMember ? '수정 완료' : '저장'}</button>
        `);

        document.getElementById('btn-save-mem').addEventListener('click', async () => {
            const data = {
                name: document.getElementById('mem-name').value.trim(),
                nickname: document.getElementById('mem-nickname').value.trim(),
                company: document.getElementById('mem-company').value.trim() || '현지',
                member_type: document.getElementById('mem-type').value,
                join_date: document.getElementById('mem-join').value,
                memo: document.getElementById('mem-memo').value.trim()
            };
            if (!data.name || !data.join_date) { Utils.toast('이름과 합류일을 입력해주세요', 'error'); return; }

            if (editMember) {
                await Store.updateMember(editMember.id, data);
            } else {
                await Store.addMember(data);
            }

            Utils.toast(editMember ? '멤버 정보 및 아이디가 수정되었습니다' : '멤버가 추가되었습니다', 'success');
            Modal.close();
            await this.renderTab();
        });
    },

    async updateMemberStatus(id, status) {
        const labels = { inactive: '비활동', active: '활동', departed: '퇴사' };
        const ok = await Modal.confirm('상태 변경', `이 멤버를 "${labels[status]}" 상태로 변경하시겠습니까?`);
        if (ok) {
            const updates = { status };
            if (status === 'departed') updates.leave_date = Utils.today();
            await Store.updateMember(id, updates);
            Utils.toast('상태가 변경되었습니다', 'success');
            this.renderTab();
        }
    },

    // ─── 순위/성적 탭 ───

    async renderRanking(container) {
        const [stats, trend, calcHistories] = await Promise.all([
            Store.getMemberStats(),
            Store.getRankingTrend(20),
            Store.getCalcHistoryList()
        ]);

        // ─ calcHistory를 날짜별 맵으로 구성 ─
        const calcMap = {};
        (calcHistories || []).forEach(c => {
            if (c && c.calc_date) {
                const dateKey = String(c.calc_date).slice(0, 10);
                calcMap[dateKey] = c;
            }
        });

        // ─ 1등 횟수 및 최하위 횟수 계산 ─
        const memberFirstCount = {};
        const memberLastCount = {};
        // ─ 멤버별 누적 회비 계산 (member_id 기준) ─
        const memberFeeTotal = {};   // member_id → 누적 납부 금액
        const memberFeeCount = {};   // member_id → 회비 집계된 게임 수

        trend.forEach(g => {
            const parts = g.club_game_participants || [];
            const ranked = parts.filter(p => p.ranking);
            if (!ranked.length) return;
            const maxRank = Math.max(...ranked.map(p => p.ranking));

            // 해당 게임 날짜의 calcHistory 조회
            const gDateKey = String(g.game_date || '').slice(0, 10);
            const calc = calcMap[gDateKey];

            ranked.forEach(p => {
                const name = p.club_members?.name || '?';
                if (p.ranking === 1) memberFirstCount[name] = (memberFirstCount[name] || 0) + 1;
                if (p.ranking === maxRank) memberLastCount[name] = (memberLastCount[name] || 0) + 1;

                // 회비 누적: calcHistory의 rank_amounts[ranking-1]
                if (calc && calc.rank_amounts && p.ranking && calc.rank_amounts[p.ranking - 1] !== undefined) {
                    const mid = p.member_id;
                    memberFeeTotal[mid] = (memberFeeTotal[mid] || 0) + Number(calc.rank_amounts[p.ranking - 1]);
                    memberFeeCount[mid] = (memberFeeCount[mid] || 0) + 1;
                }
            });
        });

        if (!stats.length) {
            container.innerHTML = `<div class="empty-state"><div class="empty-icon">🏆</div><p class="empty-text">성적 데이터가 없습니다</p></div>`;
            return;
        }

        // ── 포디움 Top3 ──
        const podiumHtml = `
        <div style="display:grid;grid-template-columns:repeat(3,1fr);gap:10px;margin-bottom:18px;">
            ${stats.slice(0, 3).map((s, idx) => {
            const medals = ['🥇', '🥈', '🥉'];
            const glow = ['rgba(251,191,36,0.25)', 'rgba(148,163,184,0.18)', 'rgba(205,124,47,0.18)'];
            const border = ['rgba(251,191,36,0.55)', 'rgba(148,163,184,0.45)', 'rgba(205,124,47,0.45)'];
            const txtc = ['#fbbf24', '#cbd5e1', '#cd7c2f'];
            const avgRankNum = s.avgRank !== '-' ? parseFloat(s.avgRank) : null;
            const avgColor = avgRankNum !== null
                ? (avgRankNum <= 2 ? '#34d399' : avgRankNum <= 3.5 ? '#38bdf8' : '#f59e0b') : '#64748b';
            const totalFee = memberFeeTotal[s.member_id] || 0;
            const feeGames = memberFeeCount[s.member_id] || 0;
            const avgFee = feeGames > 0 ? Math.round(totalFee / feeGames) : 0;
            return `<div style="padding:14px 16px;background:${glow[idx]};border:1.5px solid ${border[idx]};
                                    border-radius:14px;text-align:center;position:relative;">
                    <div style="font-size:1.6rem;margin-bottom:4px;">${medals[idx]}</div>
                    <div style="font-size:1rem;font-weight:800;color:${txtc[idx]};">${Utils.escapeHtml(s.name)}</div>
                    <div style="display:flex;justify-content:center;gap:10px;margin-top:6px;flex-wrap:wrap;">
                        <span style="font-size:0.72rem;color:#94a3b8;">평균 <b style="color:${avgColor};">${s.avgRank !== '-' ? s.avgRank + '등' : '-'}</b></span>
                        <span style="font-size:0.72rem;color:#94a3b8;">최고 <b style="color:#34d399;">${s.best !== '-' ? s.best + '등' : '-'}</b></span>
                        <span style="font-size:0.72rem;color:#94a3b8;">🥇 <b style="color:#fbbf24;">${memberFirstCount[s.name] || 0}회</b></span>
                    </div>
                    ${totalFee > 0 ? `<div style="margin-top:6px;font-size:0.7rem;color:#94a3b8;">누적회비 <b style="color:#10b981;">${Utils.formatVND(totalFee)}</b></div>` : ''}
                </div>`;
        }).join('')}
        </div>`;

        // ── 확장된 테이블 (컬럼 2개 추가) ──
        const COLS = '40px 1fr 58px 68px 60px 54px 50px 100px 100px';
        const HDR = ['순위', '멤버', '게임', '평균등', '최고', '🥇 1등', '꼴찌', '💰 누적회비', '1회당 평균'];

        const tableHtml = `
        <div style="background:rgba(13,20,38,0.9);border:1px solid rgba(99,102,241,0.28);
                    border-radius:14px;overflow:hidden;max-width:680px;">
            <div style="display:grid;grid-template-columns:${COLS};
                        padding:8px 14px;align-items:center;
                        background:linear-gradient(90deg,rgba(99,102,241,0.2),rgba(139,92,246,0.12));
                        border-bottom:1px solid rgba(99,102,241,0.25);">
                ${HDR.map((h, i) => `<div style="font-size:0.68rem;font-weight:800;color:#64748b;
                    text-align:${i === 1 ? 'left' : 'center'};white-space:nowrap;">${h}</div>`).join('')}
            </div>
            ${stats.map((s, idx) => {
            const rank1 = idx + 1;
            const bg = idx % 2 === 0 ? 'rgba(30,41,59,0.4)' : 'transparent';
            let badge, rc;
            if (rank1 === 1) { badge = '🥇'; rc = '#fbbf24'; }
            else if (rank1 === 2) { badge = '🥈'; rc = '#94a3b8'; }
            else if (rank1 === 3) { badge = '🥉'; rc = '#cd7c2f'; }
            else { badge = rank1; rc = '#475569'; }

            const avg = s.avgRank !== '-' ? parseFloat(s.avgRank) : null;
            const ac = avg === null ? '#475569'
                : avg <= 2 ? '#34d399' : avg <= 3.5 ? '#38bdf8' : avg <= 5 ? '#f59e0b' : '#f43f5e';
            const f1 = memberFirstCount[s.name] || 0;
            const lc = memberLastCount[s.name] || 0;
            const initials = Utils.escapeHtml(s.name).substring(0, 2);

            // 회비 데이터
            const totalFee = memberFeeTotal[s.member_id] || 0;
            const feeGames = memberFeeCount[s.member_id] || 0;
            const avgFeePerGame = feeGames > 0 ? Math.round(totalFee / feeGames) : 0;

            return `<div style="display:grid;grid-template-columns:${COLS};
                            padding:7px 14px;align-items:center;background:${bg};
                            border-bottom:1px solid rgba(255,255,255,0.03);
                            transition:background 0.12s;cursor:default;"
                         onmouseover="this.style.background='rgba(99,102,241,0.08)'"
                         onmouseout="this.style.background='${bg}'">
                    <div style="text-align:center;font-size:${rank1 <= 3 ? '1.2rem' : '0.82rem'};
                                font-weight:800;color:${rc};">${badge}</div>
                    <div style="display:flex;align-items:center;gap:7px;min-width:0;">
                        <div style="width:26px;height:26px;border-radius:50%;flex-shrink:0;
                                    background:linear-gradient(135deg,#6366f1,#8b5cf6);
                                    display:flex;align-items:center;justify-content:center;
                                    font-size:0.62rem;font-weight:800;color:#fff;">${initials}</div>
                        <span style="font-weight:700;font-size:0.85rem;color:#e2e8f0;
                                     white-space:nowrap;overflow:hidden;text-overflow:ellipsis;">
                            ${Utils.escapeHtml(s.name)}</span>
                    </div>
                    <div style="text-align:center;font-size:0.8rem;font-weight:700;color:#94a3b8;">${s.games}<small style="color:#475569;">회</small></div>
                    <div style="text-align:center;font-size:0.88rem;font-weight:800;color:${ac};">${avg !== null ? s.avgRank + '등' : '—'}</div>
                    <div style="text-align:center;font-size:0.82rem;font-weight:700;color:#34d399;">${s.best !== '-' ? s.best + '등' : '—'}</div>
                    <div style="text-align:center;font-size:0.82rem;font-weight:700;color:#fbbf24;">${f1 > 0 ? f1 + '회' : '—'}</div>
                    <div style="text-align:center;font-size:0.82rem;font-weight:700;color:#f43f5e;">${lc > 0 ? lc + '회' : '—'}</div>
                    <div style="text-align:center;font-size:0.75rem;font-weight:700;color:#10b981;line-height:1.3;">
                        ${totalFee > 0 ? Utils.formatVND(totalFee) : '<span style="color:#475569;">—</span>'}
                    </div>
                    <div style="text-align:center;font-size:0.75rem;font-weight:700;color:#38bdf8;line-height:1.3;">
                        ${avgFeePerGame > 0 ? Utils.formatVND(avgFeePerGame) : '<span style="color:#475569;">—</span>'}
                    </div>
                </div>`;
        }).join('')}
        </div>`;

        container.innerHTML = `
            <div class="section-header" style="margin-bottom:14px;">
                <span class="section-title">🏆 멤버별 성적 현황</span>
            </div>
            ${podiumHtml}
            ${tableHtml}
        `;
    },

    ratioPresets: {
        3: {
            ultraMild: { name: '⚖️ 초완만형', desc: '1등 25% / 2등 33% / 3등 42%', ratios: [25, 33, 42] },
            mild: { name: '⚖️ 완만형', desc: '1등 20% / 2등 32% / 3등 48%', ratios: [20, 32, 48] },
            standard: { name: '⚡ 중등 차등형 (추천)', desc: '1등 15% / 2등 30% / 3등 55%', ratios: [15, 30, 55] },
            strong: { name: '⛳ 강한 차등형', desc: '1등 10% / 2등 28% / 3등 62%', ratios: [10, 28, 62] },
            extreme: { name: '🔥 극단 차등형', desc: '1등 5%  / 2등 25% / 3등 70%', ratios: [5, 25, 70] },
            free1st: { name: '🏆 1등 면제형', desc: '1등 0%  / 2등 35% / 3등 65%', ratios: [0, 35, 65] }
        },
        4: {
            ultraMild: { name: '⚖️ 초완만형', desc: '1등 18% / 2등 24% / 3등 26% / 4등 32%', ratios: [18, 24, 26, 32] },
            mild: { name: '⚖️ 완만형', desc: '1등 14% / 2등 22% / 3등 28% / 4등 36%', ratios: [14, 22, 28, 36] },
            standard: { name: '⚡ 중등 차등형 (추천)', desc: '1등 10% / 2등 20% / 3등 30% / 4등 40%', ratios: [10, 20, 30, 40] },
            strong: { name: '⛳ 강한 차등형', desc: '1등 6%  / 2등 17% / 3등 31% / 4등 46%', ratios: [6, 17, 31, 46] },
            extreme: { name: '🔥 극단 차등형', desc: '1등 3%  / 2등 12% / 3등 30% / 4등 55%', ratios: [3, 12, 30, 55] },
            free1st: { name: '🏆 1등 면제형', desc: '1등 0%  / 2등 18% / 3등 32% / 4등 50%', ratios: [0, 18, 32, 50] }
        },
        5: {
            ultraMild: { name: '⚖️ 초완만형', desc: '1등 15% / 2등 18% / 3등 20% / 4등 22% / 5등 25%', ratios: [15, 18, 20, 22, 25] },
            mild: { name: '⚖️ 완만형', desc: '1등 12% / 2등 16% / 3등 19% / 4등 23% / 5등 30%', ratios: [12, 16, 19, 23, 30] },
            standard: { name: '⚡ 중등 차등형 (추천)', desc: '1등 10% / 2등 15% / 3등 20% / 4등 25% / 5등 30%', ratios: [10, 15, 20, 25, 30] },
            strong: { name: '⛳ 강한 차등형', desc: '1등 6%  / 2등 12% / 3등 18% / 4등 26% / 5등 38%', ratios: [6, 12, 18, 26, 38] },
            extreme: { name: '🔥 극단 차등형', desc: '1등 3%  / 2등 8%  / 3등 15% / 4등 26% / 5등 48%', ratios: [3, 8, 15, 26, 48] },
            free1st: { name: '🏆 1등 면제형', desc: '1등 0%  / 2등 12% / 3등 18% / 4등 27% / 5등 43%', ratios: [0, 12, 18, 27, 43] }
        },
        6: {
            ultraMild: { name: '⚖️ 초완만형', desc: '1등 12% / 2등 14% / 3등 16% / 4등 18% / 5등 19% / 6등 21%', ratios: [12, 14, 16, 18, 19, 21] },
            mild: { name: '⚖️ 완만형', desc: '1등 9%  / 2등 13% / 3등 16% / 4등 18% / 5등 21% / 6등 23%', ratios: [9, 13, 16, 18, 21, 23] },
            standard: { name: '⚡ 중등 차등형 (추천)', desc: '1등 5%  / 2등 10% / 3등 15% / 4등 20% / 5등 23% / 6등 27%', ratios: [5, 10, 15, 20, 23, 27] },
            strong: { name: '⛳ 강한 차등형', desc: '1등 4%  / 2등 8%  / 3등 13% / 4등 18% / 5등 24% / 6등 33%', ratios: [4, 8, 13, 18, 24, 33] },
            extreme: { name: '🔥 극단 차등형', desc: '1등 2%  / 2등 6%  / 3등 11% / 4등 17% / 5등 24% / 6등 40%', ratios: [2, 6, 11, 17, 24, 40] },
            free1st: { name: '🏆 1등 면제형', desc: '1등 0%  / 2등 8%  / 3등 14% / 4등 19% / 5등 24% / 6등 35%', ratios: [0, 8, 14, 19, 24, 35] }
        },
        7: {
            ultraMild: { name: '⚖️ 초완만형', desc: '1등 10% / 2등 12% / 3등 13% / 4등 14% / 5등 16% / 6등 17% / 7등 18%', ratios: [10, 12, 13, 14, 16, 17, 18] },
            mild: { name: '⚖️ 완만형', desc: '1등 7%  / 2등 10% / 3등 12% / 4등 14% / 5등 16% / 6등 19% / 7등 22%', ratios: [7, 10, 12, 14, 16, 19, 22] },
            standard: { name: '⚡ 중등 차등형 (추천)', desc: '1등 5%  / 2등 8%  / 3등 11% / 4등 14% / 5등 17% / 6등 21% / 7등 24%', ratios: [5, 8, 11, 14, 17, 21, 24] },
            strong: { name: '⛳ 강한 차등형', desc: '1등 3%  / 2등 6%  / 3등 10% / 4등 14% / 5등 18% / 6등 23% / 7등 26%', ratios: [3, 6, 10, 14, 18, 23, 26] },
            extreme: { name: '🔥 극단 차등형', desc: '1등 1%  / 2등 4%  / 3등 8%  / 4등 13% / 5등 18% / 6등 24% / 7등 32%', ratios: [1, 4, 8, 13, 18, 24, 32] },
            free1st: { name: '🏆 1등 면제형', desc: '1등 0%  / 2등 5%  / 3등 9%  / 4등 14% / 5등 18% / 6등 23% / 7등 31%', ratios: [0, 5, 9, 14, 18, 23, 31] }
        },
        8: {
            ultraMild: { name: '⚖️ 초완만형', desc: '1등 8%  / 2등 10% / 3등 11% / 4등 12% / 5등 13% / 6등 14% / 7등 15% / 8등 17%', ratios: [8, 10, 11, 12, 13, 14, 15, 17] },
            mild: { name: '⚖️ 완만형', desc: '1등 6%  / 2등 8%  / 3등 10% / 4등 12% / 5등 13% / 6등 15% / 7등 17% / 8등 19%', ratios: [6, 8, 10, 12, 13, 15, 17, 19] },
            standard: { name: '⚡ 중등 차등형 (추천)', desc: '1등 4%  / 2등 7%  / 3등 9%  / 4등 11% / 5등 13% / 6등 16% / 7등 19% / 8등 21%', ratios: [4, 7, 9, 11, 13, 16, 19, 21] },
            strong: { name: '⛳ 강한 차등형', desc: '1등 2%  / 2등 5%  / 3등 8%  / 4등 11% / 5등 14% / 6등 17% / 7등 20% / 8등 23%', ratios: [2, 5, 8, 11, 14, 17, 20, 23] },
            extreme: { name: '🔥 극단 차등형', desc: '1등 1%  / 2등 3%  / 3등 6%  / 4등 10% / 5등 14% / 6등 18% / 7등 22% / 8등 26%', ratios: [1, 3, 6, 10, 14, 18, 22, 26] },
            free1st: { name: '🏆 1등 면제형', desc: '1등 0%  / 2등 4%  / 3등 7%  / 4등 11% / 5등 14% / 6등 17% / 7등 21% / 8등 26%', ratios: [0, 4, 7, 11, 14, 17, 21, 26] }
        }
    },

    getDefaultRatios(count) {
        const countPresets = this.ratioPresets[count];
        if (countPresets && countPresets.standard) {
            return [...countPresets.standard.ratios];
        }
        const base = Math.floor(100 / count);
        const res = new Array(count).fill(base);
        let rem = 100 - (base * count);
        for (let i = count - 1; i >= 0 && rem > 0; i--, rem--) {
            res[i]++;
        }
        return res;
    },

    applyPreset(presetKey) {
        const count = this.calcState.count;
        const countPresets = this.ratioPresets[count] || this.ratioPresets[5];
        const preset = countPresets[presetKey] || countPresets.standard;
        this.calcState.ratios = [...preset.ratios];
        this.updateCalcTable();
        Utils.toast(`[${preset.name}] 비율 적용 완료! (${preset.desc})`, 'success');
    },


    // ─── 회비 산출 시트 탭 ───
    calcState: {
        count: 5,
        golfMode: 'per_person', // 'per_person' 또는 'total'
        golfVal: 550000,
        mealVal: 2120000,
        ratios: [10, 15, 20, 25, 30]
    },

    async renderCalculator(container) {
        // 1. 현재 선택 날짜의 기 저장된 클라우드 산출 시트가 있는지 자동 확인 & 로드
        const curDate = this.calcState.date || Utils.today();
        this.calcState.date = curDate;

        try {
            const savedItem = await Store.getCalcHistoryByDate(curDate);
            if (savedItem) {
                this.calcState.count = savedItem.player_count || this.calcState.count;
                this.calcState.golfMode = savedItem.golf_mode || this.calcState.golfMode;
                this.calcState.golfVal = savedItem.golf_val !== undefined ? savedItem.golf_val : this.calcState.golfVal;
                this.calcState.mealVal = savedItem.meal_val !== undefined ? savedItem.meal_val : this.calcState.mealVal;
                this.calcState.ratios = savedItem.ratios || this.calcState.ratios;
                this.calcState.memo = savedItem.title || this.calcState.memo;
            }
        } catch (e) {
            console.warn('Auto load calc history check:', e);
        }

        const count = this.calcState.count;
        const countPresets = this.ratioPresets[count] || this.ratioPresets[5];

        container.innerHTML = `
            <div class="calc-sheet-container">
                <!-- 날짜 및 이력 저장 컨트롤 카드 -->
                <div class="card mb-lg" style="background: linear-gradient(135deg, rgba(30,41,59,0.95), rgba(15,23,42,0.95)); border: 1px solid rgba(99,102,241,0.35); box-shadow: 0 4px 16px rgba(0,0,0,0.2);">
                    <div class="card-header" style="display:flex;justify-content:space-between;align-items:center;flex-wrap:wrap;gap:10px;">
                        <span class="card-title" style="color:#38bdf8;font-size:1.05rem;">📅 회비 산출 시트 이력 관리 & 게임 일정 연동</span>
                        <div style="display:flex;gap:8px;">
                            <button class="btn btn-emerald btn-sm" id="btn-save-calc">💾 이 날짜로 산출 내역 저장</button>
                            <button class="btn btn-ghost btn-sm" id="btn-history-calc">📜 저장 이력 보기</button>
                        </div>
                    </div>
                    <div class="form-grid" style="grid-template-columns: 200px 1fr; gap:16px;">
                        <div class="form-group">
                            <label>산출 날짜 지정</label>
                            <input type="date" id="calc-date" value="${this.calcState.date}" class="calc-input-field" style="border-color:#38bdf8;font-weight:700;">
                        </div>
                        <div class="form-group">
                            <label>모임/게임 타이틀 (메모)</label>
                            <input type="text" id="calc-memo" value="${Utils.escapeHtml(this.calcState.memo || '스크린골프 및 식사 모임')}" placeholder="예: 07/22 4인 스크린" class="calc-input-field">
                        </div>
                    </div>
                </div>

                <!-- 헤더 및 입력 설정 -->
                <div class="card mb-lg">
                    <div class="card-header">
                        <span class="card-title">⛳ 스크린 & 식사비 회비 산출 설정</span>
                    </div>
                    <div class="form-grid" style="grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));">
                        <div class="form-group">
                            <label>참여 인원수</label>
                            <select id="calc-count" class="calc-input-field">
                                ${[3, 4, 5, 6, 7, 8].map(n => `<option value="${n}" ${this.calcState.count === n ? 'selected' : ''}>${n}명</option>`).join('')}
                            </select>
                        </div>
                        <div class="form-group">
                            <label>골프비 입력 방식</label>
                            <select id="calc-golf-mode" class="calc-input-field">
                                <option value="per_person" ${this.calcState.golfMode === 'per_person' ? 'selected' : ''}>1인당 스크린 비용</option>
                                <option value="total" ${this.calcState.golfMode === 'total' ? 'selected' : ''}>총 스크린 비용</option>
                            </select>
                        </div>
                        <div class="form-group">
                            <label id="lbl-golf-val">${this.calcState.golfMode === 'per_person' ? '1인당 골프비 (VND)' : '총 골프비 (VND)'}</label>
                            <input type="text" id="calc-golf-val" value="${Utils.formatVND(this.calcState.golfVal).replace('₫', '').trim()}" inputmode="numeric" class="calc-input-field">
                        </div>
                        <div class="form-group">
                            <label>식사비 총액 MAX (VND)</label>
                            <input type="text" id="calc-meal-val" value="${Utils.formatVND(this.calcState.mealVal).replace('₫', '').trim()}" inputmode="numeric" class="calc-input-field">
                        </div>
                        <div class="form-group" style="grid-column: 1 / -1; margin-top: 6px;">
                            <label style="color:#38bdf8;font-weight:700;margin-bottom:8px;display:block;">🎯 ${count}인 게임 단계별 비율 프리셋 (등수 중복 0% / 원터치 적용)</label>
                            <div style="display:flex;gap:6px;flex-wrap:wrap;">
                                <button class="btn btn-sm btn-ghost btn-preset-opt" data-preset="ultraMild">${countPresets.ultraMild.name}</button>
                                <button class="btn btn-sm btn-ghost btn-preset-opt" data-preset="mild">${countPresets.mild.name}</button>
                                <button class="btn btn-sm btn-emerald btn-preset-opt" data-preset="standard">${countPresets.standard.name}</button>
                                <button class="btn btn-sm btn-ghost btn-preset-opt" data-preset="strong">${countPresets.strong.name}</button>
                                <button class="btn btn-sm btn-ghost btn-preset-opt" data-preset="extreme">${countPresets.extreme.name}</button>
                                <button class="btn btn-sm btn-ghost btn-preset-opt" data-preset="free1st">${countPresets.free1st.name}</button>
                            </div>
                        </div>
                    </div>
                </div>

                <!-- 등수별 회비 산출 시트 (엑셀 스타일) -->
                <div class="card mb-lg">
                    <div class="card-header" style="display:flex;justify-content:space-between;align-items:center;">
                        <span class="card-title">📊 등수별 회비 산출 시트</span>
                        <div id="ratio-sum-status"></div>
                    </div>
                    <div class="table-wrapper">
                        <table class="calc-sheet-table" id="calc-table">
                            <!-- 동적 렌더링 -->
                        </table>
                    </div>
                </div>

                <!-- 산뜻하고 깔끔한 등수별 정산 요약 카드 시트 -->
                <div class="card">
                    <div class="card-header" style="display:flex;justify-content:space-between;align-items:center;">
                        <span class="card-title">✨ 최종 등수별 회비 납부 정산 시트</span>
                        <button class="btn btn-emerald btn-sm" id="btn-copy-notice">📋 단톡방 공지 문구 복사</button>
                    </div>
                    <div id="notice-preview-visual" class="fresh-summary-sheet">
                        <!-- 동적 시트 렌더링 -->
                    </div>
                    <textarea id="notice-raw-text" style="display:none;"></textarea>
                </div>
            </div>
        `;

        this.bindCalcEvents();
        this.updateCalcTable();
    },

    bindCalcEvents() {
        const countSelect = document.getElementById('calc-count');
        const golfModeSelect = document.getElementById('calc-golf-mode');
        const golfValInput = document.getElementById('calc-golf-val');
        const mealValInput = document.getElementById('calc-meal-val');

        const dateInput = document.getElementById('calc-date');
        const memoInput = document.getElementById('calc-memo');

        if (dateInput) {
            dateInput.addEventListener('change', async (e) => {
                const selectedDate = e.target.value;
                this.calcState.date = selectedDate;
                // 날짜 변경 시 해당 날짜에 저장된 이력이 있으면 자동 로드
                if (selectedDate) {
                    const saved = await Store.getCalcHistoryByDate(selectedDate);
                    if (saved) {
                        this.calcState.count = saved.player_count || this.calcState.count;
                        this.calcState.golfMode = saved.golf_mode || this.calcState.golfMode;
                        this.calcState.golfVal = saved.golf_val !== undefined ? saved.golf_val : this.calcState.golfVal;
                        this.calcState.mealVal = saved.meal_val !== undefined ? saved.meal_val : this.calcState.mealVal;
                        this.calcState.ratios = saved.ratios || this.calcState.ratios;
                        this.calcState.memo = saved.title || this.calcState.memo;
                        Utils.toast(`[${selectedDate}] 저장된 산출 내역을 불러왔습니다!`, 'info');
                        this.renderTab();
                    }
                }
            });
        }
        if (memoInput) memoInput.addEventListener('input', (e) => this.calcState.memo = e.target.value);

        if (countSelect) {
            countSelect.addEventListener('change', (e) => {
                const count = Number(e.target.value);
                this.calcState.count = count;
                this.calcState.ratios = this.getDefaultRatios(count);
                this.renderTab();
            });
        }

        if (golfModeSelect) {
            golfModeSelect.addEventListener('change', (e) => {
                this.calcState.golfMode = e.target.value;
                const lbl = document.getElementById('lbl-golf-val');
                if (lbl) lbl.textContent = this.calcState.golfMode === 'per_person' ? '1인당 골프비 (VND)' : '총 골프비 (VND)';
                this.updateCalcTable();
            });
        }

        if (golfValInput) {
            golfValInput.addEventListener('input', () => {
                this.calcState.golfVal = Utils.parseAmount(golfValInput.value);
                this.updateCalcTable();
            });
        }

        if (mealValInput) {
            mealValInput.addEventListener('input', () => {
                this.calcState.mealVal = Utils.parseAmount(mealValInput.value);
                this.updateCalcTable();
            });
        }

        // 프리셋 버튼 클릭 이벤트 바인딩
        document.querySelectorAll('.btn-preset-opt').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const key = e.currentTarget.dataset.preset;
                this.applyPreset(key);
                document.querySelectorAll('.btn-preset-opt').forEach(b => {
                    b.classList.remove('btn-emerald');
                    b.classList.add('btn-ghost');
                });
                e.currentTarget.classList.remove('btn-ghost');
                e.currentTarget.classList.add('btn-emerald');
            });
        });

        const btnSaveCalc = document.getElementById('btn-save-calc');
        if (btnSaveCalc) {
            btnSaveCalc.addEventListener('click', async () => {
                const dateElem = document.getElementById('calc-date');
                const memoElem = document.getElementById('calc-memo');
                const calcDate = dateElem ? dateElem.value : Utils.today();
                const calcMemo = memoElem ? memoElem.value.trim() : '스크린골프 모임';
                if (!calcDate) { Utils.toast('날짜를 선택해주세요', 'error'); return; }

                const { count, golfMode, golfVal, mealVal, ratios } = this.calcState;
                const golfTotal = golfMode === 'per_person' ? golfVal * count : golfVal;
                const mealTotal = mealVal;
                const grandTotal = golfTotal + mealTotal;

                const rankAmounts = [];
                for (let i = 0; i < count; i++) {
                    const r = (ratios[i] || 0) / 100;
                    const gAmt = Math.round(golfTotal * r);
                    const mAmt = Math.round(mealTotal * r);
                    rankAmounts.push(gAmt + mAmt);
                }

                const item = {
                    calc_date: calcDate,
                    title: calcMemo || '스크린골프 모임',
                    player_count: count,
                    golf_mode: golfMode,
                    golf_val: golfVal,
                    meal_val: mealVal,
                    total_cost: grandTotal,
                    ratios: ratios,
                    rank_amounts: rankAmounts
                };

                await Store.saveCalcHistory(item);
                Utils.toast(`[${calcDate}] 회비 산출 내역이 성공적으로 저장되었습니다!`, 'success');
            });
        }

        const btnHistoryCalc = document.getElementById('btn-history-calc');
        if (btnHistoryCalc) {
            btnHistoryCalc.addEventListener('click', async () => {
                this.openCalcHistoryModal();
            });
        }

        const btnCopyNotice = document.getElementById('btn-copy-notice');
        if (btnCopyNotice) {
            btnCopyNotice.addEventListener('click', () => {
                const rawElem = document.getElementById('notice-raw-text');
                const text = rawElem ? rawElem.value : '';
                navigator.clipboard.writeText(text).then(() => {
                    Utils.toast('공지 문구가 클립보드에 복사되었습니다! 단톡방에 붙여넣으세요.', 'success');
                }).catch(() => {
                    Utils.toast('복사 중 오류가 발생했습니다.', 'error');
                });
            });
        }
    },

    async openCalcHistoryModal() {
        const histories = await Store.getCalcHistoryList();

        const cards = (histories || []).map(h => `
            <div style="padding:12px 14px;background:rgba(30,41,59,0.9);border:1px solid rgba(99,102,241,0.25);border-radius:12px;margin-bottom:10px;">
                <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:6px;">
                    <div>
                        <strong style="color:#f8fafc;font-size:0.95rem;">📅 ${Utils.formatDateKR(h.calc_date)}</strong>
                        <span style="font-size:0.82rem;color:var(--text-muted);margin-left:6px;">(${h.player_count}명 / ${Utils.escapeHtml(h.title || '스크린골프')})</span>
                    </div>
                    <div style="font-weight:700;color:#38bdf8;font-size:0.95rem;">
                        ${Utils.formatVND(h.total_cost)}
                    </div>
                </div>
                <div style="font-size:0.8rem;color:var(--text-muted);background:rgba(15,23,42,0.6);padding:6px 10px;border-radius:8px;margin-bottom:8px;">
                    ${(h.rank_amounts || []).map((amt, idx) => `<strong>${idx + 1}등:</strong> ${Utils.formatVND(amt)}`).join(' &nbsp;|&nbsp; ')}
                </div>
                <div style="display:flex;justify-content:flex-end;gap:6px;">
                    <button class="btn btn-emerald btn-sm" onclick="ClubPage.applyCalcHistory('${h.calc_date}')">불러오기</button>
                    <button class="btn btn-danger btn-sm" onclick="ClubPage.deleteCalcHistory('${h.id}')" title="삭제">🗑️ 삭제</button>
                </div>
            </div>
        `).join('');

        Modal.open('📜 저장된 회비 산출 이력', `
            <div style="max-height:65vh;overflow-y:auto;">
                ${cards || '<div class="text-muted" style="text-align:center;padding:20px;">저장된 산출 이력이 없습니다</div>'}
            </div>
        `, `<button class="btn btn-ghost" onclick="Modal.close()">닫기</button>`);
    },

    async applyCalcHistory(calcDate) {
        const h = await Store.getCalcHistoryByDate(calcDate);
        if (!h) return;
        this.calcState.count = h.player_count;
        this.calcState.golfMode = h.golf_mode;
        this.calcState.golfVal = h.golf_val;
        this.calcState.mealVal = h.meal_val;
        this.calcState.ratios = h.ratios;
        this.calcState.date = h.calc_date;
        this.calcState.memo = h.title;
        Modal.close();
        this.renderTab();
        Utils.toast(`[${calcDate}] 산출 내역을 불러왔습니다!`, 'success');
    },

    async deleteCalcHistory(id) {
        const ok = await Modal.confirm('이력 삭제', '이 회비 산출 이력을 삭제하시겠습니까?');
        if (ok) {
            await Store.deleteCalcHistory(id);
            Utils.toast('삭제되었습니다', 'success');
            this.openCalcHistoryModal();
        }
    },

    updateCalcTable(options = {}) {
        const { count, golfMode, golfVal, mealVal, ratios } = this.calcState;

        // 골프 총액 계산
        const golfTotal = golfMode === 'per_person' ? golfVal * count : golfVal;
        const mealTotal = mealVal;
        const ttlGrandTotal = golfTotal + mealTotal;

        // 비율 합계 검증
        const ratioSum = ratios.reduce((sum, r) => sum + (Number(r) || 0), 0);
        const ratioSumFixed = Number(ratioSum.toFixed(1));
        const statusElem = document.getElementById('ratio-sum-status');
        if (statusElem) {
            if (Math.abs(ratioSumFixed - 100) < 0.1) {
                statusElem.innerHTML = `<span class="badge badge-income">✅ 배분 비율 합계: 100%</span>`;
            } else {
                statusElem.innerHTML = `<span class="badge badge-expense">⚠️ 합계: ${ratioSumFixed}% (100%로 맞추어 주세요)</span>`;
            }
        }

        // 등수별 금액 계산
        const golfPerRank = [];
        const mealPerRank = [];
        const ttlPerRank = [];

        for (let i = 0; i < count; i++) {
            const r = (ratios[i] || 0) / 100;
            const gAmt = Math.round(golfTotal * r);
            const mAmt = Math.round(mealTotal * r);
            const tAmt = gAmt + mAmt;

            golfPerRank.push(gAmt);
            mealPerRank.push(mAmt);
            ttlPerRank.push(tAmt);
        }

        // DOM 갱신 (keepDOM이 false이거나 없으면 전체 HTML 생성, true이면 숫치 셀만 업데이트하여 입력 포커스 유지)
        if (!options.keepDOM) {
            let cardsHtml = `
                <div class="calc-rank-vertical-list" style="display:flex;flex-direction:column;gap:10px;">
                    ${Array.from({ length: count }, (_, i) => {
                const medal = i === 0 ? '🥇 ' : (i === 1 ? '🥈 ' : (i === 2 ? '🥉 ' : ''));
                return `
                        <div class="calc-rank-card" style="padding:12px 14px;background:linear-gradient(135deg, rgba(30,41,59,0.95), rgba(15,23,42,0.98));border:1px solid rgba(99,102,241,0.35);border-radius:14px;box-shadow:0 3px 10px rgba(0,0,0,0.2);">
                            <!-- 상단: 등수 및 비율 변경 -->
                            <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:8px;padding-bottom:6px;border-bottom:1px solid rgba(255,255,255,0.08);">
                                <div style="display:flex;align-items:center;gap:6px;">
                                    <span style="font-weight:800;font-size:1.05rem;color:#f8fafc;">${medal}${i + 1}등</span>
                                    <span style="font-size:0.8rem;color:#38bdf8;font-weight:600;">(배분 비율: ${ratios[i] || 0}%)</span>
                                </div>
                                <div style="display:flex;align-items:center;gap:4px;">
                                    <span style="font-size:0.78rem;color:var(--text-muted);">비율 변경:</span>
                                    <div class="ratio-input-wrapper" style="width:64px;padding:2px 4px;min-width:64px;">
                                        <input type="text" 
                                               inputmode="decimal" 
                                               pattern="[0-9.]*"
                                               class="ratio-input" 
                                               data-rank="${i}" 
                                               value="${ratios[i] || 0}" 
                                               style="width:36px!important;min-width:36px!important;font-size:0.92rem!important;"
                                               autocomplete="off" autocorrect="off" autocapitalize="off" spellcheck="false">
                                        <span class="percent-sign" style="font-size:0.8rem;">%</span>
                                    </div>
                                </div>
                            </div>

                            <!-- 세부 항목: 골프비 & 식사비 -->
                            <div style="display:flex;justify-content:space-between;align-items:center;font-size:0.83rem;color:var(--text-muted);margin-bottom:8px;padding:0 2px;">
                                <span>⛳ 골프비: <strong class="calc-g-val-${i}" style="color:#38bdf8;font-weight:700;">${Utils.formatVND(golfPerRank[i])}</strong></span>
                                <span>🍜 식사비: <strong class="calc-m-val-${i}" style="color:#c084fc;font-weight:700;">${Utils.formatVND(mealPerRank[i])}</strong></span>
                            </div>

                            <!-- 🔥 등수별 최종 지불 합계 금액 하이라이트 바 🔥 -->
                            <div style="display:flex;justify-content:space-between;align-items:center;padding:8px 12px;background:linear-gradient(135deg, rgba(16,185,129,0.18), rgba(5,150,105,0.25));border:1px solid rgba(16,185,129,0.4);border-radius:10px;">
                                <span style="font-weight:700;font-size:0.88rem;color:#34d399;">💰 ${i + 1}등 최종 지불 합계:</span>
                                <span class="calc-t-val-${i}" style="font-weight:900;font-size:1.1rem;color:#ffffff;text-shadow:0 1px 4px rgba(0,0,0,0.4);">${Utils.formatVND(ttlPerRank[i])}</span>
                            </div>
                        </div>
                        `;
            }).join('')}

                    <!-- 전체 총액 합계 콤팩트 카드 -->
                    <div style="padding:12px 14px;background:linear-gradient(135deg, rgba(99,102,241,0.2), rgba(16,185,129,0.2));border:1px solid rgba(99,102,241,0.4);border-radius:14px;margin-top:4px;">
                        <div style="font-weight:800;font-size:0.98rem;color:#f8fafc;margin-bottom:8px;">📊 전체 총액 (Total)</div>
                        <div style="display:grid;grid-template-columns:1fr 1fr;gap:8px;font-size:0.84rem;">
                            <div>비율 합계: <strong class="cell-total-ratio" style="color:#38bdf8;">${ratioSumFixed}%</strong></div>
                            <div>총 골프비: <strong class="calc-g-ttl" style="color:#38bdf8;">${Utils.formatVND(golfTotal)}</strong></div>
                            <div>총 식사비: <strong class="calc-m-ttl" style="color:#c084fc;">${Utils.formatVND(mealTotal)}</strong></div>
                            <div>총 회비: <strong class="calc-t-ttl" style="color:#34d399;font-size:1.02rem;font-weight:800;">${Utils.formatVND(ttlGrandTotal)}</strong></div>
                        </div>
                    </div>
                </div>
            `;

            const tableElem = document.getElementById('calc-table');
            if (tableElem) tableElem.innerHTML = cardsHtml;

            // 비율 input 이벤트 바인딩 (input & change 반응)
            document.querySelectorAll('.ratio-input').forEach(input => {
                const handleRatioChange = (e) => {
                    const idx = Number(e.target.dataset.rank);
                    const cleanStr = e.target.value.replace(/[^0-9.]/g, '');
                    const val = parseFloat(cleanStr);
                    this.calcState.ratios[idx] = isNaN(val) ? 0 : val;
                    this.updateCalcTable({ keepDOM: true });
                };
                input.addEventListener('input', handleRatioChange);
                input.addEventListener('change', handleRatioChange);
            });
        } else {
            // keepDOM 모드: 기존 input을 유지하며 계산 셀만 업데이트
            const tableElem = document.getElementById('calc-table');
            if (tableElem) {
                for (let i = 0; i < count; i++) {
                    const gCell = tableElem.querySelector(`.calc-g-val-${i}`);
                    if (gCell) gCell.textContent = Utils.formatVND(golfPerRank[i]);

                    const mCell = tableElem.querySelector(`.calc-m-val-${i}`);
                    if (mCell) mCell.textContent = Utils.formatVND(mealPerRank[i]);

                    const tCell = tableElem.querySelector(`.calc-t-val-${i}`);
                    if (tCell) tCell.textContent = Utils.formatVND(ttlPerRank[i]);
                }
                const gTtlCell = tableElem.querySelector('.calc-g-ttl');
                if (gTtlCell) gTtlCell.textContent = Utils.formatVND(golfTotal);

                const mTtlCell = tableElem.querySelector('.calc-m-ttl');
                if (mTtlCell) mTtlCell.textContent = Utils.formatVND(mealTotal);

                const tTtlCell = tableElem.querySelector('.calc-t-ttl');
                if (tTtlCell) tTtlCell.textContent = Utils.formatVND(ttlGrandTotal);

                const ratioTotalCell = tableElem.querySelector('.cell-total-ratio');
                if (ratioTotalCell) ratioTotalCell.textContent = `${ratioSumFixed}%`;
            }
        }

        // 🎨 산뜻하고 깔끔한 비주얼 카드 시트 생성
        const visualElem = document.getElementById('notice-preview-visual');
        const rawElem = document.getElementById('notice-raw-text');

        if (visualElem) {
            const medalClasses = ['rank-gold', 'rank-silver', 'rank-bronze'];
            const medalIcons = ['🥇', '🥈', '🥉'];

            const rankCardsHtml = ttlPerRank.map((amt, idx) => {
                const rankClass = medalClasses[idx] || 'rank-normal';
                const medalIcon = medalIcons[idx] || `${idx + 1}등`;

                return `
                    <div class="rank-fee-card ${rankClass}">
                        <div class="rank-fee-header">
                            <span class="rank-fee-badge">${medalIcon}</span>
                            <span class="rank-fee-ratio">${ratios[idx]}% 배분</span>
                        </div>
                        <div class="rank-fee-amount">${Utils.formatVND(amt)}</div>
                        <div class="rank-fee-sub">골프 ${Utils.formatVND(golfPerRank[idx])} + 식사 ${Utils.formatVND(mealPerRank[idx])}</div>
                    </div>
                `;
            }).join('');

            visualElem.innerHTML = `
                <!-- 요약 배너 -->
                <div class="fresh-summary-banner">
                    <div class="banner-item">
                        <span class="banner-label">👥 참석 인원</span>
                        <span class="banner-value">${count}명</span>
                    </div>
                    <div class="banner-item">
                        <span class="banner-label">⛳ 골프비 총액</span>
                        <span class="banner-value">${Utils.formatVND(golfTotal)}</span>
                    </div>
                    <div class="banner-item">
                        <span class="banner-label">🍜 식사비 MAX</span>
                        <span class="banner-value">${Utils.formatVND(mealTotal)}</span>
                    </div>
                    <div class="banner-item highlight">
                        <span class="banner-label">💵 총 정산 예상 비용</span>
                        <span class="banner-value text-emerald">${Utils.formatVND(ttlGrandTotal)}</span>
                    </div>
                </div>

                <!-- 등수별 정산 카드 그리드 -->
                <div class="rank-fee-grid">
                    ${rankCardsHtml}
                </div>
            `;
        }

        // 카톡 단톡방 전용 예쁜 텍스트 시트 (표 형태) 생성
        if (rawElem) {
            const medalIcons = ['🥇', '🥈', '🥉'];
            const rankLines = ttlPerRank.map((amt, idx) => {
                const icon = medalIcons[idx] || '▫️';
                const rankName = `${icon} ${idx + 1}등`.padEnd(5, ' ');
                const ratioStr = `${ratios[idx]}%`.padStart(4, ' ');
                const amtStr = Utils.formatVND(amt).padStart(13, ' ');
                return `│ ${rankName} │ ${ratioStr} │ ${amtStr} │`;
            }).join('\n');

            rawElem.value =
                `⛳ [회사 모임 회비 정산 시트]
===================================
👥 참석 인원: ${count}명
⛳ 스크린 골프: ${Utils.formatVND(golfTotal)} ${golfMode === 'per_person' ? `(1인당 ${Utils.formatVND(golfVal)})` : ''}
🍜 식사비 (MAX): ${Utils.formatVND(mealTotal)}
💵 총 정산 비용: ${Utils.formatVND(ttlGrandTotal)}
-----------------------------------
┌   순위   ┬  비율  ┬    납부 금액 (VND)    ┐
├──────────┼────────┼───────────────────┤
${rankLines}
└──────────┴────────┴───────────────────┘
※ 게임 종료 후 최종 순위에 따라 입금해 주세요! 🙏`;
        }
    }
};

Router.register('club', ClubPage);
window.ClubPage = ClubPage;
