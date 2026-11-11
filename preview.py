"""Preview helper: same Flask app, with a configurable Python interpreter."""
import os
import sys
import argparse

if __name__ == "__main__":
    parser = argparse.ArgumentParser()
    parser.add_argument("--host", default=os.environ.get("HOST", "127.0.0.1"))
    parser.add_argument("--port", default=os.environ.get("PORT", "5000"))
    args, _ = parser.parse_known_args()
    os.environ["HOST"] = args.host
    os.environ["PORT"] = args.port
    interpreter = os.environ.get("LACUNA_PYTHON", sys.executable)
    os.execv(interpreter, [interpreter, "serve.py"])
