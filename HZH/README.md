# 华住会自动签到（HZH）

Loon 华住会 App 自动签到脚本：打开 App 签到页自动捕获登录 Cookie，每日定时签到，推送积分与奖品结果。

## 文件说明

| 文件 | 说明 |
| --- | --- |
| [huazhu_cookie_capture.js](huazhu_cookie_capture.js) | `http-request` 脚本：拦截 App 签到页请求，捕获完整 Cookie 存入持久化存储 |
| [huazhu_signin.js](huazhu_signin.js) | `cron` 脚本：读取 Cookie 请求签到接口，推送签到结果 |
| [huazhu.plugin](huazhu.plugin) | Loon 插件：整合上述脚本 + MITM 配置 + 开关参数 |

## 使用步骤

### 1. 安装并信任 Loon CA 证书（关键）

Cookie 捕获依赖 MITM 解密 HTTPS 请求，必须先完成证书配置：

1. Loon → 「配置」→「证书」→ 生成并安装 CA 证书，按提示跳转系统设置安装描述文件；
2. iOS「设置」→「通用」→「VPN 与设备管理」→ 安装 Loon 证书；
3. iOS「设置」→「通用」→「关于本机」→「证书信任设置」→ 开启对 Loon CA 的**完全信任**。

### 2. 安装插件

Loon →「配置」→「插件」→ 粘贴安装：

```
https://raw.githubusercontent.com/leafshow/loon-scripts/main/HZH/huazhu.plugin
```

raw 无法直连时可用 CDN 链接：

```
https://cdn.jsdelivr.net/gh/leafshow/loon-scripts@main/HZH/huazhu.plugin
```

### 3. 捕获 Cookie

打开华住会 App → 进入「签到」页面 → 收到「✅ 华住会 Cookie 捕获成功」通知即可。
（仅首次或 Cookie 失效后需要操作；捕获有变化时才会弹窗，无变化保持静默。）

### 4. 自动签到

插件默认每日 **00:05** 自动签到并推送结果（积分、奖品）。可在插件参数中关闭「自动签到」/「Cookie捕获」开关。

如需修改签到时间，编辑插件中 cron 表达式（5 个字段：分 时 日 月 周），例如每天 08:30 → `"30 8 * * *"`。

## 手动测试

Loon →「配置」→「脚本」→ 找到「华住会签到」→ 手动运行，查看通知与日志。

## 常见问题

| 现象 | 排查 |
| --- | --- |
| 打开 App 签到页收不到捕获通知 | 检查证书是否完全信任、Loon「配置」→「MITM」是否启用、插件中 MITM hostname 是否包含 `appgw.huazhu.com` |
| 签到提示「Cookie 可能已失效」 | App 重新登录过或 Cookie 过期，重走一次捕获流程 |
| 签到提示「返回解析异常」 | 华住接口可能变更，参考 [evilbutcher/QuantumultX hzh.js](https://github.com/evilbutcher/QuantumultX/blob/main/check_in/hzh/hzh.js) 核对接口与返回结构 |

## 接口说明

- Cookie 捕获地址：`https://appgw.huazhu.com/game/sign_header`（App 打开签到页时请求）
- 签到接口：`GET https://appgw.huazhu.com/game/sign_in?date=<当前秒级时间戳>`
- MITM 主机：`appgw.huazhu.com`

## 免责声明

本脚本仅供学习交流和网络调试使用，请勿用于商业或非法用途；接口来自社区公开实现，华住后续调整接口可能导致失效，请自行评估并承担使用风险。
