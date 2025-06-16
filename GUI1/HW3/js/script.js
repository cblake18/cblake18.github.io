/* Copyright 2025 Christian Blake
sources:
- https://www.javascripttutorial.net/javascript-dom/javascript-form-validation/
- https://developer.mozilla.org/en-US/docs/Learn_web_development/Extensions/Forms/Form_validation
- https://www.freecodecamp.org/news/form-validation-in-javascript/
- https://developer.mozilla.org/en-US/docs/Web/API/Document_Object_Model/Traversing_an_HTML_table_with_JavaScript_and_DOM_Interfaces
- https://stackoverflow.com/questions/8302166/dynamic-creation-of-table-with-dom
- https://www.tutorialspoint.com/javascript/javascript_event_delegation.htm
- https://teamtreehouse.com/community/how-to-parseint-the-value-of-a-text-input-field
- https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Array/forEach
 */

// get form elements
const form = document.getElementById('tableForm');
const tableContainer = document.getElementById('tableContainer');
const tableWrapper = document.getElementById('tableWrapper');
const successMessage = document.getElementById('successMessage');

// input elements
const inputs = {
    minCol: document.getElementById('minCol'),
    maxCol: document.getElementById('maxCol'),
    minRow: document.getElementById('minRow'),
    maxRow: document.getElementById('maxRow')
};

// error message elements
const errors = {
    minCol: document.getElementById('minColError'),
    maxCol: document.getElementById('maxColError'),
    minRow: document.getElementById('minRowError'),
    maxRow: document.getElementById('maxRowError')
};

// validation constants
const MIN_VALUE = -50;
const MAX_VALUE = 50;
const MAX_TABLE_SIZE = 100; // max cells in one dimension

// event listener for form submission
form.addEventListener('submit', function(e) {
    e.preventDefault();

    // reset error states
    clearErrors();

    // get input values
    const values = {
        minCol: parseInt(inputs.minCol.value),
        maxCol: parseInt(inputs.maxCol.value),
        minRow: parseInt(inputs.minRow.value),
        maxRow: parseInt(inputs.maxRow.value)
    };

    // validate inputs
    if (validateInputs(values)) {
        generateTable(values);
        showSuccessMessage();
    }
});

// clear error messages and states
function clearErrors() {
    Object.keys(errors).forEach(key => {
        errors[key].textContent = '';
        errors[key].classList.remove('show');
        inputs[key].classList.remove('error');
    });
    successMessage.classList.remove('show');
}

// validate all inputs
function validateInputs(values) {
    let isValid = true;

    // check that all inputs are numbers
    Object.keys(values).forEach(key => {
        if (isNaN(values[key])) {
            showError(key, 'Please enter a valid number.');
            isValid = false;
        }
    });

    if (!isValid) return false;

    // check min and max values
    Object.keys(values).forEach(key => {
        if (values[key] < MIN_VALUE || values[key] > MAX_VALUE) {
            showError(key, `Value must be between ${MIN_VALUE} and ${MAX_VALUE}.`);
            isValid = false;
        }
    });

    if (!isValid) return false;

    // check min and max relationships
    if (values.minCol > values.maxCol) {
        showError('minCol', 'Minimum columns cannot be greater than maximum columns.');
        isValid = false;
    }
    if (values.minRow > values.maxRow) {
        showError('minRow', 'Minimum rows cannot be greater than maximum rows.');
        isValid = false;
    }

    if (!isValid) return false;

    // check table size limits
    const colCount = Math.abs(values.maxCol - values.minCol) + 1;
    const rowCount = Math.abs(values.maxRow - values.minRow) + 1;

    if (colCount > MAX_TABLE_SIZE || rowCount > MAX_TABLE_SIZE) {
        showError('minCol', 'Table size too large, please reduce the range.');
        showError('maxCol', 'Table size too large, please reduce the range.');
        showError('minRow', 'Table size too large, please reduce the range.');
        showError('maxRow', 'Table size too large, please reduce the range.');
        isValid = false;
    }

    return isValid;
}

// show error message for a specific input
function showError(inputName, message) {
    errors[inputName].textContent = message;
    errors[inputName].classList.add('show');
    inputs[inputName].classList.add('error');
}

// generate the table based on input values
function generateTable(values) {
    // clear previous table
    tableContainer.innerHTML = '';

    // create table element
    const table = document.createElement('table');

    // create table header
    const thead = document.createElement('thead');
    const headerRow = document.createElement('tr');

    // empty cell for top-left corner
    const emptyCell = document.createElement('th');
    emptyCell.textContent = 'x';
    headerRow.appendChild(emptyCell);

    // create header cells for columns
    for (let col = values.minCol; col <= values.maxCol; col++) {
        const th = document.createElement('th');
        th.textContent = col;
        headerRow.appendChild(th);
    }

    thead.appendChild(headerRow);
    table.appendChild(thead);

    // create table body
    const tbody = document.createElement('tbody');

    // create rows
    for (let row = values.minRow; row <= values.maxRow; row++) {
        const tr = document.createElement('tr');

        // create header cell for row
        const rowHeader = document.createElement('td');
        rowHeader.textContent = row;
        tr.appendChild(rowHeader);

        // create cells for each column
        for (let col = values.minCol; col <= values.maxCol; col++) {
            const td = document.createElement('td');
            td.textContent = row * col; // product of row and column
            tr.appendChild(td);
        }

        tbody.appendChild(tr);
    }

    table.appendChild(tbody);
    tableContainer.appendChild(table);

    // show the table
    tableWrapper.style.display = 'block';
}

// show success message
function showSuccessMessage() {
    successMessage.classList.add('show');
    setTimeout(() => {
        successMessage.classList.remove('show');
    }, 3000); // hide after 3 seconds
}

// add input event listeners
Object.keys(inputs).forEach(key => {
    inputs[key].addEventListener('input', function() {
        // when user types, clear the error state
        this.classList.remove('error');
        errors[key].classList.remove('show');
    });
});

    

