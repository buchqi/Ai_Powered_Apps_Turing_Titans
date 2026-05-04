from services.rag_service import search_movies

query = "dadark psychological thriller intense mystery crime horror sci-fi tense serious"

movies = search_movies(query, limit=10)

print(f"Found {len(movies)} movies\n")

for index, movie in enumerate(movies, start=1):
    print(f"{index}. {movie['title']} ({movie['year']})")
    print(f"   Genres: {movie['genres']}")
    print(f"   Duration: {movie['duration']} min")
    print(f"   Rating: {movie['rating']}")
    print(f"   Distance: {movie['distance']}")
    print()