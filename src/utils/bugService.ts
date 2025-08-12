import { getPreferenceValues } from "@raycast/api";
import * as cheerio from "cheerio";

import { logger } from "./logger";
import { isSessionExpired } from "./loginService";
import { SessionExpiredError } from "./error";
import { Bug } from "../types/bug";

/**
 * 从 HTML 页面解析缺陷（Bug）信息
 * @param html - 从禅道系统获取的 HTML 页面内容
 */
export function parseBugsFromHtml(html: string): Bug[] {
  const bugs: Bug[] = [];

  try {
    // 使用 Cheerio 加载 HTML
    const $ = cheerio.load(html);

    // 可能的列表行选择器（参考任务实现并加入常见备选）
    const rowSelectors = [
      "tr[data-id]",
      "tbody tr",
      ".table tr",
      "#bugList tr",
      "#bugTable tr",
    ];

    let $rows = $();
    for (const selector of rowSelectors) {
      $rows = $(selector);
      if ($rows.length > 0) {
        logger.debug(`Found ${$rows.length} rows using selector: ${selector}`);
        break;
      }
    }

    $rows.each((_, row) => {
      const $row = $(row);

      // 缺陷ID
      const id = $row.attr("data-id");
      if (!id) return;

      // 标题（禅道常见 class 为 c-title 或 c-name，优先取链接文本）
      const title = ($row.find(".c-title a").text() || $row.find(".c-name a").text()).trim();

      // 状态（一般在 .c-status 下的 .status-bug 或文本）
      let status = $row.find(".c-status .status-bug").text().trim();
      if (!status) status = $row.find(".c-status").text().trim();

      // 项目/执行
      const project = $row.find(".c-project a").first().text().trim();

      // 优先级（数字 1-4）
      const priText = $row.find(".c-pri span, .c-pri").first().text().trim();
      const priority = parseInt(priText || "", 10) || 3;

      // 截止日期（通常居中列）
      const deadline = $row.find("td.text-center span, .c-deadline span, .c-deadline").first().text().trim();

      // 工时列（如果页面存在，按顺序：预计、消耗、剩余）
      const $hours = $row.find(".c-hours");
      const estimate = $hours.eq(0).text().trim();
      const consumed = $hours.eq(1).text().trim();
      const left = $hours.eq(2).text().trim();

      // 指派给
      const assignedTo = $row.find(".c-user").first().text().trim();

      bugs.push({
        id,
        title,
        status,
        project,
        assignedTo,
        deadline,
        priority,
        estimate,
        consumed,
        left,
      });
    });

    logger.info(`Parsed ${bugs.length} bugs from HTML`);
  } catch (error) {
    logger.error("Error parsing Bug HTML with Cheerio:", error instanceof Error ? error : String(error));
  }

  logger.debug("bugService.ts ~ parseBugsFromHtml ~ bugs:", bugs);
  return bugs;
}

/**
 * 从禅道获取我的缺陷列表
 *
 * 注意：请求头中的 Cookie 需要包含 zentaosid 与用户名等，以便正常渲染 HTML。
 */
export async function fetchbugsFromXentao(): Promise<Bug[]> {
  const preferences = getPreferenceValues<Preferences>();
  const { zentaoUrl, zentaoSid, username } = preferences;

  // 与任务列表类似，取“我的工作-缺陷”页面，排序与分页参数可按需调整
  const url = `${zentaoUrl}/my-work-bug-assignedTo-0-id_desc-19-100-1.html`;

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

  logger.debug("Bug list response status:", response.status);

  if (!response.ok) {
    throw new Error(`HTTP error! status: ${response.status}`);
  }

  const html = await response.text();
  logger.debug("Bug list HTML length:", html.length);

  // 会话过期检测
  if (isSessionExpired(html)) {
    logger.info("Session expired detected in bug list page");
    throw new SessionExpiredError();
  }

  // 保存 HTML 以便调试；与现有日志文件 myBug.html 对齐
  logger.saveApiResponse("myBug.html", html, "HTML saved to");

  return parseBugsFromHtml(html);
}
