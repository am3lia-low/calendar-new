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
    """
    
    # Get today's date to use as a default
    today_str = datetime.now().strftime("%Y-%m-%d")

    return f"""
    You are an expert calendar scheduling assistant with a **friendly, casual, and encouraging tone**. 
    Your goal is to parse a user's text prompt and extract event details. You MUST respond in one of two JSON formats:

    FORMAT 1: EVENT (Success)
    If you have enough information to schedule the event (must have title, date, startTime, endTime, AND location),
    return this JSON format.
    {{
      "status": "success",
      "event": {{
        "title": "Event Name",
        "location": "Event Location", 
        "date": "YYYY-MM-DD",
        "startTime": "HH:MM",
        "endTime": "HH:MM",
        "recurrenceRule": "A valid RRULE string or 'NONE'"
      }}
    }}

    FORMAT 2: QUESTION (Needs Info)
    If any critical information is missing, return this JSON format. 
    The 'message' field MUST be a friendly, casual question to the user.
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
    5. **CRITICAL INFORMATION**: 'title', 'date', 'startTime', 'endTime', and **'location'** are ALL required.
    6. If **location** is missing, you MUST ask for it (e.g., "Where is this happening?", "Is this online or in person?").

    ---
    TONE & REPLY EXAMPLES (Crucial for the 'message' field in FORMAT 2):

    **IF CRITICAL INFO IS MISSING:**
    - Missing Location: "where's this event taking place?", "do you have a location for this?", "is this at the office or remote?"
    - Missing Time: "what time is this event?"
    - Missing Name/Title: "what should i call the event?"
    - Missing Recurrence Details: "How often should this repeat? (e.g., daily, weekly, monthly)"
    
    **IF ALL INFO IS PRESENT (FORMAT 1):**
    - You must ensure the 'event' JSON is complete.

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
            response_format={"type": "json_object"},
            num_retries = 3
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

def parse_image_data(base64_image, prompt):
    """
    Parses an image (screenshot) and returns a list of suggested events.
    Optimized for Weekly Timetables (Horizontal and Vertical grids).
    """
    # Clean the base64 string if needed
    if "," in base64_image:
        image_data = base64_image.split(",")[1]
    else:
        image_data = base64_image

    # Get today's date to help the AI calculate "Next Monday" etc.
    today_str = datetime.now().strftime("%Y-%m-%d")

    system_prompt = f"""
    You are an advanced Data Extraction AI specialized in reading Calendar Timetables and Screenshots.
    Your task is to extract event details from the provided image.

    ---
    CRITICAL INSTRUCTION FOR TIMETABLES:
    1. **Identify the Layout**:
       - **Vertical Columns = Days**: (e.g., Outlook/Google Calendar). Look at the top header for dates/days. Look at the left sidebar for times.
       - **Horizontal Rows = Days**: (e.g., University Timetables). Look at the left sidebar for Days (Mon, Tue...). Look at the top header for Times (0800, 0900...).
    
    2. **Extract Details**:
       - **Title**: The main text in the block (e.g., "GEN2061X", "Meeting").
       - **Location**: Often found below the title (e.g., "ERC-SR10", "Teams").
       - **Time**: Infer the start/end time based on the block's position relative to the time axis.
       - **Date**: 
          - If a specific date is visible (e.g., "27 Mon"), use that year/month. 
          - If ONLY the day name is visible (e.g., "MON"), assume it is for the *upcoming* occurrence of that day relative to today ({today_str}).

    3. **Handle Recurring/Academic Notes**:
       - If an event says "Weeks 3, 5, 7" or "Tutorial [01]", add that text to the **description**. Do NOT try to create complex recursion rules yet, just create a single instance for the next occurrence.

    ---
    OUTPUT FORMAT (JSON ONLY):
    Return a JSON object with a key "suggested_events" containing a list of events.
    {{
      "suggested_events": [
        {{
          "title": "Course Code or Event Name",
          "description": "Type (Lec/Tut) + Weeks info",
          "location": "Room number or Venue",
          "date": "YYYY-MM-DD", 
          "startTime": "HH:MM",
          "endTime": "HH:MM"
        }}
      ]
    }}
    If no events are found, return "suggested_events": [].
    """

    try:
        response = litellm.completion(
            # We use 1.5-flash as it has excellent vision capabilities for grids
            model="gemini/gemini-2.5-flash",
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
                                "url": f"data:image/jpeg;base64,{image_data}"
                            }
                        }
                    ]
                }
            ],
            response_format={"type": "json_object"},
            num_retries=3
        )

        raw_content = response.choices[0].message.content
        
        # --- DEBUGGING ---
        print("\n============= AI RAW VISION RESPONSE =============")
        print(raw_content)
        print("==================================================\n")
        # -----------------
        
        parsed_json = json.loads(raw_content)
        return parsed_json

    except Exception as e:
        print(f"Litellm error in parse_image_data: {e}")
        return {"suggested_events": []}