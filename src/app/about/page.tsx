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
    intro1: isEn
      ? `KA21 Tools is maintained by ${teamCount} professionals from diverse fields. We evaluate AI tools from a user perspective, not just a developer perspective.`
      : `KA21工具导航由${teamCount}位来自各个领域的专业人士共同维护，我们以用户视角而非技术开发者身份，用心体验每一款AI工具。`,
    intro2: isEn
      ? 'With real-world experience from our industries, we carefully select, deeply test, and honestly recommend tools that truly improve productivity.'
      : '凭借在各自行业的实践经验，我们精心筛选、深入评测并真诚推荐那些确实能提升效率的AI工具。',
    intro3: isEn
      ? 'Our goal is to help you quickly find the right AI tools in a fast-changing AI landscape.'
      : '让您在日新月异的AI世界中轻松找到最适合自己的AI工具。',
    missionTitle: isEn ? 'Our Mission' : '我们的目标',
    mission1: isEn
      ? 'We aim to become the \"Michelin Guide\" for AI tool reviews, with strict standards and continuous curation.'
      : '我们志在成为AI工具评测圈的"米其林"，坚持高标准筛选，实行末位淘汰制。',
    mission2Prefix: isEn ? 'We keep only ' : '只为用户保留',
    mission2Highlight: isEn ? '100 truly useful AI tools' : '100个真正好用的AI牛马',
    mission2Suffix: isEn ? ' for users.' : '。',
    mission3: isEn
      ? 'Since launching in February 2025, we have stayed hands-on and evidence-based for every listed tool.'
      : '从2025年2月建站至今，我们始终保持初心，亲自体验每一款工具，用实测结果说话。',
    mission4: isEn
      ? 'Everything we do is to provide a reliable, practical AI tool guide.'
      : '只为给用户提供最真实可靠的AI工具指南。',
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
        {/* 页面标题和描述 */}
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
          <div className="bg-gradient-to-r from-indigo-50 to-purple-50 dark:from-slate-800/50 dark:to-purple-900/30 p-6 rounded-xl shadow-sm border border-indigo-100 dark:border-purple-800/30">
            <p className="text-lg text-neutral-700 dark:text-neutral-300 space-y-2">
              <span className="block">{text.intro1}</span>
              <span className="block">{text.intro2}</span>
              <span className="block">{text.intro3}</span>
            </p>
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
            <p>{text.mission1}</p>
            <p>
              {text.mission2Prefix}
              <span className="font-semibold text-indigo-700 dark:text-indigo-300">{text.mission2Highlight}</span>
              {text.mission2Suffix}
            </p>
            <p>{text.mission3}</p>
            <p>{text.mission4}</p>
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
