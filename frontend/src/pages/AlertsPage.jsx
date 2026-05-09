import { Button } from "@heroui/react";
import { Edit3, ShieldCheck } from "lucide-react";
import { useEffect, useMemo, useState } from "react";

import DataTable from "../components/DataTable.jsx";
import FormModal from "../components/FormModal.jsx";
import { Field, SelectInput, TextArea, TextInput } from "../components/FormFields.jsx";
import StatusChip from "../components/StatusChip.jsx";
import { useAuth } from "../context/AuthContext.jsx";
import { useNotify } from "../context/NotificationContext.jsx";
import { resourceApi } from "../lib/api.js";
import { ALERT_LEVEL, ALERT_STATUS, optionLabel } from "../lib/options.js";
import { alertHandleSchema, alertSchema, parseForm } from "../lib/schemas.js";
import { usePagedResource } from "../lib/usePagedResource.js";

const emptyAlert = { title: "", source_type: "巡检异常", asset: "", level: "warning", status: "pending", content: "" };
const handleOptions = [
  ["processing", "处理中"],
  ["closed", "已关闭"],
];

export default function AlertsPage() {
  const { user } = useAuth();
  const notify = useNotify();
  const { rows, q, setQ, loading, load, pagination } = usePagedResource("alerts");
  const [assets, setAssets] = useState([]);
  const [modal, setModal] = useState({ open: false, mode: "create", data: emptyAlert });
  const [handleModal, setHandleModal] = useState({ open: false, row: null, data: { status: "processing", handling_note: "" } });
  const [saving, setSaving] = useState(false);
  const canWrite = ["admin", "engineer", "duty"].includes(user.role);
  const canHandle = ["admin", "engineer"].includes(user.role);

  useEffect(() => {
    resourceApi.list("assets", { pageSize: 50 }).then((data) => setAssets(data.list || []));
  }, []);

  const assetOptions = useMemo(() => [["", "不关联资产"], ...assets.map((item) => [String(item.id), `${item.asset_code} · ${item.name}`])], [assets]);

  const submit = async (event) => {
    event.preventDefault();
    try {
      setSaving(true);
      const payload = parseForm(alertSchema, modal.data);
      if (payload.asset === "") delete payload.asset;
      if (modal.mode === "create") {
        await resourceApi.create("alerts", payload);
        notify.success("告警已新增");
      } else {
        await resourceApi.update("alerts", modal.data.id, payload);
        notify.success("告警已更新");
      }
      setModal({ open: false, mode: "create", data: emptyAlert });
      await load();
    } catch (error) {
      if (!error._isBusinessError) notify.error(error.message);
    } finally {
      setSaving(false);
    }
  };

  const handleAlert = async (event) => {
    event.preventDefault();
    try {
      setSaving(true);
      const payload = parseForm(alertHandleSchema, handleModal.data);
      await resourceApi.action("alerts", handleModal.row.id, "handle", payload);
      notify.success("告警处理已记录");
      setHandleModal({ open: false, row: null, data: { status: "processing", handling_note: "" } });
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
        title="告警通知管理"
        subtitle="由巡检异常或人工登记产生的告警，支持处理过程留痕"
        columns={[
          { key: "title", title: "告警标题", width: 230 },
          { key: "source_type", title: "来源", width: 110 },
          { key: "assetName", title: "关联资产", width: 160, render: (row) => row.assetName || "-" },
          { key: "level", title: "级别", width: 100, render: (row) => <StatusChip value={row.level} label={row.levelLabel || optionLabel(ALERT_LEVEL, row.level)} /> },
          { key: "status", title: "状态", width: 110, render: (row) => <StatusChip value={row.status} label={row.statusLabel || optionLabel(ALERT_STATUS, row.status)} /> },
          { key: "handledByName", title: "处理人", width: 120, render: (row) => row.handledByName || "-" },
          { key: "created_at", title: "创建时间", width: 165 },
        ]}
        rows={rows}
        pagination={pagination}
        q={q}
        onSearch={setQ}
        onRefresh={load}
        onCreate={() => setModal({ open: true, mode: "create", data: emptyAlert })}
        canCreate={canWrite}
        loading={loading}
        createText="新增告警"
        actions={(row) =>
          canWrite ? (
            <>
              <Button size="sm" variant="flat" startContent={<Edit3 size={15} />} onPress={() => setModal({ open: true, mode: "edit", data: { ...row, asset: row.asset || "" } })}>
                编辑
              </Button>
              {canHandle && row.status !== "closed" ? (
                <Button size="sm" color="primary" variant="flat" startContent={<ShieldCheck size={15} />} onPress={() => setHandleModal({ open: true, row, data: { status: row.status === "pending" ? "processing" : "closed", handling_note: row.handling_note || "" } })}>
                  处理
                </Button>
              ) : null}
            </>
          ) : null
        }
      />

      <FormModal open={modal.open} title={modal.mode === "create" ? "新增告警" : "编辑告警"} loading={saving} onClose={() => setModal((current) => ({ ...current, open: false }))} onSubmit={submit}>
        <div className="form-grid two">
          <Field label="告警标题" required className="span-2">
            <TextInput value={modal.data.title} onChange={(value) => setModal((current) => ({ ...current, data: { ...current.data, title: value } }))} />
          </Field>
          <Field label="来源类型" required>
            <TextInput value={modal.data.source_type} onChange={(value) => setModal((current) => ({ ...current, data: { ...current.data, source_type: value } }))} />
          </Field>
          <Field label="关联资产">
            <SelectInput value={String(modal.data.asset || "")} options={assetOptions} onChange={(value) => setModal((current) => ({ ...current, data: { ...current.data, asset: value } }))} />
          </Field>
          <Field label="告警级别" required>
            <SelectInput value={modal.data.level} options={ALERT_LEVEL} onChange={(value) => setModal((current) => ({ ...current, data: { ...current.data, level: value } }))} />
          </Field>
          <Field label="处理状态" required>
            <SelectInput value={modal.data.status} options={ALERT_STATUS} onChange={(value) => setModal((current) => ({ ...current, data: { ...current.data, status: value } }))} />
          </Field>
          <Field label="告警内容" required className="span-2">
            <TextArea value={modal.data.content} onChange={(value) => setModal((current) => ({ ...current, data: { ...current.data, content: value } }))} />
          </Field>
        </div>
      </FormModal>

      <FormModal open={handleModal.open} title={handleModal.row ? `处理告警：${handleModal.row.title}` : "处理告警"} loading={saving} onClose={() => setHandleModal((current) => ({ ...current, open: false }))} onSubmit={handleAlert} submitText="记录处理" width="640px">
        <div className="form-grid one">
          <Field label="处理状态" required>
            <SelectInput value={handleModal.data.status} options={handleOptions} onChange={(value) => setHandleModal((current) => ({ ...current, data: { ...current.data, status: value } }))} />
          </Field>
          <Field label="处理说明" required={handleModal.data.status === "closed"}>
            <TextArea rows={5} value={handleModal.data.handling_note} onChange={(value) => setHandleModal((current) => ({ ...current, data: { ...current.data, handling_note: value } }))} placeholder="关闭告警时必须填写处理说明" />
          </Field>
        </div>
      </FormModal>
    </>
  );
}
