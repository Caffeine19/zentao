import { ActionPanel, Detail, List, Action, Icon, showToast, Toast, getPreferenceValues } from "@raycast/api";
import { useEffect, useState } from "react";
import * as cheerio from "cheerio";
import * as fs from "fs";
import * as path from "path";
import { Task } from "./types/task";

function parseTasksFromHtml(html: string): Task[] {
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
      console.log("🚀 ~ search-my-tasks.tsx:67 ~ parseTasksFromHtml ~ title:", title);

      // 提取状态
      const status = $row.find(".c-status").text().trim();

      // 提取项目信息
      const project = $row.find(".c-project").text().trim();

      // 提取优先级
      const priority = $row.find(".c-pri").text().trim();

      // 提取截止日期
      const deadline = $row.find(".c-deadline").text().trim();

      // 提取预估工时
      const estimate = $row.find(".c-estimate").text().trim();

      // 提取已消耗工时
      const consumed = $row.find(".c-consumed").text().trim();

      // 提取剩余工时
      const left = $row.find(".c-left").text().trim();

      tasks.push({
        id: taskId,
        title: title,
        status: status,
        project: project,
        assignedTo: "Me",
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

  return tasks;
}

export default function Command() {
  const preferences = getPreferenceValues<Preferences>();
  const [tasks, setTasks] = useState<Task[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const fetchTasks = async () => {
    try {
      setIsLoading(true);

      const url = `${preferences.zentaoUrl}/my-work-task-assignedTo-0-id_desc-19-100-1.html`;
      const response = await fetch(url, {
        headers: {
          Accept: "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
          "Accept-Language": "en-US,en;q=0.9,zh-CN;q=0.8,zh;q=0.7",
          Connection: "keep-alive",
          Cookie: `zentaosid=${preferences.zentaoSid}; lang=zh-cn; device=desktop; theme=default; keepLogin=on; za=${preferences.username}`,
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

      showToast({
        style: Toast.Style.Success,
        title: "Connected to Zentao",
        message: `Found ${parsedTasks.length} tasks`,
      });

      setTasks(parsedTasks);
    } catch (error) {
      console.error("Error fetching tasks:", error);
      showToast({
        style: Toast.Style.Failure,
        title: "Failed to fetch tasks",
        message: error instanceof Error ? error.message : "Unknown error",
      });
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchTasks();
  }, []);

  const getStatusIcon = (status: string) => {
    switch (status.toLowerCase()) {
      case "wait":
      case "waiting":
        return Icon.Clock;
      case "doing":
      case "progress":
        return Icon.ArrowClockwise;
      case "done":
      case "closed":
        return Icon.CheckCircle;
      case "cancel":
      case "cancelled":
        return Icon.XMarkCircle;
      default:
        return Icon.Circle;
    }
  };

  if (isLoading) {
    return <List isLoading={true} searchBarPlaceholder="Loading tasks..." />;
  }

  return (
    <List
      isLoading={isLoading}
      searchBarPlaceholder="Search tasks..."
      actions={
        <ActionPanel>
          <Action title="Refresh" onAction={fetchTasks} icon={Icon.ArrowClockwise} />
        </ActionPanel>
      }
    >
      {tasks.length === 0 ? (
        <List.EmptyView
          title="No tasks found"
          description="Either you have no tasks assigned or there was an issue fetching them."
          actions={
            <ActionPanel>
              <Action title="Refresh" onAction={fetchTasks} icon={Icon.ArrowClockwise} />
            </ActionPanel>
          }
        />
      ) : (
        tasks.map((task) => (
          <List.Item
            key={task.id}
            icon={getStatusIcon(task.status)}
            title={task.title}
            subtitle={task.project}
            accessories={[{ text: task.status }, { text: `#${task.id}` }]}
            actions={
              <ActionPanel>
                <Action.Push
                  title="View Task Details"
                  target={
                    <Detail
                      markdown={`# ${task.title}

**Task ID:** ${task.id}  
**Status:** ${task.status}  
**Project:** ${task.project}  
**Assigned To:** ${task.assignedTo}  
**Priority:** ${task.priority}  

---

[Open in Zentao](${preferences.zentaoUrl}/task-view-${task.id}.html)
`}
                      actions={
                        <ActionPanel>
                          <Action.OpenInBrowser
                            title="Open in Zentao"
                            url={`${preferences.zentaoUrl}/task-view-${task.id}.html`}
                          />
                          <Action.CopyToClipboard title="Copy Task ID" content={task.id} />
                          <Action.CopyToClipboard
                            title="Copy Task URL"
                            content={`${preferences.zentaoUrl}/task-view-${task.id}.html`}
                          />
                        </ActionPanel>
                      }
                    />
                  }
                  icon={Icon.Eye}
                />
                <Action.OpenInBrowser
                  title="Open in Zentao"
                  url={`${preferences.zentaoUrl}/task-view-${task.id}.html`}
                  icon={Icon.Globe}
                />
                <Action.CopyToClipboard title="Copy Task ID" content={task.id} icon={Icon.Clipboard} />
                <Action title="Refresh" onAction={fetchTasks} icon={Icon.ArrowClockwise} />
              </ActionPanel>
            }
          />
        ))
      )}
    </List>
  );
}
