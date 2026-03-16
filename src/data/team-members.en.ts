import type { TeamMember } from '@/types/team';

type LocalizedTeamMemberProfile = Partial<
  Pick<
    TeamMember,
    | 'name'
    | 'title'
    | 'location'
    | 'specialty'
    | 'nickname'
    | 'wechatAccount'
    | 'aiTools'
    | 'description'
    | 'skills'
    | 'personalTraits'
  >
>;

export const teamMemberEnProfiles: Record<string, LocalizedTeamMemberProfile> = {
  wuman: {
    name: 'Man Wu',
    title: 'AI-Native Web Builder',
    location: 'Beijing',
    specialty: 'Senior English Teacher Training Expert',
    nickname: 'General / Foreman',
    wechatAccount: 'English Teaching Lab',
    aiTools: ['Codex', 'Cursor', 'Claude', 'Jimeng'],
    description:
      'Vibe coder behind the KA21 AI Workhorse Library. A relentless tester and sharer who has reviewed more than 200 AI tools. She represented China and delivered a full English talk at an education conference hosted by the Education Section of the British Embassy on AI-powered English teaching. Ninety-five percent of her work starts with AI.',
    skills: ['Coding', 'English Teacher Training', 'AI-Powered English Teaching'],
    personalTraits: ['Truth-Seeking Innovation', 'Cross-Disciplinary Builder', 'Warm and Welcoming', 'Extremely Curious'],
  },
  cool: {
    name: 'Sanjin',
    title: 'Operations Engineer',
    location: 'Zhengzhou',
    specialty: 'Core Code Contributor to KA21 Directory, Enterprise Software Operations Engineer',
    wechatAccount: "Sanjin's AI Toolbox",
    aiTools: ['Cursor', 'ChatGPT', 'Gemini'],
    description: 'Anything can be rebuilt with AI.',
    skills: ['Enterprise Software Operations', 'Cursor-Based Development'],
    personalTraits: ['Technical Explorer', 'Systems Thinker', 'Efficiency First', 'Lifelong Learner'],
  },
  xiaojinyu: {
    name: 'Jinyu',
    title: 'Independent Full-Stack Designer',
    location: 'Zhanjiang, Guangdong',
    specialty: 'Image Prompt Engineer',
    nickname: 'Goldfish',
    wechatAccount: 'Mingming Box',
    aiTools: ['Trae', 'Lovart', 'Gemini', 'Claude', 'Jimeng', 'Doubao'],
    description:
      'Over the past year, I have tried hundreds of the newest AI products and built a sharp eye for subtle product details. I have designed multiple agents and educational workflows around user needs and image trends, and I am now deeply focused on AI animated short-form storytelling.',
    skills: ['UI Product Design', 'AI Animated Short Creation', 'Image Prompt Engineering'],
    personalTraits: ['Technical Explorer', 'Innovative Thinker', 'User-Centered', 'Lifelong Learner'],
  },
  azhen: {
    name: 'Irene',
    title: 'Visual Designer',
    location: 'Shenzhen',
    specialty: 'Brand Design, AI Visual and Video Creation',
    nickname: 'Mao Mao',
    wechatAccount: 'Irene A-Zhen',
    aiTools: ['ChatGPT', 'Midjourney', 'Jimeng'],
    description: "I observe the world through a designer's eye and rebuild imagination with the brush of AI.",
    skills: ['Brand Design', 'AI Visual and Video Creation'],
    personalTraits: ['Creative Thinker', 'Detail-Oriented', 'Strong Visual Sensibility', 'Innovative Aesthetic'],
  },
  loki: {
    name: 'Loki',
    title: 'Head of K-12 Video Education',
    location: 'Beijing',
    specialty: 'AI Visual and Video Tool Reviews, Curriculum Design, Prompt Writing',
    nickname: 'Loki / Little Raccoon / Little Spark',
    wechatAccount: 'Cyber Raccoon Loki',
    aiTools: ['Claude', 'ChatGPT', 'Gemini', 'Lovart', 'Hatch', 'Jimeng'],
    description:
      "By day I make content, by night I test tools. If I'm not writing, I'm watching a show. If I'm not testing, I'm on the road thinking up new ideas.",
    skills: ['AI Visual and Video Tool Reviews', 'Curriculum Design', 'Prompt Writing'],
    personalTraits: ["Explorer's Mindset", 'Technically Curious', 'Creative in Practice', 'Generous with Knowledge'],
  },
  washu: {
    name: 'Uncle Wa',
    title: 'Head of New Media Livestream Technology / AI Digital Content Strategist',
    location: 'Shanghai',
    specialty: 'New Media Livestream Technology, AIGC Content Innovation, Audio and Video Production',
    nickname: 'Uncle Wa / Fried Egg',
    wechatAccount: 'Uncle Wa AI Explorer',
    aiTools: ['Jimeng', 'Kling', 'Vidu'],
    description:
      'I was among the first to apply text-to-image, virtual humans, and other AI tools to public-sector and enterprise promotional video production, building an efficient workflow from text and images to video and improving production efficiency by more than 50 percent.',
    skills: ['Large-Scale Livestream Planning and Execution', 'OBS (Expert)', 'AIGC Content Innovation'],
    personalTraits: ['Highly Technical', 'Innovative in Execution', 'Efficiency Booster', 'Solution-Oriented'],
  },
  labi: {
    name: 'Labi',
    title: 'Digital Transformation Project Manager',
    location: 'Shenzhen',
    specialty: 'Information Systems Implementation, AI Visual Creation',
    nickname: 'Labi',
    wechatAccount: 'Tree Whisper Pastoral',
    aiTools: ['Jimeng', 'Lovart', 'ChatGPT', 'Gemini', 'Claude'],
    description:
      'An information systems workhorse and AI learner, obsessed with AI visual creation and happy to share practical reviews and beginner-friendly tutorials.',
    skills: ['Information Systems Implementation', 'AI Visual Creation'],
    personalTraits: ['Systems Thinker', 'Strong Project Management', 'Good at Simplifying Tech', 'Generous with Knowledge'],
  },
  Seele: {
    name: 'Seele',
    title: 'Data Analyst',
    location: 'Beijing',
    specialty: 'Education and Training, AI Training',
    nickname: 'Doubao / Border Collie',
    wechatAccount: 'One Thought Unleashed',
    aiTools: ['Feishu Bitable', 'ima', 'Monica', 'ChatGPT'],
    description: 'I use data to sketch reality, AI to redesign workflows, and language to carry human warmth.',
    skills: ['Data Analysis', 'Data Visualization', 'Data Mining'],
    personalTraits: ['Data-Driven', 'Technical Explorer', 'Growth-Oriented', 'Practice-Focused'],
  },
  william: {
    name: 'William',
    title: 'Overseas Freight Operations Specialist',
    location: 'Ningbo',
    specialty: 'Shipping and Logistics, AIGC Content Creation, AI Theory and Principles',
    nickname: 'Octopus',
    wechatAccount: 'Octopus William',
    aiTools: ['ByteDance and Alibaba AI tools'],
    description:
      'Holder of official AI certifications from Nvidia, Microsoft, and IBM. A mentor for both universities and companies, and a member of a provincial AI association. Gentle as jade when needed, sharp as a blade when it counts.',
    skills: ['Shipping and Logistics', 'AIGC Content Creation', 'AI Theory and Principles'],
    personalTraits: ['Professionally Certified', 'Balances Theory and Practice', 'Strong Teaching Instinct', 'Lifelong Learner'],
  },
  fenglaoshi: {
    name: 'Mr. Feng',
    title: 'Education Creator',
    location: 'Nanjing',
    specialty: 'Education, AIGC Content Creation',
    nickname: 'Mr. Feng',
    aiTools: ['Gemini', 'GPT'],
    description: 'Let AI handle AI problems.',
    skills: ['Education', 'AIGC Content Creation'],
    personalTraits: ['Witty and unpredictable', 'Hardcore AI Reviewer', 'Motto: "If you learn slowly enough, you never have to learn anything."'],
  },
  beiguo: {
    name: 'Bagel',
    title: 'Head of AI Education Products',
    location: 'Beijing',
    specialty: 'AI Education, AIGC Content Creation, Product Design',
    nickname: 'Bagel / Product Designer / Dance Creator / Pet Blogger',
    wechatAccount: 'AI Grievance Guide',
    aiTools: ['Claude', 'Doubao', 'Hatch Canvas'],
    description:
      'An AI product manager people tend to like right away. Uses AI with effortless fluency. Possibly the best AI user among product managers who can also dance.',
    skills: ['AI Education', 'AIGC Content Creation', 'Product Design'],
    personalTraits: ['Innovative Thinker', 'Strong Design Sense', 'Education-Minded', 'Cross-Functional Integrator'],
  },
  jinwei: {
    name: 'Jinwei',
    title: 'Product Structural Designer',
    location: 'Suzhou',
    specialty: '3D Printing, AIGC Content Creation',
    nickname: 'Raven',
    wechatAccount: 'The Beautiful World of Tech',
    aiTools: ['Tripo', 'Claude', 'ChatGPT', 'Gemini', 'Monica', 'Lovart', 'Doubao'],
    description: 'An AI learner, a curiosity-driven builder, and an experienced 3D printing practitioner.',
    skills: ['3D Printing', 'Product Structural Design', 'AIGC Content Creation'],
    personalTraits: ['Always Refining the Craft', 'Innovative in Execution', 'Cross-Functional Integrator', 'Practice-Focused'],
  },
  rongrong: {
    name: 'Rongrong',
    title: 'Human Resources Manager',
    location: 'Tianjin',
    specialty: 'AIGC Content Creation, Human Resources Management',
    nickname: 'Rongrong',
    wechatAccount: 'Golden Branch AI Parenting Notes',
    aiTools: ['Monica', 'Claude', 'Gemini', 'Doubao', 'Tiangong'],
    description: 'An AIGC enthusiast exploring how AI can support parenting and family education.',
    skills: ['Human Resources Management', 'AIGC Content Creation', 'Parenting Education'],
    personalTraits: ['Innovative Thinker', 'Passion for Education', 'Human-Centered', 'Technical Explorer'],
  },
  yoji: {
    name: 'Yoji',
    title: 'Visual Designer, Social Media Operator',
    location: 'Guangzhou',
    specialty: 'AI Visual and Video Creation, Social Media Content Creation',
    nickname: 'Yoji',
    wechatAccount: 'Workplace AI Know-It-All',
    aiTools: ['ChatGPT', 'Jimeng', 'Kling', 'Doubao'],
    description: 'An AI enthusiast and learner who keeps exploring fresh ways to merge design, social content, and AI.',
    skills: ['Visual Design', 'Social Media Operations', 'AI Visual Creation'],
    personalTraits: ['Innovative Thinker', 'Strong Design Sense', 'Growth-Oriented', 'Creative Application'],
  },
  feifei: {
    name: 'Feifei',
    title: 'E-commerce Visual Planner / Fashion Visual Merchandiser',
    location: 'Guangzhou',
    specialty: 'AIGC Content Creation for E-commerce, AI Creative Exploration',
    nickname: 'Feifei',
    wechatAccount: 'Feifei Notes',
    aiTools: ['Coze Space', 'LibLib AI', 'Doubao', 'Jimeng', 'Lovart', 'Notebook LM', 'DeepSeek'],
    description:
      'An AIGC enthusiast deeply curious about frontier AI, especially the innovative use of AIGC in e-commerce visuals. I keep learning and practicing AI tools with the goal of becoming a specialist in AI-powered creative design.',
    skills: ['E-commerce Visual Planning', 'Fashion Visual Merchandising', 'AIGC Content Creation'],
    personalTraits: ['Creative Thinker', 'Technical Explorer', 'Growth-Oriented', 'Practice-Focused'],
  },
  tangshui: {
    name: 'Tangshui',
    title: 'AI Product Manager',
    location: 'Beijing',
    specialty: 'AI Product Management, Coding, Vibe Coding',
    nickname: 'Tangshui / Melting from Heat',
    wechatAccount: 'Open Tangshui',
    aiTools: ['Claude Code'],
    description:
      'I am Tangshui, a second-year engineering graduate student at a 985 university and an AI product manager. After using vibe coding to close the loop on multiple products, I became convinced that coding is not just a tool. It is an extension of product thinking.',
    skills: ['AI Product Design', 'Product Development with Vibe Coding', 'Product Entrepreneurship'],
    personalTraits: [
      { icon: '🚀', label: 'End-to-End Product Thinking' },
      { icon: '💡', label: 'Builder and Entrepreneurial Spirit' },
      { icon: '🌱', label: 'Continuous Iteration and Growth' },
      { icon: '🧠', label: 'Cross-Domain Synthesis' },
    ],
  },
};
