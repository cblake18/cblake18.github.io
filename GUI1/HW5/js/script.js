/*
 * File: script.js
 * GUI Assignment: Scrabble Game
 * Description: JavaScript implementation for single-line Scrabble game with drag-and-drop
 * 
 * This file implements the game logic including:
 * - Tile distribution and management
 * - Drag and drop functionality
 * - Score calculation with bonus squares
 * - Word validation and submission
 */

// Letter distribution data from pieces.json
const letterDistribution = {
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
    "_": {"value": 0, "amount": 2}  // Blank tiles
};

// Game state variables
let tileBag = [];
let currentScore = 0;
let totalScore = 0;
let boardState = [];
let placedTiles = [];

// Board configuration - 15 squares with various bonuses
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
 * Initialize the tile bag with all tiles according to distribution
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
    // Shuffle the bag using Fisher-Yates algorithm
    for (let i = tileBag.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [tileBag[i], tileBag[j]] = [tileBag[j], tileBag[i]];
    }
}

/**
 * Draw specified number of tiles from the bag
 */
function drawTiles(count) {
    const tiles = [];
    for (let i = 0; i < count && tileBag.length > 0; i++) {
        tiles.push(tileBag.pop());
    }
    return tiles;
}

/**
 * Create the board with drop zones
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
        
        // Make squares droppable
        squareDiv.droppable({
            accept: '.letter-tile',
            tolerance: 'intersect',
            classes: {
                "ui-droppable-hover": "drop-hover"
            },
            drop: function(event, ui) {
                handleTileDrop($(this), ui.draggable);
            }
        });
        
        overlay.append(squareDiv);
    });
}

/**
 * Create a letter tile element with image
 */
function createTileElement(tile) {
    const tileDiv = $('<div>')
        .addClass('letter-tile')
        .attr('data-letter', tile.letter)
        .attr('data-value', tile.value);
    
    // Create image element
    const tileImage = $('<img>')
        .attr('src', `images/tiles/Scrabble_Tile_${tile.letter === '_' ? 'Blank' : tile.letter}.jpg`)
        .attr('alt', `Letter ${tile.letter}`)
        .on('error', function() {
            // Fallback if image not found - create a simple styled tile
            $(this).parent().html(`
                <div class="tile-fallback">
                    <div class="letter">${tile.letter === '_' ? '' : tile.letter}</div>
                    <div class="value">${tile.value}</div>
                </div>
            `);
        });
    
    tileDiv.append(tileImage);
    
    // Make tile draggable
    tileDiv.draggable({
        revert: 'invalid',
        containment: '.game-container',
        zIndex: 1000,
        start: function(event, ui) {
            $(this).css('z-index', 1000);
        },
        stop: function(event, ui) {
            $(this).css('z-index', 100);
        }
    });
    
    return tileDiv;
}

/**
 * Deal initial 7 tiles to the rack
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
 * Handle when a tile is dropped on a board square
 */
function handleTileDrop(square, tile) {
    const squareIndex = parseInt(square.attr('data-index'));
    
    // Check if square is already occupied
    if (boardState[squareIndex]) {
        showMessage('That square is already occupied!', 'error');
        return;
    }
    
    // Check if placement is valid (adjacent to other tiles after first tile)
    if (placedTiles.length > 0 && !isValidPlacement(squareIndex)) {
        showMessage('Tiles must be placed adjacent to each other!', 'error');
        return;
    }
    
    // Place tile
    boardState[squareIndex] = {
        letter: tile.attr('data-letter'),
        value: parseInt(tile.attr('data-value'))
    };
    
    placedTiles.push({
        index: squareIndex,
        tile: tile,
        originalParent: tile.parent()
    });
    
    // Position tile on square
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
    tile.draggable('disable');
    
    // Update display
    updateWordDisplay();
    calculateScore();
}

/**
 * Check if tile placement is valid (must be adjacent to existing tiles)
 */
function isValidPlacement(index) {
    return placedTiles.some(placed => {
        return Math.abs(placed.index - index) === 1;
    });
}

/**
 * Update the current word display
 */
function updateWordDisplay() {
    if (placedTiles.length === 0) {
        $('#current-word').text('---');
        return;
    }
    
    // Sort placed tiles by position
    const sortedTiles = [...placedTiles].sort((a, b) => a.index - b.index);
    
    // Check for gaps
    for (let i = 1; i < sortedTiles.length; i++) {
        if (sortedTiles[i].index - sortedTiles[i-1].index !== 1) {
            $('#current-word').text('Invalid - Gap in word!');
            return;
        }
    }
    
    // Build word
    const word = sortedTiles.map(t => boardState[t.index].letter).join('');
    $('#current-word').text(word);
}

/**
 * Calculate the current word score including bonuses
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
        
        // Apply bonus based on square type
        switch(bonus) {
            case 'double-letter':
                tileScore *= 2;
                break;
            case 'triple-letter':
                tileScore *= 3;
                break;
            case 'double-word':
                wordMultiplier *= 2;
                break;
            case 'triple-word':
                wordMultiplier *= 3;
                break;
        }
        
        wordScore += tileScore;
    });
    
    currentScore = wordScore * wordMultiplier;
    $('#word-score').text(currentScore);
}

/**
 * Submit the current word
 */
function submitWord() {
    if (placedTiles.length === 0) {
        showMessage('No word to submit!', 'error');
        return;
    }
    
    // Check for valid word formation (no gaps)
    const sortedTiles = [...placedTiles].sort((a, b) => a.index - b.index);
    for (let i = 1; i < sortedTiles.length; i++) {
        if (sortedTiles[i].index - sortedTiles[i-1].index !== 1) {
            showMessage('Invalid word - tiles must be adjacent!', 'error');
            return;
        }
    }
    
    // Add to total score
    totalScore += currentScore;
    $('#total-score').text(totalScore);
    
    // Show success message
    const word = sortedTiles.map(t => boardState[t.index].letter).join('');
    showMessage(`Word "${word}" submitted for ${currentScore} points!`, 'success');
    
    // Clear board
    clearBoard();
    
    // Deal new tiles
    const tilesNeeded = 7 - $('#tile-rack .letter-tile').length;
    const newTiles = drawTiles(tilesNeeded);
    const rack = $('#tile-rack');
    
    newTiles.forEach(tile => {
        rack.append(createTileElement(tile));
    });
    
    // Reset current score
    currentScore = 0;
    $('#word-score').text(0);
    $('#current-word').text('---');
}

/**
 * Clear all tiles from the board
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
 * Recall all placed tiles back to rack
 */
function recallTiles() {
    const rack = $('#tile-rack');
    
    placedTiles.forEach(placed => {
        // Re-enable dragging
        placed.tile.removeClass('placed');
        placed.tile.draggable('enable');
        
        // Reset position and move back to rack
        placed.tile.css({
            position: 'relative',
            left: 0,
            top: 0,
            zIndex: 100
        });
        
        rack.append(placed.tile);
        
        // Clear board square
        const square = $('.board-square[data-index="' + placed.index + '"]');
        square.removeClass('occupied');
    });
    
    // Reset game state
    placedTiles = [];
    boardState = new Array(boardConfig.length).fill(null);
    currentScore = 0;
    
    updateWordDisplay();
    calculateScore();
    showMessage('Tiles recalled to rack', 'success');
}

/**
 * Deal new set of 7 tiles
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
 * Reset the entire game
 */
function resetGame() {
    initializeTileBag();
    clearBoard();
    dealInitialTiles();
    totalScore = 0;
    currentScore = 0;
    $('#total-score').text(0);
    $('#word-score').text(0);
    $('#current-word').text('---');
    showMessage('Game reset!', 'success');
}

/**
 * Display a temporary message to the user
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
 * Initialize the game when document is ready
 */
$(document).ready(function() {
    // Initialize game
    initializeTileBag();
    createBoard();
    dealInitialTiles();
    
    // Button event handlers
    $('#submit-word').click(submitWord);
    $('#recall-tiles').click(recallTiles);
    $('#new-tiles').click(getNewTiles);
    $('#reset-game').click(resetGame);
    
    // Make rack droppable for returning tiles
    $('#tile-rack').droppable({
        accept: '.letter-tile',
        drop: function(event, ui) {
            // Only handle if tile was on board
            const tile = ui.draggable;
            const placedIndex = placedTiles.findIndex(p => p.tile[0] === tile[0]);
            
            if (placedIndex !== -1) {
                const placed = placedTiles[placedIndex];
                const square = $('.board-square[data-index="' + placed.index + '"]');
                square.removeClass('occupied');
                
                boardState[placed.index] = null;
                placedTiles.splice(placedIndex, 1);
                
                tile.removeClass('placed');
                tile.draggable('enable');
                
                // Reset position
                tile.css({
                    position: 'relative',
                    left: 0,
                    top: 0,
                    zIndex: 100
                });
                
                $(this).append(tile);
                
                updateWordDisplay();
                calculateScore();
            }
        }
    });
});