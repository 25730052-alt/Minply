/* 나만의 모바일 티켓북 — 사용자 행동과 화면 상태 변경
   한 파일에서 body[data-page] 값으로 화면별 동작을 나눈다.
   home · search · write(작성/저장 완료) · login · ticketbook · calendar · detail */
(() => {
    'use strict';

    /* ===== 상수 ===== */
    /* ===== 클라우드 DB(Supabase) 설정 =====
       Supabase 프로젝트의 Project URL 과 anon public key 를 넣으면 닉네임 회원가입·로그인과
       티켓 저장이 클라우드 DB로 바뀐다(기기가 바뀌어도 유지). 비워 두면 '기기 저장 모드'로 동작한다.
       anon key 는 공개용 키라 프런트엔드에 넣어도 된다. 테이블 직접 접근은 막혀 있고 DB 함수로만 읽고 쓴다. (readme 4.1) */
    const SUPABASE_CONFIG = {
        url: '',
        anonKey: ''
    };
    const STORE = { tickets: 'ticketbook.tickets', user: 'ticketbook.user', users: 'ticketbook.users', session: 'ticketbook.session', hasAccount: 'ticketbook.hasAccount', favorites: 'ticketbook.favorites' };
    const SESSION = { next: 'ticketbook.next', draft: 'ticketbook.draft', search: 'ticketbook.search', my: 'ticketbook.my' };
    const PRESET_TAGS = ['#설렘', '#혼자', '#눈물', '#친구와', '#재관람'];
    const FALLBACK_MOVIE_POSTERS = {
        496243: 'https://image.tmdb.org/t/p/w500/jjHccoFjbqlfr4VGLVLT7yek0Xn.jpg',
        157336: 'https://image.tmdb.org/t/p/w500/gDN2NWtHbs8ZWEBQM8Dh5OVXdb4.jpg',
        27205: 'https://image.tmdb.org/t/p/w500/atSxEGstxXRoSKDQFBgqQ5lpGSt.jpg',
        299534: 'https://image.tmdb.org/t/p/w500/z7ilT5rNN9kDo8JZmgyhM6ej2xv.jpg',
        313369: 'https://image.tmdb.org/t/p/w500/ad9ndytwOckyShSc0A6tx1rZRkW.jpg',
        670: 'https://image.tmdb.org/t/p/w500/xpa9ybm6tYGna5LseqSXvKpSSJn.jpg',
        129: 'https://image.tmdb.org/t/p/w500/u1L4qxIu5sC2P082uMHYt7Ifvnj.jpg',
        597: 'https://image.tmdb.org/t/p/w500/132KjhVrWUqKFVfMAKKNkherytA.jpg',
        396535: 'https://image.tmdb.org/t/p/w500/6XvEZVBFFjybvb1yQd1qfOC6F2S.jpg',
        1042000: 'https://image.tmdb.org/t/p/w500/ukVVnY9ovwl78WE5KndcpA6SnAm.jpg',
        1100000: 'https://image.tmdb.org/t/p/w500/tw0i3kkmOTjDjGFZTLHKhoeXVvA.jpg',
        438631: 'https://image.tmdb.org/t/p/w500/7zV8FTYofAORGm0Umgh1mNNCym8.jpg'
    };
    const VIEW_TYPES = [
        { id: 'theater', label: '극장', icon: 'fa-film' },
        { id: 'ott', label: 'OTT', icon: 'fa-tv' }
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
    /* file:// 실행 시 movies.json 대신 쓰는 TMDb 평점(10점 만점) */
    const FALLBACK_VOTE_AVERAGES = {
        496243: 8.5, 157336: 8.494, 27205: 8.373, 299534: 8.2, 313369: 7.9, 670: 8.2,
        129: 8.537, 597: 7.901, 396535: 7.7, 1042000: 7.8, 1100000: 7.6, 438631: 7.8
    };
    /* file:// 실행 시 movies.json 대신 쓰는 대체 영화 줄거리 */
    const FALLBACK_OVERVIEWS = {
        "299534": "어벤져스의 패배 이후 지구는 초토화됐고 남은 절반의 사람들은 정신적 고통을 호소하며 하루하루를 근근이 버텨나간다. 와칸다에서 싸우다 생존한 히어로들과 우주의 타이탄 행성에서 싸우다 생존한 히어로들이 뿔뿔이 흩어졌는데, 아이언맨과 네뷸라는 우주를 떠돌고 있고 지구에 남아 있는 어벤져스 멤버들은 닉 퓨리가 마지막에 신호를 보내다 만 송신기만 들여다보며 혹시 모를 우주의 응답을 기다리는 중이다. 애초 히어로의 삶을 잠시 내려놓고 가족과 시간을 보내던 호크아이 역시 헤아릴 수 없는 마음의 상처를 입은 채 사라지고 마는데...",
        "157336": "세계 각국의 정부와 경제가 완전히 붕괴된 미래가 다가온다. 지난 20세기에 범한 잘못이 전 세계적인 식량 부족을 불러왔고, NASA도 해체되었다. 나사 소속 우주비행사였던 쿠퍼는 지구에 몰아친 식량난으로 옥수수나 키우며 살고 있다. 거센 황사가 몰아친 어느 날 알 수 없는 힘에 이끌려 딸과 함께 도착한 곳은 인류가 이주할 행성을 찾는 나사의 비밀본부. 이 때 시공간에 불가사의한 틈이 열리고, 이 곳을 탐험해 인류를 구해야 하는 임무를 위해 쿠퍼는 만류하는 딸을 뒤로한 채 우주선에 탑승하는데...",
        "27205": "타인의 꿈에 들어가 생각을 훔치는 특수 보안요원 코브. 그를 이용해 라이벌 기업의 정보를 빼내고자 하는 사이토는 코브에게 생각을 훔치는 것이 아닌, 생각을 심는 ‘인셉션’ 작전을 제안한다. 성공 조건으로 국제적인 수배자가 되어있는 코브의 신분을 바꿔주겠다는 거부할 수 없는 제안을 하고, 사랑하는 아이들에게 돌아가기 위해 그 제안을 받아들인다. 최강의 팀을 구성, 표적인 피셔에게 접근해서 ‘인셉션’ 작전을 실행하지만 예기치 못한 사건들과 마주하게 되는데… 꿈 VS 현실! 시간, 규칙, 타이밍 모든 것이 완벽해야만 하는, 단 한 번도 성공한 적 없는 ‘인셉션’ 작전이 시작된다!",
        "129": "평범한 열 살 짜리 소녀 치히로 식구는 이사 가던 중 길을 잘못 들어 낡은 터널을 지나가게 된다. 터널 저편엔 폐허가 된 놀이공원이 있었고 그곳엔 이상한 기운이 흘렀다. 인기척 하나 없는 이 마을의 낯선 분위기에 불길한 기운을 느낀 치히로는 부모님에게 돌아가자고 조르지만 부모님은 호기심에 들떠 마을 곳곳을 돌아다니기 시작한다. 어느 음식점에 도착한 치히로의 부모님은 그 곳에 차려진 음식들을 보고 즐거워하며 허겁지겁 먹어대다가 돼지로 변해버린다. 겁에 질려 당황하는 치히로에게 낯선 소년 하쿠가 나타나 빨리 이곳을 나가라고 소리치는데...",
        "496243": "전원 백수로 살 길 막막하지만 사이는 좋은 기택 가족. 장남 기우에게 명문대생 친구가 연결시켜 준 고액 과외 자리는 모처럼 싹튼 고정수입의 희망이다. 온 가족의 도움과 기대 속에 박 사장 집으로 향하는 기우. 글로벌 IT기업의 CEO인 박 사장의 저택에 도착하자 젊고 아름다운 사모님 연교와 가정부 문광이 기우를 맞이한다. 큰 문제 없이 박 사장의 딸 다혜의 과외를 시작한 기우. 그러나 이렇게 시작된 두 가족의 만남 뒤로, 걷잡을 수 없는 사건이 기다리고  있는데.....",
        "597": "\"내 인생의 가장 큰 행운은 당신을 만난 거야\" 우연한 기회로 티켓을 구해 타이타닉호에 올라탄 자유로운 영혼을 가진 화가 ‘잭’(레오나르도 디카프리오)은 막강한 재력의 약혼자와 함께 1등실에 승선한 ‘로즈’(케이트 윈슬렛)에게 한눈에 반한다. 진실한 사랑을 꿈꾸던 ‘로즈’ 또한 생애 처음 황홀한 감정에 휩싸이고, 둘은 운명 같은 사랑에 빠지는데… 가장 차가운 곳에서 피어난 뜨거운 사랑! 영원히 가라앉지 않는 세기의 사랑이 펼쳐진다!",
        "313369": "재즈 피아니스트 세바스찬과 배우 지망생 미아는 꿈을 좇는 도시 로스앤젤레스에서 우연히 만나 사랑에 빠진다. 서로의 꿈을 응원하며 계절을 함께 보내지만, 성공에 가까워질수록 두 사람은 사랑과 꿈 사이에서 선택의 갈림길에 선다.",
        "670": "어느 날 영문도 모른 채 사설 감금방에 갇힌 오대수는 15년 동안 군만두만 먹으며 갇혀 지낸다. 갑자기 풀려난 그는 자신을 가둔 사람이 누구인지, 왜 15년이었는지를 밝히기 위해 5일 동안의 추적에 나선다.",
        "396535": "정체불명의 바이러스가 전국으로 퍼지고 긴급재난경보가 내려진 가운데, 서울역을 출발한 부산행 KTX에 감염자가 올라탄다. 펀드매니저 석우와 딸 수안, 그리고 승객들은 안전한 부산에 닿기 위해 열차 안에서 필사적인 사투를 벌인다.",
        "1042000": "1979년 12월 12일, 수도 서울에서 군사 반란이 일어난다. 권력을 잡으려는 보안사령관 전두광과 이에 맞서 수도를 지키려는 수도경비사령관 이태신, 두 사람의 운명을 건 긴박한 9시간이 펼쳐진다.",
        "1100000": "거액의 의뢰를 받은 무당 화림과 봉길은 대대로 이어지는 기이한 병의 원인을 찾아 풍수사 상덕, 장의사 영근과 함께 수상한 묘를 이장하기로 한다. 그러나 파묘를 한 순간부터 걷잡을 수 없는 일들이 벌어지기 시작한다.",
        "438631": "우주에서 가장 귀한 자원 스파이스가 나는 사막 행성 아라키스. 이 행성을 다스리게 된 아트레이데스 가문의 후계자 폴은 거대한 음모 속에서 가족을 잃고, 사막 민족 프레멘과 함께 자신의 운명을 마주한다."
    };
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
            movieId, title, releaseDate, genreIds, popularity, availableOn, posterPath: FALLBACK_MOVIE_POSTERS[movieId],
            voteAverage: FALLBACK_VOTE_AVERAGES[movieId] || 0, overview: FALLBACK_OVERVIEWS[movieId] || '', source: 'json'
        }))
    };
    /* 넷플릭스에서만 볼 수 있는 최신 화제작 (OTT 전용) — movies.json(TMDB 데이터)과 같은 필드 구조.
       서버가 movies.json을 새로 만들어도 사라지지 않도록 앱에 따로 두고 시작할 때 합친다. */
    const NETFLIX_ORIGINAL_MOVIES = [
            { movieId: 803796, title: "케이팝 데몬 헌터스", originalTitle: "KPop Demon Hunters", releaseDate: '2025-06-20', genreIds: [16, 14, 10402, 35], popularity: 140, voteAverage: 7.5, runtime: 95,
              posterPath: 'https://images.justwatch.com/poster/331740548/s718/kpop-demon-hunters.jpg',
              overview: "무대 위에서는 세계적인 K팝 걸그룹, 무대 밖에서는 악령을 사냥하는 헌터로 살아가는 루미·미라·조이. 팬들의 영혼을 노리는 악령 보이그룹 ‘사자 보이즈’가 나타나자, 세 사람은 노래의 힘으로 세상을 지키는 결계를 완성하기 위해 맞선다." },
            { movieId: 812583, title: "나이브스 아웃: 웨이크 업 데드 맨", originalTitle: "Wake Up Dead Man: A Knives Out Mystery", releaseDate: '2025-12-12', genreIds: [35, 80, 9648], popularity: 125, voteAverage: 7.3, runtime: 140,
              posterPath: 'https://images.justwatch.com/poster/339096016/s718/wake-up-dead-man-a-knives-out-mystery.jpg',
              overview: "작은 마을 성당에서 도저히 일어날 수 없을 것 같은 살인 사건이 벌어진다. 명탐정 브누아 블랑은 젊은 신부와 함께 사건을 파헤치고, 신앙과 거짓말이 뒤얽힌 공동체 속에서 숨겨진 진실에 다가간다." },
            { movieId: 7100001, title: "더 립", originalTitle: "The Rip", releaseDate: '2026-01-16', genreIds: [80, 53, 28], popularity: 120, voteAverage: 6.8, runtime: 113,
              posterPath: 'https://images.justwatch.com/poster/340927094/s718/rip-0.jpg',
              overview: "마이애미 마약 수사팀이 허름한 은신처에서 수천만 달러의 현금 더미를 발견한다. 날이 밝기 전까지 돈을 세며 현장을 지켜야 하지만, 소문이 퍼지면서 팀원들은 서로를 의심하기 시작하고 하룻밤의 생존 게임이 시작된다." },
            { movieId: 7100002, title: "남편들", originalTitle: "Husbands in Action", releaseDate: '2026-06-19', genreIds: [28, 35, 80], popularity: 115, voteAverage: 6.2, runtime: 110,
              posterPath: 'https://images.justwatch.com/poster/345714787/s718/husbands-in-action.jpg',
              overview: "마약반 형사 충식은 전 아내가 범죄 조직에 납치됐다는 소식을 듣는다. 아내를 구하기 위해 지금의 남편인 수의사 민석과 어쩔 수 없이 손을 잡지만, 맞는 구석이 하나도 없는 두 남편의 구출 작전은 예측불허로 흘러간다." },
            { movieId: 7100003, title: "파반느", originalTitle: "Pavane", releaseDate: '2026-02-20', genreIds: [10749, 18], popularity: 110, voteAverage: 6.9, runtime: 113,
              posterPath: 'https://images.justwatch.com/poster/341147177/s718/pavane-2026.jpg',
              overview: "백화점에서 일하며 마음의 문을 닫고 살아가던 미정, 경록, 요한. 서로의 외로움을 알아본 세 사람은 조심스럽게 가까워지며 사랑과 삶을 다시 마주한다. 박민규의 소설 『죽은 왕녀를 위한 파반느』가 원작이다." },
            { movieId: 7100004, title: "굿뉴스", originalTitle: "Good News", releaseDate: '2025-10-17', genreIds: [35, 80, 53], popularity: 105, voteAverage: 6.6, runtime: 136,
              posterPath: 'https://images.justwatch.com/poster/334652932/s718/good-news-2025.jpg',
              overview: "1970년, 일본에서 출발한 여객기가 납치되어 평양으로 향한다. 비행기를 다른 곳에 내려앉히기 위해 정체불명의 해결사 ‘아무개’와 젊은 공군 중위가 비밀 작전에 투입되고, 한국·일본·미국의 계산이 뒤엉킨다. 실화에서 출발한 블랙코미디." },
            { movieId: 7100005, title: "대홍수", originalTitle: "The Great Flood", releaseDate: '2025-12-19', genreIds: [878, 18, 28], popularity: 100, voteAverage: 5.4, runtime: 107,
              posterPath: 'https://images.justwatch.com/poster/340369492/s718/the-great-flood-2025.jpg',
              overview: "소행성 충돌로 녹아내린 빙하가 지구를 덮친 마지막 날. 인공지능 연구원 안나는 어린 아들과 함께 물에 잠겨가는 아파트를 빠져나가려 하고, 그녀를 데려가라는 임무를 받은 보안팀원 희조가 나타나며 인류의 미래가 걸린 선택이 시작된다." }
    ].map((movie) => ({ ...movie, availableOn: ['ott'], ottProvider: '넷플릭스', source: 'json', voteCount: 0 }));
    const FALLBACK_SAMPLES = {
        samples: [
            { movieId: 157336, dayOfMonth: 3, viewType: 'theater', place: '용산 아이맥스', oneLineReview: '시간이 이렇게 아플 수 있다니.', diary: '엔딩 크레딧이 올라가도 한참 일어나지 못했다. 사운드가 몸을 울리는 경험이었다.', tags: ['#눈물', '#혼자'] },
            { movieId: 496243, dayOfMonth: 10, viewType: 'ott', place: '넷플릭스', oneLineReview: '다시 봐도 계단 장면에서 소름.', diary: '주말 밤에 두 번째 감상. 처음엔 못 봤던 디테일이 보였다.', tags: ['#재관람'] },
            { movieId: 313369, dayOfMonth: 12, viewType: 'theater', place: 'CGV 강남', oneLineReview: '마지막 장면의 여운이 길다.', diary: '친구와 함께 봤다. 음악이 계속 머릿속에 맴돈다.', tags: ['#설렘', '#친구와'] },
            { movieId: 438631, dayOfMonth: 18, viewType: 'theater', place: '롯데시네마 월드타워', oneLineReview: '스크린이 클수록 좋은 영화.', diary: '', tags: ['#혼자'] }
        ]
    };
    const DEMO_CGV_REVIEWS = {
        30001367: [
            ['복숭아우유', '인어 섬의 비밀을 찾아가는 치이카와의 모험이 기대돼요!'],
            ['작은별', '친구들과 바닷속 섬을 탐험하는 장면이 정말 귀여울 것 같아요.'],
            ['포근한팝콘', '반짝이는 바다와 섬의 수수께끼가 잘 어울려요.'],
            ['구름산책', '치이카와 친구들이 힘을 모아 비밀을 풀겠죠?'],
            ['민트초코별', '귀여운 모험에 미스터리까지 더해져 궁금해요.'],
            ['오늘도영화', '따뜻한 우정과 신비한 인어 섬 이야기, 꼭 보고 싶어요.']
        ],
        30001610: [
            ['추리하는밤', '위조지폐 단서를 따라가는 코난의 추리가 기대돼요.'],
            ['푸른나비', '작은 흔적들이 하나로 이어지는 순간이 궁금해요.'],
            ['레몬사탕', '코난과 함께 범인의 계획을 추리해 보고 싶어요!'],
            ['극장앞벤치', '30호 사건의 진실, 마지막까지 긴장감 넘치겠어요.'],
            ['셜록의후예', '탐정단이 모은 단서로 사건을 푸는 재미가 있겠네요.'],
            ['팝콘탐정', '극장에서 보면 추리의 긴장감이 더 생생할 것 같아요.']
        ],
        30001550: [
            ['월요일의용기', '마지막 면접에서 지원자들이 어떤 선택을 할지 궁금해요.'],
            ['파란명찰', '면접장 안에서 드러날 각자의 진짜 모습이 기대됩니다.'],
            ['퇴근후한편', '익숙한 취업 이야기를 스릴 있게 풀어낼 것 같아요.'],
            ['라일락필름', '최종 합격을 앞둔 심리전, 긴장감 넘치겠어요.'],
            ['면접대기실', '과제가 주어질 때마다 바뀌는 관계가 흥미로워요.'],
            ['금요일관객', '한정된 면접장에서 펼쳐질 배우들의 연기가 궁금해요.']
        ],
        30001323: [
            ['이타카행', '오디세우스의 긴 귀향길, 신화 속 모험이 기대돼요.'],
            ['파도수집가', '괴물과 시련을 넘어 가족에게 향하는 여정이 뭉클해요.'],
            ['별빛항해', '바다 위 위기를 오디세우스가 어떻게 넘길지 궁금해요.'],
            ['신화책갈피', '익숙한 신화를 영화만의 시선으로 만나고 싶어요.'],
            ['큰화면선호', '고향으로 향하는 거대한 모험을 극장에서 보고 싶어요.'],
            ['바다건너집', '전쟁 뒤에도 이어지는 귀향의 여정이 인상적이에요.']
        ],
        1263337: [
            ['눈보라산책', '알래스카에 고립된 조종사와 군견의 생존기가 긴박해요.'],
            ['충성스런친구', '사람과 군견이 서로 의지하는 모습이 뭉클할 것 같아요.'],
            ['따뜻한담요', '구조를 기다릴 수 없는 두 동료의 선택이 궁금해요.'],
            ['설산극장', '거친 알래스카 설원이 생생하게 펼쳐질 것 같아요.'],
            ['용감한발자국', '조종사와 군견이 서로를 지키는 여정이 기대됩니다.'],
            ['겨울팝콘', '혹독한 추위 속 군견의 활약을 큰 화면으로 보고 싶어요.']
        ],
        30001569: [
            ['칠레의바람', '격변의 칠레에서 흔들리는 작전, 시대 분위기가 궁금해요.'],
            ['필름느와르', '요원들의 계획과 현지의 변화가 어떻게 부딪힐까요?'],
            ['낡은지도', '서로 다른 목적의 만남이 작전을 바꿀 것 같아요.'],
            ['밤의시네마', '시대의 혼란과 신념이 얽힌 묵직한 스릴러 같아요.'],
            ['붉은노을', '계획이 틀어지며 드러날 진심이 기대됩니다.'],
            ['필름한장', '격변 속 작전, 누구를 믿어야 할지 궁금해요.']
        ],
        30000103: [
            ['레제의꽃', '덴지와 레제의 만남이 어떤 선택으로 이어질지 궁금해요.'],
            ['전기톱팬', '강렬한 액션과 덴지의 서툰 감정선이 기대돼요.'],
            ['비오는카페', '카페의 만남이 위험한 싸움으로 번지는 전개가 인상적!'],
            ['만화책너머', '레제 편의 액션과 덴지의 마음을 함께 보고 싶어요.'],
            ['빨간우산', '평범한 일상을 바라는 덴지의 소망이 마음에 남아요.'],
            ['심야상영', '사랑과 생존 사이, 두 사람의 선택이 궁금합니다.']
        ],
        30001297: [
            ['안개마을', '항구 마을을 덮친 사건과 숨겨진 비밀이 궁금해요.'],
            ['파도끝', '주민들이 힘을 모아 위협에 맞서는 이야기가 인상적!'],
            ['회색필름', '고립된 항구의 단서가 진실로 이어지는 전개가 기대돼요.'],
            ['등대지기', '바다 마을 미스터리의 서늘한 분위기가 끌려요.'],
            ['새벽의관객', '마을의 비밀이 드러나는 순간까지 긴장될 것 같아요.'],
            ['검은파도', '외딴 마을에서 벌어지는 사건의 진실이 궁금합니다.']
        ],
        30001314: [
            ['작전개시', '서로 다른 암살자의 목적이 충돌하는 작전, 흥미진진해요.'],
            ['추격전매니아', '동맹과 적이 뒤바뀌는 추격전이 기대됩니다!'],
            ['검은정장', '인물마다 다른 이유와 작전의 진짜 목적이 궁금해요.'],
            ['액션한스푼', '꼬여 가는 계획 속 생존 경쟁이 긴장감 넘칠 듯해요.'],
            ['극장맨앞', '누구도 믿기 힘든 대결, 반전이 기다려지네요.'],
            ['시네마고양이', '액션과 심리전 중 누가 판을 뒤집을까요?']
        ]
    };
    const FALLBACK_CGV_CHART = {
        asOf: '2026-11-09',
        movies: [
            { movieId: 30001367, title: '극장판 치이카와-인어 섬의 비밀', releaseDate: '2026-09-30', posterPath: 'https://cdn.cgv.co.kr/cgvpomsfilm/Movie/Thumbnail/Poster/030001/30001367/30001367_320.jpg', overview: '치이카와와 친구들은 초대장을 받고 바닷속 인어 섬으로 향한다. 즐거운 휴가를 기대했지만, 섬에서 벌어지는 수상한 일들과 숨겨진 비밀을 마주한다.', genreIds: [16], availableOn: ['theater'], source: 'cgv', rank: 3, cgvRank: 3, cgvReservationRate: 17.3, cgvEggIndex: 93, cgvAdmissions: '278.8만' },
            { movieId: 30001610, title: '명탐정 코난-30호 살인 사건', releaseDate: '2026-11-05', posterPath: 'https://cdn.cgv.co.kr/cgvpomsfilm/Movie/Thumbnail/Poster/030001/30001610/30001610_320.jpg', overview: '신권 위조지폐 사건의 단서를 쫓던 코난과 친구들. 현장에 남은 흔적을 따라 범인의 계획과 사건 뒤에 감춰진 진실을 밝혀 나간다.', genreIds: [16, 28, 9648], availableOn: ['theater'], source: 'cgv', rank: 4, cgvRank: 4, cgvReservationRate: 6.9, cgvEggIndex: 91, cgvAdmissions: '10.8만' },
            { movieId: 30001550, title: '최종면접', releaseDate: '2026-11-04', posterPath: 'https://cdn.cgv.co.kr/cgvpomsfilm/Movie/Thumbnail/Poster/030001/30001550/30001550_320.jpg', overview: '최종 합격자를 가리기 위해 마지막 면접에 모인 지원자들. 예측할 수 없는 과제와 선택이 이어지며, 서로의 진짜 의도와 평가의 기준이 드러난다.', genreIds: [9648], availableOn: ['theater'], source: 'cgv', rank: 6, cgvRank: 6, cgvReservationRate: 6.1, cgvEggIndex: 95, cgvAdmissions: '16.6만' },
            { movieId: 30001323, title: '오디세이', releaseDate: '2026-08-05', posterPath: 'https://cdn.cgv.co.kr/cgvpomsfilm/Movie/Thumbnail/Poster/030001/30001323/30001323_320.jpg', overview: '트로이 전쟁을 마친 오디세우스는 고향 이타카로 돌아가기 위해 긴 항해를 시작한다. 신화 속 괴물과 예측할 수 없는 시련을 지나며 가족과 고향을 향한 여정을 이어간다.', genreIds: [28, 18, 12], availableOn: ['theater'], source: 'cgv', rank: 8, cgvRank: 8, cgvReservationRate: 2.9, cgvEggIndex: 98, cgvAdmissions: '1,234.8만' },
            { movieId: 1263337, title: '하트 오브 비스트', releaseDate: '2026-10-28', posterPath: 'https://image.tmdb.org/t/p/w500/zC4E522V1n3H4SGdYOaiqhF5DnS.jpg', overview: '혹독한 알래스카에 추락한 전직 특수부대 조종사와 그의 군견. 구조를 기다릴 수 없는 두 동료는 거친 자연 속에서 살아남기 위해 힘을 합친다.', genreIds: [12, 53], availableOn: ['theater'], source: 'cgv', rank: 9, cgvRank: 9, cgvReservationRate: 2.6, cgvEggIndex: 97, cgvAdmissions: '37.9만' },
            { movieId: 30001569, title: '와일드 호스 나인', releaseDate: '2026-11-04', posterPath: 'https://cdn.cgv.co.kr/cgvpomsfilm/Movie/Thumbnail/Poster/030001/30001569/30001569_320.jpg', overview: '1970년대 칠레를 무대로, 임무를 수행하던 요원들의 계획은 현지의 격변과 뜻밖의 만남 속에서 흔들리기 시작한다. 서로 다른 목적과 신념이 얽히며 선택의 순간이 다가온다.', genreIds: [9648, 80, 53], availableOn: ['theater'], source: 'cgv', rank: 15, cgvRank: 15, cgvReservationRate: 1.3, cgvEggIndex: 97, cgvAdmissions: '2.1만' },
            { movieId: 30000103, title: '극장판 체인소 맨-레제편', releaseDate: '2025-09-24', posterPath: 'https://cdn.cgv.co.kr/cgvpomsfilm/Movie/Thumbnail/Poster/030000/30000103/30000103_320.jpg', overview: '전기톱의 악마로 살아가는 덴지는 카페에서 레제를 만나 처음으로 평범한 일상을 꿈꾼다. 그러나 그녀와 가까워질수록 위험한 싸움에 휘말리고, 사랑과 생존 사이에서 선택해야 한다.', genreIds: [28, 16, 12], availableOn: ['theater'], source: 'cgv', rank: 19, cgvRank: 19, cgvReservationRate: 0.9, cgvEggIndex: 96, cgvAdmissions: '346.4만' },
            { movieId: 30001297, title: '호프', releaseDate: '2026-07-15', posterPath: 'https://cdn.cgv.co.kr/cgvpomsfilm/Movie/Thumbnail/Poster/030001/30001297/30001297_320.jpg', overview: '외딴 항구 마을에서 정체를 알 수 없는 사건이 벌어진다. 주민들은 마을을 덮친 위협에 맞서고, 혼란이 커질수록 그곳에 감춰져 있던 진실도 모습을 드러낸다.', genreIds: [878, 53, 28], availableOn: ['theater'], source: 'cgv', rank: 23, cgvRank: 23, cgvReservationRate: 0.5, cgvEggIndex: 85, cgvAdmissions: '459.8만' },
            { movieId: 30001314, title: '암살자(들)', releaseDate: '2026-09-23', posterPath: 'https://cdn.cgv.co.kr/cgvpomsfilm/Movie/Thumbnail/Poster/030001/30001314/30001314_320.jpg', overview: '한 건의 작전을 둘러싸고 서로 다른 목적을 지닌 암살자들이 맞붙는다. 계획이 어긋나고 동맹과 적의 경계가 흐려지면서, 모두가 살아남기 위한 추격전이 시작된다.', genreIds: [80, 18], availableOn: ['theater'], source: 'cgv', rank: 24, cgvRank: 24, cgvReservationRate: 0.4, cgvEggIndex: 92, cgvAdmissions: '347.6만' }
        ]
    };
    const FALLBACK_LOTTE_CHART = {
        asOf: '2026-11-16',
        movies: [
            ['24708', '극장판 치이카와: 인어 섬의 비밀', '2026-09-30', 'https://cf.lottecinema.co.kr/Media/MovieFile/MovieImg/202609/24708_101_1.jpg', 9.67],
            ['25030', '극장판 마법소녀 마도카 마기카 ＜발푸르기스의 회천＞', '2026-11-04', 'https://cf.lottecinema.co.kr/Media/MovieFile/MovieImg/202611/25030_101_1.jpg', 6.61],
            ['10893', '라라랜드', '2026-11-11', 'https://cf.lottecinema.co.kr/Media/MovieFile/MovieImg/201612/10893_101_1.jpg', 3.32],
            ['24754', '폴2: 데드포인트', '2026-11-11', 'https://cf.lottecinema.co.kr/Media/MovieFile/MovieImg/202609/24754_101_1.jpg', 2.52],
            ['24998', '최종면접', '2026-11-04', 'https://cf.lottecinema.co.kr/Media/MovieFile/MovieImg/202611/24998_101_1.jpg', 1.99],
            ['25018', '그대, 별처럼', '2026-10-28', 'https://cf.lottecinema.co.kr/Media/MovieFile/MovieImg/202610/25018_101_1.jpg', 1.51],
            ['14449', '포드 V 페라리', '2026-11-09', 'https://cf.lottecinema.co.kr/Media/MovieFile/MovieImg/201911/14449_101_1.jpg', 1.21],
            ['24867', '하트 오브 비스트', '2026-10-28', 'https://cf.lottecinema.co.kr/Media/MovieFile/MovieImg/202610/24867_101_1.jpg', 1.09],
            ['24744', '스크루지: 크리스마스 캐럴', '2026-11-11', 'https://cf.lottecinema.co.kr/Media/MovieFile/MovieImg/202611/24744_101_1.jpg', 0.94],
            ['25189', '마리 앙투아네트', '2026-11-11', 'https://cf.lottecinema.co.kr/Media/MovieFile/MovieImg/202611/25189_101_1.jpg', 0.57],
            ['25010', '와일드 호스 나인', '2026-11-04', 'https://cf.lottecinema.co.kr/Media/MovieFile/MovieImg/202611/25010_101_1.jpg', 0.57],
            ['25022', '여전히 찬란하게', '2026-10-21', 'https://cf.lottecinema.co.kr/Media/MovieFile/MovieImg/202610/25022_101_1.jpg', 0.5],
            ['24128', '오디세이', '2026-08-05', 'https://cf.lottecinema.co.kr/Media/MovieFile/MovieImg/202607/24128_101_1.jpg', 0.45],
            ['24654', '타짜: 벨제붑의 노래', '2026-09-23', 'https://cf.lottecinema.co.kr/Media/MovieFile/MovieImg/202609/24654_101_1.jpg', 0.45],
            ['14171', '알라딘', '2026-11-09', 'https://cf.lottecinema.co.kr/Media/MovieFile/MovieImg/201905/14171_101_1.jpg', 0.35],
            ['25095', '호루몽', '2026-11-11', 'https://cf.lottecinema.co.kr/Media/MovieFile/MovieImg/202611/25095_101_1.jpg', 0.34],
            ['25065', '프레셔', '2026-11-11', 'https://cf.lottecinema.co.kr/Media/MovieFile/MovieImg/202611/25065_101_1.jpg', 0.3],
            ['25138', '삼춘, 어디 감수광?', '2026-11-11', 'https://cf.lottecinema.co.kr/Media/MovieFile/MovieImg/202611/25138_101_1.jpg', 0.18],
            ['24623', '암살자(들)', '2026-09-23', 'https://cf.lottecinema.co.kr/Media/MovieFile/MovieImg/202609/24623_101_1.jpg', 0.15],
            ['13319', '보헤미안 랩소디', '2026-11-09', 'https://cf.lottecinema.co.kr/Media/MovieFile/MovieImg/201810/13319_101_1.jpg', 0.1]
        ].map(([movieCode, title, releaseDate, posterPath, reservationRate], index) => ({
            movieCode, title, releaseDate, posterPath, reservationRate, rank: index + 1, source: 'lotte'
        }))
    };

    /* 메가박스 대체 목록 — file:// 실행이나 메가박스 API를 못 쓸 때 표시.
       로컬 서버(js/server.py)로 실행하면 /api/megabox-chart 에서 메가박스 실시간 예매율 순위로 바뀐다. */
    const FALLBACK_MEGABOX_CHART = {
        asOf: '2026-11-23',
        movies: [
            ['폭설', '2026-11-18', 16.7, 'https://admin.moviechart.co.kr/assets/upload/poster/261104235918_1514.jpg'],
            ['극장판 치이카와: 인어 섬의 비밀', '2026-09-30', 10.0],
            ['폴2: 데드포인트', '2026-11-11', 2.7],
            ['최종면접', '2026-11-04', 1.9],
            ['극장판 마카앤로니: 기억탐험 대소동!', '2026-11-14', 1.4, 'https://admin.moviechart.co.kr/assets/upload/poster/261106001609_6514.jpg'],
            ['명탐정 코난: 30호 살인 사건', '2026-11-05', 1.2],
            ['아름다운 초저녁달', '2026-11-18', 1.0, 'https://admin.moviechart.co.kr/assets/upload/poster/261111001854_4711.jpg'],
            ['극장판 마법소녀 마도카 마기카 ＜발푸르기스의 회천＞', '2026-11-04', 1.0],
            ['암살자(들)', '2026-09-23', 0.8],
            ['와일드 호스 나인', '2026-11-04', 0.7],
            ['여전히 찬란하게', '2026-10-21', 0.6],
            ['룩백', '2026-10-08', 0.6, 'https://admin.moviechart.co.kr/assets/upload/movie/260928021221_7056.jpg'],
            ['모자 쓴 고양이', '2026-11-06', 0.6, 'https://admin.moviechart.co.kr/assets/upload/movie/261028001809_8845.jpg'],
            ['하트 오브 비스트', '2026-10-28', 0.5],
            ['스크루지: 크리스마스 캐럴', '2026-11-11', 0.4],
            ['옆에서 숨만 쉬어도 좋아', '2026-11-18', 0.4, 'https://admin.moviechart.co.kr/assets/upload/movie/261029040514_4717.jpg'],
            ['실낙원', '2026-10-21', 0.3, 'https://admin.moviechart.co.kr/assets/upload/movie/261008003210_2858.jpg'],
            ['극장판 카드캡터 체리 : 봉인된 카드', '2026-11-11', 0.2, 'https://admin.moviechart.co.kr/assets/upload/poster/261106001346_4836.jpg'],
            ['흐르는 여정', '2026-10-28', 0.2, 'https://admin.moviechart.co.kr/assets/upload/movie/261006052216_8039.jpg'],
            ['타짜: 벨제붑의 노래', '2026-09-23', 0.1]
        ].map(([title, releaseDate, reservationRate, posterPath = ''], index) => ({
            movieCode: String(index + 1), title, releaseDate, posterPath, reservationRate, rank: index + 1, source: 'megabox', isFallback: true
        }))
    };
    const CHART_PROVIDERS = {
        cgv: { name: 'CGV', chartName: 'CGV 무비차트', site: 'https://cgv.co.kr/' },
        lotte: { name: '롯데시네마', chartName: '롯데시네마 무비차트', site: 'https://www.lottecinema.co.kr/NLCHS/Movie/List?flag=1' },
        megabox: { name: '메가박스', chartName: '메가박스 무비차트', site: 'https://www.megabox.co.kr/movie' }
    };
    /* 롯데시네마·메가박스 전용 영화의 상세 화면용 숫자 id (TMDB·CGV id와 겹치지 않는 구간) */
    const CHART_ID_BASE = { lotte: 800000000, megabox: 900000000 };

    /* 지금 상영 중인 영화 줄거리 (영화관 순위 데이터에는 줄거리가 없는 경우가 많아 제목으로 채운다) */
    const CHART_SYNOPSES = {
        "폭설": "정년퇴임을 하루 앞둔 역장 갑수는 마지막 열차를 보내고 오랫동안 지켜 온 설로역을 떠날 준비를 한다. 그런데 폭설로 후임자의 도착이 늦어지며 역은 고립되고, 다음 날 나타난 후임자는 어딘가 수상하다. 불안한 인수인계가 이어지던 중 정체를 알 수 없는 시신이 발견된다.",
        "극장판 마카앤로니: 기억탐험 대소동!": "늘 티격태격하지만 둘도 없는 단짝 마카와 로니. 사소한 오해로 크게 다툰 로니는 발명품으로 마카에 대한 기억을 지워 버리려다, 오히려 마카와 함께한 기억 속으로 빨려 들어간다. 뒤엉킨 기억 속에서 두 친구는 서로의 진심을 확인하고 무사히 돌아올 수 있을까.",
        "아름다운 초저녁달": "학교에서 여학생들의 '왕자님'으로 불리는 요이 앞에, 또 한 명의 '왕자님' 코하쿠가 나타난다. 코하쿠는 거침없이 다가와 시험 삼아 사귀어 보자며 계약 연애를 제안하고, 사랑을 모르는 소년과 사랑과는 거리가 멀다고 여겨 온 소녀의 설레는 연애가 시작된다.",
        "룩백": "학교 신문에 네 컷 만화를 그리며 자신감이 넘치는 후지노와, 그녀를 동경하지만 방 밖으로 나서지 못하는 쿄모토. 만화가 전부였던 시절, 두 소녀가 함께 보낸 사계절과 \"왜 만화를 그리는가\"라는 질문을 담은 고레에다 히로카즈 감독의 실사 영화.",
        "모자 쓴 고양이": "상상력과 영감을 맡은 비밀 기관의 요원 모자 쓴 고양이는 새 동네에 적응하지 못하는 남매 가비와 세바스찬에게 웃음을 되찾아 주라는 임무를 받는다. 하지만 사고뭉치 고양이는 집을 엉망으로 만들고 마법 시계까지 잃어버리고, 남매와 함께 시계를 찾는 모험에 나선다.",
        "옆에서 숨만 쉬어도 좋아": "웹툰 작가 지망생 화란과 래퍼를 꿈꾸는 이완은 대출까지 받아 마련한 집의 보증금을 사기로 날리고, 창문 하나 없는 지하 2층 방으로 밀려난다. 집도 돈도 잃고 서로만 남은 두 사람은 꿈과 사랑을 지키며 이곳을 벗어날 수 있을까.",
        "실낙원": "9년 전 캠핑스쿨 버스 실종 사고로 아들을 잃은 소영은 AI 프로그램 속 어린 아들을 만나며 하루하루를 버텨 왔다. 그러던 어느 날 죽은 줄 알았던 아들 선우가 돌아오지만, 상처투성이 몸과 차가운 눈빛의 아들에게서 기억 속 아이를 찾지 못한 소영은 점점 드러나는 진실에 흔들린다.",
        "극장판 카드캡터 체리 : 봉인된 카드": "6학년이 된 체리와 친구들은 마을 축제 연극 준비로 바쁘다. 홍콩으로 돌아갔던 샤오랑과 다시 만난 체리는 아직 전하지 못한 마음을 고백하려 하지만, 그 순간 이미 봉인했어야 할 크로우 카드의 기운이 나타나 새로운 사건이 시작된다.",
        "흐르는 여정": "남편을 떠나보낸 춘희는 남편이 남긴 피아노와 자동차를 가지고 아파트로 이사한다. 조용하던 일상은 독일에서 온 지휘자 민준, 피아니스트를 꿈꾸는 소년 성찬을 만나며 조금씩 달라지고, 봄에서 가을로 계절이 흐르는 동안 그녀가 오래 계획해 온 여행도 다가온다.",
        "극장판 마법소녀 마도카 마기카 ＜발푸르기스의 회천＞": "마도카를 붙잡기 위해 스스로 악마가 되어 세계를 다시 만든 호무라. 소원을 이뤄 준다는 소문과 소울 젬 없는 소녀의 마수 사냥이 이어지던 미타키하라에 발푸르기스의 밤과 원환의 이치를 찾는 마법소녀들이 나타나고, 마법소녀들의 운명이 다시 움직이기 시작한다. 신보 아키유키 감독의 극장판.",
        "폴2: 데드포인트": "해발 3,300m, 수십 년간 출입이 금지된 가장 위험한 산 '콴'. 숨쉬기조차 힘들고 한 번의 실수가 곧 죽음으로 이어지는 그곳에서 벌어지는 극한의 생존 스릴러. 〈폴: 600미터〉 제작진의 후속작.",
        "그대, 별처럼": "세토 내해의 아름다운 섬. 섬으로 전학 온 카이와 섬에서 자란 아키미는 각자 힘든 가정환경 속에서 서로에게 유일한 버팀목이 되어 사랑에 빠진다. 꿈을 위해 도쿄로 떠난 카이와 가족을 위해 섬에 남은 아키미, 15년에 걸친 두 사람의 사랑과 선택을 그린다.",
        "포드 V 페라리": "1960년대, 르망 24시 레이스에서 페라리를 꺾으려는 포드는 카레이서 출신 자동차 디자이너 캐롤 셸비에게 도움을 청한다. 셸비는 거침없는 레이서 켄 마일스와 함께 회사의 간섭에 맞서며 전설의 레이싱카를 만들어 내고, 마침내 르망에 도전한다. 실화를 바탕으로 한 영화.",
        "스크루지: 크리스마스 캐럴": "크리스마스를 성가신 날로만 여기는 괴팍한 구두쇠 스크루지. 크리스마스이브에 죽은 동업자의 유령에게 끔찍한 운명을 경고받은 그는 과거, 현재, 미래의 유령을 차례로 만나며 자신의 삶을 돌아보는 기묘한 여정에 나선다. 조니 뎁이 스크루지를 연기한다.",
        "마리 앙투아네트": "오스트리아의 공주 마리 앙투아네트는 동맹을 위해 프랑스 황태자 루이 16세와 결혼해 베르사유에 들어선다. 새로운 삶에 설렌 것도 잠시, 무관심한 남편과 귀족들의 시기 속에서 점점 외로워진 그녀의 화려하고도 쓸쓸한 궁정 생활을 그린 소피아 코폴라 감독의 작품.",
        "여전히 찬란하게": "오랫동안 찾아 헤맨 단짝 정임을 다시 만난 순옥은, 어린 시절 함께 꿈꾸던 노래자랑에 나가려고 서울행을 결심한다. 하지만 정임은 이름과 꿈, 함께한 추억까지 조금씩 잊어 가고 있다. 1942년 시골 마을에서 시작된 두 소녀의 우정과 그 시절의 상처를 따라가는 이야기.",
        "타짜: 벨제붑의 노래": "학창 시절부터 절친한 장태영과 박태영은 온라인 카지노 사업으로 승승장구하지만, 성공이 커질수록 질투는 배신으로 변한다. 나락에 떨어졌다 살아남은 장태영은 전설의 타짜에게 포커를 배우고, 일본과 베트남의 거물들이 모인 거액의 도박판에서 두 친구는 다시 마주한다.",
        "알라딘": "아그라바 왕국의 좀도둑 알라딘은 우연히 만난 자스민 공주에게 반한다. 사악한 재상 자파의 계략으로 마법 동굴에 들어간 알라딘은 세 가지 소원을 들어주는 램프의 지니를 만나고, 왕자로 변신해 공주의 마음을 얻으려 하지만 자파의 음모가 왕국을 위협한다.",
        "호루몽": "2017년 일본 지상파 방송의 가짜 뉴스로 하루아침에 공격의 대상이 된 재일 코리안 3세 신숙옥. 할머니와 어머니로 이어진 100년의 역사를 품고 그녀는 물러서지 않는 싸움을 시작하고, 끝내 배상 판결과 방송 폐지를 이끌어 낸다. 그 싸움의 기록을 담은 다큐멘터리.",
        "프레셔": "역사상 최대 규모의 상륙작전을 72시간 앞둔 연합군 지휘부. 기상학자 스태그는 D-Day 당일 치명적인 폭풍우를 예보하고, 최고 사령관 아이젠하워는 작전을 강행할지 멈출지 극한의 선택에 내몰린다. 수십만 명의 목숨이 걸린 날씨 예보를 둘러싼 심리 스릴러.",
        "삼춘, 어디 감수광?": "몸이 불편한 제주어 가수 정원은 관객 없는 제주 오일장 무대에서 묵묵히 버스킹을 이어 간다. 그의 노래를 카메라에 담는 영화감독 윤호, 당찬 무명 배우 미정과 함께 예술을 하는 이유에 대한 답을 찾아 서울로 떠나는 유쾌한 힐링 버스킹 여정.",
        "보헤미안 랩소디": "공항에서 수하물 노동자로 일하던 파록 버사라는 밴드에 합류해 프레디 머큐리라는 이름으로 무대에 선다. 퀸은 틀을 깨는 음악으로 세계적인 밴드가 되지만 프레디는 점점 고립되고, 마침내 라이브 에이드 무대에서 전설적인 공연을 펼친다. 퀸과 프레디 머큐리의 이야기를 그린 음악 영화.",
        "라라랜드": "재즈 피아니스트 세바스찬과 배우 지망생 미아는 꿈을 좇는 도시 로스앤젤레스에서 우연히 만나 사랑에 빠진다. 서로의 꿈을 응원하며 계절을 함께 보내지만, 성공에 가까워질수록 두 사람은 사랑과 꿈 사이에서 선택의 갈림길에 선다.",
        "헝거게임 50번째 추첨의 날": "캐피톨을 조롱해 역대 최하점을 받은 가난한 소년 헤이미치. 모두가 그가 가장 먼저 죽으리라 예상하지만, 48명이 맹독의 숲에 던져진 50번째 헝거게임에서 그는 다른 참가자가 아닌 게임의 시스템 자체를 무너뜨릴 계획을 세운다.",
        "와일드 호스 나인": "1973년, 수십 년간 함께 비밀 작전을 수행해 온 CIA 베테랑 요원 크리스와 리가 이스터섬으로 향한다. 은퇴를 앞두고 회고록을 준비하는 크리스를 감시하라는 명령을 받은 리. 칠레 대학생들과 얽히며 두 사람의 마지막 임무는 뜻밖의 방향으로 흘러간다. 마틴 맥도나 감독 작품.",
        "하트 오브 비스트": "비행기 사고로 알래스카 오지에 고립된 전직 특수부대원 제임스. 곁에 남은 것은 함께 은퇴한 군견 오딘뿐이다. 끊임없이 목숨을 위협하는 자연 속에서 서로만을 의지한 채 살아남기 위해 싸우는 생존 드라마.",
        "암살자(들)": "1974년 8월 15일, 대한민국을 충격에 빠뜨린 영부인 저격 사건. 그날의 의혹과 배후를 끝까지 추적하는 이야기를 허진호 감독이 그린다.",
        "헥스: 마녀왕국": "마법을 막는 팔찌가 우연히 풀리면서 숨겨진 힘에 눈뜬 소녀 빌리는 마녀들의 세계 헥스로 들어선다. 무엇이든 될 수 있는 헥스에 빠져들던 빌리는 자신을 둘러싼 예언과 엄마의 비밀을 알게 되고, 위기에 빠진 헥스와 엄마를 구하기 위해 나선다.",
        "너의 췌장을 먹고 싶어": "병원에서 우연히 주운 문고본 『공병문고』. 그것은 반 친구 사쿠라가 췌장 병으로 남은 시간이 얼마 없다는 사실을 적어 둔 일기였다. 비밀을 알게 된 소년과 하루하루를 밝게 살아가는 사쿠라가 함께 보내는 특별한 시간을 그린 애니메이션."
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
    const formatRating = (rating) => Number(rating).toFixed(1).replace(/\.0$/, '');
    const isValidPassword = (s) => /^(?=.*[A-Za-z])(?=.*\d)\S{8,64}$/.test(s);
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
    function posterHtml(title, path, cls = '', badge = '', badgeClass = '', source = '') {
        const imagePath = path && /^https?:\/\//i.test(path) ? path : path ? ROOT + path : '';
        const fallbacks = imagePath ? posterFallbacks(imagePath, title) : [];
        /* referrerpolicy=no-referrer: 영화관 이미지 서버가 다른 사이트(127.0.0.1 등)에서 온 요청을 막지 않도록 출처를 보내지 않는다 */
        const img = imagePath ? `<img src="${esc(imagePath)}" alt="${esc(title)} 포스터" loading="lazy" decoding="async" referrerpolicy="no-referrer"${fallbacks.length ? ` data-fallback="${esc(fallbacks.join('|'))}"` : ''}>` : '';
        const sourceLabel = source === 'json' ? 'JSON 파일' : CHART_PROVIDERS[source]?.name || 'API';
        const sourceLetter = { json: 'J', cgv: 'C', lotte: 'L', megabox: 'M' }[source] || 'A';
        const sourceMark = source ? `<span class="movie-source movie-source--${source}" title="${sourceLabel}에서 불러옴" aria-label="${sourceLabel}에서 불러옴">${sourceLetter}</span>` : '';
        return `<div class="poster ${cls}"><span class="poster__t">${esc(title)}</span>${img}${badge ? `<span class="badge ${badgeClass}">${badge}</span>` : ''}${sourceMark}</div>`;
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
    /* 포스터가 안 열릴 때 차례로 시도할 다른 주소
       롯데시네마: 같은 포스터의 다른 크기 파일 → 앱 데이터(TMDB·JSON)에 있는 같은 제목 영화 포스터 */
    const LOTTE_POSTER_RE = /(lottecinema\.co\.kr\/Media\/MovieFile\/MovieImg\/\d+\/\d+)_(\d{3})_(\d+)\.(jpe?g|png)$/i;
    function posterFallbacks(src, title) {
        const list = [];
        const lotte = String(src).match(LOTTE_POSTER_RE);
        if (lotte) {
            ['101', '103', '102', '503', '104'].filter((code) => code !== lotte[2])
                .forEach((code) => list.push(String(src).replace(LOTTE_POSTER_RE, `$1_${code}_$3.$4`)));
        }
        const key = normalizeTitle(title);
        if (key && (lotte || /megabox|cgv/i.test(String(src)))) {
            const same = (data.movies || []).find((m) => m.posterPath && normalizeTitle(m.title) === key && !LOTTE_POSTER_RE.test(m.posterPath));
            if (same) list.push(/^https?:\/\//i.test(same.posterPath) ? same.posterPath : ROOT + same.posterPath);
        }
        return list.filter((url, i) => url && url !== src && list.indexOf(url) === i);
    }
    document.addEventListener('error', (e) => {
        const img = e.target;
        if (img.tagName !== 'IMG') return;
        const rest = (img.dataset.fallback || '').split('|').filter(Boolean);
        if (rest.length) {
            img.dataset.fallback = rest.slice(1).join('|');
            img.src = rest[0];
            return;
        }
        img.classList.add('is-broken');
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
    const data = {
        movies: [], genres: [], samples: [], cgvMovies: [], lotteMovies: [], megaboxMovies: [], activeChartProvider: 'cgv',
        tickets: [], favorites: [], user: null
    };
    const movieById = (id) => data.movies.find((m) => m.movieId === id) ||
        data.lotteMovies.find((m) => m.movieId === id) ||
        data.megaboxMovies.find((m) => m.movieId === id);
    const normalizeTitle = (title) => String(title || '').toLocaleLowerCase('ko-KR').replace(/[\s:：·☆★\-<>＜＞〈〉()!！]/g, '');
    const SYNOPSIS_BY_TITLE = new Map(Object.entries(CHART_SYNOPSES).map(([title, text]) => [normalizeTitle(title), text]));
    const synopsisFor = (title) => SYNOPSIS_BY_TITLE.get(normalizeTitle(title)) || '';
    /* 줄거리가 비어 있는 영화를 채운다 (앱 데이터 → 같은 제목의 다른 영화 → 줄거리 모음 순) */
    function fillMissingOverviews(list) {
        list.forEach((movie) => {
            if ((movie.overview || '').trim()) return;
            movie.overview = synopsisFor(movie.title) || '';
        });
    }
    const chartMovies = (provider) => (provider === 'lotte' ? data.lotteMovies : provider === 'megabox' ? data.megaboxMovies : data.cgvMovies) || [];
    const chartMovieHref = (movie, provider) => `${url('movie')}?movieId=${encodeURIComponent(movie.movieId)}&chart=${provider}`;
    const genreName = (id) => (data.genres.find((g) => g.id === id) || {}).name || '';
    const myTickets = () => (data.user ? data.tickets.filter((t) => t.userId === data.user.userId) : []);

    /* =====================================================
       인증 · 티켓 저장 계층 (닉네임 + 비밀번호)
       - 클라우드 모드: Supabase Postgres. 비밀번호는 DB에서 bcrypt 해시로만 저장하고,
         로그인하면 받은 세션 토큰으로 DB 함수(film_*)를 호출한다. 테이블 직접 접근은 막혀 있다.
       - 기기 저장 모드: 설정 전/연결 실패 시. 비밀번호는 평문 대신 PBKDF2-SHA256 해시(+솔트)만 저장한다.
       화면 코드는 아래 backend 함수만 호출하므로 저장 방식이 바뀌어도 화면 코드는 그대로다.
       ===================================================== */
    const cloud = (() => {
        if (!SUPABASE_CONFIG.url || !SUPABASE_CONFIG.anonKey) return null;
        if (!window.supabase?.createClient) {
            console.warn('Supabase 라이브러리를 불러오지 못해 기기 저장 모드로 동작합니다.');
            return null;
        }
        try {
            return window.supabase.createClient(SUPABASE_CONFIG.url, SUPABASE_CONFIG.anonKey, {
                auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false }
            });
        } catch (error) {
            console.warn('Supabase 연결 설정이 올바르지 않아 기기 저장 모드로 동작합니다.', error);
            return null;
        }
    })();
    const isCloud = Boolean(cloud);

    class AuthError extends Error {}
    /* 가입되지 않은 닉네임으로 로그인했을 때 — 로그인 화면에서 회원가입 안내를 띄운다 */
    class NotRegisteredError extends AuthError {}
    const AUTH_MESSAGES = {
        NOT_REGISTERED: '아직 가입하지 않은 닉네임이에요.',
        WRONG_PASSWORD: '비밀번호가 맞지 않아요.',
        NICKNAME_TAKEN: '이미 사용 중인 닉네임이에요.',
        WEAK_PASSWORD: '비밀번호는 영문자와 숫자를 조합해 8자 이상 입력해 주세요.',
        INVALID_NICKNAME: '닉네임은 1~20자로 입력해 주세요.',
        SESSION_EXPIRED: '로그인이 만료되었어요. 다시 로그인해 주세요.',
        TICKET_NOT_FOUND: '티켓을 찾을 수 없어요.',
        INVALID_MOVIE: '영화 정보를 찾을 수 없어요.'
    };
    function toAuthError(error) {
        const msg = String(error?.message || error || '');
        const code = Object.keys(AUTH_MESSAGES).find((key) => msg.includes(key));
        if (code === 'NOT_REGISTERED') return new NotRegisteredError(AUTH_MESSAGES[code]);
        if (code === 'SESSION_EXPIRED') local.del(STORE.session);
        if (code) return new AuthError(AUTH_MESSAGES[code]);
        if (/could not find the function|PGRST202/i.test(msg)) return new AuthError('DB 설정이 끝나지 않았어요. readme 4.1의 SQL을 Supabase에서 실행해 주세요.');
        if (/fetch|network|failed to/i.test(msg)) return new AuthError('서버에 연결하지 못했어요. 인터넷 연결을 확인해 주세요.');
        return new AuthError('처리 중 문제가 생겼어요. 잠시 후 다시 시도해 주세요.');
    }
    async function rpc(name, args) {
        let result;
        try {
            result = await cloud.rpc(name, args);
        } catch (error) {
            throw toAuthError(error);
        }
        if (result.error) throw toAuthError(result.error);
        return result.data;
    }
    const sessionToken = () => local.get(STORE.session, '');

    /* 기기 저장 모드 비밀번호 해시 (Web Crypto PBKDF2) */
    const PBKDF2_ITERATIONS = 210000;
    const toHex = (buffer) => Array.from(new Uint8Array(buffer), (b) => b.toString(16).padStart(2, '0')).join('');
    const fromHex = (hex) => new Uint8Array(hex.match(/../g).map((h) => parseInt(h, 16)));
    async function hashPassword(password, saltHex = toHex(crypto.getRandomValues(new Uint8Array(16))), iterations = PBKDF2_ITERATIONS) {
        if (!crypto.subtle) throw new AuthError('이 주소에서는 비밀번호를 안전하게 저장할 수 없어요. localhost 또는 https 주소로 열어 주세요.');
        const key = await crypto.subtle.importKey('raw', new TextEncoder().encode(password), 'PBKDF2', false, ['deriveBits']);
        const bits = await crypto.subtle.deriveBits({ name: 'PBKDF2', salt: fromHex(saltHex), iterations, hash: 'SHA-256' }, key, 256);
        return { salt: saltHex, passwordHash: toHex(bits), iterations };
    }
    const sameHash = (a, b) => a.length === b.length && [...a].reduce((diff, ch, i) => diff | (ch.charCodeAt(0) ^ b.charCodeAt(i)), 0) === 0;
    const sameNickname = (a, b) => String(a || '').trim().toLocaleLowerCase() === String(b || '').trim().toLocaleLowerCase();
    /* 예전 버전이 평문으로 저장한 비밀번호를 해시로 바꾸고 평문은 지운다 */
    async function migrateLocalPasswords() {
        const users = local.get(STORE.users, []);
        if (!users.some((u) => typeof u.password === 'string')) return;
        if (!crypto.subtle) return;
        const upgraded = await Promise.all(users.map(async (user) => {
            if (typeof user.password !== 'string') return user;
            const { password, ...rest } = user;
            return { ...rest, ...(await hashPassword(password)) };
        }));
        local.set(STORE.users, upgraded);
    }

    const backend = {
        mode: isCloud ? 'cloud' : 'local',

        /* 이 기기에서 가입하거나 로그인한 적이 있는지 — 처음이면 로그인 화면이 회원가입부터 보여 준다 */
        hasAccountOnDevice() {
            return local.get(STORE.hasAccount, false) === true || (!isCloud && local.get(STORE.users, []).length > 0);
        },

        /* 현재 로그인 사용자 { userId, nickname } 또는 null */
        async currentUser() {
            if (!isCloud) return local.get(STORE.user, null);
            const token = sessionToken();
            if (!token) return null;
            const me = await rpc('film_me', { p_token: token });
            if (!me) { local.del(STORE.session); return null; }
            return me;
        },

        async signUp({ nickname, password }) {
            if (!isCloud) {
                const users = local.get(STORE.users, []);
                if (users.some((u) => sameNickname(u.nickname, nickname))) throw new AuthError(AUTH_MESSAGES.NICKNAME_TAKEN);
                const user = { userId: uid(), nickname, ...(await hashPassword(password)) };
                users.push(user);
                local.set(STORE.users, users);
                const publicUser = { userId: user.userId, nickname };
                local.set(STORE.user, publicUser);
                local.set(STORE.hasAccount, true);
                return { user: publicUser };
            }
            const result = await rpc('film_signup', { p_nickname: nickname, p_password: password });
            local.set(STORE.session, result.token);
            local.set(STORE.hasAccount, true);
            return { user: result.user };
        },

        async signIn({ nickname, password }) {
            if (!isCloud) {
                const found = local.get(STORE.users, []).find((u) => sameNickname(u.nickname, nickname));
                if (!found) throw new NotRegisteredError(AUTH_MESSAGES.NOT_REGISTERED);
                const { passwordHash } = await hashPassword(password, found.salt, found.iterations || PBKDF2_ITERATIONS);
                if (!sameHash(passwordHash, found.passwordHash || '')) throw new AuthError(AUTH_MESSAGES.WRONG_PASSWORD);
                const publicUser = { userId: found.userId, nickname: found.nickname };
                local.set(STORE.user, publicUser);
                local.set(STORE.hasAccount, true);
                return { user: publicUser };
            }
            const result = await rpc('film_login', { p_nickname: nickname, p_password: password });
            local.set(STORE.session, result.token);
            local.set(STORE.hasAccount, true);
            return { user: result.user };
        },

        async signOut() {
            if (isCloud) {
                const token = sessionToken();
                local.del(STORE.session);
                if (token) { try { await rpc('film_logout', { p_token: token }); } catch { /* 네트워크 오류여도 이 기기에서는 로그아웃 */ } }
                return;
            }
            local.del(STORE.user);
        },

        /* 로그인한 사용자의 티켓 전체 (기기 저장 모드는 이 기기의 모든 티켓 — 화면에서 내 것만 거른다) */
        async loadMyTickets(user) {
            if (!user) return [];
            if (!isCloud) return local.get(STORE.tickets, []);
            return rpc('film_my_tickets', { p_token: sessionToken() });
        },

        /* 새 티켓이면 추가, ticketId가 있으면 수정. 저장된 티켓을 돌려준다 */
        async saveTicket(fields, ticketId) {
            if (!isCloud) {
                const all = local.get(STORE.tickets, []);
                let ticket = ticketId && all.find((t) => t.ticketId === ticketId && t.userId === data.user.userId);
                if (ticket) Object.assign(ticket, fields);
                else { ticket = { ticketId: uid(), userId: data.user.userId, createdAt: new Date().toISOString(), ...fields }; all.push(ticket); }
                local.set(STORE.tickets, all);
                return ticket;
            }
            return rpc('film_save_ticket', { p_token: sessionToken(), p_ticket: fields, p_ticket_id: ticketId || null });
        },

        async saveTickets(list) {
            if (!list.length) return [];
            if (!isCloud) {
                const created = list.map((fields) => ({ ticketId: uid(), userId: data.user.userId, createdAt: new Date().toISOString(), ...fields }));
                local.set(STORE.tickets, [...local.get(STORE.tickets, []), ...created]);
                return created;
            }
            return rpc('film_save_tickets', { p_token: sessionToken(), p_tickets: list });
        },

        async deleteTicket(ticketId) {
            if (!isCloud) {
                local.set(STORE.tickets, local.get(STORE.tickets, []).filter((t) => !(t.ticketId === ticketId && t.userId === data.user.userId)));
                return;
            }
            await rpc('film_delete_ticket', { p_token: sessionToken(), p_ticket_id: ticketId });
        },

        /* 찜한 영화 목록 [{ movieId, movieTitle, posterUrl, chartKey, createdAt }] (최근에 찜한 순) */
        async loadFavorites(user) {
            if (!user) return [];
            if (!isCloud) {
                return local.get(STORE.favorites, [])
                    .filter((f) => f.userId === user.userId)
                    .sort((a, b) => String(b.createdAt).localeCompare(String(a.createdAt)));
            }
            return rpc('film_my_favorites', { p_token: sessionToken() });
        },

        /* 찜하기(on=true) / 해제(on=false) */
        async setFavorite(movie, on) {
            if (!isCloud) {
                const all = local.get(STORE.favorites, []).filter((f) => !(f.userId === data.user.userId && f.movieId === movie.movieId));
                if (on) all.push({ ...movie, userId: data.user.userId, createdAt: new Date().toISOString() });
                local.set(STORE.favorites, all);
                return on ? movie : null;
            }
            return rpc('film_set_favorite', { p_token: sessionToken(), p_movie: movie, p_on: on });
        },

        /* 영화 상세의 FILM LOG 관객 리뷰: 공개로 저장된 한줄평 [{ author, oneLineReview, rating, watchedAt, createdAt }] */
        async publicReviews(movieId) {
            if (!isCloud) {
                const users = local.get(STORE.users, []);
                return local.get(STORE.tickets, [])
                    .filter((t) => t.movieId === movieId && t.isPublic === true && t.oneLineReview?.trim())
                    .map((t) => ({ ...t, author: users.find((u) => u.userId === t.userId)?.nickname || '관객' }));
            }
            try {
                return await rpc('film_public_reviews', { p_movie_id: movieId });
            } catch (error) {
                console.warn('공개 리뷰를 불러오지 못했습니다.', error);
                return [];
            }
        }
    };

    /* 클라우드로 바꾼 뒤 처음 로그인했을 때: 이 기기에만 있던 예전 티켓을 계정으로 옮길지 묻는다 */
    async function offerLocalTicketMigration(user) {
        if (!isCloud || !user) return;
        const legacyUser = local.get(STORE.user, null);
        const legacy = local.get(STORE.tickets, []).filter((t) => legacyUser && t.userId === legacyUser.userId);
        if (!legacy.length || local.get('ticketbook.migrationDeclined', '') === legacyUser.userId) return;
        const ok = await confirmDialog(`이 기기에만 저장된 티켓 ${legacy.length}장이 있어요.\n내 계정(클라우드)으로 옮길까요?`, '옮기기');
        if (!ok) { local.set('ticketbook.migrationDeclined', legacyUser.userId); return; }
        await backend.saveTickets(legacy.map(({ ticketId, userId, createdAt, ...fields }) => fields));
        local.set(STORE.tickets, local.get(STORE.tickets, []).filter((t) => t.userId !== legacyUser.userId));
        local.del(STORE.user);
    }

    /* 영화관 순위 실시간 갱신
       CGV·롯데시네마·메가박스 사이트는 브라우저에서 직접 부를 수 없어(CORS) js/server.py 가 대신 받아 온다.
       - http://127.0.0.1:8000 으로 열면 같은 서버의 /api/*-chart 를 부른다.
       - index.html 을 파일로 바로 열어도 server.py 가 켜져 있으면 http://127.0.0.1:8000 에서 받아 온다.
       - 서버가 꺼져 있으면 앱에 들어 있는 대체 순위를 보여 준다.
       화면에 들어올 때마다(뒤로 가기로 돌아오거나 탭을 다시 볼 때 포함) 새로 요청하고, 홈에서는 1분마다 다시 확인한다. */
    const CGV_CHART_REFRESH_MS = 60 * 1000;
    /* 실시간 순위는 영화관 사이트와 똑같이 보이도록 받은 순서·목록을 그대로 쓰고,
       앱에 들어 있는 대체 순위만 개봉한 영화로 거르고 예매율 순으로 정렬한다 */
    const validReleaseDate = (value) => {
        if (!/^\d{4}-\d{2}-\d{2}$/.test(value || '')) return false;
        const d = new Date(`${value}T00:00:00`);
        return !Number.isNaN(d.getTime()) && ymd(d) === value;
    };
    const keepChartMovie = (chart, movie) => (chart.isLive === true
        ? !movie.releaseDate || validReleaseDate(movie.releaseDate)
        : validReleaseDate(movie.releaseDate) && movie.releaseDate <= ymd(today));
    const siteRank = (movie) => Number(movie.cgvChartRank || movie.rank) || Infinity;
    const CHART_API_BASE = location.protocol === 'file:' ? 'http://127.0.0.1:8000/' : ROOT;
    const CHART_FETCH_TIMEOUT_MS = 8000;
    const CHART_CACHE_KEY = 'ticketbook.liveCharts.v2';
    try { localStorage.removeItem('ticketbook.liveCharts'); } catch (e) { /* 이전 버전이 저장한 순위(테스트 데이터 포함)는 버린다 */ }
    /* 마지막으로 받은 실시간 순위(24시간 이내)를 먼저 보여 주고, 새 순위는 뒤에서 받아 바꾼다 */
    /* data/live-charts.js 를 다시 읽는다 (화면에 다시 들어오거나 홈에서 1분마다) */
    function reloadLiveChartsFile() {
        return new Promise((resolve) => {
            const script = document.createElement('script');
            script.src = `${ROOT}data/live-charts.js?t=${Date.now()}`;
            script.onload = script.onerror = () => {
                script.remove();
                const before = JSON.stringify([data.cgvChartUpdatedAt, data.lotteChartUpdatedAt, data.megaboxChartUpdatedAt]);
                mergeCachedLiveCharts();
                const after = JSON.stringify([data.cgvChartUpdatedAt, data.lotteChartUpdatedAt, data.megaboxChartUpdatedAt]);
                if (before !== after) {
                    if (page === 'home') { renderCinemaChart(); renderCommunityReviews(); }
                    else if (typeof data.onChartsUpdated === 'function') data.onChartsUpdated();
                }
                resolve();
            };
            document.head.appendChild(script);
        });
    }

    function mergeCachedLiveCharts() {
        // data/live-charts.js: server.py(자동 갱신 예약 작업 포함)가 저장한 최신 순위. 파일로 열어도 <script>로 읽힌다
        const fileCharts = (window.MINPLY_LIVE_CHARTS && typeof window.MINPLY_LIVE_CHARTS === 'object') ? window.MINPLY_LIVE_CHARTS : {};
        const cache = local.get(CHART_CACHE_KEY, {});
        const time = (chart) => new Date(chart?.updatedAt || 0).getTime() || 0;
        const usable = (chart) => chart && chart.isLive === true && Array.isArray(chart.movies) && chart.movies.length > 0;
        const newest = (key) => [fileCharts[key], cache[key]].filter(usable).sort((a, b) => time(b) - time(a))[0];
        const merges = { cgv: mergeCgvChart, lotte: mergeLotteChart, megabox: mergeMegaboxChart };
        Object.entries(merges).forEach(([key, merge]) => {
            const chart = newest(key);
            if (!chart) return;
            try { merge(chart); } catch (error) { console.warn(`${key} 저장 순위를 읽지 못했습니다.`, error); }
        });
    }
    async function fetchChart(name) {
        const controller = new AbortController();
        const timer = setTimeout(() => controller.abort(), CHART_FETCH_TIMEOUT_MS);
        try {
            const response = await fetch(`${CHART_API_BASE}api/${name}-chart?t=${Date.now()}`, { cache: 'no-store', signal: controller.signal });
            if (!response.ok) throw new Error(`${name} chart request failed (${response.status})`);
            const chart = await response.json();
            data.chartCheckedAt = new Date();
            if (chart?.isLive === true && Array.isArray(chart.movies) && chart.movies.length) {
                local.set(CHART_CACHE_KEY, { ...local.get(CHART_CACHE_KEY, {}), [name]: chart });
            }
            return chart;
        } finally {
            clearTimeout(timer);
        }
    }
    function mergeCgvChart(chart) {
        if (!Array.isArray(chart.movies)) throw new Error('CGV 무비차트 데이터 형식이 올바르지 않습니다');

        data.cgvChartAsOf = chart.asOf || data.cgvChartAsOf;
        data.cgvChartUpdatedAt = chart.updatedAt || null;
        data.cgvChartIsLive = chart.isLive === true;
        const releasedMovies = chart.movies
            .filter((movie) => keepChartMovie(chart, movie))
            .sort((a, b) => chart.isLive === true
                ? siteRank(a) - siteRank(b)
                : (Number(b.cgvReservationRate) || 0) - (Number(a.cgvReservationRate) || 0) ||
                  (Number(a.cgvChartRank || a.cgvRank || a.rank) || Infinity) -
                  (Number(b.cgvChartRank || b.cgvRank || b.rank) || Infinity)
            );
        data.cgvMovies = releasedMovies.map((chartMovie, index) => {
            const movieId = Number(chartMovie.movieId);
            const existing = data.movies.find((movie) => movie.movieId === movieId);
            const genreIds = Array.isArray(chartMovie.genreIds)
                ? chartMovie.genreIds
                : String(chartMovie.genres || '').split(',').map((name) =>
                    data.genres.find((genre) => genre.name === name.trim())?.id
                ).filter((id) => id !== undefined);
            const movie = {
                ...existing,
                ...chartMovie,
                movieId,
                title: String(chartMovie.title || existing?.title || '제목 미상').trim(),
                posterPath: chartMovie.posterPath || existing?.posterPath || '',
                releaseDate: chartMovie.releaseDate || existing?.releaseDate || '',
                genreIds,
                overview: chartMovie.overview || existing?.overview || synopsisFor(chartMovie.title || existing?.title),
                availableOn: ['theater'],
                source: 'cgv',
                rank: index + 1,
                cgvRank: index + 1,
                cgvChartRank: Number(chartMovie.cgvChartRank || chartMovie.cgvRank || chartMovie.rank) || null,
                cgvReservationRate: Number(chartMovie.cgvReservationRate) || 0,
                cgvEggIndex: 'cgvEggIndex' in chartMovie ? chartMovie.cgvEggIndex : existing?.cgvEggIndex,
                cgvAdmissions: chartMovie.cgvAdmissions || existing?.cgvAdmissions || '정보 없음'
            };
            if (existing) Object.assign(existing, movie);
            else data.movies.push(movie);
            return existing || movie;
        });
    }

    /* 롯데시네마 포스터는 파일 이름의 크기 코드만 바꾸면 큰 이미지를 받을 수 있다
       (_503_ 200×288 → _101_ 357×510). 화면에 크게 보이는 포스터가 흐려지지 않게 큰 이미지를 쓴다. */
    const sharpLottePoster = (src) => String(src || '').replace(/(lottecinema\.co\.kr\/Media\/MovieFile\/MovieImg\/\d+\/\d+)_\d{3}_(\d+)\.(jpe?g|png)$/i, '$1_101_$2.$3');

    function mergeLotteChart(chart) {
        if (!Array.isArray(chart.movies)) throw new Error('롯데시네마 무비차트 데이터 형식이 올바르지 않습니다');
        data.lotteChartAsOf = chart.asOf || data.lotteChartAsOf;
        data.lotteChartUpdatedAt = chart.updatedAt || null;
        data.lotteChartIsLive = chart.isLive === true;
        data.lotteMovies = chart.movies
            .filter((movie) => /^\d+$/.test(String(movie.movieCode || '')) && keepChartMovie(chart, movie))
            .sort((a, b) => chart.isLive === true
                ? siteRank(a) - siteRank(b)
                : (Number(b.reservationRate) || 0) - (Number(a.reservationRate) || 0) ||
                  (Number(a.rank) || Infinity) - (Number(b.rank) || Infinity)
            )
            .map((movie, index) => ({ ...movie, posterPath: sharpLottePoster(movie.posterPath), rank: index + 1, source: 'lotte' }));
        linkChartMoviesToDetail(data.lotteMovies, 'lotte');
    }

    function mergeMegaboxChart(chart) {
        if (!Array.isArray(chart.movies)) throw new Error('메가박스 무비차트 데이터 형식이 올바르지 않습니다');
        data.megaboxChartAsOf = chart.asOf || data.megaboxChartAsOf;
        data.megaboxChartUpdatedAt = chart.updatedAt || null;
        data.megaboxChartIsLive = chart.isLive === true;
        data.megaboxMovies = chart.movies
            .filter((movie) => /^\d+$/.test(String(movie.movieCode || '')) && keepChartMovie(chart, movie))
            .sort((a, b) => chart.isLive === true
                ? siteRank(a) - siteRank(b)
                : (Number(b.reservationRate) || 0) - (Number(a.reservationRate) || 0) ||
                  (Number(a.rank) || Infinity) - (Number(b.rank) || Infinity)
            )
            .map((movie, index) => ({ ...movie, rank: index + 1, source: 'megabox' }));
        linkChartMoviesToDetail(data.megaboxMovies, 'megabox');
    }

    /* 롯데시네마·메가박스 차트 영화를 앱 안의 영화 상세 화면과 연결한다.
       같은 제목의 영화가 이미 있으면 그 영화 정보(줄거리·장르)를 함께 쓰고, 없으면 차트 정보만으로 상세 화면을 만든다. */
    function linkChartMoviesToDetail(movies, provider) {
        const posterSources = [...data.cgvMovies, ...data.lotteMovies, ...data.megaboxMovies, ...data.movies];
        movies.forEach((movie) => {
            const key = normalizeTitle(movie.title);
            const existing = data.movies.find((item) => normalizeTitle(item.title) === key);
            if (!movie.posterPath) {
                movie.posterPath = posterSources.find((item) => item !== movie && item.posterPath && normalizeTitle(item.title) === key)?.posterPath || '';
            }
            movie.movieId = existing ? existing.movieId : CHART_ID_BASE[provider] + Number(movie.movieCode);
            movie.genreIds = existing?.genreIds || movie.genreIds || [];
            movie.overview = movie.overview || existing?.overview || synopsisFor(movie.title);
            movie.availableOn = ['theater'];
        });
    }

    function renderCinemaChart(reset = false) {
        const cgvCarousel = $('#cinemaMovieChart');
        if (!cgvCarousel) return;
        const selectedCard = cgvCarousel.querySelector('.cgv-chart-card.is-active');
        const selectedIndex = reset ? 0 : Number(selectedCard?.dataset.chartIndex) || 0;
        const providerKey = data.activeChartProvider;
        renderChartStatus();
        const isCgv = providerKey === 'cgv';
        const provider = CHART_PROVIDERS[providerKey].name;
        const movies = chartMovies(providerKey);
        if (!movies.length) {
            cgvCarousel.innerHTML = `<p class="empty-note">${provider} 개봉작을 불러오지 못했습니다.</p>`;
            $$('[data-chart-scroll]').forEach((button) => { button.hidden = true; button.disabled = true; });
            renderChartDots(0, 0);
            return;
        }
        const rankedMovies = movies.slice(0, 20);
        const renderCard = (movie, index, copy) => {
            const duplicate = copy !== 'main';
            const rank = isCgv ? movie.cgvRank || index + 1 : movie.rank || index + 1;
            const rate = isCgv ? movie.cgvReservationRate : movie.reservationRate;
            const href = isCgv ? `${url('movie')}?movieId=${movie.movieId}` : chartMovieHref(movie, providerKey);
            return `
            <a class="cgv-chart-card" data-chart-copy="${copy}" data-chart-index="${index}" role="${duplicate ? 'presentation' : 'listitem'}" href="${href}"${duplicate ? ' aria-hidden="true" tabindex="-1"' : ''} aria-label="${provider} 예매율 순위 ${rank}위 ${esc(movie.title)} 상세 보기">
                ${posterHtml(movie.title, movie.posterPath, '', String(rank), 'badge--rank', movie.source)}
                <strong>${esc(movie.title)}</strong>
                <span>예매율 ${Number(rate).toFixed(1)}%</span>
            </a>`;
        };
        const renderSet = (copy) => rankedMovies.map((movie, index) => renderCard(movie, index, copy)).join('');
        const cards = rankedMovies.length > 1
            ? `${renderSet('before')}${renderSet('main')}${renderSet('after')}`
            : renderSet('main');
        cgvCarousel.setAttribute('aria-label', `${provider} 무비차트 예매율 순위 상위 20편`);
        cgvCarousel.innerHTML = cards;
        const activeIndex = Math.min(selectedIndex, rankedMovies.length - 1);
        const activeCard = cgvCarousel.querySelector(`.cgv-chart-card[data-chart-copy="main"][data-chart-index="${activeIndex}"]`);
        renderChartDots(rankedMovies.length, activeIndex);
        if (activeCard) {
            activeCard.classList.add('is-active');
            cgvCarousel.scrollLeft = centerCinemaChartCard(cgvCarousel, activeCard);
        }
        updateCgvArrows(cgvCarousel);
    }

    function renderChartStatus() { /* 표시할 상태 없음 */ }

    /* 포스터 하단 페이지 표시 점 — 현재 영화는 길쭉한 보라색 막대로 표시 */
    function renderChartDots(count, activeIndex) {
        const dots = $('#cinemaChartDots');
        if (!dots) return;
        dots.hidden = count < 2;
        dots.innerHTML = Array.from({ length: count }, (_, index) =>
            `<button type="button" class="chart-dot${index === activeIndex ? ' is-active' : ''}" data-chart-dot="${index}" aria-label="${index + 1}위 영화로 이동"${index === activeIndex ? ' aria-current="true"' : ''}></button>`
        ).join('');
    }
    function updateChartDots(activeIndex) {
        $$('.chart-dot').forEach((dot) => {
            const isActive = Number(dot.dataset.chartDot) === activeIndex;
            dot.classList.toggle('is-active', isActive);
            if (isActive) dot.setAttribute('aria-current', 'true');
            else dot.removeAttribute('aria-current');
        });
    }

    function centerCinemaChartCard(carousel, card) {
        const carouselRect = carousel.getBoundingClientRect();
        const cardRect = card.getBoundingClientRect();
        const cardCenter = carousel.scrollLeft + cardRect.left - carouselRect.left + cardRect.width / 2;
        return Math.max(0, Math.min(carousel.scrollWidth - carousel.clientWidth, cardCenter - carousel.clientWidth / 2));
    }

    function updateCgvArrows(cgvCarousel = $('#cinemaMovieChart')) {
        if (!cgvCarousel) return;
        const arrows = $$('[data-chart-scroll]');
        const hasMultipleMovies = cgvCarousel.querySelectorAll('.cgv-chart-card[data-chart-copy="main"]').length > 1;
        arrows.forEach((button) => {
            button.hidden = !hasMultipleMovies;
            button.disabled = !hasMultipleMovies;
        });
    }

    async function refreshLiveCgvChart() {
        try {
            mergeCgvChart(await fetchChart('cgv'));
            if (data.activeChartProvider === 'cgv') {
                renderCinemaChart();
            }
            if (page === 'home') renderCommunityReviews();
        } catch (error) {
            console.warn('CGV 무비차트 실시간 갱신에 실패했습니다.', error);
        }
    }

    async function refreshLiveMegaboxChart() {
        try {
            mergeMegaboxChart(await fetchChart('megabox'));
            if (data.activeChartProvider === 'megabox') {
                renderCinemaChart();
            }
        } catch (error) {
            console.warn('메가박스 무비차트 실시간 갱신에 실패했습니다.', error);
        }
    }

    async function refreshLiveLotteChart() {
        try {
            mergeLotteChart(await fetchChart('lotte'));
            if (data.activeChartProvider === 'lotte') {
                renderCinemaChart();
            }
        } catch (error) {
            console.warn('롯데시네마 무비차트 실시간 갱신에 실패했습니다.', error);
        }
    }

    /* ===== 찜(즐겨찾기) =====
       하트 버튼은 어느 화면에서든 data-fav 속성만 있으면 동작한다 (아래 클릭 위임) */
    const HEART_SVG = '<svg class="heart-icon" viewBox="0 0 24 24" aria-hidden="true" focusable="false"><path d="M12 20.6l-1.3-1.2C5.6 14.8 2.5 12 2.5 8.4 2.5 5.6 4.7 3.4 7.5 3.4c1.6 0 3.2.8 4.5 2.1 1.3-1.3 2.9-2.1 4.5-2.1 2.8 0 5 2.2 5 5 0 3.6-3.1 6.4-8.2 11l-1.3 1.2z"/></svg>';
    const isFavorite = (movieId) => data.favorites.some((f) => Number(f.movieId) === Number(movieId));
    function heartButton(movie, chartKey = '', extraClass = '') {
        const on = isFavorite(movie.movieId);
        return `<button type="button" class="heart-btn ${extraClass}" data-fav="${esc(String(movie.movieId))}"
            data-fav-title="${esc(movie.title || movie.movieTitle || '')}" data-fav-poster="${esc(movie.posterPath || movie.posterUrl || '')}"
            data-fav-chart="${esc(chartKey)}" aria-pressed="${on}" aria-label="${esc(movie.title || movie.movieTitle || '영화')} ${on ? '찜 해제' : '찜하기'}">
            ${HEART_SVG}</button>`;
    }
    function syncHeartButtons(movieId) {
        const on = isFavorite(movieId);
        $$(`[data-fav="${movieId}"]`).forEach((btn) => {
            btn.setAttribute('aria-pressed', String(on));
            btn.setAttribute('aria-label', `${btn.dataset.favTitle || '영화'} ${on ? '찜 해제' : '찜하기'}`);
            btn.classList.toggle('is-on', on);
        });
    }
    const favoriteBusy = new Set();
    async function toggleFavorite(btn) {
        const movieId = Number(btn.dataset.fav);
        if (!movieId || favoriteBusy.has(movieId)) return;
        if (!data.user) { needLogin('favorite'); return; }
        const movie = { movieId, movieTitle: btn.dataset.favTitle || '', posterUrl: btn.dataset.favPoster || '', chartKey: btn.dataset.favChart || '' };
        const on = !isFavorite(movieId);
        const previous = data.favorites;
        // 먼저 화면에 반영하고 저장한다 (실패하면 되돌림)
        data.favorites = on ? [{ ...movie, createdAt: new Date().toISOString() }, ...previous] : previous.filter((f) => Number(f.movieId) !== movieId);
        syncHeartButtons(movieId);
        btn.classList.add('is-pop');
        setTimeout(() => btn.classList.remove('is-pop'), 300);
        favoriteBusy.add(movieId);
        try {
            await backend.setFavorite(movie, on);
            toast(on ? '찜한 영화에 담았어요' : '찜을 해제했어요');
            if (typeof data.onFavoritesChanged === 'function') data.onFavoritesChanged();
        } catch (error) {
            data.favorites = previous;
            syncHeartButtons(movieId);
            toast(error instanceof AuthError ? error.message : '찜하지 못했어요. 잠시 후 다시 시도해 주세요.');
        } finally {
            favoriteBusy.delete(movieId);
        }
    }
    document.addEventListener('click', (event) => {
        const btn = event.target.closest('[data-fav]');
        if (!btn) return;
        event.preventDefault();
        event.stopPropagation();
        void toggleFavorite(btn);
    });
    /* 찜한 영화 → 영화 상세 주소 (롯데시네마·메가박스 전용 영화는 차트 정보와 함께) */
    const favoriteHref = (f) => `${url('movie')}?movieId=${encodeURIComponent(f.movieId)}${f.chartKey && f.chartKey !== 'cgv' ? `&chart=${f.chartKey}` : ''}`;

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
        const profile = $('#avatarBtn') || $('#logoutBtn');
        if (profile) {
            profile.innerHTML = '<i class="fa-solid fa-user" aria-hidden="true"></i>';
            profile.setAttribute('aria-label', data.user ? '프로필 메뉴' : '로그인');
            if (profile.tagName === 'A') profile.href = `${url('login')}?reason=myTickets`;
            profile.setAttribute('aria-expanded', 'false');
            const menu = document.createElement('div');
            menu.className = 'profile-menu';
            menu.hidden = true;
            menu.innerHTML = '<button type="button">로그아웃</button>';
            profile.parentElement.appendChild(menu);
            profile.addEventListener('click', (event) => {
                if (!data.user) {
                    session.set(SESSION.next, new URL(url('ticketbook'), location.href).href);
                    if (profile.tagName !== 'A') location.href = `${url('login')}?reason=myTickets`;
                    return;
                }
                event.preventDefault();
                menu.hidden = !menu.hidden;
                profile.setAttribute('aria-expanded', String(!menu.hidden));
            });
            menu.querySelector('button').addEventListener('click', async () => {
                if (!(await confirmDialog('로그아웃할까요?', '로그아웃'))) return;
                await backend.signOut();
                location.href = url('home');
            });
            document.addEventListener('click', (event) => {
                if (!profile.parentElement.contains(event.target)) {
                    menu.hidden = true;
                    profile.setAttribute('aria-expanded', 'false');
                }
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
        const scrollTimers = new WeakMap();
        scrollTargets.forEach((target) => target.addEventListener('scroll', () => {
            activeTarget = target;
            button.hidden = target.scrollTop < 120;
            target.classList.add('is-scrolling');
            clearTimeout(scrollTimers.get(target));
            scrollTimers.set(target, setTimeout(() => target.classList.remove('is-scrolling'), 900));
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
        if (t.rating) {
            ctx.fillStyle = '#3a3a38'; ctx.font = `700 24px ${font}`;
            ctx.fillText(`★ ${formatRating(t.rating)} / 5`, 70, 866);
        }

        ctx.setLineDash([10, 8]); ctx.strokeStyle = '#9b9b96'; ctx.lineWidth = 2;
        ctx.beginPath(); ctx.moveTo(70, 890); ctx.lineTo(W - 70, 890); ctx.stroke(); ctx.setLineDash([]);

        ctx.fillStyle = '#3a3a38'; ctx.font = `400 26px ${font}`;
        if (t.oneLineReview) wrapText(ctx, `“${t.oneLineReview}”`, 70, 940, W - 140, 38, 2);
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
    function renderCommunityReviews() {
        const highestRatedCgvMovie = [...data.cgvMovies]
            .filter((movie) => Number.isFinite(Number(movie.cgvEggIndex)))
            .sort((a, b) => Number(b.cgvEggIndex) - Number(a.cgvEggIndex))[0];
        const topRating = 4.5;
        const ratingOf = (movie) => movie === highestRatedCgvMovie || movie.movieId === 30001323
            ? topRating
            : Math.min(topRating, Math.round(Number(movie.voteAverage) / 2 * 10) / 10);
        const evergreenNetflixMovies = data.movies
            .filter((movie) =>
                movie.source !== 'cgv' &&
                movie.availableOn?.includes('ott') &&
                movie.releaseDate &&
                Number(movie.releaseDate.slice(0, 4)) <= 2020 &&
                Number(movie.voteAverage) > 0
            )
            .sort((a, b) =>
                (Number(b.voteCount) || Number(b.popularity) || 0) -
                (Number(a.voteCount) || Number(a.popularity) || 0)
            )
            .slice(0, 9)
            .sort((a, b) => ratingOf(b) - ratingOf(a) || (Number(b.voteCount) || 0) - (Number(a.voteCount) || 0));
        const reviews = [highestRatedCgvMovie, ...evergreenNetflixMovies].filter(Boolean).slice(0, 10);
        $('#communityReviews').innerHTML = reviews.map((movie, index) => `
                <li class="community-review">
                    <a class="community-review__link" href="${url('movie')}?movieId=${movie.movieId}">
                        <div class="community-review__top">
                            <span class="community-review__rank">${index + 1}</span>
                            ${posterHtml(movie.title, movie.posterPath, 'poster--xs community-review__poster', '', '', movie.source)}
                            <div class="community-review__movie">
                                <strong>${esc(movie.title)}</strong>
                                <span>${movie === highestRatedCgvMovie ? 'CGV 상영작' : `${movie.releaseDate.slice(0, 4)} · OTT 스테디셀러`}</span>
                                <span class="community-review__rating"><i class="fa-solid fa-star" aria-hidden="true"></i> ${ratingOf(movie).toFixed(1)} / 5.0</span>
                            </div>
                        </div>
                    </a>
                </li>`).join('');
    }

    function initHome() {
        renderCommunityReviews();
        renderCinemaChart();
        const cgvCarousel = $('#cinemaMovieChart');
        const chartSelectors = $$('.cinema-chart-selector');
        const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
        let autoTimer;
        let resumeTimer;
        let scrollIdleTimer;
        let animationFrame = 0;
        let isAnimating = false;
        let pointerInside = false;
        let hasFocus = false;
        let brieflyPaused = false;

        const getCenteredCard = () => {
            const cards = $$('.cgv-chart-card', cgvCarousel);
            if (!cards.length) return null;
            const carouselCenter = cgvCarousel.getBoundingClientRect().left + cgvCarousel.clientWidth / 2;
            return cards.reduce((nearest, card) => {
                if (!nearest) return card;
                const cardCenter = card.getBoundingClientRect().left + card.getBoundingClientRect().width / 2;
                const nearestCenter = nearest.getBoundingClientRect().left + nearest.getBoundingClientRect().width / 2;
                return Math.abs(cardCenter - carouselCenter) < Math.abs(nearestCenter - carouselCenter) ? card : nearest;
            }, null);
        };
        const setActiveCard = (card) => {
            $$('.cgv-chart-card', cgvCarousel).forEach((item) => {
                item.classList.toggle('is-active', item === card);
            });
            if (card) updateChartDots(Number(card.dataset.chartIndex));
        };
        const settleCenteredCard = () => {
            let card = getCenteredCard();
            if (!card) return;
            if (card.dataset.chartCopy !== 'main') {
                const mainCard = $(`.cgv-chart-card[data-chart-copy="main"][data-chart-index="${card.dataset.chartIndex}"]`, cgvCarousel);
                if (mainCard) {
                    card = mainCard;
                    cgvCarousel.scrollLeft = centerCinemaChartCard(cgvCarousel, card);
                }
            }
            setActiveCard(card);
            updateCgvArrows(cgvCarousel);
        };
        const cancelChartAnimation = () => {
            if (!animationFrame) return;
            cancelAnimationFrame(animationFrame);
            animationFrame = 0;
            isAnimating = false;
            cgvCarousel.classList.remove('is-animating');
            settleCenteredCard();
        };
        const animateToCard = (card, duration = 1100, onComplete = () => {}) => {
            if (!card) return;
            cancelChartAnimation();
            const start = cgvCarousel.scrollLeft;
            const target = centerCinemaChartCard(cgvCarousel, card);
            setActiveCard(card);
            if (reducedMotion || duration <= 0) {
                cgvCarousel.scrollLeft = target;
                settleCenteredCard();
                onComplete();
                return;
            }
            isAnimating = true;
            cgvCarousel.classList.add('is-animating');
            const startTime = performance.now();
            const animate = (now) => {
                const progress = Math.min((now - startTime) / duration, 1);
                const eased = progress < .5
                    ? 4 * progress * progress * progress
                    : 1 - Math.pow(-2 * progress + 2, 3) / 2;
                cgvCarousel.scrollLeft = start + (target - start) * eased;
                if (progress < 1) {
                    animationFrame = requestAnimationFrame(animate);
                    return;
                }
                cgvCarousel.scrollLeft = target;
                animationFrame = 0;
                isAnimating = false;
                cgvCarousel.classList.remove('is-animating');
                settleCenteredCard();
                onComplete();
            };
            animationFrame = requestAnimationFrame(animate);
        };
        const moveChart = (direction, duration = 500, onComplete) => {
            const cards = $$('.cgv-chart-card', cgvCarousel);
            const currentCard = getCenteredCard();
            const nextCard = cards[cards.indexOf(currentCard) + direction];
            if (!nextCard) {
                if (onComplete) onComplete();
                return;
            }
            animateToCard(nextCard, duration, onComplete);
        };
        const clearAutoTimer = () => clearTimeout(autoTimer);
        const scheduleAutoAdvance = () => {
            clearAutoTimer();
            const movies = chartMovies(data.activeChartProvider);
            if (reducedMotion || pointerInside || hasFocus || brieflyPaused || document.hidden || movies.length < 2) return;
            autoTimer = setTimeout(() => moveChart(1, 550, scheduleAutoAdvance), 1700);
        };
        let pauseAutoAdvance = (resumeAfter = 0) => {
            clearAutoTimer();
            if (!resumeAfter) return;
            brieflyPaused = true;
            clearTimeout(resumeTimer);
            resumeTimer = setTimeout(() => {
                brieflyPaused = false;
                scheduleAutoAdvance();
            }, resumeAfter);
        };

        chartSelectors.forEach((button) => button.addEventListener('click', () => {
            pauseAutoAdvance(5000);
            cancelChartAnimation();
            data.activeChartProvider = button.dataset.chartProvider;
            chartSelectors.forEach((selector) => {
                selector.setAttribute('aria-pressed', String(selector === button));
            });
            renderCinemaChart(true);
        }));
        $('#cinemaChartDots')?.addEventListener('click', (e) => {
            const dot = e.target.closest('[data-chart-dot]');
            if (!dot) return;
            pauseAutoAdvance(5000);
            const target = $(`.cgv-chart-card[data-chart-copy="main"][data-chart-index="${dot.dataset.chartDot}"]`, cgvCarousel);
            animateToCard(target, 650);
        });
        const cgvArrows = $$('[data-chart-scroll]');
        cgvArrows.forEach((button) => button.addEventListener('click', () => {
            pauseAutoAdvance(5000);
            moveChart(Number(button.dataset.chartScroll));
        }));
        cgvCarousel.addEventListener('scroll', () => {
            updateCgvArrows(cgvCarousel);
            if (isAnimating) return;
            clearTimeout(scrollIdleTimer);
            scrollIdleTimer = setTimeout(settleCenteredCard, 160);
        }, { passive: true });
        cgvCarousel.addEventListener('touchstart', () => {
            pauseAutoAdvance();
            cancelChartAnimation();
        }, { passive: true });
        cgvCarousel.addEventListener('wheel', () => {
            pauseAutoAdvance(5000);
            cancelChartAnimation();
        }, { passive: true });
        cgvCarousel.addEventListener('mouseenter', () => {
            pointerInside = true;
            pauseAutoAdvance();
        });
        cgvCarousel.addEventListener('mouseleave', () => {
            pointerInside = false;
            scheduleAutoAdvance();
        });
        cgvCarousel.addEventListener('focusin', () => {
            hasFocus = true;
            pauseAutoAdvance();
        });
        cgvCarousel.addEventListener('focusout', () => {
            setTimeout(() => {
                hasFocus = cgvCarousel.contains(document.activeElement);
                scheduleAutoAdvance();
            }, 0);
        });
        cgvCarousel.addEventListener('touchend', () => {
            pointerInside = false;
            pauseAutoAdvance(5000);
        }, { passive: true });
        if (!reducedMotion) {
            document.addEventListener('visibilitychange', scheduleAutoAdvance);
            scheduleAutoAdvance();
        }
    }

    /* =====================================================
       2·3 영화 검색 / 결과 없음
       ===================================================== */
    function initSearch() {
        const s = { query: '', viewType: 'all', genreId: 0, sort: 'popularity', ...session.get(SESSION.search, {}) };
        if (s.genreId === 18) s.genreId = 0;
        let genreExpanded = false;
        const persist = () => session.set(SESSION.search, s);
        let nextApiPage = data.apiNextPage;
        let nextApiOffset = data.apiNextOffset;
        let nextApiRank = data.apiNextRank;
        let apiHasMore = data.apiHasMore;

        /* 극장 필터: CGV · 롯데시네마 · 메가박스 무비차트 개봉작을 제목 기준으로 합쳐서 보여 준다 */
        const getTheaterMovies = () => {
            const merged = new Map();
            ['cgv', 'lotte', 'megabox'].forEach((provider) => {
                chartMovies(provider).forEach((movie) => {
                    const key = normalizeTitle(movie.title);
                    const rank = Number(provider === 'cgv' ? movie.cgvRank || movie.rank : movie.rank) || Infinity;
                    const rate = Number(provider === 'cgv' ? movie.cgvReservationRate : movie.reservationRate) || 0;
                    const item = merged.get(key);
                    if (!item) {
                        merged.set(key, {
                            ...movie,
                            genreIds: movie.genreIds || [],
                            availableOn: ['theater'],
                            popularity: rate,
                            source: provider,
                            chartProvider: provider,
                            theaterRank: rank,
                            theaterReservationRate: rate,
                            providers: [provider]
                        });
                        return;
                    }
                    item.providers.push(provider);
                    if (!item.posterPath && movie.posterPath) item.posterPath = movie.posterPath;
                    if (!item.overview && movie.overview) item.overview = movie.overview;
                    if (!item.genreIds.length && movie.genreIds?.length) item.genreIds = movie.genreIds;
                    item.theaterRank = Math.min(item.theaterRank, rank);
                    item.theaterReservationRate = Math.max(item.theaterReservationRate, rate);
                    item.popularity = item.theaterReservationRate;
                });
            });
            return [...merged.values()];
        };

        const filtered = () => {
            const q = s.query.trim().toLowerCase();
            const movies = s.viewType === 'theater' ? getTheaterMovies() : data.movies;
            const list = movies.filter((m) =>
                (!q || m.title.toLowerCase().includes(q) || m.originalTitle?.toLowerCase().includes(q)) &&
                (s.viewType === 'all' || !m.availableOn?.length || m.availableOn.includes(s.viewType)) &&
                (!s.genreId || m.genreIds.includes(s.genreId))
            );
            const sorters = {
                popularity: (a, b) => {
                    if (s.viewType === 'theater') {
                        const reservationDifference = b.theaterReservationRate - a.theaterReservationRate;
                        if (reservationDifference) return reservationDifference;
                        const rankDifference = a.theaterRank - b.theaterRank;
                        if (rankDifference) return rankDifference;
                    }
                    return b.popularity - a.popularity;
                },
                latest: (a, b) => b.releaseDate.localeCompare(a.releaseDate),
                title: (a, b) => a.title.localeCompare(b.title, 'ko')
            };
            return list.sort(sorters[s.sort]);
        };

        function renderChips() {
            $('#viewTypeChips').innerHTML = [{ id: 'all', label: '전체' }, ...VIEW_TYPES]
                .map((v) => `<button type="button" class="chip ${s.viewType === v.id ? 'is-on' : ''}" data-viewtype="${v.id}">${v.icon ? `<i class="fa-solid ${v.icon}" aria-hidden="true"></i>` : ''}${v.label}</button>`).join('');
            $('#genreChips').innerHTML = [{ id: 0, name: '전체' }, ...data.genres.filter((genre) => genre.id !== 18)]
                .map((g) => `<button type="button" class="chip ${s.genreId === g.id ? 'is-on' : ''}" data-genre="${g.id}">${esc(g.name)}</button>`).join('');
            $('#genreChips').hidden = !genreExpanded;
            const genreToggle = $('#genreToggle');
            genreToggle.setAttribute('aria-expanded', String(genreExpanded));
            genreToggle.innerHTML = `${genreExpanded ? '접기' : '더보기'} <i class="fa-solid ${genreExpanded ? 'fa-chevron-up' : 'fa-chevron-down'}" aria-hidden="true"></i>`;
        }

        data.onChartsUpdated = () => renderResults();
        function renderResults() {
            const list = filtered();
            const empty = list.length === 0;
            $('#queryClear').hidden = !s.query;
            $('#searchEmpty').hidden = !empty;
            $('#movieGrid').hidden = empty;
            $('#resultCount').textContent = empty ? '검색 결과 · 0편' : `${s.query || s.genreId || s.viewType !== 'all' ? '검색 결과' : '인기 영화'} ${list.length}편`;
            $('#loadMoreMovies').hidden = !apiHasMore;
            const isTheaterList = s.viewType === 'theater';
            $('#movieGrid').innerHTML = list.map((m, index) => {
                const href = m.chartProvider && m.chartProvider !== 'cgv'
                    ? chartMovieHref(m, m.chartProvider)
                    : `${url('movie')}?movieId=${encodeURIComponent(m.movieId)}`;
                const badge = index + 1;
                return `
                <div class="card-wrap">
                <a class="card" href="${href}">
                    ${posterHtml(m.title, m.posterPath, '', String(badge).padStart(2, '0'), 'badge--rank', m.source)}
                    <p class="card__t">${esc(m.title)}</p>
                    <p class="card__m">${isTheaterList && m.providers
                        ? `${m.providers.map((provider) => ({ cgv: 'CGV', lotte: '롯데', megabox: '메가' })[provider]).join('·')} · 예매율 ${m.theaterReservationRate.toFixed(1)}%`
                        : `${m.releaseDate?.slice(0, 4) || (m.source === 'cgv' ? 'CGV 상영 중' : '')}${m.genreIds[0] ? ' · ' + esc(genreName(m.genreIds[0])) : ''}${m.voteAverage ? ` · ★ ${m.voteAverage.toFixed(1)}` : ''}`}</p>
                </a>
                <div class="card-wrap__poster">${heartButton(m, m.chartProvider && m.chartProvider !== 'cgv' ? m.chartProvider : '', 'heart-btn--card')}</div>
                </div>`;
            }).join('');
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

        $('#genreToggle').addEventListener('click', () => {
            genreExpanded = !genreExpanded;
            renderChips();
        });
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
        $('#loadMoreMovies').addEventListener('click', async (event) => {
            const button = event.currentTarget;
            button.disabled = true;
            button.textContent = '불러오는 중';
            const response = await loadJson(`api/movies?page=${nextApiPage}&offset=${nextApiOffset}&rankStart=${nextApiRank}`, null);
            if (response?.movies?.length) {
                data.movies.push(...response.movies);
                nextApiPage = response.nextPage;
                nextApiOffset = response.nextOffset;
                nextApiRank = response.nextRank;
                apiHasMore = response.hasMore;
                button.textContent = '더 보기';
                renderResults();
            } else {
                button.textContent = '불러오지 못했습니다. 다시 시도';
                apiHasMore = true;
            }
            button.disabled = false;
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
            draft = { ...t, tags: [...t.tags], rating: Number(t.rating) || 0, isPublic: t.isPublic === true, releaseDate: (movieById(t.movieId) || {}).releaseDate || '' };
            $('#writeBack').href = `${url('detail')}?id=${t.ticketId}`;
        } else {
            const movie = movieById(Number(params.get('movieId')));
            if (!movie) { location.replace(url('search')); return; }
            const saved = session.get(SESSION.draft, null);
            const defaultView = (session.get(SESSION.search, {}).viewType === 'ott') ? 'ott' : 'theater';
            draft = (saved && saved.movieId === movie.movieId && !saved.ticketId) ? saved : {
                ticketId: null, movieId: movie.movieId, movieTitle: movie.title, posterUrl: movie.posterPath, releaseDate: movie.releaseDate,
                isPublic: false, rating: 0,
                watchedAt: ymd(today), viewType: defaultView, place: '', oneLineReview: '', diary: '', tags: []
            };
        }
        draft.isPublic = draft.isPublic === true;
        draft.rating = Number(draft.rating) || 0;

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
        $(`input[name="visibility"][value="${draft.isPublic ? 'public' : 'private'}"]`).checked = true;

        function renderRating() {
            $('#ratingPicker').innerHTML = [1, 2, 3, 4, 5].map((star) => `
                <span class="rating-star">
                    ${[0.5, 1].map((step) => {
                        const rating = star - 1 + step;
                        return `<button type="button" class="rating-half ${rating <= draft.rating ? 'is-on' : ''}" role="radio"
                            aria-checked="${rating === draft.rating}" aria-label="${formatRating(rating)}점" data-rating="${rating}">
                            <span aria-hidden="true">★</span>
                        </button>`;
                    }).join('')}
                </span>`).join('');
            $('#ratingClear').hidden = !draft.rating;
        }
        function renderViewType() {
            $('#writeViewType').innerHTML = VIEW_TYPES.map((v) => `<button type="button" class="${draft.viewType === v.id ? 'is-on' : ''}" data-wvt="${v.id}">${v.label}</button>`).join('');
            $('#place').placeholder = draft.viewType === 'ott' ? 'OTT 서비스명 (예: 넷플릭스)' : '극장 이름 (예: CGV 강남)';
        }
        function renderTags() {
            const all = [...new Set([...PRESET_TAGS, ...draft.tags])];
            $('#tagChips').innerHTML = all.map((t) => `<button type="button" class="chip ${draft.tags.includes(t) ? 'is-on' : ''}" data-tag="${esc(t)}">${esc(t)}</button>`).join('');
        }
        function updateOneLineCount() {
            $('#oneLineCount').textContent = `${$('#oneLine').value.length}/50`;
        }
        updateOneLineCount();
        renderRating(); renderViewType(); renderTags();

        $('#ratingPicker').addEventListener('click', (e) => {
            const button = e.target.closest('[data-rating]'); if (!button) return;
            draft.rating = Number(button.dataset.rating);
            renderRating();
        });
        $('#ratingClear').addEventListener('click', () => {
            draft.rating = 0;
            renderRating();
        });
        $('#writeViewType').addEventListener('click', (e) => {
            const b = e.target.closest('[data-wvt]'); if (!b) return;
            draft.viewType = b.dataset.wvt; renderViewType();
        });
        $('#watchedAt').addEventListener('change', (e) => { draft.watchedAt = e.target.value; });
        $('#place').addEventListener('input', (e) => { draft.place = e.target.value; });
        $('#oneLine').addEventListener('input', (e) => { draft.oneLineReview = e.target.value; updateOneLineCount(); });
        $('#diary').addEventListener('input', (e) => { draft.diary = e.target.value; });
        $$('input[name="visibility"]').forEach((input) => input.addEventListener('change', () => {
            draft.isPublic = input.value === 'public';
        }));
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
            const label = btn.textContent;
            btn.disabled = true;
            btn.textContent = '저장 중…';
            (async () => {
                const fields = {
                    movieId: draft.movieId, movieTitle: draft.movieTitle, posterUrl: draft.posterUrl, watchedAt: draft.watchedAt,
                    viewType: draft.viewType, place: draft.place.trim(), oneLineReview: draft.oneLineReview.trim(),
                    diary: draft.diary.trim(), tags: draft.tags, isPublic: draft.isPublic, rating: draft.rating, ticketImageUrl: ''
                };
                try {
                    const ticket = await backend.saveTicket(fields, draft.ticketId);
                    session.del(SESSION.draft);
                    location.replace(`${url('write')}?saved=${encodeURIComponent(ticket.ticketId)}`);
                } catch (error) {
                    err.textContent = error instanceof AuthError ? `저장하지 못했어요. ${error.message}` : '저장하지 못했어요. 잠시 후 다시 시도해 주세요.';
                    err.hidden = false;
                    btn.disabled = false;
                    btn.textContent = label;
                }
            })();
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
            ${t.rating ? `<p class="ticket__rating">★ ${formatRating(t.rating)} / 5</p>` : ''}
            ${t.oneLineReview ? `<p class="ticket__r">“${esc(t.oneLineReview)}”</p>` : ''}`;
        $('#savedDownload').addEventListener('click', () => downloadTicket(t));
    }

    /* =====================================================
       9 로그인 / 회원가입 (조건부 화면)
       ===================================================== */
    function initLogin() {
        // 이 기기에서 처음 시작하면 회원가입부터
        let mode = backend.hasAccountOnDevice() ? 'login' : 'signup';
        const authError = (msg) => { const el = $('#authError'); el.textContent = msg; el.hidden = false; };

        function render() {
            const signup = mode === 'signup';
            $('#loginSubmit').textContent = signup ? '회원가입' : '로그인';
            $('#modeToggle').textContent = signup ? '이미 계정이 있어요 · 로그인' : '처음이에요 · 회원가입';
            $('#password').autocomplete = signup ? 'new-password' : 'current-password';
            $('#authError').hidden = true;
        }
        render();

        // 닫기: 직전 화면으로, 없으면 홈으로
        $('#loginClose').addEventListener('click', (e) => {
            if (history.length > 1) { e.preventDefault(); history.back(); }
        });

        async function finish(user) {
            data.user = user;
            await offerLocalTicketMigration(user);
            const next = session.get(SESSION.next, null);
            session.del(SESSION.next);
            location.replace(next || url('home'));
        }

        $('#loginForm').addEventListener('submit', async (e) => {
            e.preventDefault();
            const nickname = $('#nickname').value.trim();
            const pw = $('#password').value;
            const signup = mode === 'signup';
            if (!nickname) return authError('닉네임을 입력해 주세요.');
            if (nickname.length > 20) return authError('닉네임은 20자 이하로 입력해 주세요.');
            if (!isValidPassword(pw)) return authError('비밀번호는 영문자와 숫자를 조합해 8자 이상 입력해 주세요.');
            const submit = $('#loginSubmit');
            submit.disabled = true;
            submit.textContent = signup ? '가입 중…' : '로그인 중…';
            try {
                const result = signup
                    ? await backend.signUp({ nickname, password: pw })
                    : await backend.signIn({ nickname, password: pw });
                $('#password').value = '';
                await finish(result.user);
            } catch (error) {
                submit.disabled = false;
                render();
                if (error instanceof NotRegisteredError) {
                    // 가입하지 않은 닉네임: 회원가입 먼저 하도록 알림 (입력한 닉네임·비밀번호는 그대로 둔다)
                    const goSignup = await confirmDialog('가입하지 않은 닉네임이에요.\n회원가입을 먼저 해 주세요.', '회원가입하기');
                    if (goSignup) { mode = 'signup'; render(); $('#loginSubmit').focus(); }
                    return;
                }
                authError(error instanceof AuthError ? error.message : '로그인 처리 중 문제가 생겼어요. 잠시 후 다시 시도해 주세요.');
                console.warn(error);
            }
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

    async function loadSamples() {
        const list = data.samples.map((s) => {
            const movie = movieById(s.movieId);
            if (!movie) return null;
            return {
                movieId: movie.movieId, movieTitle: movie.title, posterUrl: movie.posterPath,
                watchedAt: `${ym(today)}-${pad(s.dayOfMonth)}`, viewType: s.viewType, place: s.place, oneLineReview: s.oneLineReview,
                diary: s.diary, tags: s.tags, isPublic: false, rating: 0, ticketImageUrl: ''
            };
        }).filter(Boolean);
        try {
            const created = await backend.saveTickets(list);
            data.tickets.push(...created);
            toast(`샘플 티켓 ${created.length}장을 불러왔어요`);
            initTicketbook();
        } catch (error) {
            toast(error instanceof AuthError ? error.message : '샘플 티켓을 저장하지 못했어요');
        }
    }

    /* 마이 티켓북 > 찜한 영화 (ticketbook.html?view=likes) */
    function initLikes() {
        $$('.seg a').forEach((a) => {
            const on = a.dataset.seg === 'likes';
            a.classList.toggle('is-on', on);
            if (on) a.setAttribute('aria-current', 'page'); else a.removeAttribute('aria-current');
        });
        $('#myEmpty').hidden = true;
        $('#gridView').hidden = true;
        $('#myTagChips').hidden = true;
        $('#likeView').hidden = false;
        const render = () => {
            const list = data.favorites;
            $('#likeEmpty').hidden = list.length > 0;
            $('#likeCount').hidden = list.length === 0;
            $('#likeCount').textContent = `총 ${list.length}편`;
            $('#likeGrid').innerHTML = list.map((f) => `
                <div class="card-wrap">
                    <a class="card" href="${favoriteHref(f)}">
                        ${posterHtml(f.movieTitle, f.posterUrl)}
                        <p class="card__t">${esc(f.movieTitle)}</p>
                        <p class="card__m">${dotDate(String(f.createdAt).slice(0, 10))}</p>
                    </a>
                    <div class="card-wrap__poster">${heartButton({ movieId: f.movieId, title: f.movieTitle, posterPath: f.posterUrl }, f.chartKey, 'heart-btn--card')}</div>
                </div>`).join('');
        };
        data.onFavoritesChanged = render;
        render();
    }

    function initTicketbook() {
        if (params.get('view') === 'likes') { initLikes(); return; }
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
            all.forEach((t) => { (byDate[t.watchedAt] ||= []).push(t); });
            const start = new Date(y, m - 1, 1 - new Date(y, m - 1, 1).getDay());
            const cells = [];
            for (let i = 0; i < 42; i++) {
                const d = new Date(start.getFullYear(), start.getMonth(), start.getDate() + i);
                if (i >= 35 && d.getMonth() !== m - 1) break;
                const key = ymd(d), ts = byDate[key] || [];
                const cls = ['cal__d', d.getMonth() !== m - 1 ? 'is-out' : '', key === ymd(today) ? 'is-today' : '', key === selected ? 'is-sel' : '', ts.length ? 'has-record' : ''].join(' ');
                const ariaLabel = `${d.getMonth() + 1}월 ${d.getDate()}일${ts.length ? `, 관람 기록 ${ts.length}건` : ''}`;
                cells.push(`<button type="button" class="${cls}" data-date="${key}" aria-label="${ariaLabel}" aria-pressed="${key === selected}"><span>${d.getDate()}</span></button>`);
            }
            $('#calGrid').innerHTML = cells.join('');
            const sel = byDate[selected] || [];
            $('#calSelTitle').textContent = `관람 ${sel.length}건`;
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
            ${t.rating ? `<p class="d__rating" aria-label="내 평점 ${formatRating(t.rating)}점">★ ${formatRating(t.rating)} / 5</p>` : ''}
            ${t.oneLineReview ? `<p class="d__review">“${esc(t.oneLineReview)}”</p>` : ''}
            ${t.diary ? `<p class="lb">실관람 다이어리</p><p class="d__diary">${esc(t.diary)}</p>` : ''}
            ${t.tags.length ? `<div class="d__tags">${t.tags.map((g) => `<span class="tag">${esc(g)}</span>`).join('')}</div>` : ''}
            <div class="d__grid">
                <button type="button" class="btn" data-action="download">티켓 이미지 다운로드</button>
                <div class="d__share" aria-label="SNS 공유">
                    <button type="button" class="d__social-btn d__social-btn--instagram" data-action="share" aria-label="인스타그램으로 공유" title="인스타그램으로 공유">
                        <svg viewBox="0 0 24 24" aria-hidden="true">
                            <defs>
                                <linearGradient id="instagramGradient" x1="0" y1="24" x2="24" y2="0" gradientUnits="userSpaceOnUse">
                                    <stop stop-color="#FFB800"/>
                                    <stop offset=".5" stop-color="#F2295B"/>
                                    <stop offset="1" stop-color="#7B35C8"/>
                                </linearGradient>
                            </defs>
                            <rect x="3" y="3" width="18" height="18" rx="5" fill="none" stroke="url(#instagramGradient)" stroke-width="2"/>
                            <circle cx="12" cy="12" r="4" fill="none" stroke="url(#instagramGradient)" stroke-width="2"/>
                            <circle cx="17.5" cy="6.8" r="1.2" fill="#F2295B"/>
                        </svg>
                    </button>
                    <button type="button" class="d__social-btn d__social-btn--kakao" data-action="share" aria-label="카카오톡으로 공유" title="카카오톡으로 공유">
                        <svg viewBox="0 0 32 28" aria-hidden="true">
                            <path d="M16 1C7.72 1 1 6.13 1 12.46c0 4.03 2.73 7.57 6.84 9.56l-1.39 5.13a.55.55 0 0 0 .84.6l6.03-4.02c.88.13 1.78.2 2.68.2 8.28 0 15-5.13 15-11.47S24.28 1 16 1Z" fill="#FEE500"/>
                            <path d="M8.2 10.1h1.7v6.2h1.6v-6.2h1.7V8.7H8.2v1.4Zm6.3-1.4-2.2 7.6h1.6l.45-1.65h2.2l.46 1.65h1.67l-2.24-7.6h-1.94Zm.22 4.62.72-2.65.74 2.65h-1.46Zm6.07-4.62h-1.62v7.6h4.45v-1.4h-2.83V8.7Z" fill="#191919"/>
                        </svg>
                    </button>
                </div>
                <a class="btn btn--soft" href="${url('write')}?ticketId=${t.ticketId}">수정</a>
                <button type="button" class="btn btn--soft" data-action="delete">삭제</button>
            </div>`;
        $('#detailBody').addEventListener('click', async (e) => {
            const b = e.target.closest('[data-action]'); if (!b) return;
            if (b.dataset.action === 'download') downloadTicket(t);
            if (b.dataset.action === 'share') shareTicket(t);
            if (b.dataset.action === 'delete') {
                if (!(await confirmDialog('이 티켓을 삭제할까요?\n삭제하면 되돌릴 수 없어요.', '삭제'))) return;
                try {
                    await backend.deleteTicket(t.ticketId);
                    location.replace(url('ticketbook'));
                } catch (error) {
                    toast(error instanceof AuthError ? error.message : '삭제하지 못했어요. 잠시 후 다시 시도해 주세요.');
                }
            }
        });
    }

    /* 느린 요청은 정해진 시간까지만 기다리고 기본값으로 화면을 그린다 */
    const withTimeout = (promise, ms, fallback) => Promise.race([promise, new Promise((resolve) => setTimeout(() => resolve(fallback), ms))]);

    async function initMovieDetail() {
        // 실시간 순위가 새로 오면 순위·예매율을 다시 그린다
        data.onChartsUpdated = () => { void initMovieDetail(); };
        const movieId = Number(params.get('movieId'));
        const chartKey = ['cgv', 'lotte', 'megabox'].includes(params.get('chart')) ? params.get('chart') : '';
        const chartEntry = chartKey && chartKey !== 'cgv' ? chartMovies(chartKey).find((m) => m.movieId === movieId) : null;
        let movie = movieById(movieId);
        if (!movie && movieId) {
            const response = await loadJson(`api/movie/${movieId}`, null);
            movie = response?.movie;
        }
        if (!movie || (!['cgv', 'lotte', 'megabox'].includes(movie.source) && !chartEntry && movie.releaseDate && movie.releaseDate > ymd(today))) {
            $('#movieDetail').innerHTML = '<section class="empty"><h2>영화 정보를 찾을 수 없습니다</h2><a class="btn btn--dark" href="search.html">영화 검색</a></section>';
            return;
        }

        const genres = (movie.genreIds || []).map((id) => genreName(id)).filter(Boolean);
        const movieMeta = [
            movie.releaseDate ? movie.releaseDate.slice(0, 4) : '',
            genres.join(' · '),
            movie.runtime ? `${movie.runtime}분` : ''
        ].filter(Boolean).join(' · ');
        $('#movieDetail').innerHTML = `
            <section class="movie-detail">
                <div class="movie-detail__head">
                    ${posterHtml(movie.title, movie.posterPath || chartEntry?.posterPath, 'poster--movie', '', '', chartEntry ? chartKey : movie.source)}
                    <div class="movie-detail__intro">
                        ${chartEntry ? `<p class="movie-detail__rank">${CHART_PROVIDERS[chartKey].name} 예매율 순위 ${chartEntry.rank}위</p>` : movie.cgvRank ? `<p class="movie-detail__rank">예매율 순위 ${movie.cgvRank}위</p>` : movie.rank ? `<p class="movie-detail__rank">인기 순위 ${movie.rank}위</p>` : ''}
                        <div class="movie-detail__titlerow">
                            <h2 class="movie-detail__title">${esc(movie.title)}</h2>
                            ${heartButton({ movieId: movie.movieId, title: movie.title, posterPath: movie.posterPath || chartEntry?.posterPath }, chartEntry ? chartKey : '', 'heart-btn--detail')}
                        </div>
                        ${movie.originalTitle && movie.originalTitle !== movie.title ? `<p class="movie-detail__original">${esc(movie.originalTitle)}</p>` : ''}
                        ${movieMeta ? `<p class="movie-detail__meta">${esc(movieMeta)}</p>` : ''}
                        ${chartEntry
                            ? `<p class="movie-detail__rating">예매율 ${Number(chartEntry.reservationRate).toFixed(1)}%</p>`
                            : movie.source === 'cgv'
                            ? `<p class="movie-detail__rating">예매율 ${Number(movie.cgvReservationRate).toFixed(1)}%</p>`
                            : `<p class="movie-detail__rating"><i class="fa-solid fa-star" aria-hidden="true"></i> ${(Number(movie.voteAverage) / 2).toFixed(1)} / 5.0${Number(movie.voteCount) > 0 ? ` <span>(${Number(movie.voteCount).toLocaleString()}명)</span>` : ''}</p>`}
                    </div>
                </div>
                ${movie.ottProvider && !chartEntry ? `<p class="movie-detail__source">${esc(movie.ottProvider)}에서만 볼 수 있는 OTT 영화 · ${dotDate(movie.releaseDate)} 공개</p>` : ''}
                <section class="movie-detail__section">
                    <h3>줄거리</h3>
                    <p>${esc(movie.overview || chartEntry?.overview || synopsisFor(movie.title) || '등록된 줄거리가 없습니다.')}</p>
                </section>
                <section class="movie-detail__section">
                    <h3 id="movieReviewTitle">관객 리뷰</h3>
                    <div id="movieReviewList"><p class="empty-note">리뷰를 불러오는 중…</p></div>
                    <button type="button" class="btn movie-review__more" id="movieReviewMore" hidden>더보기</button>
                </section>
                <a class="btn btn--dark btn--full" href="${url('write')}?movieId=${movie.movieId}">관람 기록 작성</a>
            </section>`;
        // 리뷰는 화면을 먼저 보여 준 뒤 불러와 채운다
        const reviewData = ['cgv', 'lotte', 'megabox'].includes(movie.source) ? { reviews: [] } : await withTimeout(loadJson(`api/movie/${movieId}/reviews`, { reviews: [] }), 2500, { reviews: [] });
        const audienceReviews = (await withTimeout(backend.publicReviews(movieId), 2500, []))
            .sort((a, b) => String(b.createdAt).localeCompare(String(a.createdAt)))
            .map((ticket) => {
                return {
                    author: ticket.author || '관객',
                    content: ticket.oneLineReview,
                    createdAt: ticket.watchedAt,
                    rating: Number(ticket.rating) || null,
                    source: 'FILM LOG'
                };
            });
        const externalReviews = Array.isArray(reviewData?.reviews) ? reviewData.reviews : [];
        const reviews = [...audienceReviews, ...externalReviews];
        const isDemoReviews = reviews.length === 0;
        const demoRatings = [4.5, 4, 5, 4.5, 4, 5];
        const demoReviews = DEMO_CGV_REVIEWS[movieId]
            ? DEMO_CGV_REVIEWS[movieId].map(([author, content], index) => ({ author, content, rating: demoRatings[index % demoRatings.length] }))
            : (() => {
            const nicknames = ['필름산책', '오늘의관객', '장면수집가', '느린팝콘', '여운한스푼', '스크린너머'];
            return [
                `${movie.title}, 처음부터 끝까지 몰입해서 봤어요.`,
                `인물들이 어떤 선택을 할지 계속 궁금해지는 영화예요.`,
                `분위기와 연출이 마음에 들어요. 다시 보고 싶어요.`,
                `배우들의 연기가 인상적이었어요.`,
                `기대한 만큼 재미있었고 여운도 길게 남아요.`,
                `${movie.title}, 주말에 보기 딱 좋은 영화예요.`
            ].map((content, index) => ({ author: nicknames[index], content: Array.from(content).slice(0, 50).join(''), rating: demoRatings[index] }));
        })();
        const displayedReviews = isDemoReviews ? demoReviews : reviews;
        const renderReviewCards = (count) => displayedReviews.slice(0, count).map((review) => `
            <article class="movie-review">
                <div class="movie-review__head"><strong>${esc(review.author)}</strong>${review.rating !== null && review.rating !== undefined ? `<span>★ ${Number(Number(review.rating) > 5 ? Number(review.rating) / 2 : review.rating).toFixed(1)} / 5.0</span>` : ''}</div>
                <p>${esc(isDemoReviews ? Array.from(review.content).slice(0, 50).join('') : review.content)}</p>
                ${review.createdAt ? `<time datetime="${esc(review.createdAt)}">${esc(review.createdAt)}</time>` : ''}
            </article>`).join('');
        let visibleReviewCount = Math.min(3, displayedReviews.length);
        if (!$('#movieReviewList')) return;
        $('#movieReviewTitle').textContent = isDemoReviews ? '추천 리뷰' : '관객 리뷰';
        $('#movieReviewList').innerHTML = renderReviewCards(visibleReviewCount);
        $('#movieReviewMore').hidden = displayedReviews.length <= visibleReviewCount;
        $('#movieReviewMore').addEventListener('click', () => {
            visibleReviewCount = Math.min(visibleReviewCount + 3, displayedReviews.length);
            $('#movieReviewList').innerHTML = renderReviewCards(visibleReviewCount);
            $('#movieReviewMore').hidden = visibleReviewCount >= displayedReviews.length;
        });
    }

    /* ===== 시작 ===== */
    async function init() {
        const [movieData, sampleData, cgvData] = await Promise.all([
            loadJson('data/movies.json', FALLBACK_MOVIES),
            loadJson('data/tickets.json', FALLBACK_SAMPLES),
            loadJson('data/cgv-chart.json', FALLBACK_CGV_CHART)
        ]);
        const firstApiPage = movieData.nextApiPage || 6;
        const firstApiOffset = movieData.nextApiOffset || 0;
        const firstApiRank = movieData.movies.length;
        const apiData = await loadJson(
            `api/movies?page=${firstApiPage}&offset=${firstApiOffset}&rankStart=${firstApiRank}`,
            { movies: [], nextPage: firstApiPage, nextOffset: firstApiOffset, nextRank: firstApiRank, hasMore: false }
        );
        data.movies = [...movieData.movies, ...apiData.movies];
        NETFLIX_ORIGINAL_MOVIES.forEach((movie) => {
            const key = normalizeTitle(movie.title);
            const existing = data.movies.find((item) => item.movieId === movie.movieId || normalizeTitle(item.title) === key);
            if (existing) Object.assign(existing, { ...movie, movieId: existing.movieId, posterPath: existing.posterPath || movie.posterPath, overview: existing.overview || movie.overview });
            else data.movies.push({ ...movie });
        });
        data.genres = movieData.genres;
        mergeCgvChart(cgvData);
        mergeLotteChart(FALLBACK_LOTTE_CHART);
        mergeMegaboxChart(FALLBACK_MEGABOX_CHART);
        mergeCachedLiveCharts();
        fillMissingOverviews(data.movies);
        data.samples = sampleData.samples;
        data.apiNextPage = apiData.nextPage;
        data.apiNextOffset = apiData.nextOffset;
        data.apiNextRank = apiData.nextRank;
        data.apiHasMore = apiData.hasMore;
        initTopButton();

        // 로그인 상태와 내 티켓 불러오기 (클라우드 모드는 DB, 기기 저장 모드는 localStorage)
        // 홈·검색·영화 상세는 기다리지 않고 바로 화면을 그린다
        if (!isCloud) await migrateLocalPasswords();
        const sessionReady = (async () => {
            try {
                data.user = await backend.currentUser();
                [data.tickets, data.favorites] = await Promise.all([
                    backend.loadMyTickets(data.user),
                    backend.loadFavorites(data.user).catch((error) => { console.warn('찜한 영화를 불러오지 못했습니다.', error); return []; })
                ]);
            } catch (error) {
                console.warn('로그인 정보 또는 티켓을 불러오지 못했습니다.', error);
                if (data.user && ['ticketbook', 'calendar', 'detail', 'write'].includes(page)) {
                    toast(error instanceof AuthError ? error.message : '티켓을 불러오지 못했어요');
                }
            }
        })();
        if (!['home', 'search', 'movie'].includes(page)) await sessionReady;

        // 로그인이 필요한 화면 (홈 · 검색 · 로그인 · 작성은 비로그인 허용)
        if (['ticketbook', 'calendar', 'detail'].includes(page) && needLogin('myTickets', { replace: true })) return;

        if (['home', 'search', 'movie'].includes(page)) {
            // 로그인 정보가 오면 하트 상태를 맞춘다
            void sessionReady.then(() => { initAvatar(); data.favorites.forEach((f) => syncHeartButtons(f.movieId)); });
        } else initAvatar();
        const routes = { home: initHome, search: initSearch, movie: initMovieDetail, write: initWrite, login: initLogin, ticketbook: initTicketbook, calendar: initCalendar, detail: initDetail };
        const chartRefreshesFor = () => {
            if (page === 'home' || page === 'search') return [refreshLiveCgvChart(), refreshLiveLotteChart(), refreshLiveMegaboxChart()];
            return chartApiRefreshesFor();
        };
        const chartApiRefreshesFor = () => {
            if (page === 'movie' || page === 'write') {
                const list = [refreshLiveCgvChart()];
                if (params.get('chart') === 'lotte') list.push(refreshLiveLotteChart());
                if (params.get('chart') === 'megabox') list.push(refreshLiveMegaboxChart());
                return list;
            }
            return [];
        };
        // 저장해 둔 순위로 화면을 바로 그리고, 새 순위가 오면 바꾼다 (빈 화면을 보여 주지 않음)
        (routes[page] || (() => {}))();
        const before = JSON.stringify([data.cgvChartUpdatedAt, data.lotteChartUpdatedAt, data.megaboxChartUpdatedAt]);
        void Promise.all(chartRefreshesFor()).then(() => {
            const after = JSON.stringify([data.cgvChartUpdatedAt, data.lotteChartUpdatedAt, data.megaboxChartUpdatedAt]);
            if (page !== 'home' && before !== after && typeof data.onChartsUpdated === 'function') data.onChartsUpdated();
        });
        if (page === 'home') {
            setInterval(() => { if (!document.hidden) void Promise.all([reloadLiveChartsFile(), ...chartRefreshesFor()]); }, CGV_CHART_REFRESH_MS);
        }
        // 화면에 다시 들어올 때(뒤로 가기·탭 전환)마다 순위를 새로 받아 온다
        const refreshOnReturn = async () => {
            if (!['home', 'search', 'movie'].includes(page)) return;
            const before = JSON.stringify([data.cgvChartUpdatedAt, data.lotteChartUpdatedAt, data.megaboxChartUpdatedAt]);
            await Promise.all([reloadLiveChartsFile(), ...chartRefreshesFor()]);
            const after = JSON.stringify([data.cgvChartUpdatedAt, data.lotteChartUpdatedAt, data.megaboxChartUpdatedAt]);
            if (before !== after && typeof data.onChartsUpdated === 'function') data.onChartsUpdated();
        };
        window.addEventListener('pageshow', (event) => { if (event.persisted) void refreshOnReturn(); });
        document.addEventListener('visibilitychange', () => { if (!document.hidden) void refreshOnReturn(); });
    }

    init();
})();
