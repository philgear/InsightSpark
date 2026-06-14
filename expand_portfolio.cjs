const fs = require('fs');
const path = require('path');

const filename = path.join(__dirname, 'src', 'models', 'portfolio-data.ts');
let content = fs.readFileSync(filename, 'utf-8');

const newDisciplines = `,
  { id: 'photography', name: 'Photography', icon: 'camera', gist: 'The Visual Experience: Commercial capture, media management, and community immersion.' },
  { id: 'graphic-design', name: 'Graphic Design', icon: 'pen-tool', gist: 'The Visual Language: Immersive artworks, 3D rendering, and creative consulting.' },
  { id: 'computer-science', name: 'Computer Science', icon: 'terminal', gist: 'The Engine: ML workflow optimization, generative AI, and digital empowerment platforms.' }
];`;
content = content.replace(/\n];\s*(?=\nexport const TECHNOLOGIES)/, newDisciplines);

const newTechnologies = `,
  { id: 'media-management', name: 'Media & Metadata Management', icon: 'database', color: '#9D1F3B' },
  { id: '3d-rendering', name: '3D Rendering & Visualization', icon: 'box', color: '#6C7A68' },
  { id: 'ml-automation', name: 'Machine Learning & Automation', icon: 'cpu', color: '#FDD87A' },
  { id: 'iot-spatial', name: 'IoT & Spatial Planning', icon: 'map', color: '#E8B9C8' }
];`;
content = content.replace(/\n];\s*(?=\nexport const PROJECTS)/, newTechnologies);

const newProjects = `,
  {
    id: 'eco-conscious-lens',
    title: 'The Eco-Conscious Lens',
    description: 'A conceptual framework teaching students how to capture the world beautifully while minimizing their environmental footprint through sustainable gear choices and natural lighting.',
    discipline: 'Photography',
    technologies: ['Media & Metadata Management'],
    features: [
      'Sustainable gear choice optimization algorithms',
      'Audit protocols for environmental photography impact',
      'Community engagement metadata tracking'
    ]
  },
  {
    id: 'circular-economy-design',
    title: 'Designing for a Circular Economy',
    description: 'Moving beyond aesthetics to drive social and environmental impact. Utilizing the elemental blueprint of natural properties to predict a product\\'s lifespan and resale value.',
    discipline: 'Graphic Design',
    technologies: ['3D Rendering & Visualization', 'Machine Learning & Automation'],
    features: [
      'Full lifecycle predictive prototyping',
      'Integration of elemental periodic table properties into 3D models',
      'Sustainable brand identity generation'
    ]
  },
  {
    id: 'environmental-efficiency',
    title: 'Automating for Environmental Efficiency',
    description: 'Coding and system architecture as a means to optimize physical resources and reduce waste, leveraging IoT data collection and spatial planning via SketchUp.',
    discipline: 'Computer Science',
    technologies: ['IoT & Spatial Planning', 'Machine Learning & Automation'],
    features: [
      'Customized IoT device deployment for environmental monitoring',
      '133% yield increase tracking via spatial footprint optimization',
      'Standard Operating Procedure automation reducing waste by 10%'
    ]
  },
  {
    id: 'human-centric-ai',
    title: 'Human-Centric AI Workflows',
    description: 'Teaching Creative Technologists how to build efficient, technology-driven workflows that prioritize human connection, community engagement, and environmental mindfulness without over-reliance on AI.',
    discipline: 'Computer Science',
    technologies: ['Generative AI', 'Machine Learning & Automation'],
    features: [
      'Interactive community workshop frameworks',
      'De-biasing and independent critical thinking evaluation nodes',
      'Ethical generative concept brainstorming'
    ]
  }
];`;
content = content.replace(/\n];\s*(?=\nexport const LESSONS)/, newProjects);

fs.writeFileSync(filename, content);
console.log('Portfolio data successfully expanded!');
