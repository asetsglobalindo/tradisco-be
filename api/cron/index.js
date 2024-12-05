const { sendPendingMail, expireForgotPassword, resetEmailCount } = require('./pendingmail')
const cron = require("node-cron");
const options = {
    scheduled: true,
    timezone: "Asia/Jakarta"
}

cron.schedule('0 0 * * *', resetEmailCount, options); // at 00:00

cron.schedule('* * * * *', sendPendingMail, options); //every minutes
cron.schedule('* * * * *', expireForgotPassword, options); //every minutes

module.exports = {cron};
