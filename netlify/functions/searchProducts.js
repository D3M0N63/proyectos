// Importa el cliente de PostgreSQL
const { Client } = require('pg');

exports.handler = async (event) => {
    // Solo permitimos solicitudes GET para esta función de búsqueda
    if (event.httpMethod !== 'GET') {
        return {
            statusCode: 405,
            headers: { "Access-Control-Allow-Origin": "*" },
            body: JSON.stringify({ error: 'Method Not Allowed. Only GET requests are accepted.' })
        };
    }

    const client = new Client({
        connectionString: process.env.DATABASE_URL, // Asegúrate de que esta variable esté configurada en Netlify
        ssl: {
            rejectUnauthorized: false
        }
    });

    try {
        await client.connect();

        const { ancho, perfil, aro } = event.queryStringParameters || {};

        // Construir la consulta SQL dinámicamente
        // Usamos WHERE 1=1 para facilitar la adición de condiciones con AND
        let queryText = 'SELECT * FROM products WHERE 1=1';
        const queryParams = [];
        let paramIndex = 1;

        // Añadir condiciones de búsqueda si los parámetros están presentes y no son 'todos'
        // Usamos ILIKE para búsquedas insensibles a mayúsculas/minúsculas y % para coincidencias parciales
        // Los campos quickspecs.largura, perfil, aro son de tipo texto en el JSONB
        if (ancho && ancho !== 'todos') {
            queryText += ` AND quickspecs->>'largura' ILIKE $${paramIndex}`;
            queryParams.push(`%${ancho}%`);
            paramIndex++;
        }
        if (perfil && perfil !== 'todos') {
            queryText += ` AND quickspecs->>'perfil' ILIKE $${paramIndex}`;
            queryParams.push(`%${perfil}%`);
            paramIndex++;
        }
        if (aro && aro !== 'todos') {
            // Manejar 'R16' vs '16' para el aro
            const cleanAro = aro.startsWith('R') ? aro.substring(1) : aro;
            queryText += ` AND quickspecs->>'aro' ILIKE $${paramIndex}`;
            queryParams.push(`%${cleanAro}%`); // Busca el número, asumiendo que en DB es solo el número
            paramIndex++;
        }

        // Ordenar los resultados (opcional, pero ayuda a la consistencia)
        queryText += ' ORDER BY name ASC';

        const res = await client.query(queryText, queryParams);

        return {
            statusCode: 200,
            headers: {
                "Access-Control-Allow-Origin": "*",
                "Access-Control-Allow-Methods": "GET",
                "Content-Type": "application/json"
            },
            body: JSON.stringify(res.rows)
        };
    } catch (error) {
        console.error('Error al buscar productos:', error);
        return {
            statusCode: 500,
            headers: {
                "Access-Control-Allow-Origin": "*",
                "Access-Control-Allow-Methods": "GET",
                "Content-Type": "application/json"
            },
            body: JSON.stringify({ error: 'Error al realizar la búsqueda de productos.' })
        };
    } finally {
        await client.end();
    }
};
