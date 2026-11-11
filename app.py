"""Lacuna API: ephemeral evaluation; no student data is saved on the server."""
from flask import Flask, jsonify, render_template, request
from werkzeug.exceptions import HTTPException
from diagnostic import (
    CONTENT, QUESTIONS, InputError, assess_record, bounded_int,
    feedback_for, next_question, question_for, recommend, summarize,
)


def create_app(test_config=None):
    app = Flask(__name__)
    app.config.update(MAX_CONTENT_LENGTH=262144, JSON_SORT_KEYS=False)
    if test_config:
        app.config.update(test_config)
    app.json.ensure_ascii = False

    def payload():
        if not request.is_json:
            raise InputError("Envie dados em JSON.")
        data = request.get_json()
        if not isinstance(data, dict):
            raise InputError("O corpo da solicitação deve ser um objeto JSON.")
        return data

    @app.after_request
    def security_headers(response):
        response.headers["X-Content-Type-Options"] = "nosniff"
        response.headers["X-Frame-Options"] = "DENY"
        response.headers["Referrer-Policy"] = "no-referrer"
        response.headers["Permissions-Policy"] = "camera=(), microphone=(), geolocation=()"
        response.headers["Content-Security-Policy"] = "default-src 'self'; script-src 'self'; style-src 'self' 'unsafe-inline'; img-src 'self' data:; font-src 'self'; connect-src 'self'; object-src 'none'; base-uri 'self'; frame-ancestors 'none'; form-action 'self'"
        if request.path.startswith("/api/"):
            response.headers["Cache-Control"] = "no-store"
        return response

    @app.get("/")
    def index():
        return render_template("index.html")

    @app.get("/api/health")
    def health():
        return jsonify(status="ok", version="1.0.0", persistence="browser-localStorage")

    @app.get("/api/content")
    def content():
        public = [{k: v for k, v in q.items() if k not in ("expected", "hints", "explanation")} for q in QUESTIONS.values()]
        return jsonify(version=CONTENT["version"], concepts=CONTENT["concepts"], questions=public, mastery=CONTENT["mastery"])

    @app.post("/api/diagnose")
    def diagnose():
        data = payload()
        result = assess_record(data)
        recommendation = recommend([data])
        return jsonify(**result, feedback=feedback_for(result, data.get("personality", "direct")), explanation=question_for(data["question_id"])["explanation"] if result["correct"] else None, suggested_prerequisite="N1" if result["concept_id"] == "N4" and not result["correct"] else None, recommendation=recommendation)

    @app.post("/api/hint")
    def hint():
        data = payload()
        q = question_for(data.get("question_id"))
        level = bounded_int(data.get("level"), 1, 3, "Nível da pista")
        return jsonify(level=level, text=q["hints"][level - 1])

    @app.post("/api/next")
    def next_activity():
        data = payload()
        return jsonify(next_question(data.get("records", []), data.get("mode", "diagnostic"), data.get("concept_id", "N1")))

    @app.post("/api/report")
    def report():
        records = payload().get("records", [])
        return jsonify(concepts=summarize(records), recommendation=recommend(records))

    @app.errorhandler(InputError)
    def invalid(error):
        return jsonify(error=str(error)), 400

    @app.errorhandler(HTTPException)
    def http_error(error):
        messages = {400: "JSON inválido.", 404: "Endereço não encontrado.", 405: "Método não permitido.", 413: "A solicitação excede o limite de 256 KB.", 415: "Envie dados em JSON."}
        return jsonify(error=messages.get(error.code, "Não foi possível concluir esta solicitação.")), error.code

    @app.errorhandler(Exception)
    def unexpected(error):
        app.logger.error("Falha interna: %s", type(error).__name__)
        return jsonify(error="O servidor encontrou um problema. Seus dados continuam no navegador."), 500

    return app


app = create_app()

if __name__ == "__main__":
    app.run(host="127.0.0.1", port=5000, debug=False)
