const response = require("../helper/response");
const models = require("../models");
const moment = require("moment");
const { i18n } = require("../locales");

const Controller = {
    get: async function (req, res) {
        const { page = 1, limit = 20, sort_by = 1, sort_at = 'created_at', type } = req.query;
        let filter = {
            deleted_time: {
                $exists: false
            }
        }
        if (req?.me?.organization_id || req.headers?.organizationid) filter.organization_id = req?.me?.organization_id ?? req.headers?.organizationid
        if (type) filter.type = models.Form.FORM_TYPE()[type]

        const sort = {
            sort: { [sort_at]: +sort_by },
            skip: (+page - 1) * +limit,
            limit: +limit,
        }
        const datas = await models.Form.find(filter, null, sort);
        const total_data = await models.Form.countDocuments(filter);
        const pages = {
            current_page: +page,
            total_data,
        };
        return response.ok(datas, res, `Success`, pages);
    },

    add: async function (req, res) {
        const current_date = moment().tz('Asia/Jakarta').format();
        const {
            type,
            name,
            brand_name,
            email,
            phone_number,
            business_type,
            locations = [],
            address
        } = req.body;

        if (!type) return response.error(400, i18n(`TypeRequired`, {}, req.headers['accept-language'], 'form'), res, i18n(`TypeRequired`, {}, req.headers['accept-language'], 'form'));
        if (locations.length == 0) return response.error(400, i18n(`LocationRequired`, {}, req.headers['accept-language'], 'form'), res, i18n(`LocationRequired`, {}, req.headers['accept-language'], 'form'));

        //set organization
        const organization_id = req?.me?.organization_id ?? req.headers?.organizationid
        if (!organization_id) return response.error(400, i18n(`NotFound`, { name: 'Organization' }, req.headers['accept-language'], 'general'), res, i18n(`NotFound`, { name: 'Organization' }, req.headers['accept-language'], 'general'));

        const session = await models.Form.startSession();
        session.startTransaction();

        try {
            const options = { session };

            let new_data = {
                created_at: current_date,
                organization_id,
                type,
                name,
                address
            }
            if (brand_name) new_data.brand_name = brand_name;
            if (email) new_data.email = email;
            if (phone_number) new_data.phone_number = phone_number;
            if (business_type) new_data.business_type = business_type;
            if (locations.length > 0) new_data.locations = locations;
            if (address) new_data.address = address;
            await models.Form(new_data).save(options);

            await session.commitTransaction();
            session.endSession();
            return response.ok(true, res, i18n(`Success`, {}, req.headers['accept-language'], 'general'));
        } catch (err) {
            await session.abortTransaction();
            session.endSession();
            return response.error(400, err?.message || i18n(`ErrorAskAdmin`, {}, req.headers['accept-language'], 'error'), res, err);
        }
    },

    delete: async function (req, res) {
        const { ids } = req.body;
        const current_date = moment().tz('Asia/Jakarta').format();

        const datas = await models.Form.find({
            _id: { $in: ids },
            deleted_time: {
                $exists: false
            }
        })

        for (let i = 0; i < datas.length; i++) {
            const data = datas[i];

            const session = await models.Form.startSession();
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