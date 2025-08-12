import { getPreferenceValues } from "@raycast/api";
import * as cheerio from "cheerio";

import { TaskPriority } from "../constants/priority";
import { Bug, BugSeverity, BugStatus, BugType, BugResolution } from "../types/bug";
import { SessionExpiredError } from "./error";
import { logger } from "./logger";
import { isSessionExpired } from "./loginService";

/**
 * 从 HTML 页面解析Bug信息
 * @param html - 从禅道系统获取的 HTML 页面内容
 */
export function parseBugsFromHtml(html: string): Bug[] {
  const bugs: Bug[] = [];

  try {
    // 使用 Cheerio 加载 HTML
    const $ = cheerio.load(html);

    // 查找Bug表格行，可能的选择器
    const bugSelectors = [
      "tr[data-id]", // 有 data-id 属性的行
      "#bugList tbody tr", // Bug列表表格体中的行
      ".table-bug tbody tr", // 有 table-bug 类的表格中的行
      "#myBugForm table tbody tr", // 表单中的表格行
    ];

    let $bugRows = $();

    // 尝试不同的选择器找到Bug行
    for (const selector of bugSelectors) {
      $bugRows = $(selector);
      if ($bugRows.length > 0) {
        logger.debug(`Found ${$bugRows.length} bug rows using selector: ${selector}`);
        break;
      }
    }

    // 遍历每一行提取Bug信息
    $bugRows.each((index, row) => {
      const $row = $(row);

      // 提取Bug ID
      const bugId = $row.find("input[name='bugIDList[]']").val() as string;

      if (!bugId) return; // 跳过没有ID的行

      // 提取Bug标题
      const title = $row.find(".text-left.nobr a").text().trim();
      logger.debug("bugService.ts ~ parseBugsFromHtml ~ title:", title);

      // 提取严重程度
      const severityElement = $row.find(".c-severity .label-severity");
      const severityDataValue = severityElement.attr("data-severity");
      let severity: BugSeverity;
      if (severityDataValue === "1") {
        severity = BugSeverity.MINOR;
      } else if (severityDataValue === "2") {
        severity = BugSeverity.NORMAL;
      } else if (severityDataValue === "3") {
        severity = BugSeverity.MAJOR;
      } else if (severityDataValue === "4") {
        severity = BugSeverity.CRITICAL;
      } else {
        severity = BugSeverity.NORMAL; // Default fallback
      }

      // 提取优先级
      const priorityElement = $row.find(".label-pri");
      const priorityTitle = priorityElement.attr("title");
      let priority: TaskPriority;
      const priorityNum = parseInt(priorityTitle || "3");
      if (priorityNum === 1) {
        priority = TaskPriority.CRITICAL;
      } else if (priorityNum === 2) {
        priority = TaskPriority.HIGH;
      } else if (priorityNum === 3) {
        priority = TaskPriority.MEDIUM;
      } else if (priorityNum === 4) {
        priority = TaskPriority.LOW;
      } else {
        priority = TaskPriority.MEDIUM; // Default fallback
      }

      // 提取Bug类型
      const typeText = $row.find(".c-type").text().trim();
      let bugType: BugType;
      switch (typeText) {
        case "代码错误":
          bugType = BugType.CODE_ERROR;
          break;
        case "界面优化":
          bugType = BugType.INTERFACE;
          break;
        case "配置相关":
          bugType = BugType.CONFIG;
          break;
        case "安装部署":
          bugType = BugType.INSTALL;
          break;
        case "安全相关":
          bugType = BugType.SECURITY;
          break;
        case "性能问题":
          bugType = BugType.PERFORMANCE;
          break;
        case "标准规范":
          bugType = BugType.STANDARD;
          break;
        case "测试脚本":
          bugType = BugType.AUTOMATION;
          break;
        case "设计缺陷":
          bugType = BugType.DESIGNDEFECT;
          break;
        default:
          bugType = BugType.OTHERS;
      }

      // 提取所属产品
      const product = $row.find(".c-product a").text().trim();

      // 提取创建者
      const openedBy = $row.find(".c-user").eq(0).text().trim();

      // 提取确认状态
      const confirmElement = $row.find(".c-confirm");
      const confirmText = confirmElement.text().trim();
      const confirmed = !confirmText.includes("未确认");

      // 提取截止日期
      const deadline = $row.find(".c-date.text-center").text().trim();

      // 提取解决者
      const resolvedBy = $row.find(".c-user").eq(1).text().trim();

      // 提取解决方案
      const resolutionText = $row.find(".c-resolution").text().trim();
      let resolution: BugResolution | "" = "";
      switch (resolutionText) {
        case "已解决":
          resolution = BugResolution.FIXED;
          break;
        case "不予解决":
          resolution = BugResolution.WONTFIX;
          break;
        case "外部原因":
          resolution = BugResolution.EXTERNAL;
          break;
        case "重复Bug":
          resolution = BugResolution.DUPLICATE;
          break;
        case "无法重现":
          resolution = BugResolution.NOTREPRO;
          break;
        case "延期处理":
          resolution = BugResolution.POSTPONED;
          break;
        case "设计如此":
          resolution = BugResolution.BYDESIGN;
          break;
        case "无需修复":
          resolution = BugResolution.WILLNOTFIX;
          break;
        case "转为需求":
          resolution = BugResolution.TOSTORY;
          break;
        default:
          resolution = "";
      }

      // 默认状态为激活，实际应根据HTML内容确定
      let status: BugStatus = BugStatus.ACTIVE;
      if (resolution) {
        status = BugStatus.RESOLVED;
      }

      bugs.push({
        id: bugId,
        title: title,
        status: status,
        severity: severity,
        priority: priority,
        type: bugType,
        product: product,
        openedBy: openedBy,
        assignedTo: openedBy, // 在Bug列表页面，指派给可能需要从其他地方获取
        confirmed: confirmed,
        deadline: deadline,
        resolvedBy: resolvedBy,
        resolution: resolution,
      });
    });

    logger.info(`Parsed ${bugs.length} bugs from HTML`);
  } catch (error) {
    logger.error("Error parsing HTML with Cheerio:", error instanceof Error ? error : String(error));
  }

  logger.debug("bugService.ts:120 ~ parseBugsFromHtml ~ bugs:", bugs);

  return bugs;
}

/**
 * 从禅道系统获取Bug列表
 */
export async function fetchBugsFromZentao(): Promise<Bug[]> {
  const preferences = getPreferenceValues<Preferences>();
  const { zentaoUrl, zentaoSid, username } = preferences;

  try {
    // 使用禅道的我的Bug页面URL
    const url = `${zentaoUrl}/my-work-bug-assignedTo-0-id_desc-41-100-1.html`;

    const response = await fetch(url, {
      method: "GET",
      headers: {
        Accept: "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
        "Accept-Language": "en-US,en;q=0.9,zh-CN;q=0.8,zh;q=0.7",
        Connection: "keep-alive",
        Cookie: `zentaosid=${zentaoSid}; lang=zh-cn; device=desktop; theme=default; keepLogin=on; za=${username}`,
        "User-Agent":
          "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/138.0.0.0 Safari/537.36",
      },
    });

    logger.debug("Bug response status:", response.status);

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const html = await response.text();
    logger.debug("Bug HTML content length:", html.length);

    // 检查会话是否已过期
    if (isSessionExpired(html)) {
      logger.info("Session expired detected while fetching bugs");
      throw new SessionExpiredError();
    }

    // 保存 HTML 到日志文件用于调试
    logger.saveApiResponse("my-bug.html", html, "Bug HTML saved to");

    const parsedBugs = parseBugsFromHtml(html);
    return parsedBugs;
  } catch (error) {
    logger.error("Error fetching bugs from Zentao:", error instanceof Error ? error : String(error));
    throw error;
  }
}
