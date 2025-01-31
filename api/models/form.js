const moment = require('moment-timezone');
const mongoose = require('mongoose');
const defaultDate = moment.tz(Date.now(), "Asia/Jakarta");

const FORM_TYPE = {
	partnership_kso_tac: 1,
	partnership_pso: 2,
	partnership_tenant: 3,
}

const formSchema = new mongoose.Schema({
	type: {
		type: Number,
		default: FORM_TYPE.partnership_kso_tac
	},
	name: {
		type: String
	},
	brand_name: {
		type: String
	},
	email: {
		type: String
	},
	phone_number: {
		type: String
	},
	business_type: {
		type: String
	},
	locations: [
		{
			type: String
		}
	],
	address: {
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

formSchema.static('FORM_TYPE', function () {
	return FORM_TYPE
});

const Form = mongoose.model('Form', formSchema, 'form');

module.exports = Form;
