import { ChevronDown } from "lucide-react";

export function Field({ label, required, children, className = "" }) {
  return (
    <label className={`field ${className}`}>
      <span>
        {label}
        {required ? <b>*</b> : null}
      </span>
      {children}
    </label>
  );
}

export function TextInput({ value, onChange, placeholder, type = "text", disabled, maxLength }) {
  return <input className="input-control" value={value ?? ""} maxLength={maxLength} disabled={disabled} type={type} placeholder={placeholder} onChange={(event) => onChange(event.target.value)} />;
}

export function TextArea({ value, onChange, placeholder, rows = 4 }) {
  return <textarea className="textarea-control" value={value ?? ""} rows={rows} placeholder={placeholder} onChange={(event) => onChange(event.target.value)} />;
}

export function SelectInput({ value, onChange, options, placeholder = "请选择", disabled }) {
  return (
    <div className="select-wrap">
      <select className="select-control" value={value ?? ""} disabled={disabled} onChange={(event) => onChange(event.target.value)}>
        <option value="">{placeholder}</option>
        {options.map(([key, label]) => (
          <option key={key} value={key}>
            {label}
          </option>
        ))}
      </select>
      <ChevronDown className="select-arrow" size={16} />
    </div>
  );
}
