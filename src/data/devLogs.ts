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
    id: 'utils-ranking-fix-2026-03-11',
    version: '共创 10',
    date: '2026-03-11',
    timelineTitle: {
      zh: '为自媒体内容创作者加上两个小工具！',
      en: 'Added two utility tools for content creators',
    },
    cardTitle: {
      zh: '为自媒体内容创作者加上两个小工具！',
      en: 'Added two utility tools for content creators',
    },
    body: {
      zh: `今天牛牛酱来问我，排版的工具哪个好，我才意识到，好多小工具都是我自己脑袋里知道，但牛马库里还没有收录的呢。

于是今天本来只是想往“小工具”里加两个我自己真觉得好用的东西：
一个是整页截图插件 GoFullPage，
一个是 Markdown 排版工具 bm.md。

按理说，这种活应该很轻，补数据、补 logo、写一句推荐语，结束。
结果根本不是！！

先是预览炸了。
页面一直加载失败，我还以为是新工具写坏了。
结果往下一查，发现根本不是它俩的问题，
是首页教程里有微信图床的 `http` 图片，Next 的图片白名单没放行，整个首页直接被拖死。

我把这个坑补完之后，又去首页看“小工具”，
结果更气了：
条目明明已经加进去了，但你就是看不见。

继续追。
最后发现不是没加成功，
是默认排序把它们压到小工具分组后面去了。
也就是说，数据在，页面也在，只是埋得太深，肉眼看起来像“压根没有”。

所以我今天最后做的，不只是把两个工具加进去，
而是把它们真正推到用户能第一眼看到的位置，排序更新也是学问啊。 搞完了之后，直接 Git and Push。`,
      en: `Niuniu asked me which layout tool was worth using, and that was the moment I realized a lot of utility tools existed only in my head, not yet in the KA21 library.

So today I meant to add just two tools I genuinely like:
GoFullPage for full-page screenshots, and bm.md for Markdown layout.

It looked simple at first: add the data, add the logo, write one short recommendation, done.
But it was not simple at all.

Preview broke first. I thought the new tools had caused it, but the actual issue came from tutorial covers using an HTTP WeChat image host that was not allowed by the Next image whitelist, which dragged the whole homepage down.

After fixing that, I checked the utility section again and got even more annoyed: the entries were already there, but visually they still looked missing.

So I kept tracing it and found the real cause: default sorting had pushed both tools too far back inside the utility group.

In the end, what I finished was not just “adding two tools”.
I made sure they were actually visible in the place users would notice first, and then I wrapped it up with a clean git push.`,
    },
    imageSlotLabel: {
      zh: '图片位 10：小工具上新相关截图（待整理存储）',
      en: 'Image slot 10: utility update screenshots (to be stored)',
    },
    relatedLinks: [
      {
        label: {
          zh: '小工具：bm.md',
          en: 'Utility: bm.md',
        },
        href: 'https://bm.md/',
      },
      {
        label: {
          zh: '小工具：GoFullPage',
          en: 'Utility: GoFullPage',
        },
        href: 'https://chromewebstore.google.com/detail/gofullpage-full-page-scre/fdpohaocaechififmbbbbbknoalclacl?hl=en-US&utm_source=ext_sidebar',
      },
    ],
  },
  {
    id: 'podcast-mobile-icons-2026-03-11',
    version: '共创 09',
    date: '2026-03-11',
    timelineTitle: {
      zh: '灯下白播客首页调整',
      en: 'Homepage podcast card adjustment',
    },
    cardTitle: {
      zh: '灯下白播客首页调整',
      en: 'Homepage podcast card adjustment',
    },
    body: {
      zh: `今天继续打磨首页那张《灯下白》卡片的外观。

一开始看起来像是“小问题”：
手机上 8 个播客渠道挤成一团， logo 根本出不来。
但真改起来才发现，问题不是排版一个点，而是移动端、外链图标、加载稳定性全缠在一起。

Codex先把卡片的高度和内部间距重新压了一遍，
让手机端先有足够空间把 8 个入口放下。
结果我一看，说不对，logo 还是密密麻麻。

后来Codex换了思路：
能落本地的 logo 全部落本地，
YouTube 和 Spotify 这种再单独补品牌图标和颜色，
不再赌浏览器那一刻能不能把外链图标加载出来。

中间还来回改了几轮。
一会儿是文字 fallback 太土，
一会儿是 logo 虽然出来了，但品牌颜色不对。
最后才把这 8 个入口真正收拾到一个能看的状态：
手机上能完整看到，颜色也对，点进去也可以听播客了。`,
      en: `Today we kept polishing the look of the homepage podcast card.

What looked like a small issue turned out to be a combined problem of mobile layout, external icon loading, and rendering stability.

Codex first tightened the card height and spacing so mobile had enough room for all eight podcast shortcuts.
That still was not enough, so the strategy changed: every logo that could be stored locally was moved into local assets, while YouTube and Spotify were given explicit brand icons and colors instead of relying on live favicon fetches.

After a few more rounds, the eight shortcuts finally became stable: visible on mobile, visually correct, and clickable for listening.`,
    },
    imageSlotLabel: {
      zh: '图片位 09：灯下白播客首页移动端调整截图',
      en: 'Image slot 09: mobile podcast homepage adjustment',
    },
    images: [
      {
        src: '/images/devlog/co-create-09-1.png',
        alt: {
          zh: '灯下白播客首页移动端调整后截图',
          en: 'Mobile podcast homepage after adjustment',
        },
      },
    ],
  },
  {
    id: 'timeline-swipe-finish-2026-03-07',
    version: '共创 08',
    date: '2026-03-07',
    timelineTitle: {
      zh: '时间轴终于能滑着看了，预览也终于稳住了',
      en: 'Timeline now swipes smoothly and preview is stable',
    },
    cardTitle: {
      zh: '时间轴终于能滑着看了，预览也终于稳住了',
      en: 'Timeline now swipes smoothly and preview is stable',
    },
    body: {
      zh: `今天这条，主打一个“把体验抹平”。

我一直觉得开发日志这块不该是死板三宫格。
它本来就应该像时间线一样，能左右滑着看，轻一点，顺一点，像在翻大家一起写下来的过程。

所以这次我做了三件事：
1. 把首页开发日志从固定排布改成横向滑动时间轴。
2. 补上左右切换箭头和圆点定位，手机滑、桌面点，都能走。
3. 把交互细节重新收紧，保证卡片吸附、阅读节奏和点击路径都更清楚。

中间也踩坑了。
一度是“看起来启动了，但预览就是打不开”。
最后我把本地服务方式改成持续运行，才把这个问题彻底摁住。
那一刻就一个感受：有些bug不是难，是烦，但不清掉就永远卡在喉咙里。

今天没有加新花活，
但我把“看起来小、实际很影响使用”的地方又往前推了一步。
这个网站不是我一个人写给自己看的，
是我们这群人要一起长期用的，所以这些细节值得反复打磨。`,
      en: `Today was about smoothing the experience.

I refactored the devlog area from a fixed grid into a horizontal timeline, added arrow navigation and dot indicators, and tightened interaction details so snap, reading rhythm, and click paths feel clearer.

The tricky part was preview stability: it looked started but the page would not open. I switched to a persistent local dev-server workflow and stabilized it.

No flashy feature today, but a lot of small friction points were removed. These details matter because this site is built for long-term co-creation and daily use.`,
    },
    imageSlotLabel: {
      zh: '图片位 08：时间轴滑动与预览稳定性调优截图（4张）',
      en: 'Image slot 08: timeline swipe and preview stability snapshots (4 images)',
    },
    images: [
      {
        src: '/images/devlog/co-create-08-1.png',
        alt: {
          zh: '开发日志区横向时间轴效果截图 1',
          en: 'Devlog horizontal timeline snapshot 1',
        },
      },
      {
        src: '/images/devlog/co-create-08-2.png',
        alt: {
          zh: '开发日志区横向时间轴效果截图 2',
          en: 'Devlog horizontal timeline snapshot 2',
        },
      },
      {
        src: '/images/devlog/co-create-08-3.png',
        alt: {
          zh: '开发日志区横向时间轴效果截图 3',
          en: 'Devlog horizontal timeline snapshot 3',
        },
      },
      {
        src: '/images/devlog/co-create-08-4.png',
        alt: {
          zh: '提交记录与迭代结果截图',
          en: 'Commit history and iteration result snapshot',
        },
      },
    ],
  },
  {
    id: 'mobile-adaptation-battle-2026-03-06',
    version: '共创 07',
    date: '2026-03-06',
    timelineTitle: {
      zh: '和移动端适配度的搏斗，也是为了更多人受益',
      en: 'Mobile adaptation battle for broader usability',
    },
    cardTitle: {
      zh: '和移动端适配度的搏斗，也是为了更多人受益',
      en: 'Mobile adaptation battle for broader usability',
    },
    body: {
      zh: `今天继续改移动端，打开手机预览，页面看着就不对劲。
卡片挤在一起，按钮看不清，工具的“全部场景”标签还竖着。

我先改首页。
把位置重新排，把标题和按钮重新收紧。
刚觉得顺了，KA21群友又反馈: 按钮几乎看不见。

我又回去改颜色和样式。
这次终于稳住了，深色也能清楚看到按钮了。

再继续修“萌新教程”。Luke截图嘲笑道：“怎么高度不一致啊？”
我把卡片统一高度，信息压紧，列表终于整齐了。

最费劲的还是“全部场景”。
改一次，不行。  再改一次，还是竖着。
第三次我直接换了更硬的写法，强制它横排，它终于服了。

今天没有做很炫的新功能，
但把很多“看起来不大、用起来很烦”的问题一个个清掉了。
现在手机端终于更像一个能放心给人用的产品了。

为什么要花这么多时间在移动端呢？
因为今天有一位老师刚好给我问了一个问题，问我某个 AI工具能不能买。
我看了一眼之后斩钉截铁告诉她，你不用买。
当一个集成类的 AI 产品不告诉你它接的服务商是哪家的时候，基本可以判断这个工具的实际使用效果会非常糟糕。
群友问我，真的有老师有这种判断问题吗？
我说，是的，因为我们群友在KA21讨论和使用AI整整一年多了啊，普通人和我们对AI的认知是有时间差和信息差的。所以为什么我愿意花这么多时间在牛马库网站，因为至少，这些是我们人工真手测过的，教程是我们群友亲手写的，信得过。`,
      en: `今天继续改移动端，打开手机预览，页面看着就不对劲。
卡片挤在一起，按钮看不清，工具的“全部场景”标签还竖着。

我先改首页。
把位置重新排，把标题和按钮重新收紧。
刚觉得顺了，KA21群友又反馈: 按钮几乎看不见。

我又回去改颜色和样式。
这次终于稳住了，深色也能清楚看到按钮了。

再继续修“萌新教程”。Luke截图嘲笑道：“怎么高度不一致啊？”
我把卡片统一高度，信息压紧，列表终于整齐了。

最费劲的还是“全部场景”。
改一次，不行。  再改一次，还是竖着。
第三次我直接换了更硬的写法，强制它横排，它终于服了。

今天没有做很炫的新功能，
但把很多“看起来不大、用起来很烦”的问题一个个清掉了。
现在手机端终于更像一个能放心给人用的产品了。

为什么要花这么多时间在移动端呢？
因为今天有一位老师刚好给我问了一个问题，问我某个 AI工具能不能买。
我看了一眼之后斩钉截铁告诉她，你不用买。
当一个集成类的 AI 产品不告诉你它接的服务商是哪家的时候，基本可以判断这个工具的实际使用效果会非常糟糕。
群友问我，真的有老师有这种判断问题吗？
我说，是的，因为我们群友在KA21讨论和使用AI整整一年多了啊，普通人和我们对AI的认知是有时间差和信息差的。所以为什么我愿意花这么多时间在牛马库网站，因为至少，这些是我们人工真手测过的，教程是我们群友亲手写的，信得过。`,
    },
    imageSlotLabel: {
      zh: '图片位 07：移动端适配调优截图（4张）',
      en: 'Image slot 07: mobile adaptation screenshots (4 images)',
    },
    images: [
      {
        src: '/images/devlog/co-create-07-1.jpg',
        alt: {
          zh: '手机端首页萌新教程与开发日志区截图',
          en: 'Mobile homepage tutorial and devlog section',
        },
      },
      {
        src: '/images/devlog/co-create-07-2.jpg',
        alt: {
          zh: '手机端全部场景标签竖排问题截图',
          en: 'Mobile all-scenes vertical label issue',
        },
      },
      {
        src: '/images/devlog/co-create-07-3.png',
        alt: {
          zh: '群聊反馈截图：萌新教程卡片高度不一致',
          en: 'Group feedback: inconsistent tutorial card heights',
        },
      },
      {
        src: '/images/devlog/co-create-07-4.jpg',
        alt: {
          zh: '手机端底部工具卡片与标签显示截图',
          en: 'Mobile bottom tool cards and tags snapshot',
        },
      },
    ],
  },
  {
    id: 'home-podcast-polish-2026-03-06',
    version: '共创 06',
    date: '2026-03-05',
    timelineTitle: {
      zh: '首页灯下白卡片白天/黑夜版定稿',
      en: 'Homepage podcast card finalized for day/night',
    },
    cardTitle: {
      zh: '首页灯下白卡片白天/黑夜版定稿',
      en: 'Homepage podcast card finalized for day/night',
    },
    body: {
      zh: `今天这条开发日志，真的有点想哭着写完。

我从早到晚都在磨首页那一块《灯下白》卡片，来来回回改了很多轮：
先是位置不对，后来是对齐不对，再后来是移动端看起来又小又挤。
你看起来像“就调个样式”，但实际每一步都在拉扯审美、信息层级和可用性。

这次我重点做了几件事：
1. 把白天模式和黑夜模式都做成稳定版本，结构一致，但 logo 展示逻辑分开处理。
2. 把 KA21 logo 区和灯下白卡片重新对齐，解决“左轻右重”的问题。
3. 重做灯下白 logo 的裁切和缩放，让“灯和光束”在手机和网页都更清楚。
4. 在移动端补上关键信息：“和AI圈高手的真实对话”，不再让用户只看到标题。
5. CTA、文案、按钮、卡片内部排版都重新压了一遍，确保首屏一眼能懂。

中间最崩的是，我以为推上去了，结果线上看不到，连续几次都没成功。
那一刻真的特别难受，像8小时白干。
但最后还是一版一版找回来，把你满意的白天版和黑夜版定住了。

今天最大的感受是：
“好设计不是做出来的，是磨出来的。
尤其是首页这种第一眼区域，差 4px 都会让人觉得不对。”

《灯下白》继续更，灯继续往近处打。`,
      en: `The homepage podcast section was polished to a release-ready state today.

This round focused on four items:
1. Finalized both light and dark mode variants with the same layout structure and correct logo usage.
2. Realigned the KA21 logo block and the podcast recommendation card to fix left-right visual imbalance.
3. Tuned podcast logo crop/scale so the lamp and beam are clearly visible on both mobile and desktop.
4. Added a mobile-only key line: “Real conversations with AI leaders,” so the core value is visible above the fold.

The final snapshot is now stable for release: clear structure, better hierarchy, and consistent cross-device presentation.`,
    },
    imageSlotLabel: {
      zh: '图片位 06：首页灯下白白天/黑夜定稿截图（7张）',
      en: 'Image slot 06: final home snapshots for light/dark modes (7 images)',
    },
    images: [
      {
        src: '/images/devlog/home-podcast-06-a.jpg',
        alt: {
          zh: '首页灯下白手机端定稿截图 1',
          en: 'Homepage podcast mobile snapshot 1',
        },
      },
      {
        src: '/images/devlog/home-podcast-06-b.png',
        alt: {
          zh: '首页灯下白暗色桌面端定稿截图',
          en: 'Homepage podcast dark desktop snapshot',
        },
      },
      {
        src: '/images/devlog/home-podcast-06-c.png',
        alt: {
          zh: '用户反馈说明截图（7页缩略图）',
          en: 'User feedback collage screenshot',
        },
      },
      {
        src: '/images/devlog/home-podcast-06-d.jpg',
        alt: {
          zh: '首页灯下白手机端定稿截图 2',
          en: 'Homepage podcast mobile snapshot 2',
        },
      },
      {
        src: '/images/devlog/home-podcast-06-e.png',
        alt: {
          zh: '首页灯下白手机端异常换行截图',
          en: 'Homepage podcast mobile wrap issue snapshot',
        },
      },
      {
        src: '/images/devlog/home-podcast-06-f.png',
        alt: {
          zh: '首页灯下白本地桌面预览截图',
          en: 'Homepage podcast local desktop preview snapshot',
        },
      },
      {
        src: '/images/devlog/home-podcast-06-g.png',
        alt: {
          zh: '首页灯下白白天模式桌面截图',
          en: 'Homepage podcast light desktop snapshot',
        },
      },
    ],
    relatedLink: {
      label: {
        zh: '灯下白 EP01（点击收听）',
        en: 'Lamp Under the Light EP01',
      },
      href: 'https://www.xiaoyuzhoufm.com/episodes/69a69588de29766da93ec01b',
    },
  },
  {
    id: 'podcast-guest-4',
    version: '共创 05',
    date: '2026-03-06',
    timelineTitle: {
      zh: '灯下白第四个嘉宾高质量买一送一',
      en: 'Lamp Under the Light guest 4: buy one get one',
    },
    cardTitle: {
      zh: '灯下白第四个嘉宾高质量买一送一',
      en: 'Lamp Under the Light guest 4: buy one get one',
    },
    body: {
      zh: `灯下白第四个嘉宾的邀约，挺有意思的。

那天早上我给Bill发消息，说你可以参考刘旭第一期的开头，讲个故事引入，不过我要先了解一些你的上下文，这样我才能准备采访大纲。他回得很爽快，说好的，整理好了给你。

我当时就有点得意地说了一句，我感觉我这个播客邀约也太顺利了。
Bill立刻回我一句，买一赠一，因为他转介绍了他的朋友思康，说思康也有很强的背景和能力。

我当场笑得嘎嘎嘎：
“高质量买一赠一，没水分的。”

再后来，他还邀请我，说以后有机会把你们都请到我们财经AI会客厅，一起耍。我说这个难度有点高，先把事情做起来吧，不过你要是叫我去，我肯定去。

昨天我把Bill的大纲写完了，就开始催他。
他说背景已经写好了，正在写故事。

我回，你这种逗比型人格，我觉得我们录播客的时候干脆就一起讲相声，把节奏拉轻一点，但内容还是得有干货。
他也很配合，说好的哈哈哈。

就这样，灯下白的第四个嘉宾，在一片哈哈哈哈中，被我薅过来了。

但实际上我仔细看了他的大纲，不愧是搞研报出身的，在信息搜索和整理方面，相当值得信赖！本周日录，敬请期待！`,
      en: `灯下白第四个嘉宾的邀约，挺有意思的。

那天早上我给Bill发消息，说你可以参考刘旭第一期的开头，讲个故事引入，不过我要先了解一些你的上下文，这样我才能准备采访大纲。他回得很爽快，说好的，整理好了给你。

我当时就有点得意地说了一句，我感觉我这个播客邀约也太顺利了。
Bill立刻回我一句，买一赠一，因为他转介绍了他的朋友思康，说思康也有很强的背景和能力。

我当场笑得嘎嘎嘎：
“高质量买一赠一，没水分的。”

再后来，他还邀请我，说以后有机会把你们都请到我们财经AI会客厅，一起耍。我说这个难度有点高，先把事情做起来吧，不过你要是叫我去，我肯定去。

昨天我把Bill的大纲写完了，就开始催他。
他说背景已经写好了，正在写故事。

我回，你这种逗比型人格，我觉得我们录播客的时候干脆就一起讲相声，把节奏拉轻一点，但内容还是得有干货。
他也很配合，说好的哈哈哈。

就这样，灯下白的第四个嘉宾，在一片哈哈哈哈中，被我薅过来了。

但实际上我仔细看了他的大纲，不愧是搞研报出身的，在信息搜索和整理方面，相当值得信赖！本周日录，敬请期待！`,
    },
    imageSlotLabel: {
      zh: '图片位 05：第四个嘉宾邀约配图（4张）',
      en: 'Image slot 05: guest #4 invitation visuals (4 images)',
    },
    images: [
      {
        src: '/images/devlog/podcast-guest-4-1.jpg',
        alt: {
          zh: '播客准备资料插画',
          en: 'Podcast prep document illustration',
        },
      },
      {
        src: '/images/devlog/podcast-guest-4-2.jpg',
        alt: {
          zh: '嘉宾回接消息插画',
          en: 'Guest reply illustration',
        },
      },
      {
        src: '/images/devlog/podcast-guest-4-3.jpg',
        alt: {
          zh: '高质量买一赠一插画',
          en: 'Buy one get one illustration',
        },
      },
      {
        src: '/images/devlog/podcast-guest-4-4.jpg',
        alt: {
          zh: '正在写故事插画',
          en: 'Writing story illustration',
        },
      },
    ],
  },
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
