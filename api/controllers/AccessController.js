const response = require("../helper/response");
const { i18n } = require("../locales");
const models = require("../models");
const moment = require("moment");
const Controller = {
	get: async function (req, res) {
		const { page = 1, limit = 20, active_status = false } = req.query;
		let filter = {
			deleted_time: {
				$exists: false
			}
		}
		if (req?.me?.organization_id || req.headers?.organizationid) filter.organization_id = req?.me?.organization_id ?? req.headers?.organizationid
		if (active_status) filter.active_status = active_status;
		const sort = {
			sort: { order: 1 },
			skip: (parseInt(page) - 1) * parseInt(limit),
			limit: parseInt(limit),
		}
		const accesses = await models.Access.find(filter, null, sort);
		const total_data = await models.Access.countDocuments(filter);
		const pages = {
			current_page: parseInt(page),
			total_data,
		};
		return response.ok(accesses, res, `Success`, pages);
	},
	getDetail: async function (req, res) {
		const { access_id } = req.params;

		let filter = {
			_id: access_id,
			deleted_time: {
				$exists: false
			}
		}
		if (req?.me?.organization_id || req.headers?.organizationid) filter.organization_id = req?.me?.organization_id ?? req.headers?.organizationid

		const access = await models.Access.findOne(filter);
		return response.ok(access, res, i18n(`Success`, {}, req.headers['accept-language'], 'general'));
	},
	add: async function (req, res) {
		const current_date = moment().tz('Asia/Jakarta').format();
		const { name, ip_address } = req.body;

		const filter_existing_data = {
			organization_id: req?.me?.organization_id,
			deleted_time: {
				$exists: false
			}
		}
		const accesses = await models.Access.find(filter_existing_data, `ip_address`);
		const existing_data = accesses.filter(item => item.ip_address.toUpperCase() == ip_address.toUpperCase());
		if (existing_data.length > 0) return response.error(400, `Ip address already exists`, res, `Ip address already exists`);

		const session = await models.Access.startSession();
		session.startTransaction();

		try {
			const options = { session };

			let new_data = {
				created_at: current_date,
				created_by: req.me._id,
				organization_id: req?.me?.organization_id,
				name, ip_address
			}
			await models.Access(new_data).save(options);

			await session.commitTransaction();
			session.endSession();
			return response.ok(true, res, i18n(`Success`, {}, req.headers['accept-language'], 'general'));
		} catch (err) {
			await session.abortTransaction();
			session.endSession();
			return response.error(400, err.message, res, err);
		}
	},
	addMultiple: async function (req, res) {
		const current_date = moment().tz('Asia/Jakarta').format();
		const { accesses } = req.body;
		let new_data = [];

		const session = await models.Access.startSession();
		session.startTransaction();

		try {
			const options = { session };

			for (let i = 0; i < accesses.length; i++) {
				const access = accesses[i];
				const check_duplicate = new_data.find(item => item.ip_address.trim().toLowerCase() == access.ip_address.trim().toLowerCase());
				if (check_duplicate) throw `Duplicate ip address ${access.ip_address}`;

				new_data.push({
					created_at: current_date,
					created_by: req.me._id,
					name: access.name,
					ip_address: access.ip_address,
				});
			}

			await models.Access.insertMany(new_data, options)

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
		const { access_id, name, ip_address } = req.body;

		const accesses = await models.Access.find({
			_id: {
				$nin: access_id
			},
			organization_id: req.me.organization_id,
			deleted_time: {
				$exists: false
			}
		}, `ip_address`);

		const existing_data = accesses.filter(item => item.ip_address.toUpperCase() == ip_address.toUpperCase());
		if (existing_data.length > 0) return response.error(400, `Ip address already exists`, res, `Ip address already exists`);

		const filter = {
			_id: access_id,
			deleted_time: {
				$exists: false
			}
		}

		const access = await models.Access.findOne(filter)
		if (!access) {
			return response.error(400, `Access not found`, res, `Access not found`);
		}

		const session = await models.Access.startSession();
		session.startTransaction();

		try {
			const options = { session };

			access.name = name;
			access.ip_address = ip_address;
			access.updated_at = current_date;
			access.updated_by = req.me._id
			await access.save(options);

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
		const { access_id } = req.body;
		const current_date = moment().tz('Asia/Jakarta').format();

		const accesses = await models.Access.find({
			_id: { $in: access_id },
			deleted_time: {
				$exists: false
			}
		})

		for (let i = 0; i < accesses.length; i++) {
			const access = accesses[i];

			const session = await models.Access.startSession();
			session.startTransaction();

			try {
				const options = { session };

				access.deleted_time = current_date;
				access.deleted_by = req.me._id;
				access.updated_at = undefined;
				access.updated_by = undefined;
				await access.save(options);

				await session.commitTransaction();
				session.endSession();
			} catch (err) {
				await session.abortTransaction();
				session.endSession();
				return response.error(400, err.message, res, err);
			}
		}

		return response.ok(true, res, i18n(`Success`, {}, req.headers['accept-language'], 'general'));
	},
	check: async function (req, res) {
		const { ip_address } = req.params;

		let filter = {
			deleted_time: {
				$exists: false
			}
		}
		if (req?.me?.organization_id || req.headers?.organizationid) filter.organization_id = req?.me?.organization_id ?? req.headers?.organizationid
		const exists_access = await models.Access.find(filter, `ip_address`);
		const access = exists_access.findIndex(item => item.ip_address.trim().toLowerCase() == ip_address.trim().toLowerCase());
		const allow_all_accesses = exists_access.findIndex(item => item.ip_address.trim().toLowerCase() == "*");
		const result = access != -1 || allow_all_accesses != -1 ? true : false;
		return response.ok(result, res, i18n(`Success`, {}, req.headers['accept-language'], 'general'));

	}
}

module.exports = Controller;

