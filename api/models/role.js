const moment = require('moment-timezone');
const mongoose = require('mongoose');
const defaultDate = moment.tz(Date.now(), "Asia/Jakarta");


const roleSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true
    },
    description: {
        type: String
    },
    default_name: {
        type: String
    },
    default_role: {
        type: Boolean,
        default: false
    },
    permissions: [
        {
            page_id: {
                type: String,
                ref: "RolePage"
            },
            actions: {
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
                view: {
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
                }
            }
        }
    ],
    organization_id: {
        type: String
    },
    created_at: {
        type: Date,
        default: defaultDate
    },
    updated_at: Date,
    deleted_time: Date,
    deleted_by: String
});

const Role = mongoose.model('Role', roleSchema, 'role');

module.exports = Role;