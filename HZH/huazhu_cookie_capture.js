/**
 * huazhu_cookie_capture.js
 * 华住会 Cookie 捕获脚本（Loon http-request 类型）
 *
 * 原理：手机打开华住会 App 进入「签到」页面时，App 会请求
 *       https://appgw.huazhu.com/game/sign_header，该请求头携带完整登录 Cookie，
 *       本脚本将其捕获并写入 Loon 持久化存储，供 huazhu_signin.js 定时签到使用。
 *
 * 使用方式：随 HZH/huazhu.plugin 插件安装即可（插件内含 URL 匹配与 MITM 配置）。
 * 注意：需在 Loon 中安装并信任 CA 证书、开启 MITM，否则拿不到请求头。
 */

const STORE_KEY = "huazhu_cookie"; // 与 huazhu_signin.js 保持一致
const NOTIFY_TITLE = "华住会 Cookie";

function main() {
  // 双保险：仅处理签到页接口，并排除 CORS 预检请求
  const url = ($request && $request.url) || "";
  const method = (($request && $request.method) || "").toUpperCase();
  if (!url.match(/game\/sign_header/) || method === "OPTIONS") {
    $done({});
    return;
  }

  // 提取完整 Cookie（不做字段白名单裁剪，避免遗漏签到接口所需的登录态）
  const rawCookie =
    $request.headers["Cookie"] || $request.headers["cookie"] || "";
  if (!rawCookie) {
    console.log("[华住会] 请求中未携带 Cookie，跳过");
    $done({});
    return;
  }

  // 与上次保存内容比对，仅在发生变化时写入并弹窗，避免重复打扰
  const prev = $persistentStore.read(STORE_KEY) || "";
  if (prev === rawCookie) {
    console.log("[华住会] Cookie 无变化，跳过写入");
    $done({});
    return;
  }

  const ok = $persistentStore.write(rawCookie, STORE_KEY);
  console.log(
    `[华住会] Cookie ${ok ? "写入成功" : "写入失败"}（长度 ${rawCookie.length}）`
  );

  $notification.post(
    `✅ 华住会 Cookie ${prev ? "已更新" : "捕获成功"}`,
    `时间：${new Date().toLocaleString()}`,
    ok ? "签到凭证已就绪，等待每日自动签到" : "写入失败，请查看 Loon 日志"
  );

  $done({});
}

main();
