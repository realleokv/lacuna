"""Verifica integridade de todos os pacotes e a correção via rotas reais."""
from collections import Counter
import pytest
from app import create_app
from catalog import AREAS, QUESTIONS, matches, public
from diagnostic import InputError, parse_answer


def test_curriculum_contract():
    seen=set()
    def unique(identifier):
        assert identifier not in seen
        seen.add(identifier)
    assert len(AREAS)==10
    for area in AREAS:
        unique(area['id'])
        assert area['schema_version']==1 and len(area['tracks'])>=2
        for track in area['tracks']:
            unique(track['id'])
            assert len(track['lessons'])>=3
            prior=set()
            checks=0
            for lesson in track['lessons']:
                unique(lesson['id'])
                assert set(lesson['prerequisites'])<=prior
                prior.add(lesson['id'])
                assert lesson['objective'] and len(lesson['steps'])>=2 and lesson['example']
                assert lesson['mini']['solution'] in lesson['mini']['options']
                counts=Counter(q['role'] for q in lesson['questions'])
                assert counts['practice']>=3 and counts['review']>=2 and counts['diagnostic']>=1
                checks+=counts['checkpoint']
                for q in lesson['questions']:
                    unique(q['id'])
                    assert q['concept_id']==lesson['id'] and q['version']>=1
                    assert q['feedback'] and len(q['hints'])>=2 and q['source_or_author'] and q['accessibility']
                    assert 1<=q['difficulty']<=3 and len(set(q['options']))==len(q['options'])
            assert checks>=1
    assert len({q['prompt'] for q in QUESTIONS.values()})==len(QUESTIONS)


@pytest.mark.parametrize('qid',QUESTIONS)
def test_key_and_alternative(qid):
    q=QUESTIONS[qid]
    assert matches(q,q['validator'])
    if q['format']=='order':
        wrong=q['validator'][::-1]
    elif q['options']:
        wrong=next(o for o in q['options'] if o!=q['validator'])
    elif q['format']=='numeric':
        wrong=str(parse_answer(q['validator'])+1)
    else:
        wrong='resposta incompatível'
    assert not matches(q,wrong)


def test_http_contract():
    c=create_app({'TESTING': True}).test_client()
    catalog=c.get('/api/hub/catalog')
    assert catalog.status_code==200
    for field in ('"validator"','"hints"','"feedback"'):
        assert field not in catalog.get_data(as_text=True)
    for q in QUESTIONS.values():
        answer=c.post('/api/hub/check',json={'id':q['id'],'answer':q['validator']})
        assert answer.status_code==200 and answer.json=={'correct':True,'text':q['feedback']}
        assert c.post('/api/hub/hint',json={'id':q['id'],'level':2}).json['text']==q['hints'][1]
    for body in ([],{}, {'id':[]},{'id':'mat-grupos.1','answer':None}):
        assert c.post('/api/hub/check',json=body).status_code==400
    assert c.post('/api/hub/hint',json={'id':'mat-grupos.1','level':3}).status_code==400
    assert c.post('/api/hub/check',json={'id':'pt-paragrafo.1','answer':['x','x','x']}).status_code==400
    assert c.post('/api/hub/check',data='x'*265000,content_type='application/json').status_code==413
