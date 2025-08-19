const Attendance = require("../models/attendance-model");

class AttendanceService {
  markAttendance = async (data) => Attendance.create(data);

  findAttendance = async (data) => Attendance.findOne(data);

  findAllAttendance = async (data) =>
    Attendance.find(data).populate("employeeID", "name email"); // populate name and email only

  updateAttendance = async (id, data) =>
    Attendance.findByIdAndUpdate(id, data, { new: true });

  // ✅ Updated Holiday Logic: No Wednesday Off, Yes to 2nd & 4th Saturday + All Sundays
  isHoliday = (date) => {
    const holidayCalendar = {
      "2025-01-01": "New Year",
      "2025-01-12": "Swami Vivekananda Jayanti",
      "2025-01-14": "Makar Sankranti",
      "2025-01-26": "Republic Day",
      "2025-03-14": "Holi",
      "2025-07-30": "Hariyali Teej",
      "2025-08-09": "Raksha Bandhan",
      "2025-08-15": "Independence Day",
      "2025-08-16": "Janmashtami",
      "2025-08-28": "Ganesh Chaturthi",
      "2025-10-02": "Vijay Dashami",
      "2025-10-20": "Diwali",
      "2025-10-21": "Goverdhan Pooja",
      "2025-10-22": "Bhai Dooj",
      "2025-11-05": "Guru Nanak Jayanti",
      "2025-12-25": "Christmas Day",
    };

    const day = date.getDay(); // Sunday = 0, Saturday = 6
    const dateNum = date.getDate();
    const formattedDate = date.toISOString().split("T")[0]; // YYYY-MM-DD

    // 🎯 Static holidays
    if (holidayCalendar[formattedDate]) {
      return { isHoliday: true, name: holidayCalendar[formattedDate] };
    }

    // 🎯 All Sundays
    if (day === 0) {
      return { isHoliday: true, name: "Weekend Off (Sunday)" };
    }

    // 🎯 2nd & 4th Saturday
    if (day === 6) {
      const week = Math.floor((dateNum - 1) / 7) + 1;
      if (week === 2 || week === 4) {
        return {
          isHoliday: true,
          name: `Weekend Off (Saturday of Week ${week})`,
        };
      }
    }

    // ❌ Default working day
    return { isHoliday: false };
  };
}

module.exports = new AttendanceService();
