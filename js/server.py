import csv
import json
import os
import sys
import threading
import time
import webbrowser
from concurrent.futures import ThreadPoolExecutor
from datetime import date, datetime
from functools import partial
from http.server import SimpleHTTPRequestHandler, ThreadingHTTPServer
from pathlib import Path
from urllib.error import HTTPError, URLError
from urllib.parse import parse_qs, urlencode, urljoin, urlsplit
from urllib.request import Request, urlopen


ROOT = Path(__file__).resolve().parents[1]
SCRIPT_DIR = Path(__file__).resolve().parent
CSV_PATH = ROOT / "data" / "tmdb_5000_movies.csv"
JSON_PATH = ROOT / "data" / "movies.json"
TMDB_API_URL = "https://api.themoviedb.org/3/movie/popular"
TMDB_MOVIE_URL = "https://api.themoviedb.org/3/movie"
TMDB_THEATER_URL = "https://api.themoviedb.org/3/movie/now_playing"
TMDB_DISCOVER_URL = "https://api.themoviedb.org/3/discover/movie"
POSTER_BASE_URL = "https://image.tmdb.org/t/p/w500"
CGV_CHART_URL = "https://api.cgv.co.kr/met/dsp/scrDsp/searchScrDspCpotDtl"
CGV_CHART_REFRESH_SECONDS = 60
CGV_POSTER_BASE_URL = "https://cdn.cgv.co.kr"
LOTTE_CHART_URL = "https://www.lottecinema.co.kr/LCWS/Movie/MovieData.aspx"
LOTTE_CHART_REFRESH_SECONDS = 60
MEGABOX_CHART_URL = "https://www.megabox.co.kr/on/oh/oha/Movie/selectMovieList.do"
MEGABOX_CHART_REFRESH_SECONDS = 60
MEGABOX_IMAGE_BASE_URL = "https://img.megabox.co.kr"
JSON_MOVIE_COUNT = 100
PAGE_SIZE = 20
MAX_PAGE = 500
FEED_SIZE = 100
GENRE_NAMES = {
    12: "모험", 14: "판타지", 16: "애니메이션", 18: "드라마", 27: "공포",
    28: "액션", 35: "코미디", 36: "역사", 37: "서부", 53: "스릴러",
    80: "범죄", 99: "다큐멘터리", 10402: "음악", 10749: "로맨스",
    10751: "가족", 10752: "전쟁", 10770: "TV 영화", 9648: "미스터리",
    878: "SF",
}
CGV_GENRE_IDS = {
    "액션": 28, "어드벤처": 12, "모험": 12, "애니메이션": 16, "드라마": 18,
    "공포": 27, "공포(호러)": 27, "코미디": 35, "역사": 36, "서부": 37,
    "스릴러": 53, "범죄": 80, "다큐멘터리": 99, "뮤지컬": 10402,
    "멜로/로맨스": 10749, "로맨스": 10749, "가족": 10751, "전쟁": 10752,
    "미스터리": 9648, "SF": 878,
}
MOVIE_CATALOG = []
REVIEW_RANKING_CACHE = None
CGV_CHART_CACHE = None
CGV_CHART_CACHE_UNTIL = 0
CGV_CHART_CACHE_LOCK = threading.Lock()
LOTTE_CHART_CACHE = None
LOTTE_CHART_CACHE_UNTIL = 0
LOTTE_CHART_CACHE_LOCK = threading.Lock()
MEGABOX_CHART_CACHE = None
MEGABOX_CHART_CACHE_UNTIL = 0
MEGABOX_CHART_CACHE_LOCK = threading.Lock()


def load_local_env():
    env_path = SCRIPT_DIR / ".env"
    if not env_path.exists():
        return
    for line in env_path.read_text(encoding="utf-8").splitlines():
        line = line.strip()
        if not line or line.startswith("#") or "=" not in line:
            continue
        name, value = line.split("=", 1)
        os.environ.setdefault(name.strip(), value.strip().strip("\"'"))


load_local_env()
TMDB_API_KEY = os.environ.get("TMDB_API_KEY", "")


def tmdb_request(page):
    if not TMDB_API_KEY:
        raise RuntimeError("TMDB_API_KEY is not configured")
    query = urlencode({"api_key": TMDB_API_KEY, "language": "ko-KR", "region": "KR", "page": page})
    request = Request(f"{TMDB_API_URL}?{query}", headers={"Accept": "application/json"})
    with urlopen(request, timeout=15) as response:
        return json.load(response)


def tmdb_feed_request(feed, page):
    if not TMDB_API_KEY:
        raise RuntimeError("TMDB_API_KEY is not configured")
    params = {"api_key": TMDB_API_KEY, "language": "ko-KR", "page": page}
    if feed == "theater":
        url = TMDB_THEATER_URL
        params["region"] = "KR"
    else:
        url = TMDB_DISCOVER_URL
        params.update({
            "watch_region": "KR",
            "with_watch_monetization_types": "flatrate",
            "sort_by": "popularity.desc",
            "release_date.lte": date.today().isoformat(),
            "vote_count.gte": 100,
        })
    request = Request(f"{url}?{urlencode(params)}", headers={"Accept": "application/json"})
    with urlopen(request, timeout=15) as response:
        return json.load(response)


def tmdb_movie_request(movie_id):
    if not TMDB_API_KEY:
        raise RuntimeError("TMDB_API_KEY is not configured")
    query = urlencode({"api_key": TMDB_API_KEY, "language": "ko-KR"})
    request = Request(f"{TMDB_MOVIE_URL}/{movie_id}?{query}", headers={"Accept": "application/json"})
    with urlopen(request, timeout=15) as response:
        return json.load(response)


def tmdb_reviews_request(movie_id):
    if not TMDB_API_KEY:
        raise RuntimeError("TMDB_API_KEY is not configured")
    query = urlencode({"api_key": TMDB_API_KEY, "page": 1})
    request = Request(f"{TMDB_MOVIE_URL}/{movie_id}/reviews?{query}", headers={"Accept": "application/json"})
    with urlopen(request, timeout=15) as response:
        return json.load(response)


def is_released(item):
    release_date = item.get("release_date") or ""
    try:
        return date.fromisoformat(release_date) <= date.today()
    except ValueError:
        return False


def normalize_movie(item, rank, source, available_on=None):
    poster_path = item.get("poster_path")
    movie = {
        "movieId": item["id"],
        "title": item.get("title") or item.get("original_title") or "제목 미상",
        "originalTitle": item.get("original_title") or "",
        "posterPath": f"{POSTER_BASE_URL}{poster_path}" if poster_path else None,
        "releaseDate": item.get("release_date") or "",
        "genreIds": item.get("genre_ids") or [genre["id"] for genre in item.get("genres", [])],
        "popularity": item.get("popularity") or 0,
        "voteAverage": item.get("vote_average") or 0,
        "voteCount": item.get("vote_count") or 0,
        "overview": item.get("overview") or "",
        "runtime": item.get("runtime"),
        "availableOn": list(available_on or []),
        "source": source,
    }
    if rank is not None:
        movie["rank"] = rank
    return movie


def format_cgv_admissions(value):
    try:
        admissions = int(value or 0)
    except (TypeError, ValueError):
        return "정보 없음"
    if admissions >= 10000:
        return f"{admissions / 10000:.1f}".rstrip("0").rstrip(".") + "만"
    return f"{admissions:,}"


def normalize_cgv_chart(payload):
    if payload.get("statusCode") != 0:
        raise RuntimeError("CGV chart API returned an unsuccessful status")

    chart_tabs = (
        payload.get("data", {})
        .get("dspScrdispMovctTab", {})
        .get("dspScrdispMovctDtlList", [])
    )
    chart_tab = next((tab for tab in chart_tabs if tab.get("tabExpoNm", "").strip() == "무비차트"), None)
    if not chart_tab:
        raise ValueError("CGV movie chart is missing")

    movies = []
    for index, item in enumerate(chart_tab.get("movctSearchResDtoList") or []):
        movie_id = int(item["movNo"])
        poster_file = item.get("img320Fnm") or item.get("img126Fnm")
        poster_path = urljoin(CGV_POSTER_BASE_URL + "/", (item.get("imgPath") or "").lstrip("/") + poster_file) if poster_file else None
        release_date = item.get("realOpenYmd") or item.get("rlsYmd") or ""
        if len(release_date) == 8 and release_date.isdigit():
            release_date = f"{release_date[:4]}-{release_date[4:6]}-{release_date[6:]}"
        try:
            rank = int(item.get("curnAtktRnk") or index + 1)
        except (TypeError, ValueError):
            rank = index + 1
        try:
            reservation_rate = float(item.get("atktRate") or 0)
        except (TypeError, ValueError):
            reservation_rate = 0
        try:
            egg_index = float(item.get("egix") or 0)
        except (TypeError, ValueError):
            egg_index = 0
        genre_ids = sorted({
            CGV_GENRE_IDS[genre.strip()]
            for genre in (item.get("genr") or "").split(",")
            if genre.strip() in CGV_GENRE_IDS
        })
        movies.append({
            "movieId": movie_id,
            "title": (item.get("movNm") or "제목 미상").strip(),
            "posterPath": poster_path,
            "releaseDate": release_date,
            "genreIds": genre_ids,
            "overview": "",
            "availableOn": ["theater"],
            "source": "cgv",
            "cgvChartRank": rank,
            "cgvReservationRate": reservation_rate,
            "cgvEggIndex": egg_index if egg_index > 0 else None,
            "cgvAdmissions": format_cgv_admissions(item.get("accAdncCnt")),
        })
    # CGV 사이트 '무비차트' 탭과 같은 순서(현재 예매 순위)를 그대로 쓴다
    movies.sort(key=lambda movie: movie["cgvChartRank"])
    for rank, movie in enumerate(movies, start=1):
        movie["rank"] = rank
        movie["cgvRank"] = rank
    if not movies:
        raise ValueError("CGV movie chart contains no movies")

    return {
        "asOf": date.today().isoformat(),
        "updatedAt": datetime.now().astimezone().isoformat(timespec="seconds"),
        "isLive": True,
        "movies": movies,
    }


OVERVIEW_CACHE = {}
OVERVIEW_CACHE_LOCK = threading.Lock()


def lookup_overview(title, lotte_code=""):
    """영화관 순위에 줄거리가 없을 때 찾아 채운다: 롯데시네마 영화 상세 → TMDB(키가 있을 때) 순. 결과는 기억해 둔다."""
    key = (title or "").strip()
    if not key:
        return ""
    with OVERVIEW_CACHE_LOCK:
        if key in OVERVIEW_CACHE:
            return OVERVIEW_CACHE[key]
    overview = ""
    if lotte_code:
        try:
            params = {"MethodName": "GetMovieDetailTOBE", "channelType": "HO", "osType": "Chrome", "osVersion": "Chrome",
                      "multiLanguageID": "KR", "representationMovieCode": str(lotte_code), "memberOnNo": ""}
            boundary = "----MinplyLotteDetailBoundary"
            body = (f"--{boundary}\r\nContent-Disposition: form-data; name=\"paramList\"\r\n\r\n"
                    f"{json.dumps(params, ensure_ascii=False)}\r\n--{boundary}--\r\n").encode("utf-8")
            request = Request(LOTTE_CHART_URL, data=body, headers={
                "Content-Type": f"multipart/form-data; boundary={boundary}",
                "Origin": "https://www.lottecinema.co.kr",
                "Referer": f"https://www.lottecinema.co.kr/NLCHS/Movie/MovieDetailView?movie={lotte_code}",
                "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130.0.0.0 Safari/537.36",
            })
            with urlopen(request, timeout=8) as response:
                detail = json.load(response)
            movie = detail.get("Movie") or {}
            overview = str(movie.get("SynopsisKR") or movie.get("Synopsis") or "").strip()
        except Exception:
            overview = ""
    if not overview and TMDB_API_KEY:
        try:
            query = urlencode({"api_key": TMDB_API_KEY, "language": "ko-KR", "query": key})
            with urlopen(f"https://api.themoviedb.org/3/search/movie?{query}", timeout=8) as response:
                results = json.load(response).get("results") or []
            overview = next((str(r.get("overview") or "").strip() for r in results if str(r.get("overview") or "").strip()), "")
        except Exception:
            overview = ""
    overview = " ".join(overview.replace("<br>", " ").split())[:600]
    with OVERVIEW_CACHE_LOCK:
        OVERVIEW_CACHE[key] = overview
    return overview


def fill_chart_overviews(chart, provider):
    targets = [m for m in chart.get("movies", [])[:30] if not (m.get("overview") or "").strip()]
    if not targets:
        return chart
    def fill(movie):
        try:
            movie["overview"] = lookup_overview(movie.get("title"), movie.get("movieCode") if provider == "lotte" else "")
        except Exception:
            movie["overview"] = ""
    with ThreadPoolExecutor(max_workers=8) as pool:
        list(pool.map(fill, targets))
    return chart


def get_live_cgv_chart():
    global CGV_CHART_CACHE, CGV_CHART_CACHE_UNTIL
    with CGV_CHART_CACHE_LOCK:
        if CGV_CHART_CACHE is not None and time.monotonic() < CGV_CHART_CACHE_UNTIL:
            return CGV_CHART_CACHE

        query = urlencode({"coCd": "A420", "unitCpotRelNo": 1})
        request = Request(
            f"{CGV_CHART_URL}?{query}",
            headers={
                "Accept": "application/json, text/plain, */*",
                "Origin": "https://cgv.co.kr",
                "Referer": "https://cgv.co.kr/cnm/cgvChart/movieChart?tabParam=75",
                "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130.0.0.0 Safari/537.36",
                "Accept-Language": "ko-KR,ko;q=0.9,en;q=0.8",
            },
        )
        with urlopen(request, timeout=15) as response:
            chart = fill_chart_overviews(normalize_cgv_chart(json.load(response)), "cgv")
        CGV_CHART_CACHE = chart
        CGV_CHART_CACHE_UNTIL = time.monotonic() + CGV_CHART_REFRESH_SECONDS
        return chart


def normalize_lotte_chart(payload):
    if not isinstance(payload, dict):
        raise ValueError("Lotte Cinema chart API returned an invalid payload")
    if str(payload.get("IsOK", "")).lower() != "true":
        raise RuntimeError("Lotte Cinema chart API returned an unsuccessful status")

    movies_data = payload.get("Movies")
    if not isinstance(movies_data, dict) or not isinstance(movies_data.get("Items"), list):
        raise ValueError("Lotte Cinema chart API returned an invalid movie list")
    items = movies_data["Items"]
    movies = []
    for item in items:
        movie_code = str(item.get("RepresentationMovieCode") or "")
        release_date = (item.get("ReleaseDate") or "")[:10]
        if not movie_code.isdigit() or item.get("MoviePlayYN") != "Y":
            continue
        try:
            date.fromisoformat(release_date)
        except ValueError:
            release_date = ""

        try:
            reservation_rate = float(item.get("BookingRate") or 0)
        except (TypeError, ValueError):
            reservation_rate = 0
        poster_url = (item.get("PosterURL") or "").strip().replace("http://", "https://", 1)
        if poster_url:
            poster_parts = urlsplit(poster_url)
            poster_url = urljoin(f"https://{poster_parts.netloc}/", poster_parts.path.lstrip("/"))
        movies.append({
            "movieCode": movie_code,
            "title": (item.get("MovieNameKR") or "제목 미상").strip(),
            "posterPath": poster_url,
            "releaseDate": release_date,
            "reservationRate": reservation_rate,
            "source": "lotte",
        })

    # 롯데시네마 '현재 상영작 · 예매순'(orderType 1)과 같은 순서를 그대로 쓴다
    for rank, movie in enumerate(movies, start=1):
        movie["rank"] = rank
    if not movies:
        raise ValueError("Lotte Cinema chart contains no movies")

    return {
        "asOf": date.today().isoformat(),
        "updatedAt": datetime.now().astimezone().isoformat(timespec="seconds"),
        "isLive": True,
        "movies": movies,
    }


def get_live_lotte_chart():
    global LOTTE_CHART_CACHE, LOTTE_CHART_CACHE_UNTIL
    with LOTTE_CHART_CACHE_LOCK:
        if LOTTE_CHART_CACHE is not None and time.monotonic() < LOTTE_CHART_CACHE_UNTIL:
            return LOTTE_CHART_CACHE

        params = {
            "MethodName": "GetMoviesToBe",
            "channelType": "HO",
            "osType": "Chrome",
            "osVersion": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/130 Safari/537.36",
            "multiLanguageID": "KR",
            "division": 1,
            "moviePlayYN": "Y",
            "orderType": "1",
            "blockSize": 1000,
            "pageNo": 1,
            "memberOnNo": "",
            "imgdivcd": 2,
        }
        boundary = "----MinplyLotteChartBoundary"
        body = (
            f"--{boundary}\r\n"
            "Content-Disposition: form-data; name=\"paramList\"\r\n\r\n"
            f"{json.dumps(params, ensure_ascii=False, separators=(',', ':'))}\r\n"
            f"--{boundary}--\r\n"
        ).encode("utf-8")
        request = Request(
            LOTTE_CHART_URL,
            data=body,
            headers={
                "Accept": "application/json, text/plain, */*",
                "Content-Type": f"multipart/form-data; boundary={boundary}",
                "Origin": "https://www.lottecinema.co.kr",
                "Referer": "https://www.lottecinema.co.kr/NLCHS/Movie/List?flag=1",
                "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130.0.0.0 Safari/537.36",
                "Accept-Language": "ko-KR,ko;q=0.9,en;q=0.8",
            },
        )
        with urlopen(request, timeout=15) as response:
            chart = fill_chart_overviews(normalize_lotte_chart(json.load(response)), "lotte")
        LOTTE_CHART_CACHE = chart
        LOTTE_CHART_CACHE_UNTIL = time.monotonic() + LOTTE_CHART_REFRESH_SECONDS
        return chart


def parse_megabox_date(value):
    digits = "".join(ch for ch in str(value or "") if ch.isdigit())[:8]
    if len(digits) != 8:
        return None
    try:
        return date(int(digits[:4]), int(digits[4:6]), int(digits[6:8]))
    except ValueError:
        return None


def normalize_megabox_chart(payload):
    if not isinstance(payload, dict) or not isinstance(payload.get("movieList"), list):
        raise ValueError("Megabox chart API returned an invalid movie list")

    movies = []
    seen_codes = set()
    for item in payload["movieList"]:
        movie_code = str(item.get("rpstMovieNo") or item.get("movieNo") or "").strip()
        if not movie_code.isdigit() or movie_code in seen_codes:
            continue
        release_date = parse_megabox_date(item.get("rfilmDe") or item.get("releaseDe"))
        try:
            site_rank = int(item.get("boxoRank") or item.get("rank") or 0)
        except (TypeError, ValueError):
            site_rank = 0
        try:
            reservation_rate = float(item.get("boxoBokdRt") or item.get("bokdRt") or 0)
        except (TypeError, ValueError):
            reservation_rate = 0
        image_path = str(item.get("imgPathNm") or item.get("movieImgPath") or "").strip()
        poster_url = ""
        if image_path:
            poster_url = image_path if image_path.startswith("http") else urljoin(MEGABOX_IMAGE_BASE_URL + "/", image_path.lstrip("/"))
            poster_url = poster_url.replace("http://", "https://", 1)
        seen_codes.add(movie_code)
        movies.append({
            "movieCode": movie_code,
            "title": str(item.get("movieNm") or "제목 미상").strip(),
            "posterPath": poster_url,
            "releaseDate": release_date.isoformat() if release_date else "",
            "siteRank": site_rank or len(movies) + 1,
            "reservationRate": reservation_rate,
            "overview": str(item.get("movieSynopCn") or "").strip(),
            "source": "megabox",
        })

    # 메가박스 '박스오피스' 순위(사이트 순서)를 그대로 쓴다
    movies.sort(key=lambda movie: movie["siteRank"])
    for rank, movie in enumerate(movies, start=1):
        movie["rank"] = rank
    if not movies:
        raise ValueError("Megabox chart contains no movies")

    return {
        "asOf": date.today().isoformat(),
        "updatedAt": datetime.now().astimezone().isoformat(timespec="seconds"),
        "isLive": True,
        "movies": movies,
    }


def get_live_megabox_chart():
    global MEGABOX_CHART_CACHE, MEGABOX_CHART_CACHE_UNTIL
    with MEGABOX_CHART_CACHE_LOCK:
        if MEGABOX_CHART_CACHE is not None and time.monotonic() < MEGABOX_CHART_CACHE_UNTIL:
            return MEGABOX_CHART_CACHE

        params = {
            "currentPage": "1",
            "recordCountPerPage": "40",
            "pageType": "ticketing",
            "ibxYn": "N",
            "onairYn": "Y",
            "specialType": "",
            "specialYn": "N",
        }
        request = Request(
            MEGABOX_CHART_URL,
            data=json.dumps(params).encode("utf-8"),
            headers={
                "Accept": "application/json, text/javascript, */*; q=0.01",
                "Content-Type": "application/json; charset=UTF-8",
                "Origin": "https://www.megabox.co.kr",
                "Referer": "https://www.megabox.co.kr/movie",
                "X-Requested-With": "XMLHttpRequest",
                "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130.0.0.0 Safari/537.36",
                "Accept-Language": "ko-KR,ko;q=0.9,en;q=0.8",
            },
        )
        with urlopen(request, timeout=15) as response:
            chart = fill_chart_overviews(normalize_megabox_chart(json.load(response)), "megabox")
        MEGABOX_CHART_CACHE = chart
        MEGABOX_CHART_CACHE_UNTIL = time.monotonic() + MEGABOX_CHART_REFRESH_SECONDS
        return chart


def write_json(movies):
    genres = [{"id": genre_id, "name": name} for genre_id, name in sorted(GENRE_NAMES.items())]
    with JSON_PATH.open("w", encoding="utf-8") as output:
        json.dump({
            "genres": genres,
            "movies": movies[:JSON_MOVIE_COUNT],
            "nextApiPage": 1,
            "nextApiOffset": JSON_MOVIE_COUNT,
            "apiTotalPages": len(movies),
            "updatedAt": date.today().isoformat(),
        }, output, ensure_ascii=False, indent=2)
        output.write("\n")


def refresh_json():
    feeds = {"theater": [], "ott": []}
    categories = {"theater": "theater", "ott": "ott"}
    for feed, category in categories.items():
        page = 1
        while len(feeds[feed]) < FEED_SIZE and page <= MAX_PAGE:
            result = tmdb_feed_request(feed, page)
            for item in result.get("results", []):
                if is_released(item):
                    feeds[feed].append(normalize_movie(item, None, "api", [category]))
                    if len(feeds[feed]) >= FEED_SIZE:
                        break
            page += 1

    merged = {}
    for feed_movies in feeds.values():
        for movie in feed_movies:
            existing = merged.get(movie["movieId"])
            if existing:
                existing["availableOn"] = sorted(set(existing["availableOn"] + movie["availableOn"]))
                if movie["popularity"] > existing["popularity"]:
                    existing.update({key: movie[key] for key in ("popularity", "voteAverage", "voteCount", "overview")})
            else:
                merged[movie["movieId"]] = movie

    selected = []
    selected_ids = set()
    for index in range(FEED_SIZE):
        for feed in feeds.values():
            if index >= len(feed):
                continue
            movie = feed[index]
            if movie["movieId"] in selected_ids:
                continue
            selected.append(merged[movie["movieId"]])
            selected_ids.add(movie["movieId"])
            if len(selected) == JSON_MOVIE_COUNT:
                break
        if len(selected) == JSON_MOVIE_COUNT:
            break

    selected.sort(key=lambda movie: (-movie["popularity"], -movie["voteCount"], movie["title"].casefold()))
    remaining = sorted(
        (movie for movie_id, movie in merged.items() if movie_id not in selected_ids),
        key=lambda movie: (-movie["popularity"], -movie["voteCount"], movie["title"].casefold()),
    )
    movies = selected + remaining
    for rank, movie in enumerate(movies, start=1):
        movie["rank"] = rank
        movie["source"] = "json" if rank <= JSON_MOVIE_COUNT else "api"
    write_json(movies)
    return movies


def build_review_ranking():
    global REVIEW_RANKING_CACHE
    if REVIEW_RANKING_CACHE is not None:
        return REVIEW_RANKING_CACHE

    candidates = sorted(
        MOVIE_CATALOG,
        key=lambda movie: (-movie["popularity"], -movie["voteCount"]),
    )[:40]

    def fetch_movie_reviews(movie):
        try:
            return movie, tmdb_reviews_request(movie["movieId"])
        except (HTTPError, URLError, TimeoutError, RuntimeError, json.JSONDecodeError):
            return movie, {"results": []}

    with ThreadPoolExecutor(max_workers=4) as executor:
        results = list(executor.map(fetch_movie_reviews, candidates))

    entries = []
    for movie, response in results:
        reviews = response.get("results", [])
        if not reviews:
            continue
        review = reviews[0]
        content = " ".join((review.get("content") or "").split())
        if not content:
            continue
        excerpt = content if len(content) <= 180 else content[:177].rsplit(" ", 1)[0] + "..."
        entries.append({
            "movie": movie,
            "review": {
                "author": review.get("author") or "TMDb 관객",
                "rating": (review.get("author_details") or {}).get("rating"),
                "content": excerpt,
                "createdAt": (review.get("created_at") or "")[:10],
            },
        })
    REVIEW_RANKING_CACHE = entries
    return REVIEW_RANKING_CACHE


def load_csv_fallback():
    movies = []
    genres = {}
    with CSV_PATH.open(encoding="utf-8-sig", newline="") as source:
        for row in csv.DictReader(source):
            try:
                row_genres = json.loads(row.get("genres") or "[]")
            except json.JSONDecodeError:
                row_genres = []
            genre_ids = []
            for genre in row_genres:
                genre_id = int(genre["id"])
                genre_ids.append(genre_id)
                genres[genre_id] = GENRE_NAMES.get(genre_id, genre["name"])
            try:
                popularity = float(row.get("popularity") or 0)
                vote_count = int(float(row.get("vote_count") or 0))
                vote_average = float(row.get("vote_average") or 0)
            except ValueError:
                popularity, vote_count, vote_average = 0, 0, 0
            movies.append({
                "movieId": int(row["id"]),
                "title": row.get("title") or row.get("original_title") or "제목 미상",
                "originalTitle": row.get("original_title") or "",
                "posterPath": None,
                "releaseDate": row.get("release_date") or "",
                "genreIds": genre_ids,
                "popularity": popularity,
                "voteAverage": vote_average,
                "voteCount": vote_count,
                "availableOn": [],
            })
    movies.sort(key=lambda movie: (-movie["popularity"], -movie["voteCount"], movie["title"].casefold()))
    for rank, movie in enumerate(movies, start=1):
        movie["rank"] = rank
        movie["source"] = "json" if rank <= JSON_MOVIE_COUNT else "api"
    return [{"id": genre_id, "name": name} for genre_id, name in sorted(genres.items())], movies


CHART_PATHS = {"/api/cgv-chart", "/api/lotte-chart", "/api/megabox-chart"}


def send_cors_headers(handler):
    # index.html 을 파일(file://)로 연 앱도 영화관 순위를 받아 갈 수 있게 허용 (공개 순위 데이터만 해당)
    handler.send_header("Access-Control-Allow-Origin", "*")
    handler.send_header("Access-Control-Allow-Methods", "GET, OPTIONS")
    handler.send_header("Access-Control-Allow-Private-Network", "true")


def send_json(handler, status, payload):
    body = json.dumps(payload, ensure_ascii=False).encode("utf-8")
    handler.send_response(status)
    handler.send_header("Content-Type", "application/json; charset=utf-8")
    handler.send_header("Content-Length", str(len(body)))
    handler.send_header("Cache-Control", "no-store")
    if urlsplit(handler.path).path in CHART_PATHS:
        send_cors_headers(handler)
    handler.end_headers()
    handler.wfile.write(body)


class MovieRequestHandler(SimpleHTTPRequestHandler):
    def do_OPTIONS(self):
        if urlsplit(self.path).path in CHART_PATHS:
            self.send_response(204)
            send_cors_headers(self)
            self.send_header("Content-Length", "0")
            self.end_headers()
            return
        self.send_error(405)

    def do_GET(self):
        request = urlsplit(self.path)
        if request.path == "/api/cgv-chart":
            try:
                send_json(self, 200, serve_cgv_chart())
            except (HTTPError, URLError, TimeoutError, RuntimeError, json.JSONDecodeError, KeyError, TypeError, ValueError) as error:
                print(f"CGV chart refresh failed: {error}", file=sys.stderr)
                send_json(self, 502, {"error": "CGV movie chart is currently unavailable"})
            return
        if request.path == "/api/lotte-chart":
            try:
                send_json(self, 200, serve_lotte_chart())
            except (HTTPError, URLError, TimeoutError, RuntimeError, json.JSONDecodeError, KeyError, TypeError, ValueError) as error:
                print(f"Lotte Cinema chart refresh failed: {error}", file=sys.stderr)
                send_json(self, 502, {"error": "Lotte Cinema movie chart is currently unavailable"})
            return
        if request.path == "/api/megabox-chart":
            try:
                send_json(self, 200, serve_megabox_chart())
            except (HTTPError, URLError, TimeoutError, RuntimeError, json.JSONDecodeError, KeyError, TypeError, ValueError) as error:
                print(f"Megabox chart refresh failed: {error}", file=sys.stderr)
                send_json(self, 502, {"error": "Megabox movie chart is currently unavailable"})
            return
        if request.path == "/api/review-ranking":
            try:
                send_json(self, 200, {"reviews": build_review_ranking()})
            except (URLError, TimeoutError, RuntimeError, json.JSONDecodeError):
                send_json(self, 502, {"error": "TMDb audience reviews are unavailable"})
            return
        if request.path == "/api/movies":
            try:
                query = parse_qs(request.query)
                offset = int(query.get("offset", [str(JSON_MOVIE_COUNT)])[0])
            except ValueError:
                send_json(self, 400, {"error": "offset must be a number"})
                return
            if offset < JSON_MOVIE_COUNT:
                send_json(self, 400, {"error": "invalid movie pagination"})
                return
            movies = MOVIE_CATALOG[offset:offset + PAGE_SIZE]
            next_offset = offset + len(movies)
            send_json(self, 200, {
                "page": 1,
                "nextPage": 1,
                "nextOffset": next_offset,
                "nextRank": next_offset,
                "totalPages": (len(MOVIE_CATALOG) + PAGE_SIZE - 1) // PAGE_SIZE,
                "hasMore": next_offset < len(MOVIE_CATALOG),
                "movies": movies,
            })
            return
        if request.path.startswith("/api/movie/"):
            path_parts = request.path.strip("/").split("/")
            try:
                movie_id = int(path_parts[2])
                if movie_id < 1:
                    raise ValueError
            except ValueError:
                send_json(self, 400, {"error": "movie id must be a positive number"})
                return
            if len(path_parts) == 4 and path_parts[3] == "reviews":
                try:
                    result = tmdb_reviews_request(movie_id)
                except HTTPError as error:
                    if error.code == 404:
                        send_json(self, 200, {"reviews": []})
                        return
                    send_json(self, 502, {"error": "TMDb movie reviews are unavailable"})
                    return
                except (URLError, TimeoutError, RuntimeError, json.JSONDecodeError):
                    send_json(self, 502, {"error": "TMDb movie reviews are unavailable"})
                    return
                reviews = [{
                    "author": review.get("author") or "TMDb 관객",
                    "rating": (review.get("author_details") or {}).get("rating"),
                    "content": review.get("content") or "",
                    "createdAt": (review.get("created_at") or "")[:10],
                } for review in result.get("results", []) if review.get("content")]
                send_json(self, 200, {"total": result.get("total_results", len(reviews)), "reviews": reviews[:10]})
                return
            if len(path_parts) != 3:
                send_json(self, 404, {"error": "not found"})
                return
            try:
                movie = normalize_movie(tmdb_movie_request(movie_id), None, "api")
            except (URLError, TimeoutError, RuntimeError, json.JSONDecodeError):
                send_json(self, 502, {"error": "TMDb movie details are unavailable"})
                return
            send_json(self, 200, {"movie": movie})
            return
        if request.path in {"/js/server.py", "/js/.env", "/js/.env.example", "/js/.gitignore", "/.env"}:
            self.send_error(404)
            return
        super().do_GET()


def serve_stale_while_refreshing(fetch, max_age=60):
    """마지막으로 받은 순위를 바로 돌려주고, 오래됐으면 뒤에서 새로 받아 둔다.
    앱 화면이 영화관 사이트 응답을 기다리느라 늦게 뜨지 않게 한다."""
    state = {"chart": None, "at": 0.0, "refreshing": False}
    lock = threading.Lock()

    def refresh():
        try:
            chart = fetch()
            with lock:
                state["chart"], state["at"] = chart, time.monotonic()
        except Exception as error:
            print(f"Background chart refresh failed: {error}", file=sys.stderr)
        finally:
            with lock:
                state["refreshing"] = False

    def get():
        with lock:
            chart, age = state["chart"], time.monotonic() - state["at"]
            if chart is not None and age >= max_age and not state["refreshing"]:
                state["refreshing"] = True
                threading.Thread(target=refresh, daemon=True).start()
        if chart is not None:
            return chart
        chart = fetch()  # 처음 한 번은 받아 올 때까지 기다린다
        with lock:
            state["chart"], state["at"] = chart, time.monotonic()
        return chart

    return get


serve_cgv_chart = serve_stale_while_refreshing(lambda: get_live_cgv_chart())
serve_lotte_chart = serve_stale_while_refreshing(lambda: get_live_lotte_chart())
serve_megabox_chart = serve_stale_while_refreshing(lambda: get_live_megabox_chart())


LIVE_CHARTS_JS = ROOT / "data" / "live-charts.js"
LIVE_CHARTS_PREFIX = "window.MINPLY_LIVE_CHARTS = "
UPDATE_TASK_NAME = "Minply 영화관 순위 업데이트"
UPDATE_EVERY_MINUTES = 10


def read_live_charts_file():
    try:
        text = LIVE_CHARTS_JS.read_text(encoding="utf-8")
        start = text.find(LIVE_CHARTS_PREFIX)
        if start >= 0:
            payload = json.loads(text[start + len(LIVE_CHARTS_PREFIX):].strip().rstrip(";"))
            return payload if isinstance(payload, dict) else {}
    except (OSError, ValueError):
        pass
    return {}


def write_live_charts_file(verbose=True):
    """세 영화관 순위를 받아 data/live-charts.js 로 저장한다.
    index.html 을 파일로 바로 열어도 이 파일은 <script> 로 읽을 수 있어서, 서버 없이도 최신 순위가 보인다.
    한 영화관이 실패하면 그 영화관은 이전에 저장한 순위를 그대로 둔다."""
    charts = read_live_charts_file()
    results = {}
    for key, name, fetch in (("cgv", "CGV", get_live_cgv_chart), ("lotte", "롯데시네마", get_live_lotte_chart), ("megabox", "메가박스", get_live_megabox_chart)):
        try:
            chart = fetch()
            charts[key] = chart
            results[name] = f"[성공] {len(chart['movies'])}편 — 1~3위: " + ", ".join(m["title"] for m in chart["movies"][:3])
        except Exception as error:  # 어떤 오류든 기록하고 나머지 영화관은 계속 저장한다
            results[name] = f"[실패] {type(error).__name__}: {error}"
    if any(key in charts for key in ("cgv", "lotte", "megabox")):
        body = LIVE_CHARTS_PREFIX + json.dumps(charts, ensure_ascii=False, separators=(",", ":")) + ";\n"
        temp = LIVE_CHARTS_JS.with_suffix(".js.tmp")
        temp.write_text("/* server.py 가 자동으로 만드는 파일입니다. 직접 고치지 마세요. */\n" + body, encoding="utf-8")
        os.replace(temp, LIVE_CHARTS_JS)
    if verbose:
        for name, result in results.items():
            print(f"  {name}: {result}", flush=True)
    return results


def update_charts_with_retry(tries=6, wait=30):
    """PC를 켠 직후에는 인터넷 연결이 늦게 잡히는 경우가 많아서, 한 영화관이라도 받아질 때까지 몇 번 다시 시도한다."""
    for attempt in range(1, tries + 1):
        results = write_live_charts_file()
        if any(str(result).startswith("[성공]") for result in results.values()):
            return True
        if attempt < tries:
            time.sleep(wait)
    return False


def windows_startup_file():
    """Windows 시작프로그램 폴더 (로그인하면 안의 파일이 자동 실행됨, 관리자 권한 필요 없음)"""
    base = Path(os.environ.get("APPDATA") or Path.home() / "AppData" / "Roaming")
    return base / "Microsoft" / "Windows" / "Start Menu" / "Programs" / "Startup" / f"{UPDATE_TASK_NAME}.vbs"


def startup_vbs_text(runner, script):
    """PC를 켜고 로그인하면 창 없이 순위를 한 번 갱신하는 스크립트 (경로의 큰따옴표는 VBScript 방식으로 두 번 씀)"""
    command = f'"{runner}" "{script}" --update-charts --at-startup'.replace('"', '""')
    return ("' Minply: PC를 켜면 영화관 순위를 바로 갱신합니다. (python js/server.py --remove-auto-update 로 지울 수 있어요)\n"
            f'CreateObject("WScript.Shell").Run "{command}", 0, False\n')


def cron_lines(python, script):
    """macOS·Linux crontab: 10분마다 + 켜질 때(@reboot) 한 번 갱신"""
    run = f'"{python}" "{script}" --update-charts'
    return [f"*/{UPDATE_EVERY_MINUTES} * * * * {run} >/dev/null 2>&1 # minply-charts",
            f"@reboot {run} --at-startup >/dev/null 2>&1 # minply-charts"]


def windows_task_args(runner, script):
    """Windows 작업 스케줄러(schtasks) 등록 명령: 10분마다 server.py --update-charts 실행"""
    command = f'"{runner}" "{script}" --update-charts'
    return ["schtasks", "/Create", "/F", "/SC", "MINUTE", "/MO", str(UPDATE_EVERY_MINUTES),
            "/TN", UPDATE_TASK_NAME, "/TR", command]


def install_auto_update():
    """10분마다 data/live-charts.js 를 갱신하는 예약 작업을 컴퓨터에 등록한다."""
    script = Path(__file__).resolve()
    if os.name == "nt":
        import subprocess
        pythonw = Path(sys.executable).with_name("pythonw.exe")
        runner = pythonw if pythonw.exists() else Path(sys.executable)  # pythonw: 갱신할 때 검은 창이 뜨지 않음
        subprocess.run(windows_task_args(str(runner), str(script)), check=True)
        print(f"Windows 작업 스케줄러에 '{UPDATE_TASK_NAME}'을(를) 등록했어요. {UPDATE_EVERY_MINUTES}분마다 순위를 갱신합니다.")
        startup = windows_startup_file()
        try:
            startup.parent.mkdir(parents=True, exist_ok=True)
            startup.write_text(startup_vbs_text(runner, script), encoding="utf-16")  # 한글 경로도 읽을 수 있게 UTF-16
            print("PC를 켜고 로그인하면 바로 한 번 갱신하도록 시작프로그램에 등록했어요.")
        except OSError as error:
            print(f"시작프로그램 등록 실패(10분마다 갱신은 그대로 동작): {error}", file=sys.stderr)
    else:
        import subprocess
        current = subprocess.run(["crontab", "-l"], capture_output=True, text=True).stdout
        kept = [row for row in current.splitlines() if "# minply-charts" not in row]
        subprocess.run(["crontab", "-"], input="\n".join(kept + cron_lines(sys.executable, script)) + "\n", text=True, check=True)
        print(f"crontab에 {UPDATE_EVERY_MINUTES}분마다, 그리고 컴퓨터를 켤 때 순위를 갱신하는 작업을 등록했어요.")
    print("지금 바로 한 번 갱신합니다...")
    write_live_charts_file()


def remove_auto_update():
    import subprocess
    if os.name == "nt":
        subprocess.run(["schtasks", "/Delete", "/F", "/TN", UPDATE_TASK_NAME], check=False)
        try:
            windows_startup_file().unlink()
        except OSError:
            pass
    else:
        current = subprocess.run(["crontab", "-l"], capture_output=True, text=True).stdout
        kept = [row for row in current.splitlines() if "# minply-charts" not in row]
        subprocess.run(["crontab", "-"], input="\n".join(kept) + "\n", text=True, check=False)
    print("순위 자동 갱신 작업을 지웠어요.")


def keep_live_charts_file_fresh(interval=60):
    """서버가 켜져 있는 동안에는 1분마다 data/live-charts.js 도 함께 갱신한다."""
    while True:
        time.sleep(interval)
        try:
            write_live_charts_file(verbose=False)
        except OSError as error:
            print(f"live-charts.js 저장 실패: {error}", file=sys.stderr)


def check_live_charts():
    """서버를 켜자마자 세 영화관 순위를 한 번씩 받아 보고 결과를 터미널에 알려 준다."""
    print("영화관 실시간 순위 확인 중...", flush=True)
    write_live_charts_file()
    for fetch in (serve_cgv_chart, serve_lotte_chart, serve_megabox_chart):
        try:
            fetch()  # 화면 요청에 바로 응답할 수 있게 미리 받아 둔다
        except Exception:
            pass
    threading.Thread(target=keep_live_charts_file_fresh, daemon=True).start()


def main():
    global MOVIE_CATALOG
    if "--update-charts" in sys.argv:
        if "--at-startup" in sys.argv:
            update_charts_with_retry()  # 켜자마자: 인터넷이 잡힐 때까지 최대 약 3분 재시도
        else:
            write_live_charts_file()
        return
    if "--install-auto-update" in sys.argv:
        install_auto_update()
        return
    if "--remove-auto-update" in sys.argv:
        remove_auto_update()
        return
    if "--build-json" in sys.argv:
        MOVIE_CATALOG = refresh_json()
        print(f"Updated {len(MOVIE_CATALOG)} released theater/OTT movies in {JSON_PATH}")
        return
    try:
        MOVIE_CATALOG = refresh_json()
        print(f"Loaded {len(MOVIE_CATALOG)} released theater/OTT movies into data/movies.json")
    except (OSError, URLError, TimeoutError, RuntimeError, json.JSONDecodeError):
        print("TMDb refresh failed; keeping the existing JSON movie catalog")
        if JSON_PATH.exists():
            with JSON_PATH.open(encoding="utf-8") as source:
                MOVIE_CATALOG = json.load(source).get("movies", [])
    handler = partial(MovieRequestHandler, directory=str(ROOT))
    server = ThreadingHTTPServer(("127.0.0.1", 8000), handler)
    print("Minply is available at http://127.0.0.1:8000")
    threading.Thread(target=check_live_charts, daemon=True).start()
    if "--no-browser" not in sys.argv:
        threading.Timer(1.0, lambda: webbrowser.open("http://127.0.0.1:8000/index.html")).start()
    try:
        server.serve_forever()
    except KeyboardInterrupt:
        pass
    finally:
        server.server_close()


if __name__ == "__main__":
    main()