const moment = require('moment-timezone');
const mongoose = require('mongoose');
const defaultDate = moment.tz(Date.now(), "Asia/Jakarta");


const pendingMailSchema = new mongoose.Schema({
    to: {
        type: String,
        required: true
    },
    cc: {
        type: String,
    },
    bcc: {
        type: String,
    },
    subject: {
        type: String,
        required: true
    },
    html: {
        type: String,
        required: true
    },
    path: String,
    attachment: String,
    created_at: {
		type: Date,
		default: defaultDate
	},
    updated_at: Date
});

const PendingMail = mongoose.model('PendingMail', pendingMailSchema, 'pending_mail');
module.exports = PendingMail;
