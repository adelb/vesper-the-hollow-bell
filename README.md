# Vesper — The Hollow Bell

An original, single-player gothic pixel-art action platformer for the browser. **The Bestiary / 1.2** overhauls the five guardians and fifteen enemy species with detailed creature artwork and 31 additional signature techniques. The five-district campaign retains Reawakening's illustrated prologue, survivors, directional air dashes, physical boss transformations, and two endings. Inspired by the atmosphere and deliberate combat of gothic soulslikes; no Bloodborne characters, locations, assets, music, or story are used.

## Play

**Hosted edition:** https://adelb.github.io/vesper-the-hollow-bell/

A modern browser with Canvas 2D and Web Audio is required. Keyboard/mouse, standard-mapped gamepads, and touch controls are supported. Landscape orientation is recommended on phones. Audio starts after a player gesture. No account, installation, backend, or external asset service is required.

| Action | Keyboard | Controller |
|---|---|---|
| Move | A / D or arrow keys | Left stick / D-pad |
| Jump | Space / W / Up | A / Cross |
| Light attack; chain three strikes | J / left mouse | X / Square |
| Heavy attack; Bellfall while airborne | K / right mouse | Y / Triangle |
| Directional dash / air step | Direction + Shift | Left stick + B / Circle |
| Wakecut | Light attack during a dash | X / Square during a dash |
| Parry | L / Q | LB / L1 |
| Heal | F | RB / R1 |
| Rest, talk, read, enter | E | D-pad up |
| Pause | Escape / P | Start |

Use the D-pad to navigate menus and conversations, A/Cross to select, and B/Circle to close dismissible dialogs or skip a cinematic. Touch players have on-screen action buttons, including up/down dash aiming. The controller's left-stick up and the touch up arrow aim without jumping; keyboard W/Up retains its jump shortcut. Space/Enter advances story scenes, Escape skips, and Tab selects dialogue choices.

**Advanced movement:** aim dashes with W/A/S/D or arrows, including diagonals. A dash costs 23 stamina and briefly avoids damage; one air step is available until landing. Jump during a grounded dash to cancel into a forward leap. Attack during a dash to perform **Wakecut**, a longer-reaching silver slash with spectral afterimages. Heavy-attack in the air to commit to **Bellfall**: a downward plunge followed by a two-sided landing shockwave. Keep enough stamina for an escape.

## The story

Vesper asked a bell to prevent death. Ninety-nine years later, the unpaid debt is waking beneath the city. Follow your sister Mara's lantern through five districts, discover why she entered the living heart, and choose between returning the dawn and becoming its keeper.

A five-scene illustrated prologue introduces the bargain, Mara, and the hundredth toll. Advance it yourself, let it play, or skip it; **Watch the prologue** on the title replays it without restarting your campaign. Meet **Orren, Ilex, Sister Nera, Cael, and Mara** near the first lamp of their districts. Conversations have portraits, selectable questions, practical combat advice, and new lines after each guardian's defeat. Finishing a survivor's opening conversation grants a one-time gift of echoes and archives their words. Combat pauses during conversations and cinematics.

## The pilgrimage

| District | Guardian | Second awakening |
|---|---|---|
| The Gaslit Ward | The Lantern Warden | **The Cinder Seraph** unfolds burning wings and fires cinder volleys. |
| The Weeping Garden | The Briar Widow | **Mother of Thorns** flowers into a thorn-crowned body and uproots the arena. |
| The Drowned Choir | Cantor of the Deep | **The Thousand-Voiced** opens a many-faced halo and sends tides in both directions. |
| The Astral Spire | The Unseeing Astronomer | **The Unbound Constellation** becomes an orbit of eyes and bends eclipse bolts. |
| The Hollow Heart | The Heart of Vesper | **The City Unmade** opens six living wings and releases curved rapture bolts. |

Each guardian receives a named, letterboxed entrance with a camera close-up, a story line, and a musical sting. At half health, a protected transformation changes their silhouette, size, identity, and attack sequence—not just their color or speed. Entrances shorten on repeat attempts. Skipping a transformation still applies its new form.

Ordinary enemies have fifteen district-specific designs, from Thornhounds and Bellmouths to Rift Stalkers and Marrow Weavers. Read their different silhouettes and attack sequences: lunges, charges, spread shots, root eruptions, tides, and astral strikes.

### The Bestiary update

All fifteen species appear in the campaign, each with its own signature technique and at least one additional attack. Models now include weathered, riveted armor, coffin harnesses, a thorn-jawed hound, seed-pod robes, corroded diving equipment, mirror masks, crystal limbs, a six-armed weaver, and a living pulse hammer. Bosses have new body proportions, furnace armor, lace and thorn joints, organ-pipe vestments, articulated celestial instruments, or sutured membranes with a miniature city in the Heart's core.

| Guardian | New signature techniques |
|---|---|
| Lantern Warden | A three-stroke execution, a returning chain-cleaver, and alternating furnace eruptions. |
| Briar Widow | A three-limbed embrace, orbiting seed crowns, and a weaving pattern of root beds. |
| Cantor of the Deep | Answering three-note volleys, three-beat tides, and crossing requiem beams. |
| Unseeing Astronomer | Sequential meridian beams, orbiting eyes that launch one by one, and falling constellations. |
| Heart of Vesper | Heartbeat shockwaves, luminous artery beams, splitting memories, and a final arena coronation. |

Each boss has at least six attacks across its two forms. Signature wind-ups last at least 0.8 seconds and recovery windows last at least one second. Read the named boss wind-up and the combo-count pips; do not punish the first swing of a three-part sequence. Parrying a combo interrupts the remaining strikes. Ranged attacks lock their direction when prepared, except satellites that visibly orbit before aiming on release. Chain weapons remain dangerous on their return.

Violet outlines show the actual bounds of emerging roots and other area attacks. Beam guides lock before firing, and only the drawn beam segment deals damage. Alternating eruptions leave traversable gaps. Seeds mark the ground before sprouting, splitting shots signal their burst, and rift attackers mark their destination before teleporting. Interrupting a caster cancels its pending beams and unlaunched satellites; already-released attacks and planted seeds can persist.

Combat uses stamina, timed invulnerability, buffered three-hit light combos, heavy attacks, parry/riposte windows, and recoverable health. Amber wind-ups are parryable; violet attacks, ground waves, and environmental hazards are not. Briefly stop attacking to regenerate stamina. Jump then dodge to cross wide gaps. Falling costs health and returns you to safe ground.

Rest at either lamp in a district to refill health/tinctures, save a checkpoint, and spend echoes on vitality and weapon upgrades. Ordinary enemies revive when resting or reloading; defeated guardians stay defeated. Death drops carried echoes. Dying again before recovering them replaces that marker. Defeat a guardian and interact with the passage at the far right to progress.

**Pilgrim difficulty** reduces incoming damage by 38% and grants a fourth tincture on your next rest. All chapters and both endings remain available. Camera shake, particles, reduced motion, and touch controls can be configured independently.

## Saves

Progress uses browser `localStorage`: `vesper.save.v1` and `vesper.settings.v1`. Saves are local to the current browser and site origin, not cloud-synced. Progress autosaves at lamps, deaths, boss victories, travel, upgrades, completed introductions/conversations, and periodically during play. Continuing resumes at the saved lamp, not the exact position where the tab closed. Export/import JSON backups in Settings to move progress between browsers.

**Existing 1.0 and 1.1 saves are preserved.** The `talked`, `introduced`, and `prologueSeen` fields migrate automatically when absent, retaining upgrades, echoes, cleared guardians, and endings. Players arriving from 1.0 see the Reawakening prologue once and can skip it; no new pilgrimage is required. Bestiary introduces no save-format changes and does not revive previously defeated guardians.

If storage is blocked, full, or corrupt, the game displays a warning. Corrupt saves are not silently overwritten; play becomes session-only until the player explicitly starts a new pilgrimage or imports a valid save. Export before closing a session-only game.

## Local development

Requires Node.js 22.12+ (or 20.19+).

```sh
npm ci
npm run dev
```

Open **http://127.0.0.1:4173**.

```sh
npm test
npm run build
npm run preview
```

The dev server and production preview use the same port; stop one before starting the other, or run `npm run preview -- --port 4174`.

Browser checks use Playwright. Start the development server, then:

```sh
npx playwright install chromium
npm run test:browser
```

Set `VESPER_URL` to check a production URL instead. Development checks exercise keyboard movement combos, all five rendered survivor encounters, boss entrances and physical mutations, all gates, an ending, upgrades, death/recovery, controller menus, and touch layouts. They also compare animated/reduced-motion background frames and render all five instruments to audio buffers to detect silence or clipping. Public-build checks cover the prologue, menus, old-save migration, persistence, controller navigation, and mobile presentation. Unit tests cover full-health boss defeat, collision, every mandatory platform gap, combat rules, cinematics, NPC gifts, both endings, and save validation. Screenshots are written to the ignored `test-results` directory. The engine inspection hook exists only in development builds.

The attack suite runs every signature through preparation, execution, and recovery, checks projectile/hazard geometry, and exercises parry interruptions, returning weapons, delayed satellites, splitting shots, planted seeds, beam collision, safe lanes, and teleport reaction time. Browser checks render every technique and produce `enemy-bestiary.png`, `guardian-bestiary.png`, and representative combat captures for visual review.

## Hosting

The game is entirely static. `npm run build` produces `dist`, with relative asset paths so it can be hosted at a domain root or a subdirectory.

- **GitHub Pages (current deployment):** source is on `main`; the compiled site is on `gh-pages`. Pages uses **Deploy from a branch**, branch `gh-pages`, folder `/ (root)`. Run `npm run deploy` to build and update it. The deploy script requires Git and an authenticated GitHub CLI (`gh auth login`). It keeps a generated, ignored `.deploy` checkout and preserves deployment history without force-pushing.
- **Optional automated deployment:** with workflow-write authorization, copy `deployment/github-pages.yml` to `.github/workflows/deploy.yml`, and change Pages' source to **GitHub Actions**. It tests, builds, and deploys pushes to `main`. This workflow is a template, not an installed workflow.
- **Vercel:** import the project with the included `vercel.json`, or run `vercel --prod` with valid authorization.
- **Other static hosting:** upload the contents of `dist`. No environment variables or secrets are needed.

## Art, sound, and implementation

All game scenery, architecture, sprites, animations, weather, and effects are generated by the original Canvas renderer. Articulated hunter sprites have a feathered hat, half-mask, moving coat, lantern, curved sabre, and move-specific poses. Survivor portraits and both forms of every boss use the same original pixel-art vocabulary. Blender is not required for this native 2D art pipeline.

Cached parallax scenery is layered with moving clock hands and suspended bells, swaying vines and petals, waterfalls and ripples, rotating celestial instruments and floating masonry, or breathing arches and luminous pulses. Reduced-motion settings freeze animated environmental layers.

The soundtrack is synthesized locally with Web Audio. Each location has its own melody, chord progression, meter, instrumentation, and accompaniment, plus separate guardian and mutation arrangements. Score changes crossfade; cinematic stings and movement/combat effects are synthesized too. No downloaded music or sound packs are used.

| District | Original score | Lead sound |
|---|---|---|
| Gaslit Ward | Gaslight, in Three | Felt piano |
| Weeping Garden | Seeds for a Tomorrow | Harp |
| Drowned Choir | A Hymn Below the Water | Synthesized choir |
| Astral Spire | The Seventh Unmoving Star | Glass and bells |
| Hollow Heart | Everything We Could Not Keep | Strings |

Cormorant Garamond and DM Sans are bundled locally under their SIL Open Font Licenses. Copyright notices and licenses are included in `public/fonts`. The finished game makes no third-party runtime font or media requests.

Core files: `src/game.js` (simulation, movement, encounters, cinematic/dialogue states), `src/attacks.js` (signature definitions, warning rules and beam geometry), `src/effects.js` (projectile and hazard artwork), `src/renderer.js` (composition, scenery, camera and prologue plates), `src/art.js` (drawing primitives), `src/actors.js` (characters, enemies, bosses and portraits), `src/world.js` (animated environments), `src/audio.js` (score/effects), `src/content.js` (campaign and conversations), `src/input.js` (devices), `src/storage.js` (persistence), and `src/main.js` (UI).
