/* Copyright 2025 Christian Blake
sources:
- https://jqueryvalidation.org/documentation/
- https://jqueryvalidation.org/jQuery.validator.addMethod/
- https://stackoverflow.com/questions/1300994/jquery-validate-custom-messages
- https://stackoverflow.com/questions/2316011/jquery-validation-plugin-errorplacement
- https://www.sitepoint.com/basic-jquery-form-validation-tutorial/
- https://api.jqueryui.com/slider/
- https://api.jqueryui.com/tabs/
- https://stackoverflow.com/questions/6312993/javascript-seconds-to-time-with-jquery
- https://stackoverflow.com/questions/10024469/jquery-ui-slider-two-way-binding-to-input
- https://stackoverflow.com/questions/3646914/how-do-i-check-if-file-exists-in-jquery-or-pure-javascript
*/

// wait for DOM to be ready
$(document).ready(function() {
    
    // validation constants
    const MIN_VALUE = -50;
    const MAX_VALUE = 50;
    const MAX_TABLE_SIZE = 100;
    
    // track generated tables
    let tableCount = 0;
    let generatedTabs = [];
    
    // initialize jQuery UI tabs
    $('#tabs').tabs({
        collapsible: false,
        heightStyle: "content"
    });
    
    // initialize sliders for each input
    initializeSliders();
    
    // generate initial preview
    updatePreview();
    
    // custom validation methods
    $.validator.addMethod("lessThanOrEqual", function(value, element, param) {
        const minVal = parseInt(value);
        const maxVal = parseInt($(param).val());
        
        if ($(param).val() === '' || isNaN(maxVal)) {
            return true;
        }
        
        return minVal <= maxVal;
    }, "Minimum value must be less than or equal to maximum value");
    
    $.validator.addMethod("greaterThanOrEqual", function(value, element, param) {
        const maxVal = parseInt(value);
        const minVal = parseInt($(param).val());
        
        if ($(param).val() === '' || isNaN(minVal)) {
            return true;
        }
        
        return maxVal >= minVal;
    }, "Maximum value must be greater than or equal to minimum value");
    
    $.validator.addMethod("tableSize", function(value, element) {
        const minCol = parseInt($('#minCol').val());
        const maxCol = parseInt($('#maxCol').val());
        const minRow = parseInt($('#minRow').val());
        const maxRow = parseInt($('#maxRow').val());
        
        if (isNaN(minCol) || isNaN(maxCol) || isNaN(minRow) || isNaN(maxRow)) {
            return true;
        }
        
        const colCount = Math.abs(maxCol - minCol) + 1;
        const rowCount = Math.abs(maxRow - minRow) + 1;
        
        return colCount <= MAX_TABLE_SIZE && rowCount <= MAX_TABLE_SIZE;
    }, `Table dimensions cannot exceed ${MAX_TABLE_SIZE}x${MAX_TABLE_SIZE}. Please reduce your range.`);
    
    // initialize jQuery validation
    const validator = $('#tableForm').validate({
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
        
        errorPlacement: function(error, element) {
            const errorDiv = $('#' + element.attr('name') + 'Error');
            errorDiv.html(error);
            errorDiv.addClass('show');
        },
        
        highlight: function(element) {
            $(element).addClass('error');
        },
        
        unhighlight: function(element) {
            $(element).removeClass('error');
            $('#' + $(element).attr('name') + 'Error').removeClass('show').empty();
        },

        submitHandler: function(form) {
            const values = {
                minCol: parseInt($('#minCol').val()),
                maxCol: parseInt($('#maxCol').val()),
                minRow: parseInt($('#minRow').val()),
                maxRow: parseInt($('#maxRow').val())
            };
            
            createTableTab(values);
            showSuccessMessage();
            
            // Prevent the default form submission
            return false;
        }
    });
    
    // initialize sliders with two-way binding
    function initializeSliders() {
        // configuration for each slider
        const sliderConfigs = [
            { inputId: '#minCol', sliderId: '#minColSlider', valueId: '#minColValue' },
            { inputId: '#maxCol', sliderId: '#maxColSlider', valueId: '#maxColValue' },
            { inputId: '#minRow', sliderId: '#minRowSlider', valueId: '#minRowValue' },
            { inputId: '#maxRow', sliderId: '#maxRowSlider', valueId: '#maxRowValue' }
        ];
        
        sliderConfigs.forEach(config => {
            const $input = $(config.inputId);
            const $slider = $(config.sliderId);
            const $valueDisplay = $(config.valueId);
            const initialValue = parseInt($input.val()) || 0;
            
            // initialize slider
            $slider.slider({
                min: MIN_VALUE,
                max: MAX_VALUE,
                value: initialValue,
                slide: function(event, ui) {
                    // update input and display when slider moves
                    $input.val(ui.value);
                    $valueDisplay.text(ui.value);
                    // trigger validation
                    $input.valid();
                    // update preview immediately
                    updatePreview();
                }
            });
            
            // bind input changes to slider
            $input.on('input change', function() {
                const value = parseInt($(this).val());
                if (!isNaN(value) && value >= MIN_VALUE && value <= MAX_VALUE) {
                    $slider.slider('value', value);
                    $valueDisplay.text(value);
                    updatePreview();
                }
            });
        });
    }
    
    // update preview table
    function updatePreview() {
        // check if form is valid
        if ($('#tableForm').valid()) {
            const values = {
                minCol: parseInt($('#minCol').val()),
                maxCol: parseInt($('#maxCol').val()),
                minRow: parseInt($('#minRow').val()),
                maxRow: parseInt($('#maxRow').val())
            };
            
            const table = generateTable(values);
            $('#previewContainer').html(table);
        } else {
            $('#previewContainer').html('<p style="color: #666; text-align: center; padding: 20px;">Fix validation errors to see preview</p>');
        }
    }
    
    // create a new tab with generated table
    function createTableTab(values) {
        tableCount++;
        const tabId = `table-tab-${tableCount}`;
        const tabTitle = `(${values.minCol},${values.maxCol}) × (${values.minRow},${values.maxRow})`;
        
        // add to tracking array
        generatedTabs.push({
            id: tabId,
            title: tabTitle,
            values: values
        });
        
        // add tab to navigation
        $('#tabs ul').append(`<li><a href="#${tabId}">${tabTitle}</a></li>`);
        
        // add tab content
        const tabContent = $(`
            <div id="${tabId}" class="table-tab">
                <div class="table-wrapper">
                    <h3>Multiplication Table: ${tabTitle}</h3>
                    <button class="delete-single-tab" data-tab-id="${tabId}">Delete This Tab</button>
                    <div class="table-container">
                        ${generateTable(values)}
                    </div>
                </div>
            </div>
        `);
        
        $('#tabs').append(tabContent);
        
        // refresh tabs widget
        $('#tabs').tabs("refresh");
        
        // switch to new tab
        const newTabIndex = $('#tabs ul li').length - 1;
        $('#tabs').tabs("option", "active", newTabIndex);
        
        // update checkboxes for tab management
        updateTabCheckboxes();
    }
    
    // generate table HTML
    function generateTable(values) {
        let tableHtml = '<table>';
        
        // header row
        tableHtml += '<thead><tr><th>×</th>';
        for (let col = values.minCol; col <= values.maxCol; col++) {
            tableHtml += `<th>${col}</th>`;
        }
        tableHtml += '</tr></thead>';
        
        // body rows
        tableHtml += '<tbody>';
        for (let row = values.minRow; row <= values.maxRow; row++) {
            tableHtml += `<tr><td>${row}</td>`;
            for (let col = values.minCol; col <= values.maxCol; col++) {
                tableHtml += `<td>${row * col}</td>`;
            }
            tableHtml += '</tr>';
        }
        tableHtml += '</tbody></table>';
        
        return tableHtml;
    }
    
    // update tab checkboxes for deletion
    function updateTabCheckboxes() {
        const $checkboxContainer = $('#tabCheckboxes');
        $checkboxContainer.empty();
        
        if (generatedTabs.length === 0) {
            $checkboxContainer.html('<p>No tables generated yet.</p>');
            return;
        }
        
        $checkboxContainer.html('<p>Select tables to delete:</p>');
        
        generatedTabs.forEach(tab => {
            const checkbox = `
                <label class="tab-checkbox-label">
                    <input type="checkbox" class="tab-checkbox" value="${tab.id}">
                    ${tab.title}
                </label>
            `;
            $checkboxContainer.append(checkbox);
        });
    }
    
    // delete selected tabs
    $('#deleteSelectedTabs').click(function() {
        const selectedTabs = [];
        $('.tab-checkbox:checked').each(function() {
            selectedTabs.push($(this).val());
        });
        
        if (selectedTabs.length === 0) {
            alert('Please select at least one table to delete.');
            return;
        }
        
        if (confirm(`Delete ${selectedTabs.length} selected table(s)?`)) {
            selectedTabs.forEach(tabId => {
                deleteTab(tabId);
            });
            updateTabCheckboxes();
        }
    });
    
    // delete all tabs
    $('#deleteAllTabs').click(function() {
        if (generatedTabs.length === 0) {
            alert('No tables to delete.');
            return;
        }
        
        if (confirm(`Delete all ${generatedTabs.length} table(s)?`)) {
            // create a copy of the array to iterate over
            const tabsToDelete = [...generatedTabs];
            tabsToDelete.forEach(tab => {
                deleteTab(tab.id);
            });
            updateTabCheckboxes();
        }
    });
    
    // delete single tab - using event delegation for dynamically created buttons
    $(document).on('click', '.delete-single-tab', function() {
        const tabId = $(this).data('tab-id');
        if (confirm('Delete this table?')) {
            deleteTab(tabId);
            updateTabCheckboxes();
            // switch back to input tab
            $('#tabs').tabs("option", "active", 0);
        }
    });
    
    // delete tab helper function
    function deleteTab(tabId) {
        // find and remove from tracking array
        generatedTabs = generatedTabs.filter(tab => tab.id !== tabId);
        
        // find tab index
        const $tabLink = $(`#tabs a[href="#${tabId}"]`);
        const $tabLi = $tabLink.parent();
        
        // remove tab and content
        $tabLi.remove();
        $(`#${tabId}`).remove();
        
        // refresh tabs widget
        $('#tabs').tabs("refresh");
    }
    
    // show success message
    function showSuccessMessage() {
        $('#successMessage').addClass('show');
        setTimeout(function() {
            $('#successMessage').removeClass('show');
        }, 3000);
    }
    
    // clear validation errors when user types
    $('input[type="number"]').on('input', function() {
        // trigger validation for this field only
        $(this).valid();
    });
    
    // initial update of checkboxes
    updateTabCheckboxes();
});