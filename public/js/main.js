/**
 * Main JavaScript file for the Application System
 */

// Check if user is logged in
async function checkAuth() {
    try {
        const response = await fetch('/api/users/profile');
        return response.ok;
    } catch (error) {
        console.error('Auth check error:', error);
        return false;
    }
}

// Check if admin is logged in
async function checkAdminAuth() {
    try {
        const response = await fetch('/api/admin/applications');
        return response.ok;
    } catch (error) {
        console.error('Admin auth check error:', error);
        return false;
    }
}

// Format date
function formatDate(dateString) {
    const options = { year: 'numeric', month: 'long', day: 'numeric' };
    return new Date(dateString).toLocaleDateString(undefined, options);
}

// Show alert message
function showAlert(message, type = 'info') {
    const alertDiv = document.createElement('div');
    alertDiv.className = `alert alert-${type}`;
    alertDiv.style.position = 'fixed';
    alertDiv.style.top = '20px';
    alertDiv.style.left = '50%';
    alertDiv.style.transform = 'translateX(-50%)';
    alertDiv.style.padding = '15px 20px';
    alertDiv.style.borderRadius = '5px';
    alertDiv.style.zIndex = '9999';
    
    // Set background color based on type
    switch(type) {
        case 'success':
            alertDiv.style.backgroundColor = '#2ecc71';
            break;
        case 'error':
            alertDiv.style.backgroundColor = '#e74c3c';
            break;
        case 'warning':
            alertDiv.style.backgroundColor = '#f39c12';
            break;
        default:
            alertDiv.style.backgroundColor = '#3498db';
    }
    
    alertDiv.style.color = 'white';
    alertDiv.textContent = message;
    
    document.body.appendChild(alertDiv);
    
    // Remove after 3 seconds
    setTimeout(() => {
        alertDiv.remove();
    }, 3000);
}

// Validate form inputs
function validateForm(form) {
    const inputs = form.querySelectorAll('input, select, textarea');
    let isValid = true;
    
    inputs.forEach(input => {
        if (input.hasAttribute('required') && !input.value.trim()) {
            isValid = false;
            input.style.borderColor = 'red';
        } else {
            input.style.borderColor = '';
        }
    });
    
    return isValid;
}

// Add event listeners to all forms
document.addEventListener('DOMContentLoaded', function() {
    const forms = document.querySelectorAll('form');
    
    forms.forEach(form => {
        form.addEventListener('submit', function(e) {
            if (!validateForm(this)) {
                e.preventDefault();
                showAlert('Please fill in all required fields', 'error');
            }
        });
    });
}); 