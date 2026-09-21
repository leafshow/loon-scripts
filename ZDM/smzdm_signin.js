// 什么值得买自动签到脚本
// 类型：cron
// 定时建议：0 30 8 * * *

const cookie = $persistentStore.read("smzdm_cookie");
const body = $persistentStore.read("smzdm_body");

if (!cookie) {
    $notification.post("什么值得买签到失败", "未找到Cookie", "请先打开App触发捕获");
    $done();
    return;
}

if (!body) {
    $notification.post("什么值得买签到失败", "未找到Body", "请先打开App触发捕获脚本");
    $done();
    return;
}

console.log("[SMZDM-Signin] 开始签到...");
console.log(`[SMZDM-Signin] Body: ${body}`);

const options = {
    url: "https://user-api.smzdm.com/checkin",
    headers: {
        "Cookie": cookie,
        "User-Agent": "smzdm 11.1.92 rv:172.4 (iPhone 17 Pro Max; iOS 26.5; zh_CN)/iphone_smzdmapp/11.1.92",
        "Content-Type": "application/x-www-form-urlencoded",
        "Accept": "*/*",
        "Accept-Language": "zh-Hans-CN;q=1",
        "Accept-Encoding": "gzip, deflate, br",
        "Host": "user-api.smzdm.com"
    },
    body: body
};

$httpClient.post(options, (error, response, data) => {
    if (error) {
        console.log(`[SMZDM-Signin] 请求失败: ${error}`);
        $notification.post("什么值得买签到失败", "网络错误", error);
        $done();
        return;
    }

    console.log(`[SMZDM-Signin] 状态码: ${response.status}`);
    console.log(`[SMZDM-Signin] 响应: ${data}`);

    try {
        const result = JSON.parse(data);
        // error_code 可能为数字 0 或字符串 "0"（实际接口返回字符串），统一转字符串比较
        const errorCode = String(result.error_code !== undefined ? result.error_code : result.code);
        if (errorCode === "0") {
            const d = result.data || {};
            const gains = [];
            if (Number(d.cpadd) > 0) gains.push(`积分+${d.cpadd}`);
            if (Number(d.cgold) > 0) gains.push(`金币+${d.cgold}`);
            if (Number(d.cexperience) > 0) gains.push(`经验+${d.cexperience}`);
            if (Number(d.cprestige) > 0) gains.push(`威望+${d.cprestige}`);
            const detail = gains.length
                ? gains.join("，") + (d.cpoints ? `\n累计积分: ${d.cpoints}` : "")
                : (d.cpoints ? `累计积分: ${d.cpoints}，累计经验: ${d.cexperience}` : "");
            const msg = result.error_msg || result.message || "签到成功";
            $notification.post("什么值得买签到成功", msg, detail);
        } else {
            const msg = result.error_msg || result.message || "签到失败";
            console.log(`[SMZDM-Signin] 失败原因: ${msg}`);
            $notification.post("什么值得买签到失败", msg, "");
        }
    } catch (e) {
        console.log(`[SMZDM-Signin] 解析失败: ${e}`);
        $notification.post("什么值得买签到异常", "解析失败", data.substring(0, 100));
    }
    $done();
});