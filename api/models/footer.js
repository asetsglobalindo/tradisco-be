const moment = require('moment-timezone');
const mongoose = require('mongoose');
const { LanguageListType } = require('../helper/types');
const defaultDate = moment.tz(Date.now(), "Asia/Jakarta");


const footerSchema = new mongoose.Schema({
	tagline: LanguageListType("string"),
	url_instagram: {
		type: String
	},
	url_facebook: {
		type: String
	},
	url_linkedin: {
		type: String
	},
	url_mail: {
		type: String
	},
	address: {
		type: String
	},
	mail: {
		type: String
	},
	tel: {
		type: String
	},
	copyright_text: {
		type: String
	},
	copyright_link: {
		type: String
	},
	other_routes: [
		{
			title: LanguageListType("string"),
			route: {
				type: String
			},
			order: {
				type: Number,
				default: 0
			}
		}
	],

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

const Footer = mongoose.model('Footer', footerSchema, 'footer');

module.exports = Footer;
