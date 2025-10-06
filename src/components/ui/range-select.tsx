import { Input } from "@/components/ui/input";

type Option = { min: string; max: string };

export function RangeSelect({
  value,
  onChange,
  minPlaceholder = "Min",
  maxPlaceholder = "Max",
  className = "",
}: {
  value: Option;
  // onChange: (val: Option) => void;
  onChange: (val: { min: string; max: string }) => void;
  minPlaceholder?: string,
  maxPlaceholder?: string,
  className?: string;
}) {

  return (
    <div className={`flex flex-col w-full gap-2 ${className}`}>
      <div className={`flex items-center gap-2 w-full`}>
        <Input
          placeholder={minPlaceholder}
          value={value.min}
          onChange={(e) => onChange({ ...value, min: e.target.value })}
          className="flex-1 min-w-0"
        />
      </div>

      <div className={`flex items-center gap-2 w-full`}>
        <Input
          placeholder={maxPlaceholder}
          value={value.max}
          onChange={(e) => onChange({ ...value, max: e.target.value })}
          className="flex-1 min-w-0"
        />
      </div>

    </div>
  );
}
