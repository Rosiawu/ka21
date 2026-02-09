/**
 * 团队成员信息接口
 * 用于定义"关于我们"页面中团队成员的数据结构
 */
export interface TeamMember {
  /** 唯一标识符，建议使用姓名拼音 */
  id: string;
  
  /** 成员姓名，显示在卡片顶部 */
  name: string;
  
  /** 职业/职位，显示在姓名下方 */
  title: string;
  
  /** 头像图片路径，推荐尺寸400x400像素 */
  avatar: string;
  
  /** 所在城市/地区 */
  location?: string;
  
  /** 专业领域，多个领域用逗号分隔，会显示为标签 */
  specialty?: string;
  
  /** MBTI性格类型（选填） */
  mbti?: string;
  
  /** 个人昵称或特色标签（选填） */
  nickname?: string;
  
  /** 微信公众号二维码图片路径，推荐尺寸300x300像素 */
  wechatQR?: string;
  
  /** 微信公众号名称 */
  wechatAccount?: string;
  
  /** 常用的AI工具列表，显示在卡片背面 */
  aiTools?: string[];
  
  /** 个人简介，建议50字以内 */
  description?: string;
  
  /** 专业技能列表，会显示为标签 */
  skills?: string[];

  /** 项目亮点，显示成员的代表性项目或成就 */
  projectHighlights?: string[] | string;
  
  /** 个人特质，描述成员的性格或工作特点 */
  personalTraits?: Array<{icon?: string; label: string}> | string[] | string;
}

/**
 * 团队能力分布数据接口
 * 用于"团队AI工具使用分布"图表展示
 */
export interface TeamCapability {
  /** AI工具名称或专业领域 */
  category: string;
  
  /** 使用该工具/具备该领域能力的成员数量 */
  count: number;
  
  /** 在团队中的占比百分比 */
  percentage: number;
} 