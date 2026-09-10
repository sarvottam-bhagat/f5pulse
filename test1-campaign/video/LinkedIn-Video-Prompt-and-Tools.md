# F5 Hiring Solutions Videos — Prompts and Tools Used

## Video 1 — Reviewed talking-head edit with motion graphics and SFX

**Final video:** `linkedin-video-reviewed-draft-all-animation-sfx.mp4`  
**Source:** Steve’s original single-take recording  
**Final format:** 1080 × 1350 (4:5), H.264 video, AAC 48 kHz stereo audio  
**Final duration:** 79.27 seconds

### Production prompt used

Edit the supplied Steve talking-head recording into a fast, premium LinkedIn explainer for F5 Hiring Solutions. Preserve every example and core lesson while removing unnecessary dead air and only the reviewed spoken mistakes. Keep Steve’s original voice and natural delivery.

Remove the flat white source background and isolate Steve with a clean edge matte. Recompose him right of centre in a 1080 × 1350 LinkedIn feed frame, leaving usable space for transcript-synchronised callouts. Exclude the baked-in source logo and use the official clean F5 Hiring Solutions logo as a restrained corner bug and closing brand mark. Add a subtle continuous 3–5% manufactured camera push so the static source feels more deliberate.

Build a near-black technical graph-paper environment using background #080B10, grid #17202B, off-white #EAF0F6, glass blue #72B7FF and restrained F5 red #E21C2A. Use Montserrat for bold headlines and IBM Plex Mono for labels, numbers and metadata. Use occasional liquid-glass cards, precise line-draw connections and opaque full-frame takeovers. Avoid generic office footage, stock imagery, random floating decoration, cyan-purple gradients, bouncy animation and full-screen cross-fades.

Synchronise every caption, card, line, counter and transition to the final word-level transcript. Begin visual entrances approximately 0.15–0.25 seconds before their spoken anchors. Keep narration playing continuously beneath every graphic takeover. Use hard cuts or directional opaque wipes at sentence boundaries. Add a seek-safe continuous presenter scale drift from 1.00 to approximately 1.045.

Structure the story into these twelve beats:

1. Introduce Steve and F5 Hiring Solutions with a compact glass credential.
2. Show one candidate locking into one dedicated client-team slot.
3. Show the candidate receiving pre-screening checks.
4. Connect client and candidate through an interview/calendar beat.
5. Pass role-specific and general tasks through a visible quality gate.
6. Connect New York with two F5 office locations in India.
7. Draw the payment relationship: YOU → F5 → EMPLOYEE.
8. Brighten the direct client-to-employee communication line while F5 recedes into administrative support.
9. Fill a Friday report with completed-work, progress and next-action rows.
10. Give “$350 / WEEK” the strongest full-screen numeric treatment.
11. Resolve recruiting, office and termination fees to $0 in sequence.
12. Return to Steve and finish with the complete pipeline, official logo and a liquid-glass “BOOK A CALL” CTA.

Create phrase-based burned-in captions with no more than two short lines. Keep captions away from Steve’s face, hands and active information cards.

Clean the original voice conservatively with high-pass and low-pass filtering, broadband denoise, light compression and measured loudness normalisation. Do not add an AI voice or music bed.

Add restrained sound effects to every meaningful animation while keeping speech dominant. Use short whooshes for scene motion, soft pops for headline landings, clicks for item appearances, pings for connections and verification, sparkles for highlights, key presses for counters and pipeline steps, a quiet riser for the skills-test build, a bass impact for the price reveal and a clean chime for the final CTA. Synchronise each effect to its corresponding animation and keep the final mix suitable for LinkedIn playback.

### Tools used

#### Editorial and planning

- **Codex:** transcript review, silence/mistake decisions, narrative structure, beat sheet, creative direction, composition authoring and quality review
- **Local word-level transcription:** Faster-Whisper/HyperFrames transcription workflow for timing captions and graphics to spoken words
- **HyperFrames video-editing skills:** silence cutting, mistake review, visual storytelling, beat planning and render validation

#### Visual production

- **HyperFrames CLI 0.8.33:** composition checking, preview and final video rendering
- **GSAP 3.14.2:** deterministic animation timelines, line draws, wipes, card entrances, counters and the continuous camera push
- **HTML, CSS and SVG:** graph-paper environment, liquid-glass cards, captions, diagrams, progress rails, pricing and no-fee graphics
- **OpenCV and NumPy:** connected-background removal and the refined alpha matte around Steve
- **FFmpeg:** alpha-video encoding, editorial assembly, audio processing, SFX mixing and final MP4 muxing
- **FFprobe:** source and final stream, duration, frame-rate and resolution verification
- **Official F5 Hiring Solutions logo:** localised official brand asset used for the logo bug and closing card
- **Montserrat and IBM Plex Mono:** locally bundled typography

#### Audio production

- **Original Steve recording:** the only narration source; no AI-generated speech was used
- **FFmpeg audio filters:** 70 Hz high-pass, 16 kHz low-pass, measured broadband denoise and light 2:1 compression
- **Two-pass loudness normalisation:** voice master targeted approximately -14 LUFS and -1.5 dBTP; final voice-and-SFX mix targeted approximately -14 LUFS and -1.8 dBTP
- **Nine local SFX types:** short whoosh, soft pop, UI click, verification ping, sparkle, key press, riser, bass impact and CTA chime
- **No music bed:** sound design supports animation without competing with the speaker

### Motion and sound mapping

| Animation | Sound treatment |
|---|---|
| Scene/takeover entrance | Short low-volume whoosh |
| Headline or glass-card landing | Soft pop |
| Checklist item, node or report row | UI click |
| Connection completed or candidate verified | Ping |
| Brand sheen or successful highlight | Soft sparkle |
| Price count and pipeline-step appearance | Key-press tick |
| Skills-test progress rail | Restrained riser |
| $350 price reveal | Subtle bass impact |
| Book-a-call CTA landing | Clean chime |

### AI-use disclosure

- Codex assisted with editing decisions, copy hierarchy, motion design and implementation.
- The narration and presenter footage are Steve’s original recording.
- No AI-generated presenter, voice clone, synthetic b-roll or generated office footage was used.
- The final motion graphics were built deterministically with HTML/CSS/SVG and GSAP, then rendered through HyperFrames.

---

## Video 2 — Gemini-generated motion graphics assembled in Canva

**Final video:** `Untitled design.mp4`  
**Final verified format:** 1920 × 1080 landscape, H.264 video, AAC 48 kHz stereo audio  
**Final verified duration:** 20.90 seconds  
**Generation model:** Google Gemini 3.8 Flash  
**Assembly:** Two generated clips imported, sequenced and exported in Canva

### Prompt 1 used in Google Gemini

```text
Visual style: modern, premium SaaS-explainer motion graphics. Deep navy background (#0B1B34) with a subtle glowing particle/network-line texture drifting slowly. Accent colors: electric teal (#29E1C9) for UI highlights and positive states, warm amber-gold (#FFB100) for money/pricing elements, clean white (#F5F5F5) for typography. Bold geometric sans-serif font (Poppins/Sora Bold) for all kinetic text, words building in with a soft scale-and-glow pop synced to the voiceover. A small glowing "F5" monogram logo mark sits as a persistent watermark in the bottom-left corner. Camera is locked-off with only a slow 2-4% push-in per scene, no pans or tilts. Every scene transition uses the same signature move: a glowing horizontal panel/light sweep wiping across the frame. Continuous background music: confident, optimistic corporate-tech bed, soft plucked synth and light piano over a subtle sub bass, around 100 BPM, gently swelling as the video progresses. Voiceover: one consistent warm, confident, articulate American male voice, mid-30s, named Steve, natural conversational-professional pace, slightly upbeat energy. This is a 20-second scene. Logo forms from glowing particles into 'F5 HIRING SOLUTIONS' kinetic text; a candidate ID card fans in and gets stamped 'PRE-SCREENED' as a quality-gauge dial locks on 'PASS'; a world map shows a pin and skyline rising over New York and two pins with office buildings rising over India, connected by pulsing lines; a three-node pipeline flows light-particles from 'YOU' through 'F5' into 'EMPLOYEE' ending on a badge 'FULL-TIME · DEDICATED · YOURS' while two chat bubbles connect directly; a calendar flips to a glowing 'FRIDAY' and a report document slides up stamped 'WEEKLY REPORT.' Each beat transitions with the signature glowing panel-wipe, soft UI pops and chimes on every icon reveal, confident corporate-tech music building underneath. Voiceover (Steve, warm confident male, natural pace): "Hi, I'm Steve from F5 Hiring Solutions. We connect you with dedicated, pre-screened employees — tested for skill and quality — matched precisely to your needs. We're based in New York, our developers work from two offices in India. You pay us, we pay them full-time, and you communicate directly. Every Friday, we send you a full report."
```

### Prompt 2 used in Google Gemini

```text
Visual style: modern, premium SaaS-explainer motion graphics. Deep navy background (#0B1B34) with a subtle glowing particle/network-line texture drifting slowly. Accent colors: electric teal (#29E1C9) for UI highlights and positive states, warm amber-gold (#FFB100) for money/pricing elements, clean white (#F5F5F5) for typography. Bold geometric sans-serif font (Poppins/Sora Bold) for all kinetic text, words building in with a soft scale-and-glow pop synced to the voiceover. A small glowing "F5" monogram logo mark sits as a persistent watermark in the bottom-left corner. Camera is locked-off with only a slow 2-4% push-in per scene, no pans or tilts. Every scene transition uses the same signature move: a glowing horizontal panel/light sweep wiping across the frame. Continuous background music: confident, optimistic corporate-tech bed, soft plucked synth and light piano over a subtle sub bass, around 100 BPM, gently swelling as the video progresses. Voiceover: one consistent warm, confident, articulate American male voice, mid-30s, named Steve, natural conversational-professional pace, slightly upbeat energy. This is a 10-second scene. A glowing price tag odometer settles on '$350/week' with a badge lighting up 'FLAT RATE'; three fee icons labeled 'Recruiting Fee,' 'Office Fee,' and 'Termination Fee' each get struck through with a red diagonal X-wipe in quick succession; the F5 logo reforms at center and a glowing 'BOOK A CALL' button pulses as a cursor animates in to click it, holding as the end card with the signature panel-wipe used once more on the final transition. Coin-chime on the price, quick strike/buzz sounds on each crossed-out fee, confident click on the button, music swelling to a resolved final chord. Voiceover (Steve): "Rates start at $350 a week — one flat rate. No recruiting fees, no office fees, no termination fees. Ready to hire smarter? Book a call with us today."
```

### Tools used

- **Google Gemini — Gemini 3.8 Flash:** generated the two AI motion-graphics clips from the prompts above, including the requested visual animation, voiceover, music and sound-design direction
- **Canva:** imported both generated clips, placed them sequentially on the timeline and exported the combined MP4
- **FFprobe:** used afterward to verify the final export’s duration, codecs, resolution and audio format

### Assembly workflow

1. Generated the first F5 introduction, candidate, operating-model and Friday-report clip in Google Gemini using Prompt 1.
2. Generated the pricing, no-fees and book-a-call closing clip in Google Gemini using Prompt 2.
3. Imported both clips into Canva.
4. Arranged them in narrative order and exported the joined video as `Untitled design.mp4`.

### AI-use disclosure

- Both source clips were AI-generated with Google Gemini using the Gemini 3.8 Flash model.
- The prompts requested AI-generated motion graphics, male narration, music and sound effects.
- Canva was used for sequencing and final export; it was not used to generate the source clips.
- The verified final Canva export is 20.90 seconds, even though the requested prompt durations total 30 seconds; generated clip duration can differ from the requested duration.
