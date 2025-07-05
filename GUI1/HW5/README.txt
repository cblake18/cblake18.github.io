Name: Christian Blake
Email: christian_blake@student.uml.edu

To use dictionary locally (not on Github.io), need to run local server using python/NodeJS:

- For python, in terminal/cmd (current directory needs to be HW5) run: python3 -m http.server 8000

- Then go to http://localhost:8000/ to run application
-----------------------------------------------------

Github Application URL: https://cblake18.github.io/GUI1/HW5/index.html

Github Repo: https://github.com/cblake18/cblake18.github.io/tree/main/GUI1/HW5
-----------------------------------------------------

*** Writeup Section ***

BASE GAME: Currently, the base game features are fully implemented and functioning. Users can manually drag tiles to specific places on the board (for the first tile, letter can be placed on any spot and dragged to any other spot. For any additional tiles, they must be dragged to an adjacent spot to one of the placed tiles. Word scores are calculated real time and show above the game board. Letter distribution data is loaded directly from the provided JSON file (which was slightly edited to add blank tile data). Letter tiles can be dragged back to the rack to remove them from the word (can also use the "Recall Tiles" button). The blank tile prompts for picking a letter whenever it is placed on the board, which then shows in the "Current Word". Fallbacks are also implemented in case the board and tile images fail to load.

EXTRA CREDIT: Additionally, dictionary checking is fully implemented and should work as long as the game is ran on a local server (see above for details) or using the Github Pages URL. 

BUGS: One known visual bug (should not affect gameplay) is that if a tile is dragged from a game board square connected to other letter(s) to a nonadjacent square, there is a small amount of drift away from intended visual location for its original game board location when the tile is forced back to its original location.