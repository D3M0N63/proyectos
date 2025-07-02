// Importa el cliente de PostgreSQL
const { Client } = require('pg');

// La función 'handler' es el punto de entrada para las Netlify Functions.
exports.handler = async (event) => {
    // Permite solicitudes POST para crear y PUT para actualizar
    if (event.httpMethod !== 'POST' && event.httpMethod !== 'PUT') {
        return {
            statusCode: 405,
            headers: { "Access-Control-Allow-Origin": "*" },
            body: JSON.stringify({ error: 'Método no permitido. Solo se aceptan solicitudes POST o PUT.' })
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

        // Validación básica de datos
        if (!productData.id || !productData.name) {
            return {
                statusCode: 400,
                headers: { "Access-Control-Allow-Origin": "*" },
                body: JSON.stringify({ error: 'ID y Nombre del producto son obligatorios.' })
            };
        }

        // Asegúrate de que imagesArray sea un array
        const imagesArray = Array.isArray(productData.images) ? productData.images : [];

        // Asegúrate de que los campos JSONB sean objetos válidos
        const quickspecsObj = productData.quickspecs && typeof productData.quickspecs === 'object' ? productData.quickspecs : {};
        const detailspecsObj = productData.detailspecs && typeof productData.detailspecs === 'object' ? productData.detailspecs : {};
        const moreinfoObj = productData.moreinfo && typeof productData.moreinfo === 'object' ? productData.moreinfo : {};

        await client.connect(); // Establece la conexión a la base de datos

        let queryText;
        let queryParams;
        let successMessage;
        let statusCode;

        if (event.httpMethod === 'POST') {
            // Lógica para INSERT (crear nuevo producto)
            queryText = `
                INSERT INTO products (
                    id, name, brand, price, pricelocal, stockstatus, sku, categories, tags, images, description, quickspecs, detailspecs, moreinfo
                ) VALUES (
                    $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14
                ) RETURNING id;
            `;
            queryParams = [
                productData.id,
                productData.name,
                productData.brand || null,
                productData.price || null,
                productData.pricelocal || null,
                productData.stockstatus || null,
                productData.sku || null,
                productData.categories || null,
                productData.tags || null,
                imagesArray,
                productData.description || null,
                quickspecsObj,
                detailspecsObj,
                moreinfoObj
            ];
            successMessage = 'Producto creado exitosamente';
            statusCode = 200;

        } else if (event.httpMethod === 'PUT') {
            // Lógica para UPDATE (editar producto existente)
            queryText = `
                UPDATE products SET
                    name = $2,
                    brand = $3,
                    price = $4,
                    pricelocal = $5,
                    stockstatus = $6,
                    sku = $7,
                    categories = $8,
                    tags = $9,
                    images = $10,
                    description = $11,
                    quickspecs = $12,
                    detailspecs = $13,
                    moreinfo = $14
                WHERE id = $1
                RETURNING id;
            `;
            queryParams = [
                productData.id, // ID para el WHERE clause
                productData.name,
                productData.brand || null,
                productData.price || null,
                productData.pricelocal || null,
                productData.stockstatus || null,
                productData.sku || null,
                productData.categories || null,
                productData.tags || null,
                imagesArray,
                productData.description || null,
                quickspecsObj,
                detailspecsObj,
                moreinfoObj
            ];
            successMessage = 'Producto actualizado exitosamente';
            statusCode = 200;
        }

        const res = await client.query(queryText, queryParams);

        if (res.rows.length === 0 && event.httpMethod === 'PUT') {
            // Si es un PUT y no se encontró el producto para actualizar
            return {
                statusCode: 404,
                headers: { "Access-Control-Allow-Origin": "*" },
                body: JSON.stringify({ error: `Producto con ID '${productData.id}' no encontrado para actualizar.` })
            };
        }

        // Devuelve una respuesta HTTP 200 (OK) con los datos del producto creado/actualizado.
        return {
            statusCode: statusCode,
            headers: {
                "Access-Control-Allow-Origin": "*",
                "Access-Control-Allow-Methods": "POST, PUT", // Permite POST y PUT
                "Content-Type": "application/json"
            },
            body: JSON.stringify({ message: successMessage, productId: res.rows[0].id })
        };
    } catch (error) {
        console.error('Error al procesar producto en la base de datos:', error);
        if (error.code === '23505') { // PostgreSQL error code for unique_violation (duplicate ID on POST)
            return {
                statusCode: 409,
                headers: { "Access-Control-Allow-Origin": "*" },
                body: JSON.stringify({ error: `El ID de producto '${productData ? productData.id : 'desconocido'}' ya existe. Por favor, use un ID único.` })
            };
        }
        return {
            statusCode: 500,
            headers: {
                "Access-Control-Allow-Origin": "*",
                "Access-Control-Allow-Methods": "POST, PUT",
                "Content-Type": "application/json"
            },
            body: JSON.stringify({ error: `Error interno del servidor al procesar el producto. Detalles: ${error.message || 'Error desconocido'}` })
        };
    } finally {
        await client.end();
    }
};
