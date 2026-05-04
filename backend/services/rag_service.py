from pathlib import Path

import chromadb


COLLECTION_NAME = "movies"
CHROMA_PATH = Path(__file__).resolve().parent.parent / "vector_db" / "chroma"

_client = chromadb.PersistentClient(path=str(CHROMA_PATH))
_collection = _client.get_collection(name=COLLECTION_NAME)


def search_movies(query: str, limit: int = 10) -> list[dict]:
    if not query or not query.strip():
        return []

    safe_limit = max(1, int(limit))
    result = _collection.query(query_texts=[query], n_results=safe_limit)

    ids = result.get("ids") or []
    metadatas = result.get("metadatas") or []
    documents = result.get("documents") or []
    distances = result.get("distances") or []

    if not ids or not ids[0]:
        return []

    rows = []
    for i, movie_id in enumerate(ids[0]):
        metadata = (
            metadatas[0][i]
            if metadatas and metadatas[0] and i < len(metadatas[0])
            else {}
        )
        document = (
            documents[0][i]
            if documents and documents[0] and i < len(documents[0])
            else ""
        )
        distance = (
            distances[0][i]
            if distances and distances[0] and i < len(distances[0])
            else None
        )

        rows.append(
            {
                "id": str(metadata.get("id", movie_id)),
                "title": metadata.get("title"),
                "year": metadata.get("year"),
                "genres": metadata.get("genres"),
                "duration": metadata.get("duration"),
                "rating": metadata.get("rating"),
                "poster_url": metadata.get("poster_url"),
                "document": document,
                "distance": distance,
            }
        )

    return rows
