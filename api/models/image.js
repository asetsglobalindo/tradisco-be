const moment = require('moment-timezone');
const mongoose = require('mongoose');
const defaultDate = moment.tz(Date.now(), "Asia/Jakarta");

const IMAGE_TYPE = {
	home: 1,
	business: 2,
	news: 3,
	career: 4,
	about: 5,
	investor: 6,
	annual_report: 7,
	sustainability_report: 8,
	procurement_information: 9,
	investor_banner: 10,
	annual_report_banner: 11,
	sustainability_report_banner: 12,
	procurement_information_banner: 13,
	mitra: 14,
	mitra_page: 15,
	sub_company: 16,
	csr_page: 17,
	bazma: 18,
	company_report: 19,
}

const imageSchema = new mongoose.Schema({
	title: {
		type: String
	},
	description: {
		type: String
	},
	type: {
		type: Number,
		default: 1
	},
	button_name: {
		type: String
	},
	button_route: {
		type: String
	},
	is_embedded_video: {
		type: Boolean,
		default: false
	},
	active_status: {
		type: Boolean,
		default: false
	},
	images: [
		{
			name: {
				type: String
			},
			path: {
				type: String
			},
			type: {
				type: String
			},
			size: {
				type: Number
			},
			url: {
				type: String
			}
		}
	],
	images_mobile: [
		{
			name: {
				type: String
			},
			path: {
				type: String
			},
			type: {
				type: String
			},
			size: {
				type: Number
			},
			url: {
				type: String
			}
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

imageSchema.static('IMAGE_TYPE', function () {
	return IMAGE_TYPE
});

const Image = mongoose.model('Image', imageSchema, 'image');

module.exports = Image;
