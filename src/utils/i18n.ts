import { getPreferenceValues } from "@raycast/api";

export type Language = "zh-CN" | "en-US";

export interface Translations {
  // General
  loading: string;
  refresh: string;
  cancel: string;
  submit: string;
  
  // Task list
  searchPlaceholder: string;
  myTasks: string;
  noTasksTitle: string;
  noTasksDescription: string;
  connectedToZentao: string;
  foundTasks: string;
  failedToFetchTasks: string;
  
  // Task actions
  viewTaskDetails: string;
  openInZentao: string;
  copyTaskId: string;
  finishTask: string;
  
  // Sort actions
  sortByDate: string;
  sortByDateEarliestFirst: string;
  sortByDateLatestFirst: string;
  sortByPriority: string;
  sortByPriorityHighToLow: string;
  sortByPriorityLowToHigh: string;
  sortByStatus: string;
  sortByStatusActiveFirst: string;
  sortByStatusCompletedFirst: string;
  resetSort: string;
  
  // Task form
  finishTaskTitle: string;
  currentConsumedTime: string;
  currentConsumedTimePlaceholder: string;
  currentConsumedTimeInfo: string;
  totalConsumedTime: string;
  totalConsumedTimeCalculation: string;
  assignTo: string;
  assignToInfo: string;
  actualStartTime: string;
  actualStartTimeInfo: string;
  finishTime: string;
  finishTimeInfo: string;
  comments: string;
  commentsPlaceholder: string;
  commentsInfo: string;
  
  // Task completion
  taskCompletedSuccessTitle: string;
  taskCompletedSuccessMessage: string;
  taskCompletionFailedTitle: string;
  
  // Task status
  statusWait: string;
  statusDoing: string;
  statusDone: string;
  statusPause: string;
  statusCancel: string;
  statusClosed: string;
  
  // Priority
  priorityHigh: string;
  priorityMedium: string;
  priorityLow: string;
  priorityCritical: string;
  
  // Task details
  project: string;
  currentStatus: string;
  priority: string;
  assignedTo: string;
  deadline: string;
  estimatedTime: string;
  consumedTime: string;
  remainingTime: string;
  
  // Form errors
  loadFormDetailsError: string;
  unknownError: string;
  
  // Additional keys for task details
  taskTitle: string;
  copyUrl: string;
  copyTitle: string;
  notSet: string;
  notCalculated: string;
  notAssigned: string;
}

const translations: Record<Language, Translations> = {
  "zh-CN": {
    // General
    loading: "加载中...",
    refresh: "刷新",
    cancel: "取消",
    submit: "提交",
    
    // Task list
    searchPlaceholder: "按标题、状态、优先级或指派人搜索任务...",
    myTasks: "我的任务",
    noTasksTitle: "未找到任务",
    noTasksDescription: "您没有分配的任务或获取任务时出现问题。",
    connectedToZentao: "已连接到禅道",
    foundTasks: "找到 {count} 个任务",
    failedToFetchTasks: "获取任务失败",
    
    // Task actions
    viewTaskDetails: "查看任务详情",
    openInZentao: "在禅道中打开",
    copyTaskId: "复制任务ID",
    finishTask: "完成任务",
    
    // Sort actions
    sortByDate: "按日期排序",
    sortByDateEarliestFirst: "按日期排序（最早优先）",
    sortByDateLatestFirst: "按日期排序（最晚优先）",
    sortByPriority: "按优先级排序",
    sortByPriorityHighToLow: "按优先级排序（高到低）",
    sortByPriorityLowToHigh: "按优先级排序（低到高）",
    sortByStatus: "按状态排序",
    sortByStatusActiveFirst: "按状态排序（活跃优先）",
    sortByStatusCompletedFirst: "按状态排序（已完成优先）",
    resetSort: "重置排序",
    
    // Task form
    finishTaskTitle: "完成任务",
    currentConsumedTime: "本次消耗工时",
    currentConsumedTimePlaceholder: "输入本次工作消耗的小时数",
    currentConsumedTimeInfo: "本次工作会话消耗的工时（小时）",
    totalConsumedTime: "总消耗工时",
    totalConsumedTimeCalculation: "{total} 小时（自动计算：之前 {previous} + 本次 {current}）",
    assignTo: "指派给",
    assignToInfo: "可以重新指派任务",
    actualStartTime: "实际开始时间",
    actualStartTimeInfo: "任务实际开始的时间",
    finishTime: "完成时间",
    finishTimeInfo: "任务完成的时间",
    comments: "备注",
    commentsPlaceholder: "输入任务完成的备注信息（可选）",
    commentsInfo: "可以添加任务完成的说明、遇到的问题或其他相关信息",
    
    // Task completion
    taskCompletedSuccessTitle: "任务完成成功",
    taskCompletedSuccessMessage: "任务 \"{title}\" 已标记为完成",
    taskCompletionFailedTitle: "完成任务失败",
    
    // Task status
    statusWait: "未开始",
    statusDoing: "进行中",
    statusDone: "已完成",
    statusPause: "已暂停",
    statusCancel: "已取消",
    statusClosed: "已关闭",
    
    // Priority
    priorityHigh: "高",
    priorityMedium: "中",
    priorityLow: "低",
    priorityCritical: "紧急",
    
    // Task details
    project: "项目",
    currentStatus: "当前状态",
    priority: "优先级",
    assignedTo: "指派人",
    deadline: "截止日期",
    estimatedTime: "预计工时",
    consumedTime: "已消耗",
    remainingTime: "剩余工时",
    
    // Form errors
    loadFormDetailsError: "加载表单详情失败",
    unknownError: "未知错误",
    
    // Additional keys for task details
    taskTitle: "任务",
    copyUrl: "复制任务 URL",
    copyTitle: "复制任务标题",
    notSet: "未设置",
    notCalculated: "未计算",
    notAssigned: "未指派",
  },
  "en-US": {
    // General
    loading: "Loading...",
    refresh: "Refresh",
    cancel: "Cancel",
    submit: "Submit",
    
    // Task list
    searchPlaceholder: "Search tasks by title, status, priority, or assignee...",
    myTasks: "My Tasks",
    noTasksTitle: "No tasks found",
    noTasksDescription: "Either you have no tasks assigned or there was an issue fetching them.",
    connectedToZentao: "Connected to Zentao",
    foundTasks: "Found {count} tasks",
    failedToFetchTasks: "Failed to fetch tasks",
    
    // Task actions
    viewTaskDetails: "View Task Details",
    openInZentao: "Open in Zentao",
    copyTaskId: "Copy Task ID",
    finishTask: "Finish Task",
    
    // Sort actions
    sortByDate: "Sort by Date",
    sortByDateEarliestFirst: "Sort by Date (Earliest First)",
    sortByDateLatestFirst: "Sort by Date (Latest First)",
    sortByPriority: "Sort by Priority",
    sortByPriorityHighToLow: "Sort by Priority (High to Low)",
    sortByPriorityLowToHigh: "Sort by Priority (Low to High)",
    sortByStatus: "Sort by Status",
    sortByStatusActiveFirst: "Sort by Status (Active First)",
    sortByStatusCompletedFirst: "Sort by Status (Completed First)",
    resetSort: "Reset Sort",
    
    // Task form
    finishTaskTitle: "Finish Task",
    currentConsumedTime: "Current Consumed Time",
    currentConsumedTimePlaceholder: "Enter hours consumed for this session",
    currentConsumedTimeInfo: "Hours consumed in this work session",
    totalConsumedTime: "Total Consumed Time",
    totalConsumedTimeCalculation: "{total} hours (Auto-calculated: Previous {previous} + Current {current})",
    assignTo: "Assign To",
    assignToInfo: "Can reassign the task",
    actualStartTime: "Actual Start Time",
    actualStartTimeInfo: "When the task actually started",
    finishTime: "Finish Time",
    finishTimeInfo: "When the task was completed",
    comments: "Comments",
    commentsPlaceholder: "Enter completion notes (optional)",
    commentsInfo: "Add completion notes, issues encountered, or other relevant information",
    
    // Task completion
    taskCompletedSuccessTitle: "Task Completed Successfully",
    taskCompletedSuccessMessage: "Task \"{title}\" has been marked as completed",
    taskCompletionFailedTitle: "Failed to Complete Task",
    
    // Task status
    statusWait: "Waiting",
    statusDoing: "In Progress",
    statusDone: "Done",
    statusPause: "Paused",
    statusCancel: "Cancelled",
    statusClosed: "Closed",
    
    // Priority
    priorityHigh: "High",
    priorityMedium: "Medium",
    priorityLow: "Low",
    priorityCritical: "Critical",
    
    // Task details
    project: "Project",
    currentStatus: "Current Status",
    priority: "Priority",
    assignedTo: "Assigned To",
    deadline: "Deadline",
    estimatedTime: "Estimated Time",
    consumedTime: "Consumed Time",
    remainingTime: "Remaining Time",
    
    // Form errors
    loadFormDetailsError: "Failed to load form details",
    unknownError: "Unknown error",
    
    // Additional keys for task details
    taskTitle: "Task",
    copyUrl: "Copy Task URL",
    copyTitle: "Copy Task Title",
    notSet: "Not Set",
    notCalculated: "Not Calculated",
    notAssigned: "Not Assigned",
  },
};

let currentLanguage: Language | null = null;

export function getCurrentLanguage(): Language {
  if (!currentLanguage) {
    const preferences = getPreferenceValues<Preferences>();
    currentLanguage = preferences.language;
  }
  return currentLanguage;
}

export function t(key: keyof Translations, replacements?: Record<string, string | number>): string {
  const language = getCurrentLanguage();
  let text = translations[language][key];
  
  if (replacements) {
    Object.entries(replacements).forEach(([placeholder, value]) => {
      text = text.replace(`{${placeholder}}`, String(value));
    });
  }
  
  return text;
}

// Reset language cache when preferences might have changed
export function resetLanguageCache(): void {
  currentLanguage = null;
}
