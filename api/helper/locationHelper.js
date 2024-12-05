const models = require("../models");

const populateCity = async (locations) => {
    locations = JSON.parse(JSON.stringify(locations));
    const cities = await models.City.find({});

    if (Array.isArray(locations)) {
        for (let i = 0; i < locations.length; i++) {
            const location = locations[i];
            location.city = cities.find(item => +item.city_id == +location?.city_id)?.name ?? null;
        }
    } else {
        locations.city = cities.find(item => +item.city_id == +locations?.city_id)?.name ?? null;
    }
    return locations;
}

module.exports = { populateCity };