import { ActionPanel, List, Action, Icon, showToast, Toast, getPreferenceValues } from "@raycast/api";
import { useEffect, useState } from "react";
import dayjs from "dayjs";
import { Task } from "./types/task";
import { Preferences } from "./types/preferences";
import { fetchTasksFromZentao } from "./utils/taskService";
import { TaskDetail } from "./components/TaskDetail";
import { getStatusIconConfig, TaskStatus } from "./constants/status";
import { getPriorityColor, getPriorityLabel, getPriorityIcon } from "./constants/priority";
import { TAILWIND_COLORS } from "./constants/colors";

export default function Command() {
  const preferences = getPreferenceValues<Preferences>();

  const [tasks, setTasks] = useState<Task[]>([]);
  const [isLoading, setIsLoading] = useState(true);

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
        tasks.map((task) => {
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
                </ActionPanel>
              }
            />
          );
        })
      )}
    </List>
  );
}
