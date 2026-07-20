import express from "express";

const router = express.Router();

router.post("/register", (req, res) => {
    res.json({
        message: "Module inscription UNITÉ 360 prêt"
    });
});

router.post("/login", (req, res) => {
    res.json({
        message: "Module connexion UNITÉ 360 prêt"
    });
});

export default router;
