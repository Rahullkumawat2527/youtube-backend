import { v2 as cloudinary } from "cloudinary"
import fs from "fs"

cloudinary.config({
    cloud_name: 'dta4czuej',
    api_key: '728438371495286',
    api_secret: 'cRrIx5jaHuzQ5e6qcm2x6ERbXSs'
})

const uploadOnCloudinary = async (localFilePath) => {

    try {

        console.log("cloudinary key", process.env.CLOUDINARY_API_KEY)
        if (!localFilePath) return null
        // upload the file on cloudinary

        const response = await cloudinary.uploader.upload(localFilePath, {
            resource_type: "auto"
        })

        // file has been uploaded successfully
        console.log("file is uploaded on cloudinary ", response.url)

        // delete temp file after successful upload 
        if (fs.existsSync(localFilePath)) fs.unlinkSync(localFilePath)

        return response

    } catch (error) {
        console.error("FULL Cloudinary error:", error);
        if (fs.existsSync(localFilePath)) fs.unlinkSync(localFilePath);
        return null;
    }
    // } catch (error) {
    // fs.unlinkSync(localFilePath) // remove the locally saved temporary file as the upload operation got failed
    //     console.error("cloudinary upload failed",error.message)
    //     if(fs.existsSync(localFilePath)) fs.unlinkSync(localFilePath
    //     return null
    // }

}

export { uploadOnCloudinary }