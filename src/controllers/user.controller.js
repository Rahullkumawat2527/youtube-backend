import { ApiError } from "../utils/apiError.js"
import { asyncHandler } from "../utils/asyncHandler.js"
import { User } from "../models/user.models.js"
import { uploadOnCloudinary } from "../utils/cloudinary.js"
import { ApiResponse } from "../utils/apiResponse.js"


// below is a function that will generate unique refresh and access token for individual user

const generateAccessAndRefreshToken = async (userId) => {
    try {
        const user = await User.findById(userId)
        const userAccessToken = user.generateAccessToken()
        const userRefreshToken = user.generateRefreshToken()

        // abb hum refersh token apne db me bhi save kar lenge taaki uske basis pe aage access token generate karke user ko de sake
        user.refreshToken = userRefreshToken
        // fir user ko db me save kara do
        // lekin jabb hum save karenge na to uss time pe db unn sab field ko validate karega jo required ha to hum kya karenge ki save method ke andar ek object padd karenge aur usme ek key pass kar denge validateBeforeSave aur uski value false kar denge to isse hoga kya db apna required field ko check nhi karega aur hamara refresh token db ke andar save ho jayega

        await user.save({ validateBeforeSave: false })

        // abb access token and refersh token return dete ha takki user/client ko bhej sake 

        return { userAccessToken, userRefreshToken }


    } catch (error) {
        throw new ApiError(500, "something went wrong while generating access and refresh token")
    }
}

const registerUser = asyncHandler(async (req, res) => {

    // getting user data from frontend
    const { fullName, username, email, password, } = req.body




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

    // const coverImageLocalPath = req.files?.coverImage?.[0]?.path // accessing the local path of the cover image using multer middleware provided method req.files

    // above code with new verified to check if coverimage is passed or not
    let coverImageLocalPath;
    if (req.files && Array.isArray(req.files.coverImage) && req.files.coverImage.length > 0) {
        coverImageLocalPath = req.files.coverImage[0].path
    }


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

const loginUser = asyncHandler(async (req, res) => {
    // take email and password
    // validate karenge ki email and password fill ha na agar nhi ha to hum fill is required ka error de denge
    // then hum check karenge ki user ne pehle signup kiya ha nhi agar nhi to usko hum login page pe redirect kare denge   
    // fir check karenge ki password valid ha ya nhi ha
    // ye email and password hum use karenge then to generate a access token with some expiry time aur wo hum user ko de denge aur saath hi me ek refresh token bhi generate karenge aur wo hum database me save kar lenge
    // access token and refresh token as a secured cookies hum user ko send kar denge
    // fir after expiry time of the access token we generate a new access token after verifying ki refresh token jo db me save ha wo aur jo refresh token client ko diya ha wo same ha ki nhi ha
    // agar same ha to new access token generate kar denge aur agar nhi ha to user agar login kara denge

    const { email, username, password } = req.body

    if (!email || !username) {
        throw new ApiError(400, "email or username is required")
    }

    const user = await User.findOne({
        $or: [{ username }, { email }]
    })

    if (!user) {
        throw new ApiError(404, "user does not exist")
    }

    const isPasswordValid = await user.isPasswordCorrect(password)

    if (!isPasswordValid) {
        throw new ApiError(401, "Password is incorrect or incorrect user credentials")
    }


    const { accessToken, refreshToken } = await generateAccessAndRefreshToken(user._id)


    // yaha hame user ko kya kya bhejna ha wo dekhna ha aur yaha par hum user/client ko password aur refresh token nhi bhejenge

    const loggenInUser = await User.findById(user._id).select(
        "-password -refreshToken"
    )

    // abb hum user ko data cookies me bhejenge to yaha hume nich kuch options configure karne padenge pehle cookies ke

    const options = {
        httpOnly: true,
        secure: true
    }

    return res
        .status(200)
        .cookie("accessToken", accessToken)
        .cookie("refreshToken", refreshToken)
        .json(
            new ApiResponse(
                200,
                {
                    user: loggenInUser, accessToken, refreshToken
                },  // taha hum response me accessToken aur refreshToken is liye bhej ha kya pata user ko locally cookies save karani ho ya wo mobile application develop kar cha rha ho waha cookies set nhi hogi usko response me access token aur response token send kar rhe
                "User logged in Succesfully"

            ))


})

const logoutUser = asyncHandler(async (req, res) => {
    await User.findOneAndUpdate(
        req.user._id,
        {
            $set: {
                refreshToken: undefined
            }
        },
        {
            new: true
        }
    )


    const options = {
        httpOnly: true,
        secure: true
    }

    return res
        .status(200)
        .clearCookie("accessToken", options)
        .clearCookie("refreshToken", options)
        .json(new ApiResponse(200, {}, "User logged out Succesfully"))

})

export { registerUser, loginUser, logoutUser }