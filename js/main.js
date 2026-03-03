// ============================================
// Security & Utility Functions
// ============================================

/**
 * Sanitize user input to prevent XSS attacks
 * @param {string} input - The input string to sanitize
 * @returns {string} - Sanitized string
 */
function sanitizeInput(input) {
    const div = document.createElement('div');
    div.textContent = input;
    return div.innerHTML;
}

/**
 * Validate email format
 * @param {string} email - Email to validate
 * @returns {boolean} - True if valid email format
 */
function validateEmail(email) {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
}

/**
 * Validate phone number format (basic validation)
 * @param {string} phone - Phone number to validate
 * @returns {boolean} - True if valid phone format
 */
function validatePhone(phone) {
    const phoneRegex = /^[\d\s\-\+\(\)]{7,}$/;
    return phoneRegex.test(phone);
}

/**
 * Validate ZIP code format
 * @param {string} zip - ZIP code to validate
 * @returns {boolean} - True if valid ZIP format
 */
function validateZip(zip) {
    const zipRegex = /^\d{5}(-\d{4})?$/;
    return zipRegex.test(zip);
}

/**
 * Validate date is not in the past
 * @param {string} dateString - Date string in YYYY-MM-DD format
 * @returns {boolean} - True if date is today or in the future
 */
function validateFutureDate(dateString) {
    const selectedDate = new Date(dateString);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    return selectedDate >= today;
}

/**
 * Display error message for a form field
 * @param {string} fieldId - ID of the form field
 * @param {string} message - Error message to display
 */
function showFieldError(fieldId, message) {
    const field = document.getElementById(fieldId);
    const errorElement = document.getElementById(fieldId + 'Error');
    
    if (field && errorElement) {
        field.classList.add('error');
        errorElement.textContent = message;
    }
}

/**
 * Clear error message for a form field
 * @param {string} fieldId - ID of the form field
 */
function clearFieldError(fieldId) {
    const field = document.getElementById(fieldId);
    const errorElement = document.getElementById(fieldId + 'Error');
    
    if (field && errorElement) {
        field.classList.remove('error');
        errorElement.textContent = '';
    }
}

// ============================================
// Navigation & Mobile Menu
// ============================================

document.addEventListener('DOMContentLoaded', function() {
    const hamburger = document.getElementById('hamburger');
    const navbarMenu = document.getElementById('navbarMenu');

    if (hamburger) {
        hamburger.addEventListener('click', function() {
            hamburger.classList.toggle('active');
            navbarMenu.classList.toggle('active');
        });

        // Close menu when a link is clicked
        const navLinks = navbarMenu.querySelectorAll('.nav-link');
        navLinks.forEach(link => {
            link.addEventListener('click', function() {
                hamburger.classList.remove('active');
                navbarMenu.classList.remove('active');
            });
        });
    }

    // Set minimum date to today
    const dateInputs = document.querySelectorAll('input[type="date"]');
    dateInputs.forEach(input => {
        const today = new Date().toISOString().split('T')[0];
        input.setAttribute('min', today);
    });

    // Initialize forms
    initializeContactForm();
    initializeBookingForm();
});

// ============================================
// Contact Form Validation & Submission
// ============================================

function initializeContactForm() {
    const contactForm = document.getElementById('contactForm');
    if (!contactForm) return;

    // Real-time validation
    const nameField = document.getElementById('contactName');
    const emailField = document.getElementById('contactEmail');
    const phoneField = document.getElementById('contactPhone');
    const subjectField = document.getElementById('contactSubject');
    const messageField = document.getElementById('contactMessage');

    if (nameField) {
        nameField.addEventListener('blur', function() {
            if (this.value.trim().length < 2) {
                showFieldError('contactName', 'Name must be at least 2 characters');
            } else {
                clearFieldError('contactName');
            }
        });
    }

    if (emailField) {
        emailField.addEventListener('blur', function() {
            if (!validateEmail(this.value.trim())) {
                showFieldError('contactEmail', 'Please enter a valid email address');
            } else {
                clearFieldError('contactEmail');
            }
        });
    }

    if (phoneField) {
        phoneField.addEventListener('blur', function() {
            if (this.value.trim() && !validatePhone(this.value.trim())) {
                showFieldError('contactPhone', 'Please enter a valid phone number');
            } else {
                clearFieldError('contactPhone');
            }
        });
    }

    if (subjectField) {
        subjectField.addEventListener('blur', function() {
            if (this.value.trim().length < 3) {
                showFieldError('contactSubject', 'Subject must be at least 3 characters');
            } else {
                clearFieldError('contactSubject');
            }
        });
    }

    if (messageField) {
        messageField.addEventListener('blur', function() {
            if (this.value.trim().length < 10) {
                showFieldError('contactMessage', 'Message must be at least 10 characters');
            } else {
                clearFieldError('contactMessage');
            }
        });
    }

    // Form submission
    contactForm.addEventListener('submit', function(e) {
        e.preventDefault();

        // Validate all fields
        let isValid = true;

        const name = nameField.value.trim();
        if (name.length < 2) {
            showFieldError('contactName', 'Name must be at least 2 characters');
            isValid = false;
        } else {
            clearFieldError('contactName');
        }

        const email = emailField.value.trim();
        if (!validateEmail(email)) {
            showFieldError('contactEmail', 'Please enter a valid email address');
            isValid = false;
        } else {
            clearFieldError('contactEmail');
        }

        const phone = phoneField.value.trim();
        if (phone && !validatePhone(phone)) {
            showFieldError('contactPhone', 'Please enter a valid phone number');
            isValid = false;
        } else {
            clearFieldError('contactPhone');
        }

        const subject = subjectField.value.trim();
        if (subject.length < 3) {
            showFieldError('contactSubject', 'Subject must be at least 3 characters');
            isValid = false;
        } else {
            clearFieldError('contactSubject');
        }

        const message = messageField.value.trim();
        if (message.length < 10) {
            showFieldError('contactMessage', 'Message must be at least 10 characters');
            isValid = false;
        } else {
            clearFieldError('contactMessage');
        }

        const privacyCheckbox = document.getElementById('contactPrivacy');
        if (!privacyCheckbox.checked) {
            showFieldError('contactPrivacy', 'You must agree to the privacy policy');
            isValid = false;
        } else {
            clearFieldError('contactPrivacy');
        }

        if (isValid) {
            // Sanitize inputs
            const formData = {
                name: sanitizeInput(name),
                email: sanitizeInput(email),
                phone: sanitizeInput(phone),
                subject: sanitizeInput(subject),
                message: sanitizeInput(message)
            };

            // Simulate form submission (in production, send to backend)
            console.log('Contact Form Data:', formData);

            // Show success message
            const formMessage = document.getElementById('formMessage');
            formMessage.textContent = 'Thank you! Your message has been sent successfully. We will contact you soon.';
            formMessage.classList.add('success');
            formMessage.classList.remove('error');

            // Reset form
            setTimeout(() => {
                contactForm.reset();
                formMessage.classList.remove('success');
            }, 3000);
        }
    });
}

// ============================================
// Booking Form Validation & Submission
// ============================================

function initializeBookingForm() {
    const bookingForm = document.getElementById('bookingForm');
    if (!bookingForm) return;

    // Update booking summary when form fields change
    const formFields = bookingForm.querySelectorAll('input, select, textarea');
    formFields.forEach(field => {
        field.addEventListener('change', updateBookingSummary);
        field.addEventListener('input', updateBookingSummary);
    });

    // Real-time validation for key fields
    const bookingNameField = document.getElementById('bookingName');
    const bookingEmailField = document.getElementById('bookingEmail');
    const bookingPhoneField = document.getElementById('bookingPhone');
    const bookingAddressField = document.getElementById('bookingAddress');
    const bookingZipField = document.getElementById('bookingZip');

    if (bookingNameField) {
        bookingNameField.addEventListener('blur', function() {
            if (this.value.trim().length < 2) {
                showFieldError('bookingName', 'Name must be at least 2 characters');
            } else {
                clearFieldError('bookingName');
            }
        });
    }

    if (bookingEmailField) {
        bookingEmailField.addEventListener('blur', function() {
            if (!validateEmail(this.value.trim())) {
                showFieldError('bookingEmail', 'Please enter a valid email address');
            } else {
                clearFieldError('bookingEmail');
            }
        });
    }

    if (bookingPhoneField) {
        bookingPhoneField.addEventListener('blur', function() {
            if (!validatePhone(this.value.trim())) {
                showFieldError('bookingPhone', 'Please enter a valid phone number');
            } else {
                clearFieldError('bookingPhone');
            }
        });
    }

    if (bookingAddressField) {
        bookingAddressField.addEventListener('blur', function() {
            if (this.value.trim().length < 5) {
                showFieldError('bookingAddress', 'Please enter a valid address');
            } else {
                clearFieldError('bookingAddress');
            }
        });
    }

    if (bookingZipField) {
        bookingZipField.addEventListener('blur', function() {
            if (!validateZip(this.value.trim())) {
                showFieldError('bookingZip', 'Please enter a valid ZIP code (e.g., 12345 or 12345-6789)');
            } else {
                clearFieldError('bookingZip');
            }
        });
    }

    // Form submission
    bookingForm.addEventListener('submit', function(e) {
        e.preventDefault();

        // Validate all required fields
        let isValid = true;

        const name = document.getElementById('bookingName').value.trim();
        if (name.length < 2) {
            showFieldError('bookingName', 'Name must be at least 2 characters');
            isValid = false;
        } else {
            clearFieldError('bookingName');
        }

        const email = document.getElementById('bookingEmail').value.trim();
        if (!validateEmail(email)) {
            showFieldError('bookingEmail', 'Please enter a valid email address');
            isValid = false;
        } else {
            clearFieldError('bookingEmail');
        }

        const phone = document.getElementById('bookingPhone').value.trim();
        if (!validatePhone(phone)) {
            showFieldError('bookingPhone', 'Please enter a valid phone number');
            isValid = false;
        } else {
            clearFieldError('bookingPhone');
        }

        const address = document.getElementById('bookingAddress').value.trim();
        if (address.length < 5) {
            showFieldError('bookingAddress', 'Please enter a valid address');
            isValid = false;
        } else {
            clearFieldError('bookingAddress');
        }

        const city = document.getElementById('bookingCity').value.trim();
        if (city.length < 2) {
            showFieldError('bookingCity', 'Please enter a valid city');
            isValid = false;
        } else {
            clearFieldError('bookingCity');
        }

        const state = document.getElementById('bookingState').value.trim();
        if (state.length !== 2) {
            showFieldError('bookingState', 'Please enter a valid state code');
            isValid = false;
        } else {
            clearFieldError('bookingState');
        }

        const zip = document.getElementById('bookingZip').value.trim();
        if (!validateZip(zip)) {
            showFieldError('bookingZip', 'Please enter a valid ZIP code');
            isValid = false;
        } else {
            clearFieldError('bookingZip');
        }

        const service = document.getElementById('bookingService').value;
        if (!service) {
            showFieldError('bookingService', 'Please select a service');
            isValid = false;
        } else {
            clearFieldError('bookingService');
        }

        const frequency = document.getElementById('bookingFrequency').value;
        if (!frequency) {
            showFieldError('bookingFrequency', 'Please select a frequency');
            isValid = false;
        } else {
            clearFieldError('bookingFrequency');
        }

        const propertySize = document.getElementById('bookingPropertySize').value;
        if (!propertySize) {
            showFieldError('bookingPropertySize', 'Please select a property size');
            isValid = false;
        } else {
            clearFieldError('bookingPropertySize');
        }

        const date = document.getElementById('bookingDate').value;
        if (!date || !validateFutureDate(date)) {
            showFieldError('bookingDate', 'Please select a valid future date');
            isValid = false;
        } else {
            clearFieldError('bookingDate');
        }

        const time = document.getElementById('bookingTime').value;
        if (!time) {
            showFieldError('bookingTime', 'Please select a time slot');
            isValid = false;
        } else {
            clearFieldError('bookingTime');
        }

        const termsCheckbox = document.getElementById('bookingTerms');
        if (!termsCheckbox.checked) {
            showFieldError('bookingTerms', 'You must agree to the terms and conditions');
            isValid = false;
        } else {
            clearFieldError('bookingTerms');
        }

        if (isValid) {
            // Collect and sanitize form data
            const extras = Array.from(bookingForm.querySelectorAll('input[name="extras"]:checked'))
                .map(checkbox => checkbox.value);

            const bookingData = {
                name: sanitizeInput(name),
                email: sanitizeInput(email),
                phone: sanitizeInput(phone),
                address: sanitizeInput(address),
                city: sanitizeInput(city),
                state: sanitizeInput(state),
                zip: sanitizeInput(zip),
                service: sanitizeInput(service),
                frequency: sanitizeInput(frequency),
                propertySize: sanitizeInput(propertySize),
                date: sanitizeInput(date),
                time: sanitizeInput(time),
                notes: sanitizeInput(document.getElementById('bookingNotes').value.trim()),
                extras: extras,
                marketing: document.getElementById('bookingMarketing').checked
            };

            // Simulate form submission (in production, send to backend)
            console.log('Booking Form Data:', bookingData);

            // Show success message
            const formMessage = document.getElementById('bookingFormMessage');
            formMessage.textContent = 'Booking confirmed! We will send you a confirmation email shortly.';
            formMessage.classList.add('success');
            formMessage.classList.remove('error');

            // Reset form
            setTimeout(() => {
                bookingForm.reset();
                formMessage.classList.remove('success');
                updateBookingSummary();
            }, 3000);
        }
    });
}

/**
 * Update booking summary display
 */
function updateBookingSummary() {
    const service = document.getElementById('bookingService').value;
    const frequency = document.getElementById('bookingFrequency').value;
    const propertySize = document.getElementById('bookingPropertySize').value;
    const date = document.getElementById('bookingDate').value;
    const time = document.getElementById('bookingTime').value;

    // Service labels
    const serviceLabels = {
        'residential': 'Residential Cleaning',
        'commercial': 'Commercial Cleaning',
        'deep': 'Deep Cleaning',
        'specialized': 'Specialized Cleaning'
    };

    // Frequency labels
    const frequencyLabels = {
        'one-time': 'One-Time',
        'weekly': 'Weekly',
        'biweekly': 'Bi-Weekly',
        'monthly': 'Monthly'
    };

    // Size labels
    const sizeLabels = {
        'small': 'Small (1-2 rooms)',
        'medium': 'Medium (3-4 rooms)',
        'large': 'Large (5+ rooms)'
    };

    // Time labels
    const timeLabels = {
        'morning': 'Morning (8:00 AM - 12:00 PM)',
        'afternoon': 'Afternoon (12:00 PM - 4:00 PM)',
        'evening': 'Evening (4:00 PM - 6:00 PM)'
    };

    // Update summary
    document.getElementById('summaryService').textContent = serviceLabels[service] || 'Not selected';
    document.getElementById('summaryFrequency').textContent = frequencyLabels[frequency] || 'Not selected';
    document.getElementById('summarySize').textContent = sizeLabels[propertySize] || 'Not selected';
    document.getElementById('summaryDate').textContent = date || 'Not selected';
    document.getElementById('summaryTime').textContent = timeLabels[time] || 'Not selected';

    // Calculate estimated cost
    let baseCost = 0;
    if (service === 'residential') baseCost = 150;
    else if (service === 'commercial') baseCost = 200;
    else if (service === 'deep') baseCost = 300;
    else if (service === 'specialized') baseCost = 250;

    // Add extras cost
    let extrasCost = 0;
    const extras = document.querySelectorAll('input[name="extras"]:checked');
    extras.forEach(extra => {
        if (extra.value === 'windows') extrasCost += 50;
        else if (extra.value === 'carpets') extrasCost += 75;
        else if (extra.value === 'laundry') extrasCost += 40;
        else if (extra.value === 'organization') extrasCost += 60;
    });

    const totalCost = baseCost + extrasCost;
    document.getElementById('summaryTotal').textContent = totalCost > 0 ? '$' + totalCost : '$0';
}

// ============================================
// Accessibility & Performance Enhancements
// ============================================

// Ensure keyboard navigation works properly
document.addEventListener('keydown', function(e) {
    if (e.key === 'Escape') {
        const hamburger = document.getElementById('hamburger');
        const navbarMenu = document.getElementById('navbarMenu');
        if (hamburger && hamburger.classList.contains('active')) {
            hamburger.classList.remove('active');
            navbarMenu.classList.remove('active');
        }
    }
});
