import chromadb

client = chromadb.PersistentClient(path="vector_db/chroma")
collection = client.get_collection("movies")

results = collection.query(
    query_texts=["dark psychological thriller not romantic under 2 hours"],
    n_results=10
)

for i, doc in enumerate(results["documents"][0], start=1):
    metadata = results["metadatas"][0][i - 1]
    distance = results["distances"][0][i - 1]

    print(f"\n{i}. {metadata['title']} ({metadata['year']})")
    print(f"Genres: {metadata['genres']}")
    print(f"Duration: {metadata['duration']} min")
    print(f"Rating: {metadata['rating']}")
    print(f"Distance: {distance}")
    print(f"Text: {doc[:200]}...")