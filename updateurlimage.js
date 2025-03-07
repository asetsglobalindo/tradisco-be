const { MongoClient } = require("mongodb");

// Koneksi URI dan informasi lainnya
const config = {
  uri: "mongodb+srv://edu:edu@edu.atqvfub.mongodb.net/restore",
  dbName: "restore",
  collectionName: "image",
  oldBaseUrl: "https://api-pertare.tradisco.co.id/static/",
  newBaseUrl: "http://localhost:7052/static/",
};

// Fungsi untuk memperbarui URL gambar
async function updateImageUrls() {
  const client = new MongoClient(config.uri);

  try {
    // Menghubungkan ke MongoDB
    await client.connect();
    console.log("Connected to MongoDB");

    // Mengakses database dan koleksi
    const database = client.db(config.dbName);
    const collection = database.collection(config.collectionName);

    // Mencari dokumen yang memiliki URL gambar yang perlu diperbarui
    const cursor = collection.find({
      $or: [
        {
          "images.url": { $regex: config.oldBaseUrl },
        },
        {
          "images_mobile.url": { $regex: config.oldBaseUrl },
        },
      ],
    });

    let updatedCount = 0;
    const documents = await cursor.toArray();
    console.log(
      `Found ${documents.length} documents with image URLs to update`
    );

    for (const doc of documents) {
      let needsUpdate = false;

      // Memproses array images jika ada
      if (doc.images && doc.images.length > 0) {
        for (let i = 0; i < doc.images.length; i++) {
          if (
            doc.images[i].url &&
            doc.images[i].url.includes(config.oldBaseUrl)
          ) {
            // Ganti URL lama dengan yang baru
            doc.images[i].url = doc.images[i].url.replace(
              config.oldBaseUrl,
              config.newBaseUrl
            );
            needsUpdate = true;
          }
        }
      }

      // Memproses array images_mobile jika ada
      if (doc.images_mobile && doc.images_mobile.length > 0) {
        for (let i = 0; i < doc.images_mobile.length; i++) {
          if (
            doc.images_mobile[i].url &&
            doc.images_mobile[i].url.includes(config.oldBaseUrl)
          ) {
            // Ganti URL lama dengan yang baru
            doc.images_mobile[i].url = doc.images_mobile[i].url.replace(
              config.oldBaseUrl,
              config.newBaseUrl
            );
            needsUpdate = true;
          }
        }
      }

      // Update dokumen jika ada perubahan
      if (needsUpdate) {
        const result = await collection.updateOne(
          { _id: doc._id },
          {
            $set: {
              images: doc.images,
              images_mobile: doc.images_mobile,
            },
          }
        );

        if (result.modifiedCount > 0) {
          updatedCount++;
          console.log(`Updated document ID: ${doc._id}`);
        }
      }
    }

    console.log(`Successfully updated ${updatedCount} documents`);
  } catch (err) {
    console.error("Error occurred:", err);
  } finally {
    // Menutup koneksi MongoDB
    await client.close();
    console.log("MongoDB connection closed");
  }
}

// Menjalankan fungsi
updateImageUrls().catch(console.error);
