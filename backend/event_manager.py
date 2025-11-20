import os
import json

DATA_DIR = "data"
SUPPORTED_YEARS = ["2024", "2025", "2026"]

def get_user_data_path(user_id, year, data_type="events"):
    filename = f"{year}_{data_type}.json"
    return os.path.join(DATA_DIR, user_id, filename)

def get_events(user_id, year):
    path = get_user_data_path(user_id, year, "events")
    try:
        with open(path, 'r') as f:
            return json.load(f)
    except FileNotFoundError:
        return [] # Return empty list if no file
    except Exception:
        return None # General error
    
def get_all_events(user_id):
    """Fetches all events from all supported year files for a user."""
    all_events = []
    for year in SUPPORTED_YEARS:
        path = get_user_data_path(user_id, year, "events")
        try:
            with open(path, 'r') as f:
                events_in_file = json.load(f)
                all_events.extend(events_in_file)
        except FileNotFoundError:
            continue  # It's okay if a year file doesn't exist
        except Exception as e:
            print(f"Error loading {path}: {e}")
            continue
    return all_events

def save_all_events_split(user_id, all_events):
    """
    Saves a master list of events back into their respective year files.
    Filters out any non-dictionary items in the input list for robustness.
    """
    events_by_year = {year: [] for year in SUPPORTED_YEARS}
    
    for event in all_events:
        # CRITICAL FIX: Ensure the item is a dictionary before attempting to call .get()
        if not isinstance(event, dict):
            print(f"Skipping invalid event entry (Type: {type(event).__name__}). Expected dictionary.")
            continue
            
        # We store base recurring events in their START year.
        # We store exceptions in their *modified* date's year.
        # We store deleted instances (ghosts) in their *original* date's year.
        
        date_key = event.get('date', event.get('originalDate'))
        if not date_key:
            print(f"Skipping event with no date: {event.get('title', 'Untitled Event')}")
            continue
        
        try:
            # Safely extract the year from the date string (e.g., '2025-11-20' -> '2025')
            event_year = date_key.split('-')[0]
            
            if event_year in events_by_year:
                events_by_year[event_year].append(event)
            else:
                # If event is outside our 3-year scope, just log it
                print(f"Event for year {event_year} is outside supported range.")
        except Exception as e:
            # Catch errors like date_key not being a valid string for splitting
            print(f"Error processing event (ID: {event.get('id')}): {e}. Date key: {date_key}")
            
    # Now, save each year's file
    try:
        for year, events_list in events_by_year.items():
            # Assuming get_user_data_path returns a file path for the current year
            path = get_user_data_path(user_id, year, "events")
            with open(path, 'w') as f:
                json.dump(events_list, f, indent=4)
        return True
    except Exception as e:
        print(f"Error saving all events: {e}")
        return False

def save_events(user_id, year, events_data):
    path = get_user_data_path(user_id, year, "events")
    try:
        with open(path, 'w') as f:
            json.dump(events_data, f, indent=4)
        return True
    except Exception:
        return False

# ... similar functions for get_tasks and save_tasks ...
def get_tasks(user_id, year):
    path = get_user_data_path(user_id, year, "tasks")
    try:
        with open(path, 'r') as f:
            return json.load(f)
    except FileNotFoundError:
        return {} # Return empty dict if no file
    except Exception:
        return None

def save_tasks(user_id, year, tasks_data):
    path = get_user_data_path(user_id, year, "tasks")
    try:
        with open(path, 'w') as f:
            json.dump(tasks_data, f, indent=4)
        return True
    except Exception:
        return False
    
def get_tasks(user_id, year):
    path = get_user_data_path(user_id, year, "tasks")
    try:
        with open(path, 'r') as f:
            return json.load(f)
    except FileNotFoundError:
        return {} # Return empty dict if no file for the year
    except Exception as e:
        print(f"Error getting tasks for {user_id}, {year}: {e}")
        return None

def save_tasks(user_id, year, tasks_data):
    path = get_user_data_path(user_id, year, "tasks")
    try:
        with open(path, 'w') as f:
            json.dump(tasks_data, f, indent=4)
        return True
    except Exception as e:
        print(f"Error saving tasks for {user_id}, {year}: {e}")
        return False
    
def get_profile_path(user_id):
    return os.path.join(DATA_DIR, user_id, "profile.json")

def get_profile(user_id):
    """Reads profile data for a user."""
    path = get_profile_path(user_id)
    try:
        with open(path, 'r') as f:
            return json.load(f)
    except FileNotFoundError:
        # This shouldn't happen if registration worked
        return {"username": "Error", "photoUrl": ""}
    except Exception as e:
        print(f"Error reading profile {path}: {e}")
        return None

def save_profile(user_id, profile_data):
    """Saves profile data for a user."""
    path = get_profile_path(user_id)
    try:
        with open(path, 'w') as f:
            json.dump(profile_data, f, indent=4)
        return True
    except Exception as e:
        print(f"Error saving profile {path}: {e}")
        return False