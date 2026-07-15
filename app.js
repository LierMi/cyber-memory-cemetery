const steps = [
  {
    title: "搜索网页残骸",
    desc: "查询 Wayback 快照、公开残留页面和用户输入线索。",
  },
  {
    title: "整理文化证据",
    desc: "提取网站主题、存活时间、社区标签和代表性记忆。",
  },
  {
    title: "Gonka 交叉验真",
    desc: "数字考古员和真相校验员分别推理，输出共识评分。",
  },
  {
    title: "撰写数字墓志铭",
    desc: "在不虚构事实的前提下，生成庄重克制的链上挽歌。",
  },
  {
    title: "打包永久档案",
    desc: "生成结构化 JSON，可上传至 Arweave、Irys 或 IPFS。",
  },
];

const defaultRelics = [
  {
    name: "最后一页快照",
    desc: "从公开网页残骸中抽取的时间戳和页面入口。",
  },
  {
    name: "失效的入口",
    desc: "原始域名仍然指向记忆，但不再承载完整社区。",
  },
  {
    name: "未迁移的回声",
    desc: "用户评论、收藏、相册或长文只保留为风险提示。",
  },
];

const burialPlans = [
  {
    id: "witness",
    name: "见证席",
    price: "0 USDC",
    desc: "签名留言、献花点灯、下载公开档案 JSON。",
  },
  {
    id: "archive",
    name: "永久安葬",
    price: "0.5 USDC",
    desc: "封存档案、生成内容哈希，接入 Pinata 后返回 IPFS CID。",
  },
  {
    id: "guardian",
    name: "守墓人",
    price: "2 USDC",
    desc: "认领纪念 NFT、展示守墓人署名，并获得长期监测席位。",
  },
];

const evidencePackages = new Map();

const cases = [
  {
    id: "renren",
    name: "人人网 / 校内网",
    originalUrl: "https://www.renren.com",
    type: "校园社交网络",
    status: "遗址化",
    lifespan: "2005-2024",
    archiveCount: 80,
    firstSeen: "2005",
    lastSeen: "2024",
    truthScore: 91,
    certainty: "高",
    image: "./assets/case-renren.png",
    tags: ["相册", "日志", "留言板", "校园实名社交"],
    summary:
      "人人网的前身校内网曾是中国校园实名社交的重要入口，承载相册、日志、留言板和大学关系链。2024 年 12 月服务暂停后，它从社交平台变成一处需要被考古的数字遗址。",
    epitaph:
      "这里曾经存放过课间、毕业照、深夜日志和没有说出口的话。许多账号还记得同学的名字，但那座校园广场已经安静到只剩登录失败的回声。",
    evidence: [
      {
        title: "公开历史",
        desc: "校内网于 2005 年创立，2009 年更名为人人网，校园实名社交定位清晰。",
        url: "https://en.wikipedia.org/wiki/Renren",
      },
      {
        title: "资本高光",
        desc: "2011 年人人网在纽交所 IPO，被国际媒体视为中国社交网络代表案例。",
        url: "https://www.wired.com/2011/05/renren/",
      },
      {
        title: "服务暂停",
        desc: "2024 年 12 月公开报道显示用户无法登录，平台称正在升级，引发用户抢救旧相册和日志。",
        url: "https://www.sixthtone.com/news/1016317",
      },
    ],
    timeline: [
      {
        date: "2005",
        title: "校内网创立",
        detail: "以高校实名关系链为核心，早期主要服务大学生群体。",
        source: "https://en.wikipedia.org/wiki/Renren",
      },
      {
        date: "2009",
        title: "更名人人网",
        detail: "从校内场景扩展为更广泛的年轻人实名社交网络。",
        source: "https://en.wikipedia.org/wiki/Renren",
      },
      {
        date: "2011",
        title: "赴美上市",
        detail: "Renren 以 RENN 为代码在纽交所交易，成为当时最受关注的中国社交网络 IPO 之一。",
        source: "https://www.wired.com/2011/05/renren/",
      },
      {
        date: "2018",
        title: "社交业务出售",
        detail: "公开报道将 2018 年出售视作人人网社交业务影响力结束的重要节点。",
        source: "https://www.sixthtone.com/news/1016317",
      },
      {
        date: "2024-12",
        title: "服务暂停和遗址化",
        detail: "多名用户报告无法登录，平台公告称服务升级，旧相册和日志迁移问题被集中讨论。",
        source: "https://www.sixthtone.com/news/1016317",
      },
    ],
    verifiableFacts: [
      "人人网前身是校内网，起源于校园实名社交。",
      "2009 年校内网更名为人人网，域名转向 renren.com。",
      "2011 年人人网以 RENN 在纽约证券交易所上市。",
      "相册、日志、留言板、状态和好友关系是其核心用户记忆载体。",
      "2024 年 12 月出现服务暂停和无法登录的公开报道。",
    ],
    uncertainClaims: [
      "无法确认所有个人相册和日志是否永久丢失，只能标记为访问风险和迁移风险。",
      "用户规模、活跃度等历史数字在不同来源中口径不同，应在展示中标注来源。",
      "服务升级是否会恢复完整旧数据，目前公开信息不足，不能宣告完全死亡。",
    ],
    sourceLinks: [
      {
        label: "Renren Wikipedia",
        url: "https://en.wikipedia.org/wiki/Renren",
      },
      {
        label: "WIRED IPO coverage",
        url: "https://www.wired.com/2011/05/renren/",
      },
      {
        label: "Sixth Tone 2024 service suspension",
        url: "https://www.sixthtone.com/news/1016317",
      },
      {
        label: "Wayback CDX sample",
        url: "https://web.archive.org/cdx?url=renren.com&output=json&fl=timestamp,statuscode&filter=statuscode:200&collapse=digest&limit=80",
      },
    ],
    privacyBoundary:
      "本 Demo 不抓取、不保存用户私密相册、日志正文、私信或账号资料。墓碑只保存公开来源摘要、历史快照元数据和用户主动提交的材料。",
    demoAngle:
      "评委进入页面后，先看到一个熟悉的名字人人网，再看到它从校园广场变成登录失败现场。Gonka 的作用不是写悼词，而是让每一句悼词都能追溯到证据。",
    relics: [
      {
        name: "毕业照的暗房",
        desc: "相册是人人网最强的个人记忆容器，但本项目只保存公开元数据。",
      },
      {
        name: "留言板余温",
        desc: "留言板和状态构成校园关系链的可识别文化符号。",
      },
      {
        name: "登录失败回声",
        desc: "2024 年访问异常让旧数据迁移问题集中浮出水面。",
      },
    ],
    requests: [
      ["digital_archaeologist", "gonka_req_renren_6b7a10"],
      ["truth_verifier", "gonka_req_renren_938cab"],
    ],
  },
  {
    id: "xiami",
    name: "虾米音乐",
    originalUrl: "https://www.xiami.com",
    type: "独立音乐社区",
    status: "已关停",
    lifespan: "2008-2021",
    archiveCount: 80,
    firstSeen: "2008",
    lastSeen: "2021",
    truthScore: 93,
    certainty: "高",
    image: "./assets/case-xiami.png",
    tags: ["独立音乐", "乐评", "精选集", "音乐人平台"],
    summary:
      "虾米音乐曾是中文互联网独立音乐和乐评文化的重要栖息地，承载精选集、音乐人主页、长乐评和听歌关系链。2021 年停止服务后，大量用户歌单、评论和个人收藏入口从公开互联网中消失。",
    epitaph:
      "这里曾经有人用歌单写日记，用长评确认一首歌真的击中过自己。播放器已经停止转动，但那些在深夜被收藏、被转发、被反复听见的声音，不该被 404 安静埋葬。",
    evidence: [
      {
        title: "公开历史",
        desc: "虾米前身 Emumo 创建于 2006 年，虾米音乐于 2008 年上线；两者不是同一日期。",
        url: "https://www.xinhuanet.com/fortune/2021-01/05/c_1126948999.htm",
      },
      {
        title: "平台归属",
        desc: "2013 年虾米音乐被阿里巴巴集团全资收购，2015 年与天天动听合并为阿里音乐。",
        url: "https://zh.wikipedia.org/wiki/%E8%99%BE%E7%B1%B3%E9%9F%B3%E4%B9%90",
      },
      {
        title: "官方关停",
        desc: "2021 年 1 月 5 日虾米音乐宣布业务调整，2 月 5 日停止歌曲试听、下载、评论等音乐消费场景，3 月 5 日关闭服务器。",
        url: "https://zh.wikipedia.org/wiki/%E8%99%BE%E7%B1%B3%E9%9F%B3%E4%B9%90",
      },
    ],
    timeline: [
      {
        date: "2006",
        title: "Emumo 前身创建",
        detail: "Emumo 是虾米的前身；它的创建年份不应与虾米音乐的上线年份混为一谈。",
        source: "https://www.xinhuanet.com/fortune/2021-01/05/c_1126948999.htm",
      },
      {
        date: "2008",
        title: "虾米音乐上线",
        detail: "以音乐推荐、下载、发布和社区互动为核心，逐渐形成以乐评和精选集为标志的用户文化。",
        source: "https://zh.wikipedia.org/wiki/%E8%99%BE%E7%B1%B3%E9%9F%B3%E4%B9%90",
      },
      {
        date: "2013",
        title: "被阿里巴巴收购",
        detail: "平台进入阿里体系，独立音乐和正版音乐分发成为它区别于大众播放器的重要标签。",
        source: "https://zh.wikipedia.org/wiki/%E8%99%BE%E7%B1%B3%E9%9F%B3%E4%B9%90",
      },
      {
        date: "2015",
        title: "并入阿里音乐",
        detail: "虾米音乐与天天动听合并为阿里音乐，进入集团化版权和流量竞争阶段。",
        source: "https://zh.wikipedia.org/wiki/%E8%99%BE%E7%B1%B3%E9%9F%B3%E4%B9%90",
      },
      {
        date: "2021-02",
        title: "停止音乐服务",
        detail: "虾米音乐停止歌曲试听、下载、评论等消费场景，用户开始集中迁移歌单和收藏。",
        source: "https://zh.wikipedia.org/wiki/%E8%99%BE%E7%B1%B3%E9%9F%B3%E4%B9%90",
      },
      {
        date: "2021-03",
        title: "关闭服务器",
        detail: "服务器关闭后，旧歌单、乐评、精选集和音乐人页面只能依赖快照、截图和用户自存资料复原。",
        source: "https://zh.wikipedia.org/wiki/%E8%99%BE%E7%B1%B3%E9%9F%B3%E4%B9%90",
      },
    ],
    verifiableFacts: [
      "虾米前身 Emumo 创建于 2006 年，虾米音乐于 2008 年上线。",
      "虾米音乐在 2013 年被阿里巴巴集团全资收购。",
      "2015 年虾米音乐与天天动听合并为阿里音乐。",
      "2021 年 2 月 5 日起，虾米音乐停止歌曲试听、下载、评论等主要音乐消费场景。",
      "2021 年 3 月 5 日起，虾米音乐关闭服务器。",
      "乐评、精选集、歌单、音乐人主页是虾米最有辨识度的社区记忆载体。",
    ],
    uncertainClaims: [
      "无法确认所有歌单、评论、乐评和音乐人资料是否被完整迁移或永久丢失。",
      "部分歌曲版权、评论内容和用户头像可能受版权或隐私约束，不能直接公开再分发。",
      "独立音乐生态影响力属于文化判断，需要绑定公开来源、用户提交材料和快照证据共同说明。",
    ],
    sourceLinks: [
      {
        label: "虾米音乐 Wikipedia",
        url: "https://zh.wikipedia.org/wiki/%E8%99%BE%E7%B1%B3%E9%9F%B3%E4%B9%90",
      },
      {
        label: "阿里音乐 Wikipedia",
        url: "https://zh.wikipedia.org/wiki/%E9%98%BF%E9%87%8C%E9%9F%B3%E4%B9%90",
      },
      {
        label: "Wayback CDX sample",
        url: "https://web.archive.org/cdx?url=xiami.com&output=json&fl=timestamp,statuscode&filter=statuscode:200&collapse=digest&limit=80",
      },
    ],
    privacyBoundary:
      "本 Demo 不抓取、不保存用户私人歌单详情、账号资料、评论全文或未授权音频。墓碑只保存公开来源摘要、快照元数据和用户主动提交的纪念材料。",
    demoAngle:
      "虾米不是一个普通播放器的消失，而是一个中文独立音乐社区的停机。评委会看到歌单、乐评、精选集和音乐人主页如何从日常入口变成需要被链上归档的文化遗物。",
    relics: [
      {
        name: "未迁移的精选集",
        desc: "用户用精选集组织音乐品味和关系，关停后只能依赖截图和迁移文件。",
      },
      {
        name: "最后一条长评",
        desc: "乐评是虾米最鲜明的社区资产，但评论全文涉及版权和用户隐私边界。",
      },
      {
        name: "静音的播放器",
        desc: "试听、下载、评论在 2021 年停止服务，音乐入口被关闭。",
      },
    ],
    requests: [
      {
        role: "digital_archaeologist",
        model: "MiniMaxAI/MiniMax-M2.7",
        requestId: "devshard-23538-19653",
        summary: "真实 Gonka 会诊已返回 Request ID，正文被 reasoning 或 token 限制截断。",
      },
      {
        role: "truth_verifier",
        model: "moonshotai/Kimi-K2.6",
        requestId: "devshard-23542-679",
        summary: "虾米音乐于 2008 年上线，2021 年分阶段关停，是中文独立音乐重要平台。",
      },
    ],
  },
  {
    id: "netease-blog",
    name: "网易博客",
    originalUrl: "https://blog.163.com",
    type: "个人写作平台",
    status: "已关停",
    lifespan: "2006-2018",
    archiveCount: 151,
    firstSeen: "2006",
    lastSeen: "2018",
    truthScore: 92,
    certainty: "高",
    image: "./assets/case-netease-blog.png",
    tags: ["长文", "日记", "个人主页"],
    summary:
      "网易博客曾是中文个人写作的重要平台。大量网络日记、影评、旅行记录和私人长文依托它存在，关停后迁移成本极高。",
    epitaph:
      "这里有许多人第一次认真写下自己。长文被迁走，链接被折断，但那些慢慢打出来的句子，仍然应该拥有一个地址。",
    evidence: [
      ["官方公告", "2018 年停止运营的公告与媒体报道清晰"],
      ["历史快照", "平台首页和博客页面存在长期快照"],
      ["内容形态", "个人长文和日记是平台主要文化资产"],
    ],
    requests: [
      ["digital_archaeologist", "gonka_req_blog163_e20a61"],
      ["truth_verifier", "gonka_req_blog163_7f43bc"],
    ],
  },
  {
    id: "tianya",
    name: "天涯社区",
    originalUrl: "https://www.tianya.cn",
    type: "中文公共论坛",
    status: "停摆遗址",
    lifespan: "1999-至今",
    archiveCount: 260,
    firstSeen: "1999",
    lastSeen: "2024",
    truthScore: 86,
    certainty: "中高",
    image: "./assets/case-tianya.png",
    tags: ["长帖", "公共讨论", "神贴"],
    summary:
      "天涯社区曾是中文互联网公共讨论场之一，长帖、神贴、社会观察和民间叙事沉淀丰富。近年访问不稳定，让数字遗产保护问题变得具体。",
    epitaph:
      "这里曾经人声鼎沸，争论从凌晨延续到清晨。帖子像一条条长街，街灯暗下去后，仍有人记得自己曾在这里发言。",
    evidence: [
      ["公开报道", "近年停摆与恢复讨论有大量公开报道"],
      ["历史快照", "多年首页和栏目快照可查询"],
      ["文化标签", "长帖、公共讨论和民间叙事具有高识别度"],
    ],
    requests: [
      ["digital_archaeologist", "gonka_req_tianya_c9e187"],
      ["truth_verifier", "gonka_req_tianya_45bd2a"],
    ],
  },
  {
    id: "mop",
    name: "猫扑网",
    originalUrl: "https://www.mop.com",
    type: "早期中文论坛",
    status: "社区衰退",
    lifespan: "1997-2021",
    archiveCount: 132,
    firstSeen: "1997",
    lastSeen: "2021",
    truthScore: 84,
    certainty: "中",
    image: "./assets/case-mop.png",
    tags: ["论坛", "亚文化", "网络梗"],
    summary:
      "猫扑网是早期中文论坛文化的重要节点，承载网络梗、亚文化和社区互动。发帖功能关闭后，它更像一片可被参观的早期互联网遗址。",
    epitaph:
      "这里曾经有粗粝、热闹、难以复制的中文互联网早期气味。回帖声渐远，但那些梗和吵闹曾经真实地塑造过一代网民。",
    evidence: [
      ["公开报道", "关闭发帖功能和社区变化有公开资料"],
      ["历史快照", "早期门户和论坛页面可通过快照复原"],
      ["文化价值", "网络梗与论坛亚文化是主要遗产"],
    ],
    requests: [
      ["digital_archaeologist", "gonka_req_mop_0ab61f"],
      ["truth_verifier", "gonka_req_mop_92d77a"],
    ],
  },
];

const state = {
  selectedId: "xiami",
  running: false,
  currentMemorial: null,
  archiveSeals: {},
  archivePayloads: {},
  memorialActions: {},
  nftClaims: {},
  invoices: {},
};

const archiveProviderCopy = {
  "pinata-ipfs": "IPFS 永久档案",
  "local-sealed": "本地封存，不具备永久存储证明",
};

const byId = (id) => document.getElementById(id);

function createTag(text) {
  return `<span class="tag">${escapeHtml(text)}</span>`;
}

function escapeHtml(value) {
  return String(value ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function defaultActions(caseId) {
  return {
    flowers: caseId === "xiami" ? 37 : 24,
    candles: caseId === "xiami" ? 19 : 15,
    messages: [
      caseId === "xiami"
        ? {
            name: "old_listener",
            text: "我还记得那些凌晨整理出来的精选集。",
            time: "2026-07-06",
          }
        : {
            name: "campus_witness",
            text: "这里保存过很多人第一次认真写下自己的样子。",
            time: "2026-07-06",
          },
    ],
  };
}

function getActions(caseId) {
  if (!state.memorialActions[caseId]) {
    state.memorialActions[caseId] = defaultActions(caseId);
  }
  return state.memorialActions[caseId];
}

function shortId(input, length = 12) {
  let hash = 0;
  const text = String(input);
  for (let index = 0; index < text.length; index += 1) {
    hash = (hash * 31 + text.charCodeAt(index)) >>> 0;
  }
  return hash.toString(16).padStart(8, "0").slice(0, length);
}

function displayDate() {
  return new Date().toISOString().slice(0, 10);
}

function receiptId(prefix, itemId, salt = Date.now()) {
  return `${prefix}_${itemId}_${shortId(`${itemId}:${salt}:${prefix}`, 10)}`;
}

function renderCases() {
  const grid = byId("caseGrid");
  grid.innerHTML = cases
    .map((item, index) => {
      const featured = index < 2 ? " featured" : "";
      const active = item.id === state.selectedId ? " active" : "";
      return `
        <article class="case-card${featured}${active}" role="button" tabindex="0" data-case-id="${item.id}">
          <div class="case-art">
            <img src="${item.image}" alt="${item.name} 的数字遗址视觉图" width="720" height="540" loading="lazy" />
          </div>
          <div class="case-body">
            <div class="case-meta">
              ${createTag(item.status)}
              ${createTag(item.type)}
            </div>
            <h3>${item.name}</h3>
            <p>${item.summary}</p>
            <div class="score-line">
              <span>Truth ${item.truthScore}/100</span>
              <span>${item.lifespan}</span>
            </div>
          </div>
        </article>
      `;
    })
    .join("");

  grid.querySelectorAll("[data-case-id]").forEach((card) => {
    const openCase = () => {
      const id = card.getAttribute("data-case-id");
      selectCase(id);
      activateMuseumTab("exhibit");
      byId("memorial").scrollIntoView({ behavior: "smooth", block: "start" });
    };
    card.addEventListener("click", openCase);
    card.addEventListener("keydown", (event) => {
      if (event.key === "Enter" || event.key === " ") {
        event.preventDefault();
        openCase();
      }
    });
  });
}

function updateCaseSelection() {
  document.querySelectorAll("[data-case-id]").forEach((card) => {
    card.classList.toggle("active", card.getAttribute("data-case-id") === state.selectedId);
  });
}

function activateMuseumTab(tabId) {
  const nextTab = tabId || "exhibit";
  document.querySelectorAll("[data-museum-tab]").forEach((button) => {
    button.classList.toggle("active", button.getAttribute("data-museum-tab") === nextTab);
  });
  document.querySelectorAll("[data-tab-panel]").forEach((panel) => {
    const isActive = panel.getAttribute("data-tab-panel") === nextTab;
    panel.hidden = !isActive;
    panel.classList.toggle("active", isActive);
  });
}

function renderEvidenceItem(item) {
  const title = Array.isArray(item) ? item[0] : item.title;
  const desc = Array.isArray(item) ? item[1] : item.desc;
  const url = Array.isArray(item) ? item[2] : item.url;
  const link = url
    ? `<a href="${escapeHtml(url)}" target="_blank" rel="noreferrer">查看来源</a>`
    : "";
  return `
    <li>
      <strong>${escapeHtml(title)}</strong>
      <code>${escapeHtml(desc)}</code>
      ${link}
    </li>
  `;
}

function renderTimeline(items = []) {
  if (!items.length) return "";
  return `
    <div class="detail-section">
      <h4>案例时间线</h4>
      <ol class="timeline-list">
        ${items
          .map(
            (entry) => `
              <li>
                <time>${escapeHtml(entry.date)}</time>
                <div>
                  <strong>${escapeHtml(entry.title)}</strong>
                  <span>${escapeHtml(entry.detail)}</span>
                  ${
                    entry.source
                      ? `<a href="${escapeHtml(entry.source)}" target="_blank" rel="noreferrer">来源</a>`
                      : ""
                  }
                </div>
              </li>
            `,
          )
          .join("")}
      </ol>
    </div>
  `;
}

function renderListSection(title, items = [], className = "fact-list") {
  if (!items.length) return "";
  return `
    <div class="detail-section">
      <h4>${escapeHtml(title)}</h4>
      <ul class="${className}">
        ${items.map((item) => `<li>${escapeHtml(item)}</li>`).join("")}
      </ul>
    </div>
  `;
}

function renderSourceLinks(items = []) {
  if (!items.length) return "";
  return `
    <div class="detail-section">
      <h4>资料来源</h4>
      <div class="source-grid">
        ${items
          .map(
            (item) => `
              <a class="source-link" href="${escapeHtml(item.url)}" target="_blank" rel="noreferrer">
                ${escapeHtml(item.label)}
              </a>
            `,
          )
          .join("")}
      </div>
    </div>
  `;
}

function renderTextSection(title, text) {
  if (!text) return "";
  return `
    <div class="detail-section">
      <h4>${escapeHtml(title)}</h4>
      <p class="text-note">${escapeHtml(text)}</p>
    </div>
  `;
}

function renderRelicPanel(item) {
  const relics = item.relics?.length ? item.relics : defaultRelics;
  return `
    <div class="detail-section">
      <h4>遗物清单</h4>
      <div class="relic-grid">
        ${relics
          .map(
            (relic) => `
              <article class="relic-card">
                <strong>${escapeHtml(relic.name)}</strong>
                <span>${escapeHtml(relic.desc)}</span>
              </article>
            `,
          )
          .join("")}
      </div>
    </div>
  `;
}

function renderMemorialActionsPanel(item) {
  const actions = getActions(item.id);
  const recentMessages = actions.messages.slice(-3).reverse();
  return `
    <div class="detail-section memorial-actions-panel">
      <h4>纪念册</h4>
      <div class="tribute-grid">
        <button class="tribute-button" type="button" data-action="offer-flower">
          <strong>${actions.flowers}</strong>
          <span>献花</span>
        </button>
        <button class="tribute-button" type="button" data-action="light-candle">
          <strong>${actions.candles}</strong>
          <span>点灯</span>
        </button>
        <div class="tribute-total">
          <strong>${actions.messages.length}</strong>
          <span>留言</span>
        </div>
      </div>
      <form class="guestbook-form" data-action="guestbook-submit">
        <label for="guestName">纪念署名</label>
        <input id="guestName" name="guestName" type="text" value="anonymous_witness" />
        <label for="guestMessage">留言</label>
        <textarea id="guestMessage" name="guestMessage" rows="3">愿这些歌单还在某处被听见。</textarea>
        <button class="button secondary" type="submit">写入纪念册</button>
      </form>
      <ul class="guestbook-list">
        ${recentMessages
          .map(
            (message) => `
              <li>
                <strong>${escapeHtml(message.name)}</strong>
                <span>${escapeHtml(message.text)}</span>
                <code>${escapeHtml(message.time)}</code>
              </li>
            `,
          )
          .join("")}
      </ul>
    </div>
  `;
}

function buildNftMetadata(item, owner) {
  return {
    name: `Cyber Memory Witness - ${item.name}`,
    description: `A non-transferable witness credential for ${item.name} in Cyber Memory Cemetery.`,
    image: item.image,
    external_url: item.originalUrl,
    attributes: [
      { trait_type: "Case", value: item.id },
      { trait_type: "Status", value: item.status },
      { trait_type: "Truth Score", value: String(item.truthScore) },
      { trait_type: "Owner Label", value: owner || "anonymous_witness" },
      { trait_type: "Credential Type", value: "Witness" },
    ],
  };
}

function renderNftPanel(item) {
  const claim = state.nftClaims[item.id];
  return `
    <div class="detail-section nft-panel">
      <h4>纪念 NFT 认领</h4>
      <div class="nft-layout">
        <div class="nft-medal" aria-hidden="true">
          <span>${escapeHtml(item.firstSeen)}</span>
          <strong>${escapeHtml(item.name)}</strong>
          <em>WITNESS</em>
        </div>
        <div class="nft-copy">
          <p class="text-note">
            认领的是见证凭证，不代表所有权。真实合约接入后，可改为不可转让 SBT 或纪念 NFT。
          </p>
          <label for="claimOwner">认领名或钱包地址</label>
          <input id="claimOwner" name="claimOwner" type="text" value="${escapeHtml(
            claim?.owner || "anonymous_witness",
          )}" />
          <div class="archive-actions">
            <button class="button primary" type="button" data-action="claim-nft">
              认领见证 NFT
            </button>
            ${claim ? `<button class="button secondary" type="button" data-action="download-nft">下载 metadata</button>` : ""}
          </div>
        </div>
      </div>
      ${
        claim
          ? `
            <ul class="request-list archive-list">
              <li>
                <strong>token_id</strong>
                <code>${escapeHtml(claim.tokenId)}</code>
              </li>
              <li>
                <strong>owner</strong>
                <code>${escapeHtml(claim.owner)}</code>
              </li>
              <li>
                <strong>mint_receipt</strong>
                <code>${escapeHtml(claim.receiptId)}</code>
              </li>
            </ul>
          `
          : ""
      }
    </div>
  `;
}

function renderCommercePanel(item) {
  const invoice = state.invoices[item.id];
  return `
    <div class="detail-section commerce-panel">
      <h4>安葬套餐</h4>
      <div class="plan-grid">
        ${burialPlans
          .map(
            (plan) => `
              <article class="plan-card ${invoice?.planId === plan.id ? "selected" : ""}">
                <strong>${escapeHtml(plan.name)}</strong>
                <code>${escapeHtml(plan.price)}</code>
                <span>${escapeHtml(plan.desc)}</span>
                <button class="button secondary" type="button" data-action="select-plan" data-plan-id="${escapeHtml(plan.id)}">
                  生成账单
                </button>
              </article>
            `,
          )
          .join("")}
      </div>
      ${
        invoice
          ? `
            <ul class="request-list archive-list">
              <li>
                <strong>invoice_id</strong>
                <code>${escapeHtml(invoice.invoiceId)}</code>
              </li>
              <li>
                <strong>payment_route</strong>
                <code>${escapeHtml(invoice.paymentRoute)}</code>
              </li>
              <li>
                <strong>amount</strong>
                <code>${escapeHtml(invoice.amount)}</code>
              </li>
            </ul>
          `
          : ""
      }
    </div>
  `;
}

function compactHash(value, head = 14, tail = 8) {
  const text = String(value || "");
  if (text.length <= head + tail + 3) return text;
  return `${text.slice(0, head)}...${text.slice(-tail)}`;
}

function parseUsdc(amount) {
  const parsed = Number.parseFloat(String(amount || "0").replace(/[^\d.]/g, ""));
  return Number.isFinite(parsed) ? parsed : 0;
}

function formatUsdc(amount) {
  const fixed = Number(amount).toFixed(2);
  return `${fixed.replace(/\.00$/, "")} USDC`;
}

function longTraceId(seed) {
  let hex = "";
  let index = 0;
  while (hex.length < 64) {
    hex += shortId(`${seed}:${index}`, 8);
    index += 1;
  }
  return `0x${hex.slice(0, 64)}`;
}

function kiteLedgerFor(item) {
  const invoice = state.invoices[item.id];
  const archiveSeal = state.archiveSeals[item.id];
  const claim = state.nftClaims[item.id];
  const storageSpend = archiveSeal ? 0.5 : 0;
  const planSpend = invoice ? parseUsdc(invoice.amount) : 0;
  const nftSpend = claim ? 0.1 : 0;
  const spent = storageSpend + planSpend + nftSpend;
  const allowance = 3;
  const remaining = Math.max(allowance - spent, 0);
  const txSeed = `${item.id}:${invoice?.invoiceId || "no-invoice"}:${archiveSeal?.contentHash || "no-archive"}:${claim?.tokenId || "no-claim"}`;

  return {
    allowance,
    spent,
    remaining,
    txHash: longTraceId(txSeed),
    entries: [
      {
        label: "Storage API",
        amount: formatUsdc(storageSpend),
        status: archiveSeal ? "paid" : "standby",
      },
      {
        label: "Burial Plan",
        amount: invoice ? invoice.amount : "0 USDC",
        status: invoice ? "authorized" : "pending",
      },
      {
        label: "NFT Metadata",
        amount: formatUsdc(nftSpend),
        status: claim ? "prepared" : "pending",
      },
    ],
  };
}

function archiveReadinessFor(item, archiveSeal, requests) {
  const actions = getActions(item.id);
  const claim = state.nftClaims[item.id];
  const invoice = state.invoices[item.id];
  return [
    {
      label: "公开证据",
      value: `${item.evidence.length} 条`,
      ready: item.evidence.length > 0,
    },
    {
      label: "模型会诊",
      value: `${requests.length} 个 Request ID`,
      ready: requests.length >= 2,
    },
    {
      label: "纪念册",
      value: `${actions.messages.length} 条留言`,
      ready: actions.messages.length > 0,
    },
    {
      label: "见证凭证",
      value: claim ? "已认领" : "待认领",
      ready: Boolean(claim),
    },
    {
      label: "Kite 账单",
      value: invoice ? invoice.amount : "待生成",
      ready: Boolean(invoice),
    },
    {
      label: "永久封存",
      value: archiveSeal ? archiveSeal.status : "待封存",
      ready: Boolean(archiveSeal),
    },
  ];
}

function renderTombstoneCraftPanel(item, archiveSeal) {
  const actions = getActions(item.id);
  const claim = state.nftClaims[item.id];
  const invoice = state.invoices[item.id];
  const sealText = archiveSeal ? compactHash(archiveSeal.contentHash, 16, 10) : "等待封存";
  const tokenText = claim ? compactHash(claim.tokenId, 16, 8) : "未认领";
  const paymentText = invoice ? `${invoice.planName} / ${invoice.amount}` : "未选择套餐";
  const elements = [
    {
      label: "碑名",
      value: item.name,
      note: "来自公开平台名称，不改写历史对象。",
    },
    {
      label: "墓志铭",
      value: `${item.epitaph.slice(0, 28)}...`,
      note: "文学层可读，事实层绑定证据链。",
    },
    {
      label: "证据火漆",
      value: sealText,
      note: "封存后写入 content hash，演示时可下载 JSON。",
    },
    {
      label: "见证凭证",
      value: tokenText,
      note: "用户可认领纪念 NFT 或 SBT，不代表内容所有权。",
    },
    {
      label: "纪念热度",
      value: `${actions.flowers} 花 / ${actions.candles} 灯`,
      note: "社区动作会进入永久档案 payload。",
    },
    {
      label: "商业入口",
      value: paymentText,
      note: "Kite Agent Passport 负责授权额度内的自动支付。",
    },
  ];

  return `
    <div class="detail-section craft-panel">
      <h4>墓碑元素配置</h4>
      <div class="craft-grid">
        ${elements
          .map(
            (element) => `
              <article>
                <span>${escapeHtml(element.label)}</span>
                <strong>${escapeHtml(element.value)}</strong>
                <p>${escapeHtml(element.note)}</p>
              </article>
            `,
          )
          .join("")}
      </div>
    </div>
  `;
}

function renderProofChainBoard(item, archiveSeal, requests, verificationSource) {
  const claim = state.nftClaims[item.id];
  const invoice = state.invoices[item.id];
  const actions = getActions(item.id);
  const chain = [
    {
      label: "Source",
      value: `${item.evidence.length} evidence items`,
      note: "公开资料、快照元数据和用户主动提交材料。",
      ready: true,
    },
    {
      label: "Gonka",
      value: `${requests.length} model requests`,
      note: verificationSource,
      ready: requests.length > 0,
    },
    {
      label: "Archive",
      value: archiveSeal ? compactHash(archiveSeal.archiveId, 16, 10) : "pending",
      note: archiveSeal ? archiveSeal.status : "等待生成内容哈希。",
      ready: Boolean(archiveSeal),
    },
    {
      label: "Witness",
      value: claim ? compactHash(claim.tokenId, 16, 8) : "pending",
      note: claim ? `owner ${claim.owner}` : "等待认领见证 NFT。",
      ready: Boolean(claim),
    },
    {
      label: "Payment",
      value: invoice ? invoice.amount : "pending",
      note: invoice ? invoice.invoiceId : "等待生成 Kite 账单。",
      ready: Boolean(invoice),
    },
    {
      label: "Community",
      value: `${actions.messages.length} notes`,
      note: `${actions.flowers} flowers, ${actions.candles} lights`,
      ready: true,
    },
  ];

  return `
    <section class="proof-board" aria-label="封存证据链">
      <div class="proof-board-head">
        <div>
          <span>Evidence Chain</span>
          <strong>${escapeHtml(item.name)} 的封存链路</strong>
        </div>
        <code>${escapeHtml(item.originalUrl)}</code>
      </div>
      <ol class="proof-chain">
        ${chain
          .map(
            (entry, index) => `
              <li class="${entry.ready ? "ready" : "pending"}">
                <time>${String(index + 1).padStart(2, "0")}</time>
                <div>
                  <span>${escapeHtml(entry.label)}</span>
                  <strong>${escapeHtml(entry.value)}</strong>
                  <p>${escapeHtml(entry.note)}</p>
                </div>
              </li>
            `,
          )
          .join("")}
      </ol>
    </section>
  `;
}

function renderBusinessFunnel(item) {
  const invoice = state.invoices[item.id];
  const claim = state.nftClaims[item.id];
  const archiveSeal = state.archiveSeals[item.id];
  const funnel = [
    {
      stage: "免费吊唁",
      metric: "0 USDC",
      desc: "用户进入墓碑页，献花、点灯、留言，形成社交传播入口。",
      status: "open",
    },
    {
      stage: "永久安葬",
      metric: archiveSeal ? "已封存" : "0.5 USDC",
      desc: "Agent 打包 JSON，付费上传 IPFS、Arweave 或 Irys。",
      status: archiveSeal ? "done" : "ready",
    },
    {
      stage: "守墓人",
      metric: claim ? "已认领" : "2 USDC",
      desc: "用户认领见证 NFT，获得守墓人署名和后续监测权益。",
      status: claim ? "done" : "ready",
    },
    {
      stage: "机构策展",
      metric: invoice ? invoice.amount : "B2B",
      desc: "文博机构、社区管理员或品牌方批量封存濒危数字资产。",
      status: invoice ? "done" : "ready",
    },
  ];

  return `
    <section class="business-funnel" aria-label="商业转化链路">
      <div class="proof-board-head">
        <div>
          <span>Commercial Loop</span>
          <strong>从吊唁到付费安葬</strong>
        </div>
        <code>Kite Agent Payable</code>
      </div>
      <div class="funnel-grid">
        ${funnel
          .map(
            (entry) => `
              <article class="${escapeHtml(entry.status)}">
                <span>${escapeHtml(entry.stage)}</span>
                <strong>${escapeHtml(entry.metric)}</strong>
                <p>${escapeHtml(entry.desc)}</p>
              </article>
            `,
          )
          .join("")}
      </div>
    </section>
  `;
}

function renderKiteLedgerPanel(item) {
  const ledger = kiteLedgerFor(item);
  return `
    <section class="kite-ledger" aria-label="Kite 支付账本">
      <div class="proof-board-head">
        <div>
          <span>Kite Ledger</span>
          <strong>Agent 授权额度和支付痕迹</strong>
        </div>
        <code>${escapeHtml(ledger.txHash)}</code>
      </div>
      <div class="ledger-summary">
        <div>
          <span>Allowance</span>
          <strong>${formatUsdc(ledger.allowance)}</strong>
        </div>
        <div>
          <span>Spent</span>
          <strong>${formatUsdc(ledger.spent)}</strong>
        </div>
        <div>
          <span>Remaining</span>
          <strong>${formatUsdc(ledger.remaining)}</strong>
        </div>
      </div>
      <ul class="ledger-list">
        ${ledger.entries
          .map(
            (entry) => `
              <li>
                <span>${escapeHtml(entry.label)}</span>
                <strong>${escapeHtml(entry.amount)}</strong>
                <code>${escapeHtml(entry.status)}</code>
              </li>
            `,
          )
          .join("")}
      </ul>
    </section>
  `;
}

function renderArchiveReadinessPanel(item, archiveSeal, requests) {
  const readiness = archiveReadinessFor(item, archiveSeal, requests);
  const readyCount = readiness.filter((entry) => entry.ready).length;
  return `
    <section class="readiness-panel" aria-label="档案就绪清单">
      <div class="proof-board-head">
        <div>
          <span>Archive Readiness</span>
          <strong>${readyCount}/${readiness.length} 项已就绪</strong>
        </div>
        <code>seal checklist</code>
      </div>
      <div class="readiness-grid">
        ${readiness
          .map(
            (entry) => `
              <article class="${entry.ready ? "ready" : "pending"}">
                <span>${entry.ready ? "READY" : "PENDING"}</span>
                <strong>${escapeHtml(entry.label)}</strong>
                <p>${escapeHtml(entry.value)}</p>
              </article>
            `,
          )
          .join("")}
      </div>
    </section>
  `;
}

function renderCouncilBrief(requests, verificationSource) {
  return `
    <div class="council-brief" aria-label="Gonka 专家会诊摘要">
      <div>
        <span>Consensus Mode</span>
        <strong>${escapeHtml(verificationSource)}</strong>
        <p>两个模型分别负责文化考古和事实校验，最终分数取可解释共识。</p>
      </div>
      ${requests
        .map(
          (request, index) => `
            <div>
              <span>Expert ${index + 1}</span>
              <strong>${escapeHtml(request.role)}</strong>
              <code>${escapeHtml(request.model)}</code>
              <p>${escapeHtml(compactHash(request.requestId, 18, 8))}</p>
            </div>
          `,
        )
        .join("")}
    </div>
  `;
}

function renderAgentLogPanel(item, requests, verificationSource) {
  const events = [
    {
      title: "接收遗址",
      body: `${item.originalUrl} 被送入赛博记忆公墓。`,
    },
    {
      title: "证据整理",
      body: `${item.evidence.length} 条公开证据进入核验队列。`,
    },
    ...requests.map((request) => ({
      title: `${request.role} / ${request.model}`,
      body: `${request.summary} Request ID: ${request.requestId}`,
    })),
    {
      title: "结案状态",
      body: `${verificationSource}，Truth Score ${item.truthScore}/100。`,
    },
  ];
  return `
    <div class="detail-section agent-log-panel">
      <h4>Agent 会诊日志</h4>
      <ol class="agent-log-list">
        ${events
          .map(
            (event, index) => `
              <li>
                <time>ROUND ${index + 1}</time>
                <div>
                  <strong>${escapeHtml(event.title)}</strong>
                  <span>${escapeHtml(event.body)}</span>
                </div>
              </li>
            `,
          )
          .join("")}
      </ol>
    </div>
  `;
}

function renderConsoleWorkbench(item, liveArchive, verification, requests, verificationSource) {
  const target = byId("consoleDetail");
  if (!target) return;

  const archiveCount = liveArchive?.count || item.archiveCount;
  const evidenceSource = liveArchive?.source === "wayback" ? "Wayback live" : "Local evidence";
  const statusText = state.running ? "RUNNING" : verification?.source === "gonka" ? "GONKA LIVE" : "READY";
  const rounds = steps.map((step, index) => ({
    round: `ROUND ${String(index + 1).padStart(2, "0")}`,
    title: step.title,
    desc: step.desc,
  }));

  target.innerHTML = `
    <article class="console-card">
      <div class="console-header">
        <div>
          <span class="console-kicker">Agent Investigation Console</span>
          <h3>${escapeHtml(item.name)}</h3>
        </div>
        <strong class="console-status">${escapeHtml(statusText)}</strong>
      </div>
      <div class="console-meta-grid">
        <div>
          <span>遗址 URL</span>
          <code>${escapeHtml(item.originalUrl)}</code>
        </div>
        <div>
          <span>证据来源</span>
          <code>${escapeHtml(evidenceSource)} / ${archiveCount} samples</code>
        </div>
        <div>
          <span>验证状态</span>
          <code>${escapeHtml(verificationSource)}</code>
        </div>
      </div>
      ${renderCouncilBrief(requests, verificationSource)}
      <ol class="console-event-list">
        ${rounds
          .map(
            (round) => `
              <li>
                <time>${escapeHtml(round.round)}</time>
                <div>
                  <strong>${escapeHtml(round.title)}</strong>
                  <span>${escapeHtml(round.desc)}</span>
                </div>
              </li>
            `,
          )
          .join("")}
      </ol>
      <div class="console-model-list">
        ${requests
          .map(
            (request) => `
              <div>
                <span>${escapeHtml(request.role)}</span>
                <strong>${escapeHtml(request.model)}</strong>
                <code>${escapeHtml(request.requestId)}</code>
                <p>${escapeHtml(request.summary)}</p>
              </div>
            `,
          )
          .join("")}
      </div>
    </article>
  `;
}

function renderArchiveWorkbench(item, archiveSeal) {
  const target = byId("archiveWorkbench");
  if (!target) return;

  const actions = getActions(item.id);
  const claim = state.nftClaims[item.id];
  const invoice = state.invoices[item.id];
  const provider = archiveSeal ? archiveProviderCopy[archiveSeal.provider] || archiveSeal.provider : "pending";

  target.innerHTML = `
    <div class="archive-workbench-grid">
      <article>
        <span>Community Ledger</span>
        <strong>${actions.flowers} flowers / ${actions.candles} lights</strong>
        <p>${actions.messages.length} 条纪念留言会写入永久档案。</p>
        <button class="button secondary" type="button" data-museum-tab="exhibit">
          去纪念册
        </button>
      </article>
      <article>
        <span>Witness Credential</span>
        <strong>${escapeHtml(claim?.tokenId || "未认领")}</strong>
        <p>${claim ? `owner ${escapeHtml(claim.owner)}` : "认领后生成 metadata 与 mint receipt。"}</p>
        <button class="button secondary" type="button" data-museum-tab="exhibit">
          去认领
        </button>
      </article>
      <article>
        <span>Kite Invoice</span>
        <strong>${escapeHtml(invoice?.amount || "2 USDC")}</strong>
        <p>${invoice ? escapeHtml(invoice.invoiceId) : "演示 Agent 授权额度内的守墓人套餐账单。"}</p>
        <button class="button secondary" type="button" data-action="select-plan" data-plan-id="guardian">
          生成账单
        </button>
      </article>
      <article>
        <span>Storage Receipt</span>
        <strong>${escapeHtml(provider)}</strong>
        <p>${archiveSeal ? escapeHtml(archiveSeal.archiveId) : "封存后返回内容哈希和存储 ID。"}</p>
        <button class="button primary" type="button" data-action="seal-archive">
          ${archiveSeal?.provider === "local-sealed" ? "重新上传 IPFS" : "生成档案"}
        </button>
      </article>
    </div>
    ${renderProofChainBoard(
      item,
      archiveSeal,
      state.currentMemorial?.verification?.requests || item.requests.map(normalizePresetRequest),
      state.currentMemorial?.verification?.source === "gonka"
        ? "Gonka 实时验证"
        : state.currentMemorial?.verification?.source === "mock"
          ? "Gonka mock 兜底"
          : "本地预置验证",
    )}
    ${renderArchiveReadinessPanel(
      item,
      archiveSeal,
      state.currentMemorial?.verification?.requests || item.requests.map(normalizePresetRequest),
    )}
    ${renderKiteLedgerPanel(item)}
    ${renderBusinessFunnel(item)}
  `;
}

function renderMuseumWorkbenches(item, liveArchive, verification, requests, verificationSource) {
  renderConsoleWorkbench(item, liveArchive, verification, requests, verificationSource);
  renderArchiveWorkbench(item, state.archiveSeals[item.id]);
}

function normalizePresetRequest(request) {
  if (Array.isArray(request)) {
    const [role, requestId] = request;
    return {
      role,
      model: "preset",
      requestId,
      summary: "预置演示轨迹，等待 Gonka Router 实时验证。",
    };
  }
  return {
    role: request.role,
    model: request.model || "preset",
    requestId: request.requestId,
    summary: request.summary || "预置演示轨迹，等待 Gonka Router 实时验证。",
  };
}

function sortKeys(value) {
  if (Array.isArray(value)) {
    return value.map(sortKeys);
  }
  if (value && typeof value === "object") {
    return Object.keys(value)
      .sort()
      .reduce((acc, key) => {
        acc[key] = sortKeys(value[key]);
        return acc;
      }, {});
  }
  return value;
}

function stableJson(value) {
  return JSON.stringify(sortKeys(value), null, 2);
}

function buildArchivePayload(item, liveArchive, verification) {
  const archiveCount = liveArchive?.count || item.archiveCount;
  const firstSeen = liveArchive?.firstYear || item.firstSeen;
  const lastSeen = liveArchive?.lastYear || item.lastSeen;
  const actions = getActions(item.id);
  const kiteLedger = kiteLedgerFor(item);
  if (!state.archiveSeals[item.id]) {
    kiteLedger.spent += 0.5;
    kiteLedger.remaining = Math.max(kiteLedger.allowance - kiteLedger.spent, 0);
    kiteLedger.entries[0] = {
      label: "Storage API",
      amount: "0.5 USDC",
      status: "authorized",
    };
  }
  const verificationSource =
    verification?.source === "gonka"
      ? "gonka-live"
      : verification?.source === "mock"
        ? "gonka-mock-fallback"
        : "local-preset";

  return {
    schema: "cyber-memory-cemetery/v0.1",
    contentCreatedAt: new Date().toISOString(),
    project: "赛博记忆公墓",
    case: {
      id: item.id,
      name: item.name,
      originalUrl: item.originalUrl,
      type: item.type,
      status: item.status,
      lifespan: item.lifespan,
      tags: item.tags || [],
      summary: item.summary,
      epitaph: item.epitaph,
      timeline: item.timeline || [],
      evidence: item.evidence || [],
      verifiableFacts: item.verifiableFacts || [],
      uncertainClaims: item.uncertainClaims || [],
      sourceLinks: item.sourceLinks || [],
      relics: item.relics || defaultRelics,
      privacyBoundary: item.privacyBoundary || "public metadata only",
    },
    community: {
      ...CemeteryCore.archiveCommunitySummary(actions),
    },
    memorialDesign: {
      template: "digital-pompeii-dark-museum",
      palette: "obsidian-amber",
      elements: [
        "epitaph",
        "truth_score",
        "evidence_chain",
        "relic_inventory",
        "guestbook",
        "witness_credential",
      ],
      tombstoneImage: item.image,
    },
    nftClaim: state.nftClaims[item.id] || null,
    invoice: state.invoices[item.id] || null,
    monetization: {
      model: "free memorial visit + paid permanent burial + paid guardian claim",
      kiteAgentPassport: {
        ownerAllowance: "3 USDC demo allowance",
        paymentRoute: "Kite Agent Passport demo allowance",
        ledger: kiteLedger,
      },
      plans: burialPlans,
    },
    archiveProbe: {
      source: liveArchive?.source || "local-demo",
      count: archiveCount,
      firstSeen,
      lastSeen,
    },
    verification: {
      source: verificationSource,
      verificationState: verification?.verificationState || "demo_fallback",
      truthScore: verification?.truthScore || item.truthScore,
      requests: verification?.requests || item.requests.map(normalizePresetRequest),
      notes: verification?.notes || [],
    },
    storage: {
      provider: "pending",
      status: "ready-to-upload",
    },
  };
}

function renderArchivePanel(item, archiveSeal) {
  const providerLabel =
    archiveSeal ? archiveProviderCopy[archiveSeal.provider] || archiveSeal.provider : "待封存";
  return `
    <div class="detail-section archive-panel">
      <h4>永久档案封存</h4>
      <p class="text-note">
        点击后由服务端生成可下载档案、内容哈希和存储 ID。配置 Pinata JWT 后会真实上传 IPFS。
      </p>
      <div class="archive-actions">
        <button class="button primary" type="button" data-action="seal-archive">
          ${archiveSeal?.provider === "local-sealed" ? "重新上传 IPFS" : "生成永久档案"}
        </button>
        ${
          archiveSeal
            ? `<button class="button secondary" type="button" data-action="download-archive">下载 JSON</button>`
            : ""
        }
      </div>
      ${
        archiveSeal
          ? `
            <ul class="request-list archive-list">
              <li>
                <strong>provider</strong>
                <code>${escapeHtml(providerLabel)} / ${escapeHtml(archiveSeal.status || "sealed")}</code>
              </li>
              <li>
                <strong>content_hash</strong>
                <code>${escapeHtml(archiveSeal.contentHash)}</code>
              </li>
              <li>
                <strong>archive_id</strong>
                <code>${escapeHtml(archiveSeal.archiveId)}</code>
              </li>
              ${
                archiveSeal.gatewayUrl
                  ? `
                    <li>
                      <strong>gateway_url</strong>
                      <code>${escapeHtml(archiveSeal.gatewayUrl)}</code>
                    </li>
                  `
                  : ""
              }
              <li>
                <strong>filename</strong>
                <code>${escapeHtml(archiveSeal.filename)}</code>
              </li>
            </ul>
            ${renderListSection("封存备注", archiveSeal.notes, "risk-list")}
          `
          : ""
      }
    </div>
  `;
}

function renderOptions() {
  const select = byId("caseSelect");
  select.innerHTML = cases
    .map((item) => `<option value="${item.id}">${item.name}</option>`)
    .join("");
  select.value = state.selectedId;
  select.addEventListener("change", () => {
    selectCase(select.value, true);
  });
}

function renderSteps(activeIndex = -1, doneCount = 0) {
  const list = byId("stepList");
  list.innerHTML = steps
    .map((step, index) => {
      const status = index === activeIndex ? "active" : index < doneCount ? "done" : "";
      return `
        <li class="step-item ${status}">
          <span class="step-index">${index + 1}</span>
          <span class="step-copy">
            <strong>${step.title}</strong>
            <span>${step.desc}</span>
          </span>
        </li>
      `;
    })
    .join("");
}

function renderMemorial(item, liveArchive, verification) {
  const detail = byId("memorialDetail");
  state.currentMemorial = { item, liveArchive, verification };
  const archiveCount = liveArchive?.count || item.archiveCount;
  const firstSeen = liveArchive?.firstYear || item.firstSeen;
  const lastSeen = liveArchive?.lastYear || item.lastSeen;
  const archiveNote = liveArchive?.source === "wayback" ? "Wayback 实时查询" : "本地演示档案";
  const truthScore = verification?.truthScore || item.truthScore;
  const requests = verification?.requests || item.requests.map(normalizePresetRequest);
  const verificationSource =
    verification?.source === "gonka"
      ? "Gonka 实时验证"
      : verification?.source === "mock"
        ? "Gonka mock 兜底"
        : "本地预置验证";
  const archiveSeal = state.archiveSeals[item.id];

  detail.style.setProperty("--tomb-image", `url("${item.image}")`);
  detail.innerHTML = `
    <div class="tombstone">
      <span class="lifespan">${firstSeen}-${lastSeen}</span>
      <h3>${item.name}</h3>
      <div class="case-meta">
        ${createTag(item.type)}
        ${createTag(item.status)}
      </div>
    </div>
    <div class="detail-pane">
      <div class="detail-topline">
        ${createTag(archiveNote)}
        ${createTag(verificationSource)}
        ${createTag(`可信度：${item.certainty}`)}
        ${createTag(item.originalUrl)}
      </div>
      <blockquote class="epitaph">${item.epitaph}</blockquote>
      <div class="truth-score">
        <div>
          <strong>${truthScore}</strong>
          <span>Truth Score</span>
        </div>
        <div>
          <strong>${archiveCount}</strong>
          <span>快照取样</span>
        </div>
        <div>
          <strong>${requests.length}</strong>
          <span>模型共识</span>
        </div>
      </div>
      ${renderRelicPanel(item)}
      ${renderTombstoneCraftPanel(item, archiveSeal)}
      ${renderMemorialActionsPanel(item)}
      ${renderNftPanel(item)}
      ${renderCommercePanel(item)}
      ${renderTimeline(item.timeline)}
      <div class="detail-section">
        <h4>证据链</h4>
        <ul class="evidence-list">
          ${item.evidence.map(renderEvidenceItem).join("")}
        </ul>
      </div>
      ${renderListSection("可验证事实", item.verifiableFacts)}
      ${renderListSection("需要谨慎标注的不确定项", item.uncertainClaims, "risk-list")}
      ${renderTextSection("隐私边界", item.privacyBoundary)}
      ${renderTextSection("Demo 讲法", item.demoAngle)}
      <div class="detail-section">
        <h4>Gonka 推理轨迹</h4>
        <ul class="request-list">
          ${requests
            .map(
              (request) => `
                <li>
                  <strong>${escapeHtml(request.role)} / ${escapeHtml(request.model)}</strong>
                  <span>${escapeHtml(request.summary)}</span>
                  <code>${escapeHtml(request.requestId)}</code>
                </li>
              `,
            )
            .join("")}
        </ul>
      </div>
      ${renderListSection("验证备注", verification?.notes, "risk-list")}
      ${renderAgentLogPanel(item, requests, verificationSource)}
      ${renderArchivePanel(item, archiveSeal)}
      <div class="detail-section">
        <h4>永久档案 JSON</h4>
        <ul class="request-list">
          <li>
            <strong>archive_payload</strong>
            <code>${escapeHtml(
              archiveSeal
                ? archiveSeal.previewJson
                : JSON.stringify({
                    id: item.id,
                    url: item.originalUrl,
                    truthScore,
                    archiveCount,
                    firstSeen,
                    lastSeen,
                    verification: verificationSource,
                    privacyBoundary: item.privacyBoundary || "public metadata only",
                    storage: "pending",
                  }),
            )}</code>
          </li>
        </ul>
      </div>
      ${renderSourceLinks(item.sourceLinks)}
    </div>
  `;
  renderMuseumWorkbenches(item, liveArchive, verification, requests, verificationSource);
}

async function sealCurrentArchive() {
  const current = state.currentMemorial;
  if (!current) return;

  const { item, liveArchive, verification } = current;
  setAgentState("封存中");
  const basePayload =
    state.archivePayloads[item.id] || buildArchivePayload(item, liveArchive, verification);
  state.archivePayloads[item.id] = basePayload;

  try {
    const response = await fetch("/api/archive/seal", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        payload: basePayload,
      }),
    });
    const seal = await response.json();
    if (!response.ok) {
      throw new Error(seal.message || seal.error || "Archive seal failed");
    }
    state.archiveSeals[item.id] = seal;
  } catch (error) {
    state.archiveSeals[item.id] = await CemeteryCore.createLocalArchiveSeal(basePayload, {
      cryptoProvider: globalThis.crypto,
      sealedAt: new Date().toISOString(),
      errorMessage: error.message,
    });
  }

  renderMemorial(item, liveArchive, verification);
  const archiveSeal = state.archiveSeals[item.id];
  const stateText = archiveSeal.provider === "pinata-ipfs" ? "已上传：IPFS" : "已封存：本地档案";
  setAgentState(stateText);
}

function downloadCurrentArchive() {
  const current = state.currentMemorial;
  if (!current) return;
  const archiveSeal = state.archiveSeals[current.item.id];
  if (!archiveSeal) return;

  const blob = new Blob([archiveSeal.json], { type: "application/json;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = archiveSeal.filename;
  document.body.append(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(url);
  setAgentState("已下载：档案 JSON");
}

function refreshCurrentMemorial() {
  const current = state.currentMemorial;
  if (!current) return;
  renderMemorial(current.item, current.liveArchive, current.verification);
}

function invalidateArchive(caseId) {
  delete state.archiveSeals[caseId];
  delete state.archivePayloads[caseId];
}

function addFlower() {
  const current = state.currentMemorial;
  if (!current) return;
  getActions(current.item.id).flowers += 1;
  invalidateArchive(current.item.id);
  refreshCurrentMemorial();
  setAgentState("已献花");
}

function lightCandle() {
  const current = state.currentMemorial;
  if (!current) return;
  getActions(current.item.id).candles += 1;
  invalidateArchive(current.item.id);
  refreshCurrentMemorial();
  setAgentState("已点灯");
}

function submitGuestbook(form) {
  const current = state.currentMemorial;
  if (!current) return;
  const data = new FormData(form);
  const name = String(data.get("guestName") || "anonymous_witness").trim();
  const text = String(data.get("guestMessage") || "").trim();
  if (!text) return;

  getActions(current.item.id).messages.push({
    name: name || "anonymous_witness",
    text,
    time: displayDate(),
  });
  invalidateArchive(current.item.id);
  refreshCurrentMemorial();
  setAgentState("纪念册已更新");
}

async function claimWitnessNft() {
  const current = state.currentMemorial;
  if (!current) return;
  const ownerInput = byId("claimOwner");
  const owner = ownerInput?.value?.trim() || "anonymous_witness";
  const createdAt = new Date().toISOString();
  const metadata = buildNftMetadata(current.item, owner);
  const tokenSeed = stableJson({ caseId: current.item.id, owner, createdAt, metadata });
  const tokenHash = await CemeteryCore.sha256Hex(tokenSeed, globalThis.crypto);
  const tokenId = `cmc-${current.item.id}-${tokenHash.slice(0, 12)}`;
  state.nftClaims[current.item.id] = {
    tokenId,
    owner,
    receiptId: receiptId("mint", current.item.id, tokenHash),
    contract: "0xCemeteryWitnessDemo000000000000000000000000",
    standard: "ERC-721 demo metadata",
    createdAt,
    metadata,
    metadataJson: stableJson(metadata),
  };
  invalidateArchive(current.item.id);
  refreshCurrentMemorial();
  setAgentState("已认领：见证 NFT");
}

function downloadNftMetadata() {
  const current = state.currentMemorial;
  if (!current) return;
  const claim = state.nftClaims[current.item.id];
  if (!claim) return;

  const blob = new Blob([claim.metadataJson], { type: "application/json;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = `${claim.tokenId}.metadata.json`;
  document.body.append(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(url);
  setAgentState("已下载：NFT metadata");
}

function selectBurialPlan(planId) {
  const current = state.currentMemorial;
  if (!current) return;
  const plan = burialPlans.find((entry) => entry.id === planId) || burialPlans[0];
  state.invoices[current.item.id] = {
    invoiceId: receiptId("kite_invoice", current.item.id, plan.id),
    planId: plan.id,
    planName: plan.name,
    amount: plan.price,
    paymentRoute: "Kite Agent Passport demo allowance",
    status: "pending-demo",
    createdAt: new Date().toISOString(),
  };
  invalidateArchive(current.item.id);
  refreshCurrentMemorial();
  setAgentState("已生成：安葬账单");
}

function selectCase(id, updateInput = true) {
  const item = cases.find((entry) => entry.id === id) || cases[0];
  state.selectedId = item.id;
  byId("caseSelect").value = item.id;
  if (updateInput) {
    byId("urlInput").value = item.originalUrl;
  }
  renderMemorial(item);
  updateCaseSelection();
}

function setAgentState(text) {
  byId("agentState").textContent = text;
}

function enterApp(targetId = "top") {
  document.body.classList.remove("pre-entry");
  activateMuseumTab(targetId === "lab" ? "console" : "exhibit");
  const target = byId(targetId);
  if (target) {
    window.requestAnimationFrame(() => {
      target.scrollIntoView({ behavior: "smooth", block: "start" });
    });
  }
}

function delay(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function lookupWayback(url) {
  const normalized = url.trim();
  if (!normalized || !normalized.includes(".")) return null;

  const endpoint = new URL("https://web.archive.org/cdx");
  endpoint.searchParams.set("url", normalized);
  endpoint.searchParams.set("output", "json");
  endpoint.searchParams.set("fl", "timestamp,statuscode");
  endpoint.searchParams.set("filter", "statuscode:200");
  endpoint.searchParams.set("collapse", "digest");
  endpoint.searchParams.set("limit", "80");

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 2600);

  try {
    const response = await fetch(endpoint.toString(), {
      mode: "cors",
      signal: controller.signal,
    });
    if (!response.ok) return null;
    const rows = await response.json();
    const entries = rows.slice(1).filter((row) => row[0]);
    if (!entries.length) return null;
    const years = entries.map((row) => row[0].slice(0, 4)).filter(Boolean);
    return {
      source: "wayback",
      count: entries.length,
      firstYear: years[0],
      lastYear: years[years.length - 1],
    };
  } catch (error) {
    return null;
  } finally {
    clearTimeout(timeout);
  }
}

async function loadEvidencePackage(caseId) {
  if (evidencePackages.has(caseId)) return evidencePackages.get(caseId);
  if (caseId !== "xiami") return null;
  const response = await fetch("./data/xiami-evidence.json");
  if (!response.ok) throw new Error(`Evidence HTTP ${response.status}`);
  const payload = await response.json();
  evidencePackages.set(caseId, payload);
  return payload;
}

async function verifyWithGonka(item, liveArchive) {
  try {
    const response = await fetch("/api/gonka/verify", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        case: item,
        archive: liveArchive,
        evidencePackage: await loadEvidencePackage(item.id),
      }),
    });
    const data = await response.json();
    if (!response.ok) {
      return data.fallback || null;
    }
    return data;
  } catch (error) {
    return null;
  }
}

async function runAnalysis(event) {
  event.preventDefault();
  if (state.running) return;

  state.running = true;
  const item = cases.find((entry) => entry.id === byId("caseSelect").value) || cases[0];
  const inputUrl = byId("urlInput").value;
  invalidateArchive(item.id);
  setAgentState("运行中");

  let liveArchive = null;
  let verification = null;
  for (let index = 0; index < steps.length; index += 1) {
    renderSteps(index, index);
    if (index === 0) {
      liveArchive = await lookupWayback(inputUrl);
    } else if (index === 2) {
      verification = await verifyWithGonka(item, liveArchive);
    } else {
      await delay(520);
    }
  }

  renderSteps(-1, steps.length);
  activateMuseumTab("exhibit");
  renderMemorial(item, liveArchive, verification);
  const source = verification?.source === "gonka" ? "Gonka 实时验证" : "mock 兜底";
  setAgentState(`已完成：${source}`);
  state.running = false;
  byId("memorial").scrollIntoView({ behavior: "smooth", block: "start" });
}

function init() {
  renderCases();
  renderOptions();
  renderSteps();
  selectCase("xiami");
  byId("analysisForm").addEventListener("submit", runAnalysis);
  document.querySelectorAll("[data-entry-action]").forEach((button) => {
    button.addEventListener("click", () => {
      const action = button.getAttribute("data-entry-action");
      enterApp(action === "lab" ? "lab" : "top");
    });
  });
  document.addEventListener("click", async (event) => {
    const tabButton = event.target.closest("[data-museum-tab]");
    if (tabButton) {
      event.preventDefault();
      const tabId = tabButton.getAttribute("data-museum-tab");
      activateMuseumTab(tabId);
      const targetId = tabId === "console" ? "lab" : tabId === "archive" ? "roadmap" : "memorial";
      byId(targetId)?.scrollIntoView({ behavior: "smooth", block: "start" });
      return;
    }

    const actionButton = event.target.closest("[data-action]");
    if (!actionButton) return;

    const action = actionButton.getAttribute("data-action");
    if (action === "offer-flower") {
      addFlower();
    }
    if (action === "light-candle") {
      lightCandle();
    }
    if (action === "claim-nft") {
      await claimWitnessNft();
    }
    if (action === "download-nft") {
      downloadNftMetadata();
    }
    if (action === "select-plan") {
      selectBurialPlan(actionButton.getAttribute("data-plan-id"));
    }
    if (action === "seal-archive") {
      await sealCurrentArchive();
    }
    if (action === "download-archive") {
      downloadCurrentArchive();
    }
  });
  document.addEventListener("submit", (event) => {
    const form = event.target.closest("[data-action='guestbook-submit']");
    if (!form) return;
    event.preventDefault();
    submitGuestbook(form);
  });
}

document.addEventListener("DOMContentLoaded", init);
