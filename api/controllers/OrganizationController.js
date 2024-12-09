const { createTokenVerify } = require('../helper/userHelper');
const { generateRandomString } = require('../helper/stringmod');
const { newUserMailContent, newUserMailSubject, newUserMailContentV2 } = require('../mail/newuser');
const { content } = require('../mail/email');
const { checkAddressCode } = require('../helper/courierHelper');
const response = require("../helper/response");
const models = require("../models");
const moment = require("moment");
const bcrypt = require('bcrypt');
const { i18n } = require("../locales");

const Org = {
	get: async function (req, res) {
		const { page, limit = 20 } = req.body;

		const attributes = `name email phone_number created_at updated_at cart_removal cart_minute_removal cart_guest_minute_removal`;
		const sort = {
			sort: {
				updated_at: -1
			},
			limit: (page - 1) * limit,
			page
		};
		const filter = {
			deleted_time: {
				$exists: false
			}
		};

		const organizations = await models.Organization.find(filter, attributes, sort)
		return response.ok(organizations, res, i18n(`Success`, {}, req.headers['accept-language'], 'general'));
	},
	getDetail: async function (req, res) {
		const { organization_id } = req.params;

		const organization = await models.Organization.findOne({
			_id: organization_id,
			deleted_time: {
				$exists: false
			}
		})
		return response.ok(organization, res, i18n(`Success`, {}, req.headers['accept-language'], 'general'));
	},
	add: async function (req, res) {
		const { name, phone_number, email, location, cart_removal, cart_minute_removal, cart_guest_minute_removal, email_limit } = req.body;
		const organization = await models.Organization.create({
			name,
			phone_number,
			email,
			location,
			cart_removal,
			cart_minute_removal,
			cart_guest_minute_removal,
			email_limit
		})
		return response.ok(organization, res, i18n(`Success`, {}, req.headers['accept-language'], 'general'));
	},
	update: async function (req, res) {
		const current_date = moment().tz('Asia/Jakarta').format();
		const { organization_id, name, email, phone_number, cart_removal, cart_minute_removal, cart_guest_minute_removal, email_limit } = req.body;

		if (!organization_id) {
			return response.error(400, `Organization not found`, res, `Organization not found`);
		}

		//check another email or phone number
		if (email) {
			const existing_email = await models.User.find({
				email,
				deleted_time: {
					$exists: false
				},
				// _id: {
				// 	$nin: user_id
				// }
			});
			if (existing_email) {
				return response.error(400, `Email already used by another user`, res, `Email already used by another user`);
			}
		}

		if (phone_number) {
			const existing_email = await models.User.find({
				phone_number,
				deleted_time: {
					$exists: false
				},
				// _id: {
				// 	$nin: user_id
				// }
			});
			if (existing_email) {
				return response.error(400, `Phone number already used by another user`, res, `Phone number already used by another user`);
			}
		}

		const organization = await models.Organization.findOne({
			_id: organization_id,
			deleted_time: {
				$exists: false
			}
		});

		if (!organization) {
			return response.error(400, `Organization not found`, res, `Organization not found`);
		}

		organization.name = name;
		organization.email = email;
		organization.cart_removal = cart_removal;
		organization.cart_minute_removal = cart_minute_removal;
		organization.cart_guest_minute_removal = cart_guest_minute_removal;
		organization.phone_number = phone_number;
		organization.email_limit = email_limit;
		organization.updated_at = current_date;
		organization.updated_by = req.me._id;
		await organization.save();

		//send email

		return response.ok(organization, res, i18n(`Success`, {}, req.headers['accept-language'], 'general'));

	},
	delete: async function (req, res) {
		const { organization_ids } = req.body;
		const current_date = moment().tz('Asia/Jakarta').format();
		const session = await models.Organization.startSession();
		session.startTransaction();

		try {
			const options = { session };

			for (let i = 0; i < organization_ids.length; i++) {
				const organization_id = organization_ids[i];
				const organization = await models.Organization.findOne({ _id: organization_id, deleted_time: { $exists: false } });
				organization.deleted_time = current_date;
				organization.deleted_by = req.me._id;

				if (organization.admins.length > 0) {
					await models.User.updateMany({
						_id: {
							$in: organization.admins
						},
						deleted_time: {
							$exists: false
						}
					}, {
						$set: {
							deleted_time: current_date,
							deleted_by: req.me._id,
							updated_at: null,
							updated_by: null
						}
					}, options)
				}
				await organization.save(options);
			}

			await session.commitTransaction();
			session.endSession();

			return response.ok(true, res, i18n(`Success`, {}, req.headers['accept-language'], 'general'));
		} catch (err) {
			await session.abortTransaction();
			session.endSession();
			return response.error(400, err.message, res, err);
		}
	},
	buildOrganization: async function (req, res) {
		const current_date = moment().tz('Asia/Jakarta').format();
		const { organization, user, pages, role } = req.body;
		const { name, password, email, dob, phone_number, role_id, addresses = [] } = user;

		if (pages.length == 0) {
			return response.error(400, `Please input data`, res, `Please input data`);
		}

		//create new organization
		const new_organization = await models.Organization.create({
			name: organization.name,
			phone_number: organization.phone_number,
			email: organization.email,
			location: organization.location,
			cart_removal: organization.cart_removal,
			cart_minute_removal: organization.cart_minute_removal,
			cart_guest_minute_removal: organization.cart_guest_minute_removal
		});

		const organization_id = new_organization.organization_id;

		//create new user
		const host = req.headers?.host || null;
		const user_level = host.includes('backoffice') ? `admin` : `user`;

		const original_password = password ? password : generateRandomString(8);
		const hashed_password = await bcrypt.hash(original_password, 10);

		//check another email or phone number
		if (!email) return response.error(400, `Please input email`, res, `Please input email`);
		if (!phone_number) return response.error(400, `Please input phone number`, res, `Please input phone number`);

		const session = await models.User.startSession();
		session.startTransaction();

		try {
			const options = { session }

			let new_data = {
				name,
				email,
				role_id,
				addresses,
				phone_number,
				password: hashed_password
			}

			if (dob) new_data.dob = moment(dob).tz('Asia/Jakarta').startOf('day').format();

			if (organization_id) {
				let organizations = [];
				organizations.push({
					organization_id
				})
				new_data.organizations = organizations;
			}

			const user = await models.User(new_data).save(options);

			//create token for activation
			const token = await createTokenVerify({ _id: user._id }, process.env.SECRET, 1800)
			const link = `${process.env.API_URL}/user/activate/${token}`
			let data_email = {
				name: user.name,
				original_password,
				link
			}
			let type_email = 13;

			//create admin in organization
			if (user_level == `admin`) {
				const organization = await models.Organization.findOne({
					_id: organization_id,
					deleted_time: {
						$exists: false
					}
				}, `admins`);

				const exists_admin = organization.admins.find(item => item == user._id);
				if (!exists_admin) {
					let new_admin = organization.admins;
					new_admin.push(user._id);
					organization.admins = new_admin;
					await organization.save(options);
				}

				delete data_email.link;
				type_email = 14
			}

			//send email
			let body = await content(user.email, organization_id, type_email, data_email);
			if (body) await models.PendingMail(body).save(options);

			//create role
			const new_role = await models.Role({
				name: role.name,
				organization_id: req?.me?.organization_id || req?.headers?.organizationid,
				description: role.description,
				default_role: role.default_role,
				created_at: current_date
			}).save(options)
			let arr_permissions = [];

			for (let index = 0; index < pages.length; index++) {
				const body = pages[index];
				const { name, group, actions, sub_page_id, icon, order, route } = body;

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
			}

			new_role.permissions = arr_permissions;
			await new_role.save();

			//update user role id
			user.role_id = new_role._id;
			await user.save(options);

			await session.commitTransaction();
			session.endSession();

			return response.ok(user, res, i18n(`Success`, {}, req.headers['accept-language'], 'general'));
		} catch (err) {
			await session.abortTransaction();
			session.endSession();
			return response.error(400, err.message, res, err);
		}
	},
	updateCurrencyNominal: async function (req, res) {
		const { nominal } = req.body;
		const org = await models.Organization.findOne({
			_id: req.me.organization_id,
			deleted_time: {
				$exists: false
			},
			currency: {
				$ne: "IDR"
			}
		});
		if (!org) return response.error(400, `Organization with IDR currency cannot update currency nominal convert`, res, `Organization with IDR currency cannot update currency nominal convert`);
		org.currency_convert = nominal;
		await org.save();

		return response.ok(true, res, i18n(`Success`, {}, req.headers['accept-language'], 'general'));
	},
	updateEmailCountTest: async function (req, res) {
		const { count } = req.body;
		const org = await models.Organization.findOne({
			_id: req.me.organization_id,
			deleted_time: {
				$exists: false
			}
		});
		if (!org) return response.error(400, `Organization not found`, res, `Organization not found`);
		org.email_limit = count;
		await org.save();

		return response.ok(true, res, i18n(`Success`, {}, req.headers['accept-language'], 'general'));
	},
	updateCheckoutSetting: async function (req, res) {
		const { minutes } = req.body;
		const org = await models.Organization.findOne({
			_id: req.me.organization_id,
			deleted_time: {
				$exists: false
			}
		});
		if (!org) return response.error(400, `Organization not found`, res, `Organization not found`);
		org.checkout_minute_removal = minutes;
		await org.save();

		return response.ok(true, res, i18n(`Success`, {}, req.headers['accept-language'], 'general'));
	},
	updateCurrency: async function (req, res) {
		const { currency } = req.body;
		const org = await models.Organization.findOne({
			_id: req.me.organization_id,
			deleted_time: {
				$exists: false
			},
		});
		if (!org) return response.error(400, `Organization not found`, res, `Organization not found`);
		if (currency.trim().toLowerCase() == org.currency.trim().toLowerCase()) return response.ok(true, res, i18n(`Success`, {}, req.headers['accept-language'], 'general'));

		org.currency = currency.trim();
		if (currency == "IDR") org.currency_convert = 0;
		await org.save();

		return response.ok(true, res, i18n(`Success`, {}, req.headers['accept-language'], 'general'));
	},
	updateOrganizationAddress: async function (req, res) {
		const { name, phone_number,
			email, address, address2, province, district, urban, city, postal_code, active_status = true,
			type
		} = req.body;

		if (!type) return response.error(400, `Type address not found, should be origin or destination`, res, `Type address not found, should be origin or destination`);

		if (!name || !address || !province || !district || !urban || !city || !postal_code || !phone_number || !email) {
			return response.error(400, `Please complete address data`, res, `Please complete address data`);
		}

		const address_country = await models.Address.findOne({
			province, district, urban, city, postal_code
		}, `country`)

		//organization
		const organization = await models.Organization.findOne({
			_id: req.me.organization_id,
			deleted_time: {
				$exists: false
			}
		});

		//add codes in user addresses
		let codes = [];
		const couriers = await models.Courier.find({
			deleted_time: {
				$exists: false
			}
		})

		for (let i = 0; i < couriers.length; i++) {
			const courier = couriers[i];
			const courier_name = courier.name.trim().toLowerCase();
			let obj = {
				province, district, urban, city, postal_code,
			}
			const address_obj = await checkAddressCode(obj, type, courier_name);
			if (!address_obj) return response.error(400, `Area not coverage not found`, res, `Area not coverage not found`);

			let code;
			if (courier_name == "sicepat") {
				if (type == `origin`) code = address_obj?.origin_code
				else if (type == `destination`) code = address_obj?.destination_code
			}

			codes.push({
				courier_id: courier._id,
				code,
			})
		}

		const new_address = {
			name, address, address2, province, district, urban, city, postal_code,
			codes, active_status, phone_number, email,
			country: address_country?.country || process.env.DEFAULT_COUNTRY
		}
		organization.location = new_address
		await organization.save();
		return response.ok(true, res, i18n(`Success`, {}, req.headers['accept-language'], 'general'));
	},
	updateRevertProductSetting: async function (req, res) {
		const { revert_product_in = 1, cart_minute_removal = 120, cart_guest_minute_removal = 120 } = req.body;
		const org = await models.Organization.findOne({
			_id: req.me.organization_id,
			deleted_time: {
				$exists: false
			}
		});
		if (!org) return response.error(400, `Organization not found`, res, `Organization not found`);

		if (revert_product_in == 2) {
			org.cart_removal = true;
			org.cart_minute_removal = cart_minute_removal;
			org.cart_guest_minute_removal = cart_guest_minute_removal;
		}
		else {
			org.cart_removal = false;
			org.cart_minute_removal = 0;
			org.cart_guest_minute_removal = cart_guest_minute_removal;
		}
		org.revert_product_in = revert_product_in;
		await org.save();

		return response.ok(true, res, i18n(`Success`, {}, req.headers['accept-language'], 'general'));
	},
	requirementVIP: async function (req, res) {
		const { member_point_currency, activate_member_point = false } = req.body;

		if (activate_member_point && member_point_currency <= 0) return response.error(400, `When activate member point system, point currency should more than 0`, res, `When activate member point system, point currency should more than 0`);

		const org = await models.Organization.findOne({
			_id: req.me.organization_id,
			deleted_time: {
				$exists: false
			}
		});
		if (!org) return response.error(400, `Organization not found`, res, `Organization not found`);

		org.activate_member_point = activate_member_point;
		org.member_point_currency = member_point_currency;
		await org.save();

		return response.ok(true, res, i18n(`Success`, {}, req.headers['accept-language'], 'general'));
	}
}

module.exports = Org;

