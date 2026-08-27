var APP_VERSION = 'v1.3.3';
var APP_BUILD_TIME = '2026-08-27 07:50 (ICT)'; // GitHub push 시 이 값 업데이트
var SUPABASE_URL = 'https://qkkcugjuopjeuiyczjzf.supabase.co';
var SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InFra2N1Z2p1b3BqZXVpeWN6anpmIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODQ2NjE2NjQsImV4cCI6MjEwMDIzNzY2NH0.qPYwvuSBp_SEvi1vG4qoCIpbsBU1eTIYz43q-Df00DY';

// supabase CDN이 전역 var supabase = {...createClient...}로 노출됨
// 절대 var supabase = null 로 덮어쓰면 안됨!
var supabaseClient = null;
(function initSupabaseClient() {
    try {
        // CDN의 supabase 네임스페이스에서 createClient 획득
        if (typeof supabase !== 'undefined' && supabase && supabase.createClient) {
            supabaseClient = supabase.createClient(SUPABASE_URL, SUPABASE_KEY);
            console.log('✅ Supabase Client initialized');
        } else {
            console.warn('⚠️ supabase CDN not loaded yet');
        }
    } catch(e) {
        console.warn('Supabase init warning:', e);
    }
})();

