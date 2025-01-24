const moment = require('moment-timezone');
const mongoose = require('mongoose');
const defaultDate = moment.tz(Date.now(), "Asia/Jakarta");

const locationSchema = new mongoose.Schema({
	name: {
		type: String
	},
	slug: {
		type: String
	},
	code: {
		type: String
	},
	address: {
		type: String
	},
	lat: {
		type: String
	},
	long: {
		type: String
	},
	facility: {
		type: String
	},
	fuel: {
		type: String
	},
	publish: {
		type: Number,
		default: 0
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

const Location = mongoose.model('Location', locationSchema, 'location');

module.exports = Location;
