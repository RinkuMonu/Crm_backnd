const Attendance = require("../models/attendance-model");

class AttendanceService {
  markAttendance = async (data) => Attendance.create(data);

  findAttendance = async (data) => Attendance.findOne(data);

  findAllAttendance = async (data) =>
    Attendance.find(data).populate("employeeID", "name email"); // populate name and email only

  updateAttendance = async (id, data) =>
    Attendance.findByIdAndUpdate(id, data, { new: true });

  // 🟡 Holiday logic directly in service
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
      "2025-07-17": "Muharram",
      "2025-08-15": "Independence Day",
      "2025-08-19": "Raksha Bandhan",
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

    const day = date.getDay(); // 0 = Sunday, 3 = Wednesday
    const dateNum = date.getDate();
    const formattedDate = date.toISOString().split("T")[0]; // YYYY-MM-DD

    // 🎯 Static holiday from calendar
    if (holidayCalendar[formattedDate]) {
      return { isHoliday: true, name: holidayCalendar[formattedDate] };
    }

    // 🎯 Wednesday weekly off
    if (day === 3) {
      return { isHoliday: true, name: "Weekly Off (Wednesday)" };
    }

    // 🎯 2nd & 4th Sunday
    if (day === 0) {
      const week = Math.floor((dateNum - 1) / 7) + 1;
      if (week === 2 || week === 4) {
        return { isHoliday: true, name: `Weekly Off (Sunday of Week ${week})` };
      }
    }

    return { isHoliday: false };
  };





  // isHoliday = (date) => {
  //   // Convert input to actual Date object
  //   let dateObj;
  
  //   // If full ISO string is provided
  //   if (date.full) {
  //     dateObj = new Date(date.full);
  //   } else if (date.year && date.month && date.day) {
  //     // Fallback: rebuild date from components
  //     dateObj = new Date(date.year, date.month - 1, date.day); // month is 0-based
  //   } else {
  //     throw new Error("Invalid date format passed to isHoliday()");
  //   }
  
  //   const holidayCalendar = {
  //     "2025-01-01": "New Year's Day",
  //     "2025-01-06": "Guru Gobind Singh Jayanti",
  //     "2025-01-12": "Swami Vivekananda Jayanti",
  //     "2025-01-14": "Makar Sankranti",
  //     "2025-01-26": "Republic Day",
  //     "2025-02-10": "Vasant Panchami",
  //     "2025-03-08": "International Women's Day",
  //     "2025-03-17": "Holi",
  //     "2025-03-29": "Good Friday",
  //     "2025-04-10": "Eid-ul-Fitr",
  //     "2025-04-14": "Ambedkar Jayanti",
  //     "2025-04-18": "Ram Navami",
  //     "2025-05-01": "Labour Day",
  //     "2025-05-23": "Buddha Purnima",
  //     "2025-06-17": "Bakrid",
  //     "2025-07-17": "Muharram",
  //     "2025-08-15": "Independence Day",
  //     "2025-08-19": "Raksha Bandhan",
  //     "2025-09-05": "Teachers' Day",
  //     "2025-09-16": "Milad-un-Nabi",
  //     "2025-09-30": "Mahalaya Amavasya",
  //     "2025-10-02": "Gandhi Jayanti",
  //     "2025-10-12": "Dussehra",
  //     "2025-10-31": "Halloween",
  //     "2025-11-01": "Kannada Rajyotsava",
  //     "2025-11-03": "Diwali",
  //     "2025-11-06": "Bhai Dooj",
  //     "2025-11-07": "Chhath Puja",
  //     "2025-11-15": "Govardhan Puja",
  //     "2025-11-26": "Constitution Day",
  //     "2025-12-25": "Christmas Day",
  //   };
  
  //   const day = dateObj.getDay(); // Sunday = 0, Wednesday = 3
  //   const dateNum = dateObj.getDate();
  //   const formattedDate = dateObj.toISOString().split("T")[0]; // "YYYY-MM-DD"
  
  //   if (holidayCalendar[formattedDate]) {
  //     return { isHoliday: true, name: holidayCalendar[formattedDate] };
  //   }
  
  //   // Wednesday weekly off
  //   if (day === 3) {
  //     return { isHoliday: true, name: "Weekly Off (Wednesday)" };
  //   }
  
  //   // 2nd and 4th Sunday
  //   if (day === 0) {
  //     const week = Math.floor((dateNum - 1) / 7) + 1;
  //     if (week === 2 || week === 4) {
  //       return { isHoliday: true, name: `Weekly Off (Sunday of Week ${week})` };
  //     }
  //   }
  
  //   return { isHoliday: false };
  // };
}

module.exports = new AttendanceService();
