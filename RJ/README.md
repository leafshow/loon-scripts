# 首旅如家自动签到（RJ）

Loon 首旅如家自动签到脚本：触发签到请求自动捕获 Cookie 与 CSRF Token（签到成功后还会自动续期 Cookie），每日定时签到，推送如愿豆奖励结果。

## 文件说明

| 文件 | 说明 |
| --- | --- |
| [homeinns_cookie_capture.js](homeinns_cookie_capture.js) | `http-request` 脚本：拦截签到请求，捕获 Cookie、`x-csrf-token`、`x-tingyun` 等凭证 |
| [homeinns_checkin.js](homeinns_checkin.js) | `cron` 脚本：v3，含精准错误处理、Cookie 过期检测、已签到判断、Set-Cookie 自动续期、如愿豆奖励解析 |
| [homeinns.plugin](homeinns.plugin) | Loon 插件：整合上述脚本 + MITM 配置 + 开关参数 |

## 使用步骤

### 1. 安装并信任 Loon CA 证书（关键）

凭证捕获依赖 MITM 解密 HTTPS 请求，必须先完成证书配置：

1. Loon → 「配置」→「证书」→ 生成并安装 CA 证书，按提示跳转系统设置安装描述文件；
2. iOS「设置」→「通用」→「VPN 与设备管理」→ 安装 Loon 证书；
3. iOS「设置」→「通用」→「关于本机」→「证书信任设置」→ 开启对 Loon CA 的**完全信任**。

### 2. 安装插件

Loon →「配置」→「插件」→ 粘贴安装：

```
https://raw.githubusercontent.com/leafshow/loon-scripts/main/RJ/homeinns.plugin
```

raw 无法直连时可用 CDN 链接：

```
https://cdn.jsdelivr.net/gh/leafshow/loon-scripts@main/RJ/homeinns.plugin
```

### 3. 捕获凭证

打开首旅如家 App → 进入「签到/任务中心」页面（触发 `idea.homeinns.com/event/check_in` 请求）→ 收到「✅ 首旅如家 Cookie 捕获成功」通知即可。

仅首次或凭证失效后需要操作。签到成功后脚本会通过响应的 `Set-Cookie` 自动续期 session，可延长凭证有效期。

### 4. 自动签到

插件默认每日 **09:20** 自动签到并推送结果（如愿豆奖励、连续签到天数）。可在插件参数中关闭「自动签到」/「凭证捕获」开关。

如需修改签到时间，编辑插件中 cron 表达式（5 个字段：分 时 日 月 周）。

## 手动测试

Loon →「配置」→「脚本」→ 找到「首旅如家签到」→ 手动运行，查看通知与日志。

## 常见问题

| 现象 | 排查 |
| --- | --- |
| 触发签到请求收不到捕获通知 | 检查证书是否完全信任、Loon「配置」→「MITM」是否启用、插件中 MITM hostname 是否包含 `idea.homeinns.com` |
| 提示「CSRF Token 为空」 | 捕获到的请求未携带 `x-csrf-token`，请从 App 内签到入口重新进入触发 |
| 通知「⚠️ Cookie 已过期」 | 按提示打开首旅如家 App 进入签到页，会自动触发捕获更新凭证 |

## 接口说明

- 凭证捕获地址：`https://idea.homeinns.com/event/check_in/home`（需捕获请求头 Cookie、`x-csrf-token`、`x-tingyun`）
- 签到接口：`POST https://idea.homeinns.com/event/check_in/home`（body 为 `{}`）
- 返回结构：`result_code`（0 成功 / 2001 已签到）、`data.prizes[].beanReward.totalBean`（如愿豆奖励）、`data.running_days`（连续签到天数）
- Cookie 续期：签到响应 `Set-Cookie` 中的 `_rujia-expand_session`、`NSC_WJQ*` 会自动回写存储
- MITM 主机：`idea.homeinns.com`

## 免责声明

本脚本仅供学习交流和网络调试使用，请勿用于商业或非法用途；接口可能随 App 版本变化失效，请自行评估并承担使用风险。
