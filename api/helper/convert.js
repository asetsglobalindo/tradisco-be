const { default_lang, ALL_LANGUAGE } = require("../locales");
const { is_object } = require("./stringmod");

const chooseValue = (value, headers) => {
    return value && value[default_lang(headers)] ? value[default_lang(headers)] : value
}
const isMultiLanguage = (value) => {
    let flag = 0
    for (let i = 0; i < ALL_LANGUAGE.length; i++) {
        const languages = ALL_LANGUAGE[i];
        if (languages in value) flag++;

    }
    return flag > 0 ? true : false
}

const arrayMultiLanguage = (data, headers) => {
    for (let i = 0; i < data.length; i++) {
        data[i] = choosenBaseData(data[i], headers)
    }
}

const objectMultiLanguage = (data, headers) => {
    for (let property in data) {
        if (Array.isArray(data[property]) && data[property].length > 0) arrayMultiLanguage(data[property], headers)
        else data[property] = choosenBaseData(data[property], headers)
    }
    return data
}

const choosenBaseData = (data, headers) => {
    //not multi language object
    if (!is_object(data) && !Array.isArray(data)) return data

    //multi language object
    if (isMultiLanguage(data)) {
        data = chooseValue(data, headers);
    }
    //object
    else if (is_object(data) && !isMultiLanguage(data)) {
        data = objectMultiLanguage(data, headers)
    }
    return data
}

const convertData = (data, headers) => {
    for (let property in data) {
        //base
        data[property] = choosenBaseData(data[property], headers)

        //array
        if (Array.isArray(data[property]) && data[property].length > 0) arrayMultiLanguage(data[property], headers)
    }
    return data
}
module.exports = { convertData };