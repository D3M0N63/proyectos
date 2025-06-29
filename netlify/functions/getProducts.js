    const { Client } = require('pg');

    exports.handler = async (event) => {
        const client = new Client({
            connectionString: process.env.DATABASE_URL,
            ssl: {
                rejectUnauthorized: false
            }
        });

        try {
            await client.connect();

            let queryText = 'SELECT * FROM products';
            let queryParams = [];

            if (event.queryStringParameters && event.queryStringParameters.id) {
                queryText = 'SELECT * FROM products WHERE id = $1';
                queryParams = [event.queryStringParameters.id];
            }

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
    