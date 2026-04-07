from services.aiService import AiService

# mock input data 
data = {
    "user1": "action, sci-fi",
    "user2": "romance, drama"
}

service = AiService()

result = service.get_recommendations(data)

print(result)
