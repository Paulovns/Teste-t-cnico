require('dotenv').config(); // Carrega variáveis do arquivo .env
const express = require('express');
const bodyParser = require('body-parser');
const axios = require('axios');
const { Pool } = require('pg');
const { v4: uuidv4 } = require('uuid');

const app = express();
app.use(bodyParser.json()); // Para suportar JSON-encoded bodies

// Configuração da porta
const PORT = process.env.PORT || 3000;

// Configuração do pool de conexões com o PostgreSQL
const pool = new Pool({
    user: 'usuario',
    host: 'localhost',
    database: 'minha-base-de-dados',
    password: '0852123',
    port: 5432,
});

// Função para salvar a medida no banco de dados
async function saveMeasure(data) {
    const query = `
        INSERT INTO measures 
        (measure_uuid, customer_code, measure_datetime, measure_type, measure_value, image_url) 
        VALUES ($1, $2, $3, $4, $5, $6)
    `;
    const values = [
        data.measure_uuid, 
        data.customer_code, 
        data.measure_datetime, 
        data.measure_type, 
        data.measure_value, 
        data.image_url
    ];
    try {
        await pool.query(query, values);
    } catch (err) {
        console.error('Erro ao salvar a medida no banco de dados:', err);
        throw new Error('Erro ao salvar a medida');
    }
}

// Função para consultar a API do Google Gemini
async function getMeasureValueFromImage(imageBase64) {
    try {
        const response = await axios.post(
            'https://ai.google.dev/gemini-api/v1/vision',
            {
                image: imageBase64
            },
            {
                headers: {
                    'Authorization': `Bearer ${process.env.GEMINI_API_KEY}`, // Usa a chave da API do .env
                }
            }
        );
        return response.data.measure_value;
    } catch (error) {
        console.error('Erro ao consultar a API LLM:', error);
        throw new Error('Erro ao processar a imagem');
    }
}

// Rota para processar imagem e salvar dados
app.post('/process-image', async (req, res) => {
    const { imageBase64, customer_code, measure_type } = req.body;
    try {
        const measure_value = await getMeasureValueFromImage(imageBase64);
        const data = {
            measure_uuid: uuidv4(),
            customer_code,
            measure_datetime: new Date(),
            measure_type,
            measure_value,
            image_url: 'http://example.com/image.png', // Simulação de URL da imagem
        };
        await saveMeasure(data);
        res.status(200).json({ message: 'Medida salva com sucesso!' });
    } catch (error) {
        res.status(500).json({ error: 'Erro ao processar a imagem' });
    }
});

// Iniciar o servidor
app.listen(PORT, () => {
    console.log(`Servidor rodando na porta ${PORT}`);
});

module.exports = app; // Exporta o app para ser utilizado nos testes