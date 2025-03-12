const { convertData } = require("../helper/convert");
const response = require("../helper/response");
const {
  generateSlugV3,
  generateSlugV4,
  regexWithSymbol,
  filterObjectID,
} = require("../helper/stringmod");
const { i18n, default_lang } = require("../locales");
const models = require("../models");
const moment = require("moment");
const CONTROLLER = {
  id: "Konten",
  en: "Content",
};

const sortByOrder = (items) => {
  if (!items || !Array.isArray(items)) return items;
  return [...items].sort((a, b) => {
    const orderA = a.order !== undefined ? Number(a.order) : 0;
    const orderB = b.order !== undefined ? Number(b.order) : 0;
    return orderA - orderB;
  });
};

const POPUlATE_IMAGES = [
  {
    path: `images.id`,
    select: `images.url title description button_name button_route`,
    match: { deleted_time: { $exists: false } },
  },
  {
    path: `images.en`,
    select: `images.url title description button_name button_route`,
    match: { deleted_time: { $exists: false } },
  },
  {
    path: `thumbnail_images.id`,
    select: `images.url title description button_name button_route`,
    match: { deleted_time: { $exists: false } },
  },
  {
    path: `thumbnail_images.en`,
    select: `images.url title description button_name button_route`,
    match: { deleted_time: { $exists: false } },
  },
];
const POPULATE = [
  {
    path: `category_id`,
    select: `name slug`,
    match: { deleted_time: { $exists: false } },
  },
  {
    path: `banner.id`,
    select: `images.url images_mobile.url title description button_name button_route`,
    match: { deleted_time: { $exists: false } },
  },
  {
    path: `banner.en`,
    select: `images.url images_mobile.url title description button_name button_route`,
    match: { deleted_time: { $exists: false } },
  },
  {
    path: `images.id`,
    select: `images.url title description button_name button_route`,
    match: { deleted_time: { $exists: false } },
  },
  {
    path: `images.en`,
    select: `images.url title description button_name button_route`,
    match: { deleted_time: { $exists: false } },
  },
  {
    path: `images2.id`,
    select: `images.url title description button_name button_route`,
    match: { deleted_time: { $exists: false } },
  },
  {
    path: `images2.en`,
    select: `images.url title description button_name button_route`,
    match: { deleted_time: { $exists: false } },
  },
  {
    path: `thumbnail_images.id`,
    select: `images.url title description button_name button_route`,
    match: { deleted_time: { $exists: false } },
  },
  {
    path: `thumbnail_images.en`,
    select: `images.url title description button_name button_route`,
    match: { deleted_time: { $exists: false } },
  },
  {
    path: `thumbnail_images2.id`,
    select: `images.url title description button_name button_route`,
    match: { deleted_time: { $exists: false } },
  },
  {
    path: `thumbnail_images2.en`,
    select: `images.url title description button_name button_route`,
    match: { deleted_time: { $exists: false } },
  },
  {
    path: `body.images.id`,
    select: `images.url title description button_name button_route`,
    match: { deleted_time: { $exists: false } },
  },
  {
    path: `body.images.en`,
    select: `images.url title description button_name button_route`,
    match: { deleted_time: { $exists: false } },
  },
  {
    path: `related`,
    select: "slug title small_text thumbnail_images images type",
    match: { deleted_time: { $exists: false } },
    populate: POPUlATE_IMAGES,
  },
  {
    path: `related2`,
    select: "slug title small_text thumbnail_images images type",
    match: { deleted_time: { $exists: false } },
    populate: POPUlATE_IMAGES,
  },
];

const Controller = {
  get: async function (req, res) {
    const {
      page = 1,
      limit = 20,
      active_status,
      type,
      query,
      category_id,
      sort_by = 1,
      sort_at = "order",
      publish_only,
      show_single_language,
      category_slug,
    } = req.query;
    let filter = {
      deleted_time: {
        $exists: false,
      },
    };
    if (query) {
      filter.$or = [
        {
          [`title.${default_lang(req.headers)}`]: {
            $regex: new RegExp(regexWithSymbol(query), "i"),
          },
        },
      ];
    }
    if (category_slug) {
      const categories = await models.Category.find(
        { slug: { $in: category_slug.split(",") } },
        `_id`
      );
      if (categories.length > 0) {
        filter.category_id = {
          $in: categories.map((category) => category._id),
        };
      } else {
        filter.category_id = null;
      }
    }
    if (category_id) {
      filter.category_id = [
        ...(filter.category_id.length > 0 ? filter.category_id : []),
        ...category_id.split(","),
      ];
    }
    if (active_status) filter.active_status = active_status;
    if (type) filter.type = models.Content.CONTENT_TYPE()[type];
    if (publish_only == "yes") {
      filter = {
        ...filter,
        $or: [
          ...(filter.$or.length > 0 ? filter.$or : []),
          { publish_date: { $lte: moment().tz("Asia/Jakarta").format() } },
          { publish_date: { $exists: false } },
          { publish_date: null },
        ],
      };
    }

    if (req?.me?.organization_id || req.headers?.organizationid)
      filter.organization_id =
        req?.me?.organization_id ?? req.headers?.organizationid;

    const sort = {
      sort: { [sort_at]: +sort_by },
      skip: (+page - 1) * +limit,
      limit: +limit,
    };

    let contents = await models.Content.find(filter, null, sort).populate(
      POPULATE
    );
    const total_data = await models.Content.countDocuments(filter);
    const pages = {
      current_page: parseInt(page),
      total_data,
    };

    if (show_single_language == "yes") {
      contents = JSON.parse(JSON.stringify(contents));
      for (let i = 0; i < contents.length; i++)
        contents[i] = convertData(contents[i], req.headers);
    }
    return response.ok(contents, res, `Success`, pages);
  },

  getBanner: async function (req, res) {
    const { type } = req.query;

    if (!type) {
      return response.error(
        400,
        i18n(
          `Required Parameter type`,
          {},
          req.headers["accept-language"],
          "general"
        ),
        res
      );
    }

    let filter = {
      deleted_time: {
        $exists: false,
      },
      type: models.Content.CONTENT_TYPE()[type],
      active_status: true,
    };

    if (req?.me?.organization_id || req.headers?.organizationid) {
      filter.organization_id =
        req?.me?.organization_id ?? req.headers?.organizationid;
    }

    const selectFields = "banner page_title";

    const populate = [
      {
        path: `banner.id`,
        select: `images.url images_mobile.url title description button_name button_route`,
        match: { deleted_time: { $exists: false } },
      },
      {
        path: `banner.en`,
        select: `images.url images_mobile.url title description button_name button_route`,
        match: { deleted_time: { $exists: false } },
      },
    ];

    try {
      const content = await models.Content.findOne(
        filter,
        selectFields
      ).populate(populate);

      if (!content) {
        return response.error(
          404,
          i18n(
            `NotFound {{name}}`,
            { name: CONTROLLER[default_lang(req.headers)] },
            default_lang(req.headers),
            "general"
          ),
          res
        );
      }

      const result = {
        id: {
          banner: content.banner || null,
          page_title: content.page_title?.id || null,
        },
        en: {
          banner: content.banner || null,
          page_title: content.page_title?.en || null,
        },
      };

      return response.ok(
        result,
        res,
        i18n(`Success`, {}, req.headers["accept-language"], "general")
      );
    } catch (err) {
      return response.error(400, err.message, res, err);
    }
  },
  getDetail: async function (req, res) {
    const { content_id } = req.params;

    let filter = {
      deleted_time: {
        $exists: false,
      },
    };

    const validID = filterObjectID(content_id);
    if (validID) {
      filter.$or = [{ _id: validID }, { slug: content_id.trim() }];
    } else if (models.Content.CONTENT_TYPE()[content_id]) {
      filter.type = models.Content.CONTENT_TYPE()[content_id];
    } else filter.slug = content_id.trim();
    if (req?.me?.organization_id || req.headers?.organizationid)
      filter.organization_id =
        req?.me?.organization_id ?? req.headers?.organizationid;

    let content = await models.Content.findOne(filter).populate(POPULATE);

    return response.ok(
      content,
      res,
      i18n(`Success`, {}, req.headers["accept-language"], "general")
    );
  },
  add: async function (req, res) {
    const current_date = moment().tz("Asia/Jakarta").format();
    let {
      meta_title,
      meta_description,
      small_text,
      title,
      type,
      description,
      page_title,
      bottom_text,
      bottom_button_name,
      bottom_button_route,
      active_status,
      related = [],
      related2 = [],
      body = [],
      body2 = [],
      images = [],
      thumbnail_images = [],
      banner = [],
      use_list,
      thumbnail_images2 = [],
      order,
      group_by,
      calendar_key,
      small_text2,
      show_on_homepage,
      category,
      publish_date,
      category_id,
      sub_title1,
      sub_title2,
      sub_title3,
      images2 = [],
      bottom_text2,
      bottom_description2,
      jam_kerja,
    } = req.body;

    const slug = await generateSlugV3(title["id"], models.Content, `title`);

    const filter_existing_data = {
      organization_id: req.me.organization_id,
      deleted_time: {
        $exists: false,
      },
    };
    const contents = await models.Content.find(
      filter_existing_data,
      `title slug`
    );
    const existing_data = contents.filter(
      (item) =>
        item.title[default_lang(req.headers)].toUpperCase() ==
          title[default_lang(req.headers)].toUpperCase() ||
        item?.slug?.toUpperCase() == slug.toUpperCase()
    );
    if (existing_data.length > 0)
      return response.error(
        400,
        i18n(
          `Exists {{name}}`,
          { name: CONTROLLER[default_lang(req.headers)] },
          default_lang(req.headers),
          "general"
        ),
        res,
        i18n(
          `Exists {{name}}`,
          { name: CONTROLLER[default_lang(req.headers)] },
          default_lang(req.headers),
          "general"
        )
      );

    const session = await models.Content.startSession();
    session.startTransaction();

    try {
      const options = { session };

      let new_data = {
        organization_id: req.me.organization_id,
        created_at: current_date,
        created_by: req.me._id,
        meta_title,
        meta_description,
        title,
        type: models.Content.CONTENT_TYPE()[type],
        small_text,
        slug,
        description,
        page_title,
        bottom_text,
        bottom_button_name,
        bottom_button_route,
        active_status,
        related,
        related2,
        body,
        body2,
        images,
        thumbnail_images,
        thumbnail_images2,
        banner,
        use_list,
        order,
        group_by,
        calendar_key,
        small_text2,
        show_on_homepage,
        publish_date,
        category_id,
        sub_title1,
        sub_title2,
        sub_title3,
        images2,
        bottom_text2,
        bottom_description2,
        jam_kerja,
      };
      await models.Content(new_data).save(options);

      await session.commitTransaction();
      session.endSession();
      return response.ok(
        true,
        res,
        i18n(`Success`, {}, req.headers["accept-language"], "general")
      );
    } catch (err) {
      await session.abortTransaction();
      session.endSession();
      return response.error(400, err.message, res, err);
    }
  },
  update: async function (req, res) {
    const current_date = moment().tz("Asia/Jakarta").format();
    let {
      content_id,
      meta_title,
      meta_description,
      small_text,
      title,
      type,
      description,
      page_title,
      bottom_text,
      bottom_button_name,
      bottom_button_route,
      active_status,
      related = [],
      related2 = [],
      body = [],
      body2 = [],
      images = [],
      thumbnail_images = [],
      banner = [],
      use_list,
      thumbnail_images2 = [],
      order,
      group_by,
      calendar_key,
      small_text2,
      show_on_homepage,
      category,
      publish_date,
      category_id,
      sub_title1,
      sub_title2,
      sub_title3,
      images2 = [],
      bottom_text2,
      bottom_description2,
      jam_kerja,
    } = req.body;

    let additional_filter = {
      _id: {
        $nin: content_id,
      },
    };
    const slug = await generateSlugV4(
      title["id"],
      models.Content,
      `title`,
      additional_filter
    );

    const contents = await models.Content.find(
      {
        _id: {
          $nin: content_id,
        },
        organization_id: req.me.organization_id,
        deleted_time: {
          $exists: false,
        },
      },
      `title slug`
    );

    const existing_data = contents.filter(
      (item) =>
        item.title[default_lang(req.headers)].toUpperCase() ==
          title[default_lang(req.headers)].toUpperCase() ||
        item?.slug?.toUpperCase() == slug.toUpperCase()
    );
    if (existing_data.length > 0) {
      return response.error(
        400,
        `Content already exists`,
        res,
        `Content already exists`
      );
    }

    const filter = {
      _id: content_id,
      organization_id: req.me.organization_id,
      deleted_time: {
        $exists: false,
      },
    };

    const content = await models.Content.findOne(filter);
    if (!content)
      return response.error(
        400,
        i18n(
          `NotFound {{name}}`,
          { name: CONTROLLER[default_lang(req.headers)] },
          default_lang(req.headers),
          "general"
        ),
        res,
        i18n(
          `NotFound {{name}}`,
          { name: CONTROLLER[default_lang(req.headers)] },
          default_lang(req.headers),
          "general"
        )
      );

    const session = await models.Content.startSession();
    session.startTransaction();

    try {
      const options = { session };

      content.meta_title = meta_title;
      content.meta_description = meta_description;
      content.title = title;
      content.type = models.Content.CONTENT_TYPE()[type];
      content.slug = slug;
      if (description) content.description = description;
      if (page_title) content.page_title = page_title;
      if (bottom_text) content.bottom_text = bottom_text;
      if (bottom_button_name) content.bottom_button_name = bottom_button_name;
      if (show_on_homepage) content.show_on_homepage = show_on_homepage;
      if (bottom_button_route)
        content.bottom_button_route = bottom_button_route;
      if (small_text) content.small_text = small_text;
      if (active_status) content.active_status = active_status;
      if (related) content.related = related;
      if (related2) content.related2 = related2;
      if (category_id) content.category_id = category_id;
      if (body) content.body = body;
      if (body2) content.body2 = body2;
      if (use_list) content.use_list = use_list;
      if (images.length > 0) content.images = images;
      if (thumbnail_images.length > 0)
        content.thumbnail_images = thumbnail_images;
      if (thumbnail_images2.length > 0)
        content.thumbnail_images2 = thumbnail_images2;
      if (banner.length > 0) content.banner = banner;
      if (order) content.order = order;
      if (group_by) content.group_by = group_by;
      if (calendar_key) content.calendar_key = calendar_key;
      if (small_text2) content.small_text2 = small_text2;
      if (sub_title1) content.sub_title1 = sub_title1;
      if (sub_title2) content.sub_title2 = sub_title2;
      if (sub_title3) content.sub_title3 = sub_title3;
      if (images2.length > 0) content.images2 = images2;
      if (publish_date) content.publish_date = publish_date;
      if (bottom_text2) content.bottom_text2 = bottom_text2;
      if (bottom_description2)
        content.bottom_description2 = bottom_description2;
      if (jam_kerja) content.jam_kerja = jam_kerja;
      content.updated_at = current_date;
      content.updated_by = req.me._id;
      await content.save(options);

      await session.commitTransaction();
      session.endSession();
      return response.ok(
        true,
        res,
        i18n(`Success`, {}, req.headers["accept-language"], "general")
      );
    } catch (err) {
      console.log(err);
      await session.abortTransaction();
      session.endSession();
      return response.error(400, err.message, res, err);
    }
  },
  delete: async function (req, res) {
    const { content_id } = req.body;
    const current_date = moment().tz("Asia/Jakarta").format();

    const session = await models.Content.startSession();
    session.startTransaction();

    try {
      const options = { session };

      const filter = {
        _id: { $in: content_id },
        organization_id: req.me.organization_id,
        deleted_time: {
          $exists: false,
        },
      };
      const new_data = {
        $set: {
          deleted_time: current_date,
          deleted_by: req.me._id,
          updated_at: undefined,
          updated_by: undefined,
        },
      };
      await models.Content.updateMany(filter, new_data, options);
      await session.commitTransaction();
      session.endSession();
      return response.ok(
        true,
        res,
        i18n(`Success`, {}, req.headers["accept-language"], "general")
      );
    } catch (err) {
      await session.abortTransaction();
      session.endSession();
      return response.error(400, err.message, res, err);
    }
  },
  content: async function (req, res) {
    const { slug } = req.params;

    let filter = {
      deleted_time: {
        $exists: false,
      },
      slug,
    };
    const language = default_lang(req.headers);
    const populate = [
      { path: `category_id`, select: `name` },
      {
        path: `banner.${language}`,
        select: `images.url images_mobile.url title description button_name button_route`,
      },
      {
        path: `images.${language}`,
        select: `images.url title description button_name button_route`,
      },
      {
        path: `thumbnail_images.${language}`,
        select: `images.url title description button_name button_route`,
      },
      {
        path: `thumbnail_images2.${language}`,
        select: `images.url title description button_name button_route`,
      },
      {
        path: `body.images.${language}`,
        select: `images.url title description button_name button_route`,
      },
    ];

    let content = await models.Content.findOne({
      ...filter,
      active_status: true,
    }).populate(populate);

    if (!content) {
      return response.error(
        404,
        i18n(
          `NotFound {{name}}`,
          { name: CONTROLLER[default_lang(req.headers)] },
          default_lang(req.headers),
          "general"
        ),
        res
      );
    }

    content = JSON.parse(JSON.stringify(content));

    if (content.body && Array.isArray(content.body)) {
      content.body = sortByOrder(content.body);
    }

    if (content.body2 && Array.isArray(content.body2)) {
      content.body2 = sortByOrder(content.body2);
    }

    if (content.related && Array.isArray(content.related)) {
      content.related = sortByOrder(content.related);
    }

    if (content.related2 && Array.isArray(content.related2)) {
      content.related2 = sortByOrder(content.related2);
    }

    if (content.images && Array.isArray(content.images)) {
      content.images = sortByOrder(content.images);
    }

    if (content.images2 && Array.isArray(content.images2)) {
      content.images2 = sortByOrder(content.images2);
    }

    content = convertData(content, req.headers);

    return response.ok(
      content,
      res,
      i18n(`Success`, {}, req.headers["accept-language"], "general")
    );
  },
};

module.exports = Controller;
