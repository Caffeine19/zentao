import * as cheerio from "cheerio";
import * as fs from "fs";
import * as path from "path";
import { Task } from "../types/task";
import { TeamMember } from "../types/teamMember";
import { TaskFormDetails } from "../types/taskFormDetails";
import { getPreferenceValues } from "@raycast/api";
import { TaskStatus } from "../constants/status";
import { TaskPriority } from "../constants/priority";

/**
 * 从 HTML 页面解析任务信息
 * @param html - 从禅道系统获取的 HTML 页面内容
 */
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
      const priorityText = $row.find(".c-pri span").text().trim();

      // 将优先级文本转换为 TaskPriority 枚举
      let priority: TaskPriority;
      const priorityNum = parseInt(priorityText);
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
        priority: priority,
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

/**
 * 获取任务完成表单详情，包括团队成员列表
 * @param taskId - 任务ID
 */
export async function fetchTaskFormDetails(taskId: string): Promise<TaskFormDetails> {
  const preferences = getPreferenceValues<Preferences>();

  try {
    const finishFormUrl = `${preferences.zentaoUrl}/task-finish-${taskId}.html?onlybody=yes`;

    const response = await fetch(finishFormUrl, {
      method: "GET",
      headers: {
        Cookie: `zentaosid=${preferences.zentaoSid}`,
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
      },
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const html = await response.text();

    // 保存 HTML 到日志文件用于调试
    const logDir = path.join(__dirname, "../../log");
    if (!fs.existsSync(logDir)) {
      fs.mkdirSync(logDir, { recursive: true });
    }
    fs.writeFileSync(path.join(logDir, "task-finish-form.html"), html);

    return parseTaskFormDetails(html);
  } catch (error) {
    console.error("Error fetching task form details:", error);
    throw error;
  }
}

/**
 * 解析任务完成表单的详细信息
 * @param html - 表单页面的 HTML 内容
 */
export function parseTaskFormDetails(html: string): TaskFormDetails {
  const $ = cheerio.load(html);

  // 解析团队成员选项
  const members: TeamMember[] = [];
  $("#assignedTo option").each((index, element) => {
    const $option = $(element);
    const value = $option.attr("value") || "";
    const title = $option.attr("title") || "";
    const label = $option.text().trim();
    const selected = $option.attr("selected") === "selected";

    // 跳过空选项
    if (value && label) {
      members.push({
        value,
        label,
        title,
        selected,
      });
    }
  });

  // 获取表单当前值
  const currentConsumed = ($("#currentConsumed").val() as string) || "0";
  const totalConsumed = ($("#consumed").val() as string) || "0";
  const assignedTo = $("#assignedTo option[selected]").attr("value") || "";
  const realStarted = ($("#realStarted").val() as string) || "";
  const finishedDate = ($("#finishedDate").val() as string) || "";

  // 提取 kuid（用作表单的 uid）
  let uid = "";
  const scriptContent = $("script").text();
  const kuidMatch = scriptContent.match(/var kuid = '([^']+)'/);
  if (kuidMatch) {
    uid = kuidMatch[1];
  }

  return {
    members,
    currentConsumed,
    totalConsumed,
    assignedTo,
    realStarted,
    finishedDate,
    uid,
  };
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

  if (!response.ok) {
    throw new Error(`HTTP error! status: ${response.status}`);
  }

  const html = await response.text();
  console.log("🚀 ~ HTML content length:", html.length);

  // 将 HTML 内容保存到文件以便检查
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

/**
 * 完成任务所需的参数接口
 */
export interface FinishTaskParams {
  /** 任务ID */
  taskId: Task["id"];
  /** 当前消耗的工时 */
  currentConsumed: string;
  /** 总消耗的工时 */
  consumed: string;
  /** 任务指派给谁 */
  assignedTo: string;
  /** 实际开始时间，格式：YYYY-MM-DD HH:mm */
  realStarted: string;
  /** 完成时间，格式：YYYY-MM-DD HH:mm */
  finishedDate: string;
  /** 任务状态，完成任务时应该使用 "done" */
  status: "wait" | "doing" | "done" | "pause" | "cancel" | "closed";
  /** 表单的唯一标识符，用于提交表单 */
  uid: string;
  /** 可选的备注信息 */
  comment?: string;
}

/**
 * 完成指定的任务
 * @param params - 完成任务所需的参数
 */
export async function finishTask(params: FinishTaskParams): Promise<boolean> {
  const preferences = getPreferenceValues<Preferences>();
  const { zentaoUrl, zentaoSid, username } = preferences;

  // 构建完成任务的 URL
  const url = `${zentaoUrl}/task-finish-${params.taskId}.html?onlybody=yes`;
  console.log("🚀 ~ taskService.ts:286 ~ finishTask ~ url:", url);

  // 使用 FormData 构建请求体
  const formData = new FormData();
  console.log("🚀 ~ taskService.ts:289 ~ finishTask ~ formData:", formData);
  formData.append("currentConsumed", params.currentConsumed);
  formData.append("consumed", params.consumed);
  formData.append("assignedTo", params.assignedTo);
  formData.append("realStarted", params.realStarted);
  formData.append("finishedDate", params.finishedDate);
  formData.append("status", params.status);
  formData.append("comment", params.comment || "");
  // 使用传入的 uid
  formData.append("uid", params.uid);
  console.log("🚀 ~ taskService.ts:300 ~ finishTask ~ formData:", formData);

  try {
    const response = await fetch(url, {
      method: "POST",
      headers: {
        Accept:
          "text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8,application/signed-exchange;v=b3;q=0.7",
        "Accept-Language": "en-US,en;q=0.9,zh-CN;q=0.8,zh;q=0.7",
        "Cache-Control": "max-age=0",
        Connection: "keep-alive",
        // FormData 会自动设置 Content-Type，包括 boundary
        Cookie: `zentaosid=${zentaoSid}; lang=zh-cn; device=desktop; theme=default; keepLogin=on; za=${username}`,
        Origin: zentaoUrl,
        Referer: url,
        "Upgrade-Insecure-Requests": "1",
        "User-Agent":
          "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/138.0.0.0 Safari/537.36",
      },
      body: formData,
    });

    console.log("🚀 ~ Finish task response status:", response.status);

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const responseText = await response.text();
    console.log("🚀 ~ Finish task response:", responseText);

    // 将响应内容保存到日志文件以便检查
    const logDir = path.join(__dirname, "../../log");
    const logFilePath = path.join(logDir, "task-finish-response.log");

    try {
      await fs.promises.writeFile(logFilePath, responseText, "utf8");
      console.log("🚀 ~ Finish task response saved to:", logFilePath);
    } catch (writeError) {
      console.error("Failed to write response log file:", writeError);
    }

    // 检查响应中是否包含错误信息
    const alertMatch = responseText.match(/alert\('([^']+)'\)/);
    if (alertMatch) {
      const errorMessage = alertMatch[1];
      console.error("🚀 ~ Task finish failed with error:", errorMessage);
      throw new Error(`任务完成失败: ${errorMessage}`);
    }

    // 检查响应是否表示成功
    // 成功的响应包含关闭模态框并重新加载页面的 JavaScript 代码
    const isSuccess = responseText.includes("parent.parent.location.reload()");

    if (!isSuccess) {
      // 如果没有明确的成功标识，也没有错误消息，抛出通用错误
      throw new Error("任务完成失败: 未知错误，请检查日志文件");
    }

    return true;
  } catch (error) {
    console.error("Error finishing task:", error);
    throw error;
  }
}
