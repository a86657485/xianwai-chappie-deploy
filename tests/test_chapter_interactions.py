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
            "paths:'Pointing Forward',books:'Idle',"
            "limbs:'Kneeling Pointing',ideas:'Talking (1)',"
            "medal:'Salute',seed:'Using A Fax Machine'};"
        )
        self.assertIn(expected_mapping, self.html)
        looping_motion = re.search(
            r"function playLoopingMotion\(name\).*?\n}", self.html, re.DOTALL
        )
        self.assertIsNotNone(looping_motion)
        self.assertIn("setLoop(THREE.LoopRepeat,Infinity)", looping_motion.group(0))
        select_function = re.search(
            r"function select\(index\).*?\nfunction closePanel", self.html, re.DOTALL
        )
        self.assertIsNotNone(select_function)
        self.assertIn("playChapterMotion(c.id)", select_function.group(0))
        self.assertIn("playLoopingMotion('Arm Stretching')", self.html)
        self.assertIn(
            "const poseGround=Math.min(...['LeftFoot','RightFoot','LeftLeg','RightLeg'].map(n=>boneLocal(n).y));",
            self.html,
        )
        self.assertIn("robot.position.y=restGround-poseGround;", self.html)

    def test_detail_card_omits_only_the_english_subtitle(self):
        self.assertNotIn('id="panel-en"', self.html)
        self.assertNotIn("$('#panel-en').textContent", self.html)
        self.assertIn("AI 智慧脑", self.html)
        self.assertIn("核心 CPU", self.html)

    def test_media_gallery_is_icon_only_and_has_direct_add_delete_controls(self):
        self.assertIn('class="album-icon"', self.html)
        self.assertIn('aria-label="打开作品相册"', self.html)
        self.assertIn('id="modal-upload" hidden aria-label="添加图片或视频">＋</button>', self.html)
        self.assertIn('id="modal-delete" hidden aria-label="删除当前图片或视频">−</button>', self.html)
        self.assertIn("function deleteCurrentMedia()", self.html)
        self.assertIn("list.splice(modalPage,1)", self.html)
        self.assertNotIn("for(const text of [c.summary,c.evidence])", self.html)
        self.assertNotIn("添加自己的图片或视频", self.html)

    def test_requested_visuals_use_the_new_material_language(self):
        self.assertIn("background:linear-gradient(125deg,#1526307a,#0b171f4d)", self.html)
        self.assertIn("const obsidianSeedMaterial=new THREE.MeshPhysicalMaterial", self.html)
        self.assertIn("brain.userData.visualStyle='neural-orbit'", self.html)
        self.assertIn("const medalGoldMaterial=new THREE.MeshPhysicalMaterial", self.html)
        self.assertNotIn("QUALITY · TOGETHER", self.html)

    def test_latest_visual_and_layout_requests_are_wired(self):
        expected_mapping = (
            "const chapterMotions={face:'Waving',core:'Talking (2)',"
            "paths:'Pointing Forward',books:'Idle',"
            "limbs:'Kneeling Pointing',ideas:'Talking (1)',"
            "medal:'Salute',seed:'Using A Fax Machine'};"
        )
        self.assertIn(expected_mapping, self.html)
        self.assertIn("books:2.75", self.html)
        self.assertNotIn("serialBadge", self.html)
        self.assertNotIn("['26']", self.html)
        self.assertIn("core.userData.visualStyle='machined-ai-chip'", self.html)
        self.assertIn("if(bones.RightToeBase)bones.RightToeBase.scale.setScalar(.78);", self.html)
        self.assertIn("nav#chapters{display:flex;align-items:center;justify-content:flex-start;", self.html)
        self.assertIn("right:230px;bottom:0", self.html)
        self.assertIn(".footer-note{position:absolute;right:0;bottom:0", self.html)
        self.assertIn("id=\"site-links\"", self.html)
        self.assertIn("function openOfficialSite(label,url)", self.html)
        self.assertIn("https://www.moe.gov.cn/srcsite/A16/s3342/202604/t20260410_1433240.html", self.html)

    def test_textbook_props_are_visible_only_in_the_books_chapter(self):
        visibility_rule = "prop.object.visible=selected==='books';"
        if visibility_rule not in self.html:
            self.fail("the textbook props are not restricted to the 方子 chapter")

    def test_shared_media_uses_the_local_server_api(self):
        self.assertIn("async function loadServerMedia()", self.html)
        self.assertIn("fetch('/api/media',{cache:'no-store'})", self.html)
        self.assertIn("fetch(`/api/media/${id}`", self.html)
        self.assertIn("method:'DELETE'", self.html)

    def test_latest_brand_road_and_paths_edits_are_present(self):
        self.assertIn('class="brand-emblem" src="assets/school-emblem.png"', self.html)
        self.assertNotIn('<span class="brand-icon">X</span>', self.html)
        self.assertIn("background:transparent;border:0;color:transparent", self.html)
        self.assertIn("[x,.015,.55]", self.html)
        self.assertNotIn("真实项目融合", self.html)

    def test_core_uses_larger_ai_label_and_seed_hides_medal(self):
        self.assertIn("textPlane(core,['AI'],.18,.14", self.html)
        self.assertIn("medal.visible=(end&&selected!=='seed')||selected==='medal';", self.html)

    def test_brand_uses_full_school_name_and_arrival_subtitle_is_removed(self):
        self.assertIn('<span>贤义外国语学校<span class="brand-sub">', self.html)
        self.assertNotIn("showToast('抵达的是共同愿景", self.html)
        self.assertNotIn("showToast('抵达共同愿景", self.html)

    def test_overview_removes_the_red_circled_intro_controls(self):
        self.assertNotIn("GROW WITH INTELLIGENCE", self.html)
        self.assertNotIn('id="begin"', self.html)
        self.assertNotIn('class="hero-index"', self.html)
        self.assertIn("margin:0 0 32px", self.html)


if __name__ == "__main__":
    unittest.main()
