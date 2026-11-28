import unittest
from datetime import date,timedelta
from fractions import Fraction
from math import comb,log
from audit import summarize,chance,miloto,bogota,approximation
from evaluate import evaluate,parse


class Audit(unittest.TestCase):
    def test_three_outcomes(self):
        r=summarize({0:1,6:2,12:1},6)
        self.assertEqual(r["profit_probability"],.25)
        self.assertEqual(r["break_even_probability"],.5)
        self.assertEqual(r["mean_net"],0)

    def test_chance_equal_expected_payout(self):
        for digits in (1,2):
            r=chance(digits=digits,tax=Fraction(0))
            self.assertEqual(r["mean_payout"],500)
            self.assertAlmostEqual(r["profit_probability"],10**-digits)

    def test_miloto(self):
        m=miloto()
        self.assertEqual(m["outcomes"],comb(39,5))
        self.assertAlmostEqual(m["mean_payout"]-miloto(False)["mean_payout"],250000000/comb(39,5))
        self.assertAlmostEqual(m["profit_probability"],0.010040694251220566)

    def test_bogota(self):
        for policy in ("max","sum"):
            r=bogota(policy)
            self.assertEqual(r["outcomes"],4700000)
            self.assertAlmostEqual(sum(r[k] for k in ("profit_probability","break_even_probability","loss_probability")),1)
            self.assertAlmostEqual(r["mean_payout"]-bogota(policy,False)["mean_payout"],7968000000/(3*4700000))
        self.assertGreaterEqual(bogota("sum")["mean_payout"],bogota("max")["mean_payout"])

    def test_approximation(self):
        self.assertEqual(approximation("9925","9925",True,False),0)
        self.assertEqual(approximation("0005","9925",False,True),18000)
        self.assertEqual(approximation("9920","9925",False,True),54000)


class Validation(unittest.TestCase):
    def test_uniform_score(self):
        series=[(date(2000,1,1)+timedelta(days=i),i%10) for i in range(220)]
        r=evaluate(series)
        self.assertAlmostEqual(r["uniform"]["log_loss"],log(10))
        self.assertEqual(r["uniform"]["hits"],2)

    def test_conflicting_draw(self):
        with self.assertRaises(ValueError):
            parse(b'[{"fecha":"2007-01-05","n_mero":"001","sorteo":1},{"fecha":"2007-01-05","n_mero":"002","sorteo":1}]')
