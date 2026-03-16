'use client';

import React, { useState } from 'react';
import Image from 'next/image';
import { TeamMember } from '@/types/team';
import { usePathname } from 'next/navigation';
import { teamMemberEnProfiles } from '@/data/team-members.en';

interface TeamMemberCardProps {
  member: TeamMember;
}

// 特质标签与emoji对应表
const traitEmojis: Record<string, string> = {
  // 学习相关
  '跨领域学习': '🚀',
  '持续学习': '📚',
  '终身学习': '📚',
  '学习能力': '🧠',
  
  // 思维方式
  '创新思维': '💡',
  '系统思维': '🔄',
  '创意思考': '💭',
  '逻辑思维': '🧩',
  
  // 性格特质
  '执行力强': '⚡',
  '细节关注': '🔍',
  '持续成长': '🌱',
  '创新应用': '💫',
  '效率提升': '⏱️',
  
  // 专业特性
  '技术专精': '⚙️',
  '解决方案专家': '🛠️',
  '视觉敏锐': '👁️',
  '审美创新': '🎨',
  '知识分享': '📢',
  '探索精神': '🧭',
  '技术好奇': '🔭',
  '创意实践': '✨',
  '项目管理': '📋',
  '技术普及': '📡',
  '理论与实践并重': '⚖️',
  '教学引导': '🧙‍♂️',
  '专业认证': '🏆',
  'Truth-Seeking Innovation': '✨',
  'Cross-Disciplinary Builder': '🧩',
  'Warm and Welcoming': '🤝',
  'Extremely Curious': '🧠',
  'Technical Explorer': '🔭',
  'Systems Thinker': '🔄',
  'Efficiency First': '⚡',
  'Lifelong Learner': '📚',
  'Innovative Thinker': '💡',
  'User-Centered': '🎯',
  'Creative Thinker': '💭',
  'Detail-Oriented': '🔍',
  'Strong Visual Sensibility': '👁️',
  'Innovative Aesthetic': '🎨',
  "Explorer's Mindset": '🧭',
  'Technically Curious': '🔭',
  'Creative in Practice': '✨',
  'Generous with Knowledge': '📢',
  'Highly Technical': '⚙️',
  'Innovative in Execution': '💫',
  'Efficiency Booster': '⏱️',
  'Solution-Oriented': '🛠️',
  'Strong Project Management': '📋',
  'Good at Simplifying Tech': '📡',
  'Data-Driven': '📊',
  'Growth-Oriented': '🌱',
  'Practice-Focused': '🧱',
  'Professionally Certified': '🏆',
  'Balances Theory and Practice': '⚖️',
  'Strong Teaching Instinct': '🧙‍♂️',
  'Witty and unpredictable': '🌀',
  'Hardcore AI Reviewer': '🔬',
  'Strong Design Sense': '🎨',
  'Education-Minded': '🎓',
  'Cross-Functional Integrator': '🧩',
  'Always Refining the Craft': '⚙️',
  'Passion for Education': '🎓',
  'Human-Centered': '❤️',
  'Creative Application': '🎬',
  
  // 默认
  '默认': '✨',
};

// 获取特质对应的emoji
const getTraitEmoji = (trait: string): string => {
  // 尝试精确匹配
  if (traitEmojis[trait]) {
    return traitEmojis[trait];
  }
  
  // 如果没有精确匹配，尝试部分匹配
  for (const [key, emoji] of Object.entries(traitEmojis)) {
    if (trait.includes(key) || key.includes(trait)) {
      return emoji;
    }
  }
  
  // 默认emoji
  return traitEmojis['默认'];
};

export default function TeamMemberCard({ member }: TeamMemberCardProps) {
  const pathname = usePathname();
  const isEn = pathname?.startsWith('/en');
  const localizedMember = isEn ? teamMemberEnProfiles[member.id] : undefined;
  const [isExpanded, setIsExpanded] = useState(false);
  const text = {
    avatar: isEn ? 'avatar' : '头像',
    locationFallback: isEn ? 'China' : '中国',
    specialty: isEn ? 'Specialty' : '专业领域',
    bio: isEn ? 'Bio' : '个人简介',
    nickname: isEn ? 'Nickname' : '昵称',
    skills: isEn ? 'Skills' : '技术能力',
    coreSkill: isEn ? 'Core domain skill' : '专业领域核心技能',
    supportSkill: isEn ? 'Supporting skill' : '辅助技术能力',
    aiTools: isEn ? 'AI Tools' : '常用AI工具',
    traits: isEn ? 'Personal Traits' : '个人特质',
    officialAccount: isEn ? 'Official Account' : '公众号',
    followHint: isEn ? 'Follow for updates' : '敬请关注',
    accountAlt: isEn ? 'official account' : '的公众号',
    collapse: isEn ? 'Collapse' : '收起',
    expand: isEn ? 'Learn more' : '了解更多',
  };

  const displayName = localizedMember?.name || member.name;
  const displayTitle = localizedMember?.title || member.title;
  const displayLocation = localizedMember?.location || member.location;
  const displaySpecialty = localizedMember?.specialty || member.specialty;
  const displayNickname = localizedMember?.nickname || member.nickname;
  const displayWechatAccount = localizedMember?.wechatAccount || member.wechatAccount;
  const displayAiTools = localizedMember?.aiTools || member.aiTools;
  const displayDescription = localizedMember?.description || member.description;
  const displaySkills = localizedMember?.skills || member.skills;
  const displayTraits = localizedMember?.personalTraits || member.personalTraits;
  
  // 处理展开/收起状态切换
  const toggleExpand = () => {
    setIsExpanded(!isExpanded);
  };
  
  // 将专业领域字符串转换为数组
  const specialtyTags = displaySpecialty?.split(',').map(item => item.trim()) || [];
  
  return (
    <div 
      className={`rounded-xl shadow-lg overflow-hidden transition-all duration-300 light-purple-bg bg-[#f5f3ff] dark:bg-gray-900 border border-indigo-100 dark:border-indigo-800/30 ${
        isExpanded ? 'sm:col-span-1 md:col-span-1 transform translate-y-0' : 'transform hover:-translate-y-1'
      }`}
    >
      {/* 头部信息 */}
      <div className="p-6 flex items-start">
        <div className="relative mr-4">
          <div className="w-16 h-16 rounded-full overflow-hidden bg-white flex items-center justify-center shadow-lg">
            {member.avatar ? (
              <Image 
                src={member.avatar} 
                alt={`${displayName} ${text.avatar}`} 
                width={64} 
                height={64} 
                className="w-full h-full object-cover"
                onError={(e) => {
                  const target = e.target as HTMLImageElement;
                  target.onerror = null;
                  target.src = '/images/team/default-avatar.png';
                }}
              />
            ) : (
              <div className="w-16 h-16 rounded-full bg-gradient-to-r from-indigo-500 to-purple-600 flex items-center justify-center text-white text-xl font-bold">
                {displayName.charAt(0)}
              </div>
            )}
          </div>
          <div className="avatar-ring absolute inset-0 rounded-full border-2 border-indigo-300 dark:border-indigo-500 opacity-50"></div>
        </div>
        <div>
          <h3 className="text-2xl font-bold text-indigo-900 dark:text-primary-400 shadow-sm">{displayName}</h3>
          <p className="text-gray-600 dark:text-gray-400 text-sm">{displayLocation || text.locationFallback}</p>
          <div className="tag-container flex flex-wrap gap-1.5 mt-2">
            {displayTitle && (
              <span className="tag bg-indigo-100 dark:bg-indigo-900/30 text-indigo-800 dark:text-indigo-300 text-xs px-2 py-1 rounded-full shadow-sm">
                {displayTitle}
              </span>
            )}
            {specialtyTags.slice(0, 1).map((tag, index) => (
              <span 
                key={index}
                className="tag bg-purple-100 dark:bg-purple-900/30 text-purple-800 dark:text-purple-300 text-xs px-2 py-1 rounded-full shadow-sm"
              >
                {tag}
              </span>
            ))}
          </div>
        </div>
      </div>
      
      {/* 专业领域 */}
      <div className="px-6 py-3">
        <div className="flex items-center mb-2">
          <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-indigo-500 mr-2">
            <circle cx="12" cy="12" r="10"></circle>
            <polygon points="16.24 7.76 14.12 14.12 7.76 16.24 9.88 9.88 16.24 7.76"></polygon>
          </svg>
          <h2 className="text-lg font-semibold text-gray-700 dark:text-gray-300">{text.specialty}</h2>
        </div>
        <div className="bg-indigo-50 dark:bg-indigo-900/20 rounded-lg p-3 border-l-4 border-indigo-400 dark:border-indigo-500 shadow-sm">
          <p className="text-gray-700 dark:text-gray-300 text-sm">{specialtyTags.join(' · ')}</p>
        </div>
      </div>
      
      {/* 个人简介 - 放在专业领域后面 */}
      {displayDescription && (
        <div className="px-6 py-3">
          <div className="flex items-center mb-2">
            <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-indigo-500 mr-2">
              <circle cx="12" cy="12" r="10"></circle>
              <line x1="12" y1="16" x2="12" y2="12"></line>
              <line x1="12" y1="8" x2="12.01" y2="8"></line>
            </svg>
            <h2 className="text-lg font-semibold text-gray-700 dark:text-gray-300">{text.bio}</h2>
          </div>
          <div className="bg-indigo-50 dark:bg-indigo-900/20 rounded-lg p-3 border-l-4 border-indigo-400 dark:border-indigo-500 text-sm text-gray-700 dark:text-gray-300 whitespace-pre-line">
            {displayDescription}
          </div>
        </div>
      )}
      
      {/* 个人标签信息 - MBTI和昵称 */}
      <div className="px-6 py-3 flex flex-wrap gap-2">
        {member.mbti && (
          <div className="bg-purple-100 dark:bg-purple-900/30 px-2 py-1 text-xs text-purple-800 dark:text-purple-300 rounded-md flex items-center">
            <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="mr-1">
              <circle cx="12" cy="12" r="10"></circle>
              <path d="M12 2a10 10 0 0 1 10 10"></path>
            </svg>
            MBTI: {member.mbti}
          </div>
        )}
        {displayNickname && (
          <div className="bg-orange-100 dark:bg-orange-900/30 px-2 py-1 text-xs text-orange-800 dark:text-orange-300 rounded-md flex items-center">
            <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="mr-1">
              <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path>
              <circle cx="12" cy="7" r="4"></circle>
            </svg>
            {text.nickname}: {displayNickname}
          </div>
        )}
      </div>
      
      {/* 卡片内容 - 展开时显示 */}
      <div 
        className={`overflow-hidden transition-all duration-300 ${
          isExpanded ? 'max-h-[1200px] opacity-100' : 'max-h-0 opacity-0'
        }`}
      >
        {/* 技术能力 */}
        {displaySkills && displaySkills.length > 0 && (
          <div className="px-6 py-3">
            <div className="flex items-center mb-2">
              <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-indigo-500 mr-2">
                <line x1="9" y1="18" x2="15" y2="18"></line>
                <line x1="10" y1="22" x2="14" y2="22"></line>
                <path d="M15.09 14c.18-.98.65-1.74 1.41-2.5A4.65 4.65 0 0 0 18 8A6 6 0 0 0 6 8c0 1 .23 2.23 1.5 3.5A4.61 4.61 0 0 1 8.91 14"></path>
              </svg>
              <h2 className="text-lg font-semibold text-gray-700 dark:text-gray-300">{text.skills}</h2>
            </div>
            <div className="grid grid-cols-2 gap-3">
              {displaySkills.map((skill, index) => (
                <div 
                  key={index} 
                  className="skill-card bg-indigo-50 dark:bg-indigo-900/20 p-3 rounded-lg border border-indigo-200 dark:border-indigo-700/30 shadow-sm"
                >
                  <h3 className="font-medium text-indigo-700 dark:text-indigo-300 text-xs mb-1">{skill}</h3>
                  <p className="text-xs text-gray-600 dark:text-gray-400">
                    {index === 0 ? text.coreSkill : text.supportSkill}
                  </p>
                </div>
              ))}
            </div>
          </div>
        )}
        
        {/* 常用AI工具 */}
        {displayAiTools && displayAiTools.length > 0 && (
          <div className="px-6 py-3">
            <div className="flex items-center mb-2">
              <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-indigo-500 mr-2">
                <path d="M12 8V4m0 4l-4 4m4-4l4 4M4 16v-4a8 8 0 0 1 16 0v4"></path>
                <path d="M18 18v2a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2v-2"></path>
              </svg>
              <h2 className="text-lg font-semibold text-gray-700 dark:text-gray-300">{text.aiTools}</h2>
            </div>
            <div className="flex flex-wrap gap-2">
              {displayAiTools.map((tool, index) => (
                <span 
                  key={index} 
                  className="bg-purple-100 dark:bg-purple-900/30 px-2 py-1 rounded-md text-purple-800 dark:text-purple-300 text-xs"
                >
                  {tool}
                </span>
              ))}
            </div>
          </div>
        )}
        
        {/* 个人特质 - 添加表情图标 */}
        {displayTraits && (
          <div className="px-6 py-3">
            <div className="flex items-center mb-2">
              <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-indigo-500 mr-2">
                <path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z"></path>
                <path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z"></path>
              </svg>
              <h2 className="text-lg font-semibold text-gray-700 dark:text-gray-300">{text.traits}</h2>
            </div>
            <div className="bg-white dark:bg-gray-800 rounded-lg p-3 border border-gray-200 dark:border-gray-700 shadow-sm">
              <div className="flex flex-wrap gap-2">
                {Array.isArray(displayTraits) ? 
                  displayTraits.map((trait, index) => {
                    const traitText = typeof trait === 'string' ? trait : trait.label;
                    // 使用特质对应的emoji或使用trait中定义的icon
                    const traitIcon = typeof trait === 'string' ? getTraitEmoji(trait) : (trait.icon || getTraitEmoji(trait.label));
                    
                    return (
                      <span key={index} className="bg-indigo-50 dark:bg-indigo-900/20 px-2 py-1 rounded-md text-indigo-700 dark:text-indigo-300 text-xs">
                        <span className="mr-1">{traitIcon}</span>
                        {traitText}
                      </span>
                    );
                  }) : 
                  <span className="bg-indigo-50 dark:bg-indigo-900/20 px-2 py-1 rounded-md text-indigo-700 dark:text-indigo-300 text-xs">
                    <span className="mr-1">{getTraitEmoji(displayTraits)}</span>
                    {displayTraits}
                  </span>
                }
              </div>
            </div>
          </div>
        )}
        
        {/* 公众号二维码 */}
        {member.wechatQR && (
          <div className="px-6 py-4 bg-white dark:bg-gray-800 border-t border-indigo-100 dark:border-indigo-800/30">
            <div className="flex justify-between items-center">
              <div className="w-3/4">
                <div className="flex items-center mb-1">
                  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-indigo-500 mr-1">
                    <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path>
                  </svg>
                  <h3 className="text-xs font-semibold text-gray-700 dark:text-gray-300">{text.officialAccount}</h3>
                </div>
                <p className="text-xs text-gray-600 dark:text-gray-400 italic">{displayWechatAccount || text.followHint}</p>
              </div>
              <div className="qr-code w-16 h-16 bg-white dark:bg-gray-800 border-2 border-indigo-200 dark:border-indigo-700 rounded-lg flex items-center justify-center shadow-sm overflow-hidden">
                <Image 
                  src={member.wechatQR} 
                  alt={`${displayName} ${text.accountAlt}`} 
                  width={64} 
                  height={64} 
                  className="w-full h-full object-cover"
                  onError={(e) => {
                    const target = e.target as HTMLImageElement;
                    target.src = '/images/team/qr-default.png';
                  }}
                />
              </div>
            </div>
          </div>
        )}
      </div>
      
      {/* 展开/收起按钮 */}
      <div className="px-6 py-4 bg-white dark:bg-gray-800/50 border-t border-indigo-100 dark:border-indigo-800/30">
        <button
          onClick={toggleExpand}
          className="save-btn bg-indigo-500 hover:bg-indigo-600 dark:bg-blue-600 dark:hover:bg-blue-700 text-white px-4 py-2 rounded-md text-sm font-medium w-full text-center transition-colors shadow-sm"
        >
          {isExpanded ? text.collapse : text.expand}
        </button>
      </div>
    </div>
  );
} 
