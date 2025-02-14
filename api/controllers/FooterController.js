const response = require("../helper/response");
const { convertData } = require("../helper/convert");
const { i18n, default_lang } = require("../locales");
const models = require("../models");
const moment = require("moment");
const CONTROLLER = "Footer"

const Controller = {
    get: async function (req, res) {
        const footer = await models.Footer.findOne({});
        return response.ok(footer, res, i18n(`Success`, {}, default_lang(req.headers), 'general'));
    },

    upsert: async function (req, res) {
        const current_date = moment().tz('Asia/Jakarta').format();
        const {
            tagline,
            url_instagram,
            url_facebook,
            url_linkedin,
            url_mail,
            address,
            mail,
            tel,
            copyright_text,
            copyright_link,
            other_routes
        } = req.body;

        const footer = await models.Footer.findOne({});

        const session = await models.Footer.startSession();
        session.startTransaction();

        try {
            const options = { session };
            if (footer) {
                footer.tagline = tagline;
                footer.url_instagram = url_instagram;
                footer.url_facebook = url_facebook;
                footer.url_linkedin = url_linkedin;
                footer.url_mail = url_mail;
                footer.address = address;
                footer.mail = mail;
                footer.tel = tel;
                footer.copyright_text = copyright_text;
                footer.copyright_link = copyright_link;
                footer.other_routes = other_routes;
                footer.updated_by = req.me._id;
                footer.updated_at = moment().tz('Asia/Jakarta').format()
                await footer.save(options);
            } else {
                let new_data = {
                    created_at: current_date,
                    created_by: req.me._id,
                    tagline,
                    url_instagram,
                    url_facebook,
                    url_linkedin,
                    url_mail,
                    address,
                    mail,
                    tel,
                    copyright_text,
                    copyright_link,
                    other_routes
                }
                await models.Footer(new_data).save(options);
            }

            await session.commitTransaction();
            session.endSession();
            return response.ok(true, res, i18n(`Success`, {}, default_lang(req.headers), 'general'));
        } catch (err) {
            await session.abortTransaction();
            session.endSession();
            return response.error(400, err.message, res, err);
        }
    },
}

module.exports = Controller; 