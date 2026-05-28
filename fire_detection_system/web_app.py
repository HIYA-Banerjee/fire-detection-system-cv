#!/usr/bin/env python3
"""
Simple entrypoint to launch the Fire Detection web application.
Runs server.py in production mode (debug=False, no auto-reloader).
"""
from server import app, init_detector

if __name__ == '__main__':
    print("\n" + "="*60)
    print("  FIRE & SMOKE DETECTION SYSTEM - STARTUP  ")
    print("="*60)
    print("\n[OK] Application starting...")
    print("Open your browser: http://localhost:5000")
    print("🔐 Login with: admin / admin123")
    print("\nPress Ctrl+C to stop the server\n")
    
    init_detector()
    
    # Run without debug reload to prevent socket errors
    app.run(
        host='0.0.0.0',
        port=5000,
        debug=False,
        threaded=True,
        use_reloader=False
    )
