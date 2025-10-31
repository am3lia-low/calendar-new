import os
from flask import Flask, jsonify, request
from flask_cors import CORS
from flask_jwt_extended import get_jwt_identity, jwt_required, JWTManager
from auth import register_user, login_user
from event_manager import get_events, save_events, get_tasks, save_tasks
# We will add ai_parser later

app = Flask(__name__)
CORS(app) # Allow requests from our React app

# Setup JWT
app.config["JWT_SECRET_KEY"] = "your-super-secret-key-change-this" # IMPORTANT
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

@app.route("/api/profile", methods=["GET"])
@jwt_required()
def get_profile():
    # Example of a protected endpoint
    user_id = get_jwt_identity()
    # In a real app, you'd fetch this from profile.json
    return jsonify(message=f"Welcome, {user_id}!")

# --- Protected Data Endpoints ---

@app.route("/api/events/<int:year>", methods=["GET"])
@jwt_required()
def handle_get_events(year):
    user_id = get_jwt_identity() # This is how we isolate data
    events = get_events(user_id, year)
    if events is None:
        return jsonify({"msg": "Data not found"}), 404
    return jsonify(events)

@app.route("/api/events/<int:year>", methods=["POST"])
@jwt_required()
def handle_save_events(year):
    user_id = get_jwt_identity()
    all_events = request.json
    if save_events(user_id, year, all_events):
        return jsonify({"msg": "Events saved successfully"}), 200
    return jsonify({"msg": "Error saving events"}), 500

# ... (Add task endpoints here, similarly protected) ...

if __name__ == '__main__':
    if not os.path.exists("data"):
        os.makedirs("data")
    app.run(debug=True, port=5001)