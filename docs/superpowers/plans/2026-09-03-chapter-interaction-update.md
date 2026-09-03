# Chapter Interaction Update Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Remove robot-body chapter entry points, loop a matched original animation in every chapter, simplify the chapter and media cards, and publish the verified deployment as a new public GitHub repository.

**Architecture:** Keep the existing single-file application and embedded assets intact. Add one chapter-to-clip mapping and one detail-motion helper beside the existing animation helpers, remove only the hotspot/direct-pick entry behavior, and use a standard-library Python regression test plus live browser checks before publishing.

**Tech Stack:** Static HTML/CSS/JavaScript, Three.js r170, Python `unittest`, local HTTP server, Git, GitHub CLI.

---

### Task 1: Add regression checks for the requested behavior

**Files:**
- Create: `tests/test_chapter_interactions.py`
- Test: `tests/test_chapter_interactions.py`

- [ ] **Step 1: Write the failing tests**

Create tests that read `xianwai-chappie.html` and assert: no hotspot creation, no raycast-driven `select(...)`, no `panel-en` element or assignment, an exact eight-entry `chapterMotions` map, `THREE.LoopRepeat` with `Infinity`, a blank media overview title, and absence of the requested explanatory sentence.

- [ ] **Step 2: Run the tests and verify RED**

Run: `python3 -m unittest -v tests/test_chapter_interactions.py`

Expected: failures for the existing hotspot creation, direct canvas selection, English subtitle, missing chapter motion mapping, missing repeat loop, media title, and media note.

- [ ] **Step 3: Commit the failing tests**

Run: `git add tests/test_chapter_interactions.py && git commit -m "test: specify chapter interaction changes"`

### Task 2: Implement the minimal page changes

**Files:**
- Modify: `xianwai-chappie.html`
- Test: `tests/test_chapter_interactions.py`

- [ ] **Step 1: Remove model entry points**

Keep creation of the eight bottom buttons but remove creation of `.hotspot` buttons. Change the canvas accessibility text and help/toast instructions to direct users to the bottom chapter buttons. Preserve drag and pinch behavior while removing raycast hover and pointer-up chapter selection.

- [ ] **Step 2: Add chapter motion loops**

Add the approved mapping:

```javascript
const chapterMotions={face:'Waving',core:'Talking (2)',paths:'Pointing Forward',books:'Using A Fax Machine',limbs:'Arm Stretching',ideas:'Talking (1)',medal:'Standing Clap',seed:'Kneeling Pointing'};
```

Add `playChapterMotion(id)` using the existing `libraryActions`, cross-fade from idle, and configure the selected action with `setLoop(THREE.LoopRepeat,Infinity)`. Start it at the end of `select(index)` and restore the existing idle/automatic behavior from `closePanel()`.

- [ ] **Step 3: Simplify card text**

Remove `#panel-en` from the detail card and its assignment from `select(index)`. In the media overview page, use an empty title and remove only the `media-note` paragraph; keep summary, evidence, source links, upload, pagination, and export behavior.

- [ ] **Step 4: Run the tests and verify GREEN**

Run: `python3 -m unittest -v tests/test_chapter_interactions.py`

Expected: all tests pass.

- [ ] **Step 5: Commit the implementation**

Run: `git add xianwai-chappie.html && git commit -m "feat: refine chapter interactions"`

### Task 3: Verify the live page

**Files:**
- Verify: `xianwai-chappie.html`

- [ ] **Step 1: Serve the deployment over the LAN address**

Run the existing static server on port `4174`, bound to `0.0.0.0`, without changing deployment files.

- [ ] **Step 2: Verify desktop behavior**

Open the live page and verify there are eight bottom chapter buttons and zero `.hotspot` elements. For each chapter, verify the selected state, Chinese card content, absence of the English subtitle, and an active repeating mapped animation. Verify canvas click does not select a chapter and drag still rotates the model.

- [ ] **Step 3: Verify media behavior**

Open “作品与资料”; verify the dialog title is blank, the explanatory sentence is absent, and the upload button plus chapter summary/evidence remain.

- [ ] **Step 4: Verify responsive and console state**

Check a mobile-width viewport for usable bottom buttons and detail cards, then confirm no new browser console errors. Run `git diff --check` and the complete regression test again.

### Task 4: Publish the public GitHub repository

**Files:**
- Publish: complete `xianwai-chappie-deploy` repository

- [ ] **Step 1: Confirm clean local state and repository availability**

Run `git status --short --branch`, confirm `main` is clean, and confirm `a86657485/xianwai-chappie-deploy` still does not exist.

- [ ] **Step 2: Create and push the public repository**

Run: `gh repo create a86657485/xianwai-chappie-deploy --public --source=. --remote=origin --push`

Expected: the GitHub repository is created, `origin` is configured, and local `main` tracks `origin/main`.

- [ ] **Step 3: Verify remote visibility and commit parity**

Read the repository metadata and compare local `HEAD` with `origin/main`. Confirm visibility is `PUBLIC`, the default branch is `main`, and the remote commit equals the verified local commit.
