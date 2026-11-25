import tempfile
import unittest
from pathlib import Path
from build_report import ROOT, build, load_indicators, survey_changes
from locality_view import load_localities, render
from trends import load_history, correlation

class ReportTests(unittest.TestCase):
    def test_verified_rows(self):
        rows = load_indicators(ROOT / "data" / "indicators.csv")
        self.assertEqual(len(rows), 9)
        self.assertEqual(len(survey_changes(rows)), 3)

    def test_points_not_relative_change(self):
        rows = load_indicators(ROOT / "data" / "indicators.csv")
        changes = {name: diff for name, _, _, diff in survey_changes(rows)}
        self.assertEqual(changes["Victimización"], -0.4)
        self.assertEqual(changes["Denuncia entre víctimas"], -6.4)

    def test_duplicate_rejected(self):
        original = (ROOT / "data" / "indicators.csv").read_text()
        with tempfile.TemporaryDirectory() as temp:
            path = Path(temp) / "duplicate.csv"
            path.write_text(original + original.splitlines()[1] + "\n")
            with self.assertRaises(ValueError):
                load_indicators(path)

    def test_locality_comparison(self):
        rows = load_localities()
        self.assertEqual(len(rows), 20)
        self.assertEqual(rows["USAQUEN"]["2025"], 63.6)
        self.assertIsNone(rows["SUMAPAZ"]["2025"])
        self.assertEqual(render().count("data-locality=\""), 20)

    def test_citywide_correlation(self):
        rows = load_history()
        self.assertEqual(len(rows), 11)
        self.assertAlmostEqual(correlation(rows), 0.52137516)

    def test_output_has_sources(self):
        report = build(load_indicators(ROOT / "data" / "indicators.csv"))
        self.assertIn("Sentinel Bogotá", report)
        self.assertIn("CCB", report)
        self.assertIn("SDSCJ", report)

if __name__ == "__main__":
    unittest.main()
