import { Color, Icon } from "@raycast/api";

import { BugSeverity } from "../types/bug";

/**
 * 获取Bug严重程度图标
 * @param severity Bug严重程度
 * @returns 图标
 */
export function getBugSeverityIcon(severity: BugSeverity): Icon {
  switch (severity) {
    case BugSeverity.CRITICAL:
      return Icon.ExclamationMark;
    case BugSeverity.MAJOR:
      return Icon.Warning;
    case BugSeverity.NORMAL:
      return Icon.Circle;
    case BugSeverity.MINOR:
      return Icon.Minus;
    default:
      return Icon.Circle;
  }
}

/**
 * 获取Bug严重程度颜色
 * @param severity Bug严重程度
 * @returns 颜色值
 */
export function getBugSeverityColor(severity: BugSeverity): Color {
  switch (severity) {
    case BugSeverity.CRITICAL:
      return Color.Red;
    case BugSeverity.MAJOR:
      return Color.Orange;
    case BugSeverity.NORMAL:
      return Color.Blue;
    case BugSeverity.MINOR:
      return Color.Green;
    default:
      return Color.SecondaryText;
  }
}

/**
 * 获取Bug严重程度显示标签
 * @param severity Bug严重程度
 * @returns 严重程度标签
 */
export function getBugSeverityLabel(severity: BugSeverity): string {
  switch (severity) {
    case BugSeverity.CRITICAL:
      return "关键";
    case BugSeverity.MAJOR:
      return "严重";
    case BugSeverity.NORMAL:
      return "一般";
    case BugSeverity.MINOR:
      return "轻微";
    default:
      return "未知";
  }
}
