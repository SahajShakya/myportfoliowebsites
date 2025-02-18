import React, { useState, useEffect } from "react";
import NepaliCalendar from "./NepaliCalendar";
import NepaliDate from "nepali-date-converter"; // Import NepaliDate converter

const months = [
  "Baisakh",
  "Jestha",
  "Ashadh",
  "Shrawan",
  "Bhadra",
  "Ashwin",
  "Kartik",
  "Mangsir",
  "Poush",
  "Magh",
  "Falgun",
  "Chaitra",
];

function Calendar() {
  const [year, setYear] = useState(2081); // Default Nepali Year
  const [month, setMonth] = useState(1); // Default is Baisakh
  const [date, setDate] = useState(1); // Default to 1st of the selected month

  // Function to get current Gregorian date
  const getCurrentGregorianDate = () => {
    const currentDate = new Date();
    const currentYear = currentDate.getFullYear();
    const currentMonth = currentDate.getMonth() + 1; // Months are 0-based in JavaScript Date
    const currentDay = currentDate.getDate();
    return { currentYear, currentMonth, currentDay };
  };

  const { currentYear, currentMonth, currentDay } = getCurrentGregorianDate();

  //   // Update state with current Gregorian date initially
  //   useEffect(() => {
  //     setYear(currentYear); // Initially use Gregorian year to set the state
  //     setMonth(currentMonth);
  //     setDate(currentDay);
  //   }, [currentYear, currentMonth, currentDay]);

  // Handle Year Change (handle BS year)
  const handleYearChange = (e) => setYear(parseInt(e.target.value));

  // Handle Month Change
  const handleMonthChange = (e) => setMonth(parseInt(e.target.value));

  // Handle Date Change (convert Gregorian to Nepali date)
  const handleDateChange = (e) => {
    const selectedDate = new Date(e.target.value);

    // Convert the selected Gregorian date to Nepali date
    const nepaliDate = new NepaliDate(
      selectedDate.getFullYear(),
      selectedDate.getMonth(),
      selectedDate.getDate()
    );

    // Set the Nepali year, month, and date
    setYear(nepaliDate.getYear()); // Set Nepali year (BS)
    setMonth(nepaliDate.getMonth() + 1); // Set Nepali month (1-indexed)
    setDate(nepaliDate.getDate()); // Set Nepali day
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gray-50 p-4">
      <h1 className="text-3xl font-bold mb-8 text-gray-800">
        {months[month - 1]} {year} {/* Display Nepali month and year */}
      </h1>

      {/* Year and Month Dropdowns */}
      <div className="flex mb-4 space-x-4">
        <div>
          {/* Year Dropdown */}
          <label htmlFor="year" className="mr-2 font-medium text-gray-700">
            Select Year:
          </label>
          <select
            id="year"
            value={year}
            onChange={handleYearChange}
            className="px-4 py-2 border border-gray-300 rounded-lg"
          >
            {Array.from({ length: 100 }, (_, i) => 2000 + i).map((y) => (
              <option key={y} value={y}>
                {y}
              </option>
            ))}
          </select>
        </div>

        <div>
          {/* Month Dropdown */}
          <label htmlFor="month" className="mr-2 font-medium text-gray-700">
            Select Month:
          </label>
          <select
            id="month"
            value={month}
            onChange={handleMonthChange}
            className="px-4 py-2 border border-gray-300 rounded-lg"
          >
            {months.map((monthName, index) => (
              <option key={monthName} value={index + 1}>
                {monthName}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Date Input - Mimicking <input type="date"> */}
      <div className="mb-4">
        <label
          htmlFor="gregorian-date"
          className="mr-2 font-medium text-gray-700"
        >
          Select Date:
        </label>
        <input
          id="gregorian-date"
          type="date"
          value={`${currentYear}-${
            currentMonth < 10 ? "0" : ""
          }${currentMonth}-${currentDay < 10 ? "0" : ""}${currentDay}`}
          onChange={handleDateChange}
          className="px-4 py-2 border border-gray-300 rounded-lg"
        />
      </div>

      {/* Nepali Calendar */}
      <NepaliCalendar
        selectedYear={year}
        selectedMonth={month}
        selectedDate={date}
        months={months}
        onDateClick={(clickedDate) => {
          setDate(clickedDate);
          console.log(
            `Selected Date: ${clickedDate} - ${months[month - 1]} ${year}`
          );
        }}
      />
    </div>
  );
}

export default Calendar;
