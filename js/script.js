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

            console.log(`Buscando neumáticos con: Ancho=${ancho}, Perfil=${perfil}, Aro=${aro}`);
            alert(`Buscando neumáticos: Ancho ${ancho}, Perfil ${perfil}, Aro ${aro}. (Esta es solo una simulación)`);
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
        const swiperWrapper = document.querySelector('.mySwiper .swiper-wrapper');
        const swiperContainer = document.querySelector(".mySwiper");

        if (!swiperWrapper || !swiperContainer) {
            console.warn("Contenedor de Swiper no encontrado en HomePage, no se puede renderizar el carrusel.");
            return;
        }

        if (mySwiperInstance) {
            mySwiperInstance.destroy(true, true);
            mySwiperInstance = null;
        }
        swiperWrapper.innerHTML = '';

        if (products.length === 0) {
            swiperWrapper.innerHTML = '<p style="text-align:center; color: gray; width: 100%;">No hay productos disponibles.</p>';
            const swiperPagination = document.querySelector(".swiper-pagination");
            const swiperNext = document.querySelector(".swiper-button-next");
            const swiperPrev = document.querySelector(".swiper-button-prev");
            if(swiperPagination) swiperPagination.style.display = 'none';
            if(swiperNext) swiperNext.style.display = 'none';
            if(swiperPrev) swiperPrev.style.display = 'none';
            return;
        } else {
            const swiperPagination = document.querySelector(".swiper-pagination");
            const swiperNext = document.querySelector(".swiper-button-next");
            const swiperPrev = document.querySelector(".swiper-button-prev");
            if(swiperPagination) swiperPagination.style.display = 'block';
            if(swiperNext) swiperNext.style.display = 'block';
            if(swiperPrev) swiperPrev.style.display = 'block';
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
                        <a href="product-detail.html?product=${product.id}" class="btn-view-product bg-red-600 text-white font-semibold py-2 rounded-md hover:bg-red-700 transition-colors duration-200 text-center w-full mt-auto">Ver producto</a>
                    </div>
                </div>
            `;
            swiperWrapper.insertAdjacentHTML('beforeend', productCardHtml);
        });

        if (swiperContainer) {
            swiperContainer.swiper = new Swiper(swiperContainer, {
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
        }
    }

    // Función para obtener todos los productos para la página principal
    async function fetchAllProducts() {
        console.log("fetchAllProducts: Iniciando fetch de todos los productos."); // LOG
        try {
            const response = await fetch('/.netlify/functions/getProducts');  
            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(`HTTP error! status: ${response.status} - ${errorData.error || response.statusText}`);
            }
            const products = await response.json();
            console.log('fetchAllProducts: Productos obtenidos del backend:', products); // LOG
            return products;
        } catch (error) {
            console.error('fetchAllProducts: Error fetching all products:', error); // LOG
            const carouselContainer = document.querySelector('.mySwiper .swiper-wrapper');
            if (carouselContainer) {
                carouselContainer.innerHTML = '<p style="text-align:center; color: red;">Error al cargar los productos. Por favor, intente de nuevo más tarde.</p>';
            }
            return [];
        }
    }

    // Función para obtener un producto específico por ID para la página de detalle
    async function fetchProductById(id) {
        console.log(`fetchProductById: Iniciando fetch para el ID: ${id}`); // LOG
        try {
            const response = await fetch(`/.netlify/functions/getProducts?id=${id}`);
            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(`HTTP error! status: ${response.status} - ${errorData.error || response.statusText}`);
            }
            const products = await response.json();
            if (products.length > 0) {
                console.log('fetchProductById: Producto obtenido:', products[0]); // LOG
                return products[0];
            } else {
                console.log('fetchProductById: Producto no encontrado con ID:', id); // LOG
                return null;
            }
        } catch (error) {
            console.error(`fetchProductById: Error fetching product with ID ${id}:`, error); // LOG
            return null;
        }
    }


    // Lógica principal al cargar la página
    const mainProductImage = document.getElementById('main-product-image');
    const urlParams = new URLSearchParams(window.location.search);
    const productId = urlParams.get('product');

    if (window.location.pathname.includes('product-detail.html')) {
        if (productId) {
            console.log("ProductDetailPage: Intentando cargar producto con ID de URL:", productId); // LOG
            loadProductDetail(productId);
        } else {
            console.log("ProductDetailPage: No se encontró ID de producto en la URL."); // LOG
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
        console.log("HomePage: Cargando todos los productos para el carrusel."); // LOG
        fetchAllProducts();
    }


    // Función que carga los detalles de un producto específico en product-detail.html
    async function loadProductDetail(id) {
        console.log(`loadProductDetail: Llamando fetchProductById para ${id}`); // LOG
        const product = await fetchProductById(id);
        if (product) {
            console.log("loadProductDetail: Producto cargado. Actualizando UI."); // LOG
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
                        mainProductImageElement.src = img.dataset.fullSrc;
                    });
                    thumbnailGalleryDiv.appendChild(img);
                });
            }
            
            const whatsappBtn = document.querySelector('.btn-pedir-informacion');
            if (whatsappBtn) {
                const whatsappMessage = encodeURIComponent(`Hola! Me interesa el neumático ${product.name} que vi en su web.`);
                whatsappBtn.href = `https://wa.me/595XXXXXXXXX?text=${whatsappMessage}`;
            }

            console.log("loadProductDetail: Llamando a loadRelatedProducts."); // LOG
            loadRelatedProducts(id);

        } else {
            console.error('loadProductDetail: Producto no encontrado después de la obtención del backend.'); // LOG
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

    // Nueva función para cargar productos relacionados
    async function loadRelatedProducts(currentProductId) {
        console.log(`loadRelatedProducts: Iniciando carga de productos relacionados para ${currentProductId}.`); // LOG
        const relatedProductsContainer = document.querySelector('.products-grid-related');
        if (!relatedProductsContainer) {
            console.warn("loadRelatedProducts: Contenedor de productos relacionados no encontrado."); // LOG
            return;
        }

        relatedProductsContainer.innerHTML = ''; // Limpiar productos estáticos existentes

        const allProducts = await fetchAllProducts(); // Obtiene todos los productos del backend
        console.log("loadRelatedProducts: Todos los productos obtenidos:", allProducts); // LOG
        if (!allProducts || allProducts.length === 0) {
            const relatedSection = document.querySelector('.related-products');
            if (relatedSection) relatedSection.style.display = 'none';
            console.log("loadRelatedProducts: No hay productos en total para mostrar relacionados."); // LOG
            return;
        }

        let relatedProductsToShow = [];

        // Filtra el producto actual por su ID y mezcla los demás
        const availableProducts = allProducts.filter(p => p.id !== currentProductId);
        console.log("loadRelatedProducts: Productos disponibles (excluyendo el actual):", availableProducts); // LOG
        
        availableProducts.sort(() => 0.5 - Math.random()); // Mezcla aleatoriamente

        relatedProductsToShow = availableProducts.slice(0, 3); // Tomar los primeros 3 (o los que quieras)
        console.log("loadRelatedProducts: Productos relacionados iniciales (hasta 3):", relatedProductsToShow); // LOG

        // Si hay menos de 3 relacionados y hay más productos disponibles para rellenar
        while (relatedProductsToShow.length < 3 && availableProducts.length > relatedProductsToShow.length) {
            const randomProduct = availableProducts[Math.floor(Math.random() * availableProducts.length)];
            // Asegurarse de no añadir duplicados si la mezcla no es perfecta y hay pocos productos
            if (!relatedProductsToShow.some(p => p.id === randomProduct.id)) {
                relatedProductsToShow.push(randomProduct);
                console.log("loadRelatedProducts: Rellenando con producto extra:", randomProduct.id); // LOG
            }
        }
        console.log("loadRelatedProducts: Productos relacionados finales a mostrar:", relatedProductsToShow); // LOG


        const relatedSection = document.querySelector('.related-products');
        if (relatedProductsToShow.length === 0 && relatedSection) {
            relatedSection.style.display = 'none';
            console.log("loadRelatedProducts: Ocultando sección de relacionados (no hay productos)."); // LOG
        } else if (relatedSection) {
            relatedSection.style.display = 'block';
            console.log("loadRelatedProducts: Mostrando sección de relacionados."); // LOG
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
                console.log(`loadRelatedProducts: Añadido producto ${product.id} a la UI.`); // LOG
            }
        });
        
        // Ajustar la altura mínima de las tarjetas relacionadas después de cargarlas
        const relatedCards = relatedProductsContainer.querySelectorAll('.product-card');
        if (relatedCards.length > 0) {
            let maxHeight = 0;
            relatedCards.forEach(card => {
                card.style.minHeight = 'auto'; // Resetear para recalcular
            });
            relatedCards.forEach(card => {
                if (card.offsetHeight > maxHeight) {
                    maxHeight = card.offsetHeight;
                }
            });
            relatedCards.forEach(card => {
                card.style.minHeight = `${maxHeight}px`;
            });
            console.log(`loadRelatedProducts: Altura de tarjetas relacionadas ajustada a ${maxHeight}px.`); // LOG
        }
    }
});
