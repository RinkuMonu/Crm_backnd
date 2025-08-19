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
      "2025-01-01": "New Year's Day",
      "2025-01-06": "Guru Gobind Singh Jayanti",
      "2025-01-12": "Swami Vivekananda Jayanti",
      "2025-01-14": "Makar Sankranti",
      "2025-01-26": "Republic Day",
      "2025-02-10": "Vasant Panchami",
      "2025-03-08": "International Women's Day",
      "2025-03-17": "Holi",
      "2025-03-29": "Good Friday",
      "2025-04-10": "Eid-ul-Fitr",
      "2025-04-14": "Ambedkar Jayanti",
      "2025-04-18": "Ram Navami",
      "2025-05-01": "Labour Day",
      "2025-05-23": "Buddha Purnima",
      "2025-06-17": "Bakrid",
      "2025-08-15": "Independence Day",
      
      "2025-09-05": "Teachers' Day",
      "2025-09-16": "Milad-un-Nabi",
      "2025-09-30": "Mahalaya Amavasya",
      "2025-10-02": "Gandhi Jayanti",
      "2025-10-12": "Dussehra",
      "2025-10-31": "Halloween",
      "2025-11-01": "Kannada Rajyotsava",
      "2025-11-03": "Diwali",
      "2025-11-06": "Bhai Dooj",
      "2025-11-07": "Chhath Puja",
      "2025-11-15": "Govardhan Puja",
      "2025-11-26": "Constitution Day",
      "2025-12-25": "Christmas Day"
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
        return { isHoliday: true, name: `Weekend Off (Saturday of Week ${week})` };
      }
    }

    // ❌ Default working day
    return { isHoliday: false };
  };
}

module.exports = new AttendanceService();

