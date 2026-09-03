import re
import unittest
from pathlib import Path


HTML_PATH = Path(__file__).resolve().parents[1] / "xianwai-chappie.html"


class ChapterInteractionTests(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        cls.html = HTML_PATH.read_text(encoding="utf-8")

    def test_robot_has_no_visible_or_direct_chapter_entry_points(self):
        self.assertNotIn("const hotspot=document.createElement('button')", self.html)
        pointer_up = re.search(
            r"canvas\.addEventListener\('pointerup'.*?canvas\.addEventListener\('pointercancel'",
            self.html,
            re.DOTALL,
        )
        self.assertIsNotNone(pointer_up)
        self.assertNotIn("select(", pointer_up.group(0))
        self.assertIn("通过下方章节按钮进行探索", self.html)

    def test_each_chapter_uses_the_approved_repeating_motion(self):
        expected_mapping = (
            "const chapterMotions={face:'Waving',core:'Talking (2)',"
            "paths:'Pointing Forward',books:'Using A Fax Machine',"
            "limbs:'Arm Stretching',ideas:'Talking (1)',"
            "medal:'Standing Clap',seed:'Kneeling Pointing'};"
        )
        self.assertIn(expected_mapping, self.html)
        detail_motion = re.search(
            r"function playChapterMotion\(id\).*?\n}", self.html, re.DOTALL
        )
        self.assertIsNotNone(detail_motion)
        self.assertIn("setLoop(THREE.LoopRepeat,Infinity)", detail_motion.group(0))
        select_function = re.search(
            r"function select\(index\).*?\nfunction closePanel", self.html, re.DOTALL
        )
        self.assertIsNotNone(select_function)
        self.assertIn("playChapterMotion(c.id)", select_function.group(0))

    def test_detail_card_omits_only_the_english_subtitle(self):
        self.assertNotIn('id="panel-en"', self.html)
        self.assertNotIn("$('#panel-en').textContent", self.html)
        self.assertIn("AI 智慧脑", self.html)
        self.assertIn("核心 CPU", self.html)

    def test_media_overview_has_no_title_or_add_your_own_note(self):
        self.assertNotIn("c.word+' · 资料与作品'", self.html)
        self.assertNotIn("添加自己的图片或视频", self.html)
        self.assertRegex(self.html, r"const pages=\[\{title:'',render\(body\)")
        self.assertIn('id="modal-upload"', self.html)
        self.assertIn("for(const text of [c.summary,c.evidence])", self.html)

    def test_textbook_props_are_visible_only_in_the_books_chapter(self):
        visibility_rule = "prop.object.visible=selected==='books';"
        if visibility_rule not in self.html:
            self.fail("the textbook props are not restricted to the 方子 chapter")


if __name__ == "__main__":
    unittest.main()
