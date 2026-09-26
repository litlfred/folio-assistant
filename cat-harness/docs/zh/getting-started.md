---
layout: default
title: 入门指南
lang: zh
nav_exclude: true
translation_status: unverified
translation_source: getting-started.md
available_locales: ["ar", "zh", "en", "fr", "ru", "es"]
---

# 入门指南
{: .no_toc }

本页面介绍第一次对话——即在某人说出*“我想创建一个 folio”*到拥有一个可以打开的已发布站点之间发生的事情。如果您已经拥有一个 folio 并希望配置工具链，请直接跳至[§4 安装与验证](#4-install-and-verify)。

1. TOC
{:toc}

---

## 1. “创建 folio”是五种不同的请求

把这句话对五个人说，你会得到五种完全不同的工作成果。智能体的首要任务不是立即开始，而是弄清楚你指的是哪一种。

| 你的意思 | 你当前拥有的 | 猜错的代价 |
|---|---|---|
| **在新仓库中创建一个新 folio** | 目前什么都没有 | — |
| **将 folio-assistant 添加到你现有的仓库中** | 你自己的项目，包含其自身的文件 | 在未经事先审阅的工作成果之上搭建了一个 folio 脚手架 |
| **在已有 folio 的仓库中再建一个 folio** | 一个 folio-assistant 实例 | 多出一个你并不想要的第二个仓库，以及被割裂的语料库 |
| **在你已有的 folio 中新建一个文档** | 一个 folio，并且心中已有具体的章节构想 | 得到一个全新且完全空白的 folio，而该章节依然毫无着落 |
| **你更希望用自己的话来描述的事情** | — | — |

第四行尤其值得停下来思考。这并不是你的过错——“folio”是一个生僻的词汇，当你实际想要的是其中一个章节却说成了要建一个 folio，这是最自然不过的误会。如果智能体直接在此基础上搭建脚手架，产出的将是一个空仓库，而不是你所需要的段落。

## 2. 智能体如何做出决策——以及为什么它是一张表而不是一种主观判断

这种分流是一份真实的、可读的制品，而不是智能体某种不可捉摸的习惯：

- 流程为 [`processes/getting-started.bpmn`](https://github.com/litlfred/folio-assistant/blob/main/processes/getting-started.bpmn)；
- 其核心决策为 [`decisions/folio-intent.dmn`](https://github.com/litlfred/folio-assistant/blob/main/processes/decisions/folio-intent.dmn)，这是一张可以在任何 DMN 工具中打开并在无需触碰代码的情况下进行修改的 DMN 决策表。

<figure class="bpmn-figure">
  <img src="{{ '/assets/img/workflows/getting-started.svg' | relative_url }}"
       alt="BPMN 流程：用户请求创建一个 folio；智能体检测交互模态，读取仓库事实，并由基于 folio-intent.dmn 计算得出的排他网关路由到五个分支之一——ask、overlay、new-repo、add-folio，或是交接给内容创作。脚手架为工作计划提供初始数据，随后 Pages 构建报告 live、not-yet 或 unknown。">
</figure>
<p class="bpmn-source"><em>来源：<code>processes/getting-started.bpmn</code> — 该 SVG 由 <code>bun run render:bpmn</code> 生成。</em></p>

### 三项事实

网关仅读取恰好三项内容，其中两项来自直接观察而非提问：

| 事实 | 获取方式 |
|---|---|
| `isFolio` | 该目录中是否存在 `harness.config.json`？ |
| `repoHasContent` | 工作区是否包含属于某人项目的文件，而非空无一物？ |
| `statedIntent` | 你实际**明确表达**的内容——五种之一，或 `unstated` |

`statedIntent` 是关于*对话*的事实。在你说出具体选项之前，它始终保持为 `unstated`。从语气或从“怎样比较方便”来推断意图，恰恰是这张表旨在防止的失败模式。

> `isFolio` 针对的是目录，而不是你。即便使用 folio-assistant 多年的人，在打开一个新目录时，也仍然处于 `isFolio=false` 的目录中。经验会改变智能体解释的详尽程度；但绝不会改变它所选择的分支。

### 七条规则

| # | 表明意图 | 是否为 folio | 是否有内容 | → |
|---|---|---|---|---|
| 1–4 | 前述四种之一 | – | – | 对应分支 |
| 5 | unstated | 是 | – | **ask** |
| 6 | unstated | 否 | 是 | **ask** |
| 7 | unstated | 否 | 否 | 在此新建 folio |

命中策略为 `FIRST`，因此规则 1–4 优先于任何推断：**明确表达了自己需求的人，永远不会被关于其文件系统的启发式推测所推翻。**

### 为什么有两条规则返回 "ask"，以及为什么这是关键所在

只有规则 7 可以仅凭观察来判定。一个已经是 folio 的目录与三种不同的请求相兼容，而一个包含某人项目的目录与两种请求相兼容。决策表并没有掩盖这一事实——它返回 `ask`。

这比听起来更为重要：

> **`ask` 是决策表产生的结果，而不是智能体自行得出的主观决定。**

智能体无法路由到决策表未曾返回的分支，因此提问变成了强制性的规程，而非客套的礼貌。如果任由智能体自行决定*是否*提问，在任何表现得乐于助人的压力下，它都会倾向于擅自替用户做决定——而这三种含糊不清的情况，恰恰是盲目猜测代价最高昂的地方。

当你回答后，你的回答便成为了 `statedIntent`，同一张表会重新求值。这就是为什么流程图会循环回*读取仓库事实*（Read the repository facts）而不是直接跳到某个分支：**你的回答是证据，像对待其他任何事实一样被读取。**

### 修改它

该决策表是一个包含七条规则的 XML 文件。要添加第六种请求，只需添加一条规则并在网关中添加一个匹配的分支——加载器会拒绝启动一个其决策表能够返回无对应命名分支结果的流程，因此两者绝不会脱节。`src/` 中的任何代码都无需更改。

## 3. 对话是什么样的

**提问的形式先于其内容。** 智能体首先确定你希望如何被提问——可选项、普通聊天、大声朗读、大号字体——并将其记录在 `interaction/interaction.json` 中，以便未来的会话不再重复询问。参见[无障碍](accessibility.html)。

随后，当答案确实含糊不清时：

> **你：** 我想创建一个 folio
>
> **助手：** 该目录中已包含一个 folio（`content/atlas/`），因此你的意思可能是以下几种之一——
> 1. **向此处的 folio 中添加内容**——一章或一个文档
>    *（推荐——在 folio 内部时，“创建……”通常表示这个含义）*
> 2. 在 `atlas` 旁边添加第二个 folio
> 3. 在新仓库中启动一个新 folio
> 4. 告诉我更多信息
>
> *（不回答也没关系——我将默认采用第 1 种，并在写入任何内容前向你展示。）*

接下来，是决定要在**什么**上开始着手——因为并没有人真正只是想要一个泛化的“folio”：

| 内容类型 | 它的本质 | 所需依赖 |
|---|---|---|
| **paper** | 科学论文或专著，形式化主张由 Lean 支持，通过 LaTeX 排版 | Lean 工具链、TeX |
| **document** | 结构化散文——政策指南、标准、报告 | pandoc；无需 Lean，无需 TeX |
| **WHO SMART DAK** | 数字适应套件（L2）——人物画像、业务流程、数据字典、决策表 | — |
| **WHO SMART IG** | FHIR 实施指南（L3），由 L2 DAK 构建而成 | Java、SUSHI、IG Publisher |

参见[内容类型](content-types.html)，了解每种形式化能为你带来什么。

## 4. 安装与验证
{: #4-install-and-verify }

请按照[安装](installation.html)进行操作，然后运行：

```sh
bun run check-deps
```

终端应当报告 `bun` 已存在。你的内容类型所需但尚未安装的任何依赖都会列出相应的安装提示——例如文档（document）类 folio 完全不需要任何 Lean 或 TeX 相关的依赖行。

## 5. 连接你的 LLM harness

将 folio-assistant 注册为 MCP 服务器——请参阅[连接 LLM harness](installation.html#connecting-an-llm-harness)了解有关 Claude Code、Antigravity、Gemini CLI 以及通用 MCP 客户端的配置方法。

与本页面最相关的工具：

| 工具 | 用途 |
|------|---------|
| `folio_init` | 为 folio 搭建脚手架。注册为**通用**工具，因为它在 folio 确定内容类型之前运行 |
| `workflow_start` / `workflow_next` / `workflow_complete` | 将 `getting-started.bpmn` 作为真实流程运行；`workflow_next` 说明当前启用了什么以及由哪项技能实现 |
| `work_plan_prime` | 呈现工作计划（beans） |
| `check_dependencies` | 探测已安装的工具链 |
| `skill_list` / `skill_fetch` | 发现并加载某项技能的指令 |

完整的工具列表请参阅[技能与角色](skills.html)页面；特定内容类型的工具仅在匹配的适配器处于激活状态时才会出现。

## 6. 转换你已有的仓库

在 `overlay` 分支上，智能体在触碰任何内容之前都会先行观察：

```sh
bun run scan:repo            # 只读报告
bun run scan:repo -- --json  # 相同内容，以事实形式输出
```

它会将发现的内容分类到**三**个存储桶中——`library`（其他人编写的源资料）、`content`（在此处撰写的散文正文）以及 `unclassified`（未分类）。

第三个存储桶是深思熟虑的设定。若分类器强制将每个文件塞入两类之一，其准确性无人能够评估，且其错误会直接表现为被误移的文件。而该分类器会明确告知你哪些内容它无法确定归属，并交由你来决定。

随后会提出三个问题，均可通过选择来回答，且都是**按目录**而非按单个文件提问：

1. **究竟是否导入？**——全部导入、仅源资料、完全不导入，或按存储桶挑选。
2. **各个分组分别放到何处？**——针对其无法确定的分组，选择放入 `library/` 还是 `content/`。
3. **保留在原位还是重新整理？**——*保留在原位*是慎重给出的推荐意见。清理整洁只是一种偏好；而 README 中损坏的相对链接则是一个缺陷。

在问题 3 得到回答之前，任何文件都不会被移动。在 BPMN 中，该步骤被标记为 `relaxable="false"`，因此没有任何内容包可以将其随意忽略。

完整规程请参阅 [`repo-conversion`](reference/skill-instructions/repo-conversion.html) 技能。

## 7. 查看已发布的成果

创建 folio 的最终成果应该是一个链接。在搭建脚手架后立即运行：

```sh
bun run pages:bootstrap            # 推导地址，生成报告，不进行网络探测
bun run pages:bootstrap -- --wait  # 持续探测直至站点响应（有时间限制）
```

它会从 `harness.config.json` 或 `origin` 远端推导地址，根据发布工作流的*实际作用*而非其命名来识别它们，并报告以下三者之一：

| 状态 | 含义 |
|---|---|
| **live** | 站点已有响应。链接如下 |
| **not yet** | **确测的** 404 状态——地址无误，但首次构建尚未部署上线 |
| **could not check** | 无法推导地址、未进行任何探测，或网络请求失败 |

第三种并非第二种状态的委婉说法，智能体也不会据此对你说“应该很快就会上线”。确测的 404 是确凿的证据；而失败的请求则是证据的缺失，若告知作者错误的状态，作者就会徒劳地去寻找一个根本不可能出现的站点。

这三种状态同样构成了一个决策表——[`decisions/pages-live-gate.dmn`](https://github.com/litlfred/folio-assistant/blob/main/processes/decisions/pages-live-gate.dmn)——并且 `scripts/pages-bootstrap.ts` 经过测试保证与其完全一致，因而脚本与决策表绝不会发生分歧。

## 8. 定制你的专属落地页

你的站点首页会显示你实例**自身**的描述，绘制在你**专属**的背景图内。两者均来自同一个文件——仓库根目录下的 `<name>.json`——而模板中并未硬编码任何关于平台那只暴躁猫咪的内容。修改该文件，页面便会相应更新。

### 你编辑的 markdown 节点

```jsonc
// <name>.json -- 声明文件。以下每个键都是其顶级字段之一，
// 这也是确立该标签的原因：它不是 folio 配置。
{
  "title": "My Folio",              // 左侧边栏的标题
  "description": "One line.\nAnother line.",   // ← 落地页 markdown
  "icon": "mark-small",             // 浏览器标签页使用的图标
  "images": [ /* … */ ]
}
```

`description` 是原样渲染的 **markdown**。它是落地页所绘制的节点；并没有单独的页面需要与之保持同步，这正是其设计目的——在两个地方出现的描述必然会导致内容不一致。

### 专属背景图

通过声明 `role: "landing"` 以及为其裁剪的视口，图片即可成为落地页的背景图：

```jsonc
{
  "id": "landing-laptop",
  "src": "docs/assets/img/my-backdrop.webp",
  "role": "landing",
  "layout": "laptop",               // 亦可为："mobile"、"card"
  "width": 1671, "height": 941,
  "textRegion": { "x": 0.205, "y": 0.285, "w": 0.625, "h": 0.235 }
}
```

`textRegion` 是文字可以安全放置的区域，以图像尺寸的比例表示。**它是人工编排的，而非计算得出的**，因为它标明了画面中“安静”的留白区域——这种对画面构图的判断是任何像素分析都无法替代的。平台自带的笔记本电脑背景图上有一个留有清晰下半部内部空间的思考云泡、其上方三分之一被一个标志占据、一只猫耳朵伸入左下角；避开这三者的矩形框是通过渲染候选区域并肉眼查看确定的。为你的背景图也做同样的操作。

每个视口声明一个变体。每个变体都有其**专属**的区域，因为同样的构图在纵向裁剪中的位置是不同的。

然后运行：

```sh
bun run docs:harness         # 将声明推送到 docs/_data/
bun run docs:harness -- --check   # ……如果内容过时则报错（用于 CI）
```

### 它绝不会做的三件事

| 你的声明 | 页面的呈现 |
|---|---|
| **带有**区域的背景图 | 在该区域内绘制你的描述 |
| **不带**区域的背景图 | 显示图片，将文字置于图片**下方** |
| **无**背景图 | 仅显示文字 |

中间一行的行为是刻意设计的。凭猜测定位的文本往往会直接叠在猫咪脸上，因此未声明区域代表“不要叠放”，绝不代表“随便放哪都行”。而没有美术插图的 folio 是普通的，并不是损坏的。

如果你声明了 `mobile` 变体并且有手机访问，它会加载该文件——如果没有，它会使用你所拥有的最宽的变体。这种回退是一种实实在在的降级体验，因为宽屏裁剪的区域并不适合窄屏；系统会如实报告而非掩盖这一情况，以便渲染器拒绝叠放，而不是将文字随意放置在一个无人指定的位置。

## 9. 使用 `beans` 跟踪工作

folio-assistant 使用 [`beans`](https://github.com/hmans/beans) 作为统一的工作计划机制——跨会话持久保存、在智能体之间共享，并提交到仓库中。

```sh
scripts/install-beans.sh          # 若缺少 CLI 则进行安装
beans prime                       # 为智能体输出工作计划启动引导
beans list                        # 当前开放的事项
beans create "draft chapter 1"    # 开启一个事项
beans <id> --status in-progress   # 认领一个事项
```

> **创建前务必检查。** `beans create` 每次调用都会生成一个全新 ID，且不进行任何去重。在未进行存在性检查的情况下重复执行脚本步骤，曾在短短一下午内于一个 folio 中生成了 **14,688** 个重复的 bean。检查逻辑已包含在 [`todo-manager`](reference/skill-instructions/todo-manager.html) 技能中。

`SessionStart` 钩子会在每次会话开始时呈现该计划，而 `work_plan_prime` MCP 工具则将相同的视图暴露给任何已连接的智能体。

## 后续步骤

- **[无障碍](accessibility.html)** — 智能体如何提问，以及本站点的设置控件
- **[教程 — 撰写论文](guides/writing-a-paper.html)**
- **[撰写文档](guides/writing-a-document.html)**
- **[内容类型](content-types.html)** — 各领域的规范形式
- **[发布工作流](publication-workflow.html)** — 仓库中的各项流程
- **[架构](architecture.html)** — 适配器、技能与块模型
