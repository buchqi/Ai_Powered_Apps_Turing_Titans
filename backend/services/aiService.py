import os 
import sys
from prompts.recommendation_prompt import build_prompt 
from utils.cost_calculator import calculate_cost
from utils.episode_logger import summarize_preferences, write_episode_log
from utils.llm_resilience import call_with_resilience
sys.stdout.reconfigure(encoding = "utf-8")
# Load environment variables from .env file
# This MUST happen before importing google.genai in some configurations
try:
    from dotenv import load_dotenv
    load_dotenv()
except ImportError:
    pass

try:
    import google.genai as genai
except ImportError:
    print("ERROR:google-genai package not installed")
    print("Run: pip install google-genai")
    genai = None


class AiService:
    def __init__(self):
        self.MODEL = "gemini-3-flash-preview"
    
    def get_recommendations(self,data):
        #Get the API Key
        api_key = os.getenv("GEMINI_API_KEY")
        
        if genai is None or not api_key:
            error_type = "missing_google_genai" if genai is None else "missing_api_key"
            write_episode_log(
                session_id="legacy",
                endpoint="AiService.get_recommendations",
                user_query_or_preferences_summary=summarize_preferences(data),
                model=self.MODEL,
                latency_ms=0,
                fallback_triggered=True,
                status="fallback",
                error_type=error_type,
            )
            return {
                "response": "AI recommendations are temporarily unavailable. Please try the standard recommendation flow.",
                "input_tokens": 0,
                "output_tokens": 0,
                "total_tokens": 0,
                "cost": 0,
                "latency": 0,
                "fallback_triggered": True,
            }

        #Create the client
        print(f"Connecting to {self.MODEL}...")
        client = genai.Client(api_key=api_key)

        #create prompt based on given data 
        PROMPT = build_prompt(data)
        
        #count tokens before generating
        def _call_gemini():
            return client.models.generate_content(
                model=self.MODEL,
                contents=PROMPT
            )

        result = call_with_resilience(
            _call_gemini,
            fallback_value=None,
            timeout_seconds=12,
            max_retries=2,
        )

        response = result.value

        output_tokens = 0
        input_tokens = 0
        if response and getattr(response, "usage_metadata", None):
            output_tokens = int(getattr(response.usage_metadata, "candidates_token_count", 0) or 0)
            input_tokens = int(getattr(response.usage_metadata, "prompt_token_count", 0) or 0)
        cost = calculate_cost(input_tokens, output_tokens)
        status = "success" if response else "fallback"

        write_episode_log(
            session_id="legacy",
            endpoint="AiService.get_recommendations",
            user_query_or_preferences_summary=summarize_preferences(data),
            model=self.MODEL,
            prompt_tokens=input_tokens,
            completion_tokens=output_tokens,
            total_tokens=input_tokens + output_tokens,
            cache_read_tokens=0,
            latency_ms=result.latency_ms,
            fallback_triggered=result.fallback_triggered or response is None,
            status=status,
            error_type=result.error_type if result.fallback_triggered else "",
        )

        return {
            "response": response.text if response else "AI recommendations are temporarily unavailable.",
            "input_tokens": input_tokens,
            "output_tokens": output_tokens,
            "total_tokens": input_tokens + output_tokens,
            "cost": cost,
            "latency": result.latency_ms / 1000,
            "fallback_triggered": result.fallback_triggered or response is None,
            }

        

        
    
    
