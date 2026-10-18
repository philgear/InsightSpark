/**
 * Fluid Thinking & "How to Analyze People on Sight" (1921) Finger-Style Specimen Controller
 * SPDX-License-Identifier: Apache-2.0
 */
(function () {
  'use strict';

  const glyphs = [
    // Uppercase A-Z
    'A','B','C','D','E','F','G','H','I','J','K','L','M',
    'N','O','P','Q','R','S','T','U','V','W','X','Y','Z',
    // Lowercase a-z
    'a','b','c','d','e','f','g','h','i','j','k','l','m',
    'n','o','p','q','r','s','t','u','v','w','x','y','z',
    // Numerals 0-9
    '0','1','2','3','4','5','6','7','8','9',
    // Pillow Punctuation & Symbols
    '!','"','&',"'",'(',')','+',',','-','.','/',':',';','?','~','\u2013','\u2014','\u2022','\u2665'
  ];

  const grid = document.getElementById('glyphGrid');
  const input = document.getElementById('typeInput');
  const output = document.getElementById('typeOutput');
  const slider = document.getElementById('sizeSlider');
  const sizeVal = document.getElementById('sizeVal');
  const activeBadge = document.getElementById('activeStyleBadge');
  const styleButtons = document.querySelectorAll('.style-switch-btn');

  function updateOutput() {
    if (output && input) {
      output.textContent = input.value || ' ';
    }
  }

  styleButtons.forEach((btn) => {
    btn.addEventListener('click', () => {
      const fontFamily = btn.getAttribute('data-font');
      const styleLabel = btn.getAttribute('data-label');
      if (fontFamily) {
        document.documentElement.style.setProperty('--active-specimen-font', `'${fontFamily}', system-ui`);
      }
      if (activeBadge && styleLabel) {
        activeBadge.textContent = 'Active Font: ' + styleLabel;
      }
      styleButtons.forEach((b) => b.classList.remove('active'));
      btn.classList.add('active');
    });
  });

  if (grid) {
    glyphs.forEach((char) => {
      const cell = document.createElement('button');
      cell.type = 'button';
      cell.className = 'glyph-cell';
      cell.title = 'Click to append ' + char;

      const charSpan = document.createElement('span');
      charSpan.className = 'glyph-char';
      charSpan.textContent = char;

      const labelSpan = document.createElement('span');
      labelSpan.className = 'glyph-label';
      labelSpan.textContent =
        'U+' + char.charCodeAt(0).toString(16).toUpperCase().padStart(4, '0');

      cell.appendChild(charSpan);
      cell.appendChild(labelSpan);

      cell.addEventListener('click', () => {
        if (input) {
          input.value += char;
          updateOutput();
        }
      });

      grid.appendChild(cell);
    });
  }

  if (input) {
    input.addEventListener('input', updateOutput);
  }

  if (slider && output && sizeVal) {
    slider.addEventListener('input', (e) => {
      const sz = e.target.value;
      output.style.fontSize = sz + 'px';
      sizeVal.textContent = sz + 'px';
    });
  }
})();
