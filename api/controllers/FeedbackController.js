const response = require("../helper/response");
const { content } = require("../mail/email");
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
			sort: { created_at: -1 },
			skip: (parseInt(page) - 1) * parseInt(limit),
			limit: parseInt(limit),
		}
		const datas = await models.Feedback.find(filter, null, sort);
		const total_data = await models.Feedback.countDocuments(filter);
		const pages = {
			current_page: parseInt(page),
			total_data,
		};
		return response.ok(datas, res, `Success`, pages);
	},
	getDetail: async function (req, res) {
		const { id } = req.params;

		let filter = {
			_id: id,
			deleted_time: {
				$exists: false
			}
		}
		if (req?.me?.organization_id || req.headers?.organizationid) filter.organization_id = req?.me?.organization_id ?? req.headers?.organizationid

		const access = await models.Feedback.findOne(filter);
		return response.ok(access, res, i18n(`Success`, {}, req.headers['accept-language'], 'general'));
	},
	add: async function (req, res) {
		const current_date = moment().tz('Asia/Jakarta').format();
		const { name, subject, email, phone_number, information, message, agree_stored, captcha } = req.body;

		if (!email) return response.error(400, 'Please input email address', res, 'Please input email address');
		if (!name) return response.error(400, 'Please input first and last name', res, 'Please input first and last name');

		//set organization
		const organization_id = req?.me?.organization_id ?? req.headers?.organizationid
		if (!organization_id) return response.error(400, 'Organization not found', res, 'Organization not found');

		const session = await models.Feedback.startSession();
		session.startTransaction();

		try {
			const options = { session };

			let new_data = {
				created_at: current_date,
				created_by: req?.me?._id,
				organization_id,
				name, subject, email,
				information, message, agree_stored
			}
			if (phone_number) new_data.phone_number = phone_number;
			await models.Feedback(new_data).save(options);

			//send email
			const data_email = {
				name,
				email,
				message,
			}
			const email_body = await content(process.env.EMAIL_INFO, null, 4, data_email);
			if (email_body) await models.PendingMail(email_body).save(options);

			await session.commitTransaction();
			session.endSession();
			return response.ok(true, res, i18n(`Success`, {}, req.headers['accept-language'], 'general'));
		} catch (err) {
			await session.abortTransaction();
			session.endSession();
			return response.error(400, err?.message || "Something went wrong, please contact our admin", res, err);
		}
	},
	delete: async function (req, res) {
		const { ids } = req.body;
		const current_date = moment().tz('Asia/Jakarta').format();

		const datas = await models.Feedback.find({
			_id: { $in: ids },
			deleted_time: {
				$exists: false
			}
		})

		for (let i = 0; i < datas.length; i++) {
			const data = datas[i];

			const session = await models.Feedback.startSession();
			session.startTransaction();

			try {
				const options = { session };

				data.deleted_time = current_date;
				data.deleted_by = req.me._id;
				data.updated_at = undefined;
				data.updated_by = undefined;
				await data.save(options);

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
}

module.exports = Controller;

