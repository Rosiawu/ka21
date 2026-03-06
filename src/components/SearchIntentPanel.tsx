"use client";

import Link from "@/i18n/Link";
import { getSearchIntentRecommendations } from "@/lib/searchIntent";
import { useMemo } from "react";
import { useLocale } from "next-intl";

interface SearchIntentPanelProps {
  query: string;
  onQuerySelect: (query: string) => void;
  className?: string;
  maxTools?: number;
  maxTutorials?: number;
  compact?: boolean;
}

export default function SearchIntentPanel({
  query,
  onQuerySelect,
  className = "",
  maxTools = 3,
  maxTutorials = 3,
  compact = false,
}: SearchIntentPanelProps) {
  const isEn = useLocale() === "en";
  const result = useMemo(
    () =>
      getSearchIntentRecommendations(query, {
        maxTools,
        maxTutorials,
        maxSuggestions: 10,
        locale: isEn ? "en" : "zh",
      }),
    [query, maxTools, maxTutorials, isEn]
  );

  const hasQuery = Boolean(result.normalizedQuery);
  const text = {
    title: isEn ? "You may want to search" : "猜你想搜",
    subtitle: isEn ? "Intent-based recommendations for tools and tutorials" : "基于关键词意图，联动推荐工具和教程",
    matched: isEn ? "Matched" : "命中",
    tools: isEn ? "Tool Recommendations" : "工具推荐",
    tutorials: isEn ? "Tutorial Recommendations" : "教程推荐",
    emptyTools: isEn ? "No strong tool match yet. Try one of the suggested queries above." : "暂无强匹配工具，可尝试上方热门关键词。",
    emptyTutorials: isEn ? "No strong tutorial match yet. Try one of the suggested queries above." : "暂无强匹配教程，可尝试上方热门关键词。",
    reason: isEn ? "Match Logic" : "命中逻辑",
    quickTags: isEn ? "Suggestions" : "联想标签",
  };

  if (compact) {
    return (
      <div className={className}>
        <div className="mb-2 flex items-center justify-between gap-2">
          <span className="text-[11px] font-medium uppercase tracking-[0.14em] text-slate-400 dark:text-slate-500">
            {text.quickTags}
          </span>
          {hasQuery && result.matchedIntentLabels.length > 0 ? (
            <span className="rounded-full bg-primary-50 px-2 py-0.5 text-[11px] text-primary-700 dark:bg-primary-900/30 dark:text-primary-300">
              {result.matchedIntentLabels.slice(0, 1).join(" / ")}
            </span>
          ) : null}
        </div>
        <div className="flex flex-wrap gap-2">
          {result.suggestedQueries.map((keyword) => (
            <button
              key={keyword}
              type="button"
              onClick={() => onQuerySelect(keyword)}
              className="rounded-full border border-slate-200/80 bg-slate-50 px-3 py-1.5 text-xs text-slate-700 transition-colors hover:bg-primary-50 hover:text-primary-700 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300 dark:hover:bg-primary-900/30 dark:hover:text-primary-300"
            >
              {keyword}
            </button>
          ))}
        </div>
      </div>
    );
  }

  return (
    <section
      className={`rounded-xl border border-slate-200/70 dark:border-slate-700 bg-white/85 dark:bg-slate-900/70 p-4 ${className}`}
    >
      <div className="flex items-center justify-between gap-3 mb-3">
        <div>
          <h3 className="text-base font-semibold text-slate-900 dark:text-slate-100">{text.title}</h3>
          <p className="text-xs text-slate-500 dark:text-slate-400">{text.subtitle}</p>
        </div>
        {hasQuery && result.matchedIntentLabels.length > 0 && (
          <span className="text-xs px-2 py-1 rounded-full bg-primary-50 text-primary-700 dark:bg-primary-900/30 dark:text-primary-300">
            {text.matched}: {result.matchedIntentLabels.slice(0, 2).join(" / ")}
          </span>
        )}
      </div>

      <div className="flex flex-wrap gap-2">
        {result.suggestedQueries.map((keyword) => (
          <button
            key={keyword}
            type="button"
            onClick={() => onQuerySelect(keyword)}
            className="text-sm px-3 py-1.5 rounded-full bg-slate-100 text-slate-700 hover:bg-primary-50 hover:text-primary-700 dark:bg-slate-800 dark:text-slate-300 dark:hover:bg-primary-900/30 dark:hover:text-primary-300 transition-colors"
          >
            {keyword}
          </button>
        ))}
      </div>

      {hasQuery && (
        <div className="mt-4 grid grid-cols-1 lg:grid-cols-2 gap-4">
          <div className="rounded-lg border border-slate-200 dark:border-slate-700 p-3">
            <h4 className="text-sm font-semibold text-slate-800 dark:text-slate-200 mb-2">{text.tools}</h4>
            {result.recommendedTools.length === 0 ? (
              <p className="text-xs text-slate-500 dark:text-slate-400">{text.emptyTools}</p>
            ) : (
              <ul className="space-y-2">
                {result.recommendedTools.map(({ tool, reason, comment }) => (
                  <li key={tool.id}>
                    <Link
                      href={`/tools/${tool.id}`}
                      className="block rounded-md px-2 py-2 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
                    >
                      <p className="text-sm font-medium text-slate-900 dark:text-slate-100 line-clamp-1">{tool.name}</p>
                      <p className="text-xs text-slate-600 dark:text-slate-300 line-clamp-2">{comment}</p>
                      <p className="text-[11px] text-slate-400 dark:text-slate-500 line-clamp-1 mt-0.5">
                        {text.reason}: {reason}
                      </p>
                    </Link>
                  </li>
                ))}
              </ul>
            )}
          </div>

          <div className="rounded-lg border border-slate-200 dark:border-slate-700 p-3">
            <h4 className="text-sm font-semibold text-slate-800 dark:text-slate-200 mb-2">{text.tutorials}</h4>
            {result.recommendedTutorials.length === 0 ? (
              <p className="text-xs text-slate-500 dark:text-slate-400">{text.emptyTutorials}</p>
            ) : (
              <ul className="space-y-2">
                {result.recommendedTutorials.map(({ tutorial, reason }) => (
                  <li key={tutorial.id}>
                    <a
                      href={tutorial.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="block rounded-md px-2 py-2 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
                    >
                      <p className="text-sm font-medium text-slate-900 dark:text-slate-100 line-clamp-1">
                        {tutorial.title}
                      </p>
                      <p className="text-xs text-slate-500 dark:text-slate-400 line-clamp-1">
                        {tutorial.category} · {reason}
                      </p>
                    </a>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
      )}
    </section>
  );
}
