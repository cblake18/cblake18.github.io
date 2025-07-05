/*
 * Copyright 2025 Christian Blake
 * File: script.js
 * GUI Assignment: Scrabble Game
 * Description: JavaScript implementation for single-line Scrabble game with drag-and-drop
 * 
 * implements the game logic including:
 * - Tile distribution and management
 * - Drag and drop functionality
 * - Score calculation with bonus squares
 * - Word validation and submission
 * - Dictionary checking
 * 
 * sources: 
 * - https://api.jquery.com/
 * - https://jqueryui.com/draggable/
 * - https://jqueryui.com/droppable/
 * - https://developer.mozilla.org/en-US/docs/Web/API/HTML_Drag_and_Drop_API
 * - https://scrabble.hasbro.com/en-us/rules
 * - https://www.sitepoint.com/creating-a-drag-and-drop-game-with-jquery/
 * - https://gameprogrammingpatterns.com/
 * - https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Array
 * - https://css-tricks.com/snippets/css/complete-guide-grid/
 * - https://developer.mozilla.org/en-US/docs/Learn/JavaScript/Objects/JSON
 * - https://www.freecodecamp.org/news/how-to-build-a-word-game-with-javascript/
 * - https://www.w3schools.com/graphics/game_intro.asp
 * - https://stackoverflow.com/questions/tagged/scrabble+javascript
 */

// letter distribution
let letterDistribution = {};

/**
 * load letter distribution from JSON file
 */
function loadLetterDistribution() {
    $.getJSON('data/pieces.json', function(data) {
        // convert the array format to object format
        data.pieces.forEach(piece => {
            letterDistribution[piece.letter] = {
                value: piece.value,
                amount: piece.amount
            };
        });
        
        // initialize the game after loading data
        initializeGame();
    }).fail(function() {
        console.error('Failed to load pieces.json, using hardcoded distribution');
        // fallback to hardcoded distribution
        letterDistribution = {
            "A": {"value": 1, "amount": 9},
            "B": {"value": 3, "amount": 2},
            "C": {"value": 3, "amount": 2},
            "D": {"value": 2, "amount": 4},
            "E": {"value": 1, "amount": 12},
            "F": {"value": 4, "amount": 2},
            "G": {"value": 2, "amount": 3},
            "H": {"value": 4, "amount": 2},
            "I": {"value": 1, "amount": 9},
            "J": {"value": 8, "amount": 1},
            "K": {"value": 5, "amount": 1},
            "L": {"value": 1, "amount": 4},
            "M": {"value": 3, "amount": 2},
            "N": {"value": 1, "amount": 5},
            "O": {"value": 1, "amount": 8},
            "P": {"value": 3, "amount": 2},
            "Q": {"value": 10, "amount": 1},
            "R": {"value": 1, "amount": 6},
            "S": {"value": 1, "amount": 4},
            "T": {"value": 1, "amount": 6},
            "U": {"value": 1, "amount": 4},
            "V": {"value": 4, "amount": 2},
            "W": {"value": 4, "amount": 2},
            "X": {"value": 8, "amount": 1},
            "Y": {"value": 4, "amount": 2},
            "Z": {"value": 10, "amount": 1},
            "_": {"value": 0, "amount": 2}
        };
        initializeGame();
    });
}

/**
 * initialize the game after data is loaded
 */
function initializeGame() {
    initializeTileBag();
    createBoard();
    dealInitialTiles();
    
    // button event handlers
    $('#submit-word').click(submitWord);
    $('#recall-tiles').click(recallTiles);
    $('#new-tiles').click(getNewTiles);
    $('#reset-game').click(resetGame);
    
    // make rack droppable
    setupRackDroppable();
}

const dictionary = [];

// game state variables
let tileBag = [];
let currentScore = 0;
let totalScore = 0;
let boardState = [];
let placedTiles = [];

// board configuration - 15 squares
const boardConfig = [
    { type: 'normal', multiplier: 1 },
    { type: 'normal', multiplier: 1 },
    { type: 'double-word', multiplier: 2 },
    { type: 'normal', multiplier: 1 },
    { type: 'normal', multiplier: 1 },
    { type: 'normal', multiplier: 1 },
    { type: 'double-letter', multiplier: 2 },
    { type: 'normal', multiplier: 1 },
    { type: 'double-letter', multiplier: 2 },
    { type: 'normal', multiplier: 1 },
    { type: 'normal', multiplier: 1 },
    { type: 'normal', multiplier: 1 },
    { type: 'double-word', multiplier: 2 },
    { type: 'normal', multiplier: 1 },
    { type: 'normal', multiplier: 1 }
];

/**
 * initialize the tile bag with all tiles according to distribution
 */
function initializeTileBag() {
    tileBag = [];
    for (let letter in letterDistribution) {
        for (let i = 0; i < letterDistribution[letter].amount; i++) {
            tileBag.push({
                letter: letter,
                value: letterDistribution[letter].value
            });
        }
    }
    // shuffle the bag using Fisher-Yates algorithm
    for (let i = tileBag.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [tileBag[i], tileBag[j]] = [tileBag[j], tileBag[i]];
    }
}

/**
 * draw specified number of tiles from the bag
 */
function drawTiles(count) {
    const tiles = [];
    for (let i = 0; i < count && tileBag.length > 0; i++) {
        tiles.push(tileBag.pop());
    }
    return tiles;
}

/**
 * create the board with drop zones
 */
function createBoard() {
    const overlay = $('.board-squares-overlay');
    overlay.empty();
    boardState = new Array(boardConfig.length).fill(null);
    
    boardConfig.forEach((square, index) => {
        const squareDiv = $('<div>')
            .addClass('board-square')
            .attr('data-index', index)
            .attr('data-bonus', square.type)
            .attr('data-multiplier', square.multiplier);
        
        // make squares droppable
        squareDiv.droppable({
            accept: '.letter-tile',
            tolerance: 'intersect',
            classes: {
                "ui-droppable-hover": "drop-hover"
            },
            over: function(event, ui) {
                ui.draggable.data('dropped-on', $(this));
            },
            out: function(event, ui) {
                ui.draggable.removeData('dropped-on');
            },
            drop: function(event, ui) {
                const tile = ui.draggable;
                const success = handleTileDrop($(this), tile);
                
                // if drop failed, revert the tile
                if (success === false) {
                    // get original position and parent
                    const origParent = tile.data('origParent');
                    const origPosition = tile.data('origPosition');
                    
                    // if tile was on the board, put it back
                    if (origParent && origParent.hasClass('board-container')) {
                        tile.animate({
                            left: origPosition.left,
                            top: origPosition.top
                        }, 200);
                    } else {
                        // otherwise return to rack
                        tile.animate({
                            left: 0,
                            top: 0
                        }, 200, function() {
                            tile.css({
                                position: 'relative',
                                left: 0,
                                top: 0
                            });
                            $('#tile-rack').append(tile);
                        });
                    }
                }
            }
        });
        
        overlay.append(squareDiv);
    });
}

/**
 * remove tile from board
 */
function removeTileFromBoard(tile) {
    const placedIndex = placedTiles.findIndex(p => p.tile[0] === tile[0]);
    if (placedIndex !== -1) {
        const placed = placedTiles[placedIndex];
        boardState[placed.index] = null;
        $('.board-square[data-index="' + placed.index + '"]').removeClass('occupied');
        placedTiles.splice(placedIndex, 1);
        
        // reset any blank tile chosen letter
        tile.removeAttr('data-chosen-letter');
        
        updateWordDisplay();
        calculateScore();
    }
}

/**
 * create a letter tile element with image
 */
function createTileElement(tile) {
    const tileDiv = $('<div>')
        .addClass('letter-tile')
        .attr('data-letter', tile.letter)
        .attr('data-value', tile.value);
    
    // create image element
    const tileImage = $('<img>')
        .attr('src', `images/tiles/Scrabble_Tile_${tile.letter === '_' ? 'Blank' : tile.letter}.jpg`)
        .attr('alt', `Letter ${tile.letter}`)
        .on('error', function() {
            // fallback if image not found - create a simple styled tile
            $(this).parent().html(`
                <div class="tile-fallback">
                    <div class="letter">${tile.letter === '_' ? '' : tile.letter}</div>
                    <div class="value">${tile.value}</div>
                </div>
            `);
        });
    
    tileDiv.append(tileImage);
    
    // make tile draggable
    tileDiv.draggable({
        revert: function(valid) {
            // if drop was not valid, revert to original position
            if (!valid) {
                return true;
            }
            // check if this was dropped on a board square
            const droppedOn = $(this).data('dropped-on');
            if (droppedOn && droppedOn.hasClass('board-square')) {
                // will be handled by handleTileDrop
                return false;
            }
            return !valid;
        },
        revertDuration: 200,
        containment: '.game-container',
        zIndex: 1000,
        start: function(event, ui) {
            $(this).css('z-index', 1000);
            // store original position for proper revert
            $(this).data('origPosition', $(this).position());
            $(this).data('origParent', $(this).parent());
        },
        stop: function(event, ui) {
            $(this).css('z-index', 100);
        }
    });
    
    return tileDiv;
}

/**
 * deal initial 7 tiles to the rack
 */
function dealInitialTiles() {
    const rack = $('#tile-rack');
    rack.empty();
    const tiles = drawTiles(7);
    
    tiles.forEach(tile => {
        rack.append(createTileElement(tile));
    });
}

/**
 * prompt user to choose letter for blank tile
 */
function promptForBlankLetter(tile, callback) {
    // create simple letter selection dialog
    const letters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'.split('');
    const dialogContent = $('<div>').css({
        'text-align': 'center',
        'padding': '10px'
    });
    
    dialogContent.append('<p>Choose a letter for your blank tile:</p>');
    
    const letterGrid = $('<div>').css({
        'display': 'grid',
        'grid-template-columns': 'repeat(6, 1fr)',
        'gap': '5px',
        'margin-top': '10px'
    });
    
    letters.forEach(letter => {
        const letterBtn = $('<button>')
            .text(letter)
            .css({
                'padding': '5px',
                'font-size': '16px',
                'cursor': 'pointer'
            })
            .click(function() {
                tile.attr('data-chosen-letter', letter);
                // update tile display to show chosen letter
                const fallback = tile.find('.tile-fallback');
                if (fallback.length) {
                    fallback.find('.letter').text(letter);
                }
                dialogContent.dialog('close');
                callback(letter);
            });
        letterGrid.append(letterBtn);
    });
    
    dialogContent.append(letterGrid);
    
    dialogContent.dialog({
        title: 'Select Letter for Blank Tile',
        modal: true,
        width: 400,
        closeOnEscape: false,
        open: function(event, ui) {
            // remove close button
            $(this).parent().find('.ui-dialog-titlebar-close').hide();
        }
    });
}

/**
 * handle when a tile is dropped on a board square
 */
function handleTileDrop(square, tile) {
    const squareIndex = parseInt(square.attr('data-index'));
    
    // check if square is already occupied
    if (boardState[squareIndex]) {
        showMessage('That square is already occupied!', 'error');
        return false;
    }
    
    // get the tile's current board position if it's already placed
    const currentPlacedIndex = placedTiles.findIndex(p => p.tile[0] === tile[0]);
    const tileCurrentIndex = currentPlacedIndex !== -1 ? placedTiles[currentPlacedIndex].index : -1;
    
    // check if placement is valid (adjacent to other tiles after first tile)
    // only check adjacency if there are other tiles on board (excluding tile being moved)
    const otherTilesCount = currentPlacedIndex !== -1 ? placedTiles.length - 1 : placedTiles.length;
    if (otherTilesCount > 0 && !isValidPlacement(squareIndex, tileCurrentIndex)) {
        showMessage('Tiles must be placed adjacent to each other!', 'error');
        return false;
    }
    
    // function to complete the placement
    const completePlacement = (letterToUse) => {
        // remove tile from previous position if it was already on the board
        const previousIndex = placedTiles.findIndex(p => p.tile[0] === tile[0]);
        if (previousIndex !== -1) {
            const previousPlaced = placedTiles[previousIndex];
            boardState[previousPlaced.index] = null;
            $('.board-square[data-index="' + previousPlaced.index + '"]').removeClass('occupied');
            placedTiles.splice(previousIndex, 1);
        }
        
        // place tile
        boardState[squareIndex] = {
            letter: letterToUse || tile.attr('data-letter'),
            value: parseInt(tile.attr('data-value'))
        };
        
        placedTiles.push({
            index: squareIndex,
            tile: tile,
            originalParent: tile.parent()
        });
        
        // position tile on square
        const squarePos = square.position();
        const boardPos = $('#scrabble-board').position();
        
        tile.css({
            position: 'absolute',
            left: squarePos.left + boardPos.left + (square.width() - tile.width()) / 2,
            top: squarePos.top + boardPos.top + (square.height() - tile.height()) / 2,
            zIndex: 99
        });
        
        tile.appendTo('.board-container');
        
        square.addClass('occupied');
        tile.addClass('placed');
        
        // update display
        updateWordDisplay();
        calculateScore();
    };
    
    // check if it's a blank tile and needs letter selection
    if (tile.attr('data-letter') === '_' && !tile.attr('data-chosen-letter')) {
        promptForBlankLetter(tile, completePlacement);
    } else {
        completePlacement(tile.attr('data-chosen-letter'));
    }
    
    return true; // success
}

/**
 * check if tile placement is valid (must be adjacent to existing tiles)
 */
function isValidPlacement(index, excludeIndex = -1) {
    // allow any placement if there are no other tiles
    if (placedTiles.length === 0) {
        return true;
    }
    
    // check adjacency to other tiles (excluding the tile being moved)
    return placedTiles.some(placed => {
        // skip the tile that's being moved
        if (placed.index === excludeIndex) {
            return false;
        }
        return Math.abs(placed.index - index) === 1;
    });
}

/**
 * update the current word display
 */
function updateWordDisplay() {
    if (placedTiles.length === 0) {
        $('#current-word').text('---');
        return;
    }
    
    // sort placed tiles by position
    const sortedTiles = [...placedTiles].sort((a, b) => a.index - b.index);
    
    // check for gaps
    for (let i = 1; i < sortedTiles.length; i++) {
        if (sortedTiles[i].index - sortedTiles[i-1].index !== 1) {
            $('#current-word').text('Invalid - Gap in word!');
            return;
        }
    }
    
    // build word
    const word = sortedTiles.map(t => {
        const tile = t.tile;
        // use chosen letter for blank tiles
        if (tile.attr('data-letter') === '_') {
            return tile.attr('data-chosen-letter') || '_';
        }
        return boardState[t.index].letter;
    }).join('');
    $('#current-word').text(word);
}

/**
 * calculate the current word score including bonuses
 */
function calculateScore() {
    if (placedTiles.length === 0) {
        currentScore = 0;
        $('#word-score').text(0);
        return;
    }
    
    let wordScore = 0;
    let wordMultiplier = 1;
    
    placedTiles.forEach(placed => {
        const tile = boardState[placed.index];
        const square = $('.board-square[data-index="' + placed.index + '"]');
        const bonus = square.attr('data-bonus');
        let tileScore = tile.value;
        
        // apply bonus based on square type
        switch(bonus) {
            case 'double-letter':
                tileScore *= 2;
                break;
            case 'triple-letter': // not used on current board
                tileScore *= 3;
                break;
            case 'double-word':
                wordMultiplier *= 2;
                break;
            case 'triple-word': // not used on current board
                wordMultiplier *= 3;
                break;
        }
        
        wordScore += tileScore;
    });
    
    currentScore = wordScore * wordMultiplier;
    $('#word-score').text(currentScore);
}

/**
 * submit the current word
 */
function submitWord() {
    if (placedTiles.length === 0) {
        showMessage('No word to submit!', 'error');
        return;
    }
    
    // check for valid word formation (no gaps)
    const sortedTiles = [...placedTiles].sort((a, b) => a.index - b.index);
    for (let i = 1; i < sortedTiles.length; i++) {
        if (sortedTiles[i].index - sortedTiles[i-1].index !== 1) {
            showMessage('Invalid word - tiles must be adjacent!', 'error');
            return;
        }
    }
    
    // build word with chosen letters for blanks
    const word = sortedTiles.map(t => {
        const tile = t.tile;
        if (tile.attr('data-letter') === '_') {
            return tile.attr('data-chosen-letter') || '_';
        }
        return boardState[t.index].letter;
    }).join('');
    
    // dictionary validation
    if (!isValidWord(word)) {
        showMessage(`"${word}" is not a valid word!`, 'error');
        return;
    }
    
    // add to total score
    totalScore += currentScore;
    $('#total-score').text(totalScore);
    
    // show success message
    showMessage(`Word "${word}" submitted for ${currentScore} points!`, 'success');
    
    // clear board
    clearBoard();
    
    // deal new tiles
    const tilesNeeded = 7 - $('#tile-rack .letter-tile').length;
    const newTiles = drawTiles(tilesNeeded);
    const rack = $('#tile-rack');
    
    newTiles.forEach(tile => {
        rack.append(createTileElement(tile));
    });
    
    // reset current score
    currentScore = 0;
    $('#word-score').text(0);
    $('#current-word').text('---');
}

/**
 * check if word is valid
 */
function isValidWord(word) {
    // check against dictionary file
    return dictionary.includes(word.toUpperCase());
}

/**
 * clear all tiles from the board
 */
function clearBoard() {
    placedTiles.forEach(placed => {
        placed.tile.remove();
    });
    
    placedTiles = [];
    boardState = new Array(boardConfig.length).fill(null);
    
    $('.board-square').removeClass('occupied');
}

/**
 * recall all placed tiles back to rack
 */
function recallTiles() {
    const rack = $('#tile-rack');
    
    placedTiles.forEach(placed => {
        // remove placed class
        placed.tile.removeClass('placed');
        
        // reset any blank tile chosen letter
        placed.tile.removeAttr('data-chosen-letter');
        
        // reset fallback display for blank tiles
        if (placed.tile.attr('data-letter') === '_') {
            const fallback = placed.tile.find('.tile-fallback');
            if (fallback.length) {
                fallback.find('.letter').text('');
            }
        }
        
        // reset position and move back to rack
        placed.tile.css({
            position: 'relative',
            left: 0,
            top: 0,
            zIndex: 100
        });
        
        rack.append(placed.tile);
        
        // clear board square
        const square = $('.board-square[data-index="' + placed.index + '"]');
        square.removeClass('occupied');
    });
    
    // reset game state
    placedTiles = [];
    boardState = new Array(boardConfig.length).fill(null);
    currentScore = 0;
    
    updateWordDisplay();
    calculateScore();
    showMessage('Tiles recalled to rack', 'success');
}

/**
 * deal new set of 7 tiles
 */
function getNewTiles() {
    if (placedTiles.length > 0) {
        showMessage('Please submit or recall current tiles first!', 'error');
        return;
    }
    
    $('#tile-rack').empty();
    dealInitialTiles();
    showMessage('New tiles dealt!', 'success');
}

/**
 * reset the entire game
 */
function resetGame() {
    // clear all tiles from DOM
    $('.letter-tile').remove();
    
    // reset all state
    placedTiles = [];
    boardState = new Array(boardConfig.length).fill(null);
    $('.board-square').removeClass('occupied');
    
    // reinitialize
    initializeTileBag();
    dealInitialTiles();
    totalScore = 0;
    currentScore = 0;
    $('#total-score').text(0);
    $('#word-score').text(0);
    $('#current-word').text('---');
    showMessage('Game reset!', 'success');
}

/**
 * display a temporary message to the user
 */
function showMessage(text, type) {
    const messageDiv = $('#message');
    messageDiv.removeClass('error success').addClass(type).text(text);
    setTimeout(() => {
        messageDiv.fadeOut(() => {
            messageDiv.text('').show();
        });
    }, 3000);
}

/**
 * setup rack droppable functionality
 */
function setupRackDroppable() {
    // make rack droppable for returning tiles
    $('#tile-rack').droppable({
        accept: '.letter-tile',
        tolerance: 'pointer',
        drop: function(event, ui) {
            const tile = ui.draggable;
            
            // remove placed class
            tile.removeClass('placed');
            
            // remove from board state
            removeTileFromBoard(tile);
            
            // reset blank tile display if needed
            if (tile.attr('data-letter') === '_') {
                const fallback = tile.find('.tile-fallback');
                if (fallback.length) {
                    fallback.find('.letter').text('');
                }
            }
            
            // reset position to prevent drift
            tile.css({
                position: 'relative',
                left: 0,
                top: 0,
                zIndex: 100
            });
            
            // ensure tile is properly appended to rack
            $(this).append(tile);
            
            // reset draggable revert option
            tile.draggable('option', 'revert', function(valid) {
                if (!valid) {
                    return true;
                }
                const droppedOn = $(this).data('dropped-on');
                if (droppedOn && droppedOn.hasClass('board-square')) {
                    return false;
                }
                return !valid;
            });
        }
    });
    
    // make the rack holder area droppable
    $('#tile-rack-holder').droppable({
        accept: '.letter-tile',
        tolerance: 'pointer',
        drop: function(event, ui) {
            // delegate to the rack's drop handler
            $('#tile-rack').droppable('option', 'drop').call($('#tile-rack')[0], event, ui);
        }
    });
}

/**
 * initialize the game when document is ready
 */
$(document).ready(function() {
    // load dictionary
    $.get('data/dictionary.txt', function(data) {
        const words = data.toUpperCase().split(/\r?\n/).filter(word => word.length > 0);
        dictionary.push(...words);
        console.log(`Loaded ${dictionary.length} words`);
    }).fail(function() {
        console.log('Using default dictionary');
        // add some default words for testing
        dictionary.push(
            "CAT", "DOG", "HOUSE", "THE", "AND", "FOR", "ARE", "BUT", "NOT",
            "YOU", "ALL", "CAN", "HER", "WAS", "ONE", "OUR", "OUT", "DAY"
        );
    });
    
    // load letter distribution and initialize game
    loadLetterDistribution();
});