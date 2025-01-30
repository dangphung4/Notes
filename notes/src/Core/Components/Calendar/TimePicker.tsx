import { format } from 'date-fns';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface TimePickerProps {
  value: Date;
  onChange: (date: Date) => void;
}

const generateTimeOptions = () => {
  const options = [];
  for (let hour = 0; hour < 24; hour++) {
    for (let minute = 0; minute < 60; minute += 15) {
      const time = new Date();
      time.setHours(hour, minute, 0, 0);
      options.push({
        value: `${hour.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')}`,
        label: format(time, 'h:mm a')
      });
    }
  }
  return options;
};

export const TimePicker = ({ value, onChange }: TimePickerProps) => {
  return (
    <Select
      value={format(value, 'HH:mm')}
      onValueChange={(time) => {
        const [hours, minutes] = time.split(':').map(Number);
        const newDate = new Date(value);
        newDate.setHours(hours, minutes);
        onChange(newDate);
      }}
    >
      <SelectTrigger className="w-24">
        <SelectValue />
      </SelectTrigger>
      <SelectContent>
        {generateTimeOptions().map(option => (
          <SelectItem key={option.value} value={option.value}>
            {option.label}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}; 