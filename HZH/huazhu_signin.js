/**
 * huazhu_signin.js
 * 华住会自动签到脚本（Loon cron 类型）
 *
 * 前置条件：先随插件安装 huazhu_cookie_capture.js，打开华住会 App 签到页完成 Cookie 捕获。
 *
 * 接口与返回结构参考社区公开实现（evilbutcher/QuantumultX -> check_in/hzh/hzh.js）：
 *   GET https://appgw.huazhu.com/game/sign_in?date=<秒级时间戳>
 *   返回 { message: "fail" | ..., content: { signResult, point, awardMap } }
 * 如华住后续调整接口导致签到失效，请重新抓包核对 URL 与返回结构。
 */

const STORE_KEY = "huazhu_cookie"; // Cookie 存储 key，与捕获脚本保持一致
const DONE_KEY = "huazhu_last_signin_date"; // 当日防重复标记
const NOTIFY_TITLE = "华住会签到";

const SIGN_HEADERS = {
  Connection: "keep-alive",
  "Accept-Encoding": "gzip, deflate, br",
  "Client-Platform": "APP-IOS",
  Origin: "https://cdn.huazhu.com",
  "User-Agent": "HUAZHU/ios/iPhone/18.0/9.24.0/RNWEBVIEW",
  Referer: "https://cdn.huazhu.com/",
  "Accept-Language": "zh-CN,zh-Hans;q=0.9",
  Accept: "application/json, text/plain, */*"
};

function todayStr() {
  const d = new Date();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${d.getFullYear()}-${m}-${day}`;
}

function notify(subtitle, content) {
  $notification.post(NOTIFY_TITLE, subtitle, content);
}

function checkin() {
  const cookie = $persistentStore.read(STORE_KEY);
  if (!cookie) {
    notify(
      "❌ Cookie 缺失",
      "请先打开华住会 App 签到页，触发 Cookie 自动捕获后重试"
    );
    $done({});
    return;
  }

  // 当日已签到过则直接跳过，避免 cron/手动重复触发时反复请求
  if ($persistentStore.read(DONE_KEY) === todayStr()) {
    console.log("[华住会] 今日已签到，跳过本次执行");
    $done({});
    return;
  }

  const request = {
    url: `https://appgw.huazhu.com/game/sign_in?date=${parseInt(
      Date.now() / 1000,
      10
    )}`,
    headers: Object.assign({}, SIGN_HEADERS, { Cookie: cookie }),
    timeout: 10000
  };

  $httpClient.get(request, (error, response, body) => {
    if (error) {
      notify("❌ 网络异常", String(error));
      $done({});
      return;
    }

    const statusCode = Number(
      (response && (response.status || response.statusCode)) || 0
    );
    if (statusCode !== 200) {
      notify("❌ 签到失败", `HTTP ${statusCode}，请稍后重试或核对接口是否变更`);
      $done({});
      return;
    }

    try {
      const data = JSON.parse(body);

      if (data.message === "fail") {
        notify(
          "❌ Cookie 可能已失效",
          "服务器返回数据错误，请打开华住会 App 签到页重新捕获 Cookie"
        );
        $done({});
        return;
      }

      const content = data.content || {};
      if (content.signResult === true) {
        const awardMap = content.awardMap;
        let awardNames = "";
        if (awardMap && awardMap.award && Array.isArray(awardMap.award)) {
          awardNames = awardMap.award
            .map((item) => item.awardName)
            .filter(Boolean)
            .join("、");
        }
        notify(
          "🎉 签到成功",
          `获得 ${content.point} 积分${awardNames ? `、${awardNames}` : ""}！`
        );
      } else {
        notify("🎉 今日已签到", "无需重复签到");
      }
      $persistentStore.write(todayStr(), DONE_KEY);
    } catch (e) {
      notify("❌ 返回解析异常", body ? body.substring(0, 200) : "响应体为空");
    }

    $done({});
  });
}

checkin();
