const ErrorHandler = require("../utils/error-handler");
const userService = require("../services/user-service");
const UserDto = require("../dtos/user-dto");
const mongoose = require("mongoose");
const crypto = require("crypto");
const teamService = require("../services/team-service");
const attendanceService = require("../services/attendance-service");
const { PDFDocument, rgb, StandardFonts } = require("pdf-lib");
const pdf2img = require("pdf2img"); // For converting PDF to image
const { convert } = require("html-to-text");
const UserModel = require("../models/user-model");
const nodeMailer = require("nodemailer");
const bcrypt = require("bcrypt");

const fs = require("fs");
const puppeteer = require("puppeteer"); // Puppeteer to generate PDF from HTML

const path = require("path");
const cron = require("node-cron");
const moment = require("moment-timezone");
const attendanceModel = require("../models/attendance-model");

// ---- Helpers (all in this file) ----
const nowUtc = () => new Date(); // server UTC
const nowIst = () => moment(nowUtc()).tz("Asia/Kolkata");
const ymdFromIst = (m) => ({
  year: m.year(),
  month: m.month() + 1,
  date: m.date(),
});

class UserController {
  createUser = async (req, res, next) => {
    const files = req.files;
    let {
      name,
      email,
      mobile,
      password,
      type,
      status,
      current_address,
      permanent_address,
      desgination,
      account_number,
      ifsc,
      bank_name,
      branch,
      father_name,
      mother_name,
      alternate_number,
      DOB,
      DOJ,
      experience,
      total_experience,
      company_name,
      reason_of_leaving,
      nominee_name,
      nominee_relation,
      nominee_mobile,
      nominee_address,
      nominee_age,
      Un_no,
      Esi_no,
      gender,
    } = req.body;

    const username = "user" + crypto.randomInt(11111111, 999999999);

    if (
      !name ||
      !email ||
      !mobile ||
      !password ||
      !gender ||
      !type ||
      !status ||
      !current_address ||
      !permanent_address ||
      !desgination ||
      !account_number ||
      !ifsc ||
      !bank_name ||
      !branch ||
      !father_name ||
      !mother_name ||
      !alternate_number ||
      !DOB ||
      !DOJ ||
      !experience ||
      !nominee_name ||
      !nominee_relation ||
      !nominee_mobile ||
      !nominee_address ||
      !nominee_age
    )
      return next(ErrorHandler.badRequest("All Fields Required"));

    type = type.toLowerCase();

    if (type === "admin") {
      const adminPassword = req.body.adminPassword;
      if (!adminPassword)
        return next(
          ErrorHandler.badRequest(
            `Please Enter Your Password to Add ${name} as an Admin`
          )
        );
      const { _id } = req.user;
      const { password: hashPassword } = await userService.findUser({ _id });
      const isPasswordValid = await userService.verifyPassword(
        adminPassword,
        hashPassword
      );
      if (!isPasswordValid)
        return next(
          ErrorHandler.unAuthorized("You have entered a wrong password")
        );
    }

    const user = {
      name,
      email,
      username,
      mobile,
      gender,
      password,
      type,
      status,
      current_address,
      permanent_address,
      desgination,
      account_number,
      ifsc,
      bank_name,
      status,
      branch,
      father_name,
      mother_name,
      alternate_number,
      DOB,
      DOJ,
      experience,
      total_experience,
      company_name,
      reason_of_leaving,
      nominee_name,
      nominee_relation,
      nominee_mobile,
      Esi_no,
      Un_no,
      nominee_address,
      nominee_age,
      image: files?.profile?.[0]?.filename,
      employee_adhar_image: files?.employee_adhar_image?.[0]?.filename,
      Policeverification: files?.Policeverification?.[0]?.filename,
      employee_pan_image: files?.employee_pan_image?.[0]?.filename,
      mother_adhar_image: files?.mother_adhar_image?.[0]?.filename,
      father_adhar_image: files?.father_adhar_image?.[0]?.filename,
      tenth_marksheet_img: files?.tenth_marksheet_img?.[0]?.filename,
      twelth_marksheet_img: files?.twelth_marksheet_img?.[0]?.filename,
    };

    const userResp = await userService.createUser(user);

    if (!userResp)
      return next(ErrorHandler.serverError("Failed To Create An Account"));

    res.json({
      success: true,
      message: "User has been Added",
      user: new UserDto(user),
    });
  };

  updateUser = async (req, res, next) => {
    const file = req.file;
    const filename = file && file.filename;
    console.log("filename", filename);

    let user, id;
    console.log("req.user.type", req);

    if (req.user.type === "admin") {
      const { id: userId } = req.params;
      let {
        name,
        username,
        email,
        password,
        type,
        status,
        address,
        mobile,
        account_number,
        ifsc,
        bank_name,
        desgination,
        gender,
      } = req.body;

      type = type && type.toLowerCase();
      id = userId;

      if (!mongoose.Types.ObjectId.isValid(id)) {
        return next(ErrorHandler.badRequest("Invalid User Id"));
      }

      const dbUser = await userService.findUser({ _id: id });
      if (!dbUser) return next(ErrorHandler.badRequest("No User Found"));

      if (type && dbUser.type !== type) {
        const { _id } = req.user;
        if (_id === id) {
          return next(
            ErrorHandler.badRequest(`You Can't Change Your Own Position`)
          );
        }

        // const { adminPassword } = req.body;
        // if (!adminPassword) {
        //   return next(
        //     ErrorHandler.badRequest(
        //       `Please Enter Your Password To Change The Type`
        //     )
        //   );
        // }

        const { password: hashPassword } = await userService.findUser({ _id });
        const isPasswordValid = await userService.verifyPassword(
          adminPassword,
          hashPassword
        );
        if (!isPasswordValid)
          return next(ErrorHandler.unAuthorized("Wrong Password"));

        if (
          dbUser.type === "employee" &&
          (type === "admin" || type === "leader")
        ) {
          if (dbUser.team != null) {
            return next(
              ErrorHandler.badRequest(`Error: ${dbUser.name} is in a team.`)
            );
          }
        }

        if (
          dbUser.type === "leader" &&
          (type === "admin" || type === "employee")
        ) {
          if (await teamService.findTeam({ leader: id })) {
            return next(
              ErrorHandler.badRequest(
                `Error: ${dbUser.name} is leading a team.`
              )
            );
          }
        }
      }

      // Hash password if provided
      if (password) {
        const salt = await bcrypt.genSalt(10);
        password = await bcrypt.hash(password, salt);
      }

      user = {
        name,
        email,
        status,
        username,
        gender,
        mobile,
        password,
        type,
        address,
        account_number,
        ifsc,
        bank_name,
        desgination,
      };

      if (filename) user.image = filename;
    } else {
      id = req.user._id;
      let {
        name,
        username,
        address,
        gender,
        mobile,
        account_number,
        ifsc,
        bank_name,
        desgination,
      } = req.body;

      user = {
        name,
        username,
        mobile,
        gender,
        address,
        account_number,
        ifsc,
        bank_name,
        desgination,
      };

      if (filename) user.image = filename;
    }

    try {
      const userResp = await userService.updateUser(id, user);
      if (!userResp)
        return next(ErrorHandler.serverError("Failed To Update Account"));
      res.json({ success: true, message: "Account Updated" });
    } catch (error) {
      return next(ErrorHandler.serverError("Database Error: " + error.message));
    }
  };

  UserDoc = async (req, res, next) => {
    try {
      const { id } = req.params;

      if (!mongoose.Types.ObjectId.isValid(id)) {
        return res
          .status(400)
          .json({ success: false, message: "Invalid user ID." });
      }
      console.log(req.files);

      if (!req.files || Object.keys(req.files).length === 0) {
        return res
          .status(400)
          .json({ success: false, message: "No documents uploaded." });
      }

      const updateData = {};

      // Prepare file update data
      Object.keys(req.files).forEach((field) => {
        const file = req.files[field][0]; // multer stores files as array
        if (file) {
          updateData[field] = file.path.replace(/\\/g, "/"); // use forward slashes for URLs
        }
      });

      // Update user document
      const updatedUser = await userService.updateUser(id, updateData);

      if (!updatedUser) {
        return res
          .status(404)
          .json({ success: false, message: "User not found." });
      }

      res.json({
        success: true,
        message: "Documents updated successfully",
        data: updatedUser,
      });
    } catch (err) {
      console.error("UserDoc Error:", err);
      res.status(500).json({
        success: false,
        message: "Server error while updating documents.",
      });
    }
  };

  getUsers = async (req, res, next) => {
    try {
      const { status = "All", search = "", type = "" } = req.query;
      const filter = {};

      // ---- type filter ----
      const validTypes = ["admin", "employee", "leader"];
      if (type && validTypes.includes(type.toLowerCase())) {
        filter.type = type.toLowerCase();
      }

      // ---- status filter ----
      if (status && status !== "All") {
        const statusMap = {
          active: "active",
          provison: "provision",
          provision: "provision",
          notice: "notice",
          banned: "banned",
        };
        if (statusMap[status.toLowerCase()]) {
          filter.status = statusMap[status.toLowerCase()];
        }
      }

      // ---- search filter ----
      if (search && search.trim()) {
        const escapeRegex = (s) => s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
        const rx = new RegExp(
          escapeRegex(search.trim()).replace(/\s+/g, ".*"),
          "i"
        );
        filter.$or = [{ name: rx }, { email: rx }];
      }

      // ---- fetch + sort ----
      let users = await userService.findUsers(filter);
      if (!Array.isArray(users)) users = [];

      const sorted = users.sort(
        (a, b) => new Date(b.createdAt) - new Date(a.createdAt)
      );

      const finalData = sorted.map((o) => new UserDto(o));

      return res.json({
        success: true,
        message: finalData.length > 0 ? "Users Found" : "No Users Found",
        data: finalData,
      });
    } catch (err) {
      return next(err);
    }
  };

  getFreeEmployees = async (req, res, next) => {
    try {
      const emps = await userService.findUsers({
        type: "employee",
        team: null,
        status: { $ne: "banned" }, 
      });

      if (!emps || emps.length < 1) {
        return next(ErrorHandler.notFound(`No Free Employee Found`));
      }

      const employees = emps.map((o) => new UserDto(o));
      res.json({
        success: true,
        message: "Free Employees List Found",
        data: employees,
      });
    } catch (err) {
      return next(err);
    }
  };

  getUser = async (req, res, next) => {
    const { id } = req.params;
    const type = req.path.replace(id, "").replace("/", "").replace("/", "");
    if (!mongoose.Types.ObjectId.isValid(id))
      return next(
        ErrorHandler.badRequest(
          `Invalid ${
            type.charAt(0).toUpperCase() + type.slice(1).replace(" ", "")
          } Id`
        )
      );
    const emp = await userService.findUser({ _id: id, type });
    if (!emp)
      return next(
        ErrorHandler.notFound(
          `No ${
            type.charAt(0).toUpperCase() + type.slice(1).replace(" ", "")
          } Found`
        )
      );
    res.json({
      success: true,
      message: "Employee Found",
      data: new UserDto(emp),
    });
  };

  getUserNoFilter = async (req, res, next) => {
    const { id } = req.params;
    if (!mongoose.Types.ObjectId.isValid(id))
      return next(ErrorHandler.badRequest("Invalid User Id"));
    const emp = await userService.findUser({ _id: id });
    if (!emp) return next(ErrorHandler.notFound("No User Found"));
    res.json({ success: true, message: "User Found", data: new UserDto(emp) });
  };

  getLeaders = async (req, res, next) => {
    const leaders = await userService.findLeaders();
    const data = leaders.map((o) => new UserDto(o));
    res.json({ success: true, message: "Leaders Found", data });
  };

  getFreeLeaders = async (req, res, next) => {
    const leaders = await userService.findFreeLeaders();
    const data = leaders.map((o) => new UserDto(o));
    res.json({ success: true, message: "Free Leaders Found", data });
  };

  markInAttendance = async (req, res, next) => {
    try {
      const { employeeID } = req.body; // ❗️ date ignore; sirf server time use
      if (!employeeID)
        return next(ErrorHandler.badRequest("employeeID required"));

      // 1) Server time (UTC) + IST components
      const nowUtc = new Date();
      const nowIst = moment(nowUtc).tz("Asia/Kolkata");

      const days = [
        "Sunday",
        "Monday",
        "Tuesday",
        "Wednesday",
        "Thursday",
        "Friday",
        "Saturday",
      ];

      // 2) Holiday check IST date par
      const istDateOnly = nowIst.clone().startOf("day").toDate(); // for holiday util if needed
      const holidayCheck = attendanceService.isHoliday(istDateOnly);
      if (holidayCheck.isHoliday) {
        return next(
          ErrorHandler.notAllowed(`Today is a holiday: ${holidayCheck.name}`)
        );
      }

      // 3) Attendance key (IST day-boundary)
      const attendanceData = {
        employeeID,
        year: nowIst.year(),
        month: nowIst.month() + 1, // 1-12
        date: nowIst.date(), // 1-31
        day: days[nowIst.day()],
      };

      // 4) Duplicate guard
      const existing = await attendanceService.findAttendance(attendanceData);
      if (existing && existing.inTime) {
        return next(ErrorHandler.notAllowed("IN time already marked."));
      }

      // 5) Save: store UTC Date for inTime, but keys by IST
      const newAttendance = {
        ...attendanceData,
        inTime: nowUtc, // stored as Date (UTC)
        inApproved: false,
        present: "Absent",
      };

      const result = await attendanceService.markAttendance(newAttendance);
      if (!result)
        return next(ErrorHandler.serverError("Failed to mark IN time"));

      res.json({
        success: true,
        message: "IN time marked and sent to Reception for approval",
        newAttendance: result,
      });
    } catch (error) {
      res
        .status(500)
        .json({ success: false, message: error.message, stack: error.stack });
    }
  };

  markOutAttendance = async (req, res, next) => {
    try {
      const { employeeID } = req.body;
      if (!employeeID)
        return next(ErrorHandler.badRequest("employeeID required"));

      const ist = nowIst();
      const { year, month, date } = ymdFromIst(ist);

      // Aaj (IST) ka record lao
      const attendance =
        (await attendanceService.findAttendance?.({
          employeeID,
          year,
          month,
          date,
        })) ||
        (await attendanceModel.findOne({ employeeID, year, month, date }));

      if (!attendance || !attendance.inTime) {
        return next(ErrorHandler.notAllowed("IN time not marked yet."));
      }

      const inTime = new Date(attendance.inTime);
      const workedHours = (nowUtc() - inTime) / (1000 * 60 * 60);

      if (workedHours < 8) {
        const remaining = 8 - workedHours;
        const h = Math.floor(remaining);
        const m = Math.round((remaining - h) * 60);
        return res.json({
          success: false,
          status: 300,
          message: `Abhi ${h}h ${m}m baaki hai. Regularize karna chahoge?`,
          needRegularize: true,
        });
      }

      attendance.outTime = nowUtc(); // exact server time
      attendance.outApproved = true;
      if (attendance.isModified) {
        await attendance.save();
      } else {
        // If service pattern preferred
        await attendance.save();
      }

      res.json({
        success: true,
        message: "OUT time marked",
        newAttendance: attendance,
      });
    } catch (err) {
      res.status(500).json({ success: false, message: err.message });
    }
  };

  /**
   * AUTO OUT: everyday 6:30 PM IST
   * - outTime = 6:30 PM IST
   * - outApproved = workedHours >= 8
   * - needRegularize = true if < 8 (field optional)
   */

  startAutoOut630IST = () => {
    // Har minute chalega; 6:30 IST pe hi fire karega (server TZ agnostic)
    cron.schedule("* * * * *", async () => {
      console.log("[autoOut] Checking for auto-out at 6:30 PM IST");

      try {
        const istNow = nowIst();
        if (!(istNow.hour() === 18 && istNow.minute() === 30)) return;

        // Aaj 18:30 IST ko UTC instant
        const ist630 = istNow
          .clone()
          .hour(18)
          .minute(30)
          .second(0)
          .millisecond(0);
        const outUtc = new Date(ist630.toDate());
        const { year, month, date } = ymdFromIst(ist630);

        const filter = {
          year,
          month,
          date,
          outTime: null,
          inTime: { $ne: null },
        };
        const pending =
          (await attendanceModel.find?.(filter)) ||
          (await attendanceService.findMany?.(filter)) ||
          [];

        for (const att of pending) {
          const inTime = new Date(att.inTime);
          const workedHours = (outUtc - inTime) / (1000 * 60 * 60);

          att.outTime = outUtc;
          att.outApproved = workedHours >= 8;

          await att.save();
        }

        console.log(
          `[autoOut] ${pending.length} employees auto-out @ 6:30 PM IST`
        );
      } catch (e) {
        console.error("[autoOut] error:", e);
      }
    });
  };

  // ---- Example wiring (call once from server.js after DB ready) ----
  // const { startAutoOut630IST } = require("./attendanceOut.controller+job");
  // startAutoOut630IST();

  // 🔹 regularizeAttendanceRequest (OUT)
  regularizeAttendanceRequest = async (req, res, next) => {
    try {
      const { employeeID, regularizeReason } = req.body;
      const now = new Date();

      const query = {
        employeeID,
        year: now.getFullYear(),
        month: now.getMonth() + 1,
        date: now.getDate(),
      };

      const attendance = await attendanceService.findAttendance(query);
      if (!attendance || attendance.outTime) {
        return next(
          ErrorHandler.notAllowed("OUT already marked or no IN found.")
        );
      }

      attendance.outTime = now;
      attendance.outApproved = false;
      attendance.regularized = true;
      attendance.regularizeType = "OUT";
      attendance.regularizeReason = regularizeReason;
      attendance.present = "Half-day"; //   Mandatory for HR review

      await attendance.save();

      res.json({
        success: true,
        message: "Regularize request sent to HR",
        newAttendance: attendance,
      });
    } catch (error) {
      res.status(500).json({ success: false, message: error.message });
    }
  };

  // 🔹 getAllOutRegularizeRequests (for HR panel)
  getAllOutRegularizeRequests = async (req, res, next) => {
    try {
      const { year, month, date } = req.query; // optional query params

      const filter = {
        regularized: true,
        regularizeType: "OUT",
        outApproved: false,
      };

      if (year) filter.year = parseInt(year);
      if (month) filter.month = parseInt(month);
      if (date) filter.date = parseInt(date);

      const resp = await attendanceService.findAllAttendance(filter);

      if (!resp || resp.length === 0) {
        return next(
          ErrorHandler.notFound("No pending OUT regularize requests")
        );
      }

      res.json({ success: true, data: resp });
    } catch (error) {
      res.status(500).json({ success: false, message: error.message });
    }
  };

  getAllTodayInRequests = async (req, res, next) => {
    try {
      const now = new Date(req.query.date);
      // console.log(req);

      // const filter = {
      //   year: req.query.year,
      //   month: req.query.month,
      //   date: req.query.date,
      //   inApproved: false,
      // };
      const query = {
        year: now.getFullYear(),
        month: now.getMonth() + 1,
        date: now.getDate(),
        inApproved: false,
      };

      console.log(query);

      const resp = await attendanceService.findAllAttendance(query);
      if (!resp)
        return next(ErrorHandler.notFound("No IN Requests found for today"));
      const sortedResp = resp.sort(
        (a, b) => new Date(b.appliedDate) - new Date(a.appliedDate)
      );
      res.json({ success: true, data: sortedResp });
    } catch (error) {
      console.error("Error in markEmployeeAttendance:", error); // This will log full error on server
      res.status(500).json({
        success: false,
        message: error.message || "Internal Server Error",
        stack: error.stack, // optional: remove in production
      });
    }
  };
  approveInRequest = async (req, res, next) => {
    try {
      const { attendanceID, present, type } = req.body;

      if (!attendanceID || !present || !type) {
        return next(
          ErrorHandler.badRequest(
            "Attendance ID, type, and present value are required"
          )
        );
      }

      const allowedPresent = ["Present", "Half-day", "Absent"];
      const allowedTypes = ["in", "out"];

      if (!allowedPresent.includes(present)) {
        return next(ErrorHandler.badRequest("Invalid present value"));
      }

      if (!allowedTypes.includes(type)) {
        return next(
          ErrorHandler.badRequest('Invalid type (must be "in" or "out")')
        );
      }

      const updateFields = {
        present,
      };

      if (type === "in") updateFields.inApproved = true;
      else if (type === "out") updateFields.outApproved = true;

      const updated = await attendanceService.updateAttendance(
        attendanceID,
        updateFields
      );

      if (!updated) return next(ErrorHandler.notFound("Attendance not found"));

      res.json({
        success: true,
        message: `${type.toUpperCase()} request marked as ${present}`,
        data: updated,
      });
    } catch (error) {
      res.json({ success: false, error });
    }
  };

  viewEmployeeAttendance = async (req, res, next) => {
    try {
      const { employeeID, year, month, date, fromDate, toDate, status } =
        req.body;

      let filter = {};

      if (employeeID) filter.employeeID = employeeID;
      if (year) filter.year = year;
      if (month) filter.month = month;
      if (date) filter.date = date;

      //   Proper Date Range Filter (based on year/month/date fields)

      if (fromDate && toDate) {
        const from = new Date(fromDate);
        const to = new Date(toDate);

        filter.$and = [
          { year: { $gte: from.getFullYear(), $lte: to.getFullYear() } },
          { month: { $gte: from.getMonth() + 1, $lte: to.getMonth() + 1 } },
          { date: { $gte: from.getDate(), $lte: to.getDate() } },
        ];
      }

      // 🔹 present status filter
      if (status && status !== "All") {
        filter.present = status;
      }
      console.log(filter);

      const resp = await attendanceService.findAllAttendance(filter);

      if (!resp || resp.length === 0) {
        return next(ErrorHandler.notFound("No Attendance found"));
      }
      const sortedResp = resp.sort(
        (a, b) => new Date(b.appliedDate) - new Date(a.appliedDate)
      );
      res.json({ success: true, data: sortedResp });
    } catch (error) {
      res.json({ success: false, error });
    }
  };

  applyLeaveApplication = async (req, res, next) => {
    try {
      const data = req.body;
      const {
        applicantID,
        title,
        type,
        startDate,
        endDate,
        appliedDate,
        period,
        reason,
      } = data;
      const newLeaveApplication = {
        applicantID,
        title,
        type,
        startDate,
        endDate,
        appliedDate,
        period,
        reason,
        adminResponse: "Pending",
      };

      const isLeaveApplied = await userService.findLeaveApplication({
        applicantID,
        startDate,
        endDate,
        appliedDate,
      });
      if (isLeaveApplied)
        return next(ErrorHandler.notAllowed("Leave Already Applied"));

      const resp = await userService.createLeaveApplication(
        newLeaveApplication
      );
      if (!resp) return next(ErrorHandler.serverError("Failed to apply leave"));

      res.json({ success: true, data: resp });
    } catch (error) {
      res.json({ success: false, error });
    }
  };
  applyAssest = async (req, res, next) => {
    try {
      const data = req.body;
      const {
        applicantID,
        title,
        type,
        startDate,
        appliedDate,
        period,
        reason,
      } = data;
      const newLeaveApplication = {
        applicantID,
        title,
        type,
        startDate,

        appliedDate,
        period,
        reason,
        adminResponse: "Pending",
      };

      const isLeaveApplied = await userService.findAssestApplication({
        applicantID,
        startDate,
        appliedDate,
      });
      if (isLeaveApplied)
        return next(ErrorHandler.notAllowed("request Already Applied"));

      const resp = await userService.createAssestApplication(
        newLeaveApplication
      );
      if (!resp)
        return next(ErrorHandler.serverError("Failed to Assest request"));

      res.json({ success: true, data: resp });
    } catch (error) {
      res.json({ success: false, error });
    }
  };

  viewLeaveApplications = async (req, res, next) => {
    try {
      const data = req.body;
      console.log(data);

      if (data.appliedDate) {
        const dateStr = new Date(data.appliedDate)
          .toISOString()
          .split("T")[0]
          .replace(/^0+|-(0+)/g, (m, p1) => (p1 ? "-" : ""));
        data.appliedDate = dateStr; // match string format like "2025-4-28"
      }

      const resp = await userService.findAllLeaveApplications(data);

      if (!resp || resp.length === 0) {
        return next(ErrorHandler.notFound("No Leave Applications found"));
      }

      const sortedResp = resp.sort(
        (a, b) => new Date(b.appliedDate) - new Date(a.appliedDate)
      );

      res.json({ success: true, data: sortedResp });
    } catch (error) {
      res.json({ success: false, error });
    }
  };

  viewAssestApplication = async (req, res, next) => {
    try {
      const data = req.body;
      const resp = await userService.findAllassestApplications(data);
      if (!resp)
        return next(ErrorHandler.notFound("No Assest Applications found"));
      const sortedResp = resp.sort(
        (a, b) => new Date(b.appliedDate) - new Date(a.appliedDate)
      );
      res.json({ success: true, data: sortedResp });
    } catch (error) {
      res.json({ success: false, error });
    }
  };

  updateLeaveApplication = async (req, res, next) => {
    try {
      const { id } = req.params;
      const body = req.body;
      const isLeaveUpdated = await userService.updateLeaveApplication(id, body);
      if (!isLeaveUpdated)
        return next(ErrorHandler.serverError("Failed to update leave"));
      res.json({ success: true, message: "Leave Updated" });
    } catch (error) {
      res.json({ success: false, error });
    }
  };
  updateAssestApplication = async (req, res, next) => {
    try {
      const { id } = req.params;
      const body = req.body;
      const isLeaveUpdated = await userService.updateAssestApplication(
        id,
        body
      );
      if (!isLeaveUpdated)
        return next(ErrorHandler.serverError("Failed to update Assest"));
      res.json({ success: true, message: "Assest Updated" });
    } catch (error) {
      res.json({ success: false, error });
    }
  };

  assignEmployeeSalary = async (req, res, next) => {
    try {
      const data = req.body;
      const obj = {
        employeeID: data.employeeID,
      };
      const isSalaryAssigned = await userService.findSalary(obj);
      if (isSalaryAssigned)
        return next(ErrorHandler.serverError("Salary already assigned"));

      const d = new Date();
      data["assignedDate"] =
        d.getFullYear() + "-" + (d.getMonth() + 1) + "-" + d.getDate();
      const resp = await userService.assignSalary(data);
      if (!resp)
        return next(ErrorHandler.serverError("Failed to assign salary"));
      res.json({ success: true, data: resp });
    } catch (error) {
      res.json({ success: false, error });
    }
  };
  assignletter = async (req, res, next) => {
    try {
      const data = req.body;

      const d = new Date();
      data.assignedDate = `${d.getFullYear()}-${
        d.getMonth() + 1
      }-${d.getDate()}`;
      const letterHTML = data.letterHTML;

      // Paths
      const letterheadImage = "L.png";
      const imagePath = path.resolve(
        __dirname,
        `../storage/later-head/${letterheadImage}`
      );
      const outputPath = path.resolve(
        __dirname,
        `../storage/later-head/letter-${data.employeeID}-${data.letterType}.pdf`
      );

      // Convert image to Base64
      if (!fs.existsSync(imagePath)) {
        console.log("Letterhead image not found!");
      }
      const imageBuffer = fs.readFileSync(imagePath);
      const imageBase64 = imageBuffer.toString("base64");
      const imageSrc = `data:image/png;base64,${imageBase64}`;

      // Launch Puppeteer
      const browser = await puppeteer.launch({ headless: true });
      const page = await browser.newPage();

      await page.setContent(
        `
      <html>
        <head>
          <style>
            @page { size: A4; margin: 0; }
            body {
              margin: 0;
              font-family: 'Arial', sans-serif;
              background-image: url("${imageSrc}");
              background-size: contain;
              background-repeat: no-repeat;
              background-position: top center;
              padding-top: 200px;
              padding-left: 60px;
              padding-right: 60px;
              padding-bottom: 60px;
              font-size: 14px;
              line-height: 1.6;
            }
            p { margin-bottom: 10px; }
            ul { margin: 10px 0; padding-left: 20px; }
            li { margin-bottom: 6px; }
          </style>
        </head>
        <body>
          ${letterHTML}
        </body>
      </html>
    `,
        { waitUntil: "networkidle0" }
      );

      // Save PDF
      await page.pdf({
        path: outputPath,
        format: "A4",
        printBackground: true,
      });

      await browser.close();

      // Find employee for email
      const employee = await UserModel.findById(data.employeeID);
      if (!employee || !employee.email) {
        return next(ErrorHandler.serverError("Employee email not found"));
      }

      // Send email with attachment
      const transporter = nodeMailer.createTransport({
        service: "gmail",
        auth: {
          user: "hr@7unique.in",
          pass: "zfes rsbk pzwg ozxe", // 🔐 Consider using env variable in production
        },
      });

      const mailOptions = {
        from: "hr@7unique.in",
        to: employee.email,
        subject: `Your ${data.letterType} Letter`,
        text: `Dear ${employee.name},\n\nPlease find your ${data.letterType} letter attached.`,
        attachments: [
          {
            filename: `letter-${data.letterType}.pdf`,
            path: outputPath,
          },
        ],
      };

      transporter.sendMail(mailOptions, (err, info) => {
        if (err) {
          console.error("   Failed to send email:", err);
        } else {
          console.log("  Email sent:", info.response);
        }
      });

      // Save letter assignment to DB
      const resp = await userService.assignSalary({
        ...data,
        pdfPath: outputPath,
      });

      if (!resp) {
        return next(ErrorHandler.serverError("Failed to assign letter"));
      }

      //   Convert to public URL
      const fileName = path.basename(outputPath);
      const publicPath = `/storage/later-head/${fileName}`;
      const fullUrl = `${req.protocol}://${req.get("host")}${publicPath}`;

      res.json({ success: true, data: resp, filePath: fullUrl });
    } catch (error) {
      console.error("   Error in assignletter:", error);
      res.json({ success: false, error: error.message });
    }
  };

  updateEmployeeSalary = async (req, res, next) => {
    try {
      const body = req.body;
      const { employeeID } = body;
      const d = new Date();
      body["assignedDate"] =
        d.getFullYear() + "-" + (d.getMonth() + 1) + "-" + d.getDate();
      const isSalaryUpdated = await userService.updateSalary(
        { employeeID },
        body
      );
      console.log(isSalaryUpdated);
      if (!isSalaryUpdated)
        return next(ErrorHandler.serverError("Failed to update salary"));
      res.json({ success: true, message: "Salary Updated" });
    } catch (error) {
      res.json({ success: false, error });
    }
  };

  viewSalary = async (req, res, next) => {
    try {
      const data = req.body;
      const resp = await userService.findAllSalary(data);
      if (!resp) return next(ErrorHandler.notFound("No Salary Found"));
      res.json({ success: true, data: resp });
    } catch (error) {
      res.json({ success: false, error });
    }
  };
}

module.exports = new UserController();
