import { useCallback, useEffect, useMemo, useState } from "react";

import { resourceApi } from "./api.js";

export function usePagedResource(resourceName, extraParams = {}) {
  const [rows, setRows] = useState([]);
  const [q, setQ] = useState("");
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const data = await resourceApi.list(resourceName, { page, pageSize, q, ...extraParams });
      setRows(data.list || []);
      setTotal(data.total || 0);
      setTotalPages(data.totalPages || 1);
    } finally {
      setLoading(false);
    }
  }, [resourceName, page, pageSize, q, JSON.stringify(extraParams)]);

  useEffect(() => {
    load();
  }, [load]);

  const pagination = useMemo(
    () => ({
      total,
      page,
      pageSize,
      totalPages,
      onPageChange: setPage,
      onPageSizeChange: (value) => {
        setPageSize(value);
        setPage(1);
      },
    }),
    [total, page, pageSize, totalPages]
  );

  return {
    rows,
    q,
    setQ: (value) => {
      setQ(value);
      setPage(1);
    },
    loading,
    load,
    pagination,
  };
}
