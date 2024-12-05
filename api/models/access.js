const moment = require('moment-timezone');
const mongoose = require('mongoose');
const defaultDate = moment.tz(Date.now(), "Asia/Jakarta");


const accessSchema = new mongoose.Schema({
	ip_address: {
		type: String
	},
	name: {
		type: String
	},

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

const Access = mongoose.model('Access', accessSchema, 'access');

module.exports = Access;