const request = require('supertest');
const nock = require('nock');
const { Pool } = require('pg');
const app = require('../index'); // Importa o app do index.js

jest.mock('pg', () => {
    const mPool = {
        query: jest.fn(),
        end: jest.fn(),
    };
    return { Pool: jest.fn(() => mPool) };
});

describe('Teste de Integração: /process-image', () => {
    it('deve processar a imagem e salvar a medida no banco de dados', async () => {
        const pool = new Pool();
        pool.query.mockResolvedValueOnce(); // Mock da inserção no banco de dados

        const imageBase64 = 'base64string';
        const customer_code = '12345';
        const measure_type = 'temp';

        nock('https://ai.google.dev')
            .post('/gemini-api/v1/vision')
            .reply(200, { measure_value: 42.7 }); // Mock da API externa

        const response = await request(app)
            .post('/process-image')
            .send({ imageBase64, customer_code, measure_type });

        expect(response.statusCode).toBe(200);
        expect(response.body.message).toBe('Medida salva com sucesso!');
        expect(pool.query).toHaveBeenCalledWith(expect.any(String), expect.any(Array));
    });

    it('deve retornar erro se a API falhar', async () => {
        nock('https://ai.google.dev')
            .post('/gemini-api/v1/vision')
            .reply(500); // Simular falha da API externa

        const response = await request(app)
            .post('/process-image')
            .send({ imageBase64: 'base64string', customer_code: '12345', measure_type: 'temp' });

        expect(response.statusCode).toBe(500);
        expect(response.body.error).toBe('Erro ao processar a imagem');
    });
});