const {
  upload_image,
  remove_all_image,
  create_image,
} = require("../helper/fileHelper");
const response = require("../helper/response");
const { i18n } = require("../locales");
const models = require("../models");
const moment = require("moment");

const Controller = {
  get: async function (req, res) {
    const {
      page = 1,
      limit = 20,
      type,
      active_status,
      image_ids,
      sort_by = "created_at",
      sort_at = -1,
    } = req.query;
    let filter = {
      deleted_time: {
        $exists: false,
      },
    };
    if (image_ids) {
      filter._id = {
        $in: image_ids.split(","),
      };
    }
    if (type) filter.type = models.Image.IMAGE_TYPE()[type];
    if (active_status) filter.active_status = active_status;
    if (req?.me?.organization_id || req.headers?.organizationid)
      filter.organization_id =
        req?.me?.organization_id ?? req.headers?.organizationid;
    const sort = {
      sort: { [sort_by]: sort_at },
      skip: (+page - 1) * +limit,
      limit: +limit,
    };
    let images = await models.Image.find(filter, null, sort);
    images = JSON.parse(JSON.stringify(images));

    const total_data = await models.Image.countDocuments(filter);
    const pages = {
      current_page: +page,
      total_data,
    };

    //sort by image ids that fe sent
    if (image_ids)
      images.sort(
        (a, b) =>
          filter._id?.$in.indexOf(a?._id) - filter._id?.$in.indexOf(b?._id)
      );

    return response.ok(images, res, `Success`, pages);
  },
  getDetail: async function (req, res) {
    const { image_id } = req.params;

    let filter = {
      _id: image_id,
      deleted_time: {
        $exists: false,
      },
    };

    if (req?.me?.organization_id || req.headers?.organizationid)
      filter.organization_id =
        req?.me?.organization_id ?? req.headers?.organizationid;

    let image = await models.Image.findOne(filter);

    return response.ok(
      image,
      res,
      i18n(`Success`, {}, req.headers["accept-language"], "general")
    );
  },
  add: async function (req, res) {
    const current_date = moment().tz("Asia/Jakarta").format();
    const {
      button_name,
      button_route,
      type,
      title,
      description,
      is_embedded_video,
      active_status,
    } = req.body;
    let images = [],
      images_mobile = [];

    const session = await models.Image.startSession();
    session.startTransaction();

    try {
      const options = { session };

      //add images
      if (req.files) {
        try {
          const files = req.files?.files ?? [];
          const files_mobile = req.files?.files_mobile ?? [];
          images = await upload_image(
            files,
            `images`,
            req?.me?.organization_id || `organization`
          );
          images_mobile = await upload_image(
            files_mobile,
            `images`,
            req?.me?.organization_id || `organization`
          );
        } catch (error) {
          throw error;
        }
      }

      if (images.length == 0 || images_mobile.length == 0) {
        throw "Please upload image";
      }

      let new_data = {
        organization_id: req.me.organization_id,
        created_at: current_date,
        created_by: req.me._id,
        button_name,
        button_route,
        images,
        images_mobile,
        title,
        description,
        type: models.Image.IMAGE_TYPE()[type],
        is_embedded_video,
        active_status,
      };
      await models.Image(new_data).save(options);

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
      image_id,
      button_name,
      button_route,
      type,
      images,
      images_mobile,
      title,
      description,
      is_embedded_video,
      active_status,
    } = req.body;
    let new_images = [],
      old_images = [],
      new_images_mobile = [],
      old_images_mobile = [];

    if ((!images || !images_mobile) && !req.files) {
      return response.error(
        400,
        "Please upload image",
        res,
        "Please upload image"
      );
    }

    //change obj to array in images
    images = images ? JSON.parse(images) : JSON.stringify([]);
    images_mobile = images_mobile
      ? JSON.parse(images_mobile)
      : JSON.stringify([]);
    await create_image(old_images, images);
    await create_image(old_images_mobile, images_mobile);

    const filter = {
      _id: image_id,
      organization_id: req.me.organization_id,
      deleted_time: {
        $exists: false,
      },
    };

    const image = await models.Image.findOne(filter);
    if (!image) {
      return response.error(400, `Image not found`, res, `Image not found`);
    }

    const session = await models.Image.startSession();
    session.startTransaction();

    try {
      const options = { session };

      //remove images
      await remove_all_image(image.images, old_images);
      await remove_all_image(image.images_mobile, old_images_mobile);

      //add new images
      if (req.files) {
        try {
          const files = req.files?.files ?? [];
          const files_mobile = req.files?.files_mobile ?? [];
          new_images = await upload_image(
            files,
            `images`,
            req?.me?.organization_id || `organization`
          );
          new_images_mobile = await upload_image(
            files_mobile,
            `images`,
            req?.me?.organization_id || `organization`
          );
        } catch (error) {
          throw error;
        }
      }

      if (old_images.length == 0 && new_images.length == 0) {
        throw "Please upload image";
      }
      image.title = title;
      image.type = models.Image.IMAGE_TYPE()[type];
      image.description = description;
      image.button_name = button_name;
      image.button_route = button_route;
      image.is_embedded_video = is_embedded_video;
      image.active_status = active_status;
      image.images = [...old_images, ...new_images];
      image.images_mobile = [...old_images_mobile, ...new_images_mobile];
      image.updated_at = current_date;
      image.updated_by = req.me._id;
      await image.save(options);

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
  delete: async function (req, res) {
    const { image_id } = req.body;
    const current_date = moment().tz("Asia/Jakarta").format();

    const images = await models.Image.find({
      _id: { $in: image_id },
      organization_id: req.me.organization_id,
      deleted_time: {
        $exists: false,
      },
    });

    for (let i = 0; i < images.length; i++) {
      const image = images[i];

      const session = await models.Image.startSession();
      session.startTransaction();

      try {
        const options = { session };

        //pull address
        await models.Content.updateMany(
          {
            deleted_time: {
              $exists: false,
            },
          },
          {
            $pull: {
              banner: image._id,
              thumbnail_images: image._id,
              images: image._id,
              "body.$[].images": image._id,
            },
          }
        );

        image.deleted_time = current_date;
        image.deleted_by = req.me._id;
        image.updated_at = undefined;
        image.updated_by = undefined;
        await image.save(options);

        await session.commitTransaction();
        session.endSession();
      } catch (err) {
        await session.abortTransaction();
        session.endSession();
        return response.error(400, err.message, res, err);
      }
    }

    return response.ok(
      true,
      res,
      i18n(`Success`, {}, req.headers["accept-language"], "general")
    );
  },
};

module.exports = Controller;
