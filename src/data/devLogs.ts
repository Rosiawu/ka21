export type LocalizedText = {
  zh: string;
  en: string;
};

export type DevLogEntry = {
  id: string;
  version: string;
  date: string;
  timelineTitle: LocalizedText;
  cardTitle: LocalizedText;
  body: LocalizedText;
  imageSlotLabel: LocalizedText;
  images?: Array<{
    src: string;
    alt: LocalizedText;
    caption?: LocalizedText;
  }>;
  relatedLink?: {
    label: LocalizedText;
    href: string;
  };
  relatedLinks?: Array<{
    label: LocalizedText;
    href: string;
  }>;
};

export const devLogs: DevLogEntry[] = [
  {
    id: 'logo-origin-story',
    version: '共创 04',
    date: '2026-03-05',
    timelineTitle: {
      zh: '《灯下白》Logo 的由来故事',
      en: 'The Origin Story of Lamp Under the Light Logo',
    },
    cardTitle: {
      zh: '《灯下白》Logo 的由来故事',
      en: 'The Origin Story of Lamp Under the Light Logo',
    },
    body: {
      zh: `这个 Logo 的起点，其实来自一个很小的瞬间。

昨天小金鱼（百宝箱子）在看第一集播客，我讲到节目名字叫《灯下白》。那一刻她被击中了。因为“灯下黑”我们都懂，越靠近的地方越容易忽略，盲区往往就在脚边。而“灯下白”像是把这句话反过来：如果把灯挪近一点，盲区也可以被照亮。

她当场就想把这个概念变成一个可见的符号。（是的，我并没有喊她帮我设计，但她在youmind里面吭哧吭哧对话了一个多小时，泪目！）

于是她把灯下白播客的关键人物@倒放的标志图形拿出来做了一次图形拆解。

几何符号的主体，看起来像一个被框住的叶片或火焰，也有点像折纸风格的立体结构。它有边界感，像一个被认真框定的视角，也有向上生长的力量。它的抽象感，保留了想象空间。你可以把它看成火焰、叶片、折纸，也可以把它看成一个正在被打开的“百宝箱子”，里面藏着很多答案，但需要你靠近一点去看。

当它和下方的光束效果组合在一起时，这个符号又会自然地变成一个聚光灯或舞台灯。那束光照向地面，照向盲区。

所以这个 Logo 只是画一件事：把盲区点亮。

从图一开始，她做了第一次拆解。到了图二，再把拆解后的形状重新排列，终于出现了“一盏灯把盲区点亮”的结构。后来所有的图三、图四、图五，都是从图二延伸出来的变体。它们像同一个母体不断生长出的不同版本，保持同样的光感，同样的边界，同样的方向感。

《灯下白》想做的事情，也和这个 Logo 一样。

把灯挪近一点，把那些容易忽略的地方照亮。让你在听完之后，能轻轻地破掉一个小盲点，多一个视角，多一点清晰。

这就是《灯下白》的 Logo，和它背后那束光的来历。特此鸣谢百宝箱子小金鱼！`,
      en: `这个 Logo 的起点，其实来自一个很小的瞬间。

昨天小金鱼（百宝箱子）在看第一集播客，我讲到节目名字叫《灯下白》。那一刻她被击中了。因为“灯下黑”我们都懂，越靠近的地方越容易忽略，盲区往往就在脚边。而“灯下白”像是把这句话反过来：如果把灯挪近一点，盲区也可以被照亮。

她当场就想把这个概念变成一个可见的符号。（是的，我并没有喊她帮我设计，但她在youmind里面吭哧吭哧对话了一个多小时，泪目！）

于是她把灯下白播客的关键人物@倒放的标志图形拿出来做了一次图形拆解。

几何符号的主体，看起来像一个被框住的叶片或火焰，也有点像折纸风格的立体结构。它有边界感，像一个被认真框定的视角，也有向上生长的力量。它的抽象感，保留了想象空间。你可以把它看成火焰、叶片、折纸，也可以把它看成一个正在被打开的“百宝箱子”，里面藏着很多答案，但需要你靠近一点去看。

当它和下方的光束效果组合在一起时，这个符号又会自然地变成一个聚光灯或舞台灯。那束光照向地面，照向盲区。

所以这个 Logo 只是画一件事：把盲区点亮。

从图一开始，她做了第一次拆解。到了图二，再把拆解后的形状重新排列，终于出现了“一盏灯把盲区点亮”的结构。后来所有的图三、图四、图五，都是从图二延伸出来的变体。它们像同一个母体不断生长出的不同版本，保持同样的光感，同样的边界，同样的方向感。

《灯下白》想做的事情，也和这个 Logo 一样。

把灯挪近一点，把那些容易忽略的地方照亮。让你在听完之后，能轻轻地破掉一个小盲点，多一个视角，多一点清晰。

这就是《灯下白》的 Logo，和它背后那束光的来历。特此鸣谢百宝箱子小金鱼！`,
    },
    imageSlotLabel: {
      zh: '图片位 04：Logo 由来故事配图',
      en: 'Image slot 04: logo origin story visuals',
    },
    images: [
      {
        src: '/images/devlog/logo-origin-1.jpg',
        alt: {
          zh: 'Logo 图形拆解与演进草图',
          en: 'Logo decomposition and evolution sketch',
        },
      },
      {
        src: '/images/devlog/logo-origin-2.jpg',
        alt: {
          zh: '灯下白角色插画图',
          en: 'Lamp Under the Light character illustration',
        },
      },
      {
        src: '/images/devlog/logo-origin-3.png',
        alt: {
          zh: '灯下白播客推荐卡片图',
          en: 'Lamp Under the Light podcast recommendation card',
        },
      },
    ],
  },
  {
    id: 'co-create-100',
    version: '共创 01',
    date: '2026-03-04',
    timelineTitle: {
      zh: '牛马库网站衍生播客灯下白正式上线',
      en: '#LampUnderLight podcast is live',
    },
    cardTitle: {
      zh: '牛马库网站衍生播客灯下白正式上线',
      en: '#LampUnderLight podcast is live',
    },
    body: {
      zh: `早上还在地铁，倒放发来四条音乐，“吴老师，你选一下，哪个符合灯下白的气质？”
下午，开剪，真的比我想象中还复杂，片头片尾音乐，合并音轨素材，调整音量。
音频处理完，再分别去小宇宙、喜马拉雅和网易云音乐做实名认证，找小金鱼要了logo。
再在南乔老师帮助下，写了一段很有内味儿的简介：“本节目由人类与GPT共同策划，剪映处理音频中水词，千问处理剪辑时间轴，GPT撰写Shownotes，Banana Pro生成播客logo，即梦生成播客封面，海绵生成片头片尾音乐，同时由声湃和中关村科学城公司提供录音场地，由罗德麦克风提供录音设备。感谢中关村科学城的政策支持！”

下班路上，再约了德沛做第三期嘉宾，他是我的编程老师，码力全开的第三期，等着！

回家路上，给闺蜜萌感慨，“一年前，我真不敢想，我自己写网站，写小程序，还做播客，人生真的是好奇妙！感谢KA21，感谢卡兹克！”。`,
      en: `早上还在地铁，倒放发来四条音乐，“吴老师，你选一下，哪个符合灯下白的气质？”
下午，开剪，真的比我想象中还复杂，片头片尾音乐，合并音轨素材，调整音量。
音频处理完，再分别去小宇宙、喜马拉雅和网易云音乐做实名认证，找小金鱼要了logo。
再在南乔老师帮助下，写了一段很有内味儿的简介：“本节目由人类与GPT共同策划，剪映处理音频中水词，千问处理剪辑时间轴，GPT撰写Shownotes，Banana Pro生成播客logo，即梦生成播客封面，海绵生成片头片尾音乐，同时由声湃和中关村科学城公司提供录音场地，由罗德麦克风提供录音设备。感谢中关村科学城的政策支持！”

下班路上，再约了德沛做第三期嘉宾，他是我的编程老师，码力全开的第三期，等着！

回家路上，给闺蜜萌感慨，“一年前，我真不敢想，我自己写网站，写小程序，还做播客，人生真的是好奇妙！感谢KA21，感谢卡兹克！”。`,
    },
    imageSlotLabel: {
      zh: '图片位 03：播客发布当天相关配图（待你上传）',
      en: 'Image slot 03: launch-day visual (upload later)',
    },
    images: [
      {
        src: '/images/devlog/podcast-subway.jpg',
        alt: {
          zh: '地铁里处理播客音频的插画',
          en: 'Illustration of editing podcast audio on the subway',
        },
      },
      {
        src: '/images/devlog/podcast-xiaoyuzhou.jpg',
        alt: {
          zh: '小宇宙页面截图',
          en: 'Xiaoyuzhou page screenshot',
        },
      },
    ],
  },
  {
    id: 'podcast-lamp',
    version: '共创 02',
    date: '2026-03-04',
    timelineTitle: {
      zh: '庆祝牛马库真人撰写教程突破100大关！',
      en: '100 tutorials milestone',
    },
    cardTitle: {
      zh: '庆祝牛马库真人撰写教程突破100大关！',
      en: 'Thanks to Daoge for two tutorials yesterday',
    },
    body: {
      zh: `感谢刀哥昨天的两篇教程
牛马库网站教程已经整整100篇啦～

很多刚入门的人问我怎么学AI，
我都会把牛马库推荐给他们，
因为这些教程里面，藏着牛马库作者们从小白到高手的来时路。`,
      en: `感谢刀哥昨天的两篇教程
牛马库网站教程已经整整100篇啦～

很多刚入门的人问我怎么学AI，
我都会把牛马库推荐给他们，
因为这些教程里面，藏着牛马库作者们从小白到高手的来时路。`,
    },
    imageSlotLabel: {
      zh: '图片位 01：教程 100 篇相关配图（待你上传）',
      en: 'Image slot 01: tutorial-100 related visual (upload later)',
    },
    images: [
      {
        src: '/images/devlog/co-create-100.png',
        alt: {
          zh: '牛马库首页教程区截图',
          en: 'KA21 tutorials section screenshot',
        },
      },
    ],
    relatedLinks: [
      {
        label: {
          zh: '刀哥教程 01：Mac 版 OpenClaw 安装教程',
          en: 'Daoge Tutorial 01: OpenClaw setup for macOS',
        },
        href: 'https://mp.weixin.qq.com/s/Wz0YoQVEKmWBRODRdeFXuQ',
      },
      {
        label: {
          zh: '刀哥教程 02：Windows 版 OpenClaw 安装教程',
          en: 'Daoge Tutorial 02: OpenClaw setup for Windows',
        },
        href: 'https://mp.weixin.qq.com/s/7AFWS6ZqYzSnzLU9Iiimig',
      },
    ],
  },
  {
    id: 'podcast-launch-day',
    version: '共创 03',
    date: '2026-03-04',
    timelineTitle: {
      zh: '牛马库网站衍生播客灯下白片头曲写作幕后故事',
      en: 'Podcast Lamp Under the Light launched',
    },
    cardTitle: {
      zh: '牛马库网站衍生播客灯下白片头曲写作幕后故事',
      en: 'Warm tone, tidal mood, co-creation',
    },
    body: {
      zh: `牛马库网站衍生播客灯下白上线。听到中间很惊喜，倒老师和我想法一样，我也选了温润的这段做片头，当时听到就觉得它有这个时代稀缺的温度和活人感。

所以你这个名字和片头曲做得是真太匹配我这个播客的气质了。
桃李春风一杯酒，江湖夜雨十年灯，没想到在赛博世界里遇到提示词诗人倒放老师，并有幸合作共创。
我非常喜欢播客片头的潮汐感，非常有韵味。
最后，倒老师什么时候来北京，欢迎倒放来，共饮灯下白。`,
      en: `牛马库网站衍生播客灯下白上线。听到中间很惊喜，倒老师和我想法一样，我也选了温润的这段做片头，当时听到就觉得它有这个时代稀缺的温度和活人感。

所以你这个名字和片头曲做得是真太匹配我这个播客的气质了。
桃李春风一杯酒，江湖夜雨十年灯，没想到在赛博世界里遇到提示词诗人倒放老师，并有幸合作共创。
我非常喜欢播客片头的潮汐感，非常有韵味。
最后，倒老师什么时候来北京，欢迎倒放来，共饮灯下白。`,
    },
    imageSlotLabel: {
      zh: '图片位 02：播客上线相关配图（待你上传）',
      en: 'Image slot 02: podcast launch visual (upload later)',
    },
    images: [
      {
        src: '/images/devlog/podcast-co-create-1.png',
        alt: {
          zh: '灯下白音乐风格画面截图',
          en: 'Screenshot of LampUnderLight music style',
        },
      },
      {
        src: '/images/devlog/podcast-co-create-2.png',
        alt: {
          zh: '灯下白播客页面与感谢倒放老师画面',
          en: 'LampUnderLight page with thanks screen',
        },
      },
      {
        src: '/images/devlog/podcast-co-create-3.png',
        alt: {
          zh: '灯下白播客音乐风格建议内容截图',
          en: 'LampUnderLight music style suggestion screenshot',
        },
      },
    ],
    relatedLinks: [
      {
        label: {
          zh: '灯下白 EP01（点击收听）',
          en: 'Lamp Under the Light EP01 (Listen)',
        },
        href: 'https://www.xiaoyuzhoufm.com/episodes/69a69588de29766da93ec01b',
      },
    ],
  },
];

function parseVersionNumber(version: string): number {
  const match = version.match(/(\d+)/);
  if (!match) return 0;
  return Number(match[1]) || 0;
}

function toTimeValue(dateStr: string): number {
  const value = new Date(dateStr).getTime();
  return Number.isNaN(value) ? 0 : value;
}

export const sortedDevLogs = [...devLogs].sort((a, b) => {
  const dateDiff = toTimeValue(b.date) - toTimeValue(a.date);
  if (dateDiff !== 0) return dateDiff;
  return parseVersionNumber(b.version) - parseVersionNumber(a.version);
});

export const latestTimeline = sortedDevLogs.slice(0, 3).map((entry) => ({
  id: entry.id,
  version: entry.version,
  date: entry.date,
  title: entry.timelineTitle,
}));

export function getPreviewSnippet(content: string): string {
  const firstLine = content
    .split('\n')
    .map((line) => line.trim())
    .find((line) => line.length > 0);

  if (!firstLine) return '';
  return firstLine.length > 56 ? `${firstLine.slice(0, 56)}...` : firstLine;
}
