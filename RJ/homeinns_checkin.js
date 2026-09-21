// homeinns_checkin.js - v3（精准错误处理 + 过期检测 + 自动续期）
// 用途：从存储读取凭证，执行首旅如家自动签到

const STORE_KEY = "homeinns_cookie";

function main() {
// 1. 读取存储
const raw = $persistentStore.read(STORE_KEY);
if (!raw) {
    $notification.post("❌ 首旅如家签到失败", "未找到凭证", "请先运行捕获脚本捕获 Cookie 和 Token");
    $done({});
    return;
}

let data;
try {
    data = JSON.parse(raw);
} catch (e) {
    data = { cookie: raw, x_csrf_token: "", x_tingyun: "" };
}

const cookie = data.cookie || "";
const csrfToken = data.x_csrf_token || "";
const xTingyun = data.x_tingyun || "";
const userAgent = data.user_agent || "Mozilla/5.0 (iPhone; CPU iPhone OS 18_7 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Homeinns-App-iOS-11.13.0";
const referer = data.referer || "https://idea.homeinns.com/event/task_center_v2/home?client_info=ios";

// 2. 校验凭证
if (!cookie) {
    $notification.post("❌ 首旅如家签到失败", "Cookie 缺失", "请重新捕获凭证");
    $done({});
    return;
}

if (!csrfToken) {
    $notification.post("❌ 首旅如家签到失败", "CSRF Token 缺失", "请重新捕获凭证");
    $done({});
    return;
}

// 3. 构造签到请求
const headers = {
    "Content-Type": "application/json",
    "Accept": "application/json, text/javascript, */*; q=0.01",
    "Origin": "https://idea.homeinns.com",
    "x-csrf-token": csrfToken,
    "x-tingyun": xTingyun,
    "sec-fetch-mode": "cors",
    "User-Agent": userAgent,
    "Referer": referer,
    "sec-fetch-dest": "empty",
    "x-requested-with": "XMLHttpRequest",
    "accept-language": "zh-CN,zh-Hans;q=0.9",
    "priority": "u=3, i",
    "accept-encoding": "gzip, deflate, br, zstd",
    "Cookie": cookie
};

console.log(`[Homeinns Checkin] Cookie: ${cookie}`);
console.log(`[Homeinns Checkin] CSRF: ${csrfToken}`);
console.log(`[Homeinns Checkin] Referer: ${referer}`);

// 4. 发送签到请求
$httpClient.post({
    url: "https://idea.homeinns.com/event/check_in/home",
    headers: headers,
    body: "{}"
}, (error, response, body) => {
    if (error) {
        console.log(`[Homeinns Checkin] 请求错误: ${error}`);
        $notification.post("❌ 首旅如家签到失败", "网络请求失败", error);
        $done({});
        return;
    }

    // 调试日志
    console.log(`[Homeinns Checkin] Status: ${response.status}`);
    console.log(`[Homeinns Checkin] Headers: ${JSON.stringify(response.headers)}`);
    console.log(`[Homeinns Checkin] Body: ${body}`);

    // ===== 过期检测（方案一）=====

    // 情况1：HTTP 状态码 302/401，说明被重定向或未授权
    if (response.status === 302 || response.status === 401) {
        $notification.post("⚠️ Cookie 已过期", "请打开首旅如家 App", "进入签到页即可自动触发捕获脚本更新凭证");
        $done({});
        return;
    }

    // 情况2：响应不是 JSON（被重定向到登录页 HTML）
    if (!body.startsWith("{")) {
        if (body.includes("登录") || body.includes("login") || body.includes("wx.bthhotels") || body.includes("bthhotels")) {
            $notification.post("⚠️ Cookie 已过期", "请打开首旅如家 App", "进入签到页即可自动触发捕获脚本更新凭证");
        } else {
            $notification.post("❌ 签到异常", "响应格式异常", body.substring(0, 200));
        }
        $done({});
        return;
    }

    try {
        const res = JSON.parse(body);

        // ===== 精准业务错误处理 =====
        if (res.result_code !== 0) {
            const errMsg = res.message || res.errorMsg || res.error_msg || res.msg || res.result || "未知错误";
            
            // 判断是否为"今天已签到"的情况
            if (body.includes("已签到") || errMsg.includes("已签到") || res.result_code === 2001) {
                console.log("[Homeinns Checkin] 今日已签到，无需重复签到");
                $notification.post("首旅如家", "今日已签到", "明天再来获取奖励吧");
                $done({});
                return;
            }

            // 判断是否为 Cookie/Token 过期
            if (errMsg.includes("登录") || errMsg.includes("过期") || errMsg.includes("未授权") || errMsg.includes("token")) {
                $notification.post("⚠️ Cookie 已过期", "请打开首旅如家 App", "进入签到页即可自动触发捕获脚本更新凭证");
                $done({});
                return;
            }

            // 其他业务错误
            $notification.post("❌ 首旅如家签到失败", errMsg, `result_code: ${res.result_code}\n响应: ${body.substring(0, 200)}`);
            $done({});
            return;
        }

        // ===== 签到成功，提取奖励信息 =====
        let rewardText = "";

        // 优先从 prizes 数组提取
        if (res.data && res.data.prizes && res.data.prizes.length > 0) {
            const prize = res.data.prizes[0];
            const beanInfo = prize.beanReward || {};
            rewardText = `${beanInfo.totalBean || 0}如愿豆`;

            // 如果有额外描述也加上
            if (prize.rewardDesc) {
                rewardText = prize.rewardDesc;
            }
        } else {
            // 降级：尝试旧路径
            rewardText = res.data?.reward ||
                         res.data?.beans ||
                         res.data?.points ||
                         res.data?.score ||
                         res.data?.reward_desc ||
                         "";
        }

        const message = res.result || res.message || res.msg || "签到成功";
        const runDays = res.data?.running_days ? `连续签到: ${res.data.running_days}天` : "";

        // ===== 自动续期（方案二）=====
        const setCookie = response.headers['set-cookie'] || response.headers['Set-Cookie'];
        if (setCookie) {
            try {
                const newCookieStr = Array.isArray(setCookie) ? setCookie.join('; ') : setCookie;
                console.log(`[Homeinns Checkin] Set-Cookie: ${newCookieStr}`);

                const sessionMatch = newCookieStr.match(/_rujia-expand_session=[^;]+/);
                const nscMatch = newCookieStr.match(/NSC_WJQ[^;]+/);

                if (sessionMatch || nscMatch) {
                    let updatedCookie = cookie;
                    if (sessionMatch) {
                        updatedCookie = updatedCookie.replace(/_rujia-expand_session=[^;]+/, sessionMatch[0]);
                    }
                    if (nscMatch) {
                        updatedCookie = updatedCookie.replace(/NSC_WJQ[^;]+/, nscMatch[0]);
                    }
                    data.cookie = updatedCookie;
                    $persistentStore.write(JSON.stringify(data), STORE_KEY);
                    console.log("[Homeinns Checkin] Cookie 已自动更新");
                }
            } catch (e) {
                console.log(`[Homeinns Checkin] Cookie 更新失败: ${e}`);
            }
        }

        $notification.post("✅ 首旅如家签到成功",
            `${message}\n奖励: ${rewardText}\n${runDays}`,
            ""
        );

    } catch (e) {
        console.log(`[Homeinns Checkin] 解析失败: ${e}`);
        // JSON 解析失败兜底
        if (body.includes("登录") || body.includes("login") || body.includes("wx.bthhotels")) {
            $notification.post("⚠️ Cookie 已过期", "请打开首旅如家 App", "进入签到页即可自动触发捕获脚本更新凭证");
        } else {
            $notification.post("❌ 签到异常", "响应解析失败", body.substring(0, 300));
        }
    }

    $done({});
});
}

main();
