/* 나만의 모바일 티켓북 — 사용자 행동과 화면 상태 변경
   한 파일에서 body[data-page] 값으로 화면별 동작을 나눈다.
   home · search · write(작성/저장 완료) · login · ticketbook · calendar · detail */
(() => {
    'use strict';

    /* ===== 상수 ===== */
    const STORE = { tickets: 'ticketbook.tickets', user: 'ticketbook.user', users: 'ticketbook.users' };
    const SESSION = { next: 'ticketbook.next', draft: 'ticketbook.draft', search: 'ticketbook.search', my: 'ticketbook.my' };
    const PRESET_TAGS = ['#설렘', '#혼자', '#눈물', '#친구와', '#재관람'];
    const VIEW_TYPES = [
        { id: 'theater', label: '극장', icon: 'fa-film' },
        { id: 'ott', label: 'OTT', icon: 'fa-tv' }
    ];
    const COMMUNITY_REVIEWS = [
        { movieId: 157336, rating: 4.9, quote: '극장에서 본 장면들이 아직도 머릿속에서 재생돼요.' },
        { movieId: 129, rating: 4.9, quote: '어른이 되어 다시 보니 전혀 다른 감정으로 다가왔어요.' },
        { movieId: 496243, rating: 4.8, quote: '작은 장면마다 의미가 숨어 있어 다시 보고 싶어져요.' },
        { movieId: 27205, rating: 4.7, quote: '영화가 끝난 뒤에도 결말을 한참 생각하게 돼요.' },
        { movieId: 313369, rating: 4.7, quote: '음악이 끝난 뒤에도 여운이 오래 남는 영화예요.' },
        { movieId: 299534, rating: 4.6, quote: '함께 달려온 이야기가 한순간에 밀려와 뭉클했어요.' }
    ];
    const LOGIN_REASON = {
        save: '티켓을 저장하려면 로그인이 필요해요',
        myTickets: '내 티켓북을 보려면 로그인이 필요해요',
        expired: '로그인이 만료되었어요. 다시 로그인해 주세요'
    };

    const body = document.body;
    const page = body.dataset.page;
    const ROOT = body.dataset.root || '';
    // 페이지 주소 (index.html 은 루트, 나머지는 pages/ 폴더)
    const url = (name) => (name === 'home' ? `${ROOT}index.html` : `${ROOT ? '' : 'pages/'}${name}.html`);

    // data/*.json 을 읽지 못하는 환경(파일을 더블클릭해 file:// 로 연 경우)에서 쓰는 기본값. data 폴더의 JSON과 같은 내용.
    const FALLBACK_MOVIES = {
        genres: [[28, '액션'], [18, '드라마'], [35, '코미디'], [878, 'SF'], [10749, '로맨스'], [53, '스릴러'], [16, '애니메이션'], [27, '공포']]
            .map(([id, name]) => ({ id, name })),
        movies: [
            [496243, '기생충', '2019-05-30', [35, 53, 18], 98, ['theater', 'ott']], [157336, '인터스텔라', '2014-11-06', [18, 878], 96, ['theater', 'ott']],
            [27205, '인셉션', '2010-07-21', [28, 878], 94, ['theater', 'ott']], [299534, '어벤져스: 엔드게임', '2019-04-24', [28, 878], 93, ['theater', 'ott']],
            [313369, '라라랜드', '2016-12-07', [10749, 18], 88, ['ott']], [670, '올드보이', '2003-11-21', [18, 53], 85, ['ott']],
            [129, '센과 치히로의 행방불명', '2001-07-20', [16], 90, ['ott']], [597, '타이타닉', '1997-12-19', [18, 10749], 87, ['theater', 'ott']],
            [396535, '부산행', '2016-07-20', [28, 27, 53], 84, ['theater', 'ott']], [1042000, '서울의 봄', '2023-11-22', [18, 53], 82, ['ott']],
            [1100000, '파묘', '2024-02-22', [27, 53], 80, ['theater']], [438631, '듄', '2021-10-20', [878, 18], 86, ['theater', 'ott']]
        ].map(([movieId, title, releaseDate, genreIds, popularity, availableOn]) => ({
            movieId, title, releaseDate, genreIds, popularity, availableOn, posterPath: `asset/posters/${movieId}.jpg`
        }))
    };
    const FALLBACK_SAMPLES = {
        samples: [
            { movieId: 157336, dayOfMonth: 3, viewType: 'theater', place: '용산 아이맥스', oneLineReview: '시간이 이렇게 아플 수 있다니.', diary: '엔딩 크레딧이 올라가도 한참 일어나지 못했다. 사운드가 몸을 울리는 경험이었다.', tags: ['#눈물', '#혼자'] },
            { movieId: 496243, dayOfMonth: 10, viewType: 'ott', place: '넷플릭스', oneLineReview: '다시 봐도 계단 장면에서 소름.', diary: '주말 밤에 두 번째 감상. 처음엔 못 봤던 디테일이 보였다.', tags: ['#재관람'] },
            { movieId: 313369, dayOfMonth: 12, viewType: 'theater', place: 'CGV 강남', oneLineReview: '마지막 장면의 여운이 길다.', diary: '친구와 함께 봤다. 음악이 계속 머릿속에 맴돈다.', tags: ['#설렘', '#친구와'] },
            { movieId: 438631, dayOfMonth: 18, viewType: 'theater', place: '롯데시네마 월드타워', oneLineReview: '스크린이 클수록 좋은 영화.', diary: '', tags: ['#혼자'] }
        ]
    };

    /* ===== 유틸 ===== */
    const $ = (sel, root = document) => root.querySelector(sel);
    const $$ = (sel, root = document) => [...root.querySelectorAll(sel)];
    const esc = (s) => String(s ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
    const pad = (n) => String(n).padStart(2, '0');
    const ymd = (d) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
    const ym = (d) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}`;
    const dotDate = (s) => (s || '').replaceAll('-', '.');
    const uid = () => (crypto.randomUUID ? crypto.randomUUID() : `id-${Date.now()}-${Math.random().toString(16).slice(2)}`);
    const viewLabel = (t) => (VIEW_TYPES.find((v) => v.id === t) || {}).label || '';
    const isValidPassword = (s) => /^(?=.*[A-Za-z])(?=.*\d)[A-Za-z\d]{8,}$/.test(s);
    const today = new Date();
    const params = new URLSearchParams(location.search);

    const store = (area) => ({
        get(key, fallback) { try { const v = area.getItem(key); return v ? JSON.parse(v) : fallback; } catch { return fallback; } },
        set(key, value) { try { area.setItem(key, JSON.stringify(value)); } catch { /* 저장소를 못 쓰면 이번 화면에서만 유지 */ } },
        del(key) { try { area.removeItem(key); } catch { /* noop */ } }
    });
    const local = store(window.localStorage);
    const session = store(window.sessionStorage);

    let toastTimer;
    function toast(msg) {
        let el = $('#toast');
        if (!el) { el = document.createElement('div'); el.id = 'toast'; el.className = 'toast'; el.setAttribute('role', 'status'); $('.app').appendChild(el); }
        el.textContent = msg;
        el.hidden = false;
        clearTimeout(toastTimer);
        toastTimer = setTimeout(() => { el.hidden = true; }, 2200);
    }

    function confirmDialog(message, yesLabel) {
        return new Promise((resolve) => {
            const el = document.createElement('div');
            el.className = 'dialog';
            el.innerHTML = `<div class="dialog__box" role="alertdialog" aria-modal="true"><p>${esc(message)}</p>
                <div class="dialog__btns"><button type="button" class="btn" data-no>취소</button><button type="button" class="btn btn--dark" data-yes>${esc(yesLabel)}</button></div></div>`;
            $('.app').appendChild(el);
            const done = (v) => { el.remove(); resolve(v); };
            $('[data-yes]', el).addEventListener('click', () => done(true));
            $('[data-no]', el).addEventListener('click', () => done(false));
            $('[data-yes]', el).focus();
        });
    }

    /* 포스터 자리표시 — asset/posters/{movieId}.jpg 가 있으면 위에 덮어 보여 준다 */
    function posterHtml(title, path, cls = '', badge = '', badgeClass = '') {
        const img = path ? `<img src="${esc(ROOT + path)}" alt="" loading="lazy">` : '';
        return `<div class="poster ${cls}"><span class="poster__t">${esc(title)}</span>${img}${badge ? `<span class="badge ${badgeClass}">${badge}</span>` : ''}</div>`;
    }
    function availabilityBadge(movie) {
        const types = [
            ['theater', 'fa-film', '극장'],
            ['ott', 'fa-tv', 'OTT']
        ].filter(([type]) => movie.availableOn?.includes(type));
        if (!types.length) return '';
        const label = types.map(([, , name]) => name).join(' · ');
        const icons = types.map(([, icon]) => `<i class="fa-solid ${icon}" aria-hidden="true"></i>`).join('');
        return `<span class="availability-icons" role="img" aria-label="${label}" title="${label}">${icons}</span>`;
    }
    document.addEventListener('error', (e) => {
        if (e.target.tagName === 'IMG') e.target.classList.add('is-broken');
    }, true);

    async function loadJson(path, fallback) {
        try {
            const res = await fetch(ROOT + path);
            if (!res.ok) throw new Error(res.status);
            return await res.json();
        } catch {
            return fallback;
        }
    }

    /* ===== 사용자 · 티켓 저장소 ===== */
    const data = { movies: [], genres: [], samples: [], tickets: local.get(STORE.tickets, []), user: local.get(STORE.user, null) };
    const movieById = (id) => data.movies.find((m) => m.movieId === id);
    const genreName = (id) => (data.genres.find((g) => g.id === id) || {}).name || '';
    const myTickets = () => (data.user ? data.tickets.filter((t) => t.userId === data.user.userId) : []);
    const saveTickets = () => local.set(STORE.tickets, data.tickets);

    /* 로그인이 필요한 화면에서: 돌아올 주소를 기억해 두고 로그인 화면으로 보낸다 */
    function needLogin(reason, { replace = false } = {}) {
        if (data.user) return false;
        session.set(SESSION.next, location.href);
        const target = `${url('login')}?reason=${reason}`;
        if (replace) location.replace(target); else location.href = target;
        return true;
    }

    /* ===== 공통: 하단 아바타(로그인/로그아웃) ===== */
    function initAvatar() {
        const login = $('#avatarBtn');
        if (login) {
            login.textContent = data.user ? data.user.nickname.slice(0, 1).toUpperCase() : '';
            login.setAttribute('aria-label', data.user ? '마이 티켓북' : '로그인');
            login.href = data.user ? url('ticketbook') : `${url('login')}?reason=myTickets`;
            if (!data.user) login.addEventListener('click', () => session.set(SESSION.next, new URL(url('ticketbook'), location.href).href));
        }
        const logout = $('#logoutBtn');
        if (logout) {
            logout.textContent = data.user ? data.user.nickname.slice(0, 1).toUpperCase() : '';
            logout.addEventListener('click', async () => {
                if (!(await confirmDialog('로그아웃할까요?', '로그아웃'))) return;
                local.del(STORE.user);
                location.href = url('home');
            });
        }
    }

    function initTopButton() {
        const host = $('.app') || $('body > div');
        const scrollTargets = $$('.body, main.overflow-y-auto');
        if (!host || !scrollTargets.length) return;

        const button = document.createElement('button');
        button.type = 'button';
        button.className = 'topbtn';
        button.setAttribute('aria-label', '맨 위로');
        button.title = '맨 위로';
        button.innerHTML = '<i class="fa-solid fa-arrow-up" aria-hidden="true"></i>';
        button.hidden = true;
        host.appendChild(button);

        let activeTarget = scrollTargets[0];
        scrollTargets.forEach((target) => target.addEventListener('scroll', () => {
            activeTarget = target;
            button.hidden = target.scrollTop < 120;
        }, { passive: true }));
        button.addEventListener('click', () => activeTarget.scrollTo({ top: 0, behavior: 'smooth' }));
    }

    /* ===== 티켓 이미지 (Canvas → PNG) ===== */
    function wrapText(ctx, text, x, y, maxW, lineH, maxLines) {
        let line = '', n = 0;
        for (const ch of text) {
            if (ctx.measureText(line + ch).width > maxW) {
                ctx.fillText(line, x, y + n * lineH);
                line = ch; n++;
                if (n >= maxLines) return;
            } else line += ch;
        }
        if (line) ctx.fillText(line, x, y + n * lineH);
    }

    function downloadTicket(t) {
        const W = 720, H = 1080;
        const c = document.createElement('canvas');
        c.width = W; c.height = H;
        const ctx = c.getContext('2d');
        const font = '"Noto Sans KR","Apple SD Gothic Neo","Malgun Gothic",sans-serif';
        ctx.fillStyle = '#e5e5e5'; ctx.fillRect(0, 0, W, H);
        ctx.fillStyle = '#fff'; ctx.strokeStyle = '#3a3a38'; ctx.lineWidth = 4;
        ctx.fillRect(30, 30, W - 60, H - 60); ctx.strokeRect(30, 30, W - 60, H - 60);

        ctx.fillStyle = '#6f6f6b'; ctx.font = `700 22px ${font}`; ctx.textAlign = 'left';
        ctx.fillText('MOBILE TICKET', 70, 92);

        const px = 70, py = 120, pw = W - 140, ph = 560;
        ctx.fillStyle = '#ececea'; ctx.fillRect(px, py, pw, ph);
        ctx.strokeStyle = '#c4c4bf'; ctx.lineWidth = 2; ctx.strokeRect(px, py, pw, ph);
        ctx.beginPath(); ctx.moveTo(px, py); ctx.lineTo(px + pw, py + ph); ctx.moveTo(px + pw, py); ctx.lineTo(px, py + ph); ctx.stroke();
        ctx.fillStyle = '#ececea'; ctx.fillRect(W / 2 - 150, py + ph / 2 - 24, 300, 48);
        ctx.fillStyle = '#6f6f6b'; ctx.font = `700 24px ${font}`; ctx.textAlign = 'center';
        ctx.fillText('POSTER', W / 2, py + ph / 2 + 8);

        ctx.textAlign = 'left'; ctx.fillStyle = '#161615'; ctx.font = `800 40px ${font}`;
        wrapText(ctx, t.movieTitle, 70, 748, W - 140, 48, 2);
        ctx.fillStyle = '#6f6f6b'; ctx.font = `400 24px ${font}`;
        ctx.fillText(`${dotDate(t.watchedAt)} · ${viewLabel(t.viewType)}${t.place ? ' · ' + t.place : ''}`, 70, 830);

        ctx.setLineDash([10, 8]); ctx.strokeStyle = '#9b9b96'; ctx.lineWidth = 2;
        ctx.beginPath(); ctx.moveTo(70, 870); ctx.lineTo(W - 70, 870); ctx.stroke(); ctx.setLineDash([]);

        ctx.fillStyle = '#3a3a38'; ctx.font = `400 26px ${font}`;
        if (t.oneLineReview) wrapText(ctx, `“${t.oneLineReview}”`, 70, 920, W - 140, 38, 2);
        ctx.fillStyle = '#6f6f6b'; ctx.font = `700 22px ${font}`;
        ctx.fillText(t.tags.join('  '), 70, 1010);

        c.toBlob((blob) => {
            if (!blob) return toast('이미지를 만들지 못했어요');
            const a = document.createElement('a');
            a.href = URL.createObjectURL(blob);
            a.download = `ticket-${t.watchedAt}-${t.movieId}.png`;
            document.body.appendChild(a); a.click(); a.remove();
            setTimeout(() => URL.revokeObjectURL(a.href), 1000);
            toast('티켓 이미지를 저장했어요');
        }, 'image/png');
    }

    async function shareTicket(t) {
        const text = `${t.movieTitle} · ${dotDate(t.watchedAt)}${t.oneLineReview ? `\n“${t.oneLineReview}”` : ''}`;
        try {
            if (navigator.share) { await navigator.share({ title: '내 티켓북', text }); return; }
            await navigator.clipboard.writeText(text);
            toast('공유할 문구를 복사했어요');
        } catch { /* 공유 취소 */ }
    }

    /* =====================================================
       1 홈
       ===================================================== */
    function initHome() {
        const recent = [...myTickets()].sort((a, b) => b.createdAt.localeCompare(a.createdAt)).slice(0, 3);
        $('#homeRecent').innerHTML = recent.length
            ? recent.map((t) => `<a class="card" href="${url('detail')}?id=${t.ticketId}">${posterHtml(t.movieTitle, t.posterUrl)}<p class="card__t">${esc(t.movieTitle)}</p></a>`).join('')
            : `<p class="empty-note">${data.user ? '아직 저장한 티켓이 없어요.<br>영화를 검색해 첫 티켓을 만들어 보세요.' : '로그인하면 저장한 티켓이 이곳에 보여요.'}</p>`;

        let sortBy = 'rating';
        const renderCommunityReviews = () => {
            const reviews = COMMUNITY_REVIEWS
                .map((review) => ({ ...review, movie: movieById(review.movieId) }))
                .filter((review) => review.movie)
                .sort((a, b) => sortBy === 'rating'
                    ? b.rating - a.rating || b.movie.popularity - a.movie.popularity
                    : b.movie.popularity - a.movie.popularity || b.rating - a.rating);
            $('#communityReviews').innerHTML = reviews.map(({ movie, rating, quote }, index) => `
                <li class="community-review">
                    <div class="community-review__top">
                        <span class="community-review__rank">${String(index + 1).padStart(2, '0')}</span>
                        ${posterHtml(movie.title, movie.posterPath, 'poster--xs community-review__poster')}
                        <div class="community-review__movie">
                            <strong>${esc(movie.title)}</strong>
                            <span>${movie.releaseDate.slice(0, 4)} · ${esc(genreName(movie.genreIds[0]))}</span>
                        </div>
                        <strong class="community-review__score"><i class="fa-solid fa-star" aria-hidden="true"></i>${rating.toFixed(1)}</strong>
                    </div>
                    <p class="community-review__quote">“${esc(quote)}”</p>
                    <div class="community-review__meta"><span>관객 한 줄 평</span><span>인기도 ${movie.popularity}</span></div>
                </li>`).join('');
        };
        renderCommunityReviews();

        $$('.community-sort [data-review-sort]').forEach((button) => button.addEventListener('click', () => {
            sortBy = button.dataset.reviewSort;
            $$('.community-sort [data-review-sort]').forEach((option) => {
                const active = option === button;
                option.classList.toggle('is-on', active);
                option.setAttribute('aria-pressed', String(active));
            });
            renderCommunityReviews();
        }));
    }

    /* =====================================================
       2·3 영화 검색 / 결과 없음
       ===================================================== */
    function initSearch() {
        const s = { query: '', viewType: 'all', genreId: 0, sort: 'popularity', ...session.get(SESSION.search, {}) };
        const persist = () => session.set(SESSION.search, s);

        const filtered = () => {
            const q = s.query.trim().toLowerCase();
            const list = data.movies.filter((m) =>
                (!q || m.title.toLowerCase().includes(q)) &&
                (s.viewType === 'all' || m.availableOn?.includes(s.viewType)) &&
                (!s.genreId || m.genreIds.includes(s.genreId))
            );
            const sorters = {
                popularity: (a, b) => b.popularity - a.popularity,
                latest: (a, b) => b.releaseDate.localeCompare(a.releaseDate),
                title: (a, b) => a.title.localeCompare(b.title, 'ko')
            };
            return list.sort(sorters[s.sort]);
        };

        function renderChips() {
            $('#viewTypeChips').innerHTML = [{ id: 'all', label: '전체' }, ...VIEW_TYPES]
                .map((v) => `<button type="button" class="chip ${s.viewType === v.id ? 'is-on' : ''}" data-viewtype="${v.id}">${v.icon ? `<i class="fa-solid ${v.icon}" aria-hidden="true"></i>` : ''}${v.label}</button>`).join('');
            $('#genreChips').innerHTML = [{ id: 0, name: '전체' }, ...data.genres]
                .map((g) => `<button type="button" class="chip ${s.genreId === g.id ? 'is-on' : ''}" data-genre="${g.id}">${esc(g.name)}</button>`).join('');
        }

        function renderResults() {
            const list = filtered();
            const empty = list.length === 0;
            $('#queryClear').hidden = !s.query;
            $('#searchEmpty').hidden = !empty;
            $('#movieGrid').hidden = empty;
            $('#resultCount').textContent = empty ? '검색 결과 · 0편' : `${s.query || s.genreId || s.viewType !== 'all' ? '검색 결과' : '인기 영화'} ${list.length}편`;
            $('#movieGrid').innerHTML = list.map((m) => `
                <a class="card" href="${url('write')}?movieId=${m.movieId}">
                    ${posterHtml(m.title, m.posterPath, '', availabilityBadge(m), 'badge--availability')}
                    <p class="card__t">${esc(m.title)}</p>
                    <p class="card__m">${m.releaseDate.slice(0, 4)}${m.genreIds[0] ? ' · ' + esc(genreName(m.genreIds[0])) : ''}</p>
                </a>`).join('');
            if (empty) {
                const conds = [];
                if (s.query) conds.push(['검색어', `“${esc(s.query)}”`, 'query']);
                if (s.viewType !== 'all') conds.push(['관람 유형', s.viewType === 'theater' ? '극장' : 'OTT', 'viewType']);
                if (s.genreId) conds.push(['장르', esc(genreName(s.genreId)), 'genre']);
                $('#emptyCond').innerHTML = conds.map(([k, v, key]) => `<li><span>${k} <b>${v}</b></span><button type="button" data-clear="${key}">해제</button></li>`).join('');
            }
        }

        $('#queryInput').value = s.query;
        $('#sortSelect').value = s.sort;
        renderChips();
        renderResults();

        $('#queryInput').addEventListener('input', (e) => { s.query = e.target.value; persist(); renderResults(); });
        $('#queryClear').addEventListener('click', () => { s.query = ''; $('#queryInput').value = ''; persist(); renderResults(); $('#queryInput').focus(); });
        $('#sortSelect').addEventListener('change', (e) => { s.sort = e.target.value; persist(); renderResults(); });
        $('#viewTypeChips').addEventListener('click', (e) => {
            const b = e.target.closest('[data-viewtype]'); if (!b) return;
            s.viewType = b.dataset.viewtype; persist(); renderChips(); renderResults();
        });
        $('#genreChips').addEventListener('click', (e) => {
            const b = e.target.closest('[data-genre]'); if (!b) return;
            s.genreId = Number(b.dataset.genre); persist(); renderChips(); renderResults();
        });
        $('#emptyCond').addEventListener('click', (e) => {
            const b = e.target.closest('[data-clear]'); if (!b) return;
            if (b.dataset.clear === 'query') { s.query = ''; $('#queryInput').value = ''; }
            else if (b.dataset.clear === 'genre') s.genreId = 0;
            else s.viewType = 'all';
            persist(); renderChips(); renderResults();
        });
        $('#resetFilterBtn').addEventListener('click', () => {
            s.query = ''; s.viewType = 'all'; s.genreId = 0; s.sort = 'popularity';
            $('#queryInput').value = ''; $('#sortSelect').value = 'popularity';
            persist(); renderChips(); renderResults();
        });
    }

    /* =====================================================
       4·5 티켓 작성 / 저장 완료
       ===================================================== */
    function initWrite() {
        const savedId = params.get('saved');
        if (savedId) return showSaved(savedId);

        let draft;
        const editId = params.get('ticketId');
        if (editId) {
            if (needLogin('myTickets', { replace: true })) return;
            const t = data.tickets.find((x) => x.ticketId === editId && x.userId === data.user.userId);
            if (!t) { location.replace(url('ticketbook')); return; }
            draft = { ...t, tags: [...t.tags], releaseDate: (movieById(t.movieId) || {}).releaseDate || '' };
            $('#writeBack').href = `${url('detail')}?id=${t.ticketId}`;
        } else {
            const movie = movieById(Number(params.get('movieId')));
            if (!movie) { location.replace(url('search')); return; }
            const saved = session.get(SESSION.draft, null);
            const defaultView = (session.get(SESSION.search, {}).viewType === 'ott') ? 'ott' : 'theater';
            draft = (saved && saved.movieId === movie.movieId && !saved.ticketId) ? saved : {
                ticketId: null, movieId: movie.movieId, movieTitle: movie.title, posterUrl: movie.posterPath, releaseDate: movie.releaseDate,
                watchedAt: ymd(today), viewType: defaultView, place: '', oneLineReview: '', diary: '', tags: []
            };
        }

        $('#formView').hidden = false;
        $('#writeTitle').textContent = draft.ticketId ? '티켓 수정' : '티켓 작성';
        $('#saveBtn').textContent = draft.ticketId ? '수정 저장' : '티켓 저장';
        $('#writePoster').outerHTML = posterHtml(draft.movieTitle, draft.posterUrl, 'poster--md');
        $('#writeMovieTitle').textContent = draft.movieTitle;
        $('#writeMovieMeta').textContent = draft.releaseDate ? `개봉 ${dotDate(draft.releaseDate)}` : '';
        $('#watchedAt').value = draft.watchedAt;
        $('#watchedAt').max = ymd(today);
        $('#place').value = draft.place;
        $('#oneLine').value = draft.oneLineReview;
        $('#diary').value = draft.diary;

        function renderViewType() {
            $('#writeViewType').innerHTML = VIEW_TYPES.map((v) => `<button type="button" class="${draft.viewType === v.id ? 'is-on' : ''}" data-wvt="${v.id}">${v.label}</button>`).join('');
            $('#place').placeholder = draft.viewType === 'ott' ? 'OTT 서비스명 (예: 넷플릭스)' : '극장 이름 (예: CGV 강남)';
        }
        function renderTags() {
            const all = [...new Set([...PRESET_TAGS, ...draft.tags])];
            $('#tagChips').innerHTML = all.map((t) => `<button type="button" class="chip ${draft.tags.includes(t) ? 'is-on' : ''}" data-tag="${esc(t)}">${esc(t)}</button>`).join('');
        }
        function renderPreview() {
            $('#oneLineCount').textContent = `${$('#oneLine').value.length}/50`;
            $('#writePreview').innerHTML = `
                ${posterHtml(draft.movieTitle, draft.posterUrl, 'poster--xs')}
                <div>
                    <p class="preview__t">${esc(draft.movieTitle)}</p>
                    <p class="preview__m">${dotDate(draft.watchedAt)} · ${viewLabel(draft.viewType)}${draft.place ? ' · ' + esc(draft.place) : ''}</p>
                    ${draft.oneLineReview ? `<p class="preview__r">“${esc(draft.oneLineReview)}”</p>` : ''}
                </div>`;
        }
        renderViewType(); renderTags(); renderPreview();

        $('#writeViewType').addEventListener('click', (e) => {
            const b = e.target.closest('[data-wvt]'); if (!b) return;
            draft.viewType = b.dataset.wvt; renderViewType(); renderPreview();
        });
        $('#watchedAt').addEventListener('change', (e) => { draft.watchedAt = e.target.value; renderPreview(); });
        $('#place').addEventListener('input', (e) => { draft.place = e.target.value; renderPreview(); });
        $('#oneLine').addEventListener('input', (e) => { draft.oneLineReview = e.target.value; renderPreview(); });
        $('#diary').addEventListener('input', (e) => { draft.diary = e.target.value; });
        $('#tagChips').addEventListener('click', (e) => {
            const b = e.target.closest('[data-tag]'); if (!b) return;
            const tag = b.dataset.tag;
            draft.tags = draft.tags.includes(tag) ? draft.tags.filter((t) => t !== tag) : [...draft.tags, tag];
            renderTags();
        });
        const addTag = () => {
            const raw = $('#tagInput').value.trim().replace(/^#+/, '');
            if (!raw) return;
            const tag = `#${raw}`;
            if (!draft.tags.includes(tag)) draft.tags.push(tag);
            $('#tagInput').value = '';
            renderTags();
        };
        $('#tagAddBtn').addEventListener('click', addTag);
        $('#tagInput').addEventListener('keydown', (e) => { if (e.key === 'Enter') { e.preventDefault(); addTag(); } });

        $('#writeForm').addEventListener('submit', (e) => {
            e.preventDefault();
            const err = $('#writeError');
            if (!draft.watchedAt) { err.textContent = '관람일을 선택해 주세요.'; err.hidden = false; return; }
            err.hidden = true;
            // 로그인 전이면 입력 중인 내용을 보관하고 로그인 화면으로 이동 (로그인 후 이 화면으로 복귀)
            if (!data.user) { session.set(SESSION.draft, draft); needLogin('save'); return; }
            const btn = $('#saveBtn');
            btn.disabled = true;
            btn.textContent = '저장 중…';
            setTimeout(() => {
                const fields = {
                    movieId: draft.movieId, movieTitle: draft.movieTitle, posterUrl: draft.posterUrl, watchedAt: draft.watchedAt,
                    viewType: draft.viewType, place: draft.place.trim(), oneLineReview: draft.oneLineReview.trim(),
                    diary: draft.diary.trim(), tags: draft.tags, ticketImageUrl: ''
                };
                let ticket;
                if (draft.ticketId) {
                    ticket = data.tickets.find((t) => t.ticketId === draft.ticketId);
                    Object.assign(ticket, fields);
                } else {
                    ticket = { ticketId: uid(), userId: data.user.userId, createdAt: new Date().toISOString(), ...fields };
                    data.tickets.push(ticket);
                }
                saveTickets();
                session.del(SESSION.draft);
                location.replace(`${url('write')}?saved=${ticket.ticketId}`);
            }, 350);
        });
    }

    function showSaved(id) {
        if (needLogin('myTickets', { replace: true })) return;
        const t = data.tickets.find((x) => x.ticketId === id && x.userId === data.user.userId);
        if (!t) { location.replace(url('home')); return; }
        $('#savedView').hidden = false;
        $('#savedTicket').innerHTML = `
            ${posterHtml(t.movieTitle, t.posterUrl, 'poster--lg')}
            <p class="ticket__t">${esc(t.movieTitle)}</p>
            <p class="ticket__m">${dotDate(t.watchedAt)} · ${viewLabel(t.viewType)}${t.place ? ' · ' + esc(t.place) : ''}</p>
            ${t.oneLineReview ? `<p class="ticket__r">“${esc(t.oneLineReview)}”</p>` : ''}`;
        $('#savedDownload').addEventListener('click', () => downloadTicket(t));
    }

    /* =====================================================
       9 로그인 / 회원가입 (조건부 화면)
       ===================================================== */
    function initLogin() {
        let mode = 'login';
        const reason = LOGIN_REASON[params.get('reason')] ? params.get('reason') : 'save';
        const authError = (msg) => { const el = $('#authError'); el.textContent = msg; el.hidden = false; };

        function render() {
            const signup = mode === 'signup';
            $('#loginReason').textContent = LOGIN_REASON[reason];
            $('#loginSubmit').textContent = signup ? '회원가입' : '로그인';
            $('#modeToggle').textContent = signup ? '로그인으로 돌아가기' : '회원가입';
            $('#password').autocomplete = signup ? 'new-password' : 'current-password';
            $('#authError').hidden = true;
        }
        render();

        // 닫기: 직전 화면으로, 없으면 홈으로
        $('#loginClose').addEventListener('click', (e) => {
            if (history.length > 1) { e.preventDefault(); history.back(); }
        });

        function finish(user) {
            data.user = user;
            local.set(STORE.user, user);
            const next = session.get(SESSION.next, null);
            session.del(SESSION.next);
            location.replace(next || url('home'));
        }
        const publicUser = ({ userId, nickname }) => ({ userId, nickname });

        $('#loginForm').addEventListener('submit', (e) => {
            e.preventDefault();
            const nickname = $('#nickname').value.trim();
            const pw = $('#password').value;
            if (!nickname) return authError('닉네임을 입력해 주세요.');
            if (!isValidPassword(pw)) return authError('비밀번호는 영문자와 숫자를 조합해 8자 이상 입력해 주세요.');
            // 실습용 목업 인증: 실제 서비스에서는 서버/인증 서비스가 처리해야 한다.
            const users = local.get(STORE.users, []);
            const found = users.find((u) => u.nickname.toLocaleLowerCase() === nickname.toLocaleLowerCase());
            if (mode === 'signup') {
                if (found) return authError('이미 사용 중인 닉네임이에요.');
                const user = { userId: uid(), nickname, password: pw };
                users.push(user);
                local.set(STORE.users, users);
                return finish(publicUser(user));
            }
            if (!found || found.password !== pw) return authError('닉네임 또는 비밀번호를 확인해 주세요.');
            finish(publicUser(found));
        });

        $('#modeToggle').addEventListener('click', () => { mode = mode === 'login' ? 'signup' : 'login'; render(); });
        $('#pwToggle').addEventListener('click', () => {
            const pw = $('#password'), hide = pw.type === 'password';
            pw.type = hide ? 'text' : 'password';
            $('#pwToggle').textContent = hide ? '숨김' : '표시';
        });
    }

    /* =====================================================
       6·7 마이 티켓북 (그리드 / 캘린더)
       ===================================================== */
    const my = { tag: '', sort: 'recent', ...session.get(SESSION.my, {}) };
    const persistMy = () => session.set(SESSION.my, my);

    function filteredTickets() {
        const sorters = {
            recent: (a, b) => b.watchedAt.localeCompare(a.watchedAt),
            old: (a, b) => a.watchedAt.localeCompare(b.watchedAt),
            title: (a, b) => a.movieTitle.localeCompare(b.movieTitle, 'ko')
        };
        return myTickets().filter((t) => !my.tag || t.tags.includes(my.tag)).sort(sorters[my.sort]);
    }

    function renderTagChips(onChange) {
        const tags = [...new Set(myTickets().flatMap((t) => t.tags))];
        if (my.tag && !tags.includes(my.tag)) my.tag = '';
        $('#myTagChips').innerHTML = ['', ...tags].map((t) => `<button type="button" class="chip ${my.tag === t ? 'is-on' : ''}" data-mytag="${esc(t)}">${t ? esc(t) : '전체'}</button>`).join('');
        $('#myTagChips').onclick = (e) => {
            const b = e.target.closest('[data-mytag]'); if (!b) return;
            my.tag = b.dataset.mytag; persistMy();
            renderTagChips(onChange); onChange();
        };
    }

    function loadSamples() {
        data.samples.forEach((s) => {
            const movie = movieById(s.movieId);
            if (!movie) return;
            data.tickets.push({
                ticketId: uid(), userId: data.user.userId, movieId: movie.movieId, movieTitle: movie.title, posterUrl: movie.posterPath,
                watchedAt: `${ym(today)}-${pad(s.dayOfMonth)}`, viewType: s.viewType, place: s.place, oneLineReview: s.oneLineReview,
                diary: s.diary, tags: s.tags, ticketImageUrl: '', createdAt: new Date(Date.now() - (30 - s.dayOfMonth) * 1000).toISOString()
            });
        });
        saveTickets();
        toast('샘플 티켓 4장을 불러왔어요');
        initTicketbook();
    }

    function initTicketbook() {
        const all = myTickets();
        $('#myEmpty').hidden = all.length > 0;
        $('#gridView').hidden = all.length === 0;
        $('#myTagChips').hidden = all.length === 0;
        if (!all.length) return;

        const renderGrid = () => {
            const list = filteredTickets();
            $('#mySort').value = my.sort;
            $('#myCount').textContent = `총 ${list.length}장`;
            $('#myGrid').innerHTML = list.length
                ? list.map((t, i) => `
                    <a class="card" href="${url('detail')}?id=${t.ticketId}">
                        ${posterHtml(t.movieTitle, t.posterUrl, '', i === 0 && !my.tag && my.sort === 'recent' ? 'NEW' : '')}
                        <p class="card__t">${esc(t.movieTitle)}</p>
                        <p class="card__m">${dotDate(t.watchedAt)}</p>
                    </a>`).join('')
                : '<p class="empty-note">이 태그의 티켓이 없어요.</p>';
        };
        renderTagChips(renderGrid);
        renderGrid();
        $('#mySort').onchange = (e) => { my.sort = e.target.value; persistMy(); renderGrid(); };
        $('#loadSampleBtn').onclick = loadSamples;
    }

    function initCalendar() {
        const all = myTickets();
        $('#myEmpty').hidden = all.length > 0;
        $('#calendarView').hidden = all.length === 0;
        if (!all.length) return;

        // 가장 최근 관람 월에서 시작 (없으면 이번 달)
        const latest = [...all].sort((a, b) => b.watchedAt.localeCompare(a.watchedAt))[0];
        let yearMonth = session.get('ticketbook.ym', null) || latest.watchedAt.slice(0, 7);
        let selected = session.get('ticketbook.sel', null) || latest.watchedAt;
        if (selected.slice(0, 7) !== yearMonth) selected = `${yearMonth}-01`;

        function render() {
            const [y, m] = yearMonth.split('-').map(Number);
            $('#calTitle').textContent = `${y}년 ${m}월`;
            const byDate = {};
            filteredTickets().forEach((t) => { (byDate[t.watchedAt] ||= []).push(t); });
            const start = new Date(y, m - 1, 1 - new Date(y, m - 1, 1).getDay());
            const cells = [];
            for (let i = 0; i < 42; i++) {
                const d = new Date(start.getFullYear(), start.getMonth(), start.getDate() + i);
                if (i >= 35 && d.getMonth() !== m - 1) break;
                const key = ymd(d), ts = byDate[key] || [];
                const cls = ['cal__d', d.getMonth() !== m - 1 ? 'is-out' : '', key === ymd(today) ? 'is-today' : '', key === selected ? 'is-sel' : ''].join(' ');
                cells.push(`<button type="button" class="${cls}" data-date="${key}"><span>${d.getDate()}</span>${ts.length ? `<i class="cal__t">${esc(ts[0].movieTitle.slice(0, 2))}</i>${ts.length > 1 ? `<b class="cal__n">+${ts.length - 1}</b>` : ''}` : ''}</button>`);
            }
            $('#calGrid').innerHTML = cells.join('');
            const sel = byDate[selected] || [];
            const [, sm, sd] = selected.split('-').map(Number);
            $('#calSelTitle').textContent = `${sm}월 ${sd}일 · 관람 ${sel.length}건`;
            $('#calList').innerHTML = sel.length
                ? sel.map((t) => `
                    <a class="row" href="${url('detail')}?id=${t.ticketId}">
                        ${posterHtml(t.movieTitle, t.posterUrl, 'poster--xs')}
                        <div><p class="row__t">${esc(t.movieTitle)}</p><p class="row__m">${esc(t.oneLineReview || '한 줄 평 없음')}</p></div>
                        <span class="row__go" aria-hidden="true">›</span>
                    </a>`).join('')
                : '<p class="empty-note">이 날 저장한 티켓이 없어요.</p>';
            session.set('ticketbook.ym', yearMonth);
            session.set('ticketbook.sel', selected);
        }
        const shift = (delta) => {
            const [y, m] = yearMonth.split('-').map(Number);
            yearMonth = ym(new Date(y, m - 1 + delta, 1));
            selected = `${yearMonth}-01`;
            render();
        };
        $('#prevMonth').onclick = () => shift(-1);
        $('#nextMonth').onclick = () => shift(1);
        $('#calGrid').onclick = (e) => {
            const b = e.target.closest('[data-date]'); if (!b) return;
            selected = b.dataset.date;
            yearMonth = selected.slice(0, 7);
            render();
        };
        renderTagChips(render);
        render();
    }

    /* =====================================================
       8 티켓 상세
       ===================================================== */
    function initDetail() {
        const t = data.tickets.find((x) => x.ticketId === params.get('id') && x.userId === data.user.userId);
        if (!t) { location.replace(url('ticketbook')); return; }
        $('#detailBody').innerHTML = `
            ${posterHtml(t.movieTitle, t.posterUrl, 'poster--lg')}
            <h2 class="d__title">${esc(t.movieTitle)}</h2>
            <p class="d__meta">${dotDate(t.watchedAt)} · ${viewLabel(t.viewType)}${t.place ? ' · ' + esc(t.place) : ''}</p>
            ${t.oneLineReview ? `<p class="d__review">“${esc(t.oneLineReview)}”</p>` : ''}
            ${t.diary ? `<p class="lb">실관람 다이어리</p><p class="d__diary">${esc(t.diary)}</p>` : ''}
            ${t.tags.length ? `<div class="d__tags">${t.tags.map((g) => `<span class="tag">${esc(g)}</span>`).join('')}</div>` : ''}
            <div class="d__grid">
                <button type="button" class="btn" data-action="download">티켓 이미지 다운로드</button>
                <button type="button" class="btn" data-action="share">SNS 공유</button>
                <a class="btn btn--soft" href="${url('write')}?ticketId=${t.ticketId}">수정</a>
                <button type="button" class="btn btn--soft" data-action="delete">삭제</button>
            </div>`;
        $('#detailBody').addEventListener('click', async (e) => {
            const b = e.target.closest('[data-action]'); if (!b) return;
            if (b.dataset.action === 'download') downloadTicket(t);
            if (b.dataset.action === 'share') shareTicket(t);
            if (b.dataset.action === 'delete') {
                if (!(await confirmDialog('이 티켓을 삭제할까요?\n삭제하면 되돌릴 수 없어요.', '삭제'))) return;
                data.tickets = data.tickets.filter((x) => x.ticketId !== t.ticketId);
                saveTickets();
                location.replace(url('ticketbook'));
            }
        });
    }

    /* ===== 시작 ===== */
    async function init() {
        const [movieData, sampleData] = await Promise.all([
            loadJson('data/movies.json', FALLBACK_MOVIES),
            loadJson('data/tickets.json', FALLBACK_SAMPLES)
        ]);
        data.movies = movieData.movies;
        data.genres = movieData.genres;
        data.samples = sampleData.samples;
        initTopButton();

        // 로그인이 필요한 화면 (홈 · 검색 · 로그인 · 작성은 비로그인 허용)
        if (['ticketbook', 'calendar', 'detail'].includes(page) && needLogin('myTickets', { replace: true })) return;

        initAvatar();
        const routes = { home: initHome, search: initSearch, write: initWrite, login: initLogin, ticketbook: initTicketbook, calendar: initCalendar, detail: initDetail };
        (routes[page] || (() => {}))();
    }

    init();
})();
