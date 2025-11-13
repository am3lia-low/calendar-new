import os
import json
from werkzeug.security import generate_password_hash, check_password_hash
from flask_jwt_extended import create_access_token

DATA_DIR = "data"
USERS_FILE = os.path.join(DATA_DIR, "users.json")

def get_users():
    """Loads the users.json file."""
    if not os.path.exists(USERS_FILE):
        with open(USERS_FILE, 'w') as f:
            json.dump({}, f)
        return {}
    with open(USERS_FILE, 'r') as f:
        return json.load(f)

def save_users(users):
    """Saves the users dictionary back to the file."""
    with open(USERS_FILE, 'w') as f:
        json.dump(users, f, indent=4)

def register_user(username, password):
    """Registers a new user."""
    users = get_users()
    if username in users:
        return {"msg": "Username already exists"}, 409

    # Create new user ID
    user_id = f"user_{len(users) + 1}"
    users[username] = {
        "id": user_id,
        "password_hash": generate_password_hash(password)
    }
    save_users(users)
    
    # Create user data directory and default files
    user_data_path = os.path.join(DATA_DIR, user_id)
    os.makedirs(user_data_path, exist_ok=True)
    
    profile_path = os.path.join(user_data_path, "profile.json")
    with open(profile_path, 'w') as f:
        json.dump({"username": username, "photoUrl": ""}, f)

    for year in ["2024", "2025", "2026"]: # Per your spec
        with open(os.path.join(user_data_path, f"{year}_events.json"), 'w') as ef:
            json.dump([], ef)
        with open(os.path.join(user_data_path, f"{year}_tasks.json"), 'w') as tf:
            json.dump({}, tf)
            
    return {"msg": "User created successfully", "userId": user_id}, 201

def login_user(username, password):
    """Logs in an existing user."""
    users = get_users()
    if username not in users:
        return {"msg": "Bad username or password"}, 401

    user_data = users[username]
    if not check_password_hash(user_data["password_hash"], password):
        return {"msg": "Bad username or password"}, 401
    
    user_id = user_data["id"]
    access_token = create_access_token(identity=user_id)
    return {
        "access_token": access_token, 
        "userId": user_id, 
        "username": username
    }, 200