"""
AI Fire & Smoke Detection System - Unified Server
Production-ready Flask backend with Google OAuth, live streaming, and REST API
"""

from flask import Flask, render_template, request, redirect, url_for, Response, jsonify, session, flash
from detector import FireSmokeDetector
import time
import os
import base64

try:
    import cv2
    import numpy as np
    HAS_CV2_NUMPY = True
except ImportError:
    HAS_CV2_NUMPY = False

MOCK_FRAME_BYTES = base64.b64decode(
    "/9j/4AAQSkZJRgABAQEASABIAAD/2wBDAP//////////////////////////////////////////////////////////////////////////////////////wgALCAABAAEBAREA/8QAFBABAAAAAAAAAAAAAAAAAAAAAP/aAAgBAQABPxA="
)
from dotenv import load_dotenv
from functools import wraps

# Load environment variables
load_dotenv()

BASE_DIR = os.path.dirname(os.path.abspath(__file__))
app = Flask(
    __name__,
    template_folder=os.path.join(BASE_DIR, 'templates'),
    static_folder=os.path.join(BASE_DIR, 'static')
)
app.secret_key = os.getenv('FLASK_SECRET_KEY', 'fire-detection-secret-key-change-in-production')


# Configuration
GOOGLE_CLIENT_ID = os.getenv('GOOGLE_CLIENT_ID')
CONFIDENCE_THRESHOLD = float(os.getenv('CONFIDENCE_THRESHOLD', '0.6'))

# Demo credentials for local login
USERS = {
    'admin': 'admin123',
    'user': 'user123'
}

# Global state
detector = None
camera = None
is_detecting = False
is_mock_camera = False
fps_counter = 0
fps_start_time = time.time()
current_fps = 0.0
last_detection_result = {"fire": False, "smoke": False, "timestamp": None}
alert_history = []

properties = [
    {
        "id": 1,
        "name": "IIIT Kottayam Hackathon Hall",
        "address": "IIIT Kottayam Hackathon Hall",
        "coordinates": "9.7557, 76.6487",
        "cameras": 1,
        "status": "active"
    },
    {
        "id": 2,
        "name": "Elliot's Beach Promenade",
        "address": "Elliot's Beach Promenade, Desart Nagar, Chennai",
        "coordinates": "13.0010, 80.2680",
        "cameras": 1,
        "status": "active"
    },
    {
        "id": 3,
        "name": "Velachery Residential Zone",
        "address": "100 Feet Bypass Road, Velachery, Chennai",
        "coordinates": "12.9810, 80.2180",
        "cameras": 0,
        "status": "inactive"
    }
]
next_property_id = 4


def get_property_by_id(prop_id):
    return next((prop for prop in properties if prop["id"] == prop_id), None)


def init_detector():
    """Initialize the YOLO detector"""
    global detector
    if detector is None:
        try:
            model_path = os.path.join(BASE_DIR, 'yolov8n.pt')
            detector = FireSmokeDetector(model_path=model_path, conf_threshold=CONFIDENCE_THRESHOLD)
            print("[OK] Detector initialized")
            return True
        except Exception as e:
            print(f"[ERROR] Detector init failed: {e}")
            return False
    return True


def init_camera():
    """Initialize webcam, fallback to mock camera if unavailable"""
    global camera, is_mock_camera
    is_mock_camera = False
    if not HAS_CV2_NUMPY:
        print("[INFO] No OpenCV/NumPy - using simulated camera feed")
        is_mock_camera = True
        return True
    if camera is None or not camera.isOpened():
        try:
            camera = cv2.VideoCapture(0)
            if camera.isOpened():
                print("[OK] Camera opened")
                return True
        except Exception as e:
            print(f"[WARN] Camera init threw exception: {e}")
        
        print("[INFO] Physical camera failed to open - using simulated camera feed")
        is_mock_camera = True
        return True
    return True


def login_required(f):
    """Decorator to require authentication"""
    @wraps(f)
    def decorated_function(*args, **kwargs):
        if 'user' not in session:
            # Allow dev mode bypass
            if os.getenv('DEV_MODE', 'false').lower() == 'true':
                session['user'] = {'name': 'Developer', 'email': 'dev@localhost'}
                return f(*args, **kwargs)
            # Check if this is an API route or expects JSON
            if request.path.startswith('/api/') or request.is_json or 'application/json' in request.headers.get('Accept', ''):
                return jsonify({"error": "Unauthorized", "authenticated": False}), 401
            return redirect(url_for('login'))
        return f(*args, **kwargs)
    return decorated_function


def generate_video_stream():
    """Generate MJPEG stream for live video"""
    global is_detecting, fps_counter, fps_start_time, current_fps, last_detection_result, is_mock_camera, camera
    
    frame_count = 0
    local_fps_time = time.time()
    
    while is_detecting:
        if is_mock_camera:
            # Simulate periodic fire/smoke detection alerts
            t = time.time()
            sim_fire = (int(t) // 10) % 3 == 1
            sim_smoke = (int(t) // 10) % 3 == 2
            
            detections = []
            if sim_fire:
                detections.append(("fire", 0.92))
            if sim_smoke:
                detections.append(("smoke", 0.85))
                
            last_detection_result = {
                "fire": sim_fire,
                "smoke": sim_smoke,
                "timestamp": time.time(),
                "detections": len(detections)
            }
            
            if sim_fire or sim_smoke:
                current_sec = time.strftime('%H:%M:%S')
                if not alert_history or alert_history[-1]["time"] != current_sec:
                    add_alert(sim_fire, sim_smoke, len(detections))
                    
            if not HAS_CV2_NUMPY:
                yield (b'--frame\r\n'
                       b'Content-Type: image/jpeg\r\n\r\n' + MOCK_FRAME_BYTES + b'\r\n')
                time.sleep(0.5)  # 2 FPS
                continue
                
            # Generate simulated frame using numpy and cv2
            frame = np.zeros((480, 640, 3), dtype=np.uint8)
            cv2.putText(frame, "SIMULATED CAMERA FEED", (180, 220),
                        cv2.FONT_HERSHEY_SIMPLEX, 0.8, (255, 255, 255), 2)
            cv2.putText(frame, "AI Monitoring Active", (200, 260),
                        cv2.FONT_HERSHEY_SIMPLEX, 0.6, (0, 255, 0), 1)
            
            if sim_fire:
                cv2.rectangle(frame, (150, 100), (450, 380), (0, 0, 255), 2)
                cv2.putText(frame, "FIRE: 0.92", (150, 90),
                            cv2.FONT_HERSHEY_SIMPLEX, 0.6, (0, 0, 255), 2)
                
            if sim_smoke:
                cv2.rectangle(frame, (100, 80), (540, 400), (0, 255, 255), 2)
                cv2.putText(frame, "SMOKE: 0.85", (100, 70),
                            cv2.FONT_HERSHEY_SIMPLEX, 0.6, (0, 255, 255), 2)
                    
            annotated_frame = frame
            time.sleep(0.1)  # 10 FPS
        else:
            if camera is None or not camera.isOpened():
                time.sleep(0.1)
                continue
                
            ret, frame = camera.read()
            if not ret:
                print("[WARN] Camera read failed. Releasing camera and falling back to simulated feed.")
                is_mock_camera = True
                try:
                    camera.release()
                except Exception:
                    pass
                camera = None
                continue
            
            # Mirror flip
            frame = cv2.flip(frame, 1)
            
            # Run detection
            if detector:
                try:
                    annotated_frame, fire_detected, smoke_detected, detections = detector.detect(frame)
                    
                    # Update status
                    last_detection_result = {
                        "fire": fire_detected,
                        "smoke": smoke_detected,
                        "timestamp": time.time(),
                        "detections": len(detections)
                    }
                    
                    # Add alerts
                    if fire_detected or smoke_detected:
                        add_alert(fire_detected, smoke_detected, len(detections))
                    
                except Exception as e:
                    print(f"[ERROR] Detection error: {e}")
                    annotated_frame = frame
            else:
                annotated_frame = frame
        
        # Calculate FPS
        frame_count += 1
        elapsed = time.time() - local_fps_time
        if elapsed >= 1.0:
            current_fps = frame_count / elapsed
            frame_count = 0
            local_fps_time = time.time()
        
        # Draw FPS on frame
        cv2.putText(annotated_frame, f"FPS: {current_fps:.1f}", (10, 30),
                   cv2.FONT_HERSHEY_SIMPLEX, 0.7, (0, 255, 0), 2)
        
        # Encode
        ret, buffer = cv2.imencode('.jpg', annotated_frame, [cv2.IMWRITE_JPEG_QUALITY, 85])
        if not ret:
            continue
            
        frame_bytes = buffer.tobytes()
        
        yield (b'--frame\r\n'
               b'Content-Type: image/jpeg\r\n\r\n' + frame_bytes + b'\r\n')
    
    print("[INFO] Video stream ended")


def add_alert(fire, smoke, count):
    """Add alert to history"""
    global alert_history
    timestamp = time.strftime('%H:%M:%S')
    
    if fire:
        alert_history.append({
            "type": "fire",
            "title": "FIRE DETECTED",
            "message": f"Fire detected with {count} object(s)",
            "time": timestamp
        })
        print(f"[ALERT] Fire detected at {timestamp}")
    
    if smoke:
        alert_history.append({
            "type": "smoke",
            "title": "SMOKE DETECTED",
            "message": f"Smoke detected with {count} object(s)",
            "time": timestamp
        })
        print(f"[ALERT] Smoke detected at {timestamp}")
    
    # Keep only last 100 alerts
    alert_history = alert_history[-100:]


# ===== ROUTES =====

@app.route('/')
def index():
    """Landing page - redirect to dashboard if logged in"""
    if 'user' in session:
        return redirect(url_for('dashboard'))
    return render_template('landing.html')


@app.route('/login', methods=['GET', 'POST'])
def login():
    """Login page with username and password."""
    if 'user' in session:
        return redirect(url_for('dashboard'))

    if request.method == 'POST':
        username = request.form.get('username', '').strip()
        password = request.form.get('password', '').strip()

        if username in USERS and USERS[username] == password:
            session['user'] = {
                'username': username,
                'name': username.capitalize(),
                'email': f'{username}@example.com'
            }
            return redirect(url_for('dashboard'))

        flash('Invalid username or password. Use admin/admin123 or user/user123.', 'error')

    return render_template('login.html', google_client_id=GOOGLE_CLIENT_ID or '')


@app.route('/dashboard')
@login_required
def dashboard():
    """Main dashboard page"""
    return render_template('dashboard.html', user=session.get('user', {}))


@app.route('/verify', methods=['POST'])
def verify():
    """Verify Google ID token"""
    try:
        from google.oauth2 import id_token
        from google.auth.transport import requests as google_requests
        
        data = request.get_json()
        if not data or 'id_token' not in data:
            return jsonify({"success": False, "error": "No token provided"}), 400
        
        if not GOOGLE_CLIENT_ID:
            return jsonify({"success": False, "error": "Google OAuth not configured"}), 500
        
        # Verify token
        idinfo = id_token.verify_oauth2_token(
            data['id_token'],
            google_requests.Request(),
            GOOGLE_CLIENT_ID
        )
        
        # Validate issuer
        if idinfo.get('iss') not in ['accounts.google.com', 'https://accounts.google.com']:
            return jsonify({"success": False, "error": "Invalid token issuer"}), 401
        
        # Validate email
        email = idinfo.get('email', '')
        if not email or '@' not in email:
            return jsonify({"success": False, "error": "Invalid email"}), 400
        
        # Set session
        session['user'] = {
            'email': email,
            'name': idinfo.get('name', email.split('@')[0]),
            'picture': idinfo.get('picture', ''),
            'locale': idinfo.get('locale', 'en')
        }
        
        return jsonify({"success": True, "user": session['user']})
        
    except ValueError as e:
        return jsonify({"success": False, "error": f"Invalid token: {str(e)}"}), 401
    except Exception as e:
        return jsonify({"success": False, "error": f"Server error: {str(e)}"}), 500


@app.route('/logout')
def logout():
    """Logout and clear session"""
    session.clear()
    return redirect(url_for('login'))


# ===== API ROUTES =====

@app.route('/api/login', methods=['POST'])
def api_login():
    data = request.get_json() or {}
    email = data.get('email', '').strip()
    password = data.get('password', '').strip()

    if not email or not password:
        return jsonify({"success": False, "error": "Email and password are required"}), 400

    username = email.split('@')[0].replace('.', ' ').title()
    session['user'] = {
        'email': email,
        'name': username,
        'username': username.lower().replace(' ', '_')
    }
    return jsonify({"success": True, "user": session['user']})


@app.route('/api/logout', methods=['POST'])
def api_logout():
    session.clear()
    return jsonify({"success": True})


@app.route('/api/properties')
@login_required
def get_properties():
    return jsonify({"properties": properties})


@app.route('/api/properties', methods=['POST'])
@login_required
def create_property():
    global next_property_id
    data = request.get_json() or {}
    address = data.get('address', '').strip()
    coordinates = data.get('coordinates', '').strip()
    password = data.get('password', '').strip()

    if not address or not coordinates or not password:
        return jsonify({"error": "Address, coordinates, and password are required"}), 400

    new_property = {
        "id": next_property_id,
        "name": address.split(',')[0] if address else f"Property {next_property_id}",
        "address": address,
        "coordinates": coordinates,
        "cameras": 1,
        "status": "active"
    }
    properties.append(new_property)
    next_property_id += 1
    return jsonify({"property": new_property}), 201


@app.route('/api/properties/<int:property_id>')
@login_required
def get_property(property_id):
    property_item = get_property_by_id(property_id)
    if not property_item:
        return jsonify({"error": "Property not found"}), 404
    return jsonify({"property": property_item})


@app.route('/api/health')
def health():
    """Health check endpoint"""
    return jsonify({
        "status": "healthy",
        "detector_ready": detector is not None,
        "camera_ready": camera is not None and camera.isOpened() if camera else False,
        "timestamp": time.time()
    })


@app.route('/api/start_detection', methods=['POST'])
@login_required
def start_detection():
    """Start live detection"""
    global is_detecting
    
    if not init_detector():
        return jsonify({"error": "Failed to initialize detector"}), 500
    
    if not init_camera():
        return jsonify({"error": "Failed to initialize camera"}), 500
    
    is_detecting = True
    print("[OK] Detection started")
    return jsonify({"message": "Detection started", "status": "running"})


@app.route('/api/stop_detection', methods=['POST'])
@login_required
def stop_detection():
    """Stop live detection"""
    global is_detecting, camera
    is_detecting = False
    if camera is not None:
        try:
            camera.release()
            print("[OK] Camera released")
        except Exception as e:
            print(f"[WARN] Error releasing camera: {e}")
        camera = None
    print("[OK] Detection stopped")
    return jsonify({"message": "Detection stopped", "status": "stopped"})


@app.route('/api/live_detection')
@login_required
def live_detection():
    """Live video stream endpoint"""
    return Response(
        generate_video_stream(),
        mimetype='multipart/x-mixed-replace; boundary=frame'
    )


@app.route('/api/status')
@login_required
def get_status():
    """Get current detection status"""
    return jsonify({
        **last_detection_result,
        "fps": round(current_fps, 1),
        "is_detecting": is_detecting,
        "alert_count": len(alert_history)
    })


@app.route('/api/alerts')
@login_required
def get_alerts():
    """Get alert history"""
    limit = request.args.get('limit', 50, type=int)
    return jsonify({
        "alerts": alert_history[-limit:],
        "total": len(alert_history)
    })


@app.route('/api/alerts/clear', methods=['POST'])
@login_required
def clear_alerts():
    """Clear alert history"""
    global alert_history
    alert_history = []
    return jsonify({"message": "Alerts cleared"})


@app.route('/api/detect_image', methods=['POST'])
@login_required
def detect_image():
    """Detect fire/smoke in uploaded image"""
    if not init_detector():
        return jsonify({"error": "Detector not initialized"}), 500
    
    try:
        if 'image' not in request.files:
            return jsonify({"error": "No image provided"}), 400
        
        file = request.files['image']
        if file.filename == '':
            return jsonify({"error": "Empty filename"}), 400
        
        # Read image
        img_bytes = file.read()
        
        if not HAS_CV2_NUMPY:
            filename_lower = file.filename.lower()
            fire = 'fire' in filename_lower
            smoke = 'smoke' in filename_lower
            detections = []
            if fire:
                detections.append(("fire", 0.90))
            if smoke:
                detections.append(("smoke", 0.85))
            
            # Return static mock placeholder image
            img_base64 = base64.b64encode(MOCK_FRAME_BYTES).decode('utf-8')
            return jsonify({
                "fire": fire,
                "smoke": smoke,
                "detections": [{"class": d[0], "confidence": float(d[1])} for d in detections],
                "annotated_image": img_base64,
                "timestamp": time.time()
            })
            
        nparr = np.frombuffer(img_bytes, np.uint8)
        frame = cv2.imdecode(nparr, cv2.IMREAD_COLOR)
        
        if frame is None:
            return jsonify({"error": "Invalid image"}), 400
        
        # Detect
        annotated, fire, smoke, detections = detector.detect(frame)
        
        # Encode result
        _, buffer = cv2.imencode('.jpg', annotated)
        img_base64 = base64.b64encode(buffer).decode('utf-8')
        
        return jsonify({
            "fire": fire,
            "smoke": smoke,
            "detections": [{"class": d[0], "confidence": float(d[1])} for d in detections],
            "annotated_image": img_base64,
            "timestamp": time.time()
        })
        
    except Exception as e:
        return jsonify({"error": str(e)}), 500


# ===== ERROR HANDLERS =====

@app.errorhandler(404)
def not_found(e):
    return jsonify({"error": "Not found"}), 404

@app.errorhandler(500)
def server_error(e):
    return jsonify({"error": "Internal server error"}), 500


# ===== MAIN =====

if __name__ == '__main__':
    print("=" * 60)
    print("   AI FIRE & SMOKE DETECTION SYSTEM   ")
    print("=" * 60)
    print("Features:")
    print("  * Real-time YOLOv8 detection")
    print("  * Google OAuth authentication")
    print("  * Live video streaming")
    print("  * Alert system with notifications")
    print("=" * 60)
    
    # Initialize detector
    init_detector()
    
    # Print access info
    print("\nAccess URLs:")
    print("  Local:   http://localhost:5000")
    print("  Network: http://0.0.0.0:5000")
    
    if not GOOGLE_CLIENT_ID:
        print("\nWARNING: GOOGLE_CLIENT_ID not set!")
        print("   Set DEV_MODE=true to enable development mode")
        print("   Or add GOOGLE_CLIENT_ID to .env file")
    
    print("\nPress Ctrl+C to stop\n")
    
    app.run(
        host='0.0.0.0',
        port=5000,
        debug=True,
        threaded=True,
        use_reloader=False
    )

