import ko from './locales/ko.js';
import en from './locales/en.js';

const resources = {
    ko: ko,
    en: en
};

let currentLanguage = 'ko';

export function initI18n(lang = 'ko') {
    if (resources[lang]) {
        currentLanguage = lang;
    }
    updateTranslations();
}

export function changeLanguage(lang) {
    if (!resources[lang]) return false;
    currentLanguage = lang;
    updateTranslations();
    return true;
}

export function getCurrentLanguage() {
    return currentLanguage;
}

export function t(key, params = {}) {
    let text = resources[currentLanguage][key] || key;

    // Replace parameters like {name}
    Object.keys(params).forEach(param => {
        text = text.replace(new RegExp(`{${param}}`, 'g'), params[param]);
    });

    return text;
}

export function updateTranslations() {
    // Update elements with data-i18n attribute
    const elements = document.querySelectorAll('[data-i18n]');
    elements.forEach(el => {
        const key = el.getAttribute('data-i18n');
        if (key) {
            // Check if it's an input/textarea placeholder
            if (el.tagName === 'INPUT' || el.tagName === 'TEXTAREA') {
                if (el.hasAttribute('placeholder')) {
                    el.placeholder = t(key);
                }
            } else {
                // Determine if we should replace innerHTML or textContent
                // Use textContent by default for safety, unless specific need
                // But some elements might have icons span inside. 
                // Creating a robust replacement is needed.

                // Strategy: dynamic text node update is complex. 
                // Simpler approach: 
                // If element has 'data-i18n-target="title"', update title attribute.
                // If element has 'data-i18n-target="placeholder"', update placeholder.

                // For simplified structure in this project:
                // If element has distinct structure like <span class="icon">...</span> <span>Text</span>
                // We should target the text span specifically.
                // Or we can assume the developer puts data-i18n on the text container itself.

                el.textContent = t(key);
            }
        }
    });

    // Handle elements with data-i18n-title (for tooltips)
    const titleElements = document.querySelectorAll('[data-i18n-title]');
    titleElements.forEach(el => {
        const key = el.getAttribute('data-i18n-title');
        if (key) {
            el.title = t(key);
        }
    });

    // Handle elements with data-i18n-placeholder
    const placeholderElements = document.querySelectorAll('[data-i18n-placeholder]');
    placeholderElements.forEach(el => {
        const key = el.getAttribute('data-i18n-placeholder');
        if (key) {
            el.placeholder = t(key);
        }
    });
}
