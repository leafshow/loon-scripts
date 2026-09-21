// vip_signin.js
// 类型: cron
// 用途: 读取存储的凭证，执行唯品会自动签到

const STORE_KEY = "vip_signin_cookie";

function main() {
  try {
    // 1. 从持久化存储读取凭证
    const raw = $persistentStore.read(STORE_KEY);
    if (!raw) {
      $notification.post("❌ 唯品会签到", "未找到凭证", "请先运行捕获脚本捕获 Cookie 和 Authorization");
      $done();
      return;
    }

    let data;
    try {
      data = JSON.parse(raw);
    } catch (e) {
      data = {
        cookie: raw,
        authorization: "",
        mars_cid: "",
        tfs_fp_token: "",
        vip_sec_fp_vid: "",
        vip_sec_fp_vvid: "",
        vip_sec_fp_wtk: "",
        vip_sec_fp_smtoken: ""
      };
    }

    const cookie = data.cookie || "";
    const authorization = data.authorization || "";
    const mars_cid = data.mars_cid || "1789972776320_f8b9cd9c5a0cf62575febd41396c70fa";
    const tfs_fp_token = data.tfs_fp_token || "cwEAAzBqMe5ovOydj9V4wACQx5ZNSSWrlrmmOY5ok9rwUmOHTiM_88rXEwTYEBhnx0uBP9oS7Y3ovUSfwbbHiOmGOvNDGeI";
    const vip_sec_fp_vid = data.vip_sec_fp_vid || "101623694";
    const vip_sec_fp_vvid = data.vip_sec_fp_vvid || "YzllN2E2ZTctMzM4MS00MTE4LTkwZDAtNGNjMDZlZjJlODhiMTc4OTk3Mjc3Njk4OQL1qA0=";
    const vip_sec_fp_wtk = data.vip_sec_fp_wtk || "cwEAAzBqMe5ovOydj9V4wACQx5ZNSSWrlrmmOY5ok9rwUmOHTiM_88rXEwTYEBhnx0uBP9oS7Y3ovUSfwbbHiOmGOvNDGeI";
    const vip_sec_fp_smtoken = data.vip_sec_fp_smtoken || "BknDx1pCP2/+FCIplQF9BQATCAwzElZl9d4XDbRRq7OyEmWffX6LGS1jxDXFIOKlrV8Rm3w01fMMSo55Q4RuQww==";

    // 2. 校验必要参数
    if (!cookie) {
      $notification.post("❌ 唯品会签到", "Cookie 为空", "请重新捕获凭证");
      $done();
      return;
    }

    if (!authorization) {
      $notification.post("❌ 唯品会签到", "Authorization 为空", "请重新捕获凭证（Authorization 是动态的）");
      $done();
      return;
    }

    console.log("[VIP-Signin] 开始签到...");
    console.log("[VIP-Signin] Cookie 长度: " + cookie.length);
    console.log("[VIP-Signin] Authorization: " + authorization);

    // 3. 构造请求头
    const headers = {
      "Content-Type": "application/x-www-form-urlencoded; charset=UTF-8",
      "Accept": "*/*",
      "sec-fetch-site": "same-site",
      "origin": "https://mst.vip.com",
      "sec-fetch-mode": "cors",
      "user-agent": "Mozilla/5.0 (iPhone; CPU iPhone OS 26_5_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) EdgiOS/153.0.4234.46 Version/26.0 Mobile/15E148 Safari/604.1",
      "referer": "https://mst.vip.com/",
      "sec-fetch-dest": "empty",
      "authorization": authorization,
      "accept-language": "zh-CN,zh-Hans;q=0.9",
      "priority": "u=3, i",
      "accept-encoding": "gzip, deflate, br, zstd",
      "Cookie": cookie
    };

    // 4. 构造请求体
    const body = "source_app=shop_wap&client_type=wap&app_name=shop_wap&client=wap&api_key=8cec5243ade04ed3a02c5972bcda0d3f&app_version=1.0&mobile_platform=2&mobile_channel=nature&mars_cid=" + encodeURIComponent(mars_cid) + "&warehouse=VIP_NH&fdc_area_id=101101101&province_id=101101101&wap_consumer=C2-1-2&bussCode=app_sign_in&openid=&entranceParam=syicon0611&youngType=0&sceneCode=0&time=0&is_front=1&app_theme_mode=0&app_theme_action=0&tfs_fp_token=" + encodeURIComponent(tfs_fp_token);

    // 5. 发送签到请求
    $httpClient.post({
      url: "https://act-ug.vip.com/signIn/info?api_key=8cec5243ade04ed3a02c5972bcda0d3f&time=0&is_front=1&fdc_area_id=101101101",
      headers: headers,
      body: body
    }, (error, response, body) => {
      if (error) {
        console.log("[VIP-Signin] 请求失败: " + error);
        $notification.post("❌ 唯品会签到", "请求失败", error);
        $done();
        return;
      }

      console.log("[VIP-Signin] 响应状态: " + response.status);
      console.log("[VIP-Signin] 响应体: " + body);

      try {
        const res = JSON.parse(body);

        // 响应结构：code=1 表示成功
        if (res.code === 1) {
          const basicInfo = res.data ? res.data.basicInfo : {};
          const signInInfo = res.data ? res.data.signInInfo : {};
          const signInList = res.data && res.data.signInList ? res.data.signInList : [];

          const isSignInToday = basicInfo.isSignInForDay === 1 || signInInfo.todaySinged === 1;
          const rewardToday = basicInfo.rewardTodayTotalNum || "0";
          const vipcoinUsable = basicInfo.vipcoinUsable || "0";
          const subsidyUsable = basicInfo.subsidyUsable || "0";
          const totalDays = basicInfo.totalDays || "0";
          const mostNonStopDays = basicInfo.mostNonStopDays || "0";
          const vipcoinTotal = basicInfo.vipcoinTotal || "0";

          // 查找今日签到奖励详情
          const today = new Date();
          const todayStr = today.getFullYear().toString() +
            (today.getMonth() + 1).toString().padStart(2, '0') +
            today.getDate().toString().padStart(2, '0');

          const todayReward = signInList.find(item => item.signDay.toString() === todayStr);
          const rewardDetail = todayReward ? todayReward.awardNum + " " +
            (todayReward.awardType === 1 ? "VIP币" : todayReward.awardType === 3 ? "现金补贴" : "奖励") : rewardToday + " VIP币";

          let msg = "签到成功";
          if (isSignInToday) {
            msg = "今日签到成功，获得 " + rewardDetail;
          } else {
            msg = "签到成功，今日奖励: " + rewardDetail;
          }

          const detail = "可用VIP币: " + vipcoinUsable +
            "\n可用补贴: " + subsidyUsable + "元" +
            "\n累计签到: " + totalDays + "天" +
            "\n最长连续: " + mostNonStopDays + "天" +
            "\n总VIP币: " + vipcoinTotal;

          $notification.post("✅ 唯品会签到成功", msg, detail);
        } else {
          const errMsg = res.msg || "未知错误";
          const errCode = res.code || "";
          $notification.post("❌ 唯品会签到失败", errMsg, "错误码: " + errCode);
        }
      } catch (e) {
        console.log("[VIP-Signin] 解析失败: " + e.message);
        console.log("[VIP-Signin] 响应原文: " + body);
        $notification.post("❌ 唯品会签到", "响应解析失败", "请检查响应格式");
      }
      $done();
    });

  } catch (e) {
    console.log("[VIP-Signin] 脚本异常: " + e.message);
    $notification.post("❌ 唯品会签到", "脚本错误", e.message);
    $done();
  }
}

main();
