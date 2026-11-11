"""Deterministic educational rules. No database, network calls or code evaluation."""
import json
import re
from fractions import Fraction
from pathlib import Path

DATA = Path(__file__).resolve().parent / "data"
CONTENT = json.loads((DATA / "concepts.json").read_text(encoding="utf-8"))
QUESTION_DATA = json.loads((DATA / "questions.json").read_text(encoding="utf-8"))
CONCEPTS = {c["id"]: c for c in CONTENT["concepts"]}
QUESTIONS = {q["id"]: q for q in QUESTION_DATA["questions"]}
STATUS_LABELS = {
    "unassessed": "Ainda não avaliado", "practice": "Precisa praticar",
    "developing": "Em desenvolvimento", "mastered": "Demonstrou domínio",
}


class InputError(ValueError):
    pass


def parse_answer(value):
    if not isinstance(value, str) or not 1 <= len(value.strip()) <= 40:
        raise InputError("Digite um número ou uma fração, com até 40 caracteres.")
    value = value.strip().replace("−", "-").replace(",", ".")
    value = re.sub(r"^x\s*=\s*", "", value, flags=re.I)
    number = r"[+-]?(?:[0-9]{1,9}(?:\.[0-9]{1,9})?|\.[0-9]{1,9})"
    if not re.fullmatch(rf"{number}(?:\s*/\s*{number})?", value):
        raise InputError("Use um número (como −4 ou 0,5) ou uma fração (como 1/2).")
    try:
        parts = value.split("/")
        result = Fraction(parts[0].strip())
        if len(parts) == 2:
            result /= Fraction(parts[1].strip())
        if abs(result) > 10**9:
            raise InputError("Esse número é grande demais para os exercícios deste módulo.")
        return result
    except ZeroDivisionError as exc:
        raise InputError("O denominador de uma fração não pode ser zero.") from exc


def question_for(question_id):
    if not isinstance(question_id, str) or question_id not in QUESTIONS:
        raise InputError("Questão não encontrada. Volte à atividade e tente novamente.")
    return QUESTIONS[question_id]


def bounded_int(value, low, high, label):
    if type(value) is not int or not low <= value <= high:
        raise InputError(f"{label} deve estar entre {low} e {high}.")
    return value


def assess_record(record):
    if not isinstance(record, dict):
        raise InputError("Registro de resposta inválido.")
    q = question_for(record.get("question_id"))
    answer = parse_answer(record.get("answer"))
    first = parse_answer(record.get("first_answer", record.get("answer")))
    attempts = bounded_int(record.get("attempts", 1), 1, 20, "Tentativas")
    hints = bounded_int(record.get("hints_used", 0), 0, 3, "Pistas")
    if attempts == 1 and answer != first:
        raise InputError("A primeira resposta deve coincidir com a única tentativa.")
    expected = parse_answer(q["expected"])
    return {
        "question_id": q["id"], "concept_id": q["concept_id"],
        "correct": answer == expected, "first_correct": first == expected,
        "independent": first == expected and attempts == 1 and hints == 0,
        "attempts": attempts, "hints_used": hints,
    }


def assess_history(records):
    if not isinstance(records, list) or len(records) > 500:
        raise InputError("Envie até 500 registros de resposta por solicitação.")
    return [assess_record(r) for r in records]


def summarize(records, window=None, required=None):
    window = window or CONTENT["mastery"]["window"]
    required = required or CONTENT["mastery"]["required_independent"]
    if not 1 <= required <= window:
        raise ValueError("Regra de domínio inválida.")
    assessed = assess_history(records)
    result = {}
    for concept_id in CONCEPTS:
        # A repeated item never supplies two independent pieces of evidence.
        latest = {}
        for record in reversed(assessed):
            if record["concept_id"] == concept_id and record["question_id"] not in latest:
                latest[record["question_id"]] = record
            if len(latest) == window:
                break
        recent = list(latest.values())
        independent = sum(r["independent"] for r in recent)
        wrong = sum(not r["first_correct"] for r in recent)
        status = "unassessed" if not recent else "developing"
        if len(recent) >= window and independent >= required:
            status = "mastered"
        elif wrong >= 2:
            status = "practice"
        result[concept_id] = {
            "status": status, "label": STATUS_LABELS[status], "total": len(recent),
            "first_correct": sum(r["first_correct"] for r in recent),
            "independent": independent, "window": window,
        }
    return result


def recommend(records):
    assessed = assess_history(records)
    if not assessed:
        return {"concept_id": "N1", "reason": "Comece pelo diagnóstico para conhecer seu ponto de partida."}
    # An observed division error is a suggestion for practice, not a diagnosis.
    probe_indices = [i for i, r in enumerate(assessed) if r["question_id"] == "op_div_probe"]
    if probe_indices and not assessed[probe_indices[-1]]["first_correct"]:
        later = assessed[probe_indices[-1] + 1:]
        division_evidence = {r["question_id"] for r in later if r["concept_id"] == "N1" and r["independent"] and "÷" in QUESTIONS[r["question_id"]]["expression"]}
        if len(division_evidence) < 2:
            return {"concept_id": "N1", "reason": "A divisão merece uma nova tentativa. Isso é uma hipótese de prática, não uma lacuna confirmada."}
    summary = summarize(records)
    for cid in CONCEPTS:
        if summary[cid]["status"] == "practice":
            return {"concept_id": cid, "reason": "Mais de uma questão desse conceito trouxe dificuldade. Uma aula curta pode ajudar a explorar o caminho."}
    for r in reversed(assessed):
        if not r["independent"] and summary[r["concept_id"]]["status"] != "mastered":
            return {"concept_id": r["concept_id"], "reason": "Vamos praticar uma ideia que ainda precisa de mais evidências. Uma resposta sozinha não define seu conhecimento."}
    for cid in CONCEPTS:
        if summary[cid]["status"] != "mastered":
            return {"concept_id": cid, "reason": "Há espaço para reunir mais evidências com questões diferentes."}
    return {"concept_id": "N4", "reason": "Você demonstrou domínio na regra desta demonstração. Revise as equações para conectar os conceitos."}


def next_question(records, mode="diagnostic", concept_id="N1"):
    assessed = assess_history(records)
    if mode not in ("diagnostic", "reassessment", "practice") or not isinstance(concept_id, str) or concept_id not in CONCEPTS:
        raise InputError("Tipo de atividade ou conceito inválido.")
    used = {r["question_id"] for r in assessed}
    if len(used) != len(assessed):
        raise InputError("Uma sessão não pode conter a mesma questão duas vezes.")
    if mode == "practice":
        sequence = [CONCEPTS[concept_id]["lesson"]["practice_id"]]
    elif mode == "reassessment":
        sequence = [q["id"] for q in QUESTIONS.values() if q["concept_id"] == concept_id and q["purpose"] == "reassessment"]
        if concept_id != "N4":
            sequence.append("eq_re_001")
    else:
        if any(r["concept_id"] == "N4" and not r["first_correct"] for r in assessed):
            # The mandatory path is ordered, even if the subtraction is also wrong.
            for probe in ("op_sub_probe", "op_div_probe"):
                if probe not in used and len(used) < 10:
                    return {"question_id": probe, "total": 10, "done": False, "investigating": True}
        sequence = ["eq_001", "neg_001", "frac_001", "op_001", "eq_002", "neg_002", "frac_002", "op_002", "neg_003", "frac_003", "eq_003", "op_003", "eq_004"]
    total = len(sequence) if mode != "diagnostic" else (10 if any(r["concept_id"] == "N4" and not r["first_correct"] for r in assessed) else 8)
    if len(used) >= total:
        return {"question_id": None, "total": total, "done": True, "investigating": False}
    candidate = next((qid for qid in sequence if qid not in used), None)
    return {"question_id": candidate, "total": total, "done": candidate is None, "investigating": False}


def feedback_for(result, personality="direct"):
    if personality not in ("patient", "funny", "direct"):
        raise InputError("Personalidade inválida.")
    messages = {
        "direct": ("Isso! A conta fecha. Próximo passo?", "Ainda não fechou. Vamos conferir uma etapa de cada vez."),
        "patient": ("Você chegou ao resultado. Vamos seguir no seu ritmo.", "Tudo bem tentar de novo. Uma pista pode ajudar a organizar o primeiro passo."),
        "funny": ("Boa! Essa conta entrou nos eixos. Meus circuitos comemoraram.", "A conta deu uma voltinha. Vamos buscar o caminho juntos?"),
    }
    return messages[personality][0 if result["correct"] else 1]
