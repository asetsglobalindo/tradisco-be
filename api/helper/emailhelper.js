const Sib = require('sib-api-v3-sdk')

// mailgun 
// const auth = {
//   auth: {
//     api_key: process.env.MAIL_KEY,
//     domain: process.env.MAIL_DOMAIN
//   },
//   host: process.env.MAIL_HOST 
// }
// const transporterV2 = nodemailer.createTransport(mailgun(auth));

// sendinblue
const transporter = async (body_email) => {
	const client = Sib.ApiClient.instance
	const apiKey = client.authentications['api-key']
	apiKey.apiKey = process.env.API_KEY_SENDINBLUE
	const tranEmailApi = new Sib.TransactionalEmailsApi()
	await tranEmailApi.sendTransacEmail(body_email);
}

module.exports = { 
  transporter, 
  // transporterV2
}