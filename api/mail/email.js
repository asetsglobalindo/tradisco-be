const models = require("../models");
const moment = require("moment");

const content = async (to, organization_id, type, data) => {
    const { name, token, email, message, link, qty, va_message,
        transaction_id, original_password, transaction_date,
        orders = [], total_amount, shipping_address, voucher_code,
        boat, start_date, end_date, information, phone_number
    } = data;
    let filter = {
        deleted_time: {
            $exists: false
        },
        type,
    }
    if (organization_id) filter.organization_id = organization_id
    const email_content = await models.Email.findOne(filter, `subject body cc bcc`);
    const year = moment().tz('Asia/Jakarta').format('YYYY');
    let body = email_content?.body.replace("$year", year) ?? null;
    let subject_email = email_content?.subject ?? null;
    if (subject_email && name) subject_email = subject_email.replace(/\$name/g, name);
    if (subject_email && boat) subject_email = subject_email.replace(/\$boat/g, boat);
    if (body && name) body = body.replace(/\$name/g, name);
    if (body && information) body = body.replace("$information", information);
    if (body && token) body = body.replace("$token", token);
    if (body && email) body = body.replace("$email", email);
    if (body && phone_number) body = body.replace("$phone_number", phone_number);
    if (body && message) body = body.replace("$message", message);
    if (body && link) body = body.replace("$link", link);
    if (body && qty) body = body.replace("$qty", qty);
    if (body && va_message) body = body.replace("$va_message", va_message);
    if (body && transaction_id) body = body.replace("$transaction_id", transaction_id);
    if (body && original_password) body = body.replace("$original_password", original_password);
    if (body && transaction_date) body = body.replace("$transaction_date", transaction_date);
    if (body && total_amount) body = body.replace("$total_amount", total_amount);
    if (body && voucher_code) body = body.replace("$voucher_code", voucher_code);
    if (body && shipping_address) body = body.replace("$shipping_address", shipping_address);
    if (body && boat) body = body.replace(/\$boat/g, boat);
    if (body && start_date) body = body.replace("$start_date", start_date);
    if (body && end_date) body = body.replace("$end_date", end_date);
    if (body && orders.length > 0) {
        let order_detail = ``;
        for (let i = 0; i < orders.length; i++) {
            const order = orders[i];
            order_detail += `<span>Item ${i + 1}: ${order.product_name}, Quantity: ${order.qty}</span><br>`
        }
        body = body.replace("$order_detail", order_detail);
    }

    return {
        to,
        cc: email_content?.cc.join(", ") ?? null,
        bcc: email_content?.bcc.join(", ") ?? null,
        subject: subject_email ?? null,
        html: body ?? null
    }
}


module.exports = { content };
