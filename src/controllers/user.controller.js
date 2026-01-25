import { ApiError } from "../utils/apiError.js"
import { asyncHandler } from "../utils/asyncHandler.js"
import { User } from "../models/user.models.js"
import { uploadOnCloudinary } from "../utils/cloudinary.js"
import { ApiResponse } from "../utils/apiResponse.js"


const registerUser = asyncHandler(async (req, res) => {

    // getting user data from frontend
    const { fullName, username, email, password, } = req.body
    console.log("password", password)


    // validation for checking all fields are non empty
    if (
        [fullName, username, email, password].some((field) => field?.trim() === "")
    ) {
        throw new ApiError(400, "All fields are  required",)
    }

    // do email validation and study it why creating separate file and write validations in that file

    // checking for user, if user already exists or not

    const existedUser = await User.findOne({
        $or: [{ username }, { email }]
    })

    if (existedUser) {
        throw new ApiError(409, "User with email or username already exist")
    }

    const avatarLocalPath = req.files?.avatar?.[0]?.path   // accesing the local path of the avatar image using the multer middleware req.files method

    const coverImageLocalPath = req.files?.coverImage?.[0]?.path // accessing the local path of the cover image using multer middleware provided method req.files

    if (!avatarLocalPath) {
        throw new ApiError(400, "Avatar is required")
    }

    // res.json({message : "file received"})

    const avatar = await uploadOnCloudinary(avatarLocalPath)
    const coverImage = await uploadOnCloudinary(coverImageLocalPath)

    // below hum check kar rhe ha ki avatar cloudinary pe upload huwa ya na huwa agar nhi huwa to hum ek error throw kar denge 

    if (!avatar) {
        throw new ApiError(400, "Avatar file is required")
    }


    const user = await User.create({
        fullName,
        avatar: avatar.url,
        coverImage: coverImage?.url || "", // yaha hum coverimage optional rakh rhe kyoki humne coverimage require nhi kiya, agar user coverimage de to url le lenge otherwise empty string store kar denge

        username: username.toLowerCase(),
        email,
        password,
    })

    // below hum check kar rhe ha ki user successfully db me create huwa ha ya nhi huwa wo check krenge using _id (that mongo_db created uniquely for every collection) using findById method aur  sath hi hume password aur refresh token nhi chahiye yaha par to hum wo bhi select method kar use karte remove kar denge(de defauly sabhi selected hote ha to ) ,bss hume select ke andar string me -fieldname that we don't want

    const createdUser = await User.findById(user._id).select(
        "-password -refreshToken"
    )
    
    if (!createdUser) {
        throw new ApiError(500, "Something went wrong while registering a user")
    }

    return res.status(201).json(
        new ApiResponse(
            200, createdUser, "user registered Successfully"
        )
    )

})

export { registerUser }