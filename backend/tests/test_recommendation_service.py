from services.recommendation_service import (
    create_recommendation_session,
    get_more_movies,
)

preferences = {
    "userA": {
        "tone": "dark",
        "pace": "intense",
        "avoid": ["romance"],
        "duration": "under 2 hours"
    },
    "userB": {
        "tone": "mysterious",
        "pace": "slow but tense",
        "avoid": ["comedy"],
        "duration": "under 2 hours"
    }
}

session = create_recommendation_session(preferences)

print("FIRST BATCH")
print(session["session_id"])
for movie in session["movies"]:
    print(movie["title"])

print("\nSECOND BATCH")
more = get_more_movies(session["session_id"])
for movie in more["movies"]:
    print(movie["title"])