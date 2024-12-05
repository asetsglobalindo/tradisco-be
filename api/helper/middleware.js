const models = require('../models');
const jwt = require('jsonwebtoken');
const response = require('./response');

const checkOrganization = async(organization_id) => {
	const organization = await models.Organization.findOne({
	  _id: organization_id,
	  deleted_time: {
		$exists: false
	  }
	})
	if(!organization){
	  return false;
	}
	return true;
}

const getMe = async req => {
	const token = req.headers['authorization'];
	if (token) {
		try {
			return await jwt.verify(token, process.env.SECRET);
		} catch (e) {
			return false
		}
	}
};

const middleware = {
	auth: (req, res, next) => {
		const secret = req.headers['secret'];
		if (secret == process.env.SECRET) {
			next()
		}
		else {
			return response.error(400, `Authentication not match`, res, `Authentication not match`)
		}
	},
	authAdmin: async (req, res, next) => {
		const me = await getMe(req)

		if(!me){
			return response.error(403, `Not authenticated as user`, res, `Not authenticated as user`)
		}
		
		const user = await models.User.findOne({
			_id: me._id,
			$or: [{change_password_reminder: false}, {change_password_reminder: {$exists: false}}]
		});
		if (!user) {
			return response.error(400, `Please re-login`, res, `Please re-login`)
		}
		
		  //check deleted or inactive
		if (user.deleted_time || !user.active_status) {
			return response.error(400, `User not found.`, res, `User not found.`)
		}
		
		if(!await checkOrganization(me.organization_id)){
			return response.error(400, `Organization already terminated`, res, `Organization already terminated`)
		}
		
		const admin = await models.Organization.findOne({ 
			_id: me.organization_id, 
			deleted_time: {
			  $exists: false
			},
			admins: {
			  $in: [me._id]
			}
		});

		if(!admin){
			return response.error(400, `Admin not found`, res, `Admin not found`)
		}

		req.me = me;
		next();
	},
	authUser: async (req, res, next) => {
		const me = await getMe(req)

		if(!me){
			return response.error(403, `Not authenticated as user`, res, `Not authenticated as user`)
		}
		const user = await models.User.findOne({
			_id: me._id,
			$or: [{change_password_reminder: false}, {change_password_reminder: {$exists: false}}]
		});
		if (!user) {
			return response.error(400, `Please re-login`, res, `Please re-login`)
		}
		
		  //check deleted or inactive
		if (user.deleted_time || !user.active_status) {
			return response.error(400, `User not found.`, res, `User not found.`)
		}
		
		if(!await checkOrganization(me.organization_id)){
			return response.error(400, `Organization already terminated`, res, `Organization already terminated`)
		}

		req.me = me;
		next();
	},
	authGuest: async (req, res, next) => {
		const me = await getMe(req)

		if (me) {
			const user = await models.User.findOne({
				_id: me._id,
				$or: [{change_password_reminder: false}, {change_password_reminder: {$exists: false}}]
			});
			if (!user) {
				return response.error(400, `Please re-login`, res, `Please re-login`)
			}
			
			  //check deleted or inactive
			if (user.deleted_time || !user.active_status) {
				return response.error(400, `User not found.`, res, `User not found.`)
			}
			
			if(!await checkOrganization(me.organization_id)){
				return response.error(400, `Organization already terminated`, res, `Organization already terminated`)
			}
		}

		req.me = me ?? null;
		next();
	},
	authWebhook: async (req, res, next) => {
		if (req.headers['x-token'] != process.env.SECRET_WEBHOOK) return response.error(400, `Secret key invalid`, res, `Secret key webhook invalid`)
		next();
	}
}
module.exports = middleware;
