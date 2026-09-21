// homeinns_cookie_capture.js
// 用途：拦截请求，提取并保存 Cookie 和 CSRF Token，每次触发都弹窗反馈

const STORE_KEY = "homeinns_cookie";

function main() {
// 1. 获取当前请求信息
const headers = $request.headers || {};
const url = $request.url || "";

// 2. 提取关键参数
const rawCookie = headers["Cookie"] || headers["cookie"] || "";
const csrfToken = headers["x-csrf-token"] || "";
const xTingyun = headers["x-tingyun"] || "";
const userAgent = headers["user-agent"] || "";
const referer = headers["referer"] || "";

console.log(`[Homeinns Capture] 捕获到请求: ${url}`);
console.log(`[Homeinns Capture] Cookie 长度: ${rawCookie.length}`);
console.log(`[Homeinns Capture] CSRF Token 长度: ${csrfToken.length}`);
console.log(`[Homeinns Capture] x-tingyun 长度: ${xTingyun.length}`);

// 3. 校验必要参数
if (!rawCookie) {
    console.log("[Homeinns Capture] Cookie 为空，跳过");
    $notification.post("⚠️ 首旅如家捕获提醒", "Cookie 为空", "请确保已登录并触发签到请求");
    $done({});
    return;
}

if (!csrfToken) {
    console.log("[Homeinns Capture] x-csrf-token 为空，跳过");
    $notification.post("⚠️ 首旅如家捕获提醒", "CSRF Token 为空", "请确保请求包含完整的请求头");
    $done({});
    return;
}

// 4. 构造存储数据（JSON 格式）
const captureData = {
    cookie: rawCookie,
    x_csrf_token: csrfToken,
    x_tingyun: xTingyun,
    user_agent: userAgent,
    referer: referer,
    captured_at: new Date().toLocaleString()
};

// 5. 写入持久化存储
$persistentStore.write(JSON.stringify(captureData), STORE_KEY);
console.log("[Homeinns Capture] 凭证已存入存储");

// 6. 弹窗反馈
$notification.post(
    "✅ 首旅如家 Cookie 捕获成功",
    `时间: ${captureData.captured_at}`,
    `Cookie 长度: ${rawCookie.length}\nCSRF Token: ${csrfToken.substring(0, 30)}...`
);

$done({});
}

main();
