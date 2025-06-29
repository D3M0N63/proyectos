// Importa el cliente de PostgreSQL. Asegúrate de que 'pg' esté instalado (npm install pg).
const { Client } = require('pg');

// La función 'handler' es el punto de entrada para las Netlify Functions.
exports.handler = async (event) => {
    // La cadena de conexión de Neon se almacena de forma segura en las variables de entorno de Netlify.
    // NUNCA pongas tus credenciales directamente aquí en el código.
    const client = new Client({
        connectionString: process.env.DATABASE_URL, // Netlify inyectará esta variable de entorno
        ssl: {
            // 'rejectUnauthorized: false' es a menudo necesario para conexiones SSL
            // con bases de datos como Neon desde entornos serverless.
            rejectUnauthorized: false 
        }
    });

    try {
        await client.connect(); // Establece la conexión a la base de datos

        let queryText = 'SELECT * FROM products'; // Consulta para obtener todos los productos por defecto
        let queryParams = []; // Parámetros para la consulta (vacío por defecto)

        // Verifica si se proporcionó un ID de producto en la URL de la función.
        // Ejemplo: /.netlify/functions/getProducts?id=np307
        if (event.queryStringParameters && event.queryStringParameters.id) {
            queryText = 'SELECT * FROM products WHERE id = $1'; // Consulta para un producto específico
            queryParams = [event.queryStringParameters.id]; // El ID del producto se pasa como parámetro
        }

        const res = await client.query(queryText, queryParams); // Ejecuta la consulta SQL

        // Devuelve una respuesta HTTP 200 (OK) con los datos en formato JSON.
        // Los headers son importantes para CORS (Cross-Origin Resource Sharing)
        // para permitir que tu frontend (que está en un "origen" diferente a la función)
        // pueda acceder a ella.
        return {
            statusCode: 200,
            headers: {
                "Access-Control-Allow-Origin": "*", // Permite solicitudes desde cualquier dominio
                "Access-Control-Allow-Methods": "GET", // Permite el método GET
                "Content-Type": "application/json" // Indica que la respuesta es JSON
            },
            body: JSON.stringify(res.rows) // Convierte los resultados de la base de datos a una cadena JSON
        };
    } catch (error) {
        // En caso de error, registra el error y devuelve una respuesta HTTP 500 (Error Interno del Servidor).
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
        // Asegúrate de cerrar la conexión a la base de datos, incluso si ocurre un error.
        await client.end();
    }
};
