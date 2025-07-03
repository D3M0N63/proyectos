document.addEventListener('DOMContentLoaded', async () => {
    const searchResultsContainer = document.getElementById('searchResultsContainer');
    const urlParams = new URLSearchParams(window.location.search);
    const ancho = urlParams.get('ancho');
    const perfil = urlParams.get('perfil');
    const aro = urlParams.get('aro');
    const category = urlParams.get('category');

    // Mostrar los parámetros de búsqueda en el título o en algún lugar visible
    const searchTitle = document.querySelector('h1');
    if (searchTitle) {
        let titleText = 'Resultados de Búsqueda';
        const paramsArray = [];
        if (ancho && ancho !== 'todos') paramsArray.push(`Ancho: ${ancho}`);
        if (perfil && perfil !== 'todos') paramsArray.push(`Perfil: ${perfil}`);
        if (aro && aro !== 'todos') paramsArray.push(`Aro: ${aro}`);
        if (category && category !== 'todos') paramsArray.push(`Categoría: ${category}`);

        if (paramsArray.length > 0) {
            titleText += ` para ${paramsArray.join(', ')}`;
        }
        searchTitle.textContent = titleText;
    }

    // Si no hay ningún criterio de búsqueda significativo, mostrar mensaje
    if ((!ancho || ancho === 'todos') && (!perfil || perfil === 'todos') && (!aro || aro === 'todos') && (!category || category === 'todos')) {
        searchResultsContainer.innerHTML = `
            <p class="no-results">Por favor, ingrese al menos un criterio de búsqueda (ancho, perfil, aro o categoría) diferente de "Todos".</p>
            <a href="index.html" class="text-red-600 hover:underline mt-4">Volver a la página principal</a>
        `;
        return;
    }

    try {
        // Construir la URL de la función de Netlify con los parámetros de búsqueda
        const queryParams = new URLSearchParams();
        if (ancho) queryParams.append('ancho', ancho);
        if (perfil) queryParams.append('perfil', perfil);
        if (aro) queryParams.append('aro', aro);
        if (category) queryParams.append('category', category);

        const response = await fetch(`/.netlify/functions/searchProducts?${queryParams.toString()}`);

        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }

        const products = await response.json();

        searchResultsContainer.innerHTML = ''; // Limpiar el mensaje de "Cargando..."

        if (products.length === 0) {
            searchResultsContainer.innerHTML = `
                <p class="no-results">No se encontraron neumáticos que coincidan con los criterios de búsqueda.</p>
                <a href="index.html" class="text-red-600 hover:underline mt-4">Volver a la página principal</a>
            `;
        } else {
            products.forEach(product => {
                // Generar el mensaje de WhatsApp para el botón "CONTACTO"
                const productNameForWhatsapp = product.name || 'un neumático';
                const whatsappMessage = encodeURIComponent(`Hola! Me interesa el neumático ${productNameForWhatsapp} que vi en su web. ID: ${product.id}`);
                // Reemplaza '595XXXXXXXXX' con el número de WhatsApp real de tu negocio
                const whatsappLink = `https://wa.me/595XXXXXXXXX?text=${whatsappMessage}`;

                const productCardHtml = `
                    <div class="product-result-card w-full">
                        <div class="image-container">
                            <img src="${product.images && product.images.length > 0 ? product.images[0] : 'https://placehold.co/120x120/cccccc/333333?text=Neumatico'}" alt="Neumático ${product.name}" class="product-image-zoom">
                        </div>
                        <div class="product-info-left flex-grow">
                            <p class="name">${product.name || 'Neumático sin nombre'}</p>
                            <p class="price">${product.price || 'N/A'}</p>
                            <p class="price-details">${product.pricelocal || 'N/A'}</p>
                            <!-- El enlace "Ver Detalles" no redirige a product-detail.html ya que está inhabilitado -->
                            <a href="#" class="details-link"> + Ver Detalles</a>
                        </div>
                        <a href="${whatsappLink}" target="_blank" class="buy-button bg-green-500 text-white py-2 px-4 rounded-md font-semibold hover:bg-green-600 transition-colors duration-300 shadow-md">CONTACTO</a>
                    </div>
                `;
                searchResultsContainer.insertAdjacentHTML('beforeend', productCardHtml);
            });
        }
    } catch (error) {
        console.error('Error al cargar los resultados de búsqueda:', error);
        searchResultsContainer.innerHTML = `
            <p class="no-results text-red-600">Error al cargar los resultados. Por favor, intente de nuevo más tarde.</p>
            <a href="index.html" class="text-red-600 hover:underline mt-4">Volver a la página principal</a>
        `;
    }

    // Lógica para los enlaces de categorías en el encabezado de search-results.html
    const categoryLinks = document.querySelectorAll('.categories-nav a[data-category]');
    categoryLinks.forEach(link => {
        link.addEventListener('click', (event) => {
            event.preventDefault(); // Evita la navegación por defecto del enlace
            const selectedCategory = event.target.dataset.category;
            if (selectedCategory) {
                // Redirige a la misma página de resultados, pero con el nuevo parámetro de categoría
                // y limpiando los parámetros de ancho/perfil/aro para una búsqueda solo por categoría
                window.location.href = `search-results.html?category=${selectedCategory}`;
            }
        });
    });

    // Lógica para el botón de menú móvil (si existe)
    const mobileMenuButton = document.getElementById('mobile-menu-button');
    const mobileCategoriesNav = document.getElementById('mobile-categories-nav');

    if (mobileMenuButton && mobileCategoriesNav) {
        mobileMenuButton.addEventListener('click', () => {
            mobileCategoriesNav.classList.toggle('active');
        });
    }
});
