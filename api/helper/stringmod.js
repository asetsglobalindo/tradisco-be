const moment = require("moment");
const { default: mongoose } = require("mongoose");
const generateRandomString = (length) => {
	var result = '';
	var characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
	var charactersLength = characters.length;
	for (var i = 0; i < length; i++) {
		result += characters.charAt(Math.floor(Math.random() *
			charactersLength));
	}
	return result;
}

const generateRandomNumber = (length) => {
	var result = '';
	var characters = '0123456789';
	var charactersLength = characters.length;
	for (var i = 0; i < length; i++) {
		result += characters.charAt(Math.floor(Math.random() * charactersLength));
	}
	return result;
}

const denormalizeString = (string) => {
	let str = string && typeof string == `string` ? string.split('_').join(' ') : string;
	return str
}

const capitalizeFirstLetter = (string) => {
	let str = string && typeof string == `string` ? string.charAt(0).toUpperCase() + string.slice(1) : string;
	return str
}

// format: DD/MM/YYYY
const dateTimeFormatter = (date) => {
	return moment(date).format('DD/MM/YYYY')
}

const denormalizeComaString = string => {
	let str = string;
	if (string && typeof string == `string`) {
		str = str.indexOf('\'') >= 0 || str.indexOf('"') >= 0 ? str.replace(/\"/g, '""') : str;
		str = str.indexOf(',') >= 0 ? `"${str}"` : str;
		str = str.indexOf("#") >= 0 ? str.replace(/\#/g, 'No.') : str;
	}
	return str;
}

const removeDoubleQuote = string => {
	let str = string && typeof string == `string` && string.indexOf('"') >= 0 ? string.replace('"', "") : string;
	return str;
}

const removeEnter = string => {
	let str = string && typeof string == `string` && (string.indexOf(`\n`) >= 0 || string.indexOf(`\r`) >= 0) ? string.trim().replace(/(\r\n|\n|\r)/gm, "") : string;
	return str;
}

const removeSymbol = string => {
	let str = string && typeof string == `string` ? string.replace(/[&\/\\#,+()$~%.'":*?<>{}]/g, '') : string;
	str = string && typeof string == `string` ? string.replace(/-/g, '') : string;
	return str.trim();
}

const generateSlug = (string, string2) => {
	let str1 = string && typeof string == `string` ? string.trim().toLowerCase().replace(/ /g, "-") : string?.trim().toLowerCase();
	let str2 = string2 && typeof string2 == `string` ? string2.trim().toLowerCase().replace(/ /g, "-") : string2?.trim().toLowerCase();
	let slug1 = str1 && typeof str1 == `string` ? str1.replace(/[&\/\\#,+()$~%.'":*?<>{}]/g, '') : str1;
	let slug2 = str2 && typeof str2 == `string` ? str2.replace(/[&\/\\#,+()$~%.'":*?<>{}]/g, '') : str2;

	return slug2 ? `${slug1}+${slug2}` : slug1;
}
const generateSlugV2 = async (string, Models, attribute, attr) => {
	let str = string && typeof string == `string` ? string.trim().toLowerCase().replace(/ /g, "-") : string?.trim().toLowerCase();
	let slug = str && typeof str == `string` ? str.replace(/[&\/\\#,+()`’$~%.'":*?<>{}]/g, '') : str;

	const filter = {
		deleted_time: {
			$exists: false
		}
	}
	const datas = await Models.find(filter);
	const existing_data = datas.filter(item => item[attr].toUpperCase() == attribute.toUpperCase());
	if (existing_data.length > 0) slug = `${slug}-${existing_data.length}`

	return slug;
}
//cannot same name
const generateSlugV3 = async (string, Models, attr) => {
	let str = string && typeof string == `string` ? string.trim().toLowerCase().replace(/ /g, "-") : string?.trim().toLowerCase();
	let slug = str && typeof str == `string` ? str.replace(/[&\/\\#,+()$~%.'":*?<>{}]/g, '') : str;
	let attribute = [slug];
	let flag = 0, index = 0;
	const filter = {
		deleted_time: {
			$exists: false
		}
	}
	do {
		flag = 1;
		const datas = await Models.find(filter);
		const existing_data = datas.find(item => item[attr]["id"]?.trim()?.toUpperCase() == attribute[index]?.trim()?.toUpperCase());
		if (!existing_data) flag = 0;
		attribute.push(`${slug}-${index}`);
		index++;
	} while (flag == 1)

	return attribute[index - 1];
}

//with filter for update
const generateSlugV4 = async (string, Models, attr, additional_filter) => {
	let str = string && typeof string == `string` ? string.trim().toLowerCase().replace(/ /g, "-") : string?.trim().toLowerCase();
	let slug = str && typeof str == `string` ? str.replace(/[&\/\\#,+()$~%.'":*?<>{}]/g, '') : str;
	let filter = {
		deleted_time: {
			$exists: false
		}
	}
	if (additional_filter) filter = { ...filter, ...additional_filter };
	const datas = await Models.find(filter, attr);
	const existing_data = datas.filter(item => item[attr]['id'].toUpperCase() == slug.toUpperCase());
	if (existing_data.length > 0) slug = `${slug}-${existing_data.length}`

	return slug;
}
const decodeSlug = (string) => {
	let temp_string = string.trim().toLowerCase().split('+');

	let str = temp_string[0] && typeof temp_string[0] == `string` ? temp_string[0]?.trim().toLowerCase().replace(/[-]/g, ' ') : temp_string[0]?.trim().toLowerCase()
	let str2 = temp_string[1] && typeof temp_string[1] == `string` ? temp_string[1]?.trim().toLowerCase().replace(/[-]/g, ' ') : temp_string[1]?.trim().toLowerCase()
	return [str, str2]
}

const removeWordBreak = string => {
	let str = string && typeof string == `string` ? string.replace(/ /g, "_") : string;
	return str
}

const revertWordBreak = string => {
	let str = string && typeof string == `string` ? string.replace(/[0-9]/g, "").replace(/[-]/g, " ") : string;
	return str.trim().toLowerCase()
}

const emptyString = string => {
	let str = string && typeof string == `string` ? string.trim().replace(/ /g, "") : string ? string : '';
	return str.length == 0 || !string ? true : false
}

const regexWithSymbol = string => {
	let str = string && typeof string == `string` ? string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&') : string;
	return str
}

const renameKeys = (obj, newKeys) => {
	const keyValues = Object.keys(obj).map(key => {
		const newKey = newKeys[key] || key;
		return { [newKey]: obj[key] };
	});
	return Object.assign({}, ...keyValues);
}

const compareOperation = (value1, operation, value2) => {
	if (operation == `less`) return value1 < value2
	if (operation == `equal_less`) return value1 <= value2
	if (operation == `greater`) return value1 > value2
	if (operation == `equal_greater`) return value1 >= value2
}

const group_by = function (array, key) {
	return array.reduce(function (rv, x) {
		(rv[x[key]] = rv[x[key]] || []).push(x);
		return rv;
	}, {});
};

const arrayEquals = (a, b) => {
	return Array.isArray(a) &&
		Array.isArray(b) &&
		a.length === b.length &&
		a.every((val, index) => val === b[index]);
}

const is_object = (data) => {
	return typeof data === 'object' && !Array.isArray(data) && data !== null ? true : false
}

const objectEmpty = (obj) => {
	return obj && Object.keys(obj).length === 0 && Object.getPrototypeOf(obj) === Object.prototype
}

const objContainNull = async (object, takeout = []) => {
	for (const key in object) {
		if (Object.hasOwnProperty.call(object, key)) {
			const item = object[key];
			if (takeout.length > 0 && takeout.indexOf(key)) continue;
			if (item === null || item === undefined || item === '') return true
		}
	}
	return false
}

const removeDuplicateArrayOfObject = async (arr, attributes) => {
	return arr.filter((item, index, array) => array.findIndex(item_index => attributes.every(index_attr => item_index[index_attr] === item[index_attr])) === index)
}

function numberWithCommas(x) {
	return x.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",");
}

const arrayUniqueByKey = (arr, keyProps) => {
	const kvArray = arr.map(entry => {
		const key = keyProps.map(k => entry[k]).join('|');
		return [key, entry];
	});
	const map = new Map(kvArray);
	return Array.from(map.values());
	// return [...new Map(array.map(item =>[item[key], item])).values()];
}

const longString = (text, count, insertDots) => {
	return text.slice(0, count) + (((text.length > count) && insertDots) ? "..." : "");
}

const monthOrder = {
	January: 1,
	February: 2,
	March: 3,
	April: 4,
	May: 5,
	June: 6,
	July: 7,
	August: 8,
	September: 9,
	October: 10,
	November: 11,
	December: 12
};

const filterObjectID = (value) => {
	const id = value.trim()
	try {
		const validID = new mongoose.Types.ObjectId(id)
		if (validID) return validID
	} catch (error) {
		return null
	}
}
module.exports = {
	objContainNull, generateRandomString, generateRandomNumber, denormalizeString,
	capitalizeFirstLetter, dateTimeFormatter, objectEmpty,
	removeEnter, denormalizeComaString, removeSymbol, removeWordBreak, regexWithSymbol, removeDoubleQuote, renameKeys,
	compareOperation, group_by, arrayEquals, is_object, generateSlug, decodeSlug,
	removeDuplicateArrayOfObject, numberWithCommas, arrayUniqueByKey, emptyString,
	generateSlugV2, generateSlugV3, generateSlugV4, longString, revertWordBreak, monthOrder, filterObjectID
};
