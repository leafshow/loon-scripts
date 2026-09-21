# Loon Scripts

个人 Loon 脚本仓库，用于存放 iOS 端 [Loon](https://apps.apple.com/us/app/loon/id1449309330) 使用的 JavaScript 脚本与插件，方便手机端直接加载。

## 目录结构

```
loon-scripts/
├── README.md              # 说明文档
├── HZH/                   # 华住会自动签到（脚本 + 插件 + 使用说明）
│   ├── huazhu_cookie_capture.js
│   ├── huazhu_signin.js
│   ├── huazhu.plugin
│   └── README.md
├── VIP/                   # 唯品会自动签到（脚本 + 插件 + 使用说明）
│   ├── vip_cookie_capture.js
│   ├── vip_signin.js
│   ├── vip.plugin
│   └── README.md
├── ZDM/                   # 什么值得买自动签到（脚本 + 插件 + 使用说明）
│   ├── smzdm_cookie_capture.js
│   ├── smzdm_signin.js
│   ├── smzdm.plugin
│   └── README.md
├── scripts/               # JavaScript 脚本
│   └── check-network.js   # 网络出口信息检测
├── plugins/               # Loon 插件文件
│   └── example.plugin     # 插件模板示例
├── LICENSE
└── .gitignore
```

## 手机端加载方式

### 方式一：通过插件加载（推荐）

在 Loon「配置 → 插件」中安装远程插件，粘贴以下链接：

```
https://raw.githubusercontent.com/leafshow/loon-scripts/main/plugins/example.plugin
```

插件可集中管理参数（`[Argument]`）、脚本（`[Script]`）与重写（`[Rewrite]`），便于分发和维护。

### 方式二：直接添加脚本

在 Loon「配置 → 脚本」中添加，或编辑配置文件的 `[Script]` 部分：

```ini
[Script]
# 脚本类型: http-request / http-response / cron / network-changed / dns / script-event
network-changed script-path=https://raw.githubusercontent.com/leafshow/loon-scripts/main/scripts/check-network.js, timeout=10, tag=网络出口检测
```

### CDN 加速（raw 链接无法直连时）

| CDN | 链接格式 |
| --- | --- |
| jsDelivr | `https://cdn.jsdelivr.net/gh/leafshow/loon-scripts@main/scripts/check-network.js` |
| GitHub 反代 | `https://ghproxy.net/https://raw.githubusercontent.com/leafshow/loon-scripts/main/scripts/check-network.js` |

> 注意：jsDelivr 有约 12 小时缓存，更新脚本后如未生效，可将域名换成 `purge.jsdelivr.net` 强制刷新缓存。

## 脚本列表

| 脚本 | 类型 | 说明 |
| --- | --- | --- |
| [check-network.js](scripts/check-network.js) | network-changed | 网络切换时自动推送当前出口 IP 与归属地通知 |
| [华住会签到](HZH/README.md) | http-request + cron | 每日自动签到华住会，推送积分/奖品结果，附插件与使用文档 |
| [唯品会签到](VIP/README.md) | http-request + cron | 每日自动签到唯品会，推送 VIP 币/补贴结果，附插件与使用文档 |
| [什么值得买签到](ZDM/README.md) | http-request + cron | 每日自动签到什么值得买（App 接口），附插件与使用文档 |

## Loon 脚本常用 API 速查

```javascript
// 发送通知（$notify 为等价写法）
$notification.post('标题', '副标题', '内容');

// 结束脚本执行；http-* 脚本可传 $response，其余传 {}
$done({});

// 发起网络请求
$httpClient.get({ url: 'https://api.ipify.org' }, (error, response, data) => {
  if (error) {
    $done({});
  } else {
    $notification.post('出口 IP', '', data);
    $done({});
  }
});

// 持久化存储
$persistentStore.write('value', 'key');   // 写入
$persistentStore.read('key');             // 读取

// 偏好设置（配合插件 [Argument] 使用）
$prefs.valueForKey('argKey');             // 读取
$prefs.setValueForKey('value', 'argKey'); // 写入

// 环境信息
$environment.system;   // iOS / macOS
$environment.params;   // 请求参数等
```

## 免责声明

本仓库所有脚本仅供学习交流和网络调试使用，请勿用于商业或非法用途，否则后果自负。
