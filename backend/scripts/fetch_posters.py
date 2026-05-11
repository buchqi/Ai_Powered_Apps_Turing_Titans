import json
import os
import time
from pathlib import Path
from urllib.error import HTTPError, URLError
from urllib.parse import urlencode
from urllib.request import Request, urlopen
from dotenv import load_dotenv


PLACEHOLDER_POSTER_URL = "http://127.0.0.1:8000/static/placeholder-poster.svg"
TMDB_SEARCH_URL = "https://api.themoviedb.org/3/search/movie"
TMDB_POSTER_BASE_URL = "https://image.tmdb.org/t/p/w500"
REQUEST_TIMEOUT_SECONDS = 15
REQUEST_DELAY_SECONDS = 0.25


def _load_movies(movies_path: Path) -> list[dict]:
    with movies_path.open("r", encoding="utf-8-sig") as file:
        return json.load(file)


def _save_movies(movies_path: Path, movies: list[dict]) -> None:
    with movies_path.open("w", encoding="utf-8") as file:
        json.dump(movies, file, indent=2, ensure_ascii=False)
        file.write("\n")


def _request_tmdb_results(api_key: str, title: str, year) -> list[dict]:
    params = {
        "api_key": api_key,
        "query": title,
        "include_adult": "false",
    }
    if year:
        params["year"] = str(year)

    url = f"{TMDB_SEARCH_URL}?{urlencode(params)}"
    request = Request(url, headers={"Accept": "application/json"})

    with urlopen(request, timeout=REQUEST_TIMEOUT_SECONDS) as response:
        payload = json.loads(response.read().decode("utf-8"))
    return payload.get("results") or []


def _result_year(result: dict) -> str | None:
    release_date = result.get("release_date") or ""
    if len(release_date) >= 4:
        return release_date[:4]
    return None


def _select_best_result(results: list[dict], year) -> dict | None:
    if not results:
        return None

    wanted_year = str(year) if year else None
    with_posters = [result for result in results if result.get("poster_path")]
    if not with_posters:
        return None

    if wanted_year:
        for result in with_posters:
            if _result_year(result) == wanted_year:
                return result

    return with_posters[0]


def fetch_poster_url(api_key: str, title: str, year) -> str | None:
    try:
        results = _request_tmdb_results(api_key, title, year)
    except (HTTPError, URLError, TimeoutError, json.JSONDecodeError) as exc:
        print(f"    TMDB request failed: {exc}")
        return None

    best = _select_best_result(results, year)
    poster_path = best.get("poster_path") if best else None
    if not poster_path:
        return None

    return f"{TMDB_POSTER_BASE_URL}{poster_path}"


def main() -> None:
    load_dotenv()
    api_key = os.getenv("TMDB_API_KEY")
    if not api_key:
        print("TMDB_API_KEY not found. Cannot fetch posters automatically.")
        print("movies.json was not changed.")
        return

    backend_root = Path(__file__).resolve().parent.parent
    movies_path = backend_root / "data" / "movies.json"
    movies = _load_movies(movies_path)
    total = len(movies)

    for index, movie in enumerate(movies, start=1):
        title = str(movie.get("title") or "").strip()
        year = movie.get("year")
        label = f"{title} ({year})" if year else title

        if not title:
            movie["poster_url"] = movie.get("poster_url") or PLACEHOLDER_POSTER_URL
            print(f"[{index}/{total}] Untitled movie -> poster not found, using placeholder")
            continue

        poster_url = fetch_poster_url(api_key, title, year)
        if poster_url:
            movie["poster_url"] = poster_url
            print(f"[{index}/{total}] {label} -> poster found")
        else:
            movie["poster_url"] = PLACEHOLDER_POSTER_URL
            print(f"[{index}/{total}] {label} -> poster not found, using placeholder")

        time.sleep(REQUEST_DELAY_SECONDS)

    _save_movies(movies_path, movies)
    print(f"Updated poster_url values in {movies_path}.")
    print("Next step: rebuild ChromaDB so vector metadata includes the new poster URLs.")
    print("Delete: backend/vector_db/chroma")
    print("Then run: cd backend && python scripts/ingest_movies.py")


if __name__ == "__main__":
    main()
