const moment = require('moment-timezone');
const mongoose = require('mongoose');
const defaultDate = moment.tz(Date.now(), "Asia/Jakarta");


const citySchema = new mongoose.Schema({
	city_id: {
		type: Number
	},
	name: {
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

const City = mongoose.model('City', citySchema, 'city');

module.exports = City;