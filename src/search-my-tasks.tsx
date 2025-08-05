import { ActionPanel, List, Action, Icon, showToast, Toast, getPreferenceValues } from "@raycast/api";
import { useEffect, useState, useMemo } from "react";
import dayjs from "dayjs";
import { Task } from "./types/task";
import { Preferences } from "./types/preferences";
import { fetchTasksFromZentao } from "./utils/taskService";
import { TaskDetail } from "./components/TaskDetail";
import { getStatusIconConfig, TaskStatus } from "./constants/status";
import { getPriorityColor, getPriorityLabel, getPriorityIcon } from "./constants/priority";
import { TAILWIND_COLORS } from "./constants/colors";

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
    return <List isLoading={true} searchBarPlaceholder="Loading tasks..." />;
  }

  return (
    <List
      isLoading={isLoading}
      searchBarPlaceholder="Search tasks by title, status, priority, or assignee..."
      filtering={true}
      navigationTitle="My Tasks"
      actions={
        <ActionPanel>
          <Action title="Refresh" onAction={fetchTasks} icon={Icon.ArrowClockwise} />
          <ActionPanel.Section title="Sort by Date">
            <Action
              title="Sort by Date (Earliest First)"
              onAction={() => setSortOrder("date-asc")}
              icon={Icon.ArrowUp}
            />
            <Action
              title="Sort by Date (Latest First)"
              onAction={() => setSortOrder("date-desc")}
              icon={Icon.ArrowDown}
            />
          </ActionPanel.Section>
          <ActionPanel.Section title="Sort by Priority">
            <Action
              title="Sort by Priority (High to Low)"
              onAction={() => setSortOrder("priority-asc")}
              icon={Icon.ArrowUp}
            />
            <Action
              title="Sort by Priority (Low to High)"
              onAction={() => setSortOrder("priority-desc")}
              icon={Icon.ArrowDown}
            />
          </ActionPanel.Section>
          <ActionPanel.Section title="Sort by Status">
            <Action
              title="Sort by Status (Active First)"
              onAction={() => setSortOrder("status-asc")}
              icon={Icon.ArrowUp}
            />
            <Action
              title="Sort by Status (Completed First)"
              onAction={() => setSortOrder("status-desc")}
              icon={Icon.ArrowDown}
            />
          </ActionPanel.Section>
          <ActionPanel.Section title="Reset">
            <Action title="Reset Sort" onAction={() => setSortOrder("none")} icon={Icon.Minus} />
          </ActionPanel.Section>
        </ActionPanel>
      }
    >
      {sortedTasks.length === 0 ? (
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
                  <Action.Push title="View Task Details" target={<TaskDetail task={task} />} icon={Icon.Eye} />
                  <Action.OpenInBrowser
                    title="Open in Zentao"
                    url={`${preferences.zentaoUrl}/task-view-${task.id}.html`}
                    icon={Icon.Globe}
                  />
                  <Action.CopyToClipboard title="Copy Task ID" content={task.id} icon={Icon.Clipboard} />
                  <Action title="Refresh" onAction={fetchTasks} icon={Icon.ArrowClockwise} />
                  <ActionPanel.Section title="Sort by Date">
                    <Action
                      title="Sort by Date (Earliest First)"
                      onAction={() => setSortOrder("date-asc")}
                      icon={Icon.ArrowUp}
                    />
                    <Action
                      title="Sort by Date (Latest First)"
                      onAction={() => setSortOrder("date-desc")}
                      icon={Icon.ArrowDown}
                    />
                  </ActionPanel.Section>
                  <ActionPanel.Section title="Sort by Priority">
                    <Action
                      title="Sort by Priority (High to Low)"
                      onAction={() => setSortOrder("priority-asc")}
                      icon={Icon.ArrowUp}
                    />
                    <Action
                      title="Sort by Priority (Low to High)"
                      onAction={() => setSortOrder("priority-desc")}
                      icon={Icon.ArrowDown}
                    />
                  </ActionPanel.Section>
                  <ActionPanel.Section title="Sort by Status">
                    <Action
                      title="Sort by Status (Active First)"
                      onAction={() => setSortOrder("status-asc")}
                      icon={Icon.ArrowUp}
                    />
                    <Action
                      title="Sort by Status (Completed First)"
                      onAction={() => setSortOrder("status-desc")}
                      icon={Icon.ArrowDown}
                    />
                  </ActionPanel.Section>
                  <ActionPanel.Section title="Reset">
                    <Action title="Reset Sort" onAction={() => setSortOrder("none")} icon={Icon.Minus} />
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
