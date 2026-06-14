export interface ChangelogEntry {
  version: string;
  date: string;
  changes: string[];
}

export interface Project {
  id: string;
  title: string;
  description: string;
  discipline: string;
  technologies: string[];
  features: string[];
  demoUrl?: string;
  codeUrl?: string;
  chunks?: { title: string; description: string; codeSnippet?: string }[];
  changelog?: ChangelogEntry[];
  documentation?: string;
}

export interface Lesson {
  id: string;
  title: string;
  description: string;
  videoUrl?: string;
  contentMarkdown: string;
  relatedProjectIds: string[];
  discipline: string;
  technologies: string[];
}

export const DISCIPLINES = [
  { id: 'generative-art', name: 'Generative Art', icon: 'zap', gist: 'Creating system-driven aesthetic expressions using dynamic rules, math, and geometry.' },
  { id: 'bio-medical', name: 'Bio-Medical Design', icon: 'heart', gist: 'Visualizing biological rhythms, physiological data, and therapeutic breathing exercises.' },
  { id: 'creative-coding', name: 'Creative Coding', icon: 'activity', gist: 'Using code as an artistic medium, building high-performance interactive graphics.' },
  { id: 'systems-strategy', name: 'Systems & Strategy', icon: 'shield', gist: 'Designing relational architectures, accessible experiences, and structured tools.' },
  { id: 'photography', name: 'Photography', icon: 'camera', gist: 'The Visual Experience: Commercial capture, media management, and community immersion.' },
  { id: 'graphic-design', name: 'Graphic Design', icon: 'pen-tool', gist: 'The Visual Language: Immersive artworks, 3D rendering, and creative consulting.' },
  { id: 'computer-science', name: 'Computer Science', icon: 'terminal', gist: 'The Engine: ML workflow optimization, generative AI, and digital empowerment platforms.' }
];
export const TECHNOLOGIES = [
  { id: 'angular-ts', name: 'Angular & TypeScript', icon: 'globe', color: '#9D1F3B' },
  { id: 'svg-math', name: 'SVG Math & Geometry', icon: 'refresh', color: '#6C7A68' },
  { id: 'canvas-webgl', name: 'Canvas & WebGL', icon: 'eye', color: '#FDD87A' },
  { id: 'web-audio', name: 'Web Audio API', icon: 'volume-x', color: '#E8B9C8' },
  { id: 'fluid-physics', name: 'Fluid Physics', icon: 'activity', color: '#6C7A68' },
  { id: 'generative-ai', name: 'Generative AI', icon: 'sparkles', color: '#9D1F3B' },
  { id: 'wai-aria', name: 'WAI-ARIA', icon: 'user-check', color: '#E8B9C8' },
  { id: 'media-management', name: 'Media & Metadata Management', icon: 'database', color: '#9D1F3B' },
  { id: '3d-rendering', name: '3D Rendering & Visualization', icon: 'box', color: '#6C7A68' },
  { id: 'ml-automation', name: 'Machine Learning & Automation', icon: 'cpu', color: '#FDD87A' },
  { id: 'iot-spatial', name: 'IoT & Spatial Planning', icon: 'map', color: '#E8B9C8' }
];
export const PROJECTS: Project[] = [
  {
    id: 'lojong-breathing',
    title: 'Lojong Breathing Showcase',
    description: 'A premium therapeutic visualization tool simulating slow, structured breathing patterns (Lojong). Utilizes responsive SVGs and smooth trigonometric functions to guide users through meditative cycles.',
    discipline: 'Bio-Medical Design',
    technologies: ['Angular & TypeScript', 'SVG Math & Geometry'],
    features: [
      'Interactive breathing guide with visual expand/contract animation',
      'Configurable inhale/hold/exhale duration settings',
      'Smooth path calculations using trigonometry'
    ],
    demoUrl: '#',
    codeUrl: '#',
    chunks: [
      {
        title: 'Respiration Timer',
        description: 'Enforces a modular state machine controlling cycle duration parameters (Inhale: 4s, Hold: 4s, Exhale: 8s).',
        codeSnippet: `const cycle = { inhale: 4000, hold: 4000, exhale: 8000 };\nconst elapsed = time % (cycle.inhale + cycle.hold + cycle.exhale);`
      },
      {
        title: 'Sinusoidal Scaling',
        description: 'Applies smooth trigonometric easing to the SVG container coordinates to generate organic rhythmic expansion.',
        codeSnippet: `const scale = 1 + Math.sin((elapsed / total) * Math.PI) * 0.45;`
      },
      {
        title: 'Teal SVG Path',
        description: 'Binds dynamic scale factors directly to the DOM using Angular attributes.',
        codeSnippet: `<circle [attr.r]="baseRadius * scale" fill="var(--primary-color)" />`
      }
    ],
    documentation: 'This bio-medical guidance system implements a structured 4s Inhale, 4s Hold, 8s Exhale Lojong meditative sequence. It uses high-contrast vector paths and sinusoidal trigonometric easing to model natural human lung expansions. Integrate this in therapeutic applications to normalize heart rate variability.',
    changelog: [
      { version: 'v1.2.0', date: '2026-05-10', changes: ['Added configurable respiration timers', 'Fixed centering glitches on mobile screens', 'Optimized requestAnimationFrame CPU footprints'] },
      { version: 'v1.0.0', date: '2025-11-15', changes: ['Initial release of the Lojong state machine compiler'] }
    ]
  },
  {
    id: 'clockwork-gears',
    title: 'Clockwork Gear Engine',
    description: 'An interactive mathematical simulation of interlocking gears revolving in real-time. Employs modular arithmetic and epicly detailed vector path generation for dynamic meshing and rotation.',
    discipline: 'Generative Art',
    technologies: ['SVG Math & Geometry', 'Angular & TypeScript'],
    features: [
      'Dynamic gear layout generation with adjustable tooth count and spoke styles',
      'Accurate gear meshing algorithms based on pitch circle calculations',
      'Physics-based rotational direction propagation'
    ],
    demoUrl: '#',
    codeUrl: '#',
    chunks: [
      {
        title: 'Tooth Mesh Vector Builder',
        description: 'Calculates outer addendum and inner dedendum coordinate pairs over $N$ partitions of a circle.',
        codeSnippet: `const theta = (i * 2 * Math.PI) / numTeeth;\nconst r = i % 2 === 0 ? rOut : rIn;\npath += \`L \${r * Math.cos(theta)} \${r * Math.sin(theta)}\`;`
      },
      {
        title: 'Synchronized Gear Speed Ratio',
        description: 'Applies rotational propagation equations to ensure interlocking gears spin in alternate directions with matched pitch velocity.',
        codeSnippet: `const childSpeed = parentSpeed * (parentTeeth / childTeeth);\nconst rotation = childSpeed * directionSign;`
      },
      {
        title: 'Spoke Disk Cutouts',
        description: 'Uses SVG fill-rule: evenodd to carve out swiss cheese or Y-spoke layouts procedurally.',
        codeSnippet: `<path [attr.d]="gearPath" fill-rule="evenodd" />`
      }
    ],
    documentation: 'The Clockwork Gear Engine simulates dynamic kinetic torque propagation across mechanical gears. Contours are computed using Pitch Circles, Addendums, and Dedendums to guarantee tooth collision avoidance. Drag sliders to adjust tooth counts and watch speeds propagate through the gear train.',
    changelog: [
      { version: 'v2.0.1', date: '2026-04-18', changes: ['Carved Swiss-cheese and spoke disc cutouts', 'Replaced loops with computed polar caches'] },
      { version: 'v1.5.0', date: '2025-08-03', changes: ['Implemented speed ratio rotation matching'] }
    ]
  },
  {
    id: 'fluid-dynamics',
    title: 'Fluid Dynamics Canvas',
    description: 'A grid-based Eulerian fluid physics simulation running on HTML5 Canvas. Users can inject dye and force vectors using mouse interactions, creating beautiful swirling smoke and liquid effects.',
    discipline: 'Creative Coding',
    technologies: ['Fluid Physics', 'Canvas & WebGL'],
    features: [
      'Real-time Navier-Stokes fluid equations solved in JavaScript',
      'High-performance rendering of 10,000+ vector particles',
      'Responsive canvas resizing and force scaling'
    ],
    demoUrl: '#',
    codeUrl: '#',
    chunks: [
      {
        title: 'Eulerian Velocity Grid',
        description: 'Maintains flat Float32Arrays tracking horizontal ($u$) and vertical ($v$) velocity fields across discrete grid cells.',
        codeSnippet: `const u = new Float32Array(width * height);\nconst v = new Float32Array(width * height);`
      },
      {
        title: 'Dye Advection Solver',
        description: 'Calculates the movement of fluid density fields along the current velocity vector fields over time interval $dt$.',
        codeSnippet: `d[x + y*w] = dPrev[xPrev + yPrev*w] * friction;`
      },
      {
        title: 'Canvas Pixel Injection',
        description: 'Converts density grids directly into raw Canvas ImageData buffers, written back using putImageData.',
        codeSnippet: `imgData.data[idx] = density * 255;\nctx.putImageData(imgData, 0, 0);`
      }
    ],
    documentation: 'A numerical solver of the Navier-Stokes equations for incompressible fluid flow in an Eulerian grid. Tracks velocities and density barriers across a $64 \\times 64$ grid. User interactions inject mouse force vectors and dye particles to visualize fluid convection and eddy currents.',
    changelog: [
      { version: 'v1.1.0', date: '2026-01-22', changes: ['Swapped multi-dimensional arrays for flat typed Float32Arrays', 'Added friction dampening settings'] },
      { version: 'v1.0.0', date: '2025-05-12', changes: ['Initial Eulerian solver and Canvas buffer renderer'] }
    ]
  },
  {
    id: 'relational-nodes',
    title: 'Relational Node Plotter',
    description: 'A force-directed node-link graph visualization engine. Helps map connections between disciplines, technologies, and projects using d3-force simulation and custom canvas rendering.',
    discipline: 'Systems & Strategy',
    technologies: ['Canvas & WebGL', 'Angular & TypeScript'],
    features: [
      'Dynamic physics simulation with node repulsion and link constraints',
      'Interactive zooming, panning, and node dragging controls',
      'Highlights connected pathways on hover'
    ],
    demoUrl: '#',
    codeUrl: '#',
    chunks: [
      {
        title: 'd3-force Simulation Set',
        description: 'Binds repelling many-body forces, constraint link distances, and center gravitation limits.',
        codeSnippet: `d3.forceSimulation(nodes)\n  .force("charge", d3.forceManyBody().strength(-300))\n  .force("link", d3.forceLink(links).distance(100));`
      },
      {
        title: 'Dampened Node Dragging',
        description: 'Overrides physics node target coords during dragging, resuming automatic constraints on release.',
        codeSnippet: `function drag(event) {\n  event.subject.fx = event.x;\n  event.subject.fy = event.y;\n}`
      },
      {
        title: 'Glow Tooltips',
        description: 'Places tooltips relative to the mouse container boundaries, preventing border clipping.',
        codeSnippet: `const x = event.clientX - containerRect.left + 10;\ntooltip.style.left = \`\${x}px\`;`
      }
    ],
    documentation: 'Leverages d3-force physics simulations to construct a relational landscape mapping technologies, skills, and projects. Custom keyboard hook triggers allow users to traverse connections utilizing directional arrow keys for full keyboard accessibility.',
    changelog: [
      { version: 'v2.1.0', date: '2026-06-01', changes: ['Implemented accessibility keyboard navigation logic', 'Added directional arrow key node traversal'] },
      { version: 'v2.0.0', date: '2026-05-25', changes: ['Overhauled rendering using HTML5 Canvas for performance'] }
    ]
  },
  {
    id: 'ambient-synth',
    title: 'Web Audio Ambient Synth',
    description: 'An interactive web synthesizer that generates generative ambient soundscapes. Generates polyphonic chords and filters sound in real-time based on canvas user inputs.',
    discipline: 'Generative Art',
    technologies: ['Web Audio API'],
    features: [
      'Polyphonic oscillator nodes with low-pass/high-pass resonant filters',
      'Automated delay lines and reverberation using gain and convolver nodes',
      'Stochastic note generation conforming to pentatonic scales'
    ],
    demoUrl: '#',
    codeUrl: '#',
    chunks: [
      {
        title: 'AudioContext Initialize',
        description: 'Spawns the web audio hardware listener, bypasses browser autoplay locks, and configures master gain nodes.',
        codeSnippet: `const ctx = new (window.AudioContext || window.webkitAudioContext)();\nconst masterGain = ctx.createGain();`
      },
      {
        title: 'Resonant Filter Node',
        description: 'Hooks up biquad filters to add warmth, sweeps frequency thresholds, and models low-frequency oscillators.',
        codeSnippet: `const filter = ctx.createBiquadFilter();\nfilter.type = 'lowpass';\nfilter.frequency.setValueAtTime(500, ctx.currentTime);`
      },
      {
        title: 'Stochastic Pentatonic Scale Generator',
        description: 'Selects notes randomly matching a pentatonic minor array, adding gain envelopes to reduce click glitches.',
        codeSnippet: `const frequencies = [220.00, 246.94, 261.63, 293.66, 329.63];\noscillator.frequency.value = frequencies[Math.floor(Math.random() * 5)];`
      }
    ],
    documentation: 'Generates real-time ambient frequencies utilizing oscillator banks and resonant low-pass filters inside the Web Audio API. Touch coordinates sweep frequency bounds and biquad resonance vectors.',
    changelog: [
      { version: 'v1.1.0', date: '2026-02-14', changes: ['Added low-frequency oscillator pitch sweeps', 'Added envelope attack/decay stages'] },
      { version: 'v1.0.0', date: '2025-09-08', changes: ['Initial release of oscillator and filter nodes'] }
    ]
  },
  {
    id: 'a11y-assistant',
    title: 'A11y Strategy Assistant',
    description: 'A systems dashboard built to test and audit keyboard navigation and screen-reader accessibility constraints. Enforces strict focus-traps and rich WAI-ARIA states.',
    discipline: 'Systems & Strategy',
    technologies: ['WAI-ARIA', 'Angular & TypeScript'],
    features: [
      'Accessible focus management and aria-live announcements',
      'High-contrast mode detection and dynamic color themes',
      'Keyboard-only navigation shortcuts and screen reader guides'
    ],
    demoUrl: '#',
    codeUrl: '#',
    chunks: [
      {
        title: 'Keyboard Focus Trap',
        description: 'Intercepts tab keys to contain keyboard focus loop boundaries within open modules.',
        codeSnippet: `@HostListener('keydown.tab', ['$event'])\ntrapFocus(e) {\n  if (e.target === lastEl) { firstEl.focus(); e.preventDefault(); }\n}`
      },
      {
        title: 'aria-live Announce Channel',
        description: 'Exposes a polite aria-live DOM element to notify screen-readers of dynamic content changes.',
        codeSnippet: `<div aria-live="polite" class="sr-only">{{ liveAnnouncement() }}</div>`
      },
      {
        title: 'High-Contrast Mode Check',
        description: 'Leverages media-queries programmatically to swap visual assets for high-visibility equivalents.',
        codeSnippet: `const isHCM = window.matchMedia('(forced-colors: active)').matches;`
      }
    ],
    documentation: 'An accessibility auditing sandbox illustrating focus traps, skip links, aria-live routing, and screen reader simulations. Test high-contrast visual styling sheets and check focus coordinates in real-time.',
    changelog: [
      { version: 'v1.2.0', date: '2026-05-12', changes: ['Implemented speech synthesis screen reader engine', 'Added high-contrast styling layers'] },
      { version: 'v1.0.0', date: '2026-02-10', changes: ['Initial focus-trap validation framework'] }
    ]
  },
  {
    id: 'genai-weaver',
    title: 'GenAI Insight Weaver',
    description: 'An experimental creative assistant that uses Large Language Models to weave together disparate ideas, projecting them into a multidimensional conceptual grid.',
    discipline: 'Creative Coding',
    technologies: ['Generative AI'],
    features: [
      'Streaming SSE response parser with partial JSON rendering support',
      'Structured prompt engineering incorporating custom persona templates',
      'Combines user inquiries with creative strategies to generate unique outcomes'
    ],
    demoUrl: '#',
    codeUrl: '#',
    chunks: [
      {
        title: 'SSE Stream Reader',
        description: 'Listens to raw chunks from the backend endpoint, feeding partial fragments to a streaming parser.',
        codeSnippet: `const reader = response.body.getReader();\nwhile(true) { const {done, value} = await reader.read(); }`
      },
      {
        title: 'Partial JSON Parsing',
        description: 'Safely extracts valid javascript object arrays from incomplete strings using partial-json.',
        codeSnippet: `import { parse } from 'partial-json';\nconst parsed = parse(buffer + '}');`
      },
      {
        title: 'Structured Prompt Builder',
        description: 'Arranges system prompts containing system directives, input queries, and schema expectations.',
        codeSnippet: `const prompt = \`Apply strategy \${name} to goal \${problem}.\`;`
      }
    ],
    documentation: 'A real-time prompt engineer sandbox that uses SSE stream parsing to fetch reframed creative pathways. It consumes raw text payloads and outputs de-biased setting bypass options.',
    changelog: [
      { version: 'v1.1.0', date: '2026-05-30', changes: ['Integrated partial-json token auto-closures', 'Added stream buffering handles'] },
      { version: 'v1.0.0', date: '2026-03-01', changes: ['Initial SSE text chunk streaming interface'] }
    ]
  },
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
    description: 'Moving beyond aesthetics to drive social and environmental impact. Utilizing the elemental blueprint of natural properties to predict a product\'s lifespan and resale value.',
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
];
export const LESSONS: Lesson[] = [
  {
    id: 'interactive-svg-math',
    title: 'Procedural Geometry & SVG Math',
    description: 'Learn how to draw complex geometric curves, gears, and waves using dynamic SVG paths and mathematical formulas in Angular templates.',
    videoUrl: 'https://www.youtube.com/embed/dQw4w9WgXcQ', // Placeholder URL for demonstration
    discipline: 'Bio-Medical Design',
    technologies: ['SVG Math & Geometry', 'Angular & TypeScript'],    relatedProjectIds: ['lojong-breathing', 'clockwork-gears'],
    contentMarkdown: `
# Procedural Geometry & SVG Math

In creative engineering, we often want to create fluid, responsive visuals that do not rely on static images or heavy video assets. Scalable Vector Graphics (SVG) combined with simple trigonometry is the perfect medium for this.

## 1. The Power of SVGs in Angular
SVGs are defined in XML, meaning they are part of the DOM. Angular's binding engine lets us bind properties like \`d\`, \`cx\`, \`cy\`, and \`transform\` directly to component fields or signals.

\`\`\`mermaid
graph TD
    A[Angular Signal/State] -->|Triggers Change Detection| B[Trigonometric Calculation]
    B -->|Generates Cartesian x, y coordinates| C[Procedural SVG Path String]
    C -->|Binds directly to DOM| D[Interactive Vector Visual]
\`\`\`

\`\`\`html
<svg viewBox="0 0 200 200">
  <circle [attr.cx]="cx()" [attr.cy]="cy()" [attr.r]="radius()" fill="teal" />
</svg>
\`\`\`

## 2. Drawing Gears and Gears Math
To render a gear procedurally, we divide a circle into $N$ teeth segments. For each segment, we calculate five points:
- **Pitch Radius** ($R_p$): The nominal boundary where teeth meet.
- **Addendum** ($a$): Height of the tooth above pitch circle.
- **Dedendum** ($d$): Depth of the tooth below pitch circle.

Using polar coordinates, we map these points to Cartesian $(x, y)$ coordinates:
$$x = c_x + R \\cdot \\cos(\\theta)$$
$$y = c_y + R \\cdot \\sin(\\theta)$$

By varying the radius $R$ between the outer radius ($R_p + a$) and the inner radius ($R_p - d$), we generate the teeth.

## 3. Creating Sinusoidal Waves
For breathing animations, we map time ($t$) to a sine wave to calculate a smooth, natural scale factor:
$$\\text{scale} = 1 + \\sin\\left(\\frac{2\\pi t}{\\text{period}}\\right) \\cdot 0.2$$
This formula creates an organic, rhythmic contraction and expansion that mimics human respiration.
`
  },
  {
    id: 'canvas-fluid-physics',
    title: 'Eulerian Fluid Dynamics on Canvas',
    description: 'Discover how to implement Navier-Stokes equations for smoke and liquid simulations, rendering millions of pixels smoothly with HTML5 Canvas.',
    videoUrl: 'https://www.youtube.com/embed/dQw4w9WgXcQ',
    discipline: 'Creative Coding',
    technologies: ['Fluid Physics', 'Canvas & WebGL'],    relatedProjectIds: ['fluid-dynamics'],
    contentMarkdown: `
# Eulerian Fluid Dynamics on Canvas

Simulating fluids in real-time requires solving partial differential equations. The standard approach is the **Navier-Stokes equations**, which describe how velocity, pressure, and density interact over time.

## 1. Eulerian vs. Lagrangian
- **Lagrangian**: Track individual particles moving through space (great for sand or rigid bodies).
- **Eulerian**: Fix a grid of cells in space and track how velocity and density flow from cell to cell (great for smoke, fire, and water).

## 2. The Simulation Loop
In an Eulerian grid, each cell holds:
1. **$u, v$ velocities** (horizontal and vertical speed).
2. **$d$ density** (representing the dye or smoke concentration).

Every frame, we perform three main steps:

\`\`\`mermaid
graph TD
    Start[Start Simulation Step] --> AdvectV[Advect Velocity Fields u, v]
    AdvectV --> ProjectV[Project Velocities to enforce Incompressibility]
    ProjectV --> DiffuseD[Diffuse Density Field d]
    DiffuseD --> AdvectD[Advect Density Field along new u, v]
    AdvectD --> Render[Render Grid cells to Canvas ImageData]
    Render --> Start
\`\`\`

1. **Advection**: Move fluid velocity and dye along the current velocity field.
2. **Diffusion**: Spread out velocity and density (representing viscosity and resistance).
3. **Projection**: Solve Poisson's equation to make the velocity field incompressible (ensuring fluid loops back instead of piling up).

\`\`\`javascript
function step(dt) {
  advect(u, prev_u, u, v, dt);
  project(u, v, p, div);
  diffuse(d, prev_d, dt);
  advect(d, prev_d, u, v, dt);
}
\`\`\`

## 3. High-Performance Canvas Rendering
To render this smoothly in JavaScript:
- Keep data in flat, typed Float32Arrays rather than nested objects.
- Use a single Canvas \`ImageData\` buffer to draw pixel-by-pixel, and write it back using \`ctx.putImageData()\`.
- Offload intensive computations to WebGL fragment shaders if higher grid resolutions (e.g., $512 \\times 512$) are desired.
`
  },
  {
    id: 'a11y-systems-strategy',
    title: 'Systems & Accessibility (A11y) Strategy',
    description: 'Learn how to architect interactive dashboards that are fully keyboard navigable and screen-reader accessible without breaking custom aesthetics.',
    videoUrl: 'https://www.youtube.com/embed/dQw4w9WgXcQ',
    discipline: 'Systems & Strategy',
    technologies: ['WAI-ARIA', 'Angular & TypeScript'],    relatedProjectIds: ['a11y-assistant', 'relational-nodes'],
    contentMarkdown: `
# Systems & Accessibility (A11y) Strategy

A truly premium interface is accessible to everyone. When building complex visual interfaces like node graphs or custom grids, we must explicitly program accessibility hooks so screen-readers and keyboard-only users can navigate them easily.

## 1. Focus Management
Interactive elements must be focusable. We use the \`tabindex\` attribute to control the focus order:
- \`tabindex="0"\`: Element is focusable in sequential keyboard navigation.
- \`tabindex="-1"\`: Element is focusable programmatically (via \`.focus()\`), but skipped by the Tab key.

\`\`\`mermaid
graph LR
    Tab[User Presses Tab Key] --> Focusable{tabindex >= 0?}
    Focusable -->|Yes| Focus[Receive Keyboard Focus]
    Focusable -->|No| Skip[Skip Element in Tab Cycle]
    Focus --> Active[Listen to Keyboard Events: Arrow Keys/Enter]
    Active --> Trapped{Focus Trap Active?}
    Trapped -->|Yes| Wrap[Confine Focus to modal borders]
    Trapped -->|No| Normal[Proceed to next page element]
\`\`\`

When opening modals or overlays, always use a **focus trap** to keep keyboard focus confined inside the dialog:
\`\`\`typescript
@HostListener('keydown.Tab', ['$event'])
handleTab(e: KeyboardEvent) {
  // Logic to wrap focus from the last element back to the first
}
\`\`\`

## 2. ARIA Attributes and Signals
- \`aria-live="polite"\`: Announces updates to screen-readers (like loading notifications) without interrupting the user.
- \`aria-expanded="true/false"\`: Explains the open/collapsed state of interactive panels.
- \`role="region"\` and \`aria-labelledby="..."\`: Groups elements into meaningful sections that users can jump to directly.

## 3. Accessible Interactive D3 Graphs
D3 graphs render as \`<svg>\` images. By default, screen readers ignore them. To make a node graph accessible:
1. Add \`role="img"\` and an \`aria-label\` to the parent SVG.
2. Render graph nodes as focusable \`<g tabindex="0" role="button">\` elements.
3. Bind keyboard events (Arrow Keys, Enter) to navigate between connected nodes.
`
  },
  {
    id: 'cloud-computing-creative',
    title: 'Cloud Computing for Creative Technologists',
    description: 'From hosting a portfolio site to deploying data pipelines, learn how cloud infrastructure empowers solo creators and small studios to scale like enterprises.',
    discipline: 'Computer Science',
    technologies: ['Machine Learning & Automation', 'Angular & TypeScript'],    relatedProjectIds: ['genai-weaver', 'human-centric-ai'],
    contentMarkdown: `
# Cloud Computing for Creative Technologists

Cloud Computing is not just for enterprise teams. As a solo creative technologist or small studio, cloud infrastructure lets you scale instantly, reduce local hardware costs, and deploy globally without a data center.

## 1. The Three Service Models
Understanding the service stack is the first step:
- **IaaS (Infrastructure as a Service)**: Raw compute, storage, networking (e.g., AWS EC2, Google Compute Engine). You control the OS and above.
- **PaaS (Platform as a Service)**: Managed runtimes where you just deploy code (e.g., Google App Engine, Heroku). Great for web apps.
- **SaaS (Software as a Service)**: Ready-to-use software consumed via browser or API (e.g., Figma, Adobe CC, Gemini API). Most creatives already use SaaS daily.

## 2. Hosting a Portfolio on the Edge
Static Angular builds can be deployed to a CDN edge network in minutes:

\`\`\`mermaid
graph TD
    Code[Local Angular App] -->|npm run build| Dist[Static Production Assets]
    Dist -->|firebase deploy| Cloud[Firebase CDN Storage]
    Cloud -->|Edge Cache Routing| Edge[Global CDN Servers]
    Edge -->|High Speed Delivery| Curator[Client Browser / Portfolio Visitor]
\`\`\`

\`\`\`bash
npm run build
# Then push the dist/ folder to:
# - Firebase Hosting
# - Netlify
# - Cloudflare Pages
\`\`\`
Edge deployments serve your portfolio from the nearest global data center, reducing latency worldwide.

## 3. Serverless Functions for AI APIs
Instead of running a full backend server, use serverless functions to handle API calls securely:
\`\`\`javascript
// Firebase Cloud Function example
export const callGemini = onRequest(async (req, res) => {
  const result = await model.generateContent(req.body.prompt);
  res.json({ text: result.response.text() });
});
\`\`\`
This pattern keeps your API keys off the client and scales to zero when not in use, costing nothing at idle.

## 4. Practical Workflow
- **Store assets**: Use Cloud Storage buckets for large image libraries (photoshoots, renders).
- **Run ML jobs**: Trigger batch media processing via Cloud Run without keeping servers alive.
- **Monitor costs**: Set budget alerts immediately; cloud bills can surprise new users.
`
  },
  {
    id: 'critical-thinking-design',
    title: 'Critical Thinking in Design & Technology',
    description: 'How to audit your own assumptions, challenge design briefs, and make more intentional creative decisions — skills that separate good practitioners from exceptional ones.',
    discipline: 'Graphic Design',
    technologies: ['Media & Metadata Management'],    relatedProjectIds: ['human-centric-ai', 'a11y-assistant'],
    contentMarkdown: `
# Critical Thinking in Design & Technology

Critical thinking is the meta-skill that accelerates every other creative skill. It is the practice of deliberately examining your assumptions, evidence, and reasoning before committing to a direction.

## 1. The Einstellung Effect (The Enemy of Innovation)
The Einstellung Effect describes our tendency to solve new problems using familiar patterns — even when a better solution exists. In design, this manifests as:
- Reusing last project's color palette on a new brand.
- Defaulting to a 3-column layout because "it always works."
- Choosing a known technology stack when a simpler tool would suffice.

**Counter-strategy**: Before executing, ask: *"What would I do if I had never seen this problem before?"*

## 2. SWOT Analysis Applied to Creative Projects
Before any client engagement, run a rapid SWOT:
- **Strengths**: What unique assets or skills do we bring?
- **Weaknesses**: Where do our skills or tools have gaps?
- **Opportunities**: What is the client market underserving?
- **Threats**: What competitors, trends, or constraints could derail us?

This framework was used across 30+ global client engagements to ground creative decisions in strategic reality.

## 3. Asking the Right Questions
Strong designers interrogate the brief before they pick up a pencil or open Figma:

<div class="grid grid-cols-1 md:grid-cols-3 gap-4 my-6">
  <div class="p-5 border-2 border-[var(--border-color)] bg-[var(--card-bg-subtle)] flex flex-col justify-between" style="border-radius:0px !important;">
    <span class="text-[10px] font-black uppercase tracking-widest text-[var(--secondary-color)]">Core Message</span>
    <p class="font-serif text-sm italic m-0 pt-2" style="color:var(--text-color) !important; line-height:1.6 !important;">"What is the single most important thing this design must communicate?"</p>
  </div>
  <div class="p-5 border-2 border-[var(--border-color)] bg-[var(--card-bg-subtle)] flex flex-col justify-between" style="border-radius:0px !important;">
    <span class="text-[10px] font-black uppercase tracking-widest text-[var(--primary-color)]">Audience Empathy</span>
    <p class="font-serif text-sm italic m-0 pt-2" style="color:var(--text-color) !important; line-height:1.6 !important;">"Who is the audience and what do they already believe?"</p>
  </div>
  <div class="p-5 border-2 border-[var(--border-color)] bg-[var(--card-bg-subtle)] flex flex-col justify-between" style="border-radius:0px !important;">
    <span class="text-[10px] font-black uppercase tracking-widest text-[var(--tertiary-color)]">Success Metric</span>
    <p class="font-serif text-sm italic m-0 pt-2" style="color:var(--text-color) !important; line-height:1.6 !important;">"What does success look like in 6 months — and how will we measure it?"</p>
  </div>
</div>

## 4. Peer Review & Constructive Challenge
Running community critique sessions (like the Adobe User Group competitive challenges) trains you to receive and deliver feedback without ego. The structure:
1. **Describe** what you see (no judgment yet).
2. **Analyze** the choices made and their likely effects.
3. **Evaluate** against the stated goal.
4. **Suggest** — only after understanding the intent.
`
  },
  {
    id: 'advanced-typography-transmedia',
    title: 'Advanced Typography Across Media',
    description: 'Typography is not just font selection. Learn how to carry a typographic system coherently across print, digital, signage, and motion — the transmedia challenge every brand faces.',
    discipline: 'Graphic Design',
    technologies: ['3D Rendering & Visualization', 'Media & Metadata Management'],    relatedProjectIds: ['circular-economy-design', 'a11y-assistant'],
    contentMarkdown: `
# Advanced Typography Across Media

Typography is the voice of design. When a brand communicates across print brochures, websites, vehicle wraps, event banners, and digital signage simultaneously, type must remain coherent, legible, and expressive at every scale.

## 1. Type Classification Fundamentals
- **Serif**: Traditional authority. Strong for long-form print editorial. (Garamond, Times New Roman)
- **Sans-Serif**: Clean, modern. Best for screens and signage. (Inter, Helvetica)
- **Display / Expressive**: Identity-driving type used at large sizes only. Never body copy.
- **Monospace**: Code, technical documentation, data tables. (JetBrains Mono, Courier)

## 2. The Typographic Scale
A modular scale creates visual harmony:
\`\`\`css
--font-size-xs:   0.75rem;   /* 12px — captions, labels */
--font-size-sm:   0.875rem;  /* 14px — secondary body */
--font-size-base: 1rem;      /* 16px — body copy */
--font-size-lg:   1.25rem;   /* 20px — lead paragraph */
--font-size-xl:   1.5rem;    /* 24px — section headers */
--font-size-2xl:  2rem;      /* 32px — page headers */
--font-size-3xl:  3rem;      /* 48px — hero / signage */
\`\`\`
The ratio between steps (here ~1.25×) is called the **type scale ratio** and defines the visual hierarchy's personality.

## 3. Transmedia Considerations
| Medium | Key Constraint | Type Strategy |
|--------|---------------|---------------|
| Print (brochure) | CMYK color, fixed size | Serif body, generous leading |
| Web (HTML/CSS) | Variable viewport, screen rendering | Sans-serif, responsive scale |
| Vehicle wrap | Viewed at speed, curved surface | Bold display, max contrast |
| Digital signage | Ambient lighting, 3–10ft distance | Uppercase, condensed, large caps |
| Embroidery | Thread density limits fine strokes | Simplified letterforms, bold weight |

## 4. Brand Consistency Across 30+ Clients
Managing typography for dozens of clients simultaneously requires a **brand style guide** that specifies:
- Primary and secondary typeface with exact weights.
- Minimum size at each medium.
- Spacing rules (tracking, leading, kerning intent).
- Color combinations for accessibility compliance (4.5:1 contrast ratio minimum for body text).
`
  },
  {
    id: 'intro-large-language-models',
    title: 'Introduction to Large Language Models',
    description: 'Demystify LLMs: learn how transformers work, how to engineer prompts effectively, and how to integrate Gemini or GPT APIs into creative workflows without losing the human touch.',
    discipline: 'Computer Science',
    technologies: ['Generative AI', 'Machine Learning & Automation'],    relatedProjectIds: ['genai-weaver', 'human-centric-ai'],
    contentMarkdown: `
# Introduction to Large Language Models

Large Language Models (LLMs) are neural networks trained on vast text corpora to predict and generate human-like language. Understanding how they work makes you a more intentional, effective user — and keeps you in control of your creative process.

## 1. How Transformers Work (The Intuition)
LLMs are built on the **Transformer architecture** (introduced by Google in 2017). The key mechanism is **attention**: the model learns which words in a sequence are most relevant to each other.

\`\`\`mermaid
graph TD
    Input[Raw Text Input] --> Tokens[Tokenizer: Token IDs]
    Tokens --> Embed[Embeddings: High-dimensional Vectors]
    Embed --> Attention[Self-Attention Heads: Weigh contextual relationships]
    Attention --> FeedForward[Feed Forward Net: Predict next token]
    FeedForward --> Probabilities[Softmax: Output probabilities]
    Probabilities --> Select[Select top token output]
\`\`\`

For example, in the sentence *"The gear turned because it was meshed with another"*, the model learns that "it" refers to "gear" — not "another" — through attention weights.

This allows LLMs to handle:
- Long-range dependencies in text
- Multiple languages simultaneously
- Code, structured data, and natural language interchangeably

## 2. Prompt Engineering Fundamentals
Prompts are the primary interface for LLMs. Structure matters enormously:

**Weak prompt:**
\`"Write something about photography."\`

**Strong prompt:**
\`\`\`
You are a creative writing coach helping a photographer
build a portfolio narrative. The photographer specializes in
sustainable documentary work across 1,400+ locations.

Write a 3-sentence artist statement that:
- Emphasizes environmental mindfulness
- Conveys technical mastery
- Speaks directly to gallery curators
\`\`\`

The delta in output quality is dramatic. Always specify: **role**, **context**, **constraints**, and **format**.

## 3. Streaming API Integration
Modern LLMs stream responses token-by-token. Capturing this in a web app:
\`\`\`javascript
const stream = await model.generateContentStream(prompt);
for await (const chunk of stream.stream) {
  const text = chunk.text();
  outputElement.textContent += text; // render progressively
}
\`\`\`
This pattern creates a responsive, alive UI rather than a long wait followed by a wall of text.

## 4. Avoiding Over-Reliance
The most important LLM skill is knowing when **not** to use it:
- LLMs hallucinate facts confidently — always verify factual claims.
- Over-prompting erodes your own creative voice and critical faculties.
- Use AI to **accelerate exploration**, not to replace judgment.

The goal is a workflow where AI handles the tedious scaffolding so you can spend more time on the irreplaceable human creative work.
`
  },
  {
    id: 'brand-identity-swot',
    title: 'Brand Identity & SWOT-Driven Design',
    description: 'From logo conceptualization to brand system rollout: the strategic process behind building memorable brands for 30+ global clients across diverse industries.',
    discipline: 'Graphic Design',
    technologies: ['3D Rendering & Visualization', 'Media & Metadata Management'],    relatedProjectIds: ['circular-economy-design', 'eco-conscious-lens'],
    contentMarkdown: `
# Brand Identity & SWOT-Driven Design

A logo is not a brand. A brand is the complete sensory and emotional experience a person has with an organization. Building one requires research, strategy, and a visual language that scales across every touchpoint.

## 1. Discovery: The SWOT Audit
Before sketching a single letterform, conduct a SWOT analysis of the client's competitive landscape:
- **Strengths**: What do they uniquely own? (Heritage, community trust, proprietary process)
- **Weaknesses**: Where are they vulnerable? (Limited budget, unclear positioning, dated identity)
- **Opportunities**: What market gaps exist? (Underserved demographics, emerging trends)
- **Threats**: What competitors or trends could erode their position?

Document findings in a brief. Every design decision should trace back to this brief.

## 2. The Brand Architecture
A brand system contains:
1. **Logo Mark**: The visual symbol (icon, wordmark, or combination).
2. **Color Palette**: Primary, secondary, accent — with exact hex/Pantone/CMYK values.
3. **Typography System**: Heading and body typeface pairings with scale.
4. **Photography Style**: Mood, subject matter, lighting aesthetic.
5. **Voice & Tone**: How the brand speaks (formal/casual, technical/accessible).
6. **Application Rules**: How all elements appear on business cards, websites, vehicles, signage.

## 3. Logo Construction in Practice
Effective logos work at all sizes and in all contexts:
- **1 color / reverse**: Must be legible as pure black or pure white.
- **Minimum size**: Define a floor (e.g., 0.75 inch / 54px) below which the mark degrades.
- **Clear space**: Establish a protected zone around the logo equal to the cap-height of the wordmark.

Across 30+ clients — from local storefronts to international B2B firms — these rules consistently separated professional presentations from amateur ones.

## 4. Emerging Market Entry Strategy
When consulting on new market entries, brand identity is the first impression at scale. Key principles:
- Research the visual language already dominant in the target market — do not inadvertently adopt competitor colors or symbols.
- Localize without losing coherence: adapt photography and tone, retain mark and structure.
- Launch with a brand guide that third-party vendors can follow independently.
`
  },
  {
    id: 'community-tech-education',
    title: 'Teaching Technology in Community Settings',
    description: 'Lessons from managing Adobe User Group workshops, event supply chains, and hands-on community engagement — how to teach technology in ways that genuinely stick.',
    discipline: 'Photography',
    technologies: ['Media & Metadata Management', 'Generative AI'],    relatedProjectIds: ['eco-conscious-lens', 'human-centric-ai'],
    contentMarkdown: `
# Teaching Technology in Community Settings

The most effective technology education happens in community, not in a classroom. Managing the Adobe Photoshop & Lightroom Community User Group in Portland, alongside large-scale public event operations, revealed what truly engages learners.

## 1. Meet People Where They Are
Different learners come with different goals. The first step in any workshop is a brief needs assessment:
- *"What project are you trying to finish?"*
- *"What software do you currently use?"*
- *"What is the one thing that always frustrates you?"*

Tailoring even a 10-minute segment to a specific goal produces more retention than a generic tutorial.

## 2. The Competitive Challenge Model
Running photo editing competitions with constructive critique has a surprising effect: participants learn faster because the stakes feel real.
**Structure:**
1. Issue a creative brief (e.g., "Retouch this portrait using only natural adjustments").
2. Allow 20 minutes of independent work.
3. Display all submissions anonymously.
4. Run a structured group critique (describe → analyze → evaluate → suggest).
5. Award recognition — not just for "best" result, but for "most creative process."

This format builds critical thinking, exposes multiple valid approaches, and fosters a growth mindset.

## 3. Logistics Build Trust
Having managed event setup and logistics for 20+ public sporting events and community fairs, one principle emerges: **logistics is care made visible**. When equipment is ready, signage is clear, and schedules are honored, attendees feel that the organizer respects their time.

Applied to workshops:
- Materials ready before attendees arrive.
- Clear agenda posted and followed.
- Accessible setup: font sizes legible from the back, audio checked, accommodations considered.

## 4. Sharing Thought-Provoking Avenues
The best community technology educators don't just teach the tool — they show what is possible beyond the expected use. In Lightroom workshops, this meant showing:
- How metadata and star ratings build a searchable archive of 4,000+ images.
- How color grading connects to psychological and emotional impact on viewers.
- How automation presets free creative time for intentional artistic decisions.

The goal is to leave every participant with at least one idea they didn't arrive with.
`
  },
  {
    id: 'workflow-automation-ml',
    title: 'ML-Driven Workflow Optimization for Creatives',
    description: 'Real-world lessons from applying machine learning and automation to reduce friction in creative project management — from photo culling to content scheduling to client communication.',
    discipline: 'Computer Science',
    technologies: ['Machine Learning & Automation', 'Media & Metadata Management'],    relatedProjectIds: ['environmental-efficiency', 'human-centric-ai', 'genai-weaver'],
    contentMarkdown: `
# ML-Driven Workflow Optimization for Creatives

The most powerful application of machine learning in creative work is not generating content — it is eliminating the repetitive cognitive overhead that drains creative energy before the real work begins.

## 1. Mapping the Creative Friction Points
Before automating anything, map your current workflow and mark every step that:
- Requires the same judgment every time (consistent → automatable).
- Takes more than 5 minutes but produces no creative output.
- You have done identically more than 10 times.

\`\`\`mermaid
graph TD
    Ingest[Shoot SD Card Ingestion] --> Backup[Auto-Backup & Copy]
    Backup --> Cull[Aftershoot ML: Filter Blurs/Closed Eyes]
    Cull --> Keep{Keep Category?}
    Keep -->|No| Archive[Archive/Flag for Deletion]
    Keep -->|Yes| Excire[Excire AI: Automatic Keywording]
    Excire --> Metadata[Batch Metadata Presets applied]
    Metadata --> Lightroom[Manual Creative Retouching]
\`\`\`

Common creative friction points:
- Culling 400 photos to the best 40 after a shoot.
- Renaming and keywording files for archive consistency.
- Drafting first-pass client email updates.
- Generating invoice line items from time logs.

## 2. Photo Culling with ML
Modern tools (including Lightroom's AI-powered "Select" feature and Aftershoot) use computer vision to:
- Detect sharp focus vs. motion blur.
- Identify closed eyes and unflattering expressions.
- Score images by technical and compositional quality.

\`\`\`python
# Conceptual: scoring an image batch
for image_path in raw_images:
    score = ml_model.predict(image_path)
    if score > THRESHOLD:
        keep_list.append(image_path)
\`\`\`
This reduces 4,000 image culls from a 3-hour task to a 20-minute review.

## 3. Metadata Automation
Consistent metadata enables every future search. Automate it at capture time:
- **Camera-embedded**: GPS coordinates, timestamp, lens EXIF data — automatic.
- **Batch-applied**: Copyright string, creator name, website — automate via Lightroom export preset.
- **AI-generated keywords**: Tools like Excire Foto analyze image content and suggest searchable tags.

A well-tagged library of 35mm digitizations and digital captures becomes a searchable asset, not a storage burden.

## 4. Project Management Automation with JIRA
For software and creative projects alike, JIRA automation rules eliminate status update meetings:
\`\`\`
WHEN: Issue status changes to "In Review"
THEN: Assign to reviewer, send Slack notification, set due date to +2 business days
\`\`\`
Combine with AI-generated release notes that parse completed tickets into a client-facing summary, and you recover hours per sprint.

## 5. The Human Oversight Principle
Every automated workflow needs a human checkpoint before it touches the client or the public. The creative director's role shifts from executing routine tasks to **reviewing, correcting, and approving** AI and automation outputs. This is a higher-leverage use of expert attention — and it protects quality.
`
  },
  {
    id: 'decision-intelligence-sheets',
    title: 'Decision Intelligence & Spreadsheet Modeling',
    description: 'Learn how to structure complex design and business trade-offs using weighted decision matrices, conditional formatting, and accessible layout standards in Google Sheets.',
    discipline: 'Systems & Strategy',
    technologies: ['IoT & Spatial Planning', 'WAI-ARIA'],    relatedProjectIds: ['a11y-assistant', 'relational-nodes'],
    contentMarkdown: `
# Decision Intelligence & Spreadsheet Modeling

In systems engineering and UX research, we frequently face multi-dimensional decisions where trade-offs aren't obvious. **Decision Intelligence (DI)** combines structured data modeling with cognitive framing to help teams choose pathways based on objective criteria rather than gut feeling.

## 1. The Weighted Decision Matrix
A weighted decision matrix (Pugh matrix) quantifies qualitative preferences. We identify:
1. **Decision Criteria**: The attributes that matter (e.g., speed, accessible compliance, low cost).
2. **Criteria Weights**: Priority values from $1$ (low) to $10$ (high).
3. **Option Scores**: Ranks from $1$ (poor) to $5$ (excellent) for each potential solution.

We calculate the weighted score ($S_j$) for each option $j$:
$$S_j = \\sum_{i=1}^{n} (W_i \\times C_{ij})$$

Where $W_i$ is the weight of criterion $i$ and $C_{ij}$ is the score of option $j$ under criterion $i$.

| Criterion | Weight | Option A (D3 Graph) | Option B (Static Canvas) |
|---|---|---|---|
| A11y Navigable | 10 | 5 (Score: 50) | 2 (Score: 20) |
| Render Performance | 8 | 3 (Score: 24) | 5 (Score: 40) |
| Implementation Speed| 6 | 2 (Score: 12) | 4 (Score: 24) |
| **Total Score** | | **86** | **84** |

## 2. Dynamic Conditionally-Formatted Layouts
In Google Sheets, use custom HSL-based conditional formatting to highlight critical thresholds without cluttering the screen.
- Set up **soft high-contrast borders** to maintain visual structure.
- Enforce the **Eisenhower Matrix** using spreadsheet formulas to automatically flag tasks:
  \`=IF(AND(Urgent=TRUE, Important=TRUE), "QI (Critical)", IF(AND(Urgent=FALSE, Important=TRUE), "QII (Strategic)", "QIII/QIV"))\`

## 3. Accessibility (A11y) inside Spreadsheets
To ensure spreadsheets are accessible to screen-reader and keyboard users:
- **Title Block**: Leave cell A1 for the sheet title, defining the scope clearly.
- **Header Rows**: Freeze the top rows to define them as table headers.
- **Color Contrast**: Verify text color against cell background fills (aim for 4.5:1 contrast).
- **Named Ranges**: Use named ranges rather than cell coordinates (\`Sheet1!$B$12:$D$44\`) to make formulas screen-reader friendly.
`
  },
  {
    id: 'generative-codesign-llms',
    title: 'Generative Co-Design with Large Language Models',
    description: 'How to combine structured system prompt design, SSE stream parsing, and TypeScript safety boundaries to co-create interactive graphics with LLMs.',
    discipline: 'Computer Science',
    technologies: ['Generative AI', 'Angular & TypeScript'],    relatedProjectIds: ['genai-weaver', 'lojong-breathing'],
    contentMarkdown: `
# Generative Co-Design with Large Language Models

Integrating Generative AI into professional development workflows is not about copying generated code blindly. It is a collaborative process where the engineer designs the architectural boundaries, and the LLM accelerates the math, boilerplate, and alternative ideas.

## 1. The Generative Loop
When co-designing dynamic UI features (like the Trigonometric Lojong Breathing circle or procedural math equations), we establish a loop of refinement:

\`\`\`mermaid
graph TD
    System[Define System Prompt & Constraints] --> Model[LLM generates mathematical SVG path equations]
    Model --> TypeScript[Validate outputs with strict TypeScript types]
    TypeScript --> UI[Render interactive component prototype]
    UI --> Feedback[Audit for UX & accessibility constraints]
    Feedback -->|Refine prompt| System
\`\`\`

## 2. Engineering Strict Output Schemas
To safely consume model outputs directly in software applications, we must enforce structure. We instruct the model to respond in pure JSON conforming to a specific TypeScript interface:

\`\`\`typescript
export interface ReframedGoal {
  habitualPath: string;
  alternativePath: string;
  explanation: string;
}
\`\`\`

By configuring the prompt to demand this exact JSON format, we can parse the response programmatically.

## 3. Streaming and Partial JSON Parsing
Waiting for a full 500-word explanation from a model creates a sluggish experience. Instead, utilize **Server-Sent Events (SSE)** to stream the response, and parse incomplete fragments on-the-fly using \`partial-json\`:

\`\`\`typescript
import { parse } from 'partial-json';

function handleChunk(accumulatedString: string) {
  try {
    // Append closing characters to create a valid JSON state
    const partialData = parse(accumulatedString + '}');
    this.updateLiveUI(partialData);
  } catch (e) {
    // Ignore incomplete tokens until next chunk
  }
}
\`\`\`

This creates a highly responsive interface where recommendations and solutions render progressively in real-time.
`
  },
  {
    id: 'archival-photo-workflows',
    title: 'Archival Photo Workflows & Metadata Management',
    description: 'Master the ingestion pipeline for massive digital photo assets, leveraging Lightroom templates, standardized IPTC metadata tagging, and eco-friendly storage policies.',
    discipline: 'Photography',
    technologies: ['Media & Metadata Management'],    relatedProjectIds: ['eco-conscious-lens'],
    contentMarkdown: `
# Archival Photo Workflows & Metadata Management

As photographers, we generate gigabytes of media. Without a rigorous, automated organizational pipeline, historical image files become lost in storage. A modern archival workflow ensures images remain searchable, secure, and ready for licensing.

## 1. The Ingestion Pipeline
When transferring images from SD cards or digitizing 35mm film, follow the standardized ingestion chain:

\`\`\`mermaid
graph LR
    Capture[Ingest RAW Files] --> Validate[Verify Sharpness & Culling]
    Validate --> Rename[Rename by Date-Project-Sequence]
    Rename --> Catalog[Lightroom Cataloging & Previews]
    Catalog --> Metadata[Apply IPTC Copyright & Keywords]
    Metadata --> MultiCloud[3-2-1 Cloud Storage Backup]
    MultiCloud --> Archive[Searchable Archive Database]
    style MultiCloud fill:#faa63c,stroke:#333,stroke-width:2px,color:#000
\`\`\`

## 2. Standardization of IPTC Metadata
Metadata is the key to catalog discoverability. Standardize your Lightroom export templates to apply the following fields automatically on import:
- **Copyright Status**: Set to "Copyrighted" with current year and creator credentials.
- **Creator Details**: Name, business URL, email, and licensing terms.
- **Rights Usage**: Specific terms for commercial vs. editorial utilization.
- **IPTC Subject Codes**: Global taxonomy identifiers to facilitate search indexes in agency databases.

## 3. Culling Fatigue & Selection Math
Photo culling is mentally taxing. To optimize efficiency:
- Group photos into short visual sequences (bursts).
- Apply a **3-pass culling strategy**:
  1. *Pass 1 (Eliminate)*: Delete out-of-focus, blinking, or misexposed frames.
  2. *Pass 2 (Categorize)*: Label remaining with 1-star for keep, 2-star for portfolio potential.
  3. *Pass 3 (Select)*: Rate the final select candidates with 3 to 5 stars for high-resolution retouching.
- This systematic subtraction reduces a batch of 1,000 frames to 50 final deliverables.

## 4. Eco-Conscious Digital Footprint
Digital storage requires physical server farms. Minimizing storage impact is part of being an eco-conscious photographer:
- **Prune raw files**: Do not store unusable rejects on local spinning disks or cloud backups.
- **Smart Previews**: Use compact, lossy DNG Smart Previews in Lightroom for catalog editing; boot up heavy external raw drives only for final exports.
- **Compress for web**: Export web portfolios using optimized formats like WebP or AVIF with embedded metadata intact.
`
  }
];

