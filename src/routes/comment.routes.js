import { Router } from "express";
import { addComment, getAllVideoComment, updateComment } from "../controllers/comment.controller";
import { verifyJWT } from "../middlewares/auth.middleware";

const router =Router();
router.use(verifyJWT);

//get comment on video
router.route("/getcomment/:videoId").get(getAllVideoComment);
router.route("/addComment/:videoId").post(addComment);
router.route("/c/:commentId").delete(deleteComment);
router.route("/c/:commentId").patch(updateComment);

export default router;





