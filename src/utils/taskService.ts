import * as cheerio from "cheerio";
import * as fs from "fs";
import * as path from "path";
import { Task } from "../types/task";
import { Preferences } from "../types/preferences";
import { getPreferenceValues } from "@raycast/api";
import { TaskStatus } from "../constants/status";
import { TaskPriority } from "../constants/priority";

export function parseTasksFromHtml(html: string): Task[] {
  const tasks: Task[] = [];

  try {
    // 使用 Cheerio 加载 HTML
    const $ = cheerio.load(html);

    // 查找任务表格行，可能的选择器
    const taskSelectors = [
      "tr[data-id]", // 有 data-id 属性的行
      "tbody tr", // 表格体中的行
      ".table tr", // 有 table 类的表格中的行
      "#taskTable tr", // ID 为 taskTable 的表格中的行
    ];

    let $taskRows = $();

    // 尝试不同的选择器找到任务行
    for (const selector of taskSelectors) {
      $taskRows = $(selector);
      if ($taskRows.length > 0) {
        console.log(`Found ${$taskRows.length} rows using selector: ${selector}`);
        break;
      }
    }

    // 遍历每一行提取任务信息
    $taskRows.each((index, row) => {
      const $row = $(row);

      // 提取任务ID
      const taskId = $row.attr("data-id");

      if (!taskId) return; // 跳过没有ID的行

      // 提取任务标题
      const title = $row.find(".c-name a").text().trim();
      console.log("🚀 ~ taskService.ts ~ parseTasksFromHtml ~ title:", title);

      // 提取状态
      const status = $row.find(".c-status .status-task").text().trim();

      // 提取项目信息（取第一个项目名称）
      const project = $row.find(".c-project a").first().text().trim();

      // 提取优先级
      const priority = $row.find(".c-pri span").text().trim();

      // 提取截止日期
      const deadline = $row.find("td.text-center span").text().trim();

      // 提取工时信息（按顺序：预计、消耗、剩余）
      const $hours = $row.find(".c-hours");
      const estimate = $hours.eq(0).text().trim();
      const consumed = $hours.eq(1).text().trim();
      const left = $hours.eq(2).text().trim();

      // 提取指派人
      const assignedTo = $row.find(".c-user").first().text().trim();

      tasks.push({
        id: taskId,
        title: title,
        status: status as TaskStatus,
        project: project,
        assignedTo: assignedTo,
        deadline: deadline,
        priority: priority as TaskPriority,
        estimate: estimate,
        consumed: consumed,
        left: left,
      });
    });

    console.log(`Parsed ${tasks.length} tasks from HTML`);
  } catch (error) {
    console.error("Error parsing HTML with Cheerio:", error);
  }

  console.log("🚀 ~ taskService.ts:79 ~ parseTasksFromHtml ~ tasks:", tasks);

  return tasks;
}

export async function fetchTasksFromZentao(): Promise<Task[]> {
  const preferences = getPreferenceValues<Preferences>();
  const { zentaoUrl, zentaoSid, username } = preferences;

  const url = `${zentaoUrl}/my-work-task-assignedTo-0-id_desc-19-100-1.html`;
  const response = await fetch(url, {
    headers: {
      Accept: "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
      "Accept-Language": "en-US,en;q=0.9,zh-CN;q=0.8,zh;q=0.7",
      Connection: "keep-alive",
      Cookie: `zentaosid=${zentaoSid}; lang=zh-cn; device=desktop; theme=default; keepLogin=on; za=${username}`,
      "User-Agent":
        "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/138.0.0.0 Safari/537.36",
    },
  });

  console.log("🚀 ~ Response status:", response.status);
  console.log("🚀 ~ Response headers:", Object.fromEntries(response.headers.entries()));

  if (!response.ok) {
    throw new Error(`HTTP error! status: ${response.status}`);
  }

  const html = await response.text();
  console.log("🚀 ~ HTML content length:", html.length);

  // Save HTML to file for inspection
  const logDir = path.join(__dirname);
  const htmlFilePath = path.join(logDir, "my-task.html");

  try {
    await fs.promises.writeFile(htmlFilePath, html, "utf8");
    console.log("🚀 ~ HTML saved to:", htmlFilePath);
  } catch (writeError) {
    console.error("Failed to write HTML file:", writeError);
  }

  console.log("🚀 ~ Full HTML content:", html);

  const parsedTasks = parseTasksFromHtml(html);
  return parsedTasks;
}
