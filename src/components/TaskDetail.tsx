import { ActionPanel, Detail, Action, Icon, getPreferenceValues } from "@raycast/api";
import { Task } from "../types/task";
import { Preferences } from "../types/preferences";
import { getStatusColor, getStatusLabel } from "../constants/status";
import { getPriorityColor, getPriorityLabel } from "../constants/priority";

interface TaskDetailProps {
  task: Task;
}

export function TaskDetail({ task }: TaskDetailProps) {
  const preferences = getPreferenceValues<Preferences>();

  const markdown = /* md */ `
# ${task.title}

## ⏱️ 工时信息
- **📅 预计工时**: ${task.estimate || "未设置"}
- **⚡ 已消耗工时**: ${task.consumed || "0"}
- **⏳ 剩余工时**: ${task.left || "未计算"}
`;

  return (
    <Detail
      markdown={markdown}
      navigationTitle={`任务 #${task.id}`}
      metadata={
        <Detail.Metadata>
          <Detail.Metadata.Label title="任务 ID" text={task.id} />

          <Detail.Metadata.Separator />

          <Detail.Metadata.TagList title="状态">
            <Detail.Metadata.TagList.Item text={getStatusLabel(task.status)} color={getStatusColor(task.status)} />
          </Detail.Metadata.TagList>

          <Detail.Metadata.TagList title="优先级">
            <Detail.Metadata.TagList.Item
              text={`${getPriorityLabel(task.priority)}(${task.priority})`}
              color={getPriorityColor(task.priority)}
            />
          </Detail.Metadata.TagList>

          <Detail.Metadata.Separator />

          <Detail.Metadata.Label title="所属项目" text={task.project || "未指定"} />
          <Detail.Metadata.Label title="指派给" text={task.assignedTo || "未指派"} />

          <Detail.Metadata.Separator />

          <Detail.Metadata.Label title="截止日期" text={task.deadline || "未设置"} />

          <Detail.Metadata.Separator />

          <Detail.Metadata.Link
            title="在禅道中打开"
            target={`${preferences.zentaoUrl}/task-view-${task.id}.html`}
            text="查看完整详情"
          />
        </Detail.Metadata>
      }
      actions={
        <ActionPanel>
          <Action.OpenInBrowser
            title="在禅道中打开"
            url={`${preferences.zentaoUrl}/task-view-${task.id}.html`}
            icon={Icon.Globe}
          />
          <Action.CopyToClipboard title="复制任务 ID" content={task.id} icon={Icon.Clipboard} />
          <Action.CopyToClipboard
            title="复制任务 URL"
            content={`${preferences.zentaoUrl}/task-view-${task.id}.html`}
            icon={Icon.Link}
          />
          <Action.CopyToClipboard title="复制任务标题" content={task.title} icon={Icon.Text} />
        </ActionPanel>
      }
    />
  );
}
