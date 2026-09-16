export const WIDTH = 960;
export const HEIGHT = 540;
export const ROMAN = ['I', 'II', 'III', 'IV', 'V'];

export const CHAPTERS = [
  {
    id: 'ward', name: 'The Gaslit Ward', motif: 'Smoke & stone',
    subtitle: 'Where the lanterns burn for no one.',
    intro: 'For ninety-nine years, the bell of Vesper has held its people between life and death. Tonight, your sister rang it a hundredth time. Take her lantern. Follow her voice.',
    palette: { sky: '#10262c', fog: '#567a73', far: '#19393d', mid: '#1e3437', stone: '#344443', edge: '#728174', light: '#e7b56c', accent: '#c2a372', moon: '#c5d2ac' },
    boss: { name: 'The Lantern Warden', epithet: 'He kept the light. He lost the way.', kind: 'warden', hp: 440, color: '#b69459', reward: 220 },
    bossAfter: 'Beneath the Warden’s helm is no face, only a small, still-burning wick. He guarded the city from escape, not invasion. On his belt: your sister’s garden key.',
    note: { title: 'A lamplighter’s promise', text: '“Mara, if the lamps go dark, wait for me by the garden. I will bring a little morning.” Your own handwriting. You do not remember writing it.' },
    platforms: [[0, 452, 650], [760, 452, 680], [1530, 452, 730], [2360, 452, 1440], [350, 354, 180], [600, 300, 190], [990, 346, 210], [1260, 285, 190], [1690, 338, 205], [2050, 316, 210], [2270, 368, 190], [2590, 340, 190]],
    enemies: [[480, 'husk'], [880, 'husk'], [1120, 'acolyte'], [1630, 'husk'], [1990, 'brute'], [2480, 'acolyte'], [2790, 'husk']],
    hazards: [[1310, 426, 65], [2150, 426, 65]], checkpoint: 1770, noteX: 1040, arena: 3040, width: 3820,
  },
  {
    id: 'garden', name: 'The Weeping Garden', motif: 'Root & rot',
    subtitle: 'Even grief takes root.',
    intro: 'The garden once fed the city. Now its roots drink the dreams of the sleepless. Somewhere among them, a mother is still searching for a child who grew old without her.',
    palette: { sky: '#142725', fog: '#61856f', far: '#1c3930', mid: '#263c33', stone: '#424c3b', edge: '#839574', light: '#e2c88a', accent: '#acb873', moon: '#d6d7a4' },
    boss: { name: 'The Briar Widow', epithet: 'A thousand roots. One empty cradle.', kind: 'widow', hp: 560, color: '#a6b879', reward: 280 },
    bossAfter: 'The roots release their prisoners. A memory flowers in your palm: Mara entering the cathedral, carrying something that moved beneath its cloth. Not a child. A heart.',
    note: { title: 'The gardener’s ledger', text: 'Day 3,610. No sunrise. Roses open when we weep. The roots have found the old graves, but there is nobody left inside. If you hear your mother, do not answer.' },
    platforms: [[0, 452, 510], [630, 452, 560], [1320, 452, 700], [2140, 452, 540], [2780, 452, 1040], [350, 347, 185], [550, 280, 165], [830, 342, 190], [1100, 285, 180], [1450, 340, 175], [1770, 292, 200], [2020, 347, 185], [2390, 320, 190], [2630, 355, 220]],
    enemies: [[400, 'husk'], [790, 'husk'], [1020, 'acolyte'], [1450, 'brute'], [1920, 'husk'], [2310, 'acolyte'], [2860, 'brute']],
    hazards: [[930, 426, 80], [1610, 426, 85], [2470, 426, 70]], checkpoint: 1790, noteX: 860, arena: 3050, width: 3820,
  },
  {
    id: 'choir', name: 'The Drowned Choir', motif: 'Salt & silence',
    subtitle: 'A hymn at the bottom of the world.',
    intro: 'Below the cathedral, the faithful sing with lungs full of black water. Their hymn is the mechanism of the bell. Silence its cantor, and the city may remember the sound of its own heart.',
    palette: { sky: '#10242e', fog: '#527e88', far: '#173744', mid: '#243d47', stone: '#384b53', edge: '#75999e', light: '#aadbd0', accent: '#83c1bd', moon: '#bddbdd' },
    boss: { name: 'Cantor of the Deep', epithet: 'The last voice beneath the water.', kind: 'cantor', hp: 680, color: '#7ebbbb', reward: 340 },
    bossAfter: 'The last note breaks. In the sudden quiet, you hear the truth: the bell does not prevent death. It stores it. Above you, an astronomer has been calculating the price.',
    note: { title: 'A hymn without words', text: 'They sang so their children would never leave them. When the flood came, not one singer rose for air. Beneath the music, you recognize a second rhythm. An immense, terrified heartbeat.' },
    platforms: [[0, 452, 460], [590, 420, 400], [1130, 452, 870], [2130, 422, 420], [2700, 452, 1120], [300, 330, 160], [530, 285, 150], [820, 300, 170], [1010, 350, 180], [1350, 334, 185], [1680, 290, 200], [1930, 342, 165], [2350, 315, 175], [2590, 347, 190]],
    enemies: [[350, 'acolyte'], [710, 'husk'], [1230, 'brute'], [1510, 'acolyte'], [1890, 'husk'], [2310, 'acolyte'], [2850, 'brute']],
    hazards: [[1440, 426, 70], [2780, 426, 75]], checkpoint: 1740, noteX: 1280, arena: 3040, width: 3820,
  },
  {
    id: 'spire', name: 'The Astral Spire', motif: 'Ash & astral dust',
    subtitle: 'The stars are not where we left them.',
    intro: 'The observatory has turned its telescopes inward. The dead do not fill the earth, but the moon. Mara came here to find a way to bring them home. She found a door instead.',
    palette: { sky: '#202138', fog: '#72708d', far: '#2c2a47', mid: '#343449', stone: '#4b485c', edge: '#9a91a4', light: '#dcc4df', accent: '#b5a0cf', moon: '#e1d8d5' },
    boss: { name: 'The Unseeing Astronomer', epithet: 'He saw the truth. He put out his eyes.', kind: 'astronomer', hp: 800, color: '#b4a0d0', reward: 420 },
    bossAfter: 'His chart shows five chambers, five guardians, one body. Vesper is not a city built around a bell. It is a living thing built around a wound. Your sister is inside it.',
    note: { title: 'The impossible constellation', text: 'Ninety-nine years of death, held in a single vessel. The hundredth toll will split it. Mara knows. She has gone below to take the vessel’s place. There must be another way.' },
    platforms: [[0, 452, 420], [550, 426, 410], [1090, 452, 900], [2130, 426, 400], [2680, 452, 1140], [290, 340, 175], [510, 278, 170], [760, 312, 165], [980, 355, 165], [1240, 334, 190], [1580, 285, 170], [1900, 339, 200], [2280, 303, 190], [2520, 344, 205]],
    enemies: [[340, 'husk'], [690, 'acolyte'], [1210, 'brute'], [1500, 'acolyte'], [1880, 'brute'], [2260, 'acolyte'], [2810, 'brute']],
    hazards: [[1390, 426, 75], [1770, 426, 75], [2850, 426, 70]], checkpoint: 1650, noteX: 1160, arena: 3040, width: 3820,
  },
  {
    id: 'heart', name: 'The Hollow Heart', motif: 'Flesh & forgiveness',
    subtitle: 'Some things must end to be forgiven.',
    intro: 'At the bottom of Vesper, there is no monster waiting. Only your sister, holding a century of borrowed time. But the heart has learned to fear the silence. It will not let her go.',
    palette: { sky: '#2e1c24', fog: '#946e71', far: '#41262f', mid: '#4c3038', stone: '#58434a', edge: '#a1837e', light: '#f0b698', accent: '#d58e84', moon: '#e2bbb0' },
    boss: { name: 'The Heart of Vesper', epithet: 'All the lives we could not let go.', kind: 'heart', hp: 1000, color: '#d59089', reward: 600 },
    bossAfter: 'The heart falls quiet. Mara opens her eyes. “I thought I could keep everyone,” she says. Beyond the walls, a city waits for your answer. There are two ways to love a dying thing.',
    note: { title: 'Mara’s last letter', text: 'You always brought me a little morning. I thought I could do the same for everyone. If you reach me, do not save the city because you are afraid to lose it. Save it because you know what it means to live.' },
    platforms: [[0, 452, 530], [650, 432, 460], [1240, 452, 780], [2160, 432, 400], [2700, 452, 1120], [340, 345, 180], [570, 295, 165], [900, 328, 180], [1140, 350, 170], [1450, 328, 185], [1810, 300, 175], [2050, 350, 180], [2380, 322, 180], [2590, 348, 180]],
    enemies: [[390, 'brute'], [760, 'acolyte'], [1350, 'brute'], [1610, 'acolyte'], [1930, 'brute'], [2260, 'acolyte'], [2830, 'brute']],
    hazards: [[1510, 426, 75], [2750, 426, 80]], checkpoint: 1730, noteX: 1300, arena: 3040, width: 3820,
  },
];

export const ENDINGS = {
  dawn: { title: 'A little morning', subtitle: 'THE BELL IS SILENT', text: 'You break the bell. The borrowed years return, gentle as rain. Some people fade. Others wake. Mara takes your hand as the first real dawn touches the roofs of Vesper. For the first time, the city does not last forever. For the first time, it lives.' },
  keeper: { title: 'The last lamplighter', subtitle: 'THE LIGHT ENDURES', text: 'You take the heart’s place, but change its promise. No more stolen years. Only a little light to guide the dying home. Mara climbs the stairs toward a waking city. Each night she lights a lantern in the window. Each night, you answer.' },
};

export const CONTROLS = [
  ['Move', 'A / D or ← / →', 'Left stick / D-pad'],
  ['Jump', 'Space / W / ↑', 'A / Cross'],
  ['Light attack · 3-hit chain', 'J / Left mouse', 'X / Square'],
  ['Heavy attack', 'K / Right mouse', 'Y / Triangle'],
  ['Dodge · invulnerable start', 'Shift', 'B / Circle'],
  ['Parry · time the impact', 'L / Q', 'LB / L1'],
  ['Healing tincture', 'F', 'RB / R1'],
  ['Rest / read / enter', 'E', 'D-pad up'],
  ['Pause', 'Escape / P', 'Start'],
];
