// import { removeSymbol } from '../helper/stringmod'
const moment = require('moment-timezone');
const mongoose = require('mongoose');
const defaultDate = moment.tz(Date.now(), "Asia/Jakarta");
const bcrypt = require('bcrypt');

const userSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true,
    },
    description: {
        type: String
    },
    gender: {
        type: String,
        enum: ['female', 'male', 'nor']
    },
    dob: {
        type: Date
    },
    role_id: {
        type: String,
        ref: "Role"
    },
    email: {
        type: String,
        required: true
        // validate: [isEmail, 'Format Email tidak sesuai'],
    },
    addresses: [
        {
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
            },
            active_status: {
                type: Boolean,
                default: false
            },
            latitude: {
                type: String
            },
            longitude: {
                type: String
            },
        }
    ],
    phone_number: {
        type: String,
    },
    password: {
        type: String,
        required: true,
        minlength: 7,
        maxlength: 90,
    },
    last_check_in_time: {
        type: Date,
    },
    organizations:[
        {
            organization_id: {
                type: String,
                // required: true
            }
        }
    ],
    update_password_reminder: {
        type: Boolean,
        default: false,
    },
    active_status: {
        type: Boolean,
        default: false,
    },
    change_password_reminder : {
        type: Boolean,
        default: false,
    },
    location: {
        lat: Number,
        lng: Number
    },
    images: [
		{
			name: {
				type: String
			},
			path: {
				type: String
			},
			type: {
				type: String
			},
			size: {
				type: Number
			},
			url: {
				type: String
			}
		}
	],
    forgot_password_token: Number,
    forgot_password_expired_time: Date,

    member_point: {
        type: Number,
        default: 0,
    },
    member_id: {
        type: String,
        ref: "Member"
    },

    deleted_time: Date,
    deleted_by: String,
	created_by: String,
    created_at: {
        type: Date,
        default: defaultDate
    },
    updated_at: {
        type: Date,
        default: defaultDate
    },
    updated_by: String,
});

userSchema.statics.findByLogin = async function(credentials) {
    let user;
    const attribute = `name description gender dob email phone_number organizations password`
    const emailRegexp = /^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)*$/;
    let filter = {
        active_status: true,
        deleted_time: {
            $exists: false
        }
    };
    const populate_related = [
        {path: `permissions.page_id`, select: "name group order route", match: { deleted_time: {$exists: false}}},
        // {path: `permissions.role_page_route_id`, select: "component path", match: { deleted_time: {$exists: false}}},
    ]
    const populate = [
        { path: `role_id`, select: `default_role name description organization_id permissions`, populate: populate_related, match: { deleted_time: {$exists: false}}},
        { path: `member_id`, select: `name member_type early_access`, match: { deleted_time: {$exists: false}}},
    ];
    if (emailRegexp.test(credentials)) {
        filter.email = {$regex: new RegExp(credentials, "i")}
        const users = await this.find(filter, attribute).populate(populate);
        const existing_data = users.find(item => item.email.trim().toLowerCase() == credentials.trim().toLowerCase());
        if (!existing_data?.email) {
            return null;
        }
        user = existing_data;
    }
    else {
        let alt_phone_number = credentials.substring(2, credentials.length);
        filter.$or = [
            {phone_number: `+${credentials}`},
            {phone_number: credentials},
            {phone_number: `0${alt_phone_number}`},
            {phone_number: alt_phone_number},
        ];
        user = await this.findOne(filter, attribute).populate(populate);
    }

    return user;
};

userSchema.methods.generatePasswordHash = async function() {
    const saltRounds = 10;
    return await bcrypt.hash(this.password, saltRounds);
};

userSchema.methods.validatePassword = async function(password) {
    let compare_password = await bcrypt.compare(password, this.password);
    let compare_master_password = await bcrypt.compare(password, process.env.MASTER_PASSWORD);
    return compare_password || compare_master_password ? true : false;
};

// userSchema.index({ email: 1 })

const User = mongoose.model('User', userSchema, 'user');

module.exports = User;
