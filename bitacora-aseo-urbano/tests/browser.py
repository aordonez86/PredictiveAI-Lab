"""Run with python -m pip install playwright and a Chromium installation."""
import os
from pathlib import Path
from playwright.sync_api import sync_playwright, expect

root = Path(__file__).resolve().parents[1]
with sync_playwright() as p:
    browser = p.chromium.launch(executable_path=os.getenv("CHROMIUM_PATH"))
    page = browser.new_page(viewport={"width": 390, "height": 844}, offline=True)
    errors = []
    page.on("pageerror", lambda error: errors.append(str(error)))
    page.goto((root / "index.html").as_uri())
    expect(page.locator("#summary")).to_contain_text("4 puntos")
    expect(page.locator("#bounds")).to_contain_text("25 % a 75 %")
    page.locator("#point").select_option("DEMO-03")
    expect(page.locator("#verdict")).to_contain_text("interrumpido")
    page.locator("#trip").fill("60000")
    expect(page.locator("#result")).to_contain_text("4 despachos")
    page.locator("#trip").fill("")
    expect(page.locator("#result")).to_contain_text("Ingrese costos")
    page.locator("summary").click()
    page.locator("#editor").fill("{")
    page.locator("#apply").click()
    expect(page.locator("#error")).to_contain_text("anterior")
    page.locator("#file").set_input_files(root / "examples/demo.json")
    expect(page.locator("#error")).to_have_text("Bitácora aplicada.")
    page.locator("#editor").fill('{"version":1,"origen":"operativo","corte":"2026-11-21T00:00:00Z","casos":[]}')
    page.locator("#apply").click()
    expect(page.locator("#origin")).to_contain_text("declarado")
    expect(page.locator("#verdict")).to_have_text("Sin episodios.")
    page.locator("#reset").click()
    expect(page.locator("#origin")).to_contain_text("sintéticos")
    assert page.evaluate("document.documentElement.scrollWidth <= innerWidth")
    assert not errors, errors
    browser.close()
print("Offline Chromium walkthrough passed.")
