import { type InputHTMLAttributes, type TextareaHTMLAttributes } from 'react';
import { LABEL, INPUT, HINT } from './styles';

interface FieldWrapProps {
  id: string;
  label: string;
  hint?: string;
  children: React.ReactNode;
}

export function Field({ id, label, hint, children }: FieldWrapProps) {
  return (
    <div>
      <label htmlFor={id} className={LABEL}>
        {label}
      </label>
      {children}
      {hint && <p className={HINT}>{hint}</p>}
    </div>
  );
}

interface TextFieldProps extends InputHTMLAttributes<HTMLInputElement> {
  id: string;
  label: string;
  hint?: string;
}

export function TextField({ id, label, hint, ...rest }: TextFieldProps) {
  return (
    <Field id={id} label={label} hint={hint}>
      <input id={id} className={INPUT} {...rest} />
    </Field>
  );
}

interface TextAreaProps extends TextareaHTMLAttributes<HTMLTextAreaElement> {
  id: string;
  label: string;
  hint?: string;
}

export function TextArea({ id, label, hint, ...rest }: TextAreaProps) {
  return (
    <Field id={id} label={label} hint={hint}>
      <textarea id={id} className={`${INPUT} resize-y min-h-[120px]`} {...rest} />
    </Field>
  );
}

interface ChipMultiSelectProps {
  id: string;
  label: string;
  options: readonly string[];
  selected: string[];
  onChange: (next: string[]) => void;
}

export function ChipMultiSelect({
  id,
  label,
  options,
  selected,
  onChange,
}: ChipMultiSelectProps) {
  const toggle = (option: string) => {
    if (selected.includes(option)) {
      onChange(selected.filter((s) => s !== option));
    } else {
      onChange([...selected, option]);
    }
  };

  return (
    <fieldset id={id}>
      <legend className={LABEL}>{label}</legend>
      <div className="flex flex-wrap gap-2" role="group" aria-labelledby={id}>
        {options.map((option) => {
          const active = selected.includes(option);
          return (
            <button
              key={option}
              type="button"
              aria-pressed={active}
              onClick={() => toggle(option)}
              className={
                active
                  ? 'px-3 py-1.5 rounded-full text-sm font-medium bg-mission-600 text-white transition-colors focus:outline-none focus:ring-2 focus:ring-mission-400 focus:ring-offset-2 focus:ring-offset-gray-900'
                  : 'px-3 py-1.5 rounded-full text-sm font-medium bg-gray-700 text-gray-300 hover:bg-gray-600 transition-colors focus:outline-none focus:ring-2 focus:ring-gray-400 focus:ring-offset-2 focus:ring-offset-gray-900'
              }
            >
              {option}
            </button>
          );
        })}
      </div>
    </fieldset>
  );
}
