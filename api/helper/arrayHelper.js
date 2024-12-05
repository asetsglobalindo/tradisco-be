function frequentData(array)
{
    if(array.length == 0)
        return null;
    var modeMap = {};
    var maxEl = array[0], maxCount = 1;
    for(var i = 0; i < array.length; i++)
    {
        var el = array[i];
        if(modeMap[el] == null)
            modeMap[el] = 1;
        else
            modeMap[el]++;  
        if(modeMap[el] > maxCount)
        {
            maxEl = el;
            maxCount = modeMap[el];
        }
    }
    return maxEl;
}

function frequentDataObj(array)
{
    if(array.length == 0)
        return null;
    var modeMap = {};
    for(var i = 0; i < array.length; i++)
    {
        var el = array[i];
        if(modeMap[el] == null)
            modeMap[el] = 1;
        else
            modeMap[el]++;  
    }
    return modeMap;
}

function sortArrayOfObjectByAttribute(data, type, attribute) {
    let result = data.sort((a,b) => a[attribute] - b[attribute]);
    if (type == 2) result = data.sort((a,b) => b[attribute] - a[attribute]);
    return result
}

function sortArrayOfObject (data, type) {
	if (type == 'asc') {
		return Object
			.entries(data)
			.sort((a, b) => a[1] - b[1])
			.reduce((_sortedObj, [k,v]) => (
				{ 
					..._sortedObj, [k]: v
				}
			), {})
	}
	else if (type == 'desc') {
		return Object
			.entries(data)
			.sort((a, b) => b[1] - a[1])
			.reduce((_sortedObj, [k,v]) => (
				{ 
					..._sortedObj, [k]: v
				}
			), {})
	}
}

function getKeyByValue(object, value) {
	return Object.keys(object).find(key => object[key] === value);
  }

function hasDuplicate(obj) {
    let keys = Object.keys(obj);
    for (let i = 0; i < keys.length; i++) {
        for (let j = i + 1; j < keys.length; j++) {
            if (obj[keys[i]] === obj[keys[j]]) return true;
        }
    }
    return false;
}

function groupByArrayByAttribute(arr, attr) {
    const result = arr.reduce((accumulator, currentValue) => {
        currentValue[attr] = currentValue[attr] ? currentValue[attr] : "-";
        (accumulator[currentValue[attr]] = accumulator[currentValue[attr]] || []).push(currentValue);
        return accumulator;
    }, {});
    return result
}

module.exports = { frequentData, frequentDataObj, sortArrayOfObject, 
    getKeyByValue, hasDuplicate, 
    sortArrayOfObjectByAttribute, groupByArrayByAttribute};