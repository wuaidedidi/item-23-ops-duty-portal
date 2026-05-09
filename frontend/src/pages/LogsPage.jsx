import DataTable from "../components/DataTable.jsx";
import { usePagedResource } from "../lib/usePagedResource.js";

export default function LogsPage() {
  const { rows, q, setQ, loading, load, pagination } = usePagedResource("operation-logs");

  return (
    <DataTable
      title="操作日志"
      subtitle="记录登录后的关键业务操作，便于追踪异常巡检、故障与告警处理过程"
      columns={[
        { key: "created_at", title: "时间", width: 170 },
        { key: "module", title: "模块", width: 120 },
        { key: "action", title: "动作", width: 120 },
        { key: "displayName", title: "操作人", width: 120, render: (row) => row.displayName || row.username || "-" },
        { key: "detail", title: "详情", width: 360, render: (row) => <span className="line-clamp">{row.detail || "-"}</span> },
        { key: "ip_address", title: "IP 地址", width: 130, render: (row) => row.ip_address || "-" },
      ]}
      rows={rows}
      pagination={pagination}
      q={q}
      onSearch={setQ}
      onRefresh={load}
      onCreate={() => {}}
      canCreate={false}
      loading={loading}
    />
  );
}
