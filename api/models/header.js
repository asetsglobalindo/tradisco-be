const moment = require('moment-timezone');
const mongoose = require('mongoose');
const { LanguageListType } = require('../helper/types');
const defaultDate = moment.tz(Date.now(), "Asia/Jakarta");

const headerSchema = new mongoose.Schema({
	meta_title: LanguageListType("string"),
	meta_description: LanguageListType("string"),
	name: LanguageListType("string"),
	route: {
		type: String
	},
	order: {
		type: Number
	},
	images: [
		{
			type: String,
			ref: "Image"
		}
	],
	active_status: {
		type: Boolean,
		default: false
	},
	childs: [
		{
			name: LanguageListType("string"),
			route: {
				type: String
			},
			order: {
				type: Number
			},
			images: [
				{
					type: String,
					ref: "Image"
				}
			],
			childs: [
				{
					name: LanguageListType("string"),
					route: {
						type: String
					},
					order: {
						type: Number
					},
					images: [
						{
							type: String,
							ref: "Image"
						}
					],
				}
			]
		}
	],
	contents: [
		{
			type: String,
			ref: "Content"
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

const Header = mongoose.model('Header', headerSchema, 'header');

module.exports = Header;
