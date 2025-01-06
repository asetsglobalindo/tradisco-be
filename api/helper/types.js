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

module.exports = { LanguageListType };