import { Button } from "@heroui/react";
import { Edit3, Trash2 } from "lucide-react";
import { useState } from "react";

import ConfirmModal from "../components/ConfirmModal.jsx";
import DataTable from "../components/DataTable.jsx";
import FormModal from "../components/FormModal.jsx";
import { Field, SelectInput, TextArea, TextInput } from "../components/FormFields.jsx";
import StatusChip from "../components/StatusChip.jsx";
import { useAuth } from "../context/AuthContext.jsx";
import { useNotify } from "../context/NotificationContext.jsx";
import { resourceApi } from "../lib/api.js";
import { ASSET_STATUS, optionLabel } from "../lib/options.js";
import { assetSchema, parseForm } from "../lib/schemas.js";
import { usePagedResource } from "../lib/usePagedResource.js";

const emptyAsset = { asset_code: "", name: "", category: "", location: "", owner: "", status: "normal", remark: "" };

export default function AssetsPage() {
  const { user } = useAuth();
  const notify = useNotify();
  const { rows, q, setQ, loading, load, pagination } = usePagedResource("assets");
  const [modal, setModal] = useState({ open: false, mode: "create", data: emptyAsset });
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [saving, setSaving] = useState(false);
  const canWrite = ["admin", "engineer"].includes(user.role);

  const openCreate = () => setModal({ open: true, mode: "create", data: emptyAsset });
  const openEdit = (row) => setModal({ open: true, mode: "edit", data: { ...row } });

  const submit = async (event) => {
    event.preventDefault();
    try {
      setSaving(true);
      const payload = parseForm(assetSchema, modal.data);
      if (modal.mode === "create") {
        await resourceApi.create("assets", payload);
        notify.success("资产已新增");
      } else {
        await resourceApi.update("assets", modal.data.id, payload);
        notify.success("资产已更新");
      }
      setModal({ open: false, mode: "create", data: emptyAsset });
      await load();
    } catch (error) {
      if (!error._isBusinessError) notify.error(error.message);
    } finally {
      setSaving(false);
    }
  };

  const confirmDelete = async () => {
    try {
      setSaving(true);
      await resourceApi.remove("assets", deleteTarget.id);
      notify.success("资产已删除");
      setDeleteTarget(null);
      await load();
    } finally {
      setSaving(false);
    }
  };

  return (
    <>
      <DataTable
        title="资产台账管理"
        subtitle="维护服务器、数据库、网络和动力设备的巡检基础信息"
        columns={[
          { key: "asset_code", title: "资产编号", width: 150 },
          { key: "name", title: "资产名称", width: 180 },
          { key: "category", title: "类型", width: 110 },
          { key: "location", title: "位置", width: 150 },
          { key: "owner", title: "责任人", width: 100 },
          { key: "status", title: "状态", width: 100, render: (row) => <StatusChip value={row.status} label={row.statusLabel || optionLabel(ASSET_STATUS, row.status)} /> },
          { key: "last_inspection_at", title: "最近巡检", width: 160, render: (row) => row.last_inspection_at || "-" },
        ]}
        rows={rows}
        pagination={pagination}
        q={q}
        onSearch={setQ}
        onRefresh={load}
        onCreate={openCreate}
        canCreate={canWrite}
        loading={loading}
        createText="新增资产"
        actions={
          canWrite
            ? (row) => (
                <>
                  <Button size="sm" variant="flat" startContent={<Edit3 size={15} />} onPress={() => openEdit(row)}>
                    编辑
                  </Button>
                  <Button size="sm" color="danger" variant="flat" startContent={<Trash2 size={15} />} onPress={() => setDeleteTarget(row)}>
                    删除
                  </Button>
                </>
              )
            : null
        }
      />

      <FormModal open={modal.open} title={modal.mode === "create" ? "新增资产" : "编辑资产"} loading={saving} onClose={() => setModal((current) => ({ ...current, open: false }))} onSubmit={submit}>
        <div className="form-grid two">
          <Field label="资产编号" required>
            <TextInput value={modal.data.asset_code} disabled={modal.mode === "edit"} onChange={(value) => setModal((current) => ({ ...current, data: { ...current.data, asset_code: value } }))} />
          </Field>
          <Field label="资产名称" required>
            <TextInput value={modal.data.name} onChange={(value) => setModal((current) => ({ ...current, data: { ...current.data, name: value } }))} />
          </Field>
          <Field label="资产类型" required>
            <TextInput value={modal.data.category} onChange={(value) => setModal((current) => ({ ...current, data: { ...current.data, category: value } }))} />
          </Field>
          <Field label="所在位置" required>
            <TextInput value={modal.data.location} onChange={(value) => setModal((current) => ({ ...current, data: { ...current.data, location: value } }))} />
          </Field>
          <Field label="责任人">
            <TextInput value={modal.data.owner} onChange={(value) => setModal((current) => ({ ...current, data: { ...current.data, owner: value } }))} />
          </Field>
          <Field label="运行状态" required>
            <SelectInput value={modal.data.status} options={ASSET_STATUS} onChange={(value) => setModal((current) => ({ ...current, data: { ...current.data, status: value } }))} />
          </Field>
          <Field label="备注" className="span-2">
            <TextArea value={modal.data.remark} onChange={(value) => setModal((current) => ({ ...current, data: { ...current.data, remark: value } }))} />
          </Field>
        </div>
      </FormModal>

      <ConfirmModal open={Boolean(deleteTarget)} title="确认删除资产" description={deleteTarget ? `确认删除「${deleteTarget.name}」吗？若存在巡检、故障或告警记录，系统会拒绝删除并给出原因。` : ""} loading={saving} onCancel={() => setDeleteTarget(null)} onConfirm={confirmDelete} confirmText="删除" />
    </>
  );
}
