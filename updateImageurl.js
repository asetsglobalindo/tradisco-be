// function transformImageUrl(image) {
//   const newImage = { ...image };

//   newImage.path = image.path.replace("pertamina/", "");
//   newImage.url = `/${image.path.replace("pertamina/", "")}/${
//     image.name
//   }`;

//   return newImage;
// }

// async function updateAllDocumentsUrl(collection) {
//   const cursor = collection.find({});

//   let count = 0;
//   while (await cursor.hasNext()) {
//     const doc = await cursor.next();

//     // Transform images dan images_mobile
//     const updatedImages = doc.images.map((img) => transformImageUrl(img));
//     const updatedImagesMobile = doc.images_mobile.map((img) =>
//       transformImageUrl(img)
//     );

//     // Update dokumen, hanya bagian images saja
//     await collection.updateOne(
//       { _id: doc._id },
//       {
//         $set: {
//           images: updatedImages,
//           images_mobile: updatedImagesMobile,
//         },
//       }
//     );

//     count++;
//     if (count % 100 === 0) {
//       console.log(`Processed ${count} documents`);
//     }
//   }

//   console.log(`Complete! Updated ${count} documents`);
// }

// const { MongoClient } = require("mongodb");

// async function main() {
//   const uri = "mongodb+srv://edu:edu@edu.atqvfub.mongodb.net/";
//   const client = new MongoClient(uri);

//   try {
//     await client.connect();
//     const database = client.db("pertamina");
//     const collection = database.collection("image");

//     await updateAllDocumentsUrl(collection);
//   } finally {
//     await client.close();
//   }
// }

// main().catch(console.error);

const { MongoClient } = require("mongodb");
function transformImageUrl(image) {
  // Buat salinan objek image
  const newImage = { ...image };

  // Ubah URL dengan menghapus /static jika ada
  if (newImage.url && newImage.url.startsWith("/static")) {
    newImage.url = newImage.url.replace("/static", "");
  }

  return newImage;
}

/**
 * Fungsi untuk memperbarui semua dokumen dalam koleksi
 * @param {Collection} collection - MongoDB collection
 */
async function updateAllDocumentsUrl(collection) {
  const cursor = collection.find({});

  let count = 0;
  let successCount = 0;
  let errorCount = 0;

  while (await cursor.hasNext()) {
    try {
      const doc = await cursor.next();

      // Skip jika tidak ada images atau images_mobile
      if (!doc.images && !doc.images_mobile) {
        console.log(`Document ${doc._id} skipped - no images`);
        continue;
      }

      // Transform images jika ada
      const updatedImages =
        doc.images && Array.isArray(doc.images)
          ? doc.images.map((img) => transformImageUrl(img))
          : doc.images;

      // Transform images_mobile jika ada
      const updatedImagesMobile =
        doc.images_mobile && Array.isArray(doc.images_mobile)
          ? doc.images_mobile.map((img) => transformImageUrl(img))
          : doc.images_mobile;

      // Buat objek $set untuk update
      const updateObj = {};
      if (doc.images) updateObj.images = updatedImages;
      if (doc.images_mobile) updateObj.images_mobile = updatedImagesMobile;

      // Update dokumen
      const result = await collection.updateOne(
        { _id: doc._id },
        { $set: updateObj }
      );

      if (result.modifiedCount > 0) {
        successCount++;
      }

      count++;
      if (count % 100 === 0) {
        console.log(
          `Processed ${count} documents (${successCount} updated, ${errorCount} errors)`
        );
      }
    } catch (error) {
      console.error(`Error processing document: ${error.message}`);
      errorCount++;
    }
  }

  console.log(
    `Complete! Processed ${count} documents (${successCount} updated, ${errorCount} errors)`
  );
}

/**
 * Fungsi utama untuk menjalankan script
 */
async function main() {
  // Connection URI - ganti dengan connection string MongoDB Anda
  const uri = "mongodb+srv://edu:edu@edu.atqvfub.mongodb.net/";

  // Nama database dan koleksi - sesuaikan dengan kebutuhan Anda
  const dbName = "pertamina";
  const collectionName = "image"; // Ganti dengan nama koleksi Anda

  const client = new MongoClient(uri);

  try {
    // Connect ke MongoDB
    console.log("Connecting to MongoDB...");
    await client.connect();
    console.log("Connected successfully to server");

    // Pilih database dan koleksi
    const database = client.db(dbName);
    const collection = database.collection(collectionName);

    // Hitung total dokumen
    const totalDocuments = await collection.countDocuments();
    console.log(
      `Found ${totalDocuments} documents in ${collectionName} collection`
    );

    // Jalankan update
    console.log("Starting update process...");
    await updateAllDocumentsUrl(collection);
  } catch (error) {
    console.error("Error running script:", error);
  } finally {
    // Tutup koneksi
    await client.close();
    console.log("MongoDB connection closed");
  }
}

// Jalankan script
main().catch(console.error);
