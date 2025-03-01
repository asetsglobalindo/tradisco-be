const { MongoClient } = require("mongodb");

// Connection URI
const uri = "mongodb+srv://edu:edu@edu.atqvfub.mongodb.net/pertamina";

// Function to update image URLs
async function updateImageUrls() {
  // Create a new MongoClient
  const client = new MongoClient(uri);

  try {
    // Connect to the MongoDB cluster
    await client.connect();
    console.log("Connected to MongoDB");

    // Get the database and collection
    const database = client.db("pertamina");
    const collection = database.collection("image");

    // Find all documents with images or images_mobile
    const cursor = collection.find({
      $or: [
        {
          "images.url": {
            $regex: "https://pertamina.sgp1.digitaloceanspaces.com/pertamina",
          },
        },
        {
          "images_mobile.url": {
            $regex: "https://pertamina.sgp1.digitaloceanspaces.com/pertamina",
          },
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

      // Process images array if it exists
      if (doc.images && doc.images.length > 0) {
        for (let i = 0; i < doc.images.length; i++) {
          if (
            doc.images[i].url &&
            doc.images[i].url.startsWith(
              "https://pertamina.sgp1.digitaloceanspaces.com/pertamina"
            )
          ) {
            doc.images[i].url = doc.images[i].url.replace(
              "https://pertamina.sgp1.digitaloceanspaces.com/pertamina",
              ""
            );
            needsUpdate = true;
          }
        }
      }

      // Process images_mobile array if it exists
      if (doc.images_mobile && doc.images_mobile.length > 0) {
        for (let i = 0; i < doc.images_mobile.length; i++) {
          if (
            doc.images_mobile[i].url &&
            doc.images_mobile[i].url.startsWith(
              "https://pertamina.sgp1.digitaloceanspaces.com/pertamina"
            )
          ) {
            doc.images_mobile[i].url = doc.images_mobile[i].url.replace(
              "https://pertamina.sgp1.digitaloceanspaces.com/pertamina",
              ""
            );
            needsUpdate = true;
          }
        }
      }

      // Update the document if changes were made
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
    // Close the connection to the MongoDB cluster
    await client.close();
    console.log("MongoDB connection closed");
  }
}

// Run the function
updateImageUrls().catch(console.error);
