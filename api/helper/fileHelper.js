const fs = require("fs");
const path = require("path");
const { v4: uuidv4 } = require("uuid");
const { removeWordBreak, removeSymbol, is_object } = require("./stringmod");
require("dotenv").config();

// Direktori penyimpanan lokal
const BASE_STORAGE_DIR = path.join(process.cwd(), "storage");
// URL base dengan domain
const BASE_URL = process.env.BASE_URL || "https://your-domain.com"; // Tambahkan base URL
const PUBLIC_URL_BASE = `${BASE_URL}/static`; // Tambahkan BASE_URL di depan /static

// Memastikan direktori penyimpanan ada
const ensureDirectoryExists = (dirPath) => {
  if (!fs.existsSync(dirPath)) {
    fs.mkdirSync(dirPath, { recursive: true });
  }
};

// Inisialisasi direktori penyimpanan saat server dimulai
ensureDirectoryExists(BASE_STORAGE_DIR);

const view_image = (filePath) => {
  return new Promise((resolve, reject) => {
    try {
      const fullPath = path.join(BASE_STORAGE_DIR, filePath);
      if (!fs.existsSync(fullPath)) {
        return reject(new Error("File not found"));
      }

      const data = fs.readFileSync(fullPath);
      resolve({ Body: data });
    } catch (error) {
      reject(error);
    }
  });
};

const upload_image = (files, folder, organization_id) => {
  return new Promise((resolve, reject) => {
    const mimetype = [`image/png`, `image/jpeg`, `image/svg+xml`, `video/mp4`];
    let result = [];

    // Buat direktori jika tidak ada
    const organizationPath = path.join(
      BASE_STORAGE_DIR,
      organization_id,
      folder
    );
    ensureDirectoryExists(organizationPath);

    // Upload 1 gambar
    if (typeof files === "object" && !Array.isArray(files) && files !== null) {
      if (!mimetype.some((str) => str.includes(files.mimetype))) {
        throw "Product image extension should jpeg/png/svg/mp4";
      }

      const file_name = uuidv4();
      const extension = files.mimetype.substring(
        files.mimetype.indexOf("/") + 1,
        files.mimetype.length
      );
      const relativePath = `${organization_id}/${folder}`;
      const fullPath = path.join(
        BASE_STORAGE_DIR,
        relativePath,
        `${file_name}.${extension}`
      );

      try {
        fs.writeFileSync(fullPath, files.data);

        // Simpan path relatif dan tambahkan BASE_URL dan /static untuk URL lengkap
        result.push({
          type: files.mimetype,
          path: relativePath,
          name: `${file_name}.${extension}`,
          size: files.size,
          // Tambahkan PUBLIC_URL_BASE di depan path relatif
          url: `${PUBLIC_URL_BASE}/${relativePath}/${file_name}.${extension}`,
        });

        resolve(result);
      } catch (error) {
        reject(error);
      }
    }

    // Upload multiple gambar
    if (Array.isArray(files) && files.length > 0) {
      for (let i = 0; i < files.length; i++) {
        const file = files[i];

        if (!mimetype.some((str) => str.includes(file.mimetype))) {
          throw "Product image extension should jpeg/png/svg/mp4";
        }

        const file_name = uuidv4();
        const extension = file.mimetype.substring(
          file.mimetype.indexOf("/") + 1,
          file.mimetype.length
        );
        const relativePath = `${organization_id}/${folder}`;
        const fullPath = path.join(
          BASE_STORAGE_DIR,
          relativePath,
          `${file_name}.${extension}`
        );

        try {
          fs.writeFileSync(fullPath, file.data);

          // Simpan path relatif dan tambahkan BASE_URL dan /static untuk URL lengkap
          result.push({
            type: file.mimetype,
            path: relativePath,
            name: `${file_name}.${extension}`,
            size: file.size,
            // Tambahkan PUBLIC_URL_BASE di depan path relatif
            url: `${PUBLIC_URL_BASE}/${relativePath}/${file_name}.${extension}`,
          });
        } catch (error) {
          reject(error);
        }
      }
      resolve(result);
    }

    if (result.length == 0) {
      resolve(result);
    }
  });
};

// Helper untuk mendapatkan URL lengkap dengan PUBLIC_URL_BASE
// Fungsi ini digunakan di frontend atau API response
const getFullImageUrl = (imageData) => {
  if (!imageData || !imageData.url) return null;

  // Jika URL sudah memiliki domain lengkap, kembalikan apa adanya
  if (imageData.url.startsWith("http")) {
    return imageData.url;
  }

  // Jika URL sudah memiliki BASE_URL dan /static, kembalikan apa adanya
  if (imageData.url.startsWith(PUBLIC_URL_BASE)) {
    return imageData.url;
  }

  // Jika URL hanya memiliki path relatif, tambahkan PUBLIC_URL_BASE
  return `${PUBLIC_URL_BASE}${imageData.url.startsWith("/") ? "" : "/"}${
    imageData.url
  }`;
};

const remove_image = async (file) => {
  return new Promise((resolve, reject) => {
    try {
      const fullPath = path.join(BASE_STORAGE_DIR, file.path, file.name);

      if (fs.existsSync(fullPath)) {
        fs.unlinkSync(fullPath);
      }

      resolve({ success: true });
    } catch (error) {
      reject(error);
    }
  });
};

const remove_all_image = async (current_images, old_images) => {
  if (current_images.length > old_images.length && old_images.length > 0) {
    try {
      for (let i = 0; i < current_images.length; i++) {
        const image = current_images[i];
        if (!old_images.find((item) => item._id == image._id)) {
          await remove_image(image);
        }
      }
    } catch (error) {
      throw error;
    }
  }
};

const create_image = async (old_images, images) => {
  if (images && Array.isArray(images)) {
    for (let i = 0; i < images.length; i++) {
      const img = images[i];
      old_images.push(img);
    }
  } else if (images && is_object(images)) {
    old_images.push(images);
  }
};

const delete_unused_data = (dataObj, type) => {
  const newData = {};
  Object.keys(dataObj).forEach((key) => {
    if (key !== "null" || newData !== null) {
      newData[key] = dataObj[key];
    }

    if (key === '"null"') {
      delete newData[key];
    }

    if (key === "__typename") {
      delete newData[key];
    }

    if (key === '"undefined"') {
      delete newData[key];
    }

    if (newData[key] === null) {
      newData[key] = "-";
    }
  });
  return newData;
};

const remove_file_directory = async (dir) => {
  try {
    if (fs.existsSync(dir)) {
      fs.rmSync(dir, { recursive: true, force: true });
    }
    return true;
  } catch (error) {
    throw error;
  }
};

const remove_file = async () => {
  try {
    const exportPath = path.join(BASE_STORAGE_DIR, "export-files");
    const importPath = path.join(BASE_STORAGE_DIR, "import-files");

    if (fs.existsSync(exportPath)) {
      fs.rmSync(exportPath, { recursive: true, force: true });
    }

    if (fs.existsSync(importPath)) {
      fs.rmSync(importPath, { recursive: true, force: true });
    }

    return true;
  } catch (error) {
    return error.message;
  }
};

module.exports = {
  upload_image,
  view_image,
  remove_image,
  create_image,
  delete_unused_data,
  remove_file,
  remove_all_image,
  remove_file_directory,
  ensureDirectoryExists,
  BASE_STORAGE_DIR,
  getFullImageUrl,
  PUBLIC_URL_BASE,
  BASE_URL, // Ekspor BASE_URL untuk penggunaan di tempat lain
};
