import litellm
import json
from datetime import datetime
import os
from dotenv import load_dotenv

load_dotenv()

# Set your API keys in your environment variables
os.environ["GEMINI_API_KEY"] = os.getenv('gemini_api')

def get_schedule_agent_prompt():
    """
    Defines the system prompt for the scheduling agent.
    This prompt instructs the AI on its task, assumptions, and output format.
    """
    
    # Get today's date to use as a default
    today_str = datetime.now().strftime("%Y-%m-%d")

    # backend/ai_parser.py (inside get_schedule_agent_prompt function)

    return f"""
    You are an expert calendar scheduling assistant with a **friendly, casual, and encouraging tone**. 
    Your goal is to parse a user's text prompt and extract event details. You MUST respond in one of two JSON formats:

    FORMAT 1: EVENT (Success)
    If you have enough information to schedule the event (must have title, date, startTime, endTime),
    return this JSON format.
    {{
      "status": "success",
      "event": {{
        "title": "Event Name",
        "location": "Event Location or null",
        "date": "YYYY-MM-DD",
        "startTime": "HH:MM",
        "endTime": "HH:MM",
        "recurrenceRule": "A valid RRULE string or 'NONE'"
      }}
    }}

    FORMAT 2: QUESTION (Needs Info)
    If any critical information (title, date, time) is missing or ambiguous,
    return this JSON format. The 'message' field MUST be a friendly, casual question to the user.
    {{
      "status": "question",
      "message": "The friendly, casual clarifying question you need to ask the user."
    }}

    ---
    RULES & ASSUMPTIONS:
    1. **Tone**: Be friendly, casual, and use contractions (e.g., "what's", "I've", "can't").
    2. Today's date is: {today_str}. If the user doesn't specify a date or day, assume today.
    3. If the user gives a start time but no duration or end time, assume a 1-hour duration.
    4. If recurrence is NOT mentioned, 'recurrenceRule' is "NONE".
    5. 'Location' is optional. If missing, set to null.
    6. 'title', 'date', 'startTime', 'endTime' are CRITICAL. If any are missing, you MUST ask (FORMAT 2).

    ---
    TONE & REPLY EXAMPLES (Crucial for the 'message' field in FORMAT 2):

    **IF CRITICAL INFO IS MISSING:**
    - Missing Location: "where's this event taking place?"
    - Missing Time: "what time is this event?"
    - Missing Name/Title: "what should i call the event?"
    - Missing Recurrence Details: "How often should this repeat? (e.g., daily, weekly, monthly)"
    
    **IF ALL INFO IS PRESENT (FORMAT 1):**
    - You must ensure the 'event' JSON is complete. The frontend will handle the success message based on the data you provide.

    ---
    """

def schedule_event_from_text(history_from_frontend):
    """
    Calls the Gemini model with the full conversation history.
    """
    system_prompt = get_schedule_agent_prompt()
    
    # --- BUILD THE MESSAGE LIST ---
    messages_for_ai = [{"role": "system", "content": system_prompt}]
    
    # Map frontend keys (sender/text) to backend keys (role/content)
    for msg in history_from_frontend:
        role = "assistant" if msg["sender"] == "ai" else "user"
        messages_for_ai.append({"role": role, "content": msg["text"]})
    # --- END BUILD ---

    try:
        response = litellm.completion(
            model="gemini/gemini-2.5-flash", # or gemini-2.5-flash
            messages=messages_for_ai, # Pass the full history
            response_format={"type": "json_object"}
        )
        
        raw_content = response.choices[0].message.content
        parsed_json = json.loads(raw_content)
        return parsed_json

    except Exception as e:
        print(f"Litellm error in schedule_event_from_text: {e}")
        return {
            "status": "question",
            "message": "Sorry, I had trouble understanding that. Could you rephrase your request?"
        }

# --- Keep the image parser from before ---
def parse_image_data(base64_image, prompt):
    """
    Parses an image and returns a list of suggested events.
    (This is your existing function, modified to fit)
    """
    image_data = base64_image.split(",")[1]

    system_prompt = """
    You are an assistant that extracts event information from images.
    Return a JSON object: {"suggested_events": [...]}.
    The JSON structure for each event must be:
    {
      "title": "Event Title",
      "description": "Event Description (if any)",
      "date": "YYYY-MM-DD",
      "startTime": "HH:MM",
      "endTime": "HH:MM",
      "location": "Event Location (if any)"
    }
    If you cannot find any events, return an empty list.
    """

    try:
        response = litellm.completion(
            model="gemini/gemini-pro-vision",
            messages=[
                {
                    "role": "system",
                    "content": system_prompt
                },
                {
                    "role": "user",
                    "content": [
                        {"type": "text", "text": prompt},
                        {
                            "type": "image_url",
                            "image_url": {
                                "url": f"data:image/jpeg;base66,{image_data}"
                            }
                        }
                    ]
                }
            ],
            response_format={"type": "json_object"}
        )
        
        raw_content = response.choices[0].message.content
        parsed_json = json.loads(raw_content)
        return parsed_json

    except Exception as e:
        print(f"Litellm error in parse_image_data: {e}")
        return {"suggested_events": []}