// 什么值得买 Cookie + Body 捕获脚本
// 类型：http-request
// 表达式：^https://user-api\.smzdm\.com/checkin$

const url = $request.url;
const headers = $request.headers;

// 获取 Cookie
let cookie = headers["Cookie"] || headers["cookie"] || "";
if (!cookie && $request.cookie) cookie = $request.cookie;

// 获取 Body
let body = $request.body || "";

console.log(`[SMZDM-Capture] URL: ${url}`);
console.log(`[SMZDM-Capture] Cookie长度: ${cookie.length}`);
console.log(`[SMZDM-Capture] Body: ${body}`);

// 保存
if (cookie) $persistentStore.write(cookie, "smzdm_cookie");
if (body) $persistentStore.write(body, "smzdm_body");

$notification.post("什么值得买捕获", "已保存", `Cookie:${cookie.length} Body:${body.length}`);
$done({});