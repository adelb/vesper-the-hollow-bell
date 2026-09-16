# Vesper — The Hollow Bell

An original, single-player gothic pixel-art action platformer for the browser. Five complete districts, five two-phase bosses, and a story with two endings. Inspired by the atmosphere and deliberate combat of gothic soulslikes; no Bloodborne characters, locations, assets, music, or story are used.

## Play

**Hosted edition:** https://adelb.github.io/vesper-the-hollow-bell/

A modern browser with Canvas 2D and Web Audio is required. Keyboard/mouse, standard-mapped gamepads, and touch controls are supported. Landscape orientation is recommended on phones. Audio starts after a player gesture. No account, installation, backend, or external asset service is required.

| Action | Keyboard | Controller |
|---|---|---|
| Move | A / D or arrow keys | Left stick / D-pad |
| Jump | Space / W / Up | A / Cross |
| Light attack; chain three strikes | J / left mouse | X / Square |
| Heavy attack | K / right mouse | Y / Triangle |
| Dodge | Shift | B / Circle |
| Parry | L / Q | LB / L1 |
| Heal | F | RB / R1 |
| Rest, read, enter | E | D-pad up |
| Pause | Escape / P | Start |

Use the D-pad to navigate menus, A/Cross to select, and B/Circle to close dismissible dialogs. Touch players have on-screen action buttons.

## The pilgrimage

1. **The Gaslit Ward** — The Lantern Warden: sweeps and charging cleaver strikes.
2. **The Weeping Garden** — The Briar Widow: root-limbed lunges, leaps, and a second-phase nova.
3. **The Drowned Choir** — Cantor of the Deep: fanned hymns and ground waves.
4. **The Astral Spire** — The Unseeing Astronomer: marked astral strikes, projectiles, and teleportation.
5. **The Hollow Heart** — The Heart of Vesper: a final combination of charging, leaping, and astral patterns.

Combat uses stamina, timed invulnerability, buffered three-hit light combos, heavy attacks, parry/riposte windows, and recoverable health. Amber wind-ups are parryable; violet attacks, ground waves, and environmental hazards are not. Briefly stop attacking to regenerate stamina. Jump then dodge to cross wide gaps. Falling costs health and returns you to safe ground.

Rest at either lamp in a district to refill health/tinctures, save a checkpoint, and spend echoes on vitality and weapon upgrades. Ordinary enemies revive when resting or reloading; defeated guardians stay defeated. Death drops carried echoes. Dying again before recovering them replaces that marker. Defeat a guardian and interact with the passage at the far right to progress.

**Pilgrim difficulty** reduces incoming damage by 38% and grants a fourth tincture on your next rest. All chapters and both endings remain available. Camera shake, particles, reduced motion, and touch controls can be configured independently.

## Saves

Progress uses browser `localStorage`: `vesper.save.v1` and `vesper.settings.v1`. Saves are local to the current browser and site origin, not cloud-synced. Progress autosaves at lamps, deaths, boss victories, travel, upgrades, and periodically during play. Continuing resumes at the saved lamp, not the exact position where the tab closed. Export/import JSON backups in Settings to move progress between browsers.

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

Set `VESPER_URL` to check a production URL instead. Development checks exercise movement, jumping, attacks, menus, settings, upgrades, death/recovery, five boss-to-gate transitions, an ending, reload persistence, audio initialization, and touch layouts. Unit tests cover full-health boss defeat, collision, every mandatory platform gap, combat rules, both endings, and save validation. Screenshots are written to the ignored `test-results` directory. The engine inspection hook exists only in development builds.

## Hosting

The game is entirely static. `npm run build` produces `dist`, with relative asset paths so it can be hosted at a domain root or a subdirectory.

- **GitHub Pages (current deployment):** source is on `main`; the compiled site is on `gh-pages`. Pages uses **Deploy from a branch**, branch `gh-pages`, folder `/ (root)`. Run `npm run deploy` to build and update it. The deploy script requires Git and an authenticated GitHub CLI (`gh auth login`). It keeps a generated, ignored `.deploy` checkout and preserves deployment history without force-pushing.
- **Optional automated deployment:** with workflow-write authorization, copy `deployment/github-pages.yml` to `.github/workflows/deploy.yml`, and change Pages' source to **GitHub Actions**. It tests, builds, and deploys pushes to `main`. This workflow is a template, not an installed workflow.
- **Vercel:** import the project with the included `vercel.json`, or run `vercel --prod` with valid authorization.
- **Other static hosting:** upload the contents of `dist`. No environment variables or secrets are needed.

## Art, sound, and implementation

All game scenery, architecture, sprites, animations, weather, and effects are generated by the original Canvas renderer. Five chapter palettes use cached parallax scenery, carved gothic windows, stepped moon textures, atmospheric lighting, and articulated pixel characters. Blender is not required for this native 2D art pipeline.

The original soundtrack is synthesized locally with Web Audio: five chapter motifs, detuned drones, additive bells, procedural convolution reverb, and a faster rhythmic layer during boss encounters. Combat sound effects are synthesized too; no downloaded music or sound packs are used.

Cormorant Garamond and DM Sans are bundled locally under their SIL Open Font Licenses. Copyright notices and licenses are included in `public/fonts`. The finished game makes no third-party runtime font or media requests.

Core files: `src/game.js` (simulation), `src/renderer.js` (art), `src/audio.js` (score/effects), `src/content.js` (campaign), `src/input.js` (devices), `src/storage.js` (persistence), and `src/main.js` (UI).
