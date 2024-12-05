const AWS = require('aws-sdk');
const spacesEndpoint = new AWS.Endpoint(process.env.DO_SPACES_ENDPOINT);
module.exports = {
	s3: {
		endpoint: spacesEndpoint, 
		accessKeyId: process.env.DO_SPACES_KEY, 
		secretAccessKey: process.env.DO_SPACES_SECRET
	},
};