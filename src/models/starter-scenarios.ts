export interface StarterScenario {
  id: string;
  category: 'music' | 'culinary' | 'craft' | 'astronomy' | 'story' | 'companion' | 'games' | 'textile' | 'nature' | 'civic' | 'eco';
  categoryLabel: string;
  categoryIcon: string;
  mode: 'care' | 'creative';
  title: string;
  prompt: string;
  recommendedStrategies: string[];
  gist: string;
  domainContext?: {
    identityAssets: string;
    ecosystem: string;
    relational: string;
    perspectives: string;
    sampleInterventions: string[];
  };
}

export const STARTER_SCENARIOS: StarterScenario[] = [
  // ── Care Mode Scenarios ──────────────────────────────────────────
  {
    id: 'care-music',
    category: 'music',
    categoryLabel: 'Music & Jam Circle',
    categoryIcon: 'music',
    mode: 'care',
    title: 'Acoustic Blues & Living Room Jams',
    prompt: 'Enable a 68-year-old retired guitarist recovering from a mild stroke to safely rebuild left-hand finger agility and lead a weekly acoustic living room circle with his teenage granddaughter.',
    recommendedStrategies: ['what-if', 'butterfly', 'kinship-triad', 'burnout-shield'],
    gist: 'Preserving musician identity and rhythm through adaptive open-tunings, micro-sessions, and family jamming.',
    domainContext: {
      identityAssets: 'Lifelong blues musician and acoustic mentor — unaffected ear for pitch, rhythm intuition, and musical repertoire.',
      ecosystem: 'Acoustic living room with ergonomic armless guitar chair, wall-mounted instrument hangers, and warm ambient lighting.',
      relational: 'Teen granddaughter acts as tuning partner and chord-chart navigator; primary caregiver enjoys 1-hour protected respite during jam sessions.',
      perspectives: 'Neurology (gradual fine-motor neural plasticity) + Musician (frustration with finger speed) + Granddaughter (excited to learn pentatonic scales).',
      sampleInterventions: [
        'Tune guitar to Open D / Open G so full resonant chords require only single-finger or slide bar fretting.',
        'Schedule 12-minute practice intervals twice daily to prevent hand fatigue while building neuro-muscular pathways.',
        'Host a weekly Friday 45-minute family acoustic salon with songbooks chosen jointly with granddaughter.'
      ]
    }
  },
  {
    id: 'care-culinary',
    category: 'culinary',
    categoryLabel: 'Culinary Traditions',
    categoryIcon: 'utensils-crossed',
    mode: 'care',
    title: 'Heritage Dumplings & Sourdough Memory',
    prompt: 'Empower an 81-year-old grandfather experiencing early memory loss to comfortably lead Sunday family dumpling and bread-making rituals with tactile sensory pacing and seating adaptations.',
    recommendedStrategies: ['constraints', 'sensory-bridge', 'kinship-triad', 'via-strengths'],
    gist: 'Centering ancestral culinary knowledge, tactile memory, and intergenerational feast rituals.',
    domainContext: {
      identityAssets: 'Master family cook and heritage guardian — intact procedural muscle memory for dough folding, seasoning balance, and family storytelling.',
      ecosystem: 'Kitchen island adapted with height-adjustable swivel stool, non-skid silicone prep mats, and pre-measured ingredient bowls.',
      relational: 'Adult daughter coordinates prep and clean-up; grandchildren participate in dumpling pleating; protected 2-hour respite for daughter while father teaches grandchildren.',
      perspectives: 'Geriatrician (cognitive stimulation & dignified task completion) + Elder (fear of losing recipes or causing accidents) + Grandchildren (eager to master secret dough techniques).',
      sampleInterventions: [
        'Pre-portion spices into labeled, wide-mouth ramekins to eliminate measuring confusion while preserving elder seasoning mastery.',
        'Set up a comfortable seated prep station at the dining table with footrests to eliminate prolonged standing fatigue.',
        'Create a visual laminated recipe photo card with 4 tactile checkpoints (knead, rest, fill, pleat).'
      ]
    }
  },
  {
    id: 'care-craft',
    category: 'craft',
    categoryLabel: 'Woodwork & Tinkering',
    categoryIcon: 'tool',
    mode: 'care',
    title: 'Birdhouse Crafting & Songbird Sanctuaries',
    prompt: 'Design ergonomic woodworking adaptations and magnetic safety jigs for a 74-year-old former carpenter with mild Parkinson tremors to build birdhouses alongside neighborhood kids.',
    recommendedStrategies: ['fmea-risk', 'critical-path', 'kinship-triad', 'ergonomics-home'],
    gist: 'Honoring craftsman wisdom and spatial mastery through safety-jig adaptations and youth mentorship.',
    domainContext: {
      identityAssets: 'Master carpenter and spatial thinker — deep understanding of timber grains, joinery, and wildlife ecology.',
      ecosystem: 'Ground-floor garage workshop with rubber anti-fatigue interlocking floor tiles, magnetic tool guides, and clamped bench vises.',
      relational: 'Neighborhood youth assist with pre-cut assembly and sanding; elder demonstrates bird box ventilation; caregiver connects with neighbors during build hours.',
      perspectives: 'Occupational Therapist (tremor compensation & non-sharp task sequencing) + Carpenter (pride in craftsmanship) + Youth (inspired by handmade bird sanctuaries).',
      sampleInterventions: [
        'Utilize pre-drilled cedar panels and dowel joinery paired with soft rubber mallets to replace high-vibration power tools.',
        'Mount magnetic parts trays and quick-release lever clamps to secure wood pieces firmly before assembly.',
        'Establish a Saturday morning 90-minute workshop followed by outdoor feeder installation with neighborhood families.'
      ]
    }
  },
  {
    id: 'care-astronomy',
    category: 'astronomy',
    categoryLabel: 'Astronomy & Awe',
    categoryIcon: 'sparkles',
    mode: 'care',
    title: 'Backyard Stargazing & Night-Sky Wonder',
    prompt: 'Create a restful evening stargazing routine and iPad-assisted telescope setup for a 70-year-old astronomy lover recovering from cardiac rehab to foster restorative sleep, awe, and family wonder.',
    recommendedStrategies: ['time-century', 'sensory-bridge', 'what-if', 'integrity-autonomy'],
    gist: 'Channeling cosmic awe (PERMA Meaning) and circadian harmony with zero-strain digital optical setups.',
    domainContext: {
      identityAssets: 'Lifelong astronomy educator — vast knowledge of celestial lore, planetary orbits, and deep-sky wonders.',
      ecosystem: 'Backyard patio equipped with zero-gravity recliner, heated foot throw, red-light headlamps to preserve dark adaptation, and WiFi smart telescope.',
      relational: 'Adult son sets up the tripod; elder guides grandchild through constellation stories on the synced living room screen; spouse gets uninterrupted evening reading time.',
      perspectives: 'Cardiologist (restorative parasympathetic activation & low-stress evening pacing) + Elder (longing for night-sky connection without cold exposure) + Grandchild (enchanted by Saturn ring views).',
      sampleInterventions: [
        'Employ a smart WiFi optical tube that streams live star-cluster imagery directly to an iPad, eliminating neck strain and eyepiece squinting.',
        'Pair 30-minute observing sessions with warm herbal chamomile tea and a circadian red-spectrum porch lantern.',
        'Record grandfather constellation narration on voice notes for family audio archives.'
      ]
    }
  },
  {
    id: 'care-story',
    category: 'story',
    categoryLabel: 'Oral History & Voice',
    categoryIcon: 'mic',
    mode: 'care',
    title: 'Living Room Audio Chronicles & Lore',
    prompt: 'Facilitate a micro-podcast recording ritual for an 84-year-old matriarch to preserve ancestral migration stories and folk recipes, guided gently by her 14-year-old tech-enthusiast grandson.',
    recommendedStrategies: ['child', 'unlikely-alliances', 'kinship-triad', 'via-strengths'],
    gist: 'Bridging generations through oral storytelling, voice preservation, and teen digital partnership.',
    domainContext: {
      identityAssets: 'Family matriarch and cultural historian — vivid lived memories of mid-century community life, resilience, and family proverbs.',
      ecosystem: 'Quiet sunroom armchair with plush acoustic cushions, directional USB condenser mic on goose-neck, and soft natural daylight.',
      relational: '14-year-old grandson manages the recorder and creates episode chapter art; elder feels deeply heard; daughter takes an afternoon walk knowing two generations are bonding.',
      perspectives: 'Speech Pathologist (vocal endurance & comfortable pacing) + Elder (desire to pass on heritage before it fades) + Grandson (proud to produce a polished family audio show).',
      sampleInterventions: [
        'Curate 3 prompt cards per session (e.g., "The best advice your mother gave you", "The recipe everyone requested at holidays").',
        'Cap recording turns at 15 minutes to respect vocal stamina and prevent respiratory fatigue.',
        'Grandson edits episodes into a private family digital archive and shares monthly highlights with relatives worldwide.'
      ]
    }
  },
  {
    id: 'care-companion',
    category: 'companion',
    categoryLabel: 'Companion Animal Care',
    categoryIcon: 'heart',
    mode: 'care',
    title: 'Gentle Micro-Walks with a Companion Dog',
    prompt: 'Structure a joyful, low-impact daily micro-walking and grooming routine for a 72-year-old elder recovering from knee replacement together with a gentle rescue therapy dog.',
    recommendedStrategies: ['butterfly', 'nature', 'burnout-shield', 'fmea-risk'],
    gist: 'Unconditional canine connection and rhythmic outdoor walking to motivate recovery while preventing fall risks.',
    domainContext: {
      identityAssets: 'Compassionate animal lover and nurturer — deep sensitivity to pet behavior and joy in gentle routine.',
      ecosystem: 'Level neighborhood sidewalk loop with resting benches every 50 yards; hands-free waist bungee leash with quick-release.',
      relational: 'Adult son walks alongside initially for balance support; neighbors greet the dog, fostering casual micro-social interactions; caregiver respite scheduled during dog park visits.',
      perspectives: 'Orthopedic PT (gradual knee flexion and gait confidence) + Elder (motivated by dog excitement to get up) + Dog (calm companion trained in loose-leash walking).',
      sampleInterventions: [
        'Use an ultra-light hands-free leash with elastic bungee absorption to prevent sudden pulls on the recovering knee.',
        'Incorporate 5-minute seated grooming and brushing on the porch to build shoulder mobility and release oxytocin.',
        'Design a 200-meter scenic loop with a guaranteed shaded bench stop halfway for orthostatic breathing checks.'
      ]
    }
  },
  {
    id: 'care-games',
    category: 'games',
    categoryLabel: 'Strategy & Games',
    categoryIcon: 'dice',
    mode: 'care',
    title: 'Porch Chess & Dominoes Tournament',
    prompt: 'Organize a bi-weekly porch chess and dominoes salon for a 78-year-old retired math teacher to mentor local students, fostering sharp cognitive flow, laughter, and community belonging.',
    recommendedStrategies: ['combinatorial', 'unlikely-alliances', 'via-strengths', 'child'],
    gist: 'Cognitive play, friendly competition, and cross-generational intellectual mentorship.',
    domainContext: {
      identityAssets: 'Retired educator and analytical strategist — sharp strategic memory, patience, and love for teaching game fundamentals.',
      ecosystem: 'Covered porch with sturdy oak game table, oversized wooden tournament pieces with felt bottoms, and glare-free warm LED lighting.',
      relational: 'High school chess club members visit on alternating Thursdays; elder provides tactical analysis; family caregiver enjoys 2 hours of quiet downtime.',
      perspectives: 'Cognitive Neurologist (neuro-protective executive function challenge) + Elder (revitalized by teaching young minds) + Students (enthusiastic about master-level endgame coaching).',
      sampleInterventions: [
        'Utilize weighted 3.75-inch Staunton pieces that offer tactile stability and are easy to grasp for mature hands.',
        'Play with relaxed 20-minute untimed clocks to promote thoughtful conversation and zero time-pressure stress.',
        'Document memorable game moves and combinations in a dedicated leather-bound porch guestbook.'
      ]
    }
  },
  {
    id: 'care-nature',
    category: 'nature',
    categoryLabel: 'Botany & Seed Saving',
    categoryIcon: 'leaf',
    mode: 'care',
    title: 'Waist-High Heirloom Botany & Seed Saving',
    prompt: 'Safely support a 75-year-old grandmother recovering from a hip fracture in waist-high seed propagation, pressing botanical specimens, and herbal tea drying with family respite handoffs.',
    recommendedStrategies: ['what-if', 'butterfly', 'kinship-triad', 'burnout-shield'],
    gist: 'Redefining garden passion to eliminate bending hazards through table-height seed sorting and heirloom cataloging.',
    domainContext: {
      identityAssets: 'Master gardener and botanist — deep knowledge of plant species, seed viability, and natural teas.',
      ecosystem: 'Waist-high redwood garden planter beds, non-slip cedar pathway mats, and roll-away potting carts at standard table height.',
      relational: 'Granddaughter gathers flowers and pressings; daughter supports watering setup; neighbor volunteer co-leads weekly 3-hour garden club to protect caregiver respite.',
      perspectives: 'Orthopedic PT (hip precaution adherence & no bending past 90 degrees) + Elder (eager to work with plants) + Granddaughter (learning botany names).',
      sampleInterventions: [
        'Elevate all potting soil and seed-sorting trays to a 32-inch standing table with cushioned barstool support.',
        'Install auto-retracting lightweight drip hoses at waist height to eliminate heavy watering can lifts.',
        'Maintain a 3-hour weekly garden cooperative with neighbors to ensure protected caregiver respite.'
      ]
    }
  },

  // ── Creative Mode Scenarios ──────────────────────────────────────
  {
    id: 'creative-civic',
    category: 'civic',
    categoryLabel: 'Civic Resilience',
    categoryIcon: 'home',
    mode: 'creative',
    title: 'Sponge-City Municipal Food Forest',
    prompt: 'Designing a self-sustaining municipal park that doubles as an absorbent flood barrier, native bio-swale, and community agricultural commons.',
    recommendedStrategies: ['nature', 'combinatorial', 'fmea-risk'],
    gist: 'Harmonizing flood engineering with hyper-local food sovereignty and public park space.',
  },
  {
    id: 'creative-eco',
    category: 'eco',
    categoryLabel: 'Biomimicry & Clean Power',
    categoryIcon: 'leaf',
    mode: 'creative',
    title: 'Whale-Fin Micro Wind Generators',
    prompt: 'Designing quiet, low-speed urban wind turbines modeled after humpback whale fin tubercles to generate clean power on residential apartment rooftops.',
    recommendedStrategies: ['nature', 'what-if', 'first-principles'],
    gist: 'Borrowing hydrodynamic efficiency from ocean giants to solve aerodynamic stalling in gusty cities.',
  },
  {
    id: 'creative-craft',
    category: 'craft',
    categoryLabel: 'Intergenerational Maker Space',
    categoryIcon: 'tool',
    mode: 'creative',
    title: 'Elder Machinists Meet Youth Coders',
    prompt: 'Creating a neighborhood repair café and assistive-device laboratory where retired machinists and youth coders co-design custom accessibility gadgets.',
    recommendedStrategies: ['unlikely-alliances', 'combinatorial', 'child'],
    gist: 'Fusing traditional tactile metalworking and woodworking with 3D printing and microcontrollers.',
  },
  {
    id: 'creative-astronomy',
    category: 'astronomy',
    categoryLabel: 'Circadian Architecture',
    categoryIcon: 'sparkles',
    mode: 'creative',
    title: 'Dynamic Heliostat Sunlight Sanctuaries',
    prompt: 'Architecting a public winter reading pavilion that uses automated heliostat mirrors and circadian light spectrums to banish seasonal fatigue and nurture community warmth.',
    recommendedStrategies: ['sensory-bridge', 'future', 'constraints'],
    gist: 'Bending natural sunlight into urban depths to revitalize public mental health in cold seasons.',
  }
];
