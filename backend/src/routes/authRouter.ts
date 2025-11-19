import { Router } from 'express';
import * as auth from "../auth";
import { identifier } from "../middlewares/identification";

const router = Router();

// Rutas públicas
router.post("/signup", auth.signup); // registrar un nuevo usuario
router.post("/signin", auth.signin); // inicia sesión y devuelve un JWT

// Rutas protegidas (requieren JWT)
router.post("/signout", identifier, auth.signout); // cerrar sesión
router.patch("/change-password", identifier, auth.changePassword); // cambiar contraseña

export default router;