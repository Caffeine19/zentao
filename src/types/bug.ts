import { TaskPriority } from "../constants/priority";

/**
 * Bug状态枚举
 */
export enum BugStatus {
  /** 激活 */
  ACTIVE = "active",
  /** 已解决 */
  RESOLVED = "resolved",
  /** 已关闭 */
  CLOSED = "closed",
}

/**
 * Bug严重程度枚举
 */
export enum BugSeverity {
  /** 轻微 */
  MINOR = "1",
  /** 一般 */
  NORMAL = "2",
  /** 严重 */
  MAJOR = "3",
  /** 关键 */
  CRITICAL = "4",
}

/**
 * Bug类型枚举
 */
export enum BugType {
  /** 代码错误 */
  CODE_ERROR = "codeerror",
  /** 配置相关 */
  CONFIG = "config",
  /** 安装部署 */
  INSTALL = "install",
  /** 安全相关 */
  SECURITY = "security",
  /** 性能问题 */
  PERFORMANCE = "performance",
  /** 标准规范 */
  STANDARD = "standard",
  /** 测试脚本 */
  TEST_SCRIPT = "testscript",
  /** UI缺陷 */
  UI_DEFECT = "uiDefect",
  /** 需求 */
  REQUIREMENT = "requirement",
  /** 其他 */
  OTHERS = "others",
}

/**
 * Bug解决方案枚举
 */
export enum BugResolution {
  /** 已解决 */
  FIXED = "fixed",
  /** 不予解决 */
  WONTFIX = "wontfix",
  /** 外部原因 */
  EXTERNAL = "external",
  /** 重复Bug */
  DUPLICATE = "duplicate",
  /** 无法重现 */
  NOTREPRO = "notrepro",
  /** 延期处理 */
  POSTPONED = "postponed",
  /** 设计如此 */
  BYDESIGN = "bydesign",
  /** 无需修复 */
  WILLNOTFIX = "willnotfix",
  /** 转为需求 */
  TOSTORY = "tostory",
}

/**
 * 禅道Bug对象
 */
export interface Bug {
  /** Bug ID */
  id: string;
  /** Bug标题 */
  title: string;
  /** Bug状态 */
  status: BugStatus;
  /** 严重程度 */
  severity: BugSeverity;
  /** 优先级 */
  priority: TaskPriority;
  /** Bug类型 */
  type: BugType;
  /** 所属产品 */
  product: string;
  /** 创建者 */
  openedBy: string;
  /** 指派给 */
  assignedTo: string;
  /** 确认状态 */
  confirmed: boolean;
  /** 截止日期 */
  deadline: string;
  /** 解决者 */
  resolvedBy: string;
  /** 解决方案 */
  resolution: BugResolution | "";
}
