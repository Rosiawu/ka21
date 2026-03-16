import React from 'react';
import { withBaseMeta } from '@/lib/withBaseMeta';
import type { Metadata, ResolvingMetadata } from 'next';
import TeamMemberCard from '@/components/TeamMemberCard';
import { teamMembers } from '@/data/team-members';
import { generateHreflangMetadata } from '@/lib/hreflang';

export async function generateMetadata(
  { params }: { params?: { locale?: string } },
  parent: ResolvingMetadata,
): Promise<Metadata> {
  const locale = params?.locale === 'en' ? 'en' : 'zh';
  const isEn = locale === 'en';
  // 生成hreflang标签（关于页面路径）
  const hreflangConfig = generateHreflangMetadata(locale, 'about');

  return withBaseMeta(
    {
      title: isEn ? 'About Us - KA21 Tools' : '关于我们 - KA21工具导航',
      description: isEn
        ? 'Meet the KA21 team of professionals exploring and reviewing practical AI tools.'
        : '了解KA21工具导航背后的专业团队成员，来自各个领域的专业人士共同探索和评测AI工具',
      alternates: {
        canonical: hreflangConfig.canonical,
        languages: hreflangConfig.languages
      },
    },
    parent,
  );
}

export default function AboutPage({ params }: { params?: { locale?: string } }) {
  const isEn = params?.locale === 'en';
  const teamCount = teamMembers.length;
  const text = {
    title: isEn ? 'About Us' : '关于我们',
    missionTitle: isEn ? 'Our Mission' : '我们的目标',
    missionParagraphs: isEn
      ? [
          `KA21 AI Toolbox is led by Wuman and jointly maintained by ${teamCount} professionals from the Kazike KA21 community, each with a different background. We also appreciate the article support from other AI creators and developer friends. We always start from the user perspective, personally test each AI tool, and evaluate, review, and recommend it based on real practice from our own fields.`,
          'We want KA21 to become the “Michelin Guide” of AI tool reviews, so our slogan is: “淘汰末位，只为用户保留100个真正好用的AI牛马.” A bit work-flavored, but that is the point.',
          'Since the site launched in February 2025, we have stayed hands-on, kept testing continuously, and spoken with real experience instead of empty claims.',
        ]
      : [
          `KA21 AI 牛马库工具导航由吴熳牵头，由${teamCount}位来自卡兹克KA21社群、背景各异的专业人士共同维护与撰写教程，同时也感谢其他AI博主与开发者朋友的文章支持。我们始终坚持站在用户视角出发，认真体验每一款AI工具，并结合各自行业中的真实实践经验进行筛选、评测与推荐。`,
          '我们希望把KA21牛马库网站做成AI工具评测圈的“米其林”，所以 slogan 是“末位淘汰，只为用户保留100个真正好用的AI牛马”，班味儿有点重，就这么着吧。',
          '从2025年2月建站至今，我们始终坚持亲自上手、持续实测、用真实体验说话。',
        ],
    membersTitle: isEn ? 'Team Members' : '团队成员',
  };

  return (
    <div className="page-shell relative py-8">
      {/* 背景装饰 */}
      <div className="absolute top-20 right-0 -z-10 transform translate-x-1/3">
        <div className="w-72 h-72 bg-indigo-400/10 dark:bg-indigo-400/5 rounded-full blur-3xl"></div>
      </div>
      <div className="absolute top-60 left-0 -z-10 transform -translate-x-1/3">
        <div className="w-72 h-72 bg-purple-400/10 dark:bg-purple-400/5 rounded-full blur-3xl"></div>
      </div>
      <div className="absolute bottom-40 right-1/4 -z-10">
        <div className="w-64 h-64 bg-fuchsia-400/5 dark:bg-fuchsia-400/3 rounded-full blur-3xl"></div>
      </div>

      <div className="max-w-7xl mx-auto relative">
        {/* 页面标题 */}
        <div className="mb-10">
          <div className="flex items-center mb-3">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-indigo-500 mr-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
              <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path>
              <circle cx="9" cy="7" r="4"></circle>
              <path d="M23 21v-2a4 4 0 0 0-3-3.87"></path>
              <path d="M16 3.13a4 4 0 0 1 0 7.75"></path>
            </svg>
            <h1 className="text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-indigo-600 to-purple-600 dark:from-indigo-400 dark:to-purple-400">{text.title}</h1>
          </div>
        </div>

        {/* 团队使命 */}
        <div className="mb-10 bg-gradient-to-r from-indigo-50 to-purple-50 dark:from-slate-800/50 dark:to-purple-900/30 p-6 rounded-xl shadow-sm border border-indigo-100 dark:border-purple-800/30">
          <div className="flex items-center mb-3">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-indigo-500 mr-2" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
              <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"></path>
            </svg>
            <h2 className="text-2xl font-bold text-indigo-800 dark:text-indigo-300">{text.missionTitle}</h2>
          </div>
          <div className="text-neutral-700 dark:text-neutral-300 ml-7 space-y-3">
            {text.missionParagraphs.map((paragraph) => (
              <p key={paragraph}>{paragraph}</p>
            ))}
          </div>
        </div>

        {/* 团队成员 */}
        <div className="mb-10">
          <div className="flex items-center mb-6">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-indigo-500 mr-2" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
              <path d="M16 21v-2a4 4 0 00-4-4H6a4 4 0 00-4 4v2"></path>
              <circle cx="9" cy="7" r="4"></circle>
              <path d="M22 21v-2a4 4 0 00-3-3.87"></path>
              <path d="M16 3.13a4 4 0 010 7.75"></path>
            </svg>
            <h2 className="text-2xl font-bold text-indigo-800 dark:text-indigo-300">{text.membersTitle}</h2>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            {teamMembers.map(member => (
              <TeamMemberCard key={member.id} member={member} />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
