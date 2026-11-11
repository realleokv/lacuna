"""WSGI entry point shared by Windows and Python hosting."""
import os
from waitress import serve
from app import app

if __name__ == "__main__":
    port = int(os.environ.get("PORT", "5000"))
    host = os.environ.get("HOST", "127.0.0.1")
    print(f"Lacuna em http://{host}:{port} (Ctrl+C para parar)", flush=True)
    serve(app, host=host, port=port, threads=4, max_request_body_size=262144)
