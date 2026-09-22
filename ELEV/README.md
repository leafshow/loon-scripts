# 电梯开门码参数提取（ELEV）

Loon 电梯开门码（JSLIFE 门禁）参数提取工具：点击 App 内「开门码」时自动捕获接口参数，拼接 `doorkey` JSON 持久化存储，支持随时读取复制，用于生成电梯二维码。

## 文件说明

| 文件 | 说明 |
| --- | --- |
| [elevator_capture.js](elevator_capture.js) | `http-response` 脚本：从 URL 提取 `token`（或 `weixinToken`）/`bizSource`/`h5Source` 并缓存；命中开门码接口 `ac_estate_passpopedom` 时从响应提取 `userId`，拼接 `doorkey` JSON 存储 |
| [elevator_read.js](elevator_read.js) | 读取脚本：读取 `doorkey` 数据并弹窗展示（可复制） |
| [elevator.plugin](elevator.plugin) | Loon 插件：整合上述脚本 + MITM 配置 + 开关参数 |

## 使用步骤

### 1. 安装并信任 Loon CA 证书（关键）

参数捕获依赖 MITM 解密 HTTPS 请求，必须先完成证书配置：

1. Loon → 「配置」→「证书」→ 生成并安装 CA 证书，按提示跳转系统设置安装描述文件；
2. iOS「设置」→「通用」→「VPN 与设备管理」→ 安装 Loon 证书；
3. iOS「设置」→「通用」→「关于本机」→「证书信任设置」→ 开启对 Loon CA 的**完全信任**。

### 2. 安装插件

Loon →「配置」→「插件」→ 粘贴安装：

```
https://raw.githubusercontent.com/leafshow/loon-scripts/main/ELEV/elevator.plugin
```

raw 无法直连时可用 CDN 链接：

```
https://cdn.jsdelivr.net/gh/leafshow/loon-scripts@main/ELEV/elevator.plugin
```

### 3. 捕获参数

在微信或 App 内打开 JSLIFE 开门码页面 → 点击「开门码」（触发 `wx.jslife.com.cn` 下 `ac_estate_passpopedom` 接口）→ 收到「完整参数提取成功」通知，`doorkey` 已存入持久化存储。

首次捕获需要三个缓存字段齐全：`token`、`bizSource`、`h5Source`（脚本会自动从捕获到的任意请求 URL 中提取并缓存，多操作几次即可集齐）。之后点击开门码即可增量更新。

### 4. 读取数据

Loon →「配置」→「脚本」→ 找到「读取电梯码数据」→ 手动运行：

- **通知**直接展开显示各字段内容（token/bizSource/userId/areaId 等）；
- **点击通知**进入脚本记录页，Log 区为完整 `doorkey` JSON，长按选中或分享复制即可。

## 存储结构

捕获成功后持久化存储中的 `doorkey` 字段为如下 JSON：

```json
{
  "token": "...",
  "bizType": "JSLIFE",
  "bizSource": "...",
  "userId": "...",
  "areaId": "47c5d8c310c84371a9c6006bc3e7100d",
  "seqId": 22,
  "h5Source": "..."
}
```

另有三个独立缓存 key：`cache_token`、`cache_bizSource`、`cache_h5Source`。

## 常见问题

| 现象 | 排查 |
| --- | --- |
| 点击开门码收不到「完整参数提取成功」 | 检查证书完全信任、MITM 是否启用、插件中 MITM hostname 是否覆盖了接口域名 |
| 提取成功但 token 为空 | 先在 App 内多浏览几个页面，让脚本从带参数的 URL 中缓存 token |
| `doorkey` 中 `areaId`/`seqId` 不对 | 这两个字段为小区硬编码值，不同小区需修改 `elevator_capture.js` 中对应常量 |

## 接口说明

- 域名：`wx.jslife.com.cn`
- 开门码接口：URL 含 `ac_estate_passpopedom` 的请求（响应取 `obj.userId` 或 `data.userId`）
- 参数来源：请求 URL query 中的 `token`（或 `weixinToken`）、`bizSource`、`h5Source`
- MITM 主机：`wx.jslife.com.cn`

## 免责声明

本脚本仅供学习交流和网络调试使用，请勿用于商业或非法用途；门禁二维码数据涉及个人出入记录，请妥善保管并自行承担使用风险。
