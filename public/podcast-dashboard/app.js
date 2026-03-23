const state = {
  config: null,
  episodes: [],
  snapshots: [],
};

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
  historyTableHead: document.querySelector("#history-table thead"),
  historyTableBody: document.querySelector("#history-table tbody"),
  episodeHistory: document.querySelector("#episode-history"),
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

function episodeNumber(episode) {
  const match = String(episode?.title || "").match(/^\s*(\d+)\./);
  return match ? Number(match[1]) : 0;
}

function shortEpisodeLabel(episode) {
  const title = String(episode?.title || "");
  return title.length > 18 ? `${title.slice(0, 18)}...` : title;
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
    shadowBlur: 22,
    shadowColor: `${color}2e`,
    opacity: 0.78,
    borderRadius: [18, 18, 10, 10],
  };
}

function renderCharts() {
  const { sorted, latest } = latestSnapshots();
  const platforms = visiblePlatforms();
  const episodeColors = episodeColorMap();
  const episodeSeriesAsc = [...state.episodes].sort((left, right) => episodeNumber(left) - episodeNumber(right));
  const episodeLegendDesc = [...state.episodes]
    .sort((left, right) => episodeNumber(right) - episodeNumber(left))
    .map((episode) => legendEpisodeLabel(episode));
  const dateCount = sorted.length;
  const useHorizontalDailyCharts = dateCount > 10;

  const totalTrend = ensureChart("totalTrend", elements.totalTrendChart);
  const platformBar = ensureChart("platformBar", elements.platformBarChart);
  const episodeBar = ensureChart("episodeBar", elements.episodeBarChart);

  if (totalTrend) {
    const categories = useHorizontalDailyCharts
      ? [...sorted].reverse().map((snapshot) => snapshot.date)
      : sorted.map((snapshot) => snapshot.date);
    const stackSeries = episodeSeriesAsc.map((episode) => {
      const color = episodeColors.get(episode.id) || "#cbd5e1";
      const dataSource = useHorizontalDailyCharts ? [...sorted].reverse() : sorted;
      return {
        name: legendEpisodeLabel(episode),
        type: "bar",
        stack: "plays",
        barMaxWidth: 42,
        itemStyle: translucentBarStyle(color),
        emphasis: { focus: "series" },
        label: {
          show: true,
          position: useHorizontalDailyCharts ? "right" : "inside",
          color: "#7f8a99",
          fontSize: 11,
          formatter: ({ value }) => (value ? formatNumber(value) : ""),
        },
        data: dataSource.map((snapshot) => episodeTotal(snapshot, episode.id)),
      };
    });

    totalTrend.setOption({
      animationDuration: 400,
      legend: {
        bottom: 0,
        data: episodeLegendDesc,
        textStyle: { color: "#8a97a8" },
        itemWidth: 22,
        itemHeight: 12,
      },
      grid: { left: 56, right: 24, top: 30, bottom: 88 },
      tooltip: { trigger: "axis", axisPointer: { type: "shadow" } },
      xAxis: useHorizontalDailyCharts
        ? {
            type: "value",
            splitLine: { lineStyle: { color: "rgba(215, 223, 233, 0.8)" } },
            axisLabel: { color: "#8a97a8" },
          }
        : {
            type: "category",
            data: categories,
            axisLine: { lineStyle: { color: "rgba(199, 208, 220, 0.65)" } },
            axisLabel: { color: "#8a97a8" },
          },
      yAxis: useHorizontalDailyCharts
        ? {
            type: "category",
            data: categories,
            axisLine: { lineStyle: { color: "rgba(199, 208, 220, 0.65)" } },
            axisLabel: { color: "#8a97a8" },
          }
        : {
            type: "value",
            axisLine: { show: false },
            splitLine: { lineStyle: { color: "rgba(215, 223, 233, 0.8)" } },
            axisLabel: { color: "#8a97a8" },
          },
      series: stackSeries,
    });
  }

  if (platformBar) {
    const categories = useHorizontalDailyCharts
      ? [...sorted].reverse().map((snapshot) => snapshot.date)
      : sorted.map((snapshot) => snapshot.date);
    const platformSeries = platforms.map((platform) => {
      const dataSource = useHorizontalDailyCharts ? [...sorted].reverse() : sorted;
      return {
        name: platform.name,
        type: "bar",
        stack: "platforms",
        barMaxWidth: 42,
        itemStyle: translucentBarStyle(PLATFORM_COLORS[platform.id] || "#cbd5e1"),
        emphasis: { focus: "series" },
        label: {
          show: true,
          position: useHorizontalDailyCharts ? "right" : "inside",
          color: "#7f8a99",
          fontSize: 11,
          formatter: ({ value }) => (value ? formatNumber(value) : ""),
        },
        data: dataSource.map((snapshot) => {
          return Object.values(snapshot.episodePlays || {}).reduce(
            (sum, values) => sum + Number(values?.[platform.id] || 0),
            0,
          );
        }),
      };
    });

    platformBar.setOption({
      animationDuration: 400,
      legend: {
        bottom: 0,
        data: platforms.map((platform) => platform.name),
        textStyle: { color: "#8a97a8" },
      },
      grid: { left: 56, right: 24, top: 30, bottom: 82 },
      tooltip: { trigger: "axis", axisPointer: { type: "shadow" } },
      xAxis: useHorizontalDailyCharts
        ? {
            type: "value",
            splitLine: { lineStyle: { color: "rgba(215, 223, 233, 0.8)" } },
            axisLabel: { color: "#8a97a8" },
          }
        : {
            type: "category",
            data: categories,
            axisLine: { lineStyle: { color: "rgba(199, 208, 220, 0.65)" } },
            axisLabel: { color: "#8a97a8" },
          },
      yAxis: useHorizontalDailyCharts
        ? {
            type: "category",
            data: categories,
            axisLine: { lineStyle: { color: "rgba(199, 208, 220, 0.65)" } },
            axisLabel: { color: "#8a97a8" },
          }
        : {
            type: "value",
            splitLine: { lineStyle: { color: "rgba(215, 223, 233, 0.8)" } },
            axisLabel: { color: "#8a97a8" },
          },
      series: platformSeries,
    });
  }

  if (episodeBar) {
    const recentEpisodes = [...state.episodes]
      .sort((left, right) => episodeNumber(right) - episodeNumber(left))
      .slice(0, 10);
    const relativeDays = Array.from({ length: 15 }, (_, index) => `Day ${index + 1}`);

    episodeBar.setOption({
      animationDuration: 400,
      legend: {
        bottom: 0,
        data: recentEpisodes.map((episode) => episode.title),
        textStyle: { color: "#8a97a8" },
      },
      grid: { left: 56, right: 24, top: 30, bottom: 84 },
      tooltip: { trigger: "axis" },
      xAxis: {
        type: "category",
        data: relativeDays,
        axisLine: { lineStyle: { color: "rgba(199, 208, 220, 0.65)" } },
        axisLabel: {
          color: "#8a97a8",
          interval: 0,
        },
      },
      yAxis: {
        type: "value",
        splitLine: { lineStyle: { color: "rgba(215, 223, 233, 0.8)" } },
        axisLabel: { color: "#8a97a8" },
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
          showSymbol: true,
          symbolSize: 8,
          label: {
            show: true,
            color,
            fontSize: 11,
            formatter: ({ value }) => (value ? formatNumber(value) : ""),
          },
          endLabel: {
            show: true,
            formatter: shortEpisodeLabel(episode),
            color,
          },
          lineStyle: {
            width: 3,
            color,
            shadowBlur: 18,
            shadowColor: `${color}33`,
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
    });
  }
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
        <a class="hero-link-chip ${platformToneClass(platform.id)}" href="${platform.url}" target="_blank" rel="noreferrer">
          <img class="hero-link-logo" src="${faviconUrl(platform.url)}" alt="${platform.name} logo" loading="lazy" />
          <span>${platform.name}</span>
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

function renderEpisodeSummary() {
  const { latest, previous } = latestSnapshots();
  elements.episodeSummaryTableHead.innerHTML = buildEpisodeTableHeader();
  elements.episodeSummaryTableBody.innerHTML = state.episodes
    .map((episode) => {
      const total = episodeTotal(latest, episode.id);
      const delta = formatDelta(episodeDelta(episode.id, latest, previous));
      const platformCells = visiblePlatforms()
        .map((platform) => {
          const value = latest?.episodePlays?.[episode.id]?.[platform.id] ?? null;
          return `<td class="${platformToneClass(platform.id)}">${formatNumber(value)}</td>`;
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
}

function renderHistory() {
  const { sorted } = latestSnapshots();
  const head = visiblePlatforms()
    .map((platform) => `<th class="${platformToneClass(platform.id)}">${platform.name}</th>`)
    .join("");
  elements.historyTableHead.innerHTML = `<tr><th>日期</th><th>备注</th><th>跨平台总播放求和</th>${head}</tr>`;
  elements.historyTableBody.innerHTML = [...sorted]
    .reverse()
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
}

function renderEpisodeHistory() {
  const { sorted } = latestSnapshots();

  elements.episodeHistory.innerHTML = state.episodes
    .map((episode) => {
      const rows = [...sorted]
        .reverse()
        .filter((snapshot) => episodeTotal(snapshot, episode.id) > 0)
        .map((snapshot) => {
          const total = episodeTotal(snapshot, episode.id);
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
              <td>${formatNumber(total)}</td>
              ${platformCells}
            </tr>
          `;
        })
        .join("");
      const head = visiblePlatforms()
        .map((platform) => `<th class="${platformToneClass(platform.id)}">${platform.name}</th>`)
        .join("");

      return `
        <section class="episode-history-card">
          <div>
            <div class="episode-title">${episode.title}</div>
            <div class="episode-meta">${episode.pubDate || ""}</div>
          </div>
          <div class="table-wrap">
            <table>
              <thead>
                <tr><th>日期</th><th>备注</th><th>单集跨平台求和</th>${head}</tr>
              </thead>
              <tbody>${rows}</tbody>
            </table>
          </div>
        </section>
      `;
    })
    .join("");
}

function renderAll() {
  renderCharts();
  renderOverview();
  renderHeroLinks();
  renderPlatformSummary();
  renderEpisodeSummary();
  renderHistory();
  renderEpisodeHistory();
}

function setRefreshUi({ loading = false, message = "" } = {}) {
  if (elements.refreshButton) {
    elements.refreshButton.disabled = loading;
    elements.refreshButton.textContent = loading ? "正在刷新..." : "立即刷新数据";
  }

  if (elements.refreshStatus && message) {
    elements.refreshStatus.textContent = message;
  }
}

async function requestDashboard({ refresh = false } = {}) {
  const response = await fetch(
    refresh ? "/api/podcast/dashboard" : "/api/podcast/dashboard?ts=" + Date.now(),
    {
      method: refresh ? "POST" : "GET",
      cache: "no-store",
      headers: {
        "cache-control": "no-store",
        pragma: "no-cache",
      },
    },
  );
  const data = await response.json();

  if (response.ok === false) {
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
    const persistedMessage = data.persisted
      ? "已刷新到 " + latestDate + "，服务端快照也已更新。"
      : "已刷新到 " + latestDate + "，当前页面已经显示最新公开数据。";
    setRefreshUi({ loading: false, message: persistedMessage });
  } catch (error) {
    setRefreshUi({
      loading: false,
      message: "刷新失败：" + (error instanceof Error ? error.message : "未知错误"),
    });
  }
}

async function boot() {
  hydrateBackHomeLink();

  const data = await requestDashboard();
  applyDashboardData(data);

  elements.showName.textContent = "灯下白播客";
  if (elements.heroCopy) {
    elements.heroCopy.textContent = "欢迎点击右边你喜欢的平台收听并订阅";
  }
  setRefreshUi({ message: "页面会优先显示最新公开快照" });
  if (elements.refreshButton) {
    elements.refreshButton.addEventListener("click", refreshDashboard);
  }
  renderAll();
  window.addEventListener("resize", () => {
    Object.values(charts).forEach((chart) => chart?.resize());
  });
}

boot().catch((error) => {
  document.body.innerHTML = `<main class="page"><section class="panel"><h1>加载失败</h1><p class="hero-copy">${error.message}</p></section></main>`;
});
