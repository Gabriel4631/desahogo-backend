const express = require("express");
const cors = require("cors");
const { MercadoPagoConfig, Preference } = require("mercadopago");
require("dotenv").config();

const app = express();
const port = process.env.PORT || 3000;

// Configurar middlewares
app.use(cors({
    origin: ['http://localhost:5173', 'https://desahogo-web.web.app'],
    methods: ['GET', 'POST', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization']
}));
app.use(express.json());

// Inicializar configuración de Mercado Pago (CON LA VARIABLE CORRECTA DE RENDER)
const client = new MercadoPagoConfig({
    accessToken: process.env.ACCESS_TOKEN, 
    options: { timeout: 5000 }
});

// Endpoint para crear preferencia de pago
app.post("/create_preference", async (req, res) => {
    try {
        const { title, price, profileId, email } = req.body;

        if (!title || !price) {
            return res.status(400).json({ error: "Faltan datos obligatorios: title o price" });
        }

        const body = {
            items: [
                {
                    id: profileId || "servicio_generico",
                    title: title,
                    quantity: 1,
                    unit_price: Number(price),
                    currency_id: "ARS",
                },
            ],
            payer: {
                // Incorporamos obligatoriamente el payer para evitar el rechazo por políticas de fraude (403)
                email: email || "usuario_generico@desahogo.com",
            },
            back_urls: {
                success: "https://desahogo-web.web.app/mensajes?status=success",
                failure: "https://desahogo-web.web.app/mensajes?status=failure",
                pending: "https://desahogo-web.web.app/mensajes?status=pending",
            },
            auto_return: "approved",
        };

        const preference = new Preference(client);
        const result = await preference.create({ body });

        // Devolvemos solo el ID de preferencia que necesita el frontend
        res.json({ id: result.id });
    } catch (error) {
        console.error("Error al crear preferencia:", error);
        res.status(500).json({ error: "Error al crear la preferencia" });
    }
});

app.get("/", (req, res) => {
    res.send("Microservicio de Pagos de Desahogo activo 🚀");
});

app.listen(port, () => {
    console.log(`✅ Servidor backend escuchando en el puerto ${port}`);
});
