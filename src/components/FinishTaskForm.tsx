import { ActionPanel, Form, Action, showToast, Toast, popToRoot, Icon } from "@raycast/api";
import { useForm, Controller } from "react-hook-form";
import { useState, useEffect } from "react";
import { Task } from "../types/task";
import { TeamMember } from "../types/teamMember";
import { finishTask, FinishTaskParams, fetchTaskFormDetails, SessionExpiredError } from "../utils/taskService";
import dayjs from "dayjs";
import { useT } from "../hooks/useT";

interface FinishTaskFormProps {
  task: Task;
  onFinished?: () => void;
}

interface FormValues {
  currentConsumed: string;
  consumed: string;
  assignedTo: string;
  realStarted: string;
  finishedDate: string;
  comment: string;
}

export function FinishTaskForm({ task, onFinished }: FinishTaskFormProps) {
  const { t } = useT();
  const [isLoading, setIsLoading] = useState(false);
  const [members, setMembers] = useState<TeamMember[]>([]);
  const [formUid, setFormUid] = useState<string>("");

  // 预设默认值
  const now = dayjs().format("YYYY-MM-DD HH:mm");
  const defaultConsumed = task.consumed || "0";
  const defaultCurrentConsumed = "8";

  // 计算总消耗工时
  const calculateTotalConsumed = (current: string) => {
    const currentNum = parseFloat(current) || 0;
    const previousNum = parseFloat(defaultConsumed) || 0;
    return (currentNum + previousNum).toString();
  };

  const {
    control,
    handleSubmit,
    watch,
    setValue,
    formState: { errors },
  } = useForm<FormValues>({
    defaultValues: {
      currentConsumed: defaultCurrentConsumed,
      consumed: calculateTotalConsumed(defaultCurrentConsumed),
      assignedTo: "", // Will be set after loading form details
      realStarted: "",
      finishedDate: now,
      comment: "",
    },
  });

  // Watch currentConsumed to update total consumed
  const currentConsumed = watch("currentConsumed");

  useEffect(() => {
    const newTotal = calculateTotalConsumed(currentConsumed);
    setValue("consumed", newTotal);
  }, [currentConsumed, setValue]);

  const onSubmit = async (values: FormValues) => {
    setIsLoading(true);

    try {
      const params: FinishTaskParams = {
        taskId: task.id,
        currentConsumed: values.currentConsumed,
        consumed: values.consumed,
        assignedTo: values.assignedTo || task.assignedTo,
        realStarted: values.realStarted,
        finishedDate: values.finishedDate,
        status: "done",
        uid: formUid,
        comment: values.comment,
      };

      console.log("🚀 ~ FinishTaskForm.tsx ~ onSubmit ~ params:", params);

      await finishTask(params);

      showToast({
        style: Toast.Style.Success,
        title: t("taskCompletion.taskCompletedSuccessTitle"),
        message: t("taskCompletion.taskCompletedSuccessMessage", { title: task.title }),
      });

      if (onFinished) {
        onFinished();
      }

      // 返回到根视图
      popToRoot();
    } catch (error) {
      console.error("Error finishing task:", error);

      // 检查是否是会话过期错误
      if (error instanceof SessionExpiredError) {
        showToast({
          style: Toast.Style.Failure,
          title: t("errors.sessionExpired"),
          message: t("errors.sessionExpiredDescription"),
        });
      } else {
        showToast({
          style: Toast.Style.Failure,
          title: t("taskCompletion.taskCompletionFailedTitle"),
          message: error instanceof Error ? error.message : t("errors.unknownError"),
        });
      }
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    const loadFormData = async () => {
      try {
        const formDetails = await fetchTaskFormDetails(task.id);
        setMembers(formDetails.members);
        setFormUid(formDetails.uid);

        const selectedMember = formDetails.members.find((member) => member.selected);
        if (selectedMember) {
          // Update the form with the selected member's value instead of the task's assignedTo
          setValue("assignedTo", selectedMember.value);
        }
      } catch (error) {
        console.error("Failed to load form details:", error);

        // 检查是否是会话过期错误
        if (error instanceof SessionExpiredError) {
          showToast({
            style: Toast.Style.Failure,
            title: t("errors.sessionExpired"),
            message: t("errors.sessionExpiredDescription"),
          });
        } else {
          showToast({
            style: Toast.Style.Failure,
            title: t("errors.loadFormDetailsError"),
            message: String(error),
          });
        }
      }
    };

    loadFormData();
  }, [task.id, setValue]);

  return (
    <Form
      isLoading={isLoading}
      actions={
        <ActionPanel>
          <Action title={t("taskActions.finishTask")} icon={Icon.Checkmark} onAction={handleSubmit(onSubmit)} />
        </ActionPanel>
      }
    >
      <Form.Description title={t("taskForm.finishTaskTitle")} text={task.title} />
      <Form.Description title={t("taskDetails.project")} text={task.project} />
      <Form.Separator />

      <Controller
        name="currentConsumed"
        control={control}
        render={({ field }) => (
          <Form.TextField
            id="currentConsumed"
            title={t("taskForm.currentConsumedTime")}
            placeholder={t("taskForm.currentConsumedTimePlaceholder")}
            info={t("taskForm.currentConsumedTimeInfo")}
            value={field.value}
            onChange={field.onChange}
            error={errors.currentConsumed?.message}
          />
        )}
      />

      <Form.Description
        title={t("taskForm.totalConsumedTime")}
        text={t("taskForm.totalConsumedTimeCalculation", {
          total: watch("consumed"),
          previous: defaultConsumed,
          current: currentConsumed,
        })}
      />

      <Controller
        name="assignedTo"
        control={control}
        render={({ field }) => (
          <Form.Dropdown
            id="assignedTo"
            title={t("taskForm.assignTo")}
            info={t("taskForm.assignToInfo")}
            value={field.value}
            onChange={field.onChange}
          >
            {members.map((member: TeamMember) => (
              <Form.Dropdown.Item key={member.value} value={member.value} title={member.title} />
            ))}
          </Form.Dropdown>
        )}
      />

      <Form.Separator />

      <Controller
        name="realStarted"
        control={control}
        render={({ field }) => (
          <Form.DatePicker
            id="realStarted"
            title={t("taskForm.actualStartTime")}
            info={t("taskForm.actualStartTimeInfo")}
            type={Form.DatePicker.Type.DateTime}
            value={field.value ? dayjs(field.value).toDate() : null}
            onChange={(date) => field.onChange(date ? dayjs(date).format("YYYY-MM-DD HH:mm") : "")}
            error={errors.realStarted?.message}
          />
        )}
      />

      <Controller
        name="finishedDate"
        control={control}
        render={({ field }) => (
          <Form.DatePicker
            id="finishedDate"
            title={t("taskForm.finishTime")}
            info={t("taskForm.finishTimeInfo")}
            type={Form.DatePicker.Type.DateTime}
            value={field.value ? dayjs(field.value).toDate() : null}
            onChange={(date) => field.onChange(date ? dayjs(date).format("YYYY-MM-DD HH:mm") : "")}
            error={errors.finishedDate?.message}
          />
        )}
      />

      <Form.Separator />

      <Controller
        name="comment"
        control={control}
        render={({ field }) => (
          <Form.TextArea
            id="comment"
            title={t("taskForm.comments")}
            placeholder={t("taskForm.commentsPlaceholder")}
            info={t("taskForm.commentsInfo")}
            value={field.value}
            onChange={field.onChange}
            error={errors.comment?.message}
          />
        )}
      />
    </Form>
  );
}
