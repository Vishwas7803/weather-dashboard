import ReactDatePicker from 'react-datepicker';
import 'react-datepicker/dist/react-datepicker.css';
import './DateSelector.css';

export default function DateSelector({ selected, onChange, label }) {
  const today = new Date();
  const minDate = new Date('2020-01-01');

  return (
    <div className="date-selector">
      {label && <label className="ds-label">{label}</label>}
      <ReactDatePicker
        selected={selected}
        onChange={onChange}
        maxDate={today}
        minDate={minDate}
        dateFormat="dd MMM yyyy"
        showMonthDropdown
        showYearDropdown
        dropdownMode="select"
        placeholderText="Select date"
      />
    </div>
  );
}
