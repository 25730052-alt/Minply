import csv
import json
import os
import sys
from concurrent.futures import ThreadPoolExecutor
from datetime import date
from functools import partial
from http.server import SimpleHTTPRequestHandler, ThreadingHTTPServer
from pathlib import Path
from urllib.error import HTTPError, URLError
from urllib.parse import parse_qs, urlencode, urlsplit
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
MOVIE_CATALOG = []
REVIEW_RANKING_CACHE = None


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


def send_json(handler, status, payload):
    body = json.dumps(payload, ensure_ascii=False).encode("utf-8")
    handler.send_response(status)
    handler.send_header("Content-Type", "application/json; charset=utf-8")
    handler.send_header("Content-Length", str(len(body)))
    handler.send_header("Cache-Control", "no-store")
    handler.end_headers()
    handler.wfile.write(body)


class MovieRequestHandler(SimpleHTTPRequestHandler):
    def do_GET(self):
        request = urlsplit(self.path)
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


def main():
    global MOVIE_CATALOG
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
    try:
        server.serve_forever()
    except KeyboardInterrupt:
        pass
    finally:
        server.server_close()


if __name__ == "__main__":
    main()