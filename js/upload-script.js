document.addEventListener('DOMContentLoaded', () => {
    const uploadProductForm = document.getElementById('uploadProductForm');
    const messageDiv = document.getElementById('message');
    const pageTitle = document.getElementById('pageTitle');
    const formHeading = document.getElementById('formHeading');
    const productIdInput = document.getElementById('id');

    const urlParams = new URLSearchParams(window.location.search);
    const productIdToEdit = urlParams.get('product_id'); // Parámetro para editar

    let isEditMode = false;

    // Función para cargar los datos de un producto existente si estamos en modo edición
    async function loadProductForEdit(id) {
        try {
            const response = await fetch(`/.netlify/functions/getProducts?id=${id}`);
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            const products = await response.json();
            if (products.length > 0) {
                const product = products[0];
                
                // Rellenar campos básicos
                productIdInput.value = product.id || '';
                document.getElementById('name').value = product.name || '';
                document.getElementById('brand').value = product.brand || '';
                document.getElementById('price').value = product.price || '';
                document.getElementById('pricelocal').value = product.pricelocal || '';
                document.getElementById('stockstatus').value = product.stockstatus || '';
                document.getElementById('sku').value = product.sku || '';
                document.getElementById('categories').value = product.categories || '';
                document.getElementById('tags').value = product.tags || '';
                document.getElementById('images').value = (product.images && Array.isArray(product.images)) ? product.images.join(', ') : '';
                document.getElementById('description').value = product.description || '';

                // Rellenar campos de Quick Specs (medidas)
                const quickspecs = product.quickspecs || {};
                document.getElementById('quickspecs_largura').value = quickspecs.largura || '';
                document.getElementById('quickspecs_perfil').value = quickspecs.perfil || '';
                document.getElementById('quickspecs_aro').value = quickspecs.aro || ''; // Aro sin 'R'

                // Deshabilitar el campo ID en modo edición
                productIdInput.setAttribute('readonly', true);
                productIdInput.classList.add('bg-gray-200', 'cursor-not-allowed');

                pageTitle.textContent = `Editar Producto: ${product.name || product.id}`;
                formHeading.textContent = `Editar Producto: ${product.name || product.id}`;
                uploadProductForm.querySelector('button[type="submit"]').textContent = 'Actualizar Producto';

                isEditMode = true; // Establecer el modo edición
            } else {
                displayMessage(`Error: Producto con ID '${id}' no encontrado.`, 'error');
                // Podrías redirigir o limpiar el formulario aquí si el producto no existe
            }
        } catch (error) {
            displayMessage(`Error al cargar los datos del producto para edición: ${error.message}`, 'error');
            console.error('Error fetching product for edit:', error);
        }
    }

    // Si hay un ID en la URL, cargar el producto para edición
    if (productIdToEdit) {
        loadProductForEdit(productIdToEdit);
    }

    if (uploadProductForm) {
        uploadProductForm.addEventListener('submit', async (event) => {
            event.preventDefault(); // Previene el envío predeterminado del formulario

            messageDiv.textContent = isEditMode ? 'Actualizando producto...' : 'Subiendo producto...';
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
            if (Object.keys(productData.quickspecs).length === 0) {
                productData.quickspecs = {};
            }

            // Los campos detailspecs y moreinfo se enviarán como objetos vacíos por defecto
            productData.detailspecs = {};
            productData.moreinfo = {};

            try {
                // Determina el método HTTP (POST para crear, PUT para actualizar)
                const httpMethod = isEditMode ? 'PUT' : 'POST';
                const submitButton = uploadProductForm.querySelector('button[type="submit"]');
                submitButton.disabled = true; // Deshabilitar botón para evitar envíos múltiples

                const response = await fetch('/.netlify/functions/uploadProduct', {
                    method: httpMethod,
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify(productData),
                });

                const result = await response.json();

                if (response.ok) {
                    displayMessage(`${isEditMode ? 'Producto actualizado' : 'Producto subido'} exitosamente! ID: ${result.productId}`, 'success');
                    if (!isEditMode) { // Solo resetear el formulario si es una nueva creación
                        uploadProductForm.reset();
                        productIdInput.removeAttribute('readonly'); // Habilitar ID para nueva entrada
                        productIdInput.classList.remove('bg-gray-200', 'cursor-not-allowed');
                        pageTitle.textContent = 'Subir Nuevo Producto';
                        formHeading.textContent = 'Subir Nuevo Producto';
                        submitButton.textContent = 'Subir Producto';
                        isEditMode = false;
                    }
                } else {
                    displayMessage(`Error: ${result.error || 'Error desconocido'}`, 'error');
                    console.error('Error response from server:', result);
                }
            } catch (error) {
                displayMessage('Error de red o del servidor al procesar producto.', 'error');
                console.error('Fetch error:', error);
            } finally {
                uploadProductForm.querySelector('button[type="submit"]').disabled = false; // Re-habilitar botón
            }
        });
    }

    function displayMessage(message, type) {
        messageDiv.textContent = message;
        messageDiv.className = `message-box ${type}`;
        messageDiv.classList.remove('hidden');
    }
});
