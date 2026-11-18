"""Versioned, authored subject packs. Only the checker can see answer keys."""
import json
from pathlib import Path
from flask import Blueprint, jsonify, request
from diagnostic import InputError, bounded_int, parse_answer

PACKS = Path(__file__).parent / "data" / "subjects"
AREAS = [json.loads(path.read_text(encoding="utf8")) for path in sorted(PACKS.glob("*.json"))]
QUESTIONS = {q["id"]: q for area in AREAS for track in area["tracks"]
             for lesson in track["lessons"] for q in lesson["questions"]}
PRIVATE = {"validator", "feedback", "hints"}
hub = Blueprint("hub", __name__, url_prefix="/api/hub")


def public(value):
    if isinstance(value, dict):
        return {k: public(v) for k, v in value.items() if k not in PRIVATE}
    if isinstance(value, list):
        return [public(v) for v in value]
    return value


@hub.get("/catalog")
def catalog():
    return jsonify(schema_version=1, areas=public(AREAS))


def question_payload():
    data = request.get_json()
    if not isinstance(data, dict) or not isinstance(data.get("id"), str) or data["id"] not in QUESTIONS:
        raise InputError("Escolha uma questão disponível.")
    return QUESTIONS[data["id"]], data


@hub.post("/hint")
def hint():
    q, data = question_payload()
    level = bounded_int(data.get("level"), 1, len(q["hints"]), "Pista")
    return jsonify(text=q["hints"][level - 1])


def matches(q, answer):
    expected = q["validator"]
    if q["format"] == "order":
        if (not isinstance(answer, list) or len(answer) != len(expected)
                or not all(isinstance(v, str) for v in answer) or sorted(answer) != sorted(expected)):
            raise InputError("Use todos os elementos uma vez.")
        return answer == expected
    if not isinstance(answer, str) or not 1 <= len(answer.strip()) <= 220:
        raise InputError("Escreva ou selecione uma resposta.")
    if q["format"] == "numeric":
        return parse_answer(answer) == parse_answer(expected)
    if q["options"] and answer not in q["options"]:
        raise InputError("Escolha uma das opções apresentadas.")
    return answer.strip().casefold() == expected.strip().casefold()


@hub.post("/check")
def check():
    q, data = question_payload()
    correct = matches(q, data.get("answer"))
    return jsonify(correct=correct, text=q["feedback"] if correct else q["hints"][0])
