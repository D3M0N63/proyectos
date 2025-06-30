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
        searchButton.addEventListener('click', async () => { // Hacemos la función async
            const ancho = document.getElementById('ancho') ? document.getElementById('ancho').value : '';
            const perfil = document.getElementById('perfil') ? document.getElementById('perfil').value : '';
            const aro = document.getElementById('aro') ? document.getElementById('aro').value : '';

            console.log(`Iniciando búsqueda con: Ancho=${ancho}, Perfil=${perfil}, Aro=${aro}`);

            const searchResultsSection = document.getElementById('search-results-section');
            const searchResultsGrid = document.getElementById('search-results-grid');
            const noSearchResultsMessage = document.getElementById('no-search-results');
            const featuredProductsSection = document.querySelector('.featured-products');

            if (searchResultsSection && searchResultsGrid && noSearchResultsMessage && featuredProductsSection) {
                featuredProductsSection.style.display = 'none'; // Oculta destacados cuando se busca

                searchResultsSection.style.display = 'block';
                searchResultsGrid.innerHTML = '<p style="text-align:center; color: gray; width: 100%;">Cargando resultados...</p>';
                noSearchResultsMessage.style.display = 'none';

                try {
                    const params = new URLSearchParams();
                    if (ancho && ancho !== 'todos') params.append('ancho', ancho);
                    if (perfil && perfil !== 'todos') params.append('perfil', perfil);
                    if (aro && aro !== 'todos') params.append('aro', aro);

                    const queryString = params.toString();
                    const response = await fetch(`/.netlify/functions/getProducts${queryString ? `?${queryString}` : ''}`);
                    
                    if (!response.ok) {
                        const errorData = await response.json();
                        throw new Error(`HTTP error! status: ${response.status} - ${errorData.error || response.statusText}`);
                    }

                    const results = await response.json();
                    console.log('Resultados de búsqueda obtenidos:', results);

                    searchResultsGrid.innerHTML = ''; // Limpiar el mensaje de carga

                    if (results.length > 0) {
                        results.forEach(product => {
                            const productCardHtml = `
                                <div class="product-card">
                                    <img src="${product.images[0]}" alt="${product.name}">
                                    <div class="product-info">
                                        <p class="brand">${product.quickspecs.brand}</p>
                                        <p class="model">${product.name}</p>
                                        <p class="price">${product.price}</p>
                                        <p class="price-local">(${product.pricelocal.split(' / ')[0]})</p>
                                        <a href="product-detail.html?product=${product.id}" class="btn-view-product">Ver producto</a>
                                    </div>
                                </div>
                            `;
                            searchResultsGrid.insertAdjacentHTML('beforeend', productCardHtml);
                        });
                        const cards = searchResultsGrid.querySelectorAll('.product-card');
                        if (cards.length > 0) {
                            let maxHeight = 0;
                            cards.forEach(card => { card.style.minHeight = 'auto'; });
                            cards.forEach(card => { if (card.offsetHeight > maxHeight) { maxHeight = card.offsetHeight; } });
                            cards.forEach(card => { card.style.minHeight = `${maxHeight}px`; });
                        }

                    } else {
                        noSearchResultsMessage.style.display = 'block';
                    }
                } catch (error) {
                    console.error('Error durante la búsqueda de neumáticos:', error);
                    searchResultsGrid.innerHTML = '<p style="text-align:center; color: red;">Error al realizar la búsqueda. Por favor, intente de nuevo.</p>';
                }
            }
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

    let mySwiperInstance = null; // Variable global para la instancia de Swiper

    // Función para renderizar los productos en el carrusel de index.html
    function renderProductsCarousel(products) {
        console.log("renderProductsCarousel: Iniciando renderizado del carrusel con productos:", products);
        const swiperWrapper = document.querySelector('.mySwiper .swiper-wrapper');
        const swiperContainer = document.querySelector(".mySwiper");
        const swiperPagination = document.querySelector(".swiper-pagination");
        const swiperNext = document.querySelector(".swiper-button-next");
        const swiperPrev = document.querySelector(".swiper-button-prev");

        if (!swiperWrapper || !swiperContainer || !swiperPagination || !swiperNext || !swiperPrev) {
            console.warn("renderProductsCarousel: Elementos clave de Swiper no encontrados en HomePage. Asegúrate de que el HTML del carrusel está completo y visible.");
            return;
        }

        if (mySwiperInstance) {
            console.log("renderProductsCarousel: Destruyendo instancia existente de Swiper.");
            mySwiperInstance.destroy(true, true);
            mySwiperInstance = null;
        }
        
        swiperWrapper.innerHTML = '';

        if (products.length === 0) {
            swiperWrapper.innerHTML = '<p style="text-align:center; color: gray; width: 100%;">No hay productos destacados disponibles.</p>';
            swiperPagination.style.display = 'none';
            swiperNext.style.display = 'none';
            swiperPrev.style.display = 'none';
            console.log("renderProductsCarousel: No hay productos para renderizar. Carrusel vacío.");
            return;
        } else {
            swiperPagination.style.display = 'block';
            swiperNext.style.display = 'block';
            swiperPrev.style.display = 'block';
        }

        products.forEach(product => {
            const productCardHtml = `
                <div class="swiper-slide product-card flex flex-col justify-between p-5 bg-white border border-gray-200 rounded-lg shadow-sm hover:shadow-md transition-all duration-200 ease-in-out transform hover:-translate-y-1 min-h-[450px] max-w-xs mx-auto">
                    <img src="${product.images[0]}" alt="${product.name}" class="h-48 object-contain mx-auto mb-4 rounded-md">
                    <div class="product-info flex flex-col flex-grow text-left">
                        <p class="brand">${product.quickspecs.brand}</p>
                        <p class="model">${product.name}</p>
                        <p class="price">${product.price}</p>
                        <p class="price-local">(${product.pricelocal.split(' / ')[0]})</p>
                        <a href="product-detail.html?product=${product.id}" class="btn-view-product">Ver producto</a>
                    </div>
                </div>
            `;
            swiperWrapper.insertAdjacentHTML('beforeend', productCardHtml);
            console.log(`renderProductsCarousel: Añadido slide para producto ${product.id}`);
        });

        setTimeout(() => {
            if (products.length > 0 && swiperContainer && typeof Swiper !== 'undefined') {
                console.log("renderProductsCarousel: Intentando inicializar Swiper...");
                mySwiperInstance = new Swiper(swiperContainer, {
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
                });
                mySwiperInstance.update();
                console.log("renderProductsCarousel: Swiper inicializado y actualizado.");
            } else {
                console.warn("renderProductsCarousel: Swiper no se inicializa (0 productos, contenedor no encontrado, o Swiper no definido).");
            }
        }, 100);
    }

    async function fetchAllProducts() {
        console.log("fetchAllProducts: Iniciando fetch de todos los productos.");
        try {
            const response = await fetch('/.netlify/functions/getProducts');  
            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(`HTTP error! status: ${response.status} - ${errorData.error || response.statusText}`);
            }
            const products = await response.json();
            console.log('fetchAllProducts: Productos obtenidos del backend:', products);
            if (!window.location.pathname.includes('product-detail.html')) {
                 renderProductsCarousel(products);
            }
            return products;
        } catch (error) {
            console.error('fetchAllProducts: Error fetching all products:', error);
            const carouselContainer = document.querySelector('.mySwiper .swiper-wrapper');
            if (carouselContainer && !window.location.pathname.includes('product-detail.html')) {
                carouselContainer.innerHTML = '<p style="text-align:center; color: red;">Error al cargar los productos. Por favor, intente de nuevo más tarde.</p>';
            }
            return [];
        }
    }

    async function fetchProductById(id) {
        console.log(`fetchProductById: Iniciando fetch para el ID: ${id}`);
        try {
            const response = await fetch(`/.netlify/functions/getProducts?id=${id}`);
            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(`HTTP error! status: ${response.status} - ${errorData.error || response.statusText}`);
            }
            const products = await response.json();
            if (products.length > 0) {
                console.log('fetchProductById: Producto obtenido:', products[0]);
                return products[0];
            } else {
                console.log('fetchProductById: Producto no encontrado con ID:', id);
                return null;
            }
        } catch (error) {
            console.error(`fetchProductById: Error fetching product with ID ${id}:`, error);
            return null;
        }
    }


    // Lógica principal al cargar la página
    const mainProductImage = document.getElementById('main-product-image');
    const urlParams = new URLSearchParams(window.location.search);
    const productId = urlParams.get('product');

    if (window.location.pathname.includes('product-detail.html')) {
        if (productId) {
            console.log("ProductDetailPage: Intentando cargar producto con ID de URL:", productId);
            loadProductDetail(productId);
        } else {
            console.log("ProductDetailPage: No se encontró ID de producto en la URL.");
            const productDetailContainer = document.querySelector('.product-detail-container');
            if (productDetailContainer) {
                productDetailContainer.innerHTML = `
                    <h2>No se proporcionó un ID de producto en la URL.</h2>
                    <p>Por favor, <a href="index.html">vuelve a la página principal</a> e intenta seleccionar un neumático.</p>
                `;
                const productTabsSection = document.querySelector('.product-tabs-section');
                if (productTabsSection) productTabsSection.style.display = 'none';
                const relatedProductsSection = document.querySelector('.related-products');
                if (relatedProductsSection) relatedProductsSection.style.display = 'none';
            }
        }
    } else {
        console.log("HomePage: Cargando todos los productos para el carrusel.");
        fetchAllProducts();
    }


    // Función que carga los detalles de un producto específico en product-detail.html
    async function loadProductDetail(id) {
        console.log(`loadProductDetail: Llamando fetchProductById para ${id}`);
        const product = await fetchProductById(id);
        if (product) {
            console.log("loadProductDetail: Producto cargado. Actualizando UI.", product);
            const productNameElement = document.getElementById('product-name');
            if (productNameElement) productNameElement.textContent = product.name;

            const productPriceElement = document.getElementById('product-price');
            if (productPriceElement) productPriceElement.textContent = product.price;

            const productPriceLocalElement = document.getElementById('product-price-local');
            if (productPriceLocalElement) productPriceLocalElement.textContent = product.pricelocal;
            
            const stockStatusElement = document.getElementById('stock-status');
            if (stockStatusElement) {
                stockStatusElement.textContent = product.stockstatus;
                stockStatusElement.className = 'out-of-stock';
                if (product.stockstatus === 'En stock') {
                    stockStatusElement.classList.add('in-stock');
                } else if (product.stockstatus === 'Últimas unidades') {
                    stockStatusElement.classList.add('low-stock');
                }
            }

            const productSkuElement = document.getElementById('product-sku');
            if (productSkuElement) productSkuElement.textContent = product.sku;
            
            const productCategoriesElement = document.getElementById('product-categories');
            if (productCategoriesElement) productCategoriesElement.textContent = product.categories;
            
            const productTagsElement = document.getElementById('product-tags');
            if (productTagsElement) productTagsElement.textContent = product.tags;

            const productBrandElement = document.getElementById('product-brand');
            if (productBrandElement) productBrandElement.textContent = product.quickspecs.brand;
            
            const productLarguraElement = document.getElementById('product-largura');
            if (productLarguraElement) productLarguraElement.textContent = product.quickspecs.largura;
            
            const productPerfilElement = document.getElementById('product-perfil');
            if (productPerfilElement) productPerfilElement.textContent = product.quickspecs.perfil;
            
            const productAroElement = document.getElementById('product-aro');
            if (productAroElement) productAroElement.textContent = product.quickspecs.aro;
            
            const productLoadIndexElement = document.getElementById('product-load-index');
            if (productLoadIndexElement) productLoadIndexElement.textContent = product.quickspecs.loadIndex;
            
            const productSpeedIndexElement = document.getElementById('product-speed-index');
            if (productSpeedIndexElement) productSpeedIndexElement.textContent = product.quickspecs.speedIndex;

            const detailsTabHeading = document.querySelector('#details h3');
            if (detailsTabHeading) detailsTabHeading.textContent = `Detalles del ${product.name}`;
            
            const productDescriptionElement = document.querySelector('#details p.product-description');
            if (productDescriptionElement) productDescriptionElement.textContent = product.description;
            
            const detailMeasureElement = document.getElementById('detail-measure');
            if (detailMeasureElement) detailMeasureElement.textContent = product.detailspecs.measure;
            
            const detailLoadIndexElement = document.getElementById('detail-load-index');
            if (detailLoadIndexElement) detailLoadIndexElement.textContent = product.detailspecs.loadIndex;
            
            const detailSpeedIndexElement = document.getElementById('detail-speed-index');
            if (detailSpeedIndexElement) detailSpeedIndexElement.textContent = product.detailspecs.speedIndex;
            
            const detailVehicleTypeElement = document.getElementById('detail-vehicle-type');
            if (detailVehicleTypeElement) detailVehicleTypeElement.textContent = product.detailspecs.vehicleType;
            
            const detailTreadDesignElement = document.getElementById('detail-tread-design');
            if (detailTreadDesignElement) detailTreadDesignElement.textContent = product.detailspecs.treadDesign;
            
            const detailWarrantyElement = document.getElementById('detail-warranty');
            if (detailWarrantyElement) detailWarrantyElement.textContent = product.detailspecs.warranty;

            const moreInfoLoadIndexElement = document.getElementById('more-info-load-index');
            if (moreInfoLoadIndexElement) moreInfoLoadIndexElement.textContent = product.moreinfo.loadIndex;
            
            const moreInfoSpeedIndexElement = document.getElementById('more-info-speed-index');
            if (moreInfoSpeedIndexElement) moreInfoSpeedIndexElement.textContent = product.moreinfo.speedIndex;
            
            const moreInfoTypeElement = document.getElementById('more-info-type');
            if (moreInfoTypeElement) moreInfoTypeElement.textContent = product.moreinfo.type;
            
            const moreInfoConstructionElement = document.getElementById('more-info-construction');
            if (moreInfoConstructionElement) moreInfoConstructionElement.textContent = product.moreinfo.construction;
            
            const moreInfoApplicationElement = document.getElementById('more-info-application');
            if (moreInfoApplicationElement) moreInfoApplicationElement.textContent = product.moreinfo.application;
            
            const moreInfoLettersElement = document.getElementById('more-info-letters');
            if (moreInfoLettersElement) moreInfoLettersElement.textContent = product.moreinfo.letters;
            
            const efficiencyLabelDiv = document.querySelector('.efficiency-label');
            if (efficiencyLabelDiv) {
                efficiencyLabelDiv.style.display = 'none';
            }


            const mainProductImageElement = document.getElementById('main-product-image');
            if (mainProductImageElement) {
                mainProductImageElement.src = product.images[0];
            }
            
            const thumbnailGalleryDiv = document.querySelector('.thumbnail-gallery');
            if (thumbnailGalleryDiv) {
                thumbnailGalleryDiv.innerHTML = '';

                if (Array.isArray(product.images) && product.images.length > 0) {
                    product.images.forEach((imgSrc, index) => {
                        const img = document.createElement('img');
                        img.src = imgSrc;
                        img.alt = `Thumbnail ${index + 1} de ${product.name}`;
                        img.classList.add('thumbnail');
                        if (index === 0) img.classList.add('active');
                        img.dataset.fullSrc = imgSrc;
                        img.addEventListener('click', () => {
                            document.querySelectorAll('.thumbnail-gallery .thumbnail').forEach(t => t.classList.remove('active'));
                            img.classList.add('active');
                            if (mainProductImageElement) {
                                mainProductImageElement.src = img.dataset.fullSrc;
                            }
                        });
                        thumbnailGalleryDiv.appendChild(img);
                    });
                } else {
                    console.warn("loadProductDetail: product.images no es un array válido o está vacío. Mostrando placeholder.");
                    const placeholderImg = document.createElement('img');
                    placeholderImg.src = "https://placehold.co/80x80/e0e0e0/white?text=No+Img";
                    placeholderImg.alt = "No image available";
                    placeholderImg.classList.add('thumbnail', 'active');
                    thumbnailGalleryDiv.appendChild(placeholderImg);
                }
            }
            
            const whatsappBtn = document.querySelector('.btn-pedir-informacion');
            if (whatsappBtn) {
                const whatsappMessage = encodeURIComponent(`Hola! Me interesa el neumático ${product.name} que vi en su web.`);
                whatsappBtn.href = `https://wa.me/595XXXXXXXXX?text=${whatsappMessage}`;
            }

            console.log("loadProductDetail: Llamando a loadRelatedProducts.");
            loadRelatedProducts(id);

        } else {
            console.error('loadProductDetail: Producto no encontrado después de la obtención del backend.');
            const productDetailContainer = document.querySelector('.product-detail-container');
            if (productDetailContainer) {
                productDetailContainer.innerHTML = `
                    <h2>Producto no encontrado</h2>
                    <p>Lo sentimos, el producto que buscas no está disponible.</p>
                    <a href="index.html">Volver a la página principal</a>
                `;
                const productTabsSection = document.querySelector('.product-tabs-section');
                if (productTabsSection) productTabsSection.style.display = 'none';
                const relatedProductsSection = document.querySelector('.related-products');
                if (relatedProductsSection) relatedProductsSection.style.display = 'none';
            }
        }
    }

    async function loadRelatedProducts(currentProductId) {
        console.log(`loadRelatedProducts: Iniciando carga de productos relacionados para ${currentProductId}.`);
        const relatedProductsContainer = document.querySelector('.products-grid-related');
        if (!relatedProductsContainer) {
            console.warn("loadRelatedProducts: Contenedor de productos relacionados no encontrado.");
            return;
        }

        relatedProductsContainer.innerHTML = '';

        const allProducts = await fetchAllProducts();
        console.log("loadRelatedProducts: Todos los productos obtenidos:", allProducts);
        if (!allProducts || allProducts.length === 0) {
            const relatedSection = document.querySelector('.related-products');
            if (relatedSection) relatedSection.style.display = 'none';
            console.log("loadRelatedProducts: No hay productos en total para mostrar relacionados.");
            return;
        }

        let relatedProductsToShow = [];

        const availableProducts = allProducts.filter(p => p.id !== currentProductId);
        console.log("loadRelatedProducts: Productos disponibles (excluyendo el actual):", availableProducts);
        
        availableProducts.sort(() => 0.5 - Math.random());

        relatedProductsToShow = availableProducts.slice(0, 3);
        console.log("loadRelatedProducts: Productos relacionados iniciales (hasta 3):", relatedProductsToShow);

        while (relatedProductsToShow.length < 3 && availableProducts.length > relatedProductsToShow.length && relatedProductsToShow.length < availableProducts.length) {
            const randomProduct = availableProducts[Math.floor(Math.random() * availableProducts.length)];
            if (!relatedProductsToShow.some(p => p.id === randomProduct.id)) {
                relatedProductsToShow.push(randomProduct);
                console.log("loadRelatedProducts: Rellenando con producto extra:", randomProduct.id);
            }
        }
        console.log("loadRelatedProducts: Productos relacionados finales a mostrar:", relatedProductsToShow);


        const relatedSection = document.querySelector('.related-products');
        if (relatedProductsToShow.length === 0 && relatedSection) {
            relatedSection.style.display = 'none';
            console.log("loadRelatedProducts: Ocultando sección de relacionados (no hay productos).");
        } else if (relatedSection) {
            relatedSection.style.display = 'block';
            console.log("loadRelatedProducts: Mostrando sección de relacionados.");
        }


        relatedProductsToShow.forEach(product => {
            if (product) {
                const productCard = `
                    <div class="product-card">
                        <img src="${product.images[0]}" alt="Neumático ${product.name}">
                        <div class="product-info">
                            <p class="brand">${product.quickspecs.brand}</p>
                            <p class="model">${product.name}</p>
                            <p class="price">${product.price}</p>
                            <p class="price-local">(${product.pricelocal.split(' / ')[0]})</p>
                            <a href="product-detail.html?product=${product.id}" class="btn-view-product">Ver producto</a>
                        </div>
                    </div>
                `;
                relatedProductsContainer.insertAdjacentHTML('beforeend', productCard);
                console.log(`loadRelatedProducts: Añadido producto ${product.id} a la UI.`);
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
            console.log(`loadRelatedProducts: Altura de tarjetas relacionadas ajustada a ${maxHeight}px.`);
        }
    }
});
