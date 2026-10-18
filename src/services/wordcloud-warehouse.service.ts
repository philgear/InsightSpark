import { Injectable, signal } from '@angular/core';
import { CreativeStrategy, InsightResult, StructuredProblem, CarePlan, CreativePlan, SavedInsight } from '../models/creative-types';

export interface WordCloudToken {
  word: string;
  weight: number;
  category: 'noun-anchor' | 'mechanism' | 'sensory' | 'human-circle' | 'axis-pole';
  colorClass: string;
}

export interface StrategyLensBlueprint {
  id: string;
  operatorVerb: string;
  mechanismFrame: (anchors: string[], axisLabel: string, axisMechanism: string, realistTone: 'practical' | 'balanced' | 'bold') => string;
  tractionFrame: (anchors: string[], bridgeConcept: string, axisLabel: string) => string;
  careInfluence: string;
  domainLexicon: string[];
}

const STOP_WORDS = new Set([
  'that', 'this', 'with', 'from', 'into', 'your', 'have', 'more', 'when', 'will',
  'they', 'them', 'while', 'where', 'which', 'their', 'about', 'instead', 'rather',
  'than', 'every', 'these', 'those', 'using', 'uses', 'used', 'make', 'making',
  'build', 'building', 'design', 'designing', 'architect', 'architecting', 'create',
  'creating', 'help', 'helping', 'need', 'needs', 'want', 'wants', 'like', 'some',
  'what', 'how', 'can', 'could', 'would', 'should', 'for', 'and', 'the', 'are', 'not',
  'over', 'under', 'between', 'through', 'during', 'before', 'after', 'above', 'below',
  'public', 'local', 'daily', 'weekly', 'person', 'people', 'system', 'systems',
  'banish', 'nurture', 'foster', 'support', 'supporting', 'around', 'within'
]);

const AXIS_LENS_OVERRIDES: Record<number, {
  axisName: string;
  craftMechanism: string;
  bannedHazard: string;
  vocabulary: string[];
}> = {
  0: {
    axisName: 'High-Craft Precision',
    craftMechanism: 'measurable physical tolerances, tool-free joinery, and zero-grid mechanical simplicity',
    bannedHazard: 'Generic AI Slop',
    vocabulary: ['counterweight', 'modular-latch', 'passive-gravity', 'tolerance', 'unit-cost']
  },
  1: {
    axisName: 'Falsifiable Thesis (H₀)',
    craftMechanism: 'a 48-hour benchtop stress-test with explicit failure thresholds before full installation',
    bannedHazard: 'Uncalibrated Hype',
    vocabulary: ['baseline-test', 'failure-threshold', 'sensor-check', 'pre-mortem', 'control-trial']
  },
  2: {
    axisName: 'Caslon Editorial Calm',
    craftMechanism: 'quiet tactile signage, warm glare-free acoustics, and zero digital screen clutter',
    bannedHazard: 'Chatty Filler',
    vocabulary: ['warm-paper', 'brass-placard', 'acoustic-felt', 'unhurried-cadence', 'wayfinding']
  },
  3: {
    axisName: 'Combinatorial Synthesis',
    craftMechanism: 'cross-pollinating botanical adaptation, passive solar optics, and neighborhood tool libraries',
    bannedHazard: 'Predictable Orthodoxy',
    vocabulary: ['biomimetic-hinge', 'heliostat-baffle', 'mycelium-panel', 'seed-library', 'thermal-mass']
  },
  4: {
    axisName: 'Dignity & Kinship Agency',
    craftMechanism: 'shared multi-generational stewardship where elders mentor youth and caregivers get protected respite',
    bannedHazard: 'Prescriptive Paternalism',
    vocabulary: ['elder-mentor', 'youth-apprentice', 'respite-handoff', 'voluntary-choice', 'shared-table']
  },
  5: {
    axisName: '4-Slot Cognitive Calm',
    craftMechanism: 'chunking the physical environment into 3 color-coded stations with a single clear action per station',
    bannedHazard: 'Cognitive Overload',
    vocabulary: ['three-station', 'tactile-cue', 'single-lever', 'calm-boundary', '15-minute-pace']
  }
};

const STRATEGY_BLUEPRINTS: Record<string, StrategyLensBlueprint> = {
  'constraints': {
    id: 'constraints',
    operatorVerb: 'Zero-Budget Constraint Inversion',
    mechanismFrame: (a, _axis, mech) =>
      `Eliminate motorized electronics from ${a[0]}: replace fragile actuators in ${a[1]} with passive bimetallic thermal coils or counterweighted cords anchored in ${mech}.`,
    tractionFrame: (a, bridge, axis) =>
      `Build a $25 tabletop mock-up of ${a[0]} and ${a[2]} using hardware-store pulleys and angled reflective panels to validate ${axis} (${bridge}).`,
    careInfluence: 'Accomplishment (A) & Autonomy: Removes fragile maintenance burdens so anyone can operate the space safely.',
    domainLexicon: ['passive-coil', 'counterweight', 'zero-motor', 'hardware-store', 'manual-lever']
  },
  'future': {
    id: 'future',
    operatorVerb: '10-Year Solstice Stewardship Horizon',
    mechanismFrame: (a, _axis, mech) =>
      `Design ${a[0]} and ${a[1]} to age like a living botanical clock: use durable cedar and brass solstice markers that track seasonal angles around ${a[2]} through ${mech}.`,
    tractionFrame: (a, bridge) =>
      `Install a Year-1 seasonal logbook and weatherproof sundial gauge at the entrance of ${a[0]} so neighbors record how ${a[1]} shifts each winter week (${bridge}).`,
    careInfluence: 'Meaning (M) & Continuity: Anchors today’s effort in a multi-year neighborhood tradition.',
    domainLexicon: ['solstice-dial', '10-year-patina', 'seasonal-logbook', 'heirloom-timber', 'generational-steward']
  },
  'sensory-bridge': {
    id: 'sensory-bridge',
    operatorVerb: 'Multimodal Acoustic & Circadian Sanctuary',
    mechanismFrame: (a, _axis, mech) =>
      `Bounce warm 2700K amber light off matte lime-washed timber baffles around ${a[0]} and ${a[1]} to eliminate harsh glare while pairing ${a[2]} with wool acoustic felt and cedar aroma (${mech}).`,
    tractionFrame: (a, _bridge, axis) =>
      `Set up a 2-chair sensory test corner for ${a[0]} with a lux meter and warm herbal tea station to tune glare-free comfort under ${axis}.`,
    careInfluence: 'Vitality (+H) & Positive Emotion (P): Soothes nervous-system fatigue via warm optics, tactile timber, and quiet acoustics.',
    domainLexicon: ['2700K-amber', 'matte-baffle', 'acoustic-felt', 'cedar-aroma', 'glare-free-lux']
  },
  'what-if': {
    id: 'what-if',
    operatorVerb: 'Provocative Assumption Flip',
    mechanismFrame: (a, _axis, mech) =>
      `What if ${a[0]} required zero grid power and zero staff? Let visitors naturally power or align ${a[1]} simply by opening the door or sitting in a weighted reading chair (${mech}).`,
    tractionFrame: (a, bridge) =>
      `Test the single boldest assumption behind ${a[0]} and ${a[2]} with a 48-hour cardboard-and-mirror prototype (${bridge}).`,
    careInfluence: 'Positive Emotion (P) & Curiosity: Turns a rigid barrier into a playful, low-stakes experiment.',
    domainLexicon: ['assumption-flip', 'door-actuated', 'visitor-powered', 'zero-grid', 'playful-trial']
  },
  'butterfly': {
    id: 'butterfly',
    operatorVerb: 'Micro-Lever Cascade',
    mechanismFrame: (a, _axis, mech) =>
      `Instead of re-engineering the entire ${a[0]} at once, place one high-reflectance copper or birch light-shelf right beside ${a[1]} so a 5-degree tilt warms the whole ${a[2]} zone via ${mech}.`,
    tractionFrame: (a, bridge) =>
      `Deploy a single 15-minute micro-intervention on ${a[0]} this week and measure the ripple effect on ${a[2]} (${bridge}).`,
    careInfluence: 'Engagement (E): Smallest physical adjustment that triggers the largest comfort cascade.',
    domainLexicon: ['micro-tilt', 'light-shelf', '5-degree-lever', 'ripple-effect', 'low-friction']
  },
  'first-principles': {
    id: 'first-principles',
    operatorVerb: 'Irreducible Physics & Human Truth',
    mechanismFrame: (a, _axis, mech) =>
      `Strip ${a[0]} down to pure thermodynamics and optics: capture direct southern rays via ${a[1]} into dark soapstone or water-filled thermal benches that radiate gentle warmth for ${a[2]} (${mech}).`,
    tractionFrame: (a, _bridge, axis) =>
      `Measure the raw baseline temperature and light angle of ${a[0]} at 9 AM, 12 PM, and 3 PM to anchor ${axis} in direct physical data.`,
    careInfluence: 'Health (+H): Grounds comfort in fundamental biomechanics, heat retention, and natural light.',
    domainLexicon: ['thermal-mass', 'soapstone-bench', 'southern-azimuth', 'raw-baseline', 'passive-physics']
  },
  'nature': {
    id: 'nature',
    operatorVerb: 'Biomimetic Structural Adaptation',
    mechanismFrame: (a, _axis, mech) =>
      `Model ${a[0]} and ${a[1]} on Arctic poppy heliotropism and honeycomb air-pockets: use double-walled translucent polycarbonate cells that trap warm air while diffusing light across ${a[2]} (${mech}).`,
    tractionFrame: (a, bridge) =>
      `Prototype a cellular thermal window baffle for ${a[0]} inspired by botanical leaf venation (${bridge}).`,
    careInfluence: 'Vitality (+H): Aligns human recovery spaces with living biological rhythms.',
    domainLexicon: ['heliotropism', 'honeycomb-cell', 'leaf-venation', 'thermal-pocket', 'biomimicry']
  },
  'combinatorial': {
    id: 'combinatorial',
    operatorVerb: 'Cross-Domain Isomorphism',
    mechanismFrame: (a, _axis, mech) =>
      `Fuse maritime lighthouse Fresnel lenses with traditional Japanese shoji paper screens so ${a[0]} and ${a[1]} scatter concentrated winter beams into soft, shadow-free warmth for ${a[2]} (${mech}).`,
    tractionFrame: (a, bridge) =>
      `Pair a translucent shoji diffuser screen with ${a[1]} to turn harsh reflections into calm reading light (${bridge}).`,
    careInfluence: 'Engagement (E) & Creativity: Combines proven craft traditions from two unrelated fields.',
    domainLexicon: ['fresnel-prism', 'shoji-diffuser', 'maritime-optics', 'craft-fusion', 'shadow-free']
  },
  'simplify': {
    id: 'simplify',
    operatorVerb: 'Subtractive Radical Simplicity',
    mechanismFrame: (a, _axis, mech) =>
      `Cut 70% of moving parts from ${a[0]}: use 3 fixed-angle winter mirrors pre-aimed for November, December, and January so ${a[1]} delivers ${a[2]} with zero software or motors (${mech}).`,
    tractionFrame: (a, _bridge, axis) =>
      `Write the entire operating guide for ${a[0]} on a single 3-step brass plaque beside ${a[1]} (${axis}).`,
    careInfluence: '4-Slot Cognitive Calm: Eliminates setup friction and decision fatigue.',
    domainLexicon: ['fixed-azimuth', 'zero-software', 'three-step-plaque', 'subtractive-design', 'maintenance-free']
  },
  'opposite': {
    id: 'opposite',
    operatorVerb: '180° Polarity Inversion',
    mechanismFrame: (a, _axis, mech) =>
      `Invert the direction of ${a[0]}: instead of bringing people inside a fixed shell for ${a[1]}, mount portable reflective sun-sails on rolling garden carts that bring ${a[2]} directly to outdoor benches (${mech}).`,
    tractionFrame: (a, bridge) =>
      `Run a 1-day inverted trial where ${a[1]} moves to the visitors rather than visitors moving to ${a[0]} (${bridge}).`,
    careInfluence: 'Relationships (R) & Agency: Meets people exactly where they already gather.',
    domainLexicon: ['polarity-flip', 'rolling-sun-sail', 'mobile-hearth', 'inside-out', 'street-level']
  },
  'child': {
    id: 'child',
    operatorVerb: 'Tactile Play & Curious Wonder',
    mechanismFrame: (a, _axis, mech) =>
      `Make the physics of ${a[0]} visibly playful: add a safe hand-cranked prism wheel and painted floor sun-tracks so kids and elders can steer ${a[1]} and watch ${a[2]} dance across the room (${mech}).`,
    tractionFrame: (a, bridge) =>
      `Invite a 10-year-old and a grandparent to test ${a[0]} together for 15 minutes—keep whatever makes them smile immediately (${bridge}).`,
    careInfluence: 'Positive Emotion (P) & Play: Replaces intimidating technical controls with intuitive curiosity.',
    domainLexicon: ['prism-wheel', 'floor-sun-track', 'tactile-crank', 'intergenerational-play', 'visible-wonder']
  },
  'alien': {
    id: 'alien',
    operatorVerb: 'Exo-Anthropological First-Contact Lens',
    mechanismFrame: (a, _axis, mech) =>
      `Observe ${a[0]} as an outsider studying human winter hibernation: treat ${a[1]} not as architecture, but as a communal "photon hearth" where people gather around ${a[2]} the way ancient villages gathered around fire (${mech}).`,
    tractionFrame: (a, bridge) =>
      `Arrange seating in ${a[0]} in a warm circular amphitheater around the brightest focal point of ${a[1]} rather than isolated rows (${bridge}).`,
    careInfluence: 'Relationships (R): Re-centers shared human gathering over sterile geometry.',
    domainLexicon: ['photon-hearth', 'circular-council', 'hibernation-antidote', 'ritual-warmth', 'social-orbit']
  },
  'superpower': {
    id: 'superpower',
    operatorVerb: 'Frictionless Ergonomic Amplification',
    mechanismFrame: (a, _axis, mech) =>
      `Give every visitor effortless command over ${a[0]}: mount feather-light counterbalanced louvers on ${a[1]} so a single finger-touch tunes ${a[2]} from bright reading clarity to cozy amber rest (${mech}).`,
    tractionFrame: (a, bridge) =>
      `Add a tactile rotary dimmer dial at armrest height in ${a[0]} so seated readers can adjust ${a[1]} without standing or straining (${bridge}).`,
    careInfluence: 'Agency & Dignity: Restores effortless control for people with limited mobility or tremor.',
    domainLexicon: ['feather-counterbalance', 'armrest-dial', 'one-finger-louver', 'zero-strain', 'adaptive-control']
  },
  'random': {
    id: 'random',
    operatorVerb: 'Stochastic Bisociation Spark ("Accordion / Greenhouse")',
    mechanismFrame: (a, _axis, mech) =>
      `Collide ${a[0]} with an "Accordion Bellows": use folding pleated timber-and-felt screens around ${a[1]} that expand on freezing days to trap ${a[2]} into intimate, draft-free reading nooks (${mech}).`,
    tractionFrame: (a, bridge) =>
      `Test a hinged 3-panel folding acoustic/thermal screen beside ${a[0]} to let visitors shape their own micro-climate (${bridge}).`,
    careInfluence: 'Engagement (E): Uses unexpected structural analogy to unlock adaptable comfort.',
    domainLexicon: ['accordion-baffle', 'pleated-nook', 'micro-climate-screen', 'bisociation-bridge', 'folding-shelter']
  },
  'root-cause': {
    id: 'root-cause',
    operatorVerb: '5-Whys Root Bottleneck Excavation',
    mechanismFrame: (a, _axis, mech) =>
      `Trace the true root of winter isolation in ${a[0]}: people avoid cold spaces not just from low light, but from cold floors and drafty ankles—pair overhead ${a[1]} with radiant heated footrests to deliver true ${a[2]} (${mech}).`,
    tractionFrame: (a, bridge) =>
      `Add insulated cork floor mats and heated stone foot-warmers under the primary chairs of ${a[0]} before tuning ${a[1]} (${bridge}).`,
    careInfluence: 'Health (+H): Solves the underlying physiological trigger of cold-weather tension.',
    domainLexicon: ['radiant-footrest', 'cork-insulation', 'draft-seal', '5-whys-root', 'conductive-warmth']
  },
  'found-kinship': {
    id: 'found-kinship',
    operatorVerb: 'Chosen Community & Neighbor Mesh',
    mechanismFrame: (a, _axis, mech) =>
      `Turn ${a[0]} into a neighborhood mutual-aid anchor: pair ${a[1]} with a "Leave a Book, Brew a Pot" community table where solo seniors and remote workers share ${a[2]} without needing formal invitations (${mech}).`,
    tractionFrame: (a, bridge) =>
      `Establish a Tuesday/Thursday 2 PM "Warm Light & Quiet Company" hour at ${a[0]} hosted by two rotating neighborhood volunteers (${bridge}).`,
    careInfluence: 'Relationships (R): Builds chosen family and relieves primary caregiver isolation.',
    domainLexicon: ['mutual-aid-table', 'quiet-company-hour', 'neighbor-steward', 'chosen-kinship', 'social-warmth']
  },
  'time-dilation': {
    id: 'time-dilation',
    operatorVerb: 'Temporal Cadence & Slow-Time Sanctuary',
    mechanismFrame: (a, _axis, mech) =>
      `Slow down subjective time inside ${a[0]}: synchronize ${a[1]} with the gradual arc of the sun so ${a[2]} shifts imperceptibly over 45-minute chapters, free of ticking clocks or harsh notifications (${mech}).`,
    tractionFrame: (a, bridge) =>
      `Replace digital clocks in ${a[0]} with a warm 45-minute sandglass and gentle shadow-line markers driven by ${a[1]} (${bridge}).`,
    careInfluence: '4-Slot Calm & Vitality (+H): Downregulates hurried cortisol rhythms into unhurried restorative flow.',
    domainLexicon: ['45m-sandglass', 'solar-arc-pace', 'unhurried-chapter', 'slow-time-nook', 'cortisol-downshift']
  },
  'boundary-dissolution': {
    id: 'boundary-dissolution',
    operatorVerb: 'DSRP Distinctions (D) — Dissolving Rigid Borders',
    mechanismFrame: (a, _axis, mech) =>
      `Dissolve the wall between indoor library and outdoor winter garden in ${a[0]}: extend ${a[1]} across a sheltered glass-and-cedar threshold with hardy winter jasmine and rosemary so ${a[2]} begins on the sidewalk (${mech}).`,
    tractionFrame: (a, bridge) =>
      `Place a warm reflected sun-patch and cedar bench just outside the entrance of ${a[0]} to welcome hesitant passersby (${bridge}).`,
    careInfluence: 'Distinctions (D): Erases intimidating institutional thresholds so everyone feels invited.',
    domainLexicon: ['threshold-garden', 'indoor-outdoor-seam', 'sidewalk-sun-patch', 'borderless-welcome', 'dsrp-distinction']
  },
  'system-fractal': {
    id: 'system-fractal',
    operatorVerb: 'DSRP Systems (S) — Micro-to-Macro Fractal Scaling',
    mechanismFrame: (a, _axis, mech) =>
      `Design ${a[0]} as a 1:10 fractal kit: every optical joint in ${a[1]} and every seat in ${a[2]} is mirrored in take-home window reflector kits that neighbors can clip onto their own apartment sills (${mech}).`,
    tractionFrame: (a, bridge) =>
      `Create a flat-pack cardboard-and-Mylar "Window Sun-Catcher" template at ${a[0]} so visitors can replicate ${a[1]} at home (${bridge}).`,
    careInfluence: 'Systems (S): Connects the public sanctuary to home-bound recovery ecosystems.',
    domainLexicon: ['1-to-10-fractal', 'sill-reflector-kit', 'home-extension', 'modular-blueprint', 'dsrp-systems']
  },
  'feedback-loop': {
    id: 'feedback-loop',
    operatorVerb: 'DSRP Relationships (R) — Virtuous Regenerative Loop',
    mechanismFrame: (a, _axis, mech) =>
      `Create a self-reinforcing warmth loop in ${a[0]}: excess midday solar heat from ${a[1]} warms phase-change beeswax or water cylinders inside the bookshelves, which release steady evening ${a[2]} after sunset (${mech}).`,
    tractionFrame: (a, bridge) =>
      `Tuck dark water-filled thermal carafes along the sunlit shelf of ${a[0]} to store daytime ${a[1]} energy for late-afternoon readers (${bridge}).`,
    careInfluence: 'Relationships (R): Turns peak daytime abundance into evening comfort.',
    domainLexicon: ['thermal-battery-shelf', 'day-to-dusk-loop', 'heat-retention', 'regenerative-cycle', 'dsrp-relationship']
  },
  'perspective-inversion': {
    id: 'perspective-inversion',
    operatorVerb: 'DSRP Perspectives (P) — Multi-Stakeholder Triad Lens',
    mechanismFrame: (a, _axis, mech) =>
      `View ${a[0]} simultaneously through 3 eyes: the Migratory Songbird (bird-safe frit patterns on ${a[1]}), the Low-Vision Elder (high-contrast glare-free ${a[2]}), and the Municipal Groundskeeper (zero-ladder ground access via ${mech}).`,
    tractionFrame: (a, bridge) =>
      `Walk through ${a[0]} seated in a wheelchair and wearing frosted glasses to verify ${a[1]} and ${a[2]} work for every body (${bridge}).`,
    careInfluence: 'Perspectives (P): Harmonizes ecological safety, disability accessibility, and maintenance ease.',
    domainLexicon: ['bird-safe-optics', 'seated-sightline', 'ground-level-service', 'triad-empathy', 'dsrp-perspective']
  },
  'fmea': {
    id: 'fmea',
    operatorVerb: '72-Hour Failure-Mode Pre-Mortem (FMEA)',
    mechanismFrame: (a, _axis, mech) =>
      `Pre-mortem hazard on ${a[0]}: frost buildup, wind gusts, or blinding glare from ${a[1]} disrupting ${a[2]}. Guardrail: add hooded matte louvers, a mechanical wind-release clutch, and ${mech}.`,
    tractionFrame: (a, _bridge, axis) =>
      `Run a 3-point safety & glare walkthrough on ${a[0]} during overcast and bright hours to verify ${axis}.`,
    careInfluence: 'Safety & Respite Protection: Prevents predictable breakdowns before anyone experiences strain.',
    domainLexicon: ['glare-louver', 'frost-drain', 'wind-clutch', 'pre-mortem-shield', 'fail-safe']
  },
  'critical-path': {
    id: 'critical-path',
    operatorVerb: 'Dependency-Locked Sequence',
    mechanismFrame: (a, _axis, mech) =>
      `Sequence ${a[0]} strictly by physical bottlenecks: Step 1 maps winter shadow corridors; Step 2 anchors ${a[1]} mounts; Step 3 tunes ${a[2]} seating ergonomics (${mech}).`,
    tractionFrame: (a, bridge) =>
      `Complete Step 1 (site shadow & pathway clearance for ${a[0]}) in 48 hours before ordering any hardware for ${a[1]} (${bridge}).`,
    careInfluence: 'Accomplishment (A): Clear, unhurried 1-2-3 milestone progression.',
    domainLexicon: ['shadow-map', 'step-1-clearance', 'dependency-lock', 'milestone-gate', 'critical-sequence']
  },
  'kinship-triad': {
    id: 'kinship-triad',
    operatorVerb: '3-Generation Kinship Mesh',
    mechanismFrame: (a, _axis, mech) =>
      `Co-steward ${a[0]} across 3 generations: youth adjust the morning ${a[1]} dial, elders curate the ${a[2]} story shelf, and primary caregivers enjoy a guaranteed 3-hour respite window (${mech}).`,
    tractionFrame: (a, bridge) =>
      `Host a Saturday 45-minute intergenerational circle at ${a[0]} with clear, joyful roles for kids, parents, and grandparents (${bridge}).`,
    careInfluence: 'Relationships (R) & Respite: Distributes care across generations so no single person carries 100% of the load.',
    domainLexicon: ['3-gen-circle', 'elder-curator', 'youth-navigator', 'protected-respite', 'shared-hearth']
  },
  'perma-strengths': {
    id: 'perma-strengths',
    operatorVerb: 'VIA Signature Strengths & PERMA+H Asset Frame',
    mechanismFrame: (a, _axis, mech) =>
      `Anchor ${a[0]} in neighborhood signature strengths (Curiosity, Appreciation of Beauty, Kindness): invite local woodworkers and readers to co-shape ${a[1]} and ${a[2]} via ${mech}.`,
    tractionFrame: (a, bridge) =>
      `Pair each functional zone of ${a[0]} with a community volunteer’s favorite craft or storytelling skill (${bridge}).`,
    careInfluence: 'PERMA+H Flourishing: Centers dignity, capability, and intrinsic joy.',
    domainLexicon: ['signature-strength', 'craft-pride', 'intrinsic-joy', 'asset-framing', 'perma-vitality']
  },
  'respite-pacing': {
    id: 'respite-pacing',
    operatorVerb: 'Autonomic & Caregiver Respite Pacing',
    mechanismFrame: (a, _axis, mech) =>
      `Build natural 45-minute restoration cycles into ${a[0]}: pair ${a[1]} with a quiet acoustic chime and warm tea alcove so ${a[2]} protects caregiver rest and nervous-system calm (${mech}).`,
    tractionFrame: (a, bridge) =>
      `Schedule a recurring 3.5-hour weekly caregiver handoff rotation anchored around ${a[0]} (${bridge}).`,
    careInfluence: 'Health (+H) & Respite Invariant: Guarantees guilt-free recovery windows.',
    domainLexicon: ['45m-cadence', 'respite-rotation', 'vagal-calm', 'tea-alcove', 'energy-envelope']
  },
  'ethical-dignity': {
    id: 'ethical-dignity',
    operatorVerb: 'Nothing About Me Without Me — Autonomy Guard',
    mechanismFrame: (a, _axis, mech) =>
      `Ensure ${a[0]} and ${a[1]} never force a single sensory setting on visitors: provide both high-luminance daylight tables and dim, quiet alcoves for ${a[2]} with zero surveillance or gatekeeping (${mech}).`,
    tractionFrame: (a, bridge) =>
      `Co-review the layout of ${a[0]} with neurodivergent readers and elders with photophobia to guarantee voluntary choice (${bridge}).`,
    careInfluence: 'Dignity & Civil Autonomy: Preserves voluntary agency and sensory self-determination.',
    domainLexicon: ['voluntary-choice', 'sensory-autonomy', 'zero-surveillance', 'dignity-first', 'inclusive-alcove']
  },
  'environmental-safety': {
    id: 'environmental-safety',
    operatorVerb: '72h Biomechanical & Environmental Clearance',
    mechanismFrame: (a, _axis, mech) =>
      `Engineer ${a[0]} for zero-trip, zero-glare physical safety: recess all ${a[1]} mounts flush into the ceiling, provide 36-inch walker clearance, and use non-slip warm timber flooring for ${a[2]} (${mech}).`,
    tractionFrame: (a, bridge) =>
      `Verify 18-inch seated knee clearance, sturdy armrests, and matte indirect bounce angles for ${a[1]} before opening ${a[0]} (${bridge}).`,
    careInfluence: 'Environmental Safety: Eliminates fall and glare hazards before they can occur.',
    domainLexicon: ['36in-clearance', 'non-slip-timber', 'flush-mount', 'sturdy-armrest', 'matte-bounce']
  },
  'porters-five-forces': {
    id: 'porters-five-forces',
    operatorVerb: 'Civic Sustainability & Resource Resilience',
    mechanismFrame: (a, _axis, mech) =>
      `Insulate ${a[0]} from vendor lock-in and municipal budget cuts: build ${a[1]} using standard local lumber and off-the-shelf mirrors so neighborhood stewards can maintain ${a[2]} for pennies (${mech}).`,
    tractionFrame: (a, bridge) =>
      `Partner with a local library branch and hardware co-op to co-sponsor ${a[0]} consumables at zero recurring cost (${bridge}).`,
    careInfluence: 'Systemic Sustainability: Keeps the community sanctuary thriving without fragile funding dependencies.',
    domainLexicon: ['zero-lock-in', 'standard-lumber', 'library-co-op', 'low-opex', 'civic-resilience']
  }
};

@Injectable({
  providedIn: 'root',
})
export class WordCloudWarehouseService {
  readonly activeWordCloud = signal<WordCloudToken[]>([]);
  readonly lastSynthesisMetadata = signal<{
    dominantAxisName: string;
    bannedHazard: string;
    realismLevel: string;
    strategyCount: number;
  } | null>(null);

  /**
   * Extracts a ranked semantic WordCloud from the user's prompt + active 6-Axis Calibrator + selected strategies.
   */
  extractWordCloud(
    problem: string,
    strategies: CreativeStrategy[],
    axisIndex = 0
  ): WordCloudToken[] {
    const rawWords = (problem.match(/[A-Za-z0-9-]+/g) || [])
      .map(w => w.toLowerCase())
      .filter(w => w.length >= 4 && !STOP_WORDS.has(w));

    const freq = new Map<string, number>();
    for (const w of rawWords) {
      freq.set(w, (freq.get(w) || 0) + 1);
    }

    const cleanSentences = problem
      .replace(/[.,;:!?()"]/g, ' ')
      .split(/\s+/)
      .filter(Boolean);
    const phrases: string[] = [];
    for (let i = 0; i < cleanSentences.length - 1; i++) {
      const w1 = cleanSentences[i].toLowerCase();
      const w2 = cleanSentences[i + 1].toLowerCase();
      if (w1.length >= 4 && w2.length >= 4 && !STOP_WORDS.has(w1) && !STOP_WORDS.has(w2)) {
        phrases.push(`${w1} ${w2}`);
      }
    }

    const tokens: WordCloudToken[] = [];
    const seen = new Set<string>();

    // 1. Add top compound phrases from user prompt (highest weight)
    for (const phrase of phrases.slice(0, 4)) {
      if (!seen.has(phrase)) {
        seen.add(phrase);
        tokens.push({
          word: phrase,
          weight: 1.0,
          category: 'noun-anchor',
          colorClass: 'text-emerald-300 border-emerald-500/40 bg-emerald-500/15'
        });
      }
    }

    // 2. Add single salient keywords from user prompt
    const sortedWords = Array.from(freq.entries())
      .sort((a, b) => b[1] - a[1] || b[0].length - a[0].length)
      .map(([w]) => w);

    for (const word of sortedWords.slice(0, 6)) {
      if (!seen.has(word)) {
        seen.add(word);
        const isSensory = /light|warm|sound|circadian|solar|winter|garden|music|scent|mirror|heliostat|pavilion|reading/i.test(word);
        tokens.push({
          word,
          weight: isSensory ? 0.92 : 0.85,
          category: isSensory ? 'sensory' : 'mechanism',
          colorClass: isSensory
            ? 'text-amber-300 border-amber-500/40 bg-amber-500/15'
            : 'text-cyan-300 border-cyan-500/40 bg-cyan-500/15'
        });
      }
    }

    // 3. Inject active 6-Axis Calibrator vocabulary
    const axisInfo = AXIS_LENS_OVERRIDES[axisIndex % 6] || AXIS_LENS_OVERRIDES[0];
    for (const axWord of axisInfo.vocabulary.slice(0, 3)) {
      if (!seen.has(axWord)) {
        seen.add(axWord);
        tokens.push({
          word: axWord,
          weight: 0.88,
          category: 'axis-pole',
          colorClass: 'text-purple-300 border-purple-500/40 bg-purple-500/15'
        });
      }
    }

    // 4. Inject Strategy-Specific Lexicon Clouds
    for (const s of strategies) {
      const bp = STRATEGY_BLUEPRINTS[s.id];
      const lex = bp ? bp.domainLexicon.slice(0, 2) : [s.id];
      for (const lw of lex) {
        if (!seen.has(lw)) {
          seen.add(lw);
          tokens.push({
            word: lw,
            weight: 0.80,
            category: 'human-circle',
            colorClass: 'text-rose-300 border-rose-500/40 bg-rose-500/15'
          });
        }
      }
    }

    this.activeWordCloud.set(tokens.slice(0, 16));
    return tokens;
  }

  /**
   * Synthesizes bespoke, non-overlapping insights for each chosen strategy by combining:
   *  1. The user's extracted prompt anchors (noun phrases & mechanisms)
   *  2. Each strategy's unique structural operator (never repeating across strategies)
   *  3. The active 6-Axis Brand & Strategy Calibrator pole & Idea Style ('practical' | 'balanced' | 'bold')
   */
  synthesizeFromWarehouse(
    problem: string,
    strategies: CreativeStrategy[],
    mode: 'creative' | 'care'
  ): InsightResult[] {
    const axisIndex = this.readFocusedAxisIndex();
    const realism = this.readRealismLevel();
    const axisInfo = AXIS_LENS_OVERRIDES[axisIndex] || AXIS_LENS_OVERRIDES[0];

    const cloud = this.extractWordCloud(problem, strategies, axisIndex);
    const promptAnchors = cloud
      .filter(t => t.category === 'noun-anchor' || t.category === 'sensory' || t.category === 'mechanism')
      .map(t => t.word);

    const a0 = promptAnchors[0] || 'the core space';
    const a1 = promptAnchors[1] || promptAnchors[0] || 'the primary mechanism';
    const a2 = promptAnchors[2] || promptAnchors[1] || 'community well-being';

    this.lastSynthesisMetadata.set({
      dominantAxisName: axisInfo.axisName,
      bannedHazard: axisInfo.bannedHazard,
      realismLevel: realism,
      strategyCount: strategies.length
    });

    const allStrategyNames = strategies.map(s => mode === 'care' ? (s.careModeName || s.name) : s.name);

    return strategies.map((strategy, idx) => {
      const strategyName = mode === 'care' ? (strategy.careModeName || strategy.name) : strategy.name;
      const partnerStrategy = allStrategyNames[(idx + 1) % allStrategyNames.length] || strategyName;
      const blueprint = STRATEGY_BLUEPRINTS[strategy.id];

      // Rotate anchor focus per strategy index so 3 chosen strategies inspect 3 distinct facets of the prompt
      const rotatedAnchors = [
        promptAnchors[idx % Math.max(1, promptAnchors.length)] || a0,
        promptAnchors[(idx + 1) % Math.max(1, promptAnchors.length)] || a1,
        promptAnchors[(idx + 2) % Math.max(1, promptAnchors.length)] || a2,
      ];

      if (blueprint) {
        const insight1Text = `[${blueprint.operatorVerb} · ${axisInfo.axisName}] ${blueprint.mechanismFrame(
          rotatedAnchors,
          axisInfo.axisName,
          axisInfo.craftMechanism,
          realism
        )}`;

        const bridgeLabel = strategies.length > 1
          ? `Synergy Bridge with ${partnerStrategy}`
          : `6-Axis ${axisInfo.axisName} Verification`;

        const insight2Text = blueprint.tractionFrame(rotatedAnchors, bridgeLabel, axisInfo.axisName);

        const lex0 = blueprint.domainLexicon[0] || strategy.id;
        const lex1 = blueprint.domainLexicon[1] || blueprint.domainLexicon[0] || 'tactile anchor';
        const lex2 = blueprint.domainLexicon[2] || axisInfo.vocabulary[0] || 'circadian rhythm';
        const insight3Text = `[WordCloud Lexicon: ${lex0} × ${lex1}] Ground "${rotatedAnchors[2]}" and "${rotatedAnchors[0]}" in ${lex2} (${axisInfo.axisName} pole)—replacing ${axisInfo.bannedHazard} with ${axisInfo.craftMechanism}.`;

        return {
          strategyName,
          insights: [
            {
              text: insight1Text,
              ...(mode === 'care' && { influence: blueprint.careInfluence })
            },
            {
              text: insight2Text,
              ...(mode === 'care' && {
                influence: `6-Axis Calibrated (${axisInfo.axisName}): Pairs ${strategyName} with ${partnerStrategy} while blocking ${axisInfo.bannedHazard}.`
              })
            },
            {
              text: insight3Text,
              ...(mode === 'care' && {
                influence: `Semantic Warehouse Anchor (${lex0} · ${lex1}): Preserves 4-Slot cognitive clarity and zero-friction sustainability.`
              })
            }
          ]
        };
      }

      const descSnippet = (mode === 'care' ? strategy.careModeDescription : strategy.description) || strategy.name;
      return {
        strategyName,
        insights: [
          {
            text: `[${strategyName} × ${axisInfo.axisName}] Apply ${descSnippet.charAt(0).toLowerCase() + descSnippet.slice(1).replace(/\.$/, '')} directly to "${rotatedAnchors[0]}" and "${rotatedAnchors[1]}", using ${axisInfo.craftMechanism}.`,
            ...(mode === 'care' && {
              influence: `PERMA+H & DSRP Alignment: Grounds ${strategyName} in tangible daily comfort and personal agency.`
            })
          },
          {
            text: `48-Hour Prototype (${strategyName} ↔ ${partnerStrategy}): Test a low-cost trial linking "${rotatedAnchors[1]}" with "${rotatedAnchors[2]}" using existing neighborhood materials before scaling.`,
            ...(mode === 'care' && {
              influence: `Protects caregiver respite while verifying ${axisInfo.axisName}.`
            })
          },
          {
            text: `[6-Axis ${axisInfo.axisName} Anchor] Weave "${rotatedAnchors[2]}" into "${rotatedAnchors[0]}" while eliminating ${axisInfo.bannedHazard}.`,
            ...(mode === 'care' && {
              influence: `Sustains long-term community vitality and multi-generational inclusion.`
            })
          }
        ]
      };
    });
  }

  synthesizeStructuredProblem(problem: string): StructuredProblem {
    const cloud = this.extractWordCloud(problem, [], this.readFocusedAxisIndex());
    const anchors = cloud.map(c => c.word);
    const a0 = anchors[0] || 'Community Sanctuary';
    const a1 = anchors[1] || 'Adaptive Environment';
    const a2 = anchors[2] || 'Shared Well-Being';

    return {
      title: `${a0.replace(/\b\w/g, c => c.toUpperCase())} & ${a1.replace(/\b\w/g, c => c.toUpperCase())}`,
      condition: `Systemic & Environmental Design (${a0})`,
      goal: problem.trim(),
      barriers: [
        `Mechanical or environmental friction around ${a0} and ${a1}`,
        `Preventing cognitive overload while keeping daily operation effortless`,
        `Protecting long-term stewardship and caregiver/volunteer energy`
      ],
      dsrp: {
        identityDistinctions: `Core human dignity and joy around "${a0}" — separating the lived community experience from technical complexity.`,
        systemicEcosystem: `Harmonizing "${a1}" and "${a2}" with circadian light, acoustic calm, and low-friction physical ergonomics.`,
        relationalBridge: `Multi-generational co-design: pairing youth curiosity, adult coordination, and elder wisdom around "${a0}".`,
        triadPerspectives: `Engineering Precision (${a1}) + Daily Human Comfort (${a2}) + 10-Year Neighborhood Resilience.`
      }
    };
  }

  synthesizeCarePlan(problem: string, insights: SavedInsight[]): CarePlan {
    const steps = insights.map(i => i.text);
    return {
      personGoal: problem.trim(),
      keyInterventions: steps.slice(0, 3).length ? steps.slice(0, 3) : [
        `Adapt the primary environment for "${problem.slice(0, 60)}" using zero-strain ergonomics.`
      ],
      monitoringPlan: [
        'Track daily comfort, energy, and engagement across 15-minute natural intervals.',
        'Verify glare-free lighting, clear pathways, and acoustic calm.',
        'Confirm primary caregiver receives 3.5+ hours of protected weekly respite.'
      ],
      guidanceAndEducation: [
        'Prioritize small, repeatable micro-wins over all-or-nothing schedules.',
        'Keep controls tactile, clearly labeled, and operable without digital friction.'
      ],
      positiveAchievements: [
        'Complete the first 48-hour low-friction trial with zero physical strain.',
        'Share a moment of multi-generational connection around the new setup.'
      ],
      recommendations: [
        'Review what felt most natural after 7 days and retire any unnecessary steps.'
      ],
      transitionChecklist: [
        '72-Hour Safety Check: Verify physical pathway clearance, lighting warmth (2700K), and stable seating.',
        'Align activity timing with natural peak energy windows.',
        'Post a simple 3-step visual handoff card for family and neighbors.'
      ],
      respiteClosureChecklist: [
        'Lock in a non-negotiable 3.5-hour weekly respite window for the primary caregiver.',
        'Designate a secondary family or neighbor partner for handoff coverage.',
        'Check caregiver fatigue weekly to keep the routine sustainable.'
      ]
    };
  }

  synthesizeCreativePlan(problem: string, insights: SavedInsight[]): CreativePlan {
    const axisInfo = AXIS_LENS_OVERRIDES[this.readFocusedAxisIndex()] || AXIS_LENS_OVERRIDES[0];
    const steps = insights.map((i, idx) => `${idx + 1}. [${i.strategyName}] ${i.text}`);
    return {
      conceptualGoal: `${problem.trim()} — Calibrated via ${axisInfo.axisName}`,
      criticalPath: steps.length ? steps : [
        `1. Map baseline physical constraints and extract core mechanisms.`,
        `2. Build a 48-hour benchtop mock-up using passive, low-cost materials.`,
        `3. Validate ergonomics and failure guardrails with real users.`
      ],
      riskAssessment: [
        `1. Over-engineering hazard (${axisInfo.bannedHazard}) — mitigate via ${axisInfo.craftMechanism}.`,
        `2. Maintenance & weather wear — mitigate with modular, tool-free replaceable parts.`
      ],
      requiredResources: [
        'Passive mechanical & optical hardware kit',
        'Warm 2700K circadian lighting & acoustic felt baffles',
        '3-step tactile wayfinding signage'
      ],
      milestones: [
        'Day 2: Tabletop proof-of-concept validated.',
        'Week 2: Full-scale single-station pilot live with community feedback.',
        'Month 2: Open-source blueprint documented for neighborhood replication.'
      ],
      nextSteps: [
        `Run the 48-hour prototype test from "${insights[0]?.strategyName || 'Primary Strategy'}".`,
        `Verify ${axisInfo.axisName} metrics with 3 real participants.`
      ]
    };
  }

  private readFocusedAxisIndex(): number {
    if (typeof localStorage === 'undefined') return 0;
    const directive = localStorage.getItem('spark_brand_steering') || '';
    if (directive.includes('Falsifiable Thesis')) return 1;
    if (directive.includes('Caslon Editorial')) return 2;
    if (directive.includes('Combinatorial Synthesis')) return 3;
    if (directive.includes('Dignity & Agency')) return 4;
    if (directive.includes('4-Slot Cognitive')) return 5;
    return 0;
  }

  private readRealismLevel(): 'practical' | 'balanced' | 'bold' {
    if (typeof localStorage === 'undefined') return 'practical';
    return (localStorage.getItem('spark_realism_level') as 'practical' | 'balanced' | 'bold') || 'practical';
  }
}
