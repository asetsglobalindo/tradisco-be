const moment = require("moment-timezone");
const mongoose = require("mongoose");
const { LanguageListType } = require("../helper/types");
const defaultDate = moment.tz(Date.now(), "Asia/Jakarta");

const homeSchema = new mongoose.Schema({
  meta_title: LanguageListType("string"),
  meta_description: LanguageListType("string"),
  banner: [LanguageListType("image")],
  section2: {
    title: LanguageListType("string"),
    tab: [
      {
        title: LanguageListType("string"),
        content: [
          {
            type: String,
            ref: "Content",
          },
        ],
        image: {
          type: String,
          ref: "Image",
        },
      },
    ],
  },

  section3: {
    small_text: LanguageListType("string"),
    title: LanguageListType("string"),
  },

  section4: [
    {
      tab: LanguageListType("string"),
      title: LanguageListType("string"),
      description: LanguageListType("string"),
      image: {
        type: String,
        ref: "Image",
      },
      diagram1: [
        {
          tahun: {
            type: Number,
            required: true,
            index: true,
          },
          kolom1: {
            type: Number,
          },
        },
      ],
      diagram2: [
        {
          tahun: {
            type: Number,
            required: true,
            index: true,
          },
          kolom1: {
            type: Number,
          },
          kolom2: {
            type: Number,
          },
        },
      ],
    },
  ],

  section4a: {
    title: LanguageListType("string"),
    description: LanguageListType("string"),
    content: [
      {
        type: String,
        ref: "Content",
      },
    ],
  },

  section5: {
    title: LanguageListType("string"),
    button_name: LanguageListType("string"),
    button_route: {
      type: String,
    },
    content: [
      {
        type: String,
        ref: "Content",
      },
    ],
  },

  organization_id: {
    type: String,
  },
  created_at: {
    type: Date,
    default: defaultDate,
  },
  created_by: String,
  updated_at: Date,
  updated_by: String,
  deleted_time: Date,
  deleted_by: String,
});

const Home = mongoose.model("Home", homeSchema, "home");

module.exports = Home;
