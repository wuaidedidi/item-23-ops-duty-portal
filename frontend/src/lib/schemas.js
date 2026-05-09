import { z } from "zod";

const optionalEmail = z.string().trim().refine((value) => !value || /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value), "邮箱格式不正确");
const optionalPhone = z.string().trim().refine((value) => !value || /^1[3-9]\d{9}$/.test(value), "手机号格式不正确");

export const loginSchema = z.object({
  username: z.string().trim().min(1, "请输入用户名"),
  password: z.string().min(1, "请输入密码"),
});

export const registerSchema = z.object({
  username: z.string().trim().min(2, "用户名至少 2 个字符"),
  password: z.string().min(6, "密码至少需要 6 位"),
  display_name: z.string().trim().optional().default(""),
  email: optionalEmail.optional().default(""),
  phone: optionalPhone.optional().default(""),
});

export const profileSchema = z.object({
  display_name: z.string().trim().min(1, "姓名不能为空"),
  department: z.string().trim().optional().default(""),
  email: optionalEmail.optional().default(""),
  phone: optionalPhone.optional().default(""),
  new_password: z.string().optional().default("").refine((value) => !value || value.length >= 6, "新密码至少需要 6 位"),
});

export const assetSchema = z.object({
  asset_code: z.string().trim().min(1, "资产编号不能为空"),
  name: z.string().trim().min(1, "资产名称不能为空"),
  category: z.string().trim().min(1, "资产类型不能为空"),
  location: z.string().trim().min(1, "所在位置不能为空"),
  owner: z.string().trim().optional().default(""),
  status: z.string().min(1, "请选择运行状态"),
  remark: z.string().optional().default(""),
});

export const inspectionSchema = z.object({
  task_no: z.string().trim().min(1, "任务编号不能为空"),
  title: z.string().trim().min(1, "任务标题不能为空"),
  asset: z.coerce.number().min(1, "请选择巡检资产"),
  inspector: z.coerce.number().min(1, "请选择执行人"),
  scheduled_date: z.string().min(1, "请选择计划日期"),
  status: z.string().min(1, "请选择任务状态"),
});

export const inspectionSubmitSchema = z.object({
  result: z.enum(["normal", "abnormal"], { message: "请选择巡检结果" }),
  result_summary: z.string().optional().default(""),
  exception_note: z.string().optional().default(""),
}).refine((value) => value.result !== "abnormal" || value.exception_note.trim().length > 0, {
  message: "异常巡检必须填写异常说明",
  path: ["exception_note"],
});

export const faultSchema = z.object({
  report_no: z.string().trim().min(1, "故障编号不能为空"),
  title: z.string().trim().min(1, "故障标题不能为空"),
  asset: z.coerce.number().min(1, "请选择关联资产"),
  severity: z.string().min(1, "请选择严重程度"),
  status: z.string().min(1, "请选择处理状态"),
  description: z.string().trim().min(1, "故障描述不能为空"),
  solution: z.string().optional().default(""),
});

export const faultCloseSchema = z.object({
  solution: z.string().trim().min(1, "关闭故障必须填写处理方案"),
});

export const dutySchema = z.object({
  duty_date: z.string().min(1, "请选择值班日期"),
  shift_name: z.string().trim().min(1, "班次不能为空"),
  duty_user: z.coerce.number().min(1, "请选择值班人员"),
  status: z.string().min(1, "请选择值班状态"),
  notes: z.string().optional().default(""),
});

export const alertSchema = z.object({
  title: z.string().trim().min(1, "告警标题不能为空"),
  source_type: z.string().trim().min(1, "来源类型不能为空"),
  asset: z.union([z.coerce.number(), z.literal("")]).optional(),
  level: z.string().min(1, "请选择告警级别"),
  status: z.string().min(1, "请选择处理状态"),
  content: z.string().trim().min(1, "告警内容不能为空"),
});

export const alertHandleSchema = z.object({
  status: z.enum(["processing", "closed"], { message: "请选择处理状态" }),
  handling_note: z.string().optional().default(""),
}).refine((value) => value.status !== "closed" || value.handling_note.trim().length > 0, {
  message: "关闭告警必须填写处理说明",
  path: ["handling_note"],
});

export function parseForm(schema, data) {
  const result = schema.safeParse(data);
  if (!result.success) {
    throw new Error(result.error.issues[0]?.message || "表单填写不完整");
  }
  return result.data;
}
