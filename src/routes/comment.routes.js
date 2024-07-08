import { Router } from "express";
import { getAllVideoComment } from "../controllers/comment.controller";
import { verifyJWT } from "../middlewares/auth.middleware";

const router =Router();
router.use(verifyJWT);

//get comment on video
router.route("/getcomment/:videoId").get(getAllVideoComment);






