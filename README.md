# 外卖 desc 采集项目说明

## 项目简介

这是一个基于 `AutoJS6` 的手机自动化采集项目，用来连接并操作已授权的安卓手机，自动进入目标应用 `com.waimaiii.waimaiii`，滚动页面并采集页面里 `android.view.View` 节点的 `contentDescription`（也就是 `desc`）。

项目当前的目标是：

- 采集页面中可见的 `desc`
- 过滤出包含目标关键词的数据
- 导出原始数据，方便后续分析和调试
- 将脚本统一放到手机中的项目目录里管理

## 手机端项目目录

以后这个项目统一放在手机的：

`/sdcard/autojs6/waimai`

目前会放在这里的文件包括：

- `waimai_desc_collector.js`：主脚本
- `waimai_desc_dump.json`：筛选后的结果
- `waimai_raw_desc.json`：原始 `desc` 导出
- `waimai_debug.log`：调试日志

## 功能说明

脚本执行流程如下：

1. 检查无障碍服务是否开启
2. 重启目标应用，确保进入前台
3. 确认当前页面是 `MainActivity`
4. 遍历当前页的 `android.view.View`
5. 读取每个节点的 `desc`
6. 保存原始 `desc` 列表
7. 按关键词筛选后保存最终结果
8. 输出日志和提示信息

## 当前脚本行为

当前版本的脚本会同时生成两份数据：

### 1. 原始导出

把当前页面里能看到的所有非空 `desc` 都记录下来，用于排查页面结构和采集范围。

输出文件：

`/sdcard/autojs6/waimai/waimai_raw_desc.json`

### 2. 筛选结果

只保留包含目标关键词的数据，目前关键词包括：

- `实付满`
- `最高返`

输出文件：

`/sdcard/autojs6/waimai/waimai_desc_dump.json`

## 运行环境

- Windows 10
- Cursor
- 手机通过 `ADB` 已连接
- `AutoJS6`
- 目标应用：`com.waimaiii.waimaiii`

## 脚本文件

### `waimai_desc_collector.js`
主脚本，负责启动目标应用、采集 `desc`、滚动页面和保存结果。

### `waimai_desc_dump.json`
筛选后的结果文件，用来查看符合关键词的数据。

### `waimai_raw_desc.json`
原始导出文件，用来查看页面上实际抓到了哪些 `desc`。

### `waimai_debug.log`
调试日志文件，记录脚本执行过程，便于排查问题。

## 使用方法

### 1. 确保手机已连接

先确认手机已经通过 `ADB` 连接成功，并且 `AutoJS6` 可用。

### 2. 把脚本推送到手机目录

脚本应放到：

`/sdcard/autojs6/waimai/waimai_desc_collector.js`

### 3. 在 AutoJS6 中运行脚本

打开 `AutoJS6`，执行 `waimai_desc_collector.js`。

### 4. 查看输出

运行结束后，查看以下文件：

- `/sdcard/autojs6/waimai/waimai_desc_dump.json`
- `/sdcard/autojs6/waimai/waimai_raw_desc.json`
- `/sdcard/autojs6/waimai/waimai_debug.log`

## 采集规则说明

当前脚本的核心规则是：

- 只采集 `android.view.View`
- 读取节点的 `desc`
- 按关键词过滤
- 去重后写入结果文件

如果后续页面结构变化，可以继续调整：

- 关键词列表
- 采集控件类型
- 滚动方式
- 去重逻辑

## 已验证结果

最近一次测试已经验证了：

- 脚本能够成功推送到手机
- `AutoJS6` 能启动并执行脚本
- 能进入目标应用页面
- 能抓到页面中的原始 `desc`
- 能生成筛选结果和调试日志

说明当前项目流程是通的，后续主要是继续优化筛选规则和导出格式。

## 后续可以继续优化的方向

- 把商家名和返利文案拆分成结构化字段
- 导出为 `CSV` 或 `Excel` 更方便查看
- 把配置项提取到独立配置文件
- 增加更稳定的页面识别和滚动判定
- 统一输出文件命名规范

## 备注

这个项目属于手机自动化采集脚本，建议只在你有权限处理的数据和应用上使用。