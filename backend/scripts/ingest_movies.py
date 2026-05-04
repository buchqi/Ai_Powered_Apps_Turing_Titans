import json
from pathlib import Path

import chromadb


def build_movie_document(movie: dict) -> str:
    genres = movie.get("genres", [])
    genres_text = ", ".join(genres) if isinstance(genres, list) else str(genres)

    return (
        f"Title: {movie.get('title', '')}. "
        f"Year: {movie.get('year', '')}. "
        f"Genres: {genres_text}. "
        f"Description: {movie.get('description', '')}. "
        f"Duration: {movie.get('duration', '')} minutes. "
        f"Rating: {movie.get('rating', '')}."
    )


def main() -> None:
    backend_root = Path(__file__).resolve().parent.parent
    movies_path = backend_root / "data" / "movies.json"
    chroma_path = backend_root / "vector_db" / "chroma"
    collection_name = "movies"

    with movies_path.open("r", encoding="utf-8") as file:
        movies = json.load(file)

    print(f"Loaded {len(movies)} movies from {movies_path}.")

    client = chromadb.PersistentClient(path=str(chroma_path))

    try:
        client.delete_collection(name=collection_name)
        print(f"Deleted old '{collection_name}' collection.")
    except Exception:
        print(f"No existing '{collection_name}' collection to delete.")

    collection = client.get_or_create_collection(name=collection_name)

    ids = []
    documents = []
    metadatas = []

    for movie in movies:
        genres = movie.get("genres", [])
        genres_text = ", ".join(genres) if isinstance(genres, list) else str(genres)

        ids.append(str(movie.get("id")))
        documents.append(build_movie_document(movie))
        metadatas.append(
            {
                "id": str(movie.get("id", "")),
                "title": str(movie.get("title", "")),
                "year": int(movie.get("year", 0)) if movie.get("year") is not None else 0,
                "genres": genres_text,
                "duration": int(movie.get("duration", 0))
                if movie.get("duration") is not None
                else 0,
                "rating": float(movie.get("rating", 0.0))
                if movie.get("rating") is not None
                else 0.0,
                "poster_url": str(movie.get("poster_url", "")),
            }
        )

    collection.add(ids=ids, documents=documents, metadatas=metadatas)

    print(f"Inserted {len(ids)} movies into '{collection_name}' collection.")
    print("Movie ingestion completed successfully.")


if __name__ == "__main__":
    main()
