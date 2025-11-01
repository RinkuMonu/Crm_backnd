const cron = require("node-cron");

startAutoOut630IST = () => {
  cron.schedule("* * * * *", async () => {

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

      // Aaj ke sab records jinke outTime null aur inTime present hai
      const filter = {
        year,
        month,
        date,
        outTime: null,
        inTime: { $ne: null },
      };
      const pending =
        (await Attendance.find?.(filter)) ||
        (await attendanceService.findMany?.(filter)) ||
        [];

      for (const att of pending) {
        const inTime = new Date(att.inTime);
        const workedHours = (outUtc - inTime) / (1000 * 60 * 60);

        att.outTime = outUtc;
        att.outApproved = workedHours >= 8;

        // optional flag if your schema allows
        try {
          att.needRegularize = workedHours < 8;
        } catch (_) {}

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
