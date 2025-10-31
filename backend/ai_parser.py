import litellm
import base64
import json

# Set your API keys in your environment variables
# os.environ["GEMINI_API_KEY"] = "your_key_here"

def parse_image_data(base64_image, prompt):
    # litellm expects the base64 string *without* the 'data:image/png;base64,' prefix
    image_data = base64_image.split(",")[1]

    system_prompt = """
    You are an assistant that extracts event information from images.
    The user will provide an image and a prompt.
    Analyze the image and extract any events, formatted as a JSON list.
    Only return the JSON list. Do not add any other text.
    
    The JSON structure for each event must be:
    {
      "title": "Event Title",
      "description": "Event Description (if any)",
      "date": "YYYY-MM-DD",
      "startTime": "HH:MM",
      "endTime": "HH:MM",
      "location": "Event Location (if any)"
    }
    
    If you cannot find any events, return an empty list [].
    """

    try:
        response = litellm.completion(
            model="gemini/gemini-pro-vision", # Using Gemini 2.5 placeholder (via gemini-pro-vision)
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
            ]
        )
        
        # Extract the JSON content from the model's response
        raw_content = response.choices[0].message.content
        # Clean up potential markdown code block
        if raw_content.startswith("```json"):
            raw_content = raw_content[7:-3].strip()
            
        parsed_events = json.loads(raw_content)
        return {"suggested_events": parsed_events}

    except Exception as e:
        print(f"Litellm error: {e}")
        # In case of failure, return a structured error
        return {"error": str(e), "suggested_events": []}