import { Router, Request, Response } from 'express';

import * as auth from "../auth";

import { identifier } from "../middlewares/identification";

const router = Router();

// Rutas públicas
router.post("/signup", auth.signup); // registrar un nuevo usuario.
router.post("/signin", auth.signin); // inicia sesión y devuelve un JWT.
router.patch("/send-forgot-password-code", auth.sendForgotPasswordCode);
router.patch("/verify-forgot-password-code", auth.verifyForgotPasswordCode);

// Rutas protegidas (requieren JWT)
router.post("/signout", identifier, auth.signout);
router.patch("/send-verification-code", identifier, auth.sendVerificationCode);
router.patch("/verify-verification-code", identifier, auth.verifyVerificationCode);
router.patch("/change-password", identifier, auth.changePassword);

export default router;