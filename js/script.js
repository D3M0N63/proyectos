document.addEventListener('DOMContentLoaded', () => {
    // Código existente para newsletter popup, búsqueda, y acordeón
    const newsletterPopup = document.getElementById('newsletter-popup');
    const closeBtn = document.querySelector('.newsletter-popup .close-btn');

    if (newsletterPopup) {
        setTimeout(() => {
            newsletterPopup.style.display = 'flex';
        }, 2000);

        if (closeBtn) {
            closeBtn.addEventListener('click', () => {
                newsletterPopup.style.display = 'none';
            });
        }

        window.addEventListener('click', (event) => {
            if (event.target == newsletterPopup) {
                newsletterPopup.style.display = 'none';
            }
        });
    }

    const searchButton = document.querySelector('.tire-search-by-size .btn-search');
    if (searchButton) {
        searchButton.addEventListener('click', () => {
            const ancho = document.getElementById('ancho') ? document.getElementById('ancho').value : '';
            const perfil = document.getElementById('perfil') ? document.getElementById('perfil').value : '';
            const aro = document.getElementById('aro') ? document.getElementById('aro').value : '';

            // Redirige a la nueva página de resultados con los parámetros de búsqueda
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

    let mySwiperInstance = null; // Variable para la instancia de Swiper

    // Función para renderizar los productos en el carrusel de index.html
    function renderProductsCarousel(products) {
        const swiperWrapper = document.querySelector('.mySwiper .swiper-wrapper');
        if (!swiperWrapper) return;

        swiperWrapper.innerHTML = ''; // Limpiar productos estáticos existentes

        products.forEach(product => {
            const productCardHtml = `
                <div class="swiper-slide product-card">
                    <div class="image-container">
                        <img src="${product.images && product.images.length > 0 ? product.images[0] : 'https://placehold.co/150x150/cccccc/333333?text=No+Image'}" alt="Neumático ${product.name}" class="product-image-zoom">
                    </div>
                    <div class="product-info">
                        <p class="brand">${product.quickspecs && product.quickspecs.brand ? product.quickspecs.brand : 'N/A'}</p>
                        <p class="model">${product.name}</p>
                        <p class="price">${product.price}</p>
                        <p class="price-local">(${product.pricelocal && product.pricelocal.split(' / ')[0] ? product.pricelocal.split(' / ')[0] : 'N/A'})</p>
                        <!-- BOTÓN "Ver producto" ELIMINADO: <a href="product-detail.html?product=${product.id}" class="btn-view-product">Ver producto</a> -->
                    </div>
                </div>
            `;
            swiperWrapper.insertAdjacentHTML('beforeend', productCardHtml);
        });

        // Re-inicializar Swiper o actualizar la instancia existente
        if (mySwiperInstance) {
            mySwiperInstance.destroy(true, true); // Destruir para recrear limpiamente
        }
        mySwiperInstance = new Swiper(".mySwiper", {
            slidesPerView: 1,
            spaceBetween: 10,
            loop: true,
            pagination: { el: ".swiper-pagination", clickable: true },
            navigation: { nextEl: ".swiper-button-next", prevEl: ".swiper-button-prev" },
            breakpoints: {
                640: { slidesPerView: 2, spaceBetween: 20 },
                768: { slidesPerView: 3, spaceBetween: 30 },
                1024: { slidesPerView: 4, spaceBetween: 30 },
            },
            on: {
                // Adjuntar listeners de zoom después de que Swiper inicialice o actualice
                init: setupMagnifyingGlassListeners,
                update: setupMagnifyingGlassListeners,
                slideChangeTransitionEnd: setupMagnifyingGlassListeners
            }
        });

        // Adjuntar listeners de zoom al inicio
        setupMagnifyingGlassListeners();
    }

    // Función para obtener todos los productos para la página principal
    async function fetchAllProducts() {
        try {
            const response = await fetch('/.netlify/functions/getProducts');
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            const products = await response.json();
            console.log('Productos obtenidos del backend:', products);
            renderProductsCarousel(products);
            return products;
        } catch (error) {
            console.error('Error fetching all products:', error);
            const carouselContainer = document.querySelector('.mySwiper .swiper-wrapper');
            if (carouselContainer) {
                carouselContainer.innerHTML = '<p style="text-align:center; color: red;">Error al cargar los productos. Por favor, intente de nuevo más tarde.</p>';
            }
            return [];
        }
    }

    // Función para obtener un producto específico por ID para la página de detalle
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


    // Lógica principal al cargar la página
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
        // En la página principal, cargar todos los productos para el carrusel
        fetchAllProducts();
    }


    // Función que carga los detalles de un producto específico en product-detail.html
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

        relatedProductsToShow = availableProducts.slice(0, 3);

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
                            <img src="${product.images && product.images.length > 0 ? product.images[0] : 'https://placehold.co/200x200/cccccc/333333?text=No+Image'}" alt="Neumático ${product.name}" class="product-image-zoom">
                        </div>
                        <div class="p-4">
                            <p class="brand text-sm text-gray-500">${product.quickspecs && product.quickspecs.brand ? product.quickspecs.brand : 'N/A'}</p>
                            <p class="model text-lg font-semibold text-gray-800 mb-1">${product.name}</p>
                            <p class="price text-xl font-bold text-red-600 mb-1">${product.price}</p>
                            <p class="price-local text-sm text-gray-600">(${product.pricelocal && product.pricelocal.split(' / ')[0] ? product.pricelocal.split(' / ')[0] : 'N/A'})</p>
                            <!-- BOTÓN "Ver producto" ELIMINADO: <a href="product-detail.html?product=${product.id}" class="btn-view-product mt-3 block text-center bg-red-500 text-white py-2 px-4 rounded-md hover:bg-red-600 transition-colors">Ver producto</a> -->
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
    function setupMagnifyingGlassListeners() {
        // Seleccionar todos los contenedores de imagen con la clase 'image-container'
        const imageContainers = document.querySelectorAll('.image-container');

        imageContainers.forEach(container => {
            // Remover cualquier listener previo para evitar duplicados
            container.removeEventListener('mouseenter', handleMouseEnter);
            container.removeEventListener('mouseleave', handleMouseLeave);
            container.removeEventListener('mousemove', handleMouseMove);

            // Añadir los nuevos listeners
            container.addEventListener('mouseenter', handleMouseEnter);
            container.addEventListener('mouseleave', handleMouseLeave);
            container.addEventListener('mousemove', handleMouseMove);
        });
    }

    let lens = null; // La lupa
    const zoomFactor = 1.25; // Factor de ampliación (reducido a 1.25)

    function handleMouseEnter(e) {
        const img = e.currentTarget.querySelector('.product-image-zoom');
        if (!img || !img.src) return; // Asegurarse de que la imagen y su src existan

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

        // Configura el fondo de la lupa con la imagen original
        lens.style.backgroundImage = `url('${img.src}')`;
        // Calcula el tamaño del fondo de la lupa usando las dimensiones naturales de la imagen y el factor de zoom
        lens.style.backgroundSize = `${img.naturalWidth * zoomFactor}px ${img.naturalHeight * zoomFactor}px`;
        lens.style.display = 'block'; // Mostrar la lupa
    }

    function handleMouseMove(e) {
        if (!lens || lens.style.display === 'none') return; // Solo mover si la lupa está visible

        const img = e.currentTarget.querySelector('.product-image-zoom');
        if (!img || img.naturalWidth === 0 || img.naturalHeight === 0) {
            lens.style.display = 'none'; // Si la imagen no está lista durante el movimiento, ocultar la lupa
            return;
        }

        // Obtener la posición del cursor relativa al viewport
        const mouseX = e.clientX;
        const mouseY = e.clientY;

        // Obtener la posición y dimensiones REALES de la imagen renderizada
        const imgRect = img.getBoundingClientRect();

        // Calcular la posición del cursor *dentro* de la imagen renderizada
        const xInImage = mouseX - imgRect.left;
        const yInImage = mouseY - imgRect.top;

        // Calcular la relación entre el tamaño natural y el tamaño renderizado de la imagen
        const ratioX = img.naturalWidth / imgRect.width;
        const ratioY = img.naturalHeight / imgRect.height;

        // Calcular la posición del fondo de la lupa
        // Multiplicamos por ratioX/Y para que el movimiento de la lupa coincida con la imagen natural
        const bgPosX = -xInImage * zoomFactor * ratioX + (lens.offsetWidth / 2);
        const bgPosY = -yInImage * zoomFactor * ratioY + (lens.offsetHeight / 2);

        lens.style.backgroundPosition = `${bgPosX}px ${bgPosY}px`;

        // Posicionar la lupa centrada en el cursor
        lens.style.left = `${mouseX}px`;
        lens.style.top = `${mouseY}px`;
    }

    function handleMouseLeave() {
        if (lens) {
            lens.style.display = 'none'; // Ocultar la lupa
        }
    }
    // --- FIN Lógica para el Efecto de Lupa ---
});
