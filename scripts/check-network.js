/**
 * check-network.js
 * Loon 网络出口信息检测脚本
 *
 * 用法一：添加到 Loon 配置 [Script] 部分
 * network-changed script-path=https://raw.githubusercontent.com/leafshow/loon-scripts/main/scripts/check-network.js, timeout=10, tag=网络出口检测
 *
 * 用法二：通过插件安装（见 plugins/example.plugin）
 *
 * 效果：网络切换时自动推送当前出口 IP 与归属地通知
 */

const API_URL =
  'http://ip-api.com/json/?fields=status,message,country,regionName,city,isp,query&lang=zh-CN';

const NOTIFY_TITLE = '网络出口检测';

$httpClient.get({ url: API_URL }, (error, response, data) => {
  if (error) {
    console.log(`网络信息获取失败: ${error}`);
    $notification.post(NOTIFY_TITLE, '获取失败', String(error));
    return $done({});
  }

  try {
    const info = JSON.parse(data);
    if (info.status !== 'success') {
      $notification.post(NOTIFY_TITLE, '接口异常', info.message || '未知错误');
      return $done({});
    }
    $notification.post(
      NOTIFY_TITLE,
      `${info.country} · ${info.regionName} · ${info.city}`,
      `IP：${info.query}\n运营商：${info.isp}`
    );
  } catch (e) {
    console.log(`响应解析失败: ${e}`);
    $notification.post(NOTIFY_TITLE, '解析失败', String(e));
  }

  $done({});
});
