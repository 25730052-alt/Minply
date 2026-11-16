/* 나만의 모바일 티켓북 — 사용자 행동과 화면 상태 변경
   한 파일에서 body[data-page] 값으로 화면별 동작을 나눈다.
   home · search · write(작성/저장 완료) · login · ticketbook · calendar · detail */
(() => {
    'use strict';

    /* ===== 상수 ===== */
    const STORE = { tickets: 'ticketbook.tickets', user: 'ticketbook.user', users: 'ticketbook.users' };
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
            movieId, title, releaseDate, genreIds, popularity, availableOn, posterPath: FALLBACK_MOVIE_POSTERS[movieId]
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
            ['24708', '극장판 치이카와: 인어 섬의 비밀', '2026-09-30', 'https://cf.lottecinema.co.kr/Media/MovieFile/MovieImg/202609/24708_503_1.jpg', 9.67],
            ['25030', '극장판 마법소녀 마도카 마기카 ＜발푸르기스의 회천＞', '2026-11-04', 'https://cf.lottecinema.co.kr/Media/MovieFile/MovieImg/202611/25030_503_1.jpg', 6.61],
            ['10893', '라라랜드', '2026-11-11', 'https://cf.lottecinema.co.kr/Media/MovieFile/MovieImg/201612/10893_503_1.jpg', 3.32],
            ['24754', '폴2: 데드포인트', '2026-11-11', 'https://cf.lottecinema.co.kr/Media/MovieFile/MovieImg/202609/24754_503_1.jpg', 2.52],
            ['24998', '최종면접', '2026-11-04', 'https://cf.lottecinema.co.kr/Media/MovieFile/MovieImg/202611/24998_503_1.jpg', 1.99],
            ['25018', '그대, 별처럼', '2026-10-28', 'https://cf.lottecinema.co.kr/Media/MovieFile/MovieImg/202610/25018_503_1.jpg', 1.51],
            ['14449', '포드 V 페라리', '2026-11-09', 'https://cf.lottecinema.co.kr/Media/MovieFile/MovieImg/201911/14449_503_1.jpg', 1.21],
            ['24867', '하트 오브 비스트', '2026-10-28', 'https://cf.lottecinema.co.kr/Media/MovieFile/MovieImg/202610/24867_503_1.jpg', 1.09],
            ['24744', '스크루지: 크리스마스 캐럴', '2026-11-11', 'https://cf.lottecinema.co.kr/Media/MovieFile/MovieImg/202611/24744_503_1.jpg', 0.94],
            ['25189', '마리 앙투아네트', '2026-11-11', 'https://cf.lottecinema.co.kr/Media/MovieFile/MovieImg/202611/25189_503_1.jpg', 0.57],
            ['25010', '와일드 호스 나인', '2026-11-04', 'https://cf.lottecinema.co.kr/Media/MovieFile/MovieImg/202611/25010_503_1.jpg', 0.57],
            ['25022', '여전히 찬란하게', '2026-10-21', 'https://cf.lottecinema.co.kr/Media/MovieFile/MovieImg/202610/25022_503_1.jpg', 0.5],
            ['24128', '오디세이', '2026-08-05', 'https://cf.lottecinema.co.kr/Media/MovieFile/MovieImg/202607/24128_503_1.jpg', 0.45],
            ['24654', '타짜: 벨제붑의 노래', '2026-09-23', 'https://cf.lottecinema.co.kr/Media/MovieFile/MovieImg/202609/24654_503_1.jpg', 0.45],
            ['14171', '알라딘', '2026-11-09', 'https://cf.lottecinema.co.kr/Media/MovieFile/MovieImg/201905/14171_503_1.jpg', 0.35],
            ['25095', '호루몽', '2026-11-11', 'https://cf.lottecinema.co.kr/Media/MovieFile/MovieImg/202611/25095_503_1.jpg', 0.34],
            ['25065', '프레셔', '2026-11-11', 'https://cf.lottecinema.co.kr/Media/MovieFile/MovieImg/202611/25065_503_1.jpg', 0.3],
            ['25138', '삼춘, 어디 감수광?', '2026-11-11', 'https://cf.lottecinema.co.kr/Media/MovieFile/MovieImg/202611/25138_503_1.jpg', 0.18],
            ['24623', '암살자(들)', '2026-09-23', 'https://cf.lottecinema.co.kr/Media/MovieFile/MovieImg/202609/24623_503_1.jpg', 0.15],
            ['13319', '보헤미안 랩소디', '2026-11-09', 'https://cf.lottecinema.co.kr/Media/MovieFile/MovieImg/201810/13319_503_1.jpg', 0.1]
        ].map(([movieCode, title, releaseDate, posterPath, reservationRate], index) => ({
            movieCode, title, releaseDate, posterPath, reservationRate, rank: index + 1, source: 'lotte'
        }))
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
    function posterHtml(title, path, cls = '', badge = '', badgeClass = '', source = '') {
        const imagePath = path && /^https?:\/\//i.test(path) ? path : path ? ROOT + path : '';
        const img = imagePath ? `<img src="${esc(imagePath)}" alt="${esc(title)} 포스터" loading="lazy">` : '';
        const sourceLabel = source === 'json' ? 'JSON 파일' : source === 'cgv' ? 'CGV' : source === 'lotte' ? '롯데시네마' : 'API';
        const sourceMark = source ? `<span class="movie-source movie-source--${source}" title="${sourceLabel}에서 불러옴" aria-label="${sourceLabel}에서 불러옴">${source === 'json' ? 'J' : source === 'cgv' ? 'C' : source === 'lotte' ? 'L' : 'A'}</span>` : '';
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
    const data = {
        movies: [], genres: [], samples: [], lotteMovies: [], activeChartProvider: 'cgv',
        tickets: local.get(STORE.tickets, []), user: local.get(STORE.user, null)
    };
    const movieById = (id) => data.movies.find((m) => m.movieId === id);
    const genreName = (id) => (data.genres.find((g) => g.id === id) || {}).name || '';
    const myTickets = () => (data.user ? data.tickets.filter((t) => t.userId === data.user.userId) : []);
    const saveTickets = () => local.set(STORE.tickets, data.tickets);

    const CGV_CHART_REFRESH_MS = 5 * 60 * 1000;
    function mergeCgvChart(chart) {
        if (!Array.isArray(chart.movies)) throw new Error('CGV 무비차트 데이터 형식이 올바르지 않습니다');

        data.cgvChartAsOf = chart.asOf || data.cgvChartAsOf;
        data.cgvChartUpdatedAt = chart.updatedAt || null;
        data.cgvChartIsLive = chart.isLive === true;
        const releasedMovies = chart.movies
            .filter((movie) => {
                if (!/^\d{4}-\d{2}-\d{2}$/.test(movie.releaseDate || '')) return false;
                const releaseDate = new Date(`${movie.releaseDate}T00:00:00`);
                return !Number.isNaN(releaseDate.getTime()) &&
                    ymd(releaseDate) === movie.releaseDate &&
                    movie.releaseDate <= ymd(today);
            })
            .sort((a, b) =>
                (Number(b.cgvReservationRate) || 0) - (Number(a.cgvReservationRate) || 0) ||
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
                overview: chartMovie.overview || existing?.overview || '',
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

    function mergeLotteChart(chart) {
        if (!Array.isArray(chart.movies)) throw new Error('롯데시네마 무비차트 데이터 형식이 올바르지 않습니다');
        data.lotteChartAsOf = chart.asOf || data.lotteChartAsOf;
        data.lotteChartUpdatedAt = chart.updatedAt || null;
        data.lotteChartIsLive = chart.isLive === true;
        data.lotteMovies = chart.movies
            .filter((movie) => {
                if (!/^\d{4}-\d{2}-\d{2}$/.test(movie.releaseDate || '') ||
                    !/^\d+$/.test(String(movie.movieCode || ''))) return false;
                const releaseDate = new Date(`${movie.releaseDate}T00:00:00`);
                return !Number.isNaN(releaseDate.getTime()) &&
                    ymd(releaseDate) === movie.releaseDate &&
                    movie.releaseDate <= ymd(today);
            })
            .sort((a, b) =>
                (Number(b.reservationRate) || 0) - (Number(a.reservationRate) || 0) ||
                (Number(a.rank) || Infinity) - (Number(b.rank) || Infinity)
            )
            .map((movie, index) => ({ ...movie, rank: index + 1, source: 'lotte' }));
    }

    function renderCinemaChart(reset = false) {
        const cgvCarousel = $('#cinemaMovieChart');
        if (!cgvCarousel) return;
        const selectedCard = cgvCarousel.querySelector('.cgv-chart-card.is-active');
        const selectedIndex = reset ? 0 : Number(selectedCard?.dataset.chartIndex) || 0;
        const isCgv = data.activeChartProvider === 'cgv';
        const provider = isCgv ? 'CGV' : '롯데시네마';
        const movies = isCgv ? data.cgvMovies : data.lotteMovies;
        if (!movies.length) {
            cgvCarousel.innerHTML = `<p class="empty-note">${provider} 개봉작을 불러오지 못했습니다.</p>`;
            $$('[data-chart-scroll]').forEach((button) => { button.hidden = true; button.disabled = true; });
            return;
        }
        const rankedMovies = movies.slice(0, 20);
        const renderCard = (movie, index, copy) => {
            const duplicate = copy !== 'main';
            const rank = isCgv ? movie.cgvRank || index + 1 : movie.rank || index + 1;
            const rate = isCgv ? movie.cgvReservationRate : movie.reservationRate;
            const href = isCgv
                ? `${url('movie')}?movieId=${movie.movieId}`
                : `https://www.lottecinema.co.kr/NLCHS/Movie/MovieDetailView?movie=${encodeURIComponent(movie.movieCode)}`;
            return `
            <a class="cgv-chart-card" data-chart-copy="${copy}" data-chart-index="${index}" role="${duplicate ? 'presentation' : 'listitem'}" href="${href}"${isCgv ? '' : ' target="_blank" rel="noopener noreferrer"'}${duplicate ? ' aria-hidden="true" tabindex="-1"' : ''} aria-label="${provider} 예매율 순위 ${rank}위 ${esc(movie.title)} 상세 보기">
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
        if (activeCard) {
            activeCard.classList.add('is-active');
            cgvCarousel.scrollLeft = centerCinemaChartCard(cgvCarousel, activeCard);
        }
        updateCgvArrows(cgvCarousel);
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
            const response = await fetch(`${ROOT}api/cgv-chart`, { cache: 'no-store' });
            if (!response.ok) throw new Error(`CGV chart request failed (${response.status})`);
            const chart = await response.json();
            mergeCgvChart(chart);
            if (data.activeChartProvider === 'cgv') {
                renderCinemaChart();
            }
            if (page === 'home') renderCommunityReviews();
        } catch (error) {
            console.warn('CGV 무비차트 실시간 갱신에 실패했습니다.', error);
        }
    }

    async function refreshLiveLotteChart() {
        try {
            const response = await fetch(`${ROOT}api/lotte-chart`, { cache: 'no-store' });
            if (!response.ok) throw new Error(`Lotte Cinema chart request failed (${response.status})`);
            mergeLotteChart(await response.json());
            if (data.activeChartProvider === 'lotte') {
                renderCinemaChart();
            }
        } catch (error) {
            console.warn('롯데시네마 무비차트 실시간 갱신에 실패했습니다.', error);
        }
    }

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
                local.del(STORE.user);
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
        const evergreenNetflixMovies = data.movies
            .filter((movie) =>
                movie.source !== 'cgv' &&
                movie.availableOn?.includes('ott') &&
                movie.releaseDate &&
                Number(movie.releaseDate.slice(0, 4)) <= 2020
            )
            .sort((a, b) =>
                (Number(b.voteCount) || Number(b.popularity) || 0) -
                (Number(a.voteCount) || Number(a.popularity) || 0)
            )
            .slice(0, 9);
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
                                <span class="community-review__rating"><i class="fa-solid fa-star" aria-hidden="true"></i> ${movie.movieId === 30001323
                                            ? '4.5 / 5.0'
                                    : Number(movie.voteAverage) > 0 ? `${(Number(movie.voteAverage) / 2).toFixed(1)} / 5.0` : '평점 정보 없음'}</span>
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
        const moveChart = (direction, duration = 900, onComplete) => {
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
            const movies = data.activeChartProvider === 'cgv' ? data.cgvMovies : data.lotteMovies;
            if (reducedMotion || pointerInside || hasFocus || brieflyPaused || document.hidden || movies.length < 2) return;
            autoTimer = setTimeout(() => moveChart(1, 1200, scheduleAutoAdvance), 4200);
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

        const getTheaterMovies = () => {
            const normalizeTitle = (title) => String(title || '').toLocaleLowerCase('ko-KR').replace(/[\s:：·-]/g, '');
            const matchedLotteTitles = new Set();
            const movies = data.movies.map((movie) => {
                const normalizedTitle = normalizeTitle(movie.title);
                const lotteMovie = data.lotteMovies.find((item) => normalizeTitle(item.title) === normalizedTitle);
                if (!lotteMovie) return movie;
                matchedLotteTitles.add(normalizedTitle);
                const lotteRank = Number(lotteMovie.rank) || Infinity;
                return {
                    ...movie,
                    availableOn: [...new Set([...(movie.availableOn || []), 'theater'])],
                    lotteMovieCode: String(lotteMovie.movieCode),
                    lotteRank,
                    lotteReservationRate: Number(lotteMovie.reservationRate) || 0,
                    theaterRank: Math.min(Number(movie.cgvRank) || Infinity, lotteRank)
                };
            });
            data.lotteMovies.forEach((movie) => {
                if (matchedLotteTitles.has(normalizeTitle(movie.title))) return;
                const rank = Number(movie.rank) || Infinity;
                movies.push({
                    ...movie,
                    movieId: `lotte-${movie.movieCode}`,
                    genreIds: [],
                    popularity: Number(movie.reservationRate) || 0,
                    voteAverage: 0,
                    availableOn: ['theater'],
                    lotteRank: rank,
                    lotteReservationRate: Number(movie.reservationRate) || 0,
                    theaterRank: rank,
                    source: 'lotte'
                });
            });
            return movies;
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
                        const rankDifference = (a.theaterRank ?? a.cgvRank ?? a.lotteRank ?? Infinity) -
                            (b.theaterRank ?? b.cgvRank ?? b.lotteRank ?? Infinity);
                        if (rankDifference) return rankDifference;
                        const reservationDifference = Math.max(Number(b.cgvReservationRate) || 0, Number(b.lotteReservationRate) || 0) -
                            Math.max(Number(a.cgvReservationRate) || 0, Number(a.lotteReservationRate) || 0);
                        if (reservationDifference) return reservationDifference;
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

        function renderResults() {
            const list = filtered();
            const empty = list.length === 0;
            $('#queryClear').hidden = !s.query;
            $('#searchEmpty').hidden = !empty;
            $('#movieGrid').hidden = empty;
            $('#resultCount').textContent = empty ? '검색 결과 · 0편' : `${s.query || s.genreId || s.viewType !== 'all' ? '검색 결과' : '인기 영화'} ${list.length}편`;
            $('#loadMoreMovies').hidden = !apiHasMore;
            $('#movieGrid').innerHTML = list.map((m) => {
                const lotteOnly = m.source === 'lotte' && m.movieCode;
                const href = lotteOnly
                    ? `https://www.lottecinema.co.kr/NLCHS/Movie/MovieDetailView?movie=${encodeURIComponent(m.movieCode)}`
                    : `${url('movie')}?movieId=${encodeURIComponent(m.movieId)}`;
                return `
                <a class="card" href="${href}"${lotteOnly ? ' target="_blank" rel="noopener noreferrer"' : ''}>
                    ${posterHtml(m.title, m.posterPath, '', String(m.cgvRank || m.lotteRank || m.rank).padStart(2, '0'), 'badge--rank', m.source)}
                    <p class="card__t">${esc(m.title)}</p>
                    <p class="card__m">${m.releaseDate?.slice(0, 4) || (m.source === 'cgv' ? 'CGV 상영 중' : '')}${m.genreIds[0] ? ' · ' + esc(genreName(m.genreIds[0])) : ''}${m.voteAverage ? ` · ★ ${m.voteAverage.toFixed(1)}` : ''}</p>
                </a>`;
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
            btn.disabled = true;
            btn.textContent = '저장 중…';
            setTimeout(() => {
                const fields = {
                    movieId: draft.movieId, movieTitle: draft.movieTitle, posterUrl: draft.posterUrl, watchedAt: draft.watchedAt,
                    viewType: draft.viewType, place: draft.place.trim(), oneLineReview: draft.oneLineReview.trim(),
                    diary: draft.diary.trim(), tags: draft.tags, isPublic: draft.isPublic, rating: draft.rating, ticketImageUrl: ''
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
            ${t.rating ? `<p class="ticket__rating">★ ${formatRating(t.rating)} / 5</p>` : ''}
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
                data.tickets = data.tickets.filter((x) => x.ticketId !== t.ticketId);
                saveTickets();
                location.replace(url('ticketbook'));
            }
        });
    }

    async function initMovieDetail() {
        const movieId = Number(params.get('movieId'));
        let movie = movieById(movieId);
        if (!movie && movieId) {
            const response = await loadJson(`api/movie/${movieId}`, null);
            movie = response?.movie;
        }
        if (!movie || (movie.source !== 'cgv' && movie.releaseDate && movie.releaseDate > ymd(today))) {
            $('#movieDetail').innerHTML = '<section class="empty"><h2>영화 정보를 찾을 수 없습니다</h2><a class="btn btn--dark" href="search.html">영화 검색</a></section>';
            return;
        }

        const genres = movie.genreIds.map((id) => genreName(id)).filter(Boolean);
        const movieMeta = [
            movie.releaseDate ? movie.releaseDate.slice(0, 4) : '',
            genres.join(' · '),
            movie.runtime ? `${movie.runtime}분` : ''
        ].filter(Boolean).join(' · ');
        const sourceName = movie.source === 'cgv' ? 'CGV 무비차트' : movie.source === 'json' ? 'J · JSON 파일' : 'A · TMDb API';
        const reviewData = movie.source === 'cgv' ? { reviews: [] } : await loadJson(`api/movie/${movieId}/reviews`, { reviews: [] });
        const audienceReviews = data.tickets
            .filter((ticket) => ticket.movieId === movieId && ticket.isPublic === true && ticket.oneLineReview?.trim())
            .sort((a, b) => b.createdAt.localeCompare(a.createdAt))
            .map((ticket) => {
                const author = local.get(STORE.users, []).find((user) => user.userId === ticket.userId)?.nickname || '관객';
                return {
                    author,
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
            const story = (movie.overview || `${movie.title}의 이야기`).split(/[.!?]/)[0].slice(0, 25);
            return [
                `${story}의 이야기가 특히 궁금해요.`,
                `${movie.title}의 인물들이 어떤 선택을 할지 기대돼요.`,
                `${story}라는 설정이 흥미로워요.`,
                `${movie.title}의 줄거리와 분위기가 마음에 들어요.`,
                `인물들이 마주할 위기와 선택이 기대됩니다.`,
                `${movie.title}이 어떤 여운을 남길지 궁금해요.`
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
        $('#movieDetail').innerHTML = `
            <section class="movie-detail">
                <div class="movie-detail__head">
                    ${posterHtml(movie.title, movie.posterPath, 'poster--movie', '', '', movie.source)}
                    <div class="movie-detail__intro">
                        ${movie.cgvRank ? `<p class="movie-detail__rank">예매율 순위 ${movie.cgvRank}위</p>` : movie.rank ? `<p class="movie-detail__rank">인기 순위 ${movie.rank}위</p>` : ''}
                        <h2 class="movie-detail__title">${esc(movie.title)}</h2>
                        ${movie.originalTitle && movie.originalTitle !== movie.title ? `<p class="movie-detail__original">${esc(movie.originalTitle)}</p>` : ''}
                        ${movieMeta ? `<p class="movie-detail__meta">${esc(movieMeta)}</p>` : ''}
                        ${movie.source === 'cgv'
                            ? `<p class="movie-detail__rating">예매율 ${Number(movie.cgvReservationRate).toFixed(1)}%</p>`
                            : `<p class="movie-detail__rating"><i class="fa-solid fa-star" aria-hidden="true"></i> ${(Number(movie.voteAverage) / 2).toFixed(1)} / 5.0 <span>(${Number(movie.voteCount).toLocaleString()}명)</span></p>`}
                    </div>
                </div>
                ${movie.source !== 'json' ? `<p class="movie-detail__source">${sourceName}${movie.source === 'cgv' ? ` · ${dotDate(data.cgvChartAsOf)} 기준 · 누적 관객 ${esc(movie.cgvAdmissions || '정보 없음')}` : '에서 불러온 개봉 영화 정보'}</p>` : ''}
                <section class="movie-detail__section">
                    <h3>줄거리</h3>
                    <p>${esc(movie.overview || '등록된 줄거리가 없습니다.')}</p>
                </section>
                <section class="movie-detail__section">
                    <h3>${isDemoReviews ? '추천 리뷰' : '관객 리뷰'}</h3>
                    <div id="movieReviewList">${renderReviewCards(visibleReviewCount)}</div>
                    <button type="button" class="btn movie-review__more" id="movieReviewMore" ${displayedReviews.length <= visibleReviewCount ? 'hidden' : ''}>더보기</button>
                </section>
                <a class="btn btn--dark btn--full" href="${url('write')}?movieId=${movie.movieId}">관람 기록 작성</a>
            </section>`;
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
        data.genres = movieData.genres;
        mergeCgvChart(cgvData);
        mergeLotteChart(FALLBACK_LOTTE_CHART);
        data.samples = sampleData.samples;
        data.apiNextPage = apiData.nextPage;
        data.apiNextOffset = apiData.nextOffset;
        data.apiNextRank = apiData.nextRank;
        data.apiHasMore = apiData.hasMore;
        initTopButton();

        // 로그인이 필요한 화면 (홈 · 검색 · 로그인 · 작성은 비로그인 허용)
        if (['ticketbook', 'calendar', 'detail'].includes(page) && needLogin('myTickets', { replace: true })) return;

        initAvatar();
        const routes = { home: initHome, search: initSearch, movie: initMovieDetail, write: initWrite, login: initLogin, ticketbook: initTicketbook, calendar: initCalendar, detail: initDetail };
        if (location.protocol !== 'file:' && ['search', 'movie', 'write'].includes(page)) {
            const chartRefreshes = [refreshLiveCgvChart()];
            if (page === 'search') chartRefreshes.push(refreshLiveLotteChart());
            await Promise.all(chartRefreshes);
        }
        (routes[page] || (() => {}))();
        if (page === 'home' && location.protocol !== 'file:') {
            const refreshLiveCharts = () => Promise.all([refreshLiveCgvChart(), refreshLiveLotteChart()]);
            void refreshLiveCharts();
            setInterval(refreshLiveCharts, CGV_CHART_REFRESH_MS);
        }
    }

    init();
})();
