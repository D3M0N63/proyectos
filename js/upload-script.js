document.addEventListener('DOMContentLoaded', () => {
    const uploadProductForm = document.getElementById('uploadProductForm');
    const messageDiv = document.getElementById('message');

    if (uploadProductForm) {
        uploadProductForm.addEventListener('submit', async (event) => {
            event.preventDefault(); // Previene el envío predeterminado del formulario

            messageDiv.textContent = 'Subiendo producto...';
            messageDiv.className = 'message-box'; // Limpia clases anteriores
            messageDiv.classList.remove('hidden');

            const productData = {};
            const formData = new FormData(uploadProductForm);

            // Recopila los datos de los campos básicos
            productData.id = formData.get('id');
            productData.name = formData.get('name');
            productData.brand = formData.get('brand');
            productData.price = formData.get('price');
            productData.pricelocal = formData.get('pricelocal');
            productData.stockstatus = formData.get('stockstatus');
            productData.sku = formData.get('sku');
            productData.categories = formData.get('categories');
            productData.tags = formData.get('tags');
            productData.description = formData.get('description');

            // Procesa el campo 'images' (cadena separada por comas a array)
            if (productData.images = formData.get('images')) {
                productData.images = productData.images.split(',').map(url => url.trim()).filter(url => url !== '');
            } else {
                productData.images = [];
            }

            // Construye el objeto quickspecs solo con los campos de medidas
            productData.quickspecs = {
                largura: formData.get('quickspecs_largura'),
                perfil: formData.get('quickspecs_perfil'),
                aro: formData.get('quickspecs_aro')
            };

            // Elimina propiedades vacías de quickspecs para no guardar "key: ''"
            for (const key in productData.quickspecs) {
                if (productData.quickspecs[key] === '') {
                    delete productData.quickspecs[key];
                }
            }
            // Si quickspecs queda vacío después de eliminar las propiedades vacías,
            // asegúrate de que sea un objeto vacío para la DB, no null.
            if (Object.keys(productData.quickspecs).length === 0) {
                productData.quickspecs = {};
            }


            // Los campos detailspecs y moreinfo se enviarán como objetos vacíos por defecto
            productData.detailspecs = {};
            productData.moreinfo = {};


            try {
                // Envía los datos a la función de Netlify
                const response = await fetch('/.netlify/functions/uploadProduct', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify(productData),
                });

                const result = await response.json();

                if (response.ok) {
                    displayMessage(`Producto "${result.productId}" subido exitosamente!`, 'success');
                    uploadProductForm.reset(); // Limpia el formulario después del éxito
                } else {
                    displayMessage(`Error al subir producto: ${result.error || 'Error desconocido'}`, 'error');
                    console.error('Error response from server:', result);
                }
            } catch (error) {
                displayMessage('Error de red o del servidor al subir producto.', 'error');
                console.error('Fetch error:', error);
            }
        });
    }

    function displayMessage(message, type) {
        messageDiv.textContent = message;
        messageDiv.className = `message-box ${type}`;
        messageDiv.classList.remove('hidden');
    }
});
