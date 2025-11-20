import os
import json
from flask import Flask, jsonify, request, send_from_directory
from flask_cors import CORS
from flask_jwt_extended import create_access_token, get_jwt_identity, jwt_required, JWTManager
from werkzeug.security import generate_password_hash, check_password_hash
from werkzeug.utils import secure_filename
from event_manager import get_all_events, save_all_events_split
from ai_parser import parse_image_data, schedule_event_from_text # Import the new function
import uuid # Need this to create new event IDs

# Import your custom logic modules
from auth import register_user, login_user
from event_manager import (
    get_all_events, save_all_events_split,
    get_tasks, save_tasks,
    get_profile, save_profile
)
from ai_parser import parse_image_data

app = Flask(__name__)
CORS(app, resources={r"/api/*": {"origins": "http://localhost:3000"}})

# --- Configuration ---
app.config["JWT_SECRET_KEY"] = "your-super-secret-key-change-this" # IMPORTANT
app.config["UPLOAD_FOLDER"] = os.path.join(app.root_path, "uploads")
os.makedirs(app.config["UPLOAD_FOLDER"], exist_ok=True) # Ensure uploads folder exists

jwt = JWTManager(app)

# --- Authentication Endpoints ---

@app.route("/api/register", methods=["POST"])
def register():
    username = request.json.get("username", None)
    password = request.json.get("password", None)
    if not username or not password:
        return jsonify({"msg": "Username and password required"}), 400
    
    response, status_code = register_user(username, password)
    return jsonify(response), status_code

@app.route("/api/login", methods=["POST"])
def login():
    username = request.json.get("username", None)
    password = request.json.get("password", None)
    if not username or not password:
        return jsonify({"msg": "Username and password required"}), 400

    response, status_code = login_user(username, password)
    return jsonify(response), status_code

# --- File Serving Endpoint ---

@app.route('/uploads/<user_id>/<filename>')
def serve_user_upload(user_id, filename):
    # This securely serves files only from the specific user's upload directory
    user_upload_folder = os.path.join(app.config['UPLOAD_FOLDER'], user_id)
    return send_from_directory(user_upload_folder, filename)

# --- Profile Endpoints ---

@app.route("/api/profile", methods=["GET"])
@jwt_required()
def handle_get_profile():
    user_id = get_jwt_identity()
    profile = get_profile(user_id)
    if profile:
        return jsonify(profile), 200
    return jsonify({"msg": "Error fetching profile"}), 500

@app.route("/api/profile", methods=["POST"])
@jwt_required()
def handle_update_profile():
    user_id = get_jwt_identity()
    
    profile = get_profile(user_id)
    if not profile:
        return jsonify({"msg": "Profile not found"}), 404

    # 1. Check for text data (username)
    if 'username' in request.form:
        profile['username'] = request.form['username']
        # Note: In a real app, you'd also update the login 'users.json'

    # 2. Check for file (photo)
    if 'photo' in request.files:
        file = request.files['photo']
        if file.filename != '':
            filename = secure_filename(file.filename)
            user_upload_folder = os.path.join(app.config['UPLOAD_FOLDER'], user_id)
            os.makedirs(user_upload_folder, exist_ok=True)
            save_path = os.path.join(user_upload_folder, filename)
            file.save(save_path)
            
            profile['photoUrl'] = f"/uploads/{user_id}/{filename}"
    
    # 3. Save the updated profile.json
    if save_profile(user_id, profile):
        return jsonify(profile), 200
    return jsonify({"msg": "Error saving profile"}), 500

# --- Event Endpoints (Refactored) ---

@app.route("/api/events/all", methods=["GET"])
@jwt_required()
def handle_get_all_events():
    user_id = get_jwt_identity()
    events = get_all_events(user_id)
    if events is None:
        return jsonify({"msg": "Data not found"}), 404
    return jsonify(events)

@app.route("/api/events/save_all", methods=["POST"])
@jwt_required()
def handle_save_all_events():
    user_id = get_jwt_identity()
    all_events = request.json
    if save_all_events_split(user_id, all_events):
        return jsonify({"msg": "Events saved successfully"}), 200
    return jsonify({"msg": "Error saving events"}), 500

# --- Checklist Endpoints ---

@app.route("/api/tasks/<int:year>", methods=["GET"])
@jwt_required()
def handle_get_tasks(year):
    user_id = get_jwt_identity()
    tasks = get_tasks(user_id, year)
    if tasks is None:
        return jsonify({"msg": "Error retrieving tasks"}), 500
    return jsonify(tasks)

@app.route("/api/tasks/<int:year>", methods=["POST"])
@jwt_required()
def handle_save_tasks(year):
    user_id = get_jwt_identity()
    all_tasks = request.json 
    if save_tasks(user_id, all_tasks):
        return jsonify({"msg": "Tasks saved successfully"}), 200
    return jsonify({"msg": "Error saving tasks"}), 500

# --- AI Chatbot Endpoint ---
@app.route("/api/chat/parse_image", methods=["POST"])
@jwt_required()
def handle_parse_image():
    user_id = get_jwt_identity()
    data = request.json
    base64_image = data.get("image")
    prompt = data.get("prompt", "Extract event details from this image.")

    if not base64_image:
        return jsonify({"msg": "No image data provided"}), 400

    try:
        # Pass to the AI parser module
        event_data = parse_image_data(base64_image, prompt)
        # Event data is just suggestions, so we don't save.
        # We just return the suggestions to the user for confirmation.
        return jsonify(event_data), 200
    except Exception as e:
        return jsonify({"msg": f"Error parsing image: {str(e)}"}), 500

# backend/app.py

@app.route("/api/chat/schedule_event", methods=["POST"])
@jwt_required()
def handle_schedule_event():
    user_id = get_jwt_identity()
    
    # 1. Get the full conversation history from the frontend
    try:
        data = request.json
        history_from_frontend = data.get("history") 
    except Exception:
        # If request.json fails (e.g., bad format), catch it here
        return jsonify({"msg": "Invalid JSON or missing history in request"}), 400

    if not history_from_frontend:
        return jsonify({"msg": "No history provided"}), 400

    # 2. Call the AI agent with the full conversation history
    try:
        ai_response = schedule_event_from_text(history_from_frontend) 
    except Exception as e:
        print(f"Error calling AI agent: {e}")
        return jsonify({
            "status": "error",
            "message": "Internal AI communication error."
        }), 500
        
    # 3. Process AI's response
    if ai_response.get("status") == "success":
        # --- SUCCESS PATH ---
        try:
            new_event = ai_response.get("event")
            new_event["id"] = f"evt-{uuid.uuid4()}"
            
            # Get the *last* user prompt for the description
            # We must use history_from_frontend[-1]['text'] now that we have the array
            last_user_prompt = history_from_frontend[-1].get("text", "AI scheduled event")
            new_event["description"] = f"Created by AI from prompt: '{last_user_prompt}'"
            
            all_events = get_all_events(user_id)
            all_events.append(new_event)
            save_all_events_split(user_id, all_events)
            
            return jsonify({
                "status": "success",
                "message": f"Event '{new_event['title']}' created!",
                "newEvent": new_event
            }), 200

        except Exception as e:
            print(f"Error saving event: {e}")
            return jsonify({
                "status": "error",
                "message": "An error occurred while saving the event to the database."
            }), 500
            
    elif ai_response.get("status") == "question":
        # --- QUESTION PATH ---
        return jsonify({
            "status": "question",
            "message": ai_response.get("message")
        }), 200
        
    else:
        # --- FALLBACK ERROR ---
        return jsonify({
            "status": "question",
            "message": "Sorry, I had trouble understanding that. Could you rephrase your request?"
        }), 200

# --- Main Runner ---

if __name__ == '__main__':
    if not os.path.exists("data"):
        os.makedirs("data")
    app.run(debug=True, port=5001)