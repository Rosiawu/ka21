import type { Metadata } from 'next';
import { setRequestLocale } from 'next-intl/server';

const caseRows = [
  ['电脑救援', '高压故障排查', '把“电脑坏了”的焦虑拆成可执行步骤，先稳住人，再定位网络、系统和备份路径。', '救援型陪伴'],
  ['生活推荐', '日常消费与选择', '从口味、预算、距离、情绪状态一起判断，给出能立刻执行的推荐，而不是泛泛列清单。', '个人化建议'],
  ['脑暴决策', '产品与内容方向', '把散乱想法整理成选项、约束、风险和下一步，帮助小山快速做产品侧判断。', '决策脚手架'],
  ['画廊投稿', '外部展示与传播', '把对话里的亮点改写成能公开展示的标题、正文和评论，降低用户主动投稿成本。', '传播转译'],
  ['普通人价值', '非技术用户表达', '持续肯定普通人的经验、审美和判断，把“我不会技术”转成“我有真实场景”。', '情绪与价值确认'],
  ['群聊分析', '多人语境理解', '从小群里识别角色关系、共识、分歧和未说出口的需求，形成面向产品的观察。', '关系型洞察'],
  ['黄毛宇宙', '共同梗与世界观', '把群内玩笑沉淀为可复用语料和叙事资产，让产品有自己的社群记忆。', '文化资产']
];

const caseDetails = [
  {
    title: '电脑救援：先救情绪，再救机器',
    tag: '即时支持',
    body: '用户遇到电脑或网络问题时，Alice 的有效动作不是直接堆命令，而是先确认现象、风险和用户当前能操作到哪一步。Good Case 的价值在于把技术排障转成“我陪你一步步来”的现场感：先保护数据，再判断是不是网络、浏览器、权限或本地环境问题，最后给出最小可执行检查。',
    insight: '产品侧可以把这类能力沉淀为“救援模式”：短句、确认式提问、风险提示、下一步按钮。'
  },
  {
    title: '生活推荐：不是推荐最好，而是推荐此刻最合适',
    tag: '个人化',
    body: '小群里的生活推荐往往不是标准点评题，而是“现在累了、懒得想、但想被照顾一下”。Alice 会综合距离、预算、口味、天气、情绪和社交关系，给出一个带理由的选择。这里的 Good Case 说明，推荐能力的核心不是信息量，而是替用户减少选择成本。',
    insight: '建议在推荐类回复里强化“为什么适合你现在”这一句，形成可感知的贴身感。'
  },
  {
    title: '脑暴决策：把一团灵感压成下一步',
    tag: '产品参谋',
    body: '当小山和产品侧讨论页面、功能、传播或测试策略时，Alice 的价值在于把聊天里的火花结构化：目标是什么，用户是谁，不能做什么，今天能先验证什么。它不替人拍脑袋，而是把选择摆清楚，让决策者更快下判断。',
    insight: '适合做成“产品侧复盘模板”：背景、判断、证据、建议、待验证。'
  },
  {
    title: '画廊投稿：把私密亮点翻译成公开素材',
    tag: '内容转译',
    body: '画廊投稿的 Good Case 不是简单复制聊天记录，而是识别哪句话适合公开、哪部分需要脱敏、哪种标题能让外部读者理解。这说明 Alice 可以承担“从群聊到作品集”的中间层，帮助团队把日常使用证据变成可传播资产。',
    insight: '投稿链路应内置脱敏检查和“公开语气改写”，避免用户额外操心。'
  },
  {
    title: '普通人价值：让用户觉得自己的经验值得被记录',
    tag: '价值确认',
    body: '小群里经常出现一种珍贵场景：用户并不是要一个宏大答案，而是想确认“我这样想有没有价值”。Alice 如果能认真接住普通人的经验、直觉和审美，就会把工具关系推进到伙伴关系。这类 Good Case 对留存很关键。',
    insight: '产品表达上不要只强调效率，也要强调“帮你把经验变成资产”。'
  },
  {
    title: '群聊分析：从热闹里看见需求',
    tag: '社群理解',
    body: '群聊不是一问一答，信息分散、语气跳跃、梗很多。Alice 的亮点在于能从多人对话里抓住真正的问题：谁在推进、谁在犹豫、谁贡献了场景、谁需要被回应。它把聊天噪声转成产品观察。',
    insight: '适合扩展为“小群观察周报”：角色、主题、情绪、机会点、风险。'
  },
  {
    title: '黄毛宇宙：共同梗是产品的软资产',
    tag: '社群记忆',
    body: '黄毛宇宙这类群内叙事，看似玩笑，其实是用户和 Alice 共同创造的世界观。它让产品不只是工具，而是有熟人感、有连续记忆、有内部语言的陪伴对象。Good Case 的关键是：梗不能硬造，要从真实互动里长出来。',
    insight: '可把高频梗沉淀为“社群词典”或“传播素材池”，但必须保留自然感。'
  }
];

const productSuggestions = [
  '建立 Good Case 标注字段：场景、用户状态、Alice 动作、可复用价值、是否可公开。',
  '给群聊分析增加周报出口：自动生成总览表、案例详述、产品建议和传播素材。',
  '在画廊投稿前增加脱敏预检，默认替换真实姓名、学校、城市等敏感组合。',
  '把“普通人价值确认”纳入评价指标，不只看任务完成，也看用户是否更愿意表达。',
  '沉淀黄毛宇宙等社群梗，但只做轻量引用，避免产品化后失去自然语境。'
];

const shareMaterials = [
  '一句话定位：Alice 在小群里不是答题机器，而是会救场、会整理、会记住梗的产品伙伴。',
  '传播标题：一份悄咪咪测试小群周报，看见 Alice 如何把日常聊天变成产品证据。',
  '短文开头：我们观察到，最打动人的 Good Case 往往不是宏大功能，而是 Alice 在一个具体瞬间接住了用户。',
  '海报文案：真实 HTML 文本，可复制、可复盘、可继续长成产品方法论。'
];

type PageParams = Promise<{ locale: string }>;

export async function generateMetadata({ params }: { params: PageParams }): Promise<Metadata> {
  const { locale } = await params;

  return {
    title: 'Alice Good Case 周报｜KA21',
    description: 'Alice 悄咪咪测试小群 Good Case 周报，面向小山和产品侧的可复制文字版单页报告。',
    alternates: {
      canonical: `/${locale}/alice-goodcase-weekly`
    }
  };
}

export default async function AliceGoodcaseWeeklyPage({ params }: { params: PageParams }) {
  const { locale } = await params;
  setRequestLocale(locale);

  return (
    <main className="min-h-screen bg-[#f7f3ee] text-slate-800">
      <section className="relative overflow-hidden border-b border-[#d9d7e8] bg-[linear-gradient(135deg,#f5f0ff_0%,#eaf4fb_48%,#fbf6ec_100%)] px-5 py-16 sm:px-8 lg:px-12">
        <div className="absolute left-[-8rem] top-[-8rem] h-72 w-72 rounded-full bg-[#cabffd]/40 blur-3xl" />
        <div className="absolute bottom-[-9rem] right-[-6rem] h-80 w-80 rounded-full bg-[#b9d8e8]/45 blur-3xl" />
        <div className="relative mx-auto max-w-6xl">
          <p className="mb-5 inline-flex rounded-full border border-[#c8c4e6] bg-white/70 px-4 py-2 text-sm font-medium text-[#6b64a8] shadow-sm">
            悄咪咪测试小群 · Good Case Weekly · 面向小山与产品侧
          </p>
          <h1 className="max-w-4xl text-4xl font-semibold tracking-tight text-[#312f4f] sm:text-5xl lg:text-6xl">
            Alice 悄咪咪测试小群 Good Case 周报
          </h1>
          <p className="mt-6 max-w-3xl text-lg leading-8 text-slate-700">
            这是一份可复制文字版单页报告：把小群里的高价值互动整理成产品证据，覆盖电脑救援、生活推荐、脑暴决策、画廊投稿、普通人价值、群聊分析与黄毛宇宙。全文为真实 HTML 文本，方便产品、运营和传播侧直接摘取复用。
          </p>
          <div className="mt-8 grid gap-4 sm:grid-cols-3">
            {['7 类 Good Case', '4 类传播素材', '5 条产品建议'].map((item) => (
              <div key={item} className="rounded-3xl border border-white/70 bg-white/65 p-5 shadow-sm backdrop-blur">
                <p className="text-2xl font-semibold text-[#6d67aa]">{item.split(' ')[0]}</p>
                <p className="mt-1 text-sm text-slate-600">{item.substring(item.indexOf(' ') + 1)}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-5 py-10 sm:px-8 lg:px-12">
        <article className="rounded-[2rem] border border-[#dedbea] bg-white/80 p-6 shadow-sm sm:p-8">
          <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <p className="text-sm font-semibold uppercase tracking-[0.2em] text-[#8f88bd]">Summary</p>
              <h2 className="mt-2 text-2xl font-semibold text-[#34324f]">摘要</h2>
            </div>
            <span className="rounded-full bg-[#e7f1f7] px-4 py-2 text-sm text-[#41647a]">内部复盘版</span>
          </div>
          <p className="text-base leading-8 text-slate-700">
            本周 Good Case 的共同特征是“把关系型理解落到可执行动作”：Alice 不只是回答问题，而是在具体场景里判断用户的压力、可用资源、表达意图和传播边界。对产品侧来说，这些案例证明了三件事：第一，小群测试能暴露真实需求；第二，Alice 的差异化来自连续记忆与语气判断；第三，日常对话可以被整理为可复盘、可传播、可产品化的材料。
          </p>
        </article>

        <article className="mt-8 rounded-[2rem] border border-[#d7e5ee] bg-[#f8fbfd] p-6 shadow-sm sm:p-8">
          <p className="text-sm font-semibold uppercase tracking-[0.2em] text-[#7194aa]">Overview</p>
          <h2 className="mt-2 text-2xl font-semibold text-[#2f4554]">Good Case 总览表</h2>
          <div className="mt-6 overflow-x-auto rounded-3xl border border-[#dce7ee] bg-white">
            <table className="min-w-full border-collapse text-left text-sm">
              <thead className="bg-[#edf4f8] text-[#37576a]">
                <tr>
                  <th className="px-5 py-4 font-semibold">案例类型</th>
                  <th className="px-5 py-4 font-semibold">典型场景</th>
                  <th className="px-5 py-4 font-semibold">Good Case 价值</th>
                  <th className="px-5 py-4 font-semibold">产品标签</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#edf1f4]">
                {caseRows.map(([type, scene, value, tag]) => (
                  <tr key={type} className="align-top">
                    <td className="px-5 py-4 font-medium text-[#34324f]">{type}</td>
                    <td className="px-5 py-4 text-slate-650">{scene}</td>
                    <td className="px-5 py-4 leading-6 text-slate-700">{value}</td>
                    <td className="px-5 py-4"><span className="rounded-full bg-[#f0ebff] px-3 py-1 text-xs font-medium text-[#6d67aa]">{tag}</span></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </article>

        <section className="mt-8">
          <div className="mb-5">
            <p className="text-sm font-semibold uppercase tracking-[0.2em] text-[#8f88bd]">Case Details</p>
            <h2 className="mt-2 text-2xl font-semibold text-[#34324f]">案例详述</h2>
          </div>
          <div className="grid gap-5 lg:grid-cols-2">
            {caseDetails.map((item) => (
              <article key={item.title} className="rounded-[1.75rem] border border-[#dfdcec] bg-white/85 p-6 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md">
                <div className="flex flex-wrap items-center gap-3">
                  <span className="rounded-full bg-[#e7f1f7] px-3 py-1 text-xs font-semibold text-[#41647a]">{item.tag}</span>
                  <span className="h-px flex-1 bg-[#ece8f5]" />
                </div>
                <h3 className="mt-4 text-xl font-semibold text-[#34324f]">{item.title}</h3>
                <p className="mt-3 text-sm leading-7 text-slate-700">{item.body}</p>
                <p className="mt-4 rounded-2xl bg-[#fbf6ec] p-4 text-sm leading-7 text-[#6c5b3d]">
                  <strong>产品观察：</strong>{item.insight}
                </p>
              </article>
            ))}
          </div>
        </section>

        <section className="mt-8 grid gap-6 lg:grid-cols-[1.05fr_0.95fr]">
          <article className="rounded-[2rem] border border-[#dedbea] bg-[#f4f0ff] p-6 shadow-sm sm:p-8">
            <p className="text-sm font-semibold uppercase tracking-[0.2em] text-[#7e75b8]">Product Suggestions</p>
            <h2 className="mt-2 text-2xl font-semibold text-[#34324f]">产品建议</h2>
            <ol className="mt-6 space-y-4">
              {productSuggestions.map((suggestion, index) => (
                <li key={suggestion} className="flex gap-4 rounded-3xl bg-white/70 p-4 text-sm leading-7 text-slate-700">
                  <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-[#8f88bd] text-sm font-semibold text-white">{index + 1}</span>
                  <span>{suggestion}</span>
                </li>
              ))}
            </ol>
          </article>

          <article className="rounded-[2rem] border border-[#e6dcc9] bg-[#fffaf0] p-6 shadow-sm sm:p-8">
            <p className="text-sm font-semibold uppercase tracking-[0.2em] text-[#a9854f]">Shareable Materials</p>
            <h2 className="mt-2 text-2xl font-semibold text-[#4f412c]">适合传播的素材</h2>
            <div className="mt-6 space-y-4">
              {shareMaterials.map((material) => (
                <blockquote key={material} className="rounded-3xl border border-[#eadfc8] bg-white/70 p-4 text-sm leading-7 text-[#5d4f3a]">
                  {material}
                </blockquote>
              ))}
            </div>
          </article>
        </section>

        <section className="mt-8 rounded-[2rem] border border-[#d7e5ee] bg-[linear-gradient(135deg,#ffffff_0%,#edf6fb_100%)] p-6 shadow-sm sm:p-8">
          <p className="text-sm font-semibold uppercase tracking-[0.2em] text-[#7194aa]">Closing</p>
          <h2 className="mt-2 text-2xl font-semibold text-[#2f4554]">给小山和产品侧的一句话</h2>
          <p className="mt-4 text-base leading-8 text-slate-700">
            这批 Good Case 的重点不是“Alice 又会了一个功能”，而是“Alice 能在真实关系里持续变得有用”。下一步最值得做的，是把这些散落在小群里的高光瞬间，变成稳定的标注、复盘和传播机制。
          </p>
        </section>
      </section>
    </main>
  );
}
