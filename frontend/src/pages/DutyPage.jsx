import { Button } from "@heroui/react";
import { Edit3 } from "lucide-react";
import { useEffect, useMemo, useState } from "react";

import DataTable from "../components/DataTable.jsx";
import FormModal from "../components/FormModal.jsx";
import { Field, SelectInput, TextArea, TextInput } from "../components/FormFields.jsx";
import StatusChip from "../components/StatusChip.jsx";
import { useAuth } from "../context/AuthContext.jsx";
import { useNotify } from "../context/NotificationContext.jsx";
import { lookupApi, resourceApi } from "../lib/api.js";
import { DUTY_STATUS, optionLabel } from "../lib/options.js";
import { dutySchema, parseForm } from "../lib/schemas.js";
import { usePagedResource } from "../lib/usePagedResource.js";

const emptyDuty = { duty_date: "", shift_name: "", duty_user: "", status: "scheduled", notes: "" };

export default function DutyPage() {
  const { user } = useAuth();
  const notify = useNotify();
  const { rows, q, setQ, loading, load, pagination } = usePagedResource("duty-rosters");
  const [users, setUsers] = useState([]);
  const [modal, setModal] = useState({ open: false, mode: "create", data: emptyDuty });
  const [saving, setSaving] = useState(false);
  const canWrite = ["admin", "engineer", "duty"].includes(user.role);

  useEffect(() => {
    lookupApi.users().then(setUsers);
  }, []);

  const userOptions = useMemo(() => users.map((item) => [String(item.id), item.label]), [users]);

  const submit = async (event) => {
    event.preventDefault();
    try {
      setSaving(true);
      const payload = parseForm(dutySchema, modal.data);
      if (modal.mode === "create") {
        await resourceApi.create("duty-rosters", payload);
        notify.success("值班记录已新增");
      } else {
        await resourceApi.update("duty-rosters", modal.data.id, payload);
        notify.success("值班记录已更新");
      }
      setModal({ open: false, mode: "create", data: emptyDuty });
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
        title="值班记录管理"
        subtitle="排班、交接班和值班说明统一沉淀，便于运维追踪"
        columns={[
          { key: "duty_date", title: "值班日期", width: 130 },
          { key: "shift_name", title: "班次", width: 120 },
          { key: "dutyUserName", title: "值班人员", width: 130, render: (row) => row.dutyUserName || "-" },
          { key: "dutyUserRole", title: "角色", width: 130, render: (row) => row.dutyUserRole || "-" },
          { key: "status", title: "状态", width: 110, render: (row) => <StatusChip value={row.status} label={row.statusLabel || optionLabel(DUTY_STATUS, row.status)} /> },
          { key: "notes", title: "值班记录", width: 320, render: (row) => <span className="line-clamp">{row.notes || "-"}</span> },
        ]}
        rows={rows}
        pagination={pagination}
        q={q}
        onSearch={setQ}
        onRefresh={load}
        onCreate={() => setModal({ open: true, mode: "create", data: emptyDuty })}
        canCreate={canWrite}
        loading={loading}
        createText="新增值班"
        actions={(row) =>
          canWrite ? (
            <Button size="sm" variant="flat" startContent={<Edit3 size={15} />} onPress={() => setModal({ open: true, mode: "edit", data: { ...row } })}>
              编辑
            </Button>
          ) : null
        }
      />

      <FormModal open={modal.open} title={modal.mode === "create" ? "新增值班记录" : "编辑值班记录"} loading={saving} onClose={() => setModal((current) => ({ ...current, open: false }))} onSubmit={submit}>
        <div className="form-grid two">
          <Field label="值班日期" required>
            <TextInput type="date" value={modal.data.duty_date} onChange={(value) => setModal((current) => ({ ...current, data: { ...current.data, duty_date: value } }))} />
          </Field>
          <Field label="班次" required>
            <TextInput value={modal.data.shift_name} onChange={(value) => setModal((current) => ({ ...current, data: { ...current.data, shift_name: value } }))} />
          </Field>
          <Field label="值班人员" required>
            <SelectInput value={String(modal.data.duty_user || "")} options={userOptions} onChange={(value) => setModal((current) => ({ ...current, data: { ...current.data, duty_user: value } }))} />
          </Field>
          <Field label="值班状态" required>
            <SelectInput value={modal.data.status} options={DUTY_STATUS} onChange={(value) => setModal((current) => ({ ...current, data: { ...current.data, status: value } }))} />
          </Field>
          <Field label="值班记录" className="span-2">
            <TextArea value={modal.data.notes} onChange={(value) => setModal((current) => ({ ...current, data: { ...current.data, notes: value } }))} />
          </Field>
        </div>
      </FormModal>
    </>
  );
}
