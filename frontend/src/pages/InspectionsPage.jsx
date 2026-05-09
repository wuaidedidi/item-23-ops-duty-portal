import { Button } from "@heroui/react";
import { CheckCircle2, Edit3, Send } from "lucide-react";
import { useEffect, useMemo, useState } from "react";

import DataTable from "../components/DataTable.jsx";
import FormModal from "../components/FormModal.jsx";
import { Field, SelectInput, TextArea, TextInput } from "../components/FormFields.jsx";
import StatusChip from "../components/StatusChip.jsx";
import { useAuth } from "../context/AuthContext.jsx";
import { useNotify } from "../context/NotificationContext.jsx";
import { lookupApi, resourceApi } from "../lib/api.js";
import { RESULT_OPTIONS, TASK_STATUS, optionLabel } from "../lib/options.js";
import { inspectionSchema, inspectionSubmitSchema, parseForm } from "../lib/schemas.js";
import { usePagedResource } from "../lib/usePagedResource.js";

const emptyTask = { task_no: "", title: "", asset: "", inspector: "", scheduled_date: "", status: "pending" };
const emptySubmit = { result: "normal", result_summary: "", exception_note: "" };

export default function InspectionsPage() {
  const { user } = useAuth();
  const notify = useNotify();
  const { rows, q, setQ, loading, load, pagination } = usePagedResource("inspection-tasks");
  const [assets, setAssets] = useState([]);
  const [users, setUsers] = useState([]);
  const [taskModal, setTaskModal] = useState({ open: false, mode: "create", data: emptyTask });
  const [submitModal, setSubmitModal] = useState({ open: false, task: null, data: emptySubmit });
  const [saving, setSaving] = useState(false);
  const canWrite = ["admin", "engineer", "duty"].includes(user.role);

  useEffect(() => {
    resourceApi.list("assets", { pageSize: 50 }).then((data) => setAssets(data.list || []));
    lookupApi.users().then(setUsers);
  }, []);

  const assetOptions = useMemo(() => assets.map((item) => [String(item.id), `${item.asset_code} · ${item.name}`]), [assets]);
  const userOptions = useMemo(() => users.map((item) => [String(item.id), item.label]), [users]);

  const submitTask = async (event) => {
    event.preventDefault();
    try {
      setSaving(true);
      const payload = parseForm(inspectionSchema, taskModal.data);
      if (taskModal.mode === "create") {
        await resourceApi.create("inspection-tasks", payload);
        notify.success("巡检任务已创建");
      } else {
        await resourceApi.update("inspection-tasks", taskModal.data.id, payload);
        notify.success("巡检任务已更新");
      }
      setTaskModal({ open: false, mode: "create", data: emptyTask });
      await load();
    } catch (error) {
      if (!error._isBusinessError) notify.error(error.message);
    } finally {
      setSaving(false);
    }
  };

  const submitResult = async (event) => {
    event.preventDefault();
    try {
      setSaving(true);
      const payload = parseForm(inspectionSubmitSchema, submitModal.data);
      await resourceApi.action("inspection-tasks", submitModal.task.id, "submit", payload);
      notify.success(payload.result === "abnormal" ? "巡检异常已提交，并生成告警与故障记录" : "巡检结果已提交");
      setSubmitModal({ open: false, task: null, data: emptySubmit });
      await load();
    } catch (error) {
      if (!error._isBusinessError) notify.error(error.message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <>
      <DataTable
        title="巡检任务管理"
        subtitle="接收巡检任务，提交结果；异常结果会生成告警与故障登记"
        columns={[
          { key: "task_no", title: "任务编号", width: 160 },
          { key: "title", title: "任务标题", width: 220 },
          { key: "assetName", title: "资产", width: 160 },
          { key: "inspectorName", title: "执行人", width: 120, render: (row) => row.inspectorName || "-" },
          { key: "scheduled_date", title: "计划日期", width: 120 },
          { key: "status", title: "任务状态", width: 110, render: (row) => <StatusChip value={row.status} label={row.statusLabel || optionLabel(TASK_STATUS, row.status)} /> },
          { key: "result", title: "巡检结果", width: 110, render: (row) => <StatusChip value={row.result} label={row.resultLabel || (row.result === "unchecked" ? "未提交" : optionLabel(RESULT_OPTIONS, row.result))} /> },
        ]}
        rows={rows}
        pagination={pagination}
        q={q}
        onSearch={setQ}
        onRefresh={load}
        onCreate={() => setTaskModal({ open: true, mode: "create", data: emptyTask })}
        canCreate={canWrite}
        loading={loading}
        createText="新增任务"
        actions={(row) =>
          canWrite ? (
            <>
              <Button size="sm" variant="flat" startContent={<Edit3 size={15} />} onPress={() => setTaskModal({ open: true, mode: "edit", data: { ...row } })}>
                编辑
              </Button>
              {row.status !== "completed" ? (
                <Button size="sm" color="primary" variant="flat" startContent={<Send size={15} />} onPress={() => setSubmitModal({ open: true, task: row, data: emptySubmit })}>
                  提交
                </Button>
              ) : (
                <Button size="sm" variant="flat" startContent={<CheckCircle2 size={15} />} isDisabled>
                  已完成
                </Button>
              )}
            </>
          ) : null
        }
      />

      <FormModal open={taskModal.open} title={taskModal.mode === "create" ? "新增巡检任务" : "编辑巡检任务"} loading={saving} onClose={() => setTaskModal((current) => ({ ...current, open: false }))} onSubmit={submitTask}>
        <div className="form-grid two">
          <Field label="任务编号" required>
            <TextInput value={taskModal.data.task_no} disabled={taskModal.mode === "edit"} onChange={(value) => setTaskModal((current) => ({ ...current, data: { ...current.data, task_no: value } }))} />
          </Field>
          <Field label="计划日期" required>
            <TextInput type="date" value={taskModal.data.scheduled_date} onChange={(value) => setTaskModal((current) => ({ ...current, data: { ...current.data, scheduled_date: value } }))} />
          </Field>
          <Field label="任务标题" required className="span-2">
            <TextInput value={taskModal.data.title} onChange={(value) => setTaskModal((current) => ({ ...current, data: { ...current.data, title: value } }))} />
          </Field>
          <Field label="巡检资产" required>
            <SelectInput value={String(taskModal.data.asset || "")} options={assetOptions} onChange={(value) => setTaskModal((current) => ({ ...current, data: { ...current.data, asset: value } }))} />
          </Field>
          <Field label="执行人" required>
            <SelectInput value={String(taskModal.data.inspector || "")} options={userOptions} onChange={(value) => setTaskModal((current) => ({ ...current, data: { ...current.data, inspector: value } }))} />
          </Field>
          <Field label="任务状态" required>
            <SelectInput value={taskModal.data.status} options={TASK_STATUS} onChange={(value) => setTaskModal((current) => ({ ...current, data: { ...current.data, status: value } }))} />
          </Field>
        </div>
      </FormModal>

      <FormModal open={submitModal.open} title={submitModal.task ? `提交巡检结果：${submitModal.task.title}` : "提交巡检结果"} loading={saving} onClose={() => setSubmitModal((current) => ({ ...current, open: false }))} onSubmit={submitResult} submitText="提交结果" width="640px">
        <div className="form-grid one">
          <Field label="巡检结果" required>
            <SelectInput value={submitModal.data.result} options={RESULT_OPTIONS} onChange={(value) => setSubmitModal((current) => ({ ...current, data: { ...current.data, result: value } }))} />
          </Field>
          <Field label="结果说明">
            <TextArea value={submitModal.data.result_summary} onChange={(value) => setSubmitModal((current) => ({ ...current, data: { ...current.data, result_summary: value } }))} placeholder="记录关键检查项、指标或处理过程" />
          </Field>
          <Field label="异常说明" required={submitModal.data.result === "abnormal"}>
            <TextArea value={submitModal.data.exception_note} onChange={(value) => setSubmitModal((current) => ({ ...current, data: { ...current.data, exception_note: value } }))} placeholder="异常巡检请填写，系统会生成告警与故障记录" />
          </Field>
        </div>
      </FormModal>
    </>
  );
}
