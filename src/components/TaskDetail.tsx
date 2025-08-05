import { ActionPanel, Detail, Action, Icon, getPreferenceValues } from "@raycast/api";
import { Task } from "../types/task";
import { getStatusColor, getStatusLabel } from "../constants/status";
import { getPriorityColor, getPriorityLabel } from "../constants/priority";
import { TaskStatus } from "../constants/status";
import { FinishTaskForm } from "./FinishTaskForm";
import { t } from "../utils/i18n";

interface TaskDetailProps {
  task: Task;
}

export function TaskDetail({ task }: TaskDetailProps) {
  const preferences = getPreferenceValues<Preferences>();

  const markdown = /* md */ `
# ${task.title}

## ⏱️ ${t("estimatedTime")}
- **📅 ${t("estimatedTime")}**: ${task.estimate || t("notSet")}
- **⚡ ${t("consumedTime")}**: ${task.consumed || "0"}
- **⏳ ${t("remainingTime")}**: ${task.left || t("notCalculated")}
`;

  return (
    <Detail
      markdown={markdown}
      navigationTitle={`${t("taskTitle")} #${task.id}`}
      metadata={
        <Detail.Metadata>
          <Detail.Metadata.Label title={`${t("taskTitle")} ID`} text={task.id} />

          <Detail.Metadata.Separator />

          <Detail.Metadata.TagList title={t("currentStatus")}>
            <Detail.Metadata.TagList.Item text={getStatusLabel(task.status)} color={getStatusColor(task.status)} />
          </Detail.Metadata.TagList>

          <Detail.Metadata.TagList title={t("priority")}>
            <Detail.Metadata.TagList.Item
              text={`${getPriorityLabel(task.priority)}(${task.priority})`}
              color={getPriorityColor(task.priority)}
            />
          </Detail.Metadata.TagList>

          <Detail.Metadata.Separator />

          <Detail.Metadata.Label title={t("project")} text={task.project || t("unknownError")} />
          <Detail.Metadata.Label title={t("assignedTo")} text={task.assignedTo || t("notAssigned")} />

          <Detail.Metadata.Separator />

          <Detail.Metadata.Label title={t("deadline")} text={task.deadline || t("unknownError")} />

          <Detail.Metadata.Separator />

          <Detail.Metadata.Link
            title={t("openInZentao")}
            target={`${preferences.zentaoUrl}/task-view-${task.id}.html`}
            text={t("viewTaskDetails")}
          />
        </Detail.Metadata>
      }
      actions={
        <ActionPanel>
          {/* 只有未完成的任务才显示完成操作 */}
          {task.status !== TaskStatus.DONE && task.status !== TaskStatus.CLOSED && (
            <Action.Push title={t("finishTask")} icon={Icon.Checkmark} target={<FinishTaskForm task={task} />} />
          )}
          <Action.OpenInBrowser
            title={t("openInZentao")}
            url={`${preferences.zentaoUrl}/task-view-${task.id}.html`}
            icon={Icon.Globe}
          />
          <ActionPanel.Section title={t("copyTaskId")}>
            <Action.CopyToClipboard title={t("copyTaskId")} content={task.id} icon={Icon.Clipboard} />
            <Action.CopyToClipboard
              title={t("copyUrl")}
              content={`${preferences.zentaoUrl}/task-view-${task.id}.html`}
              icon={Icon.Link}
            />
            <Action.CopyToClipboard title={t("copyTitle")} content={task.title} icon={Icon.Text} />
          </ActionPanel.Section>
        </ActionPanel>
      }
    />
  );
}
