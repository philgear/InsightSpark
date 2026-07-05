export interface CreativeStrategy {
  id: string;
  name: string;
  description: string;
  icon: string;
  color: string; // Storing the Hex code now
  careModeName?: string;
  careModeDescription?: string;
  agentPersona?: string; // Personality voice used in debate rounds
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
    id: 'fmea', 
    name: 'FMEA (Risk Analysis)', 
    description: 'List potential failure points, their consequences, and how to mitigate them.', 
    icon: 'shield', 
    color: '#6C7A68',
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
    careModeName: 'Milestone Map',
    careModeDescription: "Synthesize the exact step-by-step critical timeline of care dependencies.",
    agentPersona: 'I see dependencies. I map the non-negotiable sequence — what must happen first, what blocks what, and where the bottleneck hides.'
  }
];