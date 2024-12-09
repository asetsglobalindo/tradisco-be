const response = require("../helper/response");
const models = require("../models");
const moment = require("moment");
const { i18n } = require("../locales");

const RolePage = {
	get: async function (req, res) {
		const { page = 1, limit = 20 } = req.query;

		const filter = {
			organization_id: req.me.organization_id,
			deleted_time: {
				$exists: false
			}
		}
		const sort = {
			sort: { created_at: -1 },
			skip: (parseInt(page) - 1) * parseInt(limit),
			limit: parseInt(limit),
		}
		const role_pages = await models.RolePage.find(filter, null, sort);
		const total_data = await models.RolePage.countDocuments(filter);
		const pages = {
			current_page: parseInt(page),
			total_data,
		};
		return response.ok(role_pages, res, `Success`, pages);
	},
	getMenu: async function (req, res) {
		const me = req.me;
		const menu = [];
		const user = await models.User.findOne({
			_id: me._id,
			deleted_time: {
				$exists: false
			}
		}, `role_id`).populate({ path: `role_id`, select: `permissions`, match: { deleted_time: { $exists: false } } });

		if (!user.role_id) {
			return response.error(400, `Failed load menu`, res, `Failed load menu`);
		}
		const permissions = user.role_id?.permissions || [];

		const filter = {
			organization_id: req.me.organization_id,
			deleted_time: {
				$exists: false
			}
		};
		const group = {
			_id: "$group",
			page: {
				$push: {
					_id: "$_id",
					name: "$name",
					order: "$order",
					icon: "$icon",
					route: "$route",
					actions: "$actions",
					sub_page_id: "$sub_page_id"
				}
			}
		}
		const sort = {
			"page.order": 1
		}

		const pages = await models.RolePage.aggregate([
			{ $match: filter },
			{ $group: group },
			{ $sort: sort }
		]);

		for (let i = 0; i < pages.length; i++) {
			const page = pages[i];
			let items = [];
			for (let j = 0; j < page.page.length; j++) {
				const page_detail = page.page[j];
				page_detail.actions = permissions.find(item => item.page_id == page_detail._id)?.actions || page_detail.actions;
				items.push({
					label: page_detail.name,
					to: page_detail.route,
					icon: page_detail.icon,
					order: page_detail.order,
					_id: page_detail._id,
					actions: page_detail.actions,
					sub_page_id: page_detail.sub_page_id
				})
			}
			items = items.sort((a, b) => a.order > b.order ? 1 : -1);
			menu.push({
				label: page._id,
				items
			})
		}

		return response.ok(menu, res, i18n(`Success`, {}, req.headers['accept-language'], 'general'));
	},
	add: async function (req, res) {
		if (req.body.length == 0) {
			return response.error(400, `Please input data`, res, `Please input data`);
		}

		for (let index = 0; index < req.body.length; index++) {
			const body = req.body[index];
			const { name, group, actions, sub_page_id, icon, order, route } = body;
			const current_date = moment().tz('Asia/Jakarta').format();

			const filter_existing_data = {
				organization_id: req.me.organization_id,
				deleted_time: {
					$exists: false
				}
			}
			const pages = await models.RolePage.find(filter_existing_data, `name`);
			const existing_data = pages.filter(item => item.name.toUpperCase() == name.toUpperCase());
			if (existing_data.length > 0) {
				return response.error(400, `Page already exists`, res, `Page already exists`);
			}

			const roles = await models.Role.find({
				organization_id: req.me.organization_id,
				deleted_time: {
					$exists: false
				}
			})
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
					organization_id: req.me.organization_id,
					created_by: req.me._id,
					created_at: current_date
				}).save(options);

				if (roles.length > 0) {
					for (let i = 0; i < roles.length; i++) {
						const role = roles[i];
						role.permissions.push({
							page_id: page._id
						})
						await role.save(options)
					}
				}

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
	addPageGlobal: async function (req, res) {
		const { name, group, actions, sub_page_id, icon, order, route } = req.body;

		const current_date = moment().tz('Asia/Jakarta').format();

		//find duplicate page name
		const default_pages = await models.RolePage.find({
			organization_id: {
				$exists: false
			},
			deleted_time: {
				$exists: false
			}
		}, `name`);
		const existing_default_pages = default_pages.filter(item => item.name.toUpperCase() == name.toUpperCase());
		if (existing_default_pages.length > 0) {
			return response.error(400, `Page already exists`, res, `Page already exists`);
		}

		//create default page with no orgnization and created at
		await models.RolePage.create({
			name, group, actions, sub_page_id, icon, order, route
		})

		const orgnizations = await models.Orgnization.find({
			deleted_time: {
				$exists: false
			}
		}, `_id`);

		if (orgnizations.length > 0) {
			for (let index = 0; index < orgnizations.length; index++) {
				const organization = orgnizations[index];

				const filter_existing_data = {
					organization_id: organization._id,
					deleted_time: {
						$exists: false
					}
				}
				const pages = await models.RolePage.find(filter_existing_data, `name`);
				const existing_data = pages.filter(item => item.name.toUpperCase() == name.toUpperCase());
				if (existing_data.length == 0) {
					const roles = await models.Role.find({
						organization_id: organization._id,
						deleted_time: {
							$exists: false
						}
					})
					const session = await models.RolePage.startSession();
					session.startTransaction();

					try {
						const options = { session };

						const page = await models.RolePage({
							name,
							group,
							actions,
							organization_id: organization._id,
							created_at: current_date
						}).save(options);

						if (roles.length > 0) {
							for (let i = 0; i < roles.length; i++) {
								const role = roles[i];
								role.permissions.push({
									page_id: page._id,
									actions: {
										create: actions.create,
										delete: actions.delete,
										update: actions.update,
										view: actions.view,
										approval: actions.approval,
									}
								})
								await role.save(options)
							}
						}

						await session.commitTransaction();
						session.endSession();
					} catch (error) {
						await session.abortTransaction();
						session.endSession();
						throw error;
					}
				}

			}
		}
		return response.ok(true, res, i18n(`Success`, {}, req.headers['accept-language'], 'general'));
	},
	update: async function (req, res) {
		const current_date = moment().tz('Asia/Jakarta').format();
		const { page_id, name, group, actions, sub_page_id, icon, order, route } = req.body;

		const filter_existing_data = {
			_id: {
				$nin: page_id
			},
			organization_id: req.me.organization_id,
			deleted_time: {
				$exists: false
			}
		}
		const pages = await models.RolePage.find(filter_existing_data, `name`);
		const existing_data = pages.filter(item => item.name.toUpperCase() == name.toUpperCase());
		if (existing_data.length > 0) {
			return response.error(400, `Page already exists`, res, `Page already exists`);
		}

		await models.RolePage.findOneAndUpdate({
			_id: page_id,
			organization_id: req.me.organization_id,
			deleted_time: {
				$exists: false
			}
		}, {
			name,
			group,
			actions,
			sub_page_id,
			icon,
			order,
			route,
			updated_at: current_date,
			updated_by: req.me._id,
		});

		return response.ok(true, res, i18n(`Success`, {}, req.headers['accept-language'], 'general'));
	},
	delete: async function (req, res) {
		const current_date = moment().tz('Asia/Jakarta').format();
		const { page_id } = req.body;

		const pages = await models.RolePage.find({
			_id: { $in: page_id },
			organization_id: req.me.organization_id,
			deleted_time: {
				$exists: false
			}
		})

		for (let i = 0; i < pages.length; i++) {
			const page = pages[i];

			await models.Role.updateMany({
				organization_id: req.me.organization_id,
				deleted_time: {
					$exists: false
				}
			}, {
				$pull: {
					permissions: {
						page_id: page._id
					}
				}
			});

			page.deleted_by = req.me._id;
			page.deleted_time = current_date;
			page.updated_at = undefined;
			page.updated_by = undefined;
			await page.save();

		}
		return response.ok(true, res, i18n(`Success`, {}, req.headers['accept-language'], 'general'));

	},
}

module.exports = RolePage;