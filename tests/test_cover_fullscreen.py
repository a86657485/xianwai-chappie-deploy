import unittest
from pathlib import Path


ROOT = Path(__file__).resolve().parents[1]


class CoverFullscreenTests(unittest.TestCase):
    def test_cover_has_a_bottom_right_fullscreen_control(self):
        html = (ROOT / "index.html").read_text(encoding="utf-8")
        css = (ROOT / "cover.css").read_text(encoding="utf-8")
        js = (ROOT / "cover.js").read_text(encoding="utf-8")
        self.assertIn('id="cover-fullscreen"', html)
        self.assertIn("#cover-fullscreen{position:fixed;left:", css)
        self.assertIn("right:auto", css)
        self.assertIn("color:#fff", css)
        self.assertIn("border:1px solid #fff", css)
        self.assertIn("requestFullscreen", js)
        self.assertIn("cover-fullscreen", js)


if __name__ == "__main__":
    unittest.main()
