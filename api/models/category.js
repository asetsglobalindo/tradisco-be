const moment = require('moment-timezone');
const mongoose = require('mongoose');
const { LanguageListType } = require('../helper/types');
const defaultDate = moment.tz(Date.now(), "Asia/Jakarta");

const CATEGORY_TYPE = {
	business: 1,
	news: 2
}
const categorySchema = new mongoose.Schema({
	name: LanguageListType("string"),
	slug: {
		type: String,
	},
	type: {
		type: Number,
		default: CATEGORY_TYPE.business
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
categorySchema.static('CATEGORY_TYPE', function () {
	return CATEGORY_TYPE
});
const Category = mongoose.model('Category', categorySchema, 'category');

module.exports = Category;