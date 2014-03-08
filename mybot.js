function new_game() {
}

// function make_move() {
//    var board = get_board();

//    // we found an item! take it!
//    if (board[get_my_x()][get_my_y()] > 0) {
//        return TAKE;
//    }

//    var rand = Math.random() * 4;

//    if (rand < 1) return NORTH;
//    if (rand < 2) return SOUTH;
//    if (rand < 3) return EAST;
//    if (rand < 4) return WEST;

//    return PASS;
// }

// Optionally include this function if you'd like to always reset to a 
// certain board number/layout. This is useful for repeatedly testing your
// bot(s) against known positions.
//
//function default_board_number() {
//    return 123;
//}

function make_move() {
   board = get_board();
   previousMoves = previousMoves || [];

   // we found an item! take it!
   if (board[get_my_x()][get_my_y()] > 0) {
       return TAKE;
   }

   numFruits = get_number_of_item_types();
   fruitCount = countFruits();

   //scarcity will determine fruit priority
   scarcity = determineFruitScarcity(fruitCount);

   determineMoveValues(board);

   //moves = get_valid_moves();
   //moves = 

   return PASS;
}

function countFruits() {
   var fruitCount = [];

   for (var type = 1; type <= numFruits; type++) {
      fruitCount.push([type, get_total_item_count(type)]);
   }
   return fruitCount;
}

function determineFruitScarcity(fruitCountArr) {
   var scarcity = fruitCountArr.slice();

   scarcity.sort(function (a,b) {
      if (a[1] < b[1]) {
         return -1;
      } else if (b[1] < a[1]) {
         return 1;
      } else {
         return 0;
      }
   });

   //dup fruit count, and map over it to show only types (first element)
   for (var i = 0; i < scarcity.length; i++) {
      scarcity[i] = scarcity[i][0];
   }
   return scarcity;
}

function determineMoveValues(board) {
   reviewedBoard = buildSubstituteBoard();

   //for each tile
   
   //determine fruit values
   determineFruitValues();

   //determine distance values

   //determine relative values
}

function determineFruitValues(options) {
   fruitCoords = [];
   var fruitValue = options.fruitValue || 20;
   var fruitMultiplier = options.fruitMultiplier || 3;

   forEachTile(board, function(tileValue, coords) {
      if (tileValue > 0) {
         var rowIdx = coords[0];
         var colIdx = coords[1];
         var fruitScarcity = scarcity.indexOf(tileValue);
         reviewedBoard[rowIdx][colIdx] = fruitValue + (multiplier * (fruitScarcity + 1));
         fruitCoords.push([rowIdx, colIdx]);
      }
   });

}

function determineDistanceValues(options) {
   forEachTile(reviewedBoard, function(tileValue, coords) {
      if (tileValue == undefined) {
         var rowIdx = coords[0];
         var colIdx = coords[1];
         reviewedBoard[rowIdx][colIdx] = 0;
         // reviewedBoard[row][col] += distanceBetween([row, col], []);
      }
   });

}

function averageValuesFromNeighbors(coords, givenBoard) {
   //averages neighboring tiles from 'board'. Calculates using current
   // coords if value > 0
   var rowIdx = coords[0];
   var colIdx = coords[1];
   var givenBoard = givenBoard || reviewedBoard;
   var coordsToConsider = getAdjacentCoords(coords);
   var currentVal = givenBoard[rowIdx][colIdx];
   if ( currentVal > 0 ) {
      coordsToConsider.push(coords);
   }

   var valSum = 0;
   coordsToConsider.forEach(function(coords) {
      valSum += givenBoard[rowIdx][colIdx];
   });
   
   var average = valSum / coordsToConsider.length;
   return average;
}

function distanceBetween(origin, dest) {
   return Math.abs(dest[0] - origin[0]) + Math.abs(dest[1] - origin[1]);
}

function forEachTile(board, callback) {
   for (var row = 0; row < HEIGHT; row++) {
      for(var col = 0; col < WIDTH;  col++) {
         callback(board[row][col], [row, col]);
      }
   }
}

function fanOutFrom(board, originCoords, callback) {
   //Start at origin, and perform callback to adjacent tiles,
   // then recursively do the same to each of their adjacent tiles

   var adjacentMoves = getAdjacentCoords(originCoords);
   if (adjacentMoves.length == 0) return;

   adjacentMoves.forEach(function (adjCoords) {
      var rowIdx = adjCoords[0];
      var colIdx = adjCoords[1];

      callback(board[rowIdx][colIdx], adjCoords);
      fanOutFrom(board, adjCoords, callback);
   });
}

function getAdjacentCoords(originCoords) {
   var originRow = originCoords[0];
   var originCol = originCoords[1];
   var adjacent = [];
   var moves = [];
   
   moves.push([originRow - 1, originCol]);
   moves.push([originRow + 1, originCol]);
   moves.push([originRow, originCol + 1]);
   moves.push([originRow, originCol - 1]);

   moves.forEach(function(moveCoords) {
      if ( isWithinBoard(moveCoords) ) {
         adjacent.push(moveCoords);
      }
   });

   return adjacent;
}

function isWithinBoard(coords) {
   var rowIdx = coords[0];
   var colIdx = coords[1];

   if ( (rowIdx >= 0) && (rowIdx < HEIGHT) ) {
      if ( (colIdx >= 0) && (colIdx < WIDTH) ) {
         return true;
      }
   }

   return false;
}

function buildSubstituteBoard(options) {
   defaultValue = options.defaultValue || 0;
   var substitute = [];

   for (var row = 0; row < HEIGHT; row++) {
      var newRow = [];

      for (var col = 0; col < WIDTH; col++) {
         newRow.push(defaultValue);
      }

      substitute.push(newRow);
   }

   return substitute;
}