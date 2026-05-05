import { ListBox, Select } from '@heroui/react'

interface SelectFieldProps {
  label: string
  value: string
  values: readonly string[]
  onChange: (value: string) => void
}

export function SelectField({ label, value, values, onChange }: SelectFieldProps) {
  return (
    <div className="flex flex-col gap-1">
      <div className="text-xs text-white/40">{label}</div>
      <Select
        variant="secondary"
        selectedKey={value}
        onSelectionChange={key => {
          if (key !== null) onChange(String(key))
        }}
        fullWidth
      >
        <Select.Trigger>
          <Select.Value />
          <Select.Indicator />
        </Select.Trigger>
        <Select.Popover>
          <ListBox aria-label={label}>
            {values.map(item => (
              <ListBox.Item key={item} id={item}>
                {item}
                <ListBox.ItemIndicator />
              </ListBox.Item>
            ))}
          </ListBox>
        </Select.Popover>
      </Select>
    </div>
  )
}
