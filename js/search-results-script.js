document.addEventListener('DOMContentLoaded', async () => {
    const searchResultsContainer = document.getElementById('searchResultsContainer');
    const paginationControls = document.getElementById('paginationControls');
    const urlParams = new URLSearchParams(window.location.search);
    const ancho = urlParams.get('ancho');
    const perfil = urlParams.get('perfil');
    const aro = urlParams.get('aro');
    const category = urlParams.get('category');

    let allProducts = [];
    const productsPerPage = 8;
    let currentPage = 1;

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
        const queryParams = new URLSearchParams();
        if (ancho) queryParams.append('ancho', ancho);
        if (perfil) queryParams.append('perfil', perfil);
        if (aro) queryParams.append('aro', aro);
        if (category) queryParams.append('category', category);

        const response = await fetch(`/.netlify/functions/searchProducts?${queryParams.toString()}`);

        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }

        allProducts = await response.json();

        if (allProducts.length === 0) {
            searchResultsContainer.innerHTML = `
                <p class="no-results">No se encontraron neumáticos que coincidan con los criterios de búsqueda.</p>
                <a href="index.html" class="text-red-600 hover:underline mt-4">Volver a la página principal</a>
            `;
            paginationControls.classList.add('hidden');
        } else {
            renderProducts(currentPage);
        }
    } catch (error) {
        console.error('Error al cargar los resultados de búsqueda:', error);
        searchResultsContainer.innerHTML = `
            <p class="no-results text-red-600">Error al cargar los resultados. Por favor, intente de nuevo más tarde.</p>
            <a href="index.html" class="text-red-600 hover:underline mt-4">Volver a la página principal</a>
        `;
        paginationControls.classList.add('hidden');
    }

    function renderProducts(page) {
        searchResultsContainer.innerHTML = '';
        const startIndex = (page - 1) * productsPerPage;
        const endIndex = startIndex + productsPerPage;
        const productsToDisplay = allProducts.slice(startIndex, endIndex);

        productsToDisplay.forEach(product => {
            const productNameForWhatsapp = product.name || 'un neumático';
            const whatsappMessage = encodeURIComponent(`Hola! Me interesa el neumático ${productNameForWhatsapp} que vi en su web. ID: ${product.id}`);
            const whatsappLink = `https://wa.me/595983068998?text=${whatsappMessage}`;

            const productCardHtml = `
                <div class="product-result-card w-full">
                    <div class="image-container">
                        <img src="${product.images && product.images.length > 0 ? product.images[0] : 'https://placehold.co/120x120/cccccc/333333?text=Neumatico'}" alt="Neumático ${product.name}" class="product-image-clickable">
                    </div>
                    <div class="product-info-left flex-grow">
                        <p class="name">${product.name || 'Neumático sin nombre'}</p>
                        <p class="price">${product.price || 'N/A'}</p>
                        <p class="price-details">${product.pricelocal || 'N/A'}</p>
                        <a href="#" class="details-link"> + Ver Detalles</a>
                    </div>
                    <a href="${whatsappLink}" target="_blank" class="buy-button bg-green-500 text-white py-2 px-4 rounded-md font-semibold hover:bg-green-600 transition-colors duration-300 shadow-md">CONTACTO</a>
                </div>
            `;
            searchResultsContainer.insertAdjacentHTML('beforeend', productCardHtml);
        });

        attachZoomModalListeners(); // Adjuntar listeners de ampliación a las imágenes de las tarjetas
        renderPaginationControls();
    }

    function renderPaginationControls() {
        paginationControls.innerHTML = '';
        const totalPages = Math.ceil(allProducts.length / productsPerPage);

        if (totalPages <= 1) {
            paginationControls.classList.add('hidden');
            return;
        }

        paginationControls.classList.remove('hidden');

        const prevButton = document.createElement('button');
        prevButton.textContent = 'Anterior';
        prevButton.classList.add('pagination-button');
        prevButton.disabled = currentPage === 1;
        prevButton.addEventListener('click', () => {
            currentPage--;
            renderProducts(currentPage);
            window.scrollTo(0, 0);
        });
        paginationControls.appendChild(prevButton);

        for (let i = 1; i <= totalPages; i++) {
            const pageButton = document.createElement('button');
            pageButton.textContent = i;
            pageButton.classList.add('pagination-button');
            if (i === currentPage) {
                pageButton.classList.add('active');
            }
            pageButton.addEventListener('click', () => {
                currentPage = i;
                renderProducts(currentPage);
                window.scrollTo(0, 0);
            });
            paginationControls.appendChild(pageButton);
        }

        const nextButton = document.createElement('button');
        nextButton.textContent = 'Siguiente';
        nextButton.classList.add('pagination-button');
        nextButton.disabled = currentPage === totalPages;
        nextButton.addEventListener('click', () => {
            currentPage++;
            renderProducts(currentPage);
            window.scrollTo(0, 0);
        });
        paginationControls.appendChild(nextButton);
    }

    const categoryLinks = document.querySelectorAll('.categories-nav a[data-category]');
    categoryLinks.forEach(link => {
        link.addEventListener('click', (event) => {
            event.preventDefault();
            const selectedCategory = event.target.dataset.category;
            if (selectedCategory) {
                window.location.href = `search-results.html?category=${selectedCategory}`;
            }
        });
    });

    const mobileMenuButton = document.getElementById('mobile-menu-button');
    const mobileCategoriesNav = document.getElementById('mobile-categories-nav');

    if (mobileMenuButton && mobileCategoriesNav) {
        mobileMenuButton.addEventListener('click', () => {
            mobileCategoriesNav.classList.toggle('active');
        });
    }

    // --- Lógica para el Efecto de Lupa ---
    let lens = null; // La lupa (compartida para todo el documento)
    const zoomFactor = 1.25; // Factor de ampliación
    const offset = 20; // Desplazamiento de la lupa desde el cursor (en píxeles)

    // Esta función ahora solo es llamada por openZoomModal para la imagen ampliada
    function setupMagnifyingGlassListeners(imgToAttachTo) {
        if (!imgToAttachTo) return;

        // Remover cualquier listener previo para evitar duplicados en esta imagen específica
        imgToAttachTo.removeEventListener('mouseenter', handleMouseEnter);
        imgToAttachTo.removeEventListener('mouseleave', handleMouseLeave);
        imgToAttachTo.removeEventListener('mousemove', handleMouseMove);

        // Añadir los nuevos listeners
        imgToAttachTo.addEventListener('mouseenter', handleMouseEnter);
        imgToAttachTo.addEventListener('mouseleave', handleMouseLeave);
        imgToAttachTo.addEventListener('mousemove', handleMouseMove);
    }

    function handleMouseEnter(e) {
        const img = e.currentTarget; // La imagen es el target directo aquí (será #zoomedImage)
        if (!img || !img.src) return;

        if (img.naturalWidth === 0 || img.naturalHeight === 0) {
            img.onload = () => {
                // Una vez que la imagen cargue, re-ejecutar handleMouseEnter
                handleMouseEnter(e);
            };
            return; // Salir, la función se volverá a llamar cuando la imagen cargue
        }

        // Crea la lupa si no existe
        if (!lens) {
            lens = document.createElement('div');
            lens.classList.add('magnifying-lens');
            document.body.appendChild(lens);
        }

        lens.style.backgroundImage = `url('${img.src}')`;
        lens.style.backgroundSize = `${img.naturalWidth * zoomFactor}px ${img.naturalHeight * zoomFactor}px`;
        lens.style.display = 'block';
    }

    function handleMouseMove(e) {
        if (!lens || lens.style.display === 'none') return;

        const img = e.currentTarget; // La imagen es el target directo aquí
        if (!img || img.naturalWidth === 0 || img.naturalHeight === 0) {
            lens.style.display = 'none';
            return;
        }

        const mouseX = e.clientX;
        const mouseY = e.clientY;

        const imgRect = img.getBoundingClientRect();
        const xInImage = mouseX - imgRect.left;
        const yInImage = mouseY - imgRect.top;

        const ratioX = img.naturalWidth / imgRect.width;
        const ratioY = img.naturalHeight / imgRect.height;

        const bgPosX = -xInImage * zoomFactor * ratioX + (lens.offsetWidth / 2);
        const bgPosY = -yInImage * zoomFactor * ratioY + (lens.offsetHeight / 2);

        lens.style.backgroundPosition = `${bgPosX}px ${bgPosY}px`;

        lens.style.left = `${mouseX + offset}px`; // Ligeramente a la derecha
        lens.style.top = `${mouseY + offset}px`;  // Ligeramente hacia abajo
    }

    function handleMouseLeave() {
        if (lens) {
            lens.style.display = 'none';
        }
    }
    // --- FIN Lógica para el Efecto de Lupa ---

    // --- Lógica para el Modal de Ampliación de Imagen ---
    const imageZoomModal = document.getElementById('imageZoomModal');
    const zoomedImage = document.getElementById('zoomedImage');
    const closeZoomBtn = document.querySelector('.close-zoom-btn');

    function attachZoomModalListeners() {
        const clickableImages = document.querySelectorAll('.product-image-clickable');

        clickableImages.forEach(img => {
            img.removeEventListener('click', openZoomModal); // Remover cualquier listener previo para evitar duplicados
            img.addEventListener('click', openZoomModal);
        });
    }

    function openZoomModal(event) {
        const clickedImageSrc = event.target.src;
        zoomedImage.src = clickedImageSrc;
        imageZoomModal.classList.add('active'); // Usar clase para mostrar con transición
        document.body.style.overflow = 'hidden';

        zoomedImage.classList.add('product-image-zoom-modal'); // Añade la clase para que la lupa la detecte
        setupMagnifyingGlassListeners(zoomedImage); // Llama a setupMagnifyingGlassListeners pasándole la imagen del modal
    }

    if (closeZoomBtn) {
        closeZoomBtn.addEventListener('click', closeZoomModal);
    }
    if (imageZoomModal) {
        imageZoomModal.addEventListener('click', (event) => {
            if (event.target === imageZoomModal) {
                closeZoomModal();
            }
        });
    }

    function closeZoomModal() {
        imageZoomModal.classList.remove('active'); // Remover clase 'active'
        // Esperar a que termine la transición de opacidad antes de ocultar completamente
        imageZoomModal.addEventListener('transitionend', function handler() {
            if (!imageZoomModal.classList.contains('active')) {
                imageZoomModal.style.display = 'none';
                document.body.style.overflow = '';
                imageZoomModal.removeEventListener('transitionend', handler);
            }
        });

        if (lens) {
            lens.style.display = 'none';
        }
        // Limpiar la clase de la imagen del modal y remover sus listeners de lupa
        zoomedImage.classList.remove('product-image-zoom-modal');
        zoomedImage.removeEventListener('mouseenter', handleMouseEnter);
        zoomedImage.removeEventListener('mouseleave', handleMouseLeave);
        zoomedImage.removeEventListener('mousemove', handleMouseMove);
    }
    // --- FIN Lógica para el Modal de Ampliación de Imagen ---
});