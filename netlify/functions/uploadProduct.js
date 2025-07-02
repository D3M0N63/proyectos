// Importa el cliente de PostgreSQL
const { Client } = require('pg');

// La función 'handler' es el punto de entrada para las Netlify Functions.
exports.handler = async (event) => {
    // Asegúrate de que la solicitud sea un POST
    if (event.httpMethod !== 'POST') {
        return {
            statusCode: 405,
            headers: { "Access-Control-Allow-Origin": "*" },
            body: JSON.stringify({ error: 'Método no permitido. Solo se aceptan solicitudes POST.' })
        };
    }

    // La cadena de conexión de Neon se almacena de forma segura en las variables de entorno de Netlify.
    // Asegúrate de que DATABASE_URL esté configurada en tu panel de Netlify.
    const client = new Client({
        connectionString: process.env.DATABASE_URL,
        ssl: {
            // 'rejectUnauthorized: false' es a menudo necesario para conexiones SSL
            // con bases de datos como Neon desde entornos serverless.
            rejectUnauthorized: false
        }
    });

    try {
        // Analiza el cuerpo de la solicitud JSON
        const productData = JSON.parse(event.body);

        // Validación básica de datos (puedes añadir más validaciones aquí)
        if (!productData.id || !productData.name) {
            return {
                statusCode: 400,
                headers: { "Access-Control-Allow-Origin": "*" },
                body: JSON.stringify({ error: 'ID y Nombre del producto son obligatorios.' })
            };
        }

        // Convierte la cadena de imágenes separadas por coma en un array
        // Si no hay imágenes, se usa un array vacío
        const imagesArray = productData.images ? productData.images.split(',').map(url => url.trim()) : [];

        // Asegúrate de que los campos JSONB sean objetos JavaScript válidos
        // Si no son JSON válicos, se usarán objetos vacíos para evitar errores
        let quickspecsObj = {};
        try {
            quickspecsObj = productData.quickspecs ? JSON.parse(productData.quickspecs) : {};
        } catch (e) {
            console.warn('Quick Specs no es un JSON válido, usando objeto vacío.');
        }

        let detailspecsObj = {};
        try {
            detailspecsObj = productData.detailspecs ? JSON.parse(productData.detailspecs) : {};
        } catch (e) {
            console.warn('Detail Specs no es un JSON válido, usando objeto vacío.');
        }

        let moreinfoObj = {};
        try {
            moreinfoObj = productData.moreinfo ? JSON.parse(productData.moreinfo) : {};
        } catch (e) {
            console.warn('More Info no es un JSON válido, usando objeto vacío.');
        }


        await client.connect(); // Establece la conexión a la base de datos

        // Sentencia SQL para insertar un nuevo producto
        const queryText = `
            INSERT INTO products (
                id, name, brand, price, pricelocal, stockstatus, sku, categories, tags, images, description, quickspecs, detailspecs, moreinfo
            ) VALUES (
                $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14
            ) RETURNING id;
        `;

        // Parámetros para la consulta SQL
        const queryParams = [
            productData.id,
            productData.name,
            productData.brand || null, // Usar null si el campo está vacío
            productData.price || null,
            productData.pricelocal || null,
            productData.stockstatus || null,
            productData.sku || null,
            productData.categories || null,
            productData.tags || null,
            imagesArray, // Array de URLs
            productData.description || null,
            quickspecsObj, // Objeto JSON
            detailspecsObj, // Objeto JSON
            moreinfoObj // Objeto JSON
        ];

        const res = await client.query(queryText, queryParams); // Ejecuta la consulta SQL

        // Devuelve una respuesta HTTP 200 (OK) con los datos del producto creado.
        return {
            statusCode: 200,
            headers: {
                "Access-Control-Allow-Origin": "*", // Permite solicitudes desde cualquier dominio
                "Access-Control-Allow-Methods": "POST", // Permite el método POST
                "Content-Type": "application/json" // Indica que la respuesta es JSON
            },
            body: JSON.stringify({ message: 'Producto creado exitosamente', productId: res.rows[0].id })
        };
    } catch (error) {
        // En caso de error, registra el error y devuelve una respuesta HTTP 500 (Error Interno del Servidor).
        console.error('Error al crear producto en la base de datos:', error);
        return {
            statusCode: 500,
            headers: {
                "Access-Control-Allow-Origin": "*",
                "Access-Control-Allow-Methods": "POST",
                "Content-Type": "application/json"
            },
            body: JSON.stringify({ error: 'Error al crear el producto. Verifique los datos e intente de nuevo.' })
        };
    } finally {
        // Asegúrate de cerrar la conexión a la base de datos, incluso si ocurre un error.
        await client.end();
    }
};
