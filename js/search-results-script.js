document.addEventListener('DOMContentLoaded', async () => {
    const searchResultsContainer = document.getElementById('searchResultsContainer');
    const paginationControls = document.getElementById('paginationControls');
    const loadingIndicator = document.getElementById('loadingIndicator'); // Get reference to loading indicator
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
        // Hide loading indicator if no search criteria
        if (loadingIndicator) loadingIndicator.style.display = 'none';
        return;
    }

    // Show loading indicator before fetching products
    if (loadingIndicator) loadingIndicator.style.display = 'block';
    if (searchResultsContainer) searchResultsContainer.innerHTML = ''; // Clear previous results

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
    } finally {
        // Hide loading indicator after fetch completes (success or error)
        if (loadingIndicator) loadingIndicator.style.display = 'none';
    }

    function renderProducts(page) {
        searchResultsContainer.innerHTML = ''; // Clear previous results here too
        const startIndex = (page - 1) * productsPerPage;
        const endIndex = startIndex + productsPerPage;
        const productsToDisplay = allProducts.slice(startIndex, endIndex);

        productsToDisplay.forEach(product => {
            const productNameForWhatsapp = product.name || 'un neumático';
            const whatsappMessage = encodeURIComponent(`Hola! Me interesa el neumático ${productNameForWhatsapp} que vi en su web. ID: ${product.id}`);
            const whatsappLink = `https://wa.me/595983068998?text=${whatsappMessage}`;

            // Determine stock status class
            let stockStatusClass = '';
            let stockStatusText = product.stockstatus || 'N/A';
            if (product.stockstatus === 'En stock') {
                stockStatusClass = 'text-green-600 font-semibold'; // Example green color
            } else if (product.stockstatus === 'Últimas unidades') {
                stockStatusClass = 'text-orange-500 font-semibold'; // Example orange color
            } else if (product.stockstatus === 'Agotado') {
                stockStatusClass = 'text-red-600 font-semibold'; // Example red color
            } else {
                stockStatusClass = 'text-gray-500';
            }

            const productCardHtml = `
                <div class="product-result-card w-full">
                    <div class="image-container">
                        <img src="${product.images && product.images.length > 0 ? product.images[0] : 'https://placehold.co/120x120/cccccc/333333?text=Neumatico'}" alt="Neumático ${product.name}" class="product-image-clickable">
                    </div>
                    <div class="product-info-left flex-grow">
                        <p class="name">${product.name || 'Neumático sin nombre'}</p>
                        <p class="price">${product.price || 'N/A'}</p>
                        <p class="price-details">${product.pricelocal || 'N/A'}</p>
                        <p class="stock-status-display ${stockStatusClass}">${stockStatusText}</p> </div>
                    <a href="${whatsappLink}" target="_blank" class="buy-button bg-green-500 text-white py-2 px-4 rounded-md font-semibold hover:bg-green-600 transition-colors duration-300 shadow-md">CONTACTO</a>
                </div>
            `;
            searchResultsContainer.insertAdjacentHTML('beforeend', productCardHtml);
        });

        attachZoomModalListeners();
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
    let lens = null; // La lupa (ahora se creará y destruirá con el modal)
    const zoomFactor = 1.25; // Factor de ampliación
    const offset = 20; // Desplazamiento de la lupa desde el cursor (en píxeles)

    // Estas funciones se mantendrán puras y no necesitarán ser declaradas dentro de setup/teardown
    function handleMouseEnter(e) {
        const img = e.currentTarget;
        if (!img || !img.src || img.naturalWidth === 0 || img.naturalHeight === 0) {
            if (lens) lens.style.display = 'none';
            return;
        }

        lens.style.backgroundImage = `url('${img.src}')`;
        lens.style.backgroundSize = `${img.naturalWidth * zoomFactor}px ${img.naturalHeight * zoomFactor}px`;
        lens.style.display = 'block';
    }

    function handleMouseMove(e) {
        if (!lens || lens.style.display === 'none') return;

        const img = e.currentTarget;
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

        lens.style.left = `${mouseX + offset}px`;
        lens.style.top = `${mouseY + offset}px`;
    }

    function handleMouseLeave() {
        if (lens) {
            lens.style.display = 'none';
        }
    }

    // --- Lógica para el Modal de Ampliación de Imagen ---
    const imageZoomModal = document.getElementById('imageZoomModal');
    const zoomedImage = document.getElementById('zoomedImage');
    const closeZoomBtn = document.querySelector('.close-zoom-btn');

    function attachZoomModalListeners() {
        const clickableImages = document.querySelectorAll('.product-image-clickable');

        clickableImages.forEach(img => {
            img.removeEventListener('click', openZoomModal);
            img.addEventListener('click', openZoomModal);
        });
    }

    function openZoomModal(event) {
        const clickedImageSrc = event.target.src;
        zoomedImage.src = clickedImageSrc;
        imageZoomModal.classList.add('active');
        document.body.style.overflow = 'hidden';

        // CREAR y adjuntar la lupa solo cuando se abre el modal
        if (!lens) {
            lens = document.createElement('div');
            lens.classList.add('magnifying-lens');
            document.body.appendChild(lens);
        }

        zoomedImage.classList.add('product-image-zoom-modal');
        // Adjuntar listeners de la lupa a la imagen ampliada
        zoomedImage.addEventListener('mouseenter', handleMouseEnter);
        zoomedImage.addEventListener('mouseleave', handleMouseLeave);
        zoomedImage.addEventListener('mousemove', handleMouseMove);
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
        imageZoomModal.classList.remove('active');
        document.body.style.overflow = ''; // RE-ENABLE SCROLLING IMMEDIATELY

        imageZoomModal.addEventListener('transitionend', function handler() {
            if (!imageZoomModal.classList.contains('active')) {
                imageZoomModal.style.display = 'none';
                imageZoomModal.removeEventListener('transitionend', handler);
            }
        }, { once: true });

        if (lens) {
            zoomedImage.removeEventListener('mouseenter', handleMouseEnter);
            zoomedImage.removeEventListener('mouseleave', handleMouseLeave);
            zoomedImage.removeEventListener('mousemove', handleMouseMove);
            lens.remove();
            lens = null;
        }
        zoomedImage.classList.remove('product-image-zoom-modal');
    }
});