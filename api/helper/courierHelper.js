const axios = require('axios');
const { removeSymbol, objectEmpty } = require("./stringmod");
const models = require('../models');

const addressSicepat = async (type) => {
    const config = {
        method: `GET`,
        url: `${process.env.URL_SICEPAT}/customer/${type}`,
        headers: {
            'api-key': process.env.API_KEY_SICEPAT
        }
    }

    try {
        const address = await axios(config);
        return address;
    } catch (error) {
        return error?.response
    }
}

const checkPriceSicepat = async (origin, destination, weight) => {
    const config = {
        method: `GET`,
        url: `${process.env.URL_SICEPAT}/customer/tariff`,
        headers: {
            'api-key': process.env.API_KEY_SICEPAT
        },
        params: { origin, destination, weight }
    }
    try {
        const tariff = await axios(config);
        return tariff;
    } catch (error) {
        return error?.response
    }
}

const checkResiSicepat = async (waybill) => {
    const config = {
        method: `GET`,
        url: `${process.env.URL_SICEPAT}/customer/waybill`,
        headers: {
            'api-key': process.env.API_KEY_SICEPAT
        },
        params: { waybill }
    }
    try {
        const tariff = await axios(config);
        return tariff;
    } catch (error) {
        return error?.response
    }
}

const pickupRequestSicepat = async (data) => {
    let body = JSON.stringify({
        auth_key: process.env.KEY_SICEPAT,
        ...data
    })

    const config = {
        method: `POST`,
        url: `${process.env.PICKUP_SICEPAT}/api/partner/requestpickuppackage`,
        headers: {
            'Content-Type': 'application/json'
        },
        data: body
    }

    try {
        const pickup = await axios(config);
        return pickup;
    } catch (error) {
        return error?.response
    }
}

const responsePR = async (order, courier) => {
    let result = {};
    if (courier == `sicepat`) {
        let new_orders = [];
        for (let i = 0; i < order?.datas.length; i++) {
            const data = order.datas[i];
            new_orders.push({
                message: `Sukses`,
                reason: '',
                order_number: data.receipt_number
            })
        }

        result = {
            request_number: order.request_number,
            receipt_datetime: order.receipt_datetime,
            orders: new_orders
        }
    }

    return result;
}

const responsePrice = async (prices, courier, currency, currency_convert) => {
    let format_price = [];
    let allow_service_types = courier?.allow_service_type || [];
    const courier_name = courier.name.trim().toLowerCase();

    if (prices.length > 0) {
        for (let i = 0; i < prices.length; i++) {
            const price = prices[i];

            let convert_price = parseFloat(parseInt(price.tariff) / parseInt(currency_convert)).toFixed(2);
            let obj = {}
            if (courier_name == `sicepat`) {
                const whitelist = allow_service_types.find(item => item.trim().toLowerCase() == price.service.trim().toLowerCase());
                if (whitelist || allow_service_types.length == 0) {
                    obj = {
                        service: price.service,
                        currency,
                        currency_convert,
                        service_code: price.service,
                        description: price.description,
                        price: convert_price,
                        price_convert: convert_price * currency_convert,
                        shipping_price: price.tariff,
                        etd: price.etd,
                    }
                }
            }

            if (!objectEmpty(obj)) format_price.push(obj)
        }
    }

    return format_price;
}

const removeFormatAddress = async (name, type, courier, namespace = true) => {
    if (!name) return null
    name = name.toLowerCase();
    name = name.replace(/kota/g, '')
    name = name.replace(/administrasi/g, '')
    name = name.replace(/kepulauan/g, '')
    name = name.replace(/daerah/g, '')
    name = name.replace(/khusus/g, '')
    name = name.replace(/capital/g, '')
    name = name.replace(/kabupaten/g, '')
    name = name.replace(/kab./g, '')
    name = name.replace(/adm./g, '')
    name = name.replace(/kep./g, '')
    name = namespace ? name.replace(/ /g, "") : name

    name = await convertWierdAddress(courier, name, type)
    return await removeSymbol(name.trim());
}

const convertWierdAddress = async (courier, text, type) => {
    let name = text;
    if (courier == `sicepat`) {
        if (type == `city`) {
            if (name.includes(`pasangkayu`)) name = name.replace(/pasangkayu/g, 'mamujuutara')
            if (name.includes(`tanimbar`)) name = name.replace(/tanimbar/g, 'malukutenggarabarat')
        }
    }

    //change name province
    if (type == `province`) {
        if (name == `nad`) name = name.replace(/nad/g, 'aceh')
    }

    //change name city
    if (type == `city`) {
        if (name.indexOf(',') > 0) name = name.substring(0, name.indexOf(','))
    }

    //change name province
    if (name.includes(`sumatera`)) name = name.replace(/sumatera/g, 'sumatra')
    if (name.includes(`istimewa`)) name = name.replace(/istimewa/g, 'di')

    return name;

}

const checkAddressCode = async (address, type, courier) => {
    const province = await removeFormatAddress(address?.province) || null;
    const city = await removeFormatAddress(address?.city, `city`);
    const district = await removeFormatAddress(address?.district);
    const urban = await removeFormatAddress(address?.urban) || null;

    let check_address;

    if (courier == `sicepat`) {
        const addresses = await addressSicepat(type);
        for (let i = 0; i < addresses?.data?.sicepat?.results.length; i++) {
            const item = addresses?.data?.sicepat?.results[i];

            let name, courier_province, courier_city, courier_subdistrict;
            if (type == `origin`) {
                name = await removeFormatAddress(item.origin_name);
                const found_district = district.includes(name) || name.includes(district)
                const found_city = city.includes(name) || name.includes(city)
                const found_province = province.includes(name) || name.includes(province)

                if (
                    found_district ||
                    found_city ||
                    found_province
                ) {
                    check_address = item
                }
            }
            else if (type == `destination`) {
                courier_province = await removeFormatAddress(item.province, `province`);
                courier_city = await removeFormatAddress(item.city, `city`, courier);
                courier_subdistrict = await removeFormatAddress(item.subdistrict);

                const found_district = district.includes(courier_subdistrict) || courier_subdistrict.includes(district)
                const found_city = city.includes(courier_city) || courier_city.includes(city)
                const found_province = province?.includes(courier_province) || courier_province.includes(province)

                if (found_district && found_city && found_province) check_address = item
            }
        }
    }

    return check_address
}

const createBodyPickupRequest = async (courier, origin, destination, data, order_id, courier_content) => {
    let body = {};

    const parcel_category = data?.item_category || `Fragile`,
        parcel_uom = `pcs`,
        parcel_content = data?.item_name || `Produk Baru`,
        recipient_title = `Mr./ Mrs.`;


    let service_type = data.service_type;

    if (courier == `sicepat`) {
        let prebook_resi;
        if (courier_content.prebook) {
            const sort = {
                sort: {
                    resi: 1
                }
            }
            let filter_prebook_resi = {
                deleted_time: {
                    $exists: false
                },
                status: 0,
                courier_id: courier_content._id
            }
            if (courier_content?.organization_id) filter_prebook_resi.organization_id = courier_content?.organization_id
            prebook_resi = await models.PrebookResi.findOne(filter_prebook_resi, `resi`, sort);
        }

        let item = {
            origin_code: origin,
            delivery_type: service_type,
            parcel_category,
            parcel_content,
            parcel_qty: data.item_qty,
            parcel_uom,
            parcel_value: data.item_price,
            total_weight: data.item_weight,
            shipper_name: data.shipper_info.shipper_name,
            shipper_address: data.shipper_info.shipper_address,
            shipper_province: data.shipper_info.shipper_province,
            shipper_city: data.shipper_info.shipper_city,
            shipper_district: data.shipper_info.shipper_district,
            shipper_zip: data.shipper_info.shipper_zip,
            shipper_phone: data.shipper_info.shipper_phone,
            recipient_title,
            recipient_name: data.receiver_info.receiver_name,
            recipient_address: data.receiver_info.receiver_address,
            recipient_province: data.receiver_info.receiver_province,
            recipient_city: data.receiver_info.receiver_city,
            recipient_district: data.receiver_info.receiver_district,
            recipient_zip: data.receiver_info.receiver_zip,
            recipient_phone: data.receiver_info.receiver_phone,
            destination_code: destination
        };

        if (prebook_resi?.resi && courier_content.prebook) item.receipt_number = prebook_resi.resi;
        if (data.cod) item.cod_value = data.cod_price;
        if (data.insurance) {
            item.insurance_value = data.insurance_price
            item.parcel_value = data.cod ? data?.cod_price - data?.estimated_price?.shipping_cost : data?.item_price || data?.cod_price
        }

        body = {
            reference_number: order_id,
            pickup_request_date: data.pickup_date,
            pickup_merchant_name: data.shipper_info.shipper_name,
            pickup_address: data.shipper_info.shipper_address,
            pickup_city: data.shipper_info.shipper_city,
            pickup_merchant_phone: data.shipper_info.shipper_phone,
            pickup_merchant_email: data.shipper_info.shipper_email,
            PackageList: [item]
        }
    }

    return body
}

const changeStatusEnum = status => {
    if (status == 1) return `Ready to pick`;
    else if (status == 2) return `Delivery`;
    else if (status == 3) return `Delivered`;
    else if (status == 4) return `Return`;
    else if (status == 5) return `Returned`;
    else if (status == 6) return `Cancelled`;
    else if (status == 7) return `Problem`;
    else return '-'
}

const changeStatusCourier = async (courier_id, status) => {
    let new_status = {};
    const courier_status = await models.Courier.findOne({
        _id: courier_id,
        deleted_time: {
            $exists: false
        }
    }, `status`);
    for (let i = 0; i < courier_status?.status.length; i++) {
        const list = courier_status.status[i];
        if (list.name.find(item => item.trim().toLowerCase().replace(/ /g, "") == status.trim().toLowerCase().replace(/ /g, ""))) {
            new_status = {
                label: changeStatusEnum(list.value),
                value: list.value
            }
            break;
        }
    }
    return new_status;
}

const responseStatusResi = async (histories, courier, courier_id) => {
    let result = {};

    if (courier == `sicepat`) {
        const new_status = await changeStatusCourier(courier_id, histories?.last_status?.status);
        result = {
            status: new_status?.label || histories?.POD_receiver,
            status_courier: histories?.last_status?.status,
            status_value: new_status?.value || null,
            remark: histories?.POD_receiver || null,
            name: histories?.receiver_name || null,
            koli: null,
            note: histories?.last_status?.city || null,
        }
    }

    return result
}

module.exports = {
    addressSicepat,
    checkPriceSicepat,
    checkResiSicepat,
    pickupRequestSicepat,
    responsePR,
    checkAddressCode, responsePrice,
    createBodyPickupRequest,
    responseStatusResi,
    changeStatusCourier
};
