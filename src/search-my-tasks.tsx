import { ActionPanel, Detail, List, Action, Icon, showToast, Toast, getPreferenceValues } from "@raycast/api";
import { useEffect, useState } from "react";
import { Task } from "./types/task";
import { fetchTasksFromZentao } from "./utils/taskService";

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
