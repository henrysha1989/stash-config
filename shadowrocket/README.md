# Shadowrocket 版：路径级去广告模块

本目录放 **Shadowrocket 专用**的模块文件，与仓库根目录的 Stash 覆写一一对应。

| 文件 | 对应 Stash 覆写 | 内容 |
|---|---|---|
| `path-ads.module` | `momo` / `soul` / `tantan` / `amap.stoverride` | 域名 REJECT + URL 改写 + 响应脚本 |

## 安装

Shadowrocket →「配置」→ 点当前配置旁的小图标 →「模块」→ 右上角「+」→ 粘贴：

```
https://git.521989.xyz/https://raw.githubusercontent.com/henrysha1989/stash-config/main/shadowrocket/path-ads.module
```

国内直连 raw 大概率超时，所以上面用的是自建加速前缀；不想用加速站就把 `https://git.521989.xyz/` 去掉。

装完在模块列表里确认是**启用**状态，然后断开重连一次 Shadowrocket。

## 前提

1. **要开 HTTPS 解密**：Shadowrocket →「设置」→「HTTPS 解密」，生成并安装证书，
   再到 iOS「设置 → 通用 → 关于本机 → 证书信任设置」里打开信任。
   不开这一层，`[URL Rewrite]` 和 `[Script]` 全部不生效，只剩 `[Rule]` 的域名拦截。
2. **脚本走仓库 URL**（`scripts/tantan-ad-config.js`、`scripts/soul-ad-clean.js`），
   和 Stash 版内联的是同一份逻辑，改一处两边同步。
3. 模块用的是 `%APPEND%`，不会覆盖你自己的 MITM 主机列表。

## 已知边界

- **探探**：开屏广告由阿里妈妈（`momo_cpt` 创意）下发，实测四层拦截都拦不干净，
  模块里保留规则但**别指望有效**。
- **闲鱼**：阿里 amdc 走硬编码 IP，没有任何可拦的域名/路径，本模块不含闲鱼。
- **高德**：路径规则有效，但会解密 `m5.amap.com` 等主 API；出问题先禁用模块。

## 与 Stash 版的差异

| 项 | Stash | Shadowrocket |
|---|---|---|
| 覆写机制 | `.stoverride` + `#!replace` | 无，规则直接合并进模块 |
| 脚本 | `payload` 内联 / provider | `[Script]` 的 `script-path` 远程引用 |
| 改写动作 | `reject` / `reject-dict` | 同名动作，语义一致 |
| 组名冲突 | 需加 `ST-` 前缀避免撞名 | 模块不改策略组，无此问题 |
