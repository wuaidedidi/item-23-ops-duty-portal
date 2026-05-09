const STYLE_MAP = {
  normal: "chip-green",
  completed: "chip-green",
  closed: "chip-green",
  on_duty: "chip-green",
  warning: "chip-amber",
  processing: "chip-blue",
  in_progress: "chip-blue",
  scheduled: "chip-blue",
  pending: "chip-slate",
  unchecked: "chip-slate",
  open: "chip-amber",
  overdue: "chip-red",
  fault: "chip-red",
  offline: "chip-slate",
  critical: "chip-red",
  high: "chip-red",
  medium: "chip-amber",
  low: "chip-blue",
  info: "chip-blue",
  abnormal: "chip-red",
};

export default function StatusChip({ value, label }) {
  return <span className={`status-chip ${STYLE_MAP[value] || "chip-slate"}`}>{label || value || "-"}</span>;
}
