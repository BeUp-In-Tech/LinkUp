import { Router } from "express";
import { checkAuth } from "../../middlewares/auth.middleware";
import { Role } from "../users/user.interface";
import { trendingControlers } from "./trending.controller";

const router = Router();

router.get('/', checkAuth(...Object.keys(Role)), trendingControlers.getTrendingEvents);

export const trendingRouter = router;