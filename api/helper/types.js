const CONTENT_TYPE = {
    "news": 1,
    "project": 2,
    "career": 3,
    "commercial": 4,
    "residential": 5,
    "about": 6,
    "home": 7,
    "news_detail": 8,
    "career_detail": 9,
    "footer": 10,
    "contact_us": 11,
}

const CONTENT_DETAIL_TYPE = {
    "news": [CONTENT_TYPE.news_detail],
    "career": [CONTENT_TYPE.career_detail],
    "project": [CONTENT_TYPE.commercial],

}

const CONTENT_BODY_TYPE = {
    "image_right": 1,
    "image_left": 2,
    "image_bottom": 3,
    "image_up": 4,
    "full_image": 5,
    "full_text_center": 6,
    "multiple_image": 7,
}

const NEWS_CATEGORY = {
    "news": 1,
    "press_release": 2,
}

const LanguageListType = (type) => {
    const data_type = {
        string: {
            id: {
                type: String
            },
            en: {
                type: String
            }
        },
        image: {
            id: {
                type: String,
                ref: "Image"
            },
            en: {
                type: String,
                ref: "Image"
            }
        }
    }
    return data_type[type]
}

module.exports = { CONTENT_TYPE, NEWS_CATEGORY, CONTENT_BODY_TYPE, CONTENT_DETAIL_TYPE, LanguageListType };