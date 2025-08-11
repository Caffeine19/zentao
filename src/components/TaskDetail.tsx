import { Action, ActionPanel, Detail, getPreferenceValues, Icon, showToast, Toast } from "@raycast/api";

import { getPriorityColor, getPriorityLabel } from "../constants/priority";
import { getStatusColor, getStatusLabel } from "../constants/status";
import { TaskStatus } from "../constants/status";
import { useT } from "../hooks/useT";
import { Task } from "../types/task";
import { logger } from "../utils/logger";
import { reLoginUser } from "../utils/loginService";
import { FinishTaskForm } from "./FinishTaskForm";

interface TaskDetailProps {
  task: Task;
}

export function TaskDetail({ task }: TaskDetailProps) {
  const preferences = getPreferenceValues<Preferences>();

  const { t } = useT();

  const handleRefreshSession = async () => {
    try {
      showToast({
        style: Toast.Style.Animated,
        title: t("sessionRefresh.refreshingSession"),
        message: t("sessionRefresh.pleaseWait"),
      });

      await reLoginUser();

      showToast({
        style: Toast.Style.Success,
        title: t("sessionRefresh.sessionRefreshSuccess"),
        message: t("sessionRefresh.sessionRefreshSuccessDescription"),
      });
    } catch (error) {
      logger.error("Error during manual session refresh:", error instanceof Error ? error : String(error));
      showToast({
        style: Toast.Style.Failure,
        title: t("sessionRefresh.sessionRefreshFailed"),
        message: error instanceof Error ? error.message : t("errors.unknownError"),
      });
    }
  };

  const markdown = /* md */ `
##   ${task.title}

| 🕰️ ${t("taskDetails.estimatedTime")} | ⚡ ${t("taskDetails.consumedTime")} | ⏳ ${t("taskDetails.remainingTime")} |
|:--:|:--:|:--:|
| ${task.estimate || t("taskDetails.notSet")} | ${task.consumed || "0"} | ${task.left || t("taskDetails.notCalculated")} |
`;

  return (
    <Detail
      markdown={markdown}
      navigationTitle={`${t("taskDetails.taskTitle")} #${task.id}`}
      metadata={
        <Detail.Metadata>
          <Detail.Metadata.Label title={`${t("taskDetails.taskTitle")} ID`} text={task.id} />

          <Detail.Metadata.Separator />

          <Detail.Metadata.TagList title={t("taskDetails.currentStatus")}>
            <Detail.Metadata.TagList.Item text={getStatusLabel(task.status)} color={getStatusColor(task.status)} />
          </Detail.Metadata.TagList>

          <Detail.Metadata.TagList title={t("taskDetails.priority")}>
            <Detail.Metadata.TagList.Item
              text={`${getPriorityLabel(task.priority)}(${task.priority})`}
              color={getPriorityColor(task.priority)}
            />
          </Detail.Metadata.TagList>

          <Detail.Metadata.Separator />

          <Detail.Metadata.Label title={t("taskDetails.project")} text={task.project || t("errors.unknownError")} />
          <Detail.Metadata.Label
            title={t("taskDetails.assignedTo")}
            text={task.assignedTo || t("taskDetails.notAssigned")}
          />

          <Detail.Metadata.Separator />

          <Detail.Metadata.Label title={t("taskDetails.deadline")} text={task.deadline || t("errors.unknownError")} />

          <Detail.Metadata.Separator />

          <Detail.Metadata.Link
            title={t("taskActions.openInZentao")}
            target={`${preferences.zentaoUrl}/task-view-${task.id}.html`}
            text={t("taskActions.viewTaskDetails")}
          />
        </Detail.Metadata>
      }
      actions={
        <ActionPanel>
          {/* 只有未完成的任务才显示完成操作 */}
          {task.status !== TaskStatus.DONE && task.status !== TaskStatus.CLOSED && (
            <Action.Push
              title={t("taskActions.finishTask")}
              icon={Icon.Checkmark}
              target={<FinishTaskForm task={task} />}
            />
          )}
          <Action.OpenInBrowser
            title={t("taskActions.openInZentao")}
            url={`${preferences.zentaoUrl}/task-view-${task.id}.html`}
            icon={Icon.Globe}
          />
          <Action
            title={t("sessionRefresh.refreshSession")}
            onAction={handleRefreshSession}
            icon={Icon.Key}
            shortcut={{ modifiers: ["cmd", "shift"], key: "r" }}
          />
          <ActionPanel.Section title={t("taskActions.copyTaskId")}>
            <Action.CopyToClipboard title={t("taskActions.copyTaskId")} content={task.id} icon={Icon.Clipboard} />
            <Action.CopyToClipboard
              title={t("taskDetails.copyUrl")}
              content={`${preferences.zentaoUrl}/task-view-${task.id}.html`}
              icon={Icon.Link}
            />
            <Action.CopyToClipboard title={t("taskDetails.copyTitle")} content={task.title} icon={Icon.Text} />
          </ActionPanel.Section>
        </ActionPanel>
      }
    />
  );
}
