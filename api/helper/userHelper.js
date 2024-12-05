const jwt = require('jsonwebtoken');
const models = require("../models");
const axios = require('axios');
const createToken = async (user, organization_id, secret, expiresIn) => {
    const { _id } = user;
    return await jwt.sign({ _id, organization_id }, secret, {
        expiresIn,
    });
};

const createTokenVerify = async (user, secret, expiresIn) => {
    const { _id } = user;
    return await jwt.sign({ _id }, secret, {
        expiresIn,
    });
};

const userFirstLastName = (user) => {
    const user_name = user.name.split(' ');
    const first_name = user_name[0];
    const last_name = user.name.substring(user_name[0].length+1, user.name.length);
    return {first_name, last_name};
}

const userLevel = async (organization_id, user_id) => {
    let role = `employee`;
    const existing_admin = await models.Organization.findOne({
        _id: organization_id,
        admins: {
            $in: user_id
        }
    }, `_id`);
    if (existing_admin) role = `admin`;
    
    const populate = [
        { path: `role_id`, select: `default_role`, match: { deleted_time: {$exists: false}}},
    ];
    const user = await models.User.findOne({
        _id: user_id,
        deleted_time: {
            $exists: false
        },
        active_status: true
    }, `role_id`).populate(populate);
    if (user?.role_id?.default_role) role = `super_admin`;

    return role
}

module.exports = { createToken, createTokenVerify, userFirstLastName, userLevel };