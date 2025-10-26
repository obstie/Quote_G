// Global variables
let currentSystemType = "ip";
let currentChannels = 4;
let pipingLength = 0;
let pipingRate = 85;
let currentBrand = "hikvision";

// Wait for DOM to be fully loaded
document.addEventListener("DOMContentLoaded", function () {
  initializeApp();
});

function initializeApp() {
  // Set default dates
  const today = new Date();
  const validUntil = new Date();
  validUntil.setMonth(today.getMonth() + 3);

  const quoteDateEl = document.getElementById("quote-date");
  const validUntilEl = document.getElementById("valid-until");

  if (quoteDateEl) quoteDateEl.valueAsDate = today;
  if (validUntilEl) validUntilEl.valueAsDate = validUntil;

  // Setup all event listeners
  setupEventListeners();

  // Initial calculations and UI updates
  updateSystemType();
  updateRecorderForChannels();
  updateTotals();

  // Add random price variations
  applyRandomPriceVariations();
}

function setupEventListeners() {
  // Ceiling access controls
  const accessButtons = document.querySelectorAll(".access-btn");
  accessButtons.forEach((btn) => {
    btn.addEventListener("click", function () {
      accessButtons.forEach((b) => b.classList.remove("active"));
      this.classList.add("active");

      const accessType = this.getAttribute("data-access");
      const pipingSection = document.getElementById("piping-section");

      if (accessType === "no") {
        pipingSection.classList.remove("hidden");
      } else {
        pipingSection.classList.add("hidden");
        document.getElementById("piping-length").value = 0;
        pipingLength = 0;
        updatePipingCalculation();
      }

      updateTotals();
    });
  });

  // Piping length input
  const pipingLengthInput = document.getElementById("piping-length");
  if (pipingLengthInput) {
    pipingLengthInput.addEventListener("input", function () {
      pipingLength = parseInt(this.value) || 0;
      updatePipingCalculation();
      updateTotals();
    });
  }

  // System type controls
  const systemTypeButtons = document.querySelectorAll(".system-type-btn");
  systemTypeButtons.forEach((btn) => {
    btn.addEventListener("click", function () {
      systemTypeButtons.forEach((b) => b.classList.remove("active"));
      this.classList.add("active");
      currentSystemType = this.getAttribute("data-type");
      updateSystemType();
      updateRecorderForChannels();
      updateTotals();
    });
  });

  // Channel selection buttons
  const channelButtons = document.querySelectorAll(".channel-btn");
  channelButtons.forEach((btn) => {
    btn.addEventListener("click", function () {
      channelButtons.forEach((b) => b.classList.remove("active"));
      this.classList.add("active");
      currentChannels = parseInt(this.getAttribute("data-channels"));
      updateRecorderForChannels();
      updateTotals();
    });
  });

  // Checkboxes and quantity inputs
  const checkboxes = document.querySelectorAll('input[type="checkbox"]');
  const quantityInputs = document.querySelectorAll(".quantity");

  checkboxes.forEach((checkbox) => {
    checkbox.addEventListener("change", updateTotals);
  });

  quantityInputs.forEach((input) => {
    input.addEventListener("input", updateTotals);
  });

  // Brand selection
  const brandButtons = document.querySelectorAll(".brand-btn");
  brandButtons.forEach((btn) => {
    btn.addEventListener("click", function () {
      brandButtons.forEach((b) => b.classList.remove("active"));
      this.classList.add("active");
      const selectedBrand = this.getAttribute("data-brand");
      currentBrand = selectedBrand;
      filterByBrand(selectedBrand);
      applyBrandTheme(selectedBrand);
      updateTotals();
    });
  });

  // Storage options
  const storageOptions = document.querySelectorAll(".storage-option");
  storageOptions.forEach((option) => {
    option.addEventListener("click", function () {
      storageOptions.forEach((o) => o.classList.remove("active"));
      this.classList.add("active");
      updateTotals();
    });
  });

  // Generate PDF button
  const generatePdfBtn = document.getElementById("generate-pdf");
  if (generatePdfBtn) {
    generatePdfBtn.addEventListener("click", function (e) {
      e.preventDefault();
      try {
        generatePDF();
      } catch (error) {
        console.error("PDF generation error:", error);
        alert("Error generating PDF. Please check the console for details.");
      }
    });
  }

  // New Features Event Listeners
  setupNewEventListeners();
}

function setupNewEventListeners() {
  // Extra Items functionality
  const addItemBtn = document.getElementById("add-extra-item");
  const extraItemsContainer = document.getElementById("extra-items-container");

  addItemBtn.addEventListener("click", function () {
    const newRow = document.createElement("div");
    newRow.className = "extra-item-row";
    newRow.innerHTML = `
            <input type="text" class="extra-item-desc" placeholder="Item Description">
            <input type="number" class="extra-item-price" placeholder="Price" min="0">
            <button type="button" class="delete-item-btn">Delete</button>
        `;
    extraItemsContainer.appendChild(newRow);

    // Add event listener to the new delete button
    newRow
      .querySelector(".delete-item-btn")
      .addEventListener("click", function () {
        newRow.remove();
        updateTotals();
      });

    // Add input listeners for the new fields
    const priceInput = newRow.querySelector(".extra-item-price");
    const descInput = newRow.querySelector(".extra-item-desc");

    priceInput.addEventListener("input", updateTotals);
    descInput.addEventListener("input", updateTotals);
  });

  // Notes functionality
  const addNotesBtn = document.getElementById("add-notes-btn");
  const notesContainer = document.getElementById("notes-container");

  addNotesBtn.addEventListener("click", function () {
    const newNoteRow = document.createElement("div");
    newNoteRow.className = "note-row";
    newNoteRow.innerHTML = `
            <input type="text" class="note-headline-input" placeholder="Headline">
            <textarea class="note-content-textarea" placeholder="List items (each line will be a bullet point)"></textarea>
            <button type="button" class="delete-item-btn">Delete</button>
        `;
    notesContainer.appendChild(newNoteRow);

    // Add event listener to the new delete button
    newNoteRow
      .querySelector(".delete-item-btn")
      .addEventListener("click", function () {
        newNoteRow.remove();
      });
  });

  // POE Switch functionality
  const poeSwitchCheckbox = document.getElementById("poe-switch");
  const poeSwitchSelect = document.getElementById("poe-switch-select");

  poeSwitchCheckbox.addEventListener("change", function () {
    updateTotals();
  });

  poeSwitchSelect.addEventListener("change", function () {
    updateTotals();
  });

  // Monitor Installation functionality
  const monitorCheckbox = document.getElementById("monitor-installation");
  const monitorBrand = document.getElementById("monitor-brand");
  const monitorPrice = document.getElementById("monitor-price");
  const monitorSize = document.getElementById("monitor-size");

  [monitorCheckbox, monitorBrand, monitorPrice, monitorSize].forEach(
    (element) => {
      if (element) {
        element.addEventListener("input", function () {
          updateTotals();
        });
      }
    }
  );

  // Full System Installation functionality
  const systemInstallationAmount = document.getElementById(
    "system-installation-amount"
  );
  if (systemInstallationAmount) {
    systemInstallationAmount.addEventListener("input", function () {
      updateTotals();
    });
  }

  // Extra items price inputs
  document.addEventListener("input", function (e) {
    if (
      e.target.classList.contains("extra-item-price") ||
      e.target.classList.contains("extra-item-desc")
    ) {
      updateTotals();
    }
  });
}

function updatePoeSwitchVisibility() {
  const poeSwitchSection = document.getElementById("poe-switch-section");
  if (currentSystemType === "ip") {
    poeSwitchSection.style.display = "block";
  } else {
    poeSwitchSection.style.display = "none";
    document.getElementById("poe-switch").checked = false;
  }
}

function updatePipingCalculation() {
  const pipingAmountEl = document.querySelector(".piping-amount");
  const pipingTotal = pipingLength * pipingRate;

  if (pipingAmountEl) {
    pipingAmountEl.textContent = `R ${formatCurrency(pipingTotal)}`;
  }
}

function updateRecorderForChannels() {
  const recorderTypeEl = document.getElementById("recorder-type");
  const dvrNvrNameEl = document.getElementById("dvr-nvr-name");
  const dvrNvrDescEl = document.getElementById("dvr-nvr-desc");
  const dvrNvrCheckbox = document.getElementById("dvr-nvr");

  if (currentSystemType === "analog") {
    if (recorderTypeEl) recorderTypeEl.textContent = "DVR";
    if (dvrNvrNameEl)
      dvrNvrNameEl.textContent = `${currentChannels} Channel DVR with H.265`;
    if (dvrNvrDescEl)
      dvrNvrDescEl.textContent = "Digital Video Recorder for analog cameras";
  } else {
    if (recorderTypeEl) recorderTypeEl.textContent = "NVR";
    if (dvrNvrNameEl)
      dvrNvrNameEl.textContent = `${currentChannels} Channel NVR with H.265`;
    if (dvrNvrDescEl)
      dvrNvrDescEl.textContent = "Network Video Recorder for IP cameras";
  }

  // Update DVR/NVR price based on channels and brand
  if (dvrNvrCheckbox) {
    const priceAttr = dvrNvrCheckbox.getAttribute(
      `data-price-${currentSystemType}-${currentBrand}-${currentChannels}`
    );
    if (priceAttr) {
      const price = parseFloat(priceAttr);
      const priceElement = document.getElementById("dvr-nvr-price");
      if (priceElement) {
        priceElement.textContent = `R ${formatCurrency(price)}`;
      }
    }
  }

  // Update the camera quantity maximum based on channels
  document
    .querySelectorAll(
      '.quantity[data-for*="bullet"], .quantity[data-for*="dome"], .quantity[data-for*="4k"]'
    )
    .forEach((input) => {
      input.setAttribute("max", currentChannels);
    });
}

function updateSystemType() {
  // Filter items by system type AND brand
  document.querySelectorAll(".item").forEach((item) => {
    const types = item.getAttribute("data-types");
    const brands = item.getAttribute("data-brands");

    // Show item only if it matches current system type AND current brand
    if (
      types &&
      types.includes(currentSystemType) &&
      brands &&
      brands.includes(currentBrand)
    ) {
      item.style.display = "flex";
    } else if (types) {
      item.style.display = "none";
      const checkbox = item.querySelector('input[type="checkbox"]');
      if (checkbox) checkbox.checked = false;
    }
  });

  // Update prices for system type
  updatePricesForSystemType();
  updatePoeSwitchVisibility();
}

function updatePricesForSystemType() {
  document.querySelectorAll(".item").forEach((item) => {
    const checkbox = item.querySelector('input[type="checkbox"]');
    if (!checkbox) return;

    const price = checkbox.getAttribute("data-price");
    const priceIp = checkbox.getAttribute("data-price-ip");
    const priceAnalog = checkbox.getAttribute("data-price-analog");

    let currentPrice = 0;

    if (currentSystemType === "ip" && priceIp) {
      currentPrice = parseFloat(priceIp);
    } else if (currentSystemType === "analog" && priceAnalog) {
      currentPrice = parseFloat(priceAnalog);
    } else if (price) {
      currentPrice = parseFloat(price);
    }

    if (currentPrice > 0) {
      const variedPrice = applyPriceVariation(currentPrice, checkbox.id);
      const priceElement = item.querySelector(".item-price");
      if (priceElement) {
        const isCable = checkbox.id.includes("cable");
        const isConnector = checkbox.id.includes("connectors");
        priceElement.innerHTML = `R ${formatCurrency(variedPrice)}${
          isCable ? "/m" : isConnector ? "/pack" : ""
        }`;
      }
    }
  });
}

function applyRandomPriceVariations() {
  const items = [
    { id: "dvr-nvr", original: 3499 },
    { id: "power-supply", original: 899 },
    { id: "cat6-cable", original: 35 },
    { id: "rg59-cable", original: 25 },
    { id: "hik-ip-bullet", original: 1499 },
    { id: "dahua-ip-bullet", original: 1399 },
    { id: "hik-analog-bullet", original: 1299 },
    { id: "dahua-analog-bullet", original: 1199 },
    { id: "hik-dome", original: 1299 },
    { id: "dahua-dome", original: 1199 },
    { id: "4k-cam", original: 2999 },
    { id: "solar-flood", original: 1299 },
    { id: "junction-box", original: 63 },
    { id: "bnc-connectors", original: 15 },
    { id: "rj45-connectors", original: 25 },
  ];

  items.forEach((item) => {
    const variation = Math.random() * 0.1 - 0.05;
    const variedPrice = Math.round(item.original * (1 + variation));
    localStorage.setItem(`price_${item.id}`, variedPrice);
  });
}

function applyPriceVariation(basePrice, itemId) {
  const storedPrice = localStorage.getItem(`price_${itemId}`);
  return storedPrice ? parseFloat(storedPrice) : basePrice;
}

function updateTotals() {
  let equipmentSubtotal = 0;
  let servicesSubtotal = 0;

  // Get active storage option
  const activeStorage = document.querySelector(".storage-option.active");
  const storagePrice = activeStorage
    ? parseFloat(activeStorage.getAttribute("data-price"))
    : 0;

  // Check ceiling access
  const activeAccessBtn = document.querySelector(".access-btn.active");
  const ceilingAccessible = activeAccessBtn
    ? activeAccessBtn.getAttribute("data-access") === "yes"
    : true;

  // Calculate piping cost
  const pipingTotal = pipingLength * pipingRate;

  // Loop through all items
  document.querySelectorAll(".item").forEach((item) => {
    if (item.style.display === "none") return;

    const checkbox = item.querySelector('input[type="checkbox"]');
    const quantityInput = item.querySelector(".quantity");
    const itemTotalElement = item.querySelector(".item-total");

    if (checkbox && quantityInput && itemTotalElement) {
      if (checkbox.checked) {
        let price = 0;

        // Special handling for DVR/NVR with channel-based pricing
        if (checkbox.id === "dvr-nvr") {
          const priceAttr =
            checkbox.getAttribute(
              `data-price-${currentSystemType}-${currentBrand}-${currentChannels}`
            ) ||
            checkbox.getAttribute(
              `data-price-${currentSystemType}-${currentBrand}`
            );
          price = priceAttr
            ? parseFloat(priceAttr)
            : parseFloat(checkbox.getAttribute("data-price")) || 0;
        } else {
          // For other items, get price based on system type
          const priceIp = checkbox.getAttribute("data-price-ip");
          const priceAnalog = checkbox.getAttribute("data-price-analog");
          const basePrice = checkbox.getAttribute("data-price");

          if (currentSystemType === "ip" && priceIp) {
            price = parseFloat(priceIp);
          } else if (currentSystemType === "analog" && priceAnalog) {
            price = parseFloat(priceAnalog);
          } else if (basePrice) {
            price = parseFloat(basePrice);
          }

          price = applyPriceVariation(price, checkbox.id);
        }

        const quantity = parseInt(quantityInput.value) || 0;
        const itemTotal = price * quantity;

        itemTotalElement.innerHTML = `R ${formatCurrency(itemTotal)}`;
        equipmentSubtotal += itemTotal;
      } else {
        itemTotalElement.innerHTML = "R 0";
      }
    }
  });

  // Add new sections to equipment subtotal
  // POE Switch
  const poeSwitchCheckbox = document.getElementById("poe-switch");
  if (
    poeSwitchCheckbox &&
    poeSwitchCheckbox.checked &&
    currentSystemType === "ip"
  ) {
    const poeSwitchSelect = document.getElementById("poe-switch-select");
    const selectedOption =
      poeSwitchSelect.options[poeSwitchSelect.selectedIndex];
    const poePrice = parseFloat(selectedOption.getAttribute("data-price")) || 0;
    equipmentSubtotal += poePrice;
  }

  // Monitor Installation
  const monitorCheckbox = document.getElementById("monitor-installation");
  if (monitorCheckbox && monitorCheckbox.checked) {
    const monitorPrice =
      parseFloat(document.getElementById("monitor-price").value) || 0;
    equipmentSubtotal += monitorPrice;
  }

  // Full System Installation (ALWAYS included as labour)
  const systemInstallationAmount =
    parseFloat(document.getElementById("system-installation-amount").value) ||
    0;
  servicesSubtotal += systemInstallationAmount;

  // Add storage
  equipmentSubtotal += storagePrice;

  // Add piping cost to services (only if ceiling not accessible)
  if (!ceilingAccessible) {
    servicesSubtotal += pipingTotal;
  }

  // Add extra items
  let extraItemsTotal = 0;
  document.querySelectorAll(".extra-item-row").forEach((row) => {
    const priceInput = row.querySelector(".extra-item-price");
    const price = parseFloat(priceInput.value) || 0;
    extraItemsTotal += price;
  });
  equipmentSubtotal += extraItemsTotal;

  // Update summary
  const taxRate = 0.15;
  const taxAmount = (equipmentSubtotal + servicesSubtotal) * taxRate;
  const grandTotal = equipmentSubtotal + servicesSubtotal + taxAmount;

  const equipmentEl = document.getElementById("equipment-subtotal");
  const servicesEl = document.getElementById("services-subtotal");
  const taxEl = document.getElementById("tax-amount");
  const grandEl = document.getElementById("grand-total");

  if (equipmentEl)
    equipmentEl.textContent = `R ${formatCurrency(equipmentSubtotal)}`;
  if (servicesEl)
    servicesEl.textContent = `R ${formatCurrency(servicesSubtotal)}`;
  if (taxEl) taxEl.textContent = `R ${formatCurrency(taxAmount)}`;
  if (grandEl) grandEl.textContent = `R ${formatCurrency(grandTotal)}`;
}

function filterByBrand(brand) {
  document.querySelectorAll(".item").forEach((item) => {
    const brands = item.getAttribute("data-brands");
    const types = item.getAttribute("data-types");

    // Show item only if it matches the selected brand AND current system type
    if (
      brands &&
      brands.includes(brand) &&
      types &&
      types.includes(currentSystemType)
    ) {
      item.style.display = "flex";
    } else {
      item.style.display = "none";

      // Uncheck hidden items
      const checkbox = item.querySelector('input[type="checkbox"]');
      if (checkbox) checkbox.checked = false;
    }
  });

  // Update DVR/NVR specifically for the selected brand and channels
  updateRecorderForChannels();

  // Also update all prices for the current system type
  updatePricesForSystemType();
}

function applyBrandTheme(brand) {
  document.body.className = `theme-${brand}`;
}

function formatCurrency(amount) {
  if (isNaN(amount)) amount = 0;
  return Number(amount)
    .toFixed(0)
    .replace(/\B(?=(\d{3})+(?!\d))/g, ",");
}

function generatePDF() {
  // Check if jsPDF is loaded
  if (typeof window.jspdf === "undefined") {
    alert("PDF library not loaded. Please check your internet connection.");
    return;
  }

  const { jsPDF } = window.jspdf;
  const doc = new jsPDF();

  // Get active brand for theming
  const brandName = currentBrand === "hikvision" ? "Hikvision" : "Dahua";
  const systemTypeName = currentSystemType === "analog" ? "Analog" : "IP";

  // Set brand-specific colors
  const primaryColor =
    currentBrand === "hikvision" ? [229, 51, 56] : [0, 86, 164];

  // PAGE 1: Header and Quote Details
  // Add company header with brand colors
  doc.setFillColor(primaryColor[0], primaryColor[1], primaryColor[2]);
  doc.rect(0, 0, 210, 40, "F");

  doc.setTextColor(255, 255, 255);
  doc.setFontSize(24);
  doc.text("Crown Secure Systems", 105, 14, { align: "center" });
  doc.setFontSize(16);
  doc.text("Professional CCTV Installation", 105, 26, { align: "center" });
  doc.setFontSize(14);
  doc.text(`System: ${systemTypeName} | Brand: ${brandName}`, 105, 33, {
    align: "center",
  });

  // Quote details section
  doc.setTextColor(0, 0, 0);
  let yPosition = 50;

  doc.setFontSize(20);
  doc.setTextColor(primaryColor[0], primaryColor[1], primaryColor[2]);
  doc.text("SECURITY SYSTEM QUOTE", 20, (yPosition = 55));
  yPosition += 12;

  doc.setFontSize(14);
  doc.setTextColor(0, 0, 0);

  const clientName =
    document.getElementById("customer-name")?.value || "Client Name";
  const quoteDate = document.getElementById("quote-date")?.value || "";
  const validUntil = document.getElementById("valid-until")?.value || "";
  const preparedBy =
    document.getElementById("company-name")?.value || "Prepared By";
  const clientAddress =
    document.getElementById("client-address")?.value || "Client Address";

  const now = new Date();
  const quoteTime = now.toLocaleTimeString("en-ZA", {
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  });

  // Client details in two columns - consistent line height
  doc.text(
    `Client: ${clientName.charAt(0).toUpperCase() + clientName.slice(1)}`,
    20,
    yPosition
  );
  doc.text("Quote Date:", 110, yPosition);
  doc.text(formatDate(quoteDate), 145, yPosition);
  yPosition += 8;

  doc.text(`Time: ${quoteTime}`, 20, yPosition);
  doc.text("Valid Until:", 110, yPosition);
  doc.text(formatDate(validUntil), 145, yPosition);
  yPosition += 8;

  doc.text(
    `Prepared By: ${preparedBy.charAt(0).toUpperCase() + clientName.slice(1)}`,
    20,
    yPosition
  );
  yPosition += 8;

  doc.text(`Client Address: ${clientAddress}`, 20, yPosition);
  yPosition += 15;

  // Project details section
  doc.setFontSize(16);
  doc.setTextColor(primaryColor[0], primaryColor[1], primaryColor[2]);
  doc.text("PROJECT DETAILS", 20, yPosition);
  yPosition += 10;

  // Table headers with proper alignment (WITH PRICE COLUMN)
  doc.setFontSize(13);
  doc.setTextColor(0, 0, 0);
  doc.setFont(undefined, "bold");

  // Fixed column positions for perfect alignment
  const descX = 20;
  const qtyX = 120;
  const priceX = 140;
  const totalX = 175;

  doc.text("Description", descX, yPosition);
  doc.text("Qty", qtyX, yPosition);
  doc.text("Price", priceX, yPosition);
  doc.text("Total", totalX, yPosition);

  yPosition += 7;
  doc.setDrawColor(200, 200, 200);
  doc.line(descX, yPosition, 190, yPosition);
  yPosition += 10;

  doc.setFont(undefined, "normal");

  let itemCount = 0;
  let subtotal = 0;

  // Collect all items first to calculate proper heights
  const items = [];

  // Add extra items
  document.querySelectorAll(".extra-item-row").forEach((row) => {
    const descInput = row.querySelector(".extra-item-desc");
    const priceInput = row.querySelector(".extra-item-price");
    const desc = descInput?.value || "Additional Item";
    const price = parseFloat(priceInput?.value) || 0;

    if (desc && price > 0) {
      items.push({
        name: desc,
        qty: "1",
        price: `R ${formatCurrency(price)}`,
        total: `R ${formatCurrency(price)}`,
        totalValue: price,
      });
    }
  });

  // Add regular items
  document.querySelectorAll(".item").forEach((item) => {
    if (item.style.display === "none") return;
    const checkbox = item.querySelector('input[type="checkbox"]');
    if (!checkbox || !checkbox.checked) return;

    const itemName = item.querySelector(".item-name")?.textContent || "Item";
    const quantity = item.querySelector(".quantity")?.value || "1";
    const itemPrice = item.querySelector(".item-price")?.textContent || "R 0";
    const itemTotal = item.querySelector(".item-total")?.textContent || "R 0";

    items.push({
      name: itemName,
      qty: quantity,
      price: itemPrice,
      total: itemTotal,
      totalValue: parseFloat(itemTotal.replace("R", "").replace(/,/g, "")) || 0,
    });
  });

  // Add POE Switch
  const poeSwitchCheckbox = document.getElementById("poe-switch");
  if (
    poeSwitchCheckbox &&
    poeSwitchCheckbox.checked &&
    currentSystemType === "ip"
  ) {
    const poeSwitchSelect = document.getElementById("poe-switch-select");
    const selectedOption =
      poeSwitchSelect.options[poeSwitchSelect.selectedIndex];
    const poePrice = parseFloat(selectedOption.getAttribute("data-price")) || 0;
    const channelCount = selectedOption.value;

    items.push({
      name: `${channelCount} Channel POE Switch`,
      qty: "1",
      price: `R ${formatCurrency(poePrice)}`,
      total: `R ${formatCurrency(poePrice)}`,
      totalValue: poePrice,
    });
  }

  // Add Monitor Installation
  const monitorCheckbox = document.getElementById("monitor-installation");
  if (monitorCheckbox && monitorCheckbox.checked) {
    const monitorBrand = document.getElementById("monitor-brand")?.value || "";
    const monitorPrice =
      parseFloat(document.getElementById("monitor-price")?.value) || 0;
    const monitorSize = document.getElementById("monitor-size")?.value || "";

    items.push({
      name: `Monitor Installation - ${monitorBrand} ${monitorSize}"`,
      qty: "1",
      price: `R ${formatCurrency(monitorPrice)}`,
      total: `R ${formatCurrency(monitorPrice)}`,
      totalValue: monitorPrice,
    });
  }

  // Add storage
  const activeStorage = document.querySelector(".storage-option.active");
  if (activeStorage) {
    const storageSize = activeStorage.getAttribute("data-size");
    const storagePrice = parseFloat(activeStorage.getAttribute("data-price"));
    items.push({
      name: `${storageSize}TB Surveillance Hard Drive`,
      qty: "1",
      price: `R ${formatCurrency(storagePrice)}`,
      total: `R ${formatCurrency(storagePrice)}`,
      totalValue: storagePrice,
    });
  }

  // Add piping if applicable
  const activeAccessBtn = document.querySelector(".access-btn.active");
  const ceilingAccessible = activeAccessBtn
    ? activeAccessBtn.getAttribute("data-access") === "yes"
    : true;

  if (!ceilingAccessible && pipingLength > 0) {
    const pipingTotal = pipingLength * pipingRate;
    items.push({
      name: `Conduit & Piping Installation (${pipingLength}m)`,
      qty: "1",
      price: `R ${formatCurrency(pipingTotal)}`,
      total: `R ${formatCurrency(pipingTotal)}`,
      totalValue: pipingTotal,
    });
  }

  // Display items with proper formatting
  items.forEach((item, index) => {
    // Check for page break
    if (yPosition > 180) {
      doc.addPage();
      yPosition = 20;

      // Add table headers on new page
      doc.setFontSize(13);
      doc.setTextColor(0, 0, 0);
      doc.setFont(undefined, "bold");
      doc.text("Description", descX, yPosition);
      doc.text("Qty", qtyX, yPosition);
      doc.text("Price", priceX, yPosition);
      doc.text("Total", totalX, yPosition);
      yPosition += 7;
      doc.setDrawColor(200, 200, 200);
      doc.line(descX, yPosition, 190, yPosition);
      yPosition += 10;
      doc.setFont(undefined, "normal");
    }

    // Split long item names
    const splitName = doc.splitTextToSize(item.name, 80);

    // Item description
    doc.text(splitName, descX, yPosition);

    // Quantities, prices and totals - perfectly aligned
    doc.text(item.qty, qtyX, yPosition);
    doc.text(item.price, priceX, yPosition);
    doc.text(item.total, totalX, yPosition);

    // Calculate height for this row with consistent line height
    const rowHeight = Math.max(10, splitName.length * 5);
    yPosition += rowHeight;

    subtotal += item.totalValue;
    itemCount++;
  });

  // Calculate totals
  const systemInstallationAmount =
    parseFloat(document.getElementById("system-installation-amount").value) ||
    0;

  const taxRate = 0.15;
  const taxAmount = (subtotal + systemInstallationAmount) * taxRate;
  const grandTotal = subtotal + systemInstallationAmount + taxAmount;

  // Check if we need a new page for totals
  if (yPosition > 200) {
    doc.addPage();
    yPosition = 20;
  }

  // Totals section with perfect alignment and consistent line height
  yPosition += 10;

  // Draw separator line
  doc.setDrawColor(200, 200, 200);
  doc.line(descX, yPosition, 190, yPosition);
  yPosition += 10;

  doc.setFont(undefined, "bold");
  doc.setFontSize(14);

  // Project Subtotal - aligned to the right
  doc.text("Project Subtotal:", descX, yPosition);
  doc.text(`R ${formatCurrency(subtotal)}`, totalX, yPosition, {
    align: "right",
  });
  yPosition += 8;

  // Full System Installation & Setup
  doc.text("Full System Installation & Setup:", descX, yPosition);
  doc.text(`R ${formatCurrency(systemInstallationAmount)}`, totalX, yPosition, {
    align: "right",
  });
  yPosition += 8;

  // VAT
  doc.text("VAT (15%):", descX, yPosition);
  doc.text(`R ${formatCurrency(taxAmount)}`, totalX, yPosition, {
    align: "right",
  });
  yPosition += 10;

  // Grand Total
  doc.setFontSize(16);
  doc.text("TOTAL:", descX, yPosition);
  doc.text(`R ${formatCurrency(grandTotal)}`, totalX, yPosition, {
    align: "right",
  });
  yPosition += 15;

  // Ceiling accessibility message
  if (ceilingAccessible) {
    doc.setFontSize(13);
    doc.setFont(undefined, "normal");
    doc.setTextColor(0, 128, 0);
    doc.text(
      "| Ceiling accessible - No piping installation required |",
      descX,
      yPosition
    );
    doc.setTextColor(0, 0, 0);
    yPosition += 10;
  }

  // PAGE 2: Additional Information
  doc.addPage();
  yPosition = 20;

  // Banking details table
  doc.setFont(undefined, "bold");
  doc.text("Banking Details", 20, yPosition);
  yPosition += 6;

  doc.setFont(undefined, "normal");

  // Table settings
  const startX = 20;
  const startY = yPosition;
  const col1Width = 60;
  const col2Width = 110;
  const rowHeight = 10;
  const borderColor = [180, 180, 180];

  // Data for rows
  const bankingDetails = [
    ["Account Holder", "Crown Secure Systems"],
    ["Bank Name", "Capitec"],
    ["Account Number", "1234567890"],
    [
      "Reference",
      `Quote For ${clientName.charAt(0).toUpperCase() + clientName.slice(1)}`,
    ],
  ];

  // Draw table rows with borders
  doc.setDrawColor(...borderColor);
  doc.setLineWidth(0.2);

  // Draw horizontal and vertical lines
  for (let i = 0; i <= bankingDetails.length; i++) {
    const y = startY + i * rowHeight;
    doc.line(startX, y, startX + col1Width + col2Width, y);
  }
  doc.line(startX, startY, startX, startY + rowHeight * bankingDetails.length);
  doc.line(
    startX + col1Width,
    startY,
    startX + col1Width,
    startY + rowHeight * bankingDetails.length
  );
  doc.line(
    startX + col1Width + col2Width,
    startY,
    startX + col1Width + col2Width,
    startY + rowHeight * bankingDetails.length
  );

  // Add text inside cells
  for (let i = 0; i < bankingDetails.length; i++) {
    const yText = startY + i * rowHeight + 7;
    doc.text(bankingDetails[i][0], startX + 4, yText);
    doc.text(bankingDetails[i][1], startX + col1Width + 4, yText);
  }

  yPosition = startY + rowHeight * bankingDetails.length + 16;

  // Custom Notes Section - FIXED: Now properly displays notes in PDF
  const noteRows = document.querySelectorAll(".note-row");
  if (noteRows.length > 0) {
    noteRows.forEach((noteRow) => {
      const headline =
        noteRow.querySelector(".note-headline-input")?.value || "";
      const content =
        noteRow.querySelector(".note-content-textarea")?.value || "";

      if (headline && content) {
        // Check if we need a new page
        if (yPosition > 250) {
          doc.addPage();
          yPosition = 20;
        }

        doc.setFont(undefined, "bold");
        doc.text(headline + ":", 20, yPosition);
        yPosition += 10;

        doc.setFont(undefined, "normal");

        // Split content by new lines for bullet points
        const contentItems = content
          .split("\n")
          .filter((item) => item.trim() !== "");
        contentItems.forEach((item) => {
          // Check if we need a new page for content
          if (yPosition > 270) {
            doc.addPage();
            yPosition = 20;
            doc.setFont(undefined, "normal");
          }
          doc.text(`• ${item.trim()}`, 25, yPosition);
          yPosition += 8;
        });

        yPosition += 8;
      }
    });
  }

  // Package Includes section
  doc.setFont(undefined, "bold");
  doc.text("Package Includes:", 20, yPosition);
  yPosition += 10;

  doc.setFont(undefined, "normal");
  const packageItems = [
    "Supply and installation of all listed equipment",
    "Configuration for mobile app viewing",
    "System testing and demonstration upon completion",
    "Free 7-day remote support after installation",
  ];

  packageItems.forEach((item) => {
    doc.text(`• ${item}`, 25, yPosition);
    yPosition += 8;
  });

  yPosition += 12;

  // Payment Terms section
  if (yPosition > 250) {
    doc.addPage();
    yPosition = 20;
  }

  doc.setFont(undefined, "bold");
  doc.text("Payment Terms:", 20, yPosition);
  yPosition += 10;

  doc.setFont(undefined, "normal");
  const paymentItems = [
    "50% deposit to confirm booking",
    "Balance payable upon completion and client satisfaction",
  ];

  paymentItems.forEach((item) => {
    doc.text(`• ${item}`, 25, yPosition);
    yPosition += 8;
  });

  // Page footer
  const pageHeight = doc.internal.pageSize.getHeight();
  const footerMargin = 18;
  const footerY = pageHeight - footerMargin;

  doc.setDrawColor(220, 220, 220);
  doc.line(20, footerY - 12, 190, footerY - 12);

  doc.setFontSize(13);
  doc.setTextColor(100, 100, 100);
  doc.text(
    `Thank you ${
      clientName.charAt(0).toUpperCase() + clientName.slice(1)
    } for considering Crown Secure Systems.`,
    105,
    footerY - 6,
    { align: "center" }
  );
  doc.text(
    "We look forward to securing your property with our professional solutions.",
    105,
    footerY + 6,
    { align: "center" }
  );

  // Save the PDF
  doc.save(`CrownSecure-Quote-${clientName.replace(/\s+/g, "-")}.pdf`);
}

function formatDate(dateString) {
  if (!dateString) return "Date";
  const date = new Date(dateString);
  return date.toLocaleDateString("en-ZA", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
}
