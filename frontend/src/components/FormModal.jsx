import { Button } from "@heroui/react";
import { X } from "lucide-react";

export default function FormModal({ open, title, children, loading, onClose, onSubmit, submitText = "保存", width = "720px" }) {
  if (!open) return null;
  return (
    <div className="modal-mask" role="dialog" aria-modal="true">
      <form className="form-modal" style={{ maxWidth: width }} onSubmit={onSubmit}>
        <div className="form-modal-head">
          <div>
            <h3>{title}</h3>
          </div>
          <button className="modal-close" type="button" onClick={onClose} aria-label="关闭">
            <X size={18} />
          </button>
        </div>
        <div className="form-modal-body">{children}</div>
        <div className="modal-actions">
          <Button variant="flat" onPress={onClose} isDisabled={loading}>
            取消
          </Button>
          <Button color="primary" type="submit" isLoading={loading}>
            {submitText}
          </Button>
        </div>
      </form>
    </div>
  );
}
