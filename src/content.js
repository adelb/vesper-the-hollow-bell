export const WIDTH = 960;
export const HEIGHT = 540;
export const ROMAN = ['I', 'II', 'III', 'IV', 'V'];

export const PROLOGUE = [
  { title: 'Before the long night', label: 'VESPER, NINETY-NINE YEARS AGO', scene: 'city', chapter: 0, speaker: 'THE LAMPLIGHTER', text: 'There was a time when we feared the morning. Every sunrise meant another empty chair. So the city built a bell, and asked it for one impossible kindness: let no one leave us.', duration: 10 },
  { title: 'A beautiful mistake', label: 'THE FIRST TOLL', scene: 'bell', chapter: 2, speaker: 'ORREN, KEEPER OF THE LAMPS', text: 'The bell answered. The dying opened their eyes. The graves stood empty. We mistook a debt for a miracle. Each year, it asked for another guardian. Each year, we gave it one.', duration: 10 },
  { title: 'Your sister, Mara', label: 'THE LAST WINDOW WITH A LIGHT', scene: 'siblings', chapter: 0, speaker: 'MARA', text: 'You used to leave a lantern in my window. You called it a little morning. I thought, if one light could save me, perhaps one heart could save everyone.', duration: 9 },
  { title: 'The hundredth bell', label: 'TONIGHT', scene: 'fracture', chapter: 3, speaker: 'THE LAMPLIGHTER', text: 'Mara found what the guardians were hiding. Ninety-nine years of death, waiting beneath our feet. She took her lantern into the cathedral. Then the bell rang once too often.', duration: 9 },
  { title: 'Carry a little morning', label: 'YOUR PILGRIMAGE BEGINS', scene: 'hunter', chapter: 0, speaker: 'MARA, A VOICE IN THE DARK', text: 'If you come after me, do not come because you cannot let go. Come because you still remember how to live. I will be waiting where the city keeps its heart.', duration: 9 },
];

export const BOSS_DRAMA = [
  { title: 'The Lantern Warden', line: 'The light stays here. So do you.', reveal: 'An oath outlived the man who made it.', mutation: 'The Cinder Seraph', mutationLine: 'The cage breaks. What he guarded was inside him.', color: '#f4bf78', size: [84, 139], patterns: ['sweep', 'charge', 'cinder', 'sweep'], cue: 'brass', transformed: 'His lantern cage unfolds into burning wings. Cinder volleys now follow his charges.' },
  { title: 'The Briar Widow', line: 'Hush now. You will wake the children.', reveal: 'She planted a garden so nothing she loved would leave.', mutation: 'Mother of Thorns', mutationLine: 'The cradle was empty. The roots were not.', color: '#cbdca0', size: [116, 134], patterns: ['roots', 'leap', 'nova', 'sweep'], cue: 'roots', transformed: 'A thorn crown flowers from her veil. She uproots the arena beneath your feet.' },
  { title: 'Cantor of the Deep', line: 'One more verse. Then they may rest.', reveal: 'The water took his breath, but not his congregation.', mutation: 'The Thousand-Voiced', mutationLine: 'One mouth falls silent. A hundred open.', color: '#b5e4d5', size: [91, 148], patterns: ['tidal', 'song', 'sweep', 'tidal'], cue: 'choir', transformed: 'The choir splits his vestments into a many-voiced halo. Tides now travel in both directions.' },
  { title: 'The Unseeing Astronomer', line: 'Do not look up. It knows your name.', reveal: 'He charted the heavens, and found the city looking back.', mutation: 'The Unbound Constellation', mutationLine: 'The stars were never above him. They were waiting under his skin.', color: '#e5cef6', size: [90, 145], patterns: ['eclipse', 'meteor', 'nova', 'eclipse'], cue: 'stars', transformed: 'His body becomes an orbit of eyes and broken instruments. Eclipses bend their projectiles toward you.' },
  { title: 'The Heart of Vesper', line: 'Please. I have only just learned to live.', reveal: 'Every life the city refused to lose. Every goodbye it could not bear.', mutation: 'The City Unmade', mutationLine: 'It remembers every death. Now it remembers yours.', color: '#f3b39e', size: [119, 148], patterns: ['rapture', 'charge', 'nova', 'leap', 'roots'], cue: 'heart', transformed: 'Its ribbed shell opens into six living wings. Rapture sends curved bolts through the arena.' },
];

export const ENEMY_CAST = [
  { husk: { id: 'watchman', name: 'Wickless Watchman', color: '#9ba699', trim: '#cfa776', patterns: ['sweep'] }, acolyte: { id: 'censor', name: 'Ash Censor', color: '#777f77', trim: '#dcad72', patterns: ['bolt', 'spread'] }, brute: { id: 'gravebearer', name: 'Gravebearer', color: '#798d87', trim: '#c2ad87', patterns: ['sweep', 'charge'] } },
  { husk: { id: 'thornhound', name: 'Thornhound', color: '#6d8971', trim: '#c0d09a', patterns: ['leap', 'sweep'] }, acolyte: { id: 'seedseer', name: 'Seed-Seer', color: '#77856b', trim: '#d3c09f', patterns: ['spread'] }, brute: { id: 'rootknight', name: 'Rootbound Knight', color: '#697756', trim: '#b6c98d', patterns: ['roots', 'sweep'] } },
  { husk: { id: 'drowned', name: 'Drowned Duelist', color: '#789f9f', trim: '#c8dbcd', patterns: ['sweep', 'charge'] }, acolyte: { id: 'bellmouth', name: 'Bellmouth', color: '#56808d', trim: '#c0dcbd', patterns: ['song'] }, brute: { id: 'anchorite', name: 'Iron Anchorite', color: '#607f84', trim: '#a9c4b4', patterns: ['sweep', 'tidal'] } },
  { husk: { id: 'riftstalker', name: 'Rift Stalker', color: '#8e809d', trim: '#dbbedf', patterns: ['blink', 'sweep'] }, acolyte: { id: 'orbitseer', name: 'Orbit Seer', color: '#817aa2', trim: '#e0d0f1', patterns: ['nova'] }, brute: { id: 'glassgolem', name: 'Prismatic Golem', color: '#7e8f9d', trim: '#dbd7f3', patterns: ['meteor', 'sweep'] } },
  { husk: { id: 'paleorphan', name: 'Pale Mourner', color: '#bd9a90', trim: '#edc9a9', patterns: ['leap', 'sweep'] }, acolyte: { id: 'marrowweaver', name: 'Marrow Weaver', color: '#9f767b', trim: '#edbbb1', patterns: ['spread', 'bolt'] }, brute: { id: 'pulseknight', name: 'Pulse Knight', color: '#966d71', trim: '#ebbaa1', patterns: ['charge', 'roots'] } },
];

export const NPCS = [
  { id: 'orren', name: 'Orren', role: 'Keeper of the wayward lamps', x: 278, color: '#c4ac79', portrait: 'keeper', gift: 40,
    intro: ['That lantern. I gave it to your sister when she was small. She said the dark was not frightening if someone was waiting at the other end.', 'Mara passed here before the hundredth toll. She asked me how to break a promise without breaking the person who made it. I had no answer.', 'The Warden remembers his duty, not his name. Watch his shoulder before the cleaver falls. Your lantern can carry you through a strike. Let me show you.'],
    choices: [{ ask: 'Teach me the lantern step.', answer: ['Hold a direction and press Shift. In the air, W and S steer the step upward or downward. Your lamp can carry one air step before your feet touch stone again.', 'Strike during the step to draw a silver Wakecut. Press K in the air to fall like a bell hammer. Never spend your last breath without knowing where you will land.'] }, { ask: 'Why did Mara go alone?', answer: ['Because she knew you would follow. And because some people find it easier to offer themselves than to ask to be loved.', 'Bring her home if you can. But listen when she tells you what home has become.'] }],
    after: ['The Warden is quiet. For the first time in ninety-nine years, I can hear the wind through that gate.', 'Keep his name, if you find it. A guardian deserves to be remembered as more than a door.'] },
  { id: 'ilex', name: 'Ilex', role: 'The last gardener', x: 260, color: '#b4c48e', portrait: 'gardener', gift: 45,
    intro: ['Careful where you put your feet. The small roots are sleeping. The large ones are pretending.', 'My mother made this garden. The bell kept her alive, but it did not keep her memories. Now every flower is a child she thinks she lost.', 'Your sister brought her a little wooden bird. For one moment, the roots stopped reaching. That was the first kind thing I had seen in years.'],
    choices: [{ ask: 'Can your mother be saved?', answer: ['I spent my whole life asking that. I never once asked whether she wanted to stay.', 'If the Widow shows you an empty cradle, do not kneel beside it. Watch the ground. Her grief has roots.'] }, { ask: 'Where did Mara go?', answer: ['Below the cathedral. She carried a heart wrapped in a gardener’s coat. It was beating in time with the bell.', 'She left me these seeds. They need sunlight. Imagine giving someone a gift that requires tomorrow.'] }],
    after: ['The roots have let go. I thought I would feel empty. Instead, I think I am hungry.', 'I will plant the seeds when the morning comes. I have decided there will be a morning.'] },
  { id: 'nera', name: 'Sister Nera', role: 'Ferrier of the unsung', x: 255, color: '#a4d4cd', portrait: 'ferrier', gift: 50,
    intro: ['Do not mistake the singing for welcome. The choir has forgotten every word except stay.', 'I used to carry the dead across this water. Then the bell rang, and nobody arrived. I have kept the boat ready ever since.', 'Mara asked me to save a place for her. I told her a ferry is not a promise of death. It is a promise that nobody has to cross alone.'],
    choices: [{ ask: 'How do I silence the choir?', answer: ['The gold note can be turned with your blade. The low tide cannot. Jump over the water’s voice.', 'When his robe opens, the whole congregation will sing through him. There will be a breath between the waves. Take it.'] }, { ask: 'What waits across the water?', answer: ['I do not know. Anyone who tells you otherwise is selling a bell.', 'But I know the weight of a hand that stops trembling when another hand takes it. Perhaps that is enough to begin.'] }],
    after: ['Listen. Not silence. Water. We had forgotten that the river made a sound of its own.', 'When you find Mara, tell her I have not given her place away. Tell her there is no hurry.'] },
  { id: 'cael', name: 'Cael', role: 'Apprentice to the impossible', x: 255, color: '#c5b5e2', portrait: 'scholar', gift: 55,
    intro: ['Please do not move the instruments. They are the only things in this room that still agree on where we are.', 'My master found a constellation shaped like Vesper. Then it blinked. He has not looked through a telescope since.', 'Mara read his final chart. Five districts. Five guardians. Not a map of streets. An anatomy.'],
    choices: [{ ask: 'The city is alive?', answer: ['It learned from us. Our fear of endings. Our hunger for more time. We built it a heart, and taught it that silence meant abandonment.', 'My master tried to show it the stars. Now the stars are trying to come through him. Move when the floor is marked. Never stand inside a promise of light.'] }, { ask: 'Is there another way?', answer: ['Mara wanted to replace the heart. You could do that. Or break the bell and return the years it borrowed.', 'Neither choice will keep everything. A choice that keeps everything is not a choice. It is how this began.'] }],
    after: ['The instruments have stopped arguing. North is north again. Such a small, magnificent thing.', 'I am going to look at the stars with my own eyes. Not to measure them. Just to see them.'] },
  { id: 'mara', name: 'Mara', role: 'A memory that refuses to fade', x: 270, color: '#e6b5a2', portrait: 'sister', gift: 60,
    intro: ['Do not be frightened. This is only the part of me that remembers the way home.', 'I thought the heart needed someone brave. It needed someone willing to listen. I heard a whole city begging not to be forgotten.', 'You do not have to forgive what I did. Just promise you will make the choice I could not.'],
    choices: [{ ask: 'I came to bring you home.', answer: ['I know. Every night, even here, I could see your lantern.', 'Home is not the place where nothing changes. It is the place where someone notices when you do. I am still your sister. Whatever happens next.'] }, { ask: 'What does the heart want?', answer: ['What everyone wants. Another morning. Someone to say its name.', 'When it changes, remember there is still a frightened thing inside all that light. Fight it. But do not hate it.'] }],
    after: ['I can hear you without the bell between us.', 'There you are. My little morning.'] },
];

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
  ['Heavy / aerial bellfall', 'K / Right mouse', 'Y / Triangle'],
  ['Lantern step · directional dash', 'W A S D + Shift', 'Left stick + B / Circle'],
  ['Wakecut · dash strike', 'J during a dash', 'X / Square during a dash'],
  ['Parry · time the impact', 'L / Q', 'LB / L1'],
  ['Healing tincture', 'F', 'RB / R1'],
  ['Rest / talk / read / enter', 'E', 'D-pad up'],
  ['Pause', 'Escape / P', 'Start'],
];
