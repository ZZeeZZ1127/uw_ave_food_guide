# Design Doc：新增 Bellevue 板块 + Ave 新餐厅（v2）

> 更新于 2026-11-21，已经整合你的第一轮笔记。
> 图例：✅ = 多个来源一致；⚠️ = 来源有冲突，需要核实；❓ = 没找到数据；🗣 = 你本人的评价（卡片上标“ZZ 亲自品尝”）。
> 仓库：本地 `/Users/zeenzcg/Documents/project/uw_ave_food_guide`，remote 是 `github.com/ZZeeZZ1127/uw_ave_food_guide`（同一个仓库，本地就能直接改，不需要另外访问 GitHub）。

## 1. Context（为什么做）

- 网站现在只收录 Ave 周边。要加一个 **Bellevue 板块**，包括你吃过的店，再加上大量调研出来的推荐（以小红书为主）。
- Ave 这边新增 Ku Sushi、JOEY、Shake Shack、Sakana、Issian。
- 你觉得第一轮找到的店**太少**，所以这次先装小红书 CLI，抓更多店，我再自己综合评估、整理。
- UI 风格保持不变（之后可能整体改版）。CLAUDE.md 要改成最新的样子。

## 2. 已定的决定

- **方案**：同一个页面，加地区切换 `[🎓 UW Ave] [🌆 Bellevue]`（不是另开一页）。
- **新分类**：`hotpot`「🍲 火锅烤肉」（颜色 `#d35400`）和 `western`「🍽️ 西餐」（颜色 `#5d4037`）。两个地区都能用。
- 调研出来的推荐全部加入（visited: false），外加一张“即将开业”卡片。
- 店名用 **TeaByDo**（茶百道）。

## 3. 执行顺序

### Phase A — 安装小红书 CLI，扩大调研

1. 安装 Agent Reach（官方方式，不用 PyPI 上同名的包）：
   - `uv tool install https://github.com/Panniantong/Agent-Reach/releases/latest/download/agent-reach.zip`
   - `agent-reach setup`，然后 `agent-reach add xiaohongshu`（具体命令以安装后的 skill 文档为准）
   - `agent-reach doctor` 检查状态
2. **需要你动手**：小红书需要登录（扫码，或者用 Cookie-Editor 导出 cookie）。我不会替你输入密码；到这一步我会停下来等你登录。
3. 搜索（`mcporter call 'xiaohongshu.search_feeds(...)' | agent-reach format xhs`），关键词包括：
   `Bellevue 美食`、`Bellevue 必吃`、`Bellevue 新店`、`Bellevue 探店 2026`、`Crossroads 美食`、`Factoria 美食`、`Bellevue 火锅`、`Bellevue 烤肉 自助`、`Bellevue 川菜/湘菜/东北菜`、`Bellevue 日料/拉面`、`Bellevue 奶茶/甜品`、`百家超市 Bellevue 美食`、`大统华 Bellevue 熟食`，以及每家已经定下来的店名（拿评论来补推荐菜）。
4. 筛选标准（我综合评估）：
   - 笔记是 2025–2026 年发的；
   - 至少 2 个来源都提到（小红书 + Yelp/Google/Dealmoon/新闻）；
   - 用 Yelp 或 Google 确认地址，并确认 2026 年还在营业；
   - 已关门、只有一个旧来源的店，放进“待核实”，不上线。
   - 目标：Bellevue 收录 **35–45 家**（目前已确定 30 家左右）。
5. 把扩充后的设计文档存到仓库里的 `docs/bellevue-design.md`（不 commit），方便你检查和修改。

### Phase B — 写数据（`js/restaurants.js`）

按 §5、§6、§7 的内容写卡片，加上 Phase A 新找到的店。Bellevue 的店都加 `region: "bellevue"`；以后不写 region 的默认算 `"ave"`。坐标用 Google Maps / OSM 查准确的位置，每家都填 `dataAddr`（写到 “Bellevue, WA 980xx”）。

### Phase C — 页面功能（`js/app.js`、`index.html`、`css/styles.css`）

- `app.js`
  - `currentRegion` 从 `location.hash` 读（`#bellevue`），默认是 `ave`
  - `renderAllCards()` 只渲染当前地区的店
  - 新增 `updateCounts()`：自动算 header 的“N 家”和每个分类的计数（不再手写），当前地区没有店的分类整个 section 隐藏
  - `initFoodMap()` 改成只建一次地图，标记放在 `L.layerGroup` 里；切换地区时 `clearLayers()`，重新加标记，再 `fitBounds`
  - `buildNavLink` 和 `linkifyAddresses` 的默认城市后缀按地区换（Bellevue → “Bellevue, WA”）
  - 新增 `initRegionSwitch()`：切换时保留当前的分类筛选，更新 hash，更新 header 文案
  - `categoryColors` / `categoryEmoji` 加上 `hotpot` 🍲 和 `western` 🍽️
- `index.html`：在 filter-bar 上面加地区按钮（复用 `.filter-btn`）；加 hotpot / western 的筛选按钮、section、card-grid、图例；header 的标题、副标题、计数和偏好标签由 JS 按地区填写；“快速决策指南”做两份（`data-region`）；“即将开业”卡片放在 Bellevue 的 section 最后（不放进地图）；Bellevue 板块加“附近逛吃”小贴士卡（见 §6）。
- `css/styles.css`：只加地区按钮行的间距，以及手机宽度下的换行。

### Phase D — 文档

- **CLAUDE.md** 改成最新内容：数据在 `js/restaurants.js`（不是 inline）；完整的字段说明，加上 `region`；app.js 每个函数的职责；新增一家店 / 分类 / 地区的步骤；`styles.css` 的位置；计数由 JS 自动算；`docs/` 目录。
- README 加一句 Bellevue 板块的介绍；header / footer 的更新日期改成 2026 年 11 月。

## 4. 页面行为（复用现有代码）

- `renderCard()` 不改，badges、dishes、notes 的写法照旧（🔥 / 🆕 / 🍬 / ⚠️ 前缀会自动对应样式）。
- `initFilter()` 现在已经会隐藏空的 grid；只要再加上“按 region 过滤”就够了。
- AYCE 用 badge `🔥 AYCE 自助` 表示，价格写在 dish note 里。

## 5. Bellevue：你吃过的 13 家（visited: true）

| 店 | 分类 | 地址 | 卡片内容（🗣 = 你说的） |
|---|---|---|---|
| Sushi Omiya（Factoria） | japanese | 3928 Factoria Square Mall SE #B4, 98006 | 🗣 salmon sashimi 一盘 3 片只要 $4.5，肉厚、个头大；选择很多；我常去的店之一；非常划算。回转 + 平板点餐。价位参考 Google Maps（Phase A 再核实）。badge `🔥 性价比之王` |
| 辉月 Kizuki Ramen & Izakaya | japanese | **一张卡，写两个地址**：Bellevue Square 2F（575 Bellevue Way NE #252）/ 14845 Main St, 98007 | 🗣 全明星拉面（All-Star）必点，其他的也值得试 |
| 天丼琥珀 Tendon Kohaku | japanese | 233 106th Ave NE, 98004 | 🗣 应该是这一带最好吃的日料，西雅图 CID 也有分店。11–3 / 5–10；周末 walk-in 可能等 2–3 小时 → 建议在 Toast 预约 |
| E+ Noodles | chinese | Crossroads 美食街，15600 NE 8th St | 🗣 平价麻辣烫，量大管饱，去过很多次；Crossroads 美食街里还有很多别的可以逛 |
| 沸点 Boiling Point | hotpot | 1075 Bellevue Way NE（Belgate Plaza） | 🗣 连锁小火锅，性价比高，量大管饱；每次必点**韩风大酱锅**（可以选辣度，但都只是微辣）；午餐时段送饮料（绿茶、冬瓜汁都好喝），比晚餐便宜 |
| 茶百道 TeaByDo | dessert | 1075 Bellevue Way NE（沸点旁边），11am–7pm | 🗣 Bellevue 新开的，国内很火；推荐**杨枝甘露**。badge `🆕 2026 新开` |
| 东北人家 DongBei Harvest | chinese | 13433 NE 20th St Ste G, 98005 | 🗣 东北菜、烤串都能吃；招牌**铁锅炖**（肉有点柴，但一桌人吃很热闹，配菜很不错）；最近常点铁锅炖鱼 + 炸蘑菇（非常香）；人均 $30 出头 |
| 鼎泰丰 Din Tai Fung（Bellevue） | chinese | 10455 NE 8th St, 98004 | 2024 年搬到原 Maggiano's 的位置，面积翻倍；不接受订位。菜品参考 Ave 页面的 U Village 店卡片 |
| 海底捞 Haidilao | hotpot | 188 106th Ave NE Ste 210, 98004 | 🗣 主打情绪价值；happy hour 可以吃 AYCE，算上锅底人均 $30–40；味道还行但不算好吃，肉一般，很多朋友后来都没再去。⚠️ AYCE 的具体菜品和时段：网上只找到“Meat O'Clock $19.99”（周一到周四 9pm 后、周五到周日 9:30pm 后）和 31% off happy hour，**Phase A 用小红书核实** |
| 西塔老太太烤肉 MAMA XITA BBQ | **korean** | 550 106th Ave NE Ste 101, 98004 | 🗣 国内很出名。美国首店；招牌是腌牛横膈膜（护心肉）。营业时间有冲突 → Phase A 核实 |
| Woobling Korean BBQ | hotpot（KBBQ AYCE） | 989 112th Ave NE #205, 98004 | 🗣 吃过两次自助，量大管饱，种类多，味道不错，肉也还行，人均约 $30。AYCE 价格：$38 / $48 / $58，happy hour $28 |
| 快乐小羊 Happy Lamb Hot Pot | hotpot | 1411 156th Ave NE Ste A, 98007 | 🗣 Bellevue 老牌子，很早以前去过；听说现在也有自助，但最近越来越水（用 `⚠️` caution note）。AYCE 约 $32，happy hour 约 $27；生日免费 |
| Thai Ginger（Factoria） | southeast | 3717 Factoria Blvd SE, 98006 | 🗣 高中时吃过；推荐菜 Phase A 从官网菜单和小红书补；Factoria 附近还有很多吃的可以逛 |

**分类说明**：西塔老太太按你说的放韩餐。Woobling 也算韩式烤肉，放在 hotpot（火锅烤肉）还是 korean？我**默认放韩餐**，和西塔放在一起，hotpot 只放火锅类。→ 不同意可以告诉我。

## 6. Bellevue：你点名要加的 + 调研推荐（visited: false）

**你点名的**

| 店 | 分类 | 地址 | 备注 |
|---|---|---|---|
| 老码头火锅 Lao Ma Tou | hotpot | 288 106th Ave NE Ste 200（Soma Towers 2F）, 98004 | ✅ 参加了 2026 年 10 月的餐厅周 |
| 豆捞坊 The Dolar Shop | hotpot | ⚠️ 11111 NE 8th St（The Bravern）还是 11020 NE 6th St？ | Phase A 确认现在的地址 |
| 425 音乐串吧 Tasty Time | chinese（烤串） | 2217 140th Ave NE, 98005 | 烤串 + KTV 包厢（7 个主题房间）；营业到凌晨 2 点（各来源不一致） |
| 楠火锅 Nan Hotpot | hotpot | Crossroads, 15600 NE 8th St Ste O18, 98008 | 卤味、番茄锅、牛舌好评；Yelp 4.1 分 |
| 奈哥酸菜鱼 Nai Brother | chinese | 1299 156th Ave NE Ste 133, 98007 | 老坛酸菜鱼 |
| Shake Shack（Bellevue Square） | fastfood | 503 Bellevue Way NE, 98004（2024 年 6 月开业） | 和 Ave 那家用同样的推荐菜（见 §7） |

**调研推荐（第一轮，Phase A 会继续扩充）**
- 中餐：**九紫湘** Xiang House（15015 Main St Ste 107，糖油粑粑 / 糖饺子 🍬，红烧牛肉米粉，新上铁板烧）、**丹桂轩**（13112 NE 20th St Ste 300，新上湘菜：活水焖鱼、茶油炒土鸡、小炒肉，晚餐要订位）、**天府春秋**（12816 SE 38th St Unit K，Factoria，有骨辣子鸡，⚠️ 要核实还在营业）、**东方 Facing East**（1075 Bellevue Way NE，台湾菜老店；2026 年在 Brio 公寓新开了 downtown 分店，⚠️ 地址待补）
- 甜品奶茶：**和茶楼 HeChaLou**（1351 121st Ave NE，Spring District，2026 年 7 月开）、**吃茶三千 CHICHA San Chen**（⚠️ 位置要核实）、**LeTao**（The Bravern，北海道芝士蛋糕）
- 东南亚：**SUDA**（1020 108th Ave NE Ste 100，泰餐 + 酒吧，⚠️ 要确认已经开业）
- 西餐：**La Mar Cocina Peruana**（秘鲁菜，地址待补）
- 可能加：牡丹 Peony Modern Kitchen（小笼包）——Phase A 再决定

**即将开业卡片**：Wagyu House（AYCE 和牛烤肉，Lincoln Square North 2F，鼎泰丰旧址，2026 年底）、Sushi Tei（Bellevue Square 原 P.F. Chang's 的位置，延期、还没有新日期）、Indigo Cow + Machi Machi（Main Street Flats）、Nobu（2027 年）

**“附近逛吃”小贴士卡**（不放进地图，写成一张 note 卡）
- **Crossroads 美食街**：E+ Noodles、楠火锅，还有很多别的
- **Factoria**：Sushi Omiya、Thai Ginger、天府春秋；**T&T 大统华**（12620 SE 41st Pl，Marketplace at Factoria，有自助热食吧，8am–10pm）
- **百家超市 Asian Family Market** 旁边的小吃 ❓ 地址和具体店 → Phase A 查

**已关门（只写进免责声明）**：Great State Burger / King Leroy（Lincoln South Food Hall，2026 年 10 月）、Adrian's、Blazing Bagels、Jocovine

## 7. Ave 新增 5 家

| 店 | 分类 | 地址 | 卡片内容 |
|---|---|---|---|
| Ku Sushi and Izakaya | japanese | 5210 University Way NE, 98105 | 🗣 sushi rolls 5 折，味道不错；推荐 **Sunshine Roll**；你每次都点**天妇罗盖饭**；也有人点三文鱼 sashimi 盖饭，味道也不错。visited: true。⚠️ 5 折是不是全天都有（网上说常年有）→ Phase A 核实 |
| JOEY U-Village | western | 2603 NE 46th St, 98105 | 🗣 lobster spaghetti、truffle 面；人均偏高（两道菜约 $100），份量不大；氛围和服务都很好，但不是吃饱的好选择。visited: true，`⚠️ 价格偏高` |
| Shake Shack U-Village | fastfood | ⚠️ 2623 NE University Village St #7（mall 名录）vs 2580 —— 以官网为准 | 🗣 推荐 **'Shroom Burger**（炸波特菇夹拉丝芝士）和**牛油果汉堡**（Avocado Bacon Burger，Phase A 确认菜单上还有没有）；app 里有“满 $15 送薯条”的 offer（⚠️ 个人化优惠，可能不是人人都有，写成“最近”）。另外注明 Bellevue Square 也有一家 |
| Sakana Sushi & Kitchen | japanese | 1520 15th Ave, Seattle 98122（Capitol Hill） | ⚠️ 确认是这家；推荐菜 ❓ |
| Issian 石庵 | japanese | 1618 N 45th St, Seattle 98103（Wallingford） | 居酒屋 + 石板烤 + 寿司吧；⚠️ 要确认还在营业；推荐菜 ❓ |

Sakana 和 Issian 不在 Ave 上，照 Rondo / Tamari Bar 的写法：地址里注明区域，`region` 仍然是 ave。

## 8. 还需要你的地方

- Phase A 小红书**登录**（必须你自己来）。
- Sakana / Issian 是不是我找到的这两家？去过的话推荐菜是什么？
- 西塔和 Woobling 都放韩餐，可以吗（§5 说明）？
- 其他标 ⚠️ 的项，我会先在 Phase A 用小红书和 Yelp 核实；还查不到的，会在 `docs/bellevue-design.md` 里列出来给你。

## 9. 验证

- 直接用浏览器打开 `index.html`（用浏览器面板截图检查，控制台没有报错）：
  - Ave：卡片数量 = 47，和 header 一致；地图只显示 Ave 的店；JOEY 出现在“西餐”分类
  - 切到 Bellevue：只显示 Bellevue 的卡片和标记，地图自动缩放；分类计数正确；没有店的分类隐藏；hotpot / western 两个按钮正常
  - 打开 `#bellevue` 直接进入 Bellevue；刷新后还在 Bellevue；切换地区时保留当前的分类筛选
  - 抽查 5 个以上 Bellevue 的地址链接和地图弹窗的“导航”，确认 Google Maps 搜到的是正确的店
  - 手机宽度 375px 下没有横向滚动
- 跟你确认之后才 commit / push（push 到 main 会自动部署到 Vercel）。

---

## 10. 实现进度（2026-11-21）

- ✅ **Phase B 数据**：`js/restaurants.js` 新增 Ave 5 家（Ave 一共 47 家）和 Bellevue 28 家（`region: "bellevue"`）。坐标用 OpenStreetMap 按地址查的；没有重复的 id。
  - 顺便修正：Ave 页面 Tendon Kohaku 卡片原来写“东京开过来的”，改成“新加坡来的日式天妇罗丼专门店（美国首店在 Bellevue）”（来源 Seattle Met）。
  - 分类：西塔、Woobling → korean；沸点、海底捞、快乐小羊、老码头、豆捞坊、楠火锅 → hotpot；JOEY、La Mar → western。
- ✅ **Phase C 页面**：region 切换、hotpot / western 分类、计数自动计算、`#bellevue` 链接；“即将开业”、“附近逛吃”卡片和 Bellevue 决策指南都已经写好内容；免责声明里加上了 Bellevue 已关门的店。
- ⏸ **Phase A 小红书**：auto mode 的权限检查拦下了安装命令，需要你自己在终端运行（见下面），然后扫码登录小红书。之后我再扩充到 35–45 家，并核实下面这些项目。
- ✅ **Phase D**：CLAUDE.md 已经重写（注意：CLAUDE.md 在 `.gitignore` 里，只存在本地），README 加了 Bellevue 的说明。

### 还没核实 / 用了估计值的数据（小红书装好后优先查）

| 店 | 项目 |
|---|---|
| 所有调研推荐的店 | `price` 是按公开评价估的区间 |
| Sushi Omiya | 价位（你说参考 Google Maps） |
| 海底捞 | Happy hour AYCE 的具体时段和菜品（网上只找到 Meat O'Clock $19.99 和 31% off） |
| Thai Ginger | 推荐菜（现在写的是“炒河粉 / 咖喱 经典款”占位） |
| Ku Sushi | 5 折是不是全天 |
| Shake Shack UV | 地址 2623 还是 2580；牛油果汉堡现在是否还在菜单上 |
| Sakana / Issian | 是不是这两家；推荐菜 |
| 天府春秋 | 现在还在营业吗（OSM 上还有这家） |
| Facing East | downtown 新店的地址 |
| CHICHA San Chen、LeTao | 坐标是估的（Bellevue Square 和 Bravern 的位置） |
| 老码头、豆捞坊、楠火锅、奈哥、Tasty Time、La Mar | 推荐菜来自公开资料，还没对照小红书 |
| 西塔 | 营业时间有冲突 |
| 百家超市 Asian Family Market | 地址和旁边的店（还没写进去） |

## 11. 第二轮调研（2026-11-21，网页搜索）

小红书 CLI 已经装好（opencli 升级到 1.8.7，渠道也加上了），但你在 Agent Reach 窗口登录之后，搜索还是返回 `NEED_LOGIN`（`agent-reach check xiaohongshu`：0/1 actions working）。所以这一轮按你选的方案，用网页搜索来做：`site:xiaohongshu.com` 的公开笔记 + Dealmoon + Yelp + OpenTable + 本地新闻，每家店至少两个来源，并确认了地址。

**新增 10 家（Bellevue 一共 38 家）**：谷府 Baron's、牡丹 Peony、Dough Zone、Sum Yee Kae（原新瑞华）、西安味道 Bellevue、粤荣轩 Royal Kitchen、Top Gun 海鲜酒家、Minamoto、山头火 Santouka、UG Tea。

**修正**
- 新瑞华 Sun Sui Wah → 现在改名 **Sum Yee Kae**（同一个店面，菜单基本没变）
- 海底捞：Yelp 2026 年 11 月的信息是周一到周四 9pm 后、周五到周日 9:30pm 后有 Meat O'Clock $19.99 和 31% off。你说的 happy hour AYCE 保留了，时段也写上了
- Thai Ginger 推荐菜：Drunken Noodles、Pad See Ew、蟹肉炒饭、Ginger Prawns
- “附近逛吃”里的百家超市：14515 NE 20th St，同一个广场有西安味道和 Sum Yee Kae

**查过但没加（只有很旧的来源，或者没能确认 2026 年还在营业）**：I Love Sushi on Lake Bellevue、Gyu-Kaku Bellevue、Shabu Shabu Kyoto、江南 JiangNan（Seattle Met 说已关门）、Lazy Bread Club（快闪，没有固定店面）、Chamei Matcha
