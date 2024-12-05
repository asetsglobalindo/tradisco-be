const { transporter } = require('../helper/emailhelper');
const models = require("../models");
const moment = require('moment');

const sendPendingMail = async() => {
    if (process.env.CRON_TYPE == `server`) {
        const session = await models.PendingMail.startSession();
		session.startTransaction();

        const pending_mail = await models.PendingMail.find({}).limit(50);
        let id_list = [];
        for(let i=0; i < pending_mail.length; i++){
            const mail = pending_mail[i];
            let mail_options = {
                sender: {
                    email: `${process.env.MAIL_USERNAME}`,
                    name: process.env.MAIL_FROM_NAME
                },
                to: [
                    {
                        email: mail?.to
                    }
                ],
                params: {
                    role: 'Frontend',
                },
                subject: mail?.subject,
                htmlContent: mail?.html,
                textContent: mail?.html,
            }

            if (mail?.path) mail_options.path = mail.path
            if (mail?.attachment) mail_options.attachment = mail.attachment

            try {
                await transporter(mail_options);
            } catch (error) {
                await models.PendingMail.deleteMany({
                    _id: {
                        $in: mail._id
                    }           
                });
                continue;                
            }

            id_list.push(mail._id);
        }
        
        await models.PendingMail.deleteMany({
            _id: {
                $in: id_list
            }           
        });
    
    }
}

const expireForgotPassword = async () => {
    if (process.env.CRON_TYPE == `server`) {
        const session = await models.User.startSession();
        session.startTransaction();
    
        const current_time = moment().tz('Asia/Jakarta');
    
        try{
            const opts = { session };
            await models.User.updateMany({
                forgot_password_expired_time: {
                    $lt: current_time
                }
            }, {
                $unset: {
                    forgot_password_expired_time:1,
                    forgot_password_token:1
                }
            }, opts);
    
            await session.commitTransaction();
            session.endSession();
        }catch(error){
            await session.abortTransaction();
            session.endSession();
        }
    }
}

const resetEmailCount = async () => {
    if (process.env.CRON_TYPE == `server`) {
        await models.Organization.updateMany({
            deleted_time: {
                $exists: false
            },
            email_limit: {
                $gt: 0
            }
        }, {
            $set: {
                email_count: 0
            }
        });
    }
}
module.exports = {sendPendingMail,expireForgotPassword, resetEmailCount};