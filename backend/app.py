from fastapi import FastAPI
from services.aiService import AiService

app = FastAPI()
service = AiService()

@app.post("/recommend")
async def recommend(data:dict):
    return service.get_recommendations(data)