/**
 * 禅道任务对象
 */
export interface Task {
  /** 任务 ID */
  id: string;
  /** 任务标题 */
  title: string;
  /** 任务状态 */
  status: string;
  /** 所属项目 */
  project: string;
  /** 指派给 */
  assignedTo: string;
  /** 截止日期 */
  deadline: string;
  /** 优先级 */
  priority: string;
  /** 预计工时 */
  estimate: string;
  /** 消耗工时 */
  consumed: string;
  /** 剩余工时 */
  left: string;
}
