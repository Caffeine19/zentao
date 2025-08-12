/**
 * 缺陷（Bug）信息接口
 *
 * 说明：字段设计尽量对齐 Task，便于复用 UI 和逻辑。
 */
export interface Bug {
  /** 缺陷ID（字符串形式以便直接使用 data-id） */
  id: string;
  /** 标题 */
  title: string;
  /** 状态（直接使用禅道页面上的中文状态文本，如：激活、已解决、已关闭） */
  status: string;
  /** 所属执行/项目名称 */
  project: string;
  /** 指派给 */
  assignedTo: string;
  /** 截止日期（保留原字符串） */
  deadline: string;
  /** 优先级（禅道 Bug 使用优先级，与任务一致 1-4；保留 number 以便映射） */
  priority: number;
  /** 预计工时（可为空字符串，保持页面文本） */
  estimate: string;
  /** 消耗工时 */
  consumed: string;
  /** 剩余工时 */
  left: string;
}
