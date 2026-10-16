# Lab1 Phase 1：SVG 编辑器（CLI）

## 0. 背景知识：SVG 文件格式与预览

### 0.1 SVG 是什么

**SVG（Scalable Vector Graphics）是一种用 XML 文本描述矢量图形的格式**：

- **纯文本、树形结构**：SVG 文件就是一份 XML 文档，元素按嵌套关系组成树（`<g>` 容器套子图形）；
- **`save` / `read` 的产物就是它**：`save demo.svg` 输出的文件可以**直接在浏览器里打开看效果**，`read` 读回的也是同一格式。

一个最小的 SVG 文件——一个容器里放两个矩形和一条连线（在 CLI 中执行 `init 400 200` 与其余四条命令即可得到）：

```xml
<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" width="400" height="200" viewBox="0 0 400 200">
  <g id="flow">
    <rect id="start" x="30" y="70" width="120" height="60" fill="#4a90d9"/>
    <line id="edge" x1="150" y1="100" x2="250" y2="100" stroke="black"/>
    <rect id="end" x="250" y="70" width="120" height="60" fill="#f5a623"/>
  </g>
</svg>
```

<details>
<summary>渲染预览</summary>

<svg xmlns="http://www.w3.org/2000/svg" width="400" height="200" viewBox="0 0 400 200" style="border:1px solid #ddd;border-radius:6px;background:#fafafa">
  <g id="flow">
    <rect id="start" x="30" y="70" width="120" height="60" fill="#4a90d9"/>
    <line id="edge" x1="150" y1="100" x2="250" y2="100" stroke="black"/>
    <rect id="end" x="250" y="70" width="120" height="60" fill="#f5a623"/>
  </g>
</svg>

</details>




| 要素 | 说明 |
|---|---|
| `<svg width height viewBox>` | 根元素，画布尺寸与坐标系 |
| `<rect x y width height>` | 矩形；`<circle cx cy r>`、`<ellipse>`、`<line x1 y1 x2 y2>` 同理 |
| `<text x y>` | 文字，**内容是子文本**而非属性 |
| `<g id="…">` | 分组容器，`transform="translate(dx,dy) scale(s)"` 可整体变换 |
| 公共属性 | `id`（**强制唯一**）、`fill`、`stroke`、`stroke-width` |


用 `<g>` 把多个图形打包，靠一个 `transform` 整体移动 / 缩放（嵌套 `<g>` 只对局部生效）：

```xml
<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" width="400" height="200" viewBox="0 0 400 200">
  <!-- 外层 <g>：一次性把整组向右下平移 (60,40)，子元素坐标无需修改 -->
  <g id="diagram" transform="translate(60,40)">
    <rect id="a" x="0" y="0" width="120" height="60" fill="#4a90d9"/>
    <line id="e" x1="120" y1="30" x2="200" y2="30" stroke="black"/>
    <!-- 嵌套 <g>：只把右端节点整体缩小并平移 -->
    <g id="nodeB" transform="translate(200,0) scale(0.8)">
      <rect x="0" y="0" width="120" height="60" fill="#f5a623"/>
      <text x="60" y="38" text-anchor="middle" font-size="16" fill="white">End</text>
    </g>
  </g>
</svg>
```

<details>
<summary>👁 渲染预览（点击展开，直接在 Markdown 预览中显示）</summary>

<svg xmlns="http://www.w3.org/2000/svg" width="400" height="200" viewBox="0 0 400 200" style="border:1px solid #ddd;border-radius:6px;background:#fafafa">
  <g id="diagram" transform="translate(60,40)">
    <rect id="a" x="0" y="0" width="120" height="60" fill="#4a90d9"/>
    <line id="e" x1="120" y1="30" x2="200" y2="30" stroke="black"/>
    <g id="nodeB" transform="translate(200,0) scale(0.8)">
      <rect x="0" y="0" width="120" height="60" fill="#f5a623"/>
      <text x="60" y="38" text-anchor="middle" font-size="16" fill="white">End</text>
    </g>
  </g>
</svg>

</details>


### 0.2 如何预览 SVG 文件

**方式一：浏览器直接打开（零依赖，首选）**——SVG 是浏览器原生格式，把 `.svg` 文件拖进 Chrome / Edge / Firefox 窗口，或 `open demo.svg`（macOS 会用默认浏览器打开）。改动文件后刷新页面即可看到新效果，调试 `save` 输出足够用。

**方式二：VSCode 内预览（推荐，与开发环境同窗口）**——安装扩展 **"SVG Preview"（可搜索 `svg preview`，如 Simon Siefke 的 SVG Preview）**，打开 `.svg` 文件后侧边栏实时预览，编辑与预览并排、保存即刷新。写插件序列化逻辑时尤其方便。


---

## 1. 提交内容

本Pj考察的重点是如何与AI一起完成一个架构良好，恰当使用了设计模式的应用。提交内容如下：

### 1.1 代码（git）

全程使用 **git** 管理并**推送到远程仓库**（GitHub 或 Gitee 均可），提交历史须能体现开发过程（分步推进，禁止 one-shot 大提交）；在**最终提交处打一个 tag**（统一命名 `final`），该 tag 须在**提交截止时间之前**完成。

### 1.2 文档

格式要求：**Markdown**，放在工程的 `doc/` 目录下，名为 `README.md`；内容即以下几节：

### 架构方案


| # | 项 | 要求 |
|---|---|---|
| 1 | **模块划分** | 打算把代码分成哪几个模块（目录），**每个模块的职责**；附一张图（PlantUML 组件图或包图） |
| 2 | **设计模式的选择** | 你认为应该采用什么设计模式？代码中是如何落地的？（要求使用Command模式） |
| 3 | **依赖方向规则** | 明确写出"哪些模块可以依赖哪些模块"及理由；违反规则的依赖即为待处理项 |
| 4 | **变化点假设** | **你认为未来最可能发生变化的是哪几处**？逐条列出，并说明你为它留了什么——或者**为什么决定不留** |


### 过程记录

记录你认为关键、有代表性的讨论与迭代过程，例如：你从 AI 给的建议、生成的文档或代码中发现了什么问题、如何确认并纠正。

### 一致性自查

实现完成后，对照方案如实回答两个问题：

1. **模块划分**：实际目录与方案是否一致？不一致之处是否已记入修订记录？
2. **依赖方向**：方案里的规则有没有被违反？可抽样检查代码中的依赖关系是否与架构方案一致。

### 质量保证手段

说明你如何确认最终的代码在功能上是完整的，以及你对代码质量有足够信心的依据。


---



## 2. 通用约定

| 约定 | 规则 |
|---|---|
| 提示符 | `svg>` ；REPL 逐行读入，`#` 开头为注释（便于把命令序列存成脚本回放） |
| 图形定位 | 一律用 **id**：每个图形元素（含容器 `<g>`）都必须拥有**唯一、大小写敏感**的 `id`，所有命令靠 `id` 定位图形（缺失时的自动补全见下条"自动补 id"）|
| 自动补 id | CLI 中 `create` / `group` 的 id 为必填参数（用户显式命名）；读入外部 SVG 缺 id 时按 `标签名+序号` 自动分配并**打印警告**（`warning: assigned id rect1 to unnamed <rect>`） |
| 坐标系 | 与 SVG 一致：原点左上，x 向右 y 向下，单位 px（浮点合法） |
| 带空格参数 | 双引号包裹（主要是 text 内容） |
| 错误输出 | 统一前缀 `error:`，一行一条，命令失败不改变任何状态 |
| 成功反馈 | 编辑类命令回显结果摘要（如 `rect#r1 moved to (130,20)`），显示类命令直接输出内容 |

> **为何以 id 定位**：SVG 图形本身没有"名称"，CLI / agent / 鼠标三种通道都需要一种无歧义的方式回答"改哪个图形"。`id` 是 SVG 规范的合法属性（`<use>` 引用、CSS 选择、fragment 导航都依赖它），把"可寻址性"作为约定显式提出不是人为简化，而是一次正当的设计决策。备选的结构路径寻址（如 `/canvas/g1/rect[2]`，类似 XPath）本阶段不要求。

### 2.1 实现范式

- TypeScript + **面向对象**：类层次 + 多态、字段封装、一类一文件（文件名 = 类名）。**禁止**贫血模型（公共数据袋）+ 过程式自由函数 + 到处 `switch(tag)` 的分派写法。
- 允许的"未模块化"仅限**架构层**（上帝类、无插槽、IO 未隔离），范式层不豁免。
- 按名字分派**只允许两处**：命令分发（命令名 → 实现）与图形工厂（类型名 → 类），且须在架构方案中标注为待重构。
- 容器与叶子**统一操作**：`move` / `scale` / `set` / `delete` 等命令对 `<g>` 与叶子图形一视同仁（Composite 语义）。
- 使用 AI 智能体（Codex、Qoder 等）协作完成。


## 3. 命令总表

### 文档类（执行后 undo/redo 禁止）

| 命令 | 语法 | 说明 |
|---|---|---|
| init | `init [w] [h]` | 新建空画布（默认 800×600），作为当前文档 |
| read | `read <file.svg>` | 读入 SVG 文件为当前文档；缺 id 自动补并警告 |
| save | `save [file.svg]` | 保存当前文档；无参数时保存到读入时的路径 |
| canvas | `canvas [w] [h]` | 无参数显示画布尺寸；带参数修改尺寸 |

### 图形编辑类（可 undo/redo）

| 命令 | 语法 | 说明 |
|---|---|---|
| create | `create <type> <id> [params…] [in <containerId>]` | 创建图形，见 4.1 各类型的参数表；**`in` 子句（可选）直接指定父容器**，省略时挂在画布根；`group` 保留用于"收编已存在的图形"。本阶段内核内置 rect / circle / ellipse / line / text / g 六种类型，其余类型报 `unknown shape type`（4.4 的 `box` 为后续插件化阶段的目标，本阶段不要求实现） |
| delete | `delete <id>` | 删除图形（容器则连同全部子孙） |
| move | `move <id> <dx> <dy>` | 平移（增量）；作用于容器时整体平移 |
| scale | `scale <id> <factor>` | 等比缩放：`factor` 同乘到图形的全部几何属性（位置与尺寸）；作用于容器时递归到每个子孙 |
| set | `set <id> <attr> <value>` | 设置属性；可设置的白名单与语义见 4.1 |
| group | `group <newGid> <id1> <id2>…` | 新建容器并收入若干图形（从各自原父容器摘出，保持相对顺序） |
| ungroup | `ungroup <gid>` | 解散容器，子图形提升到原容器的父级、占据原容器的位置 |
| addto | `addto <gid> <id>` | 把已有图形移入容器（作为最后一个子节点） |
| front / back | `front <id>` / `back <id>` | 调整 z-order（同级最前/最后） |

### 显示类（不进入 undo 栈）

| 命令 | 语法 | 说明 |
|---|---|---|
| tree | `tree [id]` | 结构树（默认全文档，见 5.1） |
| show | `show <id>` | 单个图形的属性明细 |
| help | `help` | 显示全部命令与语法 |

### 撤销重做

| 命令 | 语法 | 说明 |
|---|---|---|
| undo | `undo` | 撤销上一次编辑命令 |
| redo | `redo` | 重做；**undo 后若有新编辑，redo 栈清空** |

---

## 4. 命令细则

### 4.1 create 的类型参数表

| type | 参数 | 生成的 SVG 片段 |
|---|---|---|
| rect | `create rect <id> <x> <y> <w> <h> [fill]` | `<rect id="r1" x="10" y="20" width="100" height="50" fill="#eee"/>` |
| circle | `create circle <id> <cx> <cy> <r> [fill]` | `<circle id="c1" cx="100" cy="100" r="20" fill="red"/>` |
| ellipse | `create ellipse <id> <cx> <cy> <rx> <ry> [fill]` | `<ellipse …/>` |
| line | `create line <id> <x1> <y1> <x2> <y2> [stroke]` | `<line …/>` |
| text | `create text <id> <x> <y> "content"` | `<text id="t1" x="20" y="40">My Diagram</text>` |
| g | `create g <id>` | `<g id="scene"/>`（空容器，之后用 addto 填充） |

**fill / stroke 省略时**：不写入该属性，外观遵循 SVG 渲染默认（`fill` 初始为 `black`、`stroke` 初始为 `none`）。

**`set` 白名单**：`fill` / `stroke` / `stroke-width`，以及各类型自身的几何属性（rect: `x` `y` `width` `height`；circle: `cx` `cy` `r`；ellipse: `cx` `cy` `rx` `ry`；line: `x1` `y1` `x2` `y2`；text: `x` `y`）与 text 元素的文本内容 `text`。白名单外的属性报 `error: unknown attribute: <attr>`。

**`in <containerId>` 子句**：所有类型的 `create` 都支持尾缀 `in <containerId>`，直接挂进指定容器（该容器必须已存在且为 `g` 类型）。这样层级关系在**创建时**就表达，而非事后 `group` 收编：

```text
svg> create g node1
g#node1 created
svg> create rect start 120 100 160 60 #4a90d9 in node1
rect#start created in g#node1
svg> create text start-label 155 135 "开始" in node1
text#start-label created in g#node1
```

`group` 与 `addto` 仍保留，用于"把已经存在的图形收进容器/挪动归属"——三种写法分别对应三种真实时机：**创建时归属（`in`）、事后收编（`group`）、移动归属（`addto`）**。

### 4.2 错误信息约定

| 场景 | 输出 |
|---|---|
| id 已存在 | `error: id already exists: r1` |
| id 不存在 | `error: no such shape: r9` |
| `in` 目标不存在 | `error: no such container: node9` |
| `in` 目标不是容器 | `error: not a container: start` |
| 未注册的图形类型 | `error: unknown shape type: hexagon (is the plugin loaded?)` |
| ungroup 复合图形 | `error: cannot ungroup composite shape: n1` |
| group 目标同时含某容器与其子孙 | `error: cannot group a container into its own descendant: g1` |
| ungroup 根级容器（svg 直接子节点） | `error: cannot ungroup top-level container: scene` |
| scale 非正数 | `error: scale factor must be positive` |
| 文件不存在 / 不可写 | `error: cannot read file: a.svg` / `error: cannot write file: a.svg` |
| 未 read/init 就执行其他命令 | `error: no document. use 'init' or 'read' first` |

### 4.3 undo/redo 粒度

- **一条编辑命令 = 一个 undo 单元**；`group g1 r1 c1 t1` 整体是一个单元（undo 一次还原全部）；
- 显示类（tree/show/help）跳过；文档类（init / read / save，以及 canvas 修改尺寸）执行后 undo/redo 禁止（报 `error: undo not allowed after io command`），直到下一次编辑命令重新解禁。

### 4.4 复合图形类型 `box`——带标题的矩形框

> **阶段边界**：`box` 属后续插件化阶段的目标类型（本阶段 `create box` 报 `unknown shape type`）；本节定义其完整语义，本阶段不要求实现。

"带标题的矩形框"是流程图/框图的基本构件：**一个命令创建，内部由 rect + text 组成，整体又是一个容器**。它不是内核命令，而是**图形插件注册的类型**（ShapeProvider 插件）：

- **Composite**：`box` 与 rect/circle 一样可以 `move`/`delete`/`set`，与 `g` 一样可以 `in`/被 `group`/继续嵌套；
- **插件式类型扩展**：内核不认识 `box`，只按 `ShapeProvider` 接口消费。

**命令语法**：

```text
create box <id> <x> <y> <w> <h> "<标题>" [in <containerId>]
```

**创建后的内部结构**（子部件 id 自动派生：`<id>-rect` / `<id>-label`）：

```text
svg> create box n1 120 100 160 60 "开始"
box#n1 created (g#n1 + rect#n1-rect + text#n1-label)
svg> tree n1
g#n1 (box)
├── rect#n1-rect  x=120 y=100 w=160 h=60 fill=#4a90d9
└── text#n1-label (140,135) "开始"
```

**统一操作语义**（Composite 的关键检验）：

| 操作 | 行为 |
|---|---|
| `move n1 0 100` | 容器语义：整体平移（rect、text 随行） |
| `set n1 fill #f5a623` | 插件定义的**传播语义**：转发给 `n1-rect` |
| `set n1 label "处理数据"` | 插件定义的**便利属性**：改写 `n1-label` 的内容 |
| `delete n1` | 删除整个 box（含两个子部件），一个 undo 单元 |
| `group cluster n1 n2` | box 可以被收编——它就是一棵子树 |
| `create box n3 … in n1` | box 自己也是容器，**可再嵌套 box**（递归组合） |
| `ungroup n1` | 拒绝：`error: cannot ungroup composite shape: n1`（内部结构由插件所有） |

**序列化与读回**（复合图形的 round-trip 决策）：`box` 序列化为普通 SVG——`<g id="n1" data-kind="box">` + rect + text。读回时：注册了 box 插件的编辑器凭 `data-kind` 还原为 box 类型；未安装该插件的编辑器**降级为普通 `g` 容器**，功能不损、语义降级。

**插件要做的事**（对应 ShapeProvider 插槽）：类型注册（名字 + create 参数 schema）｜子部件模板与 id 派生规则｜`set` 传播语义（fill → rect，label → text）｜序列化标记与读回还原｜树形显示的类型标注（`g#n1 (box)`）。**内核为此新增的代码为 0**（插件化阶段目标）。

---

## 5. 显示格式

### 5.1 tree（结构树，属性内联）

图形编辑器的树要**内联关键几何属性**（不能只放文本），否则无法脱离画布工作：

```text
svg> tree
svg (800x600)
├── rect#bg        x=0 y=0 w=800 h=600 fill=#ffffff
├── text#title     (20,40) "My Diagram"
└── g#markers
    ├── circle#c1  cx=100 cy=100 r=20 fill=red
    └── rect#box   x=200 y=80 w=60 h=60 fill=#3366ff
```

`tree <id>` 只显示以该 id 为根的子树。

### 5.2 show（属性明细）

```text
svg> show c1
circle#c1  parent=g#markers
  cx=100 cy=100 r=20
  fill=red
```

---

## 6. 典型会话（完整 transcript）

```text
$ npm run cli
svg-editor 0.1 — type 'help' for commands

svg> init 800 600
canvas 800x600 created
svg> create rect bg 0 0 800 600 #ffffff
rect#bg created
svg> create text title 20 40 "My Diagram"
text#title created
svg> create circle c1 100 100 20 red
circle#c1 created
svg> create rect box 200 80 60 60 #3366ff
rect#box created

svg> group markers c1 box
g#markers created with 2 children
svg> tree
svg (800x600)
├── rect#bg        x=0 y=0 w=800 h=600 fill=#ffffff
├── text#title     (20,40) "My Diagram"
└── g#markers
    ├── circle#c1  cx=100 cy=100 r=20 fill=red
    └── rect#box   x=200 y=80 w=60 h=60 fill=#3366ff

svg> move c1 30 0
circle#c1 moved to (130,100)
svg> undo
circle#c1 moved back to (100,100)
svg> redo
circle#c1 moved to (130,100)

svg> set title text "My Diagram v2"
text#title updated: text="My Diagram v2"
svg> undo
text#title updated: text="My Diagram"

svg> group bad c1 markers
error: cannot group a container into its own descendant: markers
svg> delete box
rect#box deleted
svg> undo
rect#box restored into g#markers

svg> save demo.svg
saved to demo.svg (5 elements)
svg> undo
error: undo not allowed after io command

svg> read other.svg
warning: assigned id rect1 to unnamed <rect>
read other.svg (7 elements)
svg> tree
svg (400x300)
├── rect#rect1     x=0 y=0 w=400 h=300 fill=#ffffff
├── text#t1        (10,290) "imported"
├── circle#c1      cx=50 cy=50 r=10
├── g#g1
│   ├── rect#r2    x=0 y=0 w=10 h=10
│   └── circle#c2  cx=5 cy=5 r=2
└── ellipse#e1     cx=1 cy=2 rx=3 ry=4
```

其中 `other.svg` 是一个外部文件（含一个缺 id 的元素），内容如下：

```xml
<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" width="400" height="300" viewBox="0 0 400 300">
  <rect x="0" y="0" width="400" height="300" fill="#ffffff"/>
  <text id="t1" x="10" y="290">imported</text>
  <circle id="c1" cx="50" cy="50" r="10"/>
  <g id="g1">
    <rect id="r2" x="0" y="0" width="10" height="10"/>
    <circle id="c2" cx="5" cy="5" r="2"/>
  </g>
  <ellipse id="e1" cx="1" cy="2" rx="3" ry="4"/>
</svg>
```

### 6.1 案例：两节点流程图（节点含内容）

"节点 = 容器（矩形 + 文字）"是 Composite 的最小完整用例。用 `in` 子句**自顶向下**构建，层级在创建时即成立；`group` 留给"收编已存在图形"的场景。目标结构：

```text
svg (800x600)
└── g#flowchart
    ├── g#node1
    │   ├── rect#start       x=120 y=100 w=160 h=60 fill=#4a90d9
    │   └── text#start-label (155,135) "开始"
    ├── g#node2
    │   ├── rect#process     x=520 y=100 w=160 h=60 fill=#f5a623
    │   └── text#process-label (545,135) "处理数据"
    └── line#arrow1          (280,130) -> (520,130)
```

会话过程：

```text
$ npm run cli

svg> init 800 600
canvas 800x600 created

# 先建容器骨架，再往里放图形：每一步都显式表达归属
svg> create g flowchart
g#flowchart created
svg> create g node1 in flowchart
g#node1 created in g#flowchart
svg> create rect start 120 100 160 60 #4a90d9 in node1
rect#start created in g#node1
svg> create text start-label 155 135 "开始" in node1
text#start-label created in g#node1

svg> create g node2 in flowchart
g#node2 created in g#flowchart
svg> create rect process 520 100 160 60 #f5a623 in node2
rect#process created in g#node2
svg> create text process-label 545 135 "处理数据" in node2
text#process-label created in g#node2

# 连接线挂在流程图容器下
svg> create line arrow1 280 130 520 130 black in flowchart
line#arrow1 created in g#flowchart

svg> tree
svg (800x600)
└── g#flowchart
    ├── g#node1
    │   ├── rect#start       x=120 y=100 w=160 h=60 fill=#4a90d9
    │   └── text#start-label (155,135) "开始"
    ├── g#node2
    │   ├── rect#process     x=520 y=100 w=160 h=60 fill=#f5a623
    │   └── text#process-label (545,135) "处理数据"
    └── line#arrow1          (280,130) -> (520,130)

# 容器移动：整个节点 2 下移 100，文字随行（容器的价值所在）
svg> move node2 0 100
g#node2 moved by (0,100)
svg> undo
g#node2 moved back by (0,-100)

# 改节点内容：只动组内 text
svg> set process-label text "处理数据 v2"
text#process-label updated: text="处理数据 v2"

svg> save flowchart.svg
saved to flowchart.svg (8 elements)
```

**版本 B：用复合图形 `box` 重写同一流程图**（4.4 的插件类型；**本阶段不要求实现**，此为插件化阶段的目标）：

```text
$ npm run cli

svg> init 800 600
canvas 800x600 created

svg> create box n1 120 100 160 60 "开始"
box#n1 created (g#n1 + rect#n1-rect + text#n1-label)
svg> create box n2 520 100 160 60 "处理数据"
box#n2 created (g#n2 + rect#n2-rect + text#n2-label)
svg> create line arrow1 280 130 520 130 black
line#arrow1 created
svg> group flowchart n1 n2 arrow1
g#flowchart created with 3 children

# Composite 的统一操作：对 box 与对普通图形毫无区别
svg> move n2 0 100
box#n2 moved by (0,100)
svg> undo
box#n2 moved back by (0,-100)
svg> set n2 fill #f5a623
box#n2 fill propagated to n2-rect
svg> set n2 label "处理数据 v2"
box#n2 label updated: "处理数据 v2"
svg> undo
box#n2 label restored: "处理数据"

svg> tree
svg (800x600)
└── g#flowchart
    ├── g#n1 (box)
    │   ├── rect#n1-rect  x=120 y=100 w=160 h=60 fill=#4a90d9
    │   └── text#n1-label (140,135) "开始"
    ├── g#n2 (box)
    │   ├── rect#n2-rect  x=520 y=100 w=160 h=60 fill=#f5a623
    │   └── text#n2-label (540,135) "处理数据"
    └── line#arrow1       (280,130) -> (520,130)

svg> save flowchart-box.svg
saved to flowchart-box.svg (8 elements)
```

版本 A 手工组合用了 8 条 `create` 命令，文字居中靠手算；版本 B 每个节点一条命令，居中由插件模板负责，`set` 有领域语义（fill/label 直达子部件）。


