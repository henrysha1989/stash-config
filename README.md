# stash-config

iOS / iPadOS / macOS 端 **Stash**（[stash.wiki](https://stash.wiki/)）的分流配置。

与 **mihomo 版** [clash-for-ios-config](https://github.com/henrysha1989/clash-for-ios-config) 同源：
规则顺序、规则集、策略组、DNS 分流思路都一样，只把内核独有的键换成 Stash 的写法。

> ⚠️ 本仓库**公开**，只放配置本身，**不含任何节点、订阅地址或凭据**。
> 节点请在客户端里用订阅导入，或在你本机的私有副本里填 —— **不要提交到本仓库**。

## 文件

| 文件 | 说明 |
|---|---|
| `config.yaml` | 主配置：DNS（fake-ip + follow-rule）+ 4 个策略组 + 42 条分流规则 + 7 个远程规则集 |
| `dns.stoverride` | 只改 DNS 的覆写文件，叠加在**任意**配置上（不碰规则、策略组、节点） |
| `rules.stoverride` | 只换规则的覆写文件：4 个策略组 + 7 个规则集 + 42 条规则，`rules` 整体替换 |

## 导入

Stash 里「配置 → 添加 → 从 URL 导入」，填：

```
https://raw.githubusercontent.com/henrysha1989/stash-config/main/config.yaml
```

国内网络拉 raw 容易超时，可套自建加速前缀（也能直接换成你自己的加速站）：

```
https://git.521989.xyz/https://raw.githubusercontent.com/henrysha1989/stash-config/main/config.yaml
```

> 加速站是个人自建，属于【个人定制区】；换环境时把它换回 raw 地址即可。

## 配置与节点分开管理

Stash 的**节点来源**（订阅 / 单节点 / 本地节点集）和**配置**是两条独立的管线：

1. 本仓库的 `config.yaml` 作为**配置**导入 —— 只提供分组与分流规则；
2. 节点在「节点来源」里单独挂，可以同时挂多个、逐个开关。

所以 `proxies` 保持空数组。分组能自动吃到挂上来的节点，是因为两组用了 `include-all: true`
（Stash 文档：`include-all` 引用所有 `proxies` 与 `proxy-providers`）。
加节点、换订阅、开关某个节点源，都不用动这个文件 —— 这也是它敢公开的原因。

⚠️ 没挂节点时配置也能启动，但 Stash 会把空组当 `DIRECT` 处理（文档原话），
**先挂好节点再开开关**，否则就是"以为在代理，其实在裸奔"。

## DNS

Stash 自己就是 DNS 解析器（没有 `tun` / `dns.listen` 这些键，隧道内查询由 App 接管），
所以配置只描述"问谁"和"怎么问"：

| 键 | 值 | 作用 |
|---|---|---|
| `default-nameserver` | `223.5.5.5` | bootstrap，只解析下面这些 DoH 的主机名；必须是纯 IP |
| `proxy-server-nameserver` | `https://223.5.5.5/dns-query` | 解析代理服务器域名，独立链路、不跟规则（3.6+） |
| `nameserver` | `1.1.1.1` / `8.8.8.8` DoH | 兜底解析器，境外域名 |
| `nameserver-policy` | `geosite:apple` / `+.icloud.com` / `geosite:cn` → 阿里 DoH | 苹果与国内域名固定国内解析 |
| `follow-rule` | `true` | **防泄漏的核心**：DNS 查询按代理规则转发 |

几点必须知道：

- **`follow-rule` 是这个仓库与 mihomo 版最关键的差异**。Stash 默认让 DNS 查询直接出站，
  不写它，`1.1.1.1` 的查询就从本地运营商线路裸奔出去（虽仍是加密 DoH，但解析器看到的是你的真实 IP，
  且国内网络下还可能被拒）。开启后这些查询命中 `MATCH → ST-节点选择`，经代理出去。
- 开启前提（Stash 文档）：DNS 服务器写成 IP、或代理地址是 IP、或配了 `proxy-server-nameserver`。
  本配置三条都满足，所以不会产生递归查询。
- 代价：境外域名的解析依赖节点可用；文档也提示可能影响 CDN 就近调度。国内/苹果域名已被 policy 摘出去。
- 想临时改用别的 DNS：别直接改订阅里的配置，写一个 `.stoverride` 覆写（数组记得加 `#!replace`，
  否则只会插到原数组前面）。示例见文末。

**验证方法**（比看 UI 靠谱）：Stash 的 HTTP API

```sh
curl 'http://<stash-ip>:<port>/dns/record'      # 看某条查询由哪个 server 回答、耗时多少
curl 'http://<stash-ip>:<port>/diagnosis/dns'   # 逐个测试配置里的 DNS 服务器
```

**不想换配置、只想改 DNS**：用仓库里的 `dns.stoverride` ——
设置 → 覆写 → 新建本地覆写 → 贴入内容 → 启用。它只覆盖 `dns:` 段，原配置的规则、策略组、
节点一概不动。注意 `nameserver` 带 `#!replace`（否则覆写数组只会插到原数组前面，旧服务器还在），
而 `nameserver-policy` 是字典按键合并，你原有的其它 policy 条目会保留。

**只想换规则**：用 `rules.stoverride`。它带上 4 个策略组（`include-all` 直接收机场的节点）和 7 个规则集，
`rules` 与 `proxy-groups` 都带 `#!replace` —— 机场自带的规则**和**策略组（Netflix / Disney+ / YouTube 那些分组）
会被整段替换掉，界面里只留这套 `ST-*` 组。想保留机场某些分组，就把它们的定义抄进来，或去掉 `proxy-groups` 的 `#!replace`。

策略组名统一带 `ST-` 前缀（`ST-节点选择` / `ST-手动选择` / `ST-自动选择` / `ST-国内直连`）。
原因：机场模板常用「节点选择 / 手动选择 / 自动选择 / 国内直连」，撞名会直接报
`stash core config parse failed: duplicate proxy name: 手动选择`。要换前缀就同时改组定义和 rules 里的引用。

## 与 clash-for-ios-config 的差异

| mihomo 版 | 本仓库 | 原因 |
|---|---|---|
| `dns.respect-rules: true` | `dns.follow-rule: true` | Stash 没有 `respect-rules` 这个键 |
| `dns.direct-nameserver` | 删除 | Stash 无此键；直连解析由 `nameserver-policy` 覆盖 |
| `tun` / `profile` / `sniffer` | 删除 | iOS 上隧道与嗅探由 App 接管，Stash 不读这些键 |
| `mixed-port` / `allow-lan` | 删除 | 端口与局域网代理在 App 设置里管 |
| `unified-delay` / `tcp-concurrent` / `find-process-mode` | 删除 | Stash 无对应键 |
| `geox-url` / `geo-auto-update` | 删除 | geo 数据由 Stash 自己维护与更新 |
| `dns.fake-ip-range6` | 删除 | Stash 无此键，IPv6 由 `ipv6` 总开关控制 |
| `GEOSITE,apple@cn` | `GEOSITE,apple` | geosite 属性语法未见于 Stash 文档 |
| `exclude-filter`（公告节点过滤） | 保留但**可能被忽略** | Stash 文档只列了 `filter`；若公告节点仍出现，到「节点来源」里关掉即可 |

## 规则顺序（命中即停）

1. HttpDNS 拦截 → 2. WebRTC 截断（按域名）→ 3. 内网/本机/自建 → 4. 国内专项（苹果/钉钉/公司系统）
→ 5. 广告拦截 → 6. 国内娱乐分类 → 7. 泄漏测试工具 → 7b. QUIC 强切 TCP
→ 8. 海外专项 → 9. 国内兜底 → 10. `MATCH,ST-节点选择`

两个容易踩的点，已经在注释里写死：

- **广告表必须排在 `GEOSITE,CN` 之前**，否则国内兜底会先把 CN 广告域放走；
  同时又要在自建直连表之后，避免误拦自家域和公司系统。
- **QUIC 规则的国内豁免用 `GEOIP,CN` 而不是域名**：钉钉自己走 DoH，域名还原不出来。

## 个人定制区

换环境时整段删掉或替换：

- 加速前缀 `git.521989.xyz`（规则集、导入地址）
- 自建域名 `521989.xyz`
- 公司域名 `megarobo.com` / `.tech` / `.info`（在自建直连表里，见下一节）

## 规则表在哪维护

真正的名单**不在本仓库**，而是 [shadowrocket-adr-rules](https://github.com/henrysha1989/shadowrocket-adr-rules)
的 `clash-ios` 分支：

- `mihomo/bytedance-ad.list`、`soul-ad.list`、`reject-custom.list` —— 拦截
- `mihomo/direct-custom.list` —— 直连

本仓库与 mihomo 版引用的是同一份文件，改表两端同时生效。

## 覆写示例（改 DNS 而不动本配置）

```yaml
# my-dns.stoverride
name: DNS 自定义
dns:
  nameserver: #!replace
    - https://223.5.5.5/dns-query
```

放到 Stash 的「覆写」里启用即可；多个覆写按列表从上到下依次覆盖。
