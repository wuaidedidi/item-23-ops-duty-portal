import { Button } from "@heroui/react";
import { Edit3, LockKeyhole } from "lucide-react";
import { useEffect, useMemo, useState } from "react";

import DataTable from "../components/DataTable.jsx";
import FormModal from "../components/FormModal.jsx";
import { Field, SelectInput, TextArea, TextInput } from "../components/FormFields.jsx";
import StatusChip from "../components/StatusChip.jsx";
import { useAuth } from "../context/AuthContext.jsx";
import { useNotify } from "../context/NotificationContext.jsx";
import { resourceApi } from "../lib/api.js";
import { FAULT_STATUS, SEVERITY_OPTIONS, optionLabel } from "../lib/options.js";
import { faultCloseSchema, faultSchema, parseForm } from "../lib/schemas.js";
import { usePagedResource } from "../lib/usePagedResource.js";

const emptyFault = { report_no: "", title: "", asset: "", severity: "medium", status: "open", description: "", solution: "" };

export default function FaultsPage() {
  const { user } = useAuth();
  const notify = useNotify();
  const { rows, q, setQ, loading, load, pagination } = usePagedResource("fault-reports");
  const [assets, setAssets] = useState([]);
  const [modal, setModal] = useState({ open: false, mode: "create", data: emptyFault });
  const [closeModal, setCloseModal] = useState({ open: false, row: null, data: { solution: "" } });
  const [saving, setSaving] = useState(false);
  const canWrite = ["admin", "engineer", "duty"].includes(user.role);
  const canClose = ["admin", "engineer"].includes(user.role);

  useEffect(() => {
    resourceApi.list("assets", { pageSize: 50 }).then((data) => setAssets(data.list || []));
  }, []);

  const assetOptions = useMemo(() => assets.map((item) => [String(item.id), `${item.asset_code} · ${item.name}`]), [assets]);

  const submit = async (event) => {
    event.preventDefault();
    try {
      setSaving(true);
      const payload = parseForm(faultSchema, modal.data);
      if (modal.mode === "create") {
        await resourceApi.create("fault-reports", payload);
        notify.success("故障记录已新增");
      } else {
        await resourceApi.update("fault-reports", modal.data.id, payload);
        notify.success("故障记录已更新");
      }
      setModal({ open: false, mode: "create", data: emptyFault });
      await load();
    } catch (error) {
      if (!error._isBusinessError) notify.error(error.message);
    } finally {
      setSaving(false);
    }
  };

  const closeFault = async (event) => {
    event.preventDefault();
    try {
      setSaving(true);
      const payload = parseForm(faultCloseSchema, closeModal.data);
      await resourceApi.action("fault-reports", closeModal.row.id, "close", payload);
      notify.success("故障已关闭");
      setCloseModal({ open: false, row: null, data: { solution: "" } });
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
        title="故障登记管理"
        subtitle="记录资产故障、严重程度、处理状态和关闭方案"
        columns={[
          { key: "report_no", title: "故障编号", width: 150 },
          { key: "title", title: "故障标题", width: 220 },
          { key: "assetName", title: "关联资产", width: 150 },
          { key: "severity", title: "严重程度", width: 110, render: (row) => <StatusChip value={row.severity} label={row.severityLabel || optionLabel(SEVERITY_OPTIONS, row.severity)} /> },
          { key: "status", title: "处理状态", width: 110, render: (row) => <StatusChip value={row.status} label={row.statusLabel || optionLabel(FAULT_STATUS, row.status)} /> },
          { key: "reporterName", title: "登记人", width: 120, render: (row) => row.reporterName || "-" },
          { key: "created_at", title: "登记时间", width: 165 },
        ]}
        rows={rows}
        pagination={pagination}
        q={q}
        onSearch={setQ}
        onRefresh={load}
        onCreate={() => setModal({ open: true, mode: "create", data: emptyFault })}
        canCreate={canWrite}
        loading={loading}
        createText="新增故障"
        actions={(row) =>
          canWrite ? (
            <>
              <Button size="sm" variant="flat" startContent={<Edit3 size={15} />} onPress={() => setModal({ open: true, mode: "edit", data: { ...row } })}>
                编辑
              </Button>
              {canClose && row.status !== "closed" ? (
                <Button size="sm" color="primary" variant="flat" startContent={<LockKeyhole size={15} />} onPress={() => setCloseModal({ open: true, row, data: { solution: row.solution || "" } })}>
                  关闭
                </Button>
              ) : null}
            </>
          ) : null
        }
      />

      <FormModal open={modal.open} title={modal.mode === "create" ? "新增故障登记" : "编辑故障登记"} loading={saving} onClose={() => setModal((current) => ({ ...current, open: false }))} onSubmit={submit}>
        <div className="form-grid two">
          <Field label="故障编号" required>
            <TextInput value={modal.data.report_no} disabled={modal.mode === "edit"} onChange={(value) => setModal((current) => ({ ...current, data: { ...current.data, report_no: value } }))} />
          </Field>
          <Field label="关联资产" required>
            <SelectInput value={String(modal.data.asset || "")} options={assetOptions} onChange={(value) => setModal((current) => ({ ...current, data: { ...current.data, asset: value } }))} />
          </Field>
          <Field label="故障标题" required className="span-2">
            <TextInput value={modal.data.title} onChange={(value) => setModal((current) => ({ ...current, data: { ...current.data, title: value } }))} />
          </Field>
          <Field label="严重程度" required>
            <SelectInput value={modal.data.severity} options={SEVERITY_OPTIONS} onChange={(value) => setModal((current) => ({ ...current, data: { ...current.data, severity: value } }))} />
          </Field>
          <Field label="处理状态" required>
            <SelectInput value={modal.data.status} options={FAULT_STATUS} onChange={(value) => setModal((current) => ({ ...current, data: { ...current.data, status: value } }))} />
          </Field>
          <Field label="故障描述" required className="span-2">
            <TextArea value={modal.data.description} onChange={(value) => setModal((current) => ({ ...current, data: { ...current.data, description: value } }))} />
          </Field>
          <Field label="处理方案" className="span-2">
            <TextArea value={modal.data.solution} onChange={(value) => setModal((current) => ({ ...current, data: { ...current.data, solution: value } }))} />
          </Field>
        </div>
      </FormModal>

      <FormModal open={closeModal.open} title={closeModal.row ? `关闭故障：${closeModal.row.title}` : "关闭故障"} loading={saving} onClose={() => setCloseModal((current) => ({ ...current, open: false }))} onSubmit={closeFault} submitText="确认关闭" width="620px">
        <Field label="处理方案" required>
          <TextArea value={closeModal.data.solution} rows={5} onChange={(value) => setCloseModal((current) => ({ ...current, data: { solution: value } }))} placeholder="请填写故障处理过程和关闭依据" />
        </Field>
      </FormModal>
    </>
  );
}
