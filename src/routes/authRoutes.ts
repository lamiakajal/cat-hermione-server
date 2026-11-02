import { Router } from "express";
import {
  register,
  login,
  me,
  updateProfile,
  githubStart,
  githubCallback,
  googleStart,
  googleCallback,
  changePassword,
  providers,
} from "../controllers/authController.js";
import { verifyToken } from "../middlewares/auth.js";

const router = Router();

router.post("/register", register);
router.post("/login", login);
router.get("/me", verifyToken, me);
router.put("/profile", verifyToken, updateProfile);

router.put("/password", verifyToken, changePassword);
router.get("/providers", providers);
router.get("/google", googleStart);
router.get("/google/callback", googleCallback);

router.get("/github", githubStart);
router.get("/github/callback", githubCallback);

export default router;
