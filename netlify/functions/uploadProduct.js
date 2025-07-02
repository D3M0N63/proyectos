// Importa el cliente de PostgreSQL
const { Client } = require('pg');

// La función 'handler' es el punto de entrada para las Netlify Functions.
exports.handler = async (event) => {
    // Asegúrate de que la solicitud sea un POST
    if (event.httpMethod !== 'POST') {
        return {
            statusCode: 405,
            headers: { "Access-Control-Allow-Origin": "*" },
            body: JSON.stringify({ error: 'Method Not Allowed. Only POST requests are accepted.' })
        };
    }

    // La cadena de conexión de Neon se almacena de forma segura en las variables de entorno de Netlify.
    // Asegúrate de que DATABASE_URL esté configurada en tu panel de Netlify.
    const client = new Client({
        connectionString: process.env.DATABASE_URL,
        ssl: {
            rejectUnauthorized: false
        }
    });

    let productData; // Declara productData fuera del try para que sea accesible en el catch
    try {
        // Analiza el cuerpo de la solicitud JSON
        productData = JSON.parse(event.body);

        // Validación básica de datos (puedes añadir más validaciones aquí)
        if (!productData.id || !productData.name) {
            return {
                statusCode: 400,
                headers: { "Access-Control-Allow-Origin": "*" },
                body: JSON.stringify({ error: 'ID y Nombre del producto son obligatorios.' })
            };
        }

        // Asegúrate de que imagesArray sea un array, incluso si productData.images es null/undefined
        const imagesArray = Array.isArray(productData.images) ? productData.images : [];

        // Asegúrate de que los campos JSONB sean objetos válidos.
        // Si vienen vacíos del frontend (como {}), o si no se envían, se usarán objetos vacíos.
        const quickspecsObj = productData.quickspecs && typeof productData.quickspecs === 'object' ? productData.quickspecs : {};
        const detailspecsObj = productData.detailspecs && typeof productData.detailspecs === 'object' ? productData.detailspecs : {};
        const moreinfoObj = productData.moreinfo && typeof productData.moreinfo === 'object' ? productData.moreinfo : {};

        await client.connect(); // Establece la conexión a la base de datos

        // Sentencia SQL para insertar un nuevo producto
        // Asegúrate de que el orden de las columnas y los tipos de datos coincidan con tu tabla 'products'
        const queryText = `
            INSERT INTO products (
                id, name, brand, price, pricelocal, stockstatus, sku, categories, tags, images, description, quickspecs, detailspecs, moreinfo
            ) VALUES (
                $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14
            ) RETURNING id;
        `;

        // Parámetros para la consulta SQL
        // Usamos '|| null' para asegurar que los campos opcionales se inserten como NULL si están vacíos o undefined
        const queryParams = [
            productData.id,
            productData.name,
            productData.brand || null,
            productData.price || null,
            productData.pricelocal || null,
            productData.stockstatus || null,
            productData.sku || null,
            productData.categories || null,
            productData.tags || null,
            imagesArray, // Este ya es un array
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
        // Si el error es una violación de clave primaria (ID duplicado), dar un mensaje más específico
        if (error.code === '23505') { // PostgreSQL error code for unique_violation
            return {
                statusCode: 409, // Conflict
                headers: { "Access-Control-Allow-Origin": "*" },
                body: JSON.stringify({ error: `El ID de producto '${productData ? productData.id : 'desconocido'}' ya existe. Por favor, use un ID único.` })
            };
        }
        // Para otros errores 500, puedes intentar enviar un mensaje más detallado si el error lo permite
        return {
            statusCode: 500,
            headers: {
                "Access-Control-Allow-Origin": "*",
                "Access-Control-Allow-Methods": "POST",
                "Content-Type": "application/json"
            },
            body: JSON.stringify({ error: `Error interno del servidor al crear el producto. Detalles: ${error.message || 'Error desconocido'}` })
        };
    } finally {
        // Asegúrate de cerrar la conexión a la base de datos, incluso si ocurre un error.
        await client.end();
    }
};
