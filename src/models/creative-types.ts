export interface CreativeStrategy {
  id: string;
  name: string;
  description: string;
  icon: string;
  color: string; // Storing the Hex code now
  category?: 'provocation' | 'anchor';
  careModeName?: string;
  careModeDescription?: string;
  agentPersona?: string; // Personality voice used in debate rounds
}

export interface CareRole {
  name: string;
  gist: string;
  icon: string;
  isCustom?: boolean;
  id?: string;
  category?: 'clinical' | 'support' | 'creative' | 'custom';
}

export interface InsightItem {
  text: string;
  influence?: string;
}

export interface InsightResult {
  strategyName: string;
  insights: InsightItem[];
}

export interface CarePlan {
  personGoal: string;
  keyInterventions: string[];
  monitoringPlan: string[];
  guidanceAndEducation: string[];
  positiveAchievements: string[];
  recommendations: string[];
  transitionChecklist?: string[];
  respiteClosureChecklist?: string[];
}

export interface CreativePlan {
  conceptualGoal: string;
  criticalPath: string[];
  riskAssessment: string[];
  requiredResources: string[];
  milestones: string[];
  nextSteps: string[];
}

export interface StructuredProblem {
  title: string;
  condition: string;
  goal: string;
  barriers: string[];
}

// A saved item can be one of two types, distinguished by the 'type' property.

export interface SavedInsight {
  type: 'insight';
  id: string;
  text: string;
  strategyName: string;
  problem: string; // This will always be the original, full text input
  structuredProblem?: StructuredProblem; // This will hold the chunked data in 'care' mode
  timestamp: number;
}

export interface SavedCarePlan {
  type: 'care-plan';
  id: string;
  problem: string; // This will always be the original, full text input
  structuredProblem?: StructuredProblem;
  timestamp: number;
  plan: CarePlan;
}

export interface SavedCreativePlan {
  type: 'creative-plan';
  id: string;
  problem: string; // This will always be the original, full text input
  timestamp: number;
  plan: CreativePlan;
}

export type SavedItem = SavedInsight | SavedCarePlan | SavedCreativePlan;


// Palette:
// #1C2B3C Architect's Ink
// #9D1F3B The Crucial Insight
// #FDD87A Aha! Moment
// #E8B9C8 Nostalgic Play
// #6C7A68 Logic Loom

export const STRATEGIES: CreativeStrategy[] = [
  { 
    id: 'what-if', 
    name: 'What If?', 
    description: 'Ask "what if" questions to break assumptions (e.g., What if cars didn\'t need roads?).', 
    icon: 'question', 
    color: '#9D1F3B',
    careModeName: 'Outcome Visualization',
    careModeDescription: "Let's explore 'What If' scenarios to imagine all possible positive outcomes for the person.",
    agentPersona: 'I challenge every assumption. If everyone agrees, I\'m suspicious. My power is in the question, not the answer.'
  },
  { 
    id: 'constraints', 
    name: 'Redefine Constraints', 
    description: 'Remove a key tool or resource. How do you achieve the goal without it?', 
    icon: 'lock', 
    color: '#6C7A68',
    careModeName: 'Adaptive Support',
    careModeDescription: "Let's consider how we can support the person with fewer resources or in a non-traditional setting.",
    agentPersona: 'I take things away to reveal what\'s essential. Scarcity is my laboratory — limitations breed the most elegant solutions.'
  },
  { 
    id: 'butterfly', 
    name: 'The Butterfly Effect', 
    description: 'Identify a tiny, seemingly insignificant change that could cascade into a massive result (Chaos Theory).', 
    icon: 'activity', 
    color: '#FDD87A',
    careModeName: 'Key Actions',
    careModeDescription: "Identify the smallest possible micro-intervention that could have the largest cascading positive effect on well-being.",
    agentPersona: 'I see cascades where others see trivia. The smallest lever moves the largest system — I find that lever.'
  },
  { 
    id: 'combinatorial', 
    name: 'Combinatorial Evolution', 
    description: 'Combine two existing solutions or technologies to create a novel third one.', 
    icon: 'collection', 
    color: '#E8B9C8',
    careModeName: 'Integrative Methods',
    careModeDescription: "How can we combine two distinct approaches or disciplines to create a result greater than the sum of its parts?",
    agentPersona: 'I am a matchmaker of ideas. Nothing is truly new — but the right combination of existing things creates magic.'
  },
  { 
    id: 'opposite', 
    name: 'Opposite Day', 
    description: 'Do the exact opposite of the current strategy. What does it look like?', 
    icon: 'refresh', 
    color: '#FDD87A',
    careModeName: 'Reverse Brainstorming',
    careModeDescription: "What if we focused on what *not* to do, to highlight the most effective actions to support them?",
    agentPersona: 'I flip the board. Whatever the consensus is, I argue the inverse — not to be contrarian, but to stress-test conviction.'
  },
  { 
    id: 'future', 
    name: 'Future Vision', 
    description: 'It is 20 years from now. The problem is solved. Describe the solution.', 
    icon: 'eye', 
    color: '#E8B9C8',
    careModeName: 'Goal-Oriented Vision',
    careModeDescription: "It's one year from now, and the person is thriving. What does that look like and how did we get there?",
    agentPersona: 'I live in the future. I work backwards from the solved state to reveal the path everyone else missed.'
  },
  { 
    id: 'child', 
    name: 'Child’s Play', 
    description: 'How would a 7-year-old explain or solve this problem?', 
    icon: 'smile', 
    color: '#FDD87A',
    careModeName: 'Core Message',
    careModeDescription: "How would we explain the core goal to a child to ensure it's clear and easy to follow?",
    agentPersona: 'I strip away all pretense. If you can\'t explain it simply, you don\'t understand it. I demand clarity above cleverness.'
  },
  { 
    id: 'alien', 
    name: 'Alien Perspective', 
    description: 'An alien visits Earth. How would they perceive this problem?', 
    icon: 'globe', 
    color: '#9D1F3B',
    careModeName: "Fresh Perspective",
    careModeDescription: "If someone unfamiliar with the situation looked at this plan, what would they see as the most important element?",
    agentPersona: 'I have no cultural baggage. I see your problem with completely fresh eyes and question the things you take for granted.'
  },
  { 
    id: 'nature', 
    name: 'Nature’s Wisdom', 
    description: 'How does nature handle a similar challenge (biomimicry)?', 
    icon: 'leaf', 
    color: '#6C7A68',
    careModeName: 'Holistic Cycles',
    careModeDescription: "How can we align the support plan with the body's natural healing processes or daily cycles?",
    agentPersona: 'I consult 3.8 billion years of R&D. Nature has already solved most problems — I find the biological blueprint.'
  },
  { 
    id: 'superpower', 
    name: 'Superpower', 
    description: 'If you had a magic wand and unlimited resources, how would you solve this? Now, scale it back to reality.', 
    icon: 'zap', 
    color: '#9D1F3B',
    careModeName: 'Ideal Scenario',
    careModeDescription: "If there were absolutely no barriers to care, what would the perfect support look like?",
    agentPersona: 'I dream without constraints first, then reverse-engineer feasibility. The ideal solution reveals the direction, even if the distance changes.'
  },
  { 
    id: 'simplify', 
    name: 'Eliminate & Simplify', 
    description: 'If we could only offer ONE feature, what would it be?', 
    icon: 'minus', 
    color: '#E8B9C8',
    careModeName: 'Focal Point',
    careModeDescription: "If we could only ask the person to do one thing, what would have the most positive impact?",
    agentPersona: 'I am a ruthless editor. Complexity is the enemy. I find the one thing that matters most and cut everything else.'
  },
  { 
    id: 'random', 
    name: 'Random Object', 
    description: 'Pick a random object. How does it influence the project?', 
    icon: 'dice', 
    color: '#FDD87A',
    careModeName: 'Relatable Analogy',
    careModeDescription: "Pick a household object. How can it represent a part of the support plan to make it more relatable?",
    agentPersona: 'I introduce chaos on purpose. Random collisions of unrelated ideas produce the most original breakthroughs.'
  },
  { 
    id: 'first-principles', 
    name: 'First Principles', 
    description: 'Deconstruct the problem to its most fundamental truths, then build a solution up from scratch.', 
    icon: 'brain', 
    color: '#6C7A68',
    careModeName: 'Core Needs',
    careModeDescription: "Break the health goal down to the person's most fundamental physiological and emotional needs.",
    agentPersona: 'I strip away complexity until only fundamental truths remain. I rebuild from bedrock, ignoring convention entirely.'
  },
  { 
    id: 'root-cause', 
    name: 'Root Cause (5 Whys)', 
    description: 'Ask "why" five times to drill down to the fundamental cause of the problem.', 
    icon: 'arrow-down', 
    color: '#9D1F3B',
    careModeName: 'Triggers & Causes',
    careModeDescription: "Explore the root causes and underlying triggers of the support challenge.",
    agentPersona: 'I am relentless. I ask why until everyone is uncomfortable — because the real answer is always deeper than the first one.'
  },
  {
    id: 'sensory-bridge',
    name: 'Sensory Bridge & Somatics',
    description: 'Bypass intellectual abstractions and ground the challenge in the 5 senses (sound, scent, texture, kinetic rhythm).',
    icon: 'volume-2',
    color: '#FDD87A',
    careModeName: 'Sensory Bridging & De-escalation',
    careModeDescription: 'Tap into nostalgic music, tactile comforts, and soothing lighting to de-escalate anxiety and sensory overload.',
    agentPersona: 'I tune out intellectual abstractions and listen to the senses: sound, scent, texture, and kinetic rhythm. When the mind is stuck, the body knows the way.'
  },
  {
    id: 'found-kinship',
    name: 'Unlikely Alliances & Outsiders',
    description: 'Partner with an adversarial discipline, outsider community, or fringe group to spark non-linear breakthroughs.',
    icon: 'user-check',
    color: '#E8B9C8',
    careModeName: 'Chosen Family & Community Circles',
    careModeDescription: 'Expand support beyond bloodlines to trusted neighbors, faith volunteers, peer buddies, and companion animals.',
    agentPersona: 'Blood is not the only bond. When the biological circle is strained or absent, I weave chosen family, neighbors, and trusted allies into an unbreakable safety net.'
  },
  {
    id: 'time-dilation',
    name: 'Time Dilation & Century Lens',
    description: 'Radical timescale shift: How does this work in 3 seconds? How does this endure across 300 years?',
    icon: 'refresh',
    color: '#6C7A68',
    careModeName: 'Circadian Micro-Pacing',
    careModeDescription: 'Align interventions with biological energy curves (morning momentum, sundowning mitigation, twilight winding down).',
    agentPersona: 'I stretch and compress time. When you rush, I slow the moment down to a breath; when you hesitate, I look forward 100 years.'
  },
  { 
    id: 'fmea', 
    name: 'FMEA (Risk Analysis)', 
    description: 'List potential failure points, their consequences, and how to mitigate them.', 
    icon: 'shield', 
    color: '#6C7A68',
    category: 'anchor',
    careModeName: 'Safety Net',
    careModeDescription: "Identify potential safety risks or plan failures and build early warning guardrails.",
    agentPersona: 'I see what can go wrong before it does. My job is to protect, not to pessimize — I build guardrails, not walls.'
  },
  { 
    id: 'critical-path', 
    name: 'Critical Path Method', 
    description: 'Map out the absolute sequence of dependent steps required to achieve the goal.', 
    icon: 'git-branch', 
    color: '#E8B9C8',
    category: 'anchor',
    careModeName: 'Milestone Map',
    careModeDescription: "Synthesize the exact step-by-step critical timeline of care dependencies.",
    agentPersona: 'I see dependencies. I map the non-negotiable sequence — what must happen first, what blocks what, and where the bottleneck hides.'
  },
  { 
    id: 'perma-strengths', 
    name: 'VIA Strengths & Optimism', 
    description: 'Anchor the challenge in signature character strengths (VIA) and reframe setbacks using Seligman\'s Learned Optimism and asset-based inquiry.', 
    icon: 'sparkles', 
    color: '#9AE6B4',
    category: 'anchor',
    careModeName: 'PERMA+H & Strengths',
    careModeDescription: "Activate character strengths and PERMA+H pillars (Positive Emotion, Engagement/Flow, Relationships, Meaning, Accomplishment, Health/Vitality).",
    agentPersona: 'I do not fix deficits; I amplify signature strengths. When you see an obstacle, I see an opportunity for micro-mastery, engagement flow, and PERMA+H flourishing.'
  },
  {
    id: 'kinship-triad',
    name: 'Intergenerational Kinship',
    description: 'Cross-pollinate youth playfulness, mid-life practical orchestration, and elder wisdom into a unified solution.',
    icon: 'users',
    color: '#F6AD55',
    category: 'anchor',
    careModeName: 'Family Kinship & Legacy',
    careModeDescription: 'Distributes care across generations (children, parents, grandparents) into shared, joy-filled co-activities.',
    agentPersona: 'I look through three generations at once: the wonder of children, the grounding of parents, and the enduring wisdom of grandparents.'
  },
  {
    id: 'respite-pacing',
    name: 'Sustainable Sprint & Burnout Shield',
    description: 'Identify team endurance limits, prevent crunch, and bake regenerative rest cycles directly into the roadmap.',
    icon: 'shield',
    color: '#9AE6B4',
    category: 'anchor',
    careModeName: 'Respite Safeguards & Caregiver Pacing',
    careModeDescription: 'Guard caregiver vitality with non-negotiable weekly respite windows (3–4 hrs minimum), designated handoffs, and sustainable pacing.',
    agentPersona: 'A plan that burns out the caregiver is a failed plan. I enforce protected rest, guilt-free handoffs, and renewable emotional energy.'
  },
  {
    id: 'ethical-dignity',
    name: 'Integrity & Non-Negotiable Boundaries',
    description: 'Establish ethical guardrails, privacy protections, and accessibility redlines that cannot be compromised for speed.',
    icon: 'shield-check',
    color: '#F6AD55',
    category: 'anchor',
    careModeName: 'Dignity, Autonomy & Values Alignment',
    careModeDescription: 'Ground care in the individual\'s expressed wishes, advance directives, spiritual heritage, and self-determination.',
    agentPersona: 'I am the keeper of dignity and autonomy. Every intervention must honor the person\'s voice, values, and living truth—nothing about them without them.'
  },
  {
    id: 'environmental-safety',
    name: 'Physical Grounding & Ergonomics',
    description: 'Anchor concepts into tangible real-world spatial constraints, physical ergonomics, hardware friction, and room dynamics.',
    icon: 'move',
    color: '#6C7A68',
    category: 'anchor',
    careModeName: 'Living Room Safety & Hazard Pre-Mortem',
    careModeDescription: 'Close vulnerability loops on fall hazards, throw rugs, shower grab bars, medication locking, and emergency exit pathways.',
    agentPersona: 'I inspect the physical living room floor. Brilliant intentions fail when someone trips on a rug or can\'t read a medicine bottle. I ground care in physical reality.'
  }
];