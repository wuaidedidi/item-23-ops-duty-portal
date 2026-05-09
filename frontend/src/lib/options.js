export const ROLE_LABELS = {
  admin: "系统管理员",
  engineer: "运维工程师",
  duty: "值班员",
  viewer: "查看人员",
};

export const MODULE_ACCESS = {
  admin: ["dashboard", "assets", "inspections", "faults", "duty", "alerts", "logs", "profile"],
  engineer: ["dashboard", "assets", "inspections", "faults", "duty", "alerts", "logs", "profile"],
  duty: ["dashboard", "inspections", "faults", "duty", "alerts", "profile"],
  viewer: ["dashboard", "assets", "inspections", "faults", "alerts", "profile"],
};

export const ASSET_STATUS = [
  ["normal", "正常"],
  ["warning", "预警"],
  ["fault", "故障"],
  ["offline", "离线"],
];

export const TASK_STATUS = [
  ["pending", "待执行"],
  ["in_progress", "执行中"],
  ["completed", "已完成"],
  ["overdue", "已逾期"],
];

export const RESULT_OPTIONS = [
  ["normal", "正常"],
  ["abnormal", "异常"],
];

export const FAULT_STATUS = [
  ["open", "待处理"],
  ["processing", "处理中"],
  ["closed", "已关闭"],
];

export const SEVERITY_OPTIONS = [
  ["low", "低"],
  ["medium", "中"],
  ["high", "高"],
  ["critical", "严重"],
];

export const DUTY_STATUS = [
  ["scheduled", "已排班"],
  ["on_duty", "值班中"],
  ["off_duty", "已交班"],
];

export const ALERT_LEVEL = [
  ["info", "提示"],
  ["warning", "预警"],
  ["critical", "严重"],
];

export const ALERT_STATUS = [
  ["pending", "待处理"],
  ["processing", "处理中"],
  ["closed", "已关闭"],
];

export function optionLabel(options, value) {
  return options.find(([key]) => key === value)?.[1] || value || "-";
}
