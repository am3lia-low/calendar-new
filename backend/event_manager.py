import os
import json

DATA_DIR = "data"

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