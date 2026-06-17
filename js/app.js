document.addEventListener('DOMContentLoaded', () => {
  // --- UI Elements ---
  const displayFormula = document.getElementById('display-formula');
  const displayResult = document.getElementById('display-result');
  const themeToggleBtn = document.getElementById('theme-toggle');
  const themeSunIcon = document.getElementById('theme-sun');
  const themeMoonIcon = document.getElementById('theme-moon');
  const historyToggleBtn = document.getElementById('history-toggle');
  const historyCloseBtn = document.getElementById('history-close');
  const historyDrawer = document.getElementById('history-drawer');
  const historyList = document.getElementById('history-list');
  const clearHistoryBtn = document.getElementById('btn-clear-history');
  const overlay = document.getElementById('overlay');
  
  // All keypad buttons
  const numberButtons = document.querySelectorAll('.btn-num');
  const operatorButtons = document.querySelectorAll('.btn-op');
  const btnClear = document.getElementById('btn-clear');
  const btnBackspace = document.getElementById('btn-backspace');
  const btnEquals = document.getElementById('btn-equals');

  // --- Calculator State ---
  let currentInput = '0';      // The number currently being entered
  let formula = '';             // The running formula expression (e.g. "12+3*5")
  let isCalculated = false;     // Flag to check if evaluation was just completed
  let history = [];             // History list array

  // Initialize
  initTheme();
  initHistory();

  // --- Theme Toggle Management ---
  function initTheme() {
    const savedTheme = localStorage.getItem('aura-calc-theme') || 'dark';
    document.body.setAttribute('data-theme', savedTheme);
    updateThemeIcons(savedTheme);
  }

  themeToggleBtn.addEventListener('click', () => {
    const currentTheme = document.body.getAttribute('data-theme');
    const newTheme = currentTheme === 'dark' ? 'light' : 'dark';
    document.body.setAttribute('data-theme', newTheme);
    localStorage.setItem('aura-calc-theme', newTheme);
    updateThemeIcons(newTheme);
  });

  function updateThemeIcons(theme) {
    if (theme === 'light') {
      themeSunIcon.style.display = 'none';
      themeMoonIcon.style.display = 'block';
    } else {
      themeSunIcon.style.display = 'block';
      themeMoonIcon.style.display = 'none';
    }
  }

  // --- History Drawer Management ---
  function initHistory() {
    try {
      const savedHistory = localStorage.getItem('aura-calc-history');
      if (savedHistory) {
        history = JSON.parse(savedHistory);
      }
    } catch (e) {
      console.error('Error loading history:', e);
      history = [];
    }
    renderHistory();
  }

  function toggleHistoryDrawer(show) {
    if (show) {
      historyDrawer.classList.add('open');
      overlay.classList.add('show');
      renderHistory();
    } else {
      historyDrawer.classList.remove('open');
      overlay.classList.remove('show');
    }
  }

  historyToggleBtn.addEventListener('click', () => toggleHistoryDrawer(true));
  historyCloseBtn.addEventListener('click', () => toggleHistoryDrawer(false));
  overlay.addEventListener('click', () => toggleHistoryDrawer(false));

  function addHistoryItem(expr, res) {
    // Add to top of list
    history.unshift({ formula: expr, result: res });
    // Keep max 50 entries
    if (history.length > 50) {
      history.pop();
    }
    localStorage.setItem('aura-calc-history', JSON.stringify(history));
    renderHistory();
  }

  function renderHistory() {
    historyList.innerHTML = '';
    if (history.length === 0) {
      const emptyMsg = document.createElement('div');
      emptyMsg.style.textAlign = 'center';
      emptyMsg.style.color = 'var(--text-secondary)';
      emptyMsg.style.padding = '2rem 0';
      emptyMsg.style.fontSize = '0.9rem';
      emptyMsg.textContent = '저장된 계산 기록이 없습니다.';
      historyList.appendChild(emptyMsg);
      return;
    }

    history.forEach((item, index) => {
      const div = document.createElement('div');
      div.className = 'history-item';
      div.setAttribute('tabindex', '0');
      
      // Clean view formatting (e.g. * -> ×, / -> ÷)
      const cleanFormula = formatFormulaForDisplay(item.formula);

      div.innerHTML = `
        <div class="history-item-formula">${cleanFormula} =</div>
        <div class="history-item-result">${formatNumberString(item.result)}</div>
      `;
      
      // Clicking a history item restores it into current memory
      div.addEventListener('click', () => {
        currentInput = item.result;
        formula = '';
        isCalculated = false;
        updateDisplay();
        toggleHistoryDrawer(false);
      });

      div.addEventListener('keydown', (e) => {
        if (e.key === 'Enter') {
          div.click();
        }
      });

      historyList.appendChild(div);
    });
  }

  clearHistoryBtn.addEventListener('click', () => {
    history = [];
    localStorage.removeItem('aura-calc-history');
    renderHistory();
  });


  // --- Display Formatting Helpers ---
  function formatFormulaForDisplay(str) {
    return str
      .replace(/\*/g, ' × ')
      .replace(/\//g, ' ÷ ')
      .replace(/\+/g, ' + ')
      .replace(/\-/g, ' − ');
  }

  function formatNumberString(str) {
    if (str === 'Error' || str === 'Infinity' || str === '-Infinity') return str;
    const parts = str.split('.');
    parts[0] = parts[0].replace(/\B(?=(\d{3})+(?!\d))/g, ',');
    return parts.join('.');
  }

  function updateDisplay() {
    // Show current typed or resolved expression
    if (isCalculated) {
      displayFormula.textContent = formatFormulaForDisplay(formula) + ' =';
      displayResult.textContent = formatNumberString(currentInput);
    } else {
      displayFormula.textContent = formatFormulaForDisplay(formula);
      displayResult.textContent = formatNumberString(currentInput);
    }
  }


  // --- Core Calculation Engine ---
  function handleNumber(num) {
    if (isCalculated) {
      currentInput = '0';
      formula = '';
      isCalculated = false;
    }

    if (num === '.') {
      if (currentInput.includes('.')) return; // Prevent double decimals
      currentInput += '.';
    } else {
      if (currentInput === '0') {
        currentInput = num;
      } else {
        currentInput += num;
      }
    }
    updateDisplay();
  }

  function handleOperator(op) {
    if (isCalculated) {
      isCalculated = false;
      formula = currentInput + op;
      currentInput = '0';
      updateDisplay();
      return;
    }

    // If there is active input, append it to formula with the operator
    if (currentInput !== '0' && currentInput !== '') {
      // If formula ends with an operator and currentInput is empty, we would replace, but since currentInput exists:
      formula += currentInput + op;
      currentInput = '0';
    } else if (formula !== '') {
      // If no current input but we have formula, replace the last operator
      const lastChar = formula.slice(-1);
      if (['+', '-', '*', '/'].includes(lastChar)) {
        formula = formula.slice(0, -1) + op;
      } else {
        formula += op;
      }
    } else {
      // If everything is zero, default to "0 + operator"
      formula = '0' + op;
    }
    updateDisplay();
  }

  function handlePercent() {
    if (currentInput === '0' || currentInput === 'Error') return;
    
    // Evaluate display percentage directly (e.g. 50 -> 0.5)
    try {
      const val = parseFloat(currentInput);
      if (!isNaN(val)) {
        // Limit floating point issues with parseFloat precision adjustments
        const pct = val / 100;
        currentInput = String(Number(pct.toFixed(12))); // cleans float artifacts
        updateDisplay();
      }
    } catch (e) {
      currentInput = 'Error';
      updateDisplay();
    }
  }

  function clearAll() {
    currentInput = '0';
    formula = '';
    isCalculated = false;
    updateDisplay();
  }

  function deleteLast() {
    if (isCalculated) {
      clearAll();
      return;
    }

    if (currentInput.length > 1) {
      currentInput = currentInput.slice(0, -1);
    } else {
      currentInput = '0';
    }
    updateDisplay();
  }

  function calculate() {
    if (isCalculated) return; // Already calculated, avoid duplicate actions

    let finalExpr = formula;
    if (currentInput !== '') {
      finalExpr += currentInput;
    }

    // If formula is empty or trailing operator, clean up
    if (finalExpr === '') return;
    const lastChar = finalExpr.slice(-1);
    if (['+', '-', '*', '/'].includes(lastChar)) {
      finalExpr = finalExpr.slice(0, -1);
    }

    try {
      // Safe mathematical expression execution check using regex
      // Restrict character alphabet to arithmetic operations, digits, and decimals
      const mathPattern = /^[0-9.+\-*/\s()]+$/;
      if (!mathPattern.test(finalExpr)) {
        throw new Error('Invalid symbols');
      }

      // Safe calculation without dangerous eval injection vectors
      // Since pattern only allows numbers and basic math, Function evaluation is safe
      const calcFunc = new Function(`return (${finalExpr})`);
      const rawResult = calcFunc();

      if (rawResult === undefined || isNaN(rawResult)) {
        throw new Error('NaN Result');
      }

      let resultStr = String(rawResult);
      
      // Floating point cleanup (e.g., 0.1 + 0.2 = 0.30000000000000004)
      if (resultStr.includes('.') && resultStr.length > 12) {
        resultStr = String(Number(rawResult.toFixed(10)));
      }

      if (resultStr === 'Infinity' || resultStr === '-Infinity') {
        resultStr = 'Error'; // Divide by zero or massive overflow
      }

      // Record History
      addHistoryItem(finalExpr, resultStr);

      formula = finalExpr;
      currentInput = resultStr;
      isCalculated = true;
    } catch (err) {
      console.error('Calculation error:', err);
      formula = finalExpr;
      currentInput = 'Error';
      isCalculated = true;
    }
    updateDisplay();
  }


  // --- Event Bindings (Click) ---
  numberButtons.forEach(btn => {
    btn.addEventListener('click', () => {
      handleNumber(btn.dataset.val);
    });
  });

  operatorButtons.forEach(btn => {
    btn.addEventListener('click', () => {
      const val = btn.dataset.val;
      const action = btn.dataset.action;
      
      if (action === 'percent') {
        handlePercent();
      } else {
        handleOperator(val);
      }
    });
  });

  btnClear.addEventListener('click', clearAll);
  btnBackspace.addEventListener('click', deleteLast);
  btnEquals.addEventListener('click', calculate);


  // --- Keyboard Handling Support ---
  document.addEventListener('keydown', (e) => {
    const key = e.key;

    // Numbers & decimals
    if (/[0-9]/.test(key) || key === '.') {
      e.preventDefault();
      handleNumber(key);
      triggerVisualActive(key);
    } 
    // Basic operators
    else if (['+', '-', '*', '/'].includes(key)) {
      e.preventDefault();
      handleOperator(key);
      triggerVisualActive(key);
    } 
    // Percent
    else if (key === '%') {
      e.preventDefault();
      handlePercent();
      triggerVisualActive('percent');
    }
    // Equals / Calculate
    else if (key === 'Enter' || key === '=') {
      e.preventDefault();
      calculate();
      triggerVisualActive('=');
    } 
    // Backspace / Delete
    else if (key === 'Backspace') {
      e.preventDefault();
      deleteLast();
      triggerVisualActive('backspace');
    } 
    // Escape / Reset
    else if (key === 'Escape') {
      e.preventDefault();
      clearAll();
      triggerVisualActive('clear');
    }
  });

  // Micro-interaction key highlight effect
  function triggerVisualActive(keyVal) {
    let selector = '';
    if (/[0-9]/.test(keyVal)) {
      selector = `.btn-num[data-val="${keyVal}"]`;
    } else if (keyVal === '.') {
      selector = `.btn-num[data-val="."]`;
    } else if (['+', '-', '*', '/'].includes(keyVal)) {
      selector = `.btn-op[data-val="${keyVal}"]`;
    } else if (keyVal === 'percent') {
      selector = `.btn-op[data-action="percent"]`;
    } else if (keyVal === '=') {
      selector = `#btn-equals`;
    } else if (keyVal === 'backspace') {
      selector = `#btn-backspace`;
    } else if (keyVal === 'clear') {
      selector = `#btn-clear`;
    }

    if (selector) {
      const element = document.querySelector(selector);
      if (element) {
        element.classList.add('active');
        element.style.transform = 'scale(0.95)';
        setTimeout(() => {
          element.classList.remove('active');
          element.style.transform = '';
        }, 120);
      }
    }
  }
});
