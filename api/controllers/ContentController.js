const response = require("../helper/response");
const { generateSlugV3, generateSlugV4, regexWithSymbol, filterObjectID } = require("../helper/stringmod");
const { CONTENT_TYPE, NEWS_CATEGORY, CONTENT_DETAIL_TYPE } = require("../helper/types");
const { i18n, default_lang } = require("../locales");
const models = require("../models");
const moment = require("moment");
const CONTROLLER = {
	id: "Konten",
	en: "Content"
}

const POPULATE = [
	{ path: `category_id`, select: `name`, match: { deleted_time: { $exists: false } } },
	{ path: `banner`, select: `images.url images_mobile.url title description button_name button_route`, match: { deleted_time: { $exists: false } } },
	{ path: `images`, select: `images.url title description button_name button_route`, match: { deleted_time: { $exists: false } } },
	{ path: `thumbnail_images`, select: `images.url title description button_name button_route`, match: { deleted_time: { $exists: false } } },
	{ path: `thumbnail_images2`, select: `images.url title description button_name button_route`, match: { deleted_time: { $exists: false } } },
	{ path: `body.images`, select: `images.url title description button_name button_route`, match: { deleted_time: { $exists: false } } },
]

const Controller = {
	get: async function (req, res) {
		const { page = 1, limit = 20, active_status, type, query, category_id, sort_by = 1, sort_at = 'order', publish_only } = req.query;
		let filter = {
			deleted_time: {
				$exists: false
			}
		}
		if (query) {
			filter.$or = [
				{
					title: {
						$regex: new RegExp(regexWithSymbol(query), "i")
					}
				},
			]
		}
		if (category_id) filter.category_id = category_id;
		if (active_status) filter.active_status = active_status;
		if (type) filter.type = models.Content.CONTENT_TYPE()[type];
		if (publish_only == "yes") {
			filter = {
				...filter,
				$or: [
					{ publish_date: { $lte: moment().tz('Asia/Jakarta').format() } },
					{ publish_date: { $exists: false } },
					{ publish_date: null }
				]

			}
		}
		if (req?.me?.organization_id || req.headers?.organizationid) filter.organization_id = req?.me?.organization_id ?? req.headers?.organizationid

		const sort = {
			sort: { [sort_at]: +sort_by },
			skip: (+page - 1) * +limit,
			limit: +limit,
		}

		const contents = await models.Content.find(filter, null, sort).populate(POPULATE);
		const total_data = await models.Content.countDocuments(filter);
		const pages = {
			current_page: parseInt(page),
			total_data,
		};
		return response.ok(contents, res, `Success`, pages);
	},
	getDetail: async function (req, res) {
		const { content_id } = req.params;

		let filter = {
			deleted_time: {
				$exists: false
			}
		}

		const validID = filterObjectID(content_id)
		if (validID) {
			filter.$or = [
				{ _id: validID },
				{ slug: content_id.trim() },
			]
		}
		else if (models.Content.CONTENT_TYPE()[content_id]) {
			filter.type = models.Content.CONTENT_TYPE()[content_id]
		}
		else filter.slug = content_id.trim();
		if (req?.me?.organization_id || req.headers?.organizationid) filter.organization_id = req?.me?.organization_id ?? req.headers?.organizationid
		const populate_image = [
			{ path: `images`, select: `images.url images_mobile.url title description button_name button_route`, match: { deleted_time: { $exists: false } } },
			{ path: `thumbnail_images`, select: `images.url images_mobile.url title description button_name button_route`, match: { deleted_time: { $exists: false } } },
		]
		const populate = [
			{ path: `category_id`, select: `name`, match: { deleted_time: { $exists: false } } },
			{ path: `banner`, select: `images.url images_mobile.url title description button_name button_route is_embedded_video`, match: { deleted_time: { $exists: false } } },
			{ path: `images`, select: `images.url images_mobile.url title description button_name button_route`, match: { deleted_time: { $exists: false } } },
			{ path: `thumbnail_images`, select: `images.url images_mobile.url title description button_name button_route`, match: { deleted_time: { $exists: false } } },
			{ path: `thumbnail_images2`, select: `images.url images_mobile.url title description button_name button_route`, match: { deleted_time: { $exists: false } } },
			{ path: `body.images`, select: `images.url images_mobile.url title description button_name button_route`, match: { deleted_time: { $exists: false } } },
			{ path: `related`, select: "slug title small_text thumbnail_images images type", match: { deleted_time: { $exists: false } }, populate: populate_image },
			{ path: `related2`, select: "slug title small_text thumbnail_images images type", match: { deleted_time: { $exists: false } }, populate: populate_image },
		]
		const content = await models.Content.findOne(filter).populate(populate);
		return response.ok(content, res, i18n(`Success`, {}, req.headers['accept-language'], 'general'));
	},
	add: async function (req, res) {
		const current_date = moment().tz('Asia/Jakarta').format();
		let {
			meta_title, meta_description, small_text, title,
			type, description, bottom_text,
			bottom_button_name, bottom_button_route, active_status,
			related = [], related2 = [], body = [], body2 = [],
			images = [], thumbnail_images = [], banner = [], use_list, thumbnail_images2 = [],
			order, group_by, calendar_key, small_text2, show_on_homepage, category, publish_date, category_id
		} = req.body;

		const slug = await generateSlugV3(title['id'], models.Content, `title`)

		const filter_existing_data = {
			organization_id: req.me.organization_id,
			deleted_time: {
				$exists: false
			}
		}
		const contents = await models.Content.find(filter_existing_data, `title slug`);
		const existing_data = contents.filter(item => item.title[default_lang(req.headers)].toUpperCase() == title[default_lang(req.headers)].toUpperCase() || item?.slug?.toUpperCase() == slug.toUpperCase());
		if (existing_data.length > 0) return response.error(400, i18n(`Exists {{name}}`, { name: CONTROLLER[default_lang(req.headers)] }, default_lang(req.headers), 'general'), res, i18n(`Exists {{name}}`, { name: CONTROLLER[default_lang(req.headers)] }, default_lang(req.headers), 'general'));

		const session = await models.Content.startSession();
		session.startTransaction();

		try {
			const options = { session };

			let new_data = {
				organization_id: req.me.organization_id,
				created_at: current_date,
				created_by: req.me._id,
				meta_title, meta_description,
				title, type: models.Content.CONTENT_TYPE()[type], small_text, slug,
				description, bottom_text, bottom_button_name, bottom_button_route,
				active_status,
				related, related2, body, body2,
				images, thumbnail_images, thumbnail_images2, banner, use_list,
				order, group_by, calendar_key, small_text2, show_on_homepage,
				publish_date, category_id
			}
			await models.Content(new_data).save(options);

			await session.commitTransaction();
			session.endSession();
			return response.ok(true, res, i18n(`Success`, {}, req.headers['accept-language'], 'general'));
		} catch (err) {
			await session.abortTransaction();
			session.endSession();
			return response.error(400, err.message, res, err);
		}
	},
	update: async function (req, res) {
		const current_date = moment().tz('Asia/Jakarta').format();
		let { content_id, meta_title, meta_description, small_text, title,
			type, description, bottom_text, bottom_button_name, bottom_button_route,
			active_status, related = [], related2 = [], body = [], body2 = [],
			images, thumbnail_images, banner, use_list, thumbnail_images2,
			order, group_by, calendar_key, small_text2, show_on_homepage, category, publish_date, category_id
		} = req.body;

		let additional_filter = {
			_id: {
				$nin: content_id
			}
		}
		const slug = await generateSlugV4(title['id'], models.Content, `title`, additional_filter)

		const contents = await models.Content.find({
			_id: {
				$nin: content_id
			},
			organization_id: req.me.organization_id,
			deleted_time: {
				$exists: false
			}
		}, `title slug`);

		const existing_data = contents.filter(item => item.title[default_lang(req.headers)].toUpperCase() == title[default_lang(req.headers)].toUpperCase() || item?.slug?.toUpperCase() == slug.toUpperCase());
		if (existing_data.length > 0) {
			return response.error(400, `Content already exists`, res, `Content already exists`);
		}

		const filter = {
			_id: content_id,
			organization_id: req.me.organization_id,
			deleted_time: {
				$exists: false
			}
		}

		const content = await models.Content.findOne(filter)
		if (!content) return response.error(400, i18n(`NotFound {{name}}`, { name: CONTROLLER[default_lang(req.headers)] }, default_lang(req.headers), 'general'), res, i18n(`NotFound {{name}}`, { name: CONTROLLER[default_lang(req.headers)] }, default_lang(req.headers), 'general'));

		const session = await models.Content.startSession();
		session.startTransaction();

		try {
			const options = { session };

			content.meta_title = meta_title;
			content.meta_description = meta_description;
			content.title = title;
			content.type = models.Content.CONTENT_TYPE()[type];
			content.slug = slug;
			if (description) content.description = description;
			if (bottom_text) content.bottom_text = bottom_text;
			if (bottom_button_name) content.bottom_button_name = bottom_button_name;
			if (show_on_homepage) content.show_on_homepage = show_on_homepage;
			if (bottom_button_route) content.bottom_button_route = bottom_button_route;
			if (small_text) content.small_text = small_text;
			if (active_status) content.active_status = active_status;
			if (related) content.related = related;
			if (related2) content.related2 = related2;
			if (category_id) content.category_id = category_id;
			if (body) content.body = body;
			if (body2) content.body2 = body2;
			if (use_list) content.use_list = use_list;
			if (images) content.images = images;
			if (thumbnail_images) content.thumbnail_images = thumbnail_images;
			if (thumbnail_images2) content.thumbnail_images2 = thumbnail_images2;
			if (banner) content.banner = banner;
			if (order) content.order = order;
			if (group_by) content.group_by = group_by;
			if (calendar_key) content.calendar_key = calendar_key;
			if (small_text2) content.small_text2 = small_text2;
			if (publish_date) content.publish_date = publish_date;
			content.updated_at = current_date;
			content.updated_by = req.me._id
			await content.save(options);

			await session.commitTransaction();
			session.endSession();
			return response.ok(true, res, i18n(`Success`, {}, req.headers['accept-language'], 'general'));
		} catch (err) {
			await session.abortTransaction();
			session.endSession();
			return response.error(400, err.message, res, err);
		}
	},
	delete: async function (req, res) {
		const { content_id } = req.body;
		const current_date = moment().tz('Asia/Jakarta').format();

		const session = await models.Content.startSession();
		session.startTransaction();

		try {
			const options = { session };

			//update content
			const filter = {
				_id: { $in: content_id },
				organization_id: req.me.organization_id,
				deleted_time: {
					$exists: false
				}
			}
			const new_data = {
				$set: {
					deleted_time: current_date,
					deleted_by: req.me._id,
					updated_at: undefined,
					updated_by: undefined,
				}
			}
			await models.Content.updateMany(filter, new_data, options)
			await session.commitTransaction();
			session.endSession();
			return response.ok(true, res, i18n(`Success`, {}, req.headers['accept-language'], 'general'));
		} catch (err) {
			await session.abortTransaction();
			session.endSession();
			return response.error(400, err.message, res, err);
		}

	},
	content: async function (req, res) {
		const { is_home, page = 1, limit = 20, query, category, category_id, image_enum, content_enum } = req.body;

		if (!image_enum && !content_enum) return response.error(400, "Request not found", res, "Request not found");

		let image_type = models.Image.IMAGE_TYPE()[image_enum];
		let content_type = models.Content.CONTENT_TYPE()[content_enum];
		let filter = {
			deleted_time: {
				$exists: false
			},
		}
		const image_body = await models.Image.find({
			...filter,
			type: image_type
		});


		const populate = [
			{ path: `category_id`, select: `name`, match: { deleted_time: { $exists: false } } },
			{ path: `banner`, select: `images.url images_mobile.url title description button_name button_route`, match: { deleted_time: { $exists: false } } },
			{ path: `images`, select: `images.url title description button_name button_route`, match: { deleted_time: { $exists: false } } },
			{ path: `thumbnail_images`, select: `images.url title description button_name button_route`, match: { deleted_time: { $exists: false } } },
			{ path: `thumbnail_images2`, select: `images.url title description button_name button_route`, match: { deleted_time: { $exists: false } } },
			{ path: `body.images`, select: `images.url title description button_name button_route`, match: { deleted_time: { $exists: false } } },
		]

		const sort = {
			sort: { order: 1 },
			skip: (+page - 1) * +limit,
			limit: +limit,
		}
		if (is_home) filter.show_on_homepage = is_home
		if (query) {
			filter.$or = [
				{
					title: {
						$regex: new RegExp(regexWithSymbol(query), "i")
					}
				},
			]
		}
		const content = await models.Content.find({
			...filter,
			type: content_type,
			active_status: true
		}, null, sort).populate(populate)

		let content_page = {
			content: content.length > 0 ? content : [],
		}

		//change name banner to product for project
		if (models.Content.CONTENT_TYPE()[content_enum] == CONTENT_TYPE.project) {
			const populate_content = [
				{ path: `category_id`, select: `name`, match: { deleted_time: { $exists: false } } },
				{ path: `banner`, select: `images.url images_mobile.url`, match: { deleted_time: { $exists: false } } },
				{ path: `body.images`, select: `images.url images_mobile.url`, match: { deleted_time: { $exists: false } } },
				{ path: `thumbnail_images`, select: `images.url images_mobile.url`, match: { deleted_time: { $exists: false } } },
				{ path: `images`, select: `images.url images_mobile.url`, match: { deleted_time: { $exists: false } } },
			]
			const commercials = await models.Content.find({
				...filter,
				type: {
					$in: CONTENT_DETAIL_TYPE[content_enum]
				},
				active_status: true
			}).populate(populate_content)

			content_page.product = [
				...commercials,
			]
		}

		if (models.Content.CONTENT_TYPE()[content_enum] == CONTENT_TYPE.news || models.Content.CONTENT_TYPE()[content_enum] == CONTENT_TYPE.career) {
			const populate_content = [
				{ path: `category_id`, select: `name`, match: { deleted_time: { $exists: false } } },
				{ path: `banner`, select: `images.url images_mobile.url`, match: { deleted_time: { $exists: false } } },
				{ path: `body.images`, select: `images.url images_mobile.url`, match: { deleted_time: { $exists: false } } },
				{ path: `thumbnail_images`, select: `images.url images_mobile.url`, match: { deleted_time: { $exists: false } } },
				{ path: `images`, select: `images.url images_mobile.url`, match: { deleted_time: { $exists: false } } },
			]
			if (category) filter.category = NEWS_CATEGORY[category]
			if (category_id) filter.category_id = category_id
			if (models.Content.CONTENT_TYPE()[content_enum] == CONTENT_TYPE.news) {
				filter.publish_date = {
					$exists: true,
					$lte: moment().tz('Asia/Jakarta').format()
				}
			}
			const content_detail = await models.Content.find({
				...filter,
				type: {
					$in: CONTENT_DETAIL_TYPE[content_enum]
				},
				active_status: true
			}).populate(populate_content)

			content_page.detail = content_detail
		}

		return response.ok(content_page, res, i18n(`Success`, {}, req.headers['accept-language'], 'general'));
	},
}

module.exports = Controller;

