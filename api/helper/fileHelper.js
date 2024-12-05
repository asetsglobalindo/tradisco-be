const {removeWordBreak, removeSymbol, is_object} = require("./stringmod");
const awsConfig = require('./aws');
const spacesConfig = require('./spaces');
const AWS = require('aws-sdk');
const fs = require('fs');
const aws = new AWS.S3(awsConfig.s3);
const space = new AWS.S3(spacesConfig.s3);
const { v4: uuidv4 } = require('uuid');


const view_image = key => {
    return new Promise((resolve, reject) => {
        aws.getObject({
            Key: key
        }, (err, data) => {
            if ( err ) reject(err)
            else resolve(data)
        })
    })
}

const upload_image = (files, folder, organization_id) => {
    return new Promise((resolve, reject) => {
        const mimetype = [`image/png`, `image/jpeg`, `image/svg+xml`, `video/mp4`];
        let result = [];
    
        // upload 1 image
        if (
            typeof files === 'object' && 
            !Array.isArray(files) &&
            files !== null
        ) {
            if (!mimetype.some(str => str.includes(files.mimetype))) {
                throw "Product image extension should jpeg/png/svg/mp4"
            }
    
            const file_name = uuidv4();
            const extension = files.mimetype.substring(files.mimetype.indexOf("/")+1, files.mimetype.length);
            const path = `${process.env.FOLDER_PARENT}/${organization_id}/${folder}`;
    
            result.push({
                type: files.mimetype,
                path: path,
                name: `${file_name}.${extension}`,
                size: files.size,
                url: `${process.env.SPACES_URL}/${path}/${file_name}.${extension}`
            })
    
            const params = {
                Body: files.data,
                Key: `${path}/${file_name}.${extension}`,
                ACL:'public-read',
                Bucket: process.env.DO_SPACES_NAME,
            }
    
            space.putObject(params, (err, data) => {
                if ( err ) reject(err)
                else resolve(result);
            });
        }
    
        // upload multiple image
        if (Array.isArray(files) && files.length > 0) {
            for (let i = 0; i < files.length; i++) {
                const file = files[i];
    
                if (!mimetype.some(str => str.includes(file.mimetype))) {
                    throw "Product image extension should jpeg/png/svg/mp4"
                }
    
                const file_name = uuidv4();
                const extension = file.mimetype.substring(file.mimetype.indexOf("/")+1, file.mimetype.length);
                const path = `${process.env.FOLDER_PARENT}/${organization_id}/${folder}`;
    
                result.push({
                    type: file.mimetype,
                    path: path,
                    name: `${file_name}.${extension}`,
                    size: file.size,
                    url: `${process.env.SPACES_URL}/${path}/${file_name}.${extension}`
                })
    
                const params = {
                    Body: file.data,
                    Key: `${path}/${file_name}.${extension}`,
                    ACL:'public-read',
                    Bucket: process.env.DO_SPACES_NAME,
                }
        
                space.putObject(params, (err, data) => {
                    if ( err ) reject(err)
                });
            }
            resolve(result);
        }

        if (result.length == 0) {
            resolve(result)
        }
    })
}

const remove_image = async (file) => {
    return new Promise((resolve, reject) => {
        const params = {
            Key: `${file.path}/${file.name}`,
            Bucket: process.env.DO_SPACES_NAME,
        }
    
        space.deleteObject(params, (err, data) => {
            if ( err ) {
                reject(err)
            }
            resolve(data)
        });
    })
}
const remove_all_image = async (current_images, old_images) => {
    if (current_images.length > old_images.length && old_images.length > 0) {
        try {
            for (let i = 0; i < current_images.length; i++) {
                const image = current_images[i];
                if (!old_images.find(item => item._id == image._id)) await remove_image(image)
            }
        } catch (error) {
            throw error
        }
    }
}

const create_image = async (old_images, images) => {
    if (images && Array.isArray(images)) {
        for (let i = 0; i < images.length; i++) {
            const img = images[i];
            old_images.push(img)
        }
    }
    else if (images && is_object(images)) { 
        old_images.push(images);
    }
}

const delete_unused_data = (dataObj, type) => {
    const newData = {}
    Object.keys(dataObj).forEach((key) => {
      if (key !== 'null' || newData !== null) {
        newData[key] = dataObj[key]
      }

      if (key === '"null"') {
        delete newData[key]
      }

      if (key === '__typename') {
        delete newData[key]
      }

      if (key === '"undefined"') {
        delete newData[key]
      }

      if (newData[key] === null) {
        newData[key] = '-'
      }
    })
    return newData;
};

const remove_file_spaces = async (bucket, dir) => {
    try {
        const listParams = {
            Bucket: bucket,
            Prefix: dir
        };
    
        const listedObjects = await space.listObjectsV2(listParams).promise();
    
        if (listedObjects.Contents.length === 0) return;
    
        const deleteParams = {
            Bucket: bucket,
            Delete: { Objects: [] }
        };
    
        listedObjects.Contents.forEach(({ Key }) => {
            deleteParams.Delete.Objects.push({ Key });
        });
    
        await space.deleteObjects(deleteParams).promise();
    
        if (listedObjects.IsTruncated) await remove_file_spaces(bucket, dir);
    } catch (error) {
        throw error 
    }
}

const remove_file = async () => {
    try {
        if(fs.existsSync(`files/export-files`)) fs.rmSync("files/export-files", { recursive: true, force: true });

        //remove in Spaces
        await remove_file_spaces(process.env.DO_SPACES_NAME, "export-files/")
        await remove_file_spaces(process.env.DO_SPACES_NAME, "import-files/")
        return true
    } catch (error) {
        return error.message
    }
}

module.exports = { 
    upload_image, remove_file_spaces,
    view_image, remove_image, create_image,
    delete_unused_data, remove_file, 
    remove_all_image
};