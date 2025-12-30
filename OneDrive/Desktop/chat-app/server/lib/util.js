import jwt from "jsonwebtoken";

export const generateToken = ()=>{
    const token = jwt.sign({userID}, process.env.JWT_SECRET);
    return token;
}