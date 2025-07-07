document.addEventListener('DOMContentLoaded', () => {
    // --- CÓDIGO RELACIONADO A NEWSLETTER POPUP ELIMINADO ---
    // Este bloque de código ha sido ELIMINADO completamente para evitar el TypeError.
    // No hay referencias a newsletterPopup ni closeBtn aquí.

    const searchButton = document.querySelector('.tire-search-by-size .btn-search');
    if (searchButton) {
        searchButton.addEventListener('click', () => {
            const ancho = document.getElementById('ancho') ? document.getElementById('ancho').value : '';
            const perfil = document.getElementById('perfil') ? document.getElementById('perfil').value : '';
            const aro = document.getElementById('aro') ? document.getElementById('aro').value : '';

            window.location.href = `search-results.html?ancho=${ancho}&perfil=${perfil}&aro=${aro}`;
        });
    }

    const accordionHeaders = document.querySelectorAll('.accordion-header');
    accordionHeaders.forEach(header => {
        header.addEventListener('click', () => {
            accordionHeaders.forEach(otherHeader => {
                if (otherHeader !== header && otherHeader.classList.contains('active')) {
                    otherHeader.classList.remove('active');
                    otherHeader.nextElementSibling.style.maxHeight = 0;
                }
            });

            header.classList.toggle('active');
            const accordionContent = header.nextElementSibling;

            if (accordionContent.style.maxHeight) {
                accordionContent.style.maxHeight = null;
            } else {
                accordionContent.style.maxHeight = accordionContent.scrollHeight + "px";
            }
        });
    });

    function renderFeaturedProductsGrid(products) {
        const featuredProductsGrid = document.getElementById('featuredProductsGrid');
        if (!featuredProductsGrid) return;

        featuredProductsGrid.innerHTML = '';

        const productsToShuffle = [...products];
        productsToShuffle.sort(() => 0.5 - Math.random());

        const productsToShow = productsToShuffle.slice(0, 12);

        if (productsToShow.length === 0) {
            featuredProductsGrid.innerHTML = '<p class="text-center text-gray-600">No hay productos destacados disponibles.</p>';
            return;
        }

        productsToShow.forEach(product => {
            const productCardHtml = `
                <div class="product-card">
                    <div class="image-container">
                        <img src="${product.images && product.images.length > 0 ? product.images[0] : 'https://placehold.co/150x150/cccccc/333333?text=No+Image'}" alt="Neumático ${product.name}" class="product-image-clickable">
                    </div>
                    <div class="product-info">
                        <p class="brand">${product.quickspecs && product.quickspecs.brand ? product.quickspecs.brand : 'N/A'}</p>
                        <p class="model">${product.name}</p>
                        <p class="price">${product.price}</p>
                        <p class="price-local">(${product.pricelocal && product.pricelocal.split(' / ')[0] ? product.pricelocal.split(' / ')[0] : 'N/A'})</p>
                    </div>
                </div>
            `;
            featuredProductsGrid.insertAdjacentHTML('beforeend', productCardHtml);
        });

        const productCards = featuredProductsGrid.querySelectorAll('.product-card');
        if (productCards.length > 0) {
            let maxHeight = 0;
            productCards.forEach(card => {
                card.style.minHeight = 'auto';
            });
            productCards.forEach(card => {
                if (card.offsetHeight > maxHeight) {
                    maxHeight = card.offsetHeight;
                }
            });
            productCards.forEach(card => {
                card.style.minHeight = `${maxHeight}px`;
            });
        }

        attachZoomModalListeners(); // Adjuntar listeners de clic para el modal a las imágenes de las tarjetas
    }

    async function fetchAllProducts() {
        try {
            const response = await fetch('/.netlify/functions/getProducts');
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            const products = await response.json();
            console.log('Productos obtenidos del backend:', products);
            renderFeaturedProductsGrid(products);
            return products;
        } catch (error) {
            console.error('Error fetching all products:', error);
            const featuredProductsGrid = document.getElementById('featuredProductsGrid');
            if (featuredProductsGrid) {
                featuredProductsGrid.innerHTML = '<p class="text-center text-gray-600">Error al cargar los productos. Por favor, intente de nuevo más tarde.</p>';
            }
            return [];
        }
    }

    async function fetchProductById(id) {
        try {
            const response = await fetch(`/.netlify/functions/getProducts?id=${id}`);
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            const products = await response.json();
            if (products.length > 0) {
                return products[0];
            } else {
                return null;
            }
        } catch (error) {
            console.error(`Error fetching product with ID ${id}:`, error);
            return null;
        }
    }

    if (window.location.pathname.includes('product-detail.html')) {
        const productDetailContainer = document.querySelector('.product-detail-container');
        if (productDetailContainer) {
            productDetailContainer.innerHTML = `
                <h2 class="text-2xl font-bold text-center text-gray-800 mb-4">Página de Detalle de Producto No Disponible.</h2>
                <p class="text-center text-gray-600">Lo sentimos, esta funcionalidad ha sido deshabilitada.</p>
                <a href="index.html" class="block text-center mt-4 text-red-600 hover:underline">Volver a la página principal</a>
            `;
            const productTabsSection = document.querySelector('.product-tabs-section');
            if (productTabsSection) productTabsSection.style.display = 'none';
            const relatedProductsSection = document.querySelector('.related-products');
            if (relatedProductsSection) relatedProductsSection.style.display = 'none';
        }
    } else {
        fetchAllProducts();
    }

    async function loadProductDetail(id) {
        const product = await fetchProductById(id);
        if (product) {
            const productNameElement = document.getElementById('product-name');
            if (productNameElement) productNameElement.textContent = product.name || 'N/A';

            const productPriceElement = document.getElementById('product-price');
            if (productPriceElement) productPriceElement.textContent = product.price || 'N/A';

            const productPriceLocalElement = document.getElementById('product-price-local');
            if (productPriceLocalElement) productPriceLocalElement.textContent = product.pricelocal || 'N/A';

            const stockStatusElement = document.getElementById('stock-status');
            if (stockStatusElement) {
                stockStatusElement.textContent = product.stockstatus || 'N/A';
                stockStatusElement.classList.remove('in-stock', 'low-stock', 'out-of-stock');
                if (product.stockstatus === 'En stock') {
                    stockStatusElement.classList.add('in-stock');
                } else if (product.stockstatus === 'Últimas unidades') {
                    stockStatusElement.classList.add('low-stock');
                } else {
                    stockStatusElement.classList.add('out-of-stock');
                }
            }

            const productSkuElement = document.getElementById('product-sku');
            if (productSkuElement) productSkuElement.textContent = product.sku || 'N/A';

            const productCategoriesElement = document.getElementById('product-categories');
            if (productCategoriesElement) productCategoriesElement.textContent = product.categories || 'N/A';

            const productTagsElement = document.getElementById('product-tags');
            if (productTagsElement) productTagsElement.textContent = product.tags || 'N/A';

            const quickspecs = product.quickspecs || {};
            const productBrandElement = document.getElementById('product-brand');
            if (productBrandElement) productBrandElement.textContent = quickspecs.brand || 'N/A';

            const productLarguraElement = document.getElementById('product-largura');
            if (productLarguraElement) productLarguraElement.textContent = quickspecs.largura || 'N/A';

            const productPerfilElement = document.getElementById('product-perfil');
            if (productPerfilElement) productPerfilElement.textContent = quickspecs.perfil || 'N/A';

            const productAroElement = document.getElementById('product-aro');
            if (productAroElement) productAroElement.textContent = quickspecs.aro || 'N/A';

            const productLoadIndexElement = document.getElementById('product-load-index');
            if (productLoadIndexElement) productLoadIndexElement.textContent = quickspecs.loadIndex || 'N/A';

            const productSpeedIndexElement = document.getElementById('product-speed-index');
            if (productSpeedIndexElement) productSpeedIndexElement.textContent = quickspecs.speedIndex || 'N/A';

            const detailspecs = product.detailspecs || {};
            const detailsTabHeading = document.querySelector('#details h3');
            if (detailsTabHeading) detailsTabHeading.textContent = `Detalles del ${product.name || 'Producto'}`;

            const productDescriptionElement = document.querySelector('#details p.product-description');
            if (productDescriptionElement) productDescriptionElement.textContent = product.description || 'No hay descripción disponible.';

            const detailMeasureElement = document.getElementById('detail-measure');
            if (detailMeasureElement) detailMeasureElement.textContent = detailspecs.measure || 'N/A';

            const detailLoadIndexElement = document.getElementById('detail-load-index');
            if (detailLoadIndexElement) detailLoadIndexElement.textContent = detailspecs.loadIndex || 'N/A';

            const detailSpeedIndexElement = document.getElementById('detail-speed-index');
            if (detailSpeedIndexElement) detailSpeedIndexElement.textContent = detailspecs.speedIndex || 'N/A';

            const detailVehicleTypeElement = document.getElementById('detail-vehicle-type');
            if (detailVehicleTypeElement) detailVehicleTypeElement.textContent = detailspecs.vehicleType || 'N/A';

            const detailTreadDesignElement = document.getElementById('detail-tread-design');
            if (detailTreadDesignElement) detailTreadDesignElement.textContent = detailspecs.treadDesign || 'N/A';

            const detailWarrantyElement = document.getElementById('detail-warranty');
            if (detailWarrantyElement) detailWarrantyElement.textContent = detailspecs.warranty || 'N/A';

            const moreinfo = product.moreinfo || {};
            const moreInfoLoadIndexElement = document.getElementById('more-info-load-index');
            if (moreInfoLoadIndexElement) moreInfoLoadIndexElement.textContent = moreinfo.loadIndex || 'N/A';

            const moreInfoSpeedIndexElement = document.getElementById('more-info-speed-index');
            if (moreInfoSpeedIndexElement) moreInfoSpeedIndexElement.textContent = moreinfo.speedIndex || 'N/A';

            const moreInfoTypeElement = document.getElementById('more-info-type');
            if (moreInfoTypeElement) moreInfoTypeElement.textContent = moreinfo.type || 'N/A';

            const moreInfoConstructionElement = document.getElementById('more-info-construction');
            if (moreInfoConstructionElement) moreInfoConstructionElement.textContent = moreinfo.construction || 'N/A';

            const moreInfoApplicationElement = document.getElementById('more-info-application');
            if (moreInfoApplicationElement) moreInfoApplicationElement.textContent = moreinfo.application || 'N/A';

            const moreInfoLettersElement = document.getElementById('more-info-letters');
            if (moreInfoLettersElement) moreInfoLettersElement.textContent = moreinfo.letters || 'N/A';

            const efficiencyLabelDiv = document.querySelector('.efficiency-label');
            if (efficiencyLabelDiv) {
                efficiencyLabelDiv.style.display = 'none';
            }


            const images = product.images || [];
            const mainProductImage = document.getElementById('main-product-image');
            if (mainProductImage) {
                mainProductImage.src = images.length > 0 ? images[0] : 'https://placehold.co/400x400/cccccc/333333?text=No+Image';
            }

            const thumbnailGalleryDiv = document.querySelector('.thumbnail-gallery');
            if (thumbnailGalleryDiv) {
                thumbnailGalleryDiv.innerHTML = '';

                if (images.length > 0) {
                    images.forEach((imgSrc, index) => {
                        const img = document.createElement('img');
                        img.src = imgSrc;
                        img.alt = `Thumbnail ${index + 1} de ${product.name}`;
                        img.classList.add('thumbnail', 'rounded-md', 'shadow-sm', 'cursor-pointer', 'hover:opacity-75', 'transition-opacity');
                        if (index === 0) img.classList.add('active', 'border-2', 'border-red-500');
                        img.dataset.fullSrc = imgSrc;
                        img.addEventListener('click', () => {
                            document.querySelectorAll('.thumbnail-gallery .thumbnail').forEach(t => {
                                t.classList.remove('active', 'border-2', 'border-red-500');
                            });
                            img.classList.add('active', 'border-2', 'border-red-500');
                            mainProductImage.src = img.dataset.fullSrc;
                        });
                        thumbnailGalleryDiv.appendChild(img);
                    });
                } else {
                    thumbnailGalleryDiv.innerHTML = '<p class="text-sm text-gray-500">No hay miniaturas disponibles.</p>';
                }
            }


            const whatsappBtn = document.querySelector('.btn-pedir-informacion');
            if (whatsappBtn) {
                const productNameForWhatsapp = product.name || 'un neumático';
                const whatsappMessage = encodeURIComponent(`Hola! Me interesa el neumático ${productNameForWhatsapp} que vi en su web. ID: ${product.id}`);
                whatsappBtn.href = `https://wa.me/595XXXXXXXXX?text=${whatsappMessage}`;
            }

            loadRelatedProducts(id);

        } else {
            console.error('Producto no encontrado después de la obtención del backend.');
            const productDetailContainer = document.querySelector('.product-detail-container');
            if (productDetailContainer) {
                productDetailContainer.innerHTML = `
                    <h2 class="text-2xl font-bold text-center text-red-600 mb-4">Producto no encontrado</h2>
                    <p class="text-center text-gray-600">Lo sentimos, el producto que buscas no está disponible.</p>
                    <a href="index.html" class="block text-center mt-4 text-red-600 hover:underline">Volver a la página principal</a>
                `;
                const productTabsSection = document.querySelector('.product-tabs-section');
                if (productTabsSection) productTabsSection.style.display = 'none';
                const relatedProductsSection = document.querySelector('.related-products');
                if (relatedProductsSection) relatedProductsSection.style.display = 'none';
            }
        }
    }

    // Nueva función para cargar productos relacionados
    async function loadRelatedProducts(currentProductId) {
        const relatedProductsContainer = document.querySelector('.products-grid-related');
        if (!relatedProductsContainer) return;

        relatedProductsContainer.innerHTML = '';

        const allProducts = await fetchAllProducts();
        if (!allProducts || allProducts.length === 0) {
            const relatedSection = document.querySelector('.related-products');
            if (relatedSection) relatedSection.style.display = 'none';
            return;
        }

        let relatedProductsToShow = [];

        const availableProducts = allProducts.filter(p => p.id !== currentProductId);

        availableProducts.sort(() => 0.5 - Math.random());

        relatedProductsToShow = availableProducts.slice(0, 12);

        const relatedSection = document.querySelector('.related-products');
        if (relatedProductsToShow.length === 0 && relatedSection) {
            relatedSection.style.display = 'none';
        } else if (relatedSection) {
            relatedSection.style.display = 'block';
        }


        relatedProductsToShow.forEach(product => {
            if (product) {
                const productCard = `
                    <div class="product-card bg-white rounded-lg shadow-md overflow-hidden transform transition-transform hover:scale-105 duration-300">
                        <div class="image-container">
                            <img src="${product.images && product.images.length > 0 ? product.images[0] : 'https://placehold.co/200x200/cccccc/333333?text=No+Image'}" alt="Neumático ${product.name}" class="product-image-clickable">
                        </div>
                        <div class="p-4">
                            <p class="brand">${product.quickspecs && product.quickspecs.brand ? product.quickspecs.brand : 'N/A'}</p>
                            <p class="model">${product.name}</p>
                            <p class="price">${product.price}</p>
                            <p class="price-local">(${product.pricelocal && product.pricelocal.split(' / ')[0] ? product.pricelocal.split(' / ')[0] : 'N/A'})</p>
                            </div>
                    </div>
                `;
                relatedProductsContainer.insertAdjacentHTML('beforeend', productCard);
            }
        });

        const relatedCards = relatedProductsContainer.querySelectorAll('.product-card');
        if (relatedCards.length > 0) {
            let maxHeight = 0;
            relatedCards.forEach(card => {
                card.style.minHeight = 'auto';
            });
            relatedCards.forEach(card => {
                if (card.offsetHeight > maxHeight) {
                    maxHeight = card.offsetHeight;
                }
            });
            relatedCards.forEach(card => {
                card.style.minHeight = `${maxHeight}px`;
            });
        }
    }

    // Lógica para los enlaces de categorías en el encabezado
    const categoryLinks = document.querySelectorAll('.categories-nav a[data-category]');
    categoryLinks.forEach(link => {
        link.addEventListener('click', (event) => {
            event.preventDefault(); // Evita la navegación por defecto del enlace
            const category = event.target.dataset.category;
            if (category) {
                // Redirige a la página de resultados de búsqueda con el parámetro de categoría
                window.location.href = `search-results.html?category=${category}`;
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

    // --- Lógica para el Efecto de Lupa ---
    let lens = null; // La lupa
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

        // Si la imagen aún no ha cargado sus dimensiones naturales, esperar
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

        // Una vez que la imagen del modal esté visible y cargada, adjuntar listeners de lupa a ELLA
        // Asegurarse de que la imagen ampliada tenga la clase para la lupa
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