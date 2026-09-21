# 什么值得买自动签到（ZDM）

Loon 什么值得买（SMZDM）App 自动签到脚本：打开 App 触发签到请求自动捕获 Cookie 与 Body，每日定时签到，推送签到结果。

## 文件说明

| 文件 | 说明 |
| --- | --- |
| [smzdm_cookie_capture.js](smzdm_cookie_capture.js) | `http-request` 脚本：拦截 App 签到请求，捕获 Cookie 与请求 Body |
| [smzdm_signin.js](smzdm_signin.js) | `cron` 脚本：读取捕获的 Cookie 与 Body 请求签到接口，推送签到结果 |
| [smzdm.plugin](smzdm.plugin) | Loon 插件：整合上述脚本 + MITM 配置 + 开关参数 |

## 使用步骤

### 1. 安装并信任 Loon CA 证书（关键）

凭证捕获依赖 MITM 解密 HTTPS 请求，必须先完成证书配置：

1. Loon → 「配置」→「证书」→ 生成并安装 CA 证书，按提示跳转系统设置安装描述文件；
2. iOS「设置」→「通用」→「VPN 与设备管理」→ 安装 Loon 证书；
3. iOS「设置」→「通用」→「关于本机」→「证书信任设置」→ 开启对 Loon CA 的**完全信任**。

### 2. 安装插件

Loon →「配置」→「插件」→ 粘贴安装：

```
https://raw.githubusercontent.com/leafshow/loon-scripts/main/ZDM/smzdm.plugin
```

raw 无法直连时可用 CDN 链接：

```
https://cdn.jsdelivr.net/gh/leafshow/loon-scripts@main/ZDM/smzdm.plugin
```

### 3. 捕获凭证

打开什么值得买 App → 进入「签到」页面（App 请求 `user-api.smzdm.com/checkin` 时触发捕获）→ 收到「什么值得买捕获 · 已保存」通知即可。

通知中会显示捕获的 Cookie 与 Body 长度，两者均需大于 0。仅首次或凭证失效后需要操作。

### 4. 自动签到

插件默认每日 **08:30** 自动签到并推送结果。可在插件参数中关闭「自动签到」/「凭证捕获」开关。

如需修改签到时间，编辑插件中 cron 表达式（5 个字段：分 时 日 月 周），例如每天 00:30 → `"30 0 * * *"`。

## 手动测试

Loon →「配置」→「脚本」→ 找到「什么值得买签到」→ 手动运行，查看通知与日志。

## 常见问题

| 现象 | 排查 |
| --- | --- |
| 打开 App 收不到捕获通知 | 检查证书是否完全信任、Loon「配置」→「MITM」是否启用、插件中 MITM hostname 是否包含 `user-api.smzdm.com` |
| 签到提示「未找到Body」 | Body 捕获依赖 `requires-body`，请确认使用本仓库插件安装（已内置） |
| 签到失败 | Cookie/Body 过期，重新打开 App 签到页捕获；或接口变更，需抓包核对 |

## 接口说明

- 凭证捕获地址：`https://user-api.smzdm.com/checkin`（App 打开签到页时请求，需捕获请求头 Cookie 与请求体 Body）
- 签到接口：`POST https://user-api.smzdm.com/checkin`（携带捕获的 Cookie + Body + App User-Agent）
- 返回结构：`error_code`（0 成功）、`error_msg`（失败原因）
- MITM 主机：`user-api.smzdm.com`

## 免责声明

本脚本仅供学习交流和网络调试使用，请勿用于商业或非法用途；接口可能随 App 版本变化失效，请自行评估并承担使用风险。
