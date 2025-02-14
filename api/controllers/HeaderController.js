const response = require("../helper/response");
const { convertData } = require("../helper/convert");
const { i18n, default_lang } = require("../locales");
const models = require("../models");
const moment = require("moment");
const CONTROLLER = "Header"

const Controller = {
	get: async function (req, res) {
		const { page = 1, limit = 20, sort_by = 1, sort_at = 'order' } = req.query;
		let filter = {
			deleted_time: {
				$exists: false
			}
		}

		if (req?.me?.organization_id || req.headers?.organizationid) filter.organization_id = req?.me?.organization_id ?? req.headers?.organizationid
		const populate = [
			{ path: `images`, select: `images.url title description button_name button_route`, match: { deleted_time: { $exists: false } } },
			// { path: `childs.images`, select: `images.url title description button_name button_route`, match: { deleted_time: {$exists: false}}},
			// { path: `contents`, select: `thumbnail_images.url title slug type`, match: { deleted_time: {$exists: false}}},
		]
		const sort = {
			sort: { [sort_at]: +sort_by },
			skip: (+page - 1) * +limit,
			limit: +limit,
		}
		const headers = await models.Header.find(filter, null, sort).populate(populate);
		const total_data = await models.Header.countDocuments(filter);
		const pages = {
			current_page: parseInt(page),
			total_data,
		};
		return response.ok(headers, res, i18n(`Success`, {}, default_lang(req.headers), 'general'), pages);
	},
	getDetail: async function (req, res) {
		const { header_id } = req.params;

		let filter = {
			_id: header_id,
			deleted_time: {
				$exists: false
			}
		}

		if (req?.me?.organization_id || req.headers?.organizationid) filter.organization_id = req?.me?.organization_id ?? req.headers?.organizationid
		const populate = [
			{ path: `images`, select: `images.url title description button_name button_route`, match: { deleted_time: { $exists: false } } },
			{ path: `childs.images`, select: `images.url title description button_name button_route`, match: { deleted_time: { $exists: false } } },
			{ path: `childs.childs.images`, select: `images.url title description button_name button_route`, match: { deleted_time: { $exists: false } } },
			{ path: `contents`, select: `thumbnail_images.url title slug type`, match: { deleted_time: { $exists: false } } },
		]
		const header = await models.Header.findOne(filter).populate(populate);
		return response.ok(header, res, i18n(`Success`, {}, default_lang(req.headers), 'general'));
	},
	add: async function (req, res) {
		const current_date = moment().tz('Asia/Jakarta').format();
		const { name, route, order, active_status, images = [], childs = [], contents = [], meta_title, meta_description } = req.body;

		const filter_existing_data = {
			organization_id: req.me.organization_id,
			deleted_time: {
				$exists: false
			}
		}
		const headers = await models.Header.find(filter_existing_data, `name`);
		const existing_data = headers.filter(item => item.name[default_lang(req.headers)]?.toUpperCase() == name[default_lang(req.headers)]?.toUpperCase());
		if (existing_data.length > 0) if (existing_data.length > 0) return response.error(400, i18n(`Exists {{name}}`, { name: CONTROLLER }, default_lang(req.headers), 'general'), res, i18n(`Exists {{name}}`, { name: CONTROLLER }, default_lang(req.headers), 'general'));


		const session = await models.Header.startSession();
		session.startTransaction();

		try {
			const options = { session };
			let new_data = {
				organization_id: req.me.organization_id,
				created_at: current_date,
				created_by: req.me._id,
				name, route, order, active_status,
				childs, images, contents, meta_title, meta_description
			}
			await models.Header(new_data).save(options);

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
		const { header_id, name, route, order, active_status, images = [], childs = [], contents = [],
			meta_title, meta_description
		} = req.body;

		const headers = await models.Header.find({
			_id: {
				$nin: header_id
			},
			organization_id: req.me.organization_id,
			deleted_time: {
				$exists: false
			}
		}, `name`);
		const existing_data = headers.filter(item => item.name[default_lang(req.headers)].toUpperCase() == name[default_lang(req.headers)].toUpperCase());
		if (existing_data.length > 0) if (existing_data.length > 0) return response.error(400, i18n(`Exists {{name}}`, { name: CONTROLLER[default_lang(req.headers)] }, default_lang(req.headers), 'general'), res, i18n(`Exists {{name}}`, { name: CONTROLLER[default_lang(req.headers)] }, default_lang(req.headers), 'general'));

		const filter = {
			_id: header_id,
			organization_id: req.me.organization_id,
			deleted_time: {
				$exists: false
			}
		}

		const header = await models.Header.findOne(filter)
		if (!header) return response.error(400, i18n(`NotFound {{name}}`, { name: CONTROLLER[default_lang(req.headers)] }, default_lang(req.headers), 'general'), res, i18n(`NotFound {{name}}`, { name: CONTROLLER[default_lang(req.headers)] }, default_lang(req.headers), 'general'));

		const session = await models.Header.startSession();
		session.startTransaction();

		try {
			const options = { session };

			header.name = name;
			header.type = route;
			header.order = order;
			header.images = images;
			header.childs = childs;
			header.contents = contents;
			header.meta_title = meta_title;
			header.meta_description = meta_description;
			header.active_status = active_status;
			header.updated_at = current_date
			header.updated_by = req.me._id
			await header.save(options);

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
		const { header_id } = req.body;
		const current_date = moment().tz('Asia/Jakarta').format();

		const headers = await models.Header.find({
			_id: { $in: header_id },
			organization_id: req.me.organization_id,
			deleted_time: {
				$exists: false
			}
		})

		for (let i = 0; i < headers.length; i++) {
			const header = headers[i];

			const session = await models.Header.startSession();
			session.startTransaction();

			try {
				const options = { session };

				header.deleted_time = current_date;
				header.deleted_by = req.me._id;
				header.updated_at = undefined;
				header.updated_by = undefined;
				await header.save(options);

				await session.commitTransaction();
				session.endSession();
				return response.ok(true, res, i18n(`Success`, {}, default_lang(req.headers), 'general'));
			} catch (err) {
				await session.abortTransaction();
				session.endSession();
				return response.error(400, err.message, res, err);
			}
		}
	},
	headerFooter: async function (req, res) {
		let filter = {
			deleted_time: {
				$exists: false
			}
		}

		if (req?.me?.organization_id || req.headers?.organizationid) filter.organization_id = req?.me?.organization_id ?? req.headers?.organizationid;
		const sort = {
			sort: { order: 1 },
		}
		const populate = [
			{ path: `images`, select: `images.url title description button_name button_route`, match: { deleted_time: { $exists: false } } },
		]
		let headers = await models.Header.find(filter, null, sort).populate(populate);
		headers = JSON.parse(JSON.stringify(headers))

		let meta = {}
		for (let i = 0; i < headers.length; i++) {
			let header = headers[i];
			header = convertData(header, req.headers)
			meta[header.name] = header
		}

		//get footer
		const footer_attr = `tagline url_instagram url_facebook url_linkedin url_mail address mail tel copyright_text copyright_link other_routes`;
		let footer = await models.Footer.findOne({}, footer_attr);
		footer = JSON.parse(JSON.stringify(footer))
		footer = convertData(footer, req.headers)

		let content;
		content = {
			meta,
			headers,
			footer
		}
		return response.ok(content, res, i18n(`Success`, {}, default_lang(req.headers), 'general'));
	}
}

module.exports = Controller;