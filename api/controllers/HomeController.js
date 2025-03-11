const { convertData } = require("../helper/convert");
const response = require("../helper/response");
const { default_lang, i18n } = require("../locales");
const models = require("../models");
const moment = require("moment");
const CONTROLLER = {
  id: "Beranda",
  en: "Home",
};
const ATTRIBUTE_IMAGE = `images.url images_mobile.url title description button_name button_route`;
const ATTRIBUTE_CONTENT = `meta_title meta_description small_text title description bottom_button_name bottom_button_route order category_id thumbnail_images created_at slug sub_title1 sub_title2`;
const HOME_POPULATE = (language) => {
  const POPUlATE_CONTENT = [
    { path: `category_id`, select: "name slug" },
    { path: `thumbnail_images.${language}`, select: ATTRIBUTE_IMAGE },
  ];
  const POPUlATE = [
    { path: `banner.${language}`, select: ATTRIBUTE_IMAGE },
    {
      path: `section2.tab.content`,
      select: ATTRIBUTE_CONTENT,
      populate: POPUlATE_CONTENT,
    },
    { path: `section2.tab.image`, select: ATTRIBUTE_IMAGE },
    { path: `section4.image`, select: ATTRIBUTE_IMAGE },
    {
      path: `section4a.content`,
      select: ATTRIBUTE_CONTENT,
      populate: POPUlATE_CONTENT,
    },
    {
      path: `section5.content`,
      select: ATTRIBUTE_CONTENT,
      populate: POPUlATE_CONTENT,
    },
  ];
  return POPUlATE;
};

// Helper function to sort nested content by order field
const sortByOrder = (items) => {
  if (!items || !Array.isArray(items)) return items;
  return [...items].sort((a, b) => {
    const orderA = a.order !== undefined ? a.order : 0;
    const orderB = b.order !== undefined ? b.order : 0;
    return orderA - orderB;
  });
};

// Helper function to sort diagram data by year
const sortByYear = (items) => {
  if (!items || !Array.isArray(items)) return items;
  return [...items].sort((a, b) => {
    const yearA = a.tahun !== undefined ? a.tahun : 0;
    const yearB = b.tahun !== undefined ? b.tahun : 0;
    return yearA - yearB;
  });
};

const Home = {
  health: async function (_, res) {
    res.status(200).json(`Healthy`);
  },
  add: async function (req, res) {
    const {
      meta_title,
      meta_description,
      banner,
      section2,
      section3,
      section4,
      section4a,
      section5,
    } = req.body;

    const home = await models.Home.findOne({});
    if (home) {
      if (meta_title) home.meta_title = meta_title;
      if (meta_description) home.meta_description = meta_description;
      if (banner) home.banner = banner;
      if (section2) home.section2 = section2;
      if (section3) home.section3 = section3;
      if (section4) home.section4 = section4;
      if (section4a) home.section4a = section4a;
      if (section5) home.section5 = section5;
      home.updated_by = req.me._id;
      home.updated_at = moment().tz("Asia/Jakarta").format();
      await home.save();
    } else {
      const new_data = {
        ...req.body,
        organization_id: req.me.organization_id,
        created_by: req.me._id,
        created_at: moment().tz("Asia/Jakarta").format(),
      };
      await models.Home(new_data).save();
    }
    return response.ok(
      true,
      res,
      i18n(`Success`, {}, default_lang(req.headers), "general")
    );
  },

  // Add or update diagram data for section4
  updateDiagram: async function (req, res) {
    const { section4Id, diagramType, diagramData } = req.body;

    if (
      !section4Id ||
      !diagramType ||
      !diagramData ||
      !Array.isArray(diagramData)
    ) {
      return response.badRequest(
        res,
        i18n(`Invalid request data`, {}, default_lang(req.headers), "general")
      );
    }

    // Validate diagramType
    if (diagramType !== "diagram1" && diagramType !== "diagram2") {
      return response.badRequest(
        res,
        i18n(`Invalid diagram type`, {}, default_lang(req.headers), "general")
      );
    }

    try {
      const home = await models.Home.findOne({});
      if (!home) {
        return response.notFound(
          res,
          i18n(`Home page not found`, {}, default_lang(req.headers), "general")
        );
      }

      // Find the specific section4 by ID
      const section4Index = home.section4.findIndex(
        (s) => s._id.toString() === section4Id
      );
      if (section4Index === -1) {
        return response.notFound(
          res,
          i18n(`Section4 not found`, {}, default_lang(req.headers), "general")
        );
      }

      // Update the appropriate diagram data
      home.section4[section4Index][diagramType] = diagramData;

      // Update metadata
      home.updated_by = req.me._id;
      home.updated_at = moment().tz("Asia/Jakarta").format();

      await home.save();

      return response.ok(
        true,
        res,
        i18n(
          `Diagram updated successfully`,
          {},
          default_lang(req.headers),
          "general"
        )
      );
    } catch (error) {
      console.error("Error updating diagram:", error);
      return response.serverError(
        res,
        i18n(`Server error`, {}, default_lang(req.headers), "general")
      );
    }
  },

  // Get diagram data for section4
  getDiagram: async function (req, res) {
    const { section4Id, diagramType } = req.query;

    if (!section4Id || !diagramType) {
      return response.badRequest(
        res,
        i18n(`Missing parameters`, {}, default_lang(req.headers), "general")
      );
    }

    // Validate diagramType
    if (diagramType !== "diagram1" && diagramType !== "diagram2") {
      return response.badRequest(
        res,
        i18n(`Invalid diagram type`, {}, default_lang(req.headers), "general")
      );
    }

    try {
      const home = await models.Home.findOne({});
      if (!home) {
        return response.notFound(
          res,
          i18n(`Home page not found`, {}, default_lang(req.headers), "general")
        );
      }

      // Find the specific section4 by ID
      const section4 = home.section4.find(
        (s) => s._id.toString() === section4Id
      );
      if (!section4) {
        return response.notFound(
          res,
          i18n(`Section4 not found`, {}, default_lang(req.headers), "general")
        );
      }

      // Get the appropriate diagram data and sort by year
      const diagramData = sortByYear(section4[diagramType] || []);

      return response.ok(
        diagramData,
        res,
        i18n(`Success`, {}, default_lang(req.headers), "general")
      );
    } catch (error) {
      console.error("Error getting diagram:", error);
      return response.serverError(
        res,
        i18n(`Server error`, {}, default_lang(req.headers), "general")
      );
    }
  },

  content: async function (req, res) {
    // Fix by sanitizing the language before using it
    let language = default_lang(req.headers);
    // Extract first language code only (e.g., "en" from "en-us,en;q=0.9")
    language = language.split(",")[0].split("-")[0];

    // Get home data with populated fields (no sorting at this stage)
    let home = await models.Home.findOne().populate(HOME_POPULATE(language));

    // Convert to plain object for manipulation
    home = JSON.parse(JSON.stringify(home));

    // Apply sorting to all relevant nested arrays
    if (home && home.section2 && home.section2.tab) {
      // Sort tabs by order if they have order property
      home.section2.tab = sortByOrder(home.section2.tab);

      // Sort content inside each tab
      home.section2.tab.forEach((tab) => {
        if (tab.content) {
          tab.content = sortByOrder(tab.content);
        }
      });
    }

    // Sort section4a content if it exists
    if (home && home.section4a && home.section4a.content) {
      home.section4a.content = sortByOrder(home.section4a.content);
    }

    // Sort section5 content if it exists
    if (home && home.section5 && home.section5.content) {
      home.section5.content = sortByOrder(home.section5.content);
    }

    // Sort diagram data by year in section4 if it exists
    if (home && home.section4 && Array.isArray(home.section4)) {
      home.section4.forEach((section) => {
        if (section.diagram1 && Array.isArray(section.diagram1)) {
          section.diagram1 = sortByYear(section.diagram1);
        }
        if (section.diagram2 && Array.isArray(section.diagram2)) {
          section.diagram2 = sortByYear(section.diagram2);
        }
      });
    }

    // Convert data for localization
    home = convertData(home, req.headers);

    return response.ok(
      home,
      res,
      i18n(`Success`, {}, default_lang(req.headers), "general")
    );
  },

  get: async function (req, res) {
    const home = await models.Home.findOne();
    return response.ok(
      home,
      res,
      i18n(`Success`, {}, default_lang(req.headers), "general")
    );
  },
};

module.exports = Home;
