const { default_lang } = require("../locales");

const convertData = (data, headers) => {
    for (let property in data) {
        let value = data[property][default_lang(headers)] ?? data[property]
        data[property] = value
    }
    return data
}
module.exports = { convertData };