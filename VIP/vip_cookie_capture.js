// vip_signin_capture.js
// 类型: http-request
// 用途: 拦截唯品会签到请求，提取 Cookie、Authorization 等凭证，存入持久化存储

const STORE_KEY = "vip_signin_cookie";

function main() {
  // 1. 获取请求信息
  const headers = $request.headers || {};
  const body = $request.body || "";
  const url = $request.url || "";

  // 2. 只拦截签到相关请求
  if (!url.includes("signIn")) {
    console.log("[VIP-Capture] 非签到请求，跳过: " + url);
    $done({});
    return;
  }

  // 3. 提取关键参数
  const rawCookie = headers["Cookie"] || headers["cookie"] || "";
  const authorization = headers["authorization"] || headers["Authorization"] || "";
  const referer = headers["referer"] || headers["Referer"] || "";
  const userAgent = headers["user-agent"] || headers["User-Agent"] || "";

  // 从 body 中提取动态参数
  const mars_cid_match = body.match(/mars_cid=([^&]+)/);
  const tfs_fp_token_match = body.match(/tfs_fp_token=([^&]+)/);
  const mars_cid = mars_cid_match ? decodeURIComponent(mars_cid_match[1]) : "";
  const tfs_fp_token = tfs_fp_token_match ? decodeURIComponent(tfs_fp_token_match[1]) : "";

  // 从 cookie 中提取关键参数
  const vip_sec_fp_vid_match = rawCookie.match(/vip_sec_fp_vid=([^;]+)/);
  const vip_sec_fp_vvid_match = rawCookie.match(/vip_sec_fp_vvid=([^;]+)/);
  const vip_sec_fp_wtk_match = rawCookie.match(/vip_sec_fp_wtk=([^;]+)/);
  const vip_sec_fp_smtoken_match = rawCookie.match(/vip_sec_fp_smtoken=([^;]+)/);

  const vip_sec_fp_vid = vip_sec_fp_vid_match ? vip_sec_fp_vid_match[1] : "";
  const vip_sec_fp_vvid = vip_sec_fp_vvid_match ? vip_sec_fp_vvid_match[1] : "";
  const vip_sec_fp_wtk = vip_sec_fp_wtk_match ? vip_sec_fp_wtk_match[1] : "";
  const vip_sec_fp_smtoken = vip_sec_fp_smtoken_match ? vip_sec_fp_smtoken_match[1] : "";

  console.log("[VIP-Capture] 拦截到签到请求: " + url);
  console.log("[VIP-Capture] Cookie 长度: " + rawCookie.length);
  console.log("[VIP-Capture] Authorization: " + (authorization ? authorization.substring(0, 50) + "..." : "未获取"));
  console.log("[VIP-Capture] mars_cid: " + (mars_cid ? "已获取" : "未获取"));
  console.log("[VIP-Capture] tfs_fp_token: " + (tfs_fp_token ? "已获取" : "未获取"));

  // 4. 校验必要参数
  if (!rawCookie || rawCookie.length === 0) {  // ✅ 改成 rawCookie
    console.log("[VIP-Capture] Cookie 为空，跳过（预检请求）");
    // 不弹窗，直接静默退出
    $done({});
    return;
  }

  if (!authorization) {
    console.log("[VIP-Capture] Authorization 为空，跳过");
    $notification.post("⚠️ 唯品会", "Authorization 为空", "请确认已登录并触发签到请求");
    $done({});
    return;
  }

  // 5. 构造存储数据
  const captureData = {
    cookie: rawCookie,
    authorization: authorization,
    mars_cid: mars_cid,
    tfs_fp_token: tfs_fp_token,
    vip_sec_fp_vid: vip_sec_fp_vid,
    vip_sec_fp_vvid: vip_sec_fp_vvid,
    vip_sec_fp_wtk: vip_sec_fp_wtk,
    vip_sec_fp_smtoken: vip_sec_fp_smtoken,
    captured_at: new Date().toISOString()
  };

  // 6. 写入持久化存储
  $persistentStore.write(JSON.stringify(captureData), STORE_KEY);

  console.log("[VIP-Capture] 凭证已保存到 " + STORE_KEY);

  // 7. 弹窗提醒
  $notification.post(
    "✅ 唯品会签到凭证捕获成功",
    "时间: " + new Date().toLocaleTimeString(),
    "Cookie: " + (rawCookie ? "已获取(" + rawCookie.length + "字符)" : "未获取") +
    "\nAuthorization: " + (authorization ? "已获取" : "未获取") +
    "\nmars_cid: " + (mars_cid ? "已获取" : "未获取") +
    "\ntfs_fp_token: " + (tfs_fp_token ? "已获取" : "未获取")
  );

  $done({});
}

main();

