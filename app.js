/**
 * ThermoConvert Elite - Application Core Logic
 */

document.addEventListener('DOMContentLoaded', () => {
  // --- DOM Elements ---
  const tempInput = document.getElementById('tempInput');
  const inputWrapper = document.getElementById('inputWrapper');
  const inputSuffix = document.getElementById('inputSuffix');
  const validationMessage = document.getElementById('validationMessage');
  
  const fromUnit = document.getElementById('fromUnit');
  const toUnit = document.getElementById('toUnit');
  const swapBtn = document.getElementById('swapBtn');
  const convertBtn = document.getElementById('convertBtn');
  const instantToggle = document.getElementById('instantToggle');
  const themeToggleBtn = document.getElementById('themeToggleBtn');
  
  // Results Display
  const resultVal = document.getElementById('resultVal');
  const resultUnit = document.getElementById('resultUnit');
  
  // Thermometer Visual Gauge
  const thermoFluid = document.getElementById('thermoFluid');
  const thermoBulbGlow = document.getElementById('thermoBulbGlow');
  
  // Equivalent Cards
  const cardCVal = document.getElementById('cardCVal');
  const cardFVal = document.getElementById('cardFVal');
  const cardKVal = document.getElementById('cardKVal');
  const miniCards = document.querySelectorAll('.mini-unit-card');
  
  // Formula Elements
  const formulaText = document.getElementById('formulaText');
  const formulaDesc = document.getElementById('formulaDesc');
  
  // Presets
  const presetBtns = document.querySelectorAll('.preset-btn');

  // --- Constants & Physical Limits ---
  const ABSOLUTE_ZERO = {
    C: -273.15,
    F: -459.67,
    K: 0
  };

  // --- Theme Toggle Setup ---
  const initializeTheme = () => {
    const savedTheme = localStorage.getItem('theme') || 'dark';
    document.documentElement.setAttribute('data-theme', savedTheme);
  };
  
  themeToggleBtn.addEventListener('click', () => {
    const currentTheme = document.documentElement.getAttribute('data-theme');
    const newTheme = currentTheme === 'dark' ? 'light' : 'dark';
    
    // Smooth button spin animation
    const svgIcon = themeToggleBtn.querySelector('svg:not([style*="display: none"])');
    if (svgIcon) {
      svgIcon.style.transform = 'rotate(360deg)';
      setTimeout(() => {
        svgIcon.style.transform = '';
      }, 500);
    }
    
    document.documentElement.setAttribute('data-theme', newTheme);
    localStorage.setItem('theme', newTheme);
  });

  // --- Validation ---
  const validateInput = (value, unit) => {
    // 1. Check if empty
    if (value.trim() === '') {
      showError('Please enter a temperature value');
      return false;
    }
    
    // 2. Check if a valid number
    const num = Number(value);
    if (isNaN(num) || value.includes(' ')) {
      showError('Please enter a valid numeric value');
      return false;
    }
    
    // 3. Check for absolute zero limits
    const limit = ABSOLUTE_ZERO[unit];
    if (num < limit) {
      showError(`Temperature cannot go below Absolute Zero (${limit}°${unit !== 'K' ? unit : ''})`);
      return false;
    }
    
    clearError();
    return true;
  };

  const showError = (message) => {
    validationMessage.textContent = message;
    validationMessage.classList.add('show');
    inputWrapper.classList.add('is-invalid');
    
    // Reset invalid indicators after animation completes to allow re-triggering
    setTimeout(() => {
      inputWrapper.classList.remove('is-invalid');
    }, 500);
  };

  const clearError = () => {
    validationMessage.classList.remove('show');
    inputWrapper.classList.remove('is-invalid');
  };

  // --- Unit Conversion Core Math ---
  const convertTemperature = (value, from, to) => {
    const val = parseFloat(value);
    if (isNaN(val)) return 0;
    
    // Convert source unit to Celsius (Anchor unit)
    let celsius;
    if (from === 'C') {
      celsius = val;
    } else if (from === 'F') {
      celsius = (val - 32) * 5/9;
    } else if (from === 'K') {
      celsius = val - 273.15;
    }
    
    // Convert Celsius to target unit
    let converted;
    if (to === 'C') {
      converted = celsius;
    } else if (to === 'F') {
      converted = celsius * 9/5 + 32;
    } else if (to === 'K') {
      converted = celsius + 273.15;
    }
    
    return converted;
  };

  // --- Formula Explainer Renderer ---
  const updateFormulaDetails = (value, from, to, result) => {
    const val = parseFloat(value);
    if (isNaN(val)) return;
    
    let eq = '';
    let desc = '';
    
    const formattedVal = val.toLocaleString(undefined, { maximumFractionDigits: 2 });
    const formattedResult = result.toLocaleString(undefined, { maximumFractionDigits: 2 });
    
    if (from === to) {
      eq = `${formattedVal}°${from !== 'K' ? from : ''} = ${formattedResult}°${to !== 'K' ? to : ''}`;
      desc = `Identical units selected. No conversion required.`;
    } else if (from === 'C' && to === 'F') {
      eq = `(${formattedVal}°C × 9/5) + 32 = ${formattedResult}°F`;
      desc = `Multiply the Celsius temperature by 9/5 (1.8) and then add 32.`;
    } else if (from === 'C' && to === 'K') {
      eq = `${formattedVal}°C + 273.15 = ${formattedResult} K`;
      desc = `Add 273.15 to the Celsius temperature to get the Kelvin value.`;
    } else if (from === 'F' && to === 'C') {
      eq = `(${formattedVal}°F - 32) × 5/9 = ${formattedResult}°C`;
      desc = `Subtract 32 from the Fahrenheit temperature, then multiply by 5/9 (0.555...).`;
    } else if (from === 'F' && to === 'K') {
      eq = `(${formattedVal}°F - 32) × 5/9 + 273.15 = ${formattedResult} K`;
      desc = `First subtract 32 and multiply by 5/9 to convert to Celsius, then add 273.15.`;
    } else if (from === 'K' && to === 'C') {
      eq = `${formattedVal} K - 273.15 = ${formattedResult}°C`;
      desc = `Subtract 273.15 from the Kelvin temperature.`;
    } else if (from === 'K' && to === 'F') {
      eq = `(${formattedVal} K - 273.15) × 9/5 + 32 = ${formattedResult}°F`;
      desc = `Subtract 273.15 to convert to Celsius, multiply by 9/5, then add 32.`;
    }
    
    formulaText.textContent = eq;
    formulaDesc.textContent = desc;
  };

  // --- Thermometer & Fluid Visuals ---
  const updateVisualThermometer = (celsiusValue) => {
    // Map normal temperatures (e.g. -30°C to 120°C) to 5% to 95% fluid height
    const minC = -30;
    const maxC = 120;
    
    let percentage = ((celsiusValue - minC) / (maxC - minC)) * 100;
    percentage = Math.max(2, Math.min(98, percentage)); // Bind between 2% and 98% for aesthetics
    
    thermoFluid.style.height = `${percentage}%`;
    
    // Dynamic color shifting using HSL (from cold blue to boiling red)
    // Celsius -30 -> Blue (200), Celsius 100+ -> Red (0)
    let hue = 200 - (celsiusValue - minC) * (200 / (maxC - minC));
    hue = Math.max(0, Math.min(220, hue)); // Bind hue between Red (0) and Blue-Purple (220)
    
    const colorString = `hsl(${hue}, 85%, 50%)`;
    const glowString = `rgba(${hue < 40 ? '239, 68, 68' : hue > 160 ? '99, 102, 241' : '6, 182, 212'}, 0.5)`;
    
    thermoFluid.style.background = `linear-gradient(to top, hsl(${hue}, 80%, 45%), ${colorString})`;
    thermoFluid.style.boxShadow = `0 0 10px ${colorString}`;
    
    thermoBulbGlow.style.background = colorString;
    thermoBulbGlow.style.boxShadow = `0 0 12px ${colorString}`;
  };

  // --- Core Action: Process Conversions ---
  const performConversion = () => {
    const rawVal = tempInput.value;
    const from = fromUnit.value;
    const to = toUnit.value;
    
    // Check validation first
    if (!validateInput(rawVal, from)) {
      return;
    }
    
    const numericVal = parseFloat(rawVal);
    
    // Calculate primary output
    const primaryResult = convertTemperature(numericVal, from, to);
    resultVal.textContent = primaryResult.toLocaleString(undefined, {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    });
    resultUnit.textContent = to === 'K' ? ' K' : `°${to}`;
    
    // Calculate equivalent secondary cards values
    const cResult = convertTemperature(numericVal, from, 'C');
    const fResult = convertTemperature(numericVal, from, 'F');
    const kResult = convertTemperature(numericVal, from, 'K');
    
    cardCVal.textContent = cResult.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 });
    cardFVal.textContent = fResult.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 });
    cardKVal.textContent = kResult.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 });
    
    // Highlight current active targets
    miniCards.forEach(card => {
      if (card.getAttribute('data-unit') === to) {
        card.classList.add('active-unit');
      } else {
        card.classList.remove('active-unit');
      }
    });
    
    // Update visuals & formula explanation
    updateVisualThermometer(cResult);
    updateFormulaDetails(numericVal, from, to, primaryResult);
  };

  // --- Real-time Conversion Handlers ---
  const handleInputChange = () => {
    if (instantToggle.checked) {
      performConversion();
    } else {
      // Clear error message in real time anyway so they don't get stuck in error state
      const rawVal = tempInput.value;
      const from = fromUnit.value;
      if (rawVal.trim() === '' || (!isNaN(Number(rawVal)) && Number(rawVal) >= ABSOLUTE_ZERO[from])) {
        clearError();
      }
    }
  };

  const handleUnitChange = () => {
    // Update placeholder and inputs
    inputSuffix.textContent = fromUnit.value === 'K' ? ' K' : `°${fromUnit.value}`;
    
    if (instantToggle.checked) {
      performConversion();
    }
  };

  // --- Event Listeners ---
  tempInput.addEventListener('input', handleInputChange);
  fromUnit.addEventListener('change', handleUnitChange);
  toUnit.addEventListener('change', () => {
    if (instantToggle.checked) performConversion();
  });
  
  // Custom Ripple Animation on Manual Convert Click
  convertBtn.addEventListener('click', (e) => {
    performConversion();
    
    // Button click ripple feedback
    const x = e.clientX - e.target.offsetLeft;
    const y = e.clientY - e.target.offsetTop;
    
    const ripple = document.createElement('span');
    ripple.style.left = `${x}px`;
    ripple.style.top = `${y}px`;
    ripple.classList.add('btn-ripple');
    
    // Add ripple element and remove after animation
    convertBtn.appendChild(ripple);
    setTimeout(() => {
      ripple.remove();
    }, 600);
  });

  // --- Unit Swapping Actions ---
  swapBtn.addEventListener('click', () => {
    // Spin animation for swap button
    const svg = swapBtn.querySelector('svg');
    svg.style.transform = svg.style.transform === 'rotate(180deg)' ? 'rotate(360deg)' : 'rotate(180deg)';
    
    const tempSelectVal = fromUnit.value;
    fromUnit.value = toUnit.value;
    toUnit.value = tempSelectVal;
    
    // Trigger visual/label updates
    handleUnitChange();
    
    // Auto-convert on swap
    performConversion();
  });

  // --- Presets Click Handling ---
  presetBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      const val = btn.getAttribute('data-val');
      const unit = btn.getAttribute('data-unit');
      
      // Auto transition to standard conversion preset
      fromUnit.value = unit;
      tempInput.value = val;
      
      // Select appropriate opposite unit if matching unit selected
      if (toUnit.value === unit) {
        toUnit.value = unit === 'C' ? 'F' : 'C';
      }
      
      // Update labels and trigger ripple flash on inputs
      handleUnitChange();
      
      // Visual feedback blink on input wrapper
      inputWrapper.style.transform = 'scale(1.03)';
      setTimeout(() => {
        inputWrapper.style.transform = '';
      }, 150);
      
      performConversion();
    });
  });

  // --- Initialize App ---
  initializeTheme();
  tempInput.value = '25'; // Default starting value
  handleUnitChange();
  performConversion(); // Initial run
});
