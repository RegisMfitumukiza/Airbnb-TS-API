import { cloudinary } from "../config/cloudinary.js";
import { APIError } from "./ApiError.js";


type CloudinaryUploadResult = {
    url: string;
    publicId: string;
}

export const uploadBufferToCloudinary = async (
    fileBuffer: Buffer,
    folder = "Airbnb-Images"
) : Promise<CloudinaryUploadResult> => {

    return new Promise((resolve, reject) => {
        const stream = cloudinary.uploader.upload_stream({
            folder,
            resource_type: "auto",
        },

        (error, result) => {
            if(error || !result) {
                return reject( new APIError("Failed to upload to cloudinary", 400))
            } 

            resolve({
                url: result.secure_url,
                publicId: result.public_id
            });
        });

        //write a buffer into the stream and close it
        stream.end(fileBuffer);
    })
};

export const deleteFromCloudinary = async (publicId: string) : Promise<void> => {
    await cloudinary.uploader.destroy(publicId);
}
