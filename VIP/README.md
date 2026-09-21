# 唯品会自动签到（VIP）

Loon 唯品会 App 自动签到脚本：打开 App 触发签到请求自动捕获凭证（Cookie + Authorization + 设备指纹），每日定时签到，推送 VIP 币/补贴结果。

> 说明：本目录脚本由原 `ZDM/` 目录迁移而来（原文件误用 smzdm 命名，实际为唯品会实现），已重命名为 `vip_*`。

## 文件说明

| 文件 | 说明 |
| --- | --- |
| [vip_cookie_capture.js](vip_cookie_capture.js) | `http-request` 脚本：拦截 App 签到请求，捕获 Cookie/Authorization 等凭证 |
| [vip_signin.js](vip_signin.js) | `cron` 脚本：读取凭证请求签到接口，推送签到结果 |
| [vip.plugin](vip.plugin) | Loon 插件：整合上述脚本 + MITM 配置 + 开关参数 |

## 使用步骤

### 1. 安装并信任 Loon CA 证书（关键）

凭证捕获依赖 MITM 解密 HTTPS 请求，必须先完成证书配置：

1. Loon → 「配置」→「证书」→ 生成并安装 CA 证书，按提示跳转系统设置安装描述文件；
2. iOS「设置」→「通用」→「VPN 与设备管理」→ 安装 Loon 证书；
3. iOS「设置」→「通用」→「关于本机」→「证书信任设置」→ 开启对 Loon CA 的**完全信任**。

### 2. 安装插件

Loon →「配置」→「插件」→ 粘贴安装：

```
https://raw.githubusercontent.com/leafshow/loon-scripts/main/VIP/vip.plugin
```

raw 无法直连时可用 CDN 链接：

```
https://cdn.jsdelivr.net/gh/leafshow/loon-scripts@main/VIP/vip.plugin
```

### 3. 捕获凭证

打开唯品会 App → 进入「签到」页面（触发 `act-ug.vip.com/signIn` 请求）→ 收到「✅ 唯品会凭证捕获成功」通知即可。

（仅首次或凭证失效后需要操作；捕获有变化时才会弹窗，无变化保持静默。）

### 4. 自动签到

插件默认每日 **08:10** 自动签到并推送结果（今日奖励、可用 VIP 币/补贴、累计/连续签到天数）。可在插件参数中关闭「自动签到」/「凭证捕获」开关。

如需修改签到时间，编辑插件中 cron 表达式（5 个字段：分 时 日 月 周）。

## 手动测试

Loon →「配置」→「脚本」→ 找到「唯品会签到」→ 手动运行，查看通知与日志。

## 常见问题

| 现象 | 排查 |
| --- | --- |
| 打开 App 收不到捕获通知 | 检查证书是否完全信任、Loon「配置」→「MITM」是否启用、是否进入了签到页（触发 signIn 请求） |
| 签到提示 Authorization 为空 | Authorization 是动态凭证，需重新打开 App 签到页捕获 |
| 签到提示失败/错误码 | 凭证可能过期，重新捕获；或唯品接口变更，需抓包核对 |

## 接口说明

- 凭证捕获地址：`https://act-ug.vip.com/signIn/...`（App 打开签到页时请求）
- 签到接口：`POST https://act-ug.vip.com/signIn/info`（`bussCode=app_sign_in`）
- 需要凭证：Cookie、Authorization 请求头，以及 body 中的 `mars_cid`、`tfs_fp_token`
- MITM 主机：`act-ug.vip.com`

## 免责声明

本脚本仅供学习交流和网络调试使用，请勿用于商业或非法用途；接口来自社区公开实现，唯品会后续调整接口可能导致失效，请自行评估并承担使用风险。
