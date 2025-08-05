import { ActionPanel, List, Action, Icon, showToast, Toast, getPreferenceValues } from "@raycast/api";
import { useEffect, useState, useMemo } from "react";
import dayjs from "dayjs";
import { Task } from "./types/task";
import { fetchTasksFromZentao } from "./utils/taskService";
import { TaskDetail } from "./components/TaskDetail";
import { getStatusIconConfig, TaskStatus } from "./constants/status";
import { getPriorityColor, getPriorityLabel, getPriorityIcon } from "./constants/priority";
import { TAILWIND_COLORS } from "./constants/colors";
import { t } from "./utils/i18n";

type SortOrder = "none" | "date-asc" | "date-desc" | "priority-asc" | "priority-desc" | "status-asc" | "status-desc";

export default function Command() {
  const preferences = getPreferenceValues<Preferences>();

  const [tasks, setTasks] = useState<Task[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [sortOrder, setSortOrder] = useState<SortOrder>("none");

  const fetchTasks = async () => {
    try {
      setIsLoading(true);

      const parsedTasks = await fetchTasksFromZentao();

      showToast({
        style: Toast.Style.Success,
        title: t("connectedToZentao"),
        message: t("foundTasks", { count: parsedTasks.length }),
      });

      setTasks(parsedTasks);
    } catch (error) {
      console.error("Error fetching tasks:", error);

      showToast({
        style: Toast.Style.Failure,
        title: t("failedToFetchTasks"),
        message: error instanceof Error ? error.message : t("unknownError"),
      });
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchTasks();
  }, []);

  // Sort tasks based on current sort order
  const sortedTasks = useMemo(() => {
    if (sortOrder === "none") return tasks;

    const sorted = [...tasks].sort((a, b) => {
      if (sortOrder.startsWith("date")) {
        const dateA = dayjs(a.deadline);
        const dateB = dayjs(b.deadline);

        // Handle invalid dates - put them at the end
        if (!dateA.isValid() && !dateB.isValid()) return 0;
        if (!dateA.isValid()) return 1;
        if (!dateB.isValid()) return -1;

        if (sortOrder === "date-asc") {
          return dateA.isBefore(dateB) ? -1 : dateA.isAfter(dateB) ? 1 : 0;
        } else {
          return dateB.isBefore(dateA) ? -1 : dateB.isAfter(dateA) ? 1 : 0;
        }
      } else if (sortOrder.startsWith("priority")) {
        // Priority: 1 = highest, 4 = lowest
        const priorityA = parseInt(a.priority) || 999;
        const priorityB = parseInt(b.priority) || 999;

        if (sortOrder === "priority-asc") {
          return priorityA - priorityB; // 1,2,3,4 (highest to lowest)
        } else {
          return priorityB - priorityA; // 4,3,2,1 (lowest to highest)
        }
      } else if (sortOrder.startsWith("status")) {
        // Define status order for logical sorting
        const statusOrder = {
          [TaskStatus.WAIT]: 1,
          [TaskStatus.DOING]: 2,
          [TaskStatus.PAUSE]: 3,
          [TaskStatus.DONE]: 4,
          [TaskStatus.CANCEL]: 5,
          [TaskStatus.CLOSED]: 6,
        };

        const statusA = statusOrder[a.status as TaskStatus] || 999;
        const statusB = statusOrder[b.status as TaskStatus] || 999;

        if (sortOrder === "status-asc") {
          return statusA - statusB;
        } else {
          return statusB - statusA;
        }
      }

      return 0;
    });

    return sorted;
  }, [tasks, sortOrder]);

  if (isLoading) {
    return <List isLoading={true} searchBarPlaceholder={t("loading")} />;
  }

  return (
    <List
      isLoading={isLoading}
      searchBarPlaceholder={t("searchPlaceholder")}
      filtering={true}
      navigationTitle={t("myTasks")}
      actions={
        <ActionPanel>
          <Action title={t("refresh")} onAction={fetchTasks} icon={Icon.ArrowClockwise} />
          <ActionPanel.Section title={t("sortByDate")}>
            <Action
              title={t("sortByDateEarliestFirst")}
              onAction={() => setSortOrder("date-asc")}
              icon={Icon.ArrowUp}
            />
            <Action
              title={t("sortByDateLatestFirst")}
              onAction={() => setSortOrder("date-desc")}
              icon={Icon.ArrowDown}
            />
          </ActionPanel.Section>
          <ActionPanel.Section title={t("sortByPriority")}>
            <Action
              title={t("sortByPriorityHighToLow")}
              onAction={() => setSortOrder("priority-asc")}
              icon={Icon.ArrowUp}
            />
            <Action
              title={t("sortByPriorityLowToHigh")}
              onAction={() => setSortOrder("priority-desc")}
              icon={Icon.ArrowDown}
            />
          </ActionPanel.Section>
          <ActionPanel.Section title={t("sortByStatus")}>
            <Action
              title={t("sortByStatusActiveFirst")}
              onAction={() => setSortOrder("status-asc")}
              icon={Icon.ArrowUp}
            />
            <Action
              title={t("sortByStatusCompletedFirst")}
              onAction={() => setSortOrder("status-desc")}
              icon={Icon.ArrowDown}
            />
          </ActionPanel.Section>
          <ActionPanel.Section title={t("resetSort")}>
            <Action title={t("resetSort")} onAction={() => setSortOrder("none")} icon={Icon.Minus} />
          </ActionPanel.Section>
        </ActionPanel>
      }
    >
      {sortedTasks.length === 0 ? (
        <List.EmptyView
          title={t("noTasksTitle")}
          description={t("noTasksDescription")}
          actions={
            <ActionPanel>
              <Action title={t("refresh")} onAction={fetchTasks} icon={Icon.ArrowClockwise} />
            </ActionPanel>
          }
        />
      ) : (
        sortedTasks.map((task) => {
          const isOverdue =
            !(
              task.status === TaskStatus.CANCEL ||
              task.status === TaskStatus.DONE ||
              task.status === TaskStatus.CLOSED
            ) &&
            task.deadline &&
            !(dayjs(task.deadline).format("MM DD") === dayjs().format("MM DD")) &&
            dayjs(task.deadline).year(dayjs().year()).isBefore(dayjs());

          // Format deadline for display using dayjs
          const deadlineDisplay = task.deadline && dayjs(task.deadline).format("MM-DD");

          return (
            <List.Item
              key={task.id}
              icon={getStatusIconConfig(task.status)}
              title={task.title}
              subtitle={task.project}
              keywords={[task.status, task.priority, task.assignedTo || "", deadlineDisplay]}
              accessories={[
                ...(task.deadline
                  ? [
                      {
                        tag: {
                          value: task.deadline,
                          color: isOverdue ? TAILWIND_COLORS.red[400] : TAILWIND_COLORS.gray[300],
                        },
                      },
                    ]
                  : []),
                {
                  icon: {
                    source: getPriorityIcon(task.priority),
                    tintColor: getPriorityColor(task.priority),
                  },
                  tooltip: getPriorityLabel(task.priority),
                },
              ]}
              actions={
                <ActionPanel>
                  <Action.Push title={t("viewTaskDetails")} target={<TaskDetail task={task} />} icon={Icon.Eye} />
                  <Action.OpenInBrowser
                    title={t("openInZentao")}
                    url={`${preferences.zentaoUrl}/task-view-${task.id}.html`}
                    icon={Icon.Globe}
                  />
                  <Action.CopyToClipboard title={t("copyTaskId")} content={task.id} icon={Icon.Clipboard} />
                  <Action title={t("refresh")} onAction={fetchTasks} icon={Icon.ArrowClockwise} />
                  <ActionPanel.Section title={t("sortByDate")}>
                    <Action
                      title={t("sortByDateEarliestFirst")}
                      onAction={() => setSortOrder("date-asc")}
                      icon={Icon.ArrowUp}
                    />
                    <Action
                      title={t("sortByDateLatestFirst")}
                      onAction={() => setSortOrder("date-desc")}
                      icon={Icon.ArrowDown}
                    />
                  </ActionPanel.Section>
                  <ActionPanel.Section title={t("sortByPriority")}>
                    <Action
                      title={t("sortByPriorityHighToLow")}
                      onAction={() => setSortOrder("priority-asc")}
                      icon={Icon.ArrowUp}
                    />
                    <Action
                      title={t("sortByPriorityLowToHigh")}
                      onAction={() => setSortOrder("priority-desc")}
                      icon={Icon.ArrowDown}
                    />
                  </ActionPanel.Section>
                  <ActionPanel.Section title={t("sortByStatus")}>
                    <Action
                      title={t("sortByStatusActiveFirst")}
                      onAction={() => setSortOrder("status-asc")}
                      icon={Icon.ArrowUp}
                    />
                    <Action
                      title={t("sortByStatusCompletedFirst")}
                      onAction={() => setSortOrder("status-desc")}
                      icon={Icon.ArrowDown}
                    />
                  </ActionPanel.Section>
                  <ActionPanel.Section title={t("resetSort")}>
                    <Action title={t("resetSort")} onAction={() => setSortOrder("none")} icon={Icon.Minus} />
                  </ActionPanel.Section>
                </ActionPanel>
              }
            />
          );
        })
      )}
    </List>
  );
}
