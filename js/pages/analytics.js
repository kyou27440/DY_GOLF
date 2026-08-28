/* ============================================
   ANALYTICS.JS — 성적통계 페이지 (도표 전용)
   ============================================ */

const AnalyticsPage = {
    async render() {
        return `<div id="analytics-body" style="padding:4px 0;"></div>`;
    },

    async afterRender() {
        const container = document.getElementById('analytics-body');
        if (!container) return;

        const [stats, trend] = await Promise.all([
            Store.getMemberStats(),
            Store.getRankingTrend(20)
        ]);

        // ─ 1등 / 꼴찌 횟수 계산 ─
        const memberFirstCount = {};
        const memberLastCount = {};
        trend.forEach(g => {
            const parts = g.club_game_participants || [];
            const ranked = parts.filter(p => p.ranking);
            if (!ranked.length) return;
            const maxRank = Math.max(...ranked.map(p => p.ranking));
            ranked.forEach(p => {
                const name = p.club_members?.name || '?';
                if (p.ranking === 1) memberFirstCount[name] = (memberFirstCount[name] || 0) + 1;
                if (p.ranking === maxRank) memberLastCount[name] = (memberLastCount[name] || 0) + 1;
            });
        });

        if (!stats.length) {
            container.innerHTML = `<div class="empty-state"><div class="empty-icon">🏆</div><p class="empty-text">게임 기록이 없습니다</p></div>`;
            return;
        }

        container.innerHTML = `
            <div class="section-header" style="margin-bottom:16px;">
                <span class="section-title">🏆 멤버별 성적 현황</span>
            </div>

            <!-- 리더보드 도표 -->
            <div style="background:rgba(15,23,42,0.85);border:1px solid rgba(99,102,241,0.3);
                        border-radius:16px;overflow:hidden;box-shadow:0 6px 24px rgba(0,0,0,0.28);margin-bottom:20px;">
                <!-- 헤더 행 -->
                <div style="display:grid;grid-template-columns:52px 1fr 80px 80px 80px 70px 70px;
                            padding:10px 16px;align-items:center;
                            background:linear-gradient(90deg,rgba(99,102,241,0.22),rgba(139,92,246,0.14));
                            border-bottom:1px solid rgba(99,102,241,0.28);
                            font-size:0.76rem;font-weight:800;letter-spacing:0.04em;color:#94a3b8;">
                    <div style="text-align:center;">순위</div>
                    <div>멤버</div>
                    <div style="text-align:center;">게임수</div>
                    <div style="text-align:center;">평균등수</div>
                    <div style="text-align:center;">최고등수</div>
                    <div style="text-align:center;">🥇 1등</div>
                    <div style="text-align:center;">꼴찌</div>
                </div>
                <!-- 멤버 행 -->
                ${stats.map((s, idx) => {
            const rank1 = idx + 1;
            const rowBg = idx % 2 === 0 ? 'rgba(30,41,59,0.45)' : 'rgba(15,23,42,0.3)';
            let rankBadge, rankColor;
            if (rank1 === 1) { rankBadge = '🥇'; rankColor = '#fbbf24'; }
            else if (rank1 === 2) { rankBadge = '🥈'; rankColor = '#94a3b8'; }
            else if (rank1 === 3) { rankBadge = '🥉'; rankColor = '#cd7c2f'; }
            else { rankBadge = String(rank1); rankColor = '#64748b'; }
            const avgRankNum = s.avgRank !== '-' ? parseFloat(s.avgRank) : null;
            const avgColor = avgRankNum !== null
                ? (avgRankNum <= 2 ? '#34d399' : avgRankNum <= 3.5 ? '#38bdf8' : avgRankNum <= 5 ? '#f59e0b' : '#f43f5e')
                : '#64748b';
            const first1 = memberFirstCount[s.name] || 0;
            const last1 = memberLastCount[s.name] || 0;
            return `<div style="display:grid;grid-template-columns:52px 1fr 80px 80px 80px 70px 70px;
                                        padding:12px 16px;align-items:center;min-height:58px;
                                        background:${rowBg};border-bottom:1px solid rgba(255,255,255,0.04);
                                        transition:background 0.15s;"
                                 onmouseover="this.style.background='rgba(99,102,241,0.1)'"
                                 onmouseout="this.style.background='${rowBg}'">
                        <div style="text-align:center;font-size:${rank1 <= 3 ? '1.5rem' : '1rem'};font-weight:800;color:${rankColor};">${rankBadge}</div>
                        <div style="display:flex;align-items:center;gap:9px;">
                            <div style="width:36px;height:36px;border-radius:50%;background:linear-gradient(135deg,#6366f1,#8b5cf6);display:flex;align-items:center;justify-content:center;font-size:0.76rem;font-weight:800;color:#fff;flex-shrink:0;">${Utils.escapeHtml(s.name).substring(0, 2)}</div>
                            <span style="font-weight:700;font-size:0.95rem;color:#f1f5f9;">${Utils.escapeHtml(s.name)}</span>
                        </div>
                        <div style="text-align:center;font-size:0.88rem;font-weight:700;color:#cbd5e1;">${s.games}<span style="font-size:0.72rem;color:#64748b;"> 회</span></div>
                        <div style="text-align:center;font-size:1rem;font-weight:800;color:${avgColor};">${s.avgRank !== '-' ? s.avgRank + '등' : '—'}</div>
                        <div style="text-align:center;font-size:0.9rem;font-weight:700;color:#34d399;">${s.best !== '-' ? s.best + '등' : '—'}</div>
                        <div style="text-align:center;font-size:0.9rem;font-weight:700;color:#fbbf24;">${first1 > 0 ? first1 + '회' : '—'}</div>
                        <div style="text-align:center;font-size:0.9rem;font-weight:700;color:#f43f5e;">${last1 > 0 ? last1 + '회' : '—'}</div>
                    </div>`;
        }).join('')}
            </div>

            <!-- 시상대 요약 카드 (상위 3명) -->
            <div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(160px,1fr));gap:12px;">
                ${stats.slice(0, 3).map((s, idx) => {
            const labels = ['🥇 종합 1위', '🥈 종합 2위', '🥉 종합 3위'];
            const colors = ['rgba(251,191,36,0.18)', 'rgba(148,163,184,0.15)', 'rgba(205,124,47,0.15)'];
            const borders = ['rgba(251,191,36,0.5)', 'rgba(148,163,184,0.4)', 'rgba(205,124,47,0.4)'];
            const first1 = memberFirstCount[s.name] || 0;
            return `<div style="padding:16px;background:${colors[idx]};border:1px solid ${borders[idx]};border-radius:14px;">
                        <div style="font-size:0.72rem;font-weight:700;color:#94a3b8;margin-bottom:5px;">${labels[idx]}</div>
                        <div style="font-size:1.15rem;font-weight:800;color:#f8fafc;">${Utils.escapeHtml(s.name)}</div>
                        <div style="font-size:0.78rem;color:#94a3b8;margin-top:5px;display:flex;gap:10px;flex-wrap:wrap;">
                            <span>평균 ${s.avgRank !== '-' ? s.avgRank + '등' : '-'}</span>
                            <span>최고 ${s.best !== '-' ? s.best + '등' : '-'}</span>
                            <span>1등 ${first1}회</span>
                        </div>
                    </div>`;
        }).join('')}
            </div>
        `;
    }
};

Router.register('analytics', AnalyticsPage);
window.AnalyticsPage = AnalyticsPage;
