const moment = require('moment')

const newUserMailContent = (name, original_password) => {
    return `
        <p>Halo, ${name},</p>
        <p>Silahkan gunakan password ini untuk masuk menggunakan sistem Tulus:</p>
        <p style="font-size:24px;weight:bold;">
            ${original_password}
        </p>
        <p>Terima kasih</p>
    `;
}

const newUserMailContentV2 = (name, link) => {
    return `
        <p>Dear ${name},</p>&nbsp;

        <p>Welcome to Tulus! Soooo thrilled to see you here!</p>
        <p>to activate your account please click link below&nbsp;</p>
        <a href="${link}" target="_blank" style="font-weight: bold;">Activate</a>
        <p>We’d love to hear about what you think and if there is anything we can improve just let us know!</p>
        &nbsp;
        <p><i>To infinity and beyond,</i></p>
        &nbsp;
        <p>
            <i>Tulus Team</i>
        </p>
        &nbsp;
        &nbsp;
        <p>***This is an automatically generated email please do not reply***</p>
        <p><strong>Copyright&nbsp;© ${moment().tz('Asia/Jakarta').format('YYYY')}&nbsp;Tulus</strong></p>
    `;
}

const newUserMailContentV3 = (name) => {
    return `
        <p>Dear ${name},</p>&nbsp;

        <p>Welcome to Tulus! Soooo thrilled to see you here!</p>
        <p>We’d love to hear about what you think and if there is anything we can improve just let us know!</p>
        &nbsp;
        <p><i>To infinity and beyond,</i></p>
        &nbsp;
        <p>
            <i>Tulus Team</i>
        </p>
        &nbsp;
        &nbsp;
        <p>***This is an automatically generated email please do not reply***</p>
        <p><strong>Copyright&nbsp;© ${moment().tz('Asia/Jakarta').format('YYYY')}&nbsp;Tulus</strong></p>
    `;
}

const feedbackContent = (name, email, message) => {
    return `
        <p>Hi,</p>&nbsp;

        <p>Feedback from ${name} - ${email}</p>
        <p>This is the message: </p>
        &nbsp;
        <p>
            <i>${message}</i>
        </p>
        &nbsp;
        <p>***This is an automatically generated email please do not reply***</p>
        <p><strong>Copyright&nbsp;© ${moment().tz('Asia/Jakarta').format('YYYY')}&nbsp;Tulus</strong></p>
    `;
}

const feedbackContentUser = (name) => {
    return `
        <p>Hi ${name},</p>&nbsp;

        <p>Thank you for your feedback</p>
        &nbsp;
        &nbsp;
        <p>***This is an automatically generated email please do not reply***</p>
        <p><strong>Copyright&nbsp;© ${moment().tz('Asia/Jakarta').format('YYYY')}&nbsp;Tulus</strong></p>
    `;
}

const forgotPasswordContent = (name, token) => {
    return `
        <p>Dear ${name},</p>&nbsp;

        <p>Use this token to verify your new password</p>
        &nbsp;
        <p style="font-size:24px;weight:bold;">
            ${token}
        </p>
        &nbsp;
        <p>
            <i>Tulus Team</i>
        </p>
        &nbsp;
        &nbsp;
        <p>***This is an automatically generated email please do not reply***</p>
        <p><strong>Copyright&nbsp;© ${moment().tz('Asia/Jakarta').format('YYYY')}&nbsp;Tulus</strong></p>
    `;
}

const newUserMailSubject = () => {
    return `Welcome to Tulus`
}

const feedbackMailSubject = () => {
    return `Feedback from user`
}

const forgotPasswordSubject = () => {
    return `Tulus Request Forgot Password`
}

const newUserSMS = (name) => {
    return `Halo, ${name}, silahkan gunakan password ini untuk masuk menggunakan sistem Tulus: $OTP`;
}

module.exports = {newUserMailContent, newUserMailContentV2, 
    newUserMailContentV3, newUserSMS, newUserMailSubject, 
    forgotPasswordSubject, forgotPasswordContent, feedbackMailSubject,
    feedbackContent, feedbackMailSubject, feedbackContentUser
};