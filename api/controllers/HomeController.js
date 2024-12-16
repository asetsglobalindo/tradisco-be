const { convertData } = require("../helper/convert");
const response = require("../helper/response");
const { default_lang, i18n } = require("../locales");
const models = require("../models");
const moment = require("moment");
const CONTROLLER = {
	id: "Beranda",
	en: "Home"
}
const ATTRIBUTE_IMAGE = `images.url images_mobile.url title description button_name button_route`
const ATTRIBUTE_CONTENT = `meta_title meta_description small_text title description bottom_button_name bottom_button_route order category_id thumbnail_images`
const HOME_POPULATE = (language) => {
	const POPUlATE_CONTENT = [
		{ path: `category_id`, select: "name" },
		{ path: `thumbnail_images.${language}`, select: ATTRIBUTE_IMAGE },
	]
	const POPUlATE = [
		{ path: `banner.${language}`, select: ATTRIBUTE_IMAGE },
		{ path: `section2.tab.content`, select: ATTRIBUTE_CONTENT, populate: POPUlATE_CONTENT },
		{ path: `section4.image`, select: ATTRIBUTE_IMAGE },
		{ path: `section5.content`, select: ATTRIBUTE_CONTENT, populate: POPUlATE_CONTENT },
	]
	return POPUlATE;
}

const Home = {
	health: async function (_, res) {
		res.status(200).json(`Healthy`);
	},
	add: async function (req, res) {
		const { meta_title, meta_description, banner, section2, section3, section4, section5 } = req.body

		const home = await models.Home.findOne({});
		if (home) {
			if (meta_title) home.meta_title = meta_title;
			if (meta_description) home.meta_description = meta_description;
			if (banner) home.banner = banner;
			if (section2) home.section2 = section2;
			if (section3) home.section3 = section3;
			if (section4) home.section4 = section4;
			if (section5) home.section5 = section5;
			home.updated_by = req.me._id;
			home.updated_at = moment().tz('Asia/Jakarta').format()
			await home.save();
		} else {
			const new_data = {
				...req.body,
				organization_id: req.me.organization_id,
				created_by: req.me._id,
				created_at: moment().tz('Asia/Jakarta').format()
			}
			await models.Home(new_data).save();
		}
		return response.ok(true, res, i18n(`Success`, {}, default_lang(req.headers), 'general')); 4
	},

	content: async function (req, res) {
		let home = await models.Home.findOne().populate(HOME_POPULATE(default_lang(req.headers)));
		home = JSON.parse(JSON.stringify(home))
		home = convertData(home, req.headers)
		return response.ok(home, res, i18n(`Success`, {}, default_lang(req.headers), 'general'));
	},
	get: async function (req, res) {
		const home = await models.Home.findOne();
		return response.ok(home, res, i18n(`Success`, {}, default_lang(req.headers), 'general'));
	}

}

module.exports = Home;