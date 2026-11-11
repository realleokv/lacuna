from fractions import Fraction
import pytest
from app import create_app
from diagnostic import QUESTIONS, CONCEPTS, InputError, parse_answer, assess_record, summarize, next_question, recommend


def record(qid, answer=None, **kwargs):
    return {"question_id": qid, "answer": QUESTIONS[qid]["expected"] if answer is None else str(answer), "attempts": 1, "hints_used": 0, **kwargs}


@pytest.fixture
def client():
    return create_app({"TESTING": True}).test_client()


@pytest.mark.parametrize("raw,expected", [("1/2", Fraction(1, 2)), ("2/4", Fraction(1, 2)), ("0,75", Fraction(3, 4)), ("−4", Fraction(-4)), ("x = 5", Fraction(5)), (" -6 / -8 ", Fraction(3, 4)), (".5", Fraction(1, 2))])
def test_exact_numeric_formats(raw, expected):
    assert parse_answer(raw) == expected


@pytest.mark.parametrize("raw", ["", "1/0", "NaN", "Infinity", "<script>alert(1)</script>", "2+3", "__import__('os').system('echo unsafe')", "1e10", None, True, [5], "9" * 100])
def test_invalid_answers_rejected(raw):
    with pytest.raises(InputError):
        parse_answer(raw)


@pytest.mark.parametrize("qid", list(QUESTIONS))
def test_every_question_has_working_correction(qid):
    q = QUESTIONS[qid]
    assert len(q["hints"]) == 3
    assert all(q["hints"])
    assert assess_record(record(qid))["correct"] is True
    wrong = str(parse_answer(q["expected"]) + 1)
    assert assess_record(record(qid, wrong))["correct"] is False


def test_content_graph_and_lesson_coverage():
    assert CONCEPTS["N1"]["prerequisites"] == []
    assert CONCEPTS["N2"]["prerequisites"] == ["N1"]
    assert CONCEPTS["N3"]["prerequisites"] == ["N1"]
    assert CONCEPTS["N4"]["prerequisites"] == ["N1", "N2", "N3"]
    assert len(QUESTIONS) >= 12
    for concept in CONCEPTS.values():
        practice = QUESTIONS[concept["lesson"]["practice_id"]]
        assert practice["concept_id"] == concept["id"]
        assert len(concept["lesson"]["steps"]) == 3


def test_required_equation_division_path():
    history = [record("eq_001", "4")]
    assert next_question(history)["question_id"] == "op_sub_probe"
    history.append(record("op_sub_probe", "15"))
    assert next_question(history)["question_id"] == "op_div_probe"
    history.append(record("op_div_probe", "3"))
    assert recommend(history)["concept_id"] == "N1"
    assert "hipótese" in recommend(history)["reason"]
    assert summarize(history)["N1"]["status"] == "developing"


def test_wrong_subtraction_still_leads_to_division():
    history=[record("eq_001", "4"), record("op_sub_probe", "14")]
    assert next_question(history)["question_id"] == "op_div_probe"


def test_division_recommendation_survives_other_operations_and_reopens_after_new_error():
    history = [record("op_div_probe", "3"), record("op_001"), record("op_002"), record("op_003")]
    assert summarize(history)["N1"]["status"] == "mastered"
    assert "divisão" in recommend(history)["reason"]
    history += [record("op_re_001"), record("op_re_003")]
    assert "divisão" not in recommend(history)["reason"]
    history.append(record("op_div_probe", "3"))
    assert "divisão" in recommend(history)["reason"]


@pytest.mark.parametrize("wrong", [False, True])
def test_diagnostic_length_coverage_and_termination(wrong):
    history=[]
    for _ in range(11):
        following=next_question(history)
        if following["done"]:
            break
        qid=following["question_id"]
        assert qid not in {r["question_id"] for r in history}
        history.append(record(qid,"999" if wrong else None))
    assert following["done"]
    assert 5 <= len(history) <= 10
    assert {QUESTIONS[r["question_id"]]["concept_id"] for r in history} == set(CONCEPTS)


def test_single_error_never_confirms_gap():
    assert summarize([record("eq_001", "4")])["N4"]["status"] == "developing"
    assert summarize([record("eq_001", "4")])["N1"]["status"] == "unassessed"


def test_mastery_requires_three_distinct_questions_and_two_independent():
    records=[record("op_001"),record("op_002")]
    assert summarize(records)["N1"]["status"] == "developing"
    records.append(record("op_003", "999"))
    assert summarize(records)["N1"]["status"] == "mastered"
    assert summarize([record("op_001")]*3)["N1"]["status"] == "developing"


def test_hint_and_retry_never_produce_independent_evidence():
    records=[record("op_001",hints_used=1),record("op_002",first_answer="0",attempts=2),record("op_003")]
    summary=summarize(records)["N1"]
    assert summary["independent"] == 1
    assert summary["status"] == "developing"
    assert summary["first_correct"] == 2


def test_mastery_configuration_and_recent_window():
    records=[record("op_001", "0"),record("op_002", "0"),record("op_003"),record("op_004"),record("op_re_001")]
    assert summarize(records)["N1"]["status"] == "mastered"
    assert summarize(records,window=2,required=2)["N1"]["total"] == 2


def test_reassessment_is_equivalent_and_distinct():
    for concept in CONCEPTS:
        history=[]
        while True:
            following=next_question(history,"reassessment",concept)
            if following["done"]:
                break
            qid=following["question_id"]
            assert QUESTIONS[qid]["purpose"] == "reassessment"
            assert qid != CONCEPTS[concept]["lesson"]["practice_id"]
            history.append(record(qid))
        assert len(history) in (3,4)
        if concept != "N4":
            assert history[-1]["question_id"] == "eq_re_001"


def test_practice_complete_after_one_item():
    following=next_question([],"practice","N1")
    assert following["question_id"] == "op_practice"
    assert next_question([record("op_practice")],"practice","N1")["done"]


def test_api_content_no_premature_answers(client):
    response=client.get('/api/content')
    assert response.status_code == 200
    assert len(response.json["questions"]) == 34
    for q in response.json["questions"]:
        assert "expected" not in q and "hints" not in q and "explanation" not in q


def test_api_feedback_and_explicit_hints(client):
    response=client.post('/api/diagnose',json=record('eq_001','4'))
    assert response.status_code == 200
    assert not response.json['correct']
    assert response.json['explanation'] is None
    assert 'expected' not in response.json
    for level in (1,2,3):
        response=client.post('/api/hint',json={'question_id':'eq_001','level':level})
        assert response.json['text'] == QUESTIONS['eq_001']['hints'][level-1]


def test_personality_does_not_change_math(client):
    results=[client.post('/api/diagnose',json={**record('eq_001','5'),'personality':p}).json for p in ('patient','funny','direct')]
    assert all(r['correct'] and r['independent'] for r in results)
    assert len({r['feedback'] for r in results}) == 3


def test_payload_types_limits_and_consistency(client):
    for payload in ([],None,{'question_id':'missing','answer':'1'},record('op_001',attempts=True),record('op_001',hints_used=4),record('op_001',first_answer='0')):
        response=client.post('/api/diagnose',json=payload)
        assert response.status_code == 400
    assert client.post('/api/next',json={'records':[record('eq_001')]*2}).status_code == 400
    assert client.post('/api/report',json={'records':[record('op_001')]*501}).status_code == 400
    assert client.post('/api/diagnose',data='x'*270000,content_type='application/json').status_code == 413
    assert client.post('/api/diagnose',data='{"broken"',content_type='application/json').status_code == 400
    for invalid_concept in ([], {}, True, None):
        assert client.post('/api/next',json={'concept_id':invalid_concept}).status_code == 400


def test_headers_health_empty_report_and_no_sessions(client):
    assert client.get('/api/health').json['status'] == 'ok'
    response=client.get('/')
    assert response.status_code == 200
    assert response.headers['X-Content-Type-Options'] == 'nosniff'
    assert "script-src 'self'" in response.headers['Content-Security-Policy']
    assert 'Set-Cookie' not in response.headers
    report=client.post('/api/report',json={'records':[]}).json
    assert all(c['total']==0 and c['status']=='unassessed' for c in report['concepts'].values())
    assert client.get('/api/missing').status_code == 404
    assert client.get('/api/diagnose').status_code == 405


def test_full_diagnostic_lesson_reassessment_api(client):
    history=[]
    while True:
        following=client.post('/api/next',json={'records':history}).json
        if following['done']: break
        qid=following['question_id']
        response_record=record(qid,'4' if qid=='eq_001' else '3' if qid=='op_div_probe' else None)
        assert client.post('/api/diagnose',json=response_record).status_code == 200
        history.append(response_record)
    baseline=client.post('/api/report',json={'records':history}).json
    assert baseline['recommendation']['concept_id']=='N1'
    assert client.post('/api/diagnose',json=record('op_practice')).json['correct']
    reassessment=[]
    while True:
        following=client.post('/api/next',json={'records':reassessment,'mode':'reassessment','concept_id':'N1'}).json
        if following['done']: break
        reassessment.append(record(following['question_id']))
    result=client.post('/api/report',json={'records':history+[record('op_practice')]+reassessment}).json
    assert result['concepts']['N1']['status']=='mastered'
