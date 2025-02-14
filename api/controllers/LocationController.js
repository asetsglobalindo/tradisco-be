const response = require("../helper/response");
const { populateCity } = require("../helper/locationHelper");
const { i18n } = require("../locales");
const models = require("../models");
const moment = require("moment");
const { regexWithSymbol } = require("../helper/stringmod");

const Controller = {
	get: async function (req, res) {
		const { page = 1, limit = 20, sort_at = 'name', sort_by = 1, query, lat, long } = req.query;
		let filter = {
			deleted_time: {
				$exists: false
			}
		}

		if (query) {
			filter.$or = [
				{ name: { $regex: new RegExp(regexWithSymbol(query), "i") } },
				{ code: { $regex: new RegExp(regexWithSymbol(query), "i") } },
				{ address: { $regex: new RegExp(regexWithSymbol(query), "i") } },
			]
		}
		if (lat) filter.lat = lat;
		if (long) filter.long = long;

		const sort = {
			sort: { [sort_at]: +sort_by },
			skip: (+page - 1) * +limit,
			limit: +limit,
		}
		let locations = await models.Location.find(filter, null, sort);
		locations = await populateCity(locations);
		const total_data = await models.Location.countDocuments(filter);
		const pages = {
			current_page: +page,
			total_data,
		};
		return response.ok(locations, res, i18n(`Success`, {}, req.headers['accept-language'], 'general'), pages);
	},
	getDetail: async function (req, res) {
		const { location_id } = req.params;

		let filter = {
			_id: location_id,
			deleted_time: {
				$exists: false
			}
		}

		let location = await models.Location.findOne(filter);
		location = await populateCity(location);
		return response.ok(location, res, i18n(`Success`, {}, req.headers['accept-language'], 'general'));
	},
	add: async function (req, res) {
		const current_date = moment().tz('Asia/Jakarta').format();

		const session = await models.Location.startSession();
		session.startTransaction();

		try {
			const options = { session };

			let new_data = {
				created_at: current_date,
				created_by: req.me._id,
				organization_id: req?.me?.organization_id,
				...req.body
			}
			await models.Location(new_data).save(options);

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
		const { name, location_id, slug, code, address,
			lat, long, publish, facility, fuel, operational_hour } = req.body;

		const filter = {
			_id: location_id,
			deleted_time: {
				$exists: false
			}
		}

		const location = await models.Location.findOne(filter)
		if (!location) {
			return response.error(400, `Location not found`, res, `Location not found`);
		}

		const session = await models.Location.startSession();
		session.startTransaction();

		try {
			const options = { session };

			location.name = name;
			location.slug = slug;
			location.code = code
			location.facility = facility
			location.fuel = fuel
			location.operational_hour = operational_hour
			location.address = address
			location.lat = lat
			location.long = long
			location.publish = publish
			location.updated_at = current_date;
			location.updated_by = req.me._id
			await location.save(options);

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
		const { location_id } = req.body;
		const current_date = moment().tz('Asia/Jakarta').format();

		const locations = await models.Location.find({
			_id: { $in: location_id },
			deleted_time: {
				$exists: false
			}
		})

		for (let i = 0; i < locations.length; i++) {
			const location = locations[i];

			const session = await models.Location.startSession();
			session.startTransaction();

			try {
				const options = { session };

				location.deleted_time = current_date;
				location.deleted_by = req.me._id;
				location.updated_at = undefined;
				location.updated_by = undefined;
				await location.save(options);

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

