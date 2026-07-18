type CdpTarget = {
  targetId?: string;
  url?: string;
};

type EvalResponse<T> = {
  value?: T & { error?: string; stack?: string };
  error?: string;
};

type PublishHistoryPage = {
  total: number;
  records: WechatPublishedArticle[];
};

export type WechatPublishedArticle = {
  title: string;
  url: string;
  createTime: number;
  cover?: string;
  coverIsHead: boolean;
  coverNeedsCrop: boolean;
  digest?: string;
  kind: 'article' | 'image';
  appmsgId: string;
  itemIdx: number;
  imageCount: number;
};

export type WechatPublishHistoryResult = {
  totalRecords: number;
  articles: WechatPublishedArticle[];
  source: 'mp-backend';
};

const DEFAULT_PROXY_URL = 'http://localhost:3456';
const PAGE_SIZE = 20;

async function fetchJson<T>(url: string, init?: RequestInit, timeoutMs = 60_000): Promise<T> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const response = await fetch(url, { ...init, signal: controller.signal });
    if (!response.ok) throw new Error(`http-${response.status}`);
    return await response.json() as T;
  } finally {
    clearTimeout(timeout);
  }
}

async function findBackendTarget(proxyUrl: string): Promise<CdpTarget | undefined> {
  const targets = await fetchJson<CdpTarget[]>(`${proxyUrl}/targets`, undefined, 5_000);
  return targets.find((target) => {
    try {
      const url = new URL(target.url || '');
      return url.hostname === 'mp.weixin.qq.com' && url.pathname.startsWith('/cgi-bin/') && url.searchParams.has('token');
    } catch {
      return false;
    }
  });
}

export function buildPageExpression(begin: number): string {
  return `(async()=>{
    try {
    const token=new URL(location.href).searchParams.get('token');
    if(!token) throw new Error('wechat-backend-token-missing');
    const url='/cgi-bin/appmsgpublish?sub=list&begin=${begin}&count=${PAGE_SIZE}&token='+encodeURIComponent(token)+'&lang=zh_CN';
    const response=await fetch(url,{credentials:'include'});
    const html=await response.text();
    const doc=new DOMParser().parseFromString(html,'text/html');
    const script=[...doc.scripts].map(item=>item.textContent||'').find(text=>text.includes('let publish_page'));
    if(!script) throw new Error('wechat-publish-page-missing');
    const start=script.indexOf('publish_page = ')+15;
    const end=script.indexOf(';\\n    isPublishPageNoEncode',start);
    if(start<15||end<start) throw new Error('wechat-publish-data-missing');
    const page=JSON.parse(script.slice(start,end));
    const textarea=document.createElement('textarea');
    const records=[];
    for(const row of page.publish_list||[]){
      textarea.innerHTML=row.publish_info||'';
      let info;
      try{info=JSON.parse(textarea.value)}catch{continue}
      for(const item of info.appmsg_info||[]){
        if(item.is_deleted||!item.title||!item.content_url) continue;
        let host='';
        try{host=new URL(item.content_url,location.origin).hostname}catch{continue}
        if(host!=='mp.weixin.qq.com'&&host!=='mp.weixinqq.com') continue;
        const images=Array.isArray(item.share_imageinfo)?item.share_imageinfo:[];
        const isImage=item.share_type===8||item.item_show_type===8;
        const pictureText=images.map(image=>image.pic_text||'').filter(Boolean).join('\\n');
        const nativeHeadCover=item.pic_cdn_url_235_1||'';
        const imagePostCover=images[0]?.cdn_url||images[0]?.cover_url||'';
        records.push({
          title:item.title,
          url:item.content_url,
          createTime:Number(info.sent_info?.time||item.line_info?.send_time||0),
          cover:isImage?(imagePostCover||nativeHeadCover||item.cover):(nativeHeadCover||item.cover||imagePostCover),
          coverIsHead:!isImage&&!!nativeHeadCover,
          coverNeedsCrop:isImage&&!!(imagePostCover||nativeHeadCover||item.cover),
          digest:[item.digest||'',pictureText].filter(Boolean).join('\\n'),
          kind:isImage?'image':'article',
          appmsgId:String(item.appmsgid||info.msgid||''),
          itemIdx:Number(item.itemidx||1),
          imageCount:images.length
        });
      }
    }
    return {total:Number(page.total_count||0),records};
    } catch (error) {
      return {error:String(error),stack:error&&error.stack?String(error.stack):''};
    }
  })()`;
}

async function fetchPage(proxyUrl: string, targetId: string, begin: number): Promise<PublishHistoryPage> {
  const payload = await fetchJson<EvalResponse<PublishHistoryPage>>(
    `${proxyUrl}/eval?target=${encodeURIComponent(targetId)}`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'text/plain; charset=utf-8' },
      body: buildPageExpression(begin),
    },
    90_000,
  );

  if (!payload.value || !Array.isArray(payload.value.records)) {
    throw new Error(payload.value?.error || payload.error || `wechat-publish-page-eval-failed-${begin}`);
  }
  return payload.value;
}

export async function discoverWechatPublishHistory(): Promise<WechatPublishHistoryResult> {
  const proxyUrl = (process.env.WECHAT_CDP_PROXY_URL || DEFAULT_PROXY_URL).replace(/\/$/, '');
  const target = await findBackendTarget(proxyUrl);
  if (!target?.targetId) {
    throw new Error('wechat-mp-backend-tab-unavailable');
  }

  const first = await fetchPage(proxyUrl, target.targetId, 0);
  const pages = Math.max(1, Math.ceil(first.total / PAGE_SIZE));
  const all = [...first.records];
  console.log(`[personal-fulltext] publish history page=1/${pages} records=${first.records.length} total=${first.total}`);

  for (let page = 1; page < pages; page += 1) {
    const current = await fetchPage(proxyUrl, target.targetId, page * PAGE_SIZE);
    all.push(...current.records);
    console.log(`[personal-fulltext] publish history page=${page + 1}/${pages} records=${current.records.length}`);
  }

  const deduped = new Map<string, WechatPublishedArticle>();
  for (const article of all) {
    const key = article.appmsgId ? `${article.appmsgId}:${article.itemIdx}` : article.url;
    if (key) deduped.set(key, article);
  }

  return {
    totalRecords: first.total,
    articles: [...deduped.values()],
    source: 'mp-backend',
  };
}
