def build_prompt(data):
    return f"""
    You are a movie recommendation system for couples.

    User 1 preferences: {data['user1']}
    User 2 preferences: {data['user2']}

    Suggest 5 movies both would enjoy.
    Return only a list.
    """