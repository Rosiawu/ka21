import React from 'react';
import Link from 'next/link';
import { withBaseMeta } from '@/lib/withBaseMeta';
import type { Metadata, ResolvingMetadata } from 'next';
import TeamMemberCard from '@/components/TeamMemberCard';
import { teamMembers } from '@/data/team-members';
import { generateHreflangMetadata } from '@/lib/hreflang';

type AboutPageParams = Promise<{ locale?: string }>;

export async function generateMetadata(
  { params }: { params?: AboutPageParams },
  parent: ResolvingMetadata,
): Promise<Metadata> {
  const resolvedParams = params ? await params : undefined;
  const locale = resolvedParams?.locale === 'en' ? 'en' : 'zh';
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

export default async function AboutPage({ params }: { params?: AboutPageParams }) {
  const resolvedParams = params ? await params : undefined;
  const isEn = resolvedParams?.locale === 'en';
  const teamCount = teamMembers.length;
  const homeHref = resolvedParams?.locale ? `/${resolvedParams.locale}` : '/';
  const text = {
    homeLabel: isEn ? 'Back Home' : '返回首页',
    missionTitle: isEn ? 'Our Mission' : '我们的目标',
    missionParagraphs: isEn
      ? [
          `KA21 AI Toolbox is led by Man Wu and jointly maintained by ${teamCount} professionals from the Kazike KA21 community, each with a different background. We also appreciate the article support from other AI creators and developer friends. We always start from the user perspective, personally test each AI tool, and evaluate, review, and recommend it based on real practice from our own fields.`,
          'We want KA21 to become the “Michelin Guide” of AI tool reviews, so our slogan is: “Bottom-rank elimination. We keep only 100 AI workhorses that are actually worth using.” Slightly heavy on the grindset, but that is the point.',
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
    <div className="about-immersive-page page-shell relative overflow-hidden py-10 sm:py-14">
      {/* 背景装饰 */}
      <div className="absolute top-0 right-0 -z-10 translate-x-1/4 -translate-y-1/4">
        <div className="h-96 w-96 rounded-full bg-indigo-400/12 blur-3xl dark:bg-indigo-400/6"></div>
      </div>
      <div className="absolute top-72 left-0 -z-10 -translate-x-1/3">
        <div className="h-80 w-80 rounded-full bg-purple-400/12 blur-3xl dark:bg-purple-400/6"></div>
      </div>
      <div className="absolute bottom-24 right-1/4 -z-10">
        <div className="h-72 w-72 rounded-full bg-fuchsia-400/8 blur-3xl dark:bg-fuchsia-400/5"></div>
      </div>

      <div className="relative mx-auto max-w-[1680px]">
        <div className="mb-6 flex justify-start">
          <Link
            href={homeHref}
            className="inline-flex items-center gap-2 rounded-full border border-indigo-200/80 bg-white/85 px-4 py-2 text-sm font-semibold text-indigo-700 shadow-sm backdrop-blur transition hover:border-indigo-300 hover:bg-white hover:text-indigo-900 dark:border-indigo-700/60 dark:bg-slate-900/80 dark:text-indigo-200 dark:hover:border-indigo-500 dark:hover:text-white"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
              <path d="M15 18l-6-6 6-6"></path>
            </svg>
            <span>{text.homeLabel}</span>
          </Link>
        </div>

        {/* 团队使命 */}
        <div className="mb-12 rounded-[32px] border border-indigo-100/80 bg-gradient-to-br from-white via-indigo-50 to-purple-50 p-7 shadow-[0_24px_80px_rgba(99,102,241,0.12)] dark:border-purple-800/30 dark:from-slate-900/90 dark:via-slate-800/80 dark:to-purple-950/50 sm:p-10">
          <div className="mb-4 flex items-center">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-indigo-500 mr-2" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
              <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"></path>
            </svg>
            <h1 className="text-2xl font-bold text-indigo-800 dark:text-indigo-300 sm:text-3xl">{text.missionTitle}</h1>
          </div>
          <div className="ml-0 space-y-4 text-[15px] leading-8 text-neutral-700 dark:text-neutral-300 sm:ml-7 sm:text-base">
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
          <div className="grid grid-cols-1 gap-6 md:grid-cols-2 xl:grid-cols-3">
            {teamMembers.map(member => (
              <TeamMemberCard key={member.id} member={member} />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
