/* ============================================
   STORE.JS — Supabase 데이터 접근 레이어 (DAL)
   모든 DB CRUD를 이 파일에서 관리
   ============================================ */
if (typeof supabaseClient === 'undefined' || !supabaseClient || typeof supabaseClient.from !== 'function') {
    try {
        if (typeof supabase !== 'undefined' && supabase && supabase.createClient) {
            supabaseClient = supabase.createClient(SUPABASE_URL, SUPABASE_KEY);
        }
    } catch(e) {}
}

const Store = {
    // ── 인메모리 캐시 & 중복 요청 방지 (In-Flight Deduplication) ──
    _memCache: {
        members: null,
        games: null,
        calcHistory: null,
        ghandicapConfigs: null,
        settings: {},
        ts: {}
    },
    _inflight: {},
    CACHE_TTL: 60 * 1000, // 60초 동안 메모리 캐시 즉시 반환 (수정/저장 시 즉시 갱신)

    _isCacheValid(key) {
        return !!(this._memCache[key] !== null && this._memCache[key] !== undefined && this._memCache.ts[key] && (Date.now() - this._memCache.ts[key] < this.CACHE_TTL));
    },

    _setCache(key, data) {
        this._memCache[key] = data;
        this._memCache.ts[key] = Date.now();
    },

    invalidateCache(key = null) {
        if (key) {
            this._memCache[key] = null;
            delete this._memCache.ts[key];
        } else {
            this._memCache.members = null;
            this._memCache.games = null;
            this._memCache.calcHistory = null;
            this._memCache.ghandicapConfigs = null;
            this._memCache.settings = {};
            this._memCache.ts = {};
        }
    },

    /** 로컬/메모리 캐시 존재 여부 (대시보드 0.01초 즉시 렌더링 판단용) */
    hasInstantDashboardCache() {
        if (this._memCache.games && this._memCache.members) return true;
        const localGames = this._getLocalGames();
        const localMembers = this._getLocalMembers();
        return (localGames.length > 0 || localMembers.length > 0);
    },

    /** 대시보드용 동기(Synchronous) 즉시 캐시 데이터 반환 */
    getCachedDashboardData() {
        const allGames = this._memCache.games || this._getLocalGames() || [];
        const allMembers = this._memCache.members || (this._getLocalMembers() || []).map(m => this._parseMember(m));
        const activeMembers = allMembers.filter(m => !m.status || m.status === 'active');
        const calcHistories = this._memCache.calcHistory || this._getLocalCalcHistory() || [];

        // 로컬 게임에 멤버 이름 매핑 보완
        const memMap = {};
        allMembers.forEach(m => { if (m && m.id) memMap[m.id] = m; });
        allGames.forEach(g => {
            if (g && Array.isArray(g.club_game_participants)) {
                g.club_game_participants.forEach(p => {
                    if ((!p.club_members || !p.club_members.name) && memMap[p.member_id]) {
                        p.club_members = { name: memMap[p.member_id].name };
                    }
                });
            }
        });

        return {
            games: allGames.slice(0, 5),
            totalGamesCount: allGames.length,
            members: activeMembers,
            calcHistories
        };
    },

    // ── Safe Query Helper ──
    from(tableName) {
        if (typeof supabaseClient === 'undefined' || !supabaseClient || typeof supabaseClient.from !== 'function') {
            try {
                if (typeof supabase !== 'undefined' && supabase && supabase.createClient) {
                    supabaseClient = supabase.createClient(SUPABASE_URL, SUPABASE_KEY);
                }
            } catch(e) {}
        }
        if (!supabaseClient || typeof supabaseClient.from !== 'function') {
            const dummy = {
                select: () => dummy,
                eq: () => dummy,
                gte: () => dummy,
                lte: () => dummy,
                order: () => dummy,
                limit: () => dummy,
                single: () => Promise.resolve({ data: null, error: null }),
                insert: () => dummy,
                update: () => dummy,
                delete: () => dummy,
                upsert: () => Promise.resolve({ error: null }),
                then: (resolve) => resolve({ data: [], error: null })
            };
            return dummy;
        }
        return supabaseClient.from(tableName);
    },

    // ─── 개인 가계부: 카테고리 ───

    async getCategories(type = null) {
        let q = this.from('personal_categories').select('*').eq('is_active', true).order('sort_order');
        if (type) q = q.eq('type', type);
        const { data, error } = await q;
        if (error) { console.error('getCategories:', error); return []; }
        return data || [];
    },

    async addCategory(cat) {
        const { data, error } = await this.from('personal_categories').insert(cat).select().single();
        if (error) { console.error('addCategory:', error); return null; }
        return data;
    },

    async deleteCategory(id) {
        const { error } = await this.from('personal_categories').update({ is_active: false, updated_at: new Date().toISOString() }).eq('id', id);
        if (error) { console.error('deleteCategory:', error); return false; }
        return true;
    },

    // ─── 개인 가계부: 거래 ───

    async getTransactions(filters = {}) {
        let q = this.from('personal_transactions').select('*, personal_categories(name, icon)').order('tx_date', { ascending: false }).order('created_at', { ascending: false });
        if (filters.startDate) q = q.gte('tx_date', filters.startDate);
        if (filters.endDate) q = q.lte('tx_date', filters.endDate);
        if (filters.type) q = q.eq('type', filters.type);
        if (filters.category_id) q = q.eq('category_id', filters.category_id);
        if (filters.limit) q = q.limit(filters.limit);
        const { data, error } = await q;
        if (error) { console.error('getTransactions:', error); return []; }
        return data || [];
    },

    async addTransaction(tx) {
        const { data, error } = await this.from('personal_transactions').insert(tx).select('*, personal_categories(name, icon)').single();
        if (error) { console.error('addTransaction:', error); return null; }
        return data;
    },

    async updateTransaction(id, updates) {
        updates.updated_at = new Date().toISOString();
        const { data, error } = await this.from('personal_transactions').update(updates).eq('id', id).select('*, personal_categories(name, icon)').single();
        if (error) { console.error('updateTransaction:', error); return null; }
        return data;
    },

    async deleteTransaction(id) {
        const { error } = await this.from('personal_transactions').delete().eq('id', id);
        if (error) { console.error('deleteTransaction:', error); return false; }
        return true;
    },

    async getTransactionSummary(startDate, endDate) {
        const { data, error } = await this.from('personal_transactions').select('type, amount').gte('tx_date', startDate).lte('tx_date', endDate);
        if (error) { console.error('getTransactionSummary:', error); return { income: 0, expense: 0, balance: 0 }; }
        let income = 0, expense = 0;
        (data || []).forEach(t => { if (t.type === 'income') income += Number(t.amount); else expense += Number(t.amount); });
        return { income, expense, balance: income - expense };
    },

    async getTotalBalance() {
        const { data, error } = await this.from('personal_transactions').select('type, amount');
        if (error) { console.error('getTotalBalance:', error); return 0; }
        let balance = 0;
        (data || []).forEach(t => { balance += t.type === 'income' ? Number(t.amount) : -Number(t.amount); });
        return balance;
    },

    // ─── 모임: 멤버 ───

    _formatMemberForSave(memberData) {
        const copy = { ...memberData };
        const nick = copy.nickname ? copy.nickname.trim() : '';
        let userMemo = copy.memo ? copy.memo.replace(/\[nick:[^\]]*\]/g, '').trim() : '';
        if (nick) {
            copy.memo = `[nick:${nick}] ${userMemo}`.trim();
        } else {
            copy.memo = userMemo;
        }
        delete copy.nickname;
        return copy;
    },

    _parseMember(member) {
        if (!member) return member;
        let nick = member.nickname || '';
        let memo = member.memo || '';
        if (!nick && memo && memo.includes('[nick:')) {
            const match = memo.match(/\[nick:([^\]]+)\]/);
            if (match) {
                nick = match[1];
                memo = memo.replace(/\[nick:[^\]]*\]/g, '').trim();
            }
        }
        return { ...member, nickname: nick, memo: memo };
    },

    _getLocalMembers() {
        try {
            const raw = localStorage.getItem('club_local_members_v1');
            return raw ? JSON.parse(raw) : [];
        } catch(e) { return []; }
    },

    _saveLocalMembers(list) {
        try {
            localStorage.setItem('club_local_members_v1', JSON.stringify(list));
        } catch(e) {}
    },

    async getMembers(statusFilter = null, options = {}) {
        // 1. 인메모리 캐시가 유효하면 즉시 반환 (0ms)
        if (!options.forceRefresh && this._isCacheValid('members')) {
            const cached = this._memCache.members || [];
            return statusFilter ? cached.filter(m => m.status === statusFilter) : [...cached];
        }

        // 2. 동시에 여러 곳에서 getMembers() 호출 시 단일 네트워크 요청만 실행 (Deduplication)
        if (!this._inflight.members) {
            this._inflight.members = (async () => {
                let dbList = [];
                try {
                    const { data, error } = await this.from('club_members').select('*').order('name');
                    if (!error && data && data.length > 0) dbList = data;
                } catch(e) {
                    console.error('getMembers DB error:', e);
                }

                const localList = this._getLocalMembers();
                const combinedMap = {};

                // 1. DB 데이터 우선 등록 (클라우드가 진실의 원천)
                dbList.forEach(m => { if (m && m.id) combinedMap[String(m.id)] = m; });

                // 2. 로컬에만 있는 신규 항목만 보완 (DB 데이터를 절대 덮어쓰지 않음)
                localList.forEach(m => {
                    if (!m || !m.id) return;
                    if (!combinedMap[String(m.id)]) {
                        combinedMap[String(m.id)] = m;
                    }
                });

                const finalList = Object.values(combinedMap);
                if (dbList.length > 0) {
                    this._saveLocalMembers(finalList);
                }
                const parsed = finalList.map(m => this._parseMember(m));
                this._setCache('members', parsed);
                return parsed;
            })().finally(() => {
                delete this._inflight.members;
            });
        }

        const allMembers = await this._inflight.members;
        return statusFilter ? allMembers.filter(m => m.status === statusFilter) : [...allMembers];
    },

    async addMember(member) {
        member.status = member.status || 'active';
        member.created_at = member.created_at || new Date().toISOString();
        const prepared = this._formatMemberForSave(member);

        let dbMember = null;
        try {
            let { data, error } = await this.from('club_members').insert(prepared).select().single();
            if (error && error.message && error.message.includes('nickname')) {
                const copy = { ...prepared };
                delete copy.nickname;
                const res = await this.from('club_members').insert(copy).select().single();
                data = res.data;
            }
            if (data) dbMember = data;
        } catch(e) {}

        const savedMember = dbMember || { ...prepared, id: Date.now() };

        const localList = this._getLocalMembers();
        const existingIdx = localList.findIndex(m => String(m.id) === String(savedMember.id) || m.name === savedMember.name);
        if (existingIdx >= 0) {
            localList[existingIdx] = savedMember;
        } else {
            localList.push(savedMember);
        }
        this._saveLocalMembers(localList);
        this.invalidateCache('members');

        return this._parseMember(savedMember);
    },

    async updateMember(id, updates) {
        updates.updated_at = new Date().toISOString();
        const prepared = this._formatMemberForSave(updates);

        let dbMember = null;
        try {
            let { data, error } = await this.from('club_members').update(prepared).eq('id', id).select().single();
            if (error && error.message && error.message.includes('nickname')) {
                const copy = { ...prepared };
                delete copy.nickname;
                const res = await this.from('club_members').update(copy).eq('id', id).select().single();
                data = res.data;
            }
            if (data) dbMember = data;
        } catch(e) {}

        const localList = this._getLocalMembers();
        let updatedItem = dbMember || { ...prepared, id: id };
        const existingIdx = localList.findIndex(m => String(m.id) === String(id));
        if (existingIdx >= 0) {
            updatedItem = { ...localList[existingIdx], ...prepared };
            localList[existingIdx] = updatedItem;
        } else {
            localList.push(updatedItem);
        }
        this._saveLocalMembers(localList);
        this.invalidateCache('members');

        return this._parseMember(updatedItem);
    },

    // ─── 모임: G-핸디 ───

    _getLocalGHandicapConfigs() {
        try {
            const raw = localStorage.getItem('club_ghandicap_configs_v1');
            return raw ? JSON.parse(raw) : {};
        } catch(e) { return {}; }
    },

    _saveLocalGHandicapConfigs(configs) {
        try {
            localStorage.setItem('club_ghandicap_configs_v1', JSON.stringify(configs));
        } catch(e) {}
    },

    async getGHandicapConfigs(options = {}) {
        if (!options.forceRefresh && this._isCacheValid('ghandicapConfigs')) {
            return { ...this._memCache.ghandicapConfigs };
        }
        if (!this._inflight.ghandicapConfigs) {
            this._inflight.ghandicapConfigs = (async () => {
                let configs = this._getLocalGHandicapConfigs();
                try {
                    const remoteConfig = await this.getSetting('ghandicap_configs');
                    if (remoteConfig) {
                        const parsed = typeof remoteConfig === 'string' ? JSON.parse(remoteConfig) : remoteConfig;
                        if (parsed && typeof parsed === 'object') {
                            configs = { ...parsed, ...configs };
                            this._saveLocalGHandicapConfigs(configs);
                        }
                    }
                } catch(e) {}
                this._setCache('ghandicapConfigs', configs);
                return configs;
            })().finally(() => {
                delete this._inflight.ghandicapConfigs;
            });
        }
        const res = await this._inflight.ghandicapConfigs;
        return { ...res };
    },

    async saveGHandicapConfig(memberId, configData) {
        const configs = await this.getGHandicapConfigs();
        configs[memberId] = {
            ...configs[memberId],
            ...configData,
            updated_at: new Date().toISOString()
        };
        this._saveLocalGHandicapConfigs(configs);
        this._setCache('ghandicapConfigs', configs);
        try {
            await this.setSetting('ghandicap_configs', configs);
        } catch(e) {}
        return configs[memberId];
    },

    // ─── 모임: 게임 ───

    _getLocalGames() {
        try {
            const raw = localStorage.getItem('club_local_games_v1');
            return raw ? JSON.parse(raw) : [];
        } catch(e) { return []; }
    },

    _saveLocalGames(list) {
        try {
            localStorage.setItem('club_local_games_v1', JSON.stringify(list));
        } catch(e) {}
    },

    _applyGameFilters(list, filters = {}) {
        let filtered = [...(list || [])];
        if (filters.startDate) filtered = filtered.filter(g => g.game_date >= filters.startDate);
        if (filters.endDate) filtered = filtered.filter(g => g.game_date <= filters.endDate);
        if (filters.limit) filtered = filtered.slice(0, filters.limit);
        return filtered;
    },

    async getGames(filters = {}, options = {}) {
        // 1. 인메모리 캐시가 유효하면 네트워크 호출 없이 0ms 즉시 반환
        if (!options.forceRefresh && this._isCacheValid('games')) {
            return this._applyGameFilters(this._memCache.games, filters);
        }

        // 2. 동시 호출 시 단일 네트워크 요청으로 병합 (Deduplication) + 멤버 조회 병렬 처리
        if (!this._inflight.games) {
            this._inflight.games = (async () => {
                const [dbList, members] = await Promise.all([
                    (async () => {
                        try {
                            const { data, error } = await this.from('club_games')
                                .select('*, club_game_participants(*, club_members(name))')
                                .order('game_date', { ascending: false });
                            if (!error && data && data.length > 0) return data;

                            const { data: data2 } = await this.from('club_games')
                                .select('*, club_game_participants(*)')
                                .order('game_date', { ascending: false });
                            if (data2 && data2.length > 0) return data2;
                        } catch(e) {
                            console.error('getGames error:', e);
                        }
                        return [];
                    })(),
                    this.getMembers(null, options).catch(() => [])
                ]);

                const localList = this._getLocalGames();
                const combinedMap = {};
                // 1. DB 클라우드 데이터 우선 추가 (클라우드가 진실의 원천)
                dbList.forEach(g => { if (g && g.id) combinedMap[String(g.id)] = g; });

                // 2. DB에 존재하지 않는 로컬 전용 신규 임시 항목만 보완
                localList.forEach(g => {
                    if (g && g.id && !combinedMap[String(g.id)]) {
                        const isLocalTemp = (typeof g.id === 'string' && isNaN(Number(g.id))) || Number(g.id) > 1000000000000;
                        if (isLocalTemp || dbList.length === 0) {
                            combinedMap[String(g.id)] = g;
                        }
                    }
                });

                const fullList = Object.values(combinedMap).sort((a, b) => new Date(b.game_date) - new Date(a.game_date));

                // 멤버 정보 매핑 보완 (이미 병렬로 가져온 members 활용 — 직렬 대기 없음)
                const memMap = {};
                (members || []).forEach(m => { if (m && m.id) memMap[m.id] = m; });

                fullList.forEach(g => {
                    if (g.club_game_participants && Array.isArray(g.club_game_participants)) {
                        g.club_game_participants.forEach(p => {
                            if (!p.club_members || !p.club_members.name) {
                                const m = memMap[p.member_id];
                                if (m) p.club_members = { name: m.name };
                            }
                        });
                        // 순위 정렬: 순위 오름차순, 순위 미정(시작 전)/동률일 경우 제작자(김상국) 최우선
                        g.club_game_participants.sort((a, b) => {
                            const ra = a.ranking || 999;
                            const rb = b.ranking || 999;
                            if (ra !== rb) return ra - rb;
                            const nameA = a.club_members?.name || memMap[a.member_id]?.name || a.member_name || '';
                            const nameB = b.club_members?.name || memMap[b.member_id]?.name || b.member_name || '';
                            const isKimA = nameA.includes('김상국') || a.member_id === 6;
                            const isKimB = nameB.includes('김상국') || b.member_id === 6;
                            if (isKimA && !isKimB) return -1;
                            if (!isKimA && isKimB) return 1;
                            return (a.id || 0) - (b.id || 0);
                        });
                    }
                });

                // 전체 게임 목록을 로컬 캐시 및 메모리 캐시에 보존 (limit으로 잘리기 전 원본 저장!)
                if (dbList.length > 0) {
                    this._saveLocalGames(fullList);
                }
                this._setCache('games', fullList);

                // 로컬 임시 데이터가 DB에 없는 경우 백그라운드 자동 동기화 시도
                const hasUnsyncedTemp = localList.some(g => (typeof g.id === 'string' && isNaN(Number(g.id))) || Number(g.id) > 1000000000000);
                if (hasUnsyncedTemp) {
                    setTimeout(() => this.syncAllLocalDataToSupabase(), 300);
                }

                return fullList;
            })().finally(() => {
                delete this._inflight.games;
            });
        }

        const fullList = await this._inflight.games;
        return this._applyGameFilters(fullList, filters);
    },

    /** PC/모바일 로컬스토리지에만 저장되어 있는 게임기록/멤버/산출시트를 Supabase 클라우드 DB로 완전 동기화 */
    async syncAllLocalDataToSupabase() {
        const client = (typeof supabaseClient !== 'undefined' && supabaseClient && typeof supabaseClient.from === 'function') 
            ? supabaseClient 
            : ((typeof supabase !== 'undefined' && supabase && supabase.createClient) ? supabase.createClient(SUPABASE_URL, SUPABASE_KEY) : null);
        
        if (!client || typeof client.from !== 'function') {
            return { success: false, reason: 'Supabase client unavailable' };
        }

        let syncedGamesCount = 0;
        let syncedMembersCount = 0;
        let syncedCalcCount = 0;

        try {
            // 1. 멤버 동기화 (DB 멤버 매핑 확보)
            const { data: dbMembers } = await this.from('club_members').select('*');
            const localMembers = this._getLocalMembers();
            const memberNameMap = {};
            (dbMembers || []).forEach(m => { if (m && m.name) memberNameMap[m.name] = m.id; });

            for (const lm of localMembers) {
                if (lm && lm.name && !memberNameMap[lm.name]) {
                    const prepared = this._formatMemberForSave(lm);
                    delete prepared.id;
                    delete prepared.nickname;
                    const { data: insertedM } = await this.from('club_members').insert(prepared).select().single();
                    if (insertedM) {
                        memberNameMap[insertedM.name] = insertedM.id;
                        syncedMembersCount++;
                    }
                }
            }

            // 2. 게임 기록 동기화
            const { data: dbGames } = await this.from('club_games').select('*, club_game_participants(*)');
            const localGames = this._getLocalGames();
            const dbGameKeys = new Set((dbGames || []).map(g => `${g.game_date}_${g.location}_${g.total_cost}`));

            for (const lg of localGames) {
                if (!lg || !lg.game_date) continue;
                const gKey = `${String(lg.game_date).slice(0, 10)}_${lg.location || '스크린골프장'}_${lg.total_cost || 0}`;
                if (!dbGameKeys.has(gKey)) {
                    // DB에 없는 게임 ➔ DB 추가
                    const gamePayload = {
                        game_date: String(lg.game_date).slice(0, 10),
                        location: lg.location || '스크린골프장',
                        total_cost: lg.total_cost || 0,
                        memo: lg.memo || ''
                    };
                    const { data: insertedG, error: gErr } = await this.from('club_games').insert(gamePayload).select().single();
                    if (!gErr && insertedG) {
                        dbGameKeys.add(gKey);
                        syncedGamesCount++;
                        const parts = lg.club_game_participants || [];
                        const validParts = [];
                        for (const p of parts) {
                            const pName = p.club_members?.name || p.member_name;
                            let targetMid = memberNameMap[pName] || (typeof p.member_id === 'number' && p.member_id < 1000000000 ? p.member_id : null);

                            if (!targetMid && pName) {
                                try {
                                    const newMemPayload = this._formatMemberForSave({
                                        name: pName,
                                        company: '현지',
                                        member_type: 'regular',
                                        join_date: String(lg.game_date).slice(0, 10)
                                    });
                                    delete newMemPayload.id;
                                    delete newMemPayload.nickname;
                                    const { data: newM } = await this.from('club_members').insert(newMemPayload).select().single();
                                    if (newM) {
                                        targetMid = newM.id;
                                        memberNameMap[pName] = newM.id;
                                    }
                                } catch(e) {}
                            }

                            if (targetMid) {
                                validParts.push({
                                    game_id: insertedG.id,
                                    member_id: targetMid,
                                    ranking: p.ranking ? Number(p.ranking) : null
                                });
                            }
                        }
                        if (validParts.length > 0) {
                            await this.from('club_game_participants').insert(validParts);
                        }
                    }
                }
            }

            // 3. 산출 시트 이력 클라우드 동기화 (app_settings & club_calc_history)
            const localCalcs = this._getLocalCalcHistory();
            if (localCalcs.length > 0) {
                const cloudCalcs = await this.getCalcHistoryList();
                const calcMap = {};
                cloudCalcs.forEach(item => {
                    if (item && item.calc_date) calcMap[String(item.calc_date).slice(0, 10)] = item;
                });
                localCalcs.forEach(item => {
                    if (item && item.calc_date) {
                        const dKey = String(item.calc_date).slice(0, 10);
                        if (!calcMap[dKey]) {
                            calcMap[dKey] = item;
                            syncedCalcCount++;
                        }
                    }
                });
                const mergedCalcs = Object.values(calcMap).sort((a, b) => new Date(b.calc_date) - new Date(a.calc_date));
                await this.setSetting('club_calc_history', JSON.stringify(mergedCalcs));
                this._saveLocalCalcHistory(mergedCalcs);
            }

        } catch(e) {
            console.error('syncAllLocalDataToSupabase error:', e);
        }

        return { success: true, syncedGamesCount, syncedMembersCount, syncedCalcCount };
    },

    async addGame(game, participants) {
        if (game && game.game_date) {
            game.game_date = String(game.game_date).slice(0, 10);
        }
        let dbGame = null;
        try {
            const { data: g, error: ge } = await this.from('club_games').insert(game).select().single();
            if (!ge && g) {
                dbGame = g;
                if (participants && participants.length > 0) {
                    const members = await this.getMembers();
                    const memMap = {};
                    (members || []).forEach(m => memMap[m.id] = m);

                    const dbMembersMap = {};
                    const { data: dbMList } = await this.from('club_members').select('*');
                    (dbMList || []).forEach(m => { if (m && m.name) dbMembersMap[m.name] = m.id; });

                    const validParts = [];
                    for (const p of participants) {
                        const mObj = memMap[p.member_id];
                        const mName = mObj ? mObj.name : null;
                        let targetMid = (dbMembersMap[mName]) || (typeof p.member_id === 'number' && p.member_id < 1000000000 ? p.member_id : null);

                        if (!targetMid && mName) {
                            try {
                                const newMemPayload = this._formatMemberForSave({
                                    name: mName,
                                    company: mObj?.company || '현지',
                                    member_type: mObj?.member_type || 'regular',
                                    join_date: String(game.game_date).slice(0, 10)
                                });
                                delete newMemPayload.id;
                                delete newMemPayload.nickname;
                                const { data: newM } = await this.from('club_members').insert(newMemPayload).select().single();
                                if (newM) {
                                    targetMid = newM.id;
                                    dbMembersMap[mName] = newM.id;
                                }
                            } catch(e) {}
                        }

                        if (targetMid) {
                            validParts.push({
                                game_id: g.id,
                                member_id: targetMid,
                                ranking: p.ranking ? Number(p.ranking) : null
                            });
                        }
                    }

                    if (validParts.length > 0) {
                        await this.from('club_game_participants').insert(validParts);
                    }
                }
            }
        } catch(e) {
            console.error('addGame error:', e);
        }

        const members = await this.getMembers();
        const memMap = {};
        members.forEach(m => memMap[m.id] = m);

        const preparedParts = (participants || []).map(p => ({
            ...p,
            club_members: { name: memMap[p.member_id] ? memMap[p.member_id].name : '?' }
        }));

        const savedGame = dbGame ? { ...dbGame, club_game_participants: preparedParts } : { ...game, id: Date.now(), club_game_participants: preparedParts };

        const localList = this._getLocalGames();
        localList.unshift(savedGame);
        this._saveLocalGames(localList);
        this.invalidateCache('games');
        this.invalidateCache('members');

        return savedGame;
    },

    async updateGame(id, game, participants) {
        if (game && game.game_date) {
            game.game_date = String(game.game_date).slice(0, 10);
        }
        try {
            await this.from('club_games').update(game).eq('id', id);
            await this.from('club_game_participants').delete().eq('game_id', id);
            if (participants && participants.length > 0) {
                const members = await this.getMembers();
                const memMap = {};
                (members || []).forEach(m => memMap[m.id] = m);

                const dbMembersMap = {};
                const { data: dbMList } = await this.from('club_members').select('*');
                (dbMList || []).forEach(m => { if (m && m.name) dbMembersMap[m.name] = m.id; });

                const validParts = [];
                for (const p of participants) {
                    const mObj = memMap[p.member_id];
                    const mName = mObj ? mObj.name : null;
                    let targetMid = (dbMembersMap[mName]) || (typeof p.member_id === 'number' && p.member_id < 1000000000 ? p.member_id : null);

                    if (!targetMid && mName) {
                        try {
                            const newMemPayload = this._formatMemberForSave({
                                name: mName,
                                company: mObj?.company || '현지',
                                member_type: mObj?.member_type || 'regular',
                                join_date: String(game.game_date).slice(0, 10)
                            });
                            delete newMemPayload.id;
                            delete newMemPayload.nickname;
                            const { data: newM } = await this.from('club_members').insert(newMemPayload).select().single();
                            if (newM) {
                                targetMid = newM.id;
                                dbMembersMap[mName] = newM.id;
                            }
                        } catch(e) {}
                    }

                    if (targetMid) {
                        validParts.push({
                            game_id: id,
                            member_id: targetMid,
                            ranking: p.ranking ? Number(p.ranking) : null
                        });
                    }
                }

                if (validParts.length > 0) {
                    await this.from('club_game_participants').insert(validParts);
                }
            }
        } catch(e) {
            console.error('updateGame error:', e);
        }

        const members = await this.getMembers();
        const memMap = {};
        members.forEach(m => memMap[m.id] = m);

        const preparedParts = (participants || []).map(p => ({
            ...p,
            club_members: { name: memMap[p.member_id] ? memMap[p.member_id].name : '?' }
        }));

        const localList = this._getLocalGames();
        let updatedGame = { ...game, id: id, club_game_participants: preparedParts };
        const idx = localList.findIndex(g => String(g.id) === String(id));
        if (idx >= 0) {
            localList[idx] = updatedGame;
        } else {
            localList.unshift(updatedGame);
        }
        this._saveLocalGames(localList);
        this.invalidateCache('games');

        return updatedGame;
    },

    async deleteGame(id) {
        try {
            await this.from('club_games').delete().eq('id', id);
        } catch(e) {}
        let localList = this._getLocalGames();
        localList = localList.filter(g => String(g.id) !== String(id));
        this._saveLocalGames(localList);
        this.invalidateCache('games');
        return true;
    },

    // ─── 모임: 순위 추이 ───

    async getGamesCount() {
        try {
            if (this._isCacheValid('games') && Array.isArray(this._memCache.games)) {
                return this._memCache.games.length;
            }
            const games = await this.getGames();
            if (games && games.length > 0) return games.length;
            return this._getLocalGames().length;
        } catch(e) { return 0; }
    },

    async getRankingTrend(limit = 10) {
        try {
            const games = await this.getGames();
            const ascGames = [...games].sort((a, b) => new Date(a.game_date) - new Date(b.game_date));
            return ascGames.slice(-limit);
        } catch(e) {
            console.error('getRankingTrend exception:', e);
            return [];
        }
    },

    async getMemberStats() {
        try {
            const [games, members] = await Promise.all([
                this.getGames(),
                this.getMembers()
            ]);

            const memMap = {};
            (members || []).forEach(m => {
                memMap[m.id] = m;
            });

            const map = {};
            (games || []).forEach(g => {
                const parts = g.club_game_participants || [];
                parts.forEach(p => {
                    const mid = p.member_id;
                    const memberObj = memMap[mid] || p.club_members || {};
                    const name = memberObj.name || p.member_name || '?';
                    const status = memberObj.status || 'active';

                    if (!map[mid]) {
                        map[mid] = {
                            member_id: mid,
                            name,
                            status,
                            games: 0,
                            rankedGames: 0,
                            totalRank: 0,
                            best: Infinity,
                            worst: 0
                        };
                    }

                    map[mid].games++;

                    const r = Number(p.ranking);
                    if (r && r > 0) {
                        map[mid].rankedGames++;
                        map[mid].totalRank += r;
                        map[mid].best = Math.min(map[mid].best, r);
                        map[mid].worst = Math.max(map[mid].worst, r);
                    }
                });
            });

            return Object.values(map).map(s => {
                const hasRanked = s.rankedGames > 0;
                const avgNum = hasRanked ? (s.totalRank / s.rankedGames) : 99;
                return {
                    member_id: Number(s.member_id),
                    name: s.name,
                    status: s.status,
                    games: s.games,
                    rankedGames: s.rankedGames,
                    avgRank: hasRanked ? (s.totalRank / s.rankedGames).toFixed(1) : '-',
                    best: s.best === Infinity ? '-' : s.best,
                    worst: s.worst === 0 ? '-' : s.worst,
                    _sortVal: avgNum
                };
            }).sort((a, b) => a._sortVal - b._sortVal);
        } catch(e) {
            console.error('getMemberStats exception:', e);
            return [];
        }
    },

    // ─── 환전 ───

    async getExchanges(filters = {}) {
        let q = this.from('exchange_transactions').select('*').order('tx_date', { ascending: false });
        if (filters.startDate) q = q.gte('tx_date', filters.startDate);
        if (filters.endDate) q = q.lte('tx_date', filters.endDate);
        if (filters.person_name) q = q.eq('person_name', filters.person_name);
        if (filters.limit) q = q.limit(filters.limit);
        const { data, error } = await q;
        if (error) { console.error('getExchanges:', error); return []; }
        return data || [];
    },

    async addExchange(ex) {
        const { data, error } = await this.from('exchange_transactions').insert(ex).select().single();
        if (error) { console.error('addExchange:', error); return null; }
        return data;
    },

    async deleteExchange(id) {
        const { error } = await this.from('exchange_transactions').delete().eq('id', id);
        if (error) { console.error('deleteExchange:', error); return false; }
        return true;
    },

    async getExchangeTotal() {
        const { data, error } = await this.from('exchange_transactions').select('tx_type, amount_vnd, amount_krw');
        if (error) return { vnd: 0, krw: 0 };
        let vnd = 0, krw = 0;
        (data || []).forEach(e => {
            if (e.tx_type === 'VND_TO_KRW') { vnd -= Number(e.amount_vnd); krw += Number(e.amount_krw); }
            else { vnd += Number(e.amount_vnd); krw -= Number(e.amount_krw); }
        });
        return { vnd, krw };
    },

    // ─── 설정 ───

    async getSetting(key) {
        try {
            const { data, error } = await this.from('app_settings').select('value').eq('key', key).single();
            if (error || !data) return null;
            return data.value;
        } catch(e) {
            console.warn('getSetting error:', e);
            return null;
        }
    },

    async setSetting(key, value) {
        try {
            const payload = {
                key: key,
                value: typeof value === 'string' ? value : JSON.stringify(value),
                updated_at: new Date().toISOString()
            };
            const { error } = await this.from('app_settings').upsert(payload, { onConflict: 'key' });
            if (error) {
                console.error('setSetting error:', error);
                return false;
            }
            return true;
        } catch(e) {
            console.error('setSetting exception:', e);
            return false;
        }
    },

    async getAllSettings() {
        const { data, error } = await this.from('app_settings').select('*');
        if (error) return {};
        const map = {};
        (data || []).forEach(s => { map[s.key] = s.value; });
        return map;
    },

    // ─── 모임: 회비 산출 시트 이력 관리 ───

    _getLocalCalcHistory() {
        try {
            const raw = localStorage.getItem('club_calc_history_v1');
            return raw ? JSON.parse(raw) : [];
        } catch(e) {
            return [];
        }
    },

    _saveLocalCalcHistory(list) {
        try {
            localStorage.setItem('club_calc_history_v1', JSON.stringify(list));
        } catch(e) {}
    },

    async saveCalcHistory(calcItem) {
        calcItem.created_at = new Date().toISOString();
        if (calcItem.calc_date) {
            calcItem.calc_date = String(calcItem.calc_date).slice(0, 10);
        }
        calcItem.id = calcItem.id || 'calc_' + Date.now();

        // 1. 최신 리스트 구성
        const currentList = await this.getCalcHistoryList();
        let updatedList = currentList.filter(item => item && item.calc_date && String(item.calc_date).slice(0, 10) !== calcItem.calc_date);
        updatedList.unshift(calcItem);
        
        // 2. 로컬 스토리지 및 메모리 캐시 저장
        this._saveLocalCalcHistory(updatedList);
        this._setCache('calcHistory', updatedList);

        // 3. Supabase app_settings에 영구 클라우드 동기화 (기기 간 100% 실시간 공유)
        try {
            await this.setSetting('club_calc_history', JSON.stringify(updatedList));
        } catch(e) {
            console.error('saveCalcHistory to app_settings error:', e);
        }

        return calcItem;
    },

    async getCalcHistoryList(options = {}) {
        // 1. 인메모리 캐시가 유효하면 0ms 즉시 반환
        if (!options.forceRefresh && this._isCacheValid('calcHistory')) {
            return [...(this._memCache.calcHistory || [])];
        }

        // 2. 동시 호출 시 단일 네트워크 요청으로 병합 (Deduplication)
        if (!this._inflight.calcHistory) {
            this._inflight.calcHistory = (async () => {
                let cloudList = [];

                // Supabase app_settings에서 산출 이력 단일 조회 (존재하지 않는 club_calc_history 404 쿼리 제거)
                try {
                    const settingVal = await this.getSetting('club_calc_history');
                    if (settingVal) {
                        const parsed = typeof settingVal === 'string' ? JSON.parse(settingVal) : settingVal;
                        if (Array.isArray(parsed) && parsed.length > 0) {
                            cloudList = parsed;
                        }
                    }
                } catch(e) {
                    console.warn('getCalcHistoryList app_settings check:', e);
                }

                // 로컬 캐시와 병합 (클라우드 데이터 우선)
                const localList = this._getLocalCalcHistory();
                const finalMap = {};

                cloudList.forEach(item => {
                    if (item && item.calc_date) finalMap[String(item.calc_date).slice(0, 10)] = item;
                });

                localList.forEach(item => {
                    if (item && item.calc_date) {
                        const dateKey = String(item.calc_date).slice(0, 10);
                        if (!finalMap[dateKey]) {
                            finalMap[dateKey] = item;
                        }
                    }
                });

                const sortedList = Object.values(finalMap).sort((a, b) => new Date(b.calc_date) - new Date(a.calc_date));
                
                // 최신 리스트로 로컬 및 메모리 캐시 갱신
                this._saveLocalCalcHistory(sortedList);
                this._setCache('calcHistory', sortedList);

                // 만약 클라우드에 아직 안 올라간 로컬 데이터가 있었다면 백그라운드에서 app_settings 동기화
                if (localList.length > cloudList.length) {
                    this.setSetting('club_calc_history', JSON.stringify(sortedList)).catch(() => {});
                }

                return sortedList;
            })().finally(() => {
                delete this._inflight.calcHistory;
            });
        }

        const list = await this._inflight.calcHistory;
        return [...list];
    },

    async getCalcHistoryByDate(dateStr) {
        if (!dateStr) return null;
        const cleanDate = String(dateStr).slice(0, 10);
        const list = await this.getCalcHistoryList();
        return list.find(item => item && item.calc_date && String(item.calc_date).slice(0, 10) === cleanDate) || null;
    },

    async deleteCalcHistory(id) {
        // 1. 로컬에서 삭제
        let localList = this._getLocalCalcHistory();
        localList = localList.filter(item => item.id !== id);
        this._saveLocalCalcHistory(localList);
        this.invalidateCache('calcHistory');

        // 2. app_settings 클라우드에서도 삭제 반영
        try {
            const currentCloud = await this.getCalcHistoryList({ forceRefresh: true });
            const filteredCloud = currentCloud.filter(item => item.id !== id);
            this._saveLocalCalcHistory(filteredCloud);
            this._setCache('calcHistory', filteredCloud);
            await this.setSetting('club_calc_history', JSON.stringify(filteredCloud));
        } catch(e) {}

        return true;
    }
};
