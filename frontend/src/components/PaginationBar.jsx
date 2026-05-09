import { ChevronLeft, ChevronRight } from "lucide-react";

function visiblePages(page, totalPages) {
  if (totalPages <= 7) return Array.from({ length: totalPages }, (_, index) => index + 1);
  const pages = [1];
  if (page > 4) pages.push("left");
  const start = Math.max(2, page - 1);
  const end = Math.min(totalPages - 1, page + 1);
  for (let current = start; current <= end; current += 1) pages.push(current);
  if (page < totalPages - 3) pages.push("right");
  pages.push(totalPages);
  return pages;
}

export default function PaginationBar({ total = 0, page = 1, pageSize = 10, totalPages = 1, onPageChange, onPageSizeChange }) {
  const pages = visiblePages(page, totalPages || 1);
  return (
    <div className="pagination-bar">
      <span>共 {total} 条</span>
      <div className="page-size-wrap">
        <select value={pageSize} onChange={(event) => onPageSizeChange(Number(event.target.value))}>
          {[10, 20, 50].map((size) => (
            <option key={size} value={size}>
              {size} 条/页
            </option>
          ))}
        </select>
      </div>
      <button type="button" className="page-icon" disabled={page <= 1} onClick={() => onPageChange(page - 1)} aria-label="上一页">
        <ChevronLeft size={16} />
      </button>
      {pages.map((item, index) =>
        typeof item === "number" ? (
          <button key={item} type="button" className={`page-number ${item === page ? "active" : ""}`} onClick={() => onPageChange(item)}>
            {item}
          </button>
        ) : (
          <span key={`${item}-${index}`} className="page-ellipsis">
            ...
          </span>
        )
      )}
      <button type="button" className="page-icon" disabled={page >= totalPages} onClick={() => onPageChange(page + 1)} aria-label="下一页">
        <ChevronRight size={16} />
      </button>
    </div>
  );
}
