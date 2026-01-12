import { Helmet } from 'react-helmet-async';

const SEO = ({ title, description, keywords, image, url, type = 'website' }) => {
    const siteTitle = "Ingeniero Emprendedor | Soluciones Textiles";
    const defaultDescription = "Venta de plotters de tizada digital para fabricantes de ropa en Argentina. Tecnología para optimizar tu producción textil.";
    const defaultKeywords = "plotter, tizada, digital, ropa, textil, argentina, molderia, corte, confeccion, plotter hp45, plotter inject";

    // Note: Ensure this image exists in your public folder or is an absolute URL
    const defaultImage = "/plotter-seo.jpg";
    const siteUrl = "https://ingeniero-emprendedor.vercel.app"; // CAMBIAR POR TU DOMINIO REAL CUANDO LO TENGAS

    const fullTitle = title ? `${title} | Ingeniero Emprendedor` : siteTitle;
    const fullDescription = description || defaultDescription;
    const fullUrl = url || siteUrl;
    const fullImage = image ? (image.startsWith('http') ? image : `${siteUrl}${image}`) : `${siteUrl}${defaultImage}`;

    return (
        <Helmet>
            {/* Standard Metadata */}
            <title>{fullTitle}</title>
            <meta name="description" content={fullDescription} />
            <meta name="keywords" content={keywords || defaultKeywords} />
            <link rel="canonical" href={fullUrl} />
            <meta name="robots" content="index, follow" />
            <meta name="author" content="Ingeniero Emprendedor" />

            {/* Open Graph / Facebook */}
            <meta property="og:type" content={type} />
            <meta property="og:title" content={fullTitle} />
            <meta property="og:description" content={fullDescription} />
            <meta property="og:image" content={fullImage} />
            <meta property="og:url" content={fullUrl} />
            <meta property="og:site_name" content="Ingeniero Emprendedor" />
            <meta property="og:locale" content="es_AR" />

            {/* Twitter */}
            <meta name="twitter:card" content="summary_large_image" />
            <meta name="twitter:title" content={fullTitle} />
            <meta name="twitter:description" content={fullDescription} />
            <meta name="twitter:image" content={fullImage} />
            <meta name="twitter:creator" content="@ingenieroemprendedor" />

            {/* JSON-LD Structured Data for Rich Snippets */}
            <script type='application/ld+json'>
                {JSON.stringify({
                    "@context": "https://schema.org",
                    "@type": "LocalBusiness",
                    "name": "Ingeniero Emprendedor",
                    "image": [fullImage],
                    "description": fullDescription,
                    "url": fullUrl,
                    "address": {
                        "@type": "PostalAddress",
                        "addressCountry": "AR"
                    },
                    "geo": {
                        "@type": "GeoCoordinates",
                        "addressCountry": "AR"
                    },
                    "offers": {
                        "@type": "Offer",
                        "description": "Plotter de Tizada Digital",
                        "availability": "https://schema.org/InStock",
                        "areaServed": "Argentina"
                    }
                })}
            </script>
        </Helmet>
    );
};

export default SEO;
