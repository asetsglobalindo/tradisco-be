const moment = require('moment-timezone');
const mongoose = require('mongoose');
const defaultDate = moment.tz(Date.now(), "Asia/Jakarta");


const organizationSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true,
    },
    currency: {
        type: String,
        ref: "Country"
    },
    folder_size: {
        type: Number,
        default: 0,
    },
    phone_number: String,
    email: String,
    location: {
        name: {
            type: String
        },
        address: {
            type: String
        },
        address2: {
            type: String
        },
        country: {
            type: String
        },
        province: {
            type: String
        },
        district: {
            type: String
        },
        urban: {
            type: String
        },
        city: {
            type: String
        },
        postal_code: {
            type: String,
        },
        codes: [
            {
                courier_id: {
                    type: String,
                    ref: "Courier"
                },
                code: {
                    type: String,
                },
            }
        ],
        email: {
            type: String,
        },
        phone_number: {
            type: String,
        }
    },
    admins: [String],

    cart_removal: {
        type: Boolean,
        default: false
    },
    cart_minute_removal: {
        type: Number
    },
    cart_guest_minute_removal: {
        type: Number
    },
    checkout_minute_removal: {
        type: Number
    },
    currency_convert: {
        type: String
    },
    revert_product_in: {
        // 1 -> transaction when checkout
        // 2 -> cart -> if using cart, automatically cart_removal true
        type: Number,
        default: 1
    },
    email_limit: {
        type: Number,
        default: 0
    },
    email_count: {
        type: Number,
        default: 0
    },
    activate_member_point: {
        type: Boolean,
        default: false
    },
    member_point_currency: {
        type: Number,
        default: 1
    },

    deleted_time: Date,
    created_at: {
        type: Date,
        default: defaultDate
    },
    updated_at: Date
});

organizationSchema.statics.findByLogin = async function (name) {
    const filter = {
        name: { $regex: `${name}`, $options: "i" },
        deleted_time: {
            $exists: false
        }
    };

    const organization = await this.find(filter);
    const existing_data = organization.find(item => item.name.toLowerCase() == name.toLowerCase());
    if (!existing_data?.name) {
        return null;
    }

    return existing_data;
};

const Organization = mongoose.model('Organization', organizationSchema, 'organization');
module.exports = Organization;
