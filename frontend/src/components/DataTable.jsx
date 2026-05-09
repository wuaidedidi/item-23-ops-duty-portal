import { Button } from "@heroui/react";
import { Plus, RefreshCw, Search } from "lucide-react";

import PaginationBar from "./PaginationBar.jsx";

export default function DataTable({ title, subtitle, columns, rows, pagination, q, onSearch, onRefresh, onCreate, createText = "新增", actions, canCreate = true, loading }) {
  return (
    <section className="resource-card">
      <div className="resource-head">
        <div>
          <h2>{title}</h2>
          {subtitle ? <p>{subtitle}</p> : null}
        </div>
        <div className="resource-actions">
          <div className="search-box">
            <Search size={16} />
            <input value={q} placeholder="搜索关键字" onChange={(event) => onSearch(event.target.value)} />
          </div>
          <Button variant="flat" startContent={<RefreshCw size={16} />} onPress={onRefresh}>
            刷新
          </Button>
          {canCreate ? (
            <Button color="primary" startContent={<Plus size={16} />} onPress={onCreate}>
              {createText}
            </Button>
          ) : null}
        </div>
      </div>
      <div className="table-scroll">
        <table className="data-table">
          <thead>
            <tr>
              {columns.map((column) => (
                <th key={column.key} style={{ width: column.width }}>
                  {column.title}
                </th>
              ))}
              {actions ? <th className="action-th">操作</th> : null}
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan={columns.length + (actions ? 1 : 0)} className="table-empty">
                  数据加载中...
                </td>
              </tr>
            ) : rows.length ? (
              rows.map((row) => (
                <tr key={row.id}>
                  {columns.map((column) => (
                    <td key={column.key}>{column.render ? column.render(row) : row[column.key] || "-"}</td>
                  ))}
                  {actions ? <td className="table-actions">{actions(row)}</td> : null}
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan={columns.length + (actions ? 1 : 0)} className="table-empty">
                  暂无数据
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
      <PaginationBar {...pagination} />
    </section>
  );
}
