export interface CreativeStrategy {
  id: string;
  name: string;
  description: string;
  icon: string;
  color: string; // Storing the Hex code now
  careModeName?: string;
  careModeDescription?: string;
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

export type SavedItem = SavedInsight | SavedCarePlan;


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
    careModeDescription: "Let's explore 'What If' scenarios to imagine all possible positive outcomes for the person."
  },
  { 
    id: 'constraints', 
    name: 'Redefine Constraints', 
    description: 'Remove a key tool or resource. How do you achieve the goal without it?', 
    icon: 'lock', 
    color: '#6C7A68',
    careModeName: 'Adaptive Support',
    careModeDescription: "Let's consider how we can support the person with fewer resources or in a non-traditional setting."
  },
  { 
    id: 'butterfly', 
    name: 'The Butterfly Effect', 
    description: 'Identify a tiny, seemingly insignificant change that could cascade into a massive result (Chaos Theory).', 
    icon: 'activity', 
    color: '#FDD87A',
    careModeName: 'Key Actions',
    careModeDescription: "Identify the smallest possible micro-intervention that could have the largest cascading positive effect on well-being."
  },
  { 
    id: 'combinatorial', 
    name: 'Combinatorial Evolution', 
    description: 'Combine two existing solutions or technologies to create a novel third one.', 
    icon: 'collection', 
    color: '#E8B9C8',
    careModeName: 'Integrative Methods',
    careModeDescription: "How can we combine two distinct approaches or disciplines to create a result greater than the sum of its parts?"
  },
  { 
    id: 'opposite', 
    name: 'Opposite Day', 
    description: 'Do the exact opposite of the current strategy. What does it look like?', 
    icon: 'refresh', 
    color: '#FDD87A',
    careModeName: 'Reverse Brainstorming',
    careModeDescription: "What if we focused on what *not* to do, to highlight the most effective actions to support them?"
  },
  { 
    id: 'future', 
    name: 'Future Vision', 
    description: 'It is 20 years from now. The problem is solved. Describe the solution.', 
    icon: 'eye', 
    color: '#E8B9C8',
    careModeName: 'Goal-Oriented Vision',
    careModeDescription: "It's one year from now, and the person is thriving. What does that look like and how did we get there?"
  },
  { 
    id: 'child', 
    name: 'Child’s Play', 
    description: 'How would a 7-year-old explain or solve this problem?', 
    icon: 'smile', 
    color: '#FDD87A',
    careModeName: 'Core Message',
    careModeDescription: "How would we explain the core goal to a child to ensure it's clear and easy to follow?"
  },
  { 
    id: 'alien', 
    name: 'Alien Perspective', 
    description: 'An alien visits Earth. How would they perceive this problem?', 
    icon: 'globe', 
    color: '#9D1F3B',
    careModeName: "Fresh Perspective",
    careModeDescription: "If someone unfamiliar with the situation looked at this plan, what would they see as the most important element?"
  },
  { 
    id: 'nature', 
    name: 'Nature’s Wisdom', 
    description: 'How does nature handle a similar challenge (biomimicry)?', 
    icon: 'leaf', 
    color: '#6C7A68',
    careModeName: 'Holistic Cycles',
    careModeDescription: "How can we align the support plan with the body's natural healing processes or daily cycles?"
  },
  { 
    id: 'competitor', 
    name: 'Evil Competitor', 
    description: 'If you were the CEO of the biggest competitor, how would you destroy us?', 
    icon: 'sword', 
    color: '#9D1F3B',
    careModeName: 'Proactive Planning',
    careModeDescription: "What are the biggest obstacles that could derail this plan, and how can we proactively address them?"
  },
  { 
    id: 'simplify', 
    name: 'Eliminate & Simplify', 
    description: 'If we could only offer ONE feature, what would it be?', 
    icon: 'minus', 
    color: '#E8B9C8',
    careModeName: 'Focal Point',
    careModeDescription: "If we could only ask the person to do one thing, what would have the most positive impact?"
  },
  { 
    id: 'random', 
    name: 'Random Object', 
    description: 'Pick a random object. How does it influence the project?', 
    icon: 'dice', 
    color: '#FDD87A',
    careModeName: 'Relatable Analogy',
    careModeDescription: "Pick a household object. How can it represent a part of the support plan to make it more relatable?"
  },
];