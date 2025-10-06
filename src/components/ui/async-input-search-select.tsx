import React, { useState, useMemo } from "react";
import debounce from "lodash.debounce";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent } from "@/components/ui/card";
import { Chip } from '@/components/ui/chip'

type Option = { label: string; value: string };


export function AsyncInputSearchSelect({
  // apiUrl,
  request,
  value,
  kind,
  onChange,
  placeholder = "Search content",
  debounceMs = 1000,
  className = "",
}: {
  // apiUrl: string;
  request: (params: any) => Promise<Option[]>;
  value: Option[];
  kind: string;
  onChange: (val: Option[]) => void;
  placeholder?: string;
  debounceMs?: number;
  className?: string;
}) {
  const [inputValue, setInputValue] = useState("");
  const [options, setOptions] = useState<Option[]>([]);
  const [loading, setLoading] = useState(false);


  // 刪除 chip
  const removeFromSelected = (option: string) => {
    onChange(value.filter(opt => opt.value !== option));
  };


  const fetchOptions = useMemo(
    () =>
      debounce(async (search: string) => {
        setOptions([]);

        if (!search) {
          setLoading(false);
          return;
        }
        setLoading(true);
        try {
          const resp = await request({ search, kind });
          setOptions(resp);
        } catch (e) {
          setOptions([]);
        } finally {
          setLoading(false);
        }
      }, debounceMs),
    [debounceMs]
  );

  React.useEffect(() => {
    fetchOptions(inputValue);
    // unmount 時要 cancel debounce
    return () => {
      fetchOptions.cancel();
    };
  }, [inputValue, fetchOptions]);

  const onSelectChange = (val: string) => {
    const optionObj = options.find(opt => opt.value === val);

    if (optionObj) {
      const exists = value.some(opt => opt.value === optionObj.value);
      if (!exists) {
        const newArray = [...value, optionObj];

        // 根據 value 字串排序
        newArray.sort((a, b) => a.value.localeCompare(b.value));

        onChange(newArray);
      }
    }
  }

  return (
    <div className={`flex flex-col w-full gap-2 ${className}`}>
      <div className={`flex items-center gap-2 w-full`}>
        <Input
          placeholder={placeholder}
          value={inputValue}
          onChange={e => setInputValue(e.target.value)}
          className="flex-1 min-w-0"
        />
        <Select value={undefined} onValueChange={onSelectChange}>
          <SelectTrigger className="w-[140px] min-w-0">
            <SelectValue placeholder="Please Select" />
          </SelectTrigger>
          <SelectContent>
            {loading && <div className="p-2 text-sm text-gray-400">Loading...</div>}
            {!loading && options.length === 0 && inputValue && (
              <div className="p-2 text-sm text-gray-400">No Result</div>
            )}
            {options.map(opt => (
              <SelectItem key={opt.value} value={opt.value}>
                {opt.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>


      </div>
      <Card>
        <CardContent>
          {value.map(item => (
            <div className='p-1' key={item.label}>
              <Chip label={item.label} value={item.value} onClose={removeFromSelected} />
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  );
}
