import React, { useState, useMemo } from "react";
import debounce from "lodash.debounce";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent } from "@/components/ui/card";
import { Chip } from '@/components/ui/chip'

type Option = { label: string; value: string };

export function AsyncSingleSelect({
  // apiUrl,
  request,
  value,
  onChange,
  debounceMs = 1000,
  className = "",
}: {
  // apiUrl: string;
  request: (params: any) => Promise<Option[]>;
  value: Option[];
  onChange: (val: Option[]) => void;
  debounceMs?: number;
  className?: string;
}) {
  const [options, setOptions] = useState<Option[]>([]);
  const [loading, setLoading] = useState(false);


  // 刪除 chip
  const removeFromSelected = (option: string) => {
    onChange(value.filter(opt => opt.value !== option));
  };


  const fetchOptions = useMemo(
    () =>
      debounce(async () => {
        setOptions([]);
        setLoading(true);
        try {
          const resp = await request({});
          // console.log('resp = ', resp)
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
    fetchOptions();
    // unmount 時要 cancel debounce
    return () => {
      fetchOptions.cancel();
    };
  }, [fetchOptions]);

  const onSelectChange = (val: string) => {
    const optionObj = options.find(opt => opt.value === val);

    if (optionObj) {
      const exists = value.some(opt => opt.value === optionObj.value);
      if (!exists) {
        const newArray = [...value, optionObj];

        // 根據 value 字串排序


        newArray.sort((a, b) => {
          const startA = parseInt(a.value.split(',')[0], 10);
          const startB = parseInt(b.value.split(',')[0], 10);
          return startA - startB;
        });


        onChange(newArray);
      }
    }
  }

  return (
    <div className={`flex flex-col w-full gap-2 ${className}`}>
      <div className={`flex items-center gap-2 w-full`}>
        <Select value={undefined} onValueChange={onSelectChange}>
          <SelectTrigger className="flex-1 min-w-0">
            <SelectValue placeholder="Please Select" />
          </SelectTrigger>
          <SelectContent>
            {loading && <div className="p-2 text-sm text-gray-400">Loading...</div>}
            {!loading && options.length === 0 && (
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
