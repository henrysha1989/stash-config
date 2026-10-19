// 探探开屏广告配置改写（Stash / Surge 脚本）
//
// 目标接口：POST https://core.tantanapp.com/v2/ad/configuration
// 原始响应（2026-10-20 抓包，435 B）：
//   {"data":{"adConfiguration":{"adSplash":{
//     "coldStart":{"selectMethod":"bidding","sdkConfig":{"gdt":{"placementId":"6019582857899966","basePrice":100},"momo":{"placementId":"","basePrice":0}}},
//     "hotStart":{"selectMethod":"bidding","sdkConfig":{"gdt":{"placementId":"5029488867197998","basePrice":100}}},
//     "ext":{"shakeWeakenSwitch":false,...}}}},"meta":{"code":200,"message":"OK"}}
//
// 做法：保留结构，清空 GDT / 陌陌的 placementId（没有广告位就没得竞价），
// 比直接 reject-dict 回 "{}" 更安全 —— App 拿不到合法结构时可能回退到内置默认配置。
//
// 注意：selectMethod 保留 "bidding"（已知合法枚举），不改成 "none"，避免未知枚举导致解析失败。
const body = {
  data: {
    adConfiguration: {
      adSplash: {
        coldStart: {
          selectMethod: 'bidding',
          sdkConfig: {
            gdt: { placementId: '', basePrice: 0 },
            momo: { placementId: '', basePrice: 0 }
          }
        },
        hotStart: {
          selectMethod: 'bidding',
          sdkConfig: {
            gdt: { placementId: '', basePrice: 0 },
            momo: { placementId: '', basePrice: 0 }
          }
        },
        ext: { shakeWeakenSwitch: false, degree: 0, interval: 0 }
      }
    }
  },
  meta: { code: 200, message: 'OK' }
};

$done({ body: JSON.stringify(body) });
