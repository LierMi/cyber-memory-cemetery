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
    title: "打包封存档案",
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

const evidencePackages = new Map();
const evidencePackagePromises = new Map();

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
      ["digital_archaeologist", "mock_preset_renren_archaeologist"],
      ["truth_verifier", "mock_preset_renren_verifier"],
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
        model: "preset",
        requestId: "mock_preset_xiami_archaeologist",
        truthScore: null,
        summary: "预置演示轨迹，等待 Gonka Router 实时验证。",
        fallback: true,
      },
      {
        role: "truth_verifier",
        model: "preset",
        requestId: "mock_preset_xiami_verifier",
        truthScore: null,
        summary: "预置演示轨迹，等待 Gonka Router 实时验证。",
        fallback: true,
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
      ["digital_archaeologist", "mock_preset_blog163_archaeologist"],
      ["truth_verifier", "mock_preset_blog163_verifier"],
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
      ["digital_archaeologist", "mock_preset_tianya_archaeologist"],
      ["truth_verifier", "mock_preset_tianya_verifier"],
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
      ["digital_archaeologist", "mock_preset_mop_archaeologist"],
      ["truth_verifier", "mock_preset_mop_verifier"],
    ],
  },
];

const state = {
  selectedId: "xiami",
  running: false,
  demo: { step: 0, status: "idle" },
  demoResults: {},
  demoOperations: {},
  currentMemorial: null,
  archiveSeals: {},
  archivePayloads: {},
  memorialActions: {},
  credentials: {},
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

function displayDate() {
  return new Date().toISOString().slice(0, 10);
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
      if (!selectCase(id)) return;
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
    const isActive = button.getAttribute("data-museum-tab") === nextTab;
    button.classList.toggle("active", isActive);
    if (button.getAttribute("role") === "tab") {
      button.setAttribute("aria-selected", String(isActive));
      button.setAttribute("tabindex", isActive ? "0" : "-1");
    }
  });
  document.querySelectorAll("[data-tab-panel]").forEach((panel) => {
    const isActive = panel.getAttribute("data-tab-panel") === nextTab;
    panel.hidden = !isActive;
    panel.classList.toggle("active", isActive);
  });
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

function asStringList(value) {
  if (typeof value === "string") return value ? [value] : [];
  return Array.isArray(value) ? value.filter((item) => typeof item === "string" && item) : [];
}

function renderModelNotes(label, items) {
  const notes = asStringList(items);
  return `
    <div class="model-notes">
      <span>${escapeHtml(label)}</span>
      ${notes.length ? `<ul>${notes.map((note) => `<li>${escapeHtml(note)}</li>`).join("")}</ul>` : "<p>无</p>"}
    </div>
  `;
}

function renderModelCouncil(requests = []) {
  return `
    <section class="model-council" aria-label="Gonka 模型会诊">
      <div class="model-council-grid">
        ${requests
          .map((request) => {
            const errors = [
              ...asStringList(request.errors),
              ...asStringList(request.error),
              ...asStringList(request.riskFlags),
            ];
            return `
              <article class="model-card ${request.fallback ? "fallback" : ""}">
                <div class="model-card-head">
                  <div>
                    <span>${escapeHtml(request.role || "unknown_role")}</span>
                    <strong>${escapeHtml(request.model || "unknown_model")}</strong>
                  </div>
                  <b>${escapeHtml(request.truthScore ?? "不可计算")}</b>
                </div>
                <p>${escapeHtml(request.summary || "模型未返回摘要。")}</p>
                <code class="request-id">Request ID: ${escapeHtml(request.requestId || "不可用")}</code>
                ${renderModelNotes("已核事实", request.verifiedFacts)}
                ${renderModelNotes("不确定项", request.uncertainClaims)}
                ${renderModelNotes("错误与风险", errors)}
              </article>
            `;
          })
          .join("")}
      </div>
    </section>
  `;
}

function renderVerificationState(verification) {
  const presentation = CemeteryCore.verificationPresentation(verification);
  return `
    <section class="verification-state ${presentation.tone}" aria-label="验证状态">
      <span>Verification State</span>
      <strong>${escapeHtml(presentation.label)}</strong>
      <p>${presentation.verified ? "Gonka 请求已形成可审计验证结果。" : "当前结果不具备实时共识证明。"}</p>
    </section>
  `;
}

function renderConsensusMeter(verification) {
  const presentation = CemeteryCore.verificationPresentation(verification);
  const confidence = CemeteryCore.finiteNumberOr(verification?.consensusConfidence, 0);
  return `<section class="consensus-meter ${presentation.tone}">
    <span>${escapeHtml(presentation.label)}</span>
    <strong>${confidence}% 共识置信度</strong>
    <div class="consensus-track"><i style="width:${confidence}%"></i></div>
    <p>模型评分差 ${escapeHtml(verification?.scoreSpread ?? "不可计算")} 分</p>
  </section>`;
}

function publicEvidenceClaims(item) {
  const packaged = evidencePackages.get(item.id)?.claims;
  if (Array.isArray(packaged) && packaged.length) {
    return packaged.filter((claim) => claim.publicArchiveAllowed !== false);
  }
  return (item.evidence || []).map((evidence, index) => ({
    id: `${item.id}-evidence-${index + 1}`,
    claim: Array.isArray(evidence) ? evidence[1] : evidence.desc,
    sourceTitle: Array.isArray(evidence) ? evidence[0] : evidence.title,
    sourceDate: "未注明",
    sourceUrl: Array.isArray(evidence) ? evidence[2] : evidence.url,
    confidence: "context",
  }));
}

function evidenceConfidenceLabel(confidence) {
  const labels = {
    primary: "一级来源",
    secondary: "二级来源",
    context: "背景证据",
  };
  return labels[confidence] || labels.context;
}

function renderEvidenceConfidence(item) {
  const claims = publicEvidenceClaims(item);
  return `
    <div class="detail-section evidence-confidence">
      <h4>公开证据置信度</h4>
      <div class="evidence-confidence-grid">
        ${claims
          .map(
            (claim) => `
              <article class="evidence-claim ${escapeHtml(claim.confidence || "context")}">
                <span>${escapeHtml(evidenceConfidenceLabel(claim.confidence))}</span>
                <strong>${escapeHtml(claim.claim)}</strong>
                <dl>
                  <div><dt>来源</dt><dd>${escapeHtml(claim.sourceTitle)}</dd></div>
                  <div><dt>日期</dt><dd>${escapeHtml(claim.sourceDate || "未注明")}</dd></div>
                </dl>
                ${
                  claim.sourceUrl
                    ? `<a href="${escapeHtml(claim.sourceUrl)}" target="_blank" rel="noreferrer">查看外部来源</a>`
                    : `<span class="source-unavailable">来源链接未提供</span>`
                }
              </article>
            `,
          )
          .join("")}
      </div>
    </div>
  `;
}

function renderCredentialPanel(item, archiveSeal) {
  const credential = state.credentials[item.id];
  const hasReceipt = CemeteryCore.isStructurallyValidArchiveReceipt(archiveSeal);
  const claimCompatible =
    archiveSeal?.sealEligibility === "verified" &&
    (archiveSeal?.verificationState === "live_consensus" ||
      archiveSeal?.verificationState === "cached_live");
  const disabled = hasReceipt ? "" : "disabled";
  return `
    <div class="detail-section credential-panel">
      <h4>纪念凭证</h4>
      <div class="credential-layout">
        <div class="credential-preview" aria-label="纪念凭证预览">
          <span>${escapeHtml(item.firstSeen)}-${escapeHtml(item.lastSeen)}</span>
          <strong>${escapeHtml(item.name)}</strong>
          <em>MEMORIAL CREDENTIAL</em>
          <code>${escapeHtml(credential?.id || "等待封存回执")}</code>
        </div>
        <div class="credential-copy">
          <p class="text-note">
            ${
              !hasReceipt
                ? "先完成封存，系统才能依据回执生成纪念凭证。"
                : claimCompatible
                  ? "凭证绑定已验证档案，可保留未来认领兼容性；当前没有发生链上铸造。"
                  : "当前凭证是草稿纪念文件，不具备链上认领资格。"
            }
          </p>
          <div class="archive-actions">
            <button class="button primary" type="button" data-action="generate-credential" ${disabled}>
              生成纪念凭证
            </button>
            ${
              credential
                ? `<button class="button secondary" type="button" data-action="download-credential">下载纪念凭证</button>
                   <button class="button secondary" type="button" data-action="download-credential-metadata">下载 metadata</button>`
                : ""
            }
          </div>
        </div>
      </div>
      ${
        credential
          ? `
            <dl class="credential-artifacts">
              <div><dt>Credential ID</dt><dd>${escapeHtml(credential.id)}</dd></div>
              <div><dt>Archive Hash</dt><dd>${escapeHtml(credential.contentHash)}</dd></div>
              <div><dt>Verification State</dt><dd>${escapeHtml(credential.verificationState)}</dd></div>
              <div><dt>Claim Status</dt><dd>${
                credential.status === "future_claim_compatible" ? "未来认领兼容" : "草稿，不具备认领资格"
              }</dd></div>
            </dl>
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


function archiveReadinessFor(item, archiveSeal, requests) {
  const evidenceCount = publicEvidenceClaims(item).length;
  const credential = state.credentials[item.id];
  const permanent = CemeteryCore.isPermanentArchiveReceipt(archiveSeal);
  const liveConsensus = CemeteryCore.hasLiveModelConsensus(requests);
  const values = {
    公开证据: `${evidenceCount} 条公开摘要`,
    模型会诊: liveConsensus ? `${requests.length} 个真实且唯一的 Request ID` : "未达成实时双模型共识",
    永久封存: permanent ? archiveSeal.archiveId : archiveSeal ? "本地封存，待上传 IPFS" : "待上传 IPFS",
    纪念凭证: credential ? credential.id : "待生成",
  };
  return CemeteryCore.archiveReadiness({
    evidenceCount,
    requests,
    archiveSeal,
    credential,
  }).map((entry) => ({ ...entry, value: values[entry.label] }));
}

function renderTombstoneCraftPanel(item, archiveSeal) {
  const actions = getActions(item.id);
  const credential = state.credentials[item.id];
  const sealText = archiveSeal ? compactHash(archiveSeal.contentHash, 16, 10) : "等待封存";
  const credentialText = credential ? compactHash(credential.id, 16, 8) : "待生成";
  const ipfsText = archiveSeal?.provider === "pinata-ipfs" ? archiveSeal.status : "待上传";
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
      label: "纪念凭证",
      value: credentialText,
      note: CemeteryCore.credentialStatusCopy(credential),
    },
    {
      label: "纪念热度",
      value: `${actions.flowers} 花 / ${actions.candles} 灯`,
      note: "永久档案只记录聚合数量，不上传署名和留言正文。",
    },
    {
      label: "IPFS 状态",
      value: ipfsText,
      note: "配置存储服务后返回 CID，本地回退会明确标注。",
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
  const credential = state.credentials[item.id];
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
      ready: CemeteryCore.hasLiveModelConsensus(requests),
    },
    {
      label: "Archive",
      value: archiveSeal ? compactHash(archiveSeal.archiveId, 16, 10) : "pending",
      note: archiveSeal ? archiveSeal.status : "等待生成内容哈希。",
      ready: CemeteryCore.isStructurallyValidArchiveReceipt(archiveSeal),
    },
    {
      label: "Witness",
      value: credential ? compactHash(credential.id, 16, 8) : "pending",
      note: CemeteryCore.credentialStatusCopy(credential),
      ready: Boolean(credential),
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
  const statusText = state.running ? "RUNNING" : CemeteryCore.verificationResultCopy(verification);
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
      <div class="verification-summary-grid" data-verification-state>
        ${renderVerificationState(verification)}
        ${renderConsensusMeter(verification)}
      </div>
      ${renderModelCouncil(requests)}
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
    </article>
  `;
}

function renderArchiveWorkbench(item, archiveSeal) {
  const target = byId("archiveWorkbench");
  if (!target) return;

  const actions = getActions(item.id);
  const credential = state.credentials[item.id];
  const evidenceCount = publicEvidenceClaims(item).length;
  const provider = archiveSeal ? archiveProviderCopy[archiveSeal.provider] || archiveSeal.provider : "pending";

  target.innerHTML = `
    <div class="archive-workbench-grid">
      <article>
        <span>Evidence Confidence</span>
        <strong>${evidenceCount} 条公开证据</strong>
        <p>只封存事实摘要、来源标题、日期和外部链接。</p>
        <button class="button secondary" type="button" data-museum-tab="exhibit">查看证据</button>
      </article>
      <article>
        <span>Memorial Credential</span>
        <strong>${escapeHtml(credential?.id || "待生成")}</strong>
        <p>${escapeHtml(CemeteryCore.credentialStatusCopy(credential))}</p>
        <button class="button secondary" type="button" data-action="generate-credential" ${CemeteryCore.isStructurallyValidArchiveReceipt(archiveSeal) ? "" : "disabled"}>
          生成凭证
        </button>
      </article>
      <article>
        <span>Community Summary</span>
        <strong>${actions.flowers} flowers / ${actions.candles} lights</strong>
        <p>永久档案仅记录献花、点灯和留言数量。留言内容仅保留在本地，不会上传。署名同样不会进入永久档案。</p>
        <button class="button secondary" type="button" data-museum-tab="exhibit">去纪念册</button>
      </article>
      <article>
        <span>IPFS 状态</span>
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
      CemeteryCore.verificationResultCopy(state.currentMemorial?.verification),
    )}
    ${renderArchiveReadinessPanel(
      item,
      archiveSeal,
      state.currentMemorial?.verification?.requests || item.requests.map(normalizePresetRequest),
    )}
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
      truthScore: null,
      summary: "预置演示轨迹，等待 Gonka Router 实时验证。",
      verifiedFacts: [],
      uncertainClaims: [],
      riskFlags: [],
      fallback: true,
    };
  }
  return {
    role: request.role,
    model: request.model || "preset",
    requestId: request.requestId,
    truthScore: request.truthScore ?? null,
    summary: request.summary || "预置演示轨迹，等待 Gonka Router 实时验证。",
    verifiedFacts: request.verifiedFacts || [],
    uncertainClaims: request.uncertainClaims || [],
    riskFlags: request.riskFlags || [],
    fallback: Boolean(request.fallback),
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
  const verificationSourceByState = {
    live_consensus: "gonka-live-consensus",
    cached_live: "gonka-cache",
    partial: "gonka-partial",
    mock_fallback: "gonka-mock-fallback",
    demo_fallback: "local-demo-fallback",
  };
  const verificationSource =
    verificationSourceByState[verification?.verificationState] || "unverified-result";

  const presetVerification = {
    source: verificationSource,
    caseId: item.id,
    verifiedAt: new Date().toISOString(),
    verificationState: verification?.verificationState || "demo_fallback",
    truthScore: CemeteryCore.finiteNumberOr(verification?.truthScore, item.truthScore),
    scoreSpread: verification?.scoreSpread ?? null,
    consensusConfidence: CemeteryCore.finiteNumberOr(verification?.consensusConfidence, 0),
    sealEligibility: verification?.sealEligibility || "draft",
    cacheStatus: verification?.cacheStatus || "not_cached_local_preset",
    requests: verification?.requests || item.requests.map(normalizePresetRequest),
    notes: verification?.notes || [],
  };
  const evidencePackage = verification?.evidencePackage || evidencePackages.get(item.id) || null;

  return {
    schema: "cyber-memory-cemetery/v0.2",
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
    archiveProbe: {
      source: liveArchive?.source || "local-demo",
      count: archiveCount,
      firstSeen,
      lastSeen,
    },
    evidencePackage,
    evidenceDigest: verification?.evidenceDigest || null,
    verification: verification?.verificationRecord || presetVerification,
    storage: {
      provider: "pending",
      status: "ready-to-upload",
    },
  };
}

function renderArchivePanel(item, archiveSeal) {
  const providerLabel =
    archiveSeal ? archiveProviderCopy[archiveSeal.provider] || archiveSeal.provider : "待封存";
  const permanent = CemeteryCore.isPermanentArchiveReceipt(archiveSeal);
  const heading = permanent ? "永久档案封存" : archiveSeal ? "本地封存" : "档案封存";
  const note = permanent
    ? "档案已上传 IPFS 并获得 CID，可下载封存回执。"
    : archiveSeal
      ? "已生成本地可下载档案和内容哈希，不具备永久存储证明。"
      : "点击后由服务端生成可下载档案和内容哈希。配置 Pinata JWT 后会上传 IPFS。";
  return `
    <div class="detail-section archive-panel" data-archive-status>
      <h4>${heading}</h4>
      <p class="text-note">
        ${note}
      </p>
      <div class="archive-actions">
        <button class="button primary" type="button" data-action="seal-archive">
          ${archiveSeal?.provider === "local-sealed" ? "重新上传 IPFS" : permanent ? "重新封存" : "封存档案"}
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
    if (!selectCase(select.value, true)) {
      select.value = state.selectedId;
    }
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
  const truthScore = CemeteryCore.finiteNumberOr(verification?.truthScore, item.truthScore);
  const requests = verification?.requests || item.requests.map(normalizePresetRequest);
  const verificationSource =
    CemeteryCore.verificationResultCopy(verification);
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
          <strong>${CemeteryCore.hasLiveModelConsensus(requests) ? "2" : "0"}</strong>
          <span>实时模型共识</span>
        </div>
      </div>
      <div class="verification-summary-grid">
        ${renderVerificationState(verification)}
        ${renderConsensusMeter(verification)}
      </div>
      ${renderModelCouncil(requests)}
      ${renderEvidenceConfidence(item)}
      ${renderRelicPanel(item)}
      ${renderTombstoneCraftPanel(item, archiveSeal)}
      ${renderMemorialActionsPanel(item)}
      ${renderCredentialPanel(item, archiveSeal)}
      ${renderTimeline(item.timeline)}
      ${renderListSection("可验证事实", item.verifiableFacts)}
      ${renderListSection("需要谨慎标注的不确定项", item.uncertainClaims, "risk-list")}
      ${renderTextSection("隐私边界", item.privacyBoundary)}
      ${renderTextSection("Demo 讲法", item.demoAngle)}
      ${renderListSection("验证备注", verification?.notes, "risk-list")}
      ${renderAgentLogPanel(item, requests, verificationSource)}
      ${renderArchivePanel(item, archiveSeal)}
      <div class="detail-section">
        <h4>${CemeteryCore.isPermanentArchiveReceipt(archiveSeal) ? "永久档案" : archiveSeal ? "本地封存" : "待封存档案"} JSON</h4>
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
  renderInteractionLocks();
}

function setDemoInteractionLock(element, locked) {
  if (locked) {
    if (!element.hasAttribute("data-demo-lock-disabled")) {
      element.dataset.demoLockDisabled = element.disabled ? "true" : "false";
    }
    element.disabled = true;
    return;
  }

  if (element.hasAttribute("data-demo-lock-disabled")) {
    element.disabled = element.dataset.demoLockDisabled === "true";
    delete element.dataset.demoLockDisabled;
  }
}

function isDemoMutationLocked() {
  return Boolean(
    state.running ||
      (state.demo.status === "failed" && state.demoOperations[state.demo.step]),
  );
}

function renderInteractionLocks() {
  const locked = isDemoMutationLocked();
  const controls = document.querySelectorAll([
    "#caseSelect",
    "#urlInput",
    "#analysisForm button[type='submit']",
    "[data-action='seal-archive']",
    "[data-action='generate-credential']",
    "[data-action='offer-flower']",
    "[data-action='light-candle']",
    "[data-action='guestbook-submit'] button",
    "[data-action='guestbook-submit'] input",
    "[data-action='guestbook-submit'] textarea",
  ].join(", "));

  controls.forEach((control) => setDemoInteractionLock(control, locked));
  document.querySelectorAll("[data-case-id]").forEach((caseCard) => {
    if (locked) {
      caseCard.setAttribute("aria-disabled", "true");
      caseCard.setAttribute("tabindex", "-1");
    } else {
      caseCard.removeAttribute("aria-disabled");
      caseCard.setAttribute("tabindex", "0");
    }
  });
}

async function sealCurrentArchive(allowWhileRunning = false) {
  if (isDemoMutationLocked() && !allowWhileRunning) return false;
  const current = state.currentMemorial;
  if (!current) return false;

  const { item, liveArchive, verification } = current;
  setAgentState("封存中");
  const basePayload =
    state.archivePayloads[item.id] || buildArchivePayload(item, liveArchive, verification);
  state.archivePayloads[item.id] = basePayload;
  const previousSeal = state.archiveSeals[item.id];

  let nextSeal;
  let response;
  try {
    response = await fetch("/api/archive/seal", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        payload: basePayload,
        verificationReceipt: verification?.verificationReceipt,
      }),
    });
  } catch (error) {
    nextSeal = await CemeteryCore.createLocalArchiveSeal(basePayload, {
      cryptoProvider: globalThis.crypto,
      sealedAt: new Date().toISOString(),
      errorMessage: error.message,
    });
  }

  if (response) {
    try {
      nextSeal = await CemeteryCore.readArchiveSealResponse(response);
    } catch (error) {
      if (error.receiptRelated) {
        delete state.archivePayloads[item.id];
        if (verification && typeof verification === "object") {
          delete verification.verificationReceipt;
        }
      }
      renderMemorial(item, liveArchive, verification);
      setAgentState(`封存被拒绝：${error.message}`);
      throw error;
    }
  }

  state.archiveSeals[item.id] = nextSeal;
  if (
    state.credentials[item.id] &&
    (!previousSeal ||
      previousSeal.provider !== nextSeal.provider ||
      previousSeal.archiveId !== nextSeal.archiveId ||
      previousSeal.contentHash !== nextSeal.contentHash)
  ) {
    delete state.credentials[item.id];
  }

  renderMemorial(item, liveArchive, verification);
  const archiveSeal = state.archiveSeals[item.id];
  const stateText = archiveSeal.provider === "pinata-ipfs" ? "已上传：IPFS" : "本地封存";
  setAgentState(stateText);
  return true;
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
  delete state.credentials[caseId];
}

function addFlower() {
  if (isDemoMutationLocked()) return false;
  const current = state.currentMemorial;
  if (!current) return false;
  getActions(current.item.id).flowers += 1;
  invalidateArchive(current.item.id);
  refreshCurrentMemorial();
  setAgentState("已献花");
  return true;
}

function lightCandle() {
  if (isDemoMutationLocked()) return false;
  const current = state.currentMemorial;
  if (!current) return false;
  getActions(current.item.id).candles += 1;
  invalidateArchive(current.item.id);
  refreshCurrentMemorial();
  setAgentState("已点灯");
  return true;
}

function submitGuestbook(form) {
  if (isDemoMutationLocked()) return false;
  const current = state.currentMemorial;
  if (!current) return false;
  const data = new FormData(form);
  const name = String(data.get("guestName") || "anonymous_witness").trim();
  const text = String(data.get("guestMessage") || "").trim();
  if (!text) return false;

  getActions(current.item.id).messages.push({
    name: name || "anonymous_witness",
    text,
    time: displayDate(),
  });
  invalidateArchive(current.item.id);
  refreshCurrentMemorial();
  setAgentState("纪念册已更新");
  return true;
}

function generateMemorialCredential(allowWhileRunning = false) {
  if (isDemoMutationLocked() && !allowWhileRunning) return false;
  const current = state.currentMemorial;
  if (!current) return false;
  const archiveSeal = state.archiveSeals[current.item.id];
  if (!CemeteryCore.isStructurallyValidArchiveReceipt(archiveSeal)) {
    setAgentState("请先完成可验证封存");
    return false;
  }

  state.credentials[current.item.id] = CemeteryCore.createCredential(current.item, archiveSeal);
  refreshCurrentMemorial();
  setAgentState(
    state.credentials[current.item.id].status === "future_claim_compatible"
      ? "已生成：未来认领兼容凭证"
      : "已生成：草稿纪念凭证",
  );
  return true;
}

function downloadJsonArtifact(filename, value) {
  const blob = new Blob([stableJson(value)], { type: "application/json;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  document.body.append(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(url);
}

function downloadMemorialCredential() {
  const current = state.currentMemorial;
  if (!current) return;
  const credential = state.credentials[current.item.id];
  if (!credential) return;

  downloadJsonArtifact(`${credential.id}.credential.json`, credential);
  setAgentState("已下载：纪念凭证 JSON");
}

function downloadCredentialMetadata() {
  const current = state.currentMemorial;
  if (!current) return;
  const credential = state.credentials[current.item.id];
  if (!credential) return;

  const metadata = CemeteryCore.createNftReadyMetadata(credential, current.item);
  downloadJsonArtifact(`${credential.id}.metadata.json`, metadata);
  setAgentState("已下载：metadata");
}

function selectCase(id, updateInput = true, allowWhileRunning = false) {
  if (isDemoMutationLocked() && !allowWhileRunning) return false;
  const item = cases.find((entry) => entry.id === id) || cases[0];
  state.selectedId = item.id;
  byId("caseSelect").value = item.id;
  if (updateInput) {
    byId("urlInput").value = item.originalUrl;
  }
  renderMemorial(item);
  updateCaseSelection();
  loadEvidencePackage(item.id)
    .then((evidencePackage) => {
      if (evidencePackage && state.currentMemorial?.item.id === item.id) refreshCurrentMemorial();
    })
    .catch(() => {});
  return true;
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

function withTimeout(promise, timeoutMs) {
  let timeoutId;
  const timeout = new Promise((_, reject) => {
    timeoutId = setTimeout(() => reject(new Error(`步骤超时（${timeoutMs}ms）`)), timeoutMs);
  });
  return Promise.race([promise, timeout]).finally(() => clearTimeout(timeoutId));
}

function runDemoOperation(step, operation) {
  if (state.demoOperations[step]) return state.demoOperations[step];

  const operationPromise = Promise.resolve().then(operation);
  state.demoOperations[step] = operationPromise;
  operationPromise.catch(() => {
    if (state.demoOperations[step] === operationPromise) {
      delete state.demoOperations[step];
      renderInteractionLocks();
    }
  });
  return operationPromise;
}

function advanceDemo() {
  const completedStep = state.demo.step;
  state.demo = CemeteryCore.nextDemoState(state.demo, "complete");
  delete state.demoOperations[completedStep];
  renderDemoProgress();
}

function renderDemoProgress() {
  const labels = {
    pending: "待运行",
    running: "运行中",
    done: "已完成",
    failed: "失败",
  };
  document.querySelectorAll("[data-demo-step]").forEach((row) => {
    const index = Number(row.getAttribute("data-demo-step"));
    let status = "pending";
    if (index < state.demo.step || state.demo.status === "complete") status = "done";
    if (state.demo.status === "running" && index === state.demo.step) status = "running";
    if (state.demo.status === "failed" && index === state.demo.step) status = "failed";
    row.setAttribute("data-status", status);
    row.querySelector("em").textContent = labels[status];
  });

  const summary = document.querySelector("[data-demo-summary]");
  const retryButton = document.querySelector("[data-action='retry-demo']");
  const runButton = document.querySelector("[data-action='run-demo']");
  if (state.demo.status === "failed") {
    summary.textContent = state.demo.error || "演示中断";
  } else if (state.demo.status === "complete") {
    summary.textContent = "档案与纪念凭证已就绪";
  } else if (state.demo.status === "running") {
    summary.textContent = `正在执行第 ${state.demo.step + 1} 步`;
  } else {
    summary.textContent = "等待开始";
  }
  retryButton.textContent = state.demo.retryAction === "stop" ? "重新开始演示" : "从失败步骤重试";
  retryButton.hidden = state.demo.status !== "failed";
  runButton.disabled = isDemoMutationLocked();
  renderInteractionLocks();
}

async function runDemoFlow() {
  if (state.running) return;
  const retrying = state.demo.status === "failed" && state.demo.retryAction !== "stop";
  state.demo = retrying
    ? CemeteryCore.nextDemoState(state.demo, "retry")
    : { step: 0, status: "running" };
  if (!retrying) {
    invalidateArchive("xiami");
    state.demoResults = {};
    state.demoOperations = {};
  }
  delete state.demo.error;
  state.running = true;
  renderDemoProgress();

  try {
    const item = cases.find((entry) => entry.id === "xiami");
    if (state.demo.step === 0) {
      selectCase("xiami", true, true);
      state.demoResults.item = item;
      advanceDemo();
    }
    if (state.demo.step === 1) {
      state.demoResults.evidencePackage = await withTimeout(
        runDemoOperation(1, () => loadEvidencePackage("xiami")),
        5000,
      );
      advanceDemo();
    }
    if (state.demo.step === 2) {
      state.demoResults.liveArchive = await withTimeout(
        runDemoOperation(2, () => lookupWayback("https://www.xiami.com")),
        8000,
      );
      advanceDemo();
    }
    if (state.demo.step === 3) {
      state.demoResults.verification = await withTimeout(
        runDemoOperation(3, () =>
          verifyWithGonka(item, state.demoResults.liveArchive, state.demoResults.evidencePackage),
        ),
        45000,
      );
      advanceDemo();
    }
    if (state.demo.step === 4) {
      renderMemorial(item, state.demoResults.liveArchive, state.demoResults.verification);
      await withTimeout(runDemoOperation(4, () => sealCurrentArchive(true)), 15000);
      advanceDemo();
    }
    if (state.demo.step === 5) {
      generateMemorialCredential(true);
      if (!state.credentials.xiami) throw new Error("纪念凭证生成失败");
      advanceDemo();
    }
    state.demo = CemeteryCore.nextDemoState(state.demo, "finish");
    renderDemoProgress();
    activateMuseumTab("exhibit");
    byId("memorial").scrollIntoView({ behavior: "smooth", block: "start" });
  } catch (error) {
    if (error.receiptRelated && state.demo.step === 4) {
      const staleVerification = state.demoResults.verification;
      if (staleVerification && typeof staleVerification === "object") {
        delete staleVerification.verificationReceipt;
      }
      delete state.demoResults.verification;
      delete state.archivePayloads.xiami;
      delete state.demoOperations[3];
      delete state.demoOperations[4];
      state.demo = { step: 3, status: "running" };
    }
    state.demo = CemeteryCore.nextDemoState(state.demo, "failure");
    state.demo.error = error.message;
    state.demo.retryAction = error.retryAction || null;
    renderDemoProgress();
  } finally {
    state.running = false;
    renderDemoProgress();
  }
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
  if (evidencePackagePromises.has(caseId)) return evidencePackagePromises.get(caseId);
  if (caseId !== "xiami") return null;

  const evidencePromise = (async () => {
    const response = await fetch("./data/xiami-evidence.json");
    if (!response.ok) throw new Error(`Evidence HTTP ${response.status}`);
    const payload = await response.json();
    evidencePackages.set(caseId, payload);
    return payload;
  })();

  evidencePackagePromises.set(caseId, evidencePromise);
  try {
    return await evidencePromise;
  } finally {
    if (evidencePackagePromises.get(caseId) === evidencePromise) {
      evidencePackagePromises.delete(caseId);
    }
  }
}

async function verifyWithGonka(item, liveArchive, evidencePackage) {
  const requestPayload = evidencePackage === undefined
    ? {
        case: item,
        archive: liveArchive,
        evidencePackage: await loadEvidencePackage(item.id),
      }
    : { case: item, archive: liveArchive, evidencePackage };
  const response = await fetch("/api/gonka/verify", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(requestPayload),
  });
  return CemeteryCore.readVerificationResponse(response);
}

async function runAnalysis(event) {
  event.preventDefault();
  if (isDemoMutationLocked()) return;

  state.running = true;
  renderInteractionLocks();
  const item = cases.find((entry) => entry.id === byId("caseSelect").value) || cases[0];
  const inputUrl = byId("urlInput").value;
  invalidateArchive(item.id);
  setAgentState("运行中");

  let liveArchive = null;
  let verification = null;
  try {
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
    setAgentState(CemeteryCore.verificationCompletionCopy(verification));
    byId("memorial").scrollIntoView({ behavior: "smooth", block: "start" });
  } catch (error) {
    setAgentState(`验证失败：${error.message}`);
  } finally {
    state.running = false;
    renderInteractionLocks();
  }
}

function init() {
  renderCases();
  renderOptions();
  renderSteps();
  renderDemoProgress();
  selectCase("xiami");
  byId("analysisForm").addEventListener("submit", runAnalysis);
  document.querySelector(".museum-tabs")?.addEventListener("keydown", (event) => {
    if (!["ArrowLeft", "ArrowRight", "Home", "End"].includes(event.key)) return;
    const tabs = [...document.querySelectorAll(".museum-tab[role='tab']")];
    const currentIndex = tabs.indexOf(document.activeElement);
    if (currentIndex < 0) return;
    event.preventDefault();
    const nextIndex = event.key === "Home"
      ? 0
      : event.key === "End"
        ? tabs.length - 1
        : (currentIndex + (event.key === "ArrowRight" ? 1 : -1) + tabs.length) % tabs.length;
    const nextTab = tabs[nextIndex];
    activateMuseumTab(nextTab.getAttribute("data-museum-tab"));
    nextTab.focus();
  });
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
    if (action === "generate-credential") {
      generateMemorialCredential();
    }
    if (action === "download-credential") {
      downloadMemorialCredential();
    }
    if (action === "download-credential-metadata") {
      downloadCredentialMetadata();
    }
    if (action === "seal-archive") {
      try {
        await sealCurrentArchive();
      } catch (error) {
        setAgentState(`封存被拒绝：${error.message}`);
      }
    }
    if (action === "download-archive") {
      downloadCurrentArchive();
    }
    if (action === "run-demo" || action === "retry-demo") {
      await runDemoFlow();
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
