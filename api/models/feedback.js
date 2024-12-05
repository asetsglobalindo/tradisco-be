const moment = require('moment-timezone');
const mongoose = require('mongoose');
const defaultDate = moment.tz(Date.now(), "Asia/Jakarta");


const feedbackSchema = new mongoose.Schema({
	name: {
		type: String
	},
	subject: {
		type: String
	},
	email: {
		type: String
	},
	phone_number: {
		type: String
	},
	message: {
		type: String
	},
	information: {
		type: Number,
	},
	agree_stored: {
		type: Boolean,
		default: false
	},
	start_date: {
		type: Date,
	},
	end_date: {
		type: Date,
	},
	booking_type: [
		{
			type: String
		}
	],

	organization_id: {
		type: String
	},
	created_at: {
		type: Date,
		default: defaultDate
	},
	created_by: String,
	updated_at: Date,
	updated_by: String,
	deleted_time: Date,
	deleted_by: String
});

const Feedback = mongoose.model('Feedback', feedbackSchema, 'feedback');

module.exports = Feedback;
