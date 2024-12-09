const { content } = require('../mail/email');
const response = require("../helper/response");
const models = require("../models");
const moment = require("moment");
const { i18n } = require("../locales");
const Controller = {
	get: async function (req, res) {
		const { page = 1, limit = 20 } = req.query;
		let filter = {
			deleted_time: {
				$exists: false
			}
		}

		if (req?.me?.organization_id || req.headers?.organizationid) filter.organization_id = req?.me?.organization_id ?? req.headers?.organizationid
		const sort = {
			sort: { order: 1 },
			skip: (parseInt(page) - 1) * parseInt(limit),
			limit: parseInt(limit),
		}
		const emails = await models.Email.find(filter, null, sort);
		const total_data = await models.Email.countDocuments(filter);
		const pages = {
			current_page: parseInt(page),
			total_data,
		};
		return response.ok(emails, res, `Success`, pages);
	},
	getDetail: async function (req, res) {
		const { email_id } = req.params;

		let filter = {
			_id: email_id,
			deleted_time: {
				$exists: false
			}
		}

		if (req?.me?.organization_id || req.headers?.organizationid) filter.organization_id = req?.me?.organization_id ?? req.headers?.organizationid

		const email = await models.Email.findOne(filter);
		return response.ok(email, res, i18n(`Success`, {}, req.headers['accept-language'], 'general'));
	},
	add: async function (req, res) {
		const current_date = moment().tz('Asia/Jakarta').format();
		const { cc = [], bcc = [], subject, body, type } = req.body;

		if (!type) return response.error(400, `Type required`, res, `Type required`);
		const exist_data = await models.Email.findOne({
			deleted_time: {
				$exists: false
			},
			organization_id: req.me.organization_id,
			type,
		})
		if (exist_data) return response.error(400, `Email's type already exists`, res, `Email's type already exists`);

		const session = await models.Email.startSession();
		session.startTransaction();

		try {
			const options = { session };

			let new_data = {
				organization_id: req.me.organization_id,
				created_at: current_date,
				created_by: req.me._id,
				subject, body, type,
				cc, bcc
			}
			await models.Email(new_data).save(options);

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
		const { email_id, subject, body, type,
			cc = [], bcc = [] } = req.body;

		const exist_data = await models.Email.findOne({
			deleted_time: {
				$exists: false
			},
			organization_id: req.me.organization_id,
			type,
			_id: {
				$nin: email_id
			}
		})
		if (exist_data) return response.error(400, `Email's type already exists`, res, `Email's type already exists`);

		const filter = {
			_id: email_id,
			organization_id: req.me.organization_id,
			deleted_time: {
				$exists: false
			}
		}

		const email = await models.Email.findOne(filter)
		if (!email) {
			return response.error(400, `Email not found`, res, `Email not found`);
		}

		const session = await models.Email.startSession();
		session.startTransaction();

		try {
			const options = { session };

			email.subject = subject;
			email.body = body;
			email.type = type;
			email.cc = cc;
			email.bcc = bcc;
			email.updated_at = current_date;
			email.updated_by = req.me._id
			await email.save(options);

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
		const { email_id } = req.body;
		const current_date = moment().tz('Asia/Jakarta').format();

		const emails = await models.Email.find({
			_id: { $in: email_id },
			organization_id: req.me.organization_id,
			deleted_time: {
				$exists: false
			}
		})

		for (let i = 0; i < emails.length; i++) {
			const email = emails[i];

			const session = await models.Email.startSession();
			session.startTransaction();

			try {
				const options = { session };

				email.deleted_time = current_date;
				email.deleted_by = req.me._id;
				email.updated_at = undefined;
				email.updated_by = undefined;
				await email.save(options);

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
		const { to, cc = [], bcc = [], subject, body } = req.body;

		if (!req.me.organization_id) return response.error(400, "Please login", res, "Please login");
		const organization = await models.Organization.findOne({
			_id: req.me.organization_id,
			deleted_time: {
				$exists: false
			}
		});
		if (!organization) return response.error(400, "Please login", res, "Please login");
		if (organization.email_limit <= organization.email_count) return response.error(400, "You have reach limit to test sending email, please try again tomorrow", res, "You have reach limit to test sending email, please try again tomorrow");
		await models.PendingMail({
			to,
			cc: cc.join(", ") ?? null,
			bcc: bcc.join(", ") ?? null,
			subject: subject ?? "Send Testing Email",
			html: body ?? "Body Email"
		}).save();
		organization.email_count += 1;
		organization.save();
		return response.ok(true, res, i18n(`Success`, {}, req.headers['accept-language'], 'general'));
	}
}

module.exports = Controller;

