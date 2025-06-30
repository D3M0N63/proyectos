// Importa el cliente de PostgreSQL. Asegúrate de que 'pg' esté instalado (npm install pg).
const { Client } = require('pg');

// La función 'handler' es el punto de entrada para las Netlify Functions.
exports.handler = async (event) => {
    // La cadena de conexión de Neon se almacena de forma segura en las variables de entorno de Netlify.
    // NUNCA pongas tus credenciales directamente aquí en el código.
    const client = new Client({
        connectionString: process.env.DATABASE_URL, // Netlify inyectará esta variable de entorno
        ssl: {
            rejectUnauthorized: false // Necesario para conexiones SSL con Neon en algunos entornos
        }
    });

    try {
        await client.connect(); // Establece la conexión a la base de datos

        let queryText = 'SELECT * FROM products WHERE 1=1'; // Empezar con una cláusula WHERE siempre verdadera
        let queryParams = [];
        let paramIndex = 1;

        // Verifica si se proporcionó un ID de producto para un producto específico
        if (event.queryStringParameters && event.queryStringParameters.id) {
            queryText += ` AND id = $${paramIndex}`;
            queryParams.push(event.queryStringParameters.id);
            paramIndex++;
        }

        // Verifica si se proporcionaron parámetros de búsqueda por medidas
        const { ancho, perfil, aro } = event.queryStringParameters || {};

        if (ancho && ancho !== 'todos') {
            // Acceso a la propiedad 'largura' dentro del JSONB 'quickSpecs'
            queryText += ` AND quickspecs->>'largura' = $${paramIndex}`;
            queryParams.push(ancho);
            paramIndex++;
        }
        if (perfil && perfil !== 'todos') {
            // Acceso a la propiedad 'perfil' dentro del JSONB 'quickSpecs'
            queryText += ` AND quickspecs->>'perfil' = $${paramIndex}`;
            queryParams.push(perfil);
            paramIndex++;
        }
        if (aro && aro !== 'todos') {
            // Acceso a la propiedad 'aro' dentro del JSONB 'quickSpecs'
            queryText += ` AND quickspecs->>'aro' = $${paramIndex}`;
            queryParams.push(aro);
            paramIndex++;
        }
        
        console.log("Executing query:", queryText, queryParams); // Log para depuración en Netlify

        const res = await client.query(queryText, queryParams); // Ejecuta la consulta SQL

        // Devuelve una respuesta HTTP 200 (OK) con los datos en formato JSON.
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
        console.error('Error al conectar o consultar la base de datos:', error);
        return {
            statusCode: 500,
            headers: {
                "Access-Control-Allow-Origin": "*",
                "Access-Control-Allow-Methods": "GET",
                "Content-Type": "application/json"
            },
            body: JSON.stringify({ error: 'Error al obtener los datos de los productos.' })
        };
    } finally {
        await client.end();
    }
};
