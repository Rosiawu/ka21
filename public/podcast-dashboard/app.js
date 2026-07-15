const state = {
  config: null,
  episodes: [],
  snapshots: [],
  isRefreshing: false,
  episodeSummaryPage: 1,
  historyPage: 1,
  episodeHistoryPage: 1,
  selectedEpisodeId: "",
};

const EPISODE_SUMMARY_PAGE_SIZE = 10;
const HISTORY_PAGE_SIZE = 10;
const CHART_SNAPSHOT_LIMIT = 30;
const CHART_EPISODE_LIMIT = 8;
let chartRenderTimer = null;

const PLATFORM_COLORS = {
  ximalaya: "#7c8fb8",
  xiaoyuzhou: "#d8b8c5",
  wangyiyun: "#cfd36f",
  apple: "#7a6f63",
  lizhi: "#a45a3f",
  qingting: "#8a7f73",
  youtube: "#9c3d2a",
  spotify: "#3d7a57",
};

const EPISODE_PALETTE = [
  "#7c8fb8",
  "#d8b8c5",
  "#cfd36f",
  "#a9c7d9",
  "#c8d7b0",
  "#b8b6da",
  "#d9c8a9",
  "#9fb8b2",
  "#cfb0cc",
  "#b7c8e8",
];

const charts = {
  totalTrend: null,
  platformBar: null,
  episodeBar: null,
  episodeHistory: null,
};

const elements = {
  backHomeLink: document.querySelector("#back-home-link"),
  backHomeLabel: document.querySelector("#back-home-label"),
  showName: document.querySelector("#show-name"),
  heroCopy: document.querySelector("#hero-copy"),
  heroLinks: document.querySelector("#hero-links"),
  snapshotMeta: document.querySelector("#snapshot-meta"),
  refreshButton: document.querySelector("#refresh-button"),
  refreshStatus: document.querySelector("#refresh-status"),
  overviewCards: document.querySelector("#overview-cards"),
  totalTrendChart: document.querySelector("#total-trend-chart"),
  platformBarChart: document.querySelector("#platform-bar-chart"),
  episodeBarChart: document.querySelector("#episode-bar-chart"),
  platformSummary: document.querySelector("#platform-summary"),
  episodeSummaryTableHead: document.querySelector("#episode-summary-table thead"),
  episodeSummaryTableBody: document.querySelector("#episode-summary-table tbody"),
  episodeSummaryPagination: document.querySelector("#episode-summary-pagination"),
  historyPanel: document.querySelector("#history-panel"),
  historyTableHead: document.querySelector("#history-table thead"),
  historyTableBody: document.querySelector("#history-table tbody"),
  historyPagination: document.querySelector("#history-pagination"),
  episodeHistorySelect: document.querySelector("#episode-history-select"),
  episodeHistoryChartTitle: document.querySelector("#episode-history-chart-title"),
  episodeHistoryChart: document.querySelector("#episode-history-chart"),
  episodeHistory: document.querySelector("#episode-history"),
  episodeHistoryPagination: document.querySelector("#episode-history-pagination"),
};

function resolveLocale() {
  const queryLocale = new URLSearchParams(window.location.search).get("locale");
  if (queryLocale === "en") {
    return "en";
  }
  return "zh";
}

function hydrateBackHomeLink() {
  if (!elements.backHomeLink || !elements.backHomeLabel) {
    return;
  }

  const locale = resolveLocale();
  elements.backHomeLink.href = locale === "en" ? "/en" : "/zh";
  elements.backHomeLabel.textContent = locale === "en" ? "Back to Home" : "返回首页";
}

function formatNumber(value) {
  if (value === null || value === undefined || Number.isNaN(Number(value))) {
    return "—";
  }
  return new Intl.NumberFormat("zh-CN").format(Number(value));
}

function formatDelta(value) {
  if (value === null || value === undefined) {
    return { text: "无对比数据", className: "delta flat" };
  }
  if (value === 0) {
    return { text: "较上次 +0", className: "delta flat" };
  }
  return {
    text: `较上次 ${value > 0 ? "+" : ""}${formatNumber(value)}`,
    className: "delta",
  };
}

function hasSnapshotData(snapshot) {
  return (
    sumObjectValues(snapshot?.platformTotals || {}) > 0 ||
    Object.values(snapshot?.episodePlays || {}).some((values) => sumObjectValues(values || {}) > 0)
  );
}

function snapshotSignature(snapshot) {
  return JSON.stringify({
    platformTotals: snapshot?.platformTotals || {},
    episodePlays: snapshot?.episodePlays || {},
  });
}

function snapshotRank(snapshot) {
  const note = String(snapshot?.note || "").trim();
  if (note === "自动抓取") {
    return 3;
  }
  if (note) {
    return 2;
  }
  return 1;
}

function snapshotTotals(snapshot) {
  return {
    platformTotal: sumObjectValues(snapshot?.platformTotals || {}),
    episodeTotal: Object.values(snapshot?.episodePlays || {}).reduce(
      (sum, values) => sum + sumObjectValues(values || {}),
      0,
    ),
  };
}

function compareSnapshots(left, right) {
  const leftTotals = snapshotTotals(left);
  const rightTotals = snapshotTotals(right);

  if (leftTotals.platformTotal !== rightTotals.platformTotal) {
    return leftTotals.platformTotal - rightTotals.platformTotal;
  }

  if (leftTotals.episodeTotal !== rightTotals.episodeTotal) {
    return leftTotals.episodeTotal - rightTotals.episodeTotal;
  }

  const rankDiff = snapshotRank(left) - snapshotRank(right);
  if (rankDiff !== 0) {
    return rankDiff;
  }

  return String(left.createdAt || "").localeCompare(String(right.createdAt || ""));
}

function dedupeSnapshots(snapshots) {
  const grouped = new Map();

  for (const snapshot of snapshots) {
    const key = snapshot.date;
    const existing = grouped.get(key);

    if (!existing) {
      grouped.set(key, snapshot);
      continue;
    }

    if (compareSnapshots(snapshot, existing) > 0) {
      grouped.set(key, snapshot);
    }
  }

  return [...grouped.values()];
}

function latestSnapshots() {
  const sorted = dedupeSnapshots(
    state.snapshots.filter(hasSnapshotData),
  )
    .sort(
    (a, b) => a.date.localeCompare(b.date) || a.createdAt.localeCompare(b.createdAt),
  );
  return {
    latest: sorted.at(-1) || null,
    previous: sorted.at(-2) || null,
    sorted,
  };
}

function sumObjectValues(object = {}) {
  return Object.values(object).reduce((sum, value) => sum + Number(value || 0), 0);
}

function episodeTotal(snapshot, episodeId) {
  return sumObjectValues(snapshot?.episodePlays?.[episodeId] || {});
}

function latestEpisodePlatformObservation(episodeId, platformId) {
  const snapshots = latestSnapshots().sorted;
  for (let index = snapshots.length - 1; index >= 0; index -= 1) {
    const snapshot = snapshots[index];
    if (String(snapshot.note || "").includes("沿用上次有效数据")) {
      continue;
    }
    const value = snapshot?.episodePlays?.[episodeId]?.[platformId];
    if (value !== null && value !== undefined) {
      return { value, date: snapshot.date };
    }
  }
  return null;
}

function platformDelta(platformId, latest, previous) {
  const current = latest?.platformTotals?.[platformId];
  const before = previous?.platformTotals?.[platformId];
  if (current === undefined || before === undefined) {
    return null;
  }
  return current - before;
}

function episodeDelta(episodeId, latest, previous) {
  const current = episodeTotal(latest, episodeId);
  const before = episodeTotal(previous, episodeId);
  if (!latest || !previous) {
    return null;
  }
  return current - before;
}

function platformHasAnyData(platformId) {
  return state.snapshots.some((snapshot) => {
    if ((snapshot?.platformTotals?.[platformId] ?? null) !== null && snapshot?.platformTotals?.[platformId] !== undefined) {
      return true;
    }

    return Object.values(snapshot?.episodePlays || {}).some((values) => {
      const value = values?.[platformId];
      return value !== null && value !== undefined;
    });
  });
}

function visiblePlatforms() {
  const { latest } = latestSnapshots();

  return [...state.config.platforms]
    .filter((platform) => platformHasAnyData(platform.id))
    .sort((left, right) => {
      const leftValue = latest?.platformTotals?.[left.id] ?? -1;
      const rightValue = latest?.platformTotals?.[right.id] ?? -1;

      if (rightValue !== leftValue) {
        return rightValue - leftValue;
      }

      return left.name.localeCompare(right.name, "zh-CN");
    });
}

function platformToneClass(platformId) {
  return `platform-tone-${platformId}`;
}

function faviconUrl(url) {
  try {
    const hostname = new URL(url).hostname;
    return `https://www.google.com/s2/favicons?domain=${hostname}&sz=128`;
  } catch {
    return "";
  }
}

function platformLogoUrl(platform) {
  return platform?.logo || faviconUrl(platform?.url || "");
}

function episodeNumber(episode) {
  const match = String(episode?.title || "").match(/^\s*(\d+)\./);
  return match ? Number(match[1]) : 0;
}

function shortEpisodeLabel(episode) {
  const title = String(episode?.title || "");
  return title.length > 18 ? `${title.slice(0, 18)}...` : title;
}

function isMobileViewport() {
  return window.innerWidth <= 720;
}

function formatChartDateLabel(date) {
  if (!isMobileViewport()) {
    return date;
  }
  return String(date).slice(5);
}

function mobileTooltipConfig(base = {}) {
  if (!isMobileViewport()) {
    return base;
  }

  return {
    ...base,
    trigger: "item",
    confine: true,
    textStyle: { fontSize: 10, lineHeight: 14 },
    padding: [6, 8],
    extraCssText: "max-width: 180px; white-space: normal;",
  };
}

function legendEpisodeLabel(episode) {
  const number = episodeNumber(episode);
  const title = String(episode?.title || "").replace(/^\s*\d+\.\s*/, "");
  const shortTitle = title.length > 16 ? `${title.slice(0, 16)}...` : title;
  return number ? `${String(number).padStart(2, "0")}. ${shortTitle}` : shortTitle;
}

function episodeColorMap() {
  const sorted = [...state.episodes].sort((left, right) => episodeNumber(right) - episodeNumber(left));
  const map = new Map();
  sorted.forEach((episode, index) => {
    map.set(episode.id, EPISODE_PALETTE[index % EPISODE_PALETTE.length]);
  });
  return map;
}

function parseSnapshotDate(snapshot) {
  return new Date(`${snapshot.date}T00:00:00+08:00`);
}

function parseEpisodePubDate(episode) {
  return new Date(episode.pubDate);
}

function dayDiffFromEpisode(episode, snapshot) {
  const episodeDate = parseEpisodePubDate(episode);
  const snapshotDate = parseSnapshotDate(snapshot);
  episodeDate.setHours(0, 0, 0, 0);
  snapshotDate.setHours(0, 0, 0, 0);
  return Math.round((snapshotDate - episodeDate) / 86400000);
}

function ensureChart(instanceKey, domNode) {
  if (!domNode || !window.echarts) {
    return null;
  }

  charts[instanceKey] ||= window.echarts.init(domNode);
  return charts[instanceKey];
}

function translucentBarStyle(color) {
  if (!window.echarts) {
    return { color };
  }

  return {
    color: new window.echarts.graphic.LinearGradient(0, 0, 0, 1, [
      { offset: 0, color: `${color}dd` },
      { offset: 0.55, color: `${color}9c` },
      { offset: 1, color: `${color}52` },
    ]),
    borderColor: `${color}66`,
    borderWidth: 1,
    opacity: 0.78,
    borderRadius: [8, 8, 4, 4],
  };
}

function renderCharts() {
  const { sorted, latest } = latestSnapshots();
  const platforms = visiblePlatforms();
  const episodeColors = episodeColorMap();
  const chartSnapshots = sorted.slice(-CHART_SNAPSHOT_LIMIT);
  const rankedEpisodes = [...state.episodes]
    .filter((episode) => chartSnapshots.some((snapshot) => episodeTotal(snapshot, episode.id) > 0))
    .sort((left, right) => episodeTotal(latest, right.id) - episodeTotal(latest, left.id));
  const primaryEpisodes = rankedEpisodes.slice(0, CHART_EPISODE_LIMIT);
  const otherEpisodes = rankedEpisodes.slice(CHART_EPISODE_LIMIT);
  const episodeSeries = primaryEpisodes.map((episode) => ({
    id: episode.id,
    name: legendEpisodeLabel(episode),
    color: episodeColors.get(episode.id) || "#cbd5e1",
    value: (snapshot) => episodeTotal(snapshot, episode.id),
  }));
  if (otherEpisodes.length > 0) {
    episodeSeries.push({
      id: "other-episodes",
      name: `其他 ${otherEpisodes.length} 集`,
      color: "#aab4c2",
      value: (snapshot) => otherEpisodes.reduce((sum, episode) => sum + episodeTotal(snapshot, episode.id), 0),
    });
  }
  const dateCount = chartSnapshots.length;
  const useHorizontalDailyCharts = dateCount > 10;
  const compactMobile = isMobileViewport();

  const totalTrend = ensureChart("totalTrend", elements.totalTrendChart);
  const platformBar = ensureChart("platformBar", elements.platformBarChart);
  const episodeBar = ensureChart("episodeBar", elements.episodeBarChart);

  if (totalTrend) {
    const categories = useHorizontalDailyCharts
      ? [...chartSnapshots].reverse().map((snapshot) => formatChartDateLabel(snapshot.date))
      : chartSnapshots.map((snapshot) => formatChartDateLabel(snapshot.date));
    const categoryAxisInterval = compactMobile ? Math.max(0, Math.ceil(categories.length / 4) - 1) : 0;
    const stackSeries = episodeSeries.map((series) => {
      const dataSource = useHorizontalDailyCharts ? [...chartSnapshots].reverse() : chartSnapshots;
      return {
        name: series.name,
        type: "bar",
        stack: "plays",
        barMaxWidth: 42,
        itemStyle: translucentBarStyle(series.color),
        emphasis: { focus: "series" },
        data: dataSource.map(series.value),
      };
    });

    totalTrend.setOption({
      animation: false,
      legend: {
        show: !compactMobile,
        bottom: 0,
        data: episodeSeries.map((series) => series.name),
        textStyle: { color: "#8a97a8" },
        itemWidth: 22,
        itemHeight: 12,
      },
      grid: compactMobile ? { left: 44, right: 14, top: 18, bottom: 18 } : { left: 56, right: 24, top: 30, bottom: 88 },
      tooltip: mobileTooltipConfig({ trigger: "axis", axisPointer: { type: "shadow" } }),
      xAxis: useHorizontalDailyCharts
        ? {
            type: "value",
            splitLine: { lineStyle: { color: "rgba(215, 223, 233, 0.8)" } },
            axisLabel: { color: "#8a97a8", fontSize: compactMobile ? 10 : 12 },
          }
        : {
            type: "category",
            data: categories,
            axisLine: { lineStyle: { color: "rgba(199, 208, 220, 0.65)" } },
            axisLabel: { color: "#8a97a8", fontSize: compactMobile ? 10 : 12 },
          },
      yAxis: useHorizontalDailyCharts
        ? {
            type: "category",
            data: categories,
            axisLine: { lineStyle: { color: "rgba(199, 208, 220, 0.65)" } },
            axisLabel: { color: "#8a97a8", fontSize: compactMobile ? 10 : 12, interval: categoryAxisInterval, hideOverlap: true },
          }
        : {
            type: "value",
            axisLine: { show: false },
            splitLine: { lineStyle: { color: "rgba(215, 223, 233, 0.8)" } },
            axisLabel: { color: "#8a97a8", fontSize: compactMobile ? 10 : 12 },
          },
      series: stackSeries,
    }, true);
  }

  if (platformBar) {
    const categories = useHorizontalDailyCharts
      ? [...chartSnapshots].reverse().map((snapshot) => formatChartDateLabel(snapshot.date))
      : chartSnapshots.map((snapshot) => formatChartDateLabel(snapshot.date));
    const categoryAxisInterval = compactMobile ? Math.max(0, Math.ceil(categories.length / 4) - 1) : 0;
    const platformSeries = platforms.map((platform) => {
      const dataSource = useHorizontalDailyCharts ? [...chartSnapshots].reverse() : chartSnapshots;
      return {
        name: platform.name,
        type: "bar",
        stack: "platforms",
        barMaxWidth: 42,
        itemStyle: translucentBarStyle(PLATFORM_COLORS[platform.id] || "#cbd5e1"),
        emphasis: { focus: "series" },
        data: dataSource.map((snapshot) => {
          return Object.values(snapshot.episodePlays || {}).reduce(
            (sum, values) => sum + Number(values?.[platform.id] || 0),
            0,
          );
        }),
      };
    });

    platformBar.setOption({
      animation: false,
      legend: {
        show: !compactMobile,
        bottom: 0,
        data: platforms.map((platform) => platform.name),
        textStyle: { color: "#8a97a8" },
      },
      grid: compactMobile ? { left: 44, right: 14, top: 18, bottom: 18 } : { left: 56, right: 24, top: 30, bottom: 82 },
      tooltip: mobileTooltipConfig({ trigger: "axis", axisPointer: { type: "shadow" } }),
      xAxis: useHorizontalDailyCharts
        ? {
            type: "value",
            splitLine: { lineStyle: { color: "rgba(215, 223, 233, 0.8)" } },
            axisLabel: { color: "#8a97a8", fontSize: compactMobile ? 10 : 12 },
          }
        : {
            type: "category",
            data: categories,
            axisLine: { lineStyle: { color: "rgba(199, 208, 220, 0.65)" } },
            axisLabel: { color: "#8a97a8", fontSize: compactMobile ? 10 : 12 },
          },
      yAxis: useHorizontalDailyCharts
        ? {
            type: "category",
            data: categories,
            axisLine: { lineStyle: { color: "rgba(199, 208, 220, 0.65)" } },
            axisLabel: { color: "#8a97a8", fontSize: compactMobile ? 10 : 12, interval: categoryAxisInterval, hideOverlap: true },
          }
        : {
            type: "value",
            splitLine: { lineStyle: { color: "rgba(215, 223, 233, 0.8)" } },
            axisLabel: { color: "#8a97a8", fontSize: compactMobile ? 10 : 12 },
          },
      series: platformSeries,
    }, true);
  }

  if (episodeBar) {
    const recentEpisodes = [...state.episodes]
      .sort((left, right) => episodeNumber(right) - episodeNumber(left))
      .slice(0, 10);
    const relativeDays = Array.from({ length: 15 }, (_, index) => (compactMobile ? `D${index + 1}` : `Day ${index + 1}`));

    episodeBar.setOption({
      animation: false,
      legend: {
        show: !compactMobile,
        bottom: 0,
        data: recentEpisodes.map((episode) => episode.title),
        textStyle: { color: "#8a97a8" },
      },
      grid: compactMobile ? { left: 44, right: 14, top: 18, bottom: 24 } : { left: 56, right: 24, top: 30, bottom: 84 },
      tooltip: mobileTooltipConfig({ trigger: "axis" }),
      xAxis: {
        type: "category",
        data: relativeDays,
        axisLine: { lineStyle: { color: "rgba(199, 208, 220, 0.65)" } },
        axisLabel: {
          color: "#8a97a8",
          interval: compactMobile ? 2 : 0,
          fontSize: compactMobile ? 10 : 12,
          hideOverlap: true,
        },
      },
      yAxis: {
        type: "value",
        splitLine: { lineStyle: { color: "rgba(215, 223, 233, 0.8)" } },
        axisLabel: { color: "#8a97a8", fontSize: compactMobile ? 10 : 12 },
      },
      series: recentEpisodes.map((episode) => {
        const color = episodeColors.get(episode.id) || "#cbd5e1";
        const data = Array.from({ length: 15 }, (_, index) => {
          const targetDay = index + 1;
          const snapshot = sorted.find((item) => dayDiffFromEpisode(episode, item) + 1 === targetDay);
          return snapshot ? episodeTotal(snapshot, episode.id) : null;
        });

        return {
          name: episode.title,
          type: "line",
          connectNulls: false,
          smooth: true,
          showSymbol: !compactMobile,
          symbolSize: compactMobile ? 6 : 8,
          label: {
            show: !compactMobile,
            color,
            fontSize: 11,
            formatter: ({ value }) => (value ? formatNumber(value) : ""),
          },
          endLabel: {
            show: !compactMobile,
            formatter: shortEpisodeLabel(episode),
            color,
          },
          lineStyle: {
            width: 3,
            color,
          },
          itemStyle: {
            color,
            borderColor: "#ffffff",
            borderWidth: 2,
          },
          areaStyle: {
            color: new window.echarts.graphic.LinearGradient(0, 0, 0, 1, [
              { offset: 0, color: `${color}26` },
              { offset: 1, color: `${color}02` },
            ]),
          },
          data,
        };
      }),
    }, true);
  }
}

function scheduleChartsRender(delay = 180) {
  if (chartRenderTimer !== null) {
    window.clearTimeout(chartRenderTimer);
  }
  chartRenderTimer = window.setTimeout(() => {
    chartRenderTimer = null;
    renderCharts();
  }, delay);
}

function renderOverview() {
  const { latest, previous } = latestSnapshots();
  elements.snapshotMeta.textContent = latest
    ? `最新快照: ${latest.date}${latest.note ? ` · ${latest.note}` : ""}`
    : "还没有快照";

  const totalCurrent = latest ? sumObjectValues(latest.platformTotals) : 0;
  const totalPrevious = previous ? sumObjectValues(previous.platformTotals) : null;
  const totalDelta = totalPrevious === null ? null : totalCurrent - totalPrevious;
  const cards = [
    {
      label: "跨平台总播放求和",
      value: formatNumber(totalCurrent),
      delta: formatDelta(totalDelta),
    },
    {
      label: "已显示平台",
      value: formatNumber(visiblePlatforms().length),
      delta: { text: "有数据才展示", className: "delta flat" },
    },
    {
      label: "已同步集数",
      value: formatNumber(state.episodes.length),
      delta: { text: "从 RSS 自动读取", className: "delta flat" },
    },
    {
      label: "快照数量",
      value: formatNumber(state.snapshots.length),
      delta: { text: latest ? `最近更新 ${latest.date}` : "还没开始记录", className: "delta flat" },
    },
  ];

  elements.overviewCards.innerHTML = cards
    .map(
      (card) => `
        <article class="card">
          <span class="muted">${card.label}</span>
          <strong>${card.value}</strong>
          <div class="${card.delta.className}">${card.delta.text}</div>
        </article>
      `,
    )
    .join("");
}

function renderPlatformSummary() {
  const { latest, previous } = latestSnapshots();
  elements.platformSummary.innerHTML = visiblePlatforms()
    .map((platform) => {
      const current = latest?.platformTotals?.[platform.id] ?? null;
      const delta = formatDelta(platformDelta(platform.id, latest, previous));
      const link = platform.url
        ? `<a class="inline-link" href="${platform.url}" target="_blank" rel="noreferrer">打开页面</a>`
        : `<span class="inline-link disabled">未填链接</span>`;
      return `
        <article class="summary-card">
          <div class="card-head">
            <span class="muted">${platform.name}</span>
            ${link}
          </div>
          <strong>${formatNumber(current)}</strong>
          <div class="${delta.className}">${delta.text}</div>
        </article>
      `;
    })
    .join("");
}

function renderHeroLinks() {
  elements.heroLinks.innerHTML = state.config.platforms
    .filter((platform) => platform.url)
    .map(
      (platform) => `
        <a class="hero-link-chip ${platformToneClass(platform.id)}" href="${platform.url}" target="_blank" rel="noreferrer" aria-label="${platform.name}">
          <img class="hero-link-logo" src="${platformLogoUrl(platform)}" alt="${platform.name} logo" loading="lazy" />
          <span class="hero-link-label">${platform.name}</span>
        </a>
      `,
    )
    .join("");
}

function buildEpisodeTableHeader() {
  const headers = visiblePlatforms()
    .map((platform) => `<th class="${platformToneClass(platform.id)}">${platform.name}</th>`)
    .join("");
  return `<tr><th class="episode-cell">单集</th><th>跨平台求和</th><th>较上次</th>${headers}</tr>`;
}

function clampPage(page, totalItems, pageSize) {
  const totalPages = Math.max(1, Math.ceil(totalItems / pageSize));
  return Math.min(Math.max(1, page), totalPages);
}

function pageItems(items, page, pageSize) {
  const safePage = clampPage(page, items.length, pageSize);
  const start = (safePage - 1) * pageSize;
  return { items: items.slice(start, start + pageSize), page: safePage };
}

function paginationMarkup(page, totalItems, pageSize) {
  const totalPages = Math.max(1, Math.ceil(totalItems / pageSize));
  if (totalPages <= 1) {
    return `<span class="pagination-meta">共 ${formatNumber(totalItems)} 条</span>`;
  }

  return `
    <button type="button" class="pagination-button" data-page="${page - 1}" ${page <= 1 ? "disabled" : ""}>上一页</button>
    <span class="pagination-meta">第 ${page} / ${totalPages} 页 · 共 ${formatNumber(totalItems)} 条</span>
    <button type="button" class="pagination-button" data-page="${page + 1}" ${page >= totalPages ? "disabled" : ""}>下一页</button>
  `;
}

function renderEpisodeSummary() {
  const { latest, previous } = latestSnapshots();
  const episodes = [...state.episodes].sort((left, right) => episodeNumber(right) - episodeNumber(left));
  const paged = pageItems(episodes, state.episodeSummaryPage, EPISODE_SUMMARY_PAGE_SIZE);
  state.episodeSummaryPage = paged.page;
  elements.episodeSummaryTableHead.innerHTML = buildEpisodeTableHeader();
  elements.episodeSummaryTableBody.innerHTML = paged.items
    .map((episode) => {
      const total = episodeTotal(latest, episode.id);
      const delta = formatDelta(episodeDelta(episode.id, latest, previous));
      const platformCells = visiblePlatforms()
        .map((platform) => {
          const value = latest?.episodePlays?.[episode.id]?.[platform.id] ?? null;
          if (value !== null || platform.id !== "ximalaya") {
            return `<td class="${platformToneClass(platform.id)}">${formatNumber(value)}</td>`;
          }

          const historical = latestEpisodePlatformObservation(episode.id, platform.id);
          if (!historical) {
            return `<td class="${platformToneClass(platform.id)}">—</td>`;
          }

          return `
            <td class="${platformToneClass(platform.id)}">
              <span class="historical-value">${formatNumber(historical.value)}</span>
              <span class="historical-date">截至 ${historical.date.slice(5).replace("-", "/")}</span>
            </td>
          `;
        })
        .join("");
      return `
        <tr>
          <td class="episode-cell">
            <div class="episode-title">${episode.title}</div>
            <div class="episode-meta">${episode.pubDate || ""}</div>
          </td>
          <td>${formatNumber(total)}</td>
          <td class="${delta.className}">${delta.text}</td>
          ${platformCells}
        </tr>
      `;
    })
    .join("");
  elements.episodeSummaryPagination.innerHTML = paginationMarkup(
    state.episodeSummaryPage,
    episodes.length,
    EPISODE_SUMMARY_PAGE_SIZE,
  );
}

function renderHistory() {
  const { sorted } = latestSnapshots();
  const snapshots = [...sorted].reverse();
  const paged = pageItems(snapshots, state.historyPage, HISTORY_PAGE_SIZE);
  state.historyPage = paged.page;
  const head = visiblePlatforms()
    .map((platform) => `<th class="${platformToneClass(platform.id)}">${platform.name}</th>`)
    .join("");
  elements.historyTableHead.innerHTML = `<tr><th>日期</th><th>备注</th><th>跨平台总播放求和</th>${head}</tr>`;
  elements.historyTableBody.innerHTML = paged.items
    .map((snapshot) => {
      const total = sumObjectValues(snapshot.platformTotals);
      const platformCells = visiblePlatforms()
        .map(
          (platform) =>
            `<td class="${platformToneClass(platform.id)}">${formatNumber(snapshot.platformTotals?.[platform.id])}</td>`,
        )
        .join("");
      return `
        <tr>
          <td>${snapshot.date}</td>
          <td>${snapshot.note || "—"}</td>
          <td>${formatNumber(total)}</td>
          ${platformCells}
        </tr>
      `;
    })
    .join("");
  elements.historyPagination.innerHTML = paginationMarkup(state.historyPage, snapshots.length, HISTORY_PAGE_SIZE);
}

function renderEpisodeHistory() {
  const { sorted } = latestSnapshots();
  const episodes = [...state.episodes].sort((left, right) => episodeNumber(right) - episodeNumber(left));
  const availableEpisodes = episodes.filter((episode) => sorted.some((snapshot) => episodeTotal(snapshot, episode.id) > 0));

  if (!availableEpisodes.some((episode) => episode.id === state.selectedEpisodeId)) {
    state.selectedEpisodeId = availableEpisodes[0]?.id || "";
  }

  elements.episodeHistorySelect.innerHTML = availableEpisodes
    .map((episode) => `<option value="${episode.id}" ${episode.id === state.selectedEpisodeId ? "selected" : ""}>${episode.title}</option>`)
    .join("");

  const episode = availableEpisodes.find((item) => item.id === state.selectedEpisodeId);
  if (!episode) {
    charts.episodeHistory?.clear();
    elements.episodeHistory.innerHTML = `<p class="muted empty-state">暂无单集历史数据</p>`;
    elements.episodeHistoryPagination.innerHTML = "";
    return;
  }

  const snapshots = [...sorted]
    .reverse()
    .filter((snapshot) => episodeTotal(snapshot, episode.id) > 0);
  const chartSnapshots = [...snapshots].reverse();
  const episodeHistoryChart = ensureChart("episodeHistory", elements.episodeHistoryChart);
  if (elements.episodeHistoryChartTitle) {
    elements.episodeHistoryChartTitle.textContent = `${shortEpisodeLabel(episode)} · 总播放趋势`;
  }
  episodeHistoryChart?.setOption({
    animationDuration: 300,
    grid: isMobileViewport()
      ? { left: 44, right: 14, top: 24, bottom: 34 }
      : { left: 56, right: 24, top: 30, bottom: 42 },
    tooltip: mobileTooltipConfig({ trigger: "axis" }),
    xAxis: {
      type: "category",
      data: chartSnapshots.map((snapshot) => formatChartDateLabel(snapshot.date)),
      axisLine: { lineStyle: { color: "rgba(199, 208, 220, 0.65)" } },
      axisLabel: {
        color: "#8a97a8",
        fontSize: isMobileViewport() ? 10 : 12,
        hideOverlap: true,
      },
    },
    yAxis: {
      type: "value",
      splitLine: { lineStyle: { color: "rgba(215, 223, 233, 0.8)" } },
      axisLabel: { color: "#8a97a8", fontSize: isMobileViewport() ? 10 : 12 },
    },
    series: [{
      name: "跨平台总播放",
      type: "line",
      smooth: true,
      showSymbol: !isMobileViewport(),
      symbolSize: 7,
      lineStyle: { width: 3, color: "#7c8fb8" },
      itemStyle: { color: "#7c8fb8", borderColor: "#ffffff", borderWidth: 2 },
      areaStyle: {
        color: new window.echarts.graphic.LinearGradient(0, 0, 0, 1, [
          { offset: 0, color: "#7c8fb833" },
          { offset: 1, color: "#7c8fb803" },
        ]),
      },
      data: chartSnapshots.map((snapshot) => episodeTotal(snapshot, episode.id)),
    }],
  }, true);
  const paged = pageItems(snapshots, state.episodeHistoryPage, HISTORY_PAGE_SIZE);
  state.episodeHistoryPage = paged.page;
  const head = visiblePlatforms()
    .map((platform) => `<th class="${platformToneClass(platform.id)}">${platform.name}</th>`)
    .join("");
  const rows = paged.items
    .map((snapshot) => {
      const platformCells = visiblePlatforms()
        .map((platform) => {
          const value = snapshot?.episodePlays?.[episode.id]?.[platform.id] ?? null;
          return `<td class="${platformToneClass(platform.id)}">${formatNumber(value)}</td>`;
        })
        .join("");
      return `
        <tr>
          <td>${snapshot.date}</td>
          <td>${snapshot.note || "—"}</td>
          <td>${formatNumber(episodeTotal(snapshot, episode.id))}</td>
          ${platformCells}
        </tr>
      `;
    })
    .join("");

  elements.episodeHistory.innerHTML = `
    <div class="table-wrap">
      <table>
        <thead><tr><th>日期</th><th>备注</th><th>单集跨平台求和</th>${head}</tr></thead>
        <tbody>${rows}</tbody>
      </table>
    </div>
  `;
  elements.episodeHistoryPagination.innerHTML = paginationMarkup(
    state.episodeHistoryPage,
    snapshots.length,
    HISTORY_PAGE_SIZE,
  );
}

function renderAll() {
  renderOverview();
  renderHeroLinks();
  renderPlatformSummary();
  renderEpisodeSummary();
  if (elements.historyPanel?.open) {
    renderHistory();
    renderEpisodeHistory();
  }
}

function bindPagination(container, onPageChange) {
  container?.addEventListener("click", (event) => {
    const button = event.target.closest("button[data-page]");
    if (!button || button.disabled) return;
    onPageChange(Number(button.dataset.page));
  });
}

function bindHistoryControls() {
  bindPagination(elements.episodeSummaryPagination, (page) => {
    state.episodeSummaryPage = page;
    renderEpisodeSummary();
  });
  bindPagination(elements.historyPagination, (page) => {
    state.historyPage = page;
    renderHistory();
  });
  bindPagination(elements.episodeHistoryPagination, (page) => {
    state.episodeHistoryPage = page;
    renderEpisodeHistory();
  });
  elements.episodeHistorySelect?.addEventListener("change", (event) => {
    state.selectedEpisodeId = event.target.value;
    state.episodeHistoryPage = 1;
    renderEpisodeHistory();
  });
  elements.historyPanel?.addEventListener("toggle", () => {
    if (elements.historyPanel.open) {
      renderHistory();
      renderEpisodeHistory();
    }
  });
}

function setRefreshUi({ loading = false, message = "" } = {}) {
  state.isRefreshing = loading;

  if (elements.refreshButton) {
    elements.refreshButton.disabled = loading;
    elements.refreshButton.textContent = loading ? "正在刷新..." : "立即刷新数据";
  }

  if (elements.refreshStatus && message) {
    elements.refreshStatus.textContent = message;
  }
}

function handleRefreshButtonClick(event) {
  event?.preventDefault?.();
  void refreshDashboard();
}

function bindRefreshButton() {
  if (!elements.refreshButton || elements.refreshButton.dataset.bound === "1") {
    return;
  }

  elements.refreshButton.dataset.bound = "1";
  elements.refreshButton.onclick = handleRefreshButtonClick;
}

window.podcastDashboardRefresh = handleRefreshButtonClick;

async function requestDashboard({ refresh = false } = {}) {
  const response = await fetch(
    refresh ? "/api/podcast/dashboard" : `/api/podcast/dashboard?ts=${Date.now()}`,
    {
      method: refresh ? "POST" : "GET",
      cache: "no-store",
      credentials: "same-origin",
      headers: {
        ...(refresh ? { "x-ka21-dashboard-refresh": "1" } : {}),
        "cache-control": "no-store",
        pragma: "no-cache",
      },
    },
  );
  const data = await response.json();

  if (!response.ok) {
    throw new Error(data?.message || "数据加载失败");
  }

  return data;
}

function applyDashboardData(data) {
  state.config = data.config;
  state.episodes = data.episodes;
  state.snapshots = data.snapshots;
}

async function refreshDashboard() {
  setRefreshUi({ loading: true, message: "正在抓取公开数据，通常需要几秒钟..." });

  try {
    const data = await requestDashboard({ refresh: true });
    applyDashboardData(data);
    renderAll();

    const latestDate = data?.snapshot?.date || latestSnapshots().latest?.date || "刚刚";
    if (data.skipped) {
      setRefreshUi({
        loading: false,
        message: `本次抓取像是不完整数据，已保留 ${latestDate} 的有效快照。`,
      });
      return;
    }

    const persistedMessage = data.persisted
      ? `已刷新到 ${latestDate}，服务端快照也已更新。`
      : `已刷新到 ${latestDate}，当前页面已经显示最新公开数据。`;
    setRefreshUi({ loading: false, message: persistedMessage });
  } catch (error) {
    setRefreshUi({
      loading: false,
      message: `刷新失败：${error instanceof Error ? error.message : "未知错误"}`,
    });
  }
}

async function boot() {
  hydrateBackHomeLink();
  bindRefreshButton();
  bindHistoryControls();
  setRefreshUi({ message: "页面会优先显示最新公开快照" });

  const data = await requestDashboard();
  applyDashboardData(data);

  if (elements.showName) {
    elements.showName.textContent = "灯下白播客";
  }
  if (elements.heroCopy) {
    elements.heroCopy.textContent = "欢迎点击右边你喜欢的平台收听并订阅";
  }
  renderAll();
  let resizeTimer;
  let compactViewport = isMobileViewport();
  window.addEventListener("resize", () => {
    window.clearTimeout(resizeTimer);
    resizeTimer = window.setTimeout(() => {
      const nextCompactViewport = isMobileViewport();
      if (nextCompactViewport !== compactViewport) {
        compactViewport = nextCompactViewport;
        charts.episodeHistory?.resize();
        return;
      }
      Object.values(charts).forEach((chart) => chart?.resize());
    }, 160);
  });
}

boot().catch((error) => {
  console.error(error);
  bindRefreshButton();
  if (elements.snapshotMeta) {
    elements.snapshotMeta.textContent = "初始数据加载失败";
  }
  if (elements.heroCopy) {
    elements.heroCopy.textContent = "当前公开数据加载失败，可点击右侧按钮重试。";
  }
  if (elements.overviewCards) {
    elements.overviewCards.innerHTML = `
      <article class="card">
        <div class="label">加载失败</div>
        <strong>${error instanceof Error ? error.message : "未知错误"}</strong>
        <span class="delta flat">可以继续点击“立即刷新数据”重试</span>
      </article>
    `;
  }
  setRefreshUi({
    loading: false,
    message: `初始加载失败：${error instanceof Error ? error.message : "未知错误"}，可点击按钮重试。`,
  });
});
