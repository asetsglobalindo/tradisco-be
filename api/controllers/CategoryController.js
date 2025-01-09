const response = require("../helper/response");
const { generateSlugV3, generateSlugV4 } = require("../helper/stringmod");
const { i18n, default_lang } = require("../locales");
const models = require("../models");
const moment = require("moment");
const CONTROLLER = {
	id: "Kategory",
	en: "Category"
}

const Controller = {
	get: async function (req, res) {
		const { page = 1, limit = 20, type } = req.query;
		let filter = {
			deleted_time: {
				$exists: false
			}
		}
		if (type) filter.type = models.Category.CATEGORY_TYPE()[type];
		const sort = {
			sort: { name: 1 },
			skip: (parseInt(page) - 1) * parseInt(limit),
			limit: parseInt(limit),
		}
		const categories = await models.Category.find(filter, null, sort);
		const total_data = await models.Category.countDocuments(filter);
		const pages = {
			current_page: parseInt(page),
			total_data,
		};
		return response.ok(categories, res, `Success`, pages);
	},
	getDetail: async function (req, res) {
		const { category_id } = req.params;

		let filter = {
			_id: category_id,
			deleted_time: {
				$exists: false
			}
		}

		const category = await models.Category.findOne(filter);
		return response.ok(category, res, i18n(`Success`, {}, default_lang(req.headers), 'general'));
	},
	add: async function (req, res) {
		const current_date = moment().tz('Asia/Jakarta').format();
		const { name, type } = req.body;

		const slug = await generateSlugV3(name['id'], models.Category, `name`)

		const filter_existing_data = {
			deleted_time: {
				$exists: false
			}
		}
		const categories = await models.Category.find(filter_existing_data, `name slug`);
		const existing_data = categories.filter(item => item.name[default_lang(req.headers)].toUpperCase() == name[default_lang(req.headers)].toUpperCase() || item?.slug?.toUpperCase() == slug.toUpperCase());
		if (existing_data.length > 0) return response.error(400, i18n(`Exists {{name}}`, { name: CONTROLLER[default_lang(req.headers)] }, default_lang(req.headers), 'general'), res, i18n(`Exists {{name}}`, { name: CONTROLLER[default_lang(req.headers)] }, default_lang(req.headers), 'general'));

		const session = await models.Category.startSession();
		session.startTransaction();

		try {
			const options = { session };

			let new_data = {
				created_at: current_date,
				created_by: req.me._id,
				name, type: models.Category.CATEGORY_TYPE()[type],
				slug
			}
			await models.Category(new_data).save(options);

			await session.commitTransaction();
			session.endSession();
			return response.ok(true, res, i18n(`Success`, {}, default_lang(req.headers), 'general'));
		} catch (err) {
			await session.abortTransaction();
			session.endSession();
			return response.error(400, err.message, res, err);
		}
	},
	addMultiple: async function (req, res) {
		const current_date = moment().tz('Asia/Jakarta').format();
		const { categories } = req.body;
		let new_data = [];

		const session = await models.Category.startSession();
		session.startTransaction();

		try {
			const options = { session };

			for (let i = 0; i < categories.length; i++) {
				const category = categories[i];
				const slug = await generateSlugV3(category.name['id'], models.Category, `name`)

				const check_duplicate = new_data.find(item => item.name[[default_lang(req.headers)]].trim().toLowerCase() == category.name[[default_lang(req.headers)]].trim().toLowerCase());
				if (check_duplicate) throw i18n(`Exists {{name}}`, { name: category.name }, default_lang(req.headers), 'general');

				new_data.push({
					created_at: current_date,
					created_by: req.me._id,
					name: category.name,
					type: models.Category.CATEGORY_TYPE()[category.type],
					slug
				});
			}

			await models.Category.insertMany(new_data, options)

			await session.commitTransaction();
			session.endSession();
			return response.ok(true, res, i18n(`Success`, {}, default_lang(req.headers), 'general'));
		} catch (err) {
			await session.abortTransaction();
			session.endSession();
			return response.error(400, err.message, res, err);
		}
	},
	update: async function (req, res) {
		const current_date = moment().tz('Asia/Jakarta').format();
		const { category_id, name, type } = req.body;

		let additional_filter = {
			_id: {
				$nin: category_id
			}
		}
		const slug = await generateSlugV4(name['id'], models.Category, `name`, additional_filter)

		const categories = await models.Category.find({
			_id: {
				$nin: category_id
			},
			deleted_time: {
				$exists: false
			}
		}, `name slug`);

		const existing_data = categories.filter(item => item.name[default_lang(req.headers)].toUpperCase() == name[default_lang(req.headers)].toUpperCase() || item?.slug?.toUpperCase() == slug.toUpperCase());
		if (existing_data.length > 0) return response.error(400, i18n(`Exists {{name}}`, { name: "Name" }, default_lang(req.headers), 'general'), res, i18n(`Exists {{name}}`, { name: "Name" }, default_lang(req.headers), 'general'));

		const filter = {
			_id: category_id,
			deleted_time: {
				$exists: false
			}
		}

		const category = await models.Category.findOne(filter)
		if (!category) return response.error(400, i18n(`NotFound {{name}}`, { name: CONTROLLER[default_lang(req.headers)] }, default_lang(req.headers), 'general'), res, i18n(`NotFound {{name}}`, { name: CONTROLLER[default_lang(req.headers)] }, default_lang(req.headers), 'general'));

		const session = await models.Category.startSession();
		session.startTransaction();

		try {
			const options = { session };

			category.name = name;
			category.slug = slug;
			category.type = models.Category.CATEGORY_TYPE()[type];
			category.updated_at = current_date;
			category.updated_by = req.me._id
			await category.save(options);

			await session.commitTransaction();
			session.endSession();
			return response.ok(true, res, i18n(`Success`, {}, default_lang(req.headers), 'general'));
		} catch (err) {
			await session.abortTransaction();
			session.endSession();
			return response.error(400, err.message, res, err);
		}
	},
	delete: async function (req, res) {
		const { category_id } = req.body;
		const current_date = moment().tz('Asia/Jakarta').format();

		const categories = await models.Category.find({
			_id: { $in: category_id },
			deleted_time: {
				$exists: false
			}
		})

		for (let i = 0; i < categories.length; i++) {
			const category = categories[i];

			const session = await models.Category.startSession();
			session.startTransaction();

			try {
				const options = { session };

				category.deleted_time = current_date;
				category.deleted_by = req.me._id;
				category.updated_at = undefined;
				category.updated_by = undefined;
				await category.save(options);

				await session.commitTransaction();
				session.endSession();
			} catch (err) {
				await session.abortTransaction();
				session.endSession();
				return response.error(400, err.message, res, err);
			}
		}

		return response.ok(true, res, i18n(`Success`, {}, default_lang(req.headers), 'general'));
	}
}

module.exports = Controller;

