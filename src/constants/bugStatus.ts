import { Color, Icon } from "@raycast/api";

import { BugStatus } from "../types/bug";

/**
 * 获取Bug状态图标配置
 * @param status Bug状态
 * @returns 图标配置对象
 */
export function getBugStatusIconConfig(status: BugStatus) {
  switch (status) {
    case BugStatus.ACTIVE:
      return { source: Icon.Bug, tintColor: Color.SecondaryText };
    case BugStatus.RESOLVED:
      return { source: Icon.CheckCircle, tintColor: Color.Green };
    case BugStatus.CLOSED:
      return { source: Icon.XMarkCircle, tintColor: Color.SecondaryText };
    default:
      return { source: Icon.Circle, tintColor: Color.SecondaryText };
  }
}

/**
 * 获取Bug状态显示标签
 * @param status Bug状态
 * @returns 状态标签
 */
export function getBugStatusLabel(status: BugStatus): string {
  switch (status) {
    case BugStatus.ACTIVE:
      return "激活";
    case BugStatus.RESOLVED:
      return "已解决";
    case BugStatus.CLOSED:
      return "已关闭";
    default:
      return "未知";
  }
}

/**
 * 获取Bug状态颜色
 * @param status Bug状态
 * @returns 颜色值
 */
export function getBugStatusColor(status: BugStatus): Color {
  switch (status) {
    case BugStatus.ACTIVE:
      return Color.Red;
    case BugStatus.RESOLVED:
      return Color.Green;
    case BugStatus.CLOSED:
      return Color.SecondaryText;
    default:
      return Color.SecondaryText;
  }
}
