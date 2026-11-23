# 🎬 FILM LOG — 나만의 모바일 티켓북 & 실관람평 다이어리 (Minply)

> 영화 포스터로 남기는 관람 기록. 본 영화를 티켓으로 만들고, 한 줄 평과 다이어리로 그날의 감상을 모아 보는 모바일 웹 서비스입니다.

이 문서는 프로젝트의 **변경 이력(Change Log)** 과 **PRD(제품 요구사항 문서)** 를 함께 관리합니다. 화면·기능이 바뀌면 아래 변경 이력에 버전을 추가하고, PRD의 해당 항목을 같이 갱신합니다.

- **현재 버전:** v0.6.5 (검색 정렬에서 제목순 제거)
- **최종 수정일:** 2026-11-23

---

## 목차

1. [변경 이력](#1-변경-이력-change-log)
2. [PRD](#2-prd-product-requirements-document)
   - 2.1 개요 · 2.2 목표 · 2.3 대상 사용자 · 2.4 기능 범위 · 2.5 정보 구조 · 2.6 화면별 요구사항 · 2.7 데이터 모델 · 2.8 기술 스택 · 2.9 비기능 요구사항 · 2.10 알려진 이슈 · 2.11 다음 단계
3. [폴더 구조](#3-폴더-구조)
4. [실행 방법](#4-실행-방법) · 4.1 클라우드 DB(Supabase) 연결

---

## 1. 변경 이력 (Change Log)

| 버전 | 주차 | 단계 | 주요 변경 내용 | 버전별 파일 |
|---|---|---|---|---|
| **v0.6.6** | 11주차 | 홈 찜 하트 | 무비차트·실시간 관객 평점 랭킹 포스터에 찜 하트, 랭킹 오른쪽에 큰 평점·별점 게이지, 제목 아래 장르 태그 | `css`, `js` |
| **v0.6.5** | 11주차 | 검색 정렬 정리 | 검색 화면 정렬에서 제목순 제거 (인기순·최신순만) | `js`, `pages` |
| **v0.6.5** | 11주차 | 검색 화면 정리 | 검색·마이 티켓북 정렬에서 제목순 제거, 검색 결과 포스터의 순위 숫자 제거 | `js`, `pages` |
| **v0.6.4** | 11주차 | 롯데 포스터 수정 | 잘못 들어간 테스트 순위 데이터 삭제, 포스터 요청 시 출처(Referer) 숨김, 포스터가 안 열리면 다른 크기·같은 제목 포스터로 자동 대체 | `data`, `js` |
| **v0.6.3** | 11주차 | 켜자마자 순위 갱신 | 자동 갱신 등록 시 PC를 켜고 로그인하면 바로 한 번 순위 갱신(인터넷 연결될 때까지 재시도), 이후 10분마다 갱신 | `js` |
| **v0.6.2** | 11주차 | 화면 고정·줄거리 | 모바일에서 상단 바·하단 탭 고정, 줄거리 없던 상영작 줄거리 추가(새 영화는 server.py가 자동으로 찾아 채움), 찜한 영화 탭·목록 정리 | `css`, `js`, `pages` |
| **v0.6.1** | 11주차 | 순위 자동 반영 | `data/live-charts.js` 추가 — 예약 작업이 10분마다 영화관 순위를 저장해 index.html을 파일로 열어도 최신 순위 표시, 사이트와 같은 순서·목록 사용, 순위 보기 링크 제거 | (루트) |
| v0.6 | 11주차 | 찜한 영화 | 하트를 눌러 영화 찜(검색 결과 포스터·영화 상세), 마이 티켓북 `찜한 영화` 탭, 클라우드 DB `app_favorites` 저장 | (루트) |
| v0.5.3 | 11주차 | 화면 즉시 표시 | 포스터를 누르면 영화 상세가 바로 뜨도록(순위·리뷰는 뒤에서 채움), 마지막 실시간 순위 저장해 바로 표시, 서버는 저장해 둔 순위로 즉시 응답, 자동 넘김 더 빠르게, 무비차트 옆 실시간 표시 제거 | (루트) |
| v0.5.2 | 11주차 | 순위 실시간 반영 | 화면에 들어올 때마다 CGV·롯데시네마·메가박스 순위 새로 받기, 서버 캐시 1분, 파일로 열어도 서버가 켜져 있으면 실시간 순위, 무비차트 옆 갱신 상태 표시 | (루트) |
| v0.5.1 | 11주차 | 닉네임 로그인 | 이메일 대신 닉네임·비밀번호 로그인(DB에서 bcrypt 해시), 처음 시작하면 회원가입부터, 가입 안 한 닉네임으로 로그인하면 회원가입 안내, 로그인 화면 안내 문구 정리 | (루트) |
| v0.5 | 11주차 | 인증·클라우드 DB | Supabase 회원 인증(이메일·비밀번호) + Postgres 티켓 저장(RLS), 미연결 시 기기 저장 모드(비밀번호 PBKDF2 해시), 예전 평문 비밀번호 자동 해시 전환, 기기 저장 티켓 계정 이전 | (루트) |
| v0.4.2 | 10주차 | OTT·디자인 보강 | 넷플릭스 OTT 전용 최신작 7편 추가, 평점 랭킹 영화 줄거리 표시, 전체 모서리 둥글게, 저장 완료 버튼 가로 배치 | (루트) |
| v0.4.1 | 10주차 | 무비차트 보강 | 메가박스 무비차트 추가, 포스터 하단 페이지 점, 자동 넘김 속도 단축, 롯데시네마·메가박스 영화도 앱 내 영화 상세로 이동 | (루트) |
| v0.4 | 9주차 | 화면 고도화 | 홈을 와이어프레임 0.4 기준으로 개편(CGV 상영작 캐러셀, 평점 랭킹 TOP 10), 헤더 통일, 티켓 작성에 평점·공개 범위 추가 | `pages/v0.4/` |
| v0.3 | 7주차 | TMDB API 연동 | 로컬 서버(`server.py`)로 TMDB API 연동, 영화 상세 화면 추가, 검색 `더 보기` | `pages/v0.3/` |
| v0.2 | 6주차 | 인터페이스 구조화 | 사이트맵 기준 7개 화면 구성, 단일 `app.js` + `data/*.json` 구조로 재작성 | `pages/v0.2/` |
| v0.1 | 3~5주차 | 기획 · 첫 화면 제작 | 아이디어 선정, MVP·User Flow·와이어프레임, 첫 화면(FILM LOG) 제작 | `pages/v0.1/` |

> 각 `pages/v0.x/` 폴더는 해당 주차 결과물의 화면 코드(html·css·js) 스냅샷입니다. 용량이 큰 `tmdb_5000_movies.csv`는 루트 `data/`에만 두고, API 키가 든 `.env`는 포함하지 않았습니다.

### v0.6.6 — 11주차: 홈 화면 찜 하트 · 랭킹 평점 칸

- 추가: **무비차트 포스터 오른쪽 아래 찜 하트** (CGV·롯데시네마·메가박스 모두). 누르면 상세로 넘어가지 않고 바로 찜, 같은 영화의 하트는 함께 바뀜
- 추가: **실시간 관객 평점 랭킹 포스터에 작은 찜 하트**
- 변경: 랭킹 오른쪽 빈칸에 **큰 평점 숫자 + 별점 게이지(소수점만큼 채움)**, 아래에 `/ 5.0`
- 추가: 랭킹 제목 아래 **장르 태그**(최대 2개), CGV 상영작은 개봉 연도도 함께 표시

### v0.6.5 — 11주차: 검색 정렬 정리

- 제거: 검색 화면 정렬의 `제목순` — 이제 `인기순`·`최신순`만. 예전에 제목순을 골라 둔 상태로 들어오면 인기순으로 보여 줌 (마이 티켓북 정렬은 그대로)

### v0.6.5 — 11주차: 검색 화면 정리

- 제거: 검색 정렬의 `제목순` — 인기순·최신순만 남김 (예전에 제목순을 골라 둔 경우 인기순으로)
- 제거: 마이 티켓북 정렬의 `제목순` — 최근 관람순·오래된 관람순만 남김 (예전에 제목순을 골라 둔 경우 최근 관람순으로)
- 제거: 검색 결과 포스터 왼쪽 위의 순위 숫자(01, 02 …)
- 수정: 장르 이름이 없는 영화의 `2026 ·`처럼 점만 남던 표시

### v0.6.4 — 11주차: 롯데시네마 포스터 표시 수정

- 수정: `data/live-charts.js`에 **테스트용 가짜 순위(포스터 없음)가 잘못 들어가 있던 문제** — 처음 상태로 되돌림. 브라우저에 이미 저장된 예전 순위도 버리도록 저장 이름을 `ticketbook.liveCharts.v2`로 변경
- 변경: 포스터 이미지를 불러올 때 **출처(Referer)를 보내지 않음** (`referrerpolicy="no-referrer"`) — `server.py`(127.0.0.1)로 열었을 때 영화관 이미지 서버가 다른 사이트 요청으로 보고 막는 경우 대비
- 추가: **포스터가 안 열리면 자동 대체** — 롯데시네마는 같은 포스터의 다른 크기 파일(`_101_` → `_103_` …), 그래도 없으면 앱 데이터에 있는 같은 제목 영화 포스터. 끝까지 없으면 영화 제목을 대신 보여 줌

### v0.6.3 — 11주차: PC를 켜자마자 순위 갱신

- 추가: `python js/server.py --install-auto-update` 한 번으로 **PC를 켜고 로그인하면 바로 영화관 순위를 한 번 갱신** — Windows는 시작프로그램 폴더에 창 없이 실행되는 작은 파일을 넣고(관리자 권한 필요 없음), macOS·Linux는 crontab `@reboot` 사용. 프로젝트 폴더 구조는 그대로
- 변경: 켜자마자 갱신할 때 인터넷이 아직 안 잡혔으면 30초 간격으로 최대 6번(약 3분) 다시 시도
- 그대로: 켜져 있는 동안은 10분마다 갱신 → 날짜가 바뀌어도 10분 안에 새 순위 반영. PC가 꺼져 있던 동안은 마지막 순위가 보이고, 켜면 바로 최신으로 바뀜
- 변경: `--remove-auto-update`가 10분 예약 작업과 켜질 때 갱신을 함께 지움

### v0.6.2 — 11주차: 모바일 화면 고정 · 줄거리 보강

- 변경: **모바일에서 상단 바와 하단 탭이 움직이지 않음** — 앱 화면을 화면에 고정하고 가운데 내용만 스크롤. 페이지가 통째로 끌려 내려가거나 튕기는 현상 막음, 아이폰 노치·홈 바 영역도 고려 (`viewport-fit=cover`, `safe-area-inset`)
- 추가: **줄거리가 없던 상영작 29편의 줄거리** (폭설, 룩백, 실낙원, 흐르는 여정, 극장판 카드캡터 체리 : 봉인된 카드, 보헤미안 랩소디, 알라딘 등). 영화관 순위 데이터에는 줄거리가 없어서 제목으로 찾아 채움
- 추가: `server.py`가 순위를 받을 때 **줄거리가 없는 새 영화는 자동으로 줄거리를 찾아 저장** (롯데시네마 영화 상세 → TMDB 키가 있으면 TMDB 순, 한 번 찾은 결과는 기억)
- 변경: 찜한 영화 목록의 날짜 옆 `찜` 글자, `찜한 영화` 탭의 하트 아이콘 제거

### v0.6.1 — 11주차: 파일로 열어도 영화관 순위 자동 반영

- 추가: **`data/live-charts.js`** — `server.py`가 CGV·롯데시네마·메가박스 순위를 받아 저장하는 파일. 브라우저는 다른 사이트의 순위는 직접 못 읽지만(CORS) 폴더 안의 `.js` 파일은 `<script>`로 읽을 수 있어서, **index.html을 파일로 바로 열어도 최신 순위가 보임**
- 추가: `python js/server.py --install-auto-update` — 컴퓨터에 **10분마다 순위를 갱신하는 예약 작업** 등록(Windows 작업 스케줄러 / macOS·Linux crontab, 창이 뜨지 않음). 한 번만 실행하면 이후엔 아무것도 누르지 않아도 됨. 해제: `--remove-auto-update`, 지금 한 번 갱신: `--update-charts`
- 변경: `server.py`를 켜 두는 동안에도 1분마다 `data/live-charts.js` 갱신. 한 영화관이 실패하면 그 영화관은 직전에 저장한 순위를 유지
- 변경: 앱은 화면에 들어올 때마다(다시 돌아올 때·홈에서는 1분마다 포함) `data/live-charts.js`를 다시 읽어 바뀐 순위를 바로 반영
- 변경: **영화관 사이트와 같은 순서·목록** — 실시간 순위는 CGV 무비차트 순위, 롯데시네마 현재 상영작 예매순, 메가박스 박스오피스 순서를 그대로 쓰고 다시 정렬하거나 개봉 예정작을 빼지 않음 (앱에 들어 있는 대체 순위만 기존처럼 개봉작·예매율 순)
- 제거: 무비차트 아래 `○○에서 지금 순위 보기` 링크

### v0.6 — 11주차: 찜한 영화 (즐겨찾기)

- 추가: **하트 버튼으로 영화 찜하기** — 검색 결과 포스터 오른쪽 아래, 영화 상세 제목 오른쪽. 누르면 화면 이동 없이 바로 빨간 하트로 바뀌고 "찜한 영화에 담았어요" 안내, 다시 누르면 해제
- 추가: 마이 티켓북에 **`찜한 영화` 탭** (`pages/ticketbook.html?view=likes`, 새 파일 없음) — 최근에 찜한 순, 하트로 바로 해제, 누르면 영화 상세로 이동 (롯데시네마·메가박스 전용 영화도 상세로 연결)
- 로그인하지 않은 상태에서 하트를 누르면 로그인 화면으로 이동하고, 로그인 후 보던 화면으로 돌아옴
- 저장: 클라우드 모드는 DB `app_favorites` 테이블(`film_my_favorites`, `film_set_favorite` 함수), 기기 저장 모드는 localStorage — 기기가 바뀌어도 같은 닉네임이면 찜 목록 유지
- SQL: 4.1의 SQL에 찜 테이블·함수가 추가됨. **이미 SQL을 실행했다면 4.1의 SQL을 한 번 더 실행**하면 기존 데이터는 그대로 두고 찜 기능만 추가됨

### v0.5.3 — 11주차: 화면 즉시 표시

- 변경: 포스터를 누르면 **영화 상세가 바로 표시** — 화면을 먼저 그리고, 리뷰는 불러와서 채움("리뷰를 불러오는 중…"). 실시간 순위가 새로 오면 순위·예매율만 다시 그림
- 변경: 홈·검색·영화 상세는 로그인 확인과 실시간 순위를 기다리지 않고 바로 그림 (티켓북·작성 등 로그인이 필요한 화면만 기다림)
- 추가: 마지막으로 받은 실시간 순위(24시간 이내)를 브라우저에 저장해 두고, 다음 화면에서 곧바로 표시한 뒤 새 순위로 바꿈
- 변경: `server.py`는 저장해 둔 순위로 즉시 응답하고, 1분이 지났으면 뒤에서 영화관 사이트에 새로 요청 (영화관 응답을 기다리느라 화면이 늦게 뜨지 않음)
- 변경: 무비차트 자동 넘김 간격 2.6초 → **1.7초**, 넘김 동작 0.8초 → 0.55초
- 제거: 무비차트 제목 옆 `실시간 · 시각` 표시

### v0.5.2 — 11주차: 영화관 순위 실시간 반영

- 변경: 홈·검색·영화 상세에 **들어올 때마다** CGV·롯데시네마·메가박스 개봉작 순위를 새로 요청 (뒤로 가기로 돌아오거나 다른 탭에서 돌아올 때도 다시 요청, 홈은 화면을 보는 동안 1분마다 확인)
- 변경: `server.py`의 영화관 순위 캐시 5분 → **1분** (화면 진입이 잦아도 영화관 사이트에 1분에 한 번만 요청)
- 추가: `index.html`을 **파일로 바로 열어도** `server.py`가 켜져 있으면 `http://127.0.0.1:8000`에서 실시간 순위를 받아 옴 (순위 API 3개에만 CORS 허용)
- 추가: 무비차트 제목 옆 상태 표시 — 실시간이면 초록 점과 `실시간 · 14:15`, 서버가 꺼져 있으면 앱에 들어 있는 대체 순위의 `기준일`
- 변경: 검색 화면은 돌아왔을 때 순위가 바뀌었으면 극장 목록을 다시 그림
- 추가: `server.py`를 켜면 세 영화관 순위를 바로 받아 보고 터미널에 `[성공]`/`[실패] 원인`을 표시, 앱 화면(`http://127.0.0.1:8000`)을 브라우저로 자동으로 열기 (`--no-browser`로 끌 수 있음)
- 변경: 무비차트 옆은 실시간일 때만 `실시간 · 시각` 표시, 대체 순위일 때는 날짜 기준 문구를 표시하지 않음
- 변경: 영화 상세 하단의 출처·기준일·누적 관객 줄(예: `CGV 무비차트 · 2026.11.09 기준 · 누적 관객`) 제거
- 추가: 무비차트 아래 **영화관 공식 순위 바로가기** 버튼 (`CGV/롯데시네마/메가박스에서 지금 순위 보기`, 새 창) — 브라우저 보안(CORS) 때문에 링크만으로는 앱 안 순위를 바꿀 수 없어, 서버가 꺼져 있을 때도 공식 순위를 바로 볼 수 있게 연결
- 변경: 롯데시네마 포스터를 큰 이미지로 (`_503_` 200×288 → `_101_` 357×510). 대체 데이터와 실시간 데이터 모두 적용

### v0.5.1 — 11주차: 닉네임 로그인

**로그인 (`pages/login.html`)**
- 변경: 이메일 로그인 → **닉네임·비밀번호 로그인** (닉네임은 대소문자·앞뒤 공백 무시 중복 불가)
- 변경: 제목 "닉네임으로 내 티켓북을 시작하세요", 상단 로그인 사유 안내와 하단 저장 방식 안내 제거
- 추가: 이 기기에서 **처음 시작하면 회원가입 화면부터** 표시 (가입·로그인한 적이 있으면 로그인 화면)
- 추가: 가입하지 않은 닉네임으로 로그인하면 "회원가입을 먼저 해 주세요" 알림 → [회원가입하기]를 누르면 입력값 그대로 회원가입 화면으로 전환
- 변경: 비밀번호가 틀리면 "비밀번호가 맞지 않아요" 안내

**클라우드 DB (Supabase)**
- 변경: Supabase Auth(이메일 필수) 대신 **DB 함수(RPC)로 닉네임 인증** — 비밀번호는 Postgres `pgcrypto`의 bcrypt 해시로만 저장, 로그인하면 30일짜리 세션 토큰 발급(DB에는 토큰의 SHA-256 해시만 저장)
- 변경: 테이블(`app_users`, `app_sessions`, `app_tickets`)은 직접 읽기·쓰기를 모두 막고, 앱은 `film_*` 함수로만 접근. 함수가 세션 토큰을 확인해 본인 티켓만 읽기·수정·삭제, 공개 한줄평만 닉네임과 함께 공개
- 기기 저장 모드(미설정 시)는 그대로 PBKDF2 해시 저장

**디자인**
- 변경: PC에서 보는 모바일 화면 틀의 둥근 모서리·그림자 제거, 화면 위아래를 꽉 채우도록 변경

### v0.5 — 11주차: 실제 회원 인증 · 클라우드 DB

**인증 (`pages/login.html`)**
- 변경: 닉네임 목업 로그인 → **이메일·비밀번호 로그인**, 회원가입 때 닉네임을 함께 받음 (닉네임은 티켓북·공개 리뷰에 표시, 대소문자 무시 중복 불가)
- 추가: **Supabase Auth** 연동 — 비밀번호는 Supabase 서버가 bcrypt 해시로 보관하고 앱은 비밀번호를 저장하지 않음. 로그인 세션은 토큰으로 유지·자동 갱신
- 추가: 이메일 인증이 켜진 프로젝트면 가입 후 "인증 메일을 보냈어요" 안내
- 변경: 비밀번호 규칙 — 영문자+숫자 포함 8~64자 (특수문자도 허용)
- 추가: 로그인 화면에 현재 저장 방식 안내(클라우드 / 기기 저장 모드)

**저장 (`js/app.js`)**
- 추가: 인증·티켓 저장을 `backend` 한 곳으로 모음 — 화면 코드는 `backend.saveTicket()` 등만 호출
- 추가: **클라우드 모드** — 티켓을 Supabase Postgres `tickets` 테이블에 저장, 기기가 바뀌어도 로그인하면 그대로 유지. 행 단위 보안(RLS)으로 내 티켓만 읽기·수정·삭제, 공개 한줄평만 다른 사용자에게 보임
- 추가: **기기 저장 모드**(Supabase 미설정·라이브러리 로드 실패 시) — 비밀번호를 평문 대신 PBKDF2-SHA256(21만 회, 무작위 솔트) 해시로만 저장. 예전 버전이 저장한 평문 비밀번호는 앱을 열 때 자동으로 해시로 바꾸고 지움(기존 닉네임으로 로그인 가능)
- 추가: 클라우드로 처음 로그인할 때 이 기기에만 있던 예전 티켓을 계정으로 옮길지 묻기
- 변경: 저장·삭제·샘플 불러오기 실패 시 오류 안내

**SQL:** 4.1의 스키마(`profiles`, `tickets`, RLS 정책, 가입 시 프로필 생성 트리거, 닉네임 중복 확인 함수)

### v0.4.2 — 10주차: OTT·디자인 보강

**데이터 · 검색**
- 추가: **넷플릭스 OTT 전용 최신작 7편** — 케이팝 데몬 헌터스, 나이브스 아웃: 웨이크 업 데드 맨, 더 립, 남편들, 파반느, 굿뉴스, 대홍수. `movies.json`(TMDB 데이터)과 같은 필드 구조로 `app.js`의 `NETFLIX_ORIGINAL_MOVIES`에 두고 시작할 때 합침(서버가 `movies.json`을 새로 만들어도 유지). `tmdb_5000_movies.csv`는 2016년까지의 영화만 있어 최신작은 넷플릭스 공개 정보로 추가
- 변경: 검색 결과 순위 배지를 현재 목록 순서대로 표시(`undefined` 표시 수정)

**영화 상세**
- 변경: 실시간 관객 평점 랭킹의 OTT 영화를 누르면 줄거리 표시 (`file://` 실행용 대체 데이터에 줄거리 추가)
- 추가: 넷플릭스 전용 영화는 "넷플릭스에서만 볼 수 있는 OTT 영화" 안내 표시
- 수정: 투표 수가 없을 때 `(NaN명)` 표시 제거, 추천 리뷰 예시 문장 다듬기

**디자인**
- 변경: 버튼·입력칸·칩·포스터·카드·대화상자 등 모서리를 모두 둥글게, PC에서 보는 모바일 화면 틀도 둥글게
- 변경: 티켓 저장 완료 화면 하단 버튼 3개를 세로 → **가로 3칸** 배치

### v0.4.1 — 10주차: 무비차트 보강

**홈 (`index.html`)**
- 추가: **메가박스 무비차트** — 롯데시네마 로고 옆에 메가박스 로고 추가. 로컬 서버 실행 시 `/api/megabox-chart`로 메가박스 상영작 예매율 순위를 5분 간격으로 갱신, `file://` 실행에서는 앱에 포함된 대체 목록(2026-11-23 기준 예매율 순위)을 표시
- 추가: 포스터 캐러셀 하단 **페이지 점**(현재 영화는 보라색 막대, 점을 누르면 해당 순위로 이동)
- 변경: 자동 넘김 간격 4.2초 → 2.6초, 넘김 애니메이션 1.2초 → 0.8초
- 변경: 롯데시네마·메가박스 순위 영화를 누르면 외부 사이트 대신 **앱 내 영화 상세**(`pages/movie.html?movieId=…&chart=lotte|megabox`)로 이동. 상세에 영화관별 예매율 순위·예매율·기준일 표시

- 추가: 메가박스 대체 목록 영화 포스터
- 변경: 실시간 관객 평점 랭킹 — `평점 정보 없음` 대신 모든 영화에 평점 표시, 평점 높은 순으로 순위 정렬(1위 오디세이 4.5)

**검색 (`pages/search.html`)**
- 변경: **극장** 필터에서 CGV · 롯데시네마 · 메가박스 개봉작을 모두 표시 (같은 영화는 한 장으로 합치고 상영 영화관과 최고 예매율 표시, 예매율 높은 순)
- 변경: 롯데시네마·메가박스 영화도 앱 내 영화 상세로 이동

### v0.4 — 9주차: 화면 고도화 (와이어프레임 0.4)

**홈 (`index.html`)**
- 변경: **무비차트 TOP 20** — CGV와 롯데시네마 로고로 영화관별 개봉작 예매율 순위를 전환. 각 공식 API를 5분 간격으로 갱신하고, `file://` 실행에서는 저장된 CGV 데이터와 롯데시네마 대체 목록을 표시
- 추가: 포스터 캐러셀 자동 순환(마우스·터치·키보드 조작 중 정지, 모션 감소 설정 존중), 좌우 화살표, 영화관 공식 차트 링크
- 변경: 히어로의 관람 기록 배너 전체를 눌러 영화 검색 화면으로 이동
- 변경: 관객 평점 랭킹 → **실시간 관객 평점 랭킹 TOP 10** (CGV 상영작 중 에그지수 최고 1편 + OTT 스테디셀러 9편, 평점은 5점 만점으로 환산)
- 제거: `영화 검색 바로가기` 버튼, `최근 저장한 티켓` 목록, 랭킹 `평점순/인기도순` 정렬 버튼, 히어로의 `PERSONAL ARCHIVE` 태그와 `01` 표시
- 변경: 프로필 아바타에 사용자 아이콘 표시

**공통**
- 검색 · 마이 티켓북 · 캘린더 헤더를 홈과 같은 `FILM LOG` 브랜드 + 프로필 아바타로 통일 (기존: 화면 제목 / 뒤로·로그아웃 버튼)
- 하단 탭바 검색 아이콘을 돋보기 → 클래퍼보드로 변경
- 티켓 상세에 하단 탭바 추가

**티켓 작성 (`pages/write.html`)**
- 추가: **내 평점**(0.5 단위, 선택 안 함 가능), **공개 범위**(나만 보기 / 공개하기 — 공개 시 한 줄 평만 영화 상세 리뷰에 노출)
- 제거: 작성 화면 하단의 `저장 시 티켓 Preview`

### v0.3 — 7주차: TMDB API 연동

- **로컬 서버 추가** (`js/server.py`): TMDB API 프록시 — `/api/movies`, `/api/movie/{id}`, `/api/movie/{id}/reviews`, `/api/review-ranking`
- API 키는 `js/.env`로 분리 (`.env.example`, `.gitignore` 추가)
- 데이터: `data/tmdb_5000_movies.csv`(TMDB 5000 Movies) 추가, `movies.json`을 TMDB 데이터로 확장, API를 쓸 수 없을 때 CSV로 대체
- **영화 상세 화면 추가** (`pages/movie.html`)
- 홈 랭킹: `관객 관람평 랭킹`(예시 데이터) → `실시간 관객 평점 랭킹`(TMDb 평점·투표 수 기준, 개봉작만)
- 검색: 결과 `더 보기` 버튼 추가, 관람 유형 안내 문구 정리

### v0.2 — 6주차: 인터페이스 구조화

- 사이트맵 기준 화면 구성: 홈 · 영화 검색 · 티켓 작성/저장 완료 · 로그인/회원가입 · 마이 티켓북(포스터 모아보기/캘린더) · 티켓 상세 (+ 마이페이지)
- 신규 화면: `search.html`, `write.html`, `login.html`, `detail.html`
- 구조 변경: 화면마다 따로 있던 스크립트를 `js/app.js` 하나로 합치고 `body[data-page]`로 화면 구분, 공통 CSS 컴포넌트(`.app`, `.bar`, `.tabbar` 등) 도입
- 데이터 분리: `data/movies.json`(장르·영화 예시 데이터), `data/tickets.json`(샘플 티켓)
- 홈: 히어로 영역, 영화 검색 바로가기, 최근 저장한 티켓, 관객 관람평 랭킹(예시 데이터, 평점순/인기도순)
- 하단 탭바: 홈 / 티켓북 / 달력 / 마이 (4개) → **홈 / 검색 / 마이 티켓북 (3개)**

### v0.1 — 3~5주차: 기획과 첫 화면 제작

- **3주차 · 아이디어 선정**
  - 팀원별 아이디어 4개 중 최종 후보 2개 선정: ① 금융기관별 이체 조건·수수료·한도 비교 탐색 서비스 ② 영화 포스터 기반 나만의 모바일 티켓북 & 실관람평 다이어리 서비스
  - 제외: 연락처 이체 수취계좌 비교(오픈뱅킹 API·본인인증 필요), 3초 스피드 영화 예매 & 명당 추천(실시간 좌석 API·PG 결제 필요)
- **4주차 · 기능 우선순위와 MVP 범위 (심화 트랙)**
  - 핵심 사용자 시나리오(페르소나: 27세 콘텐츠 마케터 김서연) 작성
  - 문제 우선순위 → 기능 후보 연결, Must 5 / Should 3 / Could 1 / 제외 2 분류
  - 영화 API 후보 검토: TMDB(채택 추천), KOBIS, KMDB
  - MVP 정의, User Flow 및 와이어프레임 작성
- **5주차 · 팀 프로젝트 화면 제작 (FILM LOG)**
  - 홈: 상태 바, 프로필 요약(올해 관람 편수·평균 별점), 티켓형 보기 + 최신 관람순 정렬, 티켓 목록
  - 서브 화면: `ticketbook.html`, `calendar.html`, `mypage.html` (자리표시)
  - 하단 탭바: 홈 / 티켓북 / 달력 / 마이

---

## 2. PRD (Product Requirements Document)

### 2.1 개요

| 항목 | 내용 |
|---|---|
| 서비스명 | FILM LOG (저장소명: Minply) |
| 한 줄 설명 | 영화 포스터 기반 나만의 모바일 티켓북 & 실관람평 다이어리 |
| 플랫폼 | 모바일 웹 (세로 화면 기준, 데스크톱에서는 모바일 프레임으로 표시) |
| 문서 버전 | v0.4 |

### 2.2 문제 정의와 목표

- **문제:** 종이 티켓은 사라지고, 예매 앱의 관람 내역에는 내 감상이 남지 않는다. 극장과 OTT 관람 기록도 흩어져 있다.
- **목표**
  1. 극장·OTT 구분 없이 본 영화를 **포스터 티켓 한 장**으로 빠르게 기록한다.
  2. 한 줄 평·다이어리·태그로 **그날의 감상**까지 남긴다.
  3. 모은 티켓을 **포스터 모아보기와 캘린더**로 다시 꺼내 본다.
  4. 홈에서 **지금 상영작과 관객 평점**을 보고 다음 볼 영화를 고른다.

### 2.3 대상 사용자

- 극장 관람 후 티켓을 모으던 습관을 디지털로 이어가고 싶은 사용자
- OTT로 본 영화까지 한곳에 기록하고 싶은 사용자
- 짧은 감상(한 줄 평)과 긴 감상(다이어리)을 나눠 남기고 싶은 사용자

**대표 페르소나 (4주차):** 영화관(CGV·롯데시네마·메가박스)과 OTT를 활발히 이용하며 관람 기록을 포스터 중심으로 소장하고 싶은 27세 콘텐츠 마케터 김서연

| 항목 | 내용 |
|---|---|
| 상황 | 금요일 퇴근 후 영화관/OTT 관람 직후, 흩어진 예매 기록을 한곳에 정리하고 싶을 때 |
| 목표 | 로그인 후 외부 API 기반 포스터 티켓을 만들고, 솔직한 다이어리를 클라우드 DB에 저장 |
| 제약 | 이동 중 스마트폰 한 손 조작, 작성 절차가 길면 안 됨, 계정 기반 데이터 보존 필요 |
| 결과 | 포스터 티켓북이 내 계정에 저장되고, 기기가 바뀌어도 그리드/캘린더로 다시 볼 수 있음 |

**MVP 정의:** 로그인한 사용자가 외부 영화 API로 영화를 검색해 포스터 티켓을 만들고, 한 줄 평과 다이어리를 클라우드 DB에 저장한 뒤, 포스터 모아보기/캘린더에서 자기 티켓북을 다시 볼 수 있으면 MVP가 성립한다.

### 2.4 기능 범위 (Must 5)

| # | 기능 | 구분 | v0.4 구현 상태 |
|---|---|---|---|
| M1 | 외부 영화 DB API 연동 검색 (TMDB) | 심화 | ✅ `server.py`가 TMDB API 프록시 + `movies.json`/CSV 대체 데이터 |
| M2 | 사용자 인증 (회원가입/로그인) | 심화 | ✅ 닉네임·비밀번호 인증 — Supabase DB 함수 + bcrypt 해시, 세션 토큰 (미설정 시 기기 저장 모드, PBKDF2 해시) |
| M3 | 포스터 기반 모바일 티켓 생성기 | 필수 | ✅ 저장 완료 화면에서 티켓 미리보기 + 이미지 다운로드 |
| M4 | 실관람평 다이어리 작성 및 저장 | 심화 | ✅ Supabase Postgres `app_tickets` 테이블에 저장, 기기 간 유지 (DB 함수가 본인만 접근 허용) |
| M5 | 포스터 모아보기 / 캘린더 | 필수 | ✅ 마이 티켓북 보기 전환, 포스터 화면 태그 필터·정렬 |

**Should / Could**

| 구분 | 기능 | v0.4 구현 상태 |
|---|---|---|
| Should | 관람 태그·키워드 필터 (장르, 극장/OTT) | ✅ 검색 필터·정렬, 티켓북 태그 필터 |
| Could | 보고 싶은 영화 찜(즐겨찾기) | ✅ 하트 버튼 + 마이 티켓북 `찜한 영화` 탭 (v0.6) |
| Should | 모바일 티켓 이미지 저장 및 SNS 공유 | ✅ 이미지 다운로드, 인스타그램·카카오톡 공유 버튼 |
| Should | 티켓북 템플릿 커스텀 (무광/유광 등) | ⬜ 미구현 |
| Could | 월별 관람 통계 및 리포트 | ⬜ 미구현 |

**범위 제외 (4주차 결정):** 멀티플렉스 실시간 자동 예매 연동(외부 연동 복잡도), 외부 사용자 커뮤니티/댓글 기능('나만의 기록'에 집중)

### 2.5 정보 구조 (사이트맵)

```
홈 (index.html)
├─ 영화 상세 (pages/movie.html)  ← CGV 상영작 / 평점 랭킹에서 진입
├─ 영화 검색·목록 (pages/search.html)
│   └─ 티켓 작성 (pages/write.html) → 저장 완료
├─ 마이 티켓북
│   ├─ 포스터 모아보기 (pages/ticketbook.html)
│   ├─ 캘린더 (pages/calendar.html)
│   └─ 티켓 상세 (pages/detail.html)
└─ 로그인 / 회원가입 (pages/login.html)

하단 탭바: 홈 · 검색 · 마이 티켓북
```

### 2.6 화면별 요구사항

#### ① 홈 — `index.html` (v0.4 개편)

| 영역 | 요소 | 데이터 / 동작 |
|---|---|---|
| 헤더 | 브랜드 로고, 프로필 아바타 | 아바타 → 로그인 화면 (로그인 상태에서는 프로필 동작) |
| 히어로 | 서비스 소개 카피, MY ARCHIVE 마크 | 정적 콘텐츠 |
| 무비차트 TOP 20 | CGV·롯데시네마 로고 전환, 자동 순환 가로 캐러셀, 예매율 순위 배지, 좌우 화살표 | 개봉일 지난 작품만 표시 · 예매율 내림차순 · 각 공식 API 5분마다 갱신 · 파일 실행 시 대체 데이터 · 카드 → 영화 상세/공식 상세 |
| 관객 평점 랭킹 TOP 10 | 순위, 포스터, 제목, 구분, 평점(5점 만점) | CGV 1편 + OTT 스테디셀러 9편 · 항목 → 영화 상세 |
| 탭바 | 홈(활성) / 검색 / 마이 티켓북 | 현재 페이지 `aria-current="page"` |

**수용 기준**
- 상영작이 0개가 아닐 때 캐러셀 첫 위치에서 왼쪽 화살표는 숨겨진다.
- 랭킹은 최대 10개까지 표시하고, 평점 정보가 없으면 "평점 정보 없음"을 표시한다.
- 모든 카드/항목은 키보드로 접근 가능한 링크다.

#### ② 영화 검색·목록 — `pages/search.html`
- 제목 검색(지우기 버튼), 관람 유형 칩(극장/OTT), 장르 칩(더보기로 펼침)
- 정렬: 인기순 / 최신순 / 제목순, 2열 포스터 그리드, `더 보기` 페이지네이션(`/api/movies?offset=`)
- **결과 없음 상태:** 적용된 조건 목록 + `필터 모두 초기화` 버튼
- 검색 조건은 sessionStorage에 유지

#### ③ 영화 상세 — `pages/movie.html`
- 포스터, 제목, 연도·장르·러닝타임, 줄거리, 데이터 출처(CGV / JSON / TMDb API)
- 관객 리뷰: FILM LOG 공개 한 줄 평 + TMDb 리뷰(`/api/movie/{id}/reviews`)
- 미개봉 또는 존재하지 않는 영화는 "영화 정보를 찾을 수 없습니다" 상태 표시

#### ④ 티켓 작성 / 저장 완료 — `pages/write.html`
- 입력: 관람일(필수), 관람 유형·장소, 평점(0.5 단위, 선택 안 함 가능), 한 줄 평(50자), 다이어리, 공개 범위(나만 보기/공개), 태그(프리셋 + 직접 추가)
- 비로그인 상태에서 저장 시 작성 내용 임시 보관 → 로그인 → 작성 화면으로 복귀
- **저장 완료 상태:** 완료 배너, 티켓 미리보기, `마이 티켓북에서 보기` / `티켓 이미지 다운로드` / `계속 검색하기`
- 공개 시 한 줄 평만 영화 상세 리뷰에 노출 (다이어리·장소는 비공개)

#### ⑤ 마이 티켓북 — `pages/ticketbook.html`, `pages/calendar.html`
- `포스터 모아보기 ↔ 캘린더` 세그먼트 전환, 포스터 화면 태그 칩 필터
- 그리드: 3열, 정렬(최근/오래된 관람순, 제목순), 개수 표시
- 캘린더: 월 이동, 관람한 날짜를 점으로 표시, 선택한 날짜의 관람 건수 표시
- **빈 상태:** `샘플 티켓 불러오기`, `영화 검색하기`
- 비로그인 접근 시 로그인 화면으로 이동 (안내 문구: "내 티켓북을 보려면 로그인이 필요해요")

#### ⑥ 티켓 상세 — `pages/detail.html`
- 저장한 티켓 전체 내용 보기, 티켓 이미지 다운로드, SNS 공유(인스타그램·카카오톡)
- 수정(작성 화면으로 이동) / 삭제(확인 대화상자 후 삭제, 되돌릴 수 없음)

#### ⑦ 로그인 / 회원가입 — `pages/login.html`
- 닉네임 + 비밀번호(영문·숫자 조합 8자 이상), 표시/숨김 토글, 모드 전환
- 진입 사유별 안내 문구(저장 / 내 티켓북 / 만료), 로그인 후 원래 화면으로 복귀

### 2.7 데이터 모델

**Ticket**

| 필드 | 자료형 | 용도 |
|---|---|---|
| `ticketId` | string (UUID) | 식별 (숨은 id) |
| `userId` | string | 소유자 식별 (숨은 id) |
| `movieId` | number | 영화 식별, 상세 연결 |
| `movieTitle` | string | 표시, 제목순 정렬 |
| `posterUrl` | string | 티켓·그리드 표시 |
| `watchedAt` | string (YYYY-MM-DD) | 필수, 캘린더·관람순 정렬 |
| `viewType` | `'theater' \| 'ott'` | 필터 |
| `place` | string (≤30자) | 상세 (비공개) |
| `rating` | number \| null (0.5~5) | 상세, 공개 리뷰 |
| `oneLineReview` | string (≤50자) | 티켓, 공개 리뷰 |
| `diary` | string | 상세 (비공개) |
| `tags` | string[] | 필터 |
| `isPublic` | boolean | 공개 범위 |
| `ticketImageUrl` | string | 티켓 이미지 (예정) |
| `createdAt` | string (ISO) | 정렬 |

**Movie** — `movieId`, `title`, `releaseDate`, `posterPath`, `overview`, `genreIds[]`, `availableOn[]`, `source(cgv/lotte/json/api)`, `rank`, `voteAverage`, `voteCount`, `popularity` / CGV 전용: `cgvRank`, `cgvReservationRate`, `cgvEggIndex`, `cgvAdmissions` / 롯데시네마 전용: `movieCode`, `reservationRate`

**User** — `userId`, `nickname`. 비밀번호는 앱이 저장하지 않음(클라우드: DB `app_users.password_hash`에 bcrypt 해시 / 기기 저장 모드: PBKDF2 해시 `salt`·`passwordHash`만 저장)

**DB 테이블 (Supabase)** — `app_users(id, nickname, password_hash, created_at)`, `app_sessions(token_hash, user_id, created_at, expires_at)`, `app_favorites(user_id, movie_id, movie_title, poster_url, chart_key, created_at)`, `app_tickets(id, user_id, movie_id, movie_title, poster_url, watched_at, view_type, place, one_line_review, diary, tags[], is_public, rating, ticket_image_url, created_at, updated_at)` — DB 함수가 앱의 camelCase 필드로 바꿔 돌려줌

### 2.8 기술 스택

| 구분 | 사용 기술 |
|---|---|
| 프론트엔드 | HTML, CSS(`css/style.css`), Vanilla JS(`js/app.js`, `body[data-page]`로 화면 분기), Tailwind CSS CDN, Font Awesome 6.4 |
| 서버 | Python 표준 라이브러리 HTTP 서버(`js/server.py`), TMDB·CGV·롯데시네마 API 프록시 |
| 데이터 | `data/movies.json`, `data/cgv-chart.json`, `data/tickets.json`(샘플), `data/tmdb_5000_movies.csv`(대체 데이터) |
| 인증·DB | Supabase Postgres (DB 함수 RPC, `pgcrypto` bcrypt, RLS로 테이블 직접 접근 차단), `supabase-js` v2 CDN |
| 저장소 | 클라우드 모드: Supabase / 기기 저장 모드: localStorage, 화면 상태: sessionStorage |

**API 엔드포인트 (`server.py`)**

| 경로 | 설명 |
|---|---|
| `GET /api/movies?offset=` | 영화 목록 페이지네이션 (20개 단위) |
| `GET /api/movie/{id}` | TMDB 영화 상세 |
| `GET /api/movie/{id}/reviews` | TMDB 관객 리뷰 (최대 10개) |
| `GET /api/review-ranking` | 인기작 리뷰 랭킹 |
| `GET /api/cgv-chart` | CGV 개봉작 예매율 순위 |
| `GET /api/lotte-chart` | 롯데시네마 개봉작 예매율 순위 |
| `GET /api/megabox-chart` | 메가박스 개봉작 예매율 순위 |

### 2.9 비기능 요구사항

- **반응형:** 모바일 세로 기준, `viewport-fit=cover`
- **접근성:** 아이콘에 `aria-hidden`, 버튼·링크에 `aria-label`, 탭바 `aria-current`, 오류 메시지 `role="alert"`
- **보안:** 사용자 입력은 출력 시 HTML 이스케이프, API 키는 `js/.env`로 분리하고 정적 경로로 노출하지 않음
- **오프라인 대체:** `file://`로 열어 JSON을 못 읽으면 `app.js` 내장 기본 데이터 사용
- **영화관 차트 갱신:** 영화관 사이트는 브라우저에서 직접 부를 수 없어(CORS) `server.py`가 CGV·롯데시네마·메가박스 공식 순위 API를 대신 받아 `data/live-charts.js`에 저장한다(예약 작업 10분 간격, 서버 실행 중 1분 간격). 앱은 이 파일과 서버(켜져 있으면)에서 화면에 들어올 때마다 최신 순위를 읽고, 사이트와 같은 순서로 표시한다. 둘 다 없으면 앱에 포함된 대체 순위를 표시한다.

### 2.10 알려진 이슈 (v0.4)

| # | 내용 | 영향 |
|---|---|---|
| 1 | `pages/mypage.html`이 아직 예전 4탭 네비게이션(홈/티켓북/달력/마이)과 자리표시 레이아웃 사용 | 탭 구성 불일치 |
| 2 | 홈 랭킹 제목은 "실시간"이지만 실제로는 정적 JSON 데이터 기반 | 문구와 동작 불일치 |
| 3 | 홈 랭킹에서 특정 영화(`movieId 30001323`) 평점이 `4.5 / 5.0`으로 하드코딩 | 데이터 정확성 |
| 4 | ~~인증·티켓 저장이 localStorage 목업(비밀번호 평문)~~ → v0.5에서 Supabase 연동으로 해결. 단, `SUPABASE_CONFIG`를 채우기 전에는 기기 저장 모드 | 설정 필요 |
| 5 | 홈 탭바 검색 아이콘(`clapperboard`)과 영화 상세 탭바 아이콘(`magnifying-glass`)이 다름 | UI 일관성 |
| 6 | `js/__pycache__/` 가 저장소에 포함됨 | `.gitignore` 추가 필요 |

### 2.11 다음 단계

- [ ] 마이페이지를 v0.4 공통 레이아웃·3탭 구조로 정리 (또는 프로필 메뉴로 흡수)
- [ ] 랭킹 문구를 데이터에 맞게 수정하거나 실제 실시간 집계 연결
- [x] Supabase 인증 및 클라우드 DB 연동 (M2, M4) — v0.5
- [ ] 비밀번호 재설정(메일) · 회원 탈퇴 화면
- [ ] 티켓 이미지 저장(`ticketImageUrl`) 구현

---

## 3. 폴더 구조

```
Minply-main/
├─ index.html            # 홈 (v0.4)
├─ readme.md             # 변경 이력 + PRD
├─ pages/
│  ├─ search.html        # 영화 검색·목록
│  ├─ movie.html         # 영화 상세
│  ├─ write.html         # 티켓 작성 / 저장 완료
│  ├─ ticketbook.html    # 마이 티켓북 - 포스터 모아보기
│  ├─ calendar.html      # 마이 티켓북 - 캘린더
│  ├─ detail.html        # 티켓 상세
│  ├─ login.html         # 로그인 / 회원가입
│  ├─ mypage.html        # 마이페이지 (자리표시)
│  ├─ v0.1/              # 3~5주차 결과물 (FILM LOG 첫 화면)
│  ├─ v0.2/              # 6주차 결과물 (인터페이스 구조화)
│  ├─ v0.3/              # 7주차 결과물 (TMDB API 연동)
│  └─ v0.4/              # 9주차 결과물 (화면 고도화, 현재 버전 스냅샷)
├─ css/style.css
├─ js/
│  ├─ app.js             # 화면별 동작
│  └─ server.py          # 로컬 서버 + TMDB API 프록시
├─ data/
│  ├─ movies.json
│  ├─ cgv-chart.json
│  ├─ live-charts.js       # 영화관 최신 순위 (server.py가 자동 갱신)
│  ├─ tickets.json
│  └─ tmdb_5000_movies.csv
```

## 4. 실행 방법

```bash
# 1) TMDB API 키 설정 (선택 — 없으면 JSON/CSV 데이터로 동작)
echo "TMDB_API_KEY=발급받은_키" > js/.env

# 1-1) (한 번만) 영화관 순위 자동 갱신 등록 — PC를 켜자마자 한 번 + 이후 10분마다 갱신,
#      index.html을 그냥 열어도 날짜가 바뀌면 바로 새 순위가 보임 (지우기: --remove-auto-update)
python js/server.py --install-auto-update

# 2) 서버 실행 — 켜 두는 동안 CGV·롯데시네마·메가박스 순위가 실시간으로 반영됨
#    (켜자마자 터미널에 영화관별 [성공]/[실패]가 나오고, 앱 화면이 브라우저로 열림)
python js/server.py

# 3) 브라우저에서 열기
http://127.0.0.1:8000
```

### 4.1 클라우드 DB(Supabase) 연결

`js/app.js` 맨 위 `SUPABASE_CONFIG`가 비어 있으면 **기기 저장 모드**(이 브라우저에만 저장)로 동작합니다. 아래 순서로 연결하면 닉네임 회원가입·로그인과 티켓 저장이 클라우드로 바뀌어, 다른 기기에서 같은 닉네임으로 로그인해도 티켓이 그대로 보입니다.

1. [supabase.com](https://supabase.com)에 가입하고 **New project**를 만든다 (무료 플랜으로 충분).
2. 대시보드 **SQL Editor**에 아래 SQL 전체를 붙여 넣고 **Run** (여러 번 실행해도 안전). 이메일 인증 설정은 쓰지 않으므로 Authentication 메뉴는 건드리지 않아도 된다.
3. 대시보드 상단 **Connect** 버튼(또는 **Project Settings**의 API 메뉴)에서 **Project URL**과 **anon public**(publishable) 키를 복사해 `js/app.js`에 넣는다.
   ```js
   const SUPABASE_CONFIG = {
       url: 'https://xxxxxxxx.supabase.co',
       anonKey: 'eyJhbGciOi...'
   };
   ```
   - anon 키는 공개용 키라 프런트엔드에 넣어도 된다. 테이블 직접 접근은 막혀 있고 `film_*` 함수로만 데이터를 읽고 쓴다.
   - **`service_role` 키는 절대 넣지 않는다** (모든 보호를 무시하는 관리자 키).
4. 앱에서 회원가입 → 티켓 저장 → 다른 브라우저(또는 휴대폰)에서 같은 닉네임으로 로그인해 티켓이 보이는지 확인한다. 데이터는 대시보드 **Table Editor → app_tickets**에서 볼 수 있다.

```sql
-- FILM LOG (Minply) — Supabase 스키마 (닉네임 로그인)
-- Supabase 대시보드 > SQL Editor 에 붙여 넣고 한 번 실행한다. 여러 번 실행해도 안전하다.
-- 비밀번호는 bcrypt 해시로만 저장하고, 앱은 아래 함수(RPC)로만 데이터에 접근한다.
-- 테이블은 직접 읽기·쓰기를 모두 막아 두므로(RLS + 정책 없음) anon 키로는 함수 밖에서 데이터를 볼 수 없다.

create extension if not exists pgcrypto with schema extensions;

-- 1) 회원: 닉네임 + 비밀번호 해시
create table if not exists public.app_users (
    id uuid primary key default gen_random_uuid(),
    nickname text not null check (char_length(btrim(nickname)) between 1 and 20),
    password_hash text not null,
    created_at timestamptz not null default now()
);
create unique index if not exists app_users_nickname_key on public.app_users (lower(btrim(nickname)));

-- 2) 로그인 세션: 토큰 원문은 앱에만 있고 DB에는 SHA-256 해시만 저장
create table if not exists public.app_sessions (
    token_hash text primary key,
    user_id uuid not null references public.app_users (id) on delete cascade,
    created_at timestamptz not null default now(),
    expires_at timestamptz not null default now() + interval '30 days'
);
create index if not exists app_sessions_user_idx on public.app_sessions (user_id);

-- 3) 티켓(관람 기록)
create table if not exists public.app_tickets (
    id uuid primary key default gen_random_uuid(),
    user_id uuid not null references public.app_users (id) on delete cascade,
    movie_id bigint not null,
    movie_title text not null,
    poster_url text not null default '',
    watched_at date not null,
    view_type text not null default 'theater' check (view_type in ('theater', 'ott')),
    place text not null default '' check (char_length(place) <= 30),
    one_line_review text not null default '' check (char_length(one_line_review) <= 50),
    diary text not null default '',
    tags text[] not null default '{}',
    is_public boolean not null default false,
    rating numeric(2, 1) check (rating is null or (rating >= 0 and rating <= 5)),
    ticket_image_url text not null default '',
    created_at timestamptz not null default now(),
    updated_at timestamptz not null default now()
);
create index if not exists app_tickets_user_idx on public.app_tickets (user_id, watched_at desc);
create index if not exists app_tickets_public_movie_idx on public.app_tickets (movie_id) where is_public;

-- 4) 찜한 영화(즐겨찾기): 회원마다 영화 1편당 1개
create table if not exists public.app_favorites (
    user_id uuid not null references public.app_users (id) on delete cascade,
    movie_id bigint not null,
    movie_title text not null,
    poster_url text not null default '',
    chart_key text not null default '' check (chart_key in ('', 'cgv', 'lotte', 'megabox')),
    created_at timestamptz not null default now(),
    primary key (user_id, movie_id)
);

-- 직접 접근 차단: RLS를 켜고 정책을 만들지 않는다 + 권한 회수
alter table public.app_users enable row level security;
alter table public.app_sessions enable row level security;
alter table public.app_tickets enable row level security;
alter table public.app_favorites enable row level security;
revoke all on public.app_users, public.app_sessions, public.app_tickets, public.app_favorites from anon, authenticated;

-- ===== 내부 도우미 =====
create or replace function public._film_session_user(p_token text)
returns uuid
language sql
stable
security definer
set search_path = ''
as $$
    select s.user_id from public.app_sessions s
    where s.token_hash = encode(extensions.digest(coalesce(p_token, ''), 'sha256'), 'hex')
      and s.expires_at > now();
$$;

create or replace function public._film_require_user(p_token text)
returns uuid
language plpgsql
stable
security definer
set search_path = ''
as $$
declare v_user uuid;
begin
    v_user := public._film_session_user(p_token);
    if v_user is null then
        raise exception 'SESSION_EXPIRED' using errcode = 'P0001';
    end if;
    return v_user;
end;
$$;

create or replace function public._film_new_session(p_user uuid)
returns text
language plpgsql
security definer
set search_path = ''
as $$
declare v_token text := encode(extensions.gen_random_bytes(32), 'hex');
begin
    delete from public.app_sessions where user_id = p_user and expires_at <= now();
    insert into public.app_sessions (token_hash, user_id)
    values (encode(extensions.digest(v_token, 'sha256'), 'hex'), p_user);
    return v_token;
end;
$$;

create or replace function public._film_ticket_json(t public.app_tickets)
returns jsonb
language sql
immutable
set search_path = ''
as $$
    select jsonb_build_object(
        'ticketId', t.id, 'userId', t.user_id, 'movieId', t.movie_id, 'movieTitle', t.movie_title,
        'posterUrl', t.poster_url, 'watchedAt', t.watched_at, 'viewType', t.view_type, 'place', t.place,
        'oneLineReview', t.one_line_review, 'diary', t.diary, 'tags', to_jsonb(t.tags), 'isPublic', t.is_public,
        'rating', coalesce(t.rating, 0), 'ticketImageUrl', t.ticket_image_url, 'createdAt', t.created_at
    );
$$;

-- ===== 앱이 부르는 함수 (RPC) =====

-- 회원가입: { token, user: { userId, nickname } }
create or replace function public.film_signup(p_nickname text, p_password text)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
    v_nickname text := btrim(coalesce(p_nickname, ''));
    v_user public.app_users;
begin
    if char_length(v_nickname) not between 1 and 20 then
        raise exception 'INVALID_NICKNAME' using errcode = 'P0001';
    end if;
    if coalesce(p_password, '') !~ '^(?=.*[A-Za-z])(?=.*[0-9])\S{8,64}$' then
        raise exception 'WEAK_PASSWORD' using errcode = 'P0001';
    end if;
    if exists (select 1 from public.app_users where lower(btrim(nickname)) = lower(v_nickname)) then
        raise exception 'NICKNAME_TAKEN' using errcode = 'P0001';
    end if;
    insert into public.app_users (nickname, password_hash)
    values (v_nickname, extensions.crypt(p_password, extensions.gen_salt('bf', 10)))
    returning * into v_user;
    return jsonb_build_object('token', public._film_new_session(v_user.id),
                              'user', jsonb_build_object('userId', v_user.id, 'nickname', v_user.nickname));
exception when unique_violation then
    raise exception 'NICKNAME_TAKEN' using errcode = 'P0001';
end;
$$;

-- 로그인: 가입되지 않은 닉네임이면 NOT_REGISTERED, 비밀번호가 틀리면 WRONG_PASSWORD
create or replace function public.film_login(p_nickname text, p_password text)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare v_user public.app_users;
begin
    select * into v_user from public.app_users where lower(btrim(nickname)) = lower(btrim(coalesce(p_nickname, '')));
    if not found then
        raise exception 'NOT_REGISTERED' using errcode = 'P0001';
    end if;
    if v_user.password_hash <> extensions.crypt(coalesce(p_password, ''), v_user.password_hash) then
        raise exception 'WRONG_PASSWORD' using errcode = 'P0001';
    end if;
    return jsonb_build_object('token', public._film_new_session(v_user.id),
                              'user', jsonb_build_object('userId', v_user.id, 'nickname', v_user.nickname));
end;
$$;

create or replace function public.film_logout(p_token text)
returns void
language sql
security definer
set search_path = ''
as $$
    delete from public.app_sessions where token_hash = encode(extensions.digest(coalesce(p_token, ''), 'sha256'), 'hex');
$$;

-- 현재 로그인 사용자 (세션이 만료됐으면 null)
create or replace function public.film_me(p_token text)
returns jsonb
language sql
stable
security definer
set search_path = ''
as $$
    select jsonb_build_object('userId', u.id, 'nickname', u.nickname)
    from public.app_users u where u.id = public._film_session_user(p_token);
$$;

create or replace function public.film_my_tickets(p_token text)
returns jsonb
language plpgsql
stable
security definer
set search_path = ''
as $$
declare v_user uuid := public._film_require_user(p_token);
begin
    return coalesce((select jsonb_agg(public._film_ticket_json(t) order by t.watched_at desc, t.created_at desc)
                     from public.app_tickets t where t.user_id = v_user), '[]'::jsonb);
end;
$$;

-- 티켓 저장: p_ticket_id가 없으면 새로 만들고, 있으면 내 티켓만 수정
create or replace function public.film_save_ticket(p_token text, p_ticket jsonb, p_ticket_id uuid default null)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
    v_user uuid := public._film_require_user(p_token);
    v_row public.app_tickets;
    v_rating numeric := nullif((p_ticket ->> 'rating')::numeric, 0);
    v_tags text[] := coalesce(array(select jsonb_array_elements_text(coalesce(p_ticket -> 'tags', '[]'::jsonb))), '{}');
begin
    if p_ticket_id is null then
        insert into public.app_tickets (user_id, movie_id, movie_title, poster_url, watched_at, view_type, place,
                                        one_line_review, diary, tags, is_public, rating, ticket_image_url)
        values (v_user, (p_ticket ->> 'movieId')::bigint, p_ticket ->> 'movieTitle', coalesce(p_ticket ->> 'posterUrl', ''),
                (p_ticket ->> 'watchedAt')::date, coalesce(p_ticket ->> 'viewType', 'theater'), coalesce(p_ticket ->> 'place', ''),
                coalesce(p_ticket ->> 'oneLineReview', ''), coalesce(p_ticket ->> 'diary', ''), v_tags,
                coalesce((p_ticket ->> 'isPublic')::boolean, false), v_rating, coalesce(p_ticket ->> 'ticketImageUrl', ''))
        returning * into v_row;
    else
        update public.app_tickets set
            movie_id = (p_ticket ->> 'movieId')::bigint, movie_title = p_ticket ->> 'movieTitle',
            poster_url = coalesce(p_ticket ->> 'posterUrl', ''), watched_at = (p_ticket ->> 'watchedAt')::date,
            view_type = coalesce(p_ticket ->> 'viewType', 'theater'), place = coalesce(p_ticket ->> 'place', ''),
            one_line_review = coalesce(p_ticket ->> 'oneLineReview', ''), diary = coalesce(p_ticket ->> 'diary', ''),
            tags = v_tags, is_public = coalesce((p_ticket ->> 'isPublic')::boolean, false), rating = v_rating,
            ticket_image_url = coalesce(p_ticket ->> 'ticketImageUrl', ''), updated_at = now()
        where id = p_ticket_id and user_id = v_user
        returning * into v_row;
        if not found then
            raise exception 'TICKET_NOT_FOUND' using errcode = 'P0001';
        end if;
    end if;
    return public._film_ticket_json(v_row);
end;
$$;

-- 여러 장 한 번에 저장 (샘플 불러오기, 기기 저장 티켓 옮기기)
create or replace function public.film_save_tickets(p_token text, p_tickets jsonb)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
    v_item jsonb;
    v_out jsonb := '[]'::jsonb;
begin
    perform public._film_require_user(p_token);
    for v_item in select * from jsonb_array_elements(coalesce(p_tickets, '[]'::jsonb)) loop
        v_out := v_out || jsonb_build_array(public.film_save_ticket(p_token, v_item, null));
    end loop;
    return v_out;
end;
$$;

create or replace function public.film_delete_ticket(p_token text, p_ticket_id uuid)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare v_user uuid := public._film_require_user(p_token);
begin
    delete from public.app_tickets where id = p_ticket_id and user_id = v_user;
end;
$$;

-- 영화 상세의 관객 리뷰: 공개로 저장된 한줄평만 (일기·관람 장소는 내보내지 않음)
create or replace function public.film_public_reviews(p_movie_id bigint)
returns jsonb
language sql
stable
security definer
set search_path = ''
as $$
    select coalesce(jsonb_agg(jsonb_build_object(
               'author', u.nickname, 'oneLineReview', t.one_line_review, 'rating', coalesce(t.rating, 0),
               'watchedAt', t.watched_at, 'createdAt', t.created_at) order by t.created_at desc), '[]'::jsonb)
    from (select * from public.app_tickets
          where movie_id = p_movie_id and is_public and one_line_review <> ''
          order by created_at desc limit 50) t
    join public.app_users u on u.id = t.user_id;
$$;

-- 찜한 영화 목록 (최근에 찜한 순)
create or replace function public.film_my_favorites(p_token text)
returns jsonb
language plpgsql
stable
security definer
set search_path = ''
as $$
declare v_user uuid := public._film_require_user(p_token);
begin
    return coalesce((select jsonb_agg(jsonb_build_object(
                'movieId', f.movie_id, 'movieTitle', f.movie_title, 'posterUrl', f.poster_url,
                'chartKey', f.chart_key, 'createdAt', f.created_at) order by f.created_at desc)
            from public.app_favorites f where f.user_id = v_user), '[]'::jsonb);
end;
$$;

-- 찜하기/해제: p_on이 true면 찜, false면 해제. 찜한 결과(해제면 null)를 돌려준다
create or replace function public.film_set_favorite(p_token text, p_movie jsonb, p_on boolean)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
    v_user uuid := public._film_require_user(p_token);
    v_movie_id bigint := (p_movie ->> 'movieId')::bigint;
    v_row public.app_favorites;
begin
    if v_movie_id is null then
        raise exception 'INVALID_MOVIE' using errcode = 'P0001';
    end if;
    if not coalesce(p_on, false) then
        delete from public.app_favorites where user_id = v_user and movie_id = v_movie_id;
        return null;
    end if;
    insert into public.app_favorites (user_id, movie_id, movie_title, poster_url, chart_key)
    values (v_user, v_movie_id, coalesce(nullif(p_movie ->> 'movieTitle', ''), '제목 미상'),
            coalesce(p_movie ->> 'posterUrl', ''), coalesce(p_movie ->> 'chartKey', ''))
    on conflict (user_id, movie_id) do update
        set movie_title = excluded.movie_title, poster_url = excluded.poster_url, chart_key = excluded.chart_key
    returning * into v_row;
    return jsonb_build_object('movieId', v_row.movie_id, 'movieTitle', v_row.movie_title, 'posterUrl', v_row.poster_url,
                              'chartKey', v_row.chart_key, 'createdAt', v_row.created_at);
end;
$$;

-- 함수 실행 권한: 앱이 부르는 함수만 공개, 내부 도우미는 막기
revoke execute on function public._film_session_user(text), public._film_require_user(text),
    public._film_new_session(uuid), public._film_ticket_json(public.app_tickets) from public, anon, authenticated;
grant execute on function public.film_signup(text, text), public.film_login(text, text), public.film_logout(text),
    public.film_me(text), public.film_my_tickets(text), public.film_save_ticket(text, jsonb, uuid),
    public.film_save_tickets(text, jsonb), public.film_delete_ticket(text, uuid), public.film_public_reviews(bigint),
    public.film_my_favorites(text), public.film_set_favorite(text, jsonb, boolean)
    to anon, authenticated;
```

> 예전 버전에서 이 기기에 저장해 둔 티켓은, 클라우드 연결 후 처음 로그인할 때 "계정으로 옮길까요?"를 눌러 옮길 수 있습니다.
>
> v0.5의 이메일 로그인용 SQL을 이미 실행했다면, 위 SQL을 실행하기 전에 아래로 지워도 됩니다(그 테이블의 데이터도 지워짐).
> ```sql
> drop trigger if exists on_auth_user_created on auth.users;
> drop table if exists public.tickets, public.profiles cascade;
> drop function if exists public.handle_new_user(), public.touch_updated_at(), public.nickname_available(text);
> ```
