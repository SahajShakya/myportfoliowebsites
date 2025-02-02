import React from "react";
import NepaliDate from "nepali-date-converter";

const NepaliCalendar = ({
  selectedYear,
  selectedMonth,
  selectedDate,
  months,
  onDateClick,
}) => {
  // Convert selected Nepali Year, Month to Nepali date
  const nepaliDate = new NepaliDate(selectedYear, selectedMonth - 1, 1);

  // Manually calculate the number of days in the Nepali month
  const getDaysInNepaliMonth = (month) => {
    const daysInMonth = [30, 31, 30, 31, 30, 31, 30, 31, 30, 31, 30, 30];
    return daysInMonth[month - 1]; // Adjust for 1-based indexing
  };

  const daysInMonth = getDaysInNepaliMonth(selectedMonth);

  // Get first day of the week (0 = Sunday, 1 = Monday, etc.)
  const firstDayOfWeek = nepaliDate.toJsDate().getDay();

  const daysOfWeek = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

  // Generate the calendar grid
  const calendarGrid = [];
  let week = [];

  // Add empty cells for days before the first day of the month
  for (let i = 0; i < firstDayOfWeek; i++) {
    week.push(<td key={`empty-${i}`} className="p-2 text-center"></td>);
  }

  // Add days of the month
  for (let day = 1; day <= daysInMonth; day++) {
    const isSelected = day === selectedDate;
    week.push(
      <td
        key={day}
        className={`p-2 text-center border border-gray-300 cursor-pointer transition-all
          ${isSelected ? "bg-blue-500 text-white" : "hover:bg-blue-200"}`}
        onClick={() => onDateClick(day)} // Make the date clickable
      >
        {day} {/* Display Nepali Day */}
      </td>
    );

    // Start a new row after every 7 days
    if ((day + firstDayOfWeek) % 7 === 0 || day === daysInMonth) {
      calendarGrid.push(<tr key={day}>{week}</tr>);
      week = [];
    }
  }

  return (
    <div className="flex flex-col items-center justify-center p-4 bg-gray-100 rounded-lg shadow-md">
      <h2 className="text-2xl font-bold mb-4 text-gray-800">
        {months[selectedMonth - 1]} {selectedYear}{" "}
        {/* Show Nepali Month and Year */}
      </h2>

      {/* Calendar Table */}
      <table className="w-full max-w-md bg-white rounded-lg overflow-hidden shadow-sm">
        <thead>
          <tr className="bg-gray-200">
            {daysOfWeek.map((day) => (
              <th
                key={day}
                className="p-2 text-center text-sm font-medium text-gray-700"
              >
                {day}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>{calendarGrid}</tbody>
      </table>
    </div>
  );
};

export default NepaliCalendar;
