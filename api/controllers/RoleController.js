const response = require("../helper/response");
const models = require("../models");
const moment = require("moment");
const { i18n } = require("../locales");

const Role = {
	get: async function (req, res) {
		const { page = 1, limit = 20 } = req.query;
		const filter = {
			organization_id: req.me.organization_id,
			deleted_time: {
				$exists: false
			}
		};
		const sort = {
			sort: { created_at: -1 },
			skip: (parseInt(page) - 1) * parseInt(limit),
			limit: parseInt(limit),
		}
		const role = await models.Role.find(filter, null, sort);
		const total_data = await models.Role.countDocuments(filter);
		const pages = {
			current_page: parseInt(page),
			total_data,
		};
		return response.ok(role, res, `Success`, pages);
	},
	getDetail: async function (req, res) {
		const { role_id } = req.params;

		const populate = [
			{ path: `permissions.page_id`, select: `name group order route`, match: { deleted_time: { $exists: false } } },
		];
		let role = await models.Role.findOne({
			_id: role_id,
			organization_id: req.me.organization_id,
			deleted_time: {
				$exists: false
			}
		}).populate(populate);

		return response.ok(role, res, i18n(`Success`, {}, req.headers['accept-language'], 'general'));
	},
	add: async function (req, res) {
		const current_date = moment().tz('Asia/Jakarta').format();
		const { name, description, permissions, default_role = false } = req.body;

		const filter_existing_data = {
			organization_id: req?.me?.organization_id || req?.headers?.organizationid,
			deleted_time: {
				$exists: false
			}
		}

		const roles = await models.Role.find(filter_existing_data, `name`);
		const existing_data = roles.filter(item => item.name.toUpperCase() == name.toUpperCase());
		if (existing_data.length > 0) {
			return response.error(400, `Role already exists`, res, `Role already exists`);
		}

		const session = await models.Role.startSession();
		session.startTransaction();

		try {
			const options = { session };

			let arr_permissions = [];
			const pages = await models.RolePage.find(filter_existing_data, `name`);
			for (let i = 0; i < permissions.length; i++) {
				let page;
				const item = permissions[i];

				//find page id
				if (item?.name) {
					const existing_data_page = pages.filter(page => page.name.toUpperCase() == item?.name.toUpperCase());
					if (existing_data_page.length == 0) {
						return response.error(400, `Page ${item?.name} not found`, res, `Page ${item?.name} not found`);
					}
					page = existing_data_page[0];
				}

				arr_permissions.push({
					page_id: page._id,
					actions: item.actions
				})

			}

			await models.Role({
				name,
				default_name: name.toLowerCase(),
				organization_id: req?.me?.organization_id || req?.headers?.organizationid,
				description,
				default_role,
				permissions: arr_permissions,
				created_by: req.me._id,
				created_at: current_date
			}).save(options);

			await session.commitTransaction();
			session.endSession();
			return response.ok(true, res, i18n(`Success`, {}, req.headers['accept-language'], 'general'));
		} catch (err) {
			await session.abortTransaction();
			session.endSession();
			return response.error(400, err.message, res, err);
		}
	},
	buildRole: async function (req, res) {
		const { pages, role } = req.body;
		const current_date = moment().tz('Asia/Jakarta').format();

		if (pages.length == 0) {
			return response.error(400, `Please input data`, res, `Please input data`);
		}

		//create role
		const new_role = await models.Role({
			name: role.name,
			organization_id: req?.me?.organization_id || req?.headers?.organizationid,
			description: role.description,
			default_role: role.default_role,
			created_at: current_date
		}).save()
		let arr_permissions = [];


		for (let index = 0; index < pages.length; index++) {
			const body = pages[index];
			const { name, group, actions, sub_page_id, icon, order, route } = body;

			const filter_existing_data = {
				organization_id: req?.me?.organization_id || req?.headers?.organizationid,
				deleted_time: {
					$exists: false
				}
			}
			const exists_pages = await models.RolePage.find(filter_existing_data, `name`);
			const existing_data = exists_pages.filter(item => item.name.toUpperCase() == name.toUpperCase());
			if (existing_data.length > 0) {
				return response.error(400, `Page already exists`, res, `Page already exists`);
			}

			const session = await models.RolePage.startSession();
			session.startTransaction();

			try {
				const options = { session };

				const page = await models.RolePage({
					name,
					group,
					actions,
					sub_page_id,
					icon, order, route,
					organization_id: req?.me?.organization_id || req?.headers?.organizationid,
					created_at: current_date
				}).save(options);

				arr_permissions.push({
					page_id: page._id,
					actions
				})

				await session.commitTransaction();
				session.endSession();
			} catch (err) {
				await session.abortTransaction();
				session.endSession();
				return response.error(400, err.message, res, err);
			}
		}

		new_role.permissions = arr_permissions;
		await new_role.save();

		return response.ok(true, res, i18n(`Success`, {}, req.headers['accept-language'], 'general'));
	},
	update: async function (req, res) {
		const { role_id, name, description, permissions, default_role = false } = req.body;
		const roles = await models.Role.find({
			_id: {
				$nin: role_id
			},
			organization_id: req.me.organization_id,
			deleted_time: {
				$exists: false
			}
		}, `name`);
		const existing_data = roles.filter(item => item.name.toUpperCase() == name.toUpperCase());
		if (existing_data.length > 0) {
			return response.error(400, `Role already exists`, res, `Role already exists`);
		}

		const filter = {
			_id: role_id,
			organization_id: req.me.organization_id,
			deleted_time: {
				$exists: false
			}
		}

		const role = await models.Role.findOne(filter)
		if (!role) {
			return response.error(400, `Role not found`, res, `Role not found`);
		}

		if (role.default_role) {
			return response.error(400, `This role cannot be updated`, res, `This role cannot be updated`);
		}

		let new_permissions = [];
		const pages = await models.RolePage.find({
			organization_id: req.me.organization_id,
			deleted_time: {
				$exists: false
			}
		}, `name`);

		for (let i = 0; i < permissions.length; i++) {
			let page;
			const permission = permissions[i];

			//find page id
			if (permission?.name) {
				const existing_data_page = pages.filter(item => item.name.toUpperCase() == permission?.name.toUpperCase());
				if (existing_data_page.length == 0) {
					return response.error(400, `Page ${permission?.name} not found`, res, `Page ${permission?.name} not found`);
				}
				page = existing_data_page[0];
			}

			new_permissions.push({
				page_id: page._id,
				actions: permission.actions
			})

		}
		role.name = name;
		role.description = description;
		role.default_role = default_role;
		role.permissions = new_permissions;
		await role.save();
		return response.ok(role, res, i18n(`Success`, {}, req.headers['accept-language'], 'general'));
	},
	delete: async function (req, res) {
		const { role_id } = req.body;
		const current_date = moment().tz('Asia/Jakarta').format();

		const roles = await models.Role.find({
			_id: { $in: role_id },
			organization_id: req.me.organization_id,
			deleted_time: {
				$exists: false
			}
		})

		for (let i = 0; i < roles.length; i++) {
			const role = roles[i];

			const total_admin = await models.User.countDocuments({
				deleted_time: {
					$exists: false
				},
				"organizations.organization_id": req.me.organization_id,
				role_id: role._id
			})

			if (total_admin > 0) {
				return response.error(400, `You could not delete this role as it is assigned to user.`, res, `You could not delete this role as it is assigned to user.`);
			}

			role.deleted_time = current_date;
			role.deleted_by = req.me._id
			role.updated_at = undefined;
			role.updated_by = undefined;
			await role.save();
		}
		return response.ok(true, res, i18n(`Success`, {}, req.headers['accept-language'], 'general'));
	},
}

module.exports = Role;

