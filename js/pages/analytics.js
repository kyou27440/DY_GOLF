/* ============================================
   ANALYTICS.JS — 자산 현황 및 통계 페이지
   ============================================ */

const AnalyticsPage = {
    async render() {
        return `
        <div class="analytics-grid">
            <div class="card full-width">
                <div class="card-header"><span class="card-title">🏆 멤버별 평균 순위</span></div>
                <div class="chart-container" style="height:300px"><canvas id="member-avg-chart"></canvas></div>
            </div>
            <div class="card full-width">
                <div class="card-header"><span class="card-title">⛳ 등수 변동 추이</span></div>
                <div class="chart-container" style="height:300px"><canvas id="ranking-line-chart"></canvas></div>
            </div>
        </div>`;
    },

    async afterRender() {
        await Promise.all([
            this.drawMemberAvgRank(),
            this.drawRankingLine()
        ]);
    },

    async drawMemberAvgRank() {
        const canvas = document.getElementById('member-avg-chart');
        if (!canvas) return;
        const stats = await Store.getMemberStats();
        if (stats.length === 0) { canvas.parentElement.innerHTML = '<div class="empty-state"><p class="text-muted">게임 기록 없음</p></div>'; return; }
        const active = stats.filter(s => s.status === 'active');

        new Chart(canvas, {
            type: 'bar',
            data: {
                labels: active.map(s => s.name),
                datasets: [{ label: '평균 순위', data: active.map(s => parseFloat(s.avgRank) || 0), backgroundColor: Utils.chartColors.slice(0, active.length), borderRadius: 8 }]
            },
            options: {
                ...Utils.chartDefaults(), indexAxis: 'y',
                scales: { ...Utils.chartDefaults().scales, x: { ...Utils.chartDefaults().scales.x, beginAtZero: true } }
            }
        });
    },

    async drawRankingLine() {
        const canvas = document.getElementById('ranking-line-chart');
        if (!canvas) return;
        const trend = await Store.getRankingTrend(10);
        if (trend.length === 0) { canvas.parentElement.innerHTML = '<div class="empty-state"><p class="text-muted">게임 기록 없음</p></div>'; return; }

        const labels = trend.map(g => Utils.formatDateKR(g.game_date));
        const memberMap = {};
        trend.forEach((g, idx) => {
            (g.club_game_participants || []).forEach(p => {
                const name = p.club_members?.name || '?';
                if (!memberMap[name]) memberMap[name] = new Array(trend.length).fill(null);
                memberMap[name][idx] = p.ranking;
            });
        });
        const datasets = Object.entries(memberMap).map(([name, data], i) => ({
            label: name, data, borderColor: Utils.chartColors[i % Utils.chartColors.length],
            tension: 0.3, fill: false, spanGaps: true, pointRadius: 5
        }));

        new Chart(canvas, {
            type: 'line', data: { labels, datasets },
            options: { ...Utils.chartDefaults(), scales: { ...Utils.chartDefaults().scales, y: { ...Utils.chartDefaults().scales.y, reverse: true, min: 1, ticks: { stepSize: 1, color: '#6b7280' } } } }
        });
    }
};

Router.register('analytics', AnalyticsPage);
window.AnalyticsPage = AnalyticsPage;
