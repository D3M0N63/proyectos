document.addEventListener('DOMContentLoaded', () => {
    const uploadProductForm = document.getElementById('uploadProductForm');
    const messageDiv = document.getElementById('message');
    const pageTitle = document.getElementById('pageTitle');
    const formHeading = document.getElementById('formHeading');
    const productIdInput = document.getElementById('id');
    const loadProductBtn = document.getElementById('loadProductBtn');
    const editProductIdInput = document.getElementById('editProductId');
    const loadMessageDiv = document.getElementById('loadMessage');
    const clearFormBtn = document.getElementById('clearFormBtn');

    // Nuevos elementos para la moneda y categoría
    const priceValueInput = document.getElementById('price_value');
    const priceCurrencySelect = document.getElementById('price_currency');
    const categoriesSelect = document.getElementById('categories'); // El nuevo select de categorías

    let currentProductId = null; // Almacena el ID del producto que se está editando

    // Función para mostrar mensajes en la sección de carga/edición
    function displayLoadMessage(message, type) {
        loadMessageDiv.textContent = message;
        loadMessageDiv.className = `message-box ${type}`;
        loadMessageDiv.classList.remove('hidden');
    }

    // Función para mostrar mensajes en la sección principal del formulario
    function displayFormMessage(message, type) {
        messageDiv.textContent = message;
        messageDiv.className = `message-box ${type}`;
        messageDiv.classList.remove('hidden');
    }

    // Función para pre-llenar el formulario con los datos de un producto
    function populateForm(product) {
        productIdInput.value = product.id || '';
        document.getElementById('name').value = product.name || '';
        document.getElementById('brand').value = product.brand || '';
        
        // Llenar el campo de precio y la moneda
        if (product.price) {
            if (product.price.startsWith('USD')) {
                priceCurrencySelect.value = 'USD';
                priceValueInput.value = product.price.substring(3).trim(); // Quita "USD "
            } else if (product.price.startsWith('Gs.')) {
                priceCurrencySelect.value = 'Gs.';
                priceValueInput.value = product.price.substring(3).trim(); // Quita "Gs. "
            } else {
                priceCurrencySelect.value = 'USD'; // Valor por defecto si no se reconoce
                priceValueInput.value = product.price; // Si no tiene prefijo, se asume el valor completo
            }
        } else {
            priceCurrencySelect.value = 'USD';
            priceValueInput.value = '';
        }

        document.getElementById('pricelocal').value = product.pricelocal || '';
        document.getElementById('stockstatus').value = product.stockstatus || '';
        document.getElementById('sku').value = product.sku || '';
        
        // Llenar el selector de categorías
        if (product.categories) {
            // Asumiendo que categories es un string simple para el select
            categoriesSelect.value = product.categories;
        } else {
            categoriesSelect.value = ''; // Seleccionar la opción por defecto
        }

        document.getElementById('tags').value = product.tags || '';
        document.getElementById('images').value = (product.images && Array.isArray(product.images)) ? product.images.join(', ') : '';
        document.getElementById('description').value = product.description || '';

        const quickspecs = product.quickspecs || {};
        document.getElementById('quickspecs_largura').value = quickspecs.largura || '';
        document.getElementById('quickspecs_perfil').value = quickspecs.perfil || '';
        document.getElementById('quickspecs_aro').value = quickspecs.aro || ''; // Aro sin 'R'
    }

    // Función para limpiar el formulario y volver al modo de creación
    function clearFormAndSwitchToCreateMode() {
        uploadProductForm.reset();
        productIdInput.removeAttribute('readonly');
        productIdInput.classList.remove('bg-gray-200', 'cursor-not-allowed');
        pageTitle.textContent = 'Subir Nuevo Producto';
        formHeading.textContent = 'Subir Nuevo Producto';
        uploadProductForm.querySelector('button[type="submit"]').textContent = 'Subir Producto';
        currentProductId = null; // No hay producto cargado para edición
        displayFormMessage('', 'hidden'); // Limpiar mensajes del formulario
        displayLoadMessage('', 'hidden'); // Limpiar mensajes de carga
        editProductIdInput.value = ''; // Limpiar el campo de ID a editar
        priceCurrencySelect.value = 'USD'; // Resetear selector de moneda
        categoriesSelect.value = ''; // Resetear selector de categoría
    }

    // Lógica para cargar un producto por ID
    loadProductBtn.addEventListener('click', async () => {
        const idToLoad = editProductIdInput.value.trim();
        if (!idToLoad) {
            displayLoadMessage('Por favor, ingrese un ID de producto para cargar.', 'error');
            return;
        }

        displayLoadMessage('Cargando producto...', '');
        try {
            const response = await fetch(`/.netlify/functions/getProducts?id=${idToLoad}`);
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            const products = await response.json();

            if (products.length > 0) {
                const product = products[0];
                populateForm(product);
                currentProductId = product.id; // Establecer el ID del producto que se está editando

                productIdInput.setAttribute('readonly', true); // ID de solo lectura
                productIdInput.classList.add('bg-gray-200', 'cursor-not-allowed');

                pageTitle.textContent = `Editar Producto: ${product.name || product.id}`;
                formHeading.textContent = `Editar Producto: ${product.name || product.id}`;
                uploadProductForm.querySelector('button[type="submit"]').textContent = 'Actualizar Producto';
                displayLoadMessage(`Producto '${product.name || product.id}' cargado para edición.`, 'success');
            } else {
                displayLoadMessage(`Error: Producto con ID '${idToLoad}' no encontrado.`, 'error');
                clearFormAndSwitchToCreateMode(); // Limpiar el formulario si no se encuentra
            }
        } catch (error) {
            displayLoadMessage(`Error al cargar los datos del producto: ${error.message}`, 'error');
            console.error('Error fetching product for edit:', error);
        }
    });

    // Event listener para el botón "Limpiar Formulario"
    clearFormBtn.addEventListener('click', clearFormAndSwitchToCreateMode);


    // Lógica de envío del formulario (Crear o Actualizar)
    if (uploadProductForm) {
        uploadProductForm.addEventListener('submit', async (event) => {
            event.preventDefault();

            displayFormMessage(currentProductId ? 'Actualizando producto...' : 'Subiendo producto...', '');
            
            const productData = {};
            const formData = new FormData(uploadProductForm);

            // Recopila los datos de los campos básicos
            productData.id = formData.get('id');
            productData.name = formData.get('name');
            productData.brand = formData.get('brand');
            
            // Construye el campo de precio con el símbolo seleccionado
            const priceValue = formData.get('price_value').trim();
            const priceCurrency = formData.get('price_currency');
            productData.price = priceValue ? `${priceCurrency} ${priceValue}` : ''; // Formato "USD 89.90" o "Gs. 650000"

            productData.pricelocal = formData.get('pricelocal'); // Este campo se mantiene como texto libre

            productData.stockstatus = formData.get('stockstatus');
            productData.sku = formData.get('sku');
            productData.categories = formData.get('categories'); // Obtener valor del select
            productData.tags = formData.get('tags');
            productData.description = formData.get('description');

            // Procesa el campo 'images' (cadena separada por comas a array)
            if (productData.images = formData.get('images')) {
                productData.images = productData.images.split(',').map(url => url.trim()).filter(url => url !== '');
            } else {
                productData.images = [];
            }

            // Construye el objeto quickspecs con las medidas y la marca
            productData.quickspecs = {
                brand: formData.get('brand'), // Incluir la marca aquí también
                largura: formData.get('quickspecs_largura'),
                perfil: formData.get('quickspecs_perfil'),
                aro: formData.get('quickspecs_aro')
            };

            // Elimina propiedades vacías de quickspecs
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
                const httpMethod = currentProductId ? 'PUT' : 'POST';
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
                    displayFormMessage(`${result.message}! ID: ${result.productId}`, 'success');
                    if (!currentProductId) { // Si fue una nueva creación, limpiar el formulario
                        clearFormAndSwitchToCreateMode();
                    } else {
                        // Si fue una actualización, mantener el formulario pre-llenado pero con mensaje de éxito
                        // y re-habilitar el botón
                        submitButton.disabled = false;
                    }
                } else {
                    displayFormMessage(`Error: ${result.error || 'Error desconocido'}`, 'error');
                    console.error('Error response from server:', result);
                }
            } catch (error) {
                displayFormMessage('Error de red o del servidor al procesar producto.', 'error');
                console.error('Fetch error:', error);
            } finally {
                uploadProductForm.querySelector('button[type="submit"]').disabled = false; // Re-habilitar botón
            }
        });
    }
});
