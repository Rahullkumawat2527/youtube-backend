import { User } from "../models/user.models";
import { ApiError } from "../utils/apiError";
import { asyncHandler } from "../utils/asyncHandler";
import jwt from "jsonwebtoken"



const verifyJWT = asyncHandler(async (req, _, next) => {

    try {
        // pehle hum token lenge user/client se to verify
        const token = req.Cookie?.accessToken || req.header("Authorization").replace("Bearer ", "")

        // agar token nhi ha user ke pass to hum usko access nhi denge
        if (!token) {
            throw new ApiError(401, "Unauthorized user")
        }

        // agar token ha user ke pass to hum verify karenge ki ye token valid ha ya nhi h usko decode karke using jwt.verify()

        const decodedToken = jwt.verify(token, process.env.ACCESS_TOKEN_SECRET)

        const user = await User.findById(decodedToken?._id).select("-password -refreshToken")

        // agar user nhi means uske pass invalid access token ha
        if (!user) {
            throw new ApiError(401, "Invalid Access Token")
        }

        req.user = user
        next()


    } catch (error) {
        throw new ApiError(401, error?.message || "Invalid Access Token")
    }

})

export { verifyJWT }