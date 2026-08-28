/* ============================================
   ANALYTICS.JS — 성적통계 페이지 (가로폭 반축소 & 카톡 캡처 최적화)
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
            Store.getRankingTrend(30)
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
                const name = p.club_members?.name || p.member_name || '?';
                if (p.ranking === 1) memberFirstCount[name] = (memberFirstCount[name] || 0) + 1;
                if (p.ranking === maxRank) memberLastCount[name] = (memberLastCount[name] || 0) + 1;
            });
        });

        if (!stats.length) {
            container.innerHTML = `<div class="empty-state" style="padding:40px 15px;"><div class="empty-icon">🏆</div><p class="empty-text">게임 기록이 없습니다</p></div>`;
            return;
        }

        const now = new Date();
        const dateStr = `${now.getFullYear()}.${String(now.getMonth() + 1).padStart(2, '0')}.${String(now.getDate()).padStart(2, '0')}`;

        // ── 카톡 공유용 텍스트 생성 ──
        const kakaoLines = [];
        kakaoLines.push(`🏆 [DY GOLF] 멤버별 성적 순위`);
        kakaoLines.push(`📅 기준일: ${dateStr}`);
        kakaoLines.push(`━━━━━━━━━━━━━━━━`);
        stats.forEach((s, idx) => {
            const rank = idx + 1;
            const medal = rank === 1 ? '🥇' : (rank === 2 ? '🥈' : (rank === 3 ? '🥉' : `${rank}위`));
            const f1 = memberFirstCount[s.name] || 0;
            kakaoLines.push(`${medal} ${s.name} : 평균 ${s.avgRank !== '-' ? s.avgRank + '등' : '-'} (${s.games}게임 / 1등 ${f1}회)`);
        });
        kakaoLines.push(`━━━━━━━━━━━━━━━━`);
        kakaoLines.push(`⛳ DY GOLF 성적 랭킹`);

        container.innerHTML = `
        <!-- 페이지 헤더 -->
        <div style="background:linear-gradient(135deg,rgba(30,41,59,0.85),rgba(15,23,42,0.95));border:1px solid rgba(99,102,241,0.3);border-radius:14px;padding:10px 14px;margin-bottom:12px;box-shadow:0 4px 20px rgba(0,0,0,0.25);">
            <div style="display:flex;justify-content:space-between;align-items:center;flex-wrap:wrap;gap:8px;">
                <div style="display:flex;align-items:center;gap:10px;">
                    <div style="width:32px;height:32px;border-radius:10px;background:linear-gradient(135deg,#6366f1,#8b5cf6);display:flex;align-items:center;justify-content:center;font-size:1.1rem;flex-shrink:0;">🏆</div>
                    <div>
                        <div style="font-weight:800;font-size:0.95rem;color:#f8fafc;">멤버별 성적 현황</div>
                        <div style="display:flex;flex-wrap:wrap;gap:5px;margin-top:3px;">
                            <span style="font-size:0.67rem;padding:1px 7px;border-radius:20px;background:rgba(99,102,241,0.15);border:1px solid rgba(99,102,241,0.35);color:#a78bfa;font-weight:700;">평균등수순</span>
                            <span style="font-size:0.67rem;padding:1px 7px;border-radius:20px;background:rgba(56,189,248,0.12);border:1px solid rgba(56,189,248,0.3);color:#38bdf8;font-weight:700;">총 ${stats.length}명 참여</span>
                        </div>
                    </div>
                </div>
            </div>
        </div>

        <!-- 2단 레이아웃 (좌: 가로폭 반축소 컴팩트 성적표 / 우: 카톡공지 & TOP3 시상대) -->
        <div style="display:grid;grid-template-columns:minmax(320px, 520px) minmax(300px, 1fr);gap:14px;align-items:start;">
            
            <!-- [좌측] 카톡 캡처 최적화 컴팩트 성적표 카드 (가로폭 반축소) -->
            <div id="analytics-capture-card" style="background:rgba(15,23,42,0.85);border:1px solid rgba(99,102,241,0.3);border-radius:14px;overflow:hidden;box-shadow:0 6px 24px rgba(0,0,0,0.28);width:100%;max-width:520px;">
                <!-- 캡처 상단 타이틀 바 -->
                <div style="padding:6px 12px;background:rgba(30,41,59,0.7);border-bottom:1px solid rgba(255,255,255,0.08);display:flex;justify-content:space-between;align-items:center;">
                    <div style="font-size:0.75rem;font-weight:800;color:#cbd5e1;display:flex;align-items:center;gap:6px;">
                        <span>🏆 DY GOLF 성적 랭킹</span>
                        <span style="font-size:0.65rem;color:#64748b;font-weight:600;">${dateStr}</span>
                    </div>
                    <span style="font-size:0.65rem;color:#38bdf8;font-weight:700;background:rgba(56,189,248,0.12);padding:1px 6px;border-radius:4px;">📱 캡처 최적화</span>
                </div>

                <!-- 테이블 헤더 -->
                <div style="display:grid;grid-template-columns:minmax(80px,1fr) 48px 54px 48px 48px 44px;
                            padding:6px 8px;align-items:center;
                            background:linear-gradient(90deg,rgba(99,102,241,0.22),rgba(139,92,246,0.15));
                            border-bottom:1px solid rgba(99,102,241,0.3);
                            font-size:0.68rem;font-weight:800;letter-spacing:0.01em;">
                    <div style="color:#e2e8f0;padding-left:4px;">순위 · 멤버</div>
                    <div style="text-align:center;color:#cbd5e1;">게임</div>
                    <div style="text-align:center;color:#38bdf8;">평균등</div>
                    <div style="text-align:center;color:#34d399;">최고</div>
                    <div style="text-align:center;color:#fbbf24;">🥇1등</div>
                    <div style="text-align:center;color:#f43f5e;">꼴찌</div>
                </div>

                <!-- 멤버 행 목록 -->
                <div>
                    ${stats.map((s, idx) => {
                        const rank1 = idx + 1;
                        const rowBg = idx % 2 === 0 ? 'rgba(30,41,59,0.45)' : 'rgba(15,23,42,0.35)';
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
                        const avatarText = s.name.length >= 2 ? s.name.slice(-2) : s.name;

                        return `
                        <div style="display:grid;grid-template-columns:minmax(80px,1fr) 48px 54px 48px 48px 44px;
                                    padding:5px 8px;min-height:38px;align-items:center;
                                    background:${rowBg};border-bottom:1px solid rgba(255,255,255,0.04);
                                    transition:background 0.12s;"
                             onmouseover="this.style.background='rgba(99,102,241,0.1)'"
                             onmouseout="this.style.background='${rowBg}'">
                            
                            <!-- 순위 & 프로필 -->
                            <div style="display:flex;align-items:center;gap:6px;min-width:0;">
                                <span style="font-size:${rank1 <= 3 ? '1.1rem' : '0.82rem'};font-weight:800;color:${rankColor};width:18px;text-align:center;flex-shrink:0;">${rankBadge}</span>
                                <div style="height:20px;width:20px;font-size:0.58rem;font-weight:800;border-radius:6px;
                                            background:linear-gradient(135deg,#6366f1,#8b5cf6);color:#fff;
                                            display:inline-flex;align-items:center;justify-content:center;white-space:nowrap;flex-shrink:0;">
                                    ${avatarText}
                                </div>
                                <span style="font-weight:700;font-size:0.82rem;color:#f8fafc;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;">
                                    ${Utils.escapeHtml(s.name)}
                                </span>
                            </div>

                            <!-- 게임수 -->
                            <div style="text-align:center;font-size:0.8rem;font-weight:700;color:#cbd5e1;">
                                ${s.games}<span style="font-size:0.68rem;color:#64748b;">회</span>
                            </div>

                            <!-- 평균등수 -->
                            <div style="display:flex;justify-content:center;">
                                <div style="width:48px;height:24px;display:flex;align-items:center;justify-content:center;
                                            background:rgba(15,23,42,0.8);border:1px solid rgba(56,189,248,0.35);
                                            border-radius:5px;font-size:0.82rem;font-weight:800;color:${avgColor};">
                                    ${s.avgRank !== '-' ? s.avgRank + '등' : '—'}
                                </div>
                            </div>

                            <!-- 최고등수 -->
                            <div style="text-align:center;font-size:0.82rem;font-weight:700;color:#34d399;">
                                ${s.best !== '-' ? s.best + '등' : '—'}
                            </div>

                            <!-- 1등수 -->
                            <div style="text-align:center;font-size:0.82rem;font-weight:800;color:#fbbf24;">
                                ${first1 > 0 ? first1 + '회' : '—'}
                            </div>

                            <!-- 꼴찌수 -->
                            <div style="text-align:center;font-size:0.82rem;font-weight:700;color:#f43f5e;">
                                ${last1 > 0 ? last1 + '회' : '—'}
                            </div>
                        </div>`;
                    }).join('')}
                </div>
            </div>

            <!-- [우측] 카톡 텍스트 공지 & TOP3 시상대 카드 -->
            <div style="display:flex;flex-direction:column;gap:12px;">
                
                <!-- 1. 카톡 공지용 텍스트 원클릭 복사 카드 -->
                <div style="background:linear-gradient(135deg,rgba(30,41,59,0.7),rgba(15,23,42,0.85));border:1px solid rgba(56,189,248,0.3);border-radius:14px;padding:14px;box-shadow:0 4px 18px rgba(0,0,0,0.2);">
                    <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:10px;">
                        <div style="font-weight:800;font-size:0.85rem;color:#38bdf8;display:flex;align-items:center;gap:6px;">
                            <span>📋 카톡 공지용 성적 랭킹</span>
                            <span style="font-size:0.68rem;color:#94a3b8;font-weight:normal;">(원클릭 복사)</span>
                        </div>
                        <button onclick="AnalyticsPage.copyKakaoText()" class="btn btn-sm"
                                style="font-size:0.72rem;padding:4px 12px;border-radius:7px;background:linear-gradient(135deg,#f59e0b,#d97706);color:#fff;font-weight:800;border:none;box-shadow:0 2px 8px rgba(245,158,11,0.3);cursor:pointer;">
                            💬 카톡 텍스트 복사
                        </button>
                    </div>
                    <textarea id="analytics-kakao-preview" readonly
                              style="width:100%;height:100px;background:rgba(15,23,42,0.9);border:1px solid rgba(255,255,255,0.1);border-radius:8px;color:#e2e8f0;font-size:0.75rem;font-family:monospace;padding:8px;resize:none;outline:none;box-sizing:border-box;line-height:1.4;">${kakaoLines.join('\n')}</textarea>
                </div>

                <!-- 2. 시상대 요약 카드 (TOP 3) -->
                <div style="background:rgba(15,23,42,0.75);border:1px solid rgba(139,92,246,0.3);border-radius:14px;padding:14px;box-shadow:0 4px 18px rgba(0,0,0,0.2);">
                    <div style="font-weight:800;font-size:0.85rem;color:#c084fc;margin-bottom:10px;display:flex;align-items:center;gap:6px;">
                        <span>👑 종합 TOP 3 리더보드</span>
                    </div>
                    <div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(120px,1fr));gap:8px;">
                        ${stats.slice(0, 3).map((s, idx) => {
                            const medals = ['🥇 1위', '🥈 2위', '🥉 3위'];
                            const bgs = ['rgba(251,191,36,0.12)', 'rgba(148,163,184,0.1)', 'rgba(205,124,47,0.1)'];
                            const borders = ['rgba(251,191,36,0.4)', 'rgba(148,163,184,0.3)', 'rgba(205,124,47,0.3)'];
                            const f1 = memberFirstCount[s.name] || 0;
                            return `
                            <div style="background:${bgs[idx]};border:1px solid ${borders[idx]};border-radius:10px;padding:10px;text-align:center;">
                                <div style="font-size:0.72rem;font-weight:800;color:#94a3b8;margin-bottom:2px;">${medals[idx]}</div>
                                <div style="font-size:1rem;font-weight:800;color:#f8fafc;">${Utils.escapeHtml(s.name)}</div>
                                <div style="margin-top:6px;font-size:0.72rem;color:#cbd5e1;line-height:1.4;">
                                    <div>평균 <b style="color:#38bdf8;">${s.avgRank}등</b></div>
                                    <div style="color:#94a3b8;font-size:0.68rem;">1등 <b>${f1}회</b> / ${s.games}게임</div>
                                </div>
                            </div>`;
                        }).join('')}
                    </div>
                </div>

            </div>
        </div>
        `;
    },

    copyKakaoText() {
        const elPreview = document.getElementById('analytics-kakao-preview');
        if (!elPreview || !elPreview.value) {
            Utils.toast('복사할 성적 정보가 없습니다.', 'warning');
            return;
        }
        navigator.clipboard.writeText(elPreview.value)
            .then(() => {
                Utils.toast('📋 카톡 공지용 성적 텍스트가 복사되었습니다!', 'success');
            })
            .catch(() => {
                elPreview.select();
                document.execCommand('copy');
                Utils.toast('📋 카톡 공지용 성적 텍스트가 복사되었습니다!', 'success');
            });
    }
};

Router.register('analytics', AnalyticsPage);
window.AnalyticsPage = AnalyticsPage;
