/* Copyright 2025 Christian Blake
sources:
- https://jqueryvalidation.org/documentation/
- https://jqueryvalidation.org/jQuery.validator.addMethod/
- https://stackoverflow.com/questions/1300994/jquery-validate-custom-messages
- https://stackoverflow.com/questions/2316011/jquery-validation-plugin-errorplacement
- https://www.sitepoint.com/basic-jquery-form-validation-tutorial/
*/

// wait for DOM to be ready
$(document).ready(function() {
    
    // validation constants
    const MIN_VALUE = -50;
    const MAX_VALUE = 50;
    const MAX_TABLE_SIZE = 101; // changed to 101 from 100 to allow for 0-100 range
    
    // add custom validation method to check if min is less than or equal to max
    $.validator.addMethod("lessThanOrEqual", function(value, element, param) {
        const minVal = parseInt(value);
        const maxVal = parseInt($(param).val());
        
        // if max value is empty or not a number, skip this
        if ($(param).val() === '' || isNaN(maxVal)) {
            return true;
        }
        
        return minVal <= maxVal;
    }, "Minimum value must be less than or equal to maximum value");
    
    // add custom validation method to check if max is greater than or equal to min
    $.validator.addMethod("greaterThanOrEqual", function(value, element, param) {
        const maxVal = parseInt(value);
        const minVal = parseInt($(param).val());
        
        // if min value is empty or not a number, skip this validation
        if ($(param).val() === '' || isNaN(minVal)) {
            return true;
        }
        
        return maxVal >= minVal;
    }, "Maximum value must be greater than or equal to minimum value");
    
    // add custom validation method to check table size
    $.validator.addMethod("tableSize", function(value, element) {
        const minCol = parseInt($('#minCol').val());
        const maxCol = parseInt($('#maxCol').val());
        const minRow = parseInt($('#minRow').val());
        const maxRow = parseInt($('#maxRow').val());
        
        // skip if any value is empty or not a number
        if (isNaN(minCol) || isNaN(maxCol) || isNaN(minRow) || isNaN(maxRow)) {
            return true;
        }
        
        const colCount = Math.abs(maxCol - minCol) + 1;
        const rowCount = Math.abs(maxRow - minRow) + 1;
        
        return colCount <= MAX_TABLE_SIZE && rowCount <= MAX_TABLE_SIZE;
    }, `Table dimensions cannot exceed ${MAX_TABLE_SIZE}x${MAX_TABLE_SIZE}. Please reduce your range.`);
    
    // initialize jQuery validation on the form
    $('#tableForm').validate({
        // validation rules for each input
        rules: {
            minCol: {
                required: true,
                number: true,
                min: MIN_VALUE,
                max: MAX_VALUE,
                lessThanOrEqual: '#maxCol',
                tableSize: true
            },
            maxCol: {
                required: true,
                number: true,
                min: MIN_VALUE,
                max: MAX_VALUE,
                greaterThanOrEqual: '#minCol',
                tableSize: true
            },
            minRow: {
                required: true,
                number: true,
                min: MIN_VALUE,
                max: MAX_VALUE,
                lessThanOrEqual: '#maxRow',
                tableSize: true
            },
            maxRow: {
                required: true,
                number: true,
                min: MIN_VALUE,
                max: MAX_VALUE,
                greaterThanOrEqual: '#minRow',
                tableSize: true
            }
        },
        
        // custom error messages
        messages: {
            minCol: {
                required: "Please enter a minimum column value",
                number: "Please enter a valid number",
                min: `Value must be at least ${MIN_VALUE}`,
                max: `Value cannot exceed ${MAX_VALUE}`,
                lessThanOrEqual: "Minimum column value must be less than or equal to maximum column value"
            },
            maxCol: {
                required: "Please enter a maximum column value",
                number: "Please enter a valid number",
                min: `Value must be at least ${MIN_VALUE}`,
                max: `Value cannot exceed ${MAX_VALUE}`,
                greaterThanOrEqual: "Maximum column value must be greater than or equal to minimum column value"
            },
            minRow: {
                required: "Please enter a minimum row value",
                number: "Please enter a valid number",
                min: `Value must be at least ${MIN_VALUE}`,
                max: `Value cannot exceed ${MAX_VALUE}`,
                lessThanOrEqual: "Minimum row value must be less than or equal to maximum row value"
            },
            maxRow: {
                required: "Please enter a maximum row value",
                number: "Please enter a valid number",
                min: `Value must be at least ${MIN_VALUE}`,
                max: `Value cannot exceed ${MAX_VALUE}`,
                greaterThanOrEqual: "Maximum row value must be greater than or equal to minimum row value"
            }
        },
        
        // custom error placement for existing error divs
        errorPlacement: function(error, element) {
            const errorDiv = $('#' + element.attr('name') + 'Error');
            errorDiv.html(error);
            errorDiv.addClass('show');
        },
        
        // highlight invalid fields
        highlight: function(element) {
            $(element).addClass('error');
        },
        
        // remove highlighting when field becomes valid
        unhighlight: function(element) {
            $(element).removeClass('error');
            $('#' + $(element).attr('name') + 'Error').removeClass('show').empty();
        },
        
        // handle form submission
        submitHandler: function(form) {
            // get input values
            const values = {
                minCol: parseInt($('#minCol').val()),
                maxCol: parseInt($('#maxCol').val()),
                minRow: parseInt($('#minRow').val()),
                maxRow: parseInt($('#maxRow').val())
            };
            
            // generate the table
            generateTable(values);
            showSuccessMessage();
            
            // prevent actual form submission
            return false;
        }
    });
    
    // generate the multiplication table
    function generateTable(values) {
        // clear previous table
        $('#tableContainer').empty();
        
        // create table element
        const table = $('<table></table>');
        
        // create table header
        const thead = $('<thead></thead>');
        const headerRow = $('<tr></tr>');
        
        // empty cell for top-left corner
        headerRow.append($('<th>x</th>'));
        
        // create header cells for columns
        for (let col = values.minCol; col <= values.maxCol; col++) {
            headerRow.append($('<th>' + col + '</th>'));
        }
        
        thead.append(headerRow);
        table.append(thead);
        
        // create table body
        const tbody = $('<tbody></tbody>');
        
        // create rows
        for (let row = values.minRow; row <= values.maxRow; row++) {
            const tr = $('<tr></tr>');
            
            // create header cell for row
            tr.append($('<td>' + row + '</td>'));
            
            // create cells for each column
            for (let col = values.minCol; col <= values.maxCol; col++) {
                tr.append($('<td>' + (row * col) + '</td>'));
            }
            
            tbody.append(tr);
        }
        
        table.append(tbody);
        $('#tableContainer').append(table);
        
        // show the table wrapper
        $('#tableWrapper').show();
    }
    
    // show success message
    function showSuccessMessage() {
        $('#successMessage').addClass('show');
        setTimeout(function() {
            $('#successMessage').removeClass('show');
        }, 3000); // hide after 3 seconds
    }
    
    // clear error states when user types (provides immediate feedback)
    $('input[type="number"]').on('input', function() {
        // trigger validation for this field only
        $(this).valid();
    });
});