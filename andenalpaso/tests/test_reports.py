import tempfile
import unittest
from pathlib import Path
from community import reports, TTL


class Reports(unittest.TestCase):
    def test_independent_witnesses_and_expiry(self):
        with tempfile.TemporaryDirectory() as tmp:
            path=Path(tmp)/"reports.db"
            def vote(stamp, voter):
                return reports(path,"r","s",stamp,"Demora",voter)[0]["count"]
            self.assertEqual([vote(1,"a"),vote(2,"a"),vote(3,"b")],[1,1,2])
            self.assertEqual(reports(path,"r","other",4),[])
            self.assertEqual(reports(path,"other","s",4),[])
            self.assertEqual(reports(path,"r","s",TTL+1)[0]["count"],1)
            self.assertEqual(reports(path,"r","s",TTL+3),[])

    def test_validation_and_limit(self):
        with tempfile.TemporaryDirectory() as tmp:
            path=Path(tmp)/"reports.db"
            with self.assertRaises(ValueError):
                reports(path,"r","s",1,"Invalid","a")
            for i in range(12):
                reports(path,"r",str(i),1,"Demora","a")
            with self.assertRaises(OverflowError):
                reports(path,"r","new",2,"Demora","a")
            self.assertEqual(reports(path,"r","1",2,"Demora","a")[0]["count"],1)
