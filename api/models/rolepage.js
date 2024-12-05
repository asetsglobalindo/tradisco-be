const moment = require('moment-timezone');
const mongoose = require('mongoose');
const defaultDate = moment.tz(Date.now(), "Asia/Jakarta");


const rolePageSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true
    },
    order: {
        type: Number,
    },
    group: {
        type: String,
    },
    icon: {
        type: String,
    },
    route: {
        type: String,
    },
    actions: {
        full_access: {
            type: Boolean, 
            default: false
        },
        view: {
            type: Boolean, 
            default: false
        },
        create: {
            type: Boolean, 
            default: false
        },
        update: {
            type: Boolean, 
            default: false
        },
        delete: {
            type: Boolean, 
            default: false
        },
        approval: {
            type: Boolean, 
            default: false
        },
        import: {
            type: Boolean, 
            default: false
        },
        export: {
            type: Boolean, 
            default: false
        },
    },
    sub_page_id: [String],
    organization_id: {
        type: String
    },
    created_at: {
        type: Date,
        default: defaultDate
    },
	created_by: String,
    updated_at: Date,
    updated_by: String,
    deleted_time: Date,
    deleted_by: String
});

const RolePage = mongoose.model('RolePage', rolePageSchema, 'role_page');

module.exports = RolePage;
