import jwt from "jsonwebtoken";
import Influencer from "../models/Influencer.js";

export const verifyInfluencer = async (req, res, next) => {
  const auth = req.headers.authorization;
  if (!auth || !auth.startsWith("Bearer ")) {
    return res.status(401).json({ message: "Not authorized, no token" });
  }
  try {
    const token = auth.split(" ")[1];
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    if (decoded.role !== "influencer") {
      return res.status(401).json({ message: "Not authorized for influencer portal" });
    }
    const influencer = await Influencer.findById(decoded.id).select("-password");
    if (!influencer) return res.status(401).json({ message: "Influencer not found" });
    if (influencer.status !== "active") {
      return res.status(401).json({ message: "This influencer account is inactive" });
    }
    req.influencer = influencer;
    next();
  } catch {
    res.status(401).json({ message: "Token invalid or expired" });
  }
};

export default verifyInfluencer;
