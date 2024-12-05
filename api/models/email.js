const moment = require('moment-timezone');
const mongoose = require('mongoose');
const defaultDate = moment.tz(Date.now(), "Asia/Jakarta");


const emailSchema = new mongoose.Schema({
	cc: [
		{
			type: String
		}
	],
	bcc: [
		{
			type: String
		}
	],
	type: {
		//1 -> forgot password
		//2 -> new user from third party
		//3 -> feedback for user
		//4 -> feedback for admin
		//5 -> reminder resi
		//6 -> new transaction for user
		//7 -> new transaction for admin
		//8 -> success payment for user
		//9 -> success payment for admin
		//10 -> expired transaction for user
		//11 -> completed transaction for user
		//12 -> reminder produk qty
		//13 -> new user from signup
		//14 -> new user for admin
		type: Number
	},
	subject: {
		type: String
	},
	body: {
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

const Email = mongoose.model('Email', emailSchema, 'email');

module.exports = Email;
