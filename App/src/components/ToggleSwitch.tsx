import React from "react";

type ToggleSwitchProps = {
  checked: boolean;
  onChange: (checked: boolean) => void;
  ariaLabel: string;
  disabled?: boolean;
  className?: string;
};

export default function ToggleSwitch({
  checked,
  onChange,
  ariaLabel,
  disabled = false,
  className,
}: ToggleSwitchProps) {
  return (
    <label
      className={`switch ${disabled ? "switch-disabled" : ""} ${
        className || ""
      }`}
    >
      <input
        className="toggle"
        type="checkbox"
        checked={checked}
        onChange={(e) => onChange(e.target.checked)}
        aria-label={ariaLabel}
        disabled={disabled}
      />
      <span className="slider"></span>
      <span className="card-side"></span>
    </label>
  );
}
