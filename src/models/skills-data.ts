export interface Skill {
  id: string;
  type: 'skill';
  label: string;
  group: 'technical_skills' | 'professional_skills' | 'other_skills';
  socCode: string;
  relatedSkillIds: string[];
  description: string;
  eisenhower: 'QI' | 'QII' | 'QIII' | 'QIV';
}

export interface Experience {
  id: string;
  type: 'experience';
  label: string;
  title: string;
  dates: string;
  url: string | null;
  description: string;
  eisenhower: 'QI' | 'QII' | 'QIII' | 'QIV';
}

export interface Education {
  id: string;
  type: 'education';
  label: string;
  degree: string;
  dates: string;
  url: string | null;
  eisenhower: 'QI' | 'QII' | 'QIII' | 'QIV';
}

export interface Certification {
  id: string;
  type: 'certification';
  label: string;
  issuer: string;
  issue_date: string;
  credential_id?: string;
  url: string | null;
  eisenhower: 'QI' | 'QII' | 'QIII' | 'QIV';
}

export interface ArtWork {
  id: string;
  title: string;
  description: string;
  image: string;
  stack: string[];
  skills: string[];
  tags: string[];
  category: 'genai' | 'photography';
}

export const PROFILE = {
  name: "Phil Gear",
  title: "Designer | Computer Scientist | Photographer",
  bio: "Creative technologist bridging the divide between visual arts and computer science, blending Pacific Northwest landscapes with engineered marvels.",
  image: "/assets/logo.png",
  socials: [
    { name: "LinkedIn", url: "https://www.linkedin.com/in/philgear", icon: "linkedin" },
    { name: "500px", url: "https://500px.com/p/philgear", icon: "500px" },
    { name: "GitHub", url: "https://github.com/philgear", icon: "github" },
    { name: "Photography Site", url: "https://philgearphotography.com", icon: "camera" }
  ],
  fullBio: `Well hello there!
I grew up in the Midwest and learned photography together with my family and in classrooms. I mostly spent those years and most of my life in front of the computer, and it's been quite a fun life so far.

I have performed a lot of creative projects and continuously innovated on top of those. It's been awesome and I love doing it.

At a certain point the precious moments we capture the more moments we forget. 

Photography is a good hobby for me to expand my mind by thinking creatively by exploring the world as built by engineers, and how nature influences it.

I have a ton of people to thank for allowing me to study this together with them, and I think you know who you are.`,
  artistStatement: `Driven to venture into the unknown to push the boundaries of Visual Arts, where natural creative talent was put to the test at an early age and honed to surpass such hurdles as the conquest into graphic design and print production, Phil has risen in intellect that has evolved into a multi talented burst of ingenuity ready the 21st century. 

While working on teams and learning the design industry from a business standpoint, and making the transition into web design and marketing, his relevant relationship with computer software and hardware has provided him with the skills needed to perform exceptionally in the workforce, but can it be transitioned into a more traditional form of human communication…art. 

There seems to be a great divide primarily in the education world and even in the real world, of the humanic artists versus the scientific designers. It’s a bit odd since they basically use the same tools to create works of art, but what if of most interest here is figuring out if someone can be meld both sides. 

Typically, most people start off by being artists before designers, but can someone like him who started out as a designer make the transition into the art world, and be able to support a sustainable life? 

Attempting such an endeavor has been a test for which has pushed him into uncomfortable situations to capture his life through photographing the Pacific Northwest, for which the natural environment provides very little wiggle room for control over the artwork versus what he is most comfortable with : a blank canvas.`
};

export const EXPERIENCES: Experience[] = [
  {
    id: "exp-geararts",
    type: "experience",
    label: "GearArts",
    title: "Creative Technologist",
    dates: "March 2015 - Present",
    url: "https://geararts.dev/",
    description: "Bridged technology and art, leading innovative initiatives. Led creation of immersive installations, empowered community engagement through art, integrated generative AI for efficiency, and optimized workflows with machine learning.",
    eisenhower: "QII"
  },
  {
    id: "exp-philgearphoto",
    type: "experience",
    label: "Phil Gear Photography",
    title: "Freelance Photographer",
    dates: "March 2015 - Present",
    url: "https://philgear.biz/",
    description: "Provided professional photography services: event, commercial, creative. Expert in Adobe Photoshop and Lightroom.",
    eisenhower: "QII"
  },
  {
    id: "exp-pg-design-web",
    type: "experience",
    label: "Phil Gear Graphic Design + Web Development",
    title: "Principal Designer & Web Solutions Expert",
    dates: "September 2002 - Present",
    url: "https://philgear.biz/",
    description: "Elevated brands and online experiences. Developed websites, revitalized online presence, created logos, produced documentation.",
    eisenhower: "QII"
  },
  {
    id: "exp-gradimages",
    type: "experience",
    label: "GradImages",
    title: "Assistant Photographer - Northwest Region",
    dates: "May 2024 - June 2024",
    url: "https://www.gradimages.com/",
    description: "Assisted with capturing images of graduates.",
    eisenhower: "QIII"
  },
  {
    id: "exp-milepoint",
    type: "experience",
    label: "Mile Point Event Productions",
    title: "Public Event Supply Chain Operations Associate",
    dates: "March 2022 - June 2024",
    url: null,
    description: "Managed event infrastructure, logistics, and resource distribution.",
    eisenhower: "QIII"
  },
  {
    id: "exp-axiom",
    type: "experience",
    label: "Axiom Event Productions",
    title: "Traffic and Inventory Support Staff",
    dates: "April 2022 - June 2024",
    url: "https://www.axomeventproductions.com/", // cleaned up
    description: "Managed event logistics, ensured public safety, community notifications.",
    eisenhower: "QIII"
  },
  {
    id: "exp-blockparty",
    type: "experience",
    label: "BLOCK PARTY BARRICADES LLC",
    title: "Public Event Operations and Quality Control Specialist",
    dates: "March 2022 - June 2024",
    url: "https://www.blockpartybarricades.com/",
    description: "Provided event set rentals and logistics, ensuring quality.",
    eisenhower: "QIII"
  },
  {
    id: "exp-ups",
    type: "experience",
    label: "UPS",
    title: "Loader/Unloader - Hub",
    dates: "October 2023 - December 2023",
    url: "https://www.ups.com/",
    description: "Ensured efficient package handling during peak season.",
    eisenhower: "QIV"
  },
  {
    id: "exp-primenow-1",
    type: "experience",
    label: "PRIME NOW LLC",
    title: "T1 Fresh Flex Warehouse Associate",
    dates: "June 2021 - October 2021",
    url: "https://www.amazon.com/",
    description: "Prepared e-commerce orders, managed inventory.",
    eisenhower: "QIII"
  },
  {
    id: "exp-primenow-2",
    type: "experience",
    label: "PRIME NOW LLC",
    title: "Warehouse Fulfillment Associate",
    dates: "August 2016 - January 2017",
    url: "https://www.amazon.com/",
    description: "Specialized in rapid order fulfillment.",
    eisenhower: "QIII"
  },
  {
    id: "exp-adobe",
    type: "experience",
    label: "Adobe",
    title: "Photoshop & Lightroom Community Manager",
    dates: "February 2016 - August 2016",
    url: "https://www.adobe.com/",
    description: "Led community outreach, delivered workshops, instituted challenges.",
    eisenhower: "QII"
  },
  {
    id: "exp-chartwells",
    type: "experience",
    label: "Chartwells Higher Education Dining Services",
    title: "Web Designer",
    dates: "April 2013 - September 2013",
    url: "https://www.dineoncampus.com/bgsu",
    description: "Developed web content, collaborated on nutrition projects, designed an interactive nutrition kiosk.",
    eisenhower: "QII"
  },
  {
    id: "exp-creativedesigns",
    type: "experience",
    label: "Creative Designs & Signs LLC.",
    title: "Senior Graphic Designer & Print Production Specialist",
    dates: "March 2004 - August 2011",
    url: null,
    description: "Led design and print production, creating over 1,000 custom designs.",
    eisenhower: "QII"
  },
  {
    id: "exp-rhodes",
    type: "experience",
    label: "Rhodes State College",
    title: "IT Support Specialist",
    dates: "March 2006 - September 2009",
    url: "https://www.rhodesstate.edu/",
    description: "Provided technical support, computer upgrades, and accessibility support.",
    eisenhower: "QII"
  },
  {
    id: "exp-bescene",
    type: "experience",
    label: "Be Scene Advertising, Video, & Web Design",
    title: "Graphic Web Designer",
    dates: "September 2008 - April 2009",
    url: null,
    description: "Client liaison, project coordinator, custom website design.",
    eisenhower: "QII"
  }
];

export const EDUCATIONS: Education[] = [
  {
    id: "edu-asu",
    type: "education",
    label: "Arizona State University",
    degree: "Bachelor of Science - BS, Graphic Design",
    dates: "2025 - 2027",
    url: "https://www.asu.edu/",
    eisenhower: "QII"
  },
  {
    id: "edu-purdue",
    type: "education",
    label: "Purdue Global",
    degree: "Computer Programming & Software Development",
    dates: "2022 - 2023",
    url: "https://www.purdueglobal.edu/",
    eisenhower: "QII"
  },
  {
    id: "edu-pcc",
    type: "education",
    label: "Portland Community College",
    degree: "AGEN, Associates of General Studies, Marketing",
    dates: "2014 - 2021",
    url: "https://www.pcc.edu/",
    eisenhower: "QII"
  },
  {
    id: "edu-bgsu",
    type: "education",
    label: "Bowling Green State University",
    degree: "Visual Communication Technology",
    dates: "2013",
    url: "https://www.bgsu.edu/",
    eisenhower: "QII"
  },
  {
    id: "edu-findlay",
    type: "education",
    label: "The University of Findlay",
    degree: "Art/Art Studies, General",
    dates: "2012",
    url: "https://www.findlay.edu/",
    eisenhower: "QII"
  },
  {
    id: "edu-owens",
    type: "education",
    label: "Owens Community College",
    degree: "Information Technology",
    dates: "2012",
    url: "https://www.owens.edu/",
    eisenhower: "QII"
  }
];

export const CERTIFICATIONS: Certification[] = [
  {
    id: "cert-lead-gen",
    type: "certification",
    label: "Lead Generation Foundations",
    issuer: "LinkedIn",
    issue_date: "2017-12-01",
    url: "https://www.linkedin.com/learning/lead-generation-foundations",
    eisenhower: "QIII"
  },
  {
    id: "cert-critical-thinking",
    type: "certification",
    label: "Critical Thinking",
    issuer: "LinkedIn",
    issue_date: "2017-12-01",
    url: "https://www.linkedin.com/learning/critical-thinking-for-better-judgment-and-decision-making",
    eisenhower: "QII"
  },
  {
    id: "cert-advanced-typography",
    type: "certification",
    label: "Advanced Typography: Transmedia",
    issuer: "Lynda.com",
    issue_date: "2017-11-01",
    url: null,
    eisenhower: "QII"
  },
  {
    id: "cert-intro-llm",
    type: "certification",
    label: "Introduction to Large Language Models",
    issuer: "Google",
    issue_date: "2023-06-01",
    url: "https://www.cloudskillsboost.google/course_templates/24",
    eisenhower: "QII"
  },
  {
    id: "cert-job-skills-supply-chain",
    type: "certification",
    label: "Job Skills: Supply Chain and Operations",
    issuer: "LinkedIn",
    issue_date: "2023-11-01",
    url: null,
    eisenhower: "QIII"
  },
  {
    id: "cert-brand-vs-reputation",
    type: "certification",
    label: "Brand vs Reputation",
    issuer: "Arizona State University",
    issue_date: "2025-01-01",
    credential_id: "3237414089bd463eb6b919608b753e0a",
    url: "https://www.coursera.org/asu",
    eisenhower: "QII"
  },
  {
    id: "cert-google-cloud-foundations",
    type: "certification",
    label: "Google Cloud Computing Foundations",
    issuer: "Google Cloud Skills Boost",
    issue_date: "2024-12-01",
    credential_id: "13238112",
    url: "https://www.cloudskillsboost.google/course_templates/73",
    eisenhower: "QII"
  },
  {
    id: "cert-creative-inspirations",
    type: "certification",
    label: "Creative Inspirations",
    issuer: "LinkedIn",
    issue_date: "2024-09-01",
    url: null,
    eisenhower: "QII"
  },
  {
    id: "cert-genai-apps-gemini-streamlit",
    type: "certification",
    label: "Develop GenAI Apps with Gemini and Streamlit",
    issuer: "Google Cloud Skills Boost",
    issue_date: "2024-09-01",
    credential_id: "11310891",
    url: "https://www.cloudskillsboost.google/quests/989",
    eisenhower: "QII"
  },
  {
    id: "cert-human-anatomy",
    type: "certification",
    label: "Diploma in Human Anatomy and Physiology",
    issuer: "MEDCoE",
    issue_date: "2024-09-01",
    credential_id: "1243-9232534",
    url: "https://medcoe.army.mil/",
    eisenhower: "QIV"
  },
  {
    id: "cert-mental-health",
    type: "certification",
    label: "Diploma in Mental Health",
    issuer: "MEDCoE",
    issue_date: "2024-09-01",
    credential_id: "1692-9232534",
    url: "https://medcoe.army.mil/",
    eisenhower: "QIV"
  },
  {
    id: "cert-assertive-likable",
    type: "certification",
    label: "How to Be Both Assertive and Likable",
    issuer: "American Negotiation Institute",
    issue_date: "2024-09-01",
    credential_id: "80a929d7ea9cd8a2170fc666af21c3fae73311f1b25760f0aca8ea1bde0f59e8",
    url: "https://www.americannegotiationinstitute.com/",
    eisenhower: "QII"
  },
  {
    id: "cert-prepare-negotiations",
    type: "certification",
    label: "How to Prepare for Your Negotiations",
    issuer: "American Negotiation Institute",
    issue_date: "2024-09-01",
    credential_id: "7b1fd2a2cef57c12acc6fbf568121a8981cf28bdebc7507cf0fdda08820d412d",
    url: "https://www.americannegotiationinstitute.com/",
    eisenhower: "QII"
  },
  {
    id: "cert-negotiating-agility",
    type: "certification",
    label: "Negotiating with Agility",
    issuer: "LinkedIn",
    issue_date: "2024-09-01",
    credential_id: "1af5cee6939f662ce258540a4f4b826e7c2ca13330ce8081db4a7d950e6dd1fa",
    url: null,
    eisenhower: "QII"
  },
  {
    id: "cert-negotiation-foundations",
    type: "certification",
    label: "Negotiation Foundations",
    issuer: "Project Management Institute",
    issue_date: "2024-09-01",
    credential_id: "4a5bcfa96f0c3f824a0e479f56eb934bb0f4ed6432e72ccd90fef1b2348fd4fb",
    url: "https://www.pmi.org/",
    eisenhower: "QII"
  },
  {
    id: "cert-sleep-superpower",
    type: "certification",
    label: "Sleep is Your Superpower",
    issuer: "LinkedIn",
    issue_date: "2024-09-01",
    credential_id: "a7c3764b46849405a98b13434afb115beaaa93bec6e4670270291bb12ed4a0b8",
    url: null,
    eisenhower: "QII"
  },
  {
    id: "cert-negotiate-anything",
    type: "certification",
    label: "When Negotiation's about More than Money...",
    issuer: "LinkedIn",
    issue_date: "2024-09-01",
    credential_id: "bc7dd3a05e031fda854076323d1d843db8bf64024128ff4576356d3203d9cdef",
    url: "https://www.linkedin.com/learning/executive-presence-on-video-conference-calls/when-negotiation-is-about-more-than-money",
    eisenhower: "QII"
  },
  {
    id: "cert-starbucks-gspa01",
    type: "certification",
    label: "ASU GSPA01",
    issuer: "Starbucks",
    issue_date: "2024-08-01",
    credential_id: "a3390557bfa44a269b86ff379c5ec67d",
    url: "https://www.starbucks.com/",
    eisenhower: "QIII"
  },
  {
    id: "cert-asu-tbw100",
    type: "certification",
    label: "ASU TBW100: To Be Welcoming",
    issuer: "Arizona State University",
    issue_date: "2024-08-01",
    credential_id: "9b562a9df94d47d4aaf1765759005053",
    url: "https://www.coursera.org/asu",
    eisenhower: "QII"
  },
  {
    id: "cert-chime-time",
    type: "certification",
    label: "Chime time",
    issuer: "Intellum",
    issue_date: "2024-08-01",
    credential_id: "eK1EtikF4MkwkhXWWF8nVhZa",
    url: "https://www.intellum.com/",
    eisenhower: "QIII"
  },
  {
    id: "cert-enterprise-search-genai",
    type: "certification",
    label: "Enterprise Search on Generative AI App Builder",
    issuer: "Google Cloud Skills Boost",
    issue_date: "2024-08-01",
    credential_id: "10845889",
    url: "https://www.cloudskillsboost.google/course_templates/539",
    eisenhower: "QII"
  },
  {
    id: "cert-fitbit-ace",
    type: "certification",
    label: "Fitbit Ace",
    issuer: "Intellum",
    issue_date: "2024-08-01",
    credential_id: "B5uCZiCLoeYPUPfPkFphDN9o",
    url: "https://www.intellum.com/",
    eisenhower: "QIII"
  },
  {
    id: "cert-gemini-app-dev",
    type: "certification",
    label: "Gemini for Application Developers",
    issuer: "Google Cloud Skills Boost",
    issue_date: "2024-08-01",
    credential_id: "10666413",
    url: "https://www.cloudskillsboost.google/course_templates/544",
    eisenhower: "QII"
  },
  {
    id: "cert-gemini-cloud-architects",
    type: "certification",
    label: "Gemini for Cloud Architects",
    issuer: "Google Cloud Skills Boost",
    issue_date: "2024-08-01",
    credential_id: "10666476",
    url: "https://www.cloudskillsboost.google/course_templates/543",
    eisenhower: "QII"
  },
  {
    id: "cert-gemini-data-scientists",
    type: "certification",
    label: "Gemini for Data Scientists and Analysts",
    issuer: "Google Cloud Skills Boost",
    issue_date: "2024-08-01",
    credential_id: "10941833",
    url: "https://www.cloudskillsboost.google/course_templates/542",
    eisenhower: "QII"
  },
  {
    id: "cert-gemini-devops",
    type: "certification",
    label: "Gemini for DevOps Engineers",
    issuer: "Google Cloud Skills Boost",
    issue_date: "2024-08-01",
    credential_id: "11008379",
    url: "https://www.cloudskillsboost.google/course_templates/545",
    eisenhower: "QII"
  },
  {
    id: "cert-gemini-security",
    type: "certification",
    label: "Gemini for Security Engineers",
    issuer: "Google Cloud Skills Boost",
    issue_date: "2024-08-01",
    credential_id: "10972046",
    url: "https://www.cloudskillsboost.google/course_templates/546",
    eisenhower: "QII"
  },
  {
    id: "cert-gemini-sdlc",
    type: "certification",
    label: "Gemini for end-to-end SDLC",
    issuer: "Google Cloud Skills Boost",
    issue_date: "2024-08-01",
    credential_id: "11008815",
    url: "https://www.cloudskillsboost.google/course_templates/547",
    eisenhower: "QII"
  },
  {
    id: "cert-innovating-google-cloud-ai",
    type: "certification",
    label: "Innovating with Google Cloud Artificial Intelligence",
    issuer: "Google Cloud Skills Boost",
    issue_date: "2024-08-01",
    credential_id: "10608898",
    url: "https://www.cloudskillsboost.google/course_templates/537",
    eisenhower: "QII"
  },
  {
    id: "cert-learning-npm",
    type: "certification",
    label: "Learning npm: A Package Manager",
    issuer: "LinkedIn",
    issue_date: "2024-08-01",
    credential_id: "28c846a9bf6e887d661fa6cd92d3528a2bc52002fe7c494c295b96b9c59032d4",
    url: "https://www.linkedin.com/learning/learning-npm-the-node-package-manager-2024/",
    eisenhower: "QII"
  },
  {
    id: "cert-strategic-negotiation",
    type: "certification",
    label: "Strategic Negotiation",
    issuer: "LinkedIn",
    issue_date: "2024-08-01",
    credential_id: "6bcff9968011cd1509703d4edf7c8aed3042b39cda63277a6889a1e82e4a4f19",
    url: "https://www.linkedin.com/learning/negotiation-skills/setting-the-stage-for-negotiation",
    eisenhower: "QII"
  },
  {
    id: "cert-trust-security-google-cloud",
    type: "certification",
    label: "Trust and Security with Google Cloud",
    issuer: "Google Cloud Skills Boost",
    issue_date: "2024-08-01",
    credential_id: "10501734",
    url: "https://www.cloudskillsboost.google/course_templates/402",
    eisenhower: "QII"
  },
  {
    id: "cert-github-data-science",
    type: "certification",
    label: "GitHub for Data Science Job Seekers",
    issuer: "LinkedIn",
    issue_date: "2024-03-01",
    credential_id: "01c1d053dba2ed1281928ed643c7c648a2f6943e891a8832d07933ab0cbd068e",
    url: "https://www.linkedin.com/learning/github-for-data-science-job-seekers/",
    eisenhower: "QII"
  },
  {
    id: "cert-duet-ai-slides",
    type: "certification",
    label: "Duet AI in Google Slides",
    issuer: "Google Cloud Skills Boost",
    issue_date: "2024-01-01",
    credential_id: "6939465",
    url: "https://www.cloudskillsboost.google/course_templates/535",
    eisenhower: "QIII"
  },
  {
    id: "cert-gemini-network-engineers",
    type: "certification",
    label: "Gemini for Network Engineers",
    issuer: "Google Cloud Skills Boost",
    issue_date: "2024-01-01",
    credential_id: "10971939",
    url: "https://www.cloudskillsboost.google/course_templates/548",
    eisenhower: "QII"
  },
  {
    id: "cert-duet-ai-gmail",
    type: "certification",
    label: "Duet AI in Gmail",
    issuer: "Google Cloud Skills Boost",
    issue_date: "2023-12-01",
    credential_id: "6817407",
    url: "https://www.cloudskillsboost.google/course_templates/516",
    eisenhower: "QIII"
  },
  {
    id: "cert-duet-ai-docs",
    type: "certification",
    label: "Duet AI in Google Docs",
    issuer: "Google Cloud Skills Boost",
    issue_date: "2023-12-01",
    credential_id: "6817434",
    url: "https://www.cloudskillsboost.google/course_templates/515",
    eisenhower: "QIII"
  },
  {
    id: "cert-duet-ai-sheets",
    type: "certification",
    label: "Duet AI in Google Sheets",
    issuer: "Google Cloud Skills Boost",
    issue_date: "2023-12-01",
    credential_id: "6817459",
    url: "https://www.cloudskillsboost.google/course_templates/517",
    eisenhower: "QIII"
  },
  {
    id: "cert-intro-duet-ai",
    type: "certification",
    label: "Introduction to Duet AI in Google Workspace",
    issuer: "Google Cloud Skills Boost",
    issue_date: "2023-12-01",
    credential_id: "6817387",
    url: "https://www.cloudskillsboost.google/course_templates/513",
    eisenhower: "QII"
  },
  {
    id: "cert-exploring-ai",
    type: "certification",
    label: "Exploring AI: Core Concepts and Applications",
    issuer: "Purdue Global",
    issue_date: "2023-11-01",
    url: "https://www.purdueglobal.edu/",
    eisenhower: "QII"
  },
  {
    id: "cert-generative-ai-explorer-vertex-ai",
    type: "certification",
    label: "Generative AI Explorer - Vertex AI",
    issuer: "Google Cloud Skills Boost",
    issue_date: "2023-11-01",
    credential_id: "5975826",
    url: "https://www.cloudskillsboost.google/quests/188",
    eisenhower: "QII"
  },
  {
    id: "cert-careers-supply-chain",
    type: "certification",
    label: "Careers in Supply Chain and Operations",
    issuer: "LinkedIn",
    issue_date: "2023-10-01",
    url: "https://www.linkedin.com/learning/career-and-job-skills-in-supply-chain-and-operations",
    eisenhower: "QIII"
  },
  {
    id: "cert-decision-intelligence",
    type: "certification",
    label: "Decision Intelligence",
    issuer: "LinkedIn",
    issue_date: "2023-10-01",
    url: "https://www.linkedin.com/learning/decision-intelligence-for-business-leaders",
    eisenhower: "QII"
  },
  {
    id: "cert-foundations-ux-design",
    type: "certification",
    label: "Foundations of User Experience (UX) Design",
    issuer: "Google",
    issue_date: "2023-10-01",
    credential_id: "VMFNJ9ZAJKWZ",
    url: "https://www.coursera.org/professional-certificates/google-ux-design",
    eisenhower: "QI"
  },
  {
    id: "cert-international-logistics",
    type: "certification",
    label: "International Logistics",
    issuer: "LinkedIn",
    issue_date: "2023-10-01",
    url: "https://www.linkedin.com/learning/international-logistics",
    eisenhower: "QIII"
  },
  {
    id: "cert-inventory-management",
    type: "certification",
    label: "Inventory Management Foundations",
    issuer: "LinkedIn",
    issue_date: "2023-10-01",
    url: "https://www.linkedin.com/learning/inventory-management-foundations-2021",
    eisenhower: "QIII"
  },
  {
    id: "cert-lean-six-sigma",
    type: "certification",
    label: "Lean Six Sigma Foundations",
    issuer: "LinkedIn",
    issue_date: "2023-10-01",
    url: "https://www.linkedin.com/learning/six-sigma-foundations",
    eisenhower: "QII"
  },
  {
    id: "cert-managing-logistics",
    type: "certification",
    label: "Managing Logistics",
    issuer: "LinkedIn",
    issue_date: "2023-10-01",
    url: "https://www.linkedin.com/learning/managing-logistics",
    eisenhower: "QIII"
  },
  {
    id: "cert-mighty-multitasker",
    type: "certification",
    label: "The Mighty Multitasker",
    issuer: "Intellum",
    issue_date: "2023-10-01",
    credential_id: "hBgjX8vcPVK2on3Rf83AeWpv",
    url: "https://www.intellum.com/",
    eisenhower: "QIII"
  },
  {
    id: "cert-supply-chain-foundations",
    type: "certification",
    label: "Supply Chain Foundations",
    issuer: "LinkedIn",
    issue_date: "2023-10-01",
    url: "https://www.linkedin.com/learning/supply-chain-and-operations-foundations-managing-supply-and-demand",
    eisenhower: "QIII"
  },
  {
    id: "cert-understanding-logistics",
    type: "certification",
    label: "Understanding Logistics",
    issuer: "LinkedIn",
    issue_date: "2023-10-01",
    url: "https://www.linkedin.com/learning/understanding-logistics",
    eisenhower: "QIII"
  },
  {
    id: "cert-business-etiquette",
    type: "certification",
    label: "Business Etiquette: Meetings, Meals, and Networking Events",
    issuer: "LinkedIn",
    issue_date: "2023-09-01",
    url: "https://www.linkedin.com/learning/business-etiquette-meetings-meals-networking-events",
    eisenhower: "QII"
  },
  {
    id: "cert-digital-transformation",
    type: "certification",
    label: "Digital Transformation with Google Cloud",
    issuer: "Google Cloud Skills Boost",
    issue_date: "2023-09-01",
    credential_id: "5128458",
    url: "https://www.cloudskillsboost.google/course_templates/74",
    eisenhower: "QII"
  },
  {
    id: "cert-how-to-rock-conference",
    type: "certification",
    label: "How to Rock a Conference",
    issuer: "LinkedIn",
    issue_date: "2023-09-01",
    url: "https://www.linkedin.com/learning/how-to-rock-a-conference",
    eisenhower: "QIII"
  },
  {
    id: "cert-infra-app-modernization",
    type: "certification",
    label: "Infrastructure and Application Modernization with Google Cloud",
    issuer: "Google Cloud Skills Boost",
    issue_date: "2023-09-01",
    credential_id: "5241503",
    url: "https://www.cloudskillsboost.google/course_templates/76",
    eisenhower: "QII"
  },
  {
    id: "cert-innovating-data-google-cloud",
    type: "certification",
    label: "Innovating with Data and Google Cloud",
    issuer: "Google Cloud Skills Boost",
    issue_date: "2023-09-01",
    credential_id: "5240952",
    url: "https://www.cloudskillsboost.google/course_templates/75",
    eisenhower: "QII"
  },
  {
    id: "cert-learning-headshot-photography",
    type: "certification",
    label: "Learning Headshot Photography",
    issuer: "LinkedIn",
    issue_date: "2023-09-01",
    url: "https://www.linkedin.com/learning/learning-headshot-photography",
    eisenhower: "QII"
  },
  {
    id: "cert-learning-portrait-photography",
    type: "certification",
    label: "Learning Portrait Photography",
    issuer: "LinkedIn",
    issue_date: "2023-09-01",
    url: "https://www.linkedin.com/learning/learning-portrait-photography",
    eisenhower: "QII"
  },
  {
    id: "cert-understanding-google-cloud-security",
    type: "certification",
    label: "Understanding Google Cloud Security and Operations",
    issuer: "Google Cloud Skills Boost",
    issue_date: "2023-09-01",
    credential_id: "5242479",
    url: "https://www.cloudskillsboost.google/course_templates/77",
    eisenhower: "QII"
  },
  {
    id: "cert-virtual-events-training",
    type: "certification",
    label: "Virtual Events Essential Training",
    issuer: "LinkedIn",
    issue_date: "2023-09-01",
    url: "https://www.linkedin.com/learning/virtual-and-hybrid-event-essentials",
    eisenhower: "QII"
  },
  {
    id: "cert-workshop-facilitation",
    type: "certification",
    label: "Workshop Facilitation",
    issuer: "LinkedIn",
    issue_date: "2023-09-01",
    url: "https://www.linkedin.com/learning/running-a-design-workshop",
    eisenhower: "QII"
  }
];

export const SKILLS: Skill[] = [
  { id: "skill-genai", type: "skill", label: "Generative AI", group: "technical_skills", socCode: "15-1299", relatedSkillIds: ["skill-ai", "skill-ml", "skill-python"], description: "Harnessing large language models, image generators, and coding assistants to accelerate creative and coding workflows.", eisenhower: "QII" },
  { id: "skill-google-gemini", type: "skill", label: "Google Gemini", group: "technical_skills", socCode: "15-1299", relatedSkillIds: ["skill-genai", "skill-cloud-computing"], description: "Building applications and automation scripts utilizing Google's Gemini multimodal models.", eisenhower: "QII" },
  { id: "skill-gcp", type: "skill", label: "Google Cloud Platform (GCP)", group: "technical_skills", socCode: "15-1211", relatedSkillIds: ["skill-cloud-computing", "skill-aws", "skill-security"], description: "Configuring serverless hosting, storage buckets, cloud functions, and security policies on GCP.", eisenhower: "QII" },
  { id: "skill-ai", type: "skill", label: "Artificial Intelligence (AI)", group: "technical_skills", socCode: "15-1299", relatedSkillIds: ["skill-ml", "skill-python", "skill-data-science"], description: "Applying cognitive models, semantic searches, and natural language processing to solve user needs.", eisenhower: "QII" },
  { id: "skill-ml", type: "skill", label: "Machine Learning", group: "technical_skills", socCode: "15-1299", relatedSkillIds: ["skill-ai", "skill-python", "skill-data-science"], description: "Deploying predictive algorithms and automated culling or classification systems for media libraries.", eisenhower: "QII" },
  { id: "skill-software-dev", type: "skill", label: "Software Development", group: "technical_skills", socCode: "15-1252", relatedSkillIds: ["skill-javascript", "skill-python", "skill-web-dev", "skill-version-control"], description: "Designing, writing, debugging, and maintaining scalable and modular codebase structures.", eisenhower: "QII" },
  { id: "skill-web-dev", type: "skill", label: "Web Development", group: "technical_skills", socCode: "15-1254", relatedSkillIds: ["skill-html5", "skill-css3", "skill-javascript", "skill-angular", "skill-nodejs"], description: "Architecting interactive, highly responsive web applications conforming to modern standards.", eisenhower: "QII" },
  { id: "skill-data-science", type: "skill", label: "Data Science", group: "technical_skills", socCode: "15-2051", relatedSkillIds: ["skill-python", "skill-ml"], description: "Processing, analyzing, and visualizing multi-dimensional datasets to extract actionable product insights.", eisenhower: "QII" },
  { id: "skill-javascript", type: "skill", label: "JavaScript", group: "technical_skills", socCode: "15-1254", relatedSkillIds: ["skill-html5", "skill-css3", "skill-web-dev", "skill-nodejs"], description: "Programming rich interactive behavior, DOM manipulations, and asynchronous network bindings.", eisenhower: "QII" },
  { id: "skill-npm", type: "skill", label: "npm", group: "technical_skills", socCode: "15-1299", relatedSkillIds: ["skill-javascript", "skill-nodejs", "skill-web-dev"], description: "Managing third-party package dependencies and publishing modular web components.", eisenhower: "QII" },
  { id: "skill-cloud-computing", type: "skill", label: "Cloud Computing", group: "technical_skills", socCode: "15-1211", relatedSkillIds: ["skill-aws", "skill-gcp", "skill-security"], description: "Architecting cloud-native web architectures, serverless computing, and edge content delivery.", eisenhower: "QII" },
  { id: "skill-security", type: "skill", label: "Security", group: "technical_skills", socCode: "15-1212", relatedSkillIds: ["skill-cloud-computing", "skill-aws", "skill-gcp"], description: "Enforcing data protection, API key rotation, TLS/HTTPS, and access control boundaries.", eisenhower: "QII" },
  { id: "skill-github", type: "skill", label: "GitHub", group: "technical_skills", socCode: "15-1299", relatedSkillIds: ["skill-version-control"], description: "Collaborative code management, pull requests, automated actions, and issue tracking.", eisenhower: "QII" },
  { id: "skill-google-slides", type: "skill", label: "Google Slides", group: "technical_skills", socCode: "15-1299", relatedSkillIds: ["skill-presentation-skills"], description: "Authoring clear visual presentations incorporating structural slides and layouts.", eisenhower: "QIII" },
  { id: "skill-google-docs", type: "skill", label: "Google Docs", group: "technical_skills", socCode: "15-1299", relatedSkillIds: ["skill-written-communication"], description: "Creating and reviewing structured documentation, project specifications, and logs.", eisenhower: "QIII" },
  { id: "skill-document-processing", type: "skill", label: "Document Processing", group: "technical_skills", socCode: "15-1299", relatedSkillIds: ["skill-word-processing"], description: "Organizing and formatting technical proofs, changes, and digital records.", eisenhower: "QIII" },
  { id: "skill-word-processing", type: "skill", label: "Word Processing", group: "technical_skills", socCode: "15-1299", relatedSkillIds: ["skill-document-processing"], description: "Handling documents, formatting text elements, and exporting structured records.", eisenhower: "QIII" },
  { id: "skill-document-preparation", type: "skill", label: "Document Preparation", group: "technical_skills", socCode: "15-1299", relatedSkillIds: ["skill-document-processing"], description: "Compiling design briefs, client sign-offs, and technical requirements documentation.", eisenhower: "QIII" },
  { id: "skill-google-sheets", type: "skill", label: "Google Sheets", group: "technical_skills", socCode: "15-1299", relatedSkillIds: ["skill-data-science"], description: "Tracking metrics, formulas, tabular data parsing, and project timelines.", eisenhower: "QIII" },
  { id: "skill-digital-photography", type: "skill", label: "Digital Photography", group: "technical_skills", socCode: "27-4021", relatedSkillIds: ["skill-photo-retouching", "skill-lighting", "skill-composition"], description: "Capturing high-resolution visual stories using professional DSLR cameras and manual control.", eisenhower: "QII" },
  { id: "skill-photo-retouching", type: "skill", label: "Photo Retouching", group: "technical_skills", socCode: "27-4021", relatedSkillIds: ["skill-digital-photography", "skill-adobe-photoshop", "skill-adobe-lightroom"], description: "Restoring and enhancing raw images, calibrating color channels, and performing custom masking.", eisenhower: "QII" },
  { id: "skill-graphic-design", type: "skill", label: "Graphic Design", group: "technical_skills", socCode: "27-1024", relatedSkillIds: ["skill-figma", "skill-adobe-xd", "skill-sketch", "skill-branding"], description: "Translating brand strategy into visual form: logos, typography scales, grid layouts, and print files.", eisenhower: "QII" },
  { id: "skill-it-support", type: "skill", label: "IT Support", group: "technical_skills", socCode: "15-1232", relatedSkillIds: ["skill-windows"], description: "Troubleshooting computing hardware, software licensing, and local accessibility overlays.", eisenhower: "QII" },
  { id: "skill-adobe-photoshop", type: "skill", label: "Adobe Photoshop", group: "technical_skills", socCode: "27-1024", relatedSkillIds: ["skill-photo-retouching", "skill-graphic-design"], description: "Raster image composition, complex layers, non-destructive smart filters, and vector masking.", eisenhower: "QII" },
  { id: "skill-adobe-lightroom", type: "skill", label: "Adobe Lightroom", group: "technical_skills", socCode: "27-4021", relatedSkillIds: ["skill-photo-retouching"], description: "Organizing catalog databases, batch applying metadata presets, and color balancing RAW captures.", eisenhower: "QII" },
  { id: "skill-windows", type: "skill", label: "Windows", group: "technical_skills", socCode: "15-1232", relatedSkillIds: ["skill-it-support"], description: "Configuring standard administrative systems, scripting commands, and handling upgrades.", eisenhower: "QIII" },
  { id: "skill-html5", type: "skill", label: "HTML5", group: "technical_skills", socCode: "15-1254", relatedSkillIds: ["skill-css3", "skill-javascript", "skill-web-dev"], description: "Writing structured, semantic document frames utilizing native headers, sections, and controls.", eisenhower: "QII" },
  { id: "skill-css3", type: "skill", label: "CSS3", group: "technical_skills", socCode: "15-1254", relatedSkillIds: ["skill-html5", "skill-javascript", "skill-web-dev"], description: "Implementing custom visual design systems, layout constraints (Grid, Flexbox), and transitions.", eisenhower: "QII" },
  { id: "skill-php", type: "skill", label: "PHP", group: "technical_skills", socCode: "15-1254", relatedSkillIds: ["skill-web-dev"], description: "Developing backend routes, content management loops, and dynamic database querying.", eisenhower: "QII" },
  { id: "skill-json", type: "skill", label: "JSON", group: "technical_skills", socCode: "15-1299", relatedSkillIds: ["skill-web-dev"], description: "Modeling structured relational datasets for seamless REST API consumption.", eisenhower: "QII" },
  { id: "skill-angular", type: "skill", label: "Angular", group: "technical_skills", socCode: "15-1254", relatedSkillIds: ["skill-javascript", "skill-web-dev"], description: "Building highly modular enterprise SPAs utilizing signals, standalone components, and routing.", eisenhower: "QII" },
  { id: "skill-python", type: "skill", label: "Python", group: "technical_skills", socCode: "15-1252", relatedSkillIds: ["skill-software-dev", "skill-ml", "skill-ai", "skill-data-science"], description: "Scripting data culling pipelines, math modeling, and model serving wrappers.", eisenhower: "QII" },
  { id: "skill-ruby", type: "skill", label: "Ruby", group: "technical_skills", socCode: "15-1252", relatedSkillIds: ["skill-software-dev"], description: "Developing custom automation scripts and managing modular backends.", eisenhower: "QII" },
  { id: "skill-nodejs", type: "skill", label: "Node.js", group: "technical_skills", socCode: "15-1254", relatedSkillIds: ["skill-javascript", "skill-web-dev"], description: "Developing high-performance, asynchronous web servers, culling scripts, and API routers.", eisenhower: "QII" },
  { id: "skill-version-control", type: "skill", label: "Version Control", group: "technical_skills", socCode: "15-1299", relatedSkillIds: ["skill-github"], description: "Managing source control changes, branching models, conflicts, and commit histories.", eisenhower: "QII" },
  { id: "skill-lighting", type: "skill", label: "Photography Lighting", group: "technical_skills", socCode: "27-4021", relatedSkillIds: ["skill-digital-photography"], description: "Manipulating natural ambient illumination, strobe modifiers, and studio lighting grids.", eisenhower: "QII" },
  { id: "skill-composition", type: "skill", label: "Photography Composition", group: "technical_skills", socCode: "27-4021", relatedSkillIds: ["skill-digital-photography"], description: "Guiding the viewer's eye through perspective angles, leading lines, framing, and rules of thirds.", eisenhower: "QII" },
  { id: "skill-adobe-xd", type: "skill", label: "Adobe XD", group: "technical_skills", socCode: "27-1024", relatedSkillIds: ["skill-ux-design", "skill-figma"], description: "Creating clickable interface wires, visual components, and transition prototypes.", eisenhower: "QII" },
  { id: "skill-figma", type: "skill", label: "Figma", group: "technical_skills", socCode: "27-1024", relatedSkillIds: ["skill-ux-design", "skill-adobe-xd"], description: "Designing collaborative design systems, components, auto-layouts, and design handoff files.", eisenhower: "QII" },
  { id: "skill-sketch", type: "skill", label: "Sketch", group: "technical_skills", socCode: "27-1024", relatedSkillIds: ["skill-ux-design"], description: "Building layouts, components, and artboards for web design deliverables.", eisenhower: "QII" },
  { id: "skill-wordpress", type: "skill", label: "Wordpress", group: "technical_skills", socCode: "15-1254", relatedSkillIds: ["skill-web-dev"], description: "Publishing custom content structures, handling themes, and executing client configurations.", eisenhower: "QII" },
  { id: "skill-aws", type: "skill", label: "AWS", group: "technical_skills", socCode: "15-1211", relatedSkillIds: ["skill-cloud-computing"], description: "Configuring compute services, content delivery distribution networks (CDN), and access logs.", eisenhower: "QII" },

  // Professional Skills
  { id: "skill-visual-language", type: "skill", label: "Visual Language of Design", group: "professional_skills", socCode: "27-1024", relatedSkillIds: ["skill-graphic-design"], description: "Structuring graphical information using balance, rhythm, scale ratios, and high contrast guidelines.", eisenhower: "QII" },
  { id: "skill-english", type: "skill", label: "English", group: "professional_skills", socCode: "27-3043", relatedSkillIds: ["skill-communication"], description: "Professional reading, writing, and speaking to coordinate international stakeholder teams.", eisenhower: "QI" },
  { id: "skill-community-management", type: "skill", label: "Community Management", group: "professional_skills", socCode: "11-2021", relatedSkillIds: ["skill-communication"], description: "Organizing user forums, competitive challenges, and peer-review design groups.", eisenhower: "QII" },
  { id: "skill-teaching", type: "skill", label: "Teaching", group: "professional_skills", socCode: "25-3099", relatedSkillIds: ["skill-communication"], description: "Structuring workshops, standard operating guidelines, and accessible curriculum lessons.", eisenhower: "QII" },
  { id: "skill-client-management", type: "skill", label: "Client Management", group: "professional_skills", socCode: "11-2021", relatedSkillIds: ["skill-communication"], description: "Navigating stakeholder reviews, aligning briefs, and delivering high satisfaction benchmarks.", eisenhower: "QII" },
  { id: "skill-communication", type: "skill", label: "Communication", group: "professional_skills", socCode: "27-3043", relatedSkillIds: ["skill-verbal-communication", "skill-written-communication"], description: "Orchestrating information transfer cleanly across multi-disciplinary engineering and design teams.", eisenhower: "QII" },
  { id: "skill-written-communication", type: "skill", label: "Written Communication", group: "professional_skills", socCode: "27-3043", relatedSkillIds: ["skill-communication"], description: "Drafting precise specification sheets, changelogs, user guides, and brand manuals.", eisenhower: "QII" },
  { id: "skill-verbal-communication", type: "skill", label: "Verbal Communication", group: "professional_skills", socCode: "27-3043", relatedSkillIds: ["skill-communication", "skill-presentation-skills"], description: "Presenting solutions to clients, facilitating group critiques, and conducting interviews.", eisenhower: "QII" },
  { id: "skill-presentation-skills", type: "skill", label: "Presentation Skills", group: "professional_skills", socCode: "27-3043", relatedSkillIds: ["skill-communication"], description: "Formatting clear slides, visual diagrams, and pitching strategic frameworks.", eisenhower: "QII" },
  { id: "skill-ux-design", type: "skill", label: "UX Design", group: "professional_skills", socCode: "15-1299", relatedSkillIds: ["skill-user-research", "skill-interaction-design"], description: "Architecting human-centered digital experiences: user flows, prototypes, and usability testing.", eisenhower: "QI" },
  { id: "skill-user-research", type: "skill", label: "User Research", group: "professional_skills", socCode: "15-1299", relatedSkillIds: ["skill-ux-design"], description: "Conducting user interviews, building personas, mapping empathy charts, and analyzing behavior.", eisenhower: "QI" },
  { id: "skill-interaction-design", type: "skill", label: "Interaction Design", group: "professional_skills", socCode: "15-1299", relatedSkillIds: ["skill-ux-design"], description: "Drafting micro-interactions, responsive states, layout hierarchies, and custom graphic widgets.", eisenhower: "QI" },
  { id: "skill-marketing", type: "skill", label: "Marketing", group: "professional_skills", socCode: "11-2021", relatedSkillIds: ["skill-branding"], description: "Promoting products and brand identities by identifying target markets and customer values.", eisenhower: "QII" },
  { id: "skill-branding", type: "skill", label: "Branding", group: "professional_skills", socCode: "11-2021", relatedSkillIds: ["skill-marketing"], description: "Establishing visual identities, typography scales, style guidelines, and tone catalogs.", eisenhower: "QII" },

  // Other Skills
  { id: "skill-project-management", type: "skill", label: "Project Management", group: "other_skills", socCode: "11-9199", relatedSkillIds: ["skill-teamwork", "skill-communication", "skill-time-management"], description: "Tracking backlogs, defining milestones, coordinating sprints, and delivering on timelines.", eisenhower: "QII" },
  { id: "skill-instruction", type: "skill", label: "Instruction", group: "other_skills", socCode: "25-3099", relatedSkillIds: ["skill-teaching"], description: "Providing structured tutorials, tool walk-throughs, and creative feedback reviews.", eisenhower: "QII" },
  { id: "skill-customer-service", type: "skill", label: "Customer Service", group: "other_skills", socCode: "43-4051", relatedSkillIds: ["skill-communication"], description: "Responding to client requests with care, resolving concerns, and building trusted relations.", eisenhower: "QIII" },
  { id: "skill-creativity", type: "skill", label: "Creativity and Innovation", group: "other_skills", socCode: "11-9199", relatedSkillIds: ["skill-problem-solving"], description: "Finding novel connections between visual art, system automation, and digital interaction.", eisenhower: "QII" },
  { id: "skill-lifelong-learning", type: "skill", label: "Lifelong Learning", group: "other_skills", socCode: "25-3099", relatedSkillIds: ["skill-critical-thinking"], description: "Constantly expanding knowledge via certifications, volunteer work, and personal studies.", eisenhower: "QII" },
  { id: "skill-negotiation", type: "skill", label: "Negotiation", group: "other_skills", socCode: "11-9199", relatedSkillIds: ["skill-communication"], description: "Resolving differences, clarifying deliverables, and securing mutually beneficial agreements.", eisenhower: "QII" },
  { id: "skill-strategic-negotiation", type: "skill", label: "Strategic Negotiation", group: "other_skills", socCode: "11-9199", relatedSkillIds: ["skill-negotiation"], description: "Formulating multi-party agreements, logistical compromises, and resource allocations.", eisenhower: "QII" },
  { id: "skill-supply-chain", type: "skill", label: "Supply Chain", group: "other_skills", socCode: "13-1081", relatedSkillIds: ["skill-logistics"], description: "Managing material flow, sourcing barricades and signs, and optimizing logistics pipelines.", eisenhower: "QIII" },
  { id: "skill-logistics", type: "skill", label: "Logistics", group: "other_skills", socCode: "13-1081", relatedSkillIds: ["skill-supply-chain"], description: "Coordinating public transport, setup schedules, resource placement, and local safety rules.", eisenhower: "QIII" },
  { id: "skill-inventory-management", type: "skill", label: "Inventory Management", group: "other_skills", socCode: "13-1081", relatedSkillIds: ["skill-logistics"], description: "Tracking physical assets, assessing wear-and-tear, and routing replenishment items.", eisenhower: "QIII" },
  { id: "skill-lean-six-sigma", type: "skill", label: "Lean Six Sigma", group: "other_skills", socCode: "11-9199", relatedSkillIds: ["skill-project-management"], description: "Analyzing process inefficiencies, standardizing tasks, and reducing waste indicators.", eisenhower: "QII" },
  { id: "skill-decision-intelligence", type: "skill", label: "Decision Intelligence", group: "other_skills", socCode: "11-9199", relatedSkillIds: ["skill-critical-thinking"], description: "Applying systematic models to evaluate choices and predict user behavior outcomes.", eisenhower: "QII" },
  { id: "skill-business-etiquette", type: "skill", label: "Business Etiquette", group: "other_skills", socCode: "11-9199", relatedSkillIds: ["skill-communication"], description: "Maintaining professional standards in corporate meetings, events, and written briefs.", eisenhower: "QII" },
  { id: "skill-workshop-facilitation", type: "skill", label: "Workshop Facilitation", group: "other_skills", socCode: "25-3099", relatedSkillIds: ["skill-teaching"], description: "Guiding interactive user group sessions, tutorials, and competitive design critiques.", eisenhower: "QII" },
  { id: "skill-critical-thinking", type: "skill", label: "Critical Thinking", group: "other_skills", socCode: "11-9199", relatedSkillIds: ["skill-problem-solving"], description: "Interrogating assumptions, verifying data integrity, and formulating structured audits.", eisenhower: "QII" },
  { id: "skill-sustainability", type: "skill", label: "Sustainability", group: "other_skills", socCode: "11-9199", relatedSkillIds: ["skill-problem-solving"], description: "Evaluating carbon footprints, prioritizing natural resources, and designing circular economies.", eisenhower: "QII" },
  { id: "skill-customer-experience", type: "skill", label: "Customer Experience", group: "other_skills", socCode: "43-4051", relatedSkillIds: ["skill-customer-service"], description: "Analyzing customer interactions to design intuitive and low-friction service paths.", eisenhower: "QII" },
  { id: "skill-problem-solving", type: "skill", label: "Problem Solving", group: "other_skills", socCode: "11-9199", relatedSkillIds: ["skill-critical-thinking"], description: "Formulating modular code, accessibility traps, or logistics routes to overcome blocks.", eisenhower: "QII" },
  { id: "skill-teamwork", type: "skill", label: "Teamwork", group: "other_skills", socCode: "11-9199", relatedSkillIds: ["skill-communication"], description: "Coordinating tasks, sharing feedback, and celebrating milestones with peers.", eisenhower: "QII" },
  { id: "skill-time-management", type: "skill", label: "Time Management", group: "other_skills", socCode: "11-9199", relatedSkillIds: ["skill-project-management"], description: "Prioritizing tasks using Eisenhower matrices, optimizing schedules, and meeting dates.", eisenhower: "QII" },
  { id: "skill-adaptability", type: "skill", label: "Adaptability", group: "other_skills", socCode: "11-9199", relatedSkillIds: ["skill-problem-solving"], description: "Pivoting between software, visual design, photography, and event logistics fluidly.", eisenhower: "QII" },
  { id: "skill-leadership", type: "skill", label: "Leadership", group: "other_skills", socCode: "11-9199", relatedSkillIds: ["skill-communication"], description: "Inspiring action, coordinating public events, and guiding creative directions.", eisenhower: "QII" },
  { id: "skill-quality-assurance", type: "skill", label: "Quality Assurance", group: "other_skills", socCode: "11-9199", relatedSkillIds: ["skill-project-management"], description: "Reviewing code builds, checking safety parameters, and verifying aesthetic standards.", eisenhower: "QIII" },
  { id: "skill-lead-generation", type: "skill", label: "Lead Generation", group: "other_skills", socCode: "11-2021", relatedSkillIds: ["skill-marketing"], description: "Sourcing business prospects, drafting introductory updates, and expanding market share.", eisenhower: "QIII" },
  { id: "skill-organization", type: "skill", label: "Organization", group: "other_skills", socCode: "11-9199", relatedSkillIds: ["skill-time-management"], description: "Maintaining metadata databases, file naming conventions, and inventory manifests.", eisenhower: "QII" },
  { id: "skill-resilience", type: "skill", label: "Resilience", group: "other_skills", socCode: "11-9199", relatedSkillIds: ["skill-problem-solving"], description: "Overcoming technical glitches, operational disruptions, and tight project schedules.", eisenhower: "QII" }
];

export const ARTWORKS: ArtWork[] = [
  {
    id: "art-gear-study",
    title: "Clockwork Gear & Orbital Study",
    description: "A flat retro-futuristic geometric vector study exploring orbital gear teeth, pitch circles, and mechanical kinematics.",
    image: "/assets/gallery_genai_1.png",
    stack: ["SVG Math & Geometry", "Angular", "TypeScript"],
    skills: ["skill-genai", "skill-graphic-design", "skill-web-dev"],
    tags: ["AI-Art", "Generative", "Geometric", "Teal", "Retro-Futurism"],
    category: "genai"
  },
  {
    id: "art-bauhaus",
    title: "Asymmetric Bauhaus Typographic Grid",
    description: "A transmedia visual system emphasizing bold geometric typography, high-contrast flat layout forms, and grid alignments.",
    image: "/assets/gallery_genai_2.png",
    stack: ["Figma", "Visual Language of Design", "Branding"],
    skills: ["skill-graphic-design", "skill-visual-language", "skill-branding"],
    tags: ["AI-Art", "Bauhaus", "Typography", "Minimalism", "Abstract"],
    category: "genai"
  },
  {
    id: "art-fluid-physics",
    title: "Eulerian Fluid Convection grid",
    description: "A real-time numeric simulation of the Navier-Stokes velocity equations, rendering smoke eddies procedurally.",
    image: "/assets/gallery_genai_1.png",
    stack: ["Fluid Physics", "Canvas & WebGL", "JavaScript"],
    skills: ["skill-web-dev", "skill-software-dev", "skill-ml"],
    tags: ["AI-Art", "Generative", "Fluid-Physics", "Interactive", "Math"],
    category: "genai"
  },
  {
    id: "art-synth-waves",
    title: "Resonant Frequency Waveforms",
    description: "An audio-visual exploration mapping real-time frequency data sweeps to concentric vector rings and soundscapes.",
    image: "/assets/gallery_genai_3.png",
    stack: ["Web Audio API", "SVG Math & Geometry", "TypeScript"],
    skills: ["skill-web-dev", "skill-software-dev", "skill-genai"],
    tags: ["AI-Art", "Generative", "Abstract", "Web-Audio", "Sound"],
    category: "genai"
  },
  {
    id: "art-pnw-mist",
    title: "Misty Cascades (Pacific Northwest)",
    description: "A minimalist black & white fine-art print capturing low clouds clinging to pine forests in the Cascades.",
    image: "/assets/gallery_photo_1.png",
    stack: ["Adobe Photoshop", "Adobe Lightroom", "Camera Systems"],
    skills: ["skill-digital-photography", "skill-photo-retouching", "skill-composition"],
    tags: ["Photography", "PNW", "Landscape", "Nature", "Black-and-White"],
    category: "photography"
  },
  {
    id: "art-urban-geometry",
    title: "Steel & Concrete (Portland Bridge)",
    description: "A high-contrast study of structural alignment and engineering lines on the Willamette River.",
    image: "/assets/gallery_photo_2.png",
    stack: ["Digital Photography", "Composition Guidelines"],
    skills: ["skill-digital-photography", "skill-composition"],
    tags: ["Photography", "PNW", "Urban", "Minimalism", "Lines"],
    category: "photography"
  },
  {
    id: "art-midwest-roots",
    title: "Midwest Roots (Vintage Barn)",
    description: "A warm, natural light landscape capture of agricultural history and rustic timber framing in Ohio.",
    image: "/assets/gallery_photo_3.png",
    stack: ["Digital Photography", "Adobe Lightroom"],
    skills: ["skill-digital-photography", "skill-photo-retouching"],
    tags: ["Photography", "Midwest", "Landscape", "Vintage", "Nature"],
    category: "photography"
  },
  {
    id: "art-event-ops",
    title: "Orchestration & Supply Logistics",
    description: "An action shot documenting event setup operations, capturing physical material vectors and human labor.",
    image: "/assets/gallery_photo_2.png",
    stack: ["Event Photography", "Media Management"],
    skills: ["skill-digital-photography", "skill-photo-retouching"],
    tags: ["Photography", "Event", "Urban", "Action"],
    category: "photography"
  }
];
