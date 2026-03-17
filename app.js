const CLIENTE_DATA = {
    nombreLocal: "Pies Sanos Venado",
    telefonoWsp: "5",
    telefonoVisible: "+54 9 ",
    slogan: "Pedicuria y podologia profesional",
    metaDescription: "Pedicuria y podologia profesional en Venado Tuerto. Reserva tu turno por WhatsApp y recibi una atencion cuidadosa, higienica y personalizada.",
    mensajeBase: "Hola! Quiero reservar un turno para ",
    mensajeConsulta: "Hola! Quisiera hacer una consulta y conocer la disponibilidad de turnos.",
    direccion: "Av. Casey 123, Venado Tuerto",
    localidad: "Venado Tuerto, Santa Fe",
    instagram: "https://instagram.com/piessanosvt",
    developerWsp: "5493462591151",
    developerMessage: "Hola! Vi tu demo y quiero consultar por una landing similar.",
    servicios: [
        {
            nombre: "Podologia clinica",
            desc: "Atencion profesional para aliviar molestias, tratar unas encarnadas, callosidades y cuidar la salud de tus pies.",
            imagen: "img/servicio-podologia-clinica.webp",
            alt: "Tratamiento profesional de podologia clinica"
        },
        {
            nombre: "Pedicuria estetica",
            desc: "Un servicio pensado para mantener tus pies prolijos, suaves y bien cuidados con una terminacion impecable.",
            imagen: "img/servicio-pedicuria-estetica.webp",
            alt: "Servicio de pedicuria estetica"
        },
        {
            nombre: "Esmaltado semipermanente",
            desc: "Color, brillo y duracion con aplicacion cuidadosa para lograr un resultado delicado, elegante y duradero.",
            imagen: "img/servicio-esmaltado-semipermanente.webp",
            alt: "Esmaltado semipermanente en pies"
        },
        {
            nombre: "Spa de pies",
            desc: "Exfoliacion, hidratacion profunda y masajes relajantes para renovar tus pies y regalarte un momento de bienestar.",
            imagen: "img/servicio-spa-de-pies.webp",
            alt: "Spa de pies con tratamiento relajante"
        }
    ]
};

function setText(id, value) {
    const element = document.getElementById(id);
    if (element) {
        element.textContent = value;
    }
}

function setMetaContent(id, value) {
    const element = document.getElementById(id);
    if (element) {
        element.setAttribute("content", value);
    }
}

function buildWhatsAppUrl(message) {
    return `https://wa.me/${CLIENTE_DATA.telefonoWsp}?text=${encodeURIComponent(message)}`;
}

function cargarLanding() {
    const pageTitle = `${CLIENTE_DATA.nombreLocal} | ${CLIENTE_DATA.slogan}`;

    document.title = pageTitle;

    setText("nav-logo", CLIENTE_DATA.nombreLocal);
    setText("footer-name", CLIENTE_DATA.nombreLocal);
    setText("footer-address", CLIENTE_DATA.direccion);
    setText("contacto-dir", CLIENTE_DATA.direccion);
    setText("contacto-tel", CLIENTE_DATA.telefonoVisible);
    setMetaContent("meta-description", CLIENTE_DATA.metaDescription);
    setMetaContent("og-title", pageTitle);
    setMetaContent("og-description", CLIENTE_DATA.metaDescription);
    setMetaContent("twitter-title", pageTitle);
    setMetaContent("twitter-description", CLIENTE_DATA.metaDescription);

    const instaLink = document.getElementById("insta-link");
    if (instaLink) {
        instaLink.href = CLIENTE_DATA.instagram;
    }

    const developerLink = document.getElementById("developer-wsp");
    if (developerLink) {
        developerLink.href = `https://wa.me/${CLIENTE_DATA.developerWsp}?text=${encodeURIComponent(CLIENTE_DATA.developerMessage)}`;
    }

    const phoneLink = document.getElementById("contacto-tel-link");
    if (phoneLink) {
        phoneLink.href = `tel:${CLIENTE_DATA.telefonoWsp}`;
    }

    const structuredData = document.getElementById("structured-data");
    if (structuredData) {
        structuredData.textContent = JSON.stringify(
            {
                "@context": "https://schema.org",
                "@type": "BeautySalon",
                name: CLIENTE_DATA.nombreLocal,
                description: CLIENTE_DATA.metaDescription,
                telephone: CLIENTE_DATA.telefonoVisible,
                address: {
                    "@type": "PostalAddress",
                    streetAddress: CLIENTE_DATA.direccion,
                    addressLocality: "Venado Tuerto",
                    addressRegion: "Santa Fe",
                    addressCountry: "AR"
                },
                sameAs: [CLIENTE_DATA.instagram]
            },
            null,
            2
        );
    }

    const linksWsp = document.querySelectorAll(".wsp-link");
    linksWsp.forEach((link) => {
        const type = link.dataset.wspType === "reserva" ? "reserva" : "consulta";
        const message = type === "reserva" ? CLIENTE_DATA.mensajeBase : CLIENTE_DATA.mensajeConsulta;

        link.href = buildWhatsAppUrl(message);
        link.target = "_blank";
        link.rel = "noopener noreferrer";
    });

    const grid = document.getElementById("services-grid");
    if (!grid) {
        return;
    }

    grid.innerHTML = "";

    CLIENTE_DATA.servicios.forEach((servicio) => {
        const card = document.createElement("article");
        card.className = "service-card";

        const media = document.createElement("div");
        media.className = "service-media";

        const mediaImage = document.createElement("img");
        mediaImage.className = "service-media-image";
        mediaImage.src = servicio.imagen;
        mediaImage.alt = servicio.alt || servicio.nombre;
        mediaImage.loading = "lazy";

        const mediaOverlay = document.createElement("div");
        mediaOverlay.className = "service-media-overlay";

        const mediaLabel = document.createElement("span");
        mediaLabel.className = "service-media-label";
        mediaLabel.textContent = servicio.nombre;

        const title = document.createElement("h3");
        title.textContent = servicio.nombre;

        const description = document.createElement("p");
        description.textContent = servicio.desc;

        const cta = document.createElement("a");
        cta.className = "service-link";
        cta.href = buildWhatsAppUrl(`${CLIENTE_DATA.mensajeBase}${servicio.nombre}`);
        cta.target = "_blank";
        cta.rel = "noopener noreferrer";
        cta.textContent = "Reservar este servicio";

        mediaOverlay.appendChild(mediaLabel);
        media.append(mediaImage, mediaOverlay);
        card.append(media, title, description, cta);
        grid.appendChild(card);
    });
}

function initSmoothScroll() {
    const internalLinks = document.querySelectorAll('a[href^="#"]');

    internalLinks.forEach((anchor) => {
        anchor.addEventListener("click", (event) => {
            const targetId = anchor.getAttribute("href");
            if (!targetId || targetId === "#") {
                return;
            }

            const targetElement = document.querySelector(targetId);
            if (!targetElement) {
                return;
            }

            event.preventDefault();
            targetElement.scrollIntoView({ behavior: "smooth", block: "start" });

            const navLinks = document.getElementById("nav-links");
            const menuToggle = document.querySelector(".menu-toggle");
            if (navLinks && menuToggle) {
                navLinks.classList.remove("is-open");
                menuToggle.setAttribute("aria-expanded", "false");
            }
        });
    });
}

function initMobileMenu() {
    const menuToggle = document.querySelector(".menu-toggle");
    const navLinks = document.getElementById("nav-links");

    if (!menuToggle || !navLinks) {
        return;
    }

    menuToggle.addEventListener("click", () => {
        const isOpen = navLinks.classList.toggle("is-open");
        menuToggle.setAttribute("aria-expanded", String(isOpen));
    });
}

function initRevealAnimations() {
    document.body.classList.add("is-ready");

    const prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const revealElements = document.querySelectorAll(".reveal");

    if (prefersReducedMotion) {
        revealElements.forEach((element) => element.classList.add("is-visible"));
        return;
    }

    const observer = new IntersectionObserver(
        (entries) => {
            entries.forEach((entry) => {
                if (entry.isIntersecting) {
                    entry.target.classList.add("is-visible");
                    observer.unobserve(entry.target);
                }
            });
        },
        {
            threshold: 0.16,
            rootMargin: "0px 0px -40px 0px"
        }
    );

    revealElements.forEach((element, index) => {
        if (index % 3 === 1) {
            element.classList.add("reveal-delay-1");
        }

        if (index % 3 === 2) {
            element.classList.add("reveal-delay-2");
        }

        observer.observe(element);
    });
}

document.addEventListener("DOMContentLoaded", () => {
    cargarLanding();
    initSmoothScroll();
    initMobileMenu();
    initRevealAnimations();
});
