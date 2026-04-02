/**
 * Autojs6 6.7.0
 * 采集指定 App 页面所有 android.view.View 的 contentDescription(desc)
 */

const TARGET_PKG = "com.waimaiii.waimaiii";
const TARGET_ACTIVITY = "com.waimaiii.waimaiii.MainActivity";
const TARGET_ACTIVITY_SHORT = "com.waimaiii.waimaiii/.MainActivity";
const OUTPUT_PATH = "/sdcard/autojs6/waimai/waimai_desc_dump.json";
const DEBUG_LOG_PATH = "/sdcard/autojs6/waimai/waimai_debug.log";
const KEYWORDS = ["实付满", "最高返"];
const EXCLUDED_KEYWORDS = ["含红包¥2"];

// 可调参数
const MAX_ROUNDS = 10;           // 最大滚动轮数（按需求先设为10次）
const LOAD_DELAY = 1200;         // 每次滚动后等待 UI 渲染(ms)
const PRE_COLLECT_DELAY = 800;   // 启动后初始等待(ms)
const FIND_TIMEOUT = 3000;       // 查找滚动容器超时(ms)

main();

function main() {
    try {
        debug("script start");
        ensureAccessibility();

        restartTargetApp(TARGET_PKG);
        sleep(3000);
        ensureMainActivityOrExit();

        const seen = {};
        const resultList = [];
        const rawDump = [];

        for (let round = 1; round <= MAX_ROUNDS; round++) {
            // 1) 采集当前页
            const added = collectCurrentPageDesc(seen, resultList, rawDump);
            log("第 " + round + " 轮：新增 desc = " + added + "，累计 = " + resultList.length);
            debug("round=" + round + ", added=" + added + ", total=" + resultList.length);

            if (round >= MAX_ROUNDS) {
                debug("reach max rounds=" + MAX_ROUNDS);
                break;
            }

            // 4) 向下滚动
            const scrolled = doScrollDown();
            if (!scrolled) {
                log("滚动失败，视为到底。");
                debug("scroll failed");
                break;
            }

            sleep(LOAD_DELAY);
        }

        // 5) 保存结果
        saveAsJson(resultList, OUTPUT_PATH);
        saveAsJson(rawDump, "/sdcard/autojs6/waimai/waimai_raw_desc.json");
        debug("save done, count=" + resultList.length + ", file=" + OUTPUT_PATH + ", raw=" + "/sdcard/autojs6/waimai/waimai_raw_desc.json");

        toast("采集完成，共 " + resultList.length + " 条，已保存到 " + OUTPUT_PATH);
        log("采集完成，共 " + resultList.length + " 条，已保存到 " + OUTPUT_PATH);
    } catch (e) {
        log("脚本异常: " + e);
        toast("脚本异常: " + e);
        debug("error: " + e);
    }
}

/**
 * 无障碍服务检查
 */
function ensureAccessibility() {
    if (!auto.service) {
        toast("请先开启无障碍服务后再运行脚本");
        log("无障碍服务未开启，准备跳转设置页");
        debug("accessibility not ready, waiting");
        auto.waitFor(); // Autojs6: 等待用户开启无障碍
    }
    if (!auto.service) {
        debug("accessibility still unavailable");
        throw new Error("无障碍服务未开启，脚本结束");
    }
    debug("accessibility ready");
}

/**
 * 每次执行前重启目标应用并拉起到前台
 */
function restartTargetApp(pkg) {
    debug("restart target app, pkg=" + pkg);

    // 优先尝试强制停止（需要 adb 授权或 root，失败则自动走普通拉起）
    try {
        const stopResult = shell("am force-stop " + pkg, true);
        debug("force-stop code=" + stopResult.code);
    } catch (e) {
        debug("force-stop failed: " + e);
    }

    sleep(800);
    app.launchPackage(pkg);
    if (!waitForPackageFront(pkg, 15000)) {
        debug("target app not in front after restart timeout");
        throw new Error("应用未能进入前台: " + pkg);
    }
}

function ensureMainActivityOrExit() {
    const act = currentActivity();
    debug("current activity=" + act);
    if (act !== TARGET_ACTIVITY && act !== TARGET_ACTIVITY_SHORT) {
        const msg = "请手动进入 MainActivity 后重试。当前: " + act;
        log(msg);
        toast(msg);
        throw new Error(msg);
    }
}

/**
 * 等待某包名进入前台
 */
function waitForPackageFront(pkg, timeoutMs) {
    const start = new Date().getTime();
    while (new Date().getTime() - start < timeoutMs) {
        if (currentPackage() === pkg) return true;
        sleep(400);
    }
    return false;
}

/**
 * 采集当前页面中 className=android.view.View 的 desc
 * @returns {number} 本次新增条数
 */
function collectCurrentPageDesc(seen, resultList, rawDump) {
    let added = 0;
    const nodes = className("android.view.View").find();

    if (!nodes || nodes.empty()) {
        log("当前页未找到 android.view.View 节点");
        return 0;
    }

    nodes.forEach(node => {
        try {
            const d = node.desc();
            if (d && String(d).trim().length > 0) {
                const text = String(d).trim();
                rawDump.push(text);
                if (containsTargetKeyword(text) && !seen[text]) {
                    seen[text] = true;
                    resultList.push(text);
                    added++;
                }
            }
        } catch (e) {
            // 单节点异常不影响整体采集
        }
    });

    return added;
}

/**
 * 页面签名：用可见 View 的 desc + bounds 组合，判断页面是否变化
 */
function doScrollDown() {
    // 直接使用手势滑动，保证每屏都执行滚动动作
    const w = device.width;
    const h = device.height;
    const x = parseInt(w / 2);
    const y1 = parseInt(h * 0.78);
    const y2 = parseInt(h * 0.28);
    const scrolled = swipe(x, y1, x, y2, 500);

    return !!scrolled;
}

/**
 * 保存 JSON 文件
 */
function saveAsJson(arr, path) {
    try {
        const json = JSON.stringify(arr, null, 2);
        files.write(path, json, "utf-8");
    } catch (e) {
        throw new Error("写入文件失败: " + e);
    }
}

function debug(msg) {    const line = new Date().toISOString() + " " + String(msg) + "\n";
    try {
        files.append(DEBUG_LOG_PATH, line);
    } catch (e) {
    }
}

function containsTargetKeyword(text) {
    if (!text) {
        return false;
    }

    for (let i = 0; i < KEYWORDS.length; i++) {
        if (String(text).indexOf(KEYWORDS[i]) >= 0) return true;
    }
    return false;
}
