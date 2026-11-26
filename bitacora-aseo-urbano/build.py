"""Build the offline application with the Python standard library."""
from pathlib import Path

root = Path(__file__).resolve().parent
html = (root / "src/page.html").read_text(encoding="utf-8")
for marker, path in [("MODEL", "src/model.js"), ("DEMO", "examples/demo.json"), ("UI", "src/ui.js")]:
    html = html.replace(f"/*{marker}*/", (root / path).read_text(encoding="utf-8"))
(root / "index.html").write_text(html, encoding="utf-8")
