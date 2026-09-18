(() => {
  const previewLocale = document.body.dataset.previewLocale || "pt";
  const plannerLabels = { pt: "Buscar voos", en: "Search flights", es: "Buscar vuelos" };
  const sectionCopy = {
    pt: { eyebrow: "Rio e arredores", title: "Passeios e experiências" },
    en: { eyebrow: "Rio and nearby areas", title: "Tours and experiences" },
    es: { eyebrow: "Río y alrededores", title: "Paseos y experiencias" },
  };
  const cardCopy = {
    pt: {
      0: { title: "Tour pela Favela", description: "Conheça a cultura local e descubra outra perspectiva do Rio." },
      2: { title: "Tour em Búzios", description: "Descubra praias, paisagens e o charme de Búzios." },
      4: { title: "Forte de Copacabana & Confeitaria Colombo", description: "Viva uma experiência com café em um dos cenários mais icônicos da orla carioca." },
    },
    en: {
      0: { title: "Favela Tour", description: "Discover local culture and see Rio from another perspective." },
      2: { title: "Búzios Tour", description: "Discover the beaches, scenery, and charm of Búzios." },
      4: { title: "Copacabana Fort & Confeitaria Colombo", description: "Enjoy a coffee experience in one of Rio’s most iconic seaside settings." },
    },
    es: {
      0: { title: "Tour por la favela", description: "Conoce la cultura local y descubre otra perspectiva de Río." },
      2: { title: "Tour por Búzios", description: "Descubre las playas, los paisajes y el encanto de Búzios." },
      4: { title: "Fuerte de Copacabana y Confeitaria Colombo", description: "Vive una experiencia con café en uno de los escenarios más icónicos de la costa carioca." },
    },
  };
  const approvedPhotoAlt = {
    favela: {
      pt: "Vista panorâmica de uma comunidade no Rio com a bandeira do Brasil.",
      en: "Panoramic view over a Rio community with the Brazilian flag.",
      es: "Vista panorámica de una comunidad de Río con la bandera de Brasil.",
    },
    buzios: {
      pt: "Rua iluminada à noite em Búzios.",
      en: "A lit street at night in Búzios.",
      es: "Una calle iluminada de noche en Búzios.",
    },
    forte: {
      pt: "Entrada do Forte de Copacabana.",
      en: "Entrance to Copacabana Fort.",
      es: "Entrada del Fuerte de Copacabana.",
    },
  };
  document.querySelector(".search-button").textContent = plannerLabels[previewLocale] || plannerLabels.pt;
  const currentSectionCopy = sectionCopy[previewLocale] || sectionCopy.pt;
  document.querySelector(".experiences .light-eyebrow").textContent = currentSectionCopy.eyebrow;
  document.querySelector("#experiences-title").textContent = currentSectionCopy.title;
  for (const [index, copy] of Object.entries(cardCopy[previewLocale] || cardCopy.pt)) {
    document.querySelector(`[data-card-title="${index}"]`).textContent = copy.title;
    document.querySelector(`[data-card-description="${index}"]`).textContent = copy.description;
  }
  for (const [name, translations] of Object.entries(approvedPhotoAlt)) {
    const image = document.querySelector(`.approved-${name}-photo`);
    image.alt = translations[previewLocale] || translations.pt;
  }
})();
