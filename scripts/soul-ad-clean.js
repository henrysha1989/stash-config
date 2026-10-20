// Soul 去广告（精简移植版）
//
// 来源：fmz200/wool_scripts — Scripts/soul/soul_ads.js（2024-06-13，作者 fmz200，引用 ZenmoFeiShi）
//       https://github.com/fmz200/wool_scripts/blob/main/Scripts/soul/soul_ads.js
//
// 本次移植做的裁剪：
//   1) 去掉 `$.Env` 框架（15 KB 里的 12 KB 是框架，只用到 $done）
//   2) **去掉 `/chat/limitInfo` 的 limit=false** —— 那是解锁付费能力，不属于去广告
//   3) 去掉无实际逻辑的空分支（chatroom 清空、recSquare 过滤，原版已注释）
//   4) 保留：广告/推广配置的 data 清空、游戏推广卡片过滤、卡片样式归一
//
// 适用端点（见 soul.stoverride 的 http.script 列表）；
// 每个都要求返回体是 JSON，解析失败时原样放行。

const url = $request.url || '';
const body = ($response && $response.body) || '{}';

let obj;
try {
  obj = JSON.parse(body);
} catch (e) {
  $done({}); // 不是 JSON，不动
}

// 广告 / 推广配置类：把 data 清空（原版是 delete data，这里给 {} 保持结构）
const CLEAR_DATA = [
  '/post/homepage/guide/card',
  '/furion/position/content',
  '/hot/soul/rank',
  '/post/gift/list',
  '/mobile/app/version/queryIos',
  '/teenager/config',
  '/winterfell/v2/getIpByDomain',
  '/official/scene/module'
];

// 星球页里要剔除的推广卡片
const GAMES = ['异世界回响', '狼人魅影', '梦想海岛王', '幻想星球', '爆弹喵', '星球实验室', '兴趣群组', '群聊派对'];

if (obj && typeof obj === 'object') {
  if (obj.data && CLEAR_DATA.some((p) => url.indexOf(p) >= 0)) {
    obj.data = {};
  }

  if (url.indexOf('/v6/planet/config') >= 0 && obj.data) {
    if (obj.data.gameInfo && Array.isArray(obj.data.gameInfo.gameCards)) {
      obj.data.gameInfo.gameCards = obj.data.gameInfo.gameCards.filter((c) => GAMES.indexOf(c.title) < 0);
    }
    if (Array.isArray(obj.data.coreCards)) {
      obj.data.coreCards = obj.data.coreCards
        .filter((c) => GAMES.indexOf(c.title) < 0)
        .map((c) => {
          if (Array.isArray(c.secondCards)) {
            c.secondCards = c.secondCards.filter((s) => GAMES.indexOf(s.title) < 0);
          }
          return c;
        });
    }
  }

  if (obj.data && Array.isArray(obj.data.coreCards)) {
    obj.data.coreCards.forEach((c) => {
      if (c.style === 2) c.style = 1;
    });
  }
}

$done({ body: JSON.stringify(obj) });
