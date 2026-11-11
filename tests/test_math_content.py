"""Independent arithmetic checks for the authored answer key."""
from fractions import Fraction as F
from diagnostic import QUESTIONS, parse_answer

def test_answer_key_against_independent_arithmetic():
    expected={
        'op_001':18+7,'op_002':6*4,'op_003':32-14,'op_004':24/6,
        'op_sub_probe':21-6,'op_div_probe':15/3,'op_practice':20/4,
        'op_re_001':18/3,'op_re_002':28-8,'op_re_003':35/5,
        'neg_001':-3+5,'neg_002':-4*3,'neg_003':-8+3,'neg_004':-12/-3,
        'neg_practice':-5+8,'neg_re_001':-7+10,'neg_re_002':-3*5,'neg_re_003':-20/-4,
        'frac_001':F(1,2)+F(1,4),'frac_002':F(2,6),'frac_003':F(5,6)-F(1,6),'frac_004':F(1,2)*10,
        'frac_practice':F(1,3)+F(1,6),'frac_re_001':F(1,2)+F(1,6),'frac_re_002':F(6,8),'frac_re_003':F(7,8)-F(3,8),
        'eq_001':(21-6)/3,'eq_002':(10+4)/2,'eq_003':(11-3)/-2,'eq_004':(4-1)*2,
        'eq_practice':(23-3)/4,'eq_re_001':(28-4)/4,'eq_re_002':(14-2)/-3,'eq_re_003':(5-2)*3,
    }
    assert set(expected)==set(QUESTIONS)
    for qid,answer in expected.items():
        assert parse_answer(QUESTIONS[qid]['expected'])==F(answer),qid
