import { TeamMember } from '../types/team';

/**
 * 团队成员数据集合
 * 
 * 新增或更新成员信息时，请遵循以下字段说明和格式要求
 */
export const teamMembers: TeamMember[] = [
  {
    id: "wuman",             // 唯一ID，使用姓名拼音，便于识别和引用
    name: "吴熳",            // 显示的姓名
    title: "AI native 网站开发者",  // 职业/职位，显示在姓名下方
    avatar: "/images/team/avatar-wuman.png", // 头像图片路径，推荐尺寸400x400像素
    location: "北京",        // 所在城市
    specialty: "资深英语教师培训专家", // 专业领域，用逗号分隔，会显示为标签
    mbti: "ESFP",           // MBTI性格类型（选填）
    nickname: "女将军/包工头", // 个人昵称/标签（选填）
    wechatQR: "/images/team/qr-wuman.png", // 微信公众号二维码图片路径，推荐尺寸300x300像素
    wechatAccount: "英语好课研磨", // 微信公众号名称
    aiTools: ["Codex", "Cursor", "Claude", "即梦"], // 常用AI工具，显示在卡片背面
    description: "牛马库网站vibe coder，评测过200多种AI工具的狂热爱好者和分享者，代表中国在英国大使馆文教处大会全英发言AI赋能英语教学，得到AI分享嘉宾，95%的工作第一步由AI完成。", // 个人简介，建议50字以内
    skills: ["Coding能力", "英语培训", "AI辅助英语教学"], // 专业技能，会显示为标签
    projectHighlights: ["码龄12天，已成为小程序开发者", "代表中国在英国大使馆文教处大会全英发言AI赋能英语教学", "得到AI分享嘉宾", "95%的工作第一步由AI完成"],
    personalTraits: ["求真创新", "跨界开发者", "热情好客", "好奇心爆棚"]
  },
  {
    id: "cool",
    name: "三金",
    title: "运维工程师",
    avatar: "/images/team/avatar-cool.png", // 暂用默认头像，正式上线前需替换
    location: "郑州",
    specialty: "KA21 导航站代码主要贡献者,企业软件运维工程师",
    mbti: "ISTJ",
    nickname: "Cool",
    wechatQR: "/images/team/qr-cool.png", // 暂用默认二维码，正式上线前需替换
    wechatAccount: "三金的AI工具箱",
    aiTools: ["Cursor", "Chatgpt", "Gemini"],
    description: "所有的东西都可以用AI重新再做一遍",
    skills: ["企业软件运维工程师", "Cursor开发实践者"],
    projectHighlights: ["KA21工具导航站维护与开发", "企业级软件系统运维", "AI辅助开发流程优化"],
    personalTraits: ["技术探索", "系统思维", "效率至上", "持续学习"]
  },
  {
    id: "xiaojinyu",
    name: "百宝箱子",
    title: "独立全栈设计师",
    avatar: "/images/team/avatar-xiaojinyu.png", // 暂用默认头像，正式上线前需替换
    location: "广东湛江",
    specialty: "图像类提示词工程师",
    mbti: "INFP",
    nickname: "小金鱼",
    wechatQR: "/images/team/qr-xiaojinyu.png", // 暂用默认二维码，正式上线前需替换
    wechatAccount: "明冥箱子",
    aiTools: ["Trae", "Lovart", "Gemini", "Claude", "即梦", "豆包"],
    description: "近一年体验使用上百款最新AI产品，拥有深入细微的AI产品见解，曾结合用户需求和图像热点设计过多款智能体及科普用法，目前在AI动画短剧生成领域深耕",
    skills: ["UI产品设计", "AI动画短片创作", "图像类提示词工程"],
    projectHighlights: ["AI产品评测", "智能体设计", "AI动画短剧生成"],
    personalTraits: ["技术探索", "创新思维", "用户体验", "持续学习"]
  },
  {
    id: "azhen",
    name: "阿真Irene",
    title: "视觉设计师",
    avatar: "/images/team/avatar-azhen.png", // 暂用默认头像，正式上线前需替换
    location: "深圳",
    specialty: "品牌设计,AI绘图视频创作",
    mbti: "INFJ",
    nickname: "毛毛",
    wechatQR: "/images/team/qr-azhen.png", // 暂用默认二维码，正式上线前需替换
    wechatAccount: "阿真Irene",
    aiTools: ["ChatGPT", "Midjourney", "即梦"],
    description: "以设计之眼观察世界，以 AI 之笔重构想象。",
    skills: ["品牌设计","AI绘图视频创作"],
    projectHighlights: ["打造品牌视觉识别系统", "AI辅助创意设计流程"],
    personalTraits: ["创意思考", "细节关注", "视觉敏锐", "审美创新"]
  },
  {
    id: "loki",
    name: "赛博小熊猫Loki",
    title: "K12教育视频部门负责人",
    avatar: "/images/team/avatar-loki.png",
    location: "北京",
    specialty: "AI绘图视频创作测评,课程设计,提示词写作",
    mbti: "ISTJ",
    nickname: "Loki、小熊猫、小能苗",
    wechatQR: "/images/team/qr-loki.png",
    wechatAccount: "赛博小熊猫Loki",
    aiTools: ["Claude", "Chatgpt", "Gemini","Lovart ","Hatch ","即梦"],
    description: "白天搞内容，晚上测工具。不是在写内容，就是在看演出；不是在测工具，就是在路上想点新玩法。",
    skills: ["AI绘图视频创作测评", "课程设计", "提示词写作"],
    projectHighlights: ["K12教育视频内容革新", "AI绘图工具专业评测", "提示词优化与分享"],
    personalTraits: ["探索精神", "技术好奇", "创意实践", "知识分享"]
  },
  {
    id: "washu",
    name: "瓦叔",
    title: "新媒体直播技术负责人 / AI数字内容策划师 ",
    avatar: "/images/team/avatar-washu.png",
    location: "上海",
    specialty: "新媒体直播技术,AIGC内容创新,音视频制作",
    mbti: "ISTJ",
    nickname: "瓦叔 荷包蛋",
    wechatQR: "/images/team/qr-washu.png",
    wechatAccount: "靠谱瓦叔AI趣探 ",
    aiTools: ["即梦", "可灵", "Vidu"],
    description: "率先将文生图、虚拟数字人等AI工具应用于政企宣传视频制作，实现从图文到视频的高效工作流，将制作效率提升超50%。",
    skills: ["大型活动直播策划与执行", " OBS (专家级)", "AIGC内容创新"],
    projectHighlights: ["政企宣传视频AI制作流程优化", "虚拟数字人应用实践", "多媒体直播技术革新"],
    personalTraits: ["技术专精", "创新应用", "效率提升", "解决方案专家"]
  },
  {
    id: "labi",
    name: "蜡笔",
    title: "信息化项目经理",
    avatar: "/images/team/avatar-labi.png",
    location: "深圳",
    specialty: "信息化系统项目实施,AI绘图",
    mbti: "INFJ",
    nickname: "蜡笔",
    wechatQR: "/images/team/qr-labi.png",
    wechatAccount: "树语牧歌",
    aiTools: ["即梦","lovart", "ChatGPT", "Gemini","Claude"],
    description: "信息化系统打工人\n AI学习者，热衷用AI绘图，分享实用测评与入门教程。",
    skills: ["信息化系统项目实施", "AI绘图"],
    projectHighlights: ["企业信息化系统整体规划与实施", "AI绘图工具实用测评与教程分享"],
    personalTraits: ["系统思维", "项目管理", "技术普及", "知识分享"]
  },
  {
    id: "william",
    name: "William",
    title: "货代海外操作",
    avatar: "/images/team/avatar-william.png",
    location: "宁波",
    specialty: "航运物流,AIGC内容创作,AI理论与原理讲解",
    mbti: "INFJ",
    nickname: "八爪鱼",
    wechatQR: "/images/team/qr-william.png",
    wechatAccount: "八爪鱼威廉",
    aiTools: ["字节系/阿里系AI工具"],
    description: "持有Nvidia，微软，IBM官方认证AI证书\n 高校企业导师，省人工智能学会会员\n 君子，可如玉，温润而泽。亦可执剑，问鼎山巅。",
    skills: ["航运物流", "AIGC内容创作","AI理论与原理讲解"],
    projectHighlights: ["航运物流数字化转型实践", "AI技术理论与原理科普", "AIGC创作流程优化"],
    personalTraits: ["专业认证", "理论与实践并重", "教学引导", "持续学习"]
  },
  {
    id: "beiguo",
    name: "贝果",
    title: "AI教育产品负责人",
    avatar: "/images/team/avatar-beiguo.png", // 暂用默认头像，正式上线前需替换
    location: "北京",
    specialty: "AI教育,AIGC内容创作,产品设计",
    mbti: "ENTP",
    nickname: "贝果 产品设计 舞蹈博主 宠物博主",
    wechatQR: "/images/team/qr-beiguo.png", // 暂用默认二维码，正式上线前需替换
    wechatAccount: "人工智能怨气指南",
    aiTools: ["Claude", "豆包", "hatchcanvas"],
    description: "人见人爱的人工智能产品经理\n使用AI如德芙般纵享丝滑\n可能是会跳舞的产品经理中人工智能用的最溜的",
    skills: ["AI教育", "AIGC内容创作", "产品设计"],
    projectHighlights: ["AI教育产品创新", "AIGC内容创作流程优化", "用户体验设计"],
    personalTraits: ["创新思维", "设计能力", "教育引导", "跨界融合"]
  },
  {
    id: "jinwei",
    name: "金威",
    title: "产品结构设计",
    avatar: "/images/team/avatar-jinwei.png", // 暂用默认头像，正式上线前需替换
    location: "苏州",
    specialty: "3D打印,AIGC内容创作",
    mbti: "INTJ-A",
    nickname: "乌鸦",
    wechatQR: "/images/team/qr-jinwei.png", // 暂用默认二维码，正式上线前需替换
    wechatAccount: "科技的美丽世界",
    aiTools: ["Tripo", "Claude", "ChatGPT", "Gemini", "Monica", "Lovart", "豆包"],
    description: "AI的学习者\n兴趣使然的爱好者\n3D打印的熟练工",
    skills: ["3D打印", "产品结构设计", "AIGC内容创作"],
    projectHighlights: ["3D打印技术应用与创新", "产品结构设计优化", "AIGC辅助设计流程"],
    personalTraits: ["技术精进", "创新应用", "跨界整合", "实践导向"]
  },
  {
    id: "rongrong",
    name: "融融",
    title: "人力资源管理",
    avatar: "/images/team/avatar-rongrong.png", // 暂用默认头像，正式上线前需替换
    location: "天津",
    specialty: "AIGC内容创作,人力资源管理",
    mbti: "INFJ",
    nickname: "融融",
    wechatQR: "/images/team/qr-rongrong.png", // 暂用默认二维码，正式上线前需替换
    wechatAccount: "金枝AI育见录",
    aiTools: ["Monica", "Claude", "Gemini", "豆包", "天工"],
    description: "AIGC爱好者，热衷探索AI在亲子教育方面的应用",
    skills: ["人力资源管理", "AIGC内容创作", "亲子教育"],
    projectHighlights: ["AI辅助亲子教育内容创作", "人力资源管理流程优化", "AIGC教育应用实践"],
    personalTraits: ["创新思维", "教育热忱", "人文关怀", "技术探索"]
  },
  {
    id: "yoji",
    name: "由吉yoji",
    title: "视觉设计师，自媒体运营",
    avatar: "/images/team/avatar-yoji.png", // 暂用默认头像，正式上线前需替换
    location: "广州",
    specialty: "AI绘图视频创作,自媒体创作",
    mbti: "INFJ",
    nickname: "由吉，yoji",
    wechatQR: "/images/team/qr-yoji.png", // 暂用默认二维码，正式上线前需替换
    wechatAccount: "职场AI智多星",
    aiTools: ["ChatGPT", "即梦", "可灵", "豆包"],
    description: "AI爱好者，学习者，与AI一起玩出设计、自媒体新花样～",
    skills: ["视觉设计", "自媒体运营", "AI绘图创作"],
    projectHighlights: ["AI辅助设计创作流程优化", "自媒体内容AI增强"],
    personalTraits: ["创新思维", "设计能力", "学习精神", "创意应用"]
  },
  {
    id: "feifei",
    name: "霏霏",
    title: "电商视觉策划/服装陈列师",
    avatar: "/images/team/avatar-feifei.png", // 暂用默认头像，正式上线前需替换
    location: "广州",
    specialty: "AIGC内容创作（电商）,AI创意探索",
    mbti: "INFJ",
    nickname: "霏霏",
    wechatQR: "/images/team/qr-feifei.png", // 暂用默认二维码，正式上线前需替换
    wechatAccount: "霏霏同学",
    aiTools: ["扣子空间", "LibLib AI", "豆包", "即梦", "Lovart", "Notebook LM", "DeepSeek"],
    description: "AIGC爱好者，热衷于探索AI前沿技术，尤其专注于AIGC在电商视觉领域的创新应用。\n深耕AI工具，持续学习与实践，目标是成为AI赋能创意设计的行业专家。",
    skills: ["电商视觉策划", "服装陈列设计", "AIGC内容创作"],
    projectHighlights: ["AI赋能电商视觉创新应用", "AIGC电商创意实践"],
    personalTraits: ["创意思维", "技术探索", "学习精神", "专业实践"]
  },
  {
    id: "tangshui",
    name: "烫水",
    title: "AI产品经理",
    avatar: "/images/team/avatar-tangshui.png",
    location: "北京",
    specialty: "AI产品经理,编程,vibecoding",
    mbti: "ENFP",
    nickname: "烫水 / 热到融化",
    wechatQR: "/images/team/qr-tangshui.png",
    wechatAccount: "Open烫水",
    aiTools: ["Claude Code"],
    description: "我是烫水（热҈到҈融҈化҈），985工科研二在读，AI产品经理。当我用vibecoding闭环了多款产品后，我确信，编程不是工具，而是产品思维的延伸。",
    skills: ["AI产品设计", "编程开发（vibecoding）", "产品创业"],
    projectHighlights: [
      "求职类：Agent对话式交互简历工具《职白简历》 https://www.gamets.online",
      "学术类：医学垂直领域《小师弟医学文献综述》 http://xsdref.com"
    ],
    personalTraits: ["🚀 产品闭环思维", "💡 创新创业精神", "🌱 持续迭代成长", "🧠 跨领域整合能力"]
  },
  {
    id: "fenglaoshi",
    name: "风老师",
    title: "教育创作者",
    avatar: "/images/team/avatar-fenglaoshi.jpg",
    location: "南京",
    specialty: "教育,AIGC内容创作",
    mbti: "INTJ",
    nickname: "风老师",
    wechatQR: "",
    wechatAccount: "",
    aiTools: ["Gemini", "GPT"],
    description: "AI的问题交给AI去处理",
    skills: ["教育", "AIGC内容创作"],
    projectHighlights: [],
    personalTraits: ["风言风语", "狂热 AI 测评者", "名言“只要学得慢，啥都不用学”"]
  },
  {
    id: "Seele",
    name: "Seele",
    title: "数据分析师",
    avatar: "/images/team/avatar-seele.png", // 暂用默认头像，正式上线前需替换
    location: "北京",
    specialty: "教育培训,AI培训",
    mbti: "INTJ",
    nickname: "豆包儿，边牧",
    wechatQR: "/images/team/qr-seele.png", // 暂用默认二维码，正式上线前需替换
    wechatAccount: "一念既出",
    aiTools: ["飞书多维表格", "ima", "Monica", "ChatGPT"],
    description: "用数据描绘现实，用AI重塑流程，用言语传递人性。",
    skills: ["数据分析", "数据可视化", "数据挖掘"],
    projectHighlights: ["数据分析与可视化", "数据挖掘与分析"],
    personalTraits: ["数据驱动", "技术探索", "学习精神", "专业实践"]
  }
];

/**
 * 计算团队AI工具使用分布
 * 统计每个AI工具被多少团队成员使用，用于"团队AI工具使用分布"图表
 * @returns {Array} 包含工具名称、使用人数、百分比的数组
 */
export const calculateTeamCapabilities = () => {
  const categories = new Map<string, number>();
  
  // 统计各成员使用的AI工具
  teamMembers.forEach(member => {
    if (member.aiTools) {
      member.aiTools.forEach(tool => {
        categories.set(tool, (categories.get(tool) || 0) + 1);
      });
    }
  });
  
  // 转换为数组格式
  return Array.from(categories.entries())
    .map(([category, count]) => ({
      category,       // AI工具名称
      count,          // 使用该工具的成员数量
      percentage: (count / teamMembers.length) * 100  // 使用百分比
    }))
    .sort((a, b) => b.count - a.count);  // 按使用人数从多到少排序
}; 
