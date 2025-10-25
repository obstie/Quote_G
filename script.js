// Base64 encoded brand logos
const brandLogos = {
    hikvision: "data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMTUwIiBoZWlnaHQ9IjQwIiB2aWV3Qm94PSIwIDAgMTUwIDQwIiBmaWxsPSJub25lIiB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciPjxyZWN0IHg9IjAiIHk9IjAiIHdpZHRoPSIxNTAiIGhlaWdodD0iNDAiIGZpbGw9IiNlNTMyMzgiLz48dGV4dCB4PSI3NSIgeT0iMjUiIGZvbnQtZmFtaWx5PSJBcmlhbCIgZm9udC1zaXplPSIxNCIgZmlsbD0id2hpdGUiIHRleHQtYW5jaG9yPSJtaWRkbGUiPkhJS1ZJU0lPTjwvdGV4dD48L3N2Zz4=",
    dahua: "data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMTUwIiBoZWlnaHQ9IjQwIiB2aWV3Qm94PSIwIDAgMTUwIDQwIiBmaWxsPSJub25lIiB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciPjxyZWN0IHg9IjAiIHk9IjAiIHdpZHRoPSIxNTAiIGhlaWdodD0iNDAiIGZpbGw9IiMwMDU2YTQiLz48dGV4dCB4PSI3NSIgeT0iMjUiIGZvbnQtZmFtaWx5PSJBcmlhbCIgZm9udC1zaXplPSIxNCIgZmlsbD0id2hpdGUiIHRleHQtYW5jaG9yPSJtaWRkbGUiPkRBSFVBLkNPTSA8L3RleHQ+PC9zdmc+"
};

// Global variables
let labourAmount = 1500;
let cableExtraCharge = 0;
let currentSystemType = 'ip';
let currentChannels = 4;
let pipingLength = 0;
let pipingRate = 85;
let currentBrand = 'hikvision';

// Wait for DOM to be fully loaded
document.addEventListener('DOMContentLoaded', function() {
    initializeApp();
});

function initializeApp() {
    // Set default dates
    const today = new Date();
    const validUntil = new Date();
    validUntil.setMonth(today.getMonth() + 3);
    
    const quoteDateEl = document.getElementById('quote-date');
    const validUntilEl = document.getElementById('valid-until');
    
    if (quoteDateEl) quoteDateEl.valueAsDate = today;
    if (validUntilEl) validUntilEl.valueAsDate = validUntil;
    
    // Setup all event listeners
    setupEventListeners();
    
    // Initial calculations and UI updates
    updateLabour();
    updateSystemType();
    updateRecorderForChannels();
    updateTotals();
    
    // Add random price variations
    applyRandomPriceVariations();
}

function setupEventListeners() {
    // Labour controls
    const increaseLabourBtn = document.getElementById('increase-labour');
    const decreaseLabourBtn = document.getElementById('decrease-labour');
    
    if (increaseLabourBtn) {
        increaseLabourBtn.addEventListener('click', function() {
            labourAmount += 50;
            updateLabour();
            updateTotals();
        });
    }
    
    if (decreaseLabourBtn) {
        decreaseLabourBtn.addEventListener('click', function() {
            if (labourAmount > 1500) {
                labourAmount -= 50;
                updateLabour();
                updateTotals();
            }
        });
    }
    
    // Ceiling access controls
    const accessButtons = document.querySelectorAll('.access-btn');
    accessButtons.forEach(btn => {
        btn.addEventListener('click', function() {
            accessButtons.forEach(b => b.classList.remove('active'));
            this.classList.add('active');
            
            const accessType = this.getAttribute('data-access');
            const pipingSection = document.getElementById('piping-section');
            
            if (accessType === 'no') {
                pipingSection.classList.remove('hidden');
            } else {
                pipingSection.classList.add('hidden');
                document.getElementById('piping-length').value = 0;
                pipingLength = 0;
                updatePipingCalculation();
            }
            
            updateTotals();
        });
    });
    
    // Piping length input
    const pipingLengthInput = document.getElementById('piping-length');
    if (pipingLengthInput) {
        pipingLengthInput.addEventListener('input', function() {
            pipingLength = parseInt(this.value) || 0;
            updatePipingCalculation();
            updateTotals();
        });
    }
    
    // System type controls
    const systemTypeButtons = document.querySelectorAll('.system-type-btn');
    systemTypeButtons.forEach(btn => {
        btn.addEventListener('click', function() {
            systemTypeButtons.forEach(b => b.classList.remove('active'));
            this.classList.add('active');
            currentSystemType = this.getAttribute('data-type');
            updateSystemType();
            updateRecorderForChannels();
            updateTotals();
        });
    });
    
    // Channel selection buttons
    const channelButtons = document.querySelectorAll('.channel-btn');
    channelButtons.forEach(btn => {
        btn.addEventListener('click', function() {
            channelButtons.forEach(b => b.classList.remove('active'));
            this.classList.add('active');
            currentChannels = parseInt(this.getAttribute('data-channels'));
            updateRecorderForChannels();
            updateTotals();
        });
    });
    
    // Checkboxes and quantity inputs
    const checkboxes = document.querySelectorAll('input[type="checkbox"]');
    const quantityInputs = document.querySelectorAll('.quantity');
    
    checkboxes.forEach(checkbox => {
        checkbox.addEventListener('change', updateTotals);
    });
    
    quantityInputs.forEach(input => {
        input.addEventListener('input', updateTotals);
    });
    
    // Brand selection
    const brandButtons = document.querySelectorAll('.brand-btn');
    brandButtons.forEach(btn => {
        btn.addEventListener('click', function() {
            brandButtons.forEach(b => b.classList.remove('active'));
            this.classList.add('active');
            const selectedBrand = this.getAttribute('data-brand');
            currentBrand = selectedBrand;
            filterByBrand(selectedBrand);
            applyBrandTheme(selectedBrand);
            updateTotals();
        });
    });
    
    // Storage options
    const storageOptions = document.querySelectorAll('.storage-option');
    storageOptions.forEach(option => {
        option.addEventListener('click', function() {
            storageOptions.forEach(o => o.classList.remove('active'));
            this.classList.add('active');
            updateTotals();
        });
    });
    
    // Generate PDF button
    const generatePdfBtn = document.getElementById('generate-pdf');
    if (generatePdfBtn) {
        generatePdfBtn.addEventListener('click', function(e) {
            e.preventDefault();
            try {
                generatePDF();
            } catch (error) {
                console.error('PDF generation error:', error);
                alert('Error generating PDF. Please check the console for details.');
            }
        });
    }
}

function updateLabour() {
    const labourAmountEl = document.querySelector('.labour-amount');
    if (labourAmountEl) {
        labourAmountEl.textContent = `R ${formatCurrency(labourAmount)}`;
    }
}

function updatePipingCalculation() {
    const pipingAmountEl = document.querySelector('.piping-amount');
    const pipingTotal = pipingLength * pipingRate;
    
    if (pipingAmountEl) {
        pipingAmountEl.textContent = `R ${formatCurrency(pipingTotal)}`;
    }
}

function updateRecorderForChannels() {
    const recorderTypeEl = document.getElementById('recorder-type');
    const dvrNvrNameEl = document.getElementById('dvr-nvr-name');
    const dvrNvrDescEl = document.getElementById('dvr-nvr-desc');
    const dvrNvrCheckbox = document.getElementById('dvr-nvr');
    
    if (currentSystemType === 'analog') {
        if (recorderTypeEl) recorderTypeEl.textContent = 'DVR';
        if (dvrNvrNameEl) dvrNvrNameEl.textContent = `${currentChannels} Channel DVR with H.265`;
        if (dvrNvrDescEl) dvrNvrDescEl.textContent = 'Digital Video Recorder for analog cameras';
    } else {
        if (recorderTypeEl) recorderTypeEl.textContent = 'NVR';
        if (dvrNvrNameEl) dvrNvrNameEl.textContent = `${currentChannels} Channel NVR with H.265`;
        if (dvrNvrDescEl) dvrNvrDescEl.textContent = 'Network Video Recorder for IP cameras';
    }
    
    // Update DVR/NVR price based on channels and brand
    if (dvrNvrCheckbox) {
        const priceAttr = dvrNvrCheckbox.getAttribute(`data-price-${currentSystemType}-${currentBrand}-${currentChannels}`);
        if (priceAttr) {
            const price = parseFloat(priceAttr);
            const priceElement = document.getElementById('dvr-nvr-price');
            if (priceElement) {
                priceElement.textContent = formatCurrency(price);
            }
        }
    }
    
    // Update the camera quantity maximum based on channels
    document.querySelectorAll('.quantity[data-for*="bullet"], .quantity[data-for*="dome"], .quantity[data-for*="4k"]').forEach(input => {
        input.setAttribute('max', currentChannels);
    });
}

function updateSystemType() {
    // Filter items by system type AND brand
    document.querySelectorAll('.item').forEach(item => {
        const types = item.getAttribute('data-types');
        const brands = item.getAttribute('data-brands');
        
        // Show item only if it matches current system type AND current brand
        if (types && types.includes(currentSystemType) && brands && brands.includes(currentBrand)) {
            item.style.display = 'flex';
        } else if (types) {
            item.style.display = 'none';
            const checkbox = item.querySelector('input[type="checkbox"]');
            if (checkbox) checkbox.checked = false;
        }
    });
    
    // Update prices for system type
    updatePricesForSystemType();
}

function updatePricesForSystemType() {
    document.querySelectorAll('.item').forEach(item => {
        const checkbox = item.querySelector('input[type="checkbox"]');
        if (!checkbox) return;
        
        const price = checkbox.getAttribute('data-price');
        const priceIp = checkbox.getAttribute('data-price-ip');
        const priceAnalog = checkbox.getAttribute('data-price-analog');
        
        let currentPrice = 0;
        
        if (currentSystemType === 'ip' && priceIp) {
            currentPrice = parseFloat(priceIp);
        } else if (currentSystemType === 'analog' && priceAnalog) {
            currentPrice = parseFloat(priceAnalog);
        } else if (price) {
            currentPrice = parseFloat(price);
        }
        
        if (currentPrice > 0) {
            const variedPrice = applyPriceVariation(currentPrice, checkbox.id);
            const priceElement = item.querySelector('.item-price');
            if (priceElement) {
                const isCable = checkbox.id.includes('cable');
                const isConnector = checkbox.id.includes('connectors');
                priceElement.innerHTML = `R ${formatCurrency(variedPrice)}${isCable ? '/m' : isConnector ? '/pack' : ''}`;
            }
        }
    });
}

function applyRandomPriceVariations() {
    const items = [
        { id: 'dvr-nvr', original: 3499 },
        { id: 'power-supply', original: 899 },
        { id: 'cat6-cable', original: 35 },
        { id: 'rg59-cable', original: 25 },
        { id: 'hik-ip-bullet', original: 1499 },
        { id: 'dahua-ip-bullet', original: 1399 },
        { id: 'hik-analog-bullet', original: 1299 },
        { id: 'dahua-analog-bullet', original: 1199 },
        { id: 'hik-dome', original: 1299 },
        { id: 'dahua-dome', original: 1199 },
        { id: '4k-cam', original: 2999 },
        { id: 'solar-flood', original: 1299 },
        { id: 'junction-box', original: 63 },
        { id: 'bnc-connectors', original: 15 },
        { id: 'rj45-connectors', original: 25 }
    ];
    
    items.forEach(item => {
        const variation = (Math.random() * 0.1) - 0.05;
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
    let cableSubtotal = 0;
    
    // Get active storage option
    const activeStorage = document.querySelector('.storage-option.active');
    const storagePrice = activeStorage ? parseFloat(activeStorage.getAttribute('data-price')) : 0;
    
    // Check ceiling access
    const activeAccessBtn = document.querySelector('.access-btn.active');
    const ceilingAccessible = activeAccessBtn ? activeAccessBtn.getAttribute('data-access') === 'yes' : true;
    const ceilingDiscount = ceilingAccessible ? 700 : 0;
    
    // Calculate piping cost
    const pipingTotal = pipingLength * pipingRate;
    
    // Get labour amount
    const labourAmountEl = document.querySelector('.labour-amount');
    const currentLabourAmount = labourAmountEl ? parseInt(labourAmountEl.textContent.replace('R', '').replace(/,/g, '')) : 1500;
    
    // Loop through all items
    document.querySelectorAll('.item').forEach(item => {
        if (item.style.display === 'none') return;
        
        const checkbox = item.querySelector('input[type="checkbox"]');
        const quantityInput = item.querySelector('.quantity');
        const itemTotalElement = item.querySelector('.item-total');
        
        if (checkbox && quantityInput && itemTotalElement) {
            if (checkbox.checked) {
                let price = 0;
                
                // Special handling for DVR/NVR with channel-based pricing
                if (checkbox.id === 'dvr-nvr') {
                    const priceAttr = checkbox.getAttribute(`data-price-${currentSystemType}-${currentBrand}-${currentChannels}`) || 
                                    checkbox.getAttribute(`data-price-${currentSystemType}-${currentBrand}`);
                    price = priceAttr ? parseFloat(priceAttr) : parseFloat(checkbox.getAttribute('data-price')) || 0;
                } else {
                    // For other items, get price based on system type
                    const priceIp = checkbox.getAttribute('data-price-ip');
                    const priceAnalog = checkbox.getAttribute('data-price-analog');
                    const basePrice = checkbox.getAttribute('data-price');
                    
                    if (currentSystemType === 'ip' && priceIp) {
                        price = parseFloat(priceIp);
                    } else if (currentSystemType === 'analog' && priceAnalog) {
                        price = parseFloat(priceAnalog);
                    } else if (basePrice) {
                        price = parseFloat(basePrice);
                    }
                    
                    price = applyPriceVariation(price, checkbox.id);
                }
                
                const quantity = parseInt(quantityInput.value) || 0;
                const itemTotal = price * quantity;
                
                itemTotalElement.innerHTML = `R ${formatCurrency(itemTotal)}`;
                
                // Separate cable costs
                if (checkbox.id.includes('cable') || checkbox.id.includes('connectors')) {
                    cableSubtotal += itemTotal;
                } else {
                    equipmentSubtotal += itemTotal;
                }
            } else {
                itemTotalElement.innerHTML = 'R 0';
            }
        }
    });
    
    // Add storage
    equipmentSubtotal += storagePrice;
    
    // Add piping cost to services
    servicesSubtotal += pipingTotal;
    
    // Add cable extra charge
    cableSubtotal += cableExtraCharge;
    
    // Add labour to services (minus discount if ceiling accessible)
    servicesSubtotal += currentLabourAmount - ceilingDiscount;
    
    // Update summary
    const taxRate = 0.15;
    const taxAmount = (equipmentSubtotal + servicesSubtotal + cableSubtotal) * taxRate;
    const grandTotal = equipmentSubtotal + servicesSubtotal + cableSubtotal + taxAmount;
    
    const equipmentEl = document.getElementById('equipment-subtotal');
    const servicesEl = document.getElementById('services-subtotal');
    const taxEl = document.getElementById('tax-amount');
    const grandEl = document.getElementById('grand-total');
    
    if (equipmentEl) equipmentEl.textContent = `R ${formatCurrency(equipmentSubtotal)}`;
    if (servicesEl) servicesEl.textContent = `R ${formatCurrency(servicesSubtotal)}`;
    if (taxEl) taxEl.textContent = `R ${formatCurrency(taxAmount)}`;
    if (grandEl) grandEl.textContent = `R ${formatCurrency(grandTotal)}`;
}

function filterByBrand(brand) {
    document.querySelectorAll('.item').forEach(item => {
        const brands = item.getAttribute('data-brands');
        const types = item.getAttribute('data-types');
        
        // Show item only if it matches the selected brand AND current system type
        if (brands && brands.includes(brand) && types && types.includes(currentSystemType)) {
            item.style.display = 'flex';
        } else {
            item.style.display = 'none';
            
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
    return Number(amount).toFixed(0).replace(/\B(?=(\d{3})+(?!\d))/g, ",");
}

function generatePDF() {
    // Check if jsPDF is loaded
    if (typeof window.jspdf === 'undefined') {
        alert('PDF library not loaded. Please check your internet connection.');
        return;
    }

    const { jsPDF } = window.jspdf;
    const doc = new jsPDF();
    
    // Get active brand for theming
    const brandName = currentBrand === 'hikvision' ? 'Hikvision' : 'Dahua';
    const systemTypeName = currentSystemType === 'analog' ? 'Analog' : 'IP';
    
    // Set brand-specific colors
    const primaryColor = currentBrand === 'hikvision' ? [229, 51, 56] : [0, 86, 164];
    
    // PAGE 1: Header and Quote Details
    // Add company header with brand colors
    doc.setFillColor(primaryColor[0], primaryColor[1], primaryColor[2]);
    doc.rect(0, 0, 210, 40, 'F');
    
    // Add brand logo
    try {
        doc.addImage(brandLogos[currentBrand], 'PNG', 20, 8, 35, 12);
    } catch (e) {
        console.warn('Logo not loaded:', e);
    }
    
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(24);
    doc.text('Crown Secure Systems', 105, 14, { align: 'center' });
    doc.setFontSize(16);
    doc.text('Professional CCTV Installation', 105, 26, { align: 'center' });
    doc.setFontSize(14);
    doc.text(`System: ${systemTypeName} | Brand: ${brandName}`, 105, 33, { align: 'center' });
    
    // Quote details section
    doc.setTextColor(0, 0, 0);
    let yPosition = 50;
    
    doc.setFontSize(20);
    doc.setTextColor(primaryColor[0], primaryColor[1], primaryColor[2]);
    doc.text('SECURITY SYSTEM QUOTE', 20, yPosition = 55);
    yPosition += 12;
    
    doc.setFontSize(14);
    doc.setTextColor(0, 0, 0);
    
    const clientName = document.getElementById('customer-name')?.value || 'Client Name';
    const quoteDate = document.getElementById('quote-date')?.value || '';
    const validUntil = document.getElementById('valid-until')?.value || '';
    const preparedBy = document.getElementById('company-name')?.value || 'Prepared By';
    const clientAddress = document.getElementById('client-address')?.value || 'Client Address';
    
    const now = new Date();
    const quoteTime = now.toLocaleTimeString('en-ZA', { 
        hour: '2-digit', 
        minute: '2-digit',
        hour12: false 
    });
    
    // Client details in two columns - consistent line height
    doc.text(`Client: ${clientName.charAt(0).toUpperCase() + clientName.slice(1)}`, 20, yPosition);
    doc.text('Quote Date:', 110, yPosition);
    doc.text(formatDate(quoteDate), 145, yPosition);
    yPosition += 8;
    
    doc.text(`Time: ${quoteTime}`, 20, yPosition);
    doc.text('Valid Until:', 110, yPosition);
    doc.text(formatDate(validUntil), 145, yPosition);
    yPosition += 8;
    
    doc.text(`Prepared By: ${preparedBy.charAt(0).toUpperCase() + clientName.slice(1)}`, 20, yPosition);
    yPosition += 8;
    
    doc.text(`Client Address: ${clientAddress}`, 20, yPosition);
    yPosition += 15;
    
    // Project details section
    doc.setFontSize(16);
    doc.setTextColor(primaryColor[0], primaryColor[1], primaryColor[2]);
    doc.text('PROJECT DETAILS', 20, yPosition);
    yPosition += 10;
    
    // Table headers with proper alignment
    doc.setFontSize(13);
    doc.setTextColor(0, 0, 0);
    doc.setFont(undefined, 'bold');
    
    // Fixed column positions for perfect alignment
    const descX = 20;
    const qtyX = 130;
    const priceX = 150;
    const totalX = 175;
    
    doc.text('Description', descX, yPosition);
    doc.text('Qty', qtyX, yPosition);
    doc.text('Price', priceX, yPosition);
    doc.text('Total', totalX, yPosition);
    
    yPosition += 7;
    doc.setDrawColor(200, 200, 200);
    doc.line(descX, yPosition, 190, yPosition);
    yPosition += 10;
    
    doc.setFont(undefined, 'normal');
    
    let itemCount = 0;
    let subtotal = 0;
    
    // Collect all items first to calculate proper heights
    const items = [];
    document.querySelectorAll('.item').forEach(item => {
        if (item.style.display === 'none') return;
        const checkbox = item.querySelector('input[type="checkbox"]');
        if (!checkbox || !checkbox.checked) return;
        
        const itemName = item.querySelector('.item-name')?.textContent || 'Item';
        const quantity = item.querySelector('.quantity')?.value || '1';
        const itemPrice = item.querySelector('.item-price')?.textContent || 'R 0';
        const itemTotal = item.querySelector('.item-total')?.textContent || 'R 0';
        
        items.push({
            name: itemName,
            qty: quantity,
            price: itemPrice,
            total: itemTotal,
            totalValue: parseFloat(itemTotal.replace('R', '').replace(/,/g, '')) || 0
        });
    });
    
    // Add storage
    const activeStorage = document.querySelector('.storage-option.active');
    if (activeStorage) {
        const storageSize = activeStorage.getAttribute('data-size');
        const storagePrice = parseFloat(activeStorage.getAttribute('data-price'));
        items.push({
            name: `${storageSize}TB Surveillance Hard Drive`,
            qty: '1',
            price: `R ${formatCurrency(storagePrice)}`,
            total: `R ${formatCurrency(storagePrice)}`,
            totalValue: storagePrice
        });
    }
    
    // Add piping if applicable
    if (pipingLength > 0) {
        const pipingTotal = pipingLength * pipingRate;
        items.push({
            name: `Conduit & Piping Installation (${pipingLength}m)`,
            qty: '1',
            price: `R ${formatCurrency(pipingTotal)}`,
            total: `R ${formatCurrency(pipingTotal)}`,
            totalValue: pipingTotal
        });
    }
    
    // Display items with proper formatting - NO PER-ITEM BORDERS
    items.forEach((item, index) => {
        // Check for page break
        if (yPosition > 250) {
            doc.addPage();
            yPosition = 20;
            itemCount = 0;
        }
        
        // Split long item names
        const splitName = doc.splitTextToSize(item.name, 85);
        
        // Item description
        doc.text(splitName, descX, yPosition);
        
        // Quantities and prices - perfectly aligned
        doc.text(item.qty, qtyX, yPosition);
        doc.text(item.price, priceX, yPosition);
        doc.text(item.total, totalX, yPosition);
        
        // Calculate height for this row with consistent line height
        const rowHeight = Math.max(10, splitName.length * 5);
        yPosition += rowHeight;
        
        subtotal += item.totalValue;
        itemCount++;
    });
    
    yPosition += 12;
    
    // Totals section with perfect alignment and consistent line height
    const labourAmountEl = document.querySelector('.labour-amount');
    const labourAmount = labourAmountEl ? parseInt(labourAmountEl.textContent.replace('R', '').replace(/,/g, '')) : 1500;
    const activeAccessBtn = document.querySelector('.access-btn.active');
    const ceilingAccessible = activeAccessBtn ? activeAccessBtn.getAttribute('data-access') === 'yes' : true;
    const finalLabourAmount = ceilingAccessible ? labourAmount - 700 : labourAmount;
    
    const taxRate = 0.15;
    const taxAmount = (subtotal + finalLabourAmount) * taxRate;
    const grandTotal = subtotal + finalLabourAmount + taxAmount;
    
    // Draw separator line
    doc.setDrawColor(200, 200, 200);
    doc.line(descX, yPosition, 190, yPosition);
    yPosition += 10;
    
    doc.setFont(undefined, 'bold');
    doc.setFontSize(14);
    
    // Project Subtotal - aligned to the right
    doc.text('Project Subtotal:', descX, yPosition);
    doc.text(`R ${formatCurrency(subtotal)}`, totalX, yPosition, { align: 'right' });
    yPosition += 8;
    
    // Full System Installation & Setup - renamed from Services Subtotal
    doc.text('Full System Installation & Setup:', descX, yPosition);
    doc.text(`R ${formatCurrency(finalLabourAmount)}`, totalX, yPosition, { align: 'right' });
    yPosition += 8;
    
    // VAT
    doc.text('VAT (15%):', descX, yPosition);
    doc.text(`R ${formatCurrency(taxAmount)}`, totalX, yPosition, { align: 'right' });
    yPosition += 10;
    
    // Grand Total
    doc.setFontSize(16);
    doc.text('TOTAL:', descX, yPosition);
    doc.text(`R ${formatCurrency(grandTotal)}`, totalX, yPosition, { align: 'right' });
    yPosition += 15;
    
    // Installation note if ceiling accessible
    if (ceilingAccessible) {
        doc.setFontSize(13);
        doc.setFont(undefined, 'normal');
        doc.setTextColor(0, 128, 0);
        doc.text('| Ceiling accessible - R700 Installation Discount Applied |', descX, yPosition);
        doc.setTextColor(0, 0, 0);
        yPosition += 10;
    }
    
    // PAGE 2: Additional Information
    doc.addPage();
    yPosition = 20;
    
    // --- Banking details table (fully bordered + aligned) ---
    doc.setFont(undefined, "bold");
    doc.text("Banking Details", 20, yPosition);
    yPosition += 6;

    doc.setFont(undefined, "normal");

    // Table settings
    const startX = 20;     // left margin
    const startY = yPosition;
    const col1Width = 60;  // label column width
    const col2Width = 110; // value column width
    const rowHeight = 10;  // row height
    const borderColor = [180, 180, 180];

    // Data for rows
    const bankingDetails = [
    ["Account Holder", "Crown Secure Systems"],
    ["Bank Name", "Capitec"],
    ["Account Number", "1234567890"],
    ["Reference", `Quote For ${clientName.charAt(0).toUpperCase() + clientName.slice(1)}`]
    ];

    // Draw table rows with borders
    doc.setDrawColor(...borderColor);
    doc.setLineWidth(0.2);

    // Draw horizontal and vertical lines
    for (let i = 0; i <= bankingDetails.length; i++) {
    const y = startY + i * rowHeight;
    doc.line(startX, y, startX + col1Width + col2Width, y); // horizontal line
    }
    doc.line(startX, startY, startX, startY + rowHeight * bankingDetails.length); // left border
    doc.line(startX + col1Width, startY, startX + col1Width, startY + rowHeight * bankingDetails.length); // middle border
    doc.line(startX + col1Width + col2Width, startY, startX + col1Width + col2Width, startY + rowHeight * bankingDetails.length); // right border

    // Add text inside cells
    for (let i = 0; i < bankingDetails.length; i++) {
    const yText = startY + i * rowHeight + 7; // vertical padding
    doc.text(bankingDetails[i][0], startX + 4, yText); // label
    doc.text(bankingDetails[i][1], startX + col1Width + 4, yText); // value
    }

    yPosition = startY + rowHeight * bankingDetails.length + 16; // space after table


    // Package Includes section with even spacing
    doc.setFont(undefined, 'bold');
    doc.text('Package Includes:', 20, yPosition);
    yPosition += 10;
    
    doc.setFont(undefined, 'normal');
    const packageItems = [
        'Supply and installation of all listed equipment',
        'Configuration for mobile app viewing',
        'System testing and demonstration upon completion',
        'Free 7-day remote support after installation'
    ];
    
    packageItems.forEach(item => {
        doc.text(`• ${item}`, 25, yPosition);
        yPosition += 8;
    });
    
    yPosition += 12;
    
    // Warranty section
    doc.setFont(undefined, 'bold');
    doc.text('Warranty:', 20, yPosition);
    yPosition += 10;
    
    doc.setFont(undefined, 'normal');
    const warrantyItems = [
        'Equipment: 12 months (brand dependent)',
        'Installation workmanship: 6 months'
    ];
    
    warrantyItems.forEach(item => {
        doc.text(`• ${item}`, 25, yPosition);
        yPosition += 8;
    });
    
    yPosition += 12;
    
    // Payment Terms section
    doc.setFont(undefined, 'bold');
    doc.text('Payment Terms:', 20, yPosition);
    yPosition += 10;
    
    doc.setFont(undefined, 'normal');
    const paymentItems = [
        '50% deposit to confirm booking',
        'Balance payable upon completion and client satisfaction'
    ];
    
    paymentItems.forEach(item => {
        doc.text(`• ${item}`, 25, yPosition);
        yPosition += 8;
    });
    
    // Page 2 footer: always fixed to bottom of page 2
    const pageHeight = doc.internal.pageSize.getHeight();
    const footerMargin = 18; // distance from bottom
    const footerY = pageHeight - footerMargin;
    
    // small grey line above footer (optional)
    doc.setDrawColor(220, 220, 220);
    doc.line(20, footerY - 12, 190, footerY - 12);
    
    // footer text (centered)
    doc.setFontSize(13);
    doc.setTextColor(100, 100, 100);
    doc.text(`Thank you ${clientName.charAt(0).toUpperCase() + clientName.slice(1)} for considering Crown Secure Systems.`, 105, footerY - 6, { align: 'center' });
    doc.text('We look forward to securing your property with our professional solutions.', 105, footerY + 6, { align: 'center' });
    
    // Save the PDF
    doc.save(`CrownSecure-Quote-${clientName.replace(/\s+/g, '-')}.pdf`);
}

function formatDate(dateString) {
    if (!dateString) return 'Date';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-ZA', {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
    });
}