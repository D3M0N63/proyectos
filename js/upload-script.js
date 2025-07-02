document.addEventListener('DOMContentLoaded', () => {
    const uploadProductForm = document.getElementById('uploadProductForm');
    const messageDiv = document.getElementById('message');

    if (uploadProductForm) {
        uploadProductForm.addEventListener('submit', async (event) => {
            event.preventDefault(); // Previene el envío predeterminado del formulario

            messageDiv.textContent = 'Subiendo producto...';
            messageDiv.className = 'message-box'; // Limpia clases anteriores
            messageDiv.classList.remove('hidden');

            const formData = new FormData(uploadProductForm);
            const productData = {};

            // Recopila los datos del formulario
            for (const [key, value] of formData.entries()) {
                productData[key] = value;
            }

            // Procesa el campo 'images' (cadena separada por comas a array)
            if (productData.images) {
                productData.images = productData.images.split(',').map(url => url.trim()).filter(url => url !== '');
            } else {
                productData.images = [];
            }

            // Procesa los campos JSONB (cadenas JSON a objetos JavaScript)
            // Es importante que el usuario introduzca JSON válido en el textarea
            try {
                productData.quickspecs = productData.quickspecs ? JSON.parse(productData.quickspecs) : {};
            } catch (e) {
                displayMessage('Error: Quick Specs no es un JSON válido.', 'error');
                console.error('Error parsing quickspecs:', e);
                return; // Detiene el envío si hay un error de JSON
            }

            try {
                productData.detailspecs = productData.detailspecs ? JSON.parse(productData.detailspecs) : {};
            } catch (e) {
                displayMessage('Error: Detail Specs no es un JSON válido.', 'error');
                console.error('Error parsing detailspecs:', e);
                return;
            }

            try {
                productData.moreinfo = productData.moreinfo ? JSON.parse(productData.moreinfo) : {};
            } catch (e) {
                displayMessage('Error: More Info no es un JSON válido.', 'error');
                console.error('Error parsing moreinfo:', e);
                return;
            }

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
