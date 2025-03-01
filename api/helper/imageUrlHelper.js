// imageUrlHelper.js
require("dotenv").config();

// Konstanta untuk BASE_URL_IMAGE dari environment variable
const BASE_URL_IMAGE = process.env.BASE_URL_IMAGE || "";

/**
 * Menambahkan BASE_URL_IMAGE ke URL gambar jika diperlukan
 * Fungsi ini dapat digunakan di berbagai controller untuk konsistensi
 *
 * @param {Object|Array} data - Data yang berisi URL gambar (objek atau array)
 * @param {Boolean} deep - Jika true, maka akan melakukan deep processing (default: true)
 * @returns {Object|Array} - Data dengan URL gambar yang sudah dimodifikasi
 */
const addBaseUrlToImage = (data, deep = true) => {
  if (!data) return data;
  if (!BASE_URL_IMAGE) return data; // Jika BASE_URL_IMAGE kosong, tidak perlu melakukan perubahan

  // Deep clone objek untuk menghindari mutasi
  const clonedData = JSON.parse(JSON.stringify(data));

  // Fungsi rekursif untuk menambahkan BASE_URL_IMAGE ke semua URL gambar
  const processImageUrls = (obj) => {
    if (!obj || typeof obj !== "object") return;

    // Kasus 1: Object dengan property images[] yang memiliki url
    if (obj.images && Array.isArray(obj.images)) {
      obj.images.forEach((img) => {
        if (
          img &&
          img.url &&
          typeof img.url === "string" &&
          !img.url.startsWith("http")
        ) {
          img.url = `${BASE_URL_IMAGE}${img.url}`;
        }
        // Proses objek bersarang di dalam images jika ada
        if (deep && img && typeof img === "object") {
          processImageUrls(img);
        }
      });
    }

    // Kasus 2: Object dengan property images_mobile[] yang memiliki url
    if (obj.images_mobile && Array.isArray(obj.images_mobile)) {
      obj.images_mobile.forEach((img) => {
        if (
          img &&
          img.url &&
          typeof img.url === "string" &&
          !img.url.startsWith("http")
        ) {
          img.url = `${BASE_URL_IMAGE}${img.url}`;
        }
        // Proses objek bersarang di dalam images_mobile jika ada
        if (deep && img && typeof img === "object") {
          processImageUrls(img);
        }
      });
    }

    // Kasus 3: Object dengan property url langsung
    if (obj.url && typeof obj.url === "string" && !obj.url.startsWith("http")) {
      obj.url = `${BASE_URL_IMAGE}${obj.url}`;
    }

    // Proses semua property objek secara rekursif (jika deep = true)
    if (deep) {
      Object.keys(obj).forEach((key) => {
        if (obj[key] && typeof obj[key] === "object") {
          processImageUrls(obj[key]);
        }
      });
    }
  };

  // Proses data (array atau objek tunggal)
  if (Array.isArray(clonedData)) {
    clonedData.forEach((item) => processImageUrls(item));
  } else {
    processImageUrls(clonedData);
  }

  return clonedData;
};

/**
 * Menghapus BASE_URL_IMAGE dari URL gambar (untuk penyimpanan ke database)
 *
 * @param {Object|Array} data - Data yang berisi URL gambar (objek atau array)
 * @returns {Object|Array} - Data dengan URL gambar tanpa BASE_URL_IMAGE
 */
const removeBaseUrlFromImage = (data) => {
  if (!data) return data;
  if (!BASE_URL_IMAGE) return data;

  // Deep clone objek untuk menghindari mutasi
  const clonedData = JSON.parse(JSON.stringify(data));

  // Fungsi rekursif untuk menghapus BASE_URL_IMAGE dari semua URL gambar
  const processImageUrls = (obj) => {
    if (!obj || typeof obj !== "object") return;

    // Kasus 1: Object dengan property images[] yang memiliki url
    if (obj.images && Array.isArray(obj.images)) {
      obj.images.forEach((img) => {
        if (
          img &&
          img.url &&
          typeof img.url === "string" &&
          img.url.startsWith(BASE_URL_IMAGE)
        ) {
          img.url = img.url.replace(BASE_URL_IMAGE, "");
        }
        processImageUrls(img);
      });
    }

    // Kasus 2: Object dengan property images_mobile[] yang memiliki url
    if (obj.images_mobile && Array.isArray(obj.images_mobile)) {
      obj.images_mobile.forEach((img) => {
        if (
          img &&
          img.url &&
          typeof img.url === "string" &&
          img.url.startsWith(BASE_URL_IMAGE)
        ) {
          img.url = img.url.replace(BASE_URL_IMAGE, "");
        }
        processImageUrls(img);
      });
    }

    // Kasus 3: Object dengan property url langsung
    if (
      obj.url &&
      typeof obj.url === "string" &&
      obj.url.startsWith(BASE_URL_IMAGE)
    ) {
      obj.url = obj.url.replace(BASE_URL_IMAGE, "");
    }

    // Proses semua property objek secara rekursif
    Object.keys(obj).forEach((key) => {
      if (obj[key] && typeof obj[key] === "object") {
        processImageUrls(obj[key]);
      }
    });
  };

  // Proses data (array atau objek tunggal)
  if (Array.isArray(clonedData)) {
    clonedData.forEach((item) => processImageUrls(item));
  } else {
    processImageUrls(clonedData);
  }

  return clonedData;
};

module.exports = {
  addBaseUrlToImage,
  removeBaseUrlFromImage,
  BASE_URL_IMAGE,
};
