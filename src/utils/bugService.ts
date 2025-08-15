import { getPreferenceValues } from "@raycast/api";
import * as cheerio from "cheerio";

import { TaskPriority } from "../constants/priority";
import { BugDetail, BugListItem, BugResolution, BugSeverity, BugStatus, BugType } from "../types/bug";
import { SessionExpiredError } from "./error";
import { processImages } from "./imageProcessor";
import { logger } from "./logger";
import { isSessionExpired } from "./loginService";

/** 从 HTML 页面解析Bug信息 */
export function parseBugsFromHtml(html: string): BugListItem[] {
  const bugs: BugListItem[] = [];

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
          bugType = BugType.TEST_SCRIPT;
          break;
        case "UI缺陷":
          bugType = BugType.UI_DEFECT;
          break;
        case "需求":
          bugType = BugType.REQUIREMENT;
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

/** 从禅道系统获取Bug列表 */
export async function fetchBugsFromZentao(): Promise<BugListItem[]> {
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

/**
 * 从Bug详情页面 HTML 解析Bug信息
 *
 * @param html - Bug详情页面的 HTML 内容
 * @param bugId - Bug ID
 */
export async function parseBugDetailFromHtml(html: string, bugId: string): Promise<BugDetail> {
  const preferences = getPreferenceValues<Preferences>();
  const { zentaoUrl } = preferences;

  const $ = cheerio.load(html);

  // 从页面标题提取Bug标题
  const fullTitle = $("title").text();
  const titleMatch = fullTitle.match(/BUG#\d+\s+(.+?)\s+\/\s+/);
  const title = titleMatch ? titleMatch[1].trim() : $(".page-title .text").text().trim();

  // 从基本信息表格提取数据
  const basicTable = $("#legendBasicInfo table.table-data");

  // 获取所属产品
  const product = basicTable.find("th:contains('所属产品')").next("td").text().trim();

  // 获取所属模块
  const module = basicTable.find("th:contains('所属模块')").next("td").text().trim();

  // 获取Bug类型
  const typeText = basicTable.find("th:contains('Bug类型')").next("td").text().trim();
  let bugType: BugType;
  switch (typeText) {
    case "代码错误":
      bugType = BugType.CODE_ERROR;
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
      bugType = BugType.TEST_SCRIPT;
      break;
    case "UI缺陷":
      bugType = BugType.UI_DEFECT;
      break;
    case "需求":
      bugType = BugType.REQUIREMENT;
      break;
    default:
      bugType = BugType.OTHERS;
  }

  // 获取严重程度
  const severityElement = basicTable.find("th:contains('严重程度')").next("td").find(".label-severity");
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
    severity = BugSeverity.NORMAL;
  }

  // 获取优先级
  const priorityElement = basicTable.find("th:contains('优先级')").next("td").find(".label-pri");
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
    priority = TaskPriority.MEDIUM;
  }

  // 获取Bug状态
  const statusText = basicTable.find("th:contains('Bug状态')").next("td").text().trim();
  let status: BugStatus;
  if (statusText.includes("激活")) {
    status = BugStatus.ACTIVE;
  } else if (statusText.includes("已解决")) {
    status = BugStatus.RESOLVED;
  } else if (statusText.includes("已关闭")) {
    status = BugStatus.CLOSED;
  } else {
    status = BugStatus.ACTIVE;
  }

  // 获取当前指派信息
  const assignedInfoText = basicTable.find("th:contains('当前指派')").next("td").text().trim();
  const assignedMatch = assignedInfoText.split(" ");
  const assignedTo = assignedMatch.length > 0 ? assignedMatch[0] : "";

  // 获取确认状态
  const confirmText = basicTable.find("th:contains('是否确认')").next("td").text().trim();
  const confirmed = !confirmText.includes("未确认");

  // 获取创建者
  const openedBy = basicTable.find("th:contains('由谁创建')").next("td").text().trim();

  // 获取截止日期
  const deadline = basicTable.find("th:contains('截止日期')").next("td").text().trim();

  // 获取解决者
  const resolvedBy = basicTable.find("th:contains('解决者')").next("td").text().trim();

  // 获取激活次数
  const activatedCountText = basicTable.find("th:contains('激活次数')").next("td").text().trim();
  const activatedCount = parseInt(activatedCountText) || 0;

  // 获取激活日期
  const activatedDate = basicTable.find("th:contains('激活日期')").next("td").text().trim();

  // 获取来源用例
  const fromCase = basicTable.find("th:contains('来源用例')").next("td").text().trim();

  // 获取所属计划
  const plan = basicTable.find("th:contains('所属计划')").next("td").text().trim();

  // 获取反馈者
  const feedbackBy = basicTable.find("th:contains('反馈者')").next("td").text().trim();

  // 获取通知邮箱
  const notifyEmail = basicTable.find("th:contains('通知邮箱')").next("td").text().trim();

  // 获取操作系统
  const os = basicTable.find("th:contains('操作系统')").next("td").find(".osContent").text().trim();

  // 获取浏览器
  const browser = basicTable.find("th:contains('浏览器')").next("td").find(".browserContent").text().trim();

  // 获取关键词
  const keywords = basicTable.find("th:contains('关键词')").next("td").text().trim();

  // 获取抄送给
  const mailto = basicTable.find("th:contains('抄送给')").next("td").text().trim();

  const stepsContainer = $(".detail-content.article-content");

  // 解析结构化重现步骤
  let steps = "";
  let stepsImages: string[] = [];
  let result = "";
  let resultImages: string[] = [];
  let expected = "";
  let expectedImages: string[] = [];

  let currentSection = "";
  let currentText = "";
  let currentImages: string[] = [];

  // 遍历重现步骤容器中的所有直接子元素
  stepsContainer.children().each((index, element) => {
    const $el = $(element);
    const text = $el.text().trim();
    console.log("🚀 ~ bugService.ts:432 ~ parseBugDetailFromHtml ~ text:", text);

    if ($el.hasClass("stepTitle")) {
      // 保存上一个section的内容
      if (currentSection) {
        if (currentSection.includes("步骤")) {
          steps = currentText.trim();
          stepsImages = [...currentImages];
        } else if (currentSection.includes("结果")) {
          result = currentText.trim();
          resultImages = [...currentImages];
        } else if (currentSection.includes("期望")) {
          expected = currentText.trim();
          expectedImages = [...currentImages];
        }
      }

      // 开始新的section
      currentSection = text;
      currentText = "";
      currentImages = [];
    } else if ($el.is("p") && !$el.hasClass("stepTitle") && text) {
      // 普通文本段落
      currentText += (currentText ? "\n" : "") + text;
    } else if ($el.is("img")) {
      // 图片元素
      const src = $el.attr("src");
      if (src) {
        console.log("🚀 ~ bugService.ts:462 ~ parseBugDetailFromHtml ~ src:", src);
        // 如果是相对路径，转换为绝对路径
        const imageUrl = src.startsWith("/") ? `${zentaoUrl}${src}` : src;

        // 直接收集图片URL，稍后批量处理
        currentImages.push(imageUrl);
      }
    }
  });

  // 保存最后一个section的内容
  if (currentSection) {
    if (currentSection.includes("步骤")) {
      steps = currentText.trim();
      stepsImages = [...currentImages];
    } else if (currentSection.includes("结果")) {
      result = currentText.trim();
      resultImages = [...currentImages];
    } else if (currentSection.includes("期望")) {
      expected = currentText.trim();
      expectedImages = [...currentImages];
    }
  }

  // 处理所有section的图片
  const processedStepsImages = await processImages(stepsImages);
  const processedResultImages = await processImages(resultImages);
  const processedExpectedImages = await processImages(expectedImages);

  // 获取创建时间和最后修改时间（这些可能需要从其他地方获取）
  const createdDate = "";
  const lastEditedDate = "";

  // 获取解决方案（如果已解决）
  const resolution: BugResolution | "" = "";
  // 解决方案通常在解决Bug时才有，这里先设为空

  return {
    id: bugId,
    title,
    status,
    severity,
    priority,
    type: bugType,
    product,
    module,
    fromCase,
    plan,
    openedBy,
    assignedTo,
    confirmed,
    deadline,
    resolvedBy,
    resolution,
    activatedCount,
    activatedDate,
    assignedInfo: assignedInfoText,
    feedbackBy,
    notifyEmail,
    os,
    browser,
    keywords,
    mailto,
    createdDate,
    lastEditedDate,
    steps,
    stepsImages: processedStepsImages,
    result,
    resultImages: processedResultImages,
    expected,
    expectedImages: processedExpectedImages,
  };
}

/**
 * 从禅道系统获取Bug详情
 *
 * @param bugId - Bug ID
 */
export async function fetchBugDetail(bugId: string): Promise<BugDetail> {
  const preferences = getPreferenceValues<Preferences>();
  const { zentaoUrl, zentaoSid, username } = preferences;

  try {
    // 使用禅道的Bug详情页面URL
    const url = `${zentaoUrl}/bug-view-${bugId}.html`;

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

    logger.debug("Bug detail response status:", response.status);

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const html = await response.text();
    logger.debug("Bug detail HTML content length:", html.length);

    // 检查会话是否已过期
    if (isSessionExpired(html)) {
      logger.info("Session expired detected while fetching bug detail");
      throw new SessionExpiredError();
    }

    // 保存 HTML 到日志文件用于调试
    logger.saveApiResponse(`bug-detail-${bugId}.html`, html, "Bug detail HTML saved to");

    const parsedBugDetail = await parseBugDetailFromHtml(html, bugId);
    console.log("🚀 ~ bugService.ts:570 ~ fetchBugDetail ~ parsedBugDetail:", parsedBugDetail);
    return parsedBugDetail;
  } catch (error) {
    logger.error("Error fetching bug detail from Zentao:", error instanceof Error ? error : String(error));
    throw error;
  }
}
