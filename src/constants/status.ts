import { TAILWIND_COLORS } from "./colors";

/**
 * 任务状态枚举
 */
export enum TaskStatus {
  /** 未开始 */
  WAIT = "未开始",
  /** 进行中 */
  DOING = "进行中",
  /** 已完成 */
  DONE = "已完成",
  /** 已暂停 */
  PAUSE = "已暂停",
  /** 已取消 */
  CANCEL = "已取消",
  /** 已关闭 */
  CLOSED = "已关闭",
}

/**
 * 状态显示标签映射
 */
export const STATUS_LABELS = {
  [TaskStatus.WAIT]: "未开始",
  [TaskStatus.DOING]: "进行中",
  [TaskStatus.DONE]: "已完成",
  [TaskStatus.PAUSE]: "已暂停",
  [TaskStatus.CANCEL]: "已取消",
  [TaskStatus.CLOSED]: "已关闭",
} as const;

/**
 * 根据状态获取显示标签
 */
export function getStatusLabel(status: TaskStatus): string {
  return STATUS_LABELS[status];
}

/**
 * 任务状态颜色映射
 */
export const STATUS_COLORS = {
  [TaskStatus.WAIT]: TAILWIND_COLORS.amber[500], // 未开始 - 琥珀色
  [TaskStatus.DOING]: TAILWIND_COLORS.blue[500], // 进行中 - 蓝色
  [TaskStatus.DONE]: TAILWIND_COLORS.emerald[500], // 已完成 - 翡翠绿
  [TaskStatus.PAUSE]: TAILWIND_COLORS.gray[500], // 已暂停 - 灰色
  [TaskStatus.CANCEL]: TAILWIND_COLORS.red[500], // 已取消 - 红色
  [TaskStatus.CLOSED]: TAILWIND_COLORS.gray[600], // 已关闭 - 深灰色
} as const;

/**
 * 根据状态获取颜色
 */
export function getStatusColor(status: TaskStatus): string {
  return STATUS_COLORS[status] || TAILWIND_COLORS.gray[500];
}
