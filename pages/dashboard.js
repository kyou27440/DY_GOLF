/* ============================================
   DASHBOARD.JS — 통합 대시보드 페이지
   ============================================ */

const DashboardPage = {
    async render() {
        const [games, totalGamesCount, members, calcHistories] = await Promise.all([
            Store.getGames({ limit: 5 }).catch(() => []),
            Store.getGamesCount().catch(() => 0),
            Store.getMembers('active').catch(() => []),
            Store.getCalcHistoryList().catch(() => [])
        ]);

        const recentGames = (games || []).slice(0, 3);
        const totalCountDisplay = totalGamesCount || (games || []).length;
        const curVer = typeof APP_VERSION !== 'undefined' ? APP_VERSION : (window.APP_VERSION || 'v1.3.7');
        const curBuildTime = typeof APP_BUILD_TIME !== 'undefined' ? APP_BUILD_TIME : (window.APP_BUILD_TIME || '2026-08-28 11:45 (ICT)');
        const changelog = typeof APP_CHANGELOG !== 'undefined' ? APP_CHANGELOG : (window.APP_CHANGELOG || []);

        return `
        <div class="version-banner" style="background: linear-gradient(135deg, rgba(16,185,129,0.18), rgba(6,78,59,0.25)); border: 1px solid rgba(16,185,129,0.35); border-radius: 12px; padding: 12px 16px; margin-bottom: 20px; display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 10px; box-shadow: 0 4px 12px rgba(0,0,0,0.15);">
            <div style="display:flex;align-items:center;gap:12px;flex:1;min-width:240px;">
                <span style="font-size:1.4rem;">⛳</span>
                <div>
                    <div style="font-weight:700;font-size:0.98rem;color:var(--text-primary);">04_DY_GOLF - 스크린골프 모임 게임 기록 &amp; 회비 산출</div>
                    <div style="font-size:0.82rem;color:var(--text-muted);">모임 멤버 관리, 회비 입출금 기록, 스크린골프 순위 산출 최적화</div>
                </div>
            </div>
            <div style="text-align:right;flex-shrink:0;">
                <span class="badge badge-income" style="font-size:0.85rem;padding:4px 10px;font-weight:800;background:rgba(16,185,129,0.25);border:1px solid #10b981;color:#34d399;">${curVer} (DY_GOLF)</span>
                <div style="font-size:0.8rem;color:#38bdf8;font-weight:700;margin-top:4px;">🕒 리비젼: ${curBuildTime}</div>
            </div>
        </div>

        <div class="summary-grid">
            <div class="summary-card amber">
                <div class="card-icon">📊</div>
                <div class="card-label">저장된 산출 이력</div>
                <div class="card-value">${(calcHistories || []).length}건 보관</div>
                <div class="card-sub">날짜별 회비 산출 시트</div>
            </div>
            <div class="summary-card indigo">
                <div class="card-icon">🎮</div>
                <div class="card-label">최근 게임 기록</div>
                <div class="card-value">${totalCountDisplay}회 기록</div>
                <div class="card-sub">스크린골프 & 모임</div>
            </div>
            <div class="summary-card rose">
                <div class="card-icon">👥</div>
                <div class="card-label">활동 모임 멤버</div>
                <div class="card-value">${members.length}명</div>
                <div class="card-sub">상시 & 출장 멤버</div>
            </div>
        </div>

        <div class="dashboard-grid">
            <div class="card">
                <div class="card-header" style="display:flex;justify-content:space-between;align-items:center;">
                    <span class="card-title">🏆 최근 게임 기록 & 순위</span>
                    <button class="btn btn-ghost btn-sm" onclick="Router.navigate('club', 'games')">더보기 ➔</button>
                </div>
                ${recentGames.length > 0 ? this.renderRecentGames(recentGames) : '<div class="empty-state"><div class="empty-icon">⛳</div><p class="empty-text">아직 게임 기록이 없습니다</p></div>'}
            </div>
            <div class="card">
                <div class="card-header" style="display:flex;justify-content:space-between;align-items:center;">
                    <span class="card-title">📊 최근 저장된 회비 산출 이력</span>
                    <button class="btn btn-emerald btn-sm" onclick="Router.navigate('club', 'calculator')">산출시트 이동</button>
                </div>
                ${calcHistories && calcHistories.length > 0 ? this.renderRecentCalcs(calcHistories.slice(0, 3)) : '<div class="empty-state"><div class="empty-icon">📊</div><p class="empty-text">저장된 산출 이력이 없습니다</p></div>'}
            </div>
            <div class="card full-width">
                <div class="card-header" style="display:flex;justify-content:space-between;align-items:center;">
                    <span class="card-title">👥 활동 중인 모임 멤버</span>
                    <button class="btn btn-ghost btn-sm" onclick="Router.navigate('club', 'members')">멤버 관리 ➔</button>
                </div>
                ${this.renderActiveMembers(members)}
            </div>

            <!-- 최근 업데이트 (리비전 이력) 카드 -->
            <div class="card full-width" style="background:rgba(15,23,42,0.85);border:1px solid rgba(56,189,248,0.3);">
                <div class="card-header" style="display:flex;justify-content:space-between;align-items:center;margin-bottom:10px;">
                    <span class="card-title" style="color:#38bdf8;font-size:0.95rem;display:flex;align-items:center;gap:6px;">
                        <span>📋 최근 업데이트 내역</span>
                        <span style="font-size:0.75rem;padding:2px 8px;border-radius:12px;background:rgba(56,189,248,0.15);border:1px solid rgba(56,189,248,0.4);color:#38bdf8;">${curVer}</span>
                    </span>
                    <span style="font-size:0.75rem;color:#94a3b8;">🕒 ${curBuildTime}</span>
                </div>
                <div style="display:flex;flex-direction:column;gap:8px;">
                    ${changelog.length > 0 ? changelog.map(log => `
                        <div style="background:rgba(30,41,59,0.5);border-radius:8px;padding:10px 12px;border:1px solid rgba(255,255,255,0.05);">
                            <div style="font-size:0.82rem;font-weight:800;color:#f8fafc;margin-bottom:6px;display:flex;align-items:center;gap:8px;">
                                <span style="color:#10b981;">🚀 ${log.version}</span>
                                <span style="font-size:0.72rem;color:#94a3b8;font-weight:normal;">(${log.date})</span>
                            </div>
                            <ul style="margin:0;padding-left:18px;font-size:0.78rem;color:#cbd5e1;line-height:1.6;">
                                ${log.items.map(item => `<li>${item}</li>`).join('')}
                            </ul>
                        </div>
                    `).join('') : '<div style="font-size:0.8rem;color:#94a3b8;">업데이트 내역이 없습니다.</div>'}
                </div>
            </div>
        </div>`;
    },

    renderRecentGames(games) {
        let html = '<div class="recent-games-container" style="display:flex;flex-direction:column;gap:10px;">';
        games.forEach(g => {
            const parts = (g.club_game_participants || []).sort((a, b) => (a.ranking || 99) - (b.ranking || 99));

            const partBadges = parts.map(p => {
                const rankClass = p.ranking <= 3 && p.ranking > 0 ? `rank-${p.ranking}` : 'rank-other';
                const memberName = p.club_members?.name || p.member_name || '?';
                return `
                    <div class="recent-game-participant-chip" style="display:inline-flex;align-items:center;gap:5px;padding:3px 8px 3px 4px;background:rgba(255,255,255,0.06);border:1px solid rgba(255,255,255,0.1);border-radius:16px;font-size:0.82rem;box-sizing:border-box;">
                        <span class="ranking-badge ${rankClass}" style="width:20px;height:20px;font-size:0.72rem;flex-shrink:0;">${p.ranking || '-'}</span>
                        <span style="font-weight:600;color:#f8fafc;white-space:nowrap;">${Utils.escapeHtml(memberName)}</span>
                    </div>
                `;
            }).join('');

            html += `
            <div class="activity-item recent-game-card" style="display:flex;flex-direction:column;gap:8px;padding:12px 14px;background:linear-gradient(135deg, rgba(30,41,59,0.7), rgba(15,23,42,0.85));border:1px solid rgba(99,102,241,0.25);border-radius:12px;box-sizing:border-box;width:100%;">
                <div style="display:flex;justify-content:space-between;align-items:center;width:100%;flex-wrap:wrap;gap:6px;">
                    <div style="display:flex;align-items:center;gap:8px;">
                        <span style="font-size:1.1rem;">⛳</span>
                        <span style="font-weight:700;font-size:0.92rem;color:#f8fafc;">${Utils.formatDateKR(g.game_date)}</span>
                        ${g.location ? `<span style="font-size:0.8rem;color:#38bdf8;font-weight:500;">📍 ${Utils.escapeHtml(g.location)}</span>` : ''}
                    </div>
                    ${g.total_cost ? `<span style="font-size:0.82rem;font-weight:700;color:#10b981;">${Utils.formatVND(g.total_cost)}</span>` : ''}
                </div>
                <div class="recent-game-participants" style="display:flex;flex-wrap:wrap;gap:6px;margin-top:2px;width:100%;box-sizing:border-box;">
                    ${partBadges || '<span style="font-size:0.82rem;color:var(--text-muted);">참여자 기록 없음</span>'}
                </div>
            </div>`;
        });
        html += '</div>';
        return html;
    },

    renderRecentCalcs(histories) {
        let html = '<div style="display:flex;flex-direction:column;gap:12px">';
        histories.forEach(h => {
            html += `<div class="activity-item">
                <div class="activity-icon">📊</div>
                <div class="activity-info">
                    <div class="activity-title"><strong>[${Utils.formatDateKR(h.calc_date)}]</strong> ${Utils.escapeHtml(h.title || '스크린골프')} (${h.player_count}명)</div>
                    <div class="activity-meta" style="margin-top:4px;color:#10b981;font-weight:600;">
                        ${(h.rank_amounts || []).map((amt, idx) => `${idx + 1}등:${Utils.formatVND(amt)}`).join(' | ')}
                    </div>
                </div>
                <div style="font-weight:700;color:#38bdf8;">${Utils.formatVND(h.total_cost)}</div>
            </div>`;
        });
        html += '</div>';
        return html;
    },

    renderActiveMembers(members) {
        let html = '<div style="display:grid;grid-template-columns:repeat(auto-fill, minmax(210px, 1fr));gap:14px;">';
        members.forEach(m => {
            const avatarText = m.nickname ? Utils.escapeHtml(m.nickname) : (m.name.length >= 3 ? m.name.slice(-2) : m.name);
            const typeBadge = m.member_type === 'regular'
                ? `<span style="background:rgba(16,185,129,0.18);color:#34d399;border:1px solid rgba(16,185,129,0.35);font-size:0.8rem;font-weight:700;padding:2px 8px;border-radius:6px;white-space:nowrap;">상시</span>`
                : `<span style="background:rgba(139,92,246,0.18);color:#c084fc;border:1px solid rgba(139,92,246,0.35);font-size:0.8rem;font-weight:700;padding:2px 8px;border-radius:6px;white-space:nowrap;">출장</span>`;

            html += `
                <div class="active-member-card" style="display:flex;align-items:center;gap:14px;padding:14px 16px;background:linear-gradient(135deg, rgba(30,41,59,0.9), rgba(15,23,42,0.95));border:1px solid rgba(99,102,241,0.28);border-radius:14px;box-shadow:0 4px 14px rgba(0,0,0,0.18);transition:all 0.2s ease;">
                    <div class="member-avatar" style="height:42px;min-width:50px;padding:0 14px;font-size:0.92rem;font-weight:700;border-radius:21px;background:linear-gradient(135deg,#6366f1,#8b5cf6);box-shadow:0 4px 12px rgba(99,102,241,0.35);color:#ffffff;display:inline-flex;align-items:center;justify-content:center;white-space:nowrap;">${avatarText}</div>
                    <div style="overflow:hidden;flex:1;">
                        <div style="font-weight:700;font-size:1.05rem;color:#f8fafc;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;">${Utils.escapeHtml(m.name)}</div>
                        <div style="display:flex;align-items:center;gap:6px;margin-top:5px;white-space:nowrap;">
                            ${typeBadge}
                            <span style="font-size:0.88rem;color:#cbd5e1;font-weight:500;white-space:nowrap;">• ${Utils.escapeHtml(m.company)}</span>
                        </div>
                    </div>
                </div>
            `;
        });
        html += '</div>';
        return html;
    },

};


Router.register('dashboard', DashboardPage);
window.DashboardPage = DashboardPage;
