import os 
import time 
from dotenv import load_dotenv
import sys
from prompts.recommendation_prompt import build_prompt 
from utils.cost_calculator import calculate_cost
sys.stdout.reconfigure(encoding = "utf-8")
# Load environment variables from .env file
# This MUST happen before importing google.genai in some configurations
load_dotenv()

try:
    import google.genai as genai
except ImportError:
    print("ERROR:google-genai package not installed")
    print("Run: pip install google-genai")


class AiService:
    def __init__(self):
        self.MODEL = "gemini-3-flash-preview"
    
    def get_recommendations(self,data):
        #Get the API Key
        api_key = os.getenv("GEMINI_API_KEY")
        
        if not api_key:
            print("ERROR: GEMINI_API_KEY not found in environment.")
            print("Make sure you have a .env file with: GEMINI_API_KEY=your_key_here")
            print("See guides/gemini-setup-guide.md for instructions.")
            exit(1)

        #Create the client
        print(f"Connecting to {self.MODEL}...")
        client = genai.Client(api_key=api_key)

        #create prompt based on given data 
        PROMPT = build_prompt(data)
        
        #count tokens before generating
        token_count_result = client.models.count_tokens(
            model=self.MODEL,
            contents=PROMPT
        )

        #Make The Api call and mesure latency     
        start_time = time.perf_counter()
        
        #get response
        response = client.models.generate_content(
            model=self.MODEL,
            contents=PROMPT
        )

        end_time = time.perf_counter()

        calculate_cost
        output_tokens = response.usage_metadata.candidates_token_count
        input_tokens = response.usage_metadata.prompt_token_count
        cost = calculate_cost(input_tokens, output_tokens)

        return {
            "response": response.text,
            "input_tokens": input_tokens,
            "output_tokens": output_tokens,
            "total_tokens": input_tokens + output_tokens,
            "cost": cost,
            "latency": end_time - start_time
            }

        

        
    
    