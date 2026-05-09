import { Button } from "@heroui/react";
import { X } from "lucide-react";

export default function ConfirmModal({ open, title, description, confirmText = "确认", loading, onCancel, onConfirm }) {
  if (!open) return null;
  return (
    <div className="modal-mask" role="dialog" aria-modal="true">
      <div className="confirm-panel">
        <button className="modal-close" type="button" onClick={onCancel} aria-label="关闭">
          <X size={18} />
        </button>
        <h3>{title}</h3>
        <p>{description}</p>
        <div className="modal-actions">
          <Button variant="flat" onPress={onCancel} isDisabled={loading}>
            取消
          </Button>
          <Button color="danger" onPress={onConfirm} isLoading={loading}>
            {confirmText}
          </Button>
        </div>
      </div>
    </div>
  );
}
