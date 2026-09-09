# F5 Hiring Solutions LinkedIn Video Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Produce a reviewed, fast-paced 4:5 LinkedIn video from Steve's 86-second talking-head recording, with approved dialogue cuts, isolated-presenter compositing, transcript-synced dark graph-paper/liquid-glass motion graphics, captions, and cleaned audio.

**Architecture:** Preserve the recording as an immutable staged asset. Generate one canonical word-level transcript and derive every silence edit, approved mistake edit, caption, and motion anchor from versioned EDLs. Assemble the cut presenter footage, modular HyperFrames beat compositions, captions, logo, sound design, and deterministic GSAP timelines in one 1080×1350 composition, then verify the assembled artifact before rendering.

**Tech Stack:** HyperFrames CLI and HTML composition runtime, GSAP, Node.js 22+, FFmpeg/FFprobe, local Whisper via HyperFrames, JSON EDLs, CSS/SVG liquid-glass and graph-paper graphics.

**Spec:** `docs/superpowers/specs/2026-09-09-linkedin-video-edit-design.md`

## Global Constraints

- Preserve `C:\Users\User\Downloads\linkedin-video.mp4` unchanged.
- Keep every example and core lesson unless the user explicitly approves its removal.
- Present every proposed spoken-mistake cut with context before applying it.
- Render at 1080×1350 (4:5), H.264, with Steve isolated from the white source background.
- Rebuild the baked logo from an official brand asset; never redraw it from memory.
- Keep narration continuous beneath all full-screen graphic takeovers.
- Derive all visual, caption, and edit timing from the final retimed word transcript.
- Use deterministic, seek-safe motion; never use render-time clocks, unseeded randomness, or infinite animation.
- Do not add a music bed. Use only approved restrained transition/interface sound design.
- Do not render merely because checks pass; pause at the final HyperFrames preview for approval.
- Do not touch or stage unrelated existing changes in the `f5pulse` worktree.

---

### Task 1: Scaffold the Isolated Video Project and Lock the Brief

**Files:**
- Create: `video-projects/f5-linkedin-hiring/BRIEF.md`
- Create: `video-projects/f5-linkedin-hiring/frame.md`
- Create: `video-projects/f5-linkedin-hiring/assets/source/linkedin-video.mp4`
- Modify: `video-projects/f5-linkedin-hiring/hyperframes.json`

**Interfaces:**
- Consumes: approved design spec and immutable source recording.
- Produces: reproducible HyperFrames project with `workflow: general-video`, `flow: automation`, `storyboard: no`, 1080×1350 canvas, and a local staged source path.

- [ ] **Step 1: Verify Node 22+, available disk, source checksum, and FFmpeg availability**

  Run PowerShell commands that print `node --version`, remaining bytes on the destination drive, `Get-FileHash -Algorithm SHA256` for the source, and `Get-Command ffmpeg,ffprobe`. If FFmpeg is missing, install the Windows Gyan shared build with `winget install --id Gyan.FFmpeg.Shared --exact --accept-package-agreements --accept-source-agreements`, then open a fresh shell and re-run the probes.

- [ ] **Step 2: Install/refresh the owning workflow and scaffold a blank project**

  Run from `C:\Users\User\f5pulse`:

  ```powershell
  npx hyperframes skills update general-video
  npx hyperframes init video-projects/f5-linkedin-hiring --non-interactive --example blank --resolution square --skip-transcribe
  ```

  Change the generated composition dimensions from 1080×1080 to exactly 1080×1350 in `hyperframes.json` before authoring content.

- [ ] **Step 3: Stage the source without modifying it**

  Create `assets/source`, copy the MP4 to `assets/source/linkedin-video.mp4`, and verify that the staged SHA-256 equals the source SHA-256.

- [ ] **Step 4: Write the canonical brief and visual tokens**

  `BRIEF.md` frontmatter must contain:

  ```yaml
  ---
  workflow: general-video
  flow: automation
  storyboard: no
  message: "F5 provides affordable, pre-screened, skills-tested, fully dedicated employees without recruiting, office, or termination fees."
  destination: linkedin-feed
  aspect: "4:5"
  language: en
  audience: "business owners and hiring leaders seeking dedicated remote employees"
  length: "approximately 86 seconds before editorial tightening"
  ---
  ```

  `frame.md` must define near-black `#080B10`, grid `#17202B`, off-white `#EAF0F6`, glass blue `#72B7FF`, and restrained F5 red `#E21C2A`; serious sans typography; 22/30/42/60/84 px type scale; 10/22/40 px radii; and 1.5/2.5/4/7 px strokes.

- [ ] **Step 5: Verify scaffold integrity and commit only project setup files**

  Run `npx hyperframes lint`, verify there are no structural errors, stage only `video-projects/f5-linkedin-hiring`, and commit with `chore(video): scaffold F5 LinkedIn edit`.

### Task 2: Probe the Footage and Create the Canonical Word Transcript

**Files:**
- Create: `video-projects/f5-linkedin-hiring/assets/analysis/source-probe.json`
- Create: `video-projects/f5-linkedin-hiring/assets/analysis/source-contact-sheet.png`
- Create: `video-projects/f5-linkedin-hiring/assets/transcripts/source.words.json`
- Create: `video-projects/f5-linkedin-hiring/assets/transcripts/source-transcript-review.md`

**Interfaces:**
- Consumes: `assets/source/linkedin-video.mp4`.
- Produces: verified stream metadata, representative visual evidence, and `Array<{id:string,text:string,start:number,end:number}>` for all downstream edit and beat tooling.

- [ ] **Step 1: Probe streams and generate a representative contact sheet**

  Save `ffprobe -v error -show_format -show_streams -of json` output to `source-probe.json`. Extract frames at 0, 14, 28, 42, 56, 70, and 84 seconds and tile them into one 4×2 contact sheet. Confirm resolution, frame rate, audio sample rate, and actual duration from the probe rather than Windows metadata.

- [ ] **Step 2: Transcribe locally with an explicit English model**

  Run from the video project:

  ```powershell
  npx hyperframes transcribe assets/source/linkedin-video.mp4 --model small.en
  ```

  Normalize the CLI output to `assets/transcripts/source.words.json` as a flat array with stable `w0`, `w1`, … identifiers.

- [ ] **Step 3: Compare ASR text against the supplied transcript**

  Write `source-transcript-review.md` with every mismatch that changes meaning, names, numbers, or punctuation. Correct text only after listening to the corresponding audio; never shift word start/end values merely to match the supplied prose.

- [ ] **Step 4: Validate transcript invariants**

  Add a Node check that fails if word IDs repeat, timestamps regress, any end is not greater than its start, `$350` is absent, or the last word extends beyond the probed duration. Run it and record a passing result in the review file.

- [ ] **Step 5: Commit the analysis and canonical transcript**

  Commit only the new analysis/transcript artifacts with `feat(video): add verified source transcript`.

### Task 3: Plan and Render the Silence-Only Pass

**Files:**
- Create: `video-projects/f5-linkedin-hiring/assets/edl/source.silence-edl.json`
- Create: `video-projects/f5-linkedin-hiring/assets/edl/source.silence-decisions.md`
- Create: `video-projects/f5-linkedin-hiring/assets/transcripts/source.silence-transcript.json`
- Create: `video-projects/f5-linkedin-hiring/assets/edits/edited-silenced.mp4`

**Interfaces:**
- Consumes: canonical word transcript and staged source video.
- Produces: silence-only EDL, retimed transcript, and matching video for mistake detection.

- [ ] **Step 1: Run the silence cutter in plan mode**

  Invoke `C:\Users\User\.codex\skills\hyperframe_nate\skills\cut-silences\scripts\cut-silences.mjs` with `--gap 0.55`, `--head-pad 0.22`, and `--tail-pad 0.34`, without `--apply`.

- [ ] **Step 2: Audit sentence-boundary air**

  Calculate the median original sentence-boundary gap and flag planned output gaps below one tenth of that median. Adjust only silence ranges so each boundary retains at least 4–8 frames of natural room tone; do not trim spoken envelopes.

- [ ] **Step 3: Render the silence-only video**

  Re-run the cutter with `--apply --output assets/edits/edited-silenced.mp4` and verify A/V duration agreement within one video frame.

- [ ] **Step 4: Listen and inspect every silence seam**

  Extract 1.5-second audio/video windows around every join. Reject any audible decay cliff, digital-zero hole, lip jump during a held syllable, or sentence boundary below the retained-air rule.

- [ ] **Step 5: Commit the deterministic silence pass**

  Commit the EDL, decisions, retimed transcript, and derived video with `feat(video): create silence-only edit`.

### Task 4: Detect and Present Spoken-Mistake Candidates

**Files:**
- Create: `video-projects/f5-linkedin-hiring/assets/edl/source.silence-transcript.cut-candidates.json`
- Create: `video-projects/f5-linkedin-hiring/assets/edl/source.silence-transcript.cut-candidates.md`
- Create after review: `video-projects/f5-linkedin-hiring/assets/edl/approved-cuts.json`

**Interfaces:**
- Consumes: silence-retimed transcript and silence-only video.
- Produces: a user-reviewed list of `{start:number,end:number,reason:string}` cuts; no edited-clean video until approval.

- [ ] **Step 1: Run the mechanical candidate finder**

  Invoke `C:\Users\User\.codex\skills\hyperframe_nate\skills\cut-mistakes\scripts\find-cut-candidates.mjs` against `source.silence-transcript.json` and write results under `assets/edl`.

- [ ] **Step 2: Review each candidate editorially**

  For every candidate, listen from two seconds before through two seconds after. Mark emphatic repetition, rhetorical doubling, or list cadence as `KEEP`; recommend `CUT` only for a stutter, abandoned phrase, duplicated take, or factual restart.

- [ ] **Step 3: Present the proposed cuts and pause**

  Show a numbered table containing silence-retimed timestamps, removed text, retained context, recommendation, reason, and milliseconds saved. Explicitly state that none have been applied. Wait for item-by-item or blanket user approval.

- [ ] **Step 4: Record exactly the approved decisions**

  Write `approved-cuts.json` in this shape, using only approved ranges:

  ```json
  { "cuts": [{ "start": 12.41, "end": 12.78, "reason": "approved false start" }] }
  ```

  An empty array is valid when the delivery contains no true mistakes.

- [ ] **Step 5: Commit the review record**

  Commit candidates and approved decisions with `docs(video): record approved dialogue cuts`.

### Task 5: Apply Approved Cuts and Produce the Clean Audio Master

**Files:**
- Create: `video-projects/f5-linkedin-hiring/assets/edits/edited-clean.mp4`
- Create: `video-projects/f5-linkedin-hiring/assets/transcripts/final.words.json`
- Create: `video-projects/f5-linkedin-hiring/assets/edl/final.mistakes-edl.json`
- Create: `video-projects/f5-linkedin-hiring/assets/audio/voice-clean.wav`
- Create: `video-projects/f5-linkedin-hiring/assets/audio/loudness-report.json`

**Interfaces:**
- Consumes: approved cuts, silence-retimed transcript/video.
- Produces: locked picture/audio timing and the only transcript allowed to drive captions or graphics.

- [ ] **Step 1: Apply only approved dialogue cuts**

  Run `apply-cuts.mjs` from the cut-mistakes skill with `--apply`, `edited-silenced.mp4` as input, and `edited-clean.mp4` as output. Copy its retimed word array to `final.words.json` without changing timestamps.

- [ ] **Step 2: Clean the voice conservatively**

  Extract 48 kHz PCM, apply high-pass cleanup, measured broadband denoise, light compression, and de-essing only when sibilance inspection justifies it. Use short equal-power transitions and real room-tone donors at edits; do not insert digital silence.

- [ ] **Step 3: Normalize through measured two-pass loudnorm**

  Measure and apply `I=-14`, `TP=-1.5`, `LRA=11`, saving the measured values and final results to `loudness-report.json`.

- [ ] **Step 4: Verify the clean master**

  Require fresh ASR text to preserve every expected word, A/V length agreement within one frame, no internal digital-zero spans, no clipped samples, and no audible envelope cliffs at edit edges.

- [ ] **Step 5: Commit the locked editorial master**

  Commit with `feat(video): lock approved editorial master`.

### Task 6: Build and Validate the Presenter Matte, Reframe, and Logo

**Files:**
- Create: `video-projects/f5-linkedin-hiring/assets/derived/steve-keyed.webm`
- Create: `video-projects/f5-linkedin-hiring/assets/brand/f5-logo.svg`
- Create: `video-projects/f5-linkedin-hiring/assets/analysis/matte-contact-sheet.png`
- Create: `video-projects/f5-linkedin-hiring/assets/analysis/matte-settings.json`

**Interfaces:**
- Consumes: locked editorial master and an official F5 logo asset.
- Produces: alpha-bearing isolated presenter, verified edge settings, and reusable clean logo.

- [ ] **Step 1: Resolve an official logo asset**

  Use media-use logo resolution for F5 or an official F5 source. Save provenance in the project media ledger. Reject unofficial recreations, screenshots, or manually traced marks.

- [ ] **Step 2: Generate three deterministic white-key tests**

  Test conservative, balanced, and aggressive FFmpeg `colorkey` settings on representative hair, hand, shirt, and logo-adjacent frames. Composite each test against the final graph-paper background.

- [ ] **Step 3: Select and encode the alpha matte**

  Choose the lowest similarity/blend values that fully remove white without eroding Steve. Encode an alpha-capable VP9 WebM, store the exact filter parameters in `matte-settings.json`, and ensure the baked logo does not survive the matte.

- [ ] **Step 4: Verify placement and movement limits**

  On a 1080×1350 contact sheet, confirm Steve is right of center, face and hands remain inside safe areas, left/lower-left callout space is clear, and the maximum scale drift is no more than 5%.

- [ ] **Step 5: Commit matte, logo, settings, and evidence**

  Commit with `feat(video): isolate presenter and stage brand mark`.

### Task 7: Encode the Beat Sheet and Timing Validators

**Files:**
- Create: `video-projects/f5-linkedin-hiring/beat-sheet.json`
- Create: `video-projects/f5-linkedin-hiring/scripts/build-beats.mjs`
- Create: `video-projects/f5-linkedin-hiring/scripts/validate-beat-sync.mjs`
- Create: `video-projects/f5-linkedin-hiring/scripts/validate-beat-sync.test.mjs`

**Interfaces:**
- Consumes: `final.words.json` and the twelve beats in the design spec.
- Produces: `Beat {id,label,anchor,start,end,kind,track}` entries and generated timing mounts used by the composition.

- [ ] **Step 1: Write failing validator tests**

  Test that an unknown anchor phrase fails, a beat starting more than 0.25 seconds before its first anchor fails, overlapping beats on one track fail, and a valid anchored schedule passes.

- [ ] **Step 2: Run tests and confirm the intended failures**

  Run `node --test scripts/validate-beat-sync.test.mjs`; expect failures because the validator has not been implemented.

- [ ] **Step 3: Implement exact phrase anchoring and overlap checks**

  Implement normalized contiguous-word phrase matching, set each entrance to `max(0, anchorStart - lead)` with `lead` constrained to 0.15–0.25 seconds, and reject same-track interval intersections.

- [ ] **Step 4: Encode all twelve narration beats**

  Add identity, dedicated employee, pre-screen, interview, skills test, locations, payment, direct communication, Friday report, pricing, no-fees, and CTA beats with exact final-transcript anchor phrases.

- [ ] **Step 5: Run tests and validate the real beat sheet**

  Require all unit tests and `node scripts/validate-beat-sync.mjs beat-sheet.json assets/transcripts/final.words.json` to pass.

- [ ] **Step 6: Commit timing infrastructure**

  Commit with `feat(video): add transcript-anchored beat schedule`.

### Task 8: Author the Modular HyperFrames Composition

**Files:**
- Create: `video-projects/f5-linkedin-hiring/styles/tokens.css`
- Create: `video-projects/f5-linkedin-hiring/compositions/shared/background.html`
- Create: `video-projects/f5-linkedin-hiring/compositions/beats/01-identity.html` through `12-cta.html`
- Modify: `video-projects/f5-linkedin-hiring/index.html`

**Interfaces:**
- Consumes: keyed presenter, clean voice master, logo, `beat-sheet.json`, and generated timing mounts.
- Produces: one seek-safe assembled composition with unique IDs and one paused GSAP timeline per composition.

- [ ] **Step 1: Build the shared graph-paper and glass primitives**

  Implement the approved global tokens, low-contrast grid, restrained blue/red accents, glass highlight/refraction layers, and full-bleed opaque takeover background. Preserve transparency outside overlay cards.

- [ ] **Step 2: Prove one complete section**

  Build the skills-test beat end to end: candidate card travels through a task gate, progress fills, and a verified state lands. Use only GSAP transform aliases, synchronous paused timelines, and no opacity cross-fade for full-screen layers.

- [ ] **Step 3: Lint and inspect the proof section**

  Run HyperFrames lint, snapshot the section midpoint and entrance/exit, and inspect legibility, edge matte, signal-to-decoration ratio, and contiguous motion frames. Fix the shared system rather than adding section-specific exceptions.

- [ ] **Step 4: Build the remaining eleven beats**

  Use the beat sheet as the sole timing source. Keep approximately 40–50% presenter presence; show process and pricing as opaque takeovers while the clean narration continues.

- [ ] **Step 5: Assemble presenter movement and scene mounts**

  Mount the presenter as a direct media child, apply a continuous 3–5% seek-safe scale drift, and hide any positional reset beneath opaque takeovers. Ensure host IDs, inner composition IDs, and `window.__timelines` keys match exactly.

- [ ] **Step 6: Run structural and visual checks**

  Run `npx hyperframes lint`, midpoint snapshots for every sub-composition, token checks, cross-fade checks, gap checks, and the transcript-sync validator.

- [ ] **Step 7: Commit the assembled visual system**

  Commit with `feat(video): build premium transcript-synced composition`.

### Task 9: Add Captions and Approved Sound Design

**Files:**
- Create: `video-projects/f5-linkedin-hiring/compositions/captions.html`
- Create: `video-projects/f5-linkedin-hiring/assets/audio/sfx/`
- Create: `video-projects/f5-linkedin-hiring/audio-meta.json`
- Modify: `video-projects/f5-linkedin-hiring/index.html`

**Interfaces:**
- Consumes: `final.words.json`, clean voice master, assembled beat schedule.
- Produces: phrase captions and restrained local SFX with deterministic timing; no music.

- [ ] **Step 1: Generate phrase captions from the final transcript**

  Group words into at most two short lines, preserve stable word IDs, and prevent caption windows from extending across editorial joins.

- [ ] **Step 2: Resolve only the approved interface/transition sounds**

  Use local or free authenticated media-use resolution for a soft glass rise, verification tick, connection draw, price hit, and CTA settle. Localize every selected file and record provenance.

- [ ] **Step 3: Time SFX and caption emphasis to spoken anchors**

  Keep SFX below speech, avoid sounds on every beat, and reserve the strongest accent for `$350/week` and the final CTA.

- [ ] **Step 4: Verify speech intelligibility and safe placement**

  Check captions against Steve’s face/hands and glass cards; measure final voice dominance and ensure no SFX causes true peaks above -1.5 dBTP.

- [ ] **Step 5: Commit captions and sound design**

  Commit with `feat(video): add captions and restrained sound design`.

### Task 10: Validate, Preview, Render, and Review the Draft

**Files:**
- Create: `video-projects/f5-linkedin-hiring/VERIFY.md`
- Create after final-preview approval: `video-projects/f5-linkedin-hiring/renders/f5-hiring-linkedin-reviewed-draft.mp4`
- Create: `video-projects/f5-linkedin-hiring/review/transition-strips/`
- Create: `video-projects/f5-linkedin-hiring/review/final-contact-sheet.png`

**Interfaces:**
- Consumes: complete assembled composition.
- Produces: approved preview, reviewed H.264 draft, and evidence-backed verification report.

- [ ] **Step 1: Run the complete static/runtime gate**

  Run `npx hyperframes check --snapshots` with one `HYPERFRAMES_RUN_ID`. Require zero blocking findings across lint, runtime, layout, motion, and contrast.

- [ ] **Step 2: Run project-specific gates**

  Require beat sync, token consistency, no full-screen opacity cross-fades, no black/dead frames, speaker-presence report, caption-safe-area checks, logo provenance, and audio loudness checks to pass.

- [ ] **Step 3: Open the final HyperFrames Studio preview and pause**

  Run `npx hyperframes preview`. Ask the user to review the final assembled timeline and approve rendering. Do not render before that approval.

- [ ] **Step 4: Render the high-quality reviewed draft after approval**

  Run with one worker:

  ```powershell
  npx hyperframes render --quality high --workers 1 --output renders/f5-hiring-linkedin-reviewed-draft.mp4
  ```

- [ ] **Step 5: Inspect the actual encoded artifact**

  Verify duration and streams with FFprobe; create a full-video contact sheet; tile contiguous frames across every takeover, reframe, zoom, and section seam; listen to every cut and to the full mix; confirm no black frames, matte chatter, logo collision, caption collision, frozen motion, or A/V drift.

- [ ] **Step 6: Write `VERIFY.md` and fix any discovered defect**

  Record commands, results, human visual/audio checks, source and output hashes, and any remaining limitations. If a fix changes timing, rederive every later anchor from the canonical EDL and rerun all gates.

- [ ] **Step 7: Commit the reviewed draft and verification evidence**

  Commit only video-project deliverables with `feat(video): deliver reviewed F5 LinkedIn draft`.
